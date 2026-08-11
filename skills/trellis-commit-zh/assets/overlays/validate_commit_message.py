#!/usr/bin/env python3
"""Validate one commit message from an argument or stdin."""

from __future__ import annotations

import argparse
import sys

from common.commit_message import validate_commit_message


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("message", nargs="?", help="message text; stdin when omitted")
    args = parser.parse_args()
    message = args.message if args.message is not None else sys.stdin.read().rstrip("\r\n")
    try:
        validate_commit_message(message)
    except ValueError as exc:
        print(f"[ERROR] {exc}", file=sys.stderr)
        return 1
    print("[OK] commit message is valid")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
