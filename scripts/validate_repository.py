#!/usr/bin/env python3
"""Validate the repository's flat, independently installable skill layout."""

from __future__ import annotations

import re
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SKILLS = ROOT / "skills"
NAME_RE = re.compile(r"[a-z0-9]+(?:-[a-z0-9]+)*")
NAME_LINE_RE = re.compile(r"name:\s*['\"]?([a-z0-9-]+)['\"]?\s*")
TEXT_SUFFIXES = {".md", ".py", ".ps1", ".sh", ".yaml", ".yml", ".json"}
FORBIDDEN_NAMES = {".history", "__pycache__"}


def fail(message: str) -> None:
    raise ValueError(message)


def frontmatter_name(path: Path) -> str:
    lines = path.read_text(encoding="utf-8").splitlines()
    if not lines or lines[0] != "---":
        fail(f"missing YAML frontmatter: {path.relative_to(ROOT)}")
    try:
        end = lines.index("---", 1)
    except ValueError:
        fail(f"unterminated YAML frontmatter: {path.relative_to(ROOT)}")
    names = [match.group(1) for line in lines[1:end] if (match := NAME_LINE_RE.fullmatch(line))]
    if len(names) != 1:
        fail(f"frontmatter must contain exactly one scalar name: {path.relative_to(ROOT)}")
    return names[0]


def validate() -> int:
    if not SKILLS.is_dir():
        fail("missing skills directory")

    directories = sorted(path for path in SKILLS.iterdir() if path.is_dir())
    if not directories:
        fail("repository contains no skills")

    names: set[str] = set()
    for directory in directories:
        skill_file = directory / "SKILL.md"
        if not skill_file.is_file():
            fail(f"missing SKILL.md: {directory.relative_to(ROOT)}")
        name = frontmatter_name(skill_file)
        if not NAME_RE.fullmatch(name) or name != directory.name:
            fail(f"skill name must match its kebab-case directory: {directory.relative_to(ROOT)}")
        if name in names:
            fail(f"duplicate skill name: {name}")
        names.add(name)

    expected = {directory / "SKILL.md" for directory in directories}
    unexpected = set(SKILLS.rglob("SKILL.md")) - expected
    if unexpected:
        fail(f"nested or stray SKILL.md: {min(unexpected).relative_to(ROOT)}")

    sibling_pattern = re.compile(
        r"(?:\.\.[\\/])+(?:[^\\/\s]+[\\/])*(?:"
        + "|".join(re.escape(name) for name in sorted(names))
        + r")(?=$|[\\/\s'\"`)])"
    )
    for directory in directories:
        for path in directory.rglob("*"):
            if path.is_symlink():
                fail(f"skill must not contain symlinks: {path.relative_to(ROOT)}")
            if path.name in FORBIDDEN_NAMES or path.suffix == ".pyc":
                fail(f"generated file is not publishable: {path.relative_to(ROOT)}")
            if path.is_file() and path.suffix.lower() in TEXT_SUFFIXES:
                content = path.read_text(encoding="utf-8")
                if sibling_pattern.search(content):
                    fail(f"skill contains a sibling-relative path: {path.relative_to(ROOT)}")

    print(f"[OK] validated {len(names)} skill(s): {', '.join(sorted(names))}")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(validate())
    except ValueError as exc:
        print(f"[ERROR] {exc}", file=sys.stderr)
        raise SystemExit(1)
