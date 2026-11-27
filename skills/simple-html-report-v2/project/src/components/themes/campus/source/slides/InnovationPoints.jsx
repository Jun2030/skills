// 创新点:左侧一块竖向渐变主题区(大字「创新点」+ 一句概括 + 星标装饰),右侧 3–6 条错落排开的亮点卡,
// 每条是「带星标的渐变编号块 + 创新类别小标签 + 被强调的关键词短语 + 一两句说明」,沿一条带星形节点的虚线串起来。
// 适合创新点、特色与亮点、主要贡献。
import React from 'react';
import { useThemeStyle, enterDelay } from '../../../shared/style.jsx';
import { safeArray, clamp } from '../../../chart-safety.mjs';
import { CampusFrame, TitleRow, SparkStar, CHAPTER_CONTROL } from '../kit/chrome.jsx';
import { useNarrativeStyle, EmText } from '../kit/narrative.jsx';

const DEFAULTS = {
  chapterIndex: 4,
  pointCount: 4,
  showTags: true,
  showHero: true,
  sectionNo: '4.2',
  title: '创新和亮点',
  heroKicker: 'INNOVATION',
  heroTitle: '创新点',
  heroNote: '从理论、框架、方法到行业应用，四个层面的新尝试',
  points: [
    { no: '01', tag: '理论创新', keyword: '以成本管理为切入点', desc: '把常用于传统会计的理论用于新的人群和新的问题。' },
    { no: '02', tag: '框架创新', keyword: '新的分析框架模式', desc: '以往研究多用定性方法，本文采用新的框架模式，**突破质性研究的局限**。' },
    { no: '03', tag: '方法创新', keyword: '定性与定量相结合', desc: '以往研究多以定量为主，本文把定性分析与定量分析结合使用。' },
    { no: '04', tag: '行业创新', keyword: '理论跨领域迁移', desc: '把传统会计行业的理论应用到新的会计领域。' },
    { no: '05', tag: '应用创新', keyword: '第五条创新的关键词', desc: '一两句话说明这条创新点具体新在哪里、解决了什么问题。' },
    { no: '06', tag: '其他创新', keyword: '第六条创新的关键词', desc: '一两句话说明这条创新点具体新在哪里、解决了什么问题。' },
  ],
};

const CSS = `
.cp-g1-ip{flex:1;min-height:0;display:grid;grid-template-columns:400px minmax(0,1fr);gap:34px;}
.cp-g1-ip.no-hero{grid-template-columns:minmax(0,1fr);}
/* —— 左侧主题区 —— */
.cp-g1-ip-hero{position:relative;isolation:isolate;min-height:0;display:flex;flex-direction:column;justify-content:center;padding:40px 40px 44px;border-radius:var(--campus-radius-lg);background:var(--campus-fill-deep);color:var(--theme-on-accent);box-shadow:var(--campus-shadow-lift);overflow:hidden;}
.cp-g1-ip-hero-kicker{font-size:18px;font-weight:700;letter-spacing:.32em;color:var(--campus-on-accent-muted);}
.cp-g1-ip-hero-title{margin-top:18px;font-family:var(--theme-font-serif);font-weight:700;font-size:calc(92px * var(--cp-ip-hero-scale,1));line-height:1.1;letter-spacing:.06em;}
.cp-g1-ip-hero-rule{display:flex;align-items:center;gap:10px;margin:26px 0 24px;color:var(--campus-spark);}
.cp-g1-ip-hero-rule-line{width:70px;height:4px;border-radius:2px;background:var(--campus-spark);}
.cp-g1-ip-hero-note{font-size:24px;line-height:1.65;color:var(--campus-on-accent-muted);text-wrap:pretty;}
.cp-g1-ip-burst{position:absolute;z-index:-1;right:-70px;top:-60px;color:rgb(255 255 255 / .08);pointer-events:none;}
.cp-g1-ip-burst.is-b{right:auto;top:auto;left:-50px;bottom:-60px;color:rgb(255 255 255 / .06);}
.cp-g1-ip-ring{position:absolute;z-index:-1;right:-120px;bottom:-140px;width:380px;height:380px;border-radius:50%;border:2px solid rgb(255 255 255 / .12);pointer-events:none;}
/* —— 右侧亮点列:左缘一条虚线脊,每条卡片前一个星形节点,卡片奇偶错落 —— */
.cp-g1-ip-list{position:relative;min-height:0;display:flex;flex-direction:column;justify-content:center;gap:var(--cp-g1-ip-gap);}
.cp-g1-ip-spine{position:absolute;left:21px;top:var(--cp-g1-ip-edge);bottom:var(--cp-g1-ip-edge);border-left:2px dashed var(--campus-accent-line);}
.cp-g1-ip-row{position:relative;flex:1 1 0;min-height:0;max-height:190px;display:flex;align-items:center;}
.cp-g1-ip-node{position:relative;z-index:1;flex:none;width:44px;height:44px;display:grid;place-items:center;border-radius:50%;background:var(--theme-surface);color:var(--campus-spark);box-shadow:0 0 0 2px var(--campus-accent-line),0 6px 14px rgb(var(--theme-accent-rgb) / .14);}
.cp-g1-ip-arm{flex:none;width:var(--cp-g1-ip-arm);height:2px;background:var(--campus-fade-line);transform:scaleX(-1);}
.cp-g1-ip-row:nth-child(odd) .cp-g1-ip-arm{width:calc(var(--cp-g1-ip-arm) + var(--cp-g1-ip-step));}
.cp-g1-ip-card{position:relative;flex:1;min-width:0;align-self:stretch;display:grid;grid-template-columns:auto minmax(0,.9fr) auto minmax(0,1.25fr);align-items:center;column-gap:26px;padding:14px 34px 14px 20px;}
.cp-g1-ip-row:nth-child(odd) .cp-g1-ip-card{margin-right:0;}
.cp-g1-ip-row:nth-child(even) .cp-g1-ip-card{margin-right:var(--cp-g1-ip-step);}
/* 编号块:渐变方块 + 右上角星标 */
.cp-g1-ip-seal{position:relative;flex:none;width:78px;height:78px;display:grid;place-items:center;}
.cp-g1-ip-seal-shape{position:absolute;inset:0;border-radius:20px;background:var(--campus-fill);box-shadow:0 10px 20px rgb(var(--theme-accent-rgb) / .28);transform:rotate(-6deg);}
.cp-g1-ip-seal-no{position:relative;font-family:var(--theme-font-serif);font-weight:700;font-size:36px;line-height:1;color:var(--theme-on-accent);font-variant-numeric:lining-nums;}
.cp-g1-ip-seal-star{position:absolute;right:-10px;top:-10px;width:30px;height:30px;display:grid;place-items:center;border-radius:50%;background:var(--theme-surface);color:var(--campus-spark);box-shadow:0 3px 8px rgb(0 0 0 / .12);}
.cp-g1-ip-key{min-width:0;display:flex;flex-direction:column;align-items:flex-start;gap:10px;}
.cp-g1-ip-tag{display:flex;align-items:center;height:30px;padding:0 13px;border-radius:8px 8px 8px 2px;background:var(--campus-accent-tint);font-size:18px;line-height:1;font-weight:700;letter-spacing:.08em;color:var(--theme-accent);white-space:nowrap;}
.cp-g1-ip-keyword{font-family:var(--theme-font-serif);font-weight:700;font-size:31px;line-height:1.3;letter-spacing:.03em;color:var(--theme-ink);background-image:linear-gradient(180deg,rgb(var(--theme-accent-rgb) / 0) 64%,rgb(var(--theme-accent-rgb) / .14) 64%);}
.cp-g1-ip-div{width:2px;height:58%;border-radius:1px;background:var(--campus-accent-line);}
.cp-g1-ip-desc{min-width:0;font-size:22px;line-height:1.6;color:var(--theme-muted);text-wrap:pretty;}
/* 条目多时收紧 */
.cp-g1-ip.is-5 .cp-g1-ip-keyword,.cp-g1-ip.is-6 .cp-g1-ip-keyword{font-size:27px;}
.cp-g1-ip.is-5 .cp-g1-ip-desc,.cp-g1-ip.is-6 .cp-g1-ip-desc{font-size:21px;line-height:1.5;}
.cp-g1-ip.is-5 .cp-g1-ip-seal,.cp-g1-ip.is-6 .cp-g1-ip-seal{width:64px;height:64px;}
.cp-g1-ip.is-5 .cp-g1-ip-seal-no,.cp-g1-ip.is-6 .cp-g1-ip-seal-no{font-size:30px;}
.cp-g1-ip.is-6 .cp-g1-ip-key{flex-direction:row;align-items:center;flex-wrap:wrap;gap:6px 12px;}
.cp-g1-ip.is-6 .cp-g1-ip-card{padding-top:10px;padding-bottom:10px;}
.cp-g1-ip.is-3 .cp-g1-ip-keyword{font-size:34px;}
.cp-g1-ip.is-3 .cp-g1-ip-desc{font-size:24px;line-height:1.7;}
.campus[data-campus-nav="rail"] .cp-g1-ip{grid-template-columns:340px minmax(0,1fr);}
.campus[data-campus-nav="rail"] .cp-g1-ip-hero-title{font-size:calc(80px * var(--cp-ip-hero-scale,1));}
`;

const Burst = ({ size, className }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
    <path fill="currentColor" d="M12 1.5l2.6 7.1 7.4.3-5.8 4.6 2 7.2L12 16.6l-6.2 4.1 2-7.2L2 8.9l7.4-.3z" />
  </svg>
);

// 左侧大字按 3 个字设计(「创新点」);4–5 个字时等比缩小,保持一行,不掉单字
function heroTitleScale(title) {
  const count = Array.from(String(title ?? '').trim()).length;
  return count > 3 ? { '--cp-ip-hero-scale': (3 / count).toFixed(3) } : undefined;
}

export function InnovationPoints(props) {
  useNarrativeStyle();
  useThemeStyle('campus-innovation-points-style', CSS);
  const p = { ...DEFAULTS, ...props };
  const points = safeArray(p.points).slice(0, clamp(p.pointCount, 3, 6));
  const n = points.length;
  const gap = n >= 6 ? 12 : n === 5 ? 14 : 20;
  const vars = {
    '--cp-g1-ip-gap': `${gap}px`,
    '--cp-g1-ip-step': n >= 5 ? '36px' : '56px',
    '--cp-g1-ip-arm': '18px',
    '--cp-g1-ip-edge': '40px',
  };
  return (
    <CampusFrame chapterIndex={p.chapterIndex}>
      <TitleRow no={p.sectionNo} title={p.title} className="campus-rise" style={enterDelay(0)} />
      <div className={`cp-g1-ip is-${n}${p.showHero ? '' : ' no-hero'}`} style={vars}>
        {p.showHero && (
          <section className="cp-g1-ip-hero campus-rise" style={enterDelay(1)}>
            <Burst size={260} className="cp-g1-ip-burst" />
            <Burst size={150} className="cp-g1-ip-burst is-b" />
            <div className="cp-g1-ip-ring" aria-hidden="true" />
            <div className="cp-g1-ip-hero-kicker">{p.heroKicker}</div>
            <h3 className="cp-g1-ip-hero-title" style={heroTitleScale(p.heroTitle)}>{p.heroTitle}</h3>
            <div className="cp-g1-ip-hero-rule" aria-hidden="true"><SparkStar size={22} /><div className="cp-g1-ip-hero-rule-line" /></div>
            <p className="cp-g1-ip-hero-note">{p.heroNote}</p>
          </section>
        )}
        <div className="cp-g1-ip-list">
          <div className="cp-g1-ip-spine" aria-hidden="true" />
          {points.map((pt, i) => (
            <div className="cp-g1-ip-row campus-rise" style={enterDelay(2 + i)} key={i}>
              <div className="cp-g1-ip-node" aria-hidden="true"><SparkStar size={20} /></div>
              <div className="cp-g1-ip-arm" aria-hidden="true" />
              <section className="cp-g1-ip-card campus-card">
                <div className="cp-g1-ip-seal">
                  <div className="cp-g1-ip-seal-shape" aria-hidden="true" />
                  <div className="cp-g1-ip-seal-no">{pt?.no}</div>
                  <div className="cp-g1-ip-seal-star" aria-hidden="true"><SparkStar size={16} /></div>
                </div>
                <div className="cp-g1-ip-key">
                  {p.showTags ? <div className="cp-g1-ip-tag">{pt?.tag}</div> : null}
                  <h3 className="cp-g1-ip-keyword">{pt?.keyword}</h3>
                </div>
                <div className="cp-g1-ip-div" aria-hidden="true" />
                <EmText className="cp-g1-ip-desc" text={pt?.desc} />
              </section>
            </div>
          ))}
        </div>
      </div>
    </CampusFrame>
  );
}

InnovationPoints.META = {
  id: 'innovation-points',
  label: '创新点 · 竖向主题区配错落亮点卡',
  roles: ['result', 'statement', 'observation'],
  defaults: DEFAULTS,
  copyBudgets: { heroKicker: 12, heroTitle: 5, heroNote: 30, 'points[].no': 3, 'points[].tag': 6, 'points[].keyword': 11, 'points[].desc': 50 },
  controls: [
    { ...CHAPTER_CONTROL, default: 4 },
    { key: 'pointCount', type: 'number', label: '创新点条数', default: 4, min: 3, max: 6, description: '右侧亮点卡的条数;每条是类别小标签 + 被强调的关键词短语 + 一两句说明(说明里可用 **词** 再强调)。' },
    { key: 'showTags', type: 'toggle', label: '类别小标签', default: true, description: '关键词上方的类别小标签(如「理论创新」「方法创新」)。' },
    { key: 'showHero', type: 'toggle', label: '左侧主题区', default: true, description: '左侧竖向渐变的大字主题区;关掉后亮点卡铺满宽度。' },
  ],
};
