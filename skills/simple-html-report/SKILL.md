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
- Cover title: it does not have to be huge and does not have to wrap. Treat the cover as an enterprise briefing deck, not a poster. Prefer a single-line or compact two-line technical title that balances with the subtitle, lede, quote, and floating metric panel. For Chinese titles, start around `clamp(46px, 4.8vw, 82px)`; only exceed ~96px for very short English/product-name titles that still fit the page rhythm. Never force `<br>` in a Chinese H1 just to mimic the source English split.
- Topline: left brand label with vertical gradient mark, right blue page pill like `01 / 08`.
- Cards: translucent white, thin blue border, soft shadow, 4px gradient stripe at top.
- Hero: prominent but proportionate title with one blue emphasis segment, subtitle, lede, amber quote block, and a floating-card metric cluster.
- Icon alignment: do not rely on text glyphs such as `→`, `✓`, `‹`, `›`, or single emoji as centered icons inside circles/cards/navigation buttons. Use inline SVG icons with a fixed `viewBox`, centered via `display: grid; place-items: center`, and verify the visual center at both `1536x790` and `1920x990`. If a text glyph is unavoidable, tune it with explicit `line-height: 1`, block sizing, and a small transform after screenshot inspection.
- Flow diagrams: prefer an explicit grid or lane layout with non-overlapping cards and short connectors. Keep main nodes evenly spaced, reserve a separate decision lane, and avoid large free-floating absolute-position clusters unless the topic specifically needs them.
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
8. Takeaway: proportionate amber takeaway block plus three summary cards.

Skip a slide only when the source material truly lacks that content. Do not add visible slides about audience, viewport, design spec, implementation plan, or "how this HTML was made".

## Design Quality Gate

Use these as hard checks before finalizing a report:

- Treat this as an enterprise briefing deck, not a marketing landing page. Borrow only the useful parts of general frontend taste rules: hierarchy, density, rhythm, contrast, and visual restraint.
- Headings must read naturally before they look dramatic. Avoid formulaic prefixes on every slide such as "它解决什么问题：", "它怎么工作：", or repeated "一句话..."; use concise domain headings when possible.
- Keep visible copy tight: cover subtitle around one line, cover lede about 40-70 Chinese characters, slide ledes about 20-45 Chinese characters, card body text 1-2 short lines, quote/takeaway blocks usually 1-3 readable lines. Never make long Chinese takeaway text huge just to fill the card, and never force line breaks unless the phrase reads naturally.
- Takeaway slides should feel like a closing briefing, not a poster. If the sentence is long, reduce type scale or split it into emphasis spans/cards; do not create awkward word-by-word wrapping.
- For Chinese inline emphasis, do not add decorative spaces around `<em>`/`strong` spans. Those spaces become bad line-break points and can orphan punctuation.
- Do not use `display: flex` or `display: grid` directly on quote text that contains inline `<em>`/`strong`; it can turn text runs into separate flex/grid items and break Chinese sentences. Use normal block text flow with padding/line-height for vertical rhythm.
- Use at most one slide-level kicker. Card badges, tags, and layer chips must carry real categorization; do not add badges just to decorate. Scenario cards usually need at most 2-3 tags each.
- Metric panels and bars must either map to real values or be abstract enough to avoid fake precision. Do not add unlabeled dashboard-style progress tracks as decorative filler.
- Keep mechanism diagrams legible: usually 5-9 main nodes, no overlapping cards, no connector lines running through node text, and no more than one decision split. If the process is larger, group nodes into lanes or phases instead of adding more cards.
- Prefer CSS classes over inline `style` attributes so the visual system stays reusable and auditable.
- Use a consistent radius, shadow, border, and label system across the deck. Do not mix pill-heavy controls with square cards unless the role difference is clear.
- Every slide should have one visual job. If two slides use the same 4-card grid rhythm back-to-back, vary one of them with a timeline, split board, mechanism diagram, or summary stack.
- Run a copy self-audit: remove AI-ish filler verbs, fake-perfect numbers, decorative status dots, em dashes, and meta labels that do not help the report topic.

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
- The first screen is actual report content and the cover title is proportionate to the right-side metric panel.
- The output visually targets `1536x790` and `1920x990`; check every slide at both viewports, not just the cover.
- Visible text contains no production/meta requirements.
- The mechanism diagram is topic-specific.
- Animation has a readable static fallback.
- Browser-check keyboard navigation, notes toggle, progress update, and hash deep links.
- Check visual centering of navigation/button icons, especially chevrons.
- Run a mechanical layout audit for overflow and obvious card/card intersections. Flow diagrams must have zero overlapping node cards at both target viewports.
