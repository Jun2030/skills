# Trellis Commit Policy

通过 Agent 驱动的工作流，为 Trellis 项目审计、应用和维护统一提交消息策略。日常使用不需要手工执行仓库中的 Python 脚本。

## 安装

安装最新版：

```powershell
npx skills add Jun2030/skills@trellis-commit-policy
```

安装仓库 Release `v0.1.0` 中的版本：

```powershell
npx skills add 'Jun2030/skills#v0.1.0@trellis-commit-policy'
```

安装完成后，在新一轮对话中调用：

```text
$trellis-commit-policy 请检查当前项目并启用统一的 Trellis 提交消息规范。保留现有工作树，不要暂存、提交或推送。
```

只读审计：

```text
$trellis-commit-policy 请只读审计当前项目是否符合最新提交消息策略，不要修改任何文件。
```

生成提交消息：

```text
$trellis-commit-policy 请根据当前实际 diff 生成提交消息。
```

## 能力

- 审计已有 Trellis 项目的策略漂移。
- 为已有项目应用策略，并执行备份、回滚保护和幂等验证。
- 调用原生 Trellis CLI 初始化新项目，然后应用并验证策略。
- 根据实际 diff 生成一个符合策略的提交消息。
- 区分版本警告、结构不兼容和策略文件漂移。

## 兼容性

| 项目 | 要求 |
|---|---|
| Policy Version | `0.1.0` |
| Python | `3.10+` |
| Trellis CLI | `0.6.13+` |
| 完整验证基线 | Windows、Codex、Trellis 0.6.13 |

Trellis 0.6.13 标记为 `verified`。更高版本标记为 `unverified`，继续进行确定性结构检查；只有版本过低或结构不兼容时才停止写入。

## 安全边界

Skill 在写入前检查目标结构，并为受管文件创建备份；部分写入失败时恢复已替换文件。除非用户针对当前操作单独授权，否则不会暂存、提交、推送、安装 Git hook 或修改全局 Trellis npm 包。

## 开发验证

```powershell
python -m unittest tests.test_trellis_policy -v
python scripts/trellis_policy.py version
```
