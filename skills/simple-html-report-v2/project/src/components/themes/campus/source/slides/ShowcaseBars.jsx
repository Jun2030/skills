// 立体柱状图(特色页):一侧是 3–6 根立体柱(等轴测方柱沿对角线逐级后退,或一排玻璃圆柱),重点柱用点缀金 + 皇冠;
// 另一侧是双段标签、结论标题、导语和 2–4 条指标条。
// 立体面、玻璃、地台、投影都画在 SVG 里(导出时转成图片),数值、类目名、单位都是叠在上面的 HTML 文本。
// 几何按外壳的正文区尺寸计算(useCampusLayout),四种导航下都不变形。
import React from 'react';
import { useThemeStyle, enterDelay } from '../../../shared/style.jsx';
import { safeArray, safeNumber, safeMax, safeMin, safeRatio, clamp } from '../../../chart-safety.mjs';
import { CampusFrame, TitleRow, CHAPTER_CONTROL, TITLE_ROW_SPACE, useCampusLayout } from '../kit/chrome.jsx';
import { useFeatureAStyle, LinearGrad, RadialGrad, BlurFilter, CrownIcon, MetricStrip, TagPair } from '../kit/feature-a.jsx';

const DEFAULTS = {
  chapterIndex: 3,
  barStyle: 'iso',
  chartSide: 'left',
  barCount: 4,
  highlightIndex: 4,
  metricCount: 3,
  sectionNo: '3.5',
  title: '报考人数呈增长趋势',
  unit: '万人',
  unitNote: '管理会计报考人数 · 单位：万人',
  bars: [
    { label: '80 年代初期', value: 4 },
    { label: '90 年代初期', value: 8 },
    { label: '00 年代初期', value: 11 },
    { label: '如今', value: 20 },
    { label: '示例阶段 E', value: 24 },
    { label: '示例阶段 F', value: 28 },
  ],
  kicker: '研究内容',
  tag: '报考趋势',
  heading: '四十年间报考人数增长约 5 倍',
  lead: '从 80 年代初期约 4 万人，到近一两年超过 20 万人；企业开始重视管理会计后，大量从业者转型进入这一赛道。',
  metrics: [
    { value: '2.5', unit: '倍', label: '薪资水平', note: '近十年国内收入提高' },
    { value: '1.5', unit: '倍', label: '报考人数', note: '同期提升幅度' },
    { value: '2.1', unit: '倍', label: '分科选择人数', note: '大学分科时选择该方向' },
    { value: '1.3', unit: '倍', label: '在册人数', note: '同期对比' },
  ],
};

const CSS = `
.cp-sb{position:relative;flex:1;min-height:0;display:flex;gap:44px;}
.cp-sb.is-right{flex-direction:row-reverse;}
.cp-sb-stage{position:relative;flex:none;}
.cp-sb-stage svg{position:absolute;overflow:visible;}
.cp-sb-layer{position:absolute;inset:0;}
.cp-sb-unit{position:absolute;left:8px;top:0;display:flex;align-items:center;gap:12px;font-size:19px;letter-spacing:.06em;color:var(--theme-faint);}
.cp-sb-unit-mark{flex:none;width:28px;height:5px;border-radius:3px;background:var(--campus-fill);}

/* 每根柱子的配色:--k 是校色占比(其余是钢灰),越靠后的柱子校色越足;重点柱整根换成点缀金 */
.cp-sb-bar{position:absolute;
  --cp-steel-hi:color-mix(in srgb,var(--campus-accent-steel) 52%,rgb(255 255 255));
  --cp-steel-lo:color-mix(in srgb,var(--campus-accent-steel) 66%,rgb(0 0 0));
  --cp-top:color-mix(in srgb,var(--campus-accent-pale) var(--k),color-mix(in srgb,var(--campus-accent-steel) 30%,rgb(255 255 255)));
  --cp-hi:color-mix(in srgb,var(--campus-accent-hi) var(--k),var(--cp-steel-hi));
  --cp-mid:color-mix(in srgb,var(--theme-accent) var(--k),var(--campus-accent-steel));
  --cp-lo:color-mix(in srgb,var(--campus-accent-lo) var(--k),var(--cp-steel-lo));
  --cp-deep:color-mix(in srgb,var(--campus-accent-deep) var(--k),color-mix(in srgb,var(--campus-accent-steel) 45%,rgb(0 0 0)));
  --cp-glow:rgb(var(--theme-accent-rgb) / .28);
}
.cp-sb-bar.is-gold{--cp-top:color-mix(in srgb,var(--campus-spark-hi) 70%,rgb(255 255 255));--cp-hi:var(--campus-spark-hi);--cp-mid:var(--campus-spark);--cp-lo:var(--campus-spark-lo);--cp-deep:var(--campus-spark-deep);--cp-glow:var(--campus-spark-glow);}
.cp-sb-bar svg{position:absolute;left:0;top:0;width:100%;height:100%;}

/* 数值:大号衬线数字 + 单位,浮在柱顶 */
.cp-sb-value{position:absolute;transform:translateX(-50%);display:flex;align-items:baseline;gap:4px;white-space:nowrap;color:var(--theme-accent);}
.cp-sb-value-num{font-family:var(--theme-font-serif);font-weight:700;font-size:var(--cp-sb-num,52px);line-height:1;font-variant-numeric:lining-nums;}
.cp-sb-value-unit{font-size:20px;font-weight:700;letter-spacing:.02em;}
.cp-sb-value.is-gold{color:var(--campus-spark-lo);}
.cp-sb-value.is-in{color:var(--theme-on-accent);}
.cp-sb-crown{position:absolute;transform:translateX(-50%);color:var(--campus-spark);}
.cp-sb-label{position:absolute;transform:translateX(-50%);padding:6px 16px;border-radius:999px;font-size:20px;line-height:1.25;font-weight:600;text-align:center;color:var(--theme-muted);background:rgb(255 255 255 / .82);box-shadow:0 4px 12px rgb(var(--theme-accent-rgb) / .1);white-space:nowrap;}
.cp-sb-label.is-gold{color:var(--campus-spark-deep);background:var(--campus-spark-soft);}
.cp-sb-label.is-flat{background:transparent;box-shadow:none;font-size:21px;}

/* 右侧(或左侧)文字面板 */
.cp-sb-panel{flex:1;min-width:0;display:flex;flex-direction:column;}
.cp-sb-heading{margin-top:26px;font-family:var(--theme-font-serif);font-weight:700;font-size:44px;line-height:1.24;letter-spacing:.03em;color:var(--theme-ink);text-wrap:balance;}
.cp-sb-lead{margin-top:16px;font-size:22px;line-height:1.66;color:var(--theme-muted);text-wrap:pretty;}
.cp-sb-rule{flex:none;display:flex;align-items:center;gap:8px;margin:24px 0 22px;}
.cp-sb-rule-a{width:64px;height:5px;border-radius:3px;background:var(--campus-fill);}
.cp-sb-rule-b{width:14px;height:5px;border-radius:3px;background:var(--campus-spark);}
.cp-sb-rule-c{flex:1;height:1.5px;background:var(--campus-fade-line);}
.cp-sb-metrics{flex:1;min-height:0;display:grid;grid-auto-rows:minmax(0,1fr);row-gap:18px;}
.cp-sb-metrics.is-dense{row-gap:14px;}
.cp-sb-metrics.is-dense .campus-fa-metric-value{font-size:46px;}
`;

// 柱子的入场:整根从底部长出来(campus-grow 的变换原点在元素底边)。
function IsoBar({ i, x, y, bw, dx, dy, h, k, gold, delay }) {
  const id = `cp-sb-iso-${i}`;
  const pad = 3;
  const w = bw + dx + pad * 2;
  const H = h + dy + pad * 2;
  return (
    <div className={`cp-sb-bar campus-grow${gold ? ' is-gold' : ''}`} style={{ left: x - pad, top: y - h - dy - pad, width: w, height: H, '--k': `${k}%`, ...enterDelay(delay) }}>
      <svg viewBox={`${-pad} ${-h - dy - pad} ${w} ${H}`} aria-hidden="true">
        <defs>
          <LinearGrad id={`${id}-f`} x1={0} y1={0} x2={0} y2={1} stops={[[0, 'var(--cp-hi)'], [0.55, 'var(--cp-mid)'], [1, 'var(--cp-lo)']]} />
          <LinearGrad id={`${id}-s`} x1={0} y1={0} x2={0} y2={1} stops={[[0, 'var(--cp-lo)'], [1, 'var(--cp-deep)']]} />
          <LinearGrad id={`${id}-t`} x1={0} y1={1} x2={1} y2={0} stops={[[0, 'var(--cp-top)'], [1, 'var(--cp-hi)']]} />
          <LinearGrad id={`${id}-sh`} x1={0} y1={0} x2={1} y2={0} stops={[[0, 'rgb(255 255 255 / .34)'], [1, 'rgb(255 255 255 / 0)']]} />
        </defs>
        <rect x={0} y={-h} width={bw} height={h} fill={`url(#${id}-f)`} />
        <rect x={0} y={-h} width={bw * 0.42} height={h} fill={`url(#${id}-sh)`} />
        <polygon points={`${bw},0 ${bw + dx},${-dy} ${bw + dx},${-h - dy} ${bw},${-h}`} fill={`url(#${id}-s)`} />
        <polygon points={`0,${-h} ${dx},${-h - dy} ${bw + dx},${-h - dy} ${bw},${-h}`} fill={`url(#${id}-t)`} />
        <path d={`M0 ${-h} H${bw} L${bw + dx} ${-h - dy}`} stroke="rgb(255 255 255 / .85)" strokeWidth="1.6" fill="none" />
        <path d={`M${bw} ${-h} V0`} stroke="rgb(255 255 255 / .4)" strokeWidth="1.4" fill="none" />
        <path d={`M0 ${-h} L${dx} ${-h - dy}`} stroke="rgb(255 255 255 / .55)" strokeWidth="1.2" fill="none" />
      </svg>
    </div>
  );
}

function GlassBar({ i, cx, base, top, level, rx, ry, k, gold, delay }) {
  const id = `cp-sb-glass-${i}`;
  const pad = 26;
  const w = rx * 2 + pad * 2;
  const H = base - top + ry * 2 + pad * 2;
  const vb = `${-rx - pad} ${top - ry - pad} ${w} ${H}`;
  const lh = Math.max(0, base - level);
  return (
    <div className={`cp-sb-bar campus-grow${gold ? ' is-gold' : ''}`} style={{ left: cx - rx - pad, top: top - ry - pad, width: w, height: H, '--k': `${k}%`, ...enterDelay(delay) }}>
      <svg viewBox={vb} aria-hidden="true">
        <defs>
          <LinearGrad id={`${id}-glass`} x1={0} y1={0} x2={1} y2={0} stops={[[0, 'rgb(255 255 255 / .78)'], [0.22, 'rgb(255 255 255 / .34)'], [0.6, 'rgb(255 255 255 / .2)'], [1, 'rgb(255 255 255 / .66)']]} />
          <LinearGrad id={`${id}-tint`} x1={0} y1={0} x2={0} y2={1} stops={[[0, 'rgb(var(--theme-accent-rgb) / .03)'], [1, 'rgb(var(--theme-accent-rgb) / .12)']]} />
          <LinearGrad id={`${id}-liq`} x1={0} y1={0} x2={1} y2={0} stops={[[0, 'var(--cp-lo)'], [0.26, 'var(--cp-hi)'], [0.62, 'var(--cp-mid)'], [1, 'var(--cp-deep)']]} />
          <LinearGrad id={`${id}-cap`} x1={0} y1={0} x2={1} y2={1} stops={[[0, 'var(--cp-top)'], [1, 'var(--cp-hi)']]} />
          <LinearGrad id={`${id}-hl`} x1={0} y1={0} x2={0} y2={1} stops={[[0, 'rgb(255 255 255 / .85)'], [1, 'rgb(255 255 255 / .1)']]} />
          <BlurFilter id={`${id}-blur`} std={10} />
        </defs>
        <ellipse cx={0} cy={base + 6} rx={rx * 1.3} ry={ry * 1.25} style={{ fill: 'var(--cp-glow)' }} filter={`url(#${id}-blur)`} />
        <rect x={-rx} y={top} width={rx * 2} height={base - top} fill={`url(#${id}-tint)`} />
        <rect x={-rx} y={top} width={rx * 2} height={base - top} fill={`url(#${id}-glass)`} />
        <ellipse cx={0} cy={base} rx={rx} ry={ry} fill="rgb(255 255 255 / .55)" />
        {lh > 0 && (
          <>
            <ellipse cx={0} cy={base} rx={rx} ry={ry} fill={`url(#${id}-liq)`} />
            <rect x={-rx} y={level} width={rx * 2} height={lh} fill={`url(#${id}-liq)`} />
            <ellipse cx={0} cy={level} rx={rx} ry={ry} fill={`url(#${id}-cap)`} stroke="rgb(255 255 255 / .6)" strokeWidth="1.5" />
          </>
        )}
        <rect x={-rx * 0.66} y={top + ry} width={rx * 0.17} height={Math.max(0, base - top - ry * 2)} rx={rx * 0.08} fill={`url(#${id}-hl)`} />
        <rect x={rx * 0.5} y={top + ry * 1.6} width={3} height={Math.max(0, base - top - ry * 3.2)} rx={1.5} fill="rgb(255 255 255 / .45)" />
        <path d={`M${-rx} ${top} V${base} M${rx} ${top} V${base}`} stroke="rgb(255 255 255 / .95)" strokeWidth="1.6" fill="none" />
        <ellipse cx={0} cy={top} rx={rx} ry={ry} fill="rgb(255 255 255 / .42)" stroke="rgb(255 255 255 / .98)" strokeWidth="2" />
        <ellipse cx={0} cy={top} rx={rx - 6} ry={Math.max(1, ry - 4)} fill="none" style={{ stroke: 'rgb(var(--theme-accent-rgb) / .14)' }} strokeWidth="1.5" />
      </svg>
    </div>
  );
}

export function ShowcaseBars(props) {
  useThemeStyle('campus-showcase-bars-style', CSS);
  useFeatureAStyle();
  const p = { ...DEFAULTS, ...props };
  const { bodyW, bodyH, nav } = useCampusLayout();
  const bars = safeArray(p.bars).slice(0, clamp(p.barCount, 3, 6));
  const metrics = safeArray(p.metrics).slice(0, clamp(p.metricCount, 2, 4));
  const n = Math.max(1, bars.length);
  const highlight = clamp(Math.round(safeNumber(p.highlightIndex, 0)), 0, bars.length) - 1;
  const values = bars.map(bar => Math.max(0, safeNumber(bar?.value, 0)));
  const vmax = safeMax(values, 1);
  const glass = p.barStyle === 'glass';

  // 绘图区:正文区宽度的 55%(竖栏导航下正文区更窄,按同一比例缩)。
  const W = Math.round(bodyW * (nav === 'rail' ? 0.56 : 0.575));
  const H = bodyH - TITLE_ROW_SPACE;
  // 非重点柱的校色占比:从 46% 逐级升到 100%,形成「越来越强」的递进。
  const plain = bars.map((_, i) => i).filter(i => i !== highlight);
  const tone = i => (plain.length > 1 ? Math.round(46 + 54 * safeRatio(plain.indexOf(i), plain.length - 1, 1)) : 100);
  const numSize = n >= 6 ? 40 : n === 5 ? 46 : 52;

  const items = [];
  if (!glass) {
    // 等轴测方柱:沿对角线逐级后退(越往右越高、越远),每根有正面、侧面、顶面三个明暗面。
    const padL = 24;
    const padR = 24;
    const step = (W - padL - padR) / (n - 0.1);
    const bw = Math.min(step * 0.64, 184);
    const dx = bw * 0.52;
    const dy = bw * 0.3;
    const rise = step * 0.17;
    const yb0 = H - 70;
    const valueSpace = 92 + (highlight >= 0 ? 52 : 0);
    const base = bars.map((_, i) => ({ x: padL + i * step + (step * 0.64 - bw) / 2, y: yb0 - i * rise }));
    const k = safeMin(values.map((v, i) => (v > 0 ? safeRatio(base[i].y - dy - valueSpace - 30, v, 1e9) : 1e9)), 1e9);
    const scale = Number.isFinite(k) && k < 1e9 ? k : 0;
    bars.forEach((bar, i) => {
      const h = Math.max(8, values[i] * scale);
      items.push({ bar, i, x: base[i].x, y: base[i].y, h, gold: i === highlight });
    });
    const slope = safeRatio(rise, step, 0);
    // 没有柱子时(空数组)地台按一根柱子的位置画,不读越界下标。
    const first = base[0] || { x: padL, y: yb0 };
    const last = base[base.length - 1] || first;
    const ax = first.x - 56;
    const ay = first.y + 30 + 56 * slope;
    const bx = last.x + bw + dx + 64;
    const by = last.y + 30 - (bw + dx + 64) * slope;
    const ddx = dx * 3.4;
    const ddy = dy * 3.4;
    return (
      <ShowcaseFrame p={p} W={W} H={H} metrics={metrics}>
        <svg style={{ left: 0, top: 0, width: W, height: H }} viewBox={`0 0 ${W} ${H}`} aria-hidden="true" className="campus-fade">
          <defs>
            <LinearGrad id="cp-sb-floor" x1={0} y1={1} x2={0.2} y2={0} stops={[[0, 'rgb(255 255 255 / .96)'], [0.6, 'var(--campus-accent-mist)'], [1, 'rgb(var(--theme-accent-rgb) / .02)']]} />
            <LinearGrad id="cp-sb-edge" x1={0} y1={0} x2={1} y2={0} stops={[[0, 'rgb(var(--theme-accent-rgb) / .05)'], [0.5, 'rgb(var(--theme-accent-rgb) / .4)'], [1, 'rgb(var(--theme-accent-rgb) / .05)']]} />
            <RadialGrad id="cp-sb-halo" stops={[[0, 'rgb(var(--theme-accent-rgb) / .16)'], [1, 'rgb(var(--theme-accent-rgb) / 0)']]} />
            <BlurFilter id="cp-sb-blur" std={14} />
            <BlurFilter id="cp-sb-blur-s" std={7} />
          </defs>
          <ellipse cx={(ax + bx) / 2} cy={(ay + by) / 2 - 120} rx={W * 0.52} ry={H * 0.42} fill="url(#cp-sb-halo)" />
          <polygon points={`${ax},${ay + 18} ${bx},${by + 18} ${bx + ddx},${by - ddy + 18} ${ax + ddx},${ay - ddy + 18}`} style={{ fill: 'rgb(var(--theme-accent-rgb) / .14)' }} filter="url(#cp-sb-blur)" />
          <polygon points={`${ax},${ay} ${bx},${by} ${bx + ddx},${by - ddy} ${ax + ddx},${ay - ddy}`} fill="url(#cp-sb-floor)" stroke="rgb(255 255 255 / .9)" strokeWidth="2" />
          <line x1={ax} y1={ay} x2={bx} y2={by} stroke="url(#cp-sb-edge)" strokeWidth="3" />
          {items.map(({ i, x, y, h }) => {
            const s = Math.min(h * 0.5, step * 0.7);
            const sx = s;
            const sy = -s * slope;
            return <polygon key={i} points={`${x + bw},${y} ${x + bw + dx},${y - dy} ${x + bw + dx + sx},${y - dy + sy} ${x + bw + sx},${y + sy}`} style={{ fill: 'rgb(var(--theme-accent-rgb) / .22)' }} filter="url(#cp-sb-blur-s)" />;
          })}
        </svg>
        {items.map(({ i, x, y, h, gold }) => (
          <IsoBar key={i} i={i} x={x} y={y} bw={bw} dx={dx} dy={dy} h={h} k={gold ? 100 : tone(i)} gold={gold} delay={2 + i} />
        ))}
        {items.map(({ bar, i, x, y, h, gold }) => {
          const cx = x + bw / 2 + dx / 2;
          const topY = y - h - dy;
          return (
            <React.Fragment key={i}>
              {gold && <CrownIcon className="cp-sb-crown campus-rise" size={58} style={{ left: cx, top: topY - 64 - numSize - 26, ...enterDelay(3 + i) }} />}
              <div className={`cp-sb-value campus-rise${gold ? ' is-gold' : ''}`} style={{ left: cx, top: topY - numSize - 22, '--cp-sb-num': `${numSize}px`, ...enterDelay(3 + i) }}>
                <div className="cp-sb-value-num">{bar?.value}</div>
                <div className="cp-sb-value-unit">{p.unit}</div>
              </div>
              <div className={`cp-sb-label campus-rise${gold ? ' is-gold' : ''}`} style={{ left: x + bw / 2, top: y + 16, ...enterDelay(3 + i) }}>{bar?.label}</div>
            </React.Fragment>
          );
        })}
      </ShowcaseFrame>
    );
  }

  // 玻璃圆柱:一排等高的玻璃管,管内的校色「液柱」高度对应数值,重点柱换成金色并戴皇冠。
  const padX = 20;
  const colW = (W - padX * 2) / n;
  const rx = Math.min(colW * 0.31, 78);
  const ry = rx * 0.27;
  const base = H - 66;
  const top = 112;
  const usable = base - top - ry * 2 - 8;
  return (
    <ShowcaseFrame p={p} W={W} H={H} metrics={metrics}>
      <svg style={{ left: 0, top: 0, width: W, height: H }} viewBox={`0 0 ${W} ${H}`} aria-hidden="true" className="campus-fade">
        <defs>
          <LinearGrad id="cp-sb-plinth" x1={0} y1={0} x2={1} y2={0} stops={[[0, 'rgb(var(--theme-accent-rgb) / 0)'], [0.5, 'rgb(var(--theme-accent-rgb) / .3)'], [1, 'rgb(var(--theme-accent-rgb) / 0)']]} />
          <RadialGrad id="cp-sb-halo" stops={[[0, 'rgb(var(--theme-accent-rgb) / .13)'], [1, 'rgb(var(--theme-accent-rgb) / 0)']]} />
        </defs>
        <ellipse cx={W / 2} cy={base - usable * 0.45} rx={W * 0.55} ry={H * 0.48} fill="url(#cp-sb-halo)" />
        <ellipse cx={W / 2} cy={base + 4} rx={W * 0.5} ry={ry * 1.6} fill="rgb(255 255 255 / .7)" />
        <line x1={0} y1={base + 4} x2={W} y2={base + 4} stroke="url(#cp-sb-plinth)" strokeWidth="2" />
      </svg>
      {bars.map((bar, i) => {
        const cx = padX + colW * (i + 0.5);
        const level = base - safeRatio(values[i], vmax, 0) * usable;
        const gold = i === highlight;
        const inside = base - level > numSize + 64;
        // 玻璃管较细(6 根或竖栏导航)时,管内只放数字,单位见左上角的单位说明。
        const showUnit = rx * 2 >= 112;
        return (
          <React.Fragment key={i}>
            <GlassBar i={i} cx={cx} base={base} top={top} level={level} rx={rx} ry={ry} k={gold ? 100 : tone(i)} gold={gold} delay={2 + i} />
            {gold && <CrownIcon className="cp-sb-crown campus-rise" size={64} style={{ left: cx, top: top - ry - 66, ...enterDelay(3 + i) }} />}
            <div className={`cp-sb-value campus-rise${gold ? ' is-gold' : ''}${inside ? ' is-in' : ''}`} style={{ left: cx, top: inside ? level + ry + 16 : level - ry - numSize - 14, '--cp-sb-num': `${numSize}px`, ...enterDelay(3 + i) }}>
              <div className="cp-sb-value-num">{bar?.value}</div>
              {showUnit && <div className="cp-sb-value-unit">{p.unit}</div>}
            </div>
            <div className={`cp-sb-label is-flat campus-rise${gold ? ' is-gold' : ''}`} style={{ left: cx, top: base + ry + 14, ...enterDelay(3 + i) }}>{bar?.label}</div>
          </React.Fragment>
        );
      })}
    </ShowcaseFrame>
  );
}

function ShowcaseFrame({ p, W, H, metrics, children }) {
  return (
    <CampusFrame chapterIndex={p.chapterIndex}>
      <TitleRow no={p.sectionNo} title={p.title} className="campus-rise" style={enterDelay(0)} />
      <div className={`cp-sb${p.chartSide === 'right' ? ' is-right' : ''}`}>
        <div className="cp-sb-stage" style={{ width: W, height: H }}>
          <div className="cp-sb-unit campus-rise" style={enterDelay(1)}>
            <div className="cp-sb-unit-mark" aria-hidden="true" />
            <div>{p.unitNote}</div>
          </div>
          {children}
        </div>
        <section className="cp-sb-panel">
          <TagPair soft={p.kicker} main={p.tag} className="campus-rise" style={enterDelay(2)} />
          <h3 className="cp-sb-heading campus-rise" style={enterDelay(3)}>{p.heading}</h3>
          <p className="cp-sb-lead campus-rise" style={enterDelay(4)}>{p.lead}</p>
          <div className="cp-sb-rule campus-draw" style={enterDelay(4)} aria-hidden="true"><div className="cp-sb-rule-a" /><div className="cp-sb-rule-b" /><div className="cp-sb-rule-c" /></div>
          <div className={`cp-sb-metrics${metrics.length >= 4 ? ' is-dense' : ''}`} style={{ maxHeight: metrics.length * 138 + (metrics.length - 1) * 18 }}>
            {metrics.map((m, i) => (
              <MetricStrip key={i} className="campus-rise" style={enterDelay(5 + i)} value={m?.value} unit={m?.unit} label={m?.label} note={m?.note} gold={i === 0} compact={metrics.length >= 4} />
            ))}
          </div>
        </section>
      </div>
    </CampusFrame>
  );
}

ShowcaseBars.META = {
  id: 'showcase-bars',
  label: '特色 · 立体柱状图配指标条',
  roles: ['metrics', 'trend', 'result'],
  defaults: DEFAULTS,
  copyBudgets: { heading: 26, lead: 64, unitNote: 18, 'bars[].label': 6, 'metrics[].label': 7, 'metrics[].note': 11, 'metrics[].value': 6 },
  numberBounds: {
    'bars[].value': { min: 0, max: 1000000000, semantics: 'magnitude' },
  },
  controls: [
    { ...CHAPTER_CONTROL, default: 3 },
    { key: 'barStyle', type: 'radio', label: '柱形', default: 'iso', options: [{ value: 'iso', label: '等轴测方柱' }, { value: 'glass', label: '玻璃圆柱' }], description: '等轴测方柱沿对角线逐级后退;玻璃圆柱是一排等高玻璃管,管内液柱表示数值。' },
    { key: 'chartSide', type: 'radio', label: '图表位置', default: 'left', options: [{ value: 'left', label: '左侧' }, { value: 'right', label: '右侧' }], description: '立体柱放在左侧还是右侧。' },
    { key: 'barCount', type: 'number', label: '柱子数量', default: 4, min: 3, max: 6, description: '立体柱的根数。' },
    { key: 'highlightIndex', type: 'number', label: '重点柱', default: 4, min: 0, max: 6, maxFromKey: 'barCount', description: '第几根柱子换成金色并戴皇冠;0 表示不突出。' },
    { key: 'metricCount', type: 'number', label: '指标条数', default: 3, min: 2, max: 4, description: '文字一侧的指标条数量。' },
  ],
};
