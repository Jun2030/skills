// 研究进度甘特:左侧任务列,右侧按月 / 阶段排开的横条,横条按「已完成 / 进行中 / 计划中」区分深浅,竖线标出当前阶段。
// 适合进度安排、研究计划、项目排期。
import React from 'react';
import { useThemeStyle, enterDelay } from '../../../shared/style.jsx';
import { safeArray, safeNumber, safeRatio, clamp } from '../../../chart-safety.mjs';
import { CampusFrame, TitleRow, ConclusionBar, CHAPTER_CONTROL, useCampusLayout } from '../kit/chrome.jsx';
import { ChartLegend } from '../kit/parts.jsx';

const DEFAULTS = {
  chapterIndex: 4,
  taskCount: 7,
  periodCount: 8,
  currentPeriod: 3,
  showCurrent: true,
  showConclusion: true,
  sectionNo: '4.2',
  title: '研究进度安排',
  taskHead: '研究任务',
  doneLabel: '已完成',
  activeLabel: '进行中',
  planLabel: '计划中',
  currentLabel: '当前',
  periods: [
    { label: '2025.10' }, { label: '2025.11' }, { label: '2025.12' }, { label: '2026.01' }, { label: '2026.02' },
    { label: '2026.03' }, { label: '2026.04' }, { label: '2026.05' }, { label: '2026.06' }, { label: '2026.07' },
  ],
  tasks: [
    { no: '01', name: '文献梳理', note: '理论框架与研究综述', start: 1, end: 2, output: '完成文献综述' },
    { no: '02', name: '开题报告', note: '研究设计与开题答辩', start: 2, end: 3, output: '通过开题答辩' },
    { no: '03', name: '资料收集', note: '公开视频、访谈与平台数据', start: 3, end: 5, output: '建立案例资料库' },
    { no: '04', name: '案例分析', note: '三条主线逐一分析', start: 4, end: 6, output: '完成三章分析' },
    { no: '05', name: '论文撰写', note: '成文与图表制作', start: 5, end: 7, output: '完成论文初稿' },
    { no: '06', name: '修改定稿', note: '导师意见与查重', start: 7, end: 8, output: '论文定稿' },
    { no: '07', name: '答辩准备', note: '答辩材料与预答辩', start: 8, end: 8, output: '毕业答辩' },
  ],
  conclusionLabel: '时间节点',
  conclusion: '2026 年 3 月底前完成初稿，4 月修改定稿，5 月参加毕业论文答辩。',
};

// 左侧任务列的宽度:正文区较窄(左侧竖栏导航)时收窄一些。
const taskWidth = bodyW => (bodyW < 1700 ? 360 : 400);
// 文字的视觉宽度(全角计 1、半角计 0.5),用来判断产出文字放不放得进横条。
const visualLength = text => [...String(text || '')].reduce((sum, ch) => sum + (ch.charCodeAt(0) > 255 ? 1 : 0.5), 0);

const CSS = `
.cp-gt-top{flex:none;display:flex;align-items:center;justify-content:flex-end;margin:-8px 0 14px;}
.cp-gt{flex:0 1 auto;min-height:0;max-height:100%;display:flex;flex-direction:column;}
.cp-gt-row{display:grid;grid-template-columns:var(--cp-gt-task) minmax(0,1fr);}
.cp-gt-head{flex:none;height:60px;background:var(--campus-fill-deep);color:var(--theme-on-accent);border-radius:var(--campus-radius) var(--campus-radius) 0 0;}
.cp-gt-th{display:flex;align-items:center;gap:12px;padding:0 28px;font-size:22px;font-weight:700;letter-spacing:.12em;}
.cp-gt-periods{position:relative;display:grid;grid-auto-flow:column;grid-auto-columns:minmax(0,1fr);}
.cp-gt-period{position:relative;display:flex;align-items:center;justify-content:center;font-family:var(--theme-font-serif);font-weight:700;font-size:20px;letter-spacing:.02em;font-variant-numeric:lining-nums;border-left:1px solid var(--campus-on-accent-line);}
.cp-gt-period.is-current{background:var(--campus-on-accent-glass);color:var(--campus-spark);}
.cp-gt-period:last-child.is-current{border-radius:0 var(--campus-radius) 0 0;}
.cp-gt-body{position:relative;flex:0 1 auto;min-height:0;display:flex;flex-direction:column;}
/* 每行基准 132px、可按比例收缩:任务多时均分高度,任务少时表格收短,不把横条拉成大片空行 */
.cp-gt-body .cp-gt-row{flex:0 1 132px;min-height:0;border-top:1px solid var(--theme-line);}
.cp-gt-body .cp-gt-row:first-child{border-top:0;}
.cp-gt-body .cp-gt-row:nth-child(even){background:var(--campus-accent-wash);}
.cp-gt-body .cp-gt-row:last-of-type{border-radius:0 0 var(--campus-radius) var(--campus-radius);}
.cp-gt-task{display:flex;align-items:center;gap:18px;padding:0 24px;border-right:1px solid var(--theme-line);}
.cp-gt-task-no{flex:none;display:grid;place-items:center;width:40px;height:40px;border-radius:12px;background:var(--campus-accent-tint);font-size:21px;}
.cp-gt-task-name{font-size:23px;line-height:1.25;font-weight:700;color:var(--theme-ink);}
.cp-gt-task-note{margin-top:4px;font-size:18px;line-height:1.3;color:var(--theme-faint);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.cp-gt-lane{position:relative;}
.cp-gt-col{position:absolute;top:0;bottom:0;width:0;border-left:1px dashed var(--theme-line);}
.cp-gt-bar{position:absolute;z-index:1;top:50%;height:40px;margin-top:-20px;border-radius:20px;}
.cp-gt-bar.is-done{background:var(--campus-fill-soft);}
.cp-gt-bar.is-active{background:var(--campus-fill);box-shadow:0 6px 14px rgb(var(--theme-accent-rgb) / .28);}
.cp-gt-bar.is-plan{background:var(--campus-accent-wash);border:2px dashed var(--campus-accent-line);}
.cp-gt-out{position:absolute;z-index:2;top:50%;transform:translateY(-50%);font-size:19px;line-height:1.2;font-weight:600;color:var(--theme-ink);white-space:nowrap;}
.cp-gt-out.is-inside{color:var(--theme-on-accent);}
.cp-gt-out.is-inside.is-plan{color:var(--theme-accent);}
.cp-gt-now{position:absolute;z-index:0;top:0;bottom:0;width:0;border-left:2px dashed var(--theme-accent);pointer-events:none;}
.cp-gt-now-tag{position:absolute;top:-2px;transform:translateX(-50%);height:28px;padding:0 12px;display:flex;align-items:center;gap:6px;background:var(--campus-fill);color:var(--theme-on-accent);font-size:16px;font-weight:700;letter-spacing:.08em;border-radius:999px;white-space:nowrap;box-shadow:0 4px 10px rgb(var(--theme-accent-rgb) / .3);}
.cp-gt-now-dot{position:absolute;left:-7px;bottom:-7px;width:12px;height:12px;border-radius:50%;background:var(--campus-spark);box-shadow:0 0 0 4px var(--campus-spark-soft);}
`;

export function GanttSchedule(props) {
  useThemeStyle('campus-gantt-schedule-style', CSS);
  const p = { ...DEFAULTS, ...props };
  const { bodyW } = useCampusLayout();
  const taskW = taskWidth(bodyW);
  // 右侧时间区的宽度:正文区宽度减去任务列和两侧边框(随导航样式变化)。
  const laneW = bodyW - taskW - 2;
  const periods = safeArray(p.periods).slice(0, clamp(p.periodCount, 4, 10));
  const tasks = safeArray(p.tasks).slice(0, clamp(p.taskCount, 3, 7));
  const m = Math.max(1, periods.length);
  const current = clamp(Math.round(safeNumber(p.currentPeriod, 1)), 1, m);
  const pct = v => `${clamp(safeRatio(v, m, 0) * 100, 0, 100)}%`;
  const statusOf = (start, end) => {
    if (!p.showCurrent) return 'active';
    if (end < current) return 'done';
    if (start > current) return 'plan';
    return 'active';
  };
  return (
    <CampusFrame chapterIndex={p.chapterIndex}>
      <TitleRow no={p.sectionNo} title={p.title} className="campus-rise" style={enterDelay(0)} />
      {p.showCurrent && (
        <div className="cp-gt-top campus-fade" style={enterDelay(1)}>
          <ChartLegend items={[
            { name: p.doneLabel, tone: 'var(--campus-fill-soft)' },
            { name: p.activeLabel, tone: 'var(--campus-fill)' },
            { name: p.planLabel, tone: 'var(--campus-accent-wash)', shape: 'outline' },
          ]} />
        </div>
      )}
      <div className="cp-gt campus-card campus-rise" style={{ '--cp-gt-task': `${taskW}px`, ...enterDelay(1) }}>
        <div className="cp-gt-row cp-gt-head">
          <div className="cp-gt-th">{p.taskHead}</div>
          <div className="cp-gt-periods">
            {periods.map((period, i) => (
              <div className={`cp-gt-period${p.showCurrent && i + 1 === current ? ' is-current' : ''}`} key={i}>{period?.label}</div>
            ))}
          </div>
        </div>
        <div className="cp-gt-body">
          {tasks.map((task, i) => {
            const start = clamp(Math.round(safeNumber(task?.start, 1)), 1, m);
            const end = clamp(Math.round(safeNumber(task?.end, start)), start, m);
            const status = statusOf(start, end);
            // 产出文字优先写在横条里;横条放不下时写在横条右侧(右侧不够时写在左侧)。
            const barPx = (laneW / m) * (end - start + 1) - 12;
            const textPx = visualLength(task?.output) * 19 + 36;
            const place = textPx <= barPx ? 'inside' : m - end >= 2 ? 'right' : 'left';
            const outStyle = place === 'right'
              ? { left: `calc(${pct(end)} + 14px)` }
              : place === 'left'
                ? { right: `calc(${pct(m - start + 1)} + 14px)` }
                : { left: `calc(${pct(start - 1)} + 24px)` };
            return (
              <div className="cp-gt-row campus-fade" style={enterDelay(2 + i)} key={i}>
                <div className="cp-gt-task">
                  <div className="cp-gt-task-no campus-num">{task?.no}</div>
                  <div>
                    <div className="cp-gt-task-name">{task?.name}</div>
                    <div className="cp-gt-task-note">{task?.note}</div>
                  </div>
                </div>
                <div className="cp-gt-lane">
                  {periods.slice(1).map((_, k) => <div className="cp-gt-col" style={{ left: pct(k + 1) }} key={k} />)}
                  <div className={`cp-gt-bar is-${status} campus-draw`} style={{ left: `calc(${pct(start - 1)} + 6px)`, width: `calc(${pct(end - start + 1)} - 12px)`, ...enterDelay(3 + i) }} />
                  <div className={`cp-gt-out${place === 'inside' ? ` is-inside is-${status}` : ''}`} style={outStyle}>{task?.output}</div>
                </div>
              </div>
            );
          })}
          {p.showCurrent && (
            <div className="cp-gt-now campus-fade" style={{ left: `calc(${taskW}px + (100% - ${taskW}px) * ${safeRatio(current - 0.5, m, 0)})`, ...enterDelay(10) }}>
              <div className="cp-gt-now-tag">{p.currentLabel}</div>
              <div className="cp-gt-now-dot" aria-hidden="true" />
            </div>
          )}
        </div>
      </div>
      {p.showConclusion && <ConclusionBar label={p.conclusionLabel} text={p.conclusion} className="campus-rise" style={enterDelay(9)} />}
    </CampusFrame>
  );
}

GanttSchedule.META = {
  id: 'gantt-schedule',
  label: '进度甘特 · 任务横条配当前阶段',
  roles: ['actions', 'process', 'trend'],
  defaults: DEFAULTS,
  copyBudgets: { 'tasks[].name': 6, 'tasks[].note': 13, 'tasks[].output': 8, conclusion: 44 },
  numberBounds: {
    'tasks[].start': { min: 1, max: 10, semantics: 'index' },
    'tasks[].end': { min: 1, max: 10, semantics: 'index' },
  },
  controls: [
    { ...CHAPTER_CONTROL, default: 4 },
    { key: 'taskCount', type: 'number', label: '任务行数', default: 7, min: 3, max: 7, description: '左侧研究任务的行数。' },
    { key: 'periodCount', type: 'number', label: '时间列数', default: 8, min: 4, max: 10, description: '右侧按月 / 阶段排开的时间列数;任务的起止列 start / end 从 1 开始计。' },
    { key: 'currentPeriod', type: 'number', label: '当前阶段', default: 3, min: 1, max: 10, maxFromKey: 'periodCount', description: '竖线标出的当前所在列;它之前结束的任务显示为已完成,之后开始的显示为计划中。' },
    { key: 'showCurrent', type: 'toggle', label: '当前阶段标记', default: true, description: '显示当前阶段竖线、图例和横条的完成状态。' },
    { key: 'showConclusion', type: 'toggle', label: '底部结论条', default: true, description: '页面底部的校色结论条。' },
  ],
};
