#!/usr/bin/env python3
"""Small end-to-end checks for the policy planner and validator."""

from __future__ import annotations

import importlib.util
import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path
from unittest import mock


ROOT = Path(__file__).resolve().parents[1]


def load(name: str, path: Path):
    spec = importlib.util.spec_from_file_location(name, path)
    module = importlib.util.module_from_spec(spec)
    assert spec and spec.loader
    sys.modules[name] = module
    spec.loader.exec_module(module)
    return module


policy = load("trellis_policy", ROOT / "scripts" / "trellis_policy.py")
validator = load("commit_message", ROOT / "assets" / "overlays" / "commit_message.py")


class ValidatorTests(unittest.TestCase):
    def test_message_matrix(self) -> None:
        valid = (
            "feat(sync): 增加需求同步",
            "chore(trellis): 记录会话日志",
            "chore(task): 归档任务 08-10-example",
            "fix(parser): 修复文档解析\n\n- 保留字段映射\n- 补充异常校验",
        )
        invalid = (
            "feat: 增加需求同步",
            "feature(sync): 增加需求同步",
            "feat(Sync): 增加需求同步",
            "feat(sync): add sync",
            "feat(sync): 增加需求同步。",
            "fix(parser): 修复解析\n- 缺少空行",
            "fix(parser): 修复解析\n\n补充校验",
            "fix(parser): 修复解析\n\n- test(parser): 补充测试",
        )
        for message in valid:
            validator.validate_commit_message(message)
        for message in invalid:
            with self.assertRaises(ValueError):
                validator.validate_commit_message(message)


class PolicyTests(unittest.TestCase):
    def make_repo(self, root: Path) -> Path:
        anchors: dict[str, list[str]] = {}
        for relative, old, _ in policy.EDITS:
            if isinstance(old, tuple):
                old = old[0]
            anchors.setdefault(relative, []).append(old)
        for relative, values in anchors.items():
            path = root / relative
            path.parent.mkdir(parents=True, exist_ok=True)
            if relative.endswith("add_session.py"):
                content = values[0] + "\n    get_session_commit_message,\n)\n\ndef example():\n" + values[1] + "\n    pass\n"
            elif relative.endswith("task_store.py"):
                content = values[0] + "\n\ndef example(task_name, run_git, repo_root):\n" + values[1] + "\n"
            else:
                content = "\n".join(values) + "\n"
            path.write_text(content, encoding="utf-8", newline="\n")
        return root

    def test_apply_is_idempotent(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            repo = self.make_repo(Path(directory))
            self.assertEqual(policy.apply(repo, policy.VERIFIED_TRELLIS), 0)
            self.assertEqual(policy.audit(repo, policy.VERIFIED_TRELLIS), 0)
            self.assertEqual(policy.apply(repo, policy.VERIFIED_TRELLIS), 0)
            manifest = json.loads((repo / policy.MANIFEST).read_text(encoding="utf-8"))
            self.assertEqual(policy.POLICY_VERSION, "0.1.0")
            self.assertEqual(manifest["policy_version"], policy.POLICY_VERSION)
            self.assertEqual(manifest["trellis_compatibility"], "verified")

    def test_newer_versions_continue_as_unverified(self) -> None:
        for version in ("0.6.14", "0.7.0", "9.9.9"):
            with self.subTest(version=version), tempfile.TemporaryDirectory() as directory:
                repo = self.make_repo(Path(directory))
                self.assertEqual(policy.apply(repo, version), 0)
                self.assertEqual(policy.audit(repo, version), 0)
                manifest = json.loads(
                    (repo / policy.MANIFEST).read_text(encoding="utf-8")
                )
                self.assertEqual(manifest["trellis_version"], version)
                self.assertEqual(manifest["trellis_compatibility"], "unverified")

    def test_older_version_and_anchor_drift_do_not_write(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            repo = self.make_repo(Path(directory))
            before = (repo / ".trellis/config.yaml").read_bytes()
            with self.assertRaises(policy.PolicyError):
                policy.apply(repo, "0.6.12")
            self.assertEqual((repo / ".trellis/config.yaml").read_bytes(), before)

            workflow = repo / ".trellis/workflow.md"
            workflow.write_text("drift\n", encoding="utf-8", newline="\n")
            with self.assertRaises(policy.PolicyError):
                policy.apply(repo, "0.6.14")
            self.assertEqual(workflow.read_text(encoding="utf-8"), "drift\n")
            self.assertFalse((repo / policy.MANIFEST).exists())

    def test_partial_write_failure_rolls_back(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            repo = self.make_repo(Path(directory))
            before = {
                relative: (repo / relative).read_bytes()
                for relative, _, _ in policy.EDITS
            }
            original = policy._atomic_write
            target_writes = 0

            def fail_second_target(path: Path, content: str) -> None:
                nonlocal target_writes
                if ".backup-trellis-commit-policy-" not in str(path):
                    target_writes += 1
                    if target_writes == 2:
                        raise OSError("simulated write failure")
                original(path, content)

            with mock.patch.object(policy, "_atomic_write", side_effect=fail_second_target):
                with self.assertRaises(OSError):
                    policy.apply(repo, policy.VERIFIED_TRELLIS)

            for relative, content in before.items():
                self.assertEqual((repo / relative).read_bytes(), content)
            for relative in policy.NEW_FILES:
                self.assertFalse((repo / relative).exists())
            self.assertFalse((repo / policy.MANIFEST).exists())

    def test_init_applies_policy_to_new_project(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            repo = Path(directory) / "future-project"
            result = policy.initialize(
                repo, ["--codex", "-y", "--no-monorepo", "-u", "policy-test"]
            )
            self.assertEqual(result, 0)
            self.assertEqual(policy.audit(repo), 0)
            generated_test = subprocess.run(
                [sys.executable, str(repo / ".trellis/scripts/tests/test_commit_message.py")],
                capture_output=True,
                text=True,
            )
            self.assertEqual(generated_test.returncode, 0, generated_test.stderr)


if __name__ == "__main__":
    unittest.main()
