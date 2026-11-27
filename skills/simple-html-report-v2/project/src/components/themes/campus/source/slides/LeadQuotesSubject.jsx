// 导语 + 现象列举 + 对象说明:一段导语,一组短引语 / 现象标签,右侧一块对象说明卡,底部可选结论条。
// 适合研究背景、问题提出、现状描述这类「先摆现象,再引出对象」的页面。
import React from 'react';
import { useThemeStyle, enterDelay } from '../../../shared/style.jsx';
import { safeArray, clamp } from '../../../chart-safety.mjs';
import { CampusFrame, TitleRow, ConclusionBar, CHAPTER_CONTROL } from '../kit/chrome.jsx';

const DEFAULTS = {
  chapterIndex: 1,
  quoteCount: 4,
  factCount: 4,
  showConclusion: true,
  sectionNo: '1.1',
  title: '研究背景',
  lead: '在信息严重过载、算法推荐主导的注意力竞争中，大多数创作者陷入了“流量焦虑”；少数头部账号却能持续产出高质量内容，并实现稳定增长与商业成功。',
  quotesLabel: '典型现象',
  quotes: [
    { text: '没流量等于没存在' },
    { text: '数据不好睡不着' },
    { text: '流量密码到底是啥' },
    { text: '一天不更就慌得不行' },
    { text: '爆款全靠运气' },
  ],
  subjectLabel: '研究对象',
  subjectName: '影视飓风',
  subjectTagline: '科技与影像类头部内容创作团队',
  subjectDesc: '以高水准影像和硬核科技内容见长，长期稳定输出，并以多账号矩阵和自有品牌完成商业化，是观察“数据驱动创作”的典型样本。',
  facts: [
    { label: '平台', text: '以 B 站为主，多平台分发' },
    { label: '布局', text: '主账号 + 多个子账号的内容矩阵' },
    { label: '变现', text: '自有品牌与电商' },
    { label: '团队', text: '工作室化的专业制作团队' },
  ],
  conclusionLabel: '研究问题',
  conclusion: '头部账号如何跳出流量焦虑，用可复制的机制持续产出优质内容并实现商业成功？',
};

const CSS = `
.cp-lqs-main{flex:1;min-height:0;display:flex;gap:30px;}
.cp-lqs-left{flex:1;min-width:0;display:flex;flex-direction:column;gap:22px;}
.cp-lqs-lead{position:relative;flex:none;padding:24px 34px 24px 44px;border-radius:var(--campus-radius);}
.cp-lqs-lead-bar{position:absolute;left:16px;top:22px;bottom:22px;width:6px;border-radius:3px;background:var(--campus-fill-bar);}
.cp-lqs-lead-text{font-size:25px;line-height:1.72;color:var(--theme-ink);text-wrap:pretty;}
.cp-lqs-quotes{flex:1;min-height:0;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));grid-auto-rows:1fr;gap:20px;}
.cp-lqs-quotes.is-2,.cp-lqs-quotes.is-3{grid-template-columns:minmax(0,1fr);}
.cp-lqs-quotes.is-5 .cp-lqs-quote:last-child{grid-column:span 2;}
/* 引语视觉重心略低于几何中心,抵消左上角引号的分量 */
.cp-lqs-quote{display:flex;align-items:center;justify-content:center;padding:46px 40px 30px;}
.cp-lqs-quote-mark{position:absolute;left:26px;top:20px;display:block;color:rgb(var(--theme-accent-rgb) / .16);}
.cp-lqs-quote-cap{position:absolute;left:50%;bottom:0;width:72px;height:5px;margin-left:-36px;border-radius:3px 3px 0 0;background:var(--campus-fill);}
.cp-lqs-quote-text{position:relative;font-family:var(--theme-font-serif);font-weight:700;font-size:38px;line-height:1.36;letter-spacing:.06em;color:var(--theme-ink);text-align:center;text-wrap:balance;}
.cp-lqs-subject{flex:0 0 588px;display:flex;flex-direction:column;}
.campus[data-campus-nav="rail"] .cp-lqs-subject{flex-basis:540px;}
.cp-lqs-subject-body{flex:1;min-height:0;display:flex;flex-direction:column;padding:24px 28px 26px;}
.cp-lqs-name{font-family:var(--theme-font-serif);font-weight:700;font-size:50px;line-height:1.15;letter-spacing:.06em;color:var(--theme-accent);}
.cp-lqs-tagline{display:flex;align-items:center;gap:12px;margin-top:12px;font-size:21px;line-height:1.4;font-weight:700;color:var(--theme-ink);}
.cp-lqs-desc{margin-top:12px;font-size:21px;line-height:1.68;color:var(--theme-muted);text-wrap:pretty;}
.cp-lqs-facts{flex:1;min-height:0;margin-top:20px;display:flex;flex-direction:column;justify-content:flex-start;gap:12px;}
.cp-lqs-fact{flex:1;display:flex;align-items:center;gap:18px;padding:0 18px;max-height:76px;}
.cp-lqs-fact .campus-chip{flex:none;min-width:74px;justify-content:center;height:34px;font-size:18px;}
.cp-lqs-fact-value{flex:1;min-width:0;font-size:21px;line-height:1.45;font-weight:600;color:var(--theme-ink);}
`;

const QuoteMark = () => (
  <svg className="cp-lqs-quote-mark" width="58" height="49" viewBox="0 0 26 22" aria-hidden="true">
    <path fill="currentColor" d="M0 22V12.6C0 5.6 3.4 1.4 10.2 0l1.2 2.6C7.6 4 5.8 6.6 5.6 10.2H11V22H0Zm15 0V12.6C15 5.6 18.4 1.4 25.2 0l1.2 2.6C22.6 4 20.8 6.6 20.6 10.2H26V22H15Z" />
  </svg>
);

export function LeadQuotesSubject(props) {
  useThemeStyle('campus-lead-quotes-subject-style', CSS);
  const p = { ...DEFAULTS, ...props };
  const quotes = safeArray(p.quotes).slice(0, clamp(p.quoteCount, 2, 5));
  const facts = safeArray(p.facts).slice(0, clamp(p.factCount, 2, 4));
  const gridClass = ` is-${quotes.length}`;
  return (
    <CampusFrame chapterIndex={p.chapterIndex}>
      <TitleRow no={p.sectionNo} title={p.title} className="campus-rise" style={enterDelay(0)} />
      <div className="cp-lqs-main">
        <div className="cp-lqs-left">
          <div className="cp-lqs-lead campus-wash campus-rise" style={enterDelay(1)}>
            <div className="cp-lqs-lead-bar" aria-hidden="true" />
            <p className="cp-lqs-lead-text">{p.lead}</p>
          </div>
          <div className="campus-label-row campus-rise" style={enterDelay(2)}>
            <div className="campus-chip">{p.quotesLabel}</div>
          </div>
          <div className={`cp-lqs-quotes${gridClass}`}>
            {quotes.map((quote, i) => (
              <div className="cp-lqs-quote campus-card campus-rise" style={enterDelay(3 + i)} key={i}>
                <QuoteMark />
                <div className="cp-lqs-quote-cap" aria-hidden="true" />
                <div className="cp-lqs-quote-text">{quote?.text}</div>
              </div>
            ))}
          </div>
        </div>
        <aside className="cp-lqs-subject campus-card campus-rise" style={enterDelay(2)}>
          <div className="campus-card-head">{p.subjectLabel}</div>
          <div className="cp-lqs-subject-body">
            <div className="cp-lqs-name">{p.subjectName}</div>
            <div className="cp-lqs-tagline"><div className="campus-mark is-spark" aria-hidden="true" /><div>{p.subjectTagline}</div></div>
            <p className="cp-lqs-desc">{p.subjectDesc}</p>
            <div className="cp-lqs-facts">
              {facts.map((fact, i) => (
                <div className="cp-lqs-fact campus-wash" key={i}>
                  <div className="campus-chip is-soft">{fact?.label}</div>
                  <div className="cp-lqs-fact-value">{fact?.text}</div>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
      {p.showConclusion && <ConclusionBar label={p.conclusionLabel} text={p.conclusion} className="campus-rise" style={enterDelay(8)} />}
    </CampusFrame>
  );
}

LeadQuotesSubject.META = {
  id: 'lead-quotes-subject',
  label: '导语 · 现象列举配对象说明',
  roles: ['context', 'statement'],
  defaults: DEFAULTS,
  copyBudgets: { lead: 80, subjectDesc: 72, conclusion: 44 },
  controls: [
    { ...CHAPTER_CONTROL },
    { key: 'quoteCount', type: 'number', label: '现象条数', default: 4, min: 2, max: 5, description: '左侧短引语 / 现象标签的条数。' },
    { key: 'factCount', type: 'number', label: '对象要点条数', default: 4, min: 2, max: 4, description: '对象说明卡底部的要点条数。' },
    { key: 'showConclusion', type: 'toggle', label: '底部结论条', default: true, description: '页面底部的校色结论条。' },
  ],
};
