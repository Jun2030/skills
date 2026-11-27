# simple-html-report-v2

`simple-html-report-v2` 是从 `dashi-ppt-campus` 克隆并改造的南昌主题通用汇报技能，适用于项目、业务、方案、复盘和管理层汇报。

默认视觉是深色赣江蓝、霓虹青、赤金与朱红高亮，使用江流曲线、城市网格、桥梁结构和数据光带等抽象元素。它保留原版的结构化 `goal.json`、本地资源打包、HTML 预览、可编辑 PPTX/PDF 导出和校验流程。

交付 HTML 不依赖外部图片或 CDN。字体、脚本、图标、背景场景和用户素材会复制到 deck 的本地 `assets/`；npm 依赖、Playwright 浏览器、版本检查和可选模板下载属于构建准备阶段，可以联网。

生成器位于 `project/`，Windows 使用 `scripts/render_goal_deck.ps1`。内部兼容 `campus` theme/layout key，用户侧称为南昌炫酷汇报主题。
