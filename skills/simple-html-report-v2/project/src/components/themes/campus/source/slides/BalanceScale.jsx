// 立体天平:页面中央一架金属天平——三层底座、校色立柱、暖金横梁(可向一侧倾斜或持平)、中心圆章,
// 横梁两端用细链吊着两只金属托盘,托盘上各放一块写着名称的立体块;左右两栏各列 2–4 条要点,底座上一枚结论牌。
// 适合利弊权衡、方案取舍、成本与收益这类「两边掂量、得出取舍」的对比。
// 天平、托盘、立体块都是不含文字的 SVG 图形;名称、圆章文字、结论牌和要点都是叠在上面的水平 HTML 文本。
import React from 'react';
import { useThemeStyle, enterDelay } from '../../../shared/style.jsx';
import { safeArray, clamp } from '../../../chart-safety.mjs';
import { CampusFrame, TitleRow, CHAPTER_CONTROL, TITLE_ROW_SPACE, useCampusLayout, textWidthEm } from '../kit/chrome.jsx';
import { useSvgId, ToneDefs, SlantTag, sectorPath, pt, r2 } from '../kit/feature-b.jsx';
import { useFeatureDStyle, MetalDefs, StageHalo, G6Point, rotate, polyPath, pad2 } from '../kit/feature-d.jsx';

const DEFAULTS = {
  chapterIndex: 3,
  itemCount: 3,
  tilt: 'left',
  sectionNo: '3.7',
  title: '部署方案取舍：容器与虚拟机',
  centerLabel: '选型',
  leftLabel: '容器',
  rightLabel: '虚拟机',
  leftTitle: '轻量级虚拟化',
  rightTitle: '完整虚拟化',
  verdict: '选用 Docker 容器部署',
  leftItems: [
    { title: '秒级启动', desc: '启动只需秒级，打包后发布测试更快。' },
    { title: '硬盘占用一般为 MB', desc: '镜像轻量，迁移和扩展更轻松。' },
    { title: '性能接近原生', desc: '单机可支持上千个容器，管理更简单。' },
    { title: '交付部署更快', desc: '同一镜像在开发、测试、生产环境一致运行。' },
  ],
  rightItems: [
    { title: '分钟级启动', desc: '每次都要先启动一套完整的操作系统。' },
    { title: '硬盘占用一般为 GB', desc: '整机镜像体积大，迁移成本高。' },
    { title: '性能弱于原生', desc: '单机一般只能运行几十个虚拟机。' },
    { title: '隔离更彻底', desc: '各虚拟机拥有独立内核，适合异构系统。' },
  ],
};

const CSS = `
.cp-g6-bs{position:relative;flex:1;min-height:0;}
.cp-g6-bs-col{position:absolute;top:0;bottom:0;display:flex;flex-direction:column;justify-content:center;gap:30px;padding:8px 0 18px;}
.cp-g6-bs-col.is-right{align-items:flex-end;}
.cp-g6-bs-list{display:flex;flex-direction:column;gap:18px;}
.cp-g6-bs-card{padding:18px 22px 18px 18px;}
.cp-g6-bs-col.is-right .cp-g6-bs-card{padding:18px 18px 18px 22px;}
.cp-g6-bs-col.is-4 .cp-g6-bs-list{gap:12px;}
.cp-g6-bs-col.is-4 .cp-g6-bs-card{padding-top:12px;padding-bottom:12px;}
.cp-g6-bs-col.is-4 .cp-g6-point-desc{line-height:1.45;}
.cp-g6-bs-col.is-2 .cp-g6-bs-list{gap:26px;}
.cp-g6-bs-col.is-2 .cp-g6-bs-card{padding-top:26px;padding-bottom:26px;}
.cp-g6-bs-name{position:absolute;transform:translate(-50%,-50%);font-family:var(--theme-font-serif);font-weight:700;font-size:44px;line-height:1.1;letter-spacing:.08em;color:var(--theme-on-accent);white-space:nowrap;text-align:center;}
.cp-g6-bs-name.is-gold{color:var(--campus-gold-deep);}
.cp-g6-bs-hub{position:absolute;transform:translate(-50%,-50%);font-family:var(--theme-font-serif);font-weight:700;font-size:30px;line-height:1.1;letter-spacing:.06em;color:var(--theme-on-accent);white-space:nowrap;}
.cp-g6-bs-verdict{position:absolute;transform:translate(-50%,-50%);isolation:isolate;display:flex;align-items:center;gap:12px;height:54px;padding:0 30px;color:var(--campus-gold-deep);font-weight:700;font-size:23px;letter-spacing:.08em;white-space:nowrap;}
.cp-g6-bs-verdict-shape{position:absolute;inset:0;z-index:-1;border-radius:999px;background:var(--campus-gold-fill);box-shadow:0 10px 22px rgb(var(--campus-gold-rgb) / .36),0 0 0 4px rgb(255 255 255 / .7);}
.cp-g6-bs-verdict-mark{flex:none;width:12px;height:12px;border-radius:2px;background:var(--theme-on-accent);transform:rotate(45deg);opacity:.9;}
`;

const TILT_DEG = { left: -7, level: 0, right: 7 };

/** 托盘 + 立体块 + 吊链(SVG 片段)。hook 是横梁端点,rim 是托盘口的中心。 */
function Pan({ id, hook, rim, panW, block, tone }) {
  const rx = panW / 2;
  const ry = r2(panW * 0.11);
  const bowl = r2(panW * 0.2);
  const ring = { x: hook.x, y: r2(hook.y + 24) };
  const chains = [
    { x: r2(rim.x - rx * 0.9), y: r2(rim.y + ry * 0.2) },
    { x: r2(rim.x + rx * 0.9), y: r2(rim.y + ry * 0.2) },
  ];
  const back = { x: rim.x, y: r2(rim.y - ry * 0.9) };
  const t = tone === 'gold' ? 'gold' : 'accent';
  // 立体块:正面矩形 + 向右上方斜出的顶面与侧面(斜二测)。
  const { w: bw, h: bh, d } = block;
  const x0 = r2(rim.x - bw / 2 - d * 0.35);
  const x1 = r2(x0 + bw);
  const y1 = r2(rim.y + ry * 0.15);
  const y0 = r2(y1 - bh);
  const dx = r2(d * 0.7);
  const dy = r2(d * 0.5);
  const front = [{ x: x0, y: y0 }, { x: x1, y: y0 }, { x: x1, y: y1 }, { x: x0, y: y1 }];
  const top = [{ x: x0, y: y0 }, { x: x0 + dx, y: y0 - dy }, { x: x1 + dx, y: y0 - dy }, { x: x1, y: y0 }];
  const side = [{ x: x1, y: y0 }, { x: x1 + dx, y: y0 - dy }, { x: x1 + dx, y: y1 - dy }, { x: x1, y: y1 }];
  return (
    <g>
      {/* 吊环与吊链(在立体块后面) */}
      <line x1={hook.x} y1={hook.y} x2={ring.x} y2={ring.y} stroke={`url(#${id}-metal-gold)`} strokeWidth="5" strokeLinecap="round" />
      <circle cx={ring.x} cy={ring.y} r="9" fill="none" stroke="var(--campus-gold-lo)" strokeWidth="4" />
      {[...chains, back].map((c, i) => (
        <line key={i} x1={ring.x} y1={r2(ring.y + 8)} x2={c.x} y2={c.y} stroke="var(--campus-gold-lo)" strokeOpacity={i === 2 ? 0.55 : 0.9} strokeWidth="2.5" strokeDasharray="7 3" strokeLinecap="round" />
      ))}
      {/* 托盘:碗身 + 口沿 + 盘内 */}
      <ellipse cx={rim.x} cy={r2(rim.y + bowl + 26)} rx={r2(rx * 0.86)} ry={r2(ry * 0.9)} fill={`url(#${id}-shadow)`} />
      <path d={`M ${r2(rim.x - rx)} ${rim.y} A ${r2(rx)} ${bowl} 0 0 0 ${r2(rim.x + rx)} ${rim.y} Z`} fill={`url(#${id}-metal-gold)`} />
      <path d={`M ${r2(rim.x - rx)} ${rim.y} A ${r2(rx)} ${bowl} 0 0 0 ${r2(rim.x + rx)} ${rim.y} Z`} fill={`url(#${id}-sheen)`} opacity=".5" />
      <ellipse cx={rim.x} cy={rim.y} rx={r2(rx)} ry={ry} fill="var(--campus-gold-hi)" />
      <ellipse cx={rim.x} cy={r2(rim.y + 2)} rx={r2(rx - 8)} ry={r2(ry - 4)} fill={`url(#${id}-metal-gold-v)`} opacity=".85" />
      {/* 立体块 */}
      <ellipse cx={r2(rim.x + d * 0.2)} cy={r2(y1 - 2)} rx={r2(bw * 0.56)} ry={r2(ry * 0.5)} fill="var(--theme-ink)" fillOpacity=".22" />
      <path d={polyPath(side)} fill={`url(#${id}-${t}-side)`} />
      <path d={polyPath(top)} fill={`url(#${id}-${t}-face)`} />
      <path d={polyPath(top)} fill="var(--theme-surface)" fillOpacity=".42" />
      <path d={polyPath(front)} fill={`url(#${id}-${t}-face)`} />
      <path d={polyPath(front)} fill={`url(#${id}-sheen)`} opacity=".55" />
      <path d={polyPath([{ x: x0, y: y0 }, { x: x1, y: y0 }, { x: x1 + dx, y: y0 - dy }], false)} fill="none" stroke="var(--theme-surface)" strokeOpacity=".7" strokeWidth="2" strokeLinejoin="round" />
      <line x1={x0 + 1} y1={y0 + 2} x2={x0 + 1} y2={y1 - 2} stroke="var(--theme-surface)" strokeOpacity=".5" strokeWidth="2" />
      <rect x={r2(x0 + 10)} y={r2(y0 + 10)} width={r2(bw - 20)} height={r2(bh - 20)} rx="8" fill="none" stroke="var(--theme-surface)" strokeOpacity=".3" strokeWidth="1.5" />
      {/* 托盘口沿压在立体块底边前面 */}
      <path d={`M ${r2(rim.x - rx)} ${rim.y} A ${r2(rx)} ${ry} 0 0 0 ${r2(rim.x + rx)} ${rim.y}`} fill="none" stroke="var(--campus-gold-hi)" strokeWidth="5" />
      <path d={`M ${r2(rim.x - rx + 6)} ${r2(rim.y + 4)} A ${r2(rx - 6)} ${ry} 0 0 0 ${r2(rim.x + rx - 6)} ${r2(rim.y + 4)}`} fill="none" stroke="var(--campus-gold-lo)" strokeOpacity=".6" strokeWidth="2" />
    </g>
  );
}

/** 立柱底座的一层(竖直圆柱):顶面椭圆 + 侧壁。 */
function Tier({ id, cx, y, rx, ry, t, face = 'accent' }) {
  const side = `M ${r2(cx - rx)} ${r2(y)} L ${r2(cx - rx)} ${r2(y + t)} A ${r2(rx)} ${r2(ry)} 0 0 0 ${r2(cx + rx)} ${r2(y + t)} L ${r2(cx + rx)} ${r2(y)} Z`;
  return (
    <g>
      <path d={side} fill={`url(#${id}-metal-${face})`} />
      <path d={side} fill={`url(#${id}-sheen)`} opacity=".35" />
      <ellipse cx={r2(cx)} cy={r2(y)} rx={r2(rx)} ry={r2(ry)} fill={`url(#${id}-${face}-face)`} />
      <ellipse cx={r2(cx)} cy={r2(y)} rx={r2(rx)} ry={r2(ry)} fill="var(--theme-surface)" fillOpacity=".38" />
      <ellipse cx={r2(cx)} cy={r2(y)} rx={r2(rx - 3)} ry={r2(ry - 2)} fill="none" stroke="var(--theme-surface)" strokeOpacity=".8" strokeWidth="2" />
    </g>
  );
}

export function BalanceScale(props) {
  useThemeStyle('campus-balance-scale-style', CSS);
  useFeatureDStyle();
  const p = { ...DEFAULTS, ...props };
  const id = useSvgId('cp-g6-bs');
  const { bodyW, bodyH } = useCampusLayout();
  const n = clamp(Math.round(p.itemCount) || 3, 2, 4);
  const leftItems = safeArray(p.leftItems).slice(0, n);
  const rightItems = safeArray(p.rightItems).slice(0, n);
  const deg = TILT_DEG[p.tilt] ?? TILT_DEG.left;

  const W = bodyW;
  const H = bodyH - TITLE_ROW_SPACE;
  const colW = clamp(Math.round(W * 0.215), 300, 380);
  const S = W - 2 * colW - 60;
  const cx = r2(W / 2);
  const panW = clamp(Math.round(S * 0.34), 230, 320);
  const L = Math.round(S / 2 - panW / 2 + 4);
  const py = Math.round(H * 0.28);
  const chainLen = Math.round(H * 0.3);
  const block = { w: Math.round(panW * 0.6), h: Math.round(panW * 0.38), d: Math.round(panW * 0.2) };
  const leftEnd = rotate(-L, 0, deg);
  const rightEnd = rotate(L, 0, deg);
  const hookL = { x: r2(cx + leftEnd.x), y: r2(py + leftEnd.y) };
  const hookR = { x: r2(cx + rightEnd.x), y: r2(py + rightEnd.y) };
  const rimL = { x: hookL.x, y: r2(hookL.y + chainLen) };
  const rimR = { x: hookR.x, y: r2(hookR.y + chainLen) };
  // 横梁:以支点为中心的圆角长条,按倾角旋转;两端各一枚金属球。
  const beamT = 18;
  const baseY = H - 34;
  const tiers = [
    { rx: 250, ry: 46, t: 26, face: 'accent' },
    { rx: 190, ry: 34, t: 24, face: 'accent' },
    { rx: 120, ry: 22, t: 22, face: 'gold' },
  ];
  const tierY = [];
  let y = baseY - tiers[0].t;
  tiers.forEach((tr, i) => {
    tierY.push(y);
    if (i < tiers.length - 1) y -= tiers[i + 1].t;
  });
  const pillarTop = py + 20;
  const pillarBottom = tierY[2];
  const hubR = 60;
  const gaugeR = Math.round(clamp(py - 40, 110, 150));
  const needle = pt(cx, py, gaugeR - 4, deg);
  const blockCenter = rim => ({ x: r2(rim.x - block.d * 0.35), y: r2(rim.y + panW * 0.11 * 0.15 - block.h / 2) });
  const bcL = blockCenter(rimL);
  const bcR = blockCenter(rimR);
  // 立体块上的名称:按字宽收小字号,保证落在正面以内。
  const nameSize = text => Math.round(clamp((block.w - 28) / Math.max(1.5, textWidthEm(text) * 1.08), 26, 44));

  return (
    <CampusFrame chapterIndex={p.chapterIndex}>
      <TitleRow no={p.sectionNo} title={p.title} className="campus-rise" style={enterDelay(0)} />
      <div className="cp-g6-bs">
        <svg className="cp-g6-svg campus-fade" style={{ left: 0, top: 0, width: W, height: H, ...enterDelay(1) }} viewBox={`0 0 ${W} ${H}`} aria-hidden="true">
          <ToneDefs id={id} tones={['accent', 'gold']} />
          <MetalDefs id={id} />
          {/* 背景:支点后的大光晕与两道同心细环,底座下的舞台光环 */}
          <circle cx={cx} cy={r2(py + 40)} r={r2(S * 0.46)} fill={`url(#${id}-halo)`} />
          <circle cx={cx} cy={py} r={r2(L * 0.62)} fill="none" stroke="var(--theme-accent)" strokeOpacity=".12" strokeWidth="1.5" />
          <circle cx={cx} cy={py} r={r2(L * 0.86)} fill="none" stroke="var(--theme-accent)" strokeOpacity=".14" strokeWidth="1.5" strokeDasharray="3 9" strokeLinecap="round" />
          <StageHalo id={id} cx={cx} cy={baseY + 6} rx={300} ry={58} glow={false} />
          {/* 底座三层 + 立柱 */}
          {tiers.map((tr, i) => <Tier key={i} id={id} cx={cx} y={tierY[i]} rx={tr.rx} ry={tr.ry} t={tr.t} face={tr.face} />)}
          <rect x={r2(cx - 17)} y={pillarTop} width="34" height={r2(pillarBottom - pillarTop)} fill={`url(#${id}-metal-accent)`} />
          <rect x={r2(cx - 17)} y={pillarTop} width="34" height={r2(pillarBottom - pillarTop)} fill={`url(#${id}-sheen)`} opacity=".25" />
          {[0.3, 0.62].map(f => {
            const cy = r2(pillarTop + (pillarBottom - pillarTop) * f);
            return (
              <g key={f}>
                <rect x={r2(cx - 25)} y={r2(cy - 7)} width="50" height="14" rx="7" fill={`url(#${id}-metal-gold)`} />
                <rect x={r2(cx - 25)} y={r2(cy - 7)} width="50" height="6" rx="3" fill="var(--theme-surface)" fillOpacity=".35" />
              </g>
            );
          })}
          <path d={`M ${r2(cx - 42)} ${pillarBottom} L ${r2(cx - 24)} ${r2(pillarBottom - 40)} L ${r2(cx + 24)} ${r2(pillarBottom - 40)} L ${r2(cx + 42)} ${pillarBottom} Z`} fill={`url(#${id}-metal-gold)`} />
          {/* 顶部刻度盘:玻璃扇面 + 刻度 + 随横梁倾角偏转的指针 */}
          <path d={sectorPath(cx, py, gaugeR + 22, gaugeR - 30, -50, 50)} fill="var(--theme-surface)" fillOpacity=".72" stroke="var(--theme-surface)" strokeWidth="2" />
          <path d={sectorPath(cx, py, gaugeR + 22, gaugeR - 30, -50, 50)} fill={`url(#${id}-halo)`} />
          <path d={sectorPath(cx, py, gaugeR + 22, gaugeR + 16, -50, 50)} fill={`url(#${id}-metal-gold)`} />
          {Array.from({ length: 15 }, (_, k) => {
            const a = -42 + k * 6;
            const major = k % 7 === 0;
            const p0 = pt(cx, py, gaugeR + 8, a);
            const p1 = pt(cx, py, gaugeR - (major ? 18 : 6), a);
            return <line key={k} x1={p0.x} y1={p0.y} x2={p1.x} y2={p1.y} stroke={k === 7 ? 'var(--campus-gold-lo)' : 'var(--theme-accent)'} strokeOpacity={major ? 0.85 : 0.4} strokeWidth={major ? 3 : 2} strokeLinecap="round" />;
          })}
          <line x1={cx} y1={py} x2={needle.x} y2={needle.y} stroke="var(--campus-gold-deep)" strokeWidth="6" strokeLinecap="round" />
          <line x1={cx} y1={py} x2={needle.x} y2={needle.y} stroke="var(--campus-gold-hi)" strokeWidth="2" strokeLinecap="round" />
          <circle cx={needle.x} cy={needle.y} r="9" fill={`url(#${id}-disc-gold)`} />
          {/* 两侧托盘(先画,横梁压在吊环上) */}
          <Pan id={id} hook={hookL} rim={rimL} panW={panW} block={block} tone="accent" />
          <Pan id={id} hook={hookR} rim={rimR} panW={panW} block={block} tone="gold" />
          {/* 横梁 */}
          <g transform={`translate(${cx} ${py}) rotate(${deg})`}>
            <rect x={r2(-L - 10)} y={r2(-beamT / 2 + 4)} width={r2(2 * L + 20)} height={beamT} rx={r2(beamT / 2)} fill="var(--campus-gold-deep)" opacity=".35" />
            <rect x={r2(-L - 10)} y={r2(-beamT / 2)} width={r2(2 * L + 20)} height={beamT} rx={r2(beamT / 2)} fill={`url(#${id}-metal-gold-v)`} />
            <rect x={r2(-L)} y={r2(-beamT / 2 + 3)} width={r2(2 * L)} height="4" rx="2" fill="var(--theme-surface)" fillOpacity=".6" />
            {[-1, 1].map(s => (
              <g key={s}>
                <circle cx={r2(s * (L + 6))} cy="0" r="17" fill={`url(#${id}-disc-gold)`} />
                <circle cx={r2(s * (L + 6) - 5)} cy="-6" r="5" fill="var(--theme-surface)" fillOpacity=".7" />
              </g>
            ))}
          </g>
          {/* 支点圆章 */}
          <circle cx={r2(cx + 4)} cy={r2(py + 8)} r={hubR + 4} fill="var(--theme-accent)" fillOpacity=".2" />
          <circle cx={cx} cy={py} r={hubR} fill={`url(#${id}-metal-gold)`} />
          <circle cx={cx} cy={py} r={hubR - 9} fill={`url(#${id}-disc-accent)`} />
          <circle cx={cx} cy={py} r={hubR - 15} fill="none" stroke="var(--theme-surface)" strokeOpacity=".45" strokeWidth="1.5" strokeDasharray="2 5" />
          <ellipse cx={r2(cx - 14)} cy={r2(py - 22)} rx="24" ry="12" fill="var(--theme-surface)" fillOpacity=".28" />
        </svg>

        <div className="cp-g6-bs-hub campus-fade" style={{ left: cx, top: py, ...enterDelay(3) }}>{p.centerLabel}</div>
        <div className="cp-g6-bs-name campus-fade" style={{ left: bcL.x, top: bcL.y, fontSize: nameSize(p.leftLabel), ...enterDelay(3) }}>{p.leftLabel}</div>
        <div className="cp-g6-bs-name is-gold campus-fade" style={{ left: bcR.x, top: bcR.y, fontSize: nameSize(p.rightLabel), ...enterDelay(3) }}>{p.rightLabel}</div>
        <div className="cp-g6-bs-verdict campus-rise" style={{ left: cx, top: r2(tierY[1] + 30), ...enterDelay(5) }}>
          <div className="cp-g6-bs-verdict-shape" aria-hidden="true" />
          <div className="cp-g6-bs-verdict-mark" aria-hidden="true" />
          <div>{p.verdict}</div>
          <div className="cp-g6-bs-verdict-mark" aria-hidden="true" />
        </div>

        {[{ side: 'left', items: leftItems, title: p.leftTitle }, { side: 'right', items: rightItems, title: p.rightTitle }].map(col => {
          const right = col.side === 'right';
          return (
            <div className={`cp-g6-bs-col is-${col.side} is-${n}`} key={col.side} style={right ? { right: 0, width: colW } : { left: 0, width: colW }}>
              <SlantTag className="campus-rise" style={enterDelay(2)} text={col.title} tone={right ? 'gold' : 'accent'} />
              <div className="cp-g6-bs-list">
                {col.items.map((item, i) => (
                  <div className={`cp-g6-bs-card cp-g6-glass${right ? ' is-gold' : ''} campus-rise`} style={enterDelay(3 + i)} key={i}>
                    <G6Point no={pad2(i + 1)} title={item?.title} desc={item?.desc} tone={right ? 'gold' : 'accent'} />
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

BalanceScale.META = {
  id: 'balance-scale',
  label: '特色 · 立体天平取舍',
  roles: ['comparison', 'risks', 'observation'],
  defaults: DEFAULTS,
  copyBudgets: {
    title: 28,
    centerLabel: 3, leftLabel: 4, rightLabel: 4, leftTitle: 8, rightTitle: 8, verdict: 14,
    'leftItems[].title': 10, 'leftItems[].desc': 24, 'rightItems[].title': 10, 'rightItems[].desc': 24,
  },
  controls: [
    { ...CHAPTER_CONTROL },
    { key: 'itemCount', type: 'number', label: '每侧要点数', default: 3, min: 2, max: 4, countArrays: ['leftItems', 'rightItems'], description: '左右两栏各列几条要点(两侧条数相同)。' },
    { key: 'tilt', type: 'radio', label: '天平倾向', default: 'left', options: [{ value: 'left', label: '偏向左侧' }, { value: 'level', label: '持平' }, { value: 'right', label: '偏向右侧' }], description: '横梁向哪一侧压下(被选中、分量更重的一侧),或两侧持平。' },
  ],
};
