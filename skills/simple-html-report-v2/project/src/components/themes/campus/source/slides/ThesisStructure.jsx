// 论文结构 / 章节安排:4–7 章排成一条横向章节链(第 1 章 绪论 → … → 第 N 章 结论与展望),
// 每章一个章节胶囊 + 一张概述卡;上方可选用括线把若干章归成「提出问题 / 分析问题 / 解决问题」几段,
// 各段章节的颜色由浅到深递进。适合论文结构、章节安排、研究框架(按章)。
import React from 'react';
import { useThemeStyle, enterDelay } from '../../../shared/style.jsx';
import { safeArray, safeNumber, clamp } from '../../../chart-safety.mjs';
import { CampusFrame, TitleRow, CHAPTER_CONTROL, useCampusLayout } from '../kit/chrome.jsx';
import { useNarrativeStyle, EmText, r2 } from '../kit/narrative.jsx';

const DEFAULTS = {
  chapterIndex: 2,
  chapterCount: 6,
  showGroups: true,
  sectionNo: '2.3',
  title: '论文结构安排',
  chapters: [
    { no: '第 1 章', title: '绪论', desc: '选题背景、国内外研究现状、研究目的与意义' },
    { no: '第 2 章', title: '理论基础', desc: '管理会计、作业成本、价值链与战略成本理论' },
    { no: '第 3 章', title: '方法分析', desc: '作业成本、价值链、战略成本等六种**管理会计方法**' },
    { no: '第 4 章', title: '现状与问题', desc: '归纳企业应用管理会计的五个难点与四个重点' },
    { no: '第 5 章', title: '对策建议', desc: '从资源配置、过程控制、体系融合三方面提出建议' },
    { no: '第 6 章', title: '结论与展望', desc: '总结主要结论与创新点，指出不足与后续方向' },
    { no: '第 7 章', title: '章节标题', desc: '一句话概述这一章写了什么' },
  ],
  groups: [
    { label: '提出问题', from: 1, to: 2 },
    { label: '分析问题', from: 3, to: 4 },
    { label: '解决问题', from: 5, to: 6 },
  ],
};

const GAP = 22;
// 台阶:第一章的卡片高度占可用高度的百分比,最后一章占满
const STEP_MIN = 54;
const STEP_MAX = 93;

const CSS = `
.cp-g1-ts{flex:1;min-height:0;display:flex;flex-direction:column;}
/* —— 括线带:标签胶囊 + 下方括线(纯 CSS 边框,不含文字) —— */
.cp-g1-ts-groups{position:relative;flex:none;height:92px;}
.cp-g1-ts-group{position:absolute;top:0;bottom:0;display:flex;flex-direction:column;align-items:center;}
.cp-g1-ts-glabel{position:relative;z-index:1;flex:none;display:flex;align-items:center;gap:10px;height:44px;padding:0 24px 0 18px;border-radius:999px;font-family:var(--theme-font-serif);font-weight:700;font-size:23px;letter-spacing:.14em;white-space:nowrap;}
.cp-g1-ts-gmark{flex:none;width:9px;height:9px;border-radius:2px;transform:rotate(45deg);}
.cp-g1-ts-stem{flex:none;width:2px;height:14px;}
.cp-g1-ts-brace{flex:1;align-self:stretch;margin:0 8px 6px;border:2.5px solid;border-bottom:0;border-radius:14px 14px 0 0;}
/* —— 章节链:贯穿的轨道线 + 章节胶囊 + 胶囊之间的箭头 —— */
.cp-g1-ts-rail{position:relative;flex:none;display:grid;grid-template-columns:repeat(var(--cp-g1-ts-n),minmax(0,1fr));column-gap:${GAP}px;height:66px;}
.cp-g1-ts-track{position:absolute;top:50%;height:4px;margin-top:-2px;border-radius:2px;background:linear-gradient(90deg,rgb(var(--theme-accent-rgb) / .25) 0%,rgb(var(--theme-accent-rgb) / .6) 100%);}
.cp-g1-ts-cell{position:relative;display:flex;align-items:center;justify-content:center;}
.cp-g1-ts-node{position:relative;isolation:isolate;display:flex;align-items:center;justify-content:center;height:52px;padding:0 22px;}
.cp-g1-ts-node-shape{position:absolute;z-index:-1;inset:0;border-radius:999px;}
.cp-g1-ts-no{font-family:var(--theme-font-serif);font-weight:700;font-size:22px;line-height:1;letter-spacing:.06em;white-space:nowrap;font-variant-numeric:lining-nums;}
.cp-g1-ts-arrow{position:absolute;right:calc(-${GAP / 2}px - 9px);top:50%;width:18px;height:18px;margin-top:-9px;border-radius:50%;background:var(--theme-bg);display:grid;place-items:center;color:var(--theme-accent);}
/* —— 章节概述卡 —— */
.cp-g1-ts-cards{flex:1;min-height:0;display:grid;grid-template-columns:repeat(var(--cp-g1-ts-n),minmax(0,1fr));column-gap:${GAP}px;}
/* 每列:上方一条虚线从章节胶囊垂下,下方是概述卡;卡片高度自左向右递增,排成上升的台阶 */
.cp-g1-ts-col{min-width:0;min-height:0;display:flex;flex-direction:column;align-items:stretch;}
.cp-g1-ts-drop{position:relative;flex:1 1 0;min-height:14px;}
.cp-g1-ts-drop::before{content:'';position:absolute;left:50%;top:0;bottom:10px;border-left:2px dashed var(--campus-accent-line);}
.cp-g1-ts-card{position:relative;isolation:isolate;min-width:0;min-height:0;display:flex;flex-direction:column;padding:34px 24px 26px;overflow:hidden;}
.cp-g1-ts-drop::after{content:'';position:absolute;left:50%;bottom:6px;width:10px;height:10px;margin-left:-4px;border-radius:2px;background:var(--theme-accent);transform:rotate(45deg);}
.cp-g1-ts-foot{position:absolute;z-index:-1;left:0;right:0;bottom:0;height:46%;border-radius:0 0 var(--campus-radius) var(--campus-radius);pointer-events:none;}
.cp-g1-ts-foot.t0{background:linear-gradient(180deg,rgb(var(--theme-accent-rgb) / 0) 0%,rgb(var(--theme-accent-rgb) / .05) 100%);}
.cp-g1-ts-foot.t1{background:linear-gradient(180deg,rgb(var(--theme-accent-rgb) / 0) 0%,rgb(var(--theme-accent-rgb) / .09) 100%);}
.cp-g1-ts-foot.t2{background:linear-gradient(180deg,rgb(var(--theme-accent-rgb) / 0) 0%,rgb(var(--theme-accent-rgb) / .13) 100%);}
.cp-g1-ts-cap{position:absolute;left:24px;right:24px;top:0;height:5px;border-radius:0 0 4px 4px;}
.cp-g1-ts-title{font-family:var(--theme-font-serif);font-weight:700;font-size:29px;line-height:1.3;letter-spacing:.04em;color:var(--theme-ink);text-wrap:balance;}
.cp-g1-ts-rule{width:34px;height:3px;margin:14px 0 14px;border-radius:2px;background:var(--campus-accent-line);}
.cp-g1-ts-desc{font-size:22px;line-height:1.66;color:var(--theme-muted);text-wrap:pretty;}
/* 章节多时收紧 */
.cp-g1-ts.is-7 .cp-g1-ts-node,.cp-g1-ts.is-6 .cp-g1-ts-node{padding:0 16px;}
.cp-g1-ts.is-7 .cp-g1-ts-no{font-size:20px;}
.cp-g1-ts.is-7 .cp-g1-ts-card{padding:30px 18px 22px;}
.cp-g1-ts.is-7 .cp-g1-ts-title{font-size:26px;}
.cp-g1-ts.is-7 .cp-g1-ts-desc{font-size:20px;line-height:1.58;}
.cp-g1-ts.is-4 .cp-g1-ts-title{font-size:32px;}
.cp-g1-ts.is-4 .cp-g1-ts-desc{font-size:24px;line-height:1.72;}
.cp-g1-ts.is-4 .cp-g1-ts-card{padding:40px 34px 30px;}
.campus[data-campus-nav="rail"] .cp-g1-ts.is-7 .cp-g1-ts-no{font-size:18px;}
.campus[data-campus-nav="rail"] .cp-g1-ts.is-7 .cp-g1-ts-node{padding:0 12px;}
.campus[data-campus-nav="rail"] .cp-g1-ts.is-7 .cp-g1-ts-desc{font-size:19px;}
/* —— 分段色调:由浅到深(t0 浅校色 / t1 中校色 / t2 主渐变);没有分段时都用主渐变 —— */
.cp-g1-ts-tone.t0 .cp-g1-ts-node-shape,.cp-g1-ts-tone.t0.cp-g1-ts-glabel{background:var(--theme-surface);border:1.5px solid var(--campus-accent-line);}
.cp-g1-ts-tone.t0 .cp-g1-ts-no,.cp-g1-ts-tone.t0.cp-g1-ts-glabel{color:var(--theme-accent);}
.cp-g1-ts-tone.t1 .cp-g1-ts-node-shape,.cp-g1-ts-tone.t1.cp-g1-ts-glabel{background:rgb(var(--theme-accent-rgb) / .2);border:1.5px solid rgb(var(--theme-accent-rgb) / .38);}
.cp-g1-ts-tone.t1 .cp-g1-ts-no,.cp-g1-ts-tone.t1.cp-g1-ts-glabel{color:var(--campus-accent-lo);}
.cp-g1-ts-tone.t2 .cp-g1-ts-node-shape,.cp-g1-ts-tone.t2.cp-g1-ts-glabel{background:var(--campus-fill);box-shadow:0 8px 18px rgb(var(--theme-accent-rgb) / .28);}
.cp-g1-ts-tone.t2 .cp-g1-ts-no,.cp-g1-ts-tone.t2.cp-g1-ts-glabel{color:var(--theme-on-accent);}
.cp-g1-ts-gmark.t0{background:var(--theme-accent);}
.cp-g1-ts-gmark.t1{background:var(--campus-accent-lo);}
.cp-g1-ts-gmark.t2{background:var(--campus-spark);}
.cp-g1-ts-stem.t0{background:var(--campus-accent-line);}
.cp-g1-ts-stem.t1{background:rgb(var(--theme-accent-rgb) / .55);}
.cp-g1-ts-stem.t2{background:var(--theme-accent);}
.cp-g1-ts-brace.t0{border-color:var(--campus-accent-line);}
.cp-g1-ts-brace.t1{border-color:rgb(var(--theme-accent-rgb) / .55);}
.cp-g1-ts-brace.t2{border-color:var(--theme-accent);}
.cp-g1-ts-cap.t0{background:var(--campus-accent-line);}
.cp-g1-ts-cap.t1{background:rgb(var(--theme-accent-rgb) / .55);}
.cp-g1-ts-cap.t2{background:var(--campus-fill);}
`;

const ChevronIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M5 2.5 L9.5 7 L5 11.5" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
);

export function ThesisStructure(props) {
  useNarrativeStyle();
  useThemeStyle('campus-thesis-structure-style', CSS);
  const p = { ...DEFAULTS, ...props };
  const { bodyW } = useCampusLayout();
  const chapters = safeArray(p.chapters).slice(0, clamp(p.chapterCount, 4, 7));
  const n = chapters.length;
  // 分段:按 from / to(1 起)截到现有章节内;重叠或越界的段丢弃,只保留前 3 段
  const groups = [];
  if (p.showGroups) {
    let next = 1;
    safeArray(p.groups).forEach(g => {
      if (groups.length >= 3) return;
      const from = clamp(Math.round(safeNumber(g?.from, 0)), 1, n);
      const to = clamp(Math.round(safeNumber(g?.to, 0)), 1, n);
      if (from < next || to < from) return;
      groups.push({ label: g?.label, from, to });
      next = to + 1;
    });
  }
  const toneOf = idx => {
    if (!groups.length) return 't2';
    const k = groups.findIndex(g => idx + 1 >= g.from && idx + 1 <= g.to);
    if (k < 0) return 't0';
    const shift = 3 - groups.length; // 两段时用中、深两档,一段时用深档
    return `t${clamp(k + shift, 0, 2)}`;
  };
  const colW = (bodyW - GAP * (n - 1)) / n;
  const xOf = i => (i * (colW + GAP)) / bodyW * 100;
  const wOf = (a, b) => ((b - a) * (colW + GAP) + colW) / bodyW * 100;
  const trackLeft = r2(xOf(0) + (colW / 2 / bodyW) * 100);
  const trackWidth = r2(xOf(n - 1) - xOf(0));
  return (
    <CampusFrame chapterIndex={p.chapterIndex}>
      <TitleRow no={p.sectionNo} title={p.title} className="campus-rise" style={enterDelay(0)} />
      <div className={`cp-g1-ts is-${n}`} style={{ '--cp-g1-ts-n': n }}>
        {groups.length > 0 && (
          <div className="cp-g1-ts-groups campus-rise" style={enterDelay(1)}>
            {groups.map((g, k) => {
              const tone = toneOf(g.from - 1);
              return (
                <div className="cp-g1-ts-group" style={{ left: `${r2(xOf(g.from - 1))}%`, width: `${r2(wOf(g.from - 1, g.to - 1))}%` }} key={k}>
                  <div className={`cp-g1-ts-glabel cp-g1-ts-tone ${tone}`}>
                    <div className={`cp-g1-ts-gmark ${tone}`} aria-hidden="true" />
                    <div>{g.label}</div>
                  </div>
                  <div className={`cp-g1-ts-stem ${tone}`} aria-hidden="true" />
                  <div className={`cp-g1-ts-brace ${tone}`} aria-hidden="true" />
                </div>
              );
            })}
          </div>
        )}
        <div className="cp-g1-ts-rail campus-rise" style={enterDelay(2)}>
          <div className="cp-g1-ts-track" style={{ left: `${trackLeft}%`, width: `${trackWidth}%` }} aria-hidden="true" />
          {chapters.map((ch, i) => (
            <div className={`cp-g1-ts-cell cp-g1-ts-tone ${toneOf(i)}`} key={i}>
              <div className="cp-g1-ts-node">
                <div className="cp-g1-ts-node-shape" aria-hidden="true" />
                <div className="cp-g1-ts-no">{ch?.no}</div>
              </div>
              {i < n - 1 && <div className="cp-g1-ts-arrow" aria-hidden="true"><ChevronIcon /></div>}
            </div>
          ))}
        </div>
        <div className="cp-g1-ts-cards">
          {chapters.map((ch, i) => {
            const tone = toneOf(i);
            const height = r2(STEP_MIN + (STEP_MAX - STEP_MIN) * (n > 1 ? i / (n - 1) : 1));
            return (
              <div className="cp-g1-ts-col" key={i}>
                <div className="cp-g1-ts-drop campus-fade" style={enterDelay(3 + i)} aria-hidden="true" />
                <section className="cp-g1-ts-card campus-card campus-rise" style={{ flex: `0 0 ${height}%`, ...enterDelay(3 + i) }}>
                  <div className={`cp-g1-ts-cap ${tone}`} aria-hidden="true" />
                  <div className={`cp-g1-ts-foot ${tone}`} aria-hidden="true" />
                  <h3 className="cp-g1-ts-title">{ch?.title}</h3>
                  <div className="cp-g1-ts-rule" aria-hidden="true" />
                  <EmText className="cp-g1-ts-desc" text={ch?.desc} />
                </section>
              </div>
            );
          })}
        </div>
      </div>
    </CampusFrame>
  );
}

ThesisStructure.META = {
  id: 'thesis-structure',
  label: '论文结构 · 章节链配分段括线',
  roles: ['breakdown', 'process', 'context'],
  defaults: DEFAULTS,
  numberBounds: {
    'groups[].from': { min: 1, max: 7, semantics: 'index' },
    'groups[].to': { min: 1, max: 7, semantics: 'index' },
  },
  copyBudgets: { 'chapters[].no': 6, 'chapters[].title': 8, 'chapters[].desc': 36, 'groups[].label': 6 },
  controls: [
    { ...CHAPTER_CONTROL, default: 2 },
    { key: 'chapterCount', type: 'number', label: '章节数', default: 6, min: 4, max: 7, description: '章节链上的章数;每章一个章节胶囊 + 一张概述卡(标题 + 一句概述)。' },
    { key: 'showGroups', type: 'toggle', label: '分段括线', default: true, description: '上方用括线把若干章归成几段(groups:label + 起止章 from / to,1 起,最多 3 段,不能重叠);各段的颜色由浅到深。' },
  ],
};
