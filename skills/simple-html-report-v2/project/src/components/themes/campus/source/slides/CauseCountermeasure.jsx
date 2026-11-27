// 问题—原因—对策:3–5 行,每行三格横向对应「存在的问题 → 原因分析 → 对策建议」。
// 列头是连成一支箭头的三段色带,三列的视觉权重逐级加强:问题用中性灰、原因用浅校色、对策用校色(白卡 + 渐变边条 + 勾选章);
// 行内用箭头圆钮连接,行首是编号与可选的层面标签。这是经管文科类研究内容的核心页。
import React from 'react';
import { useThemeStyle, enterDelay } from '../../../shared/style.jsx';
import { safeArray, clamp } from '../../../chart-safety.mjs';
import { CampusFrame, TitleRow, ConclusionBar, CHAPTER_CONTROL } from '../kit/chrome.jsx';
import { useAffairsStyle, ChevronShape, ArrowGlyph, CheckGlyph } from '../kit/affairs.jsx';

const DEFAULTS = {
  chapterIndex: 3,
  rowCount: 4,
  showTopics: true,
  showConclusion: true,
  sectionNo: '3.3',
  title: '管理会计应用的问题、成因与对策',
  headProblem: '存在的问题',
  headProblemNote: 'PROBLEM',
  headCause: '原因分析',
  headCauseNote: 'CAUSE',
  headMeasure: '对策建议',
  headMeasureNote: 'COUNTERMEASURE',
  rows: [
    { topic: '认知层面', problem: '管理者把管理会计划归为财务会计，没有独立规划', cause: '对管理会计的定位认识过于简单，认为它与经营决策关系不大', measure: '把管理会计纳入企业战略规划，设立独立岗位与职责' },
    { topic: '工具层面', problem: '共享经济下数据分析不足，管理会计工具难以落地', cause: '业务与财务系统分散，缺少统一的数据标准', measure: '建设业财一体的信息系统，统一数据口径，推广电子工具' },
    { topic: '人才层面', problem: '从业人员知识和专业能力不足，力不从心', cause: '人才培养偏重核算，管理会计人才缺口大', measure: '开展管理会计专项培训，建立案例库，完善激励机制' },
    { topic: '研究层面', problem: '工具应用领域少，成果集中在少数几个领域', cause: '理论研究与企业实际需求脱节', measure: '从企业需求出发加强薄弱领域研究，推动理论落地' },
    { topic: '制度层面', problem: '具有公益性特征的部门制约了管理会计建设', cause: '以经济效益为主的评价体系与公益性定位不匹配', measure: '按部门性质分类设计考核指标，兼顾社会效益' },
  ],
  conclusionLabel: '核心观点',
  conclusion: '问题的根子在认识和体系：先把管理会计放进战略，再用系统和人才把它落到日常经营里。',
};

const CSS = `
.cp-g4-pcm{flex:1;min-height:0;display:flex;flex-direction:column;gap:14px;}
.cp-g4-pcm-grid{display:grid;column-gap:0;}
/* 列头:三段箭头色带 */
.cp-g4-pcm-head{flex:none;height:76px;}
.cp-g4-pcm-th{position:relative;isolation:isolate;display:flex;align-items:center;gap:14px;padding:0 44px 0 40px;}
.cp-g4-pcm-th.is-first{padding-left:26px;}
.cp-g4-pcm-th-name{font-size:25px;line-height:1.2;font-weight:700;letter-spacing:.1em;white-space:nowrap;}
.cp-g4-pcm-th-note{font-family:var(--theme-font-serif);font-size:15px;line-height:1;font-weight:700;letter-spacing:.16em;white-space:nowrap;}
.cp-g4-pcm-th-icon{flex:none;display:grid;place-items:center;width:38px;height:38px;border-radius:50%;}
.cp-g4-pcm-th.is-problem{color:var(--theme-ink);}
.cp-g4-pcm-th.is-problem .cp-g4-pcm-th-note{color:var(--theme-faint);}
.cp-g4-pcm-th.is-problem .cp-g4-pcm-th-icon{background:var(--theme-surface);color:var(--campus-neutral);}
.cp-g4-pcm-th.is-cause{color:var(--theme-accent);}
.cp-g4-pcm-th.is-cause .cp-g4-pcm-th-note{color:var(--campus-accent-soft);}
.cp-g4-pcm-th.is-cause .cp-g4-pcm-th-icon{background:var(--theme-surface);color:var(--theme-accent);}
.cp-g4-pcm-th.is-measure{color:var(--theme-on-accent);}
.cp-g4-pcm-th.is-measure .cp-g4-pcm-th-note{color:var(--campus-on-accent-muted);}
.cp-g4-pcm-th.is-measure .cp-g4-pcm-th-icon{background:var(--campus-on-accent-glass);color:var(--campus-spark);}
.cp-g4-pcm-head-lead{display:flex;align-items:center;justify-content:center;}
/* 行 */
.cp-g4-pcm-body{flex:1;min-height:0;display:flex;flex-direction:column;gap:14px;}
.cp-g4-pcm-row{flex:1 1 0;min-height:0;max-height:170px;align-items:stretch;}
.cp-g4-pcm-lead{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;padding-right:14px;}
.cp-g4-pcm-no{flex:none;display:grid;place-items:center;width:50px;height:50px;border-radius:14px 14px 14px 4px;background:var(--campus-fill);color:var(--theme-on-accent);box-shadow:0 6px 14px rgb(var(--theme-accent-rgb) / .26);font-family:var(--theme-font-serif);font-weight:700;font-size:23px;line-height:1;font-variant-numeric:lining-nums;}
.cp-g4-pcm-topic{font-size:18px;line-height:1.25;font-weight:700;letter-spacing:.06em;color:var(--campus-accent-soft);text-align:center;}
.cp-g4-pcm-cell{position:relative;min-width:0;display:flex;align-items:center;gap:16px;padding:14px 26px;border-radius:var(--campus-radius-sm);}
.cp-g4-pcm-text{font-size:21px;line-height:1.5;text-wrap:pretty;}
.cp-g4-pcm-cell.is-problem{background:var(--campus-neutral-wash);border:1px solid var(--theme-line);}
.cp-g4-pcm-cell.is-problem .cp-g4-pcm-text{color:var(--theme-muted);}
.cp-g4-pcm-cell.is-cause{background:var(--campus-wash);border:1px solid var(--campus-accent-tint);}
.cp-g4-pcm-cell.is-cause .cp-g4-pcm-text{color:var(--theme-ink);}
.cp-g4-pcm-cell.is-measure{padding-left:30px;}
.cp-g4-pcm-cell.is-measure .cp-g4-pcm-text{flex:1;min-width:0;color:var(--theme-ink);font-weight:700;}
.cp-g4-pcm-measure-bar{position:absolute;left:0;top:0;bottom:0;width:7px;border-radius:var(--campus-radius-sm) 0 0 var(--campus-radius-sm);background:var(--campus-fill-bar);}
.cp-g4-pcm-check{flex:none;display:grid;place-items:center;width:34px;height:34px;border-radius:50%;background:var(--campus-fill);color:var(--theme-on-accent);box-shadow:0 5px 12px rgb(var(--theme-accent-rgb) / .28);}
.cp-g4-pcm-tick{flex:none;width:9px;height:9px;border-radius:2px;transform:rotate(45deg);}
.cp-g4-pcm-cell.is-problem .cp-g4-pcm-tick{background:var(--campus-neutral-soft);}
.cp-g4-pcm-cell.is-cause .cp-g4-pcm-tick{background:var(--campus-accent-line);}
/* 两格之间的箭头圆钮 */
.cp-g4-pcm-link{display:flex;align-items:center;justify-content:center;}
.cp-g4-pcm-link-dot{display:grid;place-items:center;width:36px;height:36px;border-radius:50%;}
.cp-g4-pcm-link.is-soft .cp-g4-pcm-link-dot{background:var(--theme-surface);border:1.5px solid var(--campus-neutral-soft);color:var(--campus-neutral);}
.cp-g4-pcm-link.is-solid .cp-g4-pcm-link-dot{background:var(--campus-fill);color:var(--theme-on-accent);box-shadow:0 6px 14px rgb(var(--theme-accent-rgb) / .3);}
.cp-g4-pcm.is-dense .cp-g4-pcm-text{font-size:20px;line-height:1.42;}
.cp-g4-pcm.is-dense .cp-g4-pcm-cell{padding-top:10px;padding-bottom:10px;}
.cp-g4-pcm.is-dense .cp-g4-pcm-body{gap:12px;}
.cp-g4-pcm.is-dense .cp-g4-pcm-no{width:44px;height:44px;font-size:21px;}
/* 3 行及以下:行高上限放宽、字号放大一档,不在表格下方留出大段空白 */
.cp-g4-pcm.is-sparse .cp-g4-pcm-row{max-height:224px;}
.cp-g4-pcm.is-sparse .cp-g4-pcm-text{font-size:23px;line-height:1.55;}
`;

const COLS_WITH_LEAD = '120px minmax(0,1fr) 54px minmax(0,1.06fr) 54px minmax(0,1.2fr)';
const COLS_NO_LEAD = '76px minmax(0,1fr) 54px minmax(0,1.06fr) 54px minmax(0,1.2fr)';

const ProblemIcon = () => (
  <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden="true">
    <circle cx="11" cy="11" r="8.5" fill="none" stroke="currentColor" strokeWidth="2.2" />
    <path d="M11 6.5 V12" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
    <circle cx="11" cy="15.4" r="1.4" fill="currentColor" />
  </svg>
);
const CauseIcon = () => (
  <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden="true">
    <circle cx="9.5" cy="9.5" r="6" fill="none" stroke="currentColor" strokeWidth="2.2" />
    <path d="M14 14 L19 19" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
  </svg>
);

export function CauseCountermeasure(props) {
  useAffairsStyle();
  useThemeStyle('campus-cause-countermeasure-style', CSS);
  const p = { ...DEFAULTS, ...props };
  const rows = safeArray(p.rows).slice(0, clamp(p.rowCount, 3, 5));
  const cols = p.showTopics ? COLS_WITH_LEAD : COLS_NO_LEAD;
  const dense = rows.length >= 5;
  return (
    <CampusFrame chapterIndex={p.chapterIndex}>
      <TitleRow no={p.sectionNo} title={p.title} className="campus-rise" style={enterDelay(0)} />
      <div className={`cp-g4-pcm${dense ? ' is-dense' : ''}${rows.length <= 3 ? ' is-sparse' : ''}`}>
        <div className="cp-g4-pcm-grid cp-g4-pcm-head campus-rise" style={{ gridTemplateColumns: cols, ...enterDelay(1) }}>
          <div className="cp-g4-pcm-head-lead" aria-hidden="true" />
          <div className="cp-g4-pcm-th is-problem is-first" style={{ gridColumn: '2 / span 2' }}>
            <ChevronShape tone="neutral" first />
            <div className="cp-g4-pcm-th-icon"><ProblemIcon /></div>
            <div className="cp-g4-pcm-th-name">{p.headProblem}</div>
            <div className="cp-g4-pcm-th-note">{p.headProblemNote}</div>
          </div>
          <div className="cp-g4-pcm-th is-cause" style={{ gridColumn: '4 / span 2', marginLeft: -16 }}>
            <ChevronShape tone="soft" />
            <div className="cp-g4-pcm-th-icon"><CauseIcon /></div>
            <div className="cp-g4-pcm-th-name">{p.headCause}</div>
            <div className="cp-g4-pcm-th-note">{p.headCauseNote}</div>
          </div>
          <div className="cp-g4-pcm-th is-measure" style={{ gridColumn: '6', marginLeft: -16 }}>
            <ChevronShape tone="solid" last />
            <div className="cp-g4-pcm-th-icon"><CheckGlyph size={18} /></div>
            <div className="cp-g4-pcm-th-name">{p.headMeasure}</div>
            <div className="cp-g4-pcm-th-note">{p.headMeasureNote}</div>
          </div>
        </div>
        <div className="cp-g4-pcm-body">
          {rows.map((row, i) => (
            <div className="cp-g4-pcm-grid cp-g4-pcm-row campus-rise" style={{ gridTemplateColumns: cols, ...enterDelay(2 + i) }} key={i}>
              <div className="cp-g4-pcm-lead">
                <div className="cp-g4-pcm-no">{String(i + 1).padStart(2, '0')}</div>
                {p.showTopics && <div className="cp-g4-pcm-topic">{row?.topic}</div>}
              </div>
              <div className="cp-g4-pcm-cell is-problem">
                <div className="cp-g4-pcm-tick" aria-hidden="true" />
                <p className="cp-g4-pcm-text">{row?.problem}</p>
              </div>
              <div className="cp-g4-pcm-link is-soft" aria-hidden="true"><div className="cp-g4-pcm-link-dot"><ArrowGlyph size={20} stroke={2.6} /></div></div>
              <div className="cp-g4-pcm-cell is-cause">
                <div className="cp-g4-pcm-tick" aria-hidden="true" />
                <p className="cp-g4-pcm-text">{row?.cause}</p>
              </div>
              <div className="cp-g4-pcm-link is-solid" aria-hidden="true"><div className="cp-g4-pcm-link-dot"><ArrowGlyph size={20} stroke={2.8} /></div></div>
              <div className="cp-g4-pcm-cell is-measure campus-card">
                <div className="cp-g4-pcm-measure-bar" aria-hidden="true" />
                <p className="cp-g4-pcm-text">{row?.measure}</p>
                <div className="cp-g4-pcm-check" aria-hidden="true"><CheckGlyph size={16} /></div>
              </div>
            </div>
          ))}
        </div>
      </div>
      {p.showConclusion && <ConclusionBar label={p.conclusionLabel} text={p.conclusion} className="campus-rise" style={enterDelay(10)} />}
    </CampusFrame>
  );
}

CauseCountermeasure.META = {
  id: 'cause-countermeasure',
  label: '问题—原因—对策 · 三段递进对应行',
  roles: ['risks', 'actions', 'relationship'],
  defaults: DEFAULTS,
  copyBudgets: {
    headProblem: 6,
    headProblemNote: 14,
    headCause: 6,
    headCauseNote: 14,
    headMeasure: 6,
    headMeasureNote: 14,
    'rows[].topic': 5,
    'rows[].problem': 32,
    'rows[].cause': 32,
    'rows[].measure': 36,
    conclusionLabel: 4,
    conclusion: 44,
  },
  controls: [
    { ...CHAPTER_CONTROL, default: 3 },
    { key: 'rowCount', type: 'number', label: '对应行数', default: 4, min: 3, max: 5, countArrays: ['rows'], description: '「问题 → 原因 → 对策」的行数;每行是 层面标签 topic、问题 problem、原因 cause、对策 measure,三格各写一句(30 字左右)。' },
    { key: 'showTopics', type: 'toggle', label: '层面标签', default: true, description: '行首编号下方的层面标签(如「认知层面」「人才层面」)。' },
    { key: 'showConclusion', type: 'toggle', label: '底部结论条', default: true, description: '页面底部的一句核心观点。' },
  ],
};
