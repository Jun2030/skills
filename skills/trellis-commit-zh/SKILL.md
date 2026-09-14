---
name: trellis-commit-zh
description: 将当前明确范围的改动提交为标准化中文 Conventional Commit；也可显式安装、升级、审计或卸载仓库内的 Trellis 中文提交增强。
---

# trellis-commit-zh

默认完成一次标准化中文提交。仓库内增强只是辅助能力：Trellis 升级、增强过期或增强脚本不兼容都不得阻断提交。将本 `SKILL.md` 所在目录作为 `<skill-dir>`。

## 路由

用户明确说“安装增强”“升级增强”“审计增强”或“卸载增强”时进入维护分支。其他调用，包括只输入 `$trellis-commit-zh`，都进入提交分支；不要先运行策略 `status`。

## 提交

1. 读取 [references/commit-message.md](references/commit-message.md)，检查 `git status --short`、实际 diff 和最近提交风格。
2. 只纳入本次任务明确修改的文件。存在无法确认归属的改动时，列出拟纳入和排除的路径并只确认一次；范围明确时直接继续。
3. 生成一个 `<type>(<scope>): <中文描述>` 消息；复杂改动使用中文 `- ` body。运行 `python "<skill-dir>/assets/overlays/validate_commit_message.py" <message>` 校验。
4. 只暂存确定范围并提交，不 amend、不 push。提交后核对 `git show --stat --oneline HEAD` 与剩余 `git status --short`。

提交分支直接使用本 Skill 的规范和校验器，不依赖 `.trellis` 内文件，也不因 Trellis 版本或增强状态失败而降级为仅检查状态。

## 维护

把 `scripts/trellis_commit_zh.py` 视为内部实现，不要求用户手工运行。先运行 `status --repo <repo> --json`；状态异常时保持仓库不变并用中文报告。

## 安装

运行 `install`，再运行 `audit`。只有两条命令都成功才报告安装完成。首次安装保存的原始基线是卸载依据，后续升级不得替换它。

## 升级

1. 运行 `npx skills list -g`，确认用户级安装中存在 `trellis-commit-zh`。若不存在，报告当前为开发或非用户级副本，停止在线升级。
2. 运行 `npx skills update trellis-commit-zh -g -y`并保留输出。
3. 更新失败时用中文报告失败，不修改仓库策略。
4. 更新成功后，从更新后的 Skill 目录重新解析 `scripts/trellis_commit_zh.py`，运行 `upgrade` 和 `audit`。`upgrade` 会基于当前 Trellis 文件重新应用中文提交消息增强；Trellis 自身更新覆盖过受管文件时，不因旧写入哈希不同而停止。
5. 根据 `skills update` 的实际输出，用中文区分“已经是最新版本”和“Skill 更新成功”。

## 卸载

运行 `uninstall`。脚本只有在当前受管文件与最后写入哈希一致、原始基线完整时才恢复文件；任何冲突都停止卸载并列出文件。卸载仓库增强，不删除用户级 Skill。

## 重新验证

运行 `audit`，报告策略版本、受管文件和生成的提交消息测试结果。

## 边界

- 只通过 `trellis --version` 的退出状态确认 Trellis 可执行，不解析或限制版本。
- 不绑定 Trellis 固定版本或固定文件哈希；以当前文件中的稳定提交消息语义锚点生成中文增强。
- 维护分支不暂存、不提交、不推送，也不自动安装 Trellis。
- 使用 [references/commit-message.md](references/commit-message.md) 作为提交消息规则的唯一说明。
- 所有操作结果和用户提示使用简体中文。
