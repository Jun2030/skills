// 打开的立体书:页面中央一本摊开的厚书(略带俯视透视)——左右两页从书脊向外拱起,纸面是带校色 / 暖金倾向的暖白,
// 有书脊阴影与纸面弧面的明暗过渡;外缘与下沿露出层层刷金的书口,下面压着露出一圈的校色硬壳封面(金色压线、板厚);
// 两页顶部各一条随纸面弯曲的页眉色带(左页校色、右页暖金),条目编号是渐变圆徽标;书脊下端垂出两条书签丝带,
// 书的上方一条绶带标注主题。左页、右页各写一组 2–4 条内容(如 理论基础 / 实践应用、问题 / 回答),
// 书的两侧可各放 1–2 张补充卡。适合理论基础、读书报告、文献精读。
// 书、封面、色带、丝带、绶带底都是不含文字的图形;主题、页标题、编号、条目、补充卡都是叠在上面的水平 HTML 文本。
import React from 'react';
import { useThemeStyle, enterDelay } from '../../../shared/style.jsx';
import { safeArray, clamp } from '../../../chart-safety.mjs';
import { CampusFrame, TitleRow, CHAPTER_CONTROL, TITLE_ROW_SPACE, useCampusLayout } from '../kit/chrome.jsx';
import { useSvgId, ToneDefs, Stop, r2 } from '../kit/feature-b.jsx';
import { useFeatureDStyle, MetalDefs, G6Tag, pad2, polyPath } from '../kit/feature-d.jsx';

const DEFAULTS = {
  chapterIndex: 2,
  itemCount: 3,
  noteCount: 2,
  sectionNo: '2.1',
  title: '作业成本法：从理论基础到实践应用',
  topic: '作业成本法',
  leftTitle: '理论基础',
  rightTitle: '实践应用',
  leftItems: [
    { title: '核心定义', body: '以提高客户价值、增加企业利润为目的，基于作业成本法的新型集中化管理方法。' },
    { title: '四大核算要素', body: '资源、作业、成本对象、成本动因。' },
    { title: '与传统会计的区别', body: '把企业视作为满足顾客需要而设计的一系列作业的集合体。' },
    { title: '三类分析内容', body: '成本链分析、动因分析与作业分析。' },
  ],
  rightItems: [
    { title: '分配制造费用', body: '科学合理地分配制造费用，提供客观的成本信息。' },
    { title: '支持经营决策', body: '为决策提供准确信息，帮助企业改善经营管理。' },
    { title: '精简作业', body: '消除和精简不创造价值的作业，提高经济效益。' },
    { title: '九环节实施', body: '从作业认定、调研、识别到成本归集、分配与比例计算。' },
  ],
  notes: [
    { label: '研究目的', text: '满足企业编制计划、作出决策、控制经济活动的需要。' },
    { label: '研究意义', text: '把解析过去、控制现在、筹划未来结合起来。' },
    { label: '工作环节', text: '收集汇总 → 分析报告 → 预测决策' },
    { label: '实施模型', text: '由作业实施理论与九个实施步骤两部分构成。' },
  ],
};

// 纸色:白里调进少量暖金与校色(都读 token,不写字面量);校色偏暖时暖金整组换成冷调银蓝,纸色跟着变冷白。
const PAPER = 'color-mix(in srgb,var(--campus-gold-hi) 26%,var(--theme-surface))';
const PAPER_DEEP = 'color-mix(in srgb,var(--campus-gold) 20%,color-mix(in srgb,var(--theme-accent) 6%,var(--theme-surface)))';

const CSS = `
.cp-g6-ob{position:relative;flex:1;min-height:0;}
.cp-g6-ob-banner{position:absolute;transform:translateX(-50%);isolation:isolate;display:flex;align-items:center;justify-content:center;height:60px;padding:0 54px;color:var(--theme-on-accent);font-family:var(--theme-font-serif);font-weight:700;font-size:30px;letter-spacing:.12em;white-space:nowrap;}
.cp-g6-ob-banner-face{position:absolute;inset:0;z-index:-1;background:var(--campus-fill);clip-path:polygon(0 0,100% 0,calc(100% - 18px) 50%,100% 100%,0 100%,18px 50%);box-shadow:var(--campus-shadow-lift);}
.cp-g6-ob-banner-gloss{position:absolute;left:0;right:0;top:0;height:46%;z-index:-1;background:linear-gradient(180deg,rgb(255 255 255 / .3) 0%,rgb(255 255 255 / 0) 100%);clip-path:polygon(0 0,100% 0,calc(100% - 8px) 100%,8px 100%);}
.cp-g6-ob-banner-tail{position:absolute;z-index:-2;top:14px;width:62px;height:58px;background:var(--campus-accent-deep);}
.cp-g6-ob-banner-tail.is-left{left:-40px;clip-path:polygon(0 0,100% 0,100% 100%,0 100%,18px 50%);}
.cp-g6-ob-banner-tail.is-right{right:-40px;clip-path:polygon(0 0,100% 0,calc(100% - 18px) 50%,100% 100%,0 100%);}
.cp-g6-ob-banner-mark{flex:none;width:10px;height:10px;margin:0 16px;border-radius:2px;background:var(--campus-spark);transform:rotate(45deg);}
.cp-g6-ob-title{position:absolute;transform:translate(-50%,-50%);font-family:var(--theme-font-serif);font-weight:700;font-size:34px;line-height:1.2;letter-spacing:.14em;color:var(--theme-on-accent);white-space:nowrap;}
.cp-g6-ob-title.is-right{color:var(--campus-gold-deep);}
.cp-g6-ob-list{position:absolute;display:flex;flex-direction:column;justify-content:space-evenly;}
.cp-g6-ob-item{display:flex;align-items:flex-start;gap:16px;padding:6px 0 12px;border-bottom:1.5px dashed rgb(var(--theme-accent-rgb) / .14);}
.cp-g6-ob-item:last-child{border-bottom-color:transparent;}
.cp-g6-ob-list.is-right .cp-g6-ob-item{border-bottom-color:rgb(var(--campus-gold-rgb) / .3);}
.cp-g6-ob-list.is-right .cp-g6-ob-item:last-child{border-bottom-color:transparent;}
.cp-g6-ob-badge{position:relative;isolation:isolate;flex:none;display:grid;place-items:center;width:46px;height:46px;color:var(--theme-on-accent);font-family:var(--theme-font-serif);font-weight:700;font-size:21px;line-height:1;font-variant-numeric:lining-nums;}
.cp-g6-ob-badge-ring{position:absolute;inset:-4px;z-index:-2;border-radius:50%;background:var(--theme-surface);box-shadow:0 6px 14px rgb(var(--theme-accent-rgb) / .28),0 0 0 1.5px rgb(var(--theme-accent-rgb) / .16);}
.cp-g6-ob-badge-face{position:absolute;inset:0;z-index:-1;border-radius:50%;background:radial-gradient(circle at 34% 26%,rgb(255 255 255 / .42) 0%,rgb(255 255 255 / 0) 46%),var(--campus-fill);}
.cp-g6-ob-list.is-right .cp-g6-ob-badge{color:var(--campus-gold-deep);}
.cp-g6-ob-list.is-right .cp-g6-ob-badge-ring{box-shadow:0 6px 14px rgb(var(--campus-gold-rgb) / .36),0 0 0 1.5px rgb(var(--campus-gold-rgb) / .3);}
.cp-g6-ob-list.is-right .cp-g6-ob-badge-face{background:radial-gradient(circle at 34% 26%,rgb(255 255 255 / .5) 0%,rgb(255 255 255 / 0) 46%),var(--campus-gold-fill);}
.cp-g6-ob-item-text{flex:1;min-width:0;display:flex;flex-direction:column;gap:3px;padding-top:4px;}
.cp-g6-ob-item-title{font-weight:700;font-size:24px;line-height:1.35;color:var(--theme-accent);}
.cp-g6-ob-list.is-right .cp-g6-ob-item-title{color:var(--campus-gold-ink);}
.cp-g6-ob-item-body{font-size:21px;line-height:1.5;color:var(--theme-ink);opacity:.8;text-wrap:pretty;}
.cp-g6-ob-list.is-2 .cp-g6-ob-item-title{font-size:27px;}
.cp-g6-ob-list.is-2 .cp-g6-ob-item-body{font-size:23px;}
.cp-g6-ob-list.is-4 .cp-g6-ob-item{gap:14px;padding:0 0 6px;}
.cp-g6-ob-list.is-4 .cp-g6-ob-item-title{line-height:1.3;}
.cp-g6-ob-list.is-4 .cp-g6-ob-item-body{line-height:1.4;}
.cp-g6-ob-list.is-4 .cp-g6-ob-badge{width:40px;height:40px;font-size:19px;}
.cp-g6-ob-title.is-4{font-size:30px;}
.cp-g6-ob-note-col{position:absolute;display:flex;flex-direction:column;justify-content:center;gap:28px;}
.cp-g6-ob-note{display:flex;flex-direction:column;align-items:flex-start;gap:12px;padding:20px 20px 22px;}
.cp-g6-ob-note .cp-g6-tag{height:40px;padding:0 18px;font-size:20px;}
.cp-g6-ob-note-text{font-size:21px;line-height:1.55;color:var(--theme-ink);text-wrap:pretty;}
`;

/** 一页书页上沿的三次曲线控制点:s=-1 左页、s=1 右页;从书脊 (cx, yT+sag) 拱起到外角 (cx±(pw-inset), yT)。 */
function topCurve(cx, s, pw, yT, sag, inset) {
  return [
    { x: cx, y: yT + sag },
    { x: cx + s * pw * 0.2, y: yT - sag * 0.7 },
    { x: cx + s * pw * 0.62, y: yT - sag * 0.45 },
    { x: cx + s * (pw - inset), y: yT },
  ];
}
const bez = (P, t) => {
  const u = 1 - t;
  return {
    x: u * u * u * P[0].x + 3 * u * u * t * P[1].x + 3 * u * t * t * P[2].x + t * t * t * P[3].x,
    y: u * u * u * P[0].y + 3 * u * u * t * P[1].y + 3 * u * t * t * P[2].y + t * t * t * P[3].y,
  };
};
/** 曲线在横坐标 x 处的纵坐标(x 随 t 单调,采样后线性插值)。 */
function curveYAt(P, x) {
  const pts = Array.from({ length: 65 }, (_, i) => bez(P, i / 64));
  const dir = Math.sign(P[3].x - P[0].x) || 1;
  for (let i = 1; i < pts.length; i += 1) {
    const a = pts[i - 1];
    const b = pts[i];
    if ((x - a.x) * dir >= 0 && (b.x - x) * dir >= 0) {
      const k = Math.abs(b.x - a.x) < 1e-6 ? 0 : (x - a.x) / (b.x - a.x);
      return a.y + (b.y - a.y) * k;
    }
  }
  return (x - P[0].x) * dir < 0 ? P[0].y : P[3].y;
}

/**
 * 一页书页的轮廓:s=-1 左页、s=1 右页;页宽 pw,上沿 yT、下沿 yB,书脊处下沉 sag;
 * 上沿外角比下沿外角向内收 inset(俯视透视),上下沿都从书脊向外拱起。
 */
function pagePath(cx, s, pw, yT, yB, sag, inset = 0) {
  const P = topCurve(cx, s, pw, yT, sag, inset);
  const ob = cx + s * pw;
  return [
    `M ${r2(P[0].x)} ${r2(P[0].y)}`,
    `C ${r2(P[1].x)} ${r2(P[1].y)} ${r2(P[2].x)} ${r2(P[2].y)} ${r2(P[3].x)} ${r2(P[3].y)}`,
    `L ${r2(ob)} ${r2(yB - sag * 0.5)}`,
    `C ${r2(cx + s * pw * 0.64)} ${r2(yB - sag * 1.05)} ${r2(cx + s * pw * 0.2)} ${r2(yB - sag * 0.7)} ${r2(cx)} ${r2(yB + sag * 0.4)}`,
    'Z',
  ].join(' ');
}

/** 书签丝带(燕尾):从 (x, y0) 垂到 y1,宽 w,绕顶端转 deg 度。 */
function ribbonPath(x, y0, y1, w, deg) {
  const pts = [
    { x, y: y0 }, { x: x + w, y: y0 }, { x: x + w, y: y1 }, { x: x + w / 2, y: y1 - w * 0.5 }, { x, y: y1 },
  ];
  const rad = deg * Math.PI / 180;
  const ox = x + w / 2;
  return polyPath(pts.map(q => ({ x: ox + (q.x - ox) * Math.cos(rad) - (q.y - y0) * Math.sin(rad), y: y0 + (q.x - ox) * Math.sin(rad) + (q.y - y0) * Math.cos(rad) })));
}

export function OpenBook(props) {
  useThemeStyle('campus-open-book-style', CSS);
  useFeatureDStyle();
  const p = { ...DEFAULTS, ...props };
  const id = useSvgId('cp-g6-ob');
  const { bodyW, bodyH } = useCampusLayout();
  const n = clamp(Math.round(p.itemCount) || 3, 2, 4);
  const leftItems = safeArray(p.leftItems).slice(0, n);
  const rightItems = safeArray(p.rightItems).slice(0, n);
  const notes = safeArray(p.notes).slice(0, clamp(Math.round(p.noteCount) || 0, 0, 4));
  const noteCols = [notes.filter((_, i) => i % 2 === 0), notes.filter((_, i) => i % 2 === 1)];
  const W = bodyW;
  const H = bodyH - TITLE_ROW_SPACE;
  const noteW = notes.length ? (n >= 4 ? 236 : clamp(Math.round(W * 0.15), 230, 262)) : 0;
  const noteGap = notes.length ? 34 : 0;
  const coverPad = 34;
  const bookW = Math.min(W - 2 * (noteW + noteGap) - 16, notes.length ? 1330 : 1320);
  const cx = r2(W / 2);
  const pw = r2(bookW / 2 - coverPad);
  const yT = 80;
  const yB = H - 92;
  const sag = 30;
  const inset = 62;
  const stack = 9;
  const coverB = yB + 44;
  const coverT = yT - 12;
  const yBo = yB - sag * 0.5;

  // 页眉色带:沿上沿曲线下移 off、高 bandH,从书脊一直铺到外缘(出血印刷的效果,外端顺着透视斜边)
  const off = 22;
  const bandH = n >= 4 ? 58 : 68;
  const edgeX = (s, y) => cx + s * (pw - inset + inset * clamp((y - yT) / (yBo - yT), 0, 1));
  const pages = [-1, 1].map(s => {
    const P = topCurve(cx, s, pw, yT, sag, inset);
    const xEnd = edgeX(s, yT + off);
    const xs = Array.from({ length: 25 }, (_, i) => cx + (xEnd - cx) * i / 24);
    const topLine = xs.map(x => ({ x, y: curveYAt(P, x) + off }));
    const last = topLine[topLine.length - 1];
    last.x = edgeX(s, last.y);
    const bottomLine = topLine.map((q, i) => ({ x: i === topLine.length - 1 ? edgeX(s, q.y + bandH) : q.x, y: q.y + bandH }));
    const band = polyPath([...topLine, ...bottomLine.slice().reverse()]);
    const rule = polyPath(bottomLine.slice(1).map(q => ({ x: q.x, y: q.y + 7 })), false);
    const xa = cx + s * 30;
    const xb = cx + s * (pw - inset - 10);
    const tx = (xa + xb) / 2;
    const ty = curveYAt(P, tx) + off + bandH / 2;
    const bandBottom = Math.max(...bottomLine.slice(2).map(q => q.y));
    // 文字框:书脊一侧留 40,外缘一侧按透视收进
    const inner = 40;
    const outer = Math.round(inset * 0.75 + 26);
    const x0 = s < 0 ? cx - pw + outer : cx + inner;
    const x1 = s < 0 ? cx - inner : cx + pw - outer;
    return { s, band, rule, tx, ty, bandBottom, x0, x1, xa, xb, P };
  });
  const listTop = r2(Math.max(...pages.map(pg => pg.bandBottom)) + 18);
  const listBottom = r2(yB - sag * 0.9 - 20);

  return (
    <CampusFrame chapterIndex={p.chapterIndex}>
      <TitleRow no={p.sectionNo} title={p.title} className="campus-rise" style={enterDelay(0)} />
      <div className="cp-g6-ob">
        <svg className="cp-g6-svg campus-fade" style={{ left: 0, top: 0, width: W, height: H, ...enterDelay(1) }} viewBox={`0 0 ${W} ${H}`} aria-hidden="true">
          <ToneDefs id={id} tones={['accent', 'gold']} />
          <MetalDefs id={id} />
          <defs>
            <filter id={`${id}-blur`} x="-20%" y="-40%" width="140%" height="180%"><feGaussianBlur stdDeviation="18" /></filter>
            {/* 纸面弧度:书脊处深、往外先亮后略暗,外缘再收一道暗边 */}
            {[['l', 1, 0], ['r', 0, 1]].map(([k, x1, x2]) => (
              <linearGradient key={k} id={`${id}-curl-${k}`} x1={x1} y1="0" x2={x2} y2="0">
                <Stop offset="0" color="var(--theme-ink)" opacity=".34" />
                <Stop offset=".035" color="var(--theme-ink)" opacity=".16" />
                <Stop offset=".1" color="var(--campus-gold-lo)" opacity=".1" />
                <Stop offset=".2" color="var(--theme-surface)" opacity="0" />
                <Stop offset=".42" color="var(--theme-surface)" opacity=".6" />
                <Stop offset=".62" color="var(--theme-surface)" opacity=".1" />
                <Stop offset=".88" color="var(--campus-gold)" opacity=".08" />
                <Stop offset="1" color="var(--theme-accent)" opacity=".14" />
              </linearGradient>
            ))}
            <linearGradient id={`${id}-paper`} x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" color={PAPER} />
              <Stop offset="1" color={PAPER_DEEP} />
            </linearGradient>
            {/* 页眉色带:左页校色、右页暖金,从书脊一侧(暗)到外缘(亮) */}
            {[['l', 'accent', 1, 0], ['r', 'gold', 0, 1]].map(([k, tone, x1, x2]) => {
              const t = tone === 'gold'
                ? ['var(--campus-gold-lo)', 'var(--campus-gold)', 'var(--campus-gold-hi)']
                : ['var(--campus-accent-lo)', 'var(--theme-accent)', 'var(--campus-accent-hi)'];
              return (
                <linearGradient key={k} id={`${id}-band-${k}`} x1={x1} y1="0" x2={x2} y2="1">
                  <Stop offset="0" color={t[0]} />
                  <Stop offset=".5" color={t[1]} />
                  <Stop offset="1" color={t[2]} />
                </linearGradient>
              );
            })}
            <radialGradient id={`${id}-ray`} gradientUnits="userSpaceOnUse" cx={cx} cy={r2(yT + sag)} r={r2((yB - yT) * 0.9)}>
              <Stop offset="0" color="var(--campus-gold)" opacity=".4" />
              <Stop offset=".55" color="var(--campus-gold)" opacity=".12" />
              <Stop offset="1" color="var(--campus-gold)" opacity="0" />
            </radialGradient>
            {/* 刷金书口:竖向金属 */}
            <linearGradient id={`${id}-edge`} x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" color="var(--campus-gold-hi)" />
              <Stop offset=".5" color="var(--campus-gold)" />
              <Stop offset="1" color="var(--campus-gold-lo)" />
            </linearGradient>
          </defs>
          {/* 背景光晕与落地阴影 */}
          <ellipse cx={cx} cy={r2(H * 0.5)} rx={r2(bookW * 0.64)} ry={r2(H * 0.58)} fill={`url(#${id}-halo)`} />
          <ellipse cx={r2(cx + 10)} cy={r2(coverB + 18)} rx={r2(pw * 1.06)} ry="26" fill="var(--theme-accent)" fillOpacity=".42" filter={`url(#${id}-blur)`} />
          {/* 书脊上方升起的放射光 */}
          {Array.from({ length: 13 }, (_, k) => {
            const a = -66 + k * 11;
            const L = Math.min((k % 2 ? 0.74 : 0.95) * (yB - yT), (yT + sag + 8) / Math.max(0.2, Math.cos(a * Math.PI / 180)));
            const tip = (deg, r) => ({ x: r2(cx + r * Math.sin(deg * Math.PI / 180)), y: r2(yT + sag - r * Math.cos(deg * Math.PI / 180)) });
            const p1 = tip(a - 2.6, L);
            const p2 = tip(a + 2.6, L);
            return <path key={`ray${k}`} d={`M ${cx} ${r2(yT + sag)} L ${p1.x} ${p1.y} L ${p2.x} ${p2.y} Z`} fill={`url(#${id}-ray)`} />;
          })}
          {/* 硬壳封面:板厚(背光面)+ 正面渐变 + 光泽 + 烫金压线 */}
          {[-1, 1].map(s => {
            const d = pagePath(cx, s, pw + coverPad, coverT, coverB, sag * 0.62, inset + 14);
            return (
              <g key={`c${s}`}>
                <path d={d} fill={`url(#${id}-accent-side)`} transform="translate(0 14)" />
                <path d={d} fill={`url(#${id}-accent-face)`} />
                <path d={d} fill={`url(#${id}-gloss)`} opacity=".55" />
                <path d={pagePath(cx, s, pw + coverPad - 12, coverT + 9, coverB - 10, sag * 0.62, inset + 14)} fill="none" stroke="var(--campus-gold)" strokeOpacity=".85" strokeWidth="2.2" />
                <path d={pagePath(cx, s, pw + coverPad - 18, coverT + 15, coverB - 16, sag * 0.62, inset + 14)} fill="none" stroke="var(--campus-gold-hi)" strokeOpacity=".4" strokeWidth="1" />
                {/* 包金书角:封面四个外角各一枚金属三角 */}
                {(() => {
                  const bo = { x: cx + s * (pw + coverPad), y: coverB - sag * 0.31 };
                  const to = { x: cx + s * (pw + coverPad - inset - 14), y: coverT };
                  const len = Math.hypot(to.x - bo.x, to.y - bo.y) || 1;
                  const up = { x: (to.x - bo.x) / len, y: (to.y - bo.y) / len };
                  const L = 46;
                  const capB = [bo, { x: bo.x + up.x * L, y: bo.y + up.y * L }, { x: bo.x - s * L * 0.98, y: bo.y + L * 0.12 }];
                  const capT = [to, { x: to.x - s * L * 0.98, y: to.y - L * 0.1 }, { x: to.x - up.x * L, y: to.y - up.y * L }];
                  return [capB, capT].map((cap, ci) => (
                    <g key={`cap${ci}`}>
                      <path d={polyPath(cap)} fill={`url(#${id}-metal-gold)`} transform={ci ? undefined : 'translate(0 7)'} opacity={ci ? 1 : 0.55} />
                      <path d={polyPath(cap)} fill={`url(#${id}-metal-gold)`} />
                      <path d={polyPath(cap)} fill="none" stroke="var(--campus-gold-hi)" strokeOpacity=".7" strokeWidth="1.2" />
                    </g>
                  ));
                })()}
              </g>
            );
          })}
          {/* 书脊:封面中缝的圆脊 */}
          <path d={`M ${r2(cx - 20)} ${r2(coverT + sag * 0.62 + 4)} Q ${cx} ${r2(coverT + sag * 0.62 - 6)} ${r2(cx + 20)} ${r2(coverT + sag * 0.62 + 4)} L ${r2(cx + 22)} ${r2(coverB + sag * 0.25 + 10)} Q ${cx} ${r2(coverB + sag * 0.25 + 22)} ${r2(cx - 22)} ${r2(coverB + sag * 0.25 + 10)} Z`} fill={`url(#${id}-metal-accent)`} />
          {/* 书页厚度:外缘与下沿一层层错开的刷金书口 */}
          {[-1, 1].map(s => Array.from({ length: stack }, (_, k) => {
            const j = stack - k;
            return <path key={`st${s}${k}`} d={pagePath(cx, s, pw + j * 2.2, yT + j * 2.6, yB + j * 3.4, sag, inset)} fill={j % 2 ? `url(#${id}-edge)` : PAPER} stroke="var(--campus-gold-lo)" strokeOpacity=".28" strokeWidth=".8" />;
          }))}
          {/* 书页 */}
          {[-1, 1].map(s => {
            const d = pagePath(cx, s, pw, yT, yB, sag, inset);
            const pg = pages[s < 0 ? 0 : 1];
            const tone = s < 0 ? 'var(--theme-accent)' : 'var(--campus-gold)';
            const cornerY = yB - sag * 0.5 - 26;
            return (
              <g key={`p${s}`}>
                <path d={d} fill={`url(#${id}-paper)`} />
                {/* 页眉色带 + 下方细线 */}
                <path d={pg.band} fill={`url(#${id}-band-${s < 0 ? 'l' : 'r'})`} />
                <path d={pg.band} fill={`url(#${id}-gloss)`} opacity=".7" />
                <path d={pg.rule} fill="none" stroke={s < 0 ? 'var(--campus-gold)' : 'var(--theme-accent)'} strokeOpacity=".55" strokeWidth="2" />
                {[0.12, 0.88].map(f => {
                  const x = pg.xa + (pg.xb - pg.xa) * f;
                  const y = curveYAt(pg.P, x) + off + bandH / 2;
                  return <rect key={f} x={r2(x - 4)} y={r2(y - 4)} width="8" height="8" rx="1.5" transform={`rotate(45 ${r2(x)} ${r2(y)})`} fill={s < 0 ? 'var(--campus-gold-hi)' : 'var(--theme-accent)'} fillOpacity=".75" />;
                })}
                {/* 纸面弧度明暗(叠在色带上,色带像印在弯曲的纸上) */}
                <path d={d} fill={`url(#${id}-curl-${s < 0 ? 'l' : 'r'})`} />
                <path d={d} fill="none" stroke="var(--campus-gold-lo)" strokeOpacity=".22" strokeWidth="1.2" />
                {/* 页角花饰 */}
                <path d={`M ${r2(cx + s * (pw - 50))} ${r2(cornerY)} L ${r2(cx + s * (pw - 24))} ${r2(cornerY)} L ${r2(cx + s * (pw - 24))} ${r2(cornerY - 26)}`} fill="none" stroke={tone} strokeOpacity=".55" strokeWidth="2.2" strokeLinecap="round" />
                {/* 页脚页码饰 */}
                <line x1={r2(cx + s * pw * 0.4)} y1={r2(yB - sag * 0.78 - 16)} x2={r2(cx + s * pw * 0.6)} y2={r2(yB - sag * 0.78 - 16)} stroke={tone} strokeOpacity=".3" strokeWidth="1.5" />
                <rect x={r2(cx + s * pw * 0.5 - 5)} y={r2(yB - sag * 0.78 - 21)} width="10" height="10" rx="2" transform={`rotate(45 ${r2(cx + s * pw * 0.5)} ${r2(yB - sag * 0.78 - 16)})`} fill={tone} fillOpacity=".75" />
              </g>
            );
          })}
          {/* 书缝 */}
          <line x1={cx} y1={r2(yT + sag + 2)} x2={cx} y2={r2(yB + sag * 0.4 - 2)} stroke="var(--theme-ink)" strokeOpacity=".2" strokeWidth="2" />
          {/* 金色闪光点缀 */}
          {[[-1, 0.66, 26, 1], [1, 0.66, 26, 1], [-1, 0.9, 52, 0.7], [1, 0.92, 48, 0.6], [-1, 0.42, 4, 0.55], [1, 0.4, 8, 0.5]].map(([s, f, y, k], i) => {
            const x = cx + s * pw * f;
            const R = 15 * k;
            return <path key={`sp${i}`} d={`M ${r2(x)} ${r2(y - R)} Q ${r2(x + R * 0.16)} ${r2(y - R * 0.16)} ${r2(x + R)} ${r2(y)} Q ${r2(x + R * 0.16)} ${r2(y + R * 0.16)} ${r2(x)} ${r2(y + R)} Q ${r2(x - R * 0.16)} ${r2(y + R * 0.16)} ${r2(x - R)} ${r2(y)} Q ${r2(x - R * 0.16)} ${r2(y - R * 0.16)} ${r2(x)} ${r2(y - R)} Z`} fill="var(--campus-gold)" fillOpacity={0.5 + k * 0.4} />;
          })}
          {/* 书签丝带:从书缝下端垂出两条(校色 + 暖金),燕尾 */}
          <path d={ribbonPath(cx - 40, yB - 24, coverB + 50, 26, 7)} fill="var(--theme-ink)" fillOpacity=".16" transform="translate(5 4)" />
          <path d={ribbonPath(cx - 40, yB - 24, coverB + 50, 26, 7)} fill={`url(#${id}-metal-accent)`} />
          <path d={ribbonPath(cx + 12, yB - 20, coverB + 36, 26, -5)} fill="var(--theme-ink)" fillOpacity=".16" transform="translate(5 4)" />
          <path d={ribbonPath(cx + 12, yB - 20, coverB + 36, 26, -5)} fill={`url(#${id}-metal-gold)`} />
        </svg>

        <div className="cp-g6-ob-banner campus-rise" style={{ left: cx, top: 0, ...enterDelay(2) }}>
          <div className="cp-g6-ob-banner-tail is-left" aria-hidden="true" />
          <div className="cp-g6-ob-banner-tail is-right" aria-hidden="true" />
          <div className="cp-g6-ob-banner-face" aria-hidden="true" />
          <div className="cp-g6-ob-banner-gloss" aria-hidden="true" />
          <div className="cp-g6-ob-banner-mark" aria-hidden="true" />
          <div>{p.topic}</div>
          <div className="cp-g6-ob-banner-mark" aria-hidden="true" />
        </div>

        {pages.map((pg, pi) => {
          const right = pg.s > 0;
          const items = right ? rightItems : leftItems;
          return (
            <React.Fragment key={pi}>
              <h3 className={`cp-g6-ob-title${right ? ' is-right' : ''} is-${n} campus-rise`} style={{ left: r2(pg.tx), top: r2(pg.ty), ...enterDelay(3) }}>{right ? p.rightTitle : p.leftTitle}</h3>
              <div className={`cp-g6-ob-list is-${right ? 'right' : 'left'} is-${n}`} style={{ left: r2(pg.x0), top: listTop, width: r2(pg.x1 - pg.x0), height: r2(listBottom - listTop) }}>
                {items.map((item, i) => (
                  <div className="cp-g6-ob-item campus-rise" style={enterDelay(4 + i)} key={i}>
                    <div className="cp-g6-ob-badge">
                      <div className="cp-g6-ob-badge-ring" aria-hidden="true" />
                      <div className="cp-g6-ob-badge-face" aria-hidden="true" />
                      <div>{pad2(i + 1)}</div>
                    </div>
                    <div className="cp-g6-ob-item-text">
                      <div className="cp-g6-ob-item-title">{item?.title}</div>
                      <p className="cp-g6-ob-item-body">{item?.body}</p>
                    </div>
                  </div>
                ))}
              </div>
            </React.Fragment>
          );
        })}

        {notes.length ? noteCols.map((list, ci) => (
          <div className="cp-g6-ob-note-col" key={ci} style={{ ...(ci ? { right: 0 } : { left: 0 }), width: noteW, top: yT, bottom: r2(H - coverB) }}>
            {list.map((note, i) => (
              <div className={`cp-g6-ob-note cp-g6-glass${ci ? ' is-gold' : ''} campus-rise`} style={enterDelay(6 + i)} key={i}>
                <G6Tag text={note?.label} tone={ci ? 'gold' : 'accent'} />
                <p className="cp-g6-ob-note-text">{note?.text}</p>
              </div>
            ))}
          </div>
        )) : null}
      </div>
    </CampusFrame>
  );
}

OpenBook.META = {
  id: 'open-book',
  label: '特色 · 打开的立体书',
  roles: ['context', 'comparison', 'statement'],
  defaults: DEFAULTS,
  copyBudgets: {
    title: 28,
    topic: 8, leftTitle: 6, rightTitle: 6,
    'leftItems[].title': 10, 'leftItems[].body': 36, 'rightItems[].title': 10, 'rightItems[].body': 36,
    'notes[].label': 5, 'notes[].text': 26,
  },
  controls: [
    { ...CHAPTER_CONTROL },
    { key: 'itemCount', type: 'number', label: '每页条目数', default: 3, min: 2, max: 4, countArrays: ['leftItems', 'rightItems'], description: '左页、右页各写几条(两页条数相同)。' },
    { key: 'noteCount', type: 'number', label: '两侧补充卡', default: 2, min: 0, max: 4, countArrays: ['notes'], description: '书两侧的补充卡张数,按顺序左右交替摆放;0 表示不放,书会更宽。' },
  ],
};
