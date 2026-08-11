#!/usr/bin/env python3
"""Install and apply the shared Trellis commit-message policy."""

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


POLICY_VERSION = "0.1.0"
MINIMUM_TRELLIS = "0.6.13"
VERIFIED_TRELLIS = "0.6.13"
ROOT = Path(__file__).resolve().parent.parent
OVERLAYS = ROOT / "assets" / "overlays"
MANIFEST = ".trellis/commit-policy.json"

NEW_FILES = {
    ".trellis/scripts/common/commit_message.py": OVERLAYS / "commit_message.py",
    ".trellis/scripts/validate_commit_message.py": OVERLAYS / "validate_commit_message.py",
    ".trellis/scripts/tests/test_commit_message.py": OVERLAYS / "test_commit_message.py",
    ".trellis/spec/guides/commit-message.md": ROOT / "references" / "commit-message.md",
}
PREVIOUS_OWNED_HASHES = {
    ".trellis/scripts/tests/test_commit_message.py": {
        "ff3d2d2a27283565aaf3fff2ef9bd49aa17e99fd125ed6a2d49f490871618756"
    },
    ".trellis/scripts/validate_commit_message.py": {
        "211af1b533a990eed19d1f6bce11a78edae78ed3b370e6aa3d7c4e98f1ca5f3b"
    },
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


def _sha(content: str) -> str:
    return hashlib.sha256(content.encode("utf-8")).hexdigest()


def _atomic_write(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    temp = path.with_name(f".{path.name}.tmp")
    temp.write_bytes(content.encode("utf-8"))
    os.replace(temp, path)


def _trellis_command() -> str:
    command = shutil.which("trellis.cmd" if os.name == "nt" else "trellis")
    if not command:
        raise PolicyError("cannot find Trellis on PATH")
    return command


def detect_trellis_version() -> str:
    try:
        result = subprocess.run(
            [_trellis_command(), "--version"], capture_output=True, text=True, check=True
        )
    except (OSError, subprocess.CalledProcessError) as exc:
        raise PolicyError(f"cannot run 'trellis --version': {exc}") from exc
    match = re.search(r"\d+\.\d+\.\d+", result.stdout)
    if not match:
        raise PolicyError("cannot parse Trellis version")
    return match.group(0)


def _version_tuple(version: str) -> tuple[int, int, int]:
    match = re.fullmatch(r"(\d+)\.(\d+)\.(\d+)", version)
    if not match:
        raise PolicyError(f"invalid Trellis version: {version}")
    return tuple(int(part) for part in match.groups())


def _compatibility(version: str) -> str:
    if _version_tuple(version) < _version_tuple(MINIMUM_TRELLIS):
        raise PolicyError(
            f"Trellis {version} is below the minimum supported version {MINIMUM_TRELLIS}"
        )
    return "verified" if version == VERIFIED_TRELLIS else "unverified"


def _report_compatibility(version: str) -> str:
    compatibility = _compatibility(version)
    if compatibility == "unverified":
        print(
            f"[WARN] Trellis {version} is newer than verified {VERIFIED_TRELLIS}; "
            "continuing with deterministic structural checks",
            file=sys.stderr,
        )
    return compatibility


def _require_repo(repo: Path) -> Path:
    repo = repo.resolve()
    if not repo.is_dir() or not (repo / ".trellis").is_dir():
        raise PolicyError(f"not an initialized Trellis project: {repo}")
    return repo


def _apply_edit(content: str, old: str | tuple[str, ...], new: str | tuple[str, ...], relative: str) -> str:
    old_variants = (old,) if isinstance(old, str) else old
    new_variants = (new,) if isinstance(new, str) else new
    if len(old_variants) != len(new_variants):
        raise PolicyError(f"invalid policy variants for {relative}")
    if any(value in content for value in new_variants):
        return content
    matches = [
        (before, after)
        for before, after in zip(old_variants, new_variants)
        if content.count(before) == 1
    ]
    if len(matches) != 1:
        raise PolicyError(f"anchor mismatch in {relative}: expected one known variant")
    before, after = matches[0]
    return content.replace(before, after, 1)


def build_expected(repo: Path, trellis_version: str) -> dict[str, str]:
    repo = _require_repo(repo)
    compatibility = _compatibility(trellis_version)

    expected: dict[str, str] = {}
    for relative, old, new in EDITS:
        path = repo / relative
        if not path.is_file():
            raise PolicyError(f"missing managed file: {relative}")
        content = expected.get(relative, _read(path))
        expected[relative] = _apply_edit(content, old, new, relative)

    for relative, source in NEW_FILES.items():
        wanted = _read(source)
        path = repo / relative
        if path.exists():
            current = _read(path)
            known = PREVIOUS_OWNED_HASHES.get(relative, set())
            if current != wanted and _sha(current) not in known:
                raise PolicyError(f"policy-owned file has unexpected content: {relative}")
        expected[relative] = wanted

    for relative, content in expected.items():
        if relative.endswith(".py"):
            compile(content, relative, "exec")

    manifest = {
        "managed_files": {
            relative: _sha(content) for relative, content in sorted(expected.items())
        },
        "policy_version": POLICY_VERSION,
        "trellis_compatibility": compatibility,
        "trellis_version": trellis_version,
        "verified_against": VERIFIED_TRELLIS,
    }
    expected[MANIFEST] = json.dumps(
        manifest, ensure_ascii=False, indent=2, sort_keys=True
    ) + "\n"
    return expected


def _changes(repo: Path, expected: dict[str, str]) -> list[str]:
    changed = []
    for relative, content in expected.items():
        path = repo / relative
        if not path.is_file() or _read(path) != content:
            changed.append(relative)
    return changed


def audit(repo: Path, trellis_version: str | None = None) -> int:
    version = trellis_version or detect_trellis_version()
    compatibility = _report_compatibility(version)
    expected = build_expected(repo, version)
    changed = _changes(repo, expected)
    if changed:
        for relative in changed:
            print(f"[DRIFT] {relative}")
        return 2
    print(
        f"[OK] policy {POLICY_VERSION}; Trellis {version}; "
        f"compatibility {compatibility}"
    )
    return 0


def apply(repo: Path, trellis_version: str | None = None) -> int:
    repo = _require_repo(repo)
    version = trellis_version or detect_trellis_version()
    _report_compatibility(version)
    expected = build_expected(repo, version)
    changed = _changes(repo, expected)
    if not changed:
        print(f"[OK] already compliant with policy {POLICY_VERSION}")
        return 0

    stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%S%fZ")
    backup = repo / ".trellis" / f".backup-trellis-commit-policy-{stamp}"
    existing = [relative for relative in changed if (repo / relative).is_file()]
    created = [relative for relative in changed if relative not in existing]
    for relative in existing:
        target = backup / relative
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(repo / relative, target)
    _atomic_write(
        backup / "backup.json",
        json.dumps({"created": created, "existing": existing}, indent=2) + "\n",
    )

    written: list[str] = []
    try:
        for relative in changed:
            _atomic_write(repo / relative, expected[relative])
            written.append(relative)
    except Exception:
        for relative in written:
            target = repo / relative
            saved = backup / relative
            if saved.is_file():
                target.parent.mkdir(parents=True, exist_ok=True)
                shutil.copy2(saved, target)
            elif target.exists():
                target.unlink()
        raise

    print(f"[OK] applied policy {POLICY_VERSION}; backup: {backup}")
    return 0


def initialize(repo: Path, trellis_args: list[str]) -> int:
    repo = repo.resolve()
    repo.mkdir(parents=True, exist_ok=True)
    args = [arg for arg in trellis_args if arg != "--"]
    result = subprocess.run([_trellis_command(), "init", *args], cwd=repo)
    if result.returncode:
        return result.returncode
    return apply(repo)


def parser() -> argparse.ArgumentParser:
    result = argparse.ArgumentParser(description=__doc__)
    commands = result.add_subparsers(dest="command", required=True)
    commands.add_parser("version")
    for name in ("audit", "apply"):
        command = commands.add_parser(name)
        command.add_argument("--repo", type=Path, required=True)
    init = commands.add_parser("init")
    init.add_argument("--repo", type=Path, required=True)
    init.add_argument("trellis_args", nargs=argparse.REMAINDER)
    return result


def main(argv: list[str] | None = None) -> int:
    args = parser().parse_args(argv)
    try:
        if args.command == "version":
            print(
                f"trellis-commit-policy {POLICY_VERSION}; "
                f"Trellis >= {MINIMUM_TRELLIS}; verified {VERIFIED_TRELLIS}"
            )
            return 0
        if args.command == "audit":
            return audit(args.repo)
        if args.command == "apply":
            return apply(args.repo)
        if args.command == "init":
            return initialize(args.repo, args.trellis_args)
        raise PolicyError(f"unsupported command: {args.command}")
    except PolicyError as exc:
        print(f"[ERROR] {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
