// 左图右三点:左侧 1–2 张研究图(两张上下叠放,一张撑满),右侧 2–4 条要点(圆形图标角标压在线框左边上 + 小标题 + 说明)。
// 图的来源:写了 props.images 就放图片(实验截图、训练曲线导出图);没写就按 points 数据画原生图表——
// 折线(1–3 条系列,主系列校色实线、对照系列中性灰 / 浅校色虚线)或分组柱状,带纵轴刻度、横轴取值和共用图例。
// 数据写法与「曲线网格」一致:各图共用横轴取值 points[].label,第 1 张图读 a1 / a2 / a3,第 2 张读 b1 / b2 / b3。
// 视觉:白底直接落在页面上,细线框 + 主色平涂,小圆角,不用投影、渐变条、星标;底部结论条可选,默认关。
// 折线是 SVG(导出时转成图片),刻度、取值、图例、标题、要点都是 HTML 文本。
import React from 'react';
import { useThemeStyle, enterDelay } from '../../../shared/style.jsx';
import { MediaSlot } from '../../../shared/MediaSlot.jsx';
import { safeArray, safeNumber, safeRatio, safeMin, safeMax, clamp } from '../../../chart-safety.mjs';
import { CampusFrame, TitleRow, CHAPTER_CONTROL } from '../kit/chrome.jsx';
import { ChartLegend } from '../kit/parts.jsx';
import { useDataStyle, countOf, compactNumber, niceRange } from '../kit/data.jsx';
import { NarrIcon, NARR_ICON_NAMES, parseEmphasis, plainText, useNarrativeStyle } from '../kit/narrative.jsx';

/** 一段文字:**词** 显示为段内强调;普通文字也包进行内 span,导出 PPTX 时整段是一个文本框(不按行拆碎)。 */
function Para({ text, as: Tag = 'p', className = '', style }) {
  return (
    <Tag className={className} style={style}>
      {parseEmphasis(text).map((part, i) => (part.em
        ? <strong className="cp-g1-em" key={i}>{part.text}</strong>
        : <span key={i}>{part.text}</span>))}
    </Tag>
  );
}

const CHART_KEYS = ['a', 'b'];

const DEFAULTS = {
  chapterIndex: 3,
  mediaMode: 'auto',
  figureCount: 2,
  chartForm: 'line',
  seriesCount: 3,
  pointCount: 9,
  itemCount: 3,
  showConclusion: false,
  sectionNo: '3.2',
  title: '训练过程与验证结果',
  series: [
    { name: '本文方法' },
    { name: '基线模型 A' },
    { name: '基线模型 B' },
  ],
  charts: [
    { tag: '(a)', title: '训练损失', unit: '无量纲 · 越低越好', decimals: 2 },
    { tag: '(b)', title: '验证集 mIoU', unit: '% · 越高越好', decimals: 1 },
  ],
  points: [
    { label: '0', a1: 1.92, a2: 1.95, a3: 1.97, b1: 42.3, b2: 41.8, b3: 40.9 },
    { label: '25', a1: 1.24, a2: 1.41, a3: 1.52, b1: 58.6, b2: 54.2, b3: 51.5 },
    { label: '50', a1: 0.93, a2: 1.12, a3: 1.27, b1: 65.1, b2: 60.7, b3: 57.3 },
    { label: '75', a1: 0.76, a2: 0.97, a3: 1.1, b1: 69.8, b2: 64.3, b3: 60.2 },
    { label: '100', a1: 0.69, a2: 0.9, a3: 1.06, b1: 71.2, b2: 66.9, b3: 62.8 },
    { label: '125', a1: 0.6, a2: 0.84, a3: 0.99, b1: 73.9, b2: 66.1, b3: 63.5 },
    { label: '150', a1: 0.62, a2: 0.86, a3: 0.95, b1: 73.1, b2: 68.4, b3: 62.9 },
    { label: '175', a1: 0.53, a2: 0.79, a3: 0.97, b1: 75.4, b2: 69, b3: 64.6 },
    { label: '200', a1: 0.5, a2: 0.77, a3: 0.92, b1: 76.2, b2: 69.7, b3: 65.1 },
    { label: '225', a1: 0.49, a2: 0.76, a3: 0.91, b1: 76.5, b2: 70.1, b3: 65.3 },
    { label: '250', a1: 0.48, a2: 0.74, a3: 0.9, b1: 76.4, b2: 70.4, b3: 65.6 },
    { label: '275', a1: 0.48, a2: 0.75, a3: 0.89, b1: 76.8, b2: 70.2, b3: 65.4 },
  ],
  items: [
    { title: '收敛更快', body: '本文方法约 100 轮进入平稳区，最终损失比基线 A 低约 35%。' },
    { title: '精度全程领先', body: '验证集 mIoU 达 76.2%，较两条基线分别高 6.5 和 11.1 个百分点。' },
    { title: '后期波动更小', body: '150 轮之后指标起伏不超过 1 个百分点，训练过程更稳定。' },
    { title: '代价可以接受', body: '参数量只增加 4%，单张推理耗时与基线 A 基本持平。' },
  ],
  conclusionLabel: '结论',
  conclusion: '本文方法收敛更快、精度更高且后期更稳定，验证了时空注意力模块的有效性。',
};

const SERIES = [
  { tone: 'var(--theme-accent)', shape: 'line', cls: 'is-a' },
  { tone: 'var(--campus-tone-4)', shape: 'line', cls: 'is-b' },
  { tone: 'var(--campus-tone-2)', shape: 'dashed', cls: 'is-c' },
];
const BAR_TONES = ['var(--theme-accent)', 'var(--campus-tone-3)', 'var(--campus-tone-5)'];

/** 要点图标:按小标题里的关键词挑一个(小标题认不出时再看说明),都认不出时按序号轮换;同一页尽量不重复。
 *  (契约层把 icon 这类结构字段名当成非文案剪掉,goal 写不进逐条图标名,所以由语义自动决定。) */
const ICON_RULES = [
  [/收敛|下降|提升|增长|上升|趋势|增强|升高|加快|演变|增幅|扩大|漂移|累积/, 'trend'],
  [/稳定|鲁棒|波动|可靠|抗|安全|容错/, 'shield'],
  [/速度|实时|耗时|效率|时延|周期|昼|夜|时段|时间|时长|中断/, 'clock'],
  [/精度|准确|误差|定位|命中|目标|领先|最优/, 'target'],
  [/对比|差异|优于|比较|均衡|权衡|代价|成本/, 'scale'],
  [/结构|模块|网络|架构|层|组件/, 'layers'],
  [/实验|验证|测试|仿真|实测/, 'flask'],
  [/数据|样本|统计|分布|规模/, 'chart'],
  [/信号|频|波|噪声/, 'wave'],
  [/空间|区域|城市|位置|分布/, 'pin'],
  [/发现|结论|启示|建议|思路|机理|原因/, 'bulb'],
];
const ICON_FALLBACK = ['trend', 'target', 'bulb', 'layers'];
function pickIcons(items) {
  const used = new Set();
  return items.map((item, index) => {
    const title = plainText(item?.title);
    const body = plainText(item?.body);
    const candidates = [
      ...ICON_RULES.filter(([re]) => re.test(title)).map(([, name]) => name),
      ...ICON_RULES.filter(([re]) => re.test(body)).map(([, name]) => name),
      ...ICON_FALLBACK.slice(index % ICON_FALLBACK.length), ...ICON_FALLBACK, ...NARR_ICON_NAMES,
    ];
    const name = candidates.find(c => !used.has(c)) || ICON_FALLBACK[index % ICON_FALLBACK.length];
    used.add(name);
    return name;
  });
}

const CSS = `
.cp-fpt{flex:1;min-height:0;display:flex;gap:60px;}
.cp-fpt-figs{flex:0 0 57%;min-width:0;display:flex;flex-direction:column;gap:22px;}
.cp-fpt.is-wide .cp-fpt-figs{flex-basis:58%;}
.cp-fpt-fig{position:relative;isolation:isolate;flex:1;min-height:0;display:flex;flex-direction:column;padding:18px 24px 14px 22px;border-radius:10px;}
.cp-fpt-fig::before,.cp-fpt-item::before,.cp-fpt-sum::before{content:'';position:absolute;inset:0;z-index:-1;border-radius:inherit;background:var(--theme-surface);border:1.5px solid var(--theme-line);pointer-events:none;}
.cp-fpt-head{flex:none;display:flex;align-items:center;gap:12px;min-width:0;}
.cp-fpt-tag{flex:none;display:flex;align-items:center;height:30px;padding:0 10px;border-radius:6px;border:1.5px solid var(--campus-accent-line);color:var(--theme-accent);font-family:var(--theme-font-serif);font-weight:700;font-size:18px;line-height:1;font-variant-numeric:lining-nums;}
.cp-fpt-titles{flex:1;min-width:0;display:flex;align-items:baseline;flex-wrap:wrap;gap:2px 12px;}
.cp-fpt-title{font-size:22px;line-height:1.3;font-weight:700;color:var(--theme-ink);}
.cp-fpt-unit{font-size:18px;line-height:1.3;color:var(--theme-faint);white-space:nowrap;}
.cp-fpt-legend{flex:none;gap:6px 20px;}
.cp-fpt-legend .campus-legend-name{font-size:18px;color:var(--theme-muted);}
.cp-fpt-legend .campus-legend-swatch{width:16px;height:12px;border-radius:3px;}
.cp-fpt-legend .campus-legend-swatch.is-line{width:26px;height:4px;border-radius:2px;}
.cp-fpt-legend .campus-legend-swatch.is-dashed{width:26px;height:0;border-radius:0;}
.cp-fpt-plot{position:relative;flex:1;min-height:0;margin:20px 10px 36px 60px;}
.cp-fpt-plot svg{position:absolute;inset:0;width:100%;height:100%;overflow:visible;}
.cp-fpt-plot .campus-grid-line.is-base{height:1.5px;background:var(--campus-neutral);}
.cp-fpt-plot .campus-grid-tick{right:calc(100% + 12px);font-size:17px;font-weight:600;}
.cp-fpt-line{fill:none;stroke-width:2.6;stroke-linejoin:round;stroke-linecap:round;vector-effect:non-scaling-stroke;}
.cp-fpt-line.is-a{stroke:var(--theme-accent);stroke-width:3.6;}
.cp-fpt-line.is-b{stroke:var(--campus-tone-4);}
.cp-fpt-line.is-c{stroke:var(--campus-tone-2);stroke-dasharray:7 5;}
.cp-fpt-area{fill:rgb(var(--theme-accent-rgb) / .07);}
.cp-fpt-dot{position:absolute;width:11px;height:11px;margin:-5.5px 0 0 -5.5px;border-radius:50%;background:var(--theme-surface);border:2.5px solid var(--theme-accent);}
.cp-fpt-dot.is-end{width:15px;height:15px;margin:-7.5px 0 0 -7.5px;background:var(--theme-accent);border:3px solid var(--theme-surface);}
.cp-fpt-end{position:absolute;transform:translate(-100%,-150%);padding:0 2px;font-family:var(--theme-font-serif);font-weight:700;font-size:19px;line-height:1;color:var(--theme-accent);white-space:nowrap;font-variant-numeric:lining-nums tabular-nums;}
.cp-fpt-x{position:absolute;top:calc(100% + 12px);transform:translateX(-50%);font-size:17px;line-height:1;color:var(--theme-muted);white-space:nowrap;font-variant-numeric:lining-nums;}
.cp-fpt-bar{position:absolute;bottom:0;}
.cp-fpt-media{position:relative;flex:1;min-height:0;margin-top:14px;border-radius:6px;overflow:hidden;background:var(--campus-paper);}
/* —— 右侧要点:圆角线框 + 压在左边框上的圆形图标角标 —— */
.cp-fpt-items{flex:1;min-width:0;display:flex;flex-direction:column;justify-content:center;gap:30px;padding-left:34px;}
.cp-fpt-item{position:relative;isolation:isolate;flex:0 1 auto;min-height:0;display:flex;flex-direction:column;justify-content:center;gap:10px;padding:26px 32px 26px 64px;border-radius:12px;}
.cp-fpt-item::before,.cp-fpt-sum::before{border-color:var(--campus-accent-line);}
.cp-fpt-items.is-fill .cp-fpt-item{flex:1 1 0;max-height:196px;}
.cp-fpt-items.is-4.is-fill .cp-fpt-item{max-height:176px;}
.cp-fpt-badge{position:absolute;left:-33px;top:50%;width:66px;height:66px;margin-top:-33px;display:grid;place-items:center;color:var(--theme-on-accent);isolation:isolate;}
.cp-fpt-badge::before{content:'';position:absolute;inset:-7px;z-index:-1;border-radius:50%;background:var(--theme-bg);}
.cp-fpt-badge-dot{position:absolute;inset:0;z-index:-1;border-radius:50%;background:var(--theme-accent);}
.cp-fpt-badge svg{position:relative;}
.cp-fpt-item-title{font-size:25px;line-height:1.3;font-weight:700;color:var(--theme-ink);letter-spacing:.02em;}
.cp-fpt-item-body{font-size:21px;line-height:1.65;color:var(--theme-muted);text-wrap:pretty;}
.cp-fpt-items.is-4 .cp-fpt-item{padding-top:20px;padding-bottom:20px;}
.cp-fpt-items.is-4 .cp-fpt-item-title{font-size:23px;}
.cp-fpt-items.is-4 .cp-fpt-item-body,.cp-fpt-items.is-long .cp-fpt-item-body{font-size:20px;line-height:1.6;}
/* —— 底部结论(可选):校色平涂标签 + 细线框 —— */
.cp-fpt-sum{position:relative;isolation:isolate;flex:none;display:flex;align-items:stretch;margin-top:22px;border-radius:10px;}
.cp-fpt-sum-label{flex:none;display:flex;align-items:center;justify-content:center;min-width:104px;margin:6px 0 6px 6px;padding:0 22px;border-radius:6px;background:var(--theme-accent);color:var(--theme-on-accent);font-size:22px;font-weight:700;letter-spacing:.12em;}
.cp-fpt-sum-text{flex:1;min-width:0;padding:16px 28px;font-size:22px;line-height:1.55;color:var(--theme-ink);}
.campus[data-campus-nav="rail"] .cp-fpt{gap:48px;}
`;

function Plot({ chart, letter, points, series, form, index, steps, legend }) {
  const keys = series.map((_, s) => `${letter}${s + 1}`);
  const bar = form === 'bar';
  const values = points.flatMap(pt => keys.map(k => safeNumber(pt?.[k], 0)));
  // 数据都非负、且下方留白会越过 0 时(误差、损失从 0 附近起步),纵轴从 0 开始,不出现负刻度
  const lo = safeMin(values, 0);
  const hi = safeMax(values, 0);
  const zero = bar || (lo >= 0 && lo - (hi - lo) * 0.08 < 0);
  const { min, max, ticks, labels } = niceRange(values, { steps, zero, pad: bar ? 0.04 : 0.08 });
  const span = max - min;
  const n = points.length;
  const last = n - 1;
  const xOf = i => (bar ? clamp(safeRatio(i + 0.5, n, 0.5) * 100, 0, 100) : clamp(safeRatio(i, last, 0.5) * 100, 0, 100));
  const yOf = v => clamp(100 - safeRatio(safeNumber(v, 0) - min, span, 0.5) * 100, 0, 100);
  const lines = keys.map(k => points.map((pt, i) => ({ x: xOf(i), y: yOf(pt?.[k]) })));
  const poly = pts => pts.map(pt => `${Math.round(pt.x * 100) / 100},${Math.round(pt.y * 100) / 100}`).join(' ');
  const base = yOf(clamp(0, min, max));
  const area = !bar && lines[0]?.length > 1 ? `${lines[0][0].x},${base} ${poly(lines[0])} ${lines[0][last].x},${base}` : '';
  const step = n > 9 ? 2 : 1;
  const showDots = !bar && n <= 10;
  const endValue = n ? points[last]?.[keys[0]] : null;
  const groupW = safeRatio(100, n, 10) * (series.length > 1 ? 0.7 : 0.5);
  const barW = safeRatio(groupW, series.length, groupW);
  return (
    <>
      <div className="cp-fpt-head">
        {chart?.tag ? <div className="cp-fpt-tag">{chart.tag}</div> : null}
        <div className="cp-fpt-titles">
          <div className="cp-fpt-title">{chart?.title}</div>
          {chart?.unit ? <div className="cp-fpt-unit">{chart.unit}</div> : null}
        </div>
        {legend}
      </div>
      <div className="cp-fpt-plot">
        <div className="campus-grid" aria-hidden="true">
          {ticks.map((t, i) => {
            const y = clamp(100 - safeRatio(t - min, span, 0) * 100, 0, 100);
            return (
              <React.Fragment key={i}>
                <div className={`campus-grid-line${i === 0 ? ' is-base' : ''}`} style={{ top: `${y}%` }} />
                <div className="campus-grid-tick" style={{ top: `${y}%` }}>{Math.abs(t) >= 1e5 ? compactNumber(t, 0) : labels[i]}</div>
              </React.Fragment>
            );
          })}
        </div>
        {bar ? points.map((pt, i) => keys.map((k, s) => {
          const h = clamp(safeRatio(safeNumber(pt?.[k], 0) - min, span, 0) * 100, 0, 100);
          const left = xOf(i) - groupW / 2 + s * barW;
          return <div className="cp-fpt-bar campus-grow" style={{ left: `${left + barW * 0.08}%`, width: `${barW * 0.84}%`, height: `${h}%`, background: BAR_TONES[s], ...enterDelay(3 + index) }} key={`${i}-${s}`} />;
        })) : (
          <>
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
              {area && <polygon className="cp-fpt-area campus-fade" style={enterDelay(4 + index)} points={area} />}
              {lines.slice().reverse().map((pts, r) => {
                const s = lines.length - 1 - r;
                return <polyline className={`cp-fpt-line ${SERIES[s].cls} campus-fade`} style={enterDelay(3 + index)} points={poly(pts)} key={s} />;
              })}
            </svg>
            {lines[0]?.map((pt, i) => {
              const end = i === last;
              if (!showDots && !end) return null;
              return <div className={`cp-fpt-dot${end ? ' is-end' : ''} campus-fade`} style={{ left: `${pt.x}%`, top: `${pt.y}%`, ...enterDelay(4 + index) }} key={i} />;
            })}
            {endValue != null && lines[0]?.[last] ? (
              <div className="cp-fpt-end campus-fade" style={{ left: `${lines[0][last].x}%`, top: `${lines[0][last].y}%`, ...enterDelay(5 + index) }}>{compactNumber(endValue, chart?.decimals)}</div>
            ) : null}
          </>
        )}
        {points.map((pt, i) => (i % step === 0 || i === last) && !(step > 1 && i === last - 1 && last % step !== 0) ? (
          <div className="cp-fpt-x" style={{ left: `${xOf(i)}%` }} key={i}>{pt?.label}</div>
        ) : null)}
      </div>
    </>
  );
}

export function FigurePoints(props) {
  useDataStyle();
  useNarrativeStyle();
  useThemeStyle('campus-figure-points-style', CSS);
  const p = { ...DEFAULTS, ...props };
  const figureCount = countOf(p.figureCount, 1, 2);
  const charts = safeArray(p.charts).slice(0, figureCount);
  const series = safeArray(p.series).slice(0, countOf(p.seriesCount, 1, 3));
  const points = safeArray(p.points).slice(0, countOf(p.pointCount, 3, 12));
  const items = safeArray(p.items).slice(0, countOf(p.itemCount, 2, 4));
  const useImages = p.mediaMode === 'image' || (p.mediaMode === 'auto' && safeArray(p.images).some(item => (typeof item === 'string' ? item.trim() !== '' : Boolean(item?.src))));
  const formOf = i => (p.chartForm === 'bar' ? 'bar' : p.chartForm === 'line-bar' && i === 1 ? 'bar' : 'line');
  const anyBar = charts.some((_, i) => formOf(i) === 'bar');
  const legend = series.length > 1 && !useImages
    ? <ChartLegend items={series.map((s, i) => ({ name: s?.name, tone: anyBar && formOf(i) === 'bar' ? BAR_TONES[i] : SERIES[i].tone, shape: SERIES[i].shape }))} className="cp-fpt-legend" />
    : null;
  // 柱状图的图例用色块;折线 + 柱状混排时第一张图(折线)放线型图例,第二张图(柱)放色块图例
  const legendFor = i => {
    if (!legend) return null;
    const form = formOf(i);
    if (charts.length > 1 && i > 0 && formOf(0) === form) return null;
    return <ChartLegend items={series.map((s, k) => (form === 'bar'
      ? { name: s?.name, tone: BAR_TONES[k], shape: 'bar' }
      : { name: s?.name, tone: SERIES[k].tone, shape: SERIES[k].shape }))} className="cp-fpt-legend" />;
  };
  const longBody = items.some(item => plainText(item?.body).length > 34);
  const icons = pickIcons(items);
  return (
    <CampusFrame chapterIndex={p.chapterIndex}>
      <TitleRow no={p.sectionNo} title={p.title} className="campus-rise" style={enterDelay(0)} />
      <div className={`cp-fpt${charts.length === 1 ? ' is-wide' : ''}`}>
        <div className="cp-fpt-figs">
          {charts.map((chart, i) => (
            <section className="cp-fpt-fig campus-rise" style={enterDelay(1 + i)} key={i}>
              {useImages ? (
                <>
                  <div className="cp-fpt-head">
                    {chart?.tag ? <div className="cp-fpt-tag">{chart.tag}</div> : null}
                    <div className="cp-fpt-titles">
                      <div className="cp-fpt-title">{chart?.title}</div>
                      {chart?.unit ? <div className="cp-fpt-unit">{chart.unit}</div> : null}
                    </div>
                  </div>
                  <div className="cp-fpt-media"><MediaSlot id={`figure-points-${i}`} fit="contain" radius={6} placeholder="研究图" /></div>
                </>
              ) : (
                <Plot chart={chart} letter={CHART_KEYS[i]} points={points} series={series} form={formOf(i)} index={i} steps={5} legend={legendFor(i)} />
              )}
            </section>
          ))}
        </div>
        <div className={`cp-fpt-items is-fill is-${items.length}${longBody ? ' is-long' : ''}`}>
          {items.map((item, i) => (
            <section className="cp-fpt-item campus-rise" style={enterDelay(3 + i)} key={i}>
              <div className="cp-fpt-badge" data-icon={icons[i]} aria-hidden="true"><div className="cp-fpt-badge-dot" /><NarrIcon name={icons[i]} size={32} stroke={2} /></div>
              <h3 className="cp-fpt-item-title">{item?.title}</h3>
              <Para text={item?.body} className="cp-fpt-item-body" />
            </section>
          ))}
        </div>
      </div>
      {p.showConclusion && (
        <div className="cp-fpt-sum campus-rise" style={enterDelay(8)}>
          <div className="cp-fpt-sum-label">{p.conclusionLabel}</div>
          <Para text={p.conclusion} className="cp-fpt-sum-text" />
        </div>
      )}
    </CampusFrame>
  );
}

const BOUND = { min: -1000000000, max: 1000000000, semantics: 'magnitude' };
const POINT_BOUNDS = Object.fromEntries(CHART_KEYS.flatMap(letter => [1, 2, 3].map(s => [`points[].${letter}${s}`, BOUND])));

FigurePoints.META = {
  id: 'figure-points',
  label: '左图右要点 · 1–2 张研究图配 2–4 条结论',
  roles: ['result', 'metrics', 'observation', 'trend'],
  defaults: DEFAULTS,
  copyBudgets: {
    'series[].name': 8,
    'charts[].tag': 4,
    'charts[].title': 12,
    'charts[].unit': 12,
    'points[].label': 6,
    'items[].title': 10,
    'items[].body': 40,
    conclusionLabel: 4,
    conclusion: 56,
  },
  numberBounds: {
    ...POINT_BOUNDS,
    'charts[].decimals': { min: 0, max: 4, semantics: 'count' },
  },
  controls: [
    { ...CHAPTER_CONTROL, default: 3 },
    { key: 'mediaMode', type: 'radio', label: '图的来源', default: 'auto', options: [{ value: 'auto', label: '自动' }, { value: 'chart', label: '原生图表' }, { value: 'image', label: '图片' }], description: '自动(默认):goal 里写了 props.images 就放图片,没写就按 points 数据画原生图表;在页面上上传图片前先切到「图片」。图片时 charts[].tag / title / unit 作图题。' },
    { key: 'images', type: 'images', label: '研究图', countKey: 'figureCount', description: '左侧的研究图(实验结果、训练曲线等),按顺序放进上、下两个图位;「图的来源」为「自动」时,goal 里写了 props.images 就显示图片。' },
    { key: 'figureCount', type: 'number', label: '图的数量', default: 2, min: 1, max: 2, countArrays: ['charts'], description: '左侧图的张数:2 张上下叠放,1 张撑满左栏。第 1 张图读 points 里的 a1 / a2 / a3,第 2 张读 b1 / b2 / b3。' },
    { key: 'chartForm', type: 'radio', label: '图表形式', default: 'line', options: [{ value: 'line', label: '折线' }, { value: 'bar', label: '柱状' }, { value: 'line-bar', label: '上折线下柱状' }], description: '原生图表的画法:折线(主系列校色实线带浅色面积与终值,对照系列灰线 / 浅校色虚线);柱状(分组柱,纵轴从 0 开始);上折线下柱状(第 1 张折线、第 2 张柱状)。' },
    { key: 'seriesCount', type: 'number', label: '系列数', default: 3, min: 1, max: 3, countArrays: ['series'], description: '每张图的系列条数(名称在 series 里,共用图例)。' },
    { key: 'pointCount', type: 'number', label: '数据点数', default: 9, min: 3, max: 12, countArrays: ['points'], description: '横轴取值个数(各图共用 points[].label);超过 9 个时横轴标签隔一个显示。没有真实数据时也要写成有起伏、趋势合理的数值,不要写成两条直线。' },
    { key: 'itemCount', type: 'number', label: '要点数量', default: 3, min: 2, max: 4, countArrays: ['items'], description: '右侧要点条数。每条的圆形图标按小标题(其次说明)里的关键词自动挑选、同页不重复:收敛 / 提升 → 上升曲线,稳定 / 波动 → 盾牌,速度 / 时段 / 昼夜 → 时钟,精度 / 误差 → 靶心,对比 / 代价 → 天平,结构 / 模块 → 图层,实验 / 仿真 → 烧瓶,数据 / 样本 → 图表,信号 → 波形,区域 / 城市 → 定位,发现 / 机理 → 灯泡。' },
    { key: 'showConclusion', type: 'toggle', label: '底部结论条', default: false, description: '页面底部一行结论(校色平涂标签 + 细线框),默认关。' },
  ],
};
