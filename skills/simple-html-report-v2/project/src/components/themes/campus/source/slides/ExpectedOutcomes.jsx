// 预期成果:3–5 张分级指标卡排成一行,每张是「渐变奖章里的大数字 + 单位 + 成果名 + 一句考核说明 + 指标性质标签」;
// 卡片可按「理论成果 / 应用成果 / 人才培养」分成 1–3 组,组名画在卡片上方的括线上。
// 适合开题报告、项目申报的「预期成果 / 考核指标」。
import React from 'react';
import { useThemeStyle, enterDelay } from '../../../shared/style.jsx';
import { safeArray, safeNumber, safeMax, safeRatio, clamp } from '../../../chart-safety.mjs';
import { CampusFrame, TitleRow, ConclusionBar, CHAPTER_CONTROL, textWidthEm, useCampusLayout, TITLE_ROW_SPACE, CONCLUSION_SPACE } from '../kit/chrome.jsx';
import { useAffairsStyle } from '../kit/affairs.jsx';

const DEFAULTS = {
  chapterIndex: 5,
  cardCount: 5,
  groupCount: 3,
  showTags: true,
  showDue: true,
  showConclusion: true,
  sectionNo: '5.2',
  title: '预期成果与考核指标',
  noteLabel: '考核',
  dueLabel: '完成时间',
  groups: [
    { name: '理论成果', note: 'THEORY' },
    { name: '应用成果', note: 'APPLICATION' },
    { name: '人才培养', note: 'TALENT' },
  ],
  cards: [
    { group: 1, value: '2', unit: '篇', name: '学术论文', note: '以第一作者发表，其中 EI 检索期刊或会议论文不少于 1 篇', tag: '约束性', due: '2023.09' },
    { group: 1, value: '1', unit: '件', name: '发明专利', note: '围绕权函数抗差方法申请发明专利并进入实审', tag: '预期性', due: '2023.12' },
    { group: 2, value: '1', unit: '套', name: '深组合软件平台', note: '完成惯导辅助的软件接收机平台，可处理实测中频数据', tag: '约束性', due: '2023.12' },
    { group: 2, value: '1', unit: '份', name: '测试分析报告', note: '城市复杂环境下实测数据的定位精度与抗差性能对比', tag: '预期性', due: '2024.02' },
    { group: 3, value: '1', unit: '名', name: '硕士学位论文', note: '按期完成学位论文撰写、送审与答辩', tag: '约束性', due: '2024.05' },
  ],
  conclusionLabel: '成果对应',
  conclusion: '论文与专利对应两项创新点，软件平台与测试报告支撑研究内容的工程验证。',
};

const CSS = `
.cp-g4-exp{flex:1;min-height:0;display:grid;grid-template-rows:auto minmax(0,1fr);column-gap:26px;row-gap:18px;}
/* 组名括线:渐变胶囊居中,两侧细线下折成括号 */
.cp-g4-exp-group{position:relative;display:flex;align-items:center;justify-content:center;height:58px;}
.cp-g4-exp-brace{position:absolute;left:10px;right:10px;top:29px;height:22px;border:2px solid var(--campus-accent-line);border-bottom:0;border-radius:12px 12px 0 0;}
.cp-g4-exp-chip{position:relative;display:flex;align-items:center;gap:12px;height:46px;padding:0 24px 0 20px;border-radius:999px;background:var(--campus-fill);color:var(--theme-on-accent);box-shadow:0 8px 18px rgb(var(--theme-accent-rgb) / .26);}
.cp-g4-exp-chip-mark{flex:none;width:9px;height:9px;border-radius:2px;transform:rotate(45deg);background:var(--campus-spark);}
.cp-g4-exp-chip-name{font-size:22px;line-height:1;font-weight:700;letter-spacing:.1em;white-space:nowrap;}
.cp-g4-exp-chip-note{font-family:var(--theme-font-serif);font-size:15px;line-height:1;font-weight:700;letter-spacing:.14em;color:var(--campus-on-accent-muted);white-space:nowrap;}
/* 指标卡 */
.cp-g4-exp-card{position:relative;min-width:0;min-height:0;display:flex;flex-direction:column;align-items:center;padding:30px 28px 0;text-align:center;}
.cp-g4-exp-body{flex:1;min-height:0;display:flex;flex-direction:column;align-items:center;justify-content:flex-start;padding:var(--cp-g4-top) 0 22px;}
.cp-g4-exp-note{min-height:3.1em;}
.cp-g4-exp-due{flex:none;align-self:stretch;display:flex;align-items:center;justify-content:space-between;gap:12px;margin:0 -28px;padding:16px 28px 18px;border-top:1px dashed var(--campus-accent-line);background:var(--campus-wash);border-radius:0 0 var(--campus-radius) var(--campus-radius);}
.cp-g4-exp-due-label{display:flex;align-items:center;gap:8px;font-size:18px;font-weight:600;letter-spacing:.08em;color:var(--theme-muted);white-space:nowrap;}
.cp-g4-exp-due-icon{flex:none;display:block;color:var(--campus-accent-soft);}
.cp-g4-exp-due-value{font-family:var(--theme-font-serif);font-weight:700;font-size:24px;line-height:1;color:var(--theme-accent);font-variant-numeric:lining-nums tabular-nums;white-space:nowrap;}
.cp-g4-exp.is-5 .cp-g4-exp-due{margin:0 -22px;padding-left:22px;padding-right:22px;}
.cp-g4-exp-cap{position:absolute;left:50%;top:0;width:76px;height:6px;margin-left:-38px;border-radius:0 0 4px 4px;background:var(--campus-fill);}
.cp-g4-exp-tag{position:absolute;top:18px;right:18px;height:30px;display:flex;align-items:center;padding:0 12px;border-radius:7px;font-size:17px;font-weight:700;letter-spacing:.06em;white-space:nowrap;background:var(--campus-accent-tint);color:var(--theme-accent);}
.cp-g4-exp-medal-wrap{position:relative;flex:none;width:var(--cp-g4-medal);height:var(--cp-g4-medal);margin-bottom:34px;}
.cp-g4-exp-halo{position:absolute;inset:-16px;border-radius:50%;background:radial-gradient(circle,rgb(var(--theme-accent-rgb) / .12) 0%,rgb(var(--theme-accent-rgb) / 0) 70%);}
.cp-g4-exp-medal{position:absolute;inset:0;border-radius:50%;background:var(--campus-fill-deep);box-shadow:0 0 0 7px var(--theme-surface),0 0 0 9px var(--campus-accent-line),0 16px 30px rgb(var(--theme-accent-rgb) / .3);}
.cp-g4-exp-shine{position:absolute;left:18%;top:10%;width:46%;height:24%;border-radius:50%;background:linear-gradient(180deg,rgb(255 255 255 / .28) 0%,rgb(255 255 255 / 0) 100%);}
.cp-g4-exp-spark{position:absolute;right:6%;top:8%;width:16px;height:16px;border-radius:3px;transform:rotate(45deg);background:var(--campus-spark);box-shadow:0 0 0 4px var(--theme-surface);}
.cp-g4-exp-figure{position:absolute;inset:0;display:flex;align-items:baseline;justify-content:center;padding-top:calc(var(--cp-g4-medal) * .3);gap:4px;color:var(--theme-on-accent);}
.cp-g4-exp-value{font-family:var(--theme-font-serif);font-weight:700;font-size:var(--cp-g4-value);line-height:.9;font-variant-numeric:lining-nums;white-space:nowrap;}
.cp-g4-exp-unit{font-size:calc(var(--cp-g4-value) * .32);font-weight:700;white-space:nowrap;}
.cp-g4-exp-name{margin-top:0;font-family:var(--theme-font-serif);font-size:30px;line-height:1.3;font-weight:700;letter-spacing:.04em;color:var(--theme-ink);text-wrap:balance;}
.cp-g4-exp-rule{flex:none;width:44px;height:4px;margin:18px 0 16px;border-radius:2px;background:var(--campus-fill);}
.cp-g4-exp-note-wrap{display:flex;flex-direction:column;align-items:center;gap:10px;}
.cp-g4-exp-note-label{display:flex;align-items:center;height:28px;padding:0 12px;border-radius:999px;font-size:17px;font-weight:700;letter-spacing:.12em;color:var(--campus-accent-soft);background:var(--campus-accent-wash);border:1px solid var(--campus-accent-line);}
.cp-g4-exp-note{font-size:21px;line-height:1.55;color:var(--theme-muted);text-wrap:pretty;}
.cp-g4-exp.is-5 .cp-g4-exp-card{padding-left:22px;padding-right:22px;}
.cp-g4-exp.is-5 .cp-g4-exp-name{font-size:27px;}
.campus[data-campus-nav="rail"] .cp-g4-exp.is-5 .cp-g4-exp-note{font-size:20px;}
`;

export function ExpectedOutcomes(props) {
  useAffairsStyle();
  useThemeStyle('campus-expected-outcomes-style', CSS);
  const p = { ...DEFAULTS, ...props };
  const cards = safeArray(p.cards).slice(0, clamp(p.cardCount, 3, 5));
  const groupCount = clamp(p.groupCount, 1, 3);
  const groups = safeArray(p.groups).slice(0, groupCount);
  // 卡片按 group(1 起)归组;连续同组的卡片共用一条括线。只有 1 组时不画括线。
  const groupOf = card => clamp(Math.round(safeNumber(card?.group, 1)), 1, groupCount);
  const runs = [];
  cards.forEach((card, i) => {
    const g = groupOf(card);
    const last = runs[runs.length - 1];
    if (last && last.g === g) last.span += 1;
    else runs.push({ g, start: i, span: 1 });
  });
  const showGroups = groupCount > 1;
  // 奖章尺寸:取「卡宽」与「卡高减去文字区」两者中较小的一个,卡少、版面高时奖章更大;数字较长时缩小字号
  const { bodyW, bodyH } = useCampusLayout();
  const cardW = safeRatio(bodyW - (cards.length - 1) * 26, cards.length, 300);
  const cardH = bodyH - TITLE_ROW_SPACE - (showGroups ? 76 : 0) - (p.showConclusion ? CONCLUSION_SPACE : 0) - (p.showDue ? 64 : 0);
  const medal = Math.round(clamp(Math.min(cardW - 120, cardH - 330, 250), 140, 250));
  // 各卡统一从同一高度起排(不按各自内容居中,避免说明行数不同时奖章高低不齐):上方留出约一半空余(卡少、不显示分组与完成时间时卡很高,按一半留白才不显得头重脚轻)
  const bodyTop = Math.round(clamp((cardH - 60 - (medal + 34 + 40 + 38 + 38 + 70)) * 0.5, 18, 170));
  // 数字 + 单位要放进奖章的内宽(约 0.74 个直径):衬线数字约 0.6em 宽,单位字号是数字的 0.32 倍
  const longest = safeMax(cards.map(c => textWidthEm(c?.value) * 1.04 + textWidthEm(c?.unit) * 0.32), 1);
  const valueSize = Math.round(clamp(Math.min(medal * 0.52, safeRatio(medal * 0.74, longest, medal * 0.52)), 36, 120));
  return (
    <CampusFrame chapterIndex={p.chapterIndex}>
      <TitleRow no={p.sectionNo} title={p.title} className="campus-rise" style={enterDelay(0)} />
      <div
        className={`cp-g4-exp is-${cards.length}`}
        style={{ gridTemplateColumns: `repeat(${cards.length}, minmax(0,1fr))`, gridTemplateRows: showGroups ? 'auto minmax(0,1fr)' : 'minmax(0,1fr)', '--cp-g4-medal': `${medal}px`, '--cp-g4-top': `${bodyTop}px`, '--cp-g4-value': `${valueSize}px` }}
      >
        {showGroups && runs.map((run, r) => (
          <div className="cp-g4-exp-group campus-rise" style={{ gridColumn: `${run.start + 1} / span ${run.span}`, gridRow: 1, ...enterDelay(1 + r) }} key={`g${r}`}>
            <div className="cp-g4-exp-brace" aria-hidden="true" />
            <div className="cp-g4-exp-chip">
              <div className="cp-g4-exp-chip-mark" aria-hidden="true" />
              <div className="cp-g4-exp-chip-name">{groups[run.g - 1]?.name}</div>
              <div className="cp-g4-exp-chip-note">{groups[run.g - 1]?.note}</div>
            </div>
          </div>
        ))}
        {cards.map((card, i) => (
          <section className="cp-g4-exp-card campus-card campus-rise" style={{ gridColumn: i + 1, gridRow: showGroups ? 2 : 1, ...enterDelay(3 + i) }} key={i}>
            <div className="cp-g4-exp-cap" aria-hidden="true" />
            {p.showTags && card?.tag ? <div className="cp-g4-exp-tag">{card.tag}</div> : null}
            <div className="cp-g4-exp-body">
              <div className="cp-g4-exp-medal-wrap">
                <div className="cp-g4-exp-halo" aria-hidden="true" />
                <div className="cp-g4-exp-medal" aria-hidden="true" />
                <div className="cp-g4-exp-shine" aria-hidden="true" />
                <div className="cp-g4-exp-spark" aria-hidden="true" />
                <div className="cp-g4-exp-figure">
                  <div className="cp-g4-exp-value">{card?.value}</div>
                  <div className="cp-g4-exp-unit">{card?.unit}</div>
                </div>
              </div>
              <h3 className="cp-g4-exp-name">{card?.name}</h3>
              <div className="cp-g4-exp-rule" aria-hidden="true" />
              <div className="cp-g4-exp-note-wrap">
                <div className="cp-g4-exp-note-label">{p.noteLabel}</div>
                <p className="cp-g4-exp-note">{card?.note}</p>
              </div>
            </div>
            {p.showDue && (
              <div className="cp-g4-exp-due">
                <div className="cp-g4-exp-due-label">
                  <svg className="cp-g4-exp-due-icon" width="20" height="20" viewBox="0 0 22 22" aria-hidden="true"><circle cx="11" cy="11" r="8.5" fill="none" stroke="currentColor" strokeWidth="2.2" /><path d="M11 6.5 V11 L14 13" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  <div>{p.dueLabel}</div>
                </div>
                <div className="cp-g4-exp-due-value">{card?.due}</div>
              </div>
            )}
          </section>
        ))}
      </div>
      {p.showConclusion && <ConclusionBar label={p.conclusionLabel} text={p.conclusion} className="campus-rise" style={enterDelay(10)} />}
    </CampusFrame>
  );
}

ExpectedOutcomes.META = {
  id: 'expected-outcomes',
  label: '预期成果 · 奖章大数字指标卡分组',
  roles: ['result', 'metrics', 'actions'],
  defaults: DEFAULTS,
  copyBudgets: {
    noteLabel: 4,
    dueLabel: 5,
    'cards[].due': 8,
    'groups[].name': 6,
    'groups[].note': 12,
    'cards[].value': 4,
    'cards[].unit': 2,
    'cards[].name': 10,
    'cards[].note': 32,
    'cards[].tag': 4,
    conclusionLabel: 4,
    conclusion: 44,
  },
  numberBounds: { 'cards[].group': { min: 1, max: 3, semantics: 'index' } },
  controls: [
    { ...CHAPTER_CONTROL, default: 5 },
    { key: 'cardCount', type: 'number', label: '指标卡数量', default: 5, min: 3, max: 5, countArrays: ['cards'], description: '一行几张指标卡;每张是 数字 value + 单位 unit + 成果名 name + 考核说明 note + 指标性质 tag(如「约束性」「预期性」)+ 完成时间 due。' },
    { key: 'groupCount', type: 'number', label: '分组数', default: 3, min: 1, max: 3, countArrays: ['groups'], description: '把指标卡分成几组(组名取 groups 的前几项);每张卡的 group 写所属组号(1 起),同组的卡片要排在一起,共用一条括线。1 组时不显示组名。' },
    { key: 'showTags', type: 'toggle', label: '指标性质标签', default: true, description: '卡片右上角的小标签(tag)。' },
    { key: 'showDue', type: 'toggle', label: '完成时间', default: true, description: '卡片底部的完成时间条(due)。' },
    { key: 'showConclusion', type: 'toggle', label: '底部结论条', default: true, description: '页面底部的一句说明。' },
  ],
};
