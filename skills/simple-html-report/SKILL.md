---
name: simple-html-report
description: "Create standalone PC HTML report decks in the exact visual family of projects/Skills-Report/story-estimator-20260529.html: enterprise cloud-workbench theme, blue/cyan/green/amber palette, card-heavy briefing UI, keyboard slide navigation, restrained GSAP-like entry animation, progress bar, speaker-note option, mechanism/process diagrams, and click-to-fullscreen previews for dense SVG/charts and all images. Use whenever the user asks for simple-html-report, similar style to story-estimator-20260529.html, HTML PPT, static briefing deck, animated HTML report, or a reusable report in that theme."
---

# Simple HTML Report

Make every output look like a sibling of `projects/Skills-Report/story-estimator-20260529.html`. This skill is not a general report-writing style; it is a style extraction of that HTML report.

## Style DNA

Use these concrete defaults unless the user explicitly overrides them:

- Canvas: full-screen PC deck, `100vw x 100vh`, hidden overflow, centered `.slide-inner` max width about `1560px`.
- Vertical rhythm: every slide fills the usable content lane from the title area down to the navigation safe zone. Give one content-bearing main region `flex: 1; min-height: 0` so charts, diagrams, timelines, or comparison boards absorb available height instead of leaving a large blank lower half.
- Navigation safe zone: fixed previous/next controls remain outside the content lane. With the default `bottom: 20px` and `36px` button height, reserve about `84px` of slide bottom inset so the lowest content stays roughly `28px` above the buttons.
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

## Vertical Layout Contract

Treat vertical space as a measurable layout constraint, not a screenshot-level impression.

Use this baseline unless the existing report has an equivalent token system:

```css
:root {
  --nav-bottom: 20px;
  --nav-height: 36px;
  --nav-gap: 28px;
}

.slide {
  padding-bottom: calc(var(--nav-bottom) + var(--nav-height) + var(--nav-gap));
}

.slide-inner {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.slide-main {
  flex: 1;
  min-height: 0;
  display: grid;
  align-content: stretch;
}
```

At both target viewports, measure each slide after rendering:

- `usableHeight = navButtonTop - contentTop`.
- `usedHeight = contentBottom - contentTop` for meaningful slide content, excluding fixed navigation and progress UI.
- Keep `usedHeight / usableHeight >= 0.78`. A lower ratio indicates an underfilled slide.
- Keep `navButtonTop - contentBottom` between `20px` and `48px`. This preserves a visible buffer without reopening a large blank band.

Repair an underfilled slide by enlarging its content-bearing chart or diagram, distributing rows within the main region, converting explanatory prose into a relationship visual, or adding a relevant comparison/evidence lane. Do not inflate padding, stretch empty cards, repeat conclusions, or add decorative filler merely to occupy space.

If the slide becomes crowded, shorten copy, reduce non-semantic gaps, simplify the visual, or split the slide. Preserve readable text and the navigation safe zone.

## Visual Encoding Contract

Before writing HTML, assign every slide one primary question and the visual form that answers it best. Record this privately as `question -> relationship -> primary visual -> why this visual fits`. Every slide must contain at least one content-bearing chart, inline SVG diagram, schematic, timeline, or metric visualization; a grid of text-only cards is not a finished slide.

Choose by information relationship:

| Content relationship | Preferred visual |
|---|---|
| Compare values across categories or versions | Grouped bars, dot plot, or slope chart |
| Show distribution or error spread | Histogram, box plot, or a donut only for a few discrete buckets |
| Show composition or coverage | Stacked bar, treemap, or proportional strip |
| Show sequence, ownership, or handoffs | Timeline, lane flow, or sequence diagram |
| Show filtering, mapping, or records entering a common denominator | Sankey-like/alluvial flow, funnel, or explicit input-rule-output lanes |
| Show correlation or relationship between two measures | Scatter plot with reference line |
| Show hierarchy or containment | Tree, nested bands, or bounded architecture diagram |
| Show causes, risks, or decisions | Cause tree, risk matrix, or one-split decision diagram |
| Show a mechanism or system interaction | Topic-specific inline SVG schematic with labeled paths |
| Show an operation or command workflow | Timeline plus code/command panel with semantic step icons |

Use familiar inline SVG icons for concrete concepts such as input, database, validation, warning, human approval, deployment, and result. Use a fixed `viewBox`, consistent stroke weight, and accessible labels where the icon carries meaning. A chart or relationship diagram takes precedence over an icon when the content contains quantities or structure.

Apply a relevance test: if an icon could be swapped for an unrelated icon without changing the reader's understanding, it is decoration. Replace it with a content-specific SVG or remove it. Do not use emoji, text glyph arrows, or the same generic icon across every slide.

## Visual Preview Contract

Make dense visuals inspectable at reading size and at full-screen size.

- Every image is clickable and keyboard-focusable for a full-screen preview, regardless of its displayed size or information density.
- A chart or inline SVG gets a preview trigger when it carries enough labels, nodes, series, annotations, or fine detail that the default slide viewport makes any meaningful part hard to read. The primary chart/diagram on a slide is a preview candidate by default; a small decorative icon is not.
- Use a semantic `figure`/wrapper with a real `button` trigger, an inline SVG expand icon, `aria-label`, and `title`. Keep the trigger in the normal focus order; do not rely on hover alone or on a text glyph such as `⛶`.
- Open a modal preview that uses the native Fullscreen API when available and a fixed viewport overlay as the fallback. Render the same SVG/chart/image with `max-width: 96vw`, `max-height: 90vh`, and `object-fit: contain`; preserve aspect ratio and labels.
- Support `Enter`/`Space` to open, `Esc` to close, focus restoration to the trigger, and a visible close control with a centered inline SVG icon. Do not navigate slides while the preview is open.
- Add a small “expand” affordance only when it communicates a real preview action. Do not add preview buttons to every decorative element just to increase interaction count.

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

## Execution Workflow

Follow this order for every report:

1. Extract the brief into `topic`, `audience`, `source facts`, `must-show mechanisms`, and `unknowns`. Output is a private slide outline, not visible report copy.
2. Choose 6-8 slides from the Required Slide Patterns. Output is a one-line purpose for each slide and the content each slide must prove.
3. Build a visual plan for every slide using the Visual Encoding Contract. Identify its primary question, information relationship, chosen chart/icon/SVG, and why that form is the clearest fit.
4. Draft all visible copy before writing HTML. Keep every heading, card body, metric, and quote within the Design Quality Gate.
5. Assign each slide a vertical anatomy: title/lede, one flexible main visual region, optional evidence/takeaway strip, and the shared navigation safe zone.
6. Build one standalone HTML file with inline CSS, inline SVG, and vanilla JS. Reuse the Style DNA tokens instead of inventing a new theme.
7. Browser-check the file at `1536x790` and `1920x990`. Inspect every slide, not only the cover, and measure the Vertical Layout Contract.
8. Wire the Visual Preview Contract for every image and every dense chart/SVG before final browser checks.
9. Fix underfill, overflow, navigation clearance, broken navigation, flow-node overlap, and preview focus/fullscreen failures, then rerun the same browser checks.
10. Final response must include the output file path, the validation commands run, and any verification that could not be completed.

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
- Every slide should also have one primary content-bearing visual chosen from the Visual Encoding Contract. Use cards to support that visual, not as the automatic replacement for it.
- Run a copy self-audit: remove AI-ish filler verbs, fake-perfect numbers, decorative status dots, em dashes, and meta labels that do not help the report topic.

## Failure Recovery

| Trigger | First fix | If still failing |
|---|---|---|
| Cover title wraps awkwardly or dominates the page | Reduce H1 scale and remove forced `<br>` | Shorten the title or move detail into subtitle/lede |
| Quote/takeaway text breaks word-by-word | Use normal block text flow, remove decorative spaces around inline emphasis, reduce type scale | Split the message into one quote plus summary cards |
| Navigation or step icons look off-center | Replace text glyphs with inline SVG in a fixed `viewBox` and center with `place-items: center` | Tune the SVG viewBox or path, then recheck screenshots |
| Flow cards overlap or connectors cross text | Switch to explicit CSS grid or lanes with reserved connector paths | Reduce node count by grouping into phases |
| Any slide overflows at `1536x790` or `1920x990` | Reduce copy, tighten card padding, or change the layout rhythm | Split the slide into two slides rather than shrinking everything |
| A slide leaves a large blank lower half | Give the most meaningful chart/diagram region `flex: 1` and distribute its real content vertically | Replace text-only cards with the relationship visual selected by the Visual Encoding Contract |
| Content approaches or sits behind navigation buttons | Reserve the calculated navigation safe inset and remeasure the content bottom | Move the lowest evidence strip upward or simplify the slide |
| A page uses generic icons or text cards for structured information | Select the visual from the relationship table and redraw it as inline SVG/chart | Reduce the page to one clearer visual question |
| Dense SVG/chart or an image cannot be inspected at readable scale | Wrap it in a keyboard-focusable preview trigger and open a native-fullscreen modal with a viewport fallback | Reduce the default visual to the essential summary while keeping the full preview |
| Preview opens but traps focus, clips labels, or advances slides | Restore focus on close, use `object-fit: contain`, and suspend slide-key handling while open | Replace the custom overlay with a semantic `<dialog>` and the same fallback sizing |
| Browser automation is unavailable | Do a manual visual pass in a browser and report that automated checks were not run | Do not claim layout verification passed |
| User asks to publish or place the report outside the current workspace | Stop and confirm target directory/environment | Proceed only after the target is explicit |

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

## STOP Checkpoints

- 🔴 STOP before adding external assets, CDN scripts, remote fonts, chart libraries, or icon libraries. Continue only if the user explicitly approves that dependency/source.
- 🔴 STOP before changing the target from PC-only `1536x790`/`1920x990` to mobile or responsive delivery. That is a different artifact contract.
- 🔴 STOP before publishing, copying into a share site, deploying, or modifying a manifest. Confirm the target path and environment first.
- 🔴 STOP if source facts are too thin to support the requested report. Ask for source material or label mock content clearly in the private workflow; do not invent fake project evidence.

## Verification

Before final response, check:

- The artifact has no external CDN URL.
- The first screen is actual report content and the cover title is proportionate to the right-side metric panel.
- The output visually targets `1536x790` and `1920x990`; check every slide at both viewports, not just the cover.
- At both target viewports, every slide uses at least 78% of its usable vertical content lane and keeps `20-48px` between its lowest meaningful content and the top of the navigation buttons.
- Every slide has a content-specific primary visual; charts encode real values, diagrams encode real relationships, and semantic icons match the concept they label.
- Every image opens a full-screen preview; every information-dense chart/SVG has a click and keyboard preview with a viewport fallback, preserved aspect ratio, readable labels, Esc close, and focus restoration.
- Visible text contains no production/meta requirements.
- The mechanism diagram is topic-specific.
- Animation has a readable static fallback.
- Browser-check keyboard navigation, notes toggle, progress update, and hash deep links.
- Check visual centering of navigation/button icons, especially chevrons.
- Run a mechanical layout audit for overflow and obvious card/card intersections. Flow diagrams must have zero overlapping node cards at both target viewports.
- Include underfill and navigation-clearance failures in the mechanical audit; a slide that merely avoids overflow but leaves a large blank lower half does not pass.
- Exercise every preview trigger at both target viewports and verify that the preview opens, does not clip the visual, does not advance slides, closes with `Esc`, and restores focus.
