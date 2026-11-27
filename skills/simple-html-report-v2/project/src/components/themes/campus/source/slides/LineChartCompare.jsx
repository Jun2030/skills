// 多系列折线图:左侧 1–3 条折线(校色实线 / 中性灰实线 / 浅校色虚线)配图例,右侧逐条说明每个系列的终值与走势。
// 折线是 SVG,刻度、类目、数值、图例都是 HTML 文本。
import React from 'react';
import { useThemeStyle, enterDelay } from '../../../shared/style.jsx';
import { safeArray, safeNumber, safeMax, safeRatio, clamp } from '../../../chart-safety.mjs';
import { CampusFrame, TitleRow, ConclusionBar, CHAPTER_CONTROL } from '../kit/chrome.jsx';
import { LabelRow, ChartGrid, ChartLegend, niceScale } from '../kit/parts.jsx';

const DEFAULTS = {
  chapterIndex: 3,
  pointCount: 7,
  seriesCount: 3,
  showConclusion: true,
  sectionNo: '3.5',
  title: '粉丝规模增长趋势',
  chartLabel: '粉丝规模',
  chartNote: '单位：万人 · 示例数据',
  notesLabel: '系列说明',
  points: [
    { label: '2019', v1: 120, v2: 0, v3: 90 },
    { label: '2020', v1: 260, v2: 30, v3: 150 },
    { label: '2021', v1: 430, v2: 95, v3: 210 },
    { label: '2022', v1: 610, v2: 220, v3: 260 },
    { label: '2023', v1: 780, v2: 390, v3: 300 },
    { label: '2024', v1: 920, v2: 560, v3: 330 },
    { label: '2025', v1: 1050, v2: 710, v3: 350 },
    { label: '2026', v1: 1120, v2: 820, v3: 360 },
  ],
  series: [
    { name: '主账号', value: '1050 万', note: '七年增长近 9 倍，2021—2023 年增速最快。' },
    { name: '子账号合计', value: '710 万', note: '2022 年起矩阵布局后快速放量，追赶主账号。' },
    { name: '同类账号均值', value: '350 万', note: '增长趋缓，2023 年后接近停滞。' },
  ],
  conclusionLabel: '趋势判断',
  conclusion: '矩阵布局后，子账号成为新的增长来源，整体增速明显高于同类账号。',
};

const KEYS = ['v1', 'v2', 'v3'];
const STYLES = [
  { tone: 'var(--theme-accent)', shape: 'line', cls: 'is-a' },
  { tone: 'var(--campus-tone-4)', shape: 'line', cls: 'is-b' },
  { tone: 'var(--campus-tone-2)', shape: 'dashed', cls: 'is-c' },
];

const CSS = `
.cp-lc{flex:1;min-height:0;display:flex;gap:30px;}
.cp-lc-chart{flex:1;min-width:0;display:flex;flex-direction:column;padding:24px 32px 18px;}
.cp-lc-top{display:flex;align-items:center;gap:24px;}
.cp-lc-top .campus-label-row{flex:1;min-width:0;}
.cp-lc-plot{position:relative;flex:1;min-height:0;margin:40px 30px 52px 70px;}
.cp-lc-plot svg{position:absolute;inset:0;width:100%;height:100%;overflow:visible;}
.cp-lc-line{fill:none;stroke-width:4;stroke-linejoin:round;stroke-linecap:round;vector-effect:non-scaling-stroke;}
.cp-lc-line.is-a{stroke:var(--theme-accent);stroke-width:6;}
.cp-lc-line.is-b{stroke:var(--campus-tone-4);}
.cp-lc-line.is-c{stroke:var(--campus-tone-2);stroke-dasharray:10 8;}
.cp-lc-area{fill:rgb(var(--theme-accent-rgb) / .09);}
.cp-lc-dot{position:absolute;width:18px;height:18px;margin:-9px 0 0 -9px;border-radius:50%;background:var(--theme-surface);border:4px solid var(--theme-accent);}
.cp-lc-dot.is-b{border-color:var(--campus-tone-4);width:14px;height:14px;margin:-7px 0 0 -7px;}
.cp-lc-dot.is-c{border-color:var(--campus-tone-2);width:14px;height:14px;margin:-7px 0 0 -7px;}
.cp-lc-dot.is-end{background:var(--campus-fill);border:4px solid var(--theme-surface);width:28px;height:28px;margin:-14px 0 0 -14px;box-shadow:0 0 0 8px rgb(var(--theme-accent-rgb) / .16),0 6px 14px rgb(var(--theme-accent-rgb) / .35);}
.cp-lc-xlabel{position:absolute;top:calc(100% + 16px);transform:translateX(-50%);font-size:19px;color:var(--theme-muted);white-space:nowrap;font-variant-numeric:lining-nums;}
.cp-lc-side{flex:0 0 500px;display:flex;flex-direction:column;gap:20px;}
.campus[data-campus-nav="rail"] .cp-lc-side{flex-basis:460px;}
.cp-lc-notes{flex:1;min-height:0;display:grid;grid-auto-rows:minmax(0,1fr);row-gap:20px;padding-top:4px;}
.cp-lc-note{display:flex;flex-direction:column;justify-content:center;padding:16px 26px 18px 40px;}
.cp-lc-note-bar{position:absolute;left:16px;top:20px;bottom:20px;width:6px;border-radius:3px;}
.cp-lc-note-head{display:flex;align-items:baseline;justify-content:space-between;gap:16px;}
.cp-lc-note-name{font-size:22px;font-weight:700;color:var(--theme-ink);}
.cp-lc-note-value{font-family:var(--theme-font-serif);font-weight:700;font-size:40px;line-height:1;color:var(--theme-accent);white-space:nowrap;font-variant-numeric:lining-nums;}
.cp-lc-note.is-b .cp-lc-note-value,.cp-lc-note.is-c .cp-lc-note-value{color:var(--theme-muted);font-size:34px;}
.cp-lc-note-text{margin-top:10px;font-size:20px;line-height:1.56;color:var(--theme-muted);text-wrap:pretty;}
`;

export function LineChartCompare(props) {
  useThemeStyle('campus-line-chart-compare-style', CSS);
  const p = { ...DEFAULTS, ...props };
  const points = safeArray(p.points).slice(0, clamp(p.pointCount, 3, 8));
  const series = safeArray(p.series).slice(0, clamp(p.seriesCount, 2, 3));
  const keys = KEYS.slice(0, series.length);
  const all = points.flatMap(pt => keys.map(k => safeNumber(pt?.[k], 0)));
  const { max, ticks } = niceScale(safeMax(all, 1), 4);
  const last = points.length - 1;
  const xOf = i => clamp(safeRatio(i, last, 0.5) * 100, 0, 100);
  const yOf = v => clamp(100 - safeRatio(Math.max(0, safeNumber(v, 0)), max, 0) * 100, 0, 100);
  const lines = keys.map(k => points.map((pt, i) => ({ x: xOf(i), y: yOf(pt?.[k]) })));
  const poly = pts => pts.map(pt => `${pt.x},${pt.y}`).join(' ');
  const area = lines[0]?.length ? `${lines[0][0].x},100 ${poly(lines[0])} ${lines[0][lines[0].length - 1].x},100` : '';
  const legend = series.map((s, i) => ({ name: s?.name, tone: STYLES[i].tone, shape: STYLES[i].shape }));
  return (
    <CampusFrame chapterIndex={p.chapterIndex}>
      <TitleRow no={p.sectionNo} title={p.title} className="campus-rise" style={enterDelay(0)} />
      <div className="cp-lc">
        <section className="cp-lc-chart campus-card campus-rise" style={enterDelay(1)}>
          <div className="cp-lc-top">
            <LabelRow label={p.chartLabel} note={p.chartNote} />
            <ChartLegend items={legend} />
          </div>
          <div className="cp-lc-plot">
            <ChartGrid ticks={ticks} max={max} />
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
              {area && <polygon className="cp-lc-area campus-fade" style={enterDelay(4)} points={area} />}
              {lines.map((pts, s) => (
                <polyline className={`cp-lc-line ${STYLES[s].cls} campus-fade`} style={enterDelay(3 + s)} points={poly(pts)} key={s} />
              ))}
            </svg>
            {lines.slice().reverse().map((pts, r) => {
              const s = lines.length - 1 - r;
              return pts.map((pt, i) => (
                <div className={`cp-lc-dot ${STYLES[s].cls}${s === 0 && i === last ? ' is-end' : ''} campus-fade`} style={{ left: `${pt.x}%`, top: `${pt.y}%`, ...enterDelay(4 + s) }} key={`${s}-${i}`} />
              ));
            })}
            {points.map((pt, i) => (
              <div className="cp-lc-xlabel" style={{ left: `${xOf(i)}%` }} key={i}>{pt?.label}</div>
            ))}
          </div>
        </section>
        <aside className="cp-lc-side">
          <LabelRow label={p.notesLabel} className="campus-rise" style={enterDelay(2)} />
          <div className="cp-lc-notes">
            {series.map((s, i) => (
              <div className={`cp-lc-note campus-card campus-rise ${STYLES[i].cls}`} style={enterDelay(3 + i)} key={i}>
                <div className="cp-lc-note-bar" style={{ background: i === 0 ? 'var(--campus-fill-bar)' : STYLES[i].tone }} aria-hidden="true" />
                <div className="cp-lc-note-head">
                  <div className="cp-lc-note-name">{s?.name}</div>
                  <div className="cp-lc-note-value">{s?.value}</div>
                </div>
                <p className="cp-lc-note-text">{s?.note}</p>
              </div>
            ))}
          </div>
        </aside>
      </div>
      {p.showConclusion && <ConclusionBar label={p.conclusionLabel} text={p.conclusion} className="campus-rise" style={enterDelay(8)} />}
    </CampusFrame>
  );
}

LineChartCompare.META = {
  id: 'line-chart-compare',
  label: '折线图 · 多系列趋势配系列说明',
  roles: ['trend', 'metrics', 'comparison'],
  defaults: DEFAULTS,
  copyBudgets: { 'series[].note': 26, 'series[].name': 7, chartNote: 16, conclusion: 44 },
  numberBounds: {
    'points[].v1': { min: 0, max: 1000000000, semantics: 'magnitude' },
    'points[].v2': { min: 0, max: 1000000000, semantics: 'magnitude' },
    'points[].v3': { min: 0, max: 1000000000, semantics: 'magnitude' },
  },
  controls: [
    { ...CHAPTER_CONTROL, default: 3 },
    { key: 'pointCount', type: 'number', label: '数据点数', default: 7, min: 3, max: 8, description: '横轴上的时间点数量。' },
    { key: 'seriesCount', type: 'number', label: '系列数', default: 3, min: 2, max: 3, countArrays: ['series'], description: '折线条数:依次读取 points 里的 v1 / v2 / v3 三列数值,系列名称与说明在 series 里。' },
    { key: 'showConclusion', type: 'toggle', label: '底部结论条', default: true, description: '页面底部的校色结论条。' },
  ],
};
