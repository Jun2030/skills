#!/usr/bin/env python3
"""Deterministic syntax validation for the shared commit-message policy."""

from __future__ import annotations

import re


TYPES = "feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert"
HEADER_RE = re.compile(
    rf"^(?:{TYPES})\((?P<scope>[a-z][a-z0-9-]*)\): (?P<description>.+)$"
)
HAN_RE = re.compile(r"[\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]")


def validate_commit_message(message: str) -> None:
    """Raise ValueError when *message* violates a mechanical policy rule."""
    if not isinstance(message, str) or not message:
        raise ValueError("commit message must be a non-empty string")
    if message != message.strip():
        raise ValueError("commit message cannot have leading or trailing whitespace")

    lines = message.splitlines()
    header = HEADER_RE.fullmatch(lines[0])
    if not header:
        raise ValueError("invalid Conventional Commits header")

    description = header.group("description")
    if not HAN_RE.search(description):
        raise ValueError("header description must contain Chinese text")
    if description.endswith(("。", ".")):
        raise ValueError("header description cannot end with a period")

    if len(lines) == 1:
        return
    if lines[1] != "" or len(lines) < 3:
        raise ValueError("body must follow one blank line")

    for line in lines[2:]:
        if not line.startswith("- ") or len(line) == 2:
            raise ValueError("each body line must start with '- '")
        body = line[2:]
        if not HAN_RE.search(body):
            raise ValueError("each body line must contain Chinese text")
        if HEADER_RE.fullmatch(body):
            raise ValueError("body cannot contain another Conventional Commits header")
