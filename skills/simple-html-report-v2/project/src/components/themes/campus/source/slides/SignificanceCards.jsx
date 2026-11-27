// 研究意义 / 概念卡:2–5 张卡片横排(4 张时可排成 2×2),每张顶部一个小图位(可关),
// 一枚渐变圆形编号压在图片下沿,下面是「理论意义 / 现实意义 / 应用价值」这类短标题 + 2–3 行说明;底部可选一句总括。
// 关掉图片时卡头换成渐变色块 + 线性小图标。适合研究意义、研究目的、核心概念界定。
import React from 'react';
import { useThemeStyle, enterDelay } from '../../../shared/style.jsx';
import { MediaSlot } from '../../../shared/MediaSlot.jsx';
import { safeArray, clamp } from '../../../chart-safety.mjs';
import { CampusFrame, TitleRow, ConclusionBar, CHAPTER_CONTROL } from '../kit/chrome.jsx';
import { useNarrativeStyle, EmText, NarrIcon } from '../kit/narrative.jsx';

const DEFAULTS = {
  chapterIndex: 1,
  cardCount: 3,
  showImages: true,
  arrange: 'row',
  showSummary: true,
  images: [],
  sectionNo: '1.3',
  title: '研究目的与意义',
  items: [
    { no: '01', title: '理论意义', desc: '梳理管理会计在企业经营管理中的应用框架，丰富**成本管理与战略成本分析**在新场景下的研究。' },
    { no: '02', title: '现实意义', desc: '推动企业从单纯核算转向「解析过去、控制现在、筹划未来」，**改善经营管理、提高经济效益**。' },
    { no: '03', title: '应用价值', desc: '为企业编制计划、作出决策、控制经济活动提供**可操作的工具与流程**参考。' },
    { no: '04', title: '人才培养', desc: '为财会人员从核算型向管理型转型提供能力框架，回应**管理会计人才缺口**。' },
    { no: '05', title: '政策参考', desc: '为管理会计指引在企业落地、完善内部控制制度提供实践依据。' },
  ],
  summaryLabel: '一句话',
  summary: '研究立足「工具、流程、人才」三个层面，回答管理会计如何真正进入企业的经营决策。',
};

// 关掉图片时卡头的线性小图标,按卡片顺序取用(纯装饰)
const HEAD_ICONS = ['bulb', 'target', 'chart', 'people', 'scale'];

const CSS = `
.cp-g1-sc{flex:1;min-height:0;display:grid;grid-auto-flow:column;grid-auto-columns:minmax(0,1fr);gap:28px;}
.cp-g1-sc.is-grid{grid-auto-flow:row;grid-template-columns:repeat(2,minmax(0,1fr));grid-auto-columns:auto;gap:24px 30px;}
.cp-g1-sc-card{position:relative;min-width:0;min-height:0;display:flex;flex-direction:column;}
/* 图片位:卡片上沿内嵌,底部压一枚渐变圆形编号 */
.cp-g1-sc-media{position:relative;flex:1 1 0;min-height:46%;margin:12px 12px 0;}
.cp-g1-sc-media .media-slot{border-radius:10px!important;}
.cp-g1-sc-seal{position:absolute;z-index:2;left:26px;bottom:-34px;width:68px;height:68px;display:grid;place-items:center;border-radius:50%;}
.cp-g1-sc-seal-shape{position:absolute;inset:0;border-radius:50%;background:var(--campus-fill);box-shadow:0 0 0 6px var(--theme-surface),0 10px 22px rgb(var(--theme-accent-rgb) / .3);}
.cp-g1-sc-seal-no{position:relative;font-family:var(--theme-font-serif);font-weight:700;font-size:28px;line-height:1;color:var(--theme-on-accent);font-variant-numeric:lining-nums;}
.cp-g1-sc-body{position:relative;flex:none;min-height:0;display:flex;flex-direction:column;padding:50px 30px 30px;}
.cp-g1-sc.no-media .cp-g1-sc-body{flex:1;justify-content:flex-start;}
.cp-g1-sc-title{font-family:var(--theme-font-serif);font-weight:700;font-size:31px;line-height:1.25;letter-spacing:.06em;color:var(--theme-ink);}
.cp-g1-sc-rule{display:flex;align-items:center;gap:8px;margin:14px 0 14px;}
.cp-g1-sc-rule-bar{width:40px;height:4px;border-radius:2px;background:var(--campus-fill);}
.cp-g1-sc-rule-dot{width:7px;height:7px;border-radius:1px;background:var(--campus-spark);transform:rotate(45deg);}
.cp-g1-sc-desc{font-size:22px;line-height:1.7;color:var(--theme-muted);text-wrap:pretty;}
/* 没有图片:渐变卡头 + 玻璃圆里的线性图标 + 大编号 */
.cp-g1-sc-head{position:relative;isolation:isolate;flex:0 0 42%;display:flex;flex-direction:column;align-items:flex-start;justify-content:space-between;padding:26px 30px 28px;border-radius:var(--campus-radius) var(--campus-radius) 0 0;background:var(--campus-fill-deep);color:var(--theme-on-accent);overflow:hidden;}
.cp-g1-sc-head-orb{position:absolute;z-index:-1;right:-60px;bottom:-90px;width:260px;height:260px;border-radius:50%;border:34px solid rgb(255 255 255 / .07);pointer-events:none;}
.cp-g1-sc-head-orb.is-b{right:auto;left:-40px;top:-60px;bottom:auto;width:140px;height:140px;border-width:18px;border-color:rgb(255 255 255 / .05);}
.cp-g1-sc-icon{align-self:flex-end;width:84px;height:84px;display:grid;place-items:center;border-radius:50%;background:var(--campus-on-accent-glass);box-shadow:inset 0 0 0 1.5px var(--campus-on-accent-line);}
.cp-g1-sc-head-no{order:-1;font-family:var(--theme-font-serif);font-weight:700;font-size:72px;line-height:1;color:rgb(255 255 255 / .92);font-variant-numeric:lining-nums;}
.cp-g1-sc.no-media .cp-g1-sc-body{padding-top:36px;}
/* 关图后卡片竖排时卡身很高:标题与说明在卡身里纵向居中,不再贴着卡头、下面留一大段空白 */
.cp-g1-sc.no-media:not(.is-grid) .cp-g1-sc-body{justify-content:center;padding-bottom:40px;}
/* 2×2:卡片横向,图片在左 */
.cp-g1-sc.is-grid .cp-g1-sc-card{flex-direction:row;}
.cp-g1-sc.is-grid .cp-g1-sc-media{flex:0 0 42%;margin:12px 0 12px 12px;}
.cp-g1-sc.is-grid .cp-g1-sc-seal{left:auto;right:-34px;bottom:auto;top:26px;}
.cp-g1-sc.is-grid .cp-g1-sc-body{flex:1;justify-content:center;padding:26px 34px 26px 58px;}
.cp-g1-sc.is-grid .cp-g1-sc-head{flex:0 0 210px;justify-content:center;align-items:center;gap:18px;border-radius:var(--campus-radius) 0 0 var(--campus-radius);}
.cp-g1-sc.is-grid .cp-g1-sc-icon{align-self:center;width:72px;height:72px;}
.cp-g1-sc.is-grid .cp-g1-sc-head-no{order:0;font-size:60px;}
.cp-g1-sc.is-grid.no-media .cp-g1-sc-body{padding-left:34px;}
/* 卡片多(5 张)时收紧 */
.cp-g1-sc.is-5 .cp-g1-sc-title{font-size:28px;}
.cp-g1-sc.is-5 .cp-g1-sc-desc{font-size:21px;line-height:1.62;}
.cp-g1-sc.is-5 .cp-g1-sc-body{padding-left:24px;padding-right:22px;}
.cp-g1-sc.is-5 .cp-g1-sc-head,.cp-g1-sc.is-4 .cp-g1-sc-head{padding:22px 22px 24px;}
.cp-g1-sc.is-5 .cp-g1-sc-head-no{font-size:60px;}
.cp-g1-sc.is-3 .cp-g1-sc-desc,.cp-g1-sc.is-grid .cp-g1-sc-desc{font-size:23px;}
/* 2 张:字号整体放大一档 */
.cp-g1-sc.is-2 .cp-g1-sc-title{font-size:38px;}
.cp-g1-sc.is-2 .cp-g1-sc-desc{font-size:26px;line-height:1.75;}
.cp-g1-sc.is-2 .cp-g1-sc-body{padding:56px 44px 32px;}
.cp-g1-sc.is-2.no-media .cp-g1-sc-body{padding-top:40px;}
.cp-g1-sc.is-2 .cp-g1-sc-head{padding:34px 44px 36px;}
.cp-g1-sc.is-2 .cp-g1-sc-head-no{font-size:96px;}
.cp-g1-sc.is-2 .cp-g1-sc-icon{width:104px;height:104px;}
.campus[data-campus-nav="rail"] .cp-g1-sc.is-5 .cp-g1-sc-desc{font-size:20px;}
/* 一排卡片:各卡共用同一组行(subgrid),卡头 / 图位、标题、分隔线、说明分别在同一条水平线上;
   说明多一行少一行都从同一位置往下排(按最长那张定行高),不再每张卡各自居中、标题高低不齐。
   上下留白写在行上:有图时图位占满剩余高度、文字贴底;无图时文字组按最长那张在卡身里纵向居中。 */
.cp-g1-sc:not(.is-grid){--sc-head:minmax(46%,1fr);--sc-top:50px;--sc-bot:30px;grid-template-rows:var(--sc-head) var(--sc-top) auto auto auto var(--sc-bot);row-gap:0;}
.cp-g1-sc.no-media:not(.is-grid){--sc-head:42%;--sc-top:minmax(36px,1fr);--sc-bot:minmax(40px,1fr);}
.cp-g1-sc.is-2:not(.is-grid){--sc-top:56px;--sc-bot:32px;}
.cp-g1-sc.is-2.no-media:not(.is-grid){--sc-top:minmax(40px,1fr);--sc-bot:minmax(40px,1fr);}
.cp-g1-sc:not(.is-grid) .cp-g1-sc-card{display:grid;grid-template-rows:subgrid;grid-row:1 / -1;}
.cp-g1-sc:not(.is-grid) .cp-g1-sc-media,.cp-g1-sc:not(.is-grid) .cp-g1-sc-head{grid-row:1;min-height:0;}
.cp-g1-sc:not(.is-grid) .cp-g1-sc-body,.cp-g1-sc.is-2:not(.is-grid) .cp-g1-sc-body,.cp-g1-sc.no-media:not(.is-grid) .cp-g1-sc-body{grid-row:3 / span 3;display:grid;grid-template-rows:subgrid;justify-content:stretch;padding-top:0;padding-bottom:0;}
/* 2×2:同一排的两张卡同理共用一组行(两排之间夹一条 24px 的间隔行),图位 / 卡头在左侧占满整张卡高 */
.cp-g1-sc.is-grid{grid-template-rows:minmax(26px,1fr) auto auto auto minmax(26px,1fr) 24px minmax(26px,1fr) auto auto auto minmax(26px,1fr);row-gap:0;}
.cp-g1-sc.is-grid .cp-g1-sc-card{display:grid;grid-template-columns:calc(42% + 12px) minmax(0,1fr);grid-template-rows:subgrid;grid-row:1 / span 5;}
.cp-g1-sc.is-grid.no-media .cp-g1-sc-card{grid-template-columns:210px minmax(0,1fr);}
.cp-g1-sc.is-grid .cp-g1-sc-card:nth-child(n+3){grid-row:7 / span 5;}
.cp-g1-sc.is-grid .cp-g1-sc-media,.cp-g1-sc.is-grid .cp-g1-sc-head{grid-column:1;grid-row:1 / -1;min-height:0;}
.cp-g1-sc.is-grid .cp-g1-sc-body{grid-column:2;grid-row:2 / span 3;display:grid;grid-template-rows:subgrid;justify-content:stretch;padding-top:0;padding-bottom:0;}
`;

export function SignificanceCards(props) {
  useNarrativeStyle();
  useThemeStyle('campus-significance-cards-style', CSS);
  const p = { ...DEFAULTS, ...props };
  const items = safeArray(p.items).slice(0, clamp(p.cardCount, 2, 5));
  const grid = p.arrange === 'grid' && items.length === 4;
  const media = Boolean(p.showImages);
  const cls = `cp-g1-sc is-${items.length}${grid ? ' is-grid' : ''}${media ? '' : ' no-media'}`;
  return (
    <CampusFrame chapterIndex={p.chapterIndex}>
      <TitleRow no={p.sectionNo} title={p.title} className="campus-rise" style={enterDelay(0)} />
      <div className={cls}>
        {items.map((item, i) => (
          <section className="cp-g1-sc-card campus-card campus-rise" style={enterDelay(1 + i)} key={i}>
            {media ? (
              <div className="cp-g1-sc-media">
                <MediaSlot id={`significance-cards-${i}`} fit="cover" radius={10} placeholder="配图" />
                <div className="cp-g1-sc-seal">
                  <div className="cp-g1-sc-seal-shape" aria-hidden="true" />
                  <div className="cp-g1-sc-seal-no">{item?.no}</div>
                </div>
              </div>
            ) : (
              <div className="cp-g1-sc-head">
                <div className="cp-g1-sc-head-orb" aria-hidden="true" />
                <div className="cp-g1-sc-head-orb is-b" aria-hidden="true" />
                <div className="cp-g1-sc-icon" aria-hidden="true"><NarrIcon name={HEAD_ICONS[i % HEAD_ICONS.length]} size={items.length === 2 ? 54 : 42} stroke={1.6} /></div>
                <div className="cp-g1-sc-head-no">{item?.no}</div>
              </div>
            )}
            <div className="cp-g1-sc-body">
              <h3 className="cp-g1-sc-title">{item?.title}</h3>
              <div className="cp-g1-sc-rule" aria-hidden="true"><div className="cp-g1-sc-rule-bar" /><div className="cp-g1-sc-rule-dot" /></div>
              <EmText className="cp-g1-sc-desc" text={item?.desc} />
            </div>
          </section>
        ))}
      </div>
      {p.showSummary && <ConclusionBar label={p.summaryLabel} text={p.summary} className="campus-rise" style={enterDelay(8)} />}
    </CampusFrame>
  );
}

SignificanceCards.META = {
  id: 'significance-cards',
  label: '研究意义 · 小图概念卡',
  roles: ['context', 'statement', 'image'],
  defaults: DEFAULTS,
  copyBudgets: { 'items[].no': 3, 'items[].title': 8, 'items[].desc': 48, summaryLabel: 5, summary: 44 },
  controls: [
    { ...CHAPTER_CONTROL, default: 1 },
    { key: 'cardCount', type: 'number', label: '卡片数量', default: 3, min: 2, max: 5, countArrays: ['items', 'images'], description: '意义 / 概念卡的张数(每张一个图位;说明里可用 **词** 强调关键词)。' },
    { key: 'showImages', type: 'toggle', label: '卡片配图', default: true, description: '每张卡顶部的小图位;关掉后卡头换成渐变色块 + 线性小图标。' },
    { key: 'arrange', type: 'radio', label: '4 张时的排法', default: 'row', options: [{ value: 'row', label: '一排' }, { value: 'grid', label: '2×2' }], description: '只在卡片为 4 张时生效:一排并列,或排成 2×2(卡片改为图左文右)。' },
    { key: 'showSummary', type: 'toggle', label: '底部总括', default: true, description: '卡片下方的一句总括(校色结论条)。' },
  ],
};
