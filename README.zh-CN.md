# Jun2030 Skills

[English](README.md) | 简体中文

这是一个由个人维护、可独立安装的 Agent Skills 集合。每个 Skill 都是自包含的发布单元，可通过 GitHub 和 [skills.sh](https://skills.sh/) CLI 安装。

## 功能 Skill

### `trellis-commit-policy`

为已有或新建的 Trellis 项目审计、应用和维护确定性的提交消息策略，包含备份、回滚和幂等验证。

- 状态：可发布
- 策略版本：`0.1.0`
- 兼容性：Python 3.10+、Trellis CLI 0.6.13+
- 已验证基线：Windows、Codex、Trellis 0.6.13
- 详情：[Skill 使用指南](skills/trellis-commit-policy/README.md)

安装最新版：

```powershell
npx skills add Jun2030/skills@trellis-commit-policy
```

安装仓库 Release `v0.1.0` 中的版本：

```powershell
npx skills add 'Jun2030/skills#v0.1.0@trellis-commit-policy'
```

## Skill 目录

| Skill | 用途 | 类型 |
|---|---|---|
| [`trellis-commit-policy`](skills/trellis-commit-policy/) | 审计、应用和维护 Trellis 提交消息策略 | Portable Skill |

## 安装

列出仓库中的全部 Skills：

```powershell
npx skills add Jun2030/skills --list
```

安装指定 Skill：

```powershell
npx skills add Jun2030/skills --skill trellis-commit-policy
```

安装全部 Skills：

```powershell
npx skills add Jun2030/skills --skill '*'
```

需要固定仓库 Release 时，使用 `owner/repo#ref@skill-name`。

## 仓库约定

- 发布单元位于 `skills/<skill-name>/`，目录名与 frontmatter `name` 一致。
- 每个 Skill 独立运行，不读取兄弟 Skill 的文件。
- `main` 只保留通过发布检查的 Skills；草稿留在分支或 Pull Request。
- 相关 Skills 通过文档关联；只有需要组合安装时才使用 skills.sh Pack。
- 仓库 Release 使用 SemVer tag；Skill 可以另外维护语义独立的策略版本或产物版本。

## 贡献

欢迎提交 Issue 和 Pull Request。仓库所有者保留最终合并、排序和发布决定权。

## 许可证

[MIT](LICENSE)
