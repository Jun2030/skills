#!/usr/bin/env python3
"""安装、升级、审计或卸载 Trellis 中文提交规范增强。"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import shutil
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


POLICY_VERSION = "1.0.0"
STATE_SCHEMA = 1
ROOT = Path(__file__).resolve().parent.parent
OVERLAYS = ROOT / "assets" / "overlays"
STATE_DIR = ".trellis/.trellis-commit-zh"
STATE_FILE = f"{STATE_DIR}/state.json"
BASELINE_DIR = f"{STATE_DIR}/baseline"

NEW_FILES = {
    ".trellis/scripts/common/commit_message.py": OVERLAYS / "commit_message.py",
    ".trellis/scripts/validate_commit_message.py": OVERLAYS / "validate_commit_message.py",
    ".trellis/scripts/tests/test_commit_message.py": OVERLAYS / "test_commit_message.py",
    ".trellis/spec/guides/commit-message.md": ROOT / "references" / "commit-message.md",
}

WORKFLOW_OLD = """4. **Draft a commit plan**. Group AI-edited files into logical commits (1 commit per coherent change unit, not 1 commit per file). Each entry: `<commit message>` + file list. List unrecognized files separately at the bottom.

5. **Present the plan once, ask for one-shot confirmation**. Format:
   ```
   Proposed commits (in order):
     1. <message>
        - <file>
        - <file>
     2. <message>
        - <file>

   Unrecognized dirty files (NOT in any commit — confirm include/exclude):
     - <file>
     - <file>

   Reply 'ok' / '行' to execute. Reply with edits, or '我自己来' / 'manual' to abort.
   ```

6. **On confirmation**: run `git add <files>` + `git commit -m "<msg>"` for each batch in order. Do not amend. Do not push.

7. **On rejection** (user replies "不行" / "我自己来" / "manual" / any pushback on the plan): stop. Do not attempt a second plan. The user will commit by hand; you skip ahead to 3.5 once they confirm.
"""

WORKFLOW_NEW = """4. **Review the actual diff** and choose one Conventional Commits type and one required English scope that describe the task's primary change. Keep unrecognized files out of the commit.

5. **Resolve unrecognized files first**. If any exist, ask whether to include or exclude them before generating a message. Do not generate candidate messages in that prompt.

6. **Generate exactly one complete commit message** from the recognized diff. Output only the message text: one `<type>(<scope>): <中文描述>` header; for a complex diff, add one blank line and Chinese `- ` body items. Do not add explanations, code fences, labels, placeholders, candidate lists, or a second Conventional Commits header. Wait for one-shot confirmation.

7. **On confirmation**: stage only the confirmed files and commit with the exact validated message. Do not amend or push. On rejection or manual mode, stop and skip to 3.5 after the user confirms their manual commit is complete.
"""

EDITS = (
    (
        ".trellis/workflow.md",
        "The AI drives a batched commit of this task's code changes so `/finish-work` can run cleanly afterwards. Goal: produce work commits FIRST, then bookkeeping (archive + journal) commits land after — never interleaved.",
        "The AI drives one policy-compliant commit for this task's code changes so `/finish-work` can run cleanly afterwards. The work commit lands first; bookkeeping commits for archive and journal follow without interleaving.",
    ),
    (
        ".trellis/config.yaml",
        'session_commit_message: "chore: record journal"',
        'session_commit_message: "chore(trellis): 记录会话日志"',
    ),
    (
        ".trellis/spec/guides/index.md",
        (
            "- [Testing](../testing/index.md): trusted test style and verification commands.",
            "| [Cross-Layer Thinking Guide](./cross-layer-thinking-guide.md) | Think through data flow across layers | Features spanning multiple layers |",
        ),
        (
            "- [Testing](../testing/index.md): trusted test style and verification commands.\n"
            "- [Commit message policy](commit-message.md): required output and validation rules for Trellis commits.",
            "| [Cross-Layer Thinking Guide](./cross-layer-thinking-guide.md) | Think through data flow across layers | Features spanning multiple layers |\n"
            "| [Commit Message Policy](./commit-message.md) | Enforce Trellis commit output and validation | Before generating or committing changes |",
        ),
    ),
    (
        ".trellis/scripts/add_session.py",
        "from common.types import TaskInfo\nfrom common.config import (",
        "from common.types import TaskInfo\nfrom common.commit_message import validate_commit_message\nfrom common.config import (",
    ),
    (
        ".trellis/scripts/add_session.py",
        "    commit_msg = get_session_commit_message(repo_root)\n    # Resolve the current task",
        "    commit_msg = get_session_commit_message(repo_root)\n"
        "    validate_commit_message(commit_msg)\n"
        "    # Resolve the current task",
    ),
    (
        ".trellis/scripts/common/task_store.py",
        "from .git import branch_exists_locally, resolve_default_branch, run_git",
        "from .commit_message import validate_commit_message\n"
        "from .git import branch_exists_locally, resolve_default_branch, run_git",
    ),
    (
        ".trellis/scripts/common/task_store.py",
        '    commit_msg = f"chore(task): archive {task_name}"\n'
        '    rc, _, err = run_git(["commit", "-m", commit_msg], cwd=repo_root)',
        '    commit_msg = f"chore(task): 归档任务 {task_name}"\n'
        "    validate_commit_message(commit_msg)\n"
        '    rc, _, err = run_git(["commit", "-m", commit_msg], cwd=repo_root)',
    ),
    (
        ".trellis/workflow.md",
        "2. **Learn commit style** from recent history (so drafted messages blend in):\n"
        "   ```bash\n"
        "   git log --oneline -5\n"
        "   ```\n"
        "   Note the prefix convention (`feat:` / `fix:` / `chore:` / `docs:` ...), language (中文/English), and length style.",
        "2. **Load the required policy** from `.trellis/spec/guides/commit-message.md`. Recent history does not override this policy.",
    ),
    (".trellis/workflow.md", WORKFLOW_OLD, WORKFLOW_NEW),
    (
        ".trellis/workflow.md",
        "- The batched plan is one prompt; do not prompt per commit.",
        "- Validate the final message with `.trellis/scripts/validate_commit_message.py` before committing.\n"
        "- Generate one message for the task; do not create separate headers for files or change items.",
    ),
)


class PolicyError(RuntimeError):
    pass


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def _sha_bytes(content: bytes) -> str:
    return hashlib.sha256(content).hexdigest()


def _sha_text(content: str) -> str:
    return _sha_bytes(content.encode("utf-8"))


def _atomic_write(path: Path, content: bytes) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    temp = path.with_name(f".{path.name}.tmp")
    temp.write_bytes(content)
    os.replace(temp, path)


def _write_json(path: Path, value: dict[str, Any]) -> None:
    content = json.dumps(value, ensure_ascii=False, indent=2, sort_keys=True) + "\n"
    _atomic_write(path, content.encode("utf-8"))


def _trellis_command() -> str:
    command = shutil.which("trellis.cmd" if os.name == "nt" else "trellis")
    if not command:
        raise PolicyError("未找到 Trellis 命令，请先安装 Trellis")
    return command


def ensure_trellis() -> str:
    try:
        result = subprocess.run(
            [_trellis_command(), "--version"], capture_output=True, text=True, check=True
        )
    except (OSError, subprocess.CalledProcessError) as exc:
        raise PolicyError(f"Trellis 命令不可执行，请先修复 Trellis：{exc}") from exc
    return (result.stdout or result.stderr).strip()


def _require_repo(repo: Path, check_trellis: bool = True) -> Path:
    if check_trellis:
        ensure_trellis()
    repo = repo.resolve()
    if not repo.is_dir() or not (repo / ".trellis").is_dir():
        raise PolicyError(f"当前仓库没有完整的 .trellis，请先初始化或修复 Trellis：{repo}")
    return repo


def _variants(value: str | tuple[str, ...]) -> tuple[str, ...]:
    return (value,) if isinstance(value, str) else value


def _apply_edit(
    content: str,
    old: str | tuple[str, ...],
    new: str | tuple[str, ...],
    relative: str,
) -> str:
    old_variants = _variants(old)
    new_variants = _variants(new)
    if len(old_variants) != len(new_variants):
        raise PolicyError(f"策略变体配置无效：{relative}")
    if any(value in content for value in new_variants):
        return content
    matches = [
        (before, after)
        for before, after in zip(old_variants, new_variants)
        if content.count(before) == 1
    ]
    if len(matches) != 1:
        raise PolicyError(f"Trellis 文件结构不兼容，无法定位唯一修改点：{relative}")
    before, after = matches[0]
    return content.replace(before, after, 1)


def _unmanaged_traces(repo: Path) -> list[str]:
    traces = [relative for relative in NEW_FILES if (repo / relative).exists()]
    for relative, _, new in EDITS:
        path = repo / relative
        if path.is_file() and any(value in _read(path) for value in _variants(new)):
            traces.append(relative)
    return sorted(set(traces))


def _load_state(repo: Path, missing_ok: bool = False) -> dict[str, Any] | None:
    state_dir = repo / STATE_DIR
    state_path = repo / STATE_FILE
    if not state_dir.exists():
        if missing_ok:
            traces = _unmanaged_traces(repo)
            if traces:
                raise PolicyError("检测到没有状态基线的增强痕迹：" + "、".join(traces))
            return None
        raise PolicyError("当前仓库尚未安装 trellis-commit-zh 增强")
    if not state_dir.is_dir() or not state_path.is_file():
        raise PolicyError(f"策略状态损坏或缺失：{STATE_FILE}")

    try:
        state = json.loads(_read(state_path))
    except (OSError, json.JSONDecodeError) as exc:
        raise PolicyError(f"无法读取策略状态：{exc}") from exc
    required = {"schema_version", "phase", "policy_version", "managed_hashes", "original_hashes"}
    if not isinstance(state, dict) or not required.issubset(state):
        raise PolicyError("策略状态字段不完整，不能安全操作")
    if state["schema_version"] != STATE_SCHEMA or state["phase"] != "installed":
        raise PolicyError("策略状态未完成或版本不受支持，不能自动修复")
    managed = state["managed_hashes"]
    originals = state["original_hashes"]
    allowed_paths = {relative for relative, _, _ in EDITS} | set(NEW_FILES)
    if (
        not isinstance(managed, dict)
        or not managed
        or not isinstance(originals, dict)
        or set(managed) != set(originals)
        or not set(managed).issubset(allowed_paths)
    ):
        raise PolicyError("策略状态中的受管文件清单无效")
    hash_pattern = re.compile(r"[0-9a-f]{64}")
    if any(not isinstance(value, str) or not hash_pattern.fullmatch(value) for value in managed.values()):
        raise PolicyError("策略状态中的受管文件哈希无效")
    if any(
        value is not None and (not isinstance(value, str) or not hash_pattern.fullmatch(value))
        for value in originals.values()
    ):
        raise PolicyError("策略状态中的原始文件哈希无效")
    for relative, original_hash in originals.items():
        if original_hash is not None:
            baseline = repo / BASELINE_DIR / relative
            if not baseline.is_file() or _sha_bytes(baseline.read_bytes()) != original_hash:
                raise PolicyError(f"原始基线缺失或损坏：{relative}")
    return state


def _conflicts(repo: Path, state: dict[str, Any]) -> list[str]:
    conflicts = []
    for relative, wanted_hash in state["managed_hashes"].items():
        path = repo / relative
        if not path.is_file() or _sha_bytes(path.read_bytes()) != wanted_hash:
            conflicts.append(relative)
    return conflicts


def _require_clean_state(repo: Path, state: dict[str, Any]) -> None:
    conflicts = _conflicts(repo, state)
    if conflicts:
        raise PolicyError("受管文件已被人工修改或删除，停止操作：" + "、".join(conflicts))


def build_expected(repo: Path, state: dict[str, Any] | None = None) -> dict[str, str]:
    expected: dict[str, str] = {}
    for relative, old, new in EDITS:
        path = repo / relative
        if not path.is_file():
            raise PolicyError(f"Trellis 受管文件缺失：{relative}")
        content = expected.get(relative, _read(path))
        expected[relative] = _apply_edit(content, old, new, relative)

    for relative, source in NEW_FILES.items():
        wanted = _read(source)
        path = repo / relative
        if path.exists() and _read(path) != wanted:
            owned_hash = state["managed_hashes"].get(relative) if state else None
            if owned_hash != _sha_bytes(path.read_bytes()):
                raise PolicyError(f"目标文件已有非策略内容：{relative}")
        expected[relative] = wanted

    for relative, content in expected.items():
        if relative.endswith(".py"):
            compile(content, relative, "exec")
    return expected


def _changes(repo: Path, expected: dict[str, str]) -> list[str]:
    return [
        relative
        for relative, content in expected.items()
        if not (repo / relative).is_file() or _read(repo / relative) != content
    ]


def _capture(repo: Path, paths: set[str]) -> dict[str, bytes | None]:
    return {
        relative: (repo / relative).read_bytes() if (repo / relative).is_file() else None
        for relative in paths
    }


def _restore_capture(repo: Path, captured: dict[str, bytes | None]) -> None:
    for relative, content in captured.items():
        path = repo / relative
        if content is None:
            if path.exists():
                path.unlink()
        else:
            _atomic_write(path, content)


def _run_generated_test(repo: Path) -> None:
    test = repo / ".trellis/scripts/tests/test_commit_message.py"
    result = subprocess.run([sys.executable, str(test)], capture_output=True, text=True)
    if result.returncode:
        details = (result.stderr or result.stdout).strip()
        raise PolicyError(f"提交消息校验测试失败：{details}")


def status(repo: Path, as_json: bool = False, check_trellis: bool = True) -> int:
    repo = _require_repo(repo, check_trellis)
    state = _load_state(repo, missing_ok=True)
    if state is None:
        build_expected(repo)
        info = {
            "status": "not-installed",
            "policy_version": POLICY_VERSION,
            "actions": ["install"],
        }
    else:
        _require_clean_state(repo, state)
        current = state["policy_version"] == POLICY_VERSION
        info = {
            "status": "current" if current else "outdated",
            "policy_version": POLICY_VERSION,
            "installed_policy_version": state["policy_version"],
            "actions": ["check-upgrade", "audit", "uninstall"]
            if current
            else ["upgrade", "uninstall"],
        }
    if as_json:
        print(json.dumps(info, ensure_ascii=False, sort_keys=True))
    else:
        labels = {
            "not-installed": "未安装增强",
            "outdated": "增强可升级",
            "current": "增强已是当前版本",
        }
        print(f"[状态] {labels[info['status']]}；可执行：{'、'.join(info['actions'])}")
    return 0


def install(repo: Path, check_trellis: bool = True) -> int:
    repo = _require_repo(repo, check_trellis)
    state = _load_state(repo, missing_ok=True)
    if state is not None:
        _require_clean_state(repo, state)
        if state["policy_version"] != POLICY_VERSION:
            raise PolicyError("仓库已安装旧版增强，请选择升级")
        print(f"[完成] 已安装策略 {POLICY_VERSION}，无需重复写入")
        return audit(repo, check_trellis=False)

    expected = build_expected(repo)
    paths = set(expected)
    captured = _capture(repo, paths)
    state_dir = repo / STATE_DIR
    state_dir.mkdir(parents=True)
    original_hashes: dict[str, str | None] = {}
    try:
        for relative, content in captured.items():
            original_hashes[relative] = _sha_bytes(content) if content is not None else None
            if content is not None:
                _atomic_write(repo / BASELINE_DIR / relative, content)
        installing = {
            "schema_version": STATE_SCHEMA,
            "phase": "installing",
            "policy_version": POLICY_VERSION,
            "installed_at": datetime.now(timezone.utc).isoformat(),
            "managed_hashes": {},
            "original_hashes": original_hashes,
        }
        _write_json(repo / STATE_FILE, installing)
        for relative, content in expected.items():
            _atomic_write(repo / relative, content.encode("utf-8"))
        installing["phase"] = "installed"
        installing["managed_hashes"] = {
            relative: _sha_text(content) for relative, content in sorted(expected.items())
        }
        _write_json(repo / STATE_FILE, installing)
        audit(repo, check_trellis=False)
    except Exception:
        _restore_capture(repo, captured)
        shutil.rmtree(state_dir, ignore_errors=True)
        raise

    print(f"[完成] 已安装 Trellis 中文提交规范增强，策略版本 {POLICY_VERSION}")
    return 0


def audit(repo: Path, check_trellis: bool = True) -> int:
    repo = _require_repo(repo, check_trellis)
    state = _load_state(repo)
    assert state is not None
    _require_clean_state(repo, state)
    if state["policy_version"] != POLICY_VERSION:
        raise PolicyError(
            f"策略版本需要升级：已安装 {state['policy_version']}，当前 {POLICY_VERSION}"
        )
    expected = build_expected(repo, state)
    changed = _changes(repo, expected)
    if changed:
        raise PolicyError("策略内容不完整：" + "、".join(changed))
    _run_generated_test(repo)
    print(f"[通过] 策略 {POLICY_VERSION}、受管文件和提交消息测试均正常")
    return 0


def upgrade(repo: Path, check_trellis: bool = True) -> int:
    repo = _require_repo(repo, check_trellis)
    state = _load_state(repo)
    assert state is not None
    _require_clean_state(repo, state)
    expected = build_expected(repo, state)
    # ponytail: 固定受管路径可保证首次基线可恢复；扩大范围时添加显式迁移。
    if set(expected) != set(state["managed_hashes"]):
        raise PolicyError("新版本改变了受管文件范围，需要显式迁移，不能自动升级")
    changed = _changes(repo, expected)
    if state["policy_version"] == POLICY_VERSION and not changed:
        audit(repo, check_trellis=False)
        print(f"[完成] 仓库策略已经是最新版本 {POLICY_VERSION}")
        return 0

    captured = _capture(repo, set(expected))
    old_state = (repo / STATE_FILE).read_bytes()
    try:
        for relative in changed:
            _atomic_write(repo / relative, expected[relative].encode("utf-8"))
        state["policy_version"] = POLICY_VERSION
        state["updated_at"] = datetime.now(timezone.utc).isoformat()
        state["managed_hashes"] = {
            relative: _sha_text(content) for relative, content in sorted(expected.items())
        }
        _write_json(repo / STATE_FILE, state)
        audit(repo, check_trellis=False)
    except Exception:
        _restore_capture(repo, captured)
        _atomic_write(repo / STATE_FILE, old_state)
        raise

    print(f"[完成] 已升级仓库策略至 {POLICY_VERSION}，原始基线保持不变")
    return 0


def uninstall(repo: Path, check_trellis: bool = True) -> int:
    repo = _require_repo(repo, check_trellis)
    state = _load_state(repo)
    assert state is not None
    _require_clean_state(repo, state)
    managed = set(state["managed_hashes"])
    captured = _capture(repo, managed)

    for relative, original_hash in state["original_hashes"].items():
        if original_hash is not None:
            baseline = repo / BASELINE_DIR / relative
            if not baseline.is_file() or _sha_bytes(baseline.read_bytes()) != original_hash:
                raise PolicyError(f"原始基线缺失或损坏：{relative}")

    try:
        for relative, original_hash in state["original_hashes"].items():
            path = repo / relative
            if original_hash is None:
                if path.exists():
                    path.unlink()
            else:
                _atomic_write(path, (repo / BASELINE_DIR / relative).read_bytes())
        for relative, original_hash in state["original_hashes"].items():
            path = repo / relative
            if original_hash is None:
                if path.exists():
                    raise PolicyError(f"增强创建的文件未删除：{relative}")
            elif _sha_bytes(path.read_bytes()) != original_hash:
                raise PolicyError(f"原始文件恢复校验失败：{relative}")
    except Exception:
        _restore_capture(repo, captured)
        raise

    shutil.rmtree(repo / STATE_DIR)
    print("[完成] 已卸载 Trellis 中文提交规范增强，并恢复首次安装前状态")
    return 0


def parser() -> argparse.ArgumentParser:
    result = argparse.ArgumentParser(description=__doc__)
    commands = result.add_subparsers(dest="command", required=True)
    commands.add_parser("version")
    status_parser = commands.add_parser("status")
    status_parser.add_argument("--repo", type=Path, default=Path.cwd())
    status_parser.add_argument("--json", action="store_true")
    for name in ("install", "upgrade", "audit", "uninstall"):
        command = commands.add_parser(name)
        command.add_argument("--repo", type=Path, default=Path.cwd())
    return result


def main(argv: list[str] | None = None) -> int:
    args = parser().parse_args(argv)
    try:
        if args.command == "version":
            print(f"trellis-commit-zh 策略 {POLICY_VERSION}；不限制 Trellis 版本")
            return 0
        if args.command == "status":
            return status(args.repo, args.json)
        if args.command == "install":
            return install(args.repo)
        if args.command == "upgrade":
            return upgrade(args.repo)
        if args.command == "audit":
            return audit(args.repo)
        if args.command == "uninstall":
            return uninstall(args.repo)
        raise PolicyError(f"不支持的操作：{args.command}")
    except PolicyError as exc:
        print(f"[错误] {exc}", file=sys.stderr)
        return 1
    except OSError as exc:
        print(f"[错误] 文件操作失败：{exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
