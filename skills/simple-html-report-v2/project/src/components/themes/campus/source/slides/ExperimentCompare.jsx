// 实验对比页:左侧定量结果表(数值右对齐、本文方法行高亮、每列最优值自动加粗、表头标 ↑↓ 方向),
// 右侧同组数据的柱状图(选一列指标)或折线图(每个方法一条线,横轴是各列),也可切换为「双表并列」;底部结论条。
// 高亮与加粗都由数据决定:oursRow 指定本文方法行,columns[].better 指定每列越高越好(high)还是越低越好(low)。
// 表格数字、图上刻度、数值、图例都是 HTML 文本,SVG 只画折线。
import React from 'react';
import { useThemeStyle, enterDelay } from '../../../shared/style.jsx';
import { safeArray, safeNumber, safeMax, safeMin, safeRatio, clamp } from '../../../chart-safety.mjs';
import { CampusFrame, TitleRow, ConclusionBar, CHAPTER_CONTROL, SparkStar } from '../kit/chrome.jsx';
import { LabelRow, ChartGrid, ChartLegend, niceScale } from '../kit/parts.jsx';
import { DirArrow, useEvidenceStyle } from '../kit/evidence.jsx';

const DEFAULTS = {
  chapterIndex: 4,
  mode: 'table-chart',
  rowCount: 4,
  colCount: 3,
  oursRow: 4,
  showBars: true,
  chartType: 'bar',
  chartMetric: 3,
  showFootnote: true,
  showConclusion: true,
  sectionNo: '4.5',
  title: '对比实验：定量评估',
  methodHead: '方法',
  tableLabel: '距离度量',
  tableNote: '单位：mm · DTU 测试集',
  columns: [
    { name: 'Acc.', better: 'low', decimals: 3 },
    { name: 'Comp.', better: 'low', decimals: 3 },
    { name: 'overall', better: 'low', decimals: 3 },
    { name: '示例指标', better: 'low', decimals: 2 },
  ],
  rows: [
    { name: 'SurfaceNet', v1: 0.45, v2: 1.043, v3: 0.746, v4: 2.4 },
    { name: 'MVSNet', v1: 0.444, v2: 0.741, v3: 0.592, v4: 1.8 },
    { name: '经典光度一致性方法', v1: 1.565, v2: 1.378, v3: 1.472, v4: 3.1 },
    { name: '无监督学习方法（本文）', v1: 1.255, v2: 1.491, v3: 1.373, v4: 2.2 },
    { name: '示例方法 E', v1: 0.9, v2: 1.2, v3: 1.05, v4: 2.6 },
    { name: '示例方法 F', v1: 1.1, v2: 1.3, v3: 1.2, v4: 2.9 },
  ],
  tableBLabel: '百分比度量',
  tableBNote: '阈值 <1 mm · DTU 测试集',
  columnsB: [
    { name: 'Acc.', better: 'high', decimals: 2 },
    { name: 'Comp.', better: 'high', decimals: 2 },
    { name: 'f-score', better: 'high', decimals: 2 },
    { name: '示例指标', better: 'high', decimals: 1 },
  ],
  rowsB: [
    { name: 'SurfaceNet', v1: 75.73, v2: 59.09, v3: 66.38, v4: 40.5 },
    { name: 'MVSNet', v1: 82.93, v2: 62.71, v3: 71.42, v4: 52.0 },
    { name: '经典光度一致性方法', v1: 46.9, v2: 42.16, v3: 44.4, v4: 31.2 },
    { name: '无监督学习方法（本文）', v1: 61.54, v2: 44.98, v3: 51.98, v4: 45.6 },
    { name: '示例方法 E', v1: 60.2, v2: 50.1, v3: 54.7, v4: 38.0 },
    { name: '示例方法 F', v1: 55.0, v2: 47.3, v3: 50.9, v4: 35.4 },
  ],
  chartLabel: 'overall 对比',
  chartNote: '单位：mm · 越低越好',
  footnote: '注：加粗为各列最优值，↓ 越低越好、↑ 越高越好；高亮行为本文方法。',
  conclusionLabel: '结论',
  conclusion: '无监督方法普遍不及有监督方法，但与经典光度一致性方法相比，本文在 overall 和 f-score 两项综合指标上都更优。',
};

const KEYS = ['v1', 'v2', 'v3', 'v4'];
const LINE_TONES = ['var(--campus-tone-4)', 'var(--campus-tone-3)', 'var(--campus-tone-5)', 'var(--campus-tone-2)', 'var(--campus-tone-6)', 'var(--campus-tone-4)'];

const CSS = `
.cp-ec{flex:1;min-height:0;display:flex;gap:28px;}
.cp-ec-card{min-width:0;display:flex;flex-direction:column;padding:22px 26px 20px;}
.cp-ec-card.is-table{flex:0 0 55%;}
.cp-ec.is-tables .cp-ec-card.is-table{flex:1 1 0;}
.cp-ec-card.is-chart{flex:1 1 0;}
.cp-ec-top{flex:none;display:flex;align-items:center;gap:20px;margin-bottom:18px;}
.cp-ec-top .campus-label-row{flex:1;min-width:0;}
.cp-ec-table{flex:1;min-height:0;display:flex;flex-direction:column;}
.cp-ec-row{display:grid;grid-template-columns:var(--cp-ec-cols);align-items:center;column-gap:8px;padding:0 18px 0 22px;}
.cp-ec-head{flex:none;min-height:58px;border-radius:var(--campus-radius-sm) var(--campus-radius-sm) 0 0;background:var(--campus-fill-deep);color:var(--theme-on-accent);box-shadow:0 8px 18px rgb(var(--theme-accent-rgb) / .18);}
.cp-ec-th{display:flex;align-items:center;gap:6px;min-width:0;font-size:21px;font-weight:700;letter-spacing:.04em;line-height:1.2;}
.cp-ec-th.is-num{justify-content:flex-end;}
.cp-ec-th .cp-ev-dir{color:var(--campus-spark);}
.cp-ec-body{flex:1;min-height:0;display:flex;flex-direction:column;}
.cp-ec-body .cp-ec-row{position:relative;flex:1 1 0;max-height:112px;min-height:56px;border-bottom:1px solid var(--theme-line);}
.cp-ec-body .cp-ec-row:nth-child(even){background:var(--campus-accent-wash);}
.cp-ec-body .cp-ec-row.is-ours{background:linear-gradient(90deg,rgb(var(--theme-accent-rgb) / .06) 0%,rgb(var(--theme-accent-rgb) / .16) 100%);border-bottom-color:var(--campus-accent-line);}
.cp-ec-ours-bar{position:absolute;left:0;top:8px;bottom:8px;width:6px;border-radius:3px;background:var(--campus-fill-bar);}
.cp-ec-name{display:flex;align-items:center;gap:10px;min-width:0;padding:8px 0;font-size:21px;line-height:1.3;color:var(--theme-ink);}
.cp-ec-row.is-ours .cp-ec-name{font-weight:700;color:var(--theme-accent);}
.cp-ec-star{flex:none;display:block;color:var(--campus-spark);}
.cp-ec-num{text-align:right;font-family:var(--theme-font-serif);font-size:24px;line-height:1;color:var(--theme-muted);font-variant-numeric:lining-nums tabular-nums;white-space:nowrap;}
.cp-ec-row.is-ours .cp-ec-num{color:var(--theme-ink);}
.cp-ec-num.is-best{font-weight:800;color:var(--theme-accent);}
.cp-ec-cell{display:flex;flex-direction:column;align-items:flex-end;justify-content:center;gap:9px;min-width:0;}
.cp-ec-dbar{width:min(100%,120px);height:6px;border-radius:3px;background:var(--campus-neutral-wash);overflow:hidden;}
.cp-ec-dbar-fill{height:100%;border-radius:3px;background:var(--campus-tone-5);}
.cp-ec-dbar-fill.is-best{background:var(--campus-tone-2);}
.cp-ec-row.is-ours .cp-ec-dbar-fill{background:var(--campus-fill);}
.cp-ec-body .cp-ec-row.is-ours{border-radius:0;}
.cp-ec-foot{flex:none;display:flex;align-items:center;gap:12px;margin-top:14px;font-size:18px;line-height:1.4;color:var(--theme-faint);}
.cp-ec-plot{position:relative;flex:1;min-height:0;margin:44px 8px 70px 56px;}
.cp-ec-bars{position:absolute;inset:0;display:grid;grid-auto-flow:column;grid-auto-columns:minmax(0,1fr);}
.cp-ec-bar-col{position:relative;display:flex;align-items:flex-end;justify-content:center;}
.cp-ec-bar{position:relative;width:var(--cp-ec-bw);border-radius:6px 6px 0 0;background:var(--campus-tone-5);}
.cp-ec-bar.is-ours{background:var(--campus-fill-bar);}
.cp-ec-bar-value{position:absolute;left:50%;bottom:100%;transform:translateX(-50%);margin-bottom:8px;font-family:var(--theme-font-serif);font-weight:700;font-size:21px;line-height:1;color:var(--theme-muted);white-space:nowrap;font-variant-numeric:lining-nums;}
.cp-ec-bar.is-ours .cp-ec-bar-value{display:flex;align-items:center;height:30px;padding:0 12px;margin-bottom:10px;border-radius:999px;background:var(--campus-fill);color:var(--theme-on-accent);box-shadow:0 6px 14px rgb(var(--theme-accent-rgb) / .3);}
.cp-ec-bar-label{position:absolute;left:4px;right:4px;top:calc(100% + 12px);font-size:18px;line-height:1.3;text-align:center;color:var(--theme-muted);text-wrap:balance;}
.cp-ec-bar-col.is-ours .cp-ec-bar-label{color:var(--theme-accent);font-weight:700;}
.cp-ec-bars.is-dense .cp-ec-bar-label{left:1px;right:1px;overflow-wrap:anywhere;line-height:1.2;}
.cp-ec-bars.is-dense .cp-ec-bar-value{font-size:19px;}
.cp-ec-plot svg{position:absolute;inset:0;width:100%;height:100%;overflow:visible;}
.cp-ec-line{fill:none;stroke-width:3.5;stroke-linejoin:round;stroke-linecap:round;vector-effect:non-scaling-stroke;}
.cp-ec-line.is-ours{stroke:var(--theme-accent);stroke-width:6;}
.cp-ec-dot{position:absolute;width:14px;height:14px;margin:-7px 0 0 -7px;border-radius:50%;background:var(--theme-surface);border:3.5px solid var(--cp-ec-tone);}
.cp-ec-dot.is-ours{width:20px;height:20px;margin:-10px 0 0 -10px;border:4px solid var(--theme-surface);background:var(--campus-fill);box-shadow:0 0 0 6px rgb(var(--theme-accent-rgb) / .16);}
.cp-ec-xlabel{position:absolute;top:calc(100% + 14px);transform:translateX(-50%);font-size:19px;color:var(--theme-muted);white-space:nowrap;}
.cp-ec-legend{flex:none;margin-top:4px;}
.cp-ec-plot.is-line{margin-bottom:48px;}
.cp-ec-legend .campus-legend-name{font-size:18px;}
.campus[data-campus-nav="rail"] .cp-ec-card.is-table{flex-basis:56%;}
.cp-ec.is-dense .cp-ec-num{font-size:22px;}
.cp-ec.is-dense .cp-ec-name{font-size:20px;}
`;

const formatValue = (value, decimals) => safeNumber(value, 0).toFixed(clamp(Math.round(safeNumber(decimals, 2)), 0, 4));

/** 每列的最优行下标集合:better='low' 取最小、'high' 取最大,其他取值不标。 */
function bestCells(rows, columns) {
  return columns.map((col, c) => {
    if ((col?.better !== 'low' && col?.better !== 'high') || !rows.length) return new Set();
    const values = rows.map(row => safeNumber(row?.[KEYS[c]], 0));
    const target = col.better === 'low' ? safeMin(values, 0) : safeMax(values, 0);
    return new Set(values.map((v, i) => (v === target ? i : -1)).filter(i => i >= 0));
  });
}

function ResultTable({ methodHead, columns, rows, ours, delay, bars }) {
  const best = bestCells(rows, columns);
  const colMax = columns.map((_, c) => safeMax(rows.map(row => Math.max(0, safeNumber(row?.[KEYS[c]], 0))), 1));
  const template = `minmax(0,1.7fr) repeat(${columns.length}, minmax(0,1fr))`;
  return (
    <div className="cp-ec-table" style={{ '--cp-ec-cols': template }}>
      <div className="cp-ec-row cp-ec-head">
        <div className="cp-ec-th">{methodHead}</div>
        {columns.map((col, c) => (
          <div className="cp-ec-th is-num" key={c}>
            <div>{col?.name}</div>
            <DirArrow dir={col?.better} size={17} />
          </div>
        ))}
      </div>
      <div className="cp-ec-body">
        {rows.map((row, r) => (
          <div className={`cp-ec-row campus-fade${r === ours ? ' is-ours' : ''}`} style={enterDelay(delay + r)} key={r}>
            {r === ours && <div className="cp-ec-ours-bar" aria-hidden="true" />}
            <div className="cp-ec-name">
              {r === ours && <SparkStar size={18} className="cp-ec-star" />}
              <div>{row?.name}</div>
            </div>
            {columns.map((col, c) => {
              const num = <div className={`cp-ec-num${best[c].has(r) ? ' is-best' : ''}`}>{formatValue(row?.[KEYS[c]], col?.decimals)}</div>;
              if (!bars) return <React.Fragment key={c}>{num}</React.Fragment>;
              const width = clamp(safeRatio(Math.max(0, safeNumber(row?.[KEYS[c]], 0)), colMax[c], 0) * 100, 0, 100);
              return (
                <div className="cp-ec-cell" key={c}>
                  {num}
                  <div className="cp-ec-dbar" aria-hidden="true"><div className={`cp-ec-dbar-fill${best[c].has(r) ? ' is-best' : ''}`} style={{ width: `${width}%` }} /></div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

function BarPanel({ rows, metric, decimals, ours }) {
  const values = rows.map(row => Math.max(0, safeNumber(row?.[KEYS[metric]], 0)));
  const { max, ticks } = niceScale(safeMax(values, 1), 4);
  const barW = rows.length > 4 ? 46 : 64;
  return (
    <div className="cp-ec-plot">
      <ChartGrid ticks={ticks} max={max} />
      <div className={`cp-ec-bars${rows.length > 4 ? ' is-dense' : ''}`} style={{ '--cp-ec-bw': `${barW}px` }}>
        {rows.map((row, i) => (
          <div className={`cp-ec-bar-col${i === ours ? ' is-ours' : ''}`} key={i}>
            <div className={`cp-ec-bar campus-grow${i === ours ? ' is-ours' : ''}`} style={{ height: `${clamp(safeRatio(values[i], max, 0) * 100, 0, 100)}%`, ...enterDelay(3 + i) }}>
              <div className="cp-ec-bar-value">{formatValue(row?.[KEYS[metric]], decimals)}</div>
            </div>
            <div className="cp-ec-bar-label">{row?.name}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function LinePanel({ rows, columns, ours }) {
  const all = rows.flatMap(row => columns.map((_, c) => Math.max(0, safeNumber(row?.[KEYS[c]], 0))));
  const { max, ticks } = niceScale(safeMax(all, 1), 4);
  const last = columns.length - 1;
  const xOf = c => clamp(4 + safeRatio(c, last, 0.5) * 92, 0, 100);
  const yOf = v => clamp(100 - safeRatio(Math.max(0, safeNumber(v, 0)), max, 0) * 100, 0, 100);
  const series = rows.map((row, r) => ({ r, pts: columns.map((_, c) => ({ x: xOf(c), y: yOf(row?.[KEYS[c]]) })) }));
  // 本文方法画在最上层
  const order = [...series.filter(s => s.r !== ours), ...series.filter(s => s.r === ours)];
  const toneOf = r => (r === ours ? 'var(--theme-accent)' : LINE_TONES[r % LINE_TONES.length]);
  return (
    <div className="cp-ec-plot is-line">
      <ChartGrid ticks={ticks} max={max} />
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        {order.map(s => (
          <polyline className={`cp-ec-line campus-fade${s.r === ours ? ' is-ours' : ''}`} style={{ stroke: toneOf(s.r), ...enterDelay(3 + s.r) }} points={s.pts.map(pt => `${pt.x},${pt.y}`).join(' ')} key={s.r} />
        ))}
      </svg>
      {order.map(s => s.pts.map((pt, c) => (
        <div className={`cp-ec-dot campus-fade${s.r === ours ? ' is-ours' : ''}`} style={{ left: `${pt.x}%`, top: `${pt.y}%`, '--cp-ec-tone': toneOf(s.r), ...enterDelay(4 + s.r) }} key={`${s.r}-${c}`} />
      )))}
      {columns.map((col, c) => (
        <div className="cp-ec-xlabel" style={{ left: `${xOf(c)}%` }} key={c}>{col?.name}</div>
      ))}
    </div>
  );
}

export function ExperimentCompare(props) {
  useThemeStyle('campus-experiment-compare-style', CSS);
  useEvidenceStyle();
  const p = { ...DEFAULTS, ...props };
  const rowCount = clamp(Math.round(safeNumber(p.rowCount, 2)), 2, 6);
  const colCount = clamp(Math.round(safeNumber(p.colCount, 2)), 1, 4);
  const rows = safeArray(p.rows).slice(0, rowCount);
  const columns = safeArray(p.columns).slice(0, colCount);
  const rowsB = safeArray(p.rowsB).slice(0, rowCount);
  const columnsB = safeArray(p.columnsB).slice(0, colCount);
  const ours = clamp(Math.round(safeNumber(p.oursRow, 0)), 0, rows.length) - 1;
  const metric = clamp(Math.round(safeNumber(p.chartMetric, 1)), 1, Math.max(1, columns.length)) - 1;
  const tables = p.mode === 'tables';
  const line = p.chartType === 'line';
  const legend = line ? rows.map((row, r) => ({ name: row?.name, tone: r === ours ? 'var(--theme-accent)' : LINE_TONES[r % LINE_TONES.length], shape: 'line' })) : [];
  const footnote = p.showFootnote ? (
    <div className="cp-ec-foot campus-fade" style={enterDelay(6)}>
      <div className="campus-mark is-spark" aria-hidden="true" />
      <p>{p.footnote}</p>
    </div>
  ) : null;
  return (
    <CampusFrame chapterIndex={p.chapterIndex}>
      <TitleRow no={p.sectionNo} title={p.title} className="campus-rise" style={enterDelay(0)} />
      <div className={`cp-ec${tables ? ' is-tables' : ''}${rowCount > 4 ? ' is-dense' : ''}`}>
        <section className="cp-ec-card is-table campus-card campus-rise" style={enterDelay(1)}>
          <div className="cp-ec-top"><LabelRow label={p.tableLabel} note={p.tableNote} /></div>
          <ResultTable methodHead={p.methodHead} columns={columns} rows={rows} ours={ours} delay={2} bars={p.showBars !== false} />
          {!tables ? footnote : null}
        </section>
        {tables ? (
          <section className="cp-ec-card is-table campus-card campus-rise" style={enterDelay(2)}>
            <div className="cp-ec-top"><LabelRow label={p.tableBLabel} note={p.tableBNote} /></div>
            <ResultTable methodHead={p.methodHead} columns={columnsB} rows={rowsB} ours={ours} delay={3} bars={p.showBars !== false} />
            {footnote}
          </section>
        ) : (
          <section className="cp-ec-card is-chart campus-card campus-rise" style={enterDelay(2)}>
            <div className="cp-ec-top"><LabelRow label={p.chartLabel} note={p.chartNote} /></div>
            {line
              ? <LinePanel rows={rows} columns={columns} ours={ours} />
              : <BarPanel rows={rows} metric={metric} decimals={columns[metric]?.decimals} ours={ours} />}
            {line && <ChartLegend items={legend} className="cp-ec-legend" />}
          </section>
        )}
      </div>
      {p.showConclusion && <ConclusionBar label={p.conclusionLabel} text={p.conclusion} className="campus-rise" style={enterDelay(8)} />}
    </CampusFrame>
  );
}

ExperimentCompare.META = {
  id: 'experiment-compare',
  label: '实验对比 · 结果表配柱线图或双表',
  roles: ['comparison', 'metrics', 'result'],
  defaults: DEFAULTS,
  copyBudgets: {
    tableLabel: 8, tableNote: 16, tableBLabel: 8, tableBNote: 16, methodHead: 6, chartLabel: 10, chartNote: 16,
    'columns[].name': 8, 'columnsB[].name': 8, 'rows[].name': 12, 'rowsB[].name': 12, footnote: 40, conclusion: 56,
  },
  numberBounds: {
    'rows[].v1': { min: -1000000000, max: 1000000000, semantics: 'magnitude' },
    'rows[].v2': { min: -1000000000, max: 1000000000, semantics: 'magnitude' },
    'rows[].v3': { min: -1000000000, max: 1000000000, semantics: 'magnitude' },
    'rows[].v4': { min: -1000000000, max: 1000000000, semantics: 'magnitude' },
    'rowsB[].v1': { min: -1000000000, max: 1000000000, semantics: 'magnitude' },
    'rowsB[].v2': { min: -1000000000, max: 1000000000, semantics: 'magnitude' },
    'rowsB[].v3': { min: -1000000000, max: 1000000000, semantics: 'magnitude' },
    'rowsB[].v4': { min: -1000000000, max: 1000000000, semantics: 'magnitude' },
    'columns[].decimals': { min: 0, max: 4, semantics: 'count' },
    'columnsB[].decimals': { min: 0, max: 4, semantics: 'count' },
  },
  controls: [
    { ...CHAPTER_CONTROL, default: 4 },
    { key: 'mode', type: 'radio', label: '版式', default: 'table-chart', options: [{ value: 'table-chart', label: '表 + 图' }, { value: 'tables', label: '双表并列' }], description: '表 + 图:左侧结果表,右侧同组数据的图;双表并列:两张表(columnsB / rowsB)左右并排,如距离度量与百分比度量。' },
    { key: 'rowCount', type: 'number', label: '方法行数', default: 4, min: 2, max: 6, countArrays: ['rows', 'rowsB'], description: '表格的数据行数(参与对比的方法个数),两张表按同样的行数显示。' },
    { key: 'colCount', type: 'number', label: '指标列数', default: 3, min: 1, max: 4, countArrays: ['columns', 'columnsB'], description: '每张表的指标列数,依次读取 rows 里的 v1–v4;columns[].better 写 high(越高越好)或 low(越低越好),每列最优值自动加粗,decimals 是显示的小数位数。' },
    { key: 'oursRow', type: 'number', label: '本文方法行', default: 4, min: 0, max: 6, maxFromKey: 'rowCount', description: '高亮第几行(本文方法),表格行与图上对应的柱 / 线一起高亮;0 表示不高亮。' },
    { key: 'showBars', type: 'toggle', label: '单元格数据条', default: true, description: '每个数值下方一条细数据条,长度按该列最大值换算,本文方法行用校色,最优值用浅校色。' },
    { key: 'chartType', type: 'radio', label: '图表类型', default: 'bar', options: [{ value: 'bar', label: '柱状图' }, { value: 'line', label: '折线图' }], description: '柱状图:每个方法一根柱,画 chartMetric 指定的那一列;折线图:每个方法一条线,横轴依次是各指标列(如不同阈值)。' },
    { key: 'chartMetric', type: 'number', label: '柱状图指标列', default: 3, min: 1, max: 4, maxFromKey: 'colCount', description: '柱状图画第几列指标。' },
    { key: 'showFootnote', type: 'toggle', label: '表注', default: true, description: '表格下方的一行注释(说明加粗、箭头与高亮的含义)。' },
    { key: 'showConclusion', type: 'toggle', label: '底部结论条', default: true, description: '页面底部的校色结论条。' },
  ],
};
