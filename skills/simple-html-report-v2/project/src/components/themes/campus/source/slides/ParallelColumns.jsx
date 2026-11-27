// 多栏并列论述:2–4 栏并排,每栏是斜切渐变卡头的序号卡片(编号 + 小标题)、关键词、正文和一句「不足 / 落点」。
// 适合文献综述、理论视角、方案对比这类「几个并列对象逐一展开」的页面。
import React from 'react';
import { useThemeStyle, enterDelay } from '../../../shared/style.jsx';
import { safeArray, clamp } from '../../../chart-safety.mjs';
import { CampusFrame, TitleRow, ConclusionBar, CHAPTER_CONTROL } from '../kit/chrome.jsx';
import { NumberCard } from '../kit/parts.jsx';

const DEFAULTS = {
  chapterIndex: 1,
  columnCount: 3,
  showLead: true,
  showPoint: true,
  showConclusion: true,
  sectionNo: '1.2',
  title: '文献综述',
  lead: '围绕数据、关系与生态三个层面梳理已有研究，指出各自尚未解释清楚的地方。',
  gapLabel: '研究不足',
  pointLabel: '本文落点',
  columns: [
    {
      no: '01',
      title: '数据驱动传播理论',
      keywords: '算法分发 · 数据思维 · 工业化生产',
      body: '彭兰指出算法重构了内容的分发逻辑。但在自媒体生产端，现有研究大多停留在“看后台数据”的浅层表面。',
      gap: '缺少对 A/B 测试、AI 辅助等手段如何把数据思维内化为全流程管理机制的深度剖析。',
      point: '剖析数据评估如何反馈到选题、制作与复盘的全流程。',
    },
    {
      no: '02',
      title: '情感劳动与信任经济',
      keywords: '情感劳动 · 专业人设 · 粉丝信任',
      body: '霍克希尔德的情感劳动理论被广泛用于解释主播与粉丝的关系，研究对象多为娱乐、生活类主播。',
      gap: '高专业度、硬核科技类内容中，创作者“专业人设”与“真诚人设”的双重情感劳动仍少有研究。',
      point: '考察真诚沟通如何累积信任，并转化为品牌背书。',
    },
    {
      no: '03',
      title: '媒介生态学',
      keywords: '平台可供性 · 账号矩阵 · 小生态',
      body: '平台可供性理论认为账号行为受平台技术架构影响，现有研究多关注单一平台内的运营策略。',
      gap: '头部博主如何以多账号矩阵对抗算法不确定性、构建自身小生态，相关研究较少。',
      point: '以四象限账号矩阵为样本，检验媒介生态学在垂直领域的解释力。',
    },
    {
      no: '04',
      title: '补充视角',
      keywords: '关键词一 · 关键词二',
      body: '在这里概述第四个理论视角或研究脉络的核心观点与代表性研究。',
      gap: '在这里写这一脉络尚未解决的问题。',
      point: '在这里写本文在这一脉络上的切入点。',
    },
  ],
  conclusionLabel: '本文切入',
  conclusion: '以影视飓风为个案，把三种理论放进同一分析框架，补足“机制层”的解释。',
};

const CSS = `
.cp-pc-lead{flex:none;margin:-6px 0 20px;font-size:24px;line-height:1.5;color:var(--theme-muted);}
.cp-pc-grid{flex:1;min-height:0;display:grid;grid-auto-flow:column;grid-auto-columns:minmax(0,1fr);grid-template-rows:auto auto 1fr auto auto;column-gap:26px;row-gap:0;}
.cp-pc-col{grid-row:1 / -1;display:grid;grid-template-rows:subgrid;min-height:0;}
.cp-pc-col > *{min-width:0;}
.cp-pc-keywords{display:flex;align-items:center;gap:12px;margin:20px 28px 0;padding-bottom:14px;border-bottom:1px dashed var(--campus-accent-line);font-size:19px;line-height:1.45;font-weight:700;letter-spacing:.04em;color:var(--theme-accent);}
.cp-pc-keywords-text{min-width:0;}
.cp-pc-text{margin:16px 28px 18px;font-size:22px;line-height:1.72;color:var(--theme-ink);text-wrap:pretty;}
.cp-pc-gap{margin:0 22px;padding:16px 20px 18px;}
.cp-pc-gap .campus-chip,.cp-pc-point .campus-chip{height:32px;padding:0 14px;font-size:17px;}
.cp-pc-gap-text{margin-top:10px;font-size:21px;line-height:1.6;color:var(--theme-ink);text-wrap:pretty;}
.cp-pc-point{margin:12px 22px 0;padding:14px 20px 16px;border:1.5px dashed var(--campus-accent-line);border-radius:var(--campus-radius-sm);}
.cp-pc-point-text{margin-top:10px;font-size:21px;line-height:1.6;font-weight:700;color:var(--theme-accent);text-wrap:pretty;}
.cp-pc-grid.is-4 .campus-ncard-title{font-size:25px;}
.cp-pc-grid.is-4 .cp-pc-text{font-size:21px;}
.cp-pc-grid.is-4 .campus-ncard-head .campus-ncard-no{font-size:34px;}
.cp-pc-grid.is-2 .cp-pc-text{font-size:24px;}
`;

export function ParallelColumns(props) {
  useThemeStyle('campus-parallel-columns-style', CSS);
  const p = { ...DEFAULTS, ...props };
  const columns = safeArray(p.columns).slice(0, clamp(p.columnCount, 2, 4));
  return (
    <CampusFrame chapterIndex={p.chapterIndex}>
      <TitleRow no={p.sectionNo} title={p.title} className="campus-rise" style={enterDelay(0)} />
      {p.showLead && <p className="cp-pc-lead campus-rise" style={enterDelay(1)}>{p.lead}</p>}
      <div className={`cp-pc-grid is-${columns.length}`}>
        {columns.map((column, i) => (
          <NumberCard variant="head" no={column?.no} title={column?.title} className="cp-pc-col campus-rise" style={enterDelay(2 + i)} key={i}>
            <div className="cp-pc-keywords"><div className="campus-mark is-spark" aria-hidden="true" /><div className="cp-pc-keywords-text">{column?.keywords}</div></div>
            <p className="cp-pc-text">{column?.body}</p>
            <div className="cp-pc-gap campus-wash">
              <div className="campus-chip">{p.gapLabel}</div>
              <p className="cp-pc-gap-text">{column?.gap}</p>
            </div>
            {p.showPoint ? (
              <div className="cp-pc-point">
                <div className="campus-chip is-soft">{p.pointLabel}</div>
                <p className="cp-pc-point-text">{column?.point}</p>
              </div>
            ) : <div />}
          </NumberCard>
        ))}
      </div>
      {p.showConclusion && <ConclusionBar label={p.conclusionLabel} text={p.conclusion} className="campus-rise" style={enterDelay(7)} />}
    </CampusFrame>
  );
}

ParallelColumns.META = {
  id: 'parallel-columns',
  label: '多栏并列 · 栏头编号配不足落点',
  roles: ['comparison', 'context', 'breakdown'],
  defaults: DEFAULTS,
  copyBudgets: { lead: 44, 'columns[].body': 64, 'columns[].gap': 48, 'columns[].point': 32, conclusion: 44 },
  controls: [
    { ...CHAPTER_CONTROL },
    { key: 'columnCount', type: 'number', label: '栏数', default: 3, min: 2, max: 4, description: '并排显示的栏数。' },
    { key: 'showPoint', type: 'toggle', label: '本文落点', default: true, description: '每栏底部的「本文落点」一句话。' },
    { key: 'showLead', type: 'toggle', label: '导语', default: true, description: '标题下方的一句导语。' },
    { key: 'showConclusion', type: 'toggle', label: '底部结论条', default: true, description: '页面底部的校色结论条。' },
  ],
};
