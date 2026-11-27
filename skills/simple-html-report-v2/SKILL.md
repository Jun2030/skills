---
name: simple-html-report-v2
description: 面向项目、业务、方案、复盘、区域分析和管理场景，生成可编辑、可离线打开、可导出 PPTX/PDF 的炫酷 HTML 汇报。默认使用南昌城市科技主题：深色赣江蓝、霓虹青、赤金与朱红高亮，结合江流曲线、城市网格、桥梁结构和数据光带。只要用户提到 PPT、幻灯片、汇报、报告、项目复盘、方案评审、南昌主题或 HTML deck，就优先使用本技能；也适用于用户只给出一批内容、希望自动整理成专业汇报的情况。
---

# Simple HTML Report V2

本技能克隆自 `dashi-ppt-campus` 的结构化 deck 生成器，并将高校/答辩定位改造成南昌主题的通用汇报工具。它生成可编辑的 HTML deck，可通过本地预览服务继续编辑并导出 PPTX/PDF。

## 先理解它的边界

- 这是通用工作汇报技能，覆盖项目进度、业务复盘、方案评审、战略分析、区域项目、数据汇报和管理层简报。
- 南昌是默认的视觉身份。用户的实际业务主题跟随输入变化；不要把每份汇报都写成南昌城市介绍。
- 生成器内部保留兼容的 `campus` theme key 和 `campus_*` layout key，以复用原版稳定的页面契约；对用户呈现时称为“南昌炫酷汇报主题”。
- 默认约 8–10 页，至少包含封面、目录、正文展开、结论/行动和结语。用户明确页数时按用户要求。
- 主题默认采用 `selected-only` 交付思路；需要比较版式时才使用 `variantOutputMode: "comparison"`。`campus` 专用页仍直接手写 `goal.json`，不走标准 3+1 scaffold 流程。

## 南昌主题视觉

默认视觉由下列语义组成，不宣称它们是任何官方城市视觉规范：

- 背景：`#06101F` / `#0B1F3A` 深色夜景，带低透明度网格、噪声和局部光晕。
- 主色：赣江蓝 `#0A6BFF`、霓虹青 `#00D9C6`。
- 高光：赤金 `#FFB84A`，风险/警示可用朱红 `#F25555`。
- 形态：江流曲线、桥梁弧线、经纬网格、城市节点、发光路径、数据光带和抽象建筑轮廓。
- 语言：标题短而有判断，正文服务于“现状 → 证据 → 判断 → 行动”；少用学校、论文、答辩、导师等默认语境。
- 地标或城市事实只能来自用户提供的材料。没有素材时用抽象 SVG/图表，不编造城市数据，也不自动下载照片。

## 资源与网络策略

保持原版的资源边界：

- 交付 HTML 的字体、`gsap`、`pptxgenjs`、`pdf-lib`、`html-to-image`、图标、背景场景和主题资源都复制到输出目录的本地 `assets/` 下。
- 用户图片和视频必须先通过 `media:stage` 复制到 deck 内的 `assets/user-media/`，goal 只引用 deck 内相对路径。
- 禁止在 goal、页面组件或交付 HTML 中使用远程图片、远程字体、CDN、`file://`、远程媒体 URL 或临时绝对路径。
- npm 依赖准备、Playwright 浏览器安装、版本检查和可选原生模板下载可以联网；这些是构建准备，不是交付 HTML 的运行时 CDN 依赖。
- 用户没有明确要求原创图片时，不调用 image generation；没有用户素材时优先使用原生图表和 SVG 图示，关闭不可用的图片位。

## 生成流程

1. 从需求提取 `title`、`goal`、`audience`、`owner`、页数、核心结论、指标、行动项、素材和未知事实。用户未给数据时，把自拟数字列入交付说明，并提醒替换。
2. 直接选择南昌主题，不再让用户从原版的高校风格列表中选风格。默认 `themePack` 为 `campus`，`randomSeed` 使用题目与日期生成的稳定值。
3. 先读本技能的示例：
   - `references/examples/annual-review.json`：年度/管理汇报。
   - `references/examples/portfolio.json`：项目/成果组合。
   - 需要城市/项目叙事时，按同样结构写封面、目录、章节页、指标、流程、数据、风险、行动和结语。
4. 手写本次输出目录中的 `goal.json`。第 1 页固定 `campus_temp_cover`，第 2 页固定 `campus_temp_agenda`，最后一页固定 `campus_temp_closing`；正文按内容关系选 `campus_*` 页面。
5. 写正文 props 前运行：

   ```powershell
   npm --prefix <skill-root>/project run inspect:layout -- --brief campus_<id> campus_<id>
   ```

   遵守字段字数上限、数组条数和控件约束。每个正文页写 `chapterIndex`、`sectionNo` 和 `title`。
6. 没有图片时不要保留空图框。优先选能隐藏媒体位的页面；原生图表、流程图、矩阵、地图式关系图可以不使用图片。
7. 运行 Windows 渲染脚本：

   ```powershell
   & "<skill-root>/scripts/render_goal_deck.ps1" `
     "<output-dir>/goal.json" `
     "<output-dir>/ppt/index.html"
   ```

   脚本会准备外部依赖、运行 `props:safe`、`validate:goal-spec`、渲染、`validate:swiss`、`validate:goal-copy`，并启动本地预览服务。
8. 生成后核对 `ppt/assets` 中所有素材存在，HTML 中没有无关默认文案、远程 URL 或空媒体位。HTML 预览只交付 `http://127.0.0.1:<port>/`。
9. 用户要求 PPTX/PDF 时运行项目内的导出命令，不把导出责任留给用户：

   ```powershell
   npm --prefix <skill-root>/project run export:pptx -- <output-dir>/ppt <output-dir>/<title>.pptx
   npm --prefix <skill-root>/project run export:pdf -- <output-dir>/ppt <output-dir>/<title>.pdf
   ```

10. 最终交付前运行：

   ```powershell
   npm --prefix <skill-root>/project run validate:swiss -- <output-dir>/ppt/index.html
   npm --prefix <skill-root>/project run validate:goal-copy -- <output-dir>/goal.json <output-dir>/ppt/index.html
   ```

## goal.json 写法

顶层至少包含：

```json
{
  "themePack": "campus",
  "title": "南昌主题项目汇报",
  "goal": "向管理者说明项目进展、关键证据、风险判断与下一步动作",
  "audience": "管理层 / 项目协作团队",
  "owner": "项目组",
  "randomSeed": "nanchang-briefing-20261126-a7k",
  "brand": {
    "name": "南昌项目汇报",
    "nameEn": "NANCHANG PROJECT BRIEFING",
    "mark": "昌",
    "headerNote": "CITY SIGNAL · PROJECT BRIEFING",
    "footerNote": "南昌主题 · 项目汇报",
    "accent": "#00D9C6",
    "chapters": ["现状扫描", "关键进展", "风险判断", "行动计划"],
    "fill": "gradient",
    "nav": "solid",
    "titleStyle": "bar"
  },
  "slides": []
}
```

封面通用字段：`kicker`、`title`、`subtitle`、`presenterLabel`、`presenter`、`advisorLabel`、`advisor`、`unitLabel`、`unit`、`dateLabel`、`date`。汇报场景把 `presenterLabel` 写成“汇报人”或“项目负责人”，把 `unitLabel` 写成“部门 / 项目组”；`advisor` 只在用户提供时写。

目录使用 `itemCount` 和 `items[]`，每项写 `no`、`title`、`note`、`desc`。正文使用对照表：

| 内容 | 优先页面 |
| --- | --- |
| 章节过渡 | `campus_chapter_opener`，有照片时才使用 |
| 背景/现状 | `campus_background_figure`、`campus_lead_quotes_subject`、`campus_metric_grid` |
| 核心结论 | `campus_key_statement`、`campus_big_numeral`、`campus_significance_cards` |
| 关键进展/成果 | `campus_showcase_bars`、`campus_stage_cards`、`campus_achievement_list` |
| 项目结构 | `campus_problem_work_map`、`campus_objective_contents`、`campus_layer_architecture` |
| 流程/路线 | `campus_method_roadmap`、`campus_flow_chain`、`campus_swimlane_flow`、`campus_decision_flow` |
| 数据趋势/比较 | `campus_bar_chart_insight`、`campus_line_chart_compare`、`campus_experiment_compare`、`campus_heatmap_matrix` |
| 方案/选型 | `campus_option_matrix`、`campus_versus_compare`、`campus_quadrant_matrix` |
| 风险与对策 | `campus_cause_countermeasure`、`campus_status_table`、`campus_balance_scale` |
| 项目计划 | `campus_schedule_table`、`campus_gantt_schedule`、`campus_future_plan` |
| 团队/协作 | `campus_team_lead`、`campus_team_members` |
| 下一步/行动 | `campus_expected_outcomes`、`campus_summary_outlook`、`campus_target_focus` |

## 质量规则

- 每页只解决一个主要问题；数据关系用图表，流程关系用节点与连线，层级关系用结构图，风险关系用矩阵或因果图。
- 先改内容，再改结构。不要通过缩小字体、堆装饰或复制结论来填满页面。
- 业务正文必须写真实文案；不要交付 `AI Capital`、`Roadmap`、`End of Report`、`请输入文本` 等无关默认文案。
- 数字必须来自用户或明确列入假设；不要用等差数列冒充真实趋势。
- 没有真实图片就不要编造照片来源、城市统计、项目客户或机构名称。
- 页面动画使用组件自带效果，尊重 `prefers-reduced-motion`。导出后应保持文字可编辑。
- 默认最多修正两轮。每轮都从 goal 校验、渲染、素材核对和最终产物检查重新走一遍。

## 测试

测试用例保存在 `evals/evals.json`。至少覆盖：

1. 南昌主题的项目阶段汇报：验证主题、封面、目录、指标、风险、行动和本地资源边界。
2. 管理层数据复盘：验证趋势图、对比页、数据假设说明和无远程资源。
3. 方案评审：验证流程/决策图、选型矩阵、PPTX/PDF 导出命令与校验。

机器验证通过后，仍需打开预览逐页检查内容可见、无溢出、无空媒体位、导航与结语完整。没有浏览器能力时只报告完成的脚本检查，不声称完成视觉验收。
