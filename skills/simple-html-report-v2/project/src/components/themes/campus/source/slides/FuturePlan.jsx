// 阶梯式规划:3–4 级校色台阶从左到右逐级抬升,每级台阶上方是这一阶段的时间、目标和说明。
// 适合未来规划、发展路径、分阶段目标。
import React from 'react';
import { useThemeStyle, enterDelay } from '../../../shared/style.jsx';
import { safeArray, safeRatio, clamp } from '../../../chart-safety.mjs';
import { CampusFrame, TitleRow, ConclusionBar, CHAPTER_CONTROL } from '../kit/chrome.jsx';

const DEFAULTS = {
  chapterIndex: 4,
  stageCount: 4,
  showGoal: true,
  showConclusion: false,
  sectionNo: '04',
  title: '未来规划',
  goalLabel: '总体目标',
  goal: '成为懂研究、能实践的新媒体人',
  goalNote: '在学术上持续深造，在实践中服务社会，十年内成长为传播领域的复合型人才。',
  stages: [
    { no: '01', stage: '近期', time: '2025—2026 学年', title: '夯实专业基础', desc: '保持专业排名前列，高质量完成毕业论文，争取推荐免试攻读研究生。' },
    { no: '02', stage: '中期', time: '研究生阶段', title: '深耕学术研究', desc: '围绕数据新闻与内容生产方向开展研究，参与导师课题并发表学术论文。' },
    { no: '03', stage: '长期', time: '毕业后三至五年', title: '成为融合型媒体人', desc: '在主流媒体或内容机构一线工作，把研究方法用到真实的内容生产中。' },
    { no: '04', stage: '愿景', time: '十年以后', title: '回馈社会与母校', desc: '带着专业能力回到校园分享经验，参与公益传播项目，帮助更多人。' },
  ],
  conclusionLabel: '我的信念',
  conclusion: '以学术为根，以实践为翼，在传播领域一步一个台阶地持续成长。',
};

const CSS = `
.cp-fp{position:relative;flex:1;min-height:0;display:grid;grid-auto-flow:column;grid-auto-columns:minmax(0,1fr);column-gap:10px;align-items:end;}
.cp-fp-col{min-width:0;height:100%;display:flex;flex-direction:column;justify-content:flex-end;}
.cp-fp-text{padding:0 26px 26px 26px;}
.cp-fp-time{display:flex;align-items:center;gap:12px;font-size:20px;font-weight:700;letter-spacing:.04em;color:var(--theme-accent);}
.cp-fp-title{margin-top:12px;font-family:var(--theme-font-serif);font-weight:700;font-size:32px;line-height:1.25;letter-spacing:.04em;color:var(--theme-ink);}
.cp-fp-desc{margin-top:12px;font-size:22px;line-height:1.66;color:var(--theme-muted);text-wrap:pretty;}
/* 台阶:浅校色逐级加深,顶边一道渐变帽檐;最后一级(目标)用渐变色块 */
.cp-fp-step{position:relative;flex:none;display:flex;align-items:flex-start;justify-content:space-between;gap:12px;padding:26px 28px 20px;border-radius:var(--campus-radius) var(--campus-radius) 0 0;color:var(--theme-accent);}
.cp-fp-step-cap{position:absolute;left:0;right:0;top:0;height:8px;border-radius:var(--campus-radius) var(--campus-radius) 0 0;background:var(--campus-fill);}
.cp-fp-step.is-top{background:var(--campus-fill-deep);color:var(--theme-on-accent);box-shadow:var(--campus-shadow-lift);}
.cp-fp-step.is-top .cp-fp-step-cap{background:var(--campus-spark);left:28px;right:auto;width:64px;height:6px;border-radius:0 0 4px 4px;}
.cp-fp-no{position:relative;font-family:var(--theme-font-serif);font-weight:700;font-size:64px;line-height:.9;font-variant-numeric:lining-nums;}
.cp-fp-stage{position:relative;font-family:var(--theme-font-serif);font-weight:700;font-size:30px;line-height:1.2;letter-spacing:.2em;}
.cp-fp.is-3 .cp-fp-title{font-size:34px;}
.cp-fp-goal{position:absolute;left:0;top:0;padding:22px 34px 24px 44px;border-radius:var(--campus-radius);}
.cp-fp-goal-bar{position:absolute;left:16px;top:22px;bottom:22px;width:6px;border-radius:3px;background:var(--campus-fill-bar);}
.cp-fp-goal-text{margin-top:16px;font-family:var(--theme-font-serif);font-weight:700;font-size:40px;line-height:1.25;letter-spacing:.06em;color:var(--theme-accent);}
.cp-fp-goal-note{margin-top:12px;font-size:21px;line-height:1.62;color:var(--theme-muted);text-wrap:pretty;}
.cp-fp.is-3 .cp-fp-desc{font-size:23px;}
`;

export function FuturePlan(props) {
  useThemeStyle('campus-future-plan-style', CSS);
  const p = { ...DEFAULTS, ...props };
  const stages = safeArray(p.stages).slice(0, clamp(p.stageCount, 3, 4));
  const n = stages.length;
  // 台阶高度逐级抬升;底色从浅校色逐级加深,最高一级为校色实底。
  const tall = !p.showConclusion;
  const base = n === 3 ? (tall ? 190 : 170) : (tall ? 170 : 150);
  const rise = n === 3 ? (tall ? 150 : 125) : (tall ? 115 : 98);
  return (
    <CampusFrame chapterIndex={p.chapterIndex}>
      <TitleRow no={p.sectionNo} title={p.title} className="campus-rise" style={enterDelay(0)} />
      <div className={`cp-fp is-${n}`}>
        {p.showGoal && (
          <div className="cp-fp-goal campus-wash campus-rise" style={{ width: `calc(${clamp(safeRatio(2, n, 1), 0, 1) * 100}% - 40px)`, ...enterDelay(1) }}>
            <div className="cp-fp-goal-bar" aria-hidden="true" />
            <div className="campus-chip">{p.goalLabel}</div>
            <div className="cp-fp-goal-text">{p.goal}</div>
            <p className="cp-fp-goal-note">{p.goalNote}</p>
          </div>
        )}
        {stages.map((stage, i) => (
          <div className="cp-fp-col" key={i}>
            <div className="cp-fp-text campus-rise" style={enterDelay(2 + i)}>
              <div className="cp-fp-time"><div className="campus-mark" aria-hidden="true" /><div>{stage?.time}</div></div>
              <h3 className="cp-fp-title">{stage?.title}</h3>
              <p className="cp-fp-desc">{stage?.desc}</p>
            </div>
            <div
              className={`cp-fp-step campus-grow${i === n - 1 ? ' is-top' : ''}`}
              style={{ height: base + i * rise, ...(i === n - 1 ? {} : { background: `rgb(var(--theme-accent-rgb) / ${(0.06 + i * 0.05).toFixed(2)})` }), ...enterDelay(1 + i) }}
            >
              <div className="cp-fp-step-cap" aria-hidden="true" />
              <div className="cp-fp-no">{stage?.no}</div>
              <div className="cp-fp-stage">{stage?.stage}</div>
            </div>
          </div>
        ))}
      </div>
      {p.showConclusion && <ConclusionBar label={p.conclusionLabel} text={p.conclusion} className="campus-rise" style={enterDelay(7)} />}
    </CampusFrame>
  );
}

FuturePlan.META = {
  id: 'future-plan',
  label: '阶梯规划 · 逐级抬升的阶段目标',
  roles: ['actions', 'process', 'trend'],
  defaults: DEFAULTS,
  copyBudgets: { goal: 16, goalNote: 44, 'stages[].title': 9, 'stages[].desc': 40, 'stages[].stage': 6, conclusion: 44 },
  controls: [
    { ...CHAPTER_CONTROL, default: 4 },
    { key: 'stageCount', type: 'number', label: '阶段数量', default: 4, min: 3, max: 4, description: '台阶的级数。' },
    { key: 'showGoal', type: 'toggle', label: '总体目标', default: true, description: '左上方的总体目标块(放在台阶留出的空白处)。' },
    { key: 'showConclusion', type: 'toggle', label: '底部结论条', default: false, description: '页面底部的校色结论条。' },
  ],
};
