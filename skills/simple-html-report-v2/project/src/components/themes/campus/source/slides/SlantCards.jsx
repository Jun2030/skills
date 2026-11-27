// 斜切立体标签卡:2–6 张横向卡片,每张左侧是一块斜切的立体渐变色块(短标题 + 半透明大编号水印,后面错开一层浅色底板),
// 右侧白卡里是 2–3 条要点。1–3 张时单列通栏,4 张 2×2,5–6 张两列三行(单数时最后一张居中)。
// 适合创新点、激励机制、几类举措这类「几个并列主题,每个主题下几条要点」的内容。
// 色块、底板都是不含文字的形状(clip-path),标题、编号、要点是叠在上面的独立文本。
import React from 'react';
import { useThemeStyle, enterDelay } from '../../../shared/style.jsx';
import { safeArray, clamp } from '../../../chart-safety.mjs';
import { CampusFrame, TitleRow, CHAPTER_CONTROL } from '../kit/chrome.jsx';
import { useFeatureBStyle } from '../kit/feature-b.jsx';

const DEFAULTS = {
  chapterIndex: 4,
  cardCount: 4,
  tone: 'accent',
  sectionNo: '4.1',
  title: '论文的创新与亮点',
  lead: '从理论、框架、方法、行业四个层面，回应已有管理会计研究的不足。',
  cards: [
    { no: '01', title: '理论创新', points: [{ text: '以成本管理为切入点展开研究。' }, { text: '把常用于传统会计的理论用于新的人群和新问题。' }] },
    { no: '02', title: '框架创新', points: [{ text: '以往研究多采用定性方法。' }, { text: '本文采用新的框架模式，突破质性研究的局限。' }] },
    { no: '03', title: '方法创新', points: [{ text: '以往研究多以单一的定量研究为主。' }, { text: '本文采用定性与定量相结合的研究方法。' }] },
    { no: '04', title: '行业创新', points: [{ text: '把传统会计行业的理论应用于新的会计领域。' }, { text: '回应管理会计工具应用领域偏少的问题。' }] },
    { no: '05', title: '实践价值', points: [{ text: '为企业建立管理会计案例库提供参考。' }, { text: '有助于完善企业内部控制制度。' }] },
    { no: '06', title: '人才视角', points: [{ text: '关注管理会计人才缺口与从业者转型。' }, { text: '为从业者提升专业技能提供方向。' }] },
  ],
};

const CSS = `
.cp-slc-lead{flex:none;margin:-6px 0 4px;padding-left:4px;font-size:24px;line-height:1.5;color:var(--theme-muted);letter-spacing:.02em;}
.cp-slc{flex:1;min-height:0;display:flex;flex-wrap:wrap;align-content:center;justify-content:center;gap:40px 56px;padding:22px 18px 6px 4px;}
.cp-slc-card{position:relative;isolation:isolate;display:flex;align-items:stretch;}
.cp-slc-tag{position:relative;isolation:isolate;flex:none;z-index:1;display:flex;flex-direction:column;justify-content:center;align-items:center;padding:0 26px 0 30px;margin:14px 0 -10px;color:var(--theme-on-accent);}
.cp-slc-plate{position:absolute;z-index:-3;left:20px;right:-12px;top:-22px;bottom:30px;background:rgb(var(--theme-accent-rgb) / .16);clip-path:polygon(0 30%,24% 0,100% 0,100% 74%,86% 100%,0 100%);}
.cp-slc-side{position:absolute;z-index:-2;inset:0;transform:translate(7px,9px);background:var(--campus-accent-deep);opacity:.9;clip-path:polygon(0 30%,24% 0,100% 0,100% 74%,86% 100%,0 100%);}
.cp-slc-face{position:absolute;z-index:-1;inset:0;background:radial-gradient(circle at 82% 88%,rgb(255 255 255 / .26) 0%,rgb(255 255 255 / 0) 58%),var(--campus-fill);clip-path:polygon(0 30%,24% 0,100% 0,100% 74%,86% 100%,0 100%);}
.cp-slc-gloss{position:absolute;z-index:-1;left:0;right:0;bottom:0;height:46%;background:linear-gradient(0deg,rgb(255 255 255 / .24) 0%,rgb(255 255 255 / 0) 100%);clip-path:polygon(0 0,100% 0,100% 43.5%,86% 100%,0 100%);}
.cp-slc-edge{position:absolute;z-index:-1;left:0;right:14%;bottom:0;height:3px;background:rgb(255 255 255 / .5);}
.cp-slc-no{position:absolute;left:18px;bottom:6px;font-family:var(--theme-font-serif);font-weight:700;font-size:96px;line-height:.9;letter-spacing:-.02em;color:rgb(255 255 255 / .2);font-variant-numeric:lining-nums;}
.cp-slc-title{position:relative;font-family:var(--theme-font-serif);font-weight:700;font-size:36px;line-height:1.25;letter-spacing:.1em;text-align:center;text-wrap:balance;}
.cp-slc-tag.is-gold{color:var(--campus-gold-deep);}
.cp-slc-tag.is-gold .cp-slc-face{background:radial-gradient(circle at 82% 88%,rgb(255 255 255 / .26) 0%,rgb(255 255 255 / 0) 58%),var(--campus-gold-fill);}
.cp-slc-tag.is-gold .cp-slc-side{background:var(--campus-gold-deep);opacity:.7;}
.cp-slc-tag.is-gold .cp-slc-plate{background:rgb(var(--campus-gold-rgb) / .24);}
.cp-slc-tag.is-gold .cp-slc-no{color:rgb(255 255 255 / .34);}
.cp-slc-body{position:relative;flex:1;min-width:0;display:flex;flex-direction:column;justify-content:center;gap:12px;margin-left:14px;padding:22px 34px 22px 40px;}
.cp-slc-body::before{content:'';position:absolute;inset:0;z-index:-1;border-radius:var(--campus-radius);background:linear-gradient(90deg,var(--campus-paper) 0%,var(--theme-surface) 30%);border:1px solid var(--campus-card-edge);box-shadow:var(--campus-shadow);}
.cp-slc-point{display:flex;align-items:flex-start;gap:14px;}
.cp-slc-point .campus-mark{margin-top:13px;}
.cp-slc-point-text{flex:1;min-width:0;font-size:24px;line-height:1.55;color:var(--theme-ink);text-wrap:pretty;}
.cp-slc.is-wide .cp-slc-point-text{font-size:25px;}
.cp-slc.is-dense{gap:30px 48px;}
.cp-slc.is-dense .cp-slc-title{font-size:32px;}
.cp-slc.is-dense .cp-slc-no{font-size:80px;}
.cp-slc.is-dense .cp-slc-point-text{font-size:22px;line-height:1.5;}
.cp-slc.is-dense .cp-slc-body{gap:8px;padding:16px 28px 16px 42px;}
`;

export function SlantCards(props) {
  useThemeStyle('campus-slant-cards-style', CSS);
  useFeatureBStyle();
  const p = { ...DEFAULTS, ...props };
  const cards = safeArray(p.cards).slice(0, clamp(Math.round(p.cardCount) || 4, 2, 6));
  const n = cards.length;
  // 1–3 张单列通栏;4 张 2×2;5–6 张两列三行。卡片宽度按列数分配,高度按行数分配。
  const cols = n <= 3 ? 1 : 2;
  const rows = Math.ceil(n / cols);
  const wide = cols === 1;
  const dense = rows >= 3;
  const cardW = wide ? 'calc(100% - 120px)' : 'calc((100% - 56px) / 2)';
  const cardH = `calc((100% - ${(rows - 1) * (dense ? 30 : 40)}px - 20px) / ${rows})`;
  const tagW = wide ? 300 : dense ? 236 : 250;
  return (
    <CampusFrame chapterIndex={p.chapterIndex}>
      <TitleRow no={p.sectionNo} title={p.title} className="campus-rise" style={enterDelay(0)} />
      {p.lead ? <p className="cp-slc-lead campus-rise" style={enterDelay(1)}>{p.lead}</p> : null}
      <div className={`cp-slc${wide ? ' is-wide' : ''}${dense ? ' is-dense' : ''}`}>
        {cards.map((card, i) => {
          const gold = p.tone === 'alternate' && i % 2 === 1;
          return (
            <section className="cp-slc-card campus-rise" key={i} style={{ width: cardW, height: cardH, maxHeight: wide ? 230 : 280, ...enterDelay(1 + i) }}>
              <div className={`cp-slc-tag${gold ? ' is-gold' : ''}`} style={{ width: tagW }}>
                <div className="cp-slc-plate" aria-hidden="true" />
                <div className="cp-slc-side" aria-hidden="true" />
                <div className="cp-slc-face" aria-hidden="true" />
                <div className="cp-slc-gloss" aria-hidden="true" />
                <div className="cp-slc-edge" aria-hidden="true" />
                <div className="cp-slc-no">{card?.no}</div>
                <h3 className="cp-slc-title">{card?.title}</h3>
              </div>
              <div className="cp-slc-body">
                {safeArray(card?.points).slice(0, 3).map((pt, j) => (
                  <div className="cp-slc-point" key={j}>
                    <div className={`campus-mark${gold ? ' is-spark' : ''}`} aria-hidden="true" />
                    <p className="cp-slc-point-text">{pt?.text}</p>
                  </div>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </CampusFrame>
  );
}

SlantCards.META = {
  id: 'slant-cards',
  label: '特色 · 斜切立体标签卡',
  roles: ['breakdown', 'observation', 'result'],
  defaults: DEFAULTS,
  copyBudgets: { lead: 44, 'cards[].title': 4, 'cards[].no': 2, 'cards[].points[].text': 26 },
  controls: [
    { ...CHAPTER_CONTROL, default: 4 },
    { key: 'cardCount', type: 'number', label: '卡片数量', default: 4, min: 2, max: 6, description: '标签卡数量:2–3 张单列通栏,4 张 2×2,5–6 张两列三行。每张最多 3 条要点。' },
    { key: 'tone', type: 'radio', label: '色块配色', default: 'accent', options: [{ value: 'accent', label: '全部校色' }, { value: 'alternate', label: '校色暖金交替' }], description: '左侧立体色块全部用校色,或校色与暖金交替。' },
  ],
};
