// 核心观点页:上方一句宋体大字主张(白卡 + 左侧渐变竖条 + 引号),下方 2–3 条支撑论据(渐变底叠白卡的序号卡片)并排。
// 适合核心论点、研究结论、一句话主张。
import React from 'react';
import { useThemeStyle, enterDelay } from '../../../shared/style.jsx';
import { safeArray, clamp } from '../../../chart-safety.mjs';
import { CampusFrame, TitleRow, CHAPTER_CONTROL } from '../kit/chrome.jsx';
import { NumberCard } from '../kit/parts.jsx';

const DEFAULTS = {
  chapterIndex: 3,
  supportCount: 3,
  showSource: true,
  sectionNo: '3.8',
  title: '核心论点',
  kicker: '本文主张',
  statement: '头部创作者的持续成功，不靠爆款运气，而靠一套把数据、组织与信任连成闭环的内容生产机制。',
  source: '—— 基于影视飓风个案的机制性分析',
  supports: [
    { no: '01', title: '数据让生产可复制', desc: '量化评估与 A/B 测试把“凭感觉”变成可检验、可沉淀的流程规范。' },
    { no: '02', title: '矩阵让增长可持续', desc: '多账号覆盖不同圈层，分散单一平台和单一账号的算法风险。' },
    { no: '03', title: '信任让变现更健康', desc: '真诚沟通累积的信任为自有品牌提供消费信用背书，形成正向循环。' },
  ],
};

const CSS = `
.cp-ks-hero{position:relative;flex:none;padding:50px 72px 54px 84px;border-radius:var(--campus-radius-lg);}
.cp-ks-bar{position:absolute;left:30px;top:44px;bottom:44px;width:8px;border-radius:4px;background:var(--campus-fill-bar);}
.cp-ks-mark{position:absolute;right:56px;top:30px;display:block;color:rgb(var(--theme-accent-rgb) / .14);}
.cp-ks-statement{position:relative;margin-top:28px;max-width:calc(100% - 150px);font-family:var(--theme-font-serif);font-weight:700;font-size:58px;line-height:1.45;letter-spacing:.04em;color:var(--theme-ink);text-wrap:pretty;}
.cp-ks-source{position:relative;display:flex;align-items:center;gap:14px;margin-top:24px;font-size:22px;letter-spacing:.06em;color:var(--theme-muted);}
.cp-ks-supports{flex:1;min-height:0;display:grid;grid-auto-flow:column;grid-auto-columns:minmax(0,1fr);column-gap:28px;margin-top:28px;}
.cp-ks-support.campus-ncard{min-width:0;display:flex;flex-direction:column;justify-content:flex-start;}
.cp-ks-support .campus-ncard-title{font-size:31px;}
.cp-ks-support-desc{margin-top:16px;font-size:23px;line-height:1.66;color:var(--theme-muted);text-wrap:pretty;}
.campus[data-campus-nav="rail"] .cp-ks-statement{font-size:52px;}
`;

const QuoteMark = () => (
  <svg className="cp-ks-mark" width="120" height="102" viewBox="0 0 26 22" aria-hidden="true">
    <path fill="currentColor" d="M0 22V12.6C0 5.6 3.4 1.4 10.2 0l1.2 2.6C7.6 4 5.8 6.6 5.6 10.2H11V22H0Zm15 0V12.6C15 5.6 18.4 1.4 25.2 0l1.2 2.6C22.6 4 20.8 6.6 20.6 10.2H26V22H15Z" />
  </svg>
);

export function KeyStatement(props) {
  useThemeStyle('campus-key-statement-style', CSS);
  const p = { ...DEFAULTS, ...props };
  const supports = safeArray(p.supports).slice(0, clamp(p.supportCount, 2, 3));
  return (
    <CampusFrame chapterIndex={p.chapterIndex}>
      <TitleRow no={p.sectionNo} title={p.title} className="campus-rise" style={enterDelay(0)} />
      <section className="cp-ks-hero campus-card campus-rise" style={enterDelay(1)}>
        <div className="cp-ks-bar" aria-hidden="true" />
        <QuoteMark />
        <div className="campus-chip">{p.kicker}</div>
        <p className="cp-ks-statement">{p.statement}</p>
        {p.showSource && <div className="cp-ks-source">{p.source}</div>}
      </section>
      <div className="cp-ks-supports">
        {supports.map((item, i) => (
          <NumberCard variant="stack" no={item?.no} title={item?.title} className="cp-ks-support campus-rise" style={enterDelay(3 + i)} key={i}>
            <p className="cp-ks-support-desc">{item?.desc}</p>
          </NumberCard>
        ))}
      </div>
    </CampusFrame>
  );
}

KeyStatement.META = {
  id: 'key-statement',
  label: '核心观点 · 大字主张配支撑论据',
  roles: ['statement', 'observation', 'result'],
  defaults: DEFAULTS,
  copyBudgets: { statement: 52, source: 24, 'supports[].title': 9, 'supports[].desc': 34 },
  controls: [
    { ...CHAPTER_CONTROL, default: 3 },
    { key: 'supportCount', type: 'number', label: '支撑论据条数', default: 3, min: 2, max: 3, description: '大字主张下方并排的支撑论据数量。' },
    { key: 'showSource', type: 'toggle', label: '出处说明', default: true, description: '主张下方的一行出处 / 说明。' },
  ],
};
