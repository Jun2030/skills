# Keep independently installable skills in one flat monorepo

Use `skills/<skill-name>/SKILL.md` as the public unit layout because the skills CLI supports multi-skill repositories and selective installation directly. Every skill owns its scripts, references, and assets and must not read sibling directories; relationships are documentation or optional skills.sh Packs, not runtime dependencies. This keeps one personal repository easy to operate while preserving standalone installation, and avoids both premature domain nesting and the maintenance cost of one repository per skill.
