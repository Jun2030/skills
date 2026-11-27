// 双色立体环对照:页面中央一枚分成两段的立体厚环(校色 / 暖金,段名写在环上),环的上下各一道双向弧形箭头,
// 左右两块玻璃面板各列 2–4 条要点(斜切标签 + 说明)。适合「优势 / 不足」「问题 / 对策」「现状 / 目标」这类成对的对照。
// 环、箭头、面板底都是不含文字的图形;段名、标题、要点都是叠在上面的 HTML 文本。
import React from 'react';
import { useThemeStyle, enterDelay } from '../../../shared/style.jsx';
import { safeArray, clamp } from '../../../chart-safety.mjs';
import { CampusFrame, TitleRow, CHAPTER_CONTROL, TITLE_ROW_SPACE, useCampusLayout } from '../kit/chrome.jsx';
import { useFeatureBStyle, useSvgId, ToneDefs, Stop, SlantTag, GlassPill, sectorPath, arcPath, arcHead, pt, r2 } from '../kit/feature-b.jsx';

const DEFAULTS = {
  chapterIndex: 1,
  itemCount: 3,
  emphasis: 'lead',
  sectionNo: '1.3',
  title: '深组合导航的优势与挑战',
  centerLabel: '深组合',
  leftLabel: '优势',
  rightLabel: '挑战',
  leftTitle: '三项性能优势',
  rightTitle: '有待攻克的挑战',
  topNote: '发挥优势',
  bottomNote: '攻克挑战',
  leftItems: [
    { title: '抗干扰性', desc: '标量深组合可压缩环路带宽；矢量深组合把惯导与接收机耦合，抗干扰性能更强。' },
    { title: '高动态性', desc: '惯性信息辅助载波跟踪，减小动态应力误差，提高高动态条件下的适应能力。' },
    { title: '高精度', desc: '惯性辅助减小环路等效带宽，提高观测量的估计精度。' },
    { title: '全自主', desc: '继承惯导隐蔽性好、短时精度高、全自主工作的特点。' },
  ],
  rightItems: [
    { title: '导航滤波器', desc: '滤波器设计要同时处理计算量、非线性与最优收敛三方面的问题。' },
    { title: '观测异常', desc: '误差累积或信号中断会使某通道观测量异常，需要抗差处理。' },
    { title: '高灵敏度', desc: '相干积分时间受比特跳变和误差累积限制，弱信号难以稳定跟踪。' },
    { title: '兼顾高动态', desc: '提高灵敏度的同时，还要兼顾高动态条件下的跟踪性能。' },
  ],
};

const CSS = `
.cp-duo{position:relative;flex:1;min-height:0;}
.cp-duo-panel{position:absolute;top:0;bottom:0;border-radius:28px;}
.cp-duo-panel.is-left{left:0;background:linear-gradient(100deg,rgb(var(--theme-accent-rgb) / .12) 0%,rgb(var(--theme-accent-rgb) / .03) 70%,rgb(255 255 255 / .4) 100%);border:1.5px solid var(--campus-fb-glass-edge);box-shadow:0 18px 40px rgb(var(--theme-accent-rgb) / .08);}
.cp-duo-panel.is-right{right:0;background:linear-gradient(260deg,rgb(var(--campus-gold-rgb) / .2) 0%,rgb(var(--campus-gold-rgb) / .05) 70%,rgb(255 255 255 / .4) 100%);border:1.5px solid var(--campus-fb-glass-edge);box-shadow:0 18px 40px rgb(var(--campus-gold-rgb) / .12);}
.cp-duo-ghost{position:absolute;top:10px;font-family:var(--theme-font-serif);font-weight:700;font-size:150px;line-height:1;letter-spacing:-.02em;color:rgb(var(--theme-accent-rgb) / .07);font-variant-numeric:lining-nums;}
.cp-duo-ghost.is-right{color:rgb(var(--campus-gold-rgb) / .16);}
.cp-duo-col{position:absolute;top:0;bottom:0;display:flex;flex-direction:column;padding:34px 0 30px;}
.cp-duo-col.is-right{align-items:flex-end;text-align:right;}
.cp-duo-head{display:flex;align-items:center;gap:14px;margin-bottom:6px;}
.cp-duo-col.is-right .cp-duo-head{flex-direction:row-reverse;}
.cp-duo-head-bar{flex:none;width:8px;height:38px;border-radius:4px;background:var(--campus-fill-bar);}
.cp-duo-col.is-right .cp-duo-head-bar{background:var(--campus-gold-fill);}
.cp-duo-title{font-family:var(--theme-font-serif);font-weight:700;font-size:38px;line-height:1.2;letter-spacing:.06em;color:var(--theme-accent);}
.cp-duo-col.is-right .cp-duo-title{color:var(--campus-gold-ink);}
.cp-duo-list{position:relative;flex:1;min-height:0;display:flex;flex-direction:column;justify-content:space-around;}
.cp-duo-item{position:relative;display:flex;flex-direction:column;align-items:flex-start;gap:10px;}
.cp-duo-col.is-right .cp-duo-item{align-items:flex-end;}
.cp-duo-desc{font-size:22px;line-height:1.55;color:var(--theme-muted);text-wrap:pretty;}
.cp-duo-col.is-4 .cp-duo-desc{font-size:21px;line-height:1.5;}
.cp-duo-col.is-4 .cp-duo-item{gap:8px;}
.cp-duo-rail{position:absolute;top:8%;bottom:8%;left:-36px;width:0;border-left:2px dashed var(--campus-accent-line);}
.cp-duo-rail.is-right{left:auto;right:-38px;border-left-color:var(--campus-gold-line);}
.cp-duo-dot{position:absolute;width:26px;height:26px;margin:-13px 0 0 -13px;border-radius:50%;background:var(--theme-surface);border:3px solid var(--theme-accent);box-shadow:0 0 0 6px rgb(var(--theme-accent-rgb) / .1);}
.cp-duo-dot.is-right{border-color:var(--campus-gold);box-shadow:0 0 0 6px rgb(var(--campus-gold-rgb) / .16);}
/* 圆点的渐变芯用真实元素画(不放伪元素):伪元素上的渐变块导出时被当装饰、透明度压到 8%,PPTX 里芯几乎看不见 */
.cp-duo-dot-core{position:absolute;left:5px;top:5px;width:10px;height:10px;border-radius:50%;background:var(--campus-fill);}
.cp-duo-dot.is-right .cp-duo-dot-core{background:var(--campus-gold-fill);}
.cp-duo-label{position:absolute;transform:translate(-50%,-50%);width:1.15em;font-family:var(--theme-font-serif);font-weight:700;font-size:50px;line-height:1.12;letter-spacing:0;text-align:center;color:var(--theme-on-accent);word-break:break-all;}
.cp-duo-label.is-right{color:var(--campus-gold-deep);}
.cp-duo-center{position:absolute;transform:translate(-50%,-50%);font-family:var(--theme-font-serif);font-weight:700;font-size:30px;line-height:1.2;letter-spacing:.08em;color:var(--theme-accent);text-align:center;white-space:nowrap;}
.cp-duo-note{position:absolute;transform:translate(-50%,-50%);}
`;

// 面板文字列与圆环之间的留白、圆环外侧双向弧线与环的间距。
const RING_GAP = 34;
const ARC_GAP = 40;

export function DuoRing(props) {
  useThemeStyle('campus-duo-ring-style', CSS);
  useFeatureBStyle();
  const p = { ...DEFAULTS, ...props };
  const id = useSvgId('cp-duo');
  const { bodyW, bodyH } = useCampusLayout();
  const n = clamp(Math.round(p.itemCount) || 3, 2, 4);
  const leftItems = safeArray(p.leftItems).slice(0, n);
  const rightItems = safeArray(p.rightItems).slice(0, n);
  const W = bodyW;
  const H = bodyH - TITLE_ROW_SPACE;
  // 圆环外半径:受高度(上下要留出双向弧线和标签)与宽度(两侧要留出文字列)共同约束。
  const ro = Math.round(Math.min((H - 190) / 2, W * 0.15, 290));
  const ri = Math.round(ro * 0.5);
  const depth = Math.round(ro * 0.085);
  const cx = W / 2;
  const cy = H / 2 + 6;
  const leftShare = p.emphasis === 'even' ? 0.5 : 0.64;
  const gap = 2.4;
  const leftSpan = 360 * leftShare;
  const rightSpan = 360 - leftSpan;
  const segs = [
    { tone: 'accent', a0: 270 - leftSpan / 2 + gap, a1: 270 + leftSpan / 2 - gap, mid: 270, push: 4 },
    { tone: 'gold', a0: 90 - rightSpan / 2 + gap, a1: 90 + rightSpan / 2 - gap, mid: 90, push: 16 },
  ].map(s => {
    const off = pt(0, 0, s.push, s.mid);
    return { ...s, ox: off.x, oy: off.y };
  });
  const steps = 12;
  const ra = ro + ARC_GAP;
  // 面板:从页面两侧伸到圆环下方;文字列止于圆环外侧。
  const panelW = Math.round(W / 2 - ro * 0.42);
  const colInset = 66;
  const colW = Math.round(W / 2 - ro - RING_GAP - colInset - 20);
  const lbl = (s, r) => pt(cx + s.ox, cy + s.oy, r, s.mid);
  const topPill = pt(cx, cy, ra + 2, 0);
  const botPill = pt(cx, cy, ra + 2, 180);
  return (
    <CampusFrame chapterIndex={p.chapterIndex}>
      <TitleRow no={p.sectionNo} title={p.title} className="campus-rise" style={enterDelay(0)} />
      <div className="cp-duo">
        <div className="cp-duo-panel is-left campus-fade" style={{ width: panelW, ...enterDelay(1) }} aria-hidden="true" />
        <div className="cp-duo-panel is-right campus-fade" style={{ width: panelW, ...enterDelay(1) }} aria-hidden="true" />
        <div className="cp-duo-ghost campus-fade" style={{ left: panelW - 300, ...enterDelay(1) }} aria-hidden="true">01</div>
        <div className="cp-duo-ghost is-right campus-fade" style={{ right: panelW - 300, ...enterDelay(1) }} aria-hidden="true">02</div>

        <svg className="cp-duo-svg cp-fb-svg campus-fade" style={{ left: 0, top: 0, width: W, height: H, ...enterDelay(2) }} viewBox={`0 0 ${W} ${H}`} aria-hidden="true">
          <ToneDefs id={id} tones={['accent', 'gold']} />
          <defs>
            <radialGradient id={`${id}-tube`} gradientUnits="userSpaceOnUse" cx={r2(cx)} cy={r2(cy)} r={ro}>
              <Stop offset={r2(ri / ro)} color="var(--theme-ink)" opacity=".32" />
              <Stop offset={r2((ri / ro) + 0.12)} color="var(--theme-ink)" opacity=".04" />
              <Stop offset={r2((ri / ro + 1) / 2 + 0.04)} color="var(--theme-surface)" opacity=".26" />
              <Stop offset=".9" color="var(--theme-ink)" opacity=".04" />
              <Stop offset="1" color="var(--theme-ink)" opacity=".26" />
            </radialGradient>
            <radialGradient id={`${id}-hole`} gradientUnits="userSpaceOnUse" cx={r2(cx)} cy={r2(cy)} r={ri}>
              <Stop offset="0" color="var(--theme-surface)" opacity="1" />
              <Stop offset=".72" color="var(--theme-surface)" opacity=".92" />
              <Stop offset="1" color="var(--campus-fb-accent-pale)" opacity=".9" />
            </radialGradient>
          </defs>
          <ellipse cx={r2(cx + depth)} cy={r2(cy + ro + depth + 10)} rx={r2(ro * 0.95)} ry={r2(ro * 0.13)} fill={`url(#${id}-floor)`} />
          <circle cx={r2(cx)} cy={r2(cy)} r={r2(ri - 6)} fill={`url(#${id}-hole)`} />
          {segs.map((s, si) => (
            <g key={si} transform={`translate(${s.ox} ${s.oy})`}>
              {Array.from({ length: steps }, (_, k) => {
                const t = (steps - k) / steps;
                return <path key={k} d={sectorPath(cx + depth * 0.45 * t, cy + depth * t, ro, ri, s.a0, s.a1)} fill={`url(#${id}-${s.tone}-side)`} />;
              })}
              <path d={sectorPath(cx, cy, ro, ri, s.a0, s.a1)} fill={`url(#${id}-${s.tone}-face)`} />
              <path d={sectorPath(cx, cy, ro, ri, s.a0, s.a1)} fill={`url(#${id}-tube)`} />
              <path d={sectorPath(cx, cy, ro, ri, s.a0, s.a1)} fill={`url(#${id}-gloss)`} />
              <path d={arcPath(cx, cy, ro - 7, s.a0 + 4, s.a1 - 4)} fill="none" stroke={`url(#${id}-${s.tone}-edge)`} strokeWidth="4" strokeLinecap="round" />
              <path d={arcPath(cx, cy, ri + 5, s.a0 + 6, s.a1 - 6)} fill="none" stroke="var(--theme-surface)" strokeOpacity=".28" strokeWidth="2" strokeLinecap="round" />
            </g>
          ))}
          <circle cx={r2(cx)} cy={r2(cy)} r={r2(ri * 0.62)} fill="none" stroke="var(--campus-accent-line)" strokeWidth="1.5" strokeDasharray="3 7" strokeLinecap="round" />
          <path d={arcPath(cx, cy, ra, -34, 34)} fill="none" stroke="var(--theme-accent)" strokeOpacity=".55" strokeWidth="4" strokeLinecap="round" />
          <polygon points={arcHead(cx, cy, ra, 34, 1, 14)} fill="var(--theme-accent)" fillOpacity=".75" />
          <polygon points={arcHead(cx, cy, ra, -34, -1, 14)} fill="var(--theme-accent)" fillOpacity=".75" />
          <path d={arcPath(cx, cy, ra, 146, 214)} fill="none" stroke="var(--campus-gold)" strokeOpacity=".8" strokeWidth="4" strokeLinecap="round" />
          <polygon points={arcHead(cx, cy, ra, 214, 1, 14)} fill="var(--campus-gold)" />
          <polygon points={arcHead(cx, cy, ra, 146, -1, 14)} fill="var(--campus-gold)" />
        </svg>

        <div className="cp-duo-label campus-fade" style={{ left: lbl(segs[0], (ro + ri) / 2).x, top: lbl(segs[0], (ro + ri) / 2).y, ...enterDelay(3) }}>{p.leftLabel}</div>
        <div className="cp-duo-label is-right campus-fade" style={{ left: lbl(segs[1], (ro + ri) / 2).x, top: lbl(segs[1], (ro + ri) / 2).y, ...enterDelay(3) }}>{p.rightLabel}</div>
        <div className="cp-duo-center campus-fade" style={{ left: cx, top: cy, ...enterDelay(3) }}>{p.centerLabel}</div>
        <div className="cp-duo-note campus-fade" style={{ left: topPill.x, top: topPill.y - 34, ...enterDelay(4) }}><GlassPill text={p.topNote} /></div>
        <div className="cp-duo-note campus-fade" style={{ left: botPill.x, top: botPill.y + 34, ...enterDelay(4) }}><GlassPill text={p.bottomNote} tone="gold" /></div>

        {[{ side: 'left', items: leftItems, title: p.leftTitle }, { side: 'right', items: rightItems, title: p.rightTitle }].map(col => {
          const right = col.side === 'right';
          return (
            <div className={`cp-duo-col is-${col.side} is-${n}`} key={col.side} style={right ? { right: colInset, width: colW } : { left: colInset, width: colW }}>
              <div className="cp-duo-head campus-rise" style={enterDelay(3)}>
                <div className="cp-duo-head-bar" aria-hidden="true" />
                <h3 className="cp-duo-title">{col.title}</h3>
              </div>
              <div className="cp-duo-list">
                <div className={`cp-duo-rail${right ? ' is-right' : ''}`} aria-hidden="true" />
                {col.items.map((item, i) => (
                  <div className="cp-duo-item campus-rise" style={enterDelay(4 + i)} key={i}>
                    <div className={`cp-duo-dot${right ? ' is-right' : ''}`} aria-hidden="true" style={right ? { left: 'auto', right: -49, top: 25 } : { left: -35, top: 25 }}><div className="cp-duo-dot-core" /></div>
                    <SlantTag text={item?.title} tone={right ? 'gold' : 'accent'} />
                    <p className="cp-duo-desc">{item?.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </CampusFrame>
  );
}

DuoRing.META = {
  id: 'duo-ring',
  label: '特色 · 双色立体环对照',
  roles: ['comparison', 'observation', 'risks'],
  defaults: DEFAULTS,
  copyBudgets: {
    leftLabel: 3, rightLabel: 3, centerLabel: 4, leftTitle: 8, rightTitle: 8, topNote: 6, bottomNote: 6,
    'leftItems[].title': 6, 'leftItems[].desc': 36, 'rightItems[].title': 6, 'rightItems[].desc': 36,
  },
  controls: [
    { ...CHAPTER_CONTROL },
    { key: 'itemCount', type: 'number', label: '每侧要点数', default: 3, min: 2, max: 4, countArrays: ['leftItems', 'rightItems'], description: '左右两侧各列几条要点(两侧条数相同)。' },
    { key: 'emphasis', type: 'radio', label: '环的分段', default: 'lead', options: [{ value: 'lead', label: '左段为主' }, { value: 'even', label: '两段均分' }], description: '中央立体环两段的比例:左段占约三分之二,或两段各占一半。' },
  ],
};
