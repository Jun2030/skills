// 成对对应:左右两组逐行配对(如「研究发现 ↔ 研究创新」「问题 ↔ 对策」),每行左侧一句话 + 关键词,右侧是大编号水印的序号卡片(标题 + 说明)。
import React from 'react';
import { useThemeStyle, enterDelay } from '../../../shared/style.jsx';
import { safeArray, clamp } from '../../../chart-safety.mjs';
import { CampusFrame, TitleRow, ConclusionBar, FlowArrow, CHAPTER_CONTROL } from '../kit/chrome.jsx';
import { NumberCard } from '../kit/parts.jsx';

const DEFAULTS = {
  chapterIndex: 3,
  pairCount: 3,
  showConclusion: false,
  sectionNo: '3.1',
  title: '研究发现与研究创新',
  leftLabel: '研究发现',
  rightLabel: '研究创新',
  pairs: [
    {
      keyword: '现代内容工业化生产模型',
      finding: '揭示一套可复制的模型：从数据评估到流程反馈，再回流到视频创作。',
      no: '01',
      title: '综合性分析框架',
      desc: '把分属技术、组织和关系层面的数据驱动、生态构建与信任经济结合起来，形成更有解释力的框架。',
    },
    {
      keyword: '生态化策略',
      finding: '四象限矩阵揭示了头部自媒体应对平台不确定性、实现多方面持续增长的生态化策略。',
      no: '02',
      title: '系统性方法论',
      desc: '对影视飓风做深度的机制性研究，呈现其成功背后的系统性方法论，而非零散的表面技巧。',
    },
    {
      keyword: '稳固且高价值的变现道路',
      finding: '以视频内容与观众建立深度信任，并在此基础上发展品牌电商，是稳固且高价值的变现道路。',
      no: '03',
      title: '可持续创作与健康变现',
      desc: '回应行业中“如何可持续创作”“如何健康变现”两大焦虑，结论对实践者有较强的现实启发。',
    },
    {
      keyword: '关键词',
      finding: '在这里写第四条发现的一句话概括。',
      no: '04',
      title: '对应的创新点',
      desc: '在这里说明这条发现对应的创新点。',
    },
  ],
  conclusionLabel: '总结',
  conclusion: '在这里用一句话概括发现与创新之间的关系。',
};

const CSS = `
.cp-pr-table{flex:1;min-height:0;display:grid;grid-template-columns:minmax(0,1fr) 84px minmax(0,1fr);grid-template-rows:auto;grid-auto-rows:1fr;row-gap:20px;}
.cp-pr-head{display:flex;align-items:center;justify-content:center;gap:14px;height:58px;border-radius:999px;font-family:var(--theme-font-serif);font-weight:700;font-size:28px;letter-spacing:.24em;}
.cp-pr-head.is-left{background:var(--campus-accent-tint);color:var(--theme-accent);}
.cp-pr-head.is-right{background:var(--campus-fill-deep);color:var(--theme-on-accent);box-shadow:var(--campus-shadow-lift);}
.cp-pr-head-gap{display:flex;align-items:center;justify-content:center;}
.cp-pr-left{display:flex;flex-direction:column;justify-content:center;gap:12px;padding:20px 30px 22px;border-radius:var(--campus-radius);}
.cp-pr-left .campus-chip{align-self:flex-start;}
.cp-pr-finding{font-size:24px;line-height:1.62;color:var(--theme-ink);text-wrap:pretty;}
.cp-pr-link{position:relative;display:flex;align-items:center;justify-content:center;}
.cp-pr-link-line{position:absolute;left:0;right:0;top:50%;height:0;border-top:2px dashed var(--campus-accent-line);}
.cp-pr-link-dot{position:relative;width:52px;height:52px;display:grid;place-items:center;border-radius:50%;background:var(--campus-fill);color:var(--theme-on-accent);box-shadow:0 8px 18px rgb(var(--theme-accent-rgb) / .3);}
.cp-pr-right.campus-ncard{display:flex;flex-direction:column;justify-content:center;padding:22px 140px 22px 30px;}
.cp-pr-right .campus-ncard-title{font-size:29px;}
.cp-pr-desc{margin-top:8px;font-size:22px;line-height:1.62;color:var(--theme-muted);text-wrap:pretty;}
.cp-pr-table.is-4 .cp-pr-finding{font-size:21px;}
.cp-pr-table.is-4 .cp-pr-desc{font-size:20px;}
.cp-pr-table.is-4 .campus-ncard.is-ghost > .campus-ncard-no{font-size:76px;}
`;

export function PairedRows(props) {
  useThemeStyle('campus-paired-rows-style', CSS);
  const p = { ...DEFAULTS, ...props };
  const pairs = safeArray(p.pairs).slice(0, clamp(p.pairCount, 2, 4));
  return (
    <CampusFrame chapterIndex={p.chapterIndex}>
      <TitleRow no={p.sectionNo} title={p.title} className="campus-rise" style={enterDelay(0)} />
      <div className={`cp-pr-table is-${pairs.length}`}>
        <div className="cp-pr-head is-left campus-rise" style={enterDelay(1)}>{p.leftLabel}</div>
        <div className="cp-pr-head-gap" />
        <div className="cp-pr-head is-right campus-rise" style={enterDelay(1)}>{p.rightLabel}</div>
        {pairs.map((pair, i) => (
          <React.Fragment key={i}>
            <div className="cp-pr-left campus-wash campus-rise" style={enterDelay(2 + i)}>
              <div className="campus-chip is-soft">{pair?.keyword}</div>
              <p className="cp-pr-finding">{pair?.finding}</p>
            </div>
            <div className="cp-pr-link campus-fade" style={enterDelay(3 + i)}>
              <div className="cp-pr-link-line" aria-hidden="true" />
              <div className="cp-pr-link-dot"><FlowArrow size={28} style={{ color: 'var(--theme-on-accent)' }} /></div>
            </div>
            <NumberCard variant="ghost" no={pair?.no} title={pair?.title} className="cp-pr-right campus-rise" style={enterDelay(3 + i)}>
              <p className="cp-pr-desc">{pair?.desc}</p>
            </NumberCard>
          </React.Fragment>
        ))}
      </div>
      {p.showConclusion && <ConclusionBar label={p.conclusionLabel} text={p.conclusion} className="campus-rise" style={enterDelay(8)} />}
    </CampusFrame>
  );
}

PairedRows.META = {
  id: 'paired-rows',
  label: '成对对应 · 左右两组逐行配对',
  roles: ['comparison', 'result', 'observation'],
  defaults: DEFAULTS,
  copyBudgets: { 'pairs[].finding': 52, 'pairs[].desc': 52, conclusion: 44 },
  controls: [
    { ...CHAPTER_CONTROL, default: 3 },
    { key: 'pairCount', type: 'number', label: '配对行数', default: 3, min: 2, max: 4, description: '左右配对的行数。' },
    { key: 'showConclusion', type: 'toggle', label: '底部结论条', default: false, description: '页面底部的校色结论条。' },
  ],
};
