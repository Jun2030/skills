// 中心数字球 + 气泡卡:页面中央一枚带光泽的立体大球写「数字 + 单位词」和 1–2 个小标签,外围一道虚线轨道,
// 左右各 2–3 张胶囊形白色气泡卡(带指向中心的小尖角,内侧一枚小球写编号)沿轨道弧形排开。
// 适合「N 大部分 / N 个模块 / N 项能力」这类总分结构的总览页。
import React from 'react';
import { useThemeStyle, enterDelay } from '../../../shared/style.jsx';
import { safeArray, clamp } from '../../../chart-safety.mjs';
import { CampusFrame, TitleRow, CHAPTER_CONTROL, TITLE_ROW_SPACE, useCampusLayout } from '../kit/chrome.jsx';
import { useFeatureBStyle, useSvgId, ToneDefs, Stop, r2 } from '../kit/feature-b.jsx';

const DEFAULTS = {
  chapterIndex: 1,
  bubbleCount: 6,
  sectionNo: '1.1',
  title: '开题报告的六个部分',
  value: '6',
  unit: '大部分',
  tagA: '硕士开题',
  tagB: '北斗 / INS',
  bubbles: [
    { no: '01', title: '研究背景及意义', desc: '城市复杂环境给导航定位带来的挑战，两套系统的互补性。' },
    { no: '02', title: '研究现状与综述', desc: '深组合架构、高灵敏度跟踪、抗差方法三条研究线索。' },
    { no: '03', title: '研究内容', desc: '灵敏度研究、抗差方法研究、软件平台架构研究。' },
    { no: '04', title: '研究方案', desc: '研究路线、最大似然估计、频率稳定度传递与权函数抗差。' },
    { no: '05', title: '创新点', desc: '权函数分类定权剔除异常值；频率稳定度传递补偿频偏。' },
    { no: '06', title: '研究计划', desc: '2023.01—2024.05，分七个阶段完成平台、论文与答辩。' },
  ],
};

const CSS = `
.cp-orb{position:relative;flex:1;min-height:0;}
.cp-orb-core{position:absolute;transform:translate(-50%,-50%);display:flex;flex-direction:column;align-items:center;text-align:center;color:var(--theme-on-accent);}
.cp-orb-value{font-family:var(--theme-font-serif);font-weight:700;line-height:.9;letter-spacing:-.02em;font-variant-numeric:lining-nums;}
.cp-orb-unit{margin-top:8px;font-family:var(--theme-font-serif);font-weight:700;line-height:1.1;letter-spacing:.12em;white-space:nowrap;}
.cp-orb-tags{display:flex;gap:10px;margin-top:18px;}
.cp-orb-tag{display:flex;align-items:center;height:38px;padding:0 16px;border-radius:999px;background:rgb(255 255 255 / .16);border:1.5px solid rgb(255 255 255 / .55);font-size:18px;font-weight:600;letter-spacing:.06em;white-space:nowrap;}
.cp-orb-card{position:absolute;display:flex;align-items:center;}
.cp-orb-card.is-left{flex-direction:row;}
.cp-orb-card.is-right{flex-direction:row-reverse;}
.cp-orb-text{flex:1;min-width:0;display:flex;flex-direction:column;gap:8px;}
.cp-orb-title{font-family:var(--theme-font-serif);font-weight:700;font-size:29px;line-height:1.2;letter-spacing:.04em;color:var(--theme-accent);}
.cp-orb-desc{font-size:21px;line-height:1.5;color:var(--theme-muted);text-wrap:pretty;}
.cp-orb-no{position:absolute;transform:translate(-50%,-50%);font-family:var(--theme-font-serif);font-weight:700;font-size:30px;line-height:1;color:var(--theme-on-accent);font-variant-numeric:lining-nums;}
.cp-orb.is-tight .cp-orb-title{font-size:27px;}
.cp-orb.is-tight .cp-orb-desc{font-size:21px;line-height:1.45;}
`;

export function OrbBubbles(props) {
  useThemeStyle('campus-orb-bubbles-style', CSS);
  useFeatureBStyle();
  const p = { ...DEFAULTS, ...props };
  const id = useSvgId('cp-orb');
  const { bodyW, bodyH } = useCampusLayout();
  const bubbles = safeArray(p.bubbles).slice(0, clamp(Math.round(p.bubbleCount) || 6, 4, 6));
  const total = bubbles.length;
  const leftN = Math.ceil(total / 2);
  const rightN = total - leftN;
  const W = bodyW;
  const H = bodyH - TITLE_ROW_SPACE;
  const cx = W / 2;
  const cy = H / 2;
  const maxSide = Math.max(leftN, rightN);
  const gapY = 30;
  const BH = Math.round(Math.min(204, (H - (maxSide - 1) * gapY) / maxSide));
  // 中心球与轨道:球半径受高度约束,轨道比球大一圈;气泡卡内侧沿一条比轨道更大的圆弧排开。
  const Rs = Math.round(Math.min(H * 0.25, W * 0.11, 196));
  const Rorbit = Rs + Math.round(Rs * 0.36);
  const Rarc = Rorbit + 58;
  const BW = Math.round(Math.min(600, cx - Rarc + 20));
  const orbR = Math.round(BH * 0.31);
  const tail = 26;
  const cards = bubbles.map((b, i) => {
    const left = i < leftN;
    const count = left ? leftN : rightN;
    const j = left ? i : i - leftN;
    const blockH = count * BH + (count - 1) * gapY;
    const y = (H - blockH) / 2 + j * (BH + gapY);
    const midY = y + BH / 2;
    const dy = midY - cy;
    const reach = Math.sqrt(Math.max(0, Rarc * Rarc - dy * dy));
    const inner = left ? cx - reach : cx + reach;
    const x = left ? inner - BW : inner;
    return { b, left, x: r2(x), y: r2(y), midY: r2(midY), inner: r2(inner) };
  });
  // 胶囊 + 尖角的轮廓;尖角在内侧(朝中心),位于胶囊竖向中点。
  const bubblePath = c => {
    const r = BH / 2;
    const x0 = c.x;
    const x1 = c.x + BW;
    const y0 = c.y;
    const y1 = c.y + BH;
    const m = c.midY;
    if (c.left) {
      return `M ${r2(x0 + r)} ${r2(y0)} L ${r2(x1 - r)} ${r2(y0)} A ${r2(r)} ${r2(r)} 0 0 1 ${r2(x1 - r * 0.07)} ${r2(m - 20)} L ${r2(x1 + tail)} ${r2(m + 4)} L ${r2(x1 - r * 0.12)} ${r2(m + 26)} A ${r2(r)} ${r2(r)} 0 0 1 ${r2(x1 - r)} ${r2(y1)} L ${r2(x0 + r)} ${r2(y1)} A ${r2(r)} ${r2(r)} 0 0 1 ${r2(x0 + r)} ${r2(y0)} Z`;
    }
    return `M ${r2(x0 + r)} ${r2(y0)} L ${r2(x1 - r)} ${r2(y0)} A ${r2(r)} ${r2(r)} 0 0 1 ${r2(x1 - r)} ${r2(y1)} L ${r2(x0 + r)} ${r2(y1)} A ${r2(r)} ${r2(r)} 0 0 1 ${r2(x0 + r * 0.12)} ${r2(m + 26)} L ${r2(x0 - tail)} ${r2(m + 4)} L ${r2(x0 + r * 0.07)} ${r2(m - 20)} A ${r2(r)} ${r2(r)} 0 0 1 ${r2(x0 + r)} ${r2(y0)} Z`;
  };
  const orbCenter = c => ({ x: r2(c.left ? c.x + BW - orbR - 26 : c.x + orbR + 26), y: c.midY });
  const dots = cards.map(c => {
    const dx = (c.left ? c.inner : c.inner) - cx;
    const dy = c.midY - cy;
    const len = Math.max(1, Math.hypot(dx, dy));
    return { x: r2(cx + (dx / len) * Rorbit), y: r2(cy + (dy / len) * Rorbit) };
  });
  const valueSize = Math.round(Rs * 0.82);
  const unitSize = Math.round(Rs * 0.22);
  const sphere = (gid, x, y, r) => (
    <g>
      <circle cx={x} cy={r2(y + r * 0.1)} r={r2(r * 1.02)} fill="var(--theme-accent)" fillOpacity=".16" filter={`url(#${id}-blur)`} />
      <circle cx={x} cy={y} r={r} fill={`url(#${gid}-ball)`} />
      <circle cx={x} cy={y} r={r} fill={`url(#${gid}-rim)`} />
      <ellipse cx={r2(x - r * 0.28)} cy={r2(y - r * 0.5)} rx={r2(r * 0.5)} ry={r2(r * 0.3)} fill={`url(#${gid}-spec)`} />
    </g>
  );
  const sphereDefs = gid => (
    <>
      <radialGradient id={`${gid}-ball`} cx=".36" cy=".3" r=".78">
        <Stop offset="0" color="var(--campus-fb-accent-mist)" />
        <Stop offset=".32" color="var(--campus-accent-hi)" />
        <Stop offset=".7" color="var(--theme-accent)" />
        <Stop offset="1" color="var(--campus-accent-lo)" />
      </radialGradient>
      <radialGradient id={`${gid}-rim`} cx=".5" cy=".5" r=".5">
        <Stop offset=".8" color="var(--theme-surface)" opacity="0" />
        <Stop offset=".96" color="var(--campus-accent-hi)" opacity=".35" />
        <Stop offset="1" color="var(--theme-surface)" opacity=".55" />
      </radialGradient>
      <radialGradient id={`${gid}-spec`} cx=".5" cy=".5" r=".5">
        <Stop offset="0" color="var(--theme-surface)" opacity=".75" />
        <Stop offset="1" color="var(--theme-surface)" opacity="0" />
      </radialGradient>
    </>
  );
  return (
    <CampusFrame chapterIndex={p.chapterIndex}>
      <TitleRow no={p.sectionNo} title={p.title} className="campus-rise" style={enterDelay(0)} />
      <div className={`cp-orb${BH < 180 ? ' is-tight' : ''}`}>
        <svg className="cp-fb-svg campus-fade" style={{ left: 0, top: 0, width: W, height: H, ...enterDelay(1) }} viewBox={`0 0 ${W} ${H}`} aria-hidden="true">
          <ToneDefs id={id} tones={['accent']} />
          <defs>
            {sphereDefs(id)}
            <filter id={`${id}-blur`} x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="16" /></filter>
            <filter id={`${id}-soft`} x="-10%" y="-30%" width="120%" height="160%"><feGaussianBlur stdDeviation="12" /></filter>
            <linearGradient id={`${id}-card`} x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" color="var(--theme-surface)" />
              <Stop offset=".7" color="var(--theme-surface)" />
              <Stop offset="1" color="var(--campus-fb-accent-pale)" opacity=".7" />
            </linearGradient>
            <radialGradient id={`${id}-halo`} cx=".5" cy=".5" r=".5">
              <Stop offset=".55" color="var(--theme-accent)" opacity=".14" />
              <Stop offset="1" color="var(--theme-accent)" opacity="0" />
            </radialGradient>
          </defs>
          <circle cx={r2(cx)} cy={r2(cy)} r={r2(Rorbit + 40)} fill={`url(#${id}-halo)`} />
          <circle cx={r2(cx)} cy={r2(cy)} r={Rorbit} fill="none" stroke="var(--theme-accent)" strokeOpacity=".5" strokeWidth="3" strokeDasharray="0.1 11" strokeLinecap="round" />
          <circle cx={r2(cx)} cy={r2(cy)} r={r2(Rs + 18)} fill="var(--theme-surface)" fillOpacity=".55" stroke="var(--theme-surface)" strokeWidth="2" />
          {cards.map((c, i) => (
            <g key={i}>
              <path d={bubblePath(c)} transform="translate(0 12)" fill="var(--theme-accent)" fillOpacity=".14" filter={`url(#${id}-soft)`} />
              <path d={bubblePath(c)} fill={`url(#${id}-card)`} stroke="var(--theme-surface)" strokeWidth="2" />
              <path d={bubblePath(c)} fill="none" stroke="var(--campus-accent-line)" strokeOpacity=".35" strokeWidth="1" />
              {sphere(id, orbCenter(c).x, orbCenter(c).y, orbR)}
              <circle cx={orbCenter(c).x} cy={orbCenter(c).y} r={r2(orbR + 9)} fill="none" stroke="var(--campus-accent-line)" strokeOpacity=".5" strokeWidth="1.5" />
            </g>
          ))}
          {dots.map((d, i) => (
            <g key={i}>
              <circle cx={d.x} cy={d.y} r="11" fill="var(--theme-surface)" stroke="var(--theme-accent)" strokeWidth="3.5" />
              <circle cx={d.x} cy={d.y} r="4" fill="var(--campus-spark)" />
            </g>
          ))}
          {sphere(id, r2(cx), r2(cy), Rs)}
        </svg>

        <div className="cp-orb-core campus-fade" style={{ left: cx, top: cy + Rs * 0.02, width: Rs * 1.7, ...enterDelay(2) }}>
          <div className="cp-orb-value" style={{ fontSize: valueSize }}>{p.value}</div>
          <div className="cp-orb-unit" style={{ fontSize: unitSize }}>{p.unit}</div>
          {(p.tagA || p.tagB) ? (
            <div className="cp-orb-tags">
              {p.tagA ? <div className="cp-orb-tag">{p.tagA}</div> : null}
              {p.tagB ? <div className="cp-orb-tag">{p.tagB}</div> : null}
            </div>
          ) : null}
        </div>

        {cards.map((c, i) => {
          const oc = orbCenter(c);
          const pad = Math.round(BH * 0.3);
          const orbSpace = orbR * 2 + 34;
          return (
            <React.Fragment key={i}>
              <div className={`cp-orb-card is-${c.left ? 'left' : 'right'} campus-rise`} style={{ left: c.left ? c.x + pad : c.x + orbSpace + 22, top: c.y, width: BW - pad - orbSpace - 22, height: BH, ...enterDelay(3 + i) }}>
                <div className="cp-orb-text">
                  <h3 className="cp-orb-title">{c.b?.title}</h3>
                  <p className="cp-orb-desc">{c.b?.desc}</p>
                </div>
              </div>
              <div className="cp-orb-no campus-fade" style={{ left: oc.x, top: oc.y, ...enterDelay(3 + i) }}>{c.b?.no}</div>
            </React.Fragment>
          );
        })}
      </div>
    </CampusFrame>
  );
}

OrbBubbles.META = {
  id: 'orb-bubbles',
  label: '特色 · 中心数字球配气泡卡',
  roles: ['breakdown', 'metrics', 'statement'],
  defaults: DEFAULTS,
  copyBudgets: { value: 3, unit: 4, tagA: 6, tagB: 6, 'bubbles[].title': 8, 'bubbles[].desc': 28 },
  controls: [
    { ...CHAPTER_CONTROL },
    { key: 'bubbleCount', type: 'number', label: '气泡卡数量', default: 6, min: 4, max: 6, description: '围绕中心球的气泡卡数量,左右两侧分摊(左侧多一张)。' },
  ],
};
