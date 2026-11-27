// 问答页:3–4 组「问—答」序号卡片(上沿伸出 Q 编号标签;3 组三行通栏、问左答右,4 组两行两列),问题用渐变圆章,回应用浅校色圆章。
// 适合预设答辩问题、常见疑问、评审意见回应。
import React from 'react';
import { useThemeStyle, enterDelay } from '../../../shared/style.jsx';
import { safeArray, clamp } from '../../../chart-safety.mjs';
import { CampusFrame, TitleRow, CHAPTER_CONTROL } from '../kit/chrome.jsx';
import { NumberCard } from '../kit/parts.jsx';

const DEFAULTS = {
  chapterIndex: 4,
  itemCount: 4,
  sectionNo: '4.3',
  title: '预设答辩问题',
  questionLabel: '问',
  answerLabel: '答',
  items: [
    { no: 'Q1', question: '只研究一个个案，结论有代表性吗？', answer: '本文的目的不是统计推断，而是揭示机制。个案研究适合回答“如何运作”的问题；研究对象是行业中少有的长期稳定增长样本，结论将以“可借鉴的机制”而非“普遍规律”的形式呈现。' },
    { no: 'Q2', question: '只用二手资料，数据可靠吗？', answer: '资料来自公开视频、创始人访谈、媒体报道与平台公开数据，关键事实做多来源交叉核对；无法核实的数据不进入分析，并在研究不足中如实说明这一局限。' },
    { no: 'Q3', question: '三种理论为什么能放进一个框架？', answer: '三种理论分别解释技术、组织与关系三个层面的问题，层次互补而非重复：只看任何一层都无法解释“持续成功”，合在一起才能形成完整的解释框架。' },
    { no: 'Q4', question: '研究对中小创作者有什么意义？', answer: '机制中的数据评估、封面测试与复盘方法门槛较低，可以被中小创作者直接借鉴；依赖团队规模与资金的部分，会在结论中单独说明适用条件。' },
  ],
};

const CSS = `
.cp-qa{flex:1;min-height:0;display:grid;gap:26px;padding-top:4px;}
.cp-qa-card.campus-ncard{min-width:0;min-height:0;display:flex;flex-direction:column;padding:38px 32px 24px;}
.cp-qa-q{display:flex;align-items:flex-start;gap:20px;}
.cp-qa-q .campus-seal,.cp-qa-a .campus-seal{min-width:50px;height:50px;font-size:27px;border-radius:50%;}
.cp-qa-question{font-family:var(--theme-font-serif);font-weight:700;font-size:30px;line-height:1.38;letter-spacing:.03em;color:var(--theme-ink);text-wrap:balance;}
.cp-qa-a{flex:1;min-height:0;display:flex;align-items:flex-start;gap:20px;margin-top:18px;padding-top:18px;border-top:1px dashed var(--campus-accent-line);}
.cp-qa-answer{font-size:23px;line-height:1.75;color:var(--theme-muted);text-wrap:pretty;}
/* 3 组:三行通栏,问题在左、回应在右(三栏时每张卡近 800px 高只放几行字,下半截整片空白) */
.cp-qa.is-3{gap:30px;}
.cp-qa.is-3 .cp-qa-card.campus-ncard{flex-direction:row;align-items:center;padding:30px 40px 22px;}
.cp-qa.is-3 .cp-qa-q{flex:0 0 33%;min-width:0;align-items:center;padding-right:36px;}
.cp-qa.is-3 .cp-qa-a{flex:1;min-width:0;align-self:stretch;align-items:center;margin-top:0;padding-top:0;padding-left:36px;border-top:0;border-left:1px dashed var(--campus-accent-line);}
.cp-qa.is-3 .cp-qa-answer{font-size:24px;}
`;

export function QaResponse(props) {
  useThemeStyle('campus-qa-response-style', CSS);
  const p = { ...DEFAULTS, ...props };
  const items = safeArray(p.items).slice(0, clamp(p.itemCount, 3, 4));
  const n = items.length;
  const cols = n === 3 ? 1 : 2;
  return (
    <CampusFrame chapterIndex={p.chapterIndex}>
      <TitleRow no={p.sectionNo} title={p.title} className="campus-rise" style={enterDelay(0)} />
      <div className={`cp-qa is-${n}`} style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, gridAutoRows: 'minmax(0, 1fr)' }}>
        {items.map((item, i) => (
          <NumberCard variant="tab" no={item?.no} check={false} className="cp-qa-card campus-rise" style={enterDelay(1 + i)} key={i}>
            <div className="cp-qa-q">
              <div className="campus-seal">{p.questionLabel}</div>
              <h3 className="cp-qa-question">{item?.question}</h3>
            </div>
            <div className="cp-qa-a">
              <div className="campus-seal is-soft">{p.answerLabel}</div>
              <p className="cp-qa-answer">{item?.answer}</p>
            </div>
          </NumberCard>
        ))}
      </div>
    </CampusFrame>
  );
}

QaResponse.META = {
  id: 'qa-response',
  label: '问答 · 问题与回应成组',
  roles: ['risks', 'observation'],
  defaults: DEFAULTS,
  copyBudgets: { 'items[].question': 18, 'items[].answer': 80 },
  controls: [
    { ...CHAPTER_CONTROL, default: 4 },
    { key: 'itemCount', type: 'number', label: '问答组数', default: 4, min: 3, max: 4, description: '「问—答」的组数:3 组三行通栏(问左答右),4 组两行两列。' },
  ],
};
