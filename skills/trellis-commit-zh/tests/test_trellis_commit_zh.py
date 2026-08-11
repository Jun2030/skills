#!/usr/bin/env python3
"""Lifecycle checks for trellis-commit-zh."""

from __future__ import annotations

import importlib.util
import io
import json
import sys
import tempfile
import unittest
from contextlib import redirect_stdout
from pathlib import Path
from types import SimpleNamespace
from unittest import mock


ROOT = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location(
    "trellis_commit_zh", ROOT / "scripts" / "trellis_commit_zh.py"
)
assert SPEC and SPEC.loader
policy = importlib.util.module_from_spec(SPEC)
sys.modules[SPEC.name] = policy
SPEC.loader.exec_module(policy)


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
                content = (
                    values[0]
                    + "\n    get_session_commit_message,\n)\n\ndef example():\n"
                    + values[1]
                    + "\n    pass\n"
                )
            elif relative.endswith("task_store.py"):
                content = (
                    values[0]
                    + "\n\ndef example(task_name, run_git, repo_root):\n"
                    + values[1]
                    + "\n"
                )
            else:
                content = "\n".join(values) + "\n"
            path.write_text(content, encoding="utf-8", newline="\n")
        return root

    def existing_managed(self, repo: Path) -> dict[str, bytes]:
        paths = {relative for relative, _, _ in policy.EDITS}
        return {relative: (repo / relative).read_bytes() for relative in paths}

    def test_install_is_idempotent_and_uninstall_restores_baseline(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            repo = self.make_repo(Path(directory))
            before = self.existing_managed(repo)

            self.assertEqual(policy.install(repo, check_trellis=False), 0)
            self.assertEqual(policy.install(repo, check_trellis=False), 0)
            state = json.loads((repo / policy.STATE_FILE).read_text(encoding="utf-8"))
            self.assertEqual(state["policy_version"], "1.0.0")
            self.assertNotIn("trellis_version", state)

            out = io.StringIO()
            with redirect_stdout(out):
                self.assertEqual(policy.status(repo, True, check_trellis=False), 0)
            self.assertEqual(json.loads(out.getvalue())["status"], "current")

            self.assertEqual(policy.uninstall(repo, check_trellis=False), 0)
            for relative, content in before.items():
                self.assertEqual((repo / relative).read_bytes(), content)
            for relative in policy.NEW_FILES:
                self.assertFalse((repo / relative).exists())
            self.assertFalse((repo / policy.STATE_DIR).exists())

    def test_upgrade_preserves_original_baseline(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            repo = self.make_repo(Path(directory))
            policy.install(repo, check_trellis=False)
            state_path = repo / policy.STATE_FILE
            state = json.loads(state_path.read_text(encoding="utf-8"))
            baseline_hashes = state["original_hashes"].copy()
            state["policy_version"] = "0.9.0"
            state_path.write_text(
                json.dumps(state, ensure_ascii=False, indent=2, sort_keys=True) + "\n",
                encoding="utf-8",
                newline="\n",
            )

            self.assertEqual(policy.upgrade(repo, check_trellis=False), 0)
            upgraded = json.loads(state_path.read_text(encoding="utf-8"))
            self.assertEqual(upgraded["policy_version"], policy.POLICY_VERSION)
            self.assertEqual(upgraded["original_hashes"], baseline_hashes)

    def test_conflict_stops_uninstall(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            repo = self.make_repo(Path(directory))
            policy.install(repo, check_trellis=False)
            target = repo / ".trellis/config.yaml"
            target.write_text("人工修改\n", encoding="utf-8", newline="\n")

            with self.assertRaisesRegex(policy.PolicyError, "人工修改"):
                policy.uninstall(repo, check_trellis=False)
            self.assertEqual(target.read_text(encoding="utf-8"), "人工修改\n")
            self.assertTrue((repo / policy.STATE_FILE).is_file())

    def test_unmanaged_trace_and_missing_baseline_fail_closed(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            repo = self.make_repo(Path(directory))
            relative, source = next(iter(policy.NEW_FILES.items()))
            target = repo / relative
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_bytes(source.read_bytes())
            with self.assertRaisesRegex(policy.PolicyError, "没有状态基线"):
                policy.status(repo, check_trellis=False)

        with tempfile.TemporaryDirectory() as directory:
            repo = self.make_repo(Path(directory))
            policy.install(repo, check_trellis=False)
            baseline = repo / policy.BASELINE_DIR / ".trellis/config.yaml"
            baseline.unlink()
            with self.assertRaisesRegex(policy.PolicyError, "基线缺失"):
                policy.uninstall(repo, check_trellis=False)

    def test_partial_install_failure_rolls_back(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            repo = self.make_repo(Path(directory))
            before = self.existing_managed(repo)
            original = policy._atomic_write
            target_writes = 0

            def fail_second_target(path: Path, content: bytes) -> None:
                nonlocal target_writes
                if policy.STATE_DIR not in str(path).replace("\\", "/"):
                    target_writes += 1
                    if target_writes == 2:
                        raise OSError("simulated write failure")
                original(path, content)

            with mock.patch.object(policy, "_atomic_write", side_effect=fail_second_target):
                with self.assertRaises(OSError):
                    policy.install(repo, check_trellis=False)

            for relative, content in before.items():
                self.assertEqual((repo / relative).read_bytes(), content)
            for relative in policy.NEW_FILES:
                self.assertFalse((repo / relative).exists())
            self.assertFalse((repo / policy.STATE_DIR).exists())

    def test_final_audit_failure_rolls_back_install_and_upgrade(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            repo = self.make_repo(Path(directory))
            before = self.existing_managed(repo)
            with mock.patch.object(
                policy, "_run_generated_test", side_effect=policy.PolicyError("simulated audit failure")
            ):
                with self.assertRaisesRegex(policy.PolicyError, "audit failure"):
                    policy.install(repo, check_trellis=False)
            for relative, content in before.items():
                self.assertEqual((repo / relative).read_bytes(), content)
            self.assertFalse((repo / policy.STATE_DIR).exists())

        with tempfile.TemporaryDirectory() as directory:
            repo = self.make_repo(Path(directory))
            policy.install(repo, check_trellis=False)
            state_path = repo / policy.STATE_FILE
            state = json.loads(state_path.read_text(encoding="utf-8"))
            state["policy_version"] = "0.9.0"
            state_path.write_text(
                json.dumps(state, ensure_ascii=False, indent=2, sort_keys=True) + "\n",
                encoding="utf-8",
                newline="\n",
            )
            with mock.patch.object(
                policy, "_run_generated_test", side_effect=policy.PolicyError("simulated audit failure")
            ):
                with self.assertRaisesRegex(policy.PolicyError, "audit failure"):
                    policy.upgrade(repo, check_trellis=False)
            restored = json.loads(state_path.read_text(encoding="utf-8"))
            self.assertEqual(restored["policy_version"], "0.9.0")

    def test_state_rejects_paths_outside_policy_scope(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            repo = self.make_repo(Path(directory))
            policy.install(repo, check_trellis=False)
            state_path = repo / policy.STATE_FILE
            state = json.loads(state_path.read_text(encoding="utf-8"))
            state["managed_hashes"]["../../outside"] = "0" * 64
            state["original_hashes"]["../../outside"] = None
            state_path.write_text(
                json.dumps(state, ensure_ascii=False, indent=2, sort_keys=True) + "\n",
                encoding="utf-8",
                newline="\n",
            )
            with self.assertRaisesRegex(policy.PolicyError, "受管文件清单无效"):
                policy.uninstall(repo, check_trellis=False)

    def test_trellis_output_has_no_version_requirement(self) -> None:
        completed = SimpleNamespace(stdout="Trellis development build", stderr="")
        with mock.patch.object(policy, "_trellis_command", return_value="trellis"), mock.patch.object(
            policy.subprocess, "run", return_value=completed
        ):
            self.assertEqual(policy.ensure_trellis(), "Trellis development build")


if __name__ == "__main__":
    unittest.main()
