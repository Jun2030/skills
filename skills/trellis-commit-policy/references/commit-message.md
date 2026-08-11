# Trellis 提交消息规范

生成提交消息时，只输出一个完整 commit message 本文，不要输出解释、Markdown 代码块、候选列表、标签或占位符。

## Header

第一行必须且只能有一个 Conventional Commits Header：

`<type>(<scope>): <中文描述>`

- `type` 只能使用 `feat`、`fix`、`docs`、`style`、`refactor`、`perf`、`test`、`build`、`ci`、`chore` 或 `revert`。
- `scope` 必填，使用能概括主要改动的简短小写英文模块名；允许数字和连字符。
- 描述使用简洁中文动宾短语，不以中文或英文句号结尾。

简单改动到 Header 结束。

## Body

复杂改动在 Header 后空一行，使用以 `- ` 开头的中文 Body 项覆盖实际 diff 中的主要改动。

- 每一项都必须包含中文。
- 不得插入空白项。
- 禁止为不同文件或改动项再次生成 `feat`、`fix`、`test` 等 Header。

是否属于复杂改动、描述是否为恰当动宾短语、Body 是否覆盖实际 diff，必须由生成者结合 diff 判断；校验器只负责可确定的格式约束。

## Trellis 固定消息

- 会话日志：`chore(trellis): 记录会话日志`
- 任务归档：`chore(task): 归档任务 <task-name>`
