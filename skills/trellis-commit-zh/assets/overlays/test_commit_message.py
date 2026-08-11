#!/usr/bin/env python3
"""Focused regression checks for the generated commit-message validator."""

from __future__ import annotations

import sys
import unittest
from pathlib import Path

HERE = Path(__file__).resolve()
if (HERE.parents[1] / "common").is_dir():
    sys.path.insert(0, str(HERE.parents[1]))
    from common.commit_message import validate_commit_message
else:
    sys.path.insert(0, str(HERE.parent))
    from commit_message import validate_commit_message


class CommitMessageTests(unittest.TestCase):
    def test_policy_examples(self) -> None:
        valid = (
            "feat(sync): 增加需求同步",
            "chore(trellis): 记录会话日志",
            "chore(task): 归档任务 08-10-example",
            "fix(parser): 修复文档解析\n\n- 保留原始字段映射\n- 补充异常输入校验",
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
            with self.subTest(message=message):
                validate_commit_message(message)
        for message in invalid:
            with self.subTest(message=message):
                with self.assertRaises(ValueError):
                    validate_commit_message(message)


if __name__ == "__main__":
    unittest.main()
