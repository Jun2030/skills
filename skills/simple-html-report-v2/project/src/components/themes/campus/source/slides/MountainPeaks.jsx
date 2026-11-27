// 层叠山峰:3–5 座前后层叠的立体山峰,峰高随「层级」数值变化。每座山分受光面 / 背光面(明度差拉开),
// 两侧再分几块深浅不同的岩面、描山脊与支脊线,雪顶也分受光 / 背光两半;身后有两道远山与中景小山,
// 山腰横着水平薄雾带、山脚雾气渐隐(不画卡通云)。最高峰换大号暖金雪顶 + 暖金旗 + 峰顶光点 + 身后光晕;
// 每座峰顶插一面小旗,旗上方写大号数值与实心名称胶囊;一条暖金虚线串起峰顶,前景是一排玻璃说明卡。
// 适合阶段性成果、指标攀升、目标层级。
import React from 'react';
import { useThemeStyle, enterDelay } from '../../../shared/style.jsx';
import { safeArray, safeNumber, safeMax, safeRatio, clamp } from '../../../chart-safety.mjs';
import { CampusFrame, TitleRow, CHAPTER_CONTROL, TITLE_ROW_SPACE, useCampusLayout, textWidthEm } from '../kit/chrome.jsx';
import { ToneDefs } from '../kit/feature-b.jsx';
import { useFeatureCStyle, useSvgId, Stop, r2, sampleSpline, polyPath, Sparkles, FlagMark, PoleDefs, NoSeal, KickerChip } from '../kit/feature-c.jsx';

const DEFAULTS = {
  chapterIndex: 3,
  peakCount: 4,
  showLead: true,
  sectionNo: '3.2',
  title: '定位精度目标逐级攀升',
  note: '峰高表示目标层级 · 示例数据',
  kicker: '攀升路径',
  lead: '从已具备的松组合定位出发，逐级加入惯导辅助与抗差估计，最终实现深组合连续定位。',
  peaks: [
    { no: '01', name: '松组合定位', value: '±20', unit: 'm', level: 42, title: '已具备的基础', desc: '软件接收机已能完成捕获、跟踪与松组合定位解算。' },
    { no: '02', name: '惯导辅助', value: '±10', unit: 'm', level: 62, title: '速度预报辅助', desc: '用惯导的高精度速度预报辅助环路，缩小跟踪频差。' },
    { no: '03', name: '抗差估计', value: '±5', unit: 'm', level: 80, title: '剔除异常观测', desc: '权函数把观测量分三类定权，降低异常值的影响。' },
    { no: '04', name: '深组合', value: '±2', unit: 'm', level: 100, title: '研究目标', desc: '惯导与码环、载波环深度耦合，复杂环境下连续定位。' },
    { no: '05', name: '高灵敏度', value: '−10', unit: 'dB', level: 72, title: '弱信号跟踪', desc: '频率稳定度传递补偿频偏，延长相干积分时间。' },
  ],
};

const CSS = `
.cp-g5-mt-note{position:absolute;left:0;top:0;display:flex;align-items:center;gap:12px;font-size:19px;letter-spacing:.06em;color:var(--theme-faint);}
.cp-g5-mt-note-mark{flex:none;width:28px;height:5px;border-radius:3px;background:var(--campus-fill);}
.cp-g5-mt-lead{position:absolute;left:0;top:0;}
.cp-g5-mt-lead .cp-g5-mt-note{position:static;padding-left:2px;}
.cp-g5-mt-label{position:absolute;transform:translate(-50%,-100%);display:flex;flex-direction:column;align-items:center;gap:10px;}
.cp-g5-mt-figure{display:flex;align-items:baseline;gap:4px;white-space:nowrap;color:var(--campus-accent-lo);text-shadow:0 2px 0 var(--theme-surface),0 6px 16px rgb(var(--theme-accent-rgb) / .22);}
.cp-g5-mt-num{font-family:var(--theme-font-serif);font-weight:700;font-size:var(--cp-g5-mt-num,60px);line-height:1;font-variant-numeric:lining-nums;letter-spacing:-.01em;}
.cp-g5-mt-unit{font-size:23px;font-weight:700;}
.cp-g5-mt-name{position:relative;isolation:isolate;display:flex;align-items:center;height:40px;padding:0 18px;color:var(--theme-on-accent);font-size:20px;font-weight:700;letter-spacing:.06em;white-space:nowrap;}
.cp-g5-mt-name-shape{position:absolute;inset:0;z-index:-1;border-radius:999px;background:var(--campus-fill);border:1.5px solid var(--campus-on-accent-line);box-shadow:0 8px 18px rgb(var(--theme-accent-rgb) / .28);}
.cp-g5-mt-label.is-top .cp-g5-mt-figure{color:var(--campus-gold-ink);text-shadow:0 2px 0 var(--theme-surface),0 6px 18px rgb(var(--campus-gold-rgb) / .4);}
.cp-g5-mt-label.is-top .cp-g5-mt-num{font-size:calc(var(--cp-g5-mt-num,60px) * 1.25);}
.cp-g5-mt-label.is-top .cp-g5-mt-name{color:var(--campus-gold-deep);height:44px;font-size:22px;}
.cp-g5-mt-label.is-top .cp-g5-mt-name-shape{background:var(--campus-gold-fill);box-shadow:0 8px 20px rgb(var(--campus-gold-rgb) / .4);}
.cp-g5-mt-cards{position:absolute;left:0;right:0;bottom:0;display:grid;column-gap:22px;}
.cp-g5-mt-card{display:flex;flex-direction:column;gap:8px;padding:18px 24px 20px;min-width:0;}
.cp-g5-mt-card-head{display:flex;align-items:center;gap:14px;}
.cp-g5-mt-card-title{font-family:var(--theme-font-serif);font-weight:700;font-size:27px;line-height:1.25;letter-spacing:.03em;color:var(--theme-ink);}
.cp-g5-mt-card-desc{font-size:21px;line-height:1.5;color:var(--theme-muted);text-wrap:pretty;}
.cp-g5-mt.is-dense .cp-g5-mt-card{padding:16px 20px 18px;}
.cp-g5-mt.is-dense .cp-g5-mt-card-title{font-size:25px;}
.cp-g5-mt.is-dense .cp-g5-seal{min-width:44px;height:44px;font-size:22px;}
`;

// 山体轮廓与岩面分块(以峰顶为原点、峰高为 1、半底宽为 1 的比例坐标;y=1 是山脚,FOOT 是压到卡片下面的地平线)。
// 光从左上来:主山脊左侧是受光面、右侧是背光面;两侧各再分 2–3 块深浅不同的岩面,山脊与支脊描细线。
const FOOT = 1.12;
const OUT_L = [[0, 0], [-0.17, 0.15], [-0.36, 0.33], [-0.58, 0.52], [-0.76, 0.72], [-1, FOOT]];
const OUT_R = [[0, 0], [0.16, 0.15], [0.34, 0.36], [0.58, 0.58], [0.78, 0.8], [0.95, FOOT]];
const RIDGE = [[0, 0], [0.05, 0.3], [-0.02, 0.6], [0.08, FOOT]];
const FACETS = [
  // [点列, 叠色, 不透明度]
  [[[0, 0], [-0.17, 0.15], [-0.36, 0.33], [-0.14, 0.42], [0.05, 0.3]], 'white', 0.24],       // 受光面上部:最亮
  [[[-0.14, 0.42], [-0.36, 0.33], [-0.58, 0.52], [-0.34, 0.66], [-0.02, 0.6], [0.05, 0.3]], 'white', 0.1], // 受光面中段
  [[[-0.58, 0.52], [-0.76, 0.72], [-1, FOOT], [-0.5, FOOT], [-0.34, 0.66]], 'ink', 0.08],     // 左侧支脊的阴面
  [[[0, 0], [0.05, 0.3], [0.3, 0.5], [0.34, 0.36], [0.16, 0.15]], 'ink', 0.16],             // 背光面上部:最暗
  [[[0.3, 0.5], [-0.02, 0.6], [0.08, FOOT], [0.48, FOOT], [0.58, 0.58]], 'accent', 0.32],  // 背光面下部:地面反光(校色本色)
];
const CREASES = [
  [[[-0.58, 0.52], [-0.34, 0.66], [-0.5, FOOT]], 'white', 0.45, 1.5],
  [[[-0.36, 0.33], [-0.14, 0.42], [-0.02, 0.6]], 'white', 0.3, 1.2],
  [[[0.05, 0.3], [0.3, 0.5], [0.58, 0.58]], 'ink', 0.16, 1.4],
  [[[0.3, 0.5], [0.48, FOOT]], 'ink', 0.1, 1.2],
];

const FACET_FILL = { white: 'var(--theme-surface)', ink: 'var(--theme-ink)', accent: 'var(--theme-accent)' };

// 折线上按 y 取 x(y 单调递增)。
const xAtY = (line, y) => {
  for (let i = 1; i < line.length; i += 1) {
    const [x0, y0] = line[i - 1];
    const [x1, y1] = line[i];
    if (y <= y1) return x0 + (x1 - x0) * ((y - y0) / Math.max(1e-6, y1 - y0));
  }
  return line[line.length - 1][0];
};

// 雪顶:沿左右轮廓与主山脊取深度为 c 的点,下缘做成参差的锯齿;分成受光的一半与背光的一半。
function capShape(c) {
  const L = [xAtY(OUT_L, c * 0.92), c * 0.92];
  const R = [xAtY(OUT_R, c * 0.74), c * 0.74];
  const M = [xAtY(RIDGE, c * 1.02), c * 1.02];
  const lerpP = (a, b, t, dy) => [a[0] + (b[0] - a[0]) * t, (a[1] + (b[1] - a[1]) * t) + dy * c];
  const lit = [[0, 0], L, lerpP(L, M, 0.22, -0.14), lerpP(L, M, 0.42, 0.04), lerpP(L, M, 0.62, -0.12), lerpP(L, M, 0.8, 0.06), M];
  const shade = [[0, 0], M, lerpP(M, R, 0.3, -0.14), lerpP(M, R, 0.55, 0.03), lerpP(M, R, 0.78, -0.1), R];
  return { lit, shade };
}

// 每座主峰的配色档:最高峰最浓;其余按高度排名逐级提亮(越矮越靠前、越浅,但受光 / 背光的明度差始终拉开)。
const MT_TONES = [
  { litTop: 'var(--campus-accent-hi)', litBot: 'var(--theme-accent)', shadeTop: 'var(--campus-accent-lo)', shadeBot: 'var(--campus-accent-deep)' },
  { litTop: 'var(--campus-fb-accent-mist)', litBot: 'var(--campus-accent-hi)', shadeTop: 'var(--theme-accent)', shadeBot: 'var(--campus-accent-lo)' },
  { litTop: 'var(--campus-g5-haze)', litBot: 'var(--campus-fb-accent-mist)', shadeTop: 'var(--campus-accent-hi)', shadeBot: 'var(--theme-accent)' },
];

export function MountainPeaks(props) {
  useThemeStyle('campus-mountain-peaks-style', CSS);
  useFeatureCStyle();
  const p = { ...DEFAULTS, ...props };
  const id = useSvgId('cp-g5-mt');
  const { bodyW, bodyH } = useCampusLayout();
  const peaks = safeArray(p.peaks).slice(0, clamp(Math.round(p.peakCount) || 4, 3, 5));
  const n = Math.max(1, peaks.length);
  const W = bodyW;
  const H = bodyH - TITLE_ROW_SPACE;
  const levels = peaks.map(pk => clamp(safeNumber(pk?.level, 0), 0, 100));
  const lmax = safeMax(levels, 1);
  const topIndex = levels.indexOf(lmax);

  // 竖向:顶部留给数值与小旗,底部 cardH 是前景卡;山脚在卡片中部,让卡片压住山脚。
  const cardH = n >= 5 ? 196 : 182;
  const baseY = H - cardH * 0.45;
  const flagH = n >= 5 ? 74 : 84;
  const labelSpace = flagH + 128;
  const span = W / n;
  const numPx = n >= 5 ? 50 : 58;
  // 峰顶标注(数值 + 名称胶囊)的高度与它离峰顶的距离(小旗 + 10px),和下面的 .cp-g5-mt-label 排法一致
  const labelH = top => (top ? numPx * 1.25 + 10 + 44 : numPx + 10 + 40);
  const labelLift = top => (top ? flagH + 14 : flagH) + 10;
  // 左上角导语区(眉题胶囊 + 导语 + 说明小字;关掉导语时只有说明小字)压在第一座峰的上空:按导语实际行数估算它的底边,
  // 第一座峰的标注顶到它下面还留 18px;第一座峰太高时整组山峰(含远景)等比压低,峰与峰的高低比例不变。
  const leadW = r2(Math.min(span * 1.25, W * 0.34));
  // 导语区各块:胶囊 42、间距 16、导语每行 22px × 1.62 + 上下 2px、间距 16、说明小字 27(按偏多估,宁可多留一点)
  const leadLines = Math.max(1, Math.ceil((textWidthEm(p.lead) * 22) / Math.max(1, (leadW - 24) * 0.96)));
  const leadBottom = p.showLead ? 42 + 16 + leadLines * 22 * 1.62 + 4 + 16 + 27 : 27;
  const hMaxFull = baseY - labelSpace;
  const firstTop = topIndex === 0;
  const firstH = hMaxFull * Math.max(0.4, safeRatio(levels[0], lmax, 0.4));
  const firstRoom = baseY - labelLift(firstTop) - labelH(firstTop) - (leadBottom + 18);
  const hMax = hMaxFull * clamp(firstH > 0 ? firstRoom / firstH : 1, 0.5, 1);
  const halfBase = span * 0.78;
  const edge = span * 0.5;
  const mountains = peaks.map((pk, i) => {
    const h = hMax * Math.max(0.4, safeRatio(levels[i], lmax, 0.4));
    const px = n > 1 ? edge + (W - edge * 2) * (i / (n - 1)) : W / 2;
    return { i, pk, h, px: r2(px), py: r2(baseY - h), top: i === topIndex };
  });
  // 高的在后、矮的在前;按高度排名决定色调深浅。
  const byHeight = [...mountains].sort((a, b) => b.h - a.h);
  byHeight.forEach((m, r) => { m.rank = r; });
  const M = (m, [fx, fy]) => ({ x: r2(m.px + fx * halfBase), y: r2(m.py + fy * m.h) });
  const pts = (m, list) => list.map(q => { const v = M(m, q); return `${v.x},${v.y}`; }).join(' ');
  const trail = sampleSpline(mountains.map(m => ({ x: m.px, y: m.py - 6 })), 20);
  const sunTop = mountains.find(m => m.top) || mountains[0];

  // 远景:两道连绵的山脊(远处更浅、更低),折点按固定比例生成,不随机。
  const farRidge = (count, amp, lift, phase) => {
    const out = [`M 0 ${r2(baseY)}`];
    for (let k = 0; k <= count; k += 1) {
      const x = (W * k) / count;
      const wave = Math.sin(k * 1.7 + phase) * 0.5 + Math.sin(k * 0.63 + phase * 2) * 0.5;
      out.push(`L ${r2(x)} ${r2(baseY - hMax * (lift + amp * wave))}`);
    }
    out.push(`L ${r2(W)} ${r2(baseY)} Z`);
    return out.join(' ');
  };
  // 中景小山:落在主峰之间的空隙和两端,浅校色、同样分受光 / 背光两面。
  const midHills = [];
  mountains.forEach((m, i) => {
    const next = mountains[i + 1];
    if (next) midHills.push({ x: (m.px + next.px) / 2 + (i % 2 ? 22 : -22), h: hMax * (i % 2 ? 0.44 : 0.52) });
  });
  if (mountains.length) {
    midHills.push({ x: Math.max(40, mountains[0].px - span * 0.62), h: hMax * 0.36 });
    midHills.push({ x: Math.min(W - 40, mountains[mountains.length - 1].px + span * 0.6), h: hMax * 0.4 });
  }
  // 薄雾带:水平、两端渐隐,横在山腰和山脚。
  const bands = [
    { x: W * 0.04, w: W * 0.5, y: baseY - hMax * 0.3, h: 22 },
    { x: W * 0.46, w: W * 0.5, y: baseY - hMax * 0.42, h: 18 },
    { x: W * 0.18, w: W * 0.64, y: baseY - hMax * 0.16, h: 30 },
  ];

  return (
    <CampusFrame chapterIndex={p.chapterIndex}>
      <TitleRow no={p.sectionNo} title={p.title} className="campus-rise" style={enterDelay(0)} />
      <div className={`cp-g5-fig cp-g5-mt${n >= 5 ? ' is-dense' : ''}`}>
        <svg className="cp-g5-svg campus-fade" style={{ width: W, height: H, ...enterDelay(1) }} viewBox={`0 0 ${W} ${H}`} aria-hidden="true">
          <defs>
            <ToneDefs id={id} tones={['accent', 'gold']} />
            <PoleDefs id={id} />
            <linearGradient id={`${id}-fade`} x1="0" y1="0" x2="1" y2="0">
              <Stop offset="0" color="var(--theme-surface)" opacity="0" />
              <Stop offset=".06" color="var(--theme-surface)" opacity="1" />
              <Stop offset=".94" color="var(--theme-surface)" opacity="1" />
              <Stop offset="1" color="var(--theme-surface)" opacity="0" />
            </linearGradient>
            <mask id={`${id}-clip`} maskUnits="userSpaceOnUse" x="0" y="-200" width={r2(W)} height={r2(H + 200)}>
              <rect x="0" y="-200" width={r2(W)} height={r2(H + 200)} fill={`url(#${id}-fade)`} />
            </mask>
            {MT_TONES.map((t, k) => (
              <React.Fragment key={k}>
                <linearGradient id={`${id}-lit-${k}`} x1="0" y1="0" x2=".25" y2="1">
                  <Stop offset="0" color={t.litTop} />
                  <Stop offset="1" color={t.litBot} />
                </linearGradient>
                <linearGradient id={`${id}-shade-${k}`} x1="0" y1="0" x2=".2" y2="1">
                  <Stop offset="0" color={t.shadeTop} />
                  <Stop offset="1" color={t.shadeBot} />
                </linearGradient>
              </React.Fragment>
            ))}
            <linearGradient id={`${id}-far`} x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" color="var(--campus-g5-haze)" opacity=".55" />
              <Stop offset="1" color="var(--campus-g5-sky)" opacity=".2" />
            </linearGradient>
            <linearGradient id={`${id}-far2`} x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" color="var(--campus-fb-accent-pale)" opacity=".9" />
              <Stop offset="1" color="var(--campus-g5-sky)" opacity=".3" />
            </linearGradient>
            <linearGradient id={`${id}-hill-lit`} x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" color="var(--campus-fb-accent-pale)" />
              <Stop offset="1" color="var(--campus-g5-sky)" />
            </linearGradient>
            <linearGradient id={`${id}-hill-shade`} x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" color="var(--campus-g5-haze)" />
              <Stop offset="1" color="var(--campus-fb-accent-pale)" />
            </linearGradient>
            <linearGradient id={`${id}-snow`} x1="0" y1="0" x2=".3" y2="1">
              <Stop offset="0" color="var(--theme-surface)" />
              <Stop offset="1" color="var(--campus-g5-sky)" />
            </linearGradient>
            <linearGradient id={`${id}-snow-shade`} x1="0" y1="0" x2=".3" y2="1">
              <Stop offset="0" color="var(--campus-fb-accent-pale)" />
              <Stop offset="1" color="var(--campus-g5-haze)" />
            </linearGradient>
            <linearGradient id={`${id}-snow-gold`} x1="0" y1="0" x2=".3" y2="1">
              <Stop offset="0" color="var(--campus-gold-hi)" />
              <Stop offset="1" color="var(--campus-gold)" />
            </linearGradient>
            <linearGradient id={`${id}-snow-gold-shade`} x1="0" y1="0" x2=".3" y2="1">
              <Stop offset="0" color="var(--campus-gold)" />
              <Stop offset="1" color="var(--campus-gold-lo)" />
            </linearGradient>
            <linearGradient id={`${id}-mist`} x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" color="var(--theme-surface)" opacity="0" />
              <Stop offset=".55" color="var(--theme-surface)" opacity=".7" />
              <Stop offset="1" color="var(--theme-surface)" opacity=".96" />
            </linearGradient>
            <linearGradient id={`${id}-band`} x1="0" y1="0" x2="1" y2="0">
              <Stop offset="0" color="var(--theme-surface)" opacity="0" />
              <Stop offset=".3" color="var(--theme-surface)" opacity=".82" />
              <Stop offset=".7" color="var(--theme-surface)" opacity=".82" />
              <Stop offset="1" color="var(--theme-surface)" opacity="0" />
            </linearGradient>
            <radialGradient id={`${id}-sun`} cx=".5" cy=".5" r=".5">
              <Stop offset="0" color="var(--campus-gold-hi)" opacity=".95" />
              <Stop offset=".4" color="var(--campus-gold-hi)" opacity=".42" />
              <Stop offset="1" color="var(--campus-gold-hi)" opacity="0" />
            </radialGradient>
            <radialGradient id={`${id}-tip`} cx=".5" cy=".5" r=".5">
              <Stop offset="0" color="var(--theme-surface)" opacity=".95" />
              <Stop offset=".35" color="var(--campus-gold-hi)" opacity=".6" />
              <Stop offset="1" color="var(--campus-gold-hi)" opacity="0" />
            </radialGradient>
            <filter id={`${id}-soft`} x="-10%" y="-200%" width="120%" height="500%"><feGaussianBlur stdDeviation="7" /></filter>
          </defs>

          {/* 最高峰身后的一轮光晕与同心光环 */}
          {sunTop && <circle cx={sunTop.px} cy={r2(sunTop.py + sunTop.h * 0.12)} r={r2(Math.min(span * 0.72, 300))} fill={`url(#${id}-sun)`} />}
          {sunTop && <circle cx={sunTop.px} cy={r2(sunTop.py + sunTop.h * 0.12)} r={r2(Math.min(span * 0.5, 210))} fill="none" stroke="var(--campus-gold-line)" strokeWidth="1.5" strokeDasharray="2 8" strokeLinecap="round" />}

          <g mask={`url(#${id}-clip)`}>
            {/* 远景两道山脊 */}
            <path d={farRidge(14, 0.12, 0.62, 0.4)} fill={`url(#${id}-far)`} />
            <path d={farRidge(10, 0.1, 0.4, 1.9)} fill={`url(#${id}-far2)`} />
            {/* 中景小山 */}
            {midHills.map((q, k) => {
              const top = { x: r2(q.x), y: r2(baseY - q.h) };
              const w = q.h * 1.35;
              const ridgeFoot = { x: r2(q.x + w * 0.12), y: r2(baseY + 40) };
              return (
                <g key={`h${k}`}>
                  <polygon points={`${top.x},${top.y} ${r2(q.x - w)},${r2(baseY + 40)} ${ridgeFoot.x},${ridgeFoot.y}`} fill={`url(#${id}-hill-lit)`} />
                  <polygon points={`${top.x},${top.y} ${ridgeFoot.x},${ridgeFoot.y} ${r2(q.x + w * 0.95)},${r2(baseY + 40)}`} fill={`url(#${id}-hill-shade)`} />
                  <polyline points={`${r2(q.x - w * 0.5)},${r2(baseY - q.h * 0.5)} ${top.x},${top.y} ${ridgeFoot.x},${ridgeFoot.y}`} fill="none" stroke="var(--theme-surface)" strokeOpacity=".8" strokeWidth="1.5" strokeLinejoin="round" />
                </g>
              );
            })}
            {/* 山腰后方的一道薄雾 */}
            <rect x={r2(bands[1].x)} y={r2(bands[1].y)} width={r2(bands[1].w)} height={bands[1].h} rx={bands[1].h / 2} fill={`url(#${id}-band)`} filter={`url(#${id}-soft)`} />

            {/* 主峰:高的先画(在后),矮的后画(在前) */}
            {byHeight.map(m => {
              const tone = Math.min(2, m.rank);
              const cap = capShape(m.top ? 0.34 : 0.24);
              const litFace = [...OUT_L, ...[...RIDGE].reverse().slice(0, -1)];
              const shadeFace = [...RIDGE, ...[...OUT_R].reverse().slice(0, -1)];
              return (
                <g key={m.i}>
                  <polygon points={pts(m, shadeFace)} fill={`url(#${id}-shade-${tone})`} />
                  <polygon points={pts(m, litFace)} fill={`url(#${id}-lit-${tone})`} />
                  {FACETS.map(([list, kind, op], k) => (
                    <polygon key={k} points={pts(m, list)} fill={FACET_FILL[kind]} fillOpacity={op} />
                  ))}
                  {CREASES.map(([list, kind, op, sw], k) => (
                    <polyline key={k} points={pts(m, list)} fill="none" stroke={kind === 'white' ? 'var(--theme-surface)' : 'var(--theme-ink)'} strokeOpacity={op} strokeWidth={sw} strokeLinejoin="round" strokeLinecap="round" />
                  ))}
                  <polygon points={pts(m, cap.shade)} fill={`url(#${id}-${m.top ? 'snow-gold-shade' : 'snow-shade'})`} />
                  <polygon points={pts(m, cap.lit)} fill={`url(#${id}-${m.top ? 'snow-gold' : 'snow'})`} />
                  {/* 受光一侧的轮廓高光 + 主山脊高光 */}
                  <polyline points={pts(m, OUT_L.slice(0, 4))} fill="none" stroke="var(--theme-surface)" strokeOpacity=".75" strokeWidth="2" strokeLinejoin="round" />
                  <polyline points={pts(m, RIDGE.slice(0, 3))} fill="none" stroke="var(--theme-surface)" strokeOpacity=".5" strokeWidth="1.6" strokeLinejoin="round" />
                </g>
              );
            })}

            {/* 山腰前方的薄雾与山脚雾气 */}
            {[bands[0], bands[2]].map((b, k) => (
              <rect key={`b${k}`} x={r2(b.x)} y={r2(b.y)} width={r2(b.w)} height={b.h} rx={b.h / 2} fill={`url(#${id}-band)`} filter={`url(#${id}-soft)`} />
            ))}
            <rect x="0" y={r2(baseY - hMax * 0.22)} width={r2(W)} height={r2(H - baseY + hMax * 0.22)} fill={`url(#${id}-mist)`} />
          </g>

          {/* 串起峰顶的暖金虚线 */}
          <path d={polyPath(trail)} fill="none" stroke="var(--campus-gold)" strokeWidth="3" strokeDasharray="3 10" strokeLinecap="round" />
          {sunTop && <circle cx={sunTop.px} cy={sunTop.py} r="46" fill={`url(#${id}-tip)`} />}
          {mountains.map(m => <FlagMark key={m.i} id={id} x={m.px} y={m.py} h={m.top ? flagH + 14 : flagH} gold={m.top} scale={m.top ? 1.45 : 1.2} />)}
          <Sparkles points={sunTop ? [[r2(sunTop.px - span * 0.32), r2(sunTop.py - 40), 12, 'star', 'gold'], [r2(sunTop.px + span * 0.34), r2(sunTop.py + 20), 9, 'star', 'gold'], [r2(sunTop.px + span * 0.22), r2(sunTop.py - 80), 6, 'dot', 'gold']] : []} />
        </svg>

        {p.showLead && (
          <div className="cp-g5-mt-lead cp-g5-lead campus-rise" style={{ width: leadW, ...enterDelay(2) }}>
            <KickerChip text={p.kicker} />
            <p className="cp-g5-lead-text">{p.lead}</p>
            <div className="cp-g5-mt-note">
              <div className="cp-g5-mt-note-mark" aria-hidden="true" />
              <div>{p.note}</div>
            </div>
          </div>
        )}
        {!p.showLead && (
          <div className="cp-g5-mt-note campus-rise" style={enterDelay(1)}>
            <div className="cp-g5-mt-note-mark" aria-hidden="true" />
            <div>{p.note}</div>
          </div>
        )}

        {mountains.map(m => (
          <div key={m.i} className={`cp-g5-mt-label campus-rise${m.top ? ' is-top' : ''}`} style={{ left: m.px, top: r2(m.py - (m.top ? flagH + 14 : flagH) - 10), '--cp-g5-mt-num': `${numPx}px`, ...enterDelay(3 + m.i) }}>
            <div className="cp-g5-mt-figure">
              <div className="cp-g5-mt-num">{m.pk?.value}</div>
              <div className="cp-g5-mt-unit">{m.pk?.unit}</div>
            </div>
            <div className="cp-g5-mt-name">
              <div className="cp-g5-mt-name-shape" aria-hidden="true" />
              <div>{m.pk?.name}</div>
            </div>
          </div>
        ))}

        <div className="cp-g5-mt-cards" style={{ gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` }}>
          {mountains.map(m => (
            <div key={m.i} className={`cp-g5-mt-card cp-g5-glass campus-rise${m.top ? ' is-gold' : ''}`} style={enterDelay(6 + m.i)}>
              <div className="cp-g5-mt-card-head">
                <NoSeal no={m.pk?.no} gold={m.top} />
                <h3 className="cp-g5-mt-card-title">{m.pk?.title}</h3>
              </div>
              <p className="cp-g5-mt-card-desc">{m.pk?.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </CampusFrame>
  );
}

MountainPeaks.META = {
  id: 'mountain-peaks',
  label: '特色 · 层叠山峰',
  roles: ['trend', 'result', 'metrics'],
  defaults: DEFAULTS,
  copyBudgets: { title: 22, note: 18, kicker: 6, lead: 40, 'peaks[].no': 2, 'peaks[].name': 6, 'peaks[].value': 5, 'peaks[].unit': 3, 'peaks[].title': 8, 'peaks[].desc': 26 },
  numberBounds: {
    'peaks[].level': { min: 0, max: 100, semantics: 'percent' },
  },
  controls: [
    { ...CHAPTER_CONTROL, default: 3 },
    { key: 'showLead', type: 'toggle', label: '显示导语', default: true, description: '在左上方(第一座山峰上空)显示眉题胶囊与一段导语。' },
    { key: 'peakCount', type: 'number', label: '山峰数量', default: 4, min: 3, max: 5, description: '山峰与前景说明卡的数量;峰高由 level(0–100)决定,最高的一座用暖金雪顶与暖金旗强调。' },
  ],
};
