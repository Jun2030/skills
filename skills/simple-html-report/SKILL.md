---
name: simple-html-report
description: "Create standalone PC HTML report decks in the exact visual family of projects/Skills-Report/story-estimator-20260529.html: enterprise cloud-workbench theme, blue/cyan/green/amber palette, card-heavy briefing UI, keyboard slide navigation, restrained GSAP-like entry animation, progress bar, speaker-note option, and mechanism/process diagrams. Use whenever the user asks for simple-html-report, similar style to story-estimator-20260529.html, HTML PPT, static briefing deck, animated HTML report, or a reusable report in that theme."
---

# Simple HTML Report

Make every output look like a sibling of `projects/Skills-Report/story-estimator-20260529.html`. This skill is not a general report-writing style; it is a style extraction of that HTML report.

## Style DNA

Use these concrete defaults unless the user explicitly overrides them:

- Canvas: full-screen PC deck, `100vw x 100vh`, hidden overflow, centered `.slide-inner` max width about `1560px`.
- Target viewports: only `1536x790` and `1920x990`. Do not optimize mobile unless asked.
- Background: pale enterprise cloud paper, light blue wash, subtle grid overlay.
- Palette: `#053b82`, `#064caa`, `#0a64d8`, `#1377ef`, `#0ea5c6`, `#178f73`, `#dc7a11`, `#c8443d`, ink `#0c1424/#22314a/#5d6d85`, paper `#fbfcff/#f1f6fc/#e9f2ff`.
- Shadows/radius: soft blue shadow `0 24px 70px rgba(26,63,112,.15)`, smaller shadow `0 14px 40px rgba(26,63,112,.10)`, card radius around `22px`.
- Typography: system sans with Chinese fonts; very heavy headings; letter spacing `0` for real headings; compact uppercase kicker labels are allowed.
- Topline: left brand label with vertical gradient mark, right blue page pill like `01 / 08`.
- Cards: translucent white, thin blue border, soft shadow, 4px gradient stripe at top.
- Hero: oversized title with blue emphasized word, subtitle, lede, amber quote block, and a floating-card metric cluster.
- Diagram slide: white flow board with grid, SVG paths, small labeled nodes, green/blue AI/system badges and amber human-gate badges.

The report should feel like a technical skill briefing inside an enterprise cloud workspace. It should not become a marketing landing page, magazine article, beige consulting memo, dark dashboard, or generic Tailwind card page.

## Required Slide Patterns

Prefer 6-8 slides. Keep the same rhythm as the source report; rename content to the new topic.

1. Cover: topic name, subtitle, lede, amber quote, floating metric/cards panel.
2. Problem: bad path vs good path, with red/amber tags on the weak side and blue/green tags on the better side.
3. How it works: 3-5 step cards with simple inline SVG icons and arrows.
4. Scenarios: four cards with small abstract visuals and pill tags.
5. Usage or operation: timeline on the left, command/code panel on the right.
6. Optional enhancement/depth: two large tool/risk/integration cards.
7. Mechanism: custom SVG process/decision diagram, not a generic flowchart.
8. Takeaway: large amber quote block plus three summary cards.

Skip a slide only when the source material truly lacks that content. Do not add visible slides about audience, viewport, design spec, implementation plan, or "how this HTML was made".

## Animation Contract

Use the source report's animation feel:

- Slide navigation: left/right buttons, ArrowRight/PageDown/Space for next, ArrowLeft/PageUp for previous, Home/End jump, optional `N` notes and `F` fullscreen.
- Progress: bottom gradient progress bar updates per slide.
- Entry motion: kicker/title/subtitle/lede fade up from `y: 30` with slight blur; cards fade up from `y: 34` with stagger; mini bars/timeline lines scale from left/top.
- Mechanism slide: animate SVG paths with `stroke-dasharray` and `stroke-dashoffset`; move a small marker along the path only if simple enough.
- Reduced motion: honor `prefers-reduced-motion: reduce`.

Use vanilla CSS/JS for this unless the output is explicitly allowed to embed a local GSAP copy. Do not load GSAP, icons, fonts, Tailwind, or charts from a CDN.

## Visible Copy Rules

Visible report body must contain only domain/report content.

Do not write meta-production text such as:

- "这份报告是给谁看的"
- "适配 1536x790 / 1920x990"
- "后续 HTML 怎么做"
- "制作要求"
- "设计说明"
- "本页面使用了..."

Use those requirements privately to shape the artifact.

## Build Contract

Return one standalone `.html` file unless the user asks otherwise.

Include:

- `<!doctype html>`, UTF-8, viewport meta, useful `<title>` and description.
- Inline CSS with the style DNA above as CSS variables.
- Inline SVG icons/diagrams. No remote assets.
- Semantic `.slide` sections with `data-title`.
- Inline JS for navigation, progress, notes, and animation.
- Direct-open compatibility and static-hosting compatibility.

When working in `D:\JunRepos\share`, place reports under `projects/` using repo naming rules, then run `npm run generate` and the smallest relevant check. Do not use `--initialize-times` without explicit confirmation.

## Verification

Before final response, check:

- The artifact has no external CDN URL.
- The first screen is actual report content.
- The output visually targets `1536x790` and `1920x990`.
- Visible text contains no production/meta requirements.
- The mechanism diagram is topic-specific.
- Animation has a readable static fallback.
