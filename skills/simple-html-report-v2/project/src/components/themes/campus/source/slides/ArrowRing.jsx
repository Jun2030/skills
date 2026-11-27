// 分段箭头环:中央白色圆盘写主题,外围 3–4 段厚实的立体弧形箭头首尾相接成环(校色 / 暖金交替,段名写在弧段上),
// 整个环罩在一枚玻璃圆球里;两侧各一块指向圆环的大箭头色块(侧栏主题)和 2–4 条说明,说明经虚线引到环外的六边形编号。
// 适合「一个核心 + 循环往复的几个环节 + 两类支撑」:持续集成流程、PDCA、运营闭环。
// 段名是放在弧段上的水平 HTML 文本(不沿弧排布),导出后仍可编辑。
import React from 'react';
import { useThemeStyle, enterDelay } from '../../../shared/style.jsx';
import { safeArray, clamp } from '../../../chart-safety.mjs';
import { CampusFrame, TitleRow, CHAPTER_CONTROL, TITLE_ROW_SPACE, useCampusLayout } from '../kit/chrome.jsx';
import { useFeatureBStyle, useSvgId, ToneDefs, Stop, pt, r2, arcPath, hexPoints, roundedPolyPath } from '../kit/feature-b.jsx';

const DEFAULTS = {
  chapterIndex: 2,
  segmentCount: 3,
  sideCount: 2,
  sectionNo: '2.2',
  title: '持续集成与容器化运维',
  centerTitle: '持续集成',
  centerNote: 'CI · DOCKER',
  segments: [
    { name: '项目打包' },
    { name: '发布测试' },
    { name: '监控告警' },
    { name: '容器管理' },
  ],
  leftTitle: 'Jenkins 集成',
  leftNote: 'CONTINUOUS INTEGRATION',
  rightTitle: 'Docker 容器',
  rightNote: 'CONTAINERIZATION',
  leftItems: [
    { title: '三模块打包', desc: 'parent、service、webapp 三个模块分别打包。' },
    { title: '自动发布', desc: '打包完成后发送到对应的 3 个容器并重启程序。' },
    { title: '发布监控', desc: '持续监控每一次发布的运行情况。' },
    { title: '邮件告警', desc: '构建或发布出错时自动发送告警邮件。' },
  ],
  rightItems: [
    { title: '秒级启动', desc: '容器启动为秒级，虚拟机一般为分钟级。' },
    { title: '轻量占用', desc: '硬盘占用一般为 MB 级，性能接近原生。' },
    { title: '单机高密度', desc: '单机可支持上千个容器，虚拟机一般几十个。' },
    { title: '统一管理', desc: '7 个容器由管理平台统一管理，状态均为 Up。' },
  ],
};

const TONES = ['accent', 'gold', 'mist', 'gold'];

const CSS = `
.cp-ar{position:relative;flex:1;min-height:0;}
.cp-ar-seg{position:absolute;transform:translate(-50%,-50%);font-family:var(--theme-font-serif);font-weight:700;font-size:30px;line-height:1.18;text-wrap:balance;letter-spacing:.06em;color:var(--theme-on-accent);text-align:center;}
.cp-ar-seg.is-gold{color:var(--campus-gold-deep);}
.cp-ar-center{position:absolute;transform:translate(-50%,-50%);display:flex;flex-direction:column;align-items:center;gap:10px;text-align:center;}
.cp-ar-center-spark{width:30px;height:4px;border-radius:2px;background:var(--campus-spark);}
.cp-ar-center-title{font-family:var(--theme-font-serif);font-weight:700;font-size:40px;line-height:1.15;letter-spacing:.08em;color:var(--theme-ink);white-space:nowrap;}
.cp-ar-center-note{font-size:18px;font-weight:600;letter-spacing:.16em;color:var(--theme-faint);white-space:nowrap;}
.cp-ar-block{position:absolute;isolation:isolate;display:flex;flex-direction:column;justify-content:center;gap:6px;color:var(--theme-on-accent);}
.cp-ar-block-shape{position:absolute;inset:0;z-index:-1;background:var(--campus-fill-deep);box-shadow:var(--campus-shadow-lift);}
.cp-ar-block.is-left .cp-ar-block-shape{border-radius:18px 0 0 18px;clip-path:polygon(0 0,calc(100% - 46px) 0,100% 50%,calc(100% - 46px) 100%,0 100%);}
.cp-ar-block.is-right .cp-ar-block-shape{background:var(--campus-gold-fill);border-radius:0 18px 18px 0;clip-path:polygon(46px 0,100% 0,100% 100%,46px 100%,0 50%);}
.cp-ar-block.is-left{padding:0 70px 0 30px;}
.cp-ar-block.is-right{padding:0 30px 0 70px;align-items:flex-end;text-align:right;color:var(--campus-gold-deep);}
.cp-ar-block-gloss{position:absolute;left:0;right:0;bottom:0;height:46%;z-index:-1;background:linear-gradient(0deg,rgb(255 255 255 / .22) 0%,rgb(255 255 255 / 0) 100%);}
.cp-ar-block.is-left .cp-ar-block-gloss{border-radius:18px 0 0 0;clip-path:polygon(0 0,calc(100% - 46px) 0,calc(100% - 4px) 100%,0 100%);}
.cp-ar-block.is-right .cp-ar-block-gloss{border-radius:0 18px 0 0;clip-path:polygon(46px 0,100% 0,100% 100%,4px 100%);}
.cp-ar-block-title{font-family:var(--theme-font-serif);font-weight:700;font-size:34px;line-height:1.15;letter-spacing:.06em;white-space:nowrap;}
.cp-ar-block-note{font-size:18px;font-weight:600;letter-spacing:.14em;opacity:.82;white-space:nowrap;}
.cp-ar-ghost{position:absolute;width:40px;height:84px;margin-top:-42px;background:rgb(var(--theme-accent-rgb) / .2);clip-path:polygon(0 0,45% 0,100% 50%,45% 100%,0 100%,55% 50%);}
.cp-ar-ghost.is-right{background:rgb(var(--campus-gold-rgb) / .35);clip-path:polygon(55% 0,100% 0,45% 50%,100% 100%,55% 100%,0 50%);}
.cp-ar-item{position:absolute;display:flex;flex-direction:column;align-items:flex-start;gap:10px;transform:translateY(-21px);}
.cp-ar-item.is-right{align-items:flex-end;text-align:right;}
.cp-ar-item-title{display:flex;align-items:center;height:42px;padding:0 18px;border-radius:8px;background:var(--campus-fill);color:var(--theme-on-accent);font-weight:700;font-size:22px;letter-spacing:.06em;white-space:nowrap;box-shadow:0 6px 14px rgb(var(--theme-accent-rgb) / .22);}
.cp-ar-item.is-right .cp-ar-item-title{background:var(--campus-gold-fill);color:var(--campus-gold-deep);box-shadow:0 6px 14px rgb(var(--campus-gold-rgb) / .28);}
.cp-ar-item-desc{font-size:21px;line-height:1.5;color:var(--theme-muted);text-wrap:pretty;}
.cp-ar-hex-no{position:absolute;transform:translate(-50%,-50%);font-family:var(--theme-font-serif);font-weight:700;font-size:24px;line-height:1;color:var(--theme-on-accent);font-variant-numeric:lining-nums;}
.cp-ar-hex-no.is-gold{color:var(--campus-gold-deep);}
`;

export function ArrowRing(props) {
  useThemeStyle('campus-arrow-ring-style', CSS);
  useFeatureBStyle();
  const p = { ...DEFAULTS, ...props };
  const id = useSvgId('cp-ar');
  const { bodyW, bodyH } = useCampusLayout();
  const segments = safeArray(p.segments).slice(0, clamp(Math.round(p.segmentCount) || 3, 3, 4));
  const n = segments.length === 4 ? 4 : 3;
  const k = clamp(Math.round(p.sideCount) || 2, 2, 4);
  const leftItems = safeArray(p.leftItems).slice(0, k);
  const rightItems = safeArray(p.rightItems).slice(0, k);
  const W = bodyW;
  const H = bodyH - TITLE_ROW_SPACE;
  const cx = W / 2;
  const cy = H / 2;
  // 玻璃球半径:高度和宽度(两侧要留出说明列)共同约束;箭头环和中心圆盘按它的比例取。
  const R = Math.round(Math.min(H / 2 - 8, W * 0.235));
  const ro = R * 0.84;
  const ri = R * 0.53;
  const rm = (ro + ri) / 2;
  const flare = R * 0.055;
  const headDeg = n === 4 ? 13 : 15;
  const gap = 2.5;
  const depth = Math.round(R * 0.045);
  const span = 360 / n;
  const start = n === 4 ? 270 : 240;
  const segs = segments.map((seg, i) => {
    const a0 = start + i * span + gap;
    const a1 = start + (i + 1) * span - gap - headDeg;
    const P = (r, a) => pt(cx, cy, r, a);
    const large = a1 - a0 > 180 ? 1 : 0;
    const o0 = P(ro, a0); const o1 = P(ro, a1); const f1 = P(ro + flare, a1); const tip = P(rm, a1 + headDeg);
    const g1 = P(ri - flare, a1); const i1 = P(ri, a1); const i0 = P(ri, a0); const notch = P(rm, a0 + headDeg);
    const d = `M ${o0.x} ${o0.y} A ${r2(ro)} ${r2(ro)} 0 ${large} 1 ${o1.x} ${o1.y} L ${f1.x} ${f1.y} L ${tip.x} ${tip.y} L ${g1.x} ${g1.y} L ${i1.x} ${i1.y} A ${r2(ri)} ${r2(ri)} 0 ${large} 0 ${i0.x} ${i0.y} L ${notch.x} ${notch.y} Z`;
    const mid = (a0 + a1 + headDeg) / 2;
    // 段名是水平文字:弧段越接近水平(正上 / 正下)可用宽度越大,斜向和竖向时收窄、允许折成两行。
    const flat = Math.abs(Math.cos((mid * Math.PI) / 180));
    return { d, tone: TONES[i], label: P(rm, mid), name: seg?.name, a0, a1, width: Math.round((ro - ri) * (0.92 + 0.95 * flat)) };
  });
  // 两侧说明:上下两组(中间留给大箭头色块),纵坐标均分;六边形编号落在玻璃球外侧同一高度。
  const blockH = 118;
  const topN = Math.ceil(k / 2);
  const botN = k - topN;
  // 锚点是说明标题条的中线:条目从锚点上方 21px 开始,向下约占 ITEM_H,组内首尾贴住可用区间的两端。
  const ITEM_H = 118;
  const band = (count, y0, y1) => {
    const a = y0 + 27;
    const b = y1 - (ITEM_H - 21) - 6;
    if (count <= 1) return [r2((a + b) / 2)];
    return Array.from({ length: count }, (_, i) => r2(a + (i * (b - a)) / (count - 1)));
  };
  const ys = [...band(topN, 0, cy - blockH / 2 - 14), ...band(botN, cy + blockH / 2 + 14, H)];
  const hexR = 34;
  const RO = R + hexR + 14;
  const sideX = dy => r2(Math.sqrt(Math.max(0, RO * RO - dy * dy)));
  const colW = Math.round(cx - R - 2 * hexR - 70);
  const blockW = Math.round(cx - R - 26);
  const items = [
    ...leftItems.map((item, i) => ({ item, side: 'left', y: ys[i], hx: r2(cx - sideX(ys[i] - cy)) })),
    ...rightItems.map((item, i) => ({ item, side: 'right', y: ys[i], hx: r2(cx + sideX(ys[i] - cy)) })),
  ];
  const hl = pt(cx, cy, R * 0.93, 0);
  return (
    <CampusFrame chapterIndex={p.chapterIndex}>
      <TitleRow no={p.sectionNo} title={p.title} className="campus-rise" style={enterDelay(0)} />
      <div className="cp-ar">
        <svg className="cp-fb-svg campus-fade" style={{ left: 0, top: 0, width: W, height: H, ...enterDelay(1) }} viewBox={`0 0 ${W} ${H}`} aria-hidden="true">
          <ToneDefs id={id} tones={['accent', 'gold', 'mist']} />
          <defs>
            <radialGradient id={`${id}-sphere`} gradientUnits="userSpaceOnUse" cx={r2(cx)} cy={r2(cy)} r={R}>
              <Stop offset="0" color="var(--theme-surface)" opacity=".1" />
              <Stop offset=".72" color="var(--campus-fb-accent-pale)" opacity=".28" />
              <Stop offset=".93" color="var(--campus-fb-accent-mist)" opacity=".36" />
              <Stop offset="1" color="var(--theme-surface)" opacity=".9" />
            </radialGradient>
            <radialGradient id={`${id}-disc`} gradientUnits="userSpaceOnUse" cx={r2(cx - R * 0.12)} cy={r2(cy - R * 0.14)} r={r2(R * 0.56)}>
              <Stop offset="0" color="var(--theme-surface)" />
              <Stop offset=".7" color="var(--theme-surface)" />
              <Stop offset="1" color="var(--campus-fb-accent-pale)" />
            </radialGradient>
            <linearGradient id={`${id}-rim`} x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" color="var(--theme-surface)" opacity="1" />
              <Stop offset=".5" color="var(--theme-surface)" opacity=".35" />
              <Stop offset="1" color="var(--campus-fb-accent-mist)" opacity=".6" />
            </linearGradient>
          </defs>
          <ellipse cx={r2(cx)} cy={r2(cy + R * 0.97)} rx={r2(R * 0.9)} ry={r2(R * 0.1)} fill={`url(#${id}-floor)`} />
          <circle cx={r2(cx)} cy={r2(cy)} r={R} fill={`url(#${id}-sphere)`} />
          <circle cx={r2(cx)} cy={r2(cy)} r={R - 2} fill="none" stroke={`url(#${id}-rim)`} strokeWidth="4" />
          <circle cx={r2(cx)} cy={r2(cy)} r={r2(R * 0.92)} fill="none" stroke="var(--theme-surface)" strokeOpacity=".7" strokeWidth="1.5" />
          <path d={arcPath(cx, cy, R * 0.955, 292, 338)} fill="none" stroke="var(--theme-surface)" strokeOpacity=".95" strokeWidth="7" strokeLinecap="round" />
          <circle cx={hl.x} cy={hl.y} r="5" fill="var(--theme-surface)" />
          {segs.map((s, i) => (
            <g key={i}>
              {Array.from({ length: 8 }, (_, j) => (
                <path key={j} d={s.d} transform={`translate(${r2(depth * 0.35 * (8 - j) / 8)} ${r2(depth * (8 - j) / 8)})`} fill={`url(#${id}-${s.tone}-side)`} />
              ))}
              <path d={s.d} fill={`url(#${id}-${s.tone}-face)`} />
              <path d={s.d} fill={`url(#${id}-gloss)`} />
              <path d={s.d} fill="none" stroke={`url(#${id}-${s.tone}-edge)`} strokeWidth="2.5" strokeLinejoin="round" />
            </g>
          ))}
          <circle cx={r2(cx)} cy={r2(cy + 6)} r={r2(R * 0.45)} fill="var(--theme-accent)" fillOpacity=".12" />
          <circle cx={r2(cx)} cy={r2(cy)} r={r2(R * 0.45)} fill={`url(#${id}-disc)`} stroke="var(--theme-surface)" strokeWidth="4" />
          <circle cx={r2(cx)} cy={r2(cy)} r={r2(R * 0.38)} fill="none" stroke="var(--campus-accent-line)" strokeWidth="1.5" strokeDasharray="3 7" strokeLinecap="round" />
          {items.map((it, i) => {
            const left = it.side === 'left';
            const x0 = left ? colW + 18 : W - colW - 18;
            const x1 = left ? it.hx - hexR - 8 : it.hx + hexR + 8;
            const tone = left ? 'accent' : 'gold';
            return (
              <g key={i}>
                <line x1={r2(x0)} y1={it.y} x2={r2(x1)} y2={it.y} stroke={left ? 'var(--campus-accent-line)' : 'var(--campus-gold-line)'} strokeWidth="2.5" strokeDasharray="2 8" strokeLinecap="round" />
                <circle cx={r2(x0)} cy={it.y} r="5" fill={left ? 'var(--theme-accent)' : 'var(--campus-gold)'} />
                <path d={roundedPolyPath(hexPoints(it.hx + 2, it.y + 5, hexR, false), 6)} fill="var(--theme-ink)" fillOpacity=".12" />
                <path d={roundedPolyPath(hexPoints(it.hx, it.y, hexR, false), 6)} fill={`url(#${id}-${tone}-face)`} stroke="var(--theme-surface)" strokeWidth="3" />
                <path d={roundedPolyPath(hexPoints(it.hx, it.y, hexR, false), 6)} fill={`url(#${id}-gloss)`} />
              </g>
            );
          })}
        </svg>

        {segs.map((s, i) => (
          <div className={`cp-ar-seg campus-fade${s.tone === 'gold' ? ' is-gold' : ''}`} key={i} style={{ left: s.label.x, top: s.label.y, width: s.width, fontSize: Math.round(clamp(R * 0.076, 24, 32)), ...enterDelay(3 + i) }}>{s.name}</div>
        ))}
        <div className="cp-ar-center campus-fade" style={{ left: cx, top: cy, ...enterDelay(2) }}>
          <div className="cp-ar-center-spark" aria-hidden="true" />
          <div className="cp-ar-center-title">{p.centerTitle}</div>
          <div className="cp-ar-center-note">{p.centerNote}</div>
        </div>

        <div className="cp-ar-block is-left campus-rise" style={{ left: 0, top: cy - blockH / 2, width: blockW, height: blockH, ...enterDelay(2) }}>
          <div className="cp-ar-block-shape" aria-hidden="true" />
          <div className="cp-ar-block-gloss" aria-hidden="true" />
          <div className="cp-ar-block-title">{p.leftTitle}</div>
          <div className="cp-ar-block-note">{p.leftNote}</div>
        </div>
        <div className="cp-ar-block is-right campus-rise" style={{ right: 0, top: cy - blockH / 2, width: blockW, height: blockH, ...enterDelay(2) }}>
          <div className="cp-ar-block-shape" aria-hidden="true" />
          <div className="cp-ar-block-gloss" aria-hidden="true" />
          <div className="cp-ar-block-title">{p.rightTitle}</div>
          <div className="cp-ar-block-note">{p.rightNote}</div>
        </div>
        <div className="cp-ar-ghost campus-fade" style={{ left: blockW + 2, top: cy, ...enterDelay(3) }} aria-hidden="true" />
        <div className="cp-ar-ghost is-right campus-fade" style={{ left: W - blockW - 42, top: cy, ...enterDelay(3) }} aria-hidden="true" />

        {items.map((it, i) => {
          const left = it.side === 'left';
          return (
            <React.Fragment key={i}>
              <div className={`cp-ar-item is-${it.side} campus-rise`} style={{ [left ? 'left' : 'right']: 0, top: it.y, width: colW, ...enterDelay(4 + i) }}>
                <div className="cp-ar-item-title">{it.item?.title}</div>
                <p className="cp-ar-item-desc">{it.item?.desc}</p>
              </div>
              <div className={`cp-ar-hex-no campus-fade${left ? '' : ' is-gold'}`} style={{ left: it.hx, top: it.y, ...enterDelay(4 + i) }} aria-hidden="true">{String(i + 1).padStart(2, '0')}</div>
            </React.Fragment>
          );
        })}
      </div>
    </CampusFrame>
  );
}

ArrowRing.META = {
  id: 'arrow-ring',
  label: '特色 · 分段箭头环',
  roles: ['process', 'relationship', 'breakdown'],
  defaults: DEFAULTS,
  copyBudgets: {
    centerTitle: 5, centerNote: 16, 'segments[].name': 4, leftTitle: 10, rightTitle: 10, leftNote: 24, rightNote: 24,
    'leftItems[].title': 6, 'leftItems[].desc': 24, 'rightItems[].title': 6, 'rightItems[].desc': 24,
  },
  controls: [
    { ...CHAPTER_CONTROL, default: 2 },
    { key: 'segmentCount', type: 'number', label: '箭头段数', default: 3, min: 3, max: 4, description: '中央箭头环的段数,每段写一个环节名。' },
    { key: 'sideCount', type: 'number', label: '每侧说明数', default: 2, min: 2, max: 4, countArrays: ['leftItems', 'rightItems'], description: '左右两侧各列几条说明(两侧条数相同),分在大箭头色块的上下。' },
  ],
};
