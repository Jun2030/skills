// 进度安排表:「时间段 / 工作内容 / 阶段成果」三列表(可加第四列「完成度」),4–8 行。
// 左侧一条竖向时间线把各行串起来:已完成的阶段是渐变实心节点 + 实线,当前阶段节点放大并带点缀色外环、整行高亮,
// 未开始的阶段是空心节点 + 虚线。适合开题报告、项目申报的「研究计划 / 进度安排」。
import React from 'react';
import { useThemeStyle, enterDelay } from '../../../shared/style.jsx';
import { safeArray, safeNumber, clamp } from '../../../chart-safety.mjs';
import { CampusFrame, TitleRow, ConclusionBar, CHAPTER_CONTROL, useCampusLayout } from '../kit/chrome.jsx';
import { useStructureStyle } from '../kit/structure.jsx';
import { useAffairsStyle, RailNode, MiniBar } from '../kit/affairs.jsx';

const DEFAULTS = {
  chapterIndex: 4,
  rowCount: 7,
  currentIndex: 2,
  showProgress: true,
  showSpan: true,
  showConclusion: true,
  sectionNo: '6.1',
  title: '研究计划与进度安排',
  span: '2023.01 — 2024.05 · 共 17 个月',
  headTime: '时间段',
  headTask: '工作内容和要求',
  headResult: '阶段成果',
  headProgress: '完成度',
  currentLabel: '当前阶段',
  todoLabel: '未开始',
  rows: [
    { time: '2023.01—2023.02', task: '调试软件接收机', result: '可以处理中频数据', progress: 100 },
    { time: '2023.03—2023.05', task: '基础理论验证、平台搭建、少量数据处理', result: '熟悉代码、了解流程', progress: 60 },
    { time: '2023.06—2023.07', task: '数据验证，小论文撰写', result: '获得实验结论、小论文写好', progress: 0 },
    { time: '2023.08—2023.09', task: '修改小论文，实测数据处理', result: '小论文发表', progress: 0 },
    { time: '2023.10—2023.12', task: '撰写大论文，优化软件平台，完成中期答辩', result: '论文前 3 章节 + 相关小论文', progress: 0 },
    { time: '2024.01—2024.02', task: '整理成果，完善毕业论文', result: '学位论文初稿', progress: 0 },
    { time: '2024.03—2024.05', task: '论文修改、送审及答辩', result: '学位论文终稿', progress: 0 },
    { time: '起止时间', task: '第八个阶段的工作内容', result: '对应的阶段成果', progress: 0 },
  ],
  conclusionLabel: '时间保障',
  conclusion: '软件接收机已调试完成，前期平台为后续深组合研究留出了充足时间。',
};

const CSS = `
.cp-g4-sch{min-height:0;}
.cp-g4-sch .campus-xt-th{font-size:22px;}
.cp-g4-sch-th-time{padding-left:92px!important;}
.cp-g4-sch .campus-xt-row{transition:none;}
.cp-g4-sch .campus-xt-td{font-size:22px;line-height:1.45;}
/* 时间列:竖向时间线 + 节点 + 日期 */
.cp-g4-sch-time{position:relative;padding-left:92px!important;flex-direction:column;align-items:flex-start!important;justify-content:center;gap:6px!important;}
.cp-g4-sch-rail{position:absolute;left:46px;top:0;bottom:0;width:0;}
.cp-g4-sch-seg{position:absolute;left:-1.5px;width:3px;}
.cp-g4-sch-seg.is-top{top:0;height:50%;}
.cp-g4-sch-seg.is-bottom{top:50%;bottom:0;}
.cp-g4-sch-seg.is-solid{background:var(--campus-fill-bar);}
.cp-g4-sch-seg.is-dash{width:0;left:-1.25px;border-left:2.5px dashed var(--campus-accent-line);}
.cp-g4-sch-seg.is-none{display:none;}
.cp-g4-sch-dot{position:absolute;left:46px;top:50%;transform:translate(-50%,-50%);}
.cp-g4-sch-date{font-family:var(--theme-font-serif);font-weight:700;font-size:22px;line-height:1.2;letter-spacing:.01em;font-variant-numeric:lining-nums tabular-nums;color:var(--campus-accent-soft);white-space:nowrap;}
.cp-g4-sch-row.is-todo .cp-g4-sch-date{color:var(--theme-muted);}
.cp-g4-sch-now{display:inline-flex;align-items:center;gap:6px;height:28px;padding:0 12px 0 9px;border-radius:999px;background:var(--campus-fill);color:var(--theme-on-accent);font-size:17px;line-height:1;font-weight:700;letter-spacing:.08em;box-shadow:0 4px 10px rgb(var(--theme-accent-rgb) / .26);}
.cp-g4-sch-now-dot{flex:none;width:7px;height:7px;border-radius:50%;background:var(--campus-spark);}
/* 工作内容 / 阶段成果 */
.cp-g4-sch-task{font-weight:700;}
.cp-g4-sch-row.is-todo .cp-g4-sch-task{color:var(--theme-ink);}
.cp-g4-sch-result{color:var(--theme-muted);}
.cp-g4-sch-result-mark{flex:none;width:9px;height:9px;border-radius:2px;transform:rotate(45deg);background:var(--campus-accent-line);}
.cp-g4-sch-row.is-done .cp-g4-sch-result-mark{background:var(--campus-fill);}
.cp-g4-sch-row.is-current .cp-g4-sch-result-mark{background:var(--campus-spark);}
/* 当前阶段整行高亮:浅校色渐变底 + 左缘渐变竖条 */
.cp-g4-sch-row.is-current{background:linear-gradient(90deg,rgb(var(--theme-accent-rgb) / .1) 0%,rgb(var(--theme-accent-rgb) / .04) 100%)!important;}
.cp-g4-sch-row.is-current::before{content:'';position:absolute;left:0;top:6px;bottom:6px;width:6px;border-radius:0 4px 4px 0;background:var(--campus-fill-bar);}
.cp-g4-sch-row.is-current .cp-g4-sch-task{color:var(--theme-accent);}
.cp-g4-sch-row.is-current .cp-g4-sch-result{color:var(--theme-ink);font-weight:600;}
/* 完成度列 */
.cp-g4-sch-prog{flex-direction:column;align-items:stretch!important;justify-content:center;gap:8px!important;}
.cp-g4-sch-pct{display:flex;align-items:baseline;justify-content:flex-end;gap:2px;}
.cp-g4-sch-pct-num{font-family:var(--theme-font-serif);font-weight:700;font-size:26px;line-height:1;color:var(--theme-accent);font-variant-numeric:lining-nums tabular-nums;}
.cp-g4-sch-pct-unit{font-family:var(--theme-font-serif);font-weight:700;font-size:16px;color:var(--campus-accent-soft);}
.cp-g4-sch-todo{font-size:19px;line-height:26px;font-weight:600;letter-spacing:.08em;color:var(--theme-faint);}
.cp-g4-sch-row.is-todo .cp-g4-sch-pct-num,.cp-g4-sch-row.is-todo .cp-g4-sch-pct-unit{color:var(--theme-faint);}
/* 标题行右侧的周期胶囊 */
.cp-g4-sch-span{flex:none;display:flex;align-items:center;gap:10px;height:44px;padding:0 20px 0 14px;border-radius:999px;background:var(--campus-accent-tint);color:var(--theme-accent);font-size:20px;font-weight:700;letter-spacing:.04em;white-space:nowrap;}
.cp-g4-sch-span-icon{flex:none;display:block;}
/* 标题内嵌导航时,总周期胶囊放在表格上方右侧 */
.cp-g4-sch-span-row{flex:none;display:flex;justify-content:flex-end;margin:-14px 0 12px;}
.cp-g4-sch-span-row .cp-g4-sch-span{height:38px;font-size:18px;}
/* 行多时收紧 */
.cp-g4-sch.is-dense .campus-xt-td{padding-top:6px;padding-bottom:6px;font-size:21px;line-height:1.35;}
.cp-g4-sch.is-dense .cp-g4-sch-date{font-size:21px;}
.cp-g4-sch.is-dense .cp-g4-sch-now{height:24px;font-size:15px;}
.cp-g4-sch.is-dense .cp-g4-sch-time{gap:3px!important;}
`;

const ClockIcon = () => (
  <svg className="cp-g4-sch-span-icon" width="22" height="22" viewBox="0 0 22 22" aria-hidden="true">
    <circle cx="11" cy="11" r="8.5" fill="none" stroke="currentColor" strokeWidth="2.2" />
    <path d="M11 6.5 V11 L14 13" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export function ScheduleTable(props) {
  useStructureStyle();
  useAffairsStyle();
  useThemeStyle('campus-schedule-table-style', CSS);
  const p = { ...DEFAULTS, ...props };
  const rows = safeArray(p.rows).slice(0, clamp(p.rowCount, 4, 8));
  const current = clamp(Math.round(safeNumber(p.currentIndex, 1)), 0, rows.length) - 1;
  const cols = [
    'minmax(0,.78fr)',
    'minmax(0,1.3fr)',
    'minmax(0,1fr)',
    p.showProgress ? '220px' : null,
  ].filter(Boolean);
  const dense = rows.length >= 7;
  const stateOf = i => (current < 0 ? 'todo' : i < current ? 'done' : i === current ? 'current' : 'todo');
  const segTone = (i, half) => {
    if (half === 'top' && i === 0) return 'none';
    if (half === 'bottom' && i === rows.length - 1) return 'none';
    const solid = half === 'top' ? i <= current : i < current;
    return solid ? 'solid' : 'dash';
  };
  // 总周期胶囊默认放在标题行右端;「标题内嵌」导航时标题行右端被章节胶囊占用,改放到表格上方右侧
  const { nav } = useCampusLayout();
  const spanEl = p.showSpan ? (
    <div className="cp-g4-sch-span"><ClockIcon /><div>{p.span}</div></div>
  ) : null;
  const aside = nav === 'inline' ? null : spanEl;
  return (
    <CampusFrame chapterIndex={p.chapterIndex}>
      <TitleRow no={p.sectionNo} title={p.title} aside={aside} className="campus-rise" style={enterDelay(0)} />
      {nav === 'inline' && spanEl ? <div className="cp-g4-sch-span-row campus-rise" style={enterDelay(1)}>{spanEl}</div> : null}
      <div className="campus-xt-stage">
        <div className={`cp-g4-sch campus-xt campus-card campus-rise${dense ? ' is-dense' : ''}`} style={{ '--cp-xt-cols': cols.join(' '), maxHeight: 60 + rows.length * (rows.length <= 5 ? 150 : 124), ...enterDelay(1) }}>
          <div className="campus-xt-head">
            <div className="campus-xt-th cp-g4-sch-th-time"><div>{p.headTime}</div></div>
            <div className="campus-xt-th"><div>{p.headTask}</div></div>
            <div className="campus-xt-th"><div>{p.headResult}</div></div>
            {p.showProgress && <div className="campus-xt-th"><div className="campus-xt-mark" aria-hidden="true" /><div>{p.headProgress}</div></div>}
          </div>
          <div className="campus-xt-body">
            {rows.map((row, i) => {
              const state = stateOf(i);
              const pct = clamp(safeNumber(row?.progress, 0), 0, 100);
              return (
                <div className={`campus-xt-row cp-g4-sch-row is-${state} campus-fade${i % 2 ? ' is-zebra' : ''}`} style={enterDelay(2 + i)} key={i}>
                  <div className="campus-xt-td cp-g4-sch-time">
                    <div className="cp-g4-sch-rail" aria-hidden="true">
                      <div className={`cp-g4-sch-seg is-top is-${segTone(i, 'top')}`} />
                      <div className={`cp-g4-sch-seg is-bottom is-${segTone(i, 'bottom')}`} />
                    </div>
                    <RailNode state={state} label={String(i + 1)} className="cp-g4-sch-dot" />
                    <div className="cp-g4-sch-date">{row?.time}</div>
                    {state === 'current' && (
                      <div className="cp-g4-sch-now"><div className="cp-g4-sch-now-dot" aria-hidden="true" /><div>{p.currentLabel}</div></div>
                    )}
                  </div>
                  <div className="campus-xt-td cp-g4-sch-task"><div>{row?.task}</div></div>
                  <div className="campus-xt-td cp-g4-sch-result"><div className="cp-g4-sch-result-mark" aria-hidden="true" /><div>{row?.result}</div></div>
                  {p.showProgress && (
                    <div className="campus-xt-td cp-g4-sch-prog">
                      {state === 'todo' && pct <= 0 ? (
                        <div className="cp-g4-sch-pct"><div className="cp-g4-sch-todo">{p.todoLabel}</div></div>
                      ) : (
                        <div className="cp-g4-sch-pct">
                          <div className="cp-g4-sch-pct-num">{pct}</div>
                          <div className="cp-g4-sch-pct-unit">%</div>
                        </div>
                      )}
                      <MiniBar value={pct} tone={state === 'todo' ? 'gray' : 'solid'} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
      {p.showConclusion && <ConclusionBar label={p.conclusionLabel} text={p.conclusion} className="campus-rise" style={enterDelay(11)} />}
    </CampusFrame>
  );
}

ScheduleTable.META = {
  id: 'schedule-table',
  label: '进度安排表 · 竖向时间线串起各阶段',
  roles: ['actions', 'trend', 'process'],
  defaults: DEFAULTS,
  copyBudgets: {
    span: 24,
    headTime: 6,
    headTask: 8,
    headResult: 8,
    headProgress: 4,
    currentLabel: 4,
    todoLabel: 4,
    'rows[].time': 15,
    'rows[].task': 30,
    'rows[].result': 24,
    conclusionLabel: 4,
    conclusion: 44,
  },
  numberBounds: { 'rows[].progress': { min: 0, max: 100, semantics: 'percent' } },
  controls: [
    { ...CHAPTER_CONTROL, default: 4 },
    { key: 'rowCount', type: 'number', label: '阶段数', default: 7, min: 4, max: 8, countArrays: ['rows'], description: '表格的阶段(行)数;每行是 时间段 time / 工作内容 task / 阶段成果 result / 完成度 progress(0–100)。' },
    { key: 'currentIndex', type: 'number', label: '当前阶段', default: 2, min: 0, max: 8, maxFromKey: 'rowCount', description: '第几个阶段正在进行(1 起):它之前的阶段显示为已完成(实心节点 + 实线),之后的为未开始(空心节点 + 虚线);填 0 表示全部未开始。' },
    { key: 'showProgress', type: 'toggle', label: '完成度列', default: true, description: '最右侧的「完成度」列(百分比 + 进度条),读取每行的 progress。' },
    { key: 'showSpan', type: 'toggle', label: '总周期', default: true, description: '标题行右侧的总周期胶囊(span)。' },
    { key: 'showConclusion', type: 'toggle', label: '底部结论条', default: true, description: '页面底部的一句说明。' },
  ],
};
