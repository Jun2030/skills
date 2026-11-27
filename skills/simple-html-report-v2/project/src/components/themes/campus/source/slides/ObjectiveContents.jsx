// 研究目标与内容:顶部一条醒目的「总目标」渐变色带,经一组梳状连线分解到下面 3–6 张「研究内容」卡
// (编号 + 短标题 + 2–3 行说明 + 可选关键词)。3 张一排;4 张排成 2×2;5–6 张排成 3 列两行(5 张时第二行居中)。
// 适合研究目标与研究内容、主要工作、开题的研究内容页。
import React from 'react';
import { useThemeStyle, enterDelay } from '../../../shared/style.jsx';
import { safeArray, clamp } from '../../../chart-safety.mjs';
import { CampusFrame, TitleRow, CHAPTER_CONTROL, useCampusLayout } from '../kit/chrome.jsx';
import { useNarrativeStyle, EmText, NarrIcon, r2 } from '../kit/narrative.jsx';

const DEFAULTS = {
  chapterIndex: 3,
  contentCount: 4,
  showKeywords: true,
  sectionNo: '3.1',
  title: '研究目标与研究内容',
  goalLabel: '总目标',
  goal: '系统梳理管理会计方法在企业经营管理中的应用，**提出兼顾成本、营运与战略的应用框架**',
  items: [
    { no: '01', title: '作业成本分析', desc: '以资源、作业、成本对象、成本动因四要素重构成本核算，分析成本链与成本动因。', keywords: '作业成本 · 成本动因' },
    { no: '02', title: '价值链管理分析', desc: '识别并消除不增加价值的作业，对不可消除的作业尽可能提高工作效率。', keywords: '价值链 · 顾客价值' },
    { no: '03', title: '战略成本分析', desc: '从外部环境、内部条件、竞争态势三方面，确定企业与对手的相对成本地位。', keywords: '竞争态势 · 成本地位' },
    { no: '04', title: '营运管理分析', desc: '按区域、产品、部门、渠道、人员五个维度计量盈利能力，支持精细化管理。', keywords: '多维盈利 · 精细管理' },
    { no: '05', title: '应用难点归纳', desc: '归纳企业应用管理会计的五个难点与四个重点，分析其背后的组织与人才原因。', keywords: '研究难点' },
    { no: '06', title: '对策与展望', desc: '从资源配置、过程控制、体系融合三方面提出管理会计落地的改进建议。', keywords: '对策建议' },
  ],
};

const GAP = 26;
// 卡片右下角的淡色水印图标(纯装饰),按卡片顺序取用
const WATER_ICONS = ['chart', 'gear', 'scale', 'target', 'bulb', 'flag'];

const CSS = `
/* —— 总目标色带 —— */
.cp-g1-oc-goal{position:relative;isolation:isolate;flex:none;display:flex;align-items:center;gap:26px;min-height:124px;padding:16px 56px 16px 18px;border-radius:var(--campus-radius-lg);background:var(--campus-fill-deep);color:var(--theme-on-accent);box-shadow:var(--campus-shadow-lift);overflow:hidden;}
.cp-g1-oc-tile{flex:none;align-self:stretch;display:flex;align-items:center;gap:14px;padding:0 26px 0 14px;border-radius:16px;background:var(--campus-on-accent-glass);}
.cp-g1-oc-icon{flex:none;width:66px;height:66px;display:grid;place-items:center;border-radius:50%;background:var(--theme-surface);color:var(--theme-accent);box-shadow:0 6px 16px rgb(0 0 0 / .14);}
.cp-g1-oc-label{font-family:var(--theme-font-serif);font-weight:700;font-size:28px;letter-spacing:.14em;white-space:nowrap;}
.cp-g1-oc-text{flex:1;min-width:0;font-family:var(--theme-font-serif);font-weight:700;font-size:31px;line-height:1.45;letter-spacing:.03em;text-wrap:pretty;}
.cp-g1-oc-orb{position:absolute;z-index:-1;border-radius:50%;pointer-events:none;}
.cp-g1-oc-orb.is-a{right:-60px;top:-110px;width:280px;height:280px;border:34px solid rgb(255 255 255 / .07);}
.cp-g1-oc-orb.is-b{right:230px;bottom:-70px;width:120px;height:120px;background:rgb(255 255 255 / .06);}
/* —— 梳状连线:总目标 → 第一行各卡(SVG 只画线,节点是 HTML 小块) —— */
.cp-g1-oc-comb{position:relative;flex:none;height:50px;color:var(--theme-accent);}
.cp-g1-oc-comb svg{position:absolute;inset:0;width:100%;height:100%;overflow:visible;}
.cp-g1-oc-node{position:absolute;bottom:-2px;width:12px;height:12px;margin-left:-6px;border-radius:50%;background:var(--theme-surface);box-shadow:inset 0 0 0 3px var(--theme-accent);}
.cp-g1-oc-hub{position:absolute;left:50%;top:-1px;width:14px;height:14px;margin-left:-7px;border-radius:2px;background:var(--campus-spark);transform:rotate(45deg);}
/* —— 内容卡 —— */
.cp-g1-oc-grid{flex:1;min-height:0;display:grid;grid-template-columns:repeat(6,minmax(0,1fr));grid-auto-rows:minmax(0,1fr);column-gap:${GAP}px;row-gap:22px;}
.cp-g1-oc-grid.is-two{grid-template-columns:repeat(2,minmax(0,1fr));}
.cp-g1-oc-card{position:relative;isolation:isolate;grid-column:span 2;min-width:0;min-height:0;display:flex;flex-direction:column;padding:26px 30px 24px;overflow:hidden;}
.cp-g1-oc-grid.is-two .cp-g1-oc-card{grid-column:span 1;}
.cp-g1-oc-grid.is-5 .cp-g1-oc-card:nth-child(4){grid-column:2 / span 2;}
.cp-g1-oc-cap{position:absolute;left:0;right:0;top:0;height:6px;background:var(--campus-fill);border-radius:var(--campus-radius) var(--campus-radius) 0 0;}
.cp-g1-oc-head{display:flex;align-items:center;gap:16px;}
.cp-g1-oc-no{flex:none;font-family:var(--theme-font-serif);font-weight:700;font-size:50px;line-height:1;color:var(--theme-accent);font-variant-numeric:lining-nums;}
.cp-g1-oc-sep{flex:none;width:2px;height:36px;border-radius:1px;background:var(--campus-accent-line);transform:skewX(-18deg);}
.cp-g1-oc-title{min-width:0;font-family:var(--theme-font-serif);font-weight:700;font-size:29px;line-height:1.25;letter-spacing:.04em;color:var(--theme-ink);}
.cp-g1-oc-desc{margin:16px 0 14px;font-size:22px;line-height:1.68;color:var(--theme-muted);text-wrap:pretty;}
.cp-g1-oc-keys{align-self:flex-start;display:flex;align-items:center;gap:10px;margin-top:auto;padding:7px 16px 7px 12px;border-radius:999px;background:var(--campus-accent-wash);}
.cp-g1-oc-keys-text{font-size:19px;line-height:1.3;font-weight:700;letter-spacing:.04em;color:var(--theme-accent);}
.cp-g1-oc-grid.is-rows .cp-g1-oc-card{padding:20px 26px 18px;}
.cp-g1-oc-grid.is-rows .cp-g1-oc-no{font-size:42px;}
.cp-g1-oc-grid.is-rows .cp-g1-oc-title{font-size:26px;}
.cp-g1-oc-grid.is-rows .cp-g1-oc-desc{margin:10px 0 10px;font-size:20px;line-height:1.55;}
.cp-g1-oc-grid.is-rows .cp-g1-oc-keys-text{font-size:18px;}
.cp-g1-oc-grid.is-two .cp-g1-oc-desc{font-size:23px;}
.cp-g1-oc-water{position:absolute;z-index:-1;right:-20px;bottom:-24px;color:rgb(var(--theme-accent-rgb) / .06);pointer-events:none;}
.cp-g1-oc-grid.is-3 .cp-g1-oc-card{padding:34px 36px 30px;justify-content:center;}
/* 3 张卡只有一行、卡很高:内容整体纵向居中,关键词紧跟说明,不再沉到卡底留出大段空白 */
.cp-g1-oc-grid.is-3 .cp-g1-oc-keys{margin-top:8px;}
.cp-g1-oc-grid.is-3 .cp-g1-oc-no{font-size:76px;}
.cp-g1-oc-grid.is-3 .cp-g1-oc-head{flex-direction:column;align-items:flex-start;gap:14px;}
.cp-g1-oc-grid.is-3 .cp-g1-oc-sep{width:48px;height:4px;background:var(--campus-fill);transform:none;}
.cp-g1-oc-grid.is-3 .cp-g1-oc-title{font-size:34px;}
.cp-g1-oc-grid.is-3 .cp-g1-oc-desc{font-size:25px;line-height:1.8;}
.cp-g1-oc-grid.is-3 .cp-g1-oc-water{right:auto;left:50%;bottom:-30px;margin-left:-150px;color:rgb(var(--theme-accent-rgb) / .07);}
.cp-g1-oc-grid.is-3 .cp-g1-oc-keys-text{font-size:20px;}
.campus[data-campus-nav="rail"] .cp-g1-oc-text{font-size:29px;}
`;

export function ObjectiveContents(props) {
  useNarrativeStyle();
  useThemeStyle('campus-objective-contents-style', CSS);
  const p = { ...DEFAULTS, ...props };
  const { bodyW } = useCampusLayout();
  const items = safeArray(p.items).slice(0, clamp(p.contentCount, 3, 6));
  const n = items.length;
  const cols = n === 4 ? 2 : 3;
  const firstRow = Math.min(n, cols);
  const rows = n > cols ? 2 : 1;
  // 第一行各卡中心的横向位置(百分比),与 CSS 的列宽 / 列间距一致
  const colW = (bodyW - GAP * (cols - 1)) / cols;
  const xs = Array.from({ length: firstRow }, (_, j) => r2(((j * (colW + GAP) + colW / 2) / bodyW) * 100));
  const left = xs[0];
  const right = xs[xs.length - 1];
  return (
    <CampusFrame chapterIndex={p.chapterIndex}>
      <TitleRow no={p.sectionNo} title={p.title} className="campus-rise" style={enterDelay(0)} />
      <section className="cp-g1-oc-goal campus-rise" style={enterDelay(1)}>
        <div className="cp-g1-oc-orb is-a" aria-hidden="true" />
        <div className="cp-g1-oc-orb is-b" aria-hidden="true" />
        <div className="cp-g1-oc-tile">
          <div className="cp-g1-oc-icon" aria-hidden="true"><NarrIcon name="target" size={38} stroke={2} /></div>
          <div className="cp-g1-oc-label">{p.goalLabel}</div>
        </div>
        <EmText className="cp-g1-oc-text cp-g1-on-fill" text={p.goal} />
      </section>
      <div className="cp-g1-oc-comb campus-fade" style={enterDelay(2)} aria-hidden="true">
        <svg viewBox="0 0 100 50" preserveAspectRatio="none">
          <path d="M50 0 V22" fill="none" stroke="currentColor" strokeWidth="2.5" strokeOpacity=".7" vectorEffect="non-scaling-stroke" />
          <path d={`M${left} 48 V30 Q${left} 22 ${r2(left + 1)} 22 H${r2(right - 1)} Q${right} 22 ${right} 30 V48`} fill="none" stroke="currentColor" strokeWidth="2.5" strokeOpacity=".7" vectorEffect="non-scaling-stroke" />
          {xs.slice(1, -1).map((x, j) => <path key={j} d={`M${x} 22 V48`} fill="none" stroke="currentColor" strokeWidth="2.5" strokeOpacity=".7" vectorEffect="non-scaling-stroke" />)}
        </svg>
        <div className="cp-g1-oc-hub" />
        {xs.map((x, j) => <div className="cp-g1-oc-node" style={{ left: `${x}%` }} key={j} />)}
      </div>
      <div className={`cp-g1-oc-grid is-${n}${cols === 2 ? ' is-two' : ''}${rows > 1 && cols === 3 ? ' is-rows' : ''}`}>
        {items.map((item, i) => (
          <section className="cp-g1-oc-card campus-card campus-rise" style={enterDelay(3 + i)} key={i}>
            <div className="cp-g1-oc-cap" aria-hidden="true" />
            <NarrIcon name={WATER_ICONS[i % WATER_ICONS.length]} size={n === 3 ? 300 : 170} stroke={1.2} className="cp-g1-oc-water" />
            <div className="cp-g1-oc-head">
              <div className="cp-g1-oc-no">{item?.no}</div>
              <div className="cp-g1-oc-sep" aria-hidden="true" />
              <h3 className="cp-g1-oc-title">{item?.title}</h3>
            </div>
            <EmText className="cp-g1-oc-desc" text={item?.desc} />
            {p.showKeywords && (
              <div className="cp-g1-oc-keys">
                <div className="campus-mark is-spark" aria-hidden="true" />
                <div className="cp-g1-oc-keys-text">{item?.keywords}</div>
              </div>
            )}
          </section>
        ))}
      </div>
    </CampusFrame>
  );
}

ObjectiveContents.META = {
  id: 'objective-contents',
  label: '研究目标与内容 · 总目标分解内容卡',
  roles: ['breakdown', 'context', 'actions'],
  defaults: DEFAULTS,
  copyBudgets: { goalLabel: 5, goal: 44, 'items[].no': 3, 'items[].title': 9, 'items[].desc': 48, 'items[].keywords': 14 },
  controls: [
    { ...CHAPTER_CONTROL, default: 3 },
    { key: 'contentCount', type: 'number', label: '研究内容数', default: 4, min: 3, max: 6, description: '总目标下的研究内容卡张数:3 张一排,4 张 2×2,5–6 张 3 列两行(5 张时第二行居中)。' },
    { key: 'showKeywords', type: 'toggle', label: '关键词', default: true, description: '每张卡底部的一枚关键词胶囊。' },
  ],
};
