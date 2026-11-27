// 柱状图 + 结论:左侧单 / 双系列柱状图(可高亮一组),右侧 2–3 条编号结论。
// 柱子、刻度线是可编辑的形状,数值、刻度、图例、类目名都是 HTML 文本。
import React from 'react';
import { useThemeStyle, enterDelay } from '../../../shared/style.jsx';
import { safeArray, safeNumber, safeMax, safeRatio, clamp } from '../../../chart-safety.mjs';
import { CampusFrame, TitleRow, ConclusionBar, CHAPTER_CONTROL } from '../kit/chrome.jsx';
import { LabelRow, ChartGrid, ChartLegend, IndexCard, niceScale } from '../kit/parts.jsx';

const DEFAULTS = {
  chapterIndex: 3,
  barCount: 6,
  seriesMode: 'double',
  highlightIndex: 1,
  insightCount: 3,
  showConclusion: false,
  sectionNo: '3.4',
  title: '各账号平均播放量对比',
  chartLabel: '平均播放量',
  chartNote: '单位：万次 · 示例数据',
  seriesA: '2024 年',
  seriesB: '2023 年',
  bars: [
    { label: '主账号', value: 386, value2: 342 },
    { label: '生活向子账号', value: 168, value2: 121 },
    { label: '知识向子账号', value: 142, value2: 96 },
    { label: '粉丝向账号', value: 74, value2: 58 },
    { label: '对照账号 A', value: 126, value2: 133 },
    { label: '对照账号 B', value: 92, value2: 101 },
    { label: '对照账号 C', value: 64, value2: 70 },
    { label: '对照账号 D', value: 51, value2: 49 },
  ],
  insightsLabel: '主要发现',
  insights: [
    { no: '01', title: '主账号稳居头部', desc: '主账号平均播放量约为对照账号 A 的三倍，且仍在增长。' },
    { no: '02', title: '子账号增速更快', desc: '生活向、知识向子账号同比增幅超过 35%，承担拉新职能。' },
    { no: '03', title: '对照账号增长停滞', desc: '单账号运营的对照组播放量小幅回落，抗风险能力较弱。' },
  ],
  conclusionLabel: '结论',
  conclusion: '矩阵内各账号分工明确，整体增长明显快于单账号运营的对照组。',
};

const CSS = `
.cp-bc{flex:1;min-height:0;display:flex;gap:30px;}
.cp-bc-chart{flex:1;min-width:0;display:flex;flex-direction:column;padding:24px 32px 18px;}
.cp-bc-top{display:flex;align-items:center;gap:24px;}
.cp-bc-top .campus-label-row{flex:1;min-width:0;}
.cp-bc-plot{position:relative;flex:1;min-height:0;margin:48px 6px 64px 64px;}
.cp-bc-groups{position:absolute;inset:0;display:grid;grid-auto-flow:column;grid-auto-columns:minmax(0,1fr);}
.cp-bc-group{position:relative;display:flex;align-items:flex-end;justify-content:center;gap:8px;}
.cp-bc-hl{position:absolute;left:6px;right:6px;top:-40px;bottom:0;border-radius:14px 14px 0 0;background:linear-gradient(180deg,rgb(var(--theme-accent-rgb) / .03) 0%,rgb(var(--theme-accent-rgb) / .12) 100%);}
.cp-bc-bar{position:relative;width:var(--cp-bc-w);border-radius:6px;}
.cp-bc-bar.is-a{background:var(--campus-fill-bar);}
.cp-bc-bar.is-dim{background:var(--campus-fill-soft);}
.cp-bc-bar.is-b{background:var(--campus-tone-5);}
.cp-bc-value{position:absolute;left:50%;bottom:100%;transform:translateX(-50%);margin-bottom:8px;font-family:var(--theme-font-serif);font-weight:700;font-size:22px;line-height:1;color:var(--theme-ink);white-space:nowrap;font-variant-numeric:lining-nums;}
.cp-bc-bar.is-a .cp-bc-value{color:var(--theme-accent);}
.cp-bc-bar.is-b .cp-bc-value{color:var(--theme-muted);font-size:19px;}
.cp-bc-group.is-hl .cp-bc-bar.is-a .cp-bc-value{display:flex;align-items:center;height:32px;padding:0 12px;margin-bottom:10px;border-radius:999px;background:var(--campus-fill);color:var(--theme-on-accent);box-shadow:0 6px 14px rgb(var(--theme-accent-rgb) / .3);}
.cp-bc-label{position:absolute;left:0;right:0;top:calc(100% + 14px);font-size:19px;line-height:1.3;text-align:center;color:var(--theme-muted);}
.cp-bc-group.is-hl .cp-bc-label{color:var(--theme-accent);font-weight:700;}
.cp-bc-side{flex:0 0 560px;display:flex;flex-direction:column;gap:20px;}
.cp-bc-insights{flex:1;min-height:0;display:grid;grid-auto-rows:minmax(0,1fr);row-gap:20px;padding-top:6px;}
.campus[data-campus-nav="rail"] .cp-bc-side{flex-basis:500px;}
/* 类目多(7–8 组)时收紧数值与类目名,避免相邻两组的文字挤在一起 */
.cp-bc-plot.is-dense .cp-bc-value{font-size:18px;}
.cp-bc-plot.is-dense .cp-bc-bar.is-b .cp-bc-value{font-size:16px;}
.cp-bc-plot.is-dense .cp-bc-label{font-size:17px;padding:0 3px;line-height:1.25;}
.cp-bc-plot.is-dense .cp-bc-group.is-hl .cp-bc-bar.is-a .cp-bc-value{padding:0 8px;height:28px;}
`;

export function BarChartInsight(props) {
  useThemeStyle('campus-bar-chart-insight-style', CSS);
  const p = { ...DEFAULTS, ...props };
  const bars = safeArray(p.bars).slice(0, clamp(p.barCount, 3, 8));
  const insights = safeArray(p.insights).slice(0, clamp(p.insightCount, 2, 3));
  const double = p.seriesMode !== 'single';
  const highlight = clamp(Math.round(safeNumber(p.highlightIndex, 0)), 0, bars.length) - 1;
  const values = bars.flatMap(bar => (double ? [safeNumber(bar?.value, 0), safeNumber(bar?.value2, 0)] : [safeNumber(bar?.value, 0)]));
  const { max, ticks } = niceScale(safeMax(values, 1), 4);
  const h = v => `${clamp(safeRatio(Math.max(0, safeNumber(v, 0)), max, 0) * 100, 0, 100)}%`;
  // 柱宽随类目数变化:每组占的宽度越窄,柱子越细,双系列时每根再窄一些。
  const barW = double ? (bars.length > 6 ? 30 : bars.length > 4 ? 40 : 56) : (bars.length > 6 ? 52 : bars.length > 4 ? 68 : 92);
  const legend = double
    ? [{ name: p.seriesA, tone: 'var(--campus-fill-bar)' }, { name: p.seriesB, tone: 'var(--campus-tone-5)' }]
    : [];
  return (
    <CampusFrame chapterIndex={p.chapterIndex}>
      <TitleRow no={p.sectionNo} title={p.title} className="campus-rise" style={enterDelay(0)} />
      <div className="cp-bc">
        <section className="cp-bc-chart campus-card campus-rise" style={enterDelay(1)}>
          <div className="cp-bc-top">
            <LabelRow label={p.chartLabel} note={p.chartNote} />
            {double && <ChartLegend items={legend} />}
          </div>
          <div className={`cp-bc-plot${bars.length > 6 ? ' is-dense' : ''}`}>
            <ChartGrid ticks={ticks} max={max} />
            <div className="cp-bc-groups" style={{ '--cp-bc-w': `${barW}px` }}>
              {bars.map((bar, i) => {
                const single = !double && highlight >= 0 && i !== highlight ? ' is-dim' : '';
                return (
                  <div className={`cp-bc-group${i === highlight ? ' is-hl' : ''}`} key={i}>
                    {i === highlight && <div className="cp-bc-hl campus-fade" style={enterDelay(2)} aria-hidden="true" />}
                    <div className={`cp-bc-bar is-a${single} campus-grow`} style={{ height: h(bar?.value), ...enterDelay(2 + i) }}>
                      <div className="cp-bc-value">{bar?.value}</div>
                    </div>
                    {double && (
                      <div className="cp-bc-bar is-b campus-grow" style={{ height: h(bar?.value2), ...enterDelay(2 + i) }}>
                        <div className="cp-bc-value">{bar?.value2}</div>
                      </div>
                    )}
                    <div className="cp-bc-label">{bar?.label}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
        <aside className="cp-bc-side">
          <LabelRow label={p.insightsLabel} className="campus-rise" style={enterDelay(2)} />
          <div className="cp-bc-insights">
            {insights.map((item, i) => (
              <IndexCard className="campus-rise" style={enterDelay(3 + i)} key={i} no={item?.no} title={item?.title} desc={item?.desc} />
            ))}
          </div>
        </aside>
      </div>
      {p.showConclusion && <ConclusionBar label={p.conclusionLabel} text={p.conclusion} className="campus-rise" style={enterDelay(8)} />}
    </CampusFrame>
  );
}

BarChartInsight.META = {
  id: 'bar-chart-insight',
  label: '柱状图 · 单双系列配编号结论',
  roles: ['metrics', 'comparison', 'distribution'],
  defaults: DEFAULTS,
  copyBudgets: { 'bars[].label': 6, 'insights[].title': 10, 'insights[].desc': 32, chartNote: 16, conclusion: 44 },
  numberBounds: {
    'bars[].value': { min: 0, max: 1000000000, semantics: 'magnitude' },
    'bars[].value2': { min: 0, max: 1000000000, semantics: 'magnitude' },
  },
  controls: [
    { ...CHAPTER_CONTROL, default: 3 },
    { key: 'barCount', type: 'number', label: '类目数量', default: 6, min: 3, max: 8, description: '横轴上的类目(柱组)数量。' },
    { key: 'seriesMode', type: 'radio', label: '系列', default: 'double', options: [{ value: 'single', label: '单系列' }, { value: 'double', label: '双系列' }], description: '单系列只画 value;双系列再画 value2(对照系列用中性灰)。' },
    { key: 'highlightIndex', type: 'number', label: '高亮类目', default: 1, min: 0, max: 8, maxFromKey: 'barCount', description: '强调第几个类目;0 表示不高亮。' },
    { key: 'insightCount', type: 'number', label: '结论条数', default: 3, min: 2, max: 3, description: '右侧编号结论的条数。' },
    { key: 'showConclusion', type: 'toggle', label: '底部结论条', default: false, description: '页面底部的校色结论条。' },
  ],
};
