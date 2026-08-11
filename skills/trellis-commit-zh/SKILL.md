---
name: trellis-commit-zh
description: 在 Codex 中显式管理当前仓库的 Trellis 中文提交规范增强。用于安装增强、检查或升级用户级 Skill 与仓库策略、卸载增强并恢复原始基线，以及审计策略状态；不负责安装 Trellis 本身。
---

# trellis-commit-zh

替用户驱动完整流程。把 `scripts/trellis_commit_zh.py` 视为内部实现，不要求用户手工运行脚本。

## 路由

1. 解析用户指定的仓库；未指定时使用当前工作目录。
2. 运行 `python scripts/trellis_commit_zh.py status --repo <repo> --json`。
3. 若 Trellis 命令不可执行、`.trellis` 不完整、检测到无状态增强痕迹、状态损坏或基线缺失，原样保留仓库并用中文报告问题。
4. 用户已经明确说“安装”“升级”“卸载”或“重新验证”时，直接执行对应分支；否则根据状态只显示可执行选项并等待一次选择：
   - `not-installed`：安装
   - `outdated`：升级、卸载
   - `current`：检查升级、重新验证、卸载

## 安装

运行 `install`，再运行 `audit`。只有两条命令都成功才报告安装完成。首次安装保存的原始基线是卸载依据，后续升级不得替换它。

## 升级

1. 运行 `npx skills list -g`，确认用户级安装中存在 `trellis-commit-zh`。若不存在，报告当前为开发或非用户级副本，停止在线升级。
2. 运行 `npx skills update trellis-commit-zh -g -y`并保留输出。
3. 更新失败时用中文报告失败，不修改仓库策略。
4. 更新成功后，从更新后的 Skill 目录重新解析 `scripts/trellis_commit_zh.py`，运行 `upgrade` 和 `audit`。
5. 根据 `skills update` 的实际输出，用中文区分“已经是最新版本”和“Skill 更新成功”。

## 卸载

运行 `uninstall`。脚本只有在当前受管文件与最后写入哈希一致、原始基线完整时才恢复文件；任何冲突都停止卸载并列出文件。卸载仓库增强，不删除用户级 Skill。

## 重新验证

运行 `audit`，报告策略版本、受管文件和生成的提交消息测试结果。

## 边界

- 只通过 `trellis --version` 的退出状态确认 Trellis 可执行，不解析或限制版本。
- 保留现有工作树；不暂存、不提交、不推送，也不自动安装 Trellis。
- 使用 [references/commit-message.md](references/commit-message.md) 作为提交消息规则的唯一说明。
- 所有操作结果和用户提示使用简体中文。
