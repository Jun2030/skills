---
name: trellis-commit-policy
description: Acquire, audit, apply, and maintain the shared Trellis commit-message policy through an agent-led workflow. Use when a user asks to install this policy skill, enable standardized Trellis commits in an existing or new project, check policy drift, update an applied policy, troubleshoot compatibility, or generate a compliant commit message from a diff.
license: MIT
compatibility: Requires Python 3.10+ and Trellis CLI 0.6.13+; verified on Windows and Codex with Trellis 0.6.13.
---

# Trellis Commit Policy

Drive the workflow for the user. Treat bundled scripts as internal implementation details; do not ask the user to run them unless tool execution is unavailable or the user explicitly requests commands.

## Route The Request

- **Audit a project**: resolve the explicit project path or current workspace, inspect `.trellis` and Git state, run the bundled `audit`, and report compliance without writing.
- **Enable an existing Trellis project**: preserve its working tree, run `audit`, apply the policy with the bundled CLI, rerun `apply` for idempotency, then run `audit` and the generated validator test.
- **Enable a project without `.trellis`**: verify the Trellis CLI first. If present, infer the active agent platform and repository shape, obtain only missing identity choices, run bundled `init`, then audit and test. If the CLI is absent, explain the required machine-wide installation and obtain approval before installing it.
- **Update an applied project**: run bundled `apply`, then `audit` and the generated validator test.
- **Generate a commit message**: read [references/commit-message.md](references/commit-message.md), inspect the actual diff, and output exactly one complete message with no surrounding text.
- **Diagnose a failure**: preserve the target files, distinguish version warnings from structural incompatibility, and report the exact failing file or environment prerequisite.

Resolve the bundled CLI from this skill directory as `scripts/trellis_policy.py`; the user does not need a global `trellis-policy` command.

## Compatibility

Require Trellis `>=0.6.13`. Treat `0.6.13` as verified and newer versions as unverified, then continue through deterministic structural checks. Stop only for older or malformed versions, incompatible structures, or unexpected edits to policy-owned files. Keep `.trellis/.template-hashes.json` unchanged.

## Completion

After a write operation, verify all of the following before reporting completion:

1. A second application is idempotent.
2. Final audit returns compliant.
3. The generated commit-message tests pass.
4. The target repository's required checks are run or explicitly reported as unavailable.
5. Existing unrelated, staged, unstaged, and untracked files remain outside the operation.

Do not stage, commit, push, install a Git hook, or modify the global Trellis npm package unless the user separately authorizes that action.

Read [README.md](README.md) when the user asks how people acquire the skill, what to say to the agent, how local and remote installation differ, or what the complete user journey looks like.
