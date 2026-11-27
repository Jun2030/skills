// 国内外研究现状:左右两栏「国外 / 国内」(栏名可改),每栏 2–4 条,每条是「代表学者或机构 + 年份 + 一两句工作概述」,
// 条目沿一条竖向时间线排列;两栏下方是通栏「研究述评」:现有研究的不足 → 本文切入点。
// 适合开题、毕业答辩的国内外研究现状 / 文献综述页。
import React from 'react';
import { useThemeStyle, enterDelay } from '../../../shared/style.jsx';
import { safeArray, clamp } from '../../../chart-safety.mjs';
import { CampusFrame, TitleRow, SparkStar, CHAPTER_CONTROL } from '../kit/chrome.jsx';
import { useStructureStyle, LinkDot } from '../kit/structure.jsx';
import { useNarrativeStyle, EmText, NarrIcon } from '../kit/narrative.jsx';

const DEFAULTS = {
  chapterIndex: 1,
  abroadCount: 3,
  domesticCount: 3,
  showNotes: true,
  showReview: true,
  sectionNo: '1.2',
  title: '国内外研究现状',
  abroadName: '国外研究现状',
  abroadNote: '理论体系成熟，工具应用广泛',
  abroadItems: [
    { who: '学者 A', year: '20XX', body: '研究**作业成本法**，以作业为核算对象分配间接费用，为企业提供更客观的成本信息。' },
    { who: '学者 B', year: '20XX', body: '提出**战略成本管理**，把成本分析扩展到行业价值链，比较企业与竞争对手的相对成本地位。' },
    { who: '研究机构 C', year: '20XX', body: '调查显示高级财务管理人才受到大型跨国企业推崇，管理会计已成为财务职能的主体。' },
    { who: '学者 D', year: '20XX', body: '在这里写第四项代表性工作：学者或机构做了什么、得出了什么结论。' },
  ],
  domesticName: '国内研究现状',
  domesticNote: '起步较晚，发展迅速',
  domesticItems: [
    { who: '学者 E', year: '20XX', body: '梳理我国管理会计发展历程，指出研究起步较晚，但**十年间理论与实践都有较大发展**。' },
    { who: '学者 F', year: '20XX', body: '指出核算功能正从传统一维走向多维，旧理论存在局限，体系变革不可避免。' },
    { who: '研究机构 G', year: '20XX', body: '测算我国**管理会计人才缺口约 500 万**，财会从业者普遍面临转型挑战。' },
    { who: '学者 H', year: '20XX', body: '在这里写第四项代表性工作：学者或机构做了什么、得出了什么结论。' },
  ],
  reviewLabel: '研究述评',
  gapLabel: '现有不足',
  gap: '多停留在理论引介与宏观描述，缺少结合企业实际的工具应用分析。',
  focusLabel: '本文切入',
  focus: '以成本管理为切入点，系统梳理管理会计方法在企业经营中的应用。',
};

const CSS = `
.cp-g1-da{flex:1;min-height:0;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:30px;}
.cp-g1-da-col{min-width:0;min-height:0;display:flex;flex-direction:column;}
/* 栏头:渐变色块 + 玻璃圆图标 + 栏名 + 一句栏注;右侧一枚淡色大图标作水印 */
.cp-g1-da-head{position:relative;isolation:isolate;flex:none;display:flex;align-items:center;gap:18px;min-height:96px;padding:14px 26px;border-radius:var(--campus-radius) var(--campus-radius) 0 0;background:var(--campus-fill-deep);color:var(--theme-on-accent);overflow:hidden;}
.cp-g1-da-icon{flex:none;width:62px;height:62px;display:grid;place-items:center;border-radius:50%;background:var(--campus-on-accent-glass);box-shadow:inset 0 0 0 1.5px var(--campus-on-accent-line);}
.cp-g1-da-water{position:absolute;z-index:-1;right:-18px;top:-22px;color:rgb(255 255 255 / .1);pointer-events:none;}
.cp-g1-da-name{font-family:var(--theme-font-serif);font-weight:700;font-size:33px;line-height:1.2;letter-spacing:.08em;}
.cp-g1-da-note{margin-top:6px;font-size:19px;line-height:1.3;color:var(--campus-on-accent-muted);letter-spacing:.04em;}
/* 条目:竖向时间线 + 圆点;学者 / 机构(衬线)+ 年份小胶囊,下面一两句概述 */
.cp-g1-da-list{position:relative;flex:1;min-height:0;display:flex;flex-direction:column;justify-content:space-evenly;padding:16px 30px 18px 66px;}
.cp-g1-da-line{position:absolute;left:37px;top:34px;bottom:34px;width:2px;background:linear-gradient(180deg,rgb(var(--theme-accent-rgb) / .5) 0%,rgb(var(--theme-accent-rgb) / .12) 100%);}
.cp-g1-da-item{position:relative;padding:10px 0;}
.cp-g1-da-item + .cp-g1-da-item{border-top:1.5px dashed var(--theme-line);}
.cp-g1-da-dot{position:absolute;left:-37px;top:20px;width:16px;height:16px;border-radius:50%;background:var(--theme-surface);box-shadow:inset 0 0 0 4px var(--theme-accent),0 0 0 4px rgb(var(--theme-accent-rgb) / .12);}
.cp-g1-da-item:first-child .cp-g1-da-dot{background:var(--campus-spark);}
.cp-g1-da-who-row{display:flex;align-items:center;gap:12px;}
.cp-g1-da-who{font-family:var(--theme-font-serif);font-weight:700;font-size:26px;line-height:1.3;letter-spacing:.03em;color:var(--theme-ink);}
.cp-g1-da-year{flex:none;display:flex;align-items:center;height:30px;padding:0 12px;border-radius:999px;background:var(--campus-accent-tint);font-family:var(--theme-font-serif);font-weight:700;font-size:18px;line-height:1;color:var(--theme-accent);font-variant-numeric:lining-nums;}
.cp-g1-da-body{margin-top:6px;font-size:22px;line-height:1.62;color:var(--theme-muted);text-wrap:pretty;}
.cp-g1-da-col.is-4 .cp-g1-da-body{font-size:21px;line-height:1.52;}
.cp-g1-da-col.is-4 .cp-g1-da-item{padding:8px 0;}
.cp-g1-da-col.is-2 .cp-g1-da-list{justify-content:center;gap:10px;}
.cp-g1-da-col.is-2 .cp-g1-da-item{padding:26px 0;}
.cp-g1-da-col.is-2 .cp-g1-da-who{font-size:30px;}
.cp-g1-da-col.is-2 .cp-g1-da-dot{top:36px;}
.cp-g1-da-col.is-2 .cp-g1-da-body{margin-top:10px;font-size:25px;line-height:1.75;}
.cp-g1-da:not(.is-reviewed) .cp-g1-da-col.is-3 .cp-g1-da-body{font-size:23px;line-height:1.7;}
.cp-g1-da.is-reviewed .cp-g1-da-col.is-4 .cp-g1-da-who{font-size:24px;}
/* 研究述评:通栏白卡;左侧渐变标签块,中间「现有不足」,圆钮箭头,右侧「本文切入」 */
.cp-g1-da-review{position:relative;flex:none;display:grid;grid-template-columns:auto minmax(0,1fr) 54px minmax(0,1fr);align-items:stretch;gap:0;margin-top:24px;min-height:120px;}
.cp-g1-da-rlabel{position:relative;isolation:isolate;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;width:150px;border-radius:var(--campus-radius) 0 0 var(--campus-radius);background:var(--campus-fill-deep);color:var(--theme-on-accent);overflow:hidden;}
.cp-g1-da-rlabel-text{font-family:var(--theme-font-serif);font-weight:700;font-size:25px;letter-spacing:.12em;line-height:1.2;text-align:center;}
.cp-g1-da-seg{min-width:0;display:flex;flex-direction:column;justify-content:center;gap:8px;padding:14px 28px;}
.cp-g1-da-seg-label{display:flex;align-items:center;gap:8px;font-size:19px;line-height:1;font-weight:700;letter-spacing:.1em;color:var(--theme-faint);}
.cp-g1-da-seg-mark{flex:none;width:8px;height:8px;border-radius:1px;background:var(--campus-neutral);transform:rotate(45deg);}
.cp-g1-da-seg-text{font-size:22px;line-height:1.5;color:var(--theme-muted);text-wrap:pretty;}
.cp-g1-da-seg.is-focus{margin:10px 10px 10px 0;border-radius:12px;background:var(--campus-wash);}
.cp-g1-da-seg.is-focus .cp-g1-da-seg-label{color:var(--theme-accent);}
.cp-g1-da-star{flex:none;display:block;color:var(--campus-spark);}
.cp-g1-da-seg.is-focus .cp-g1-da-seg-text{font-size:23px;font-weight:700;color:var(--theme-ink);}
.cp-g1-da-link{display:flex;align-items:center;justify-content:center;}
`;

function Column({ name, note, items, icon, showNote, reviewed, delay }) {
  return (
    <section className={`cp-g1-da-col is-${items.length} campus-card campus-rise`} style={enterDelay(delay)}>
      <div className="cp-g1-da-head">
        <NarrIcon name={icon} size={150} stroke={1.2} className="cp-g1-da-water" />
        <div className="cp-g1-da-icon" aria-hidden="true"><NarrIcon name={icon} size={34} stroke={1.8} /></div>
        <div>
          <h3 className="cp-g1-da-name">{name}</h3>
          {showNote ? <div className="cp-g1-da-note">{note}</div> : null}
        </div>
      </div>
      <div className="cp-g1-da-list">
        <div className="cp-g1-da-line" aria-hidden="true" />
        {items.map((item, i) => (
          <div className="cp-g1-da-item" key={i}>
            <div className="cp-g1-da-dot" aria-hidden="true" />
            <div className="cp-g1-da-who-row">
              <div className="cp-g1-da-who">{item?.who}</div>
              <div className="cp-g1-da-year">{item?.year}</div>
            </div>
            <EmText className="cp-g1-da-body" text={item?.body} />
          </div>
        ))}
      </div>
    </section>
  );
}

export function DomesticAbroad(props) {
  useStructureStyle();
  useNarrativeStyle();
  useThemeStyle('campus-domestic-abroad-style', CSS);
  const p = { ...DEFAULTS, ...props };
  const abroad = safeArray(p.abroadItems).slice(0, clamp(p.abroadCount, 2, 4));
  const domestic = safeArray(p.domesticItems).slice(0, clamp(p.domesticCount, 2, 4));
  return (
    <CampusFrame chapterIndex={p.chapterIndex}>
      <TitleRow no={p.sectionNo} title={p.title} className="campus-rise" style={enterDelay(0)} />
      <div className={`cp-g1-da${p.showReview ? ' is-reviewed' : ''}`}>
        <Column name={p.abroadName} note={p.abroadNote} items={abroad} icon="globe" showNote={p.showNotes} delay={1} />
        <Column name={p.domesticName} note={p.domesticNote} items={domestic} icon="pin" showNote={p.showNotes} delay={2} />
      </div>
      {p.showReview && (
        <section className="cp-g1-da-review campus-card campus-rise" style={enterDelay(4)}>
          <div className="cp-g1-da-rlabel">
            <NarrIcon name="quill" size={30} stroke={1.9} />
            <div className="cp-g1-da-rlabel-text">{p.reviewLabel}</div>
          </div>
          <div className="cp-g1-da-seg">
            <div className="cp-g1-da-seg-label"><div className="cp-g1-da-seg-mark" aria-hidden="true" /><div>{p.gapLabel}</div></div>
            <EmText className="cp-g1-da-seg-text" text={p.gap} />
          </div>
          <div className="cp-g1-da-link"><LinkDot direction="right" size={42} /></div>
          <div className="cp-g1-da-seg is-focus">
            <div className="cp-g1-da-seg-label"><SparkStar size={17} className="cp-g1-da-star" /><div>{p.focusLabel}</div></div>
            <EmText className="cp-g1-da-seg-text" text={p.focus} />
          </div>
        </section>
      )}
    </CampusFrame>
  );
}

DomesticAbroad.META = {
  id: 'domestic-abroad',
  label: '国内外研究现状 · 两栏时间线配研究述评',
  roles: ['context', 'comparison'],
  defaults: DEFAULTS,
  copyBudgets: {
    abroadName: 8,
    abroadNote: 18,
    'abroadItems[].who': 10,
    'abroadItems[].year': 6,
    'abroadItems[].body': 80,
    domesticName: 8,
    domesticNote: 18,
    'domesticItems[].who': 10,
    'domesticItems[].year': 6,
    'domesticItems[].body': 80,
    reviewLabel: 5,
    gapLabel: 5,
    gap: 44,
    focusLabel: 5,
    focus: 40,
  },
  controls: [
    { ...CHAPTER_CONTROL, default: 1 },
    { key: 'abroadCount', type: 'number', label: '左栏条数', default: 3, min: 2, max: 4, description: '左栏(默认「国外」)的代表性工作条数;每条是学者 / 机构 + 年份 + 40–80 字概述,概述里可用 **词** 强调。' },
    { key: 'domesticCount', type: 'number', label: '右栏条数', default: 3, min: 2, max: 4, description: '右栏(默认「国内」)的代表性工作条数。' },
    { key: 'showNotes', type: 'toggle', label: '栏注', default: true, description: '栏名下方的一句概括。' },
    { key: 'showReview', type: 'toggle', label: '研究述评', default: true, description: '两栏下方的通栏「研究述评」:现有不足 → 本文切入。' },
  ],
};
