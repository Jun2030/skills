# Jun2030 Skills

English | [简体中文](README.zh-CN.md)

A personal collection of independently installable Agent Skills. Every skill is a self-contained distribution unit installable from GitHub through the [skills.sh](https://skills.sh/) CLI.

## Featured Skill

### `trellis-commit-policy`

Audit, apply, and maintain a deterministic commit-message policy for existing or new Trellis projects, with backup, rollback, and idempotency checks.

- Status: Ready for release
- Policy version: `0.1.0`
- Compatibility: Python 3.10+ and Trellis CLI 0.6.13+
- Verified baseline: Windows, Codex, and Trellis 0.6.13
- Details: [Skill guide (Simplified Chinese)](skills/trellis-commit-policy/README.md)

Install the latest version:

```powershell
npx skills add Jun2030/skills@trellis-commit-policy
```

Install the version from repository release `v0.1.0`:

```powershell
npx skills add 'Jun2030/skills#v0.1.0@trellis-commit-policy'
```

## Catalog

| Skill | Purpose | Type |
|---|---|---|
| [`trellis-commit-policy`](skills/trellis-commit-policy/) | Audit, apply, and maintain a Trellis commit-message policy | Portable Skill |

## Installation

List all skills in this repository:

```powershell
npx skills add Jun2030/skills --list
```

Install a specific skill:

```powershell
npx skills add Jun2030/skills --skill trellis-commit-policy
```

Install all skills:

```powershell
npx skills add Jun2030/skills --skill '*'
```

Use `owner/repo#ref@skill-name` when a repository release must be pinned.

## Repository Contract

- Published units live under `skills/<skill-name>/`, with the directory matching the frontmatter `name`.
- Every skill runs independently and does not read files from sibling skills.
- `main` contains only skills that pass the publication checks; drafts remain in branches or pull requests.
- Related skills reference each other through documentation; use a skills.sh Pack only when combined installation is needed.
- Repository releases use SemVer tags. A skill may also carry an internal policy or artifact version with separate semantics.

## Contributions

Issues and pull requests are welcome. The repository owner retains final merge, ordering, and release authority.

## License

[MIT](LICENSE)
