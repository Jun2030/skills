// 指标曲线小图网格:2–6 张原生折线小图(2×1、3×1、2×2、3×2 自动排),每张有子图号、小标题、单位、y 轴刻度,
// 1–3 条系列共用顶部一个图例;主系列带浅色面积与终点高亮,终值显示在小图右上角。
// 适合「损失 / 精度随训练轮次变化」「不同设置下的指标曲线」。各小图共用同一组横轴取值(points[].label),
// 第 a 张图的三条系列读 points 里的 a1 / a2 / a3,第 b 张读 b1 / b2 / b3,以此类推。
// 折线是 SVG,刻度、横轴取值、终值、图例都是 HTML 文本。
import React from 'react';
import { useThemeStyle, enterDelay } from '../../../shared/style.jsx';
import { safeArray, safeNumber, safeRatio, clamp } from '../../../chart-safety.mjs';
import { CampusFrame, TitleRow, ConclusionBar, CHAPTER_CONTROL } from '../kit/chrome.jsx';
import { LabelRow, ChartLegend } from '../kit/parts.jsx';
import { useDataStyle, countOf, compactNumber, niceRange } from '../kit/data.jsx';

const CHART_KEYS = ['a', 'b', 'c', 'd', 'e', 'f'];

const DEFAULTS = {
  chapterIndex: 4,
  chartCount: 4,
  seriesCount: 3,
  pointCount: 11,
  yAxis: 'auto',
  showConclusion: true,
  sectionNo: '4.2',
  title: '训练过程中的损失与指标曲线',
  gridLabel: '训练曲线',
  gridNote: '横轴：训练轮次（k）· 示例数据',
  series: [
    { name: '完整模型' },
    { name: '去掉 SSIM' },
    { name: '去掉 Smooth' },
  ],
  charts: [
    { tag: '(a)', title: '总损失 L', unit: '无量纲', decimals: 2 },
    { tag: '(b)', title: '光度一致性损失', unit: '无量纲', decimals: 2 },
    { tag: '(c)', title: '验证集 overall', unit: 'mm · 越低越好', decimals: 3 },
    { tag: '(d)', title: '验证集 f-score', unit: '% · 越高越好', decimals: 2 },
    { tag: '(e)', title: '平滑损失', unit: '无量纲', decimals: 3 },
    { tag: '(f)', title: 'SSIM 损失', unit: '无量纲', decimals: 3 },
  ],
  points: [
    { label: '0', a1: 2.8, a2: 2.8, a3: 2.8, b1: 1.9, b2: 1.9, b3: 1.9, c1: 2.6, c2: 2.6, c3: 2.6, d1: 18, d2: 18, d3: 18, e1: 0.42, e2: 0.42, e3: 0.42, f1: 0.52, f2: 0.52, f3: 0.52 },
    { label: '20', a1: 2.19, a2: 2.33, a3: 2.27, b1: 1.44, b2: 1.54, b3: 1.49, c1: 2.283, c2: 2.371, c3: 2.326, d1: 28.12, d2: 25.17, d3: 26.69, e1: 0.32, e2: 0.336, e3: 0.366, f1: 0.412, f2: 0.456, f3: 0.425 },
    { label: '40', a1: 1.65, a2: 1.88, a3: 1.78, b1: 1.06, b2: 1.22, b3: 1.13, c1: 1.99, c2: 2.143, c3: 2.067, d1: 33.83, d2: 29.32, d3: 31.64, e1: 0.239, e2: 0.262, e3: 0.313, f1: 0.32, f2: 0.396, f3: 0.341 },
    { label: '60', a1: 1.38, a2: 1.64, a3: 1.52, b1: 0.87, b2: 1.05, b3: 0.95, c1: 1.838, c2: 2.021, c3: 1.931, d1: 39.72, d2: 33.92, d3: 36.87, e1: 0.201, e2: 0.225, e3: 0.285, f1: 0.275, f2: 0.365, f3: 0.299 },
    { label: '80', a1: 1.11, a2: 1.37, a3: 1.26, b1: 0.68, b2: 0.87, b3: 0.77, c1: 1.68, c2: 1.887, c3: 1.787, d1: 42.75, d2: 36.41, d3: 39.6, e1: 0.164, e2: 0.187, e3: 0.255, f1: 0.231, f2: 0.333, f3: 0.256 },
    { label: '100', a1: 0.99, a2: 1.25, a3: 1.14, b1: 0.6, b2: 0.79, b3: 0.69, c1: 1.608, c2: 1.82, c3: 1.72, d1: 46.22, d2: 39.36, d3: 42.76, e1: 0.15, e2: 0.171, e3: 0.241, f1: 0.213, f2: 0.318, f3: 0.238 },
    { label: '120', a1: 0.83, a2: 1.08, a3: 0.98, b1: 0.5, b2: 0.68, b3: 0.58, c1: 1.513, c2: 1.733, c3: 1.631, d1: 47.63, d2: 40.71, d3: 44.1, e1: 0.131, e2: 0.149, e3: 0.222, f1: 0.189, f2: 0.299, f3: 0.213 },
    { label: '140', a1: 0.77, a2: 1.0, a3: 0.91, b1: 0.47, b2: 0.63, b3: 0.54, c1: 1.471, c2: 1.689, c3: 1.589, d1: 49.47, d2: 42.42, d3: 45.83, e1: 0.125, e2: 0.141, e3: 0.213, f1: 0.181, f2: 0.29, f3: 0.203 },
    { label: '160', a1: 0.69, a2: 0.91, a3: 0.83, b1: 0.42, b2: 0.58, b3: 0.49, c1: 1.421, c2: 1.639, c3: 1.542, d1: 50.36, d2: 43.37, d3: 46.71, e1: 0.116, e2: 0.13, e3: 0.202, f1: 0.169, f2: 0.28, f3: 0.191 },
    { label: '180', a1: 0.66, a2: 0.86, a3: 0.78, b1: 0.4, b2: 0.55, b3: 0.47, c1: 1.396, c2: 1.61, c3: 1.516, d1: 51.39, d2: 44.42, d3: 47.7, e1: 0.114, e2: 0.125, e3: 0.196, f1: 0.165, f2: 0.275, f3: 0.186 },
    { label: '200', a1: 0.62, a2: 0.81, a3: 0.74, b1: 0.38, b2: 0.52, b3: 0.44, c1: 1.37, c2: 1.58, c3: 1.49, d1: 51.98, d2: 45.1, d3: 48.3, e1: 0.11, e2: 0.12, e3: 0.19, f1: 0.16, f2: 0.27, f3: 0.18 },
    { label: '220', a1: 0.64, a2: 0.83, a3: 0.76, b1: 0.4, b2: 0.53, b3: 0.45, c1: 1.382, c2: 1.59, c3: 1.501, d1: 52.32, d2: 45.37, d3: 48.6, e1: 0.113, e2: 0.123, e3: 0.192, f1: 0.164, f2: 0.273, f3: 0.183 },
  ],
  conclusionLabel: '曲线解读',
  conclusion: '完整模型的各项损失下降最快、收敛值最低，去掉 SSIM 对验证集指标的影响最大。',
};

const STYLES = [
  { tone: 'var(--theme-accent)', shape: 'line', cls: 'is-a' },
  { tone: 'var(--campus-tone-4)', shape: 'line', cls: 'is-b' },
  { tone: 'var(--campus-tone-2)', shape: 'dashed', cls: 'is-c' },
];

/** 小图数量 → 列数:2、3 张排一行,4 张 2×2,5–6 张 3×2。 */
const colsFor = n => (n <= 3 ? n : n === 4 ? 2 : 3);

const CSS = `
.cp-g3-cg-bar{flex:none;display:flex;align-items:center;gap:28px;margin:-4px 0 18px;}
.cp-g3-cg-bar .campus-label-row{flex:1;min-width:0;}
.cp-g3-cg-legend{flex:none;padding:10px 22px;border-radius:999px;background:var(--theme-surface);box-shadow:var(--campus-shadow);}
.cp-g3-cg-legend .campus-legend-name{font-size:20px;color:var(--theme-ink);}
.cp-g3-cg-legend .campus-legend-swatch.is-line,.cp-g3-cg-legend .campus-legend-swatch.is-dashed{width:30px;}
.cp-g3-cg{flex:1;min-height:0;display:grid;gap:22px 24px;}
.cp-g3-cg-card{min-width:0;min-height:0;display:flex;flex-direction:column;padding:18px 22px 14px 20px;}
.cp-g3-cg-head{flex:none;display:flex;align-items:center;gap:12px;min-width:0;}
.cp-g3-cg-tag{flex:none;display:flex;align-items:center;height:32px;padding:0 12px;border-radius:9px 9px 9px 3px;background:var(--campus-fill);color:var(--theme-on-accent);font-family:var(--theme-font-serif);font-weight:700;font-size:19px;line-height:1;box-shadow:0 4px 10px rgb(var(--theme-accent-rgb) / .26);font-variant-numeric:lining-nums;}
.cp-g3-cg-titles{flex:1;min-width:0;display:flex;align-items:baseline;flex-wrap:wrap;gap:2px 12px;}
.cp-g3-cg-title{font-size:22px;line-height:1.3;font-weight:700;color:var(--theme-ink);}
.cp-g3-cg-unit{font-size:18px;line-height:1.3;color:var(--theme-faint);white-space:nowrap;}
.cp-g3-cg-end{flex:none;display:flex;align-items:center;gap:8px;height:34px;padding:0 14px 0 10px;border-radius:999px;background:var(--campus-accent-tint);color:var(--theme-accent);font-family:var(--theme-font-serif);font-weight:700;font-size:21px;line-height:1;white-space:nowrap;font-variant-numeric:lining-nums tabular-nums;}
.cp-g3-cg-end-dot{flex:none;width:10px;height:10px;border-radius:50%;background:var(--campus-fill);box-shadow:0 0 0 3px var(--theme-surface);}
.cp-g3-cg-plot{position:relative;flex:1;min-height:0;margin:20px 16px 38px 62px;}
.cp-g3-cg-plot svg{position:absolute;inset:0;width:100%;height:100%;overflow:visible;}
.cp-g3-cg-line{fill:none;stroke-width:3;stroke-linejoin:round;stroke-linecap:round;vector-effect:non-scaling-stroke;}
.cp-g3-cg-line.is-a{stroke:var(--theme-accent);stroke-width:4.5;}
.cp-g3-cg-line.is-b{stroke:var(--campus-tone-4);}
.cp-g3-cg-line.is-c{stroke:var(--campus-tone-2);stroke-dasharray:8 6;}
.cp-g3-cg-area{fill:rgb(var(--theme-accent-rgb) / .08);}
.cp-g3-cg-dot{position:absolute;width:12px;height:12px;margin:-6px 0 0 -6px;border-radius:50%;background:var(--theme-surface);border:3px solid var(--theme-accent);}
.cp-g3-cg-dot.is-b{border-color:var(--campus-tone-4);width:10px;height:10px;margin:-5px 0 0 -5px;border-width:2.5px;}
.cp-g3-cg-dot.is-c{border-color:var(--campus-tone-2);width:10px;height:10px;margin:-5px 0 0 -5px;border-width:2.5px;}
.cp-g3-cg-dot.is-end{width:20px;height:20px;margin:-10px 0 0 -10px;border:3.5px solid var(--theme-surface);background:var(--campus-fill);box-shadow:0 0 0 6px rgb(var(--theme-accent-rgb) / .16),0 4px 10px rgb(var(--theme-accent-rgb) / .3);}
.cp-g3-cg-x{position:absolute;top:calc(100% + 12px);transform:translateX(-50%);font-size:18px;line-height:1;color:var(--theme-muted);white-space:nowrap;font-variant-numeric:lining-nums;}
.cp-g3-cg-plot .campus-grid-tick{right:calc(100% + 12px);}
/* 3 列时卡片窄:收紧左右留白 */
.cp-g3-cg.is-c3 .cp-g3-cg-card{padding:16px 18px 12px 16px;}
.cp-g3-cg.is-c3 .cp-g3-cg-plot{margin:16px 12px 36px 58px;}
.cp-g3-cg.is-c3 .cp-g3-cg-title{font-size:21px;}
.cp-g3-cg.is-r2.is-c3 .cp-g3-cg-plot{margin-top:14px;}
`;

function MiniChart({ chart, letter, points, series, zero, index, steps = 4 }) {
  const keys = series.map((_, s) => `${letter}${s + 1}`);
  const values = points.flatMap(pt => keys.map(k => safeNumber(pt?.[k], 0)));
  // 上下各留数据跨度 6% 的余量:最小 / 最大值不正好落在坐标轴或顶线上
  const { min, max, ticks, labels } = niceRange(values, { steps, zero, pad: 0.06 });
  const span = max - min;
  const last = points.length - 1;
  const xOf = i => clamp(safeRatio(i, last, 0.5) * 100, 0, 100);
  const yOf = v => clamp(100 - safeRatio(safeNumber(v, 0) - min, span, 0.5) * 100, 0, 100);
  const lines = keys.map(k => points.map((pt, i) => ({ x: xOf(i), y: yOf(pt?.[k]) })));
  const poly = pts => pts.map(pt => `${pt.x},${pt.y}`).join(' ');
  const base = yOf(clamp(0, min, max));
  const area = lines[0]?.length > 1 ? `${lines[0][0].x},${base} ${poly(lines[0])} ${lines[0][last].x},${base}` : '';
  // 横轴取值多时隔一个显示(首尾总显示)
  const step = points.length > 8 ? 2 : 1;
  const showDots = points.length <= 8;
  // ChartGrid 按 0..max 定位刻度,这里把刻度换算成相对 min 的偏移后交给它,显示的文字仍是原刻度值
  const gridTicks = ticks.map(t => Number((t - min).toFixed(6)));
  const endValue = points.length ? points[last]?.[keys[0]] : null;
  return (
    <section className="cp-g3-cg-card campus-card campus-rise" style={enterDelay(2 + index)}>
      <div className="cp-g3-cg-head">
        {chart?.tag ? <div className="cp-g3-cg-tag">{chart.tag}</div> : null}
        <div className="cp-g3-cg-titles">
          <div className="cp-g3-cg-title">{chart?.title}</div>
          {chart?.unit ? <div className="cp-g3-cg-unit">{chart.unit}</div> : null}
        </div>
        {endValue != null && (
          <div className="cp-g3-cg-end">
            <div className="cp-g3-cg-end-dot" aria-hidden="true" />
            <div>{compactNumber(endValue, chart?.decimals)}</div>
          </div>
        )}
      </div>
      <div className="cp-g3-cg-plot">
        <div className="campus-grid" aria-hidden="true">
          {gridTicks.map((t, i) => {
            const y = clamp(100 - safeRatio(t, span, 0) * 100, 0, 100);
            return (
              <React.Fragment key={i}>
                <div className={`campus-grid-line${i === 0 ? ' is-base' : ''}`} style={{ top: `${y}%` }} />
                <div className="campus-grid-tick" style={{ top: `${y}%` }}>{Math.abs(ticks[i]) >= 1e5 ? compactNumber(ticks[i], 0) : labels[i]}</div>
              </React.Fragment>
            );
          })}
        </div>
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          {area && <polygon className="cp-g3-cg-area campus-fade" style={enterDelay(4 + index)} points={area} />}
          {lines.slice().reverse().map((pts, r) => {
            const s = lines.length - 1 - r;
            return <polyline className={`cp-g3-cg-line ${STYLES[s].cls} campus-fade`} style={enterDelay(3 + index)} points={poly(pts)} key={s} />;
          })}
        </svg>
        {lines.slice().reverse().map((pts, r) => {
          const s = lines.length - 1 - r;
          return pts.map((pt, i) => {
            const end = s === 0 && i === last;
            if (!showDots && !end) return null;
            return <div className={`cp-g3-cg-dot ${STYLES[s].cls}${end ? ' is-end' : ''} campus-fade`} style={{ left: `${pt.x}%`, top: `${pt.y}%`, ...enterDelay(4 + index) }} key={`${s}-${i}`} />;
          });
        })}
        {points.map((pt, i) => (i % step === 0 || i === last) && !(step > 1 && i === last - 1 && last % step !== 0) ? (
          <div className="cp-g3-cg-x" style={{ left: `${xOf(i)}%` }} key={i}>{pt?.label}</div>
        ) : null)}
      </div>
    </section>
  );
}

export function CurveGrid(props) {
  useDataStyle();
  useThemeStyle('campus-curve-grid-style', CSS);
  const p = { ...DEFAULTS, ...props };
  const charts = safeArray(p.charts).slice(0, countOf(p.chartCount, 2, 6));
  const series = safeArray(p.series).slice(0, countOf(p.seriesCount, 1, 3));
  const points = safeArray(p.points).slice(0, countOf(p.pointCount, 4, 12));
  const cols = colsFor(charts.length);
  const rows = Math.ceil(charts.length / Math.max(1, cols));
  const legend = series.map((s, i) => ({ name: s?.name, tone: STYLES[i].tone, shape: STYLES[i].shape }));
  return (
    <CampusFrame chapterIndex={p.chapterIndex}>
      <TitleRow no={p.sectionNo} title={p.title} className="campus-rise" style={enterDelay(0)} />
      <div className="cp-g3-cg-bar campus-rise" style={enterDelay(1)}>
        <LabelRow label={p.gridLabel} note={p.gridNote} />
        <ChartLegend items={legend} className="cp-g3-cg-legend" />
      </div>
      <div
        className={`cp-g3-cg is-c${cols} is-r${rows}`}
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0,1fr))`, gridTemplateRows: `repeat(${rows}, minmax(0,1fr))` }}
      >
        {charts.map((chart, i) => (
          <MiniChart chart={chart} letter={CHART_KEYS[i]} points={points} series={series} zero={p.yAxis === 'zero'} index={i} steps={rows === 1 ? 5 : 4} key={i} />
        ))}
      </div>
      {p.showConclusion && <ConclusionBar label={p.conclusionLabel} text={p.conclusion} className="campus-rise" style={enterDelay(9)} />}
    </CampusFrame>
  );
}

const BOUND = { min: -1000000000, max: 1000000000, semantics: 'magnitude' };
const POINT_BOUNDS = Object.fromEntries(CHART_KEYS.flatMap(letter => [1, 2, 3].map(s => [`points[].${letter}${s}`, BOUND])));

CurveGrid.META = {
  id: 'curve-grid',
  label: '曲线网格 · 2–6 张指标小图共用图例',
  roles: ['trend', 'metrics', 'result'],
  defaults: DEFAULTS,
  copyBudgets: {
    gridLabel: 8, gridNote: 22, 'series[].name': 8, 'charts[].title': 10, 'charts[].unit': 10, 'charts[].tag': 4,
    'points[].label': 5, conclusion: 52,
  },
  numberBounds: {
    ...POINT_BOUNDS,
    'charts[].decimals': { min: 0, max: 4, semantics: 'count' },
  },
  controls: [
    { ...CHAPTER_CONTROL, default: 4 },
    { key: 'chartCount', type: 'number', label: '小图数量', default: 4, min: 2, max: 6, countArrays: ['charts'], description: '曲线小图的张数:2、3 张排一行,4 张 2×2,5–6 张 3×2。第 1 张图读 points 里的 a1 / a2 / a3,第 2 张读 b1 / b2 / b3,依次到第 6 张的 f1 / f2 / f3。' },
    { key: 'seriesCount', type: 'number', label: '系列数', default: 3, min: 1, max: 3, countArrays: ['series'], description: '每张小图的曲线条数(系列名称在 series 里,共用顶部图例):第 1 条校色实线带面积,第 2 条中性灰实线,第 3 条浅校色虚线。' },
    { key: 'pointCount', type: 'number', label: '数据点数', default: 11, min: 4, max: 12, countArrays: ['points'], description: '横轴的取值个数(各小图共用 points[].label);超过 8 个时横轴标签隔一个显示、只画主系列终点。' },
    { key: 'yAxis', type: 'radio', label: '纵轴起点', default: 'auto', options: [{ value: 'auto', label: '按数据' }, { value: 'zero', label: '从 0 开始' }], description: '按数据:纵轴下限取数据最小值附近的整格刻度(精度类曲线集中在高位时不被压扁);从 0 开始:纵轴总包含 0。' },
    { key: 'showConclusion', type: 'toggle', label: '底部结论条', default: true, description: '页面底部的校色结论条。' },
  ],
};
