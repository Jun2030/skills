// 雷达图:左侧 5–6 维雷达(本人为校色实面,可叠加中性灰虚线的对照基准),右侧逐项列出各维度得分与说明。
// 维度名与分数是 HTML 文本,SVG 只画网格和多边形。
import React from 'react';
import { useThemeStyle, enterDelay } from '../../../shared/style.jsx';
import { safeArray, safeNumber, clamp } from '../../../chart-safety.mjs';
import { CampusFrame, TitleRow, CHAPTER_CONTROL } from '../kit/chrome.jsx';
import { LabelRow, ChartLegend, polar } from '../kit/parts.jsx';

const DEFAULTS = {
  chapterIndex: 3,
  dimensionCount: 6,
  showBaseline: true,
  sectionNo: '03',
  title: '综合素质画像',
  chartLabel: '综合素质评价',
  chartNote: '满分 100 · 示例数据',
  selfLabel: '本人',
  baseLabel: '专业平均',
  listLabel: '各维度说明',
  dimensions: [
    { name: '学业成绩', value: 96, base: 78, desc: '专业排名第 1，平均学分绩点 3.92。' },
    { name: '科研创新', value: 90, base: 62, desc: '主持大创项目 1 项，参与课题 2 项。' },
    { name: '竞赛获奖', value: 88, base: 58, desc: '国家级奖项 3 项，省级奖项 6 项。' },
    { name: '社会实践', value: 82, base: 70, desc: '累计志愿服务时长 359 小时。' },
    { name: '学生工作', value: 86, base: 66, desc: '担任班长三年，获优秀学生干部。' },
    { name: '文体素养', value: 74, base: 68, desc: '校辩论队成员，新生辩论赛最佳辩手。' },
  ],
};

const VB = 600;
const C = VB / 2;
const RMAX = 226;

const CSS = `
.cp-rd{flex:1;min-height:0;display:flex;gap:30px;}
.cp-rd-chart{flex:0 0 820px;display:flex;flex-direction:column;padding:24px 32px 20px;}
.campus[data-campus-nav="rail"] .cp-rd-chart{flex-basis:760px;}
.cp-rd-top{display:flex;align-items:center;gap:24px;}
.cp-rd-top .campus-label-row{flex:1;min-width:0;}
.cp-rd-stage{position:relative;flex:1;min-height:0;display:flex;justify-content:center;align-items:center;container-type:size;}
/* 正方形绘图区:取舞台高度与「宽度减去两侧标签」中较小的一个,窄正文区(左侧竖栏导航)下也不越出卡片 */
.cp-rd-figure{position:relative;width:min(calc(100cqh - 40px),calc(100cqw - 120px));aspect-ratio:1 / 1;}
.cp-rd-figure svg{position:absolute;inset:0;width:100%;height:100%;overflow:visible;}
.cp-rd-grid{fill:none;stroke:var(--theme-line);stroke-width:1.5;}
.cp-rd-grid.is-band{fill:rgb(var(--theme-accent-rgb) / .035);}
.cp-rd-grid.is-outer{fill:rgb(var(--theme-accent-rgb) / .035);stroke:var(--campus-accent-line);stroke-width:2;}
.cp-rd-spoke{stroke:var(--theme-line);stroke-width:1.5;}
.cp-rd-base{fill:none;stroke:var(--campus-tone-4);stroke-width:2.5;stroke-dasharray:8 7;}
.cp-rd-self{fill:rgb(var(--theme-accent-rgb) / .2);stroke:var(--theme-accent);stroke-width:5;stroke-linejoin:round;}
.cp-rd-dot{fill:var(--theme-accent);stroke:var(--theme-surface);stroke-width:4;}
.cp-rd-hub{position:absolute;left:50%;top:50%;width:18px;height:18px;margin:-9px 0 0 -9px;border-radius:50%;background:var(--campus-spark);box-shadow:0 0 0 6px var(--campus-spark-soft);}
.cp-rd-label{position:absolute;display:flex;flex-direction:column;align-items:center;gap:4px;transform:translate(-50%,-50%);text-align:center;white-space:nowrap;}
.cp-rd-label-name{font-size:21px;font-weight:700;color:var(--theme-ink);}
.cp-rd-label-value{font-size:26px;}
.cp-rd-side{flex:1;min-width:0;display:flex;flex-direction:column;gap:16px;}
.cp-rd-list{flex:1;min-height:0;display:flex;flex-direction:column;}
.cp-rd-row{flex:1 1 0;min-height:0;display:grid;grid-template-columns:minmax(0,1fr) 92px;align-items:center;column-gap:24px;padding:0 8px;border-bottom:1px dashed var(--campus-accent-line);}
.cp-rd-row:last-child{border-bottom:0;}
.cp-rd-row-name{display:flex;align-items:center;gap:12px;font-size:23px;font-weight:700;color:var(--theme-ink);}
.cp-rd-row-desc{margin-top:6px;font-size:19px;line-height:1.45;color:var(--theme-muted);}
.cp-rd-meter{position:relative;height:8px;margin-top:10px;border-radius:4px;background:var(--campus-neutral-wash);}
.cp-rd-meter-fill{position:absolute;left:0;top:0;bottom:0;border-radius:4px;background:var(--campus-fill);}
.cp-rd-meter-base{position:absolute;top:-5px;bottom:-5px;width:3px;margin-left:-1.5px;border-radius:2px;background:var(--campus-tone-4);}
.cp-rd-score{font-size:44px;text-align:right;}
.cp-rd-list.is-5 .cp-rd-row-desc{font-size:20px;}
`;

export function RadarProfile(props) {
  useThemeStyle('campus-radar-profile-style', CSS);
  const p = { ...DEFAULTS, ...props };
  const dims = safeArray(p.dimensions).slice(0, clamp(p.dimensionCount, 5, 6));
  const n = Math.max(3, dims.length);
  const step = 360 / n;
  const pt = (value, i) => polar(C, C, (clamp(safeNumber(value, 0), 0, 100) / 100) * RMAX, i * step);
  const ring = k => dims.map((_, i) => polar(C, C, (RMAX * k) / 4, i * step)).map(q => `${q.x},${q.y}`).join(' ');
  const selfPts = dims.map((d, i) => pt(d?.value, i));
  const basePts = dims.map((d, i) => pt(d?.base, i));
  const poly = pts => pts.map(q => `${q.x},${q.y}`).join(' ');
  const pct = v => `${(v / VB) * 100}%`;
  const legend = [{ name: p.selfLabel, tone: 'var(--theme-accent)', shape: 'line' }];
  if (p.showBaseline) legend.push({ name: p.baseLabel, tone: 'var(--campus-tone-4)', shape: 'dashed' });
  return (
    <CampusFrame chapterIndex={p.chapterIndex}>
      <TitleRow no={p.sectionNo} title={p.title} className="campus-rise" style={enterDelay(0)} />
      <div className="cp-rd">
        <section className="cp-rd-chart campus-card campus-rise" style={enterDelay(1)}>
          <div className="cp-rd-top">
            <LabelRow label={p.chartLabel} note={p.chartNote} />
            <ChartLegend items={legend} />
          </div>
          <div className="cp-rd-stage">
            <div className="cp-rd-figure">
              <svg viewBox={`0 0 ${VB} ${VB}`} aria-hidden="true">
                {[4, 3, 2, 1].map(k => <polygon className={`cp-rd-grid${k === 4 ? ' is-outer' : k === 2 ? ' is-band' : ''}`} points={ring(k)} key={k} />)}
                {dims.map((_, i) => {
                  const end = polar(C, C, RMAX, i * step);
                  return <line className="cp-rd-spoke" x1={C} y1={C} x2={end.x} y2={end.y} key={i} />;
                })}
                {p.showBaseline && <polygon className="cp-rd-base campus-fade" style={enterDelay(2)} points={poly(basePts)} />}
                <polygon className="cp-rd-self campus-fade" style={enterDelay(3)} points={poly(selfPts)} />
                {selfPts.map((q, i) => <circle className="cp-rd-dot campus-fade" style={enterDelay(4)} cx={q.x} cy={q.y} r="8" key={i} />)}
              </svg>
              <div className="cp-rd-hub" aria-hidden="true" />
              {dims.map((d, i) => {
                const q = polar(C, C, RMAX + 54, i * step);
                return (
                  <div className="cp-rd-label" style={{ left: pct(q.x), top: pct(q.y) }} key={i}>
                    <div className="cp-rd-label-name">{d?.name}</div>
                    <div className="cp-rd-label-value campus-num">{d?.value}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
        <aside className="cp-rd-side">
          <LabelRow label={p.listLabel} className="campus-rise" style={enterDelay(2)} />
          <div className={`cp-rd-list campus-card campus-rise is-${dims.length}`} style={{ padding: '6px 24px', ...enterDelay(3) }}>
            {dims.map((d, i) => (
              <div className="cp-rd-row" key={i}>
                <div>
                  <div className="cp-rd-row-name"><div className="campus-mark" /><div>{d?.name}</div></div>
                  <div className="cp-rd-row-desc">{d?.desc}</div>
                  <div className="cp-rd-meter">
                    <div className="cp-rd-meter-fill" style={{ width: `${clamp(safeNumber(d?.value, 0), 0, 100)}%` }} />
                    {p.showBaseline && <div className="cp-rd-meter-base" style={{ left: `${clamp(safeNumber(d?.base, 0), 0, 100)}%` }} />}
                  </div>
                </div>
                <div className="cp-rd-score campus-num">{d?.value}</div>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </CampusFrame>
  );
}

RadarProfile.META = {
  id: 'radar-profile',
  label: '雷达图 · 多维画像配维度说明',
  roles: ['metrics', 'comparison', 'case'],
  defaults: DEFAULTS,
  copyBudgets: { 'dimensions[].name': 5, 'dimensions[].desc': 20, chartNote: 14 },
  numberBounds: {
    'dimensions[].value': { min: 0, max: 100, semantics: 'percent' },
    'dimensions[].base': { min: 0, max: 100, semantics: 'percent' },
  },
  controls: [
    { ...CHAPTER_CONTROL, default: 3 },
    { key: 'dimensionCount', type: 'number', label: '维度数量', default: 6, min: 5, max: 6, description: '雷达图的维度数,右侧说明随之增减;分值按 0–100 绘制。' },
    { key: 'showBaseline', type: 'toggle', label: '对照基准', default: true, description: '叠加一条中性灰虚线的对照基准(如专业平均)。' },
  ],
};
