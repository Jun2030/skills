// 模型结构 / 算法管线图:横向管线「输入 → 3–6 个模块 → 输出」,模块是带编号徽标、短标题与一行说明的卡片;
// 相邻模块可框成一组(如「编码器」「解码器」),箭头上标数据形态(如「特征图」「点云」),
// 可画一条从下方绕行的次要路径(跳连 / 辅助输入),可把一个模块标成重点;管线下方 2–4 条编号步骤说明,编号与模块徽标对应。
// 几何按外壳的正文区尺寸计算(useCampusLayout):箭头标签放得下时压在箭头上,放不下时统一移到管线下方。
// 已有现成结构图时可切到「改用图片」,步骤说明保留。适合算法类答辩里连续多页的模型结构图。
import React from 'react';
import { useThemeStyle, enterDelay } from '../../../shared/style.jsx';
import { safeArray, safeNumber, safeDenominator, clamp } from '../../../chart-safety.mjs';
import { CampusFrame, TitleRow, ConclusionBar, CHAPTER_CONTROL, TITLE_ROW_SPACE, CONCLUSION_SPACE, useCampusLayout, SparkStar } from '../kit/chrome.jsx';
import { PickTag } from '../kit/structure.jsx';
import { useDiagramStyle, WireLayer, WireTag, NumBadge, GroupFrame, DotGrid, DiagramImage, diagramMediaControls, isImageMode, tagWidth, textPx, r1 } from '../kit/diagram.jsx';

const DEFAULTS = {
  chapterIndex: 3,
  mediaMode: 'auto',
  moduleCount: 4,
  groupCount: 2,
  stepCount: 4,
  highlightIndex: 2,
  showSkip: true,
  showSteps: true,
  showConclusion: false,
  sectionNo: '3.1',
  title: '网络架构：从多视点图像到深度图',
  input: { tag: '输入', title: '多视点图像', note: '1 张参考图 + N 张源图', flow: '图像组' },
  modules: [
    { no: '1', title: '特征提取', desc: '共享权值的 2D CNN 提取深度视觉特征', flow: '特征图' },
    { no: '2', title: '可微单应投影', desc: '把源图特征投影到参考视角的各个深度平面', flow: '代价体' },
    { no: '3', title: '代价体正则化', desc: '三维卷积正则化代价体，回归初始深度图', flow: '初始深度图' },
    { no: '4', title: '深度图优化', desc: '融合参考图像，细化边界区域', flow: '深度图' },
    { no: '5', title: '第五个模块', desc: '在这里写这个模块做什么，一句话即可', flow: '中间结果' },
    { no: '6', title: '第六个模块', desc: '在这里写这个模块做什么，一句话即可', flow: '结果' },
  ],
  output: { tag: '输出', title: '深度图', note: '逐视角融合后得到稠密点云' },
  groups: [
    { label: '特征编码', from: 1, to: 2 },
    { label: '深度推断', from: 3, to: 4 },
  ],
  highlightLabel: '核心模块',
  skip: { from: 0, to: 4, label: '参考图像' },
  steps: [
    { no: '1', title: '提取特征', desc: '用 CNN 提取图像的深度视觉特征，源图像与参考图像分支共享权值。' },
    { no: '2', title: '构建代价体', desc: '通过可微单应投影和基于方差的成本度量构建 3D 代价体。' },
    { no: '3', title: '回归深度', desc: '用三维卷积正则化代价体，回归得到初始深度图。' },
    { no: '4', title: '优化边界', desc: '融合参考图像和深度图做优化，提升边界区域的准确性。' },
  ],
  imageCaption: '图 3-1 网络架构图（参考 MVSNet）',
  conclusionLabel: '设计要点',
  conclusion: '源图像与参考图像的特征提取分支共享权值，代价体按方差聚合，对视图数量不敏感。',
};

const PAD_X = 36;          // 画布左右内边距
const PAD_Y = 26;          // 画布上下内边距
const GROUP_ROOM = 44;     // 有分组时模块行上方留给分组标签的高度
const FRAME = 16;          // 分组框比模块多出的边距
const BELOW_TAG = 54;      // 箭头标签放到管线下方时占用的高度
const SKIP_ROOM = 74;      // 下方绕行路径占用的高度
const STEPS_H = 184;
const STEPS_GAP = 24;
const MODULE_MIN = 196;    // 箭头标签压在箭头上时模块的最小宽度;再窄就把标签移到下方

const CSS = `
.cp-g2-mp-canvas{flex:none;}
.cp-g2-mp-stage{position:absolute;left:0;top:0;}
/* 模块卡:白卡 + 浅校色卡头(编号徽标 + 标题),重点模块卡头换成渐变 */
.cp-g2-mp-mod{position:absolute;display:flex;flex-direction:column;border-radius:16px;}
.cp-g2-mp-mod::before{content:'';position:absolute;inset:0;z-index:-1;border-radius:inherit;background:var(--theme-surface);border:1px solid var(--campus-card-edge);box-shadow:var(--campus-shadow);}
.cp-g2-mp-mod{isolation:isolate;}
.cp-g2-mp-head{position:relative;flex:none;display:flex;align-items:center;gap:12px;min-height:72px;padding:12px 16px;border-radius:16px 16px 0 0;background:var(--campus-accent-wash);border-bottom:1px solid var(--campus-card-edge);}
.cp-g2-mp-title{min-width:0;font-family:var(--theme-font-serif);font-weight:700;font-size:23px;line-height:1.25;letter-spacing:.02em;color:var(--theme-ink);text-wrap:balance;}
.cp-g2-mp-desc{flex:1;min-height:0;padding:14px 18px 16px;font-size:19px;line-height:1.55;color:var(--theme-muted);text-wrap:pretty;}
.cp-g2-mp-rule{flex:none;width:28px;height:4px;margin:0 18px 16px;border-radius:2px;background:var(--campus-fill);}
.cp-g2-mp-mod.is-hl .cp-g2-mp-head{background:var(--campus-fill-deep);border-bottom-color:transparent;}
.cp-g2-mp-mod.is-hl .cp-g2-mp-title{color:var(--theme-on-accent);}
.cp-g2-mp-mod.is-hl::before{border:2px solid rgb(var(--theme-accent-rgb) / .5);box-shadow:0 18px 40px rgb(var(--theme-accent-rgb) / .22);}
.cp-g2-mp-pick{position:absolute;z-index:4;}
.cp-g2-mp.is-narrow .cp-g2-mp-head{flex-direction:column;align-items:flex-start;gap:8px;min-height:0;padding:12px 14px;}
.cp-g2-mp.is-narrow .cp-g2-mp-title{font-size:21px;}
.cp-g2-mp.is-narrow .cp-g2-mp-desc{padding:10px 14px 12px;font-size:18px;line-height:1.5;}
/* 输入:三层叠放的浅色卡(数据集 / 图像组的意象) */
.cp-g2-mp-end{position:absolute;display:flex;flex-direction:column;justify-content:center;gap:10px;padding:18px 20px;border-radius:16px;}
.cp-g2-mp-sheet{position:absolute;border-radius:16px;background:var(--theme-surface);border:1.5px solid var(--campus-accent-line);}
.cp-g2-mp-sheet.is-back{background:var(--campus-accent-tint);border-color:transparent;}
.cp-g2-mp-in{isolation:isolate;}
.cp-g2-mp-in::before{content:'';position:absolute;inset:0;z-index:-1;border-radius:inherit;background:var(--theme-surface);border:2px solid var(--campus-accent-line);box-shadow:var(--campus-shadow);}
.cp-g2-mp-kicker{align-self:flex-start;display:flex;align-items:center;gap:6px;height:30px;padding:0 12px;border-radius:999px;background:var(--campus-accent-tint);color:var(--theme-accent);font-size:18px;line-height:1;font-weight:700;letter-spacing:.12em;white-space:nowrap;}
.cp-g2-mp-end-title{font-family:var(--theme-font-serif);font-weight:700;font-size:25px;line-height:1.25;letter-spacing:.03em;color:var(--theme-ink);text-wrap:balance;}
.cp-g2-mp-end-note{font-size:18px;line-height:1.5;color:var(--theme-muted);text-wrap:pretty;}
/* 输出:渐变实底 + 点缀色星标 + 淡色圆斑 */
.cp-g2-mp-out{overflow:hidden;background:var(--campus-fill-deep);box-shadow:var(--campus-shadow-lift);}
.cp-g2-mp-out .cp-g2-mp-kicker{background:var(--campus-on-accent-glass);color:var(--theme-on-accent);}
.cp-g2-mp-out .cp-g2-mp-end-title{color:var(--theme-on-accent);}
.cp-g2-mp-out .cp-g2-mp-end-note{color:var(--campus-on-accent-muted);}
.cp-g2-mp-star{flex:none;display:block;color:var(--campus-spark);}
.cp-g2-mp-orb{position:absolute;right:-34px;bottom:-40px;width:130px;height:130px;border-radius:50%;background:rgb(255 255 255 / .09);pointer-events:none;}
.cp-g2-mp-orb.is-2{right:auto;left:-26px;top:-30px;bottom:auto;width:80px;height:80px;background:rgb(255 255 255 / .06);}
/* 下方标签的引线 */
.cp-g2-mp-tick{position:absolute;width:2px;border-radius:1px;background:var(--campus-accent-line);}
.cp-g2-mp-tick::before{content:'';position:absolute;left:-3px;top:-4px;width:8px;height:8px;border-radius:50%;background:var(--theme-accent);}
/* 步骤说明:白卡,左侧与模块同款的编号徽标 */
.cp-g2-mp-steps{flex:none;display:grid;grid-auto-flow:column;grid-auto-columns:minmax(0,1fr);gap:22px;margin-top:${STEPS_GAP}px;}
.cp-g2-mp-steps.is-roomy .cp-g2-mp-step{display:grid;grid-template-columns:auto minmax(0,1fr);align-content:center;align-items:start;}
.cp-g2-mp-steps.is-roomy .cp-g2-mp-step-desc{font-size:22px;line-height:1.6;}
.cp-g2-mp-step{display:flex;gap:18px;padding:24px 24px 20px 22px;min-height:0;}
.cp-g2-mp-step-body{flex:1;min-width:0;display:flex;flex-direction:column;}
.cp-g2-mp-step-title{font-family:var(--theme-font-serif);font-weight:700;font-size:25px;line-height:1.3;letter-spacing:.03em;color:var(--theme-ink);}
.cp-g2-mp-step-title::after{content:'';display:block;width:30px;height:3px;margin-top:10px;border-radius:2px;background:var(--campus-fill);}
.cp-g2-mp-step-desc{margin-top:10px;font-size:21px;line-height:1.55;color:var(--theme-muted);text-wrap:pretty;}
.cp-g2-mp-steps.is-4 .cp-g2-mp-step{padding:22px 20px 18px 18px;gap:14px;}
.cp-g2-mp-steps.is-4 .cp-g2-mp-step-desc{font-size:20px;line-height:1.5;}
.cp-g2-mp-media{flex:1;min-height:0;display:flex;}
`;

/** 节点下标(0 = 输入,1..n = 模块,n + 1 = 输出)→ 盒子。 */
function nodeBoxes({ n, drawW, IW, OW, gaps, MW, rowY, MH }) {
  const boxes = [];
  let x = PAD_X;
  boxes.push({ x, y: rowY, w: IW, h: MH });
  x += IW;
  for (let i = 0; i < n; i += 1) {
    x += gaps[i];
    boxes.push({ x, y: rowY, w: MW, h: MH });
    x += MW;
  }
  x += gaps[n];
  boxes.push({ x, y: rowY, w: Math.max(OW, PAD_X + drawW - x), h: MH });
  return boxes;
}

export function ModelPipeline(props) {
  useDiagramStyle();
  useThemeStyle('campus-model-pipeline-style', CSS);
  const p = { ...DEFAULTS, ...props };
  const { bodyW, bodyH } = useCampusLayout();
  const image = isImageMode(p);
  const modules = safeArray(p.modules).slice(0, clamp(p.moduleCount, 3, 6));
  const n = modules.length;
  const groups = safeArray(p.groups).slice(0, clamp(p.groupCount, 0, 2));
  const steps = p.showSteps ? safeArray(p.steps).slice(0, clamp(p.stepCount, 2, 4)) : [];
  const hl = clamp(Math.round(safeNumber(p.highlightIndex, 0)), 0, n);
  const input = p.input || {};
  const output = p.output || {};

  const W = bodyW;
  const canvasH0 = bodyH - TITLE_ROW_SPACE - (steps.length ? STEPS_H + STEPS_GAP : 0) - (p.showConclusion ? CONCLUSION_SPACE : 0);
  const drawW = W - PAD_X * 2;

  // 箭头标签:edge 0 = 输入 → 模块 1,edge i = 模块 i → 下一个
  const flows = [input.flow, ...modules.map(m => m?.flow)].map(t => (t === undefined || t === null ? '' : String(t)));
  const IW = clamp(drawW * 0.11, 150, 196);
  const OW = clamp(drawW * 0.115, 156, 204);
  const inlineGaps = flows.map(t => (t ? clamp(tagWidth(t) + 56, 72, 220) : 64));
  const sum = list => list.reduce((a, b) => a + b, 0);
  const inlineMW = (drawW - IW - OW - sum(inlineGaps)) / safeDenominator(n, 1);
  const below = inlineMW < MODULE_MIN && flows.some(Boolean);
  const gaps = below ? flows.map(() => (n >= 5 ? 50 : 60)) : inlineGaps;
  const MW = (drawW - IW - OW - sum(gaps)) / safeDenominator(n, 1);
  const narrow = MW < 210;

  // 竖向:分组标签 / 模块行 / 下方标签 / 绕行路径
  const skipFrom = clamp(Math.round(safeNumber(p.skip?.from, 0)), 0, n + 1);
  const skipTo = clamp(Math.round(safeNumber(p.skip?.to, n + 1)), 0, n + 1);
  const showSkip = p.showSkip && Math.abs(skipTo - skipFrom) >= 2;
  const topRoom = groups.length ? GROUP_ROOM : 0;
  const bottomRoom = (below ? BELOW_TAG : 0) + (showSkip ? SKIP_ROOM : 0);
  const room0 = canvasH0 - PAD_Y * 2 - topRoom - bottomRoom;
  // 模块高度按最长说明的估算行数决定(内容少时不把卡片拉成空长条),再受可用高度封顶
  const descLines = Math.max(1, ...modules.map(m => Math.ceil(textPx(m?.desc, narrow ? 18 : 19) / Math.max(60, MW - (narrow ? 28 : 36)))));
  const titleLines = Math.max(1, ...modules.map(m => Math.ceil(textPx(m?.title, narrow ? 21 : 23) / Math.max(60, MW - (narrow ? 28 : 84)))));
  const want = (narrow ? 64 + titleLines * 27 : 72) + descLines * (narrow ? 27 : 30) + 30 + 26;
  const MH = clamp(Math.min(room0, want + 24), 150, 300);
  // 管线内容矮时把画布收紧,多出来的高度让给下方步骤卡(最多 100px),避免画布上下大片留白
  const spare = steps.length ? clamp(room0 - MH - 70, 0, 100) : 0;
  const canvasH = canvasH0 - spare;
  const stepsH = STEPS_H + spare;
  const room = canvasH - PAD_Y * 2 - topRoom - bottomRoom;
  const rowY = PAD_Y + topRoom + Math.max(0, (room - MH) / 2);
  const boxes = nodeBoxes({ n, drawW, IW, OW, gaps, MW, rowY, MH });
  const midY = rowY + MH / 2;

  const wires = [];
  const tags = [];
  const ticks = [];
  for (let e = 0; e <= n; e += 1) {
    const a = boxes[e];
    const b = boxes[e + 1];
    const x0 = a.x + a.w;
    const x1 = b.x;
    wires.push({ points: [[x0 + 2, midY], [x1 - 2, midY]], kind: 'main', tail: true });
    if (!flows[e]) continue;
    const cx = (x0 + x1) / 2;
    if (below) {
      const ty = rowY + MH + BELOW_TAG / 2 + 4;
      ticks.push({ left: r1(cx - 1), top: r1(midY), height: r1(ty - midY - 16) });
      tags.push({ x: cx, y: ty, text: flows[e] });
    } else {
      tags.push({ x: cx - 6, y: midY, text: flows[e] });
    }
  }
  let skipTag = null;
  if (showSkip) {
    const a = boxes[skipFrom];
    const b = boxes[skipTo];
    const ys = rowY + MH + (below ? BELOW_TAG : 0) + SKIP_ROOM * 0.62;
    const xa = a.x + a.w / 2;
    const xb = b.x + b.w / 2;
    wires.push({ points: [[xa, rowY + MH + 2], [xa, ys], [xb, ys], [xb, rowY + MH + 4]], kind: 'sub', tail: true, radius: 18 });
    skipTag = { x: (xa + xb) / 2, y: ys, text: p.skip?.label };
  }
  const frames = groups.map(g => {
    const from = clamp(Math.round(safeNumber(g?.from, 1)), 1, n);
    const to = clamp(Math.round(safeNumber(g?.to, from)), from, n);
    const a = boxes[from];
    const b = boxes[to];
    return { label: g?.label, box: { left: a.x - FRAME, top: rowY - FRAME - 6, width: b.x + b.w - a.x + FRAME * 2, height: MH + FRAME * 2 + 6 } };
  });

  const inBox = boxes[0];
  const outBox = boxes[n + 1];
  const canvas = (
    <div className="cp-g2-mp-canvas cp-g2-canvas campus-rise" style={{ width: W, height: r1(canvasH), ...enterDelay(1) }}>
      <DotGrid />
      <div className={`cp-g2-mp cp-g2-mp-stage cp-g2-stage${narrow ? ' is-narrow' : ''}`} style={{ width: W, height: r1(canvasH) }}>
        {frames.map((f, i) => <GroupFrame key={`g${i}`} box={f.box} label={f.label} className="campus-fade" style={enterDelay(2)} />)}
        <WireLayer W={W} H={canvasH} wires={wires} className="campus-fade" style={enterDelay(3)} />
        {ticks.map((t, i) => <div key={`t${i}`} className="cp-g2-mp-tick campus-fade" style={{ left: t.left, top: t.top, height: Math.max(0, t.height), ...enterDelay(4) }} aria-hidden="true" />)}
        {/* 输入:三层叠放 */}
        <div className="cp-g2-mp-sheet is-back campus-fade" style={{ left: r1(inBox.x + 16), top: r1(inBox.y), width: r1(inBox.w - 16), height: r1(inBox.h - 16), ...enterDelay(2) }} aria-hidden="true" />
        <div className="cp-g2-mp-sheet campus-fade" style={{ left: r1(inBox.x + 8), top: r1(inBox.y + 8), width: r1(inBox.w - 16), height: r1(inBox.h - 16), ...enterDelay(2) }} aria-hidden="true" />
        <div className="cp-g2-mp-end cp-g2-mp-in campus-rise" style={{ left: r1(inBox.x), top: r1(inBox.y + 16), width: r1(inBox.w - 16), height: r1(inBox.h - 16), ...enterDelay(2) }}>
          <div className="cp-g2-mp-kicker"><div>{input.tag}</div></div>
          <div className="cp-g2-mp-end-title">{input.title}</div>
          <p className="cp-g2-mp-end-note">{input.note}</p>
        </div>
        {modules.map((m, i) => {
          const b = boxes[i + 1];
          const isHl = hl === i + 1;
          return (
            <React.Fragment key={i}>
              <div className={`cp-g2-mp-mod${isHl ? ' is-hl' : ''} campus-rise`} style={{ left: r1(b.x), top: r1(b.y), width: r1(b.w), height: r1(b.h), ...enterDelay(3 + i) }}>
                <div className="cp-g2-mp-head">
                  <NumBadge no={m?.no} size={40} tone={isHl ? 'ring' : 'fill'} spark={isHl} />
                  <div className="cp-g2-mp-title">{m?.title}</div>
                </div>
                <p className="cp-g2-mp-desc">{m?.desc}</p>
                <div className="cp-g2-mp-rule" aria-hidden="true" />
              </div>
              {isHl && p.highlightLabel ? (
                <PickTag label={p.highlightLabel} className="cp-g2-mp-pick campus-rise" style={{ right: r1(W - b.x - b.w - 8), top: r1(b.y - 18), ...enterDelay(4 + i) }} />
              ) : null}
            </React.Fragment>
          );
        })}
        <div className="cp-g2-mp-end cp-g2-mp-out campus-rise" style={{ left: r1(outBox.x), top: r1(outBox.y), width: r1(outBox.w), height: r1(outBox.h), ...enterDelay(4 + n) }}>
          <div className="cp-g2-mp-orb" aria-hidden="true" />
          <div className="cp-g2-mp-orb is-2" aria-hidden="true" />
          <div className="cp-g2-mp-kicker">
            <SparkStar size={16} className="cp-g2-mp-star" />
            <div>{output.tag}</div>
          </div>
          <div className="cp-g2-mp-end-title">{output.title}</div>
          <p className="cp-g2-mp-end-note">{output.note}</p>
        </div>
        {tags.map((t, i) => <WireTag key={`w${i}`} x={t.x} y={t.y} text={t.text} small={below} className="campus-fade" style={enterDelay(5 + n)} />)}
        {skipTag ? <WireTag x={skipTag.x} y={skipTag.y} text={skipTag.text} tone="soft" className="campus-fade" style={enterDelay(5 + n)} /> : null}
      </div>
    </div>
  );

  return (
    <CampusFrame chapterIndex={p.chapterIndex}>
      <TitleRow no={p.sectionNo} title={p.title} className="campus-rise" style={enterDelay(0)} />
      {image ? (
        <div className="cp-g2-mp-media campus-rise" style={enterDelay(1)}>
          <DiagramImage id="model-pipeline-image" placeholder="模型结构图" caption={p.imageCaption} />
        </div>
      ) : canvas}
      {steps.length ? (
        <div className={`cp-g2-mp-steps is-${steps.length}${spare > 40 ? ' is-roomy' : ''}`} style={{ height: r1(stepsH) }}>
          {steps.map((s, i) => (
            <div className="cp-g2-mp-step campus-card campus-rise" key={i} style={enterDelay(7 + n + i)}>
              <NumBadge no={s?.no} size={48} />
              <div className="cp-g2-mp-step-body">
                <div className="cp-g2-mp-step-title">{s?.title}</div>
                <p className="cp-g2-mp-step-desc">{s?.desc}</p>
              </div>
            </div>
          ))}
        </div>
      ) : null}
      {p.showConclusion && <ConclusionBar label={p.conclusionLabel} text={p.conclusion} className="campus-rise" style={enterDelay(12 + n)} />}
    </CampusFrame>
  );
}

ModelPipeline.META = {
  id: 'model-pipeline',
  label: '模型结构图 · 横向管线配编号步骤',
  roles: ['process', 'relationship', 'context'],
  defaults: DEFAULTS,
  copyBudgets: {
    title: 28,
    'input.tag': 4,
    'input.title': 8,
    'input.note': 16,
    'input.flow': 6,
    'modules[].no': 2,
    'modules[].title': 7,
    'modules[].desc': 22,
    'modules[].flow': 6,
    'output.tag': 4,
    'output.title': 8,
    'output.note': 16,
    'groups[].label': 6,
    highlightLabel: 5,
    'skip.label': 8,
    'steps[].no': 2,
    'steps[].title': 7,
    'steps[].desc': 34,
    imageCaption: 30,
    conclusionLabel: 4,
    conclusion: 44,
  },
  numberBounds: {
    'groups[].from': { min: 1, max: 6, semantics: 'index' },
    'groups[].to': { min: 1, max: 6, semantics: 'index' },
  },
  controls: [
    { ...CHAPTER_CONTROL, default: 3 },
    ...diagramMediaControls('模型结构图'),
    { key: 'moduleCount', type: 'number', label: '模块数量', default: 4, min: 3, max: 6, countArrays: ['modules'], description: '输入与输出之间的模块数。每个模块的 flow 写在它后面那支箭头上(数据形态,如「特征图」);输入的 flow 写在第一支箭头上。标签放不下时自动移到管线下方。' },
    { key: 'groupCount', type: 'number', label: '分组框数量', default: 2, min: 0, max: 2, countArrays: ['groups'], description: '把相邻模块框成一组(如编码器 / 解码器);groups[].from / to 是起止模块的序号(1 起)。' },
    { key: 'highlightIndex', type: 'number', label: '重点模块', default: 2, min: 0, max: 6, maxFromKey: 'moduleCount', description: '第几个模块标成重点(卡头换成渐变并挂 highlightLabel 小旗);0 表示不标。' },
    { key: 'showSkip', type: 'toggle', label: '下方绕行路径', default: true, description: '从管线下方绕行的次要路径(跳连、辅助输入);skip.from / to 是节点序号:0 = 输入,1–6 = 模块,模块数 + 1 = 输出,两端至少隔一个节点。' },
    { key: 'showSteps', type: 'toggle', label: '步骤说明', default: true, description: '管线下方的编号步骤说明卡。' },
    { key: 'stepCount', type: 'number', label: '步骤数量', default: 4, min: 2, max: 4, countArrays: ['steps'], description: '步骤说明的条数;编号建议与模块徽标一致。' },
    { key: 'showConclusion', type: 'toggle', label: '底部结论条', default: false, description: '页面底部的校色结论条(开启后管线区相应变矮)。' },
  ],
};
