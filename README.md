# Jun2030 Skills

## Skill 目录

| Skill | 用途 | 类型 |
|---|---|---|
| [`cumora-sandbox-verifier`](skills/cumora-sandbox-verifier/) | 发现本地 agent CLI，诊断、修复并验收 Windows Cumora 沙盒与主机能力 | Platform-Specific Skill |
| [`simple-html-report`](skills/simple-html-report/) | 生成 story-estimator 同款主题风格的 PC 静态 HTML 汇报 | Portable Skill |
| [`task-closeout`](skills/task-closeout/) | 复查刚完成的工作，修正遗漏并验证收尾状态 | Portable Skill |
| [`trellis-commit-zh`](skills/trellis-commit-zh/) | 提交标准化中文 Conventional Commit，并维护 Trellis 仓库增强 | Platform-Specific Skill |

## Skill 基本操作

**列出仓库中的全部 Skills：**

```powershell
npx skills add Jun2030/skills --list
```

**安装指定 Skill：**

```powershell
# 方法一 <=> 方法二
npx skills add Jun2030/skills --skill trellis-commit-zh -g
# 方法二 <=> 方法一
npx skills add Jun2030/skills@trellis-commit-zh -g
```

**安装全部 Skills：**

```powershell
npx skills add Jun2030/skills --skill '*'
```

**更新指定 Skill：**
```powershell
npx skills@latest update trellis-commit-zh -g -y
```

## `cumora-sandbox-verifier`

面向 Windows Cumora 本地 agent 的发现、沙盒诊断、修复与验收闭环。默认只读诊断；只有在用户明确授权后才备份并幂等修改 `daemon-supervisor.ps1`、按需创建 OpenCode CLI shim、重启 daemon，并以 `scripts/verify_cumora.ps1` 的 `verified=true` 作为唯一成功依据，输出 `VERIFIED` 或 `NOT VERIFIED`。若用户进一步要求“任意 agent 读取本机所有目录并显示所有本地 agent CLI”，可显式接受高风险后运行 `scripts/enable_full_host_access.ps1 -IUnderstandHighRisk`，幂等移除 daemon 生成给 agent 的 persona/常驻提示词隐私边界，并用 `-FullHostAccess` 验收。不会把未安装 Claude/Codex/OpenCode 误判为沙盒故障，也不会读取或输出设备令牌和凭证值。

安装：

```powershell
npx skills add Jun2030/skills@cumora-sandbox-verifier -g
```

调用：

```text
$cumora-sandbox-verifier
```

## `simple-html-report`

把材料整理成与 `story-estimator-20260529.html` 同系的 PC 静态 HTML 汇报：全屏 deck、蓝青绿琥珀配色、企业云盘工作台气质、卡片式 UI、进度条、键盘翻页和克制动画。

安装：

```powershell
npx skills add Jun2030/skills@simple-html-report -g
```

调用：

```text
$simple-html-report
```

## `task-closeout`

显式复查当前会话刚完成的工作：核对原始要求与实际变更，处理授权范围内的遗漏，执行相关验证，并报告剩余风险和待确认事项。

安装：

```powershell
npx skills add Jun2030/skills@task-closeout -g
```

调用：

```text
$task-closeout
```

## `trellis-commit-zh`

默认将当前任务的明确改动提交为标准化中文 Conventional Commit，直接使用 Skill 自带规范和校验器，不受 Trellis 升级或仓库增强状态影响。显式要求时也可安装、升级、审计或安全卸载仓库增强。

安装：

```powershell
npx skills add Jun2030/skills@trellis-commit-zh -g
```

调用：

```text
$trellis-commit-zh
```

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
