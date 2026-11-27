// 立体靶心:右侧一面立在三脚架上的箭靶。靶面略侧转成椭圆,右侧露出一圈厚度(背光的侧壁),底下有托架与落地投影;
// 3–4 环由外到内「校色深环 / 白环」交替,每环是略凸起的台阶(左上斜面高光、向右下投柔影),靶心是带暖金粗环的校色圆台,
// 写核心目标;一支加粗的暖金箭从右上方飞来命中靶心,在靶面上投下影子。左侧说明卡由宽到窄逐级缩进(由宽到聚焦),
// 每张卡用折线引到对应的一环。适合研究目标、问题聚焦、核心结论。
// 与 orb-bubbles(居中数字球 + 两侧气泡卡)的区分:主视觉偏右、侧转带厚度、有支架与箭,说明卡单侧阶梯排列。
import React from 'react';
import { useThemeStyle, enterDelay } from '../../../shared/style.jsx';
import { safeArray, clamp } from '../../../chart-safety.mjs';
import { CampusFrame, TitleRow, CHAPTER_CONTROL, TITLE_ROW_SPACE, useCampusLayout, textWidthEm } from '../kit/chrome.jsx';
import { ToneDefs } from '../kit/feature-b.jsx';
import { useFeatureCStyle, useSvgId, Stop, r2, Sparkles, NoSeal } from '../kit/feature-c.jsx';

const DEFAULTS = {
  chapterIndex: 1,
  ringCount: 4,
  sectionNo: '1.4',
  title: '从城市复杂环境聚焦到研究目标',
  coreLabel: '核心目标',
  coreTitle: '连续精确定位',
  rings: [
    { no: '01', tag: '研究背景', title: '城市复杂环境', desc: '树荫道、隧道、高楼峡谷使卫星信号衰弱、遮挡、反射。' },
    { no: '02', tag: '研究领域', title: '北斗 / INS 组合导航', desc: '两套系统优势互补，深组合抗干扰、高动态、高精度。' },
    { no: '03', tag: '关键问题', title: '观测量异常', desc: '观测量异常时，如何正常、精确、连续地定位。' },
    { no: '04', tag: '研究切入', title: '抗差与灵敏度', desc: '权函数抗差定权，惯导辅助延长相干积分。' },
  ],
};

const CSS = `
.cp-g5-tg-card{position:absolute;display:flex;align-items:center;gap:18px;padding:16px 26px 16px 20px;}
.cp-g5-tg-text{flex:1;min-width:0;display:flex;flex-direction:column;gap:6px;}
.cp-g5-tg-tag{font-size:19px;font-weight:700;letter-spacing:.08em;color:var(--campus-accent-soft);}
.cp-g5-tg-title{font-family:var(--theme-font-serif);font-weight:700;font-size:28px;line-height:1.25;letter-spacing:.03em;color:var(--theme-ink);}
.cp-g5-tg-desc{font-size:21px;line-height:1.5;color:var(--theme-muted);text-wrap:pretty;}
.cp-g5-tg-core{position:absolute;transform:translate(-50%,-50%);display:flex;flex-direction:column;align-items:center;gap:6px;text-align:center;color:var(--theme-on-accent);}
.cp-g5-tg-core-label{display:flex;align-items:center;height:32px;padding:0 14px;border-radius:999px;background:var(--campus-on-accent-glass);border:1.5px solid var(--campus-on-accent-line);font-size:18px;font-weight:700;letter-spacing:.1em;white-space:nowrap;}
.cp-g5-tg-core-title{font-family:var(--theme-font-serif);font-weight:700;line-height:1.2;letter-spacing:.04em;text-wrap:balance;}
.cp-g5-tg-ringno{position:absolute;transform:translate(-50%,-50%);font-family:var(--theme-font-serif);font-weight:700;font-size:21px;line-height:1;color:var(--theme-accent);font-variant-numeric:lining-nums;}
.cp-g5-tg-ringno.is-dark{color:var(--theme-on-accent);}
.cp-g5-tg-core-title{text-shadow:0 2px 8px rgb(var(--theme-accent-rgb) / .5);}
`;

// 环的色调(外 → 内):校色深环与白环交替,最外一环总是深环;3 环时内侧深环与靶心之间靠暖金粗环隔开。
const RING_FILLS = {
  3: ['dark', 'white', 'dark'],
  4: ['dark', 'white', 'dark', 'white'],
};

export function TargetFocus(props) {
  useThemeStyle('campus-target-focus-style', CSS);
  useFeatureCStyle();
  const p = { ...DEFAULTS, ...props };
  const id = useSvgId('cp-g5-tg');
  const { bodyW, bodyH, nav } = useCampusLayout();
  const rings = safeArray(p.rings).slice(0, clamp(Math.round(p.ringCount) || 4, 3, 4));
  const m = rings.length === 3 ? 3 : 4;
  const W = bodyW;
  const H = bodyH - TITLE_ROW_SPACE;

  // 靶:靶面侧转成椭圆(横向压到 KX),厚度 D 露在右侧;下方留出三脚架与落地投影的位置。
  const KX = 0.9;
  const R = Math.round(Math.min(H * 0.39, W * 0.235));
  const D = r2(R * 0.13);
  const cx = r2(W - R * KX - D - Math.max(70, W * 0.07));
  const cy = r2(H * 0.45);
  const floorY = r2(Math.min(H - 14, cy + R * 1.2));
  const rb = r2(R * (m === 3 ? 0.34 : 0.3));
  const radii = Array.from({ length: m + 1 }, (_, j) => r2(R - (j * (R - rb)) / m));
  const mid = j => (radii[j] + radii[j + 1]) / 2;
  const fills = RING_FILLS[m];
  const E = (r, extra = {}) => ({ cx, cy, rx: r2(r * KX), ry: r2(r), ...extra });

  // 左侧说明卡:竖向均分;越往下越窄、越往右缩进(由宽到聚焦),右缘对齐。
  const colR = Math.round(Math.min(cx - R * KX - 110, W * (nav === 'rail' ? 0.42 : 0.4)));
  const gapY = m === 3 ? 30 : 18;
  const cardH = Math.min((H - gapY * (m - 1)) / m, 216);
  const stackTop = (H - (cardH * m + gapY * (m - 1))) / 2;
  const cards = rings.map((rg, j) => {
    const inset = j * Math.round(colR * 0.06);
    const top = stackTop + j * (cardH + gapY);
    const ccy = top + cardH / 2;
    const rm = mid(j);
    const dy = clamp(ccy - cy, -rm * 0.72, rm * 0.72);
    const ax = cx - Math.sqrt(Math.max(0, rm * rm - dy * dy)) * KX;
    return { rg, j, left: inset, width: colR - inset, top: r2(top), ccy: r2(ccy), ax: r2(ax), ay: r2(cy + dy) };
  });

  // 箭:从右上方飞来,箭尖落在靶心右上缘,避开靶心中部的文字。
  const ang = (-50 * Math.PI) / 180;
  const tip = { x: r2(cx + Math.cos(ang) * rb * 0.8 * KX), y: r2(cy + Math.sin(ang) * rb * 0.8) };
  const dir = { x: 0.74, y: -0.67 };
  const L = R * 1.16;
  const tail = { x: r2(tip.x + dir.x * L), y: r2(tip.y + dir.y * L) };
  const nrm = { x: -dir.y, y: dir.x };
  const shaftW = 18;
  const P = (base, along, side) => `${r2(base.x + dir.x * along + nrm.x * side)},${r2(base.y + dir.y * along + nrm.y * side)}`;
  const shaft = [P(tip, 46, -shaftW / 2), P(tail, -6, -shaftW / 2), P(tail, -6, shaftW / 2), P(tip, 46, shaftW / 2)].join(' ');
  const head = [P(tip, 0, 0), P(tip, 82, -30), P(tip, 64, 0), P(tip, 82, 30)].join(' ');
  const headLit = [P(tip, 0, 0), P(tip, 82, -30), P(tip, 64, 0)].join(' ');
  const fletch = k => [P(tail, -14 - k * 40, 0), P(tail, -84 - k * 40, 0), P(tail, -58 - k * 40, 42), P(tail, -2 - k * 40, 38)].join(' ');
  const fletchB = k => [P(tail, -14 - k * 40, 0), P(tail, -84 - k * 40, 0), P(tail, -58 - k * 40, -42), P(tail, -2 - k * 40, -38)].join(' ');
  const shadowOff = { x: -20, y: 26 };

  // 三脚架:两条前腿、一条后腿,顶端藏在靶身后;托架横在靶底。
  const leg = (x0, y0, x1, y1, w0, w1) => {
    const len = Math.max(1, Math.hypot(x1 - x0, y1 - y0));
    const nx = -(y1 - y0) / len;
    const ny = (x1 - x0) / len;
    return `${r2(x0 + nx * w0)},${r2(y0 + ny * w0)} ${r2(x1 + nx * w1)},${r2(y1 + ny * w1)} ${r2(x1 - nx * w1)},${r2(y1 - ny * w1)} ${r2(x0 - nx * w0)},${r2(y0 - ny * w0)}`;
  };
  const legTop = { x: cx + D * 0.6, y: cy - R * 0.35 };
  const legs = [
    { pts: leg(legTop.x, legTop.y, cx + D + R * 0.42, floorY - 8, 7, 10), back: true },
    { pts: leg(legTop.x, legTop.y, cx - R * 0.62, floorY, 8, 12) },
    { pts: leg(legTop.x, legTop.y, cx + R * 0.78, floorY + 2, 8, 12) },
  ];
  const ledgeY = r2(cy + R * 0.9);
  const ledgeX0 = r2(cx - R * 0.5);
  const ledgeX1 = r2(cx + R * 0.56 + D);

  // 核心目标:一行放得下就放一行(字号按靶心宽度收),放不下再折两行。
  const coreW = rb * 1.5;
  const coreEm = Math.max(1, textWidthEm(String(p.coreTitle ?? '')) * 1.04);
  const coreSize = Math.round(coreEm * 24 <= coreW ? clamp(coreW / coreEm, 24, 34) : clamp((coreW * 2) / coreEm, 22, 30));

  return (
    <CampusFrame chapterIndex={p.chapterIndex}>
      <TitleRow no={p.sectionNo} title={p.title} className="campus-rise" style={enterDelay(0)} />
      <div className="cp-g5-fig cp-g5-tg">
        <svg className="cp-g5-svg campus-fade" style={{ width: W, height: H, ...enterDelay(1) }} viewBox={`0 0 ${W} ${H}`} aria-hidden="true">
          <defs>
            <ToneDefs id={id} tones={['accent', 'gold']} />
            {/* 深环:受光的左上亮、右下暗 */}
            <linearGradient id={`${id}-dark`} x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" color="var(--campus-accent-hi)" />
              <Stop offset=".5" color="var(--theme-accent)" />
              <Stop offset="1" color="var(--campus-accent-lo)" />
            </linearGradient>
            <linearGradient id={`${id}-white`} x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" color="var(--theme-surface)" />
              <Stop offset=".6" color="var(--campus-g5-sky)" />
              <Stop offset="1" color="var(--campus-fb-accent-pale)" />
            </linearGradient>
            <linearGradient id={`${id}-side`} x1="0" y1="0" x2="1" y2="0">
              <Stop offset="0" color="var(--campus-accent-lo)" />
              <Stop offset=".6" color="var(--campus-accent-deep)" />
              <Stop offset="1" color="var(--campus-accent-lo)" />
            </linearGradient>
            <linearGradient id={`${id}-side-v`} x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" color="var(--theme-surface)" opacity=".22" />
              <Stop offset=".45" color="var(--theme-surface)" opacity="0" />
              <Stop offset="1" color="var(--theme-ink)" opacity=".25" />
            </linearGradient>
            <linearGradient id={`${id}-bevel`} x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" color="var(--theme-surface)" opacity=".9" />
              <Stop offset=".5" color="var(--theme-surface)" opacity=".05" />
              <Stop offset="1" color="var(--theme-ink)" opacity=".18" />
            </linearGradient>
            <linearGradient id={`${id}-shaft`} x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" color="var(--campus-gold-hi)" />
              <Stop offset=".55" color="var(--campus-gold)" />
              <Stop offset="1" color="var(--campus-gold-lo)" />
            </linearGradient>
            <linearGradient id={`${id}-leg`} x1="0" y1="0" x2="1" y2="0">
              <Stop offset="0" color="var(--campus-accent-lo)" />
              <Stop offset=".35" color="var(--campus-g5-steel)" />
              <Stop offset="1" color="var(--campus-accent-deep)" />
            </linearGradient>
            <linearGradient id={`${id}-ledge`} x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" color="var(--campus-g5-steel)" />
              <Stop offset=".5" color="var(--campus-accent-lo)" />
              <Stop offset="1" color="var(--campus-accent-deep)" />
            </linearGradient>
            <radialGradient id={`${id}-halo`} cx=".5" cy=".5" r=".5">
              <Stop offset="0" color="var(--theme-accent)" opacity=".14" />
              <Stop offset=".7" color="var(--theme-accent)" opacity=".04" />
              <Stop offset="1" color="var(--theme-accent)" opacity="0" />
            </radialGradient>
            <filter id={`${id}-blur`} x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="10" /></filter>
            <filter id={`${id}-soft`} x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="5" /></filter>
          </defs>

          {/* 背景聚焦光晕 */}
          <circle cx={cx} cy={cy} r={r2(R * 1.45)} fill={`url(#${id}-halo)`} />

          {/* 落地投影 + 三脚架(在靶身后) */}
          <ellipse cx={r2(cx + D + R * 0.1)} cy={floorY} rx={r2(R * 0.95)} ry="18" fill="var(--theme-accent)" fillOpacity=".2" filter={`url(#${id}-blur)`} />
          {legs.map((g, k) => <polygon key={k} points={g.pts} fill={`url(#${id}-leg)`} fillOpacity={g.back ? 0.55 : 1} />)}

          {/* 靶身厚度:右侧露出的侧壁 */}
          <ellipse cx={r2(cx + D + 8)} cy={r2(cy + 16)} rx={r2(R * KX)} ry={R} fill="var(--campus-accent-deep)" fillOpacity=".3" filter={`url(#${id}-blur)`} />
          <path d={`M ${cx} ${r2(cy - R)} L ${r2(cx + D)} ${r2(cy - R)} A ${r2(R * KX)} ${R} 0 0 1 ${r2(cx + D)} ${r2(cy + R)} L ${cx} ${r2(cy + R)} Z`} fill={`url(#${id}-side)`} />
          <ellipse cx={r2(cx + D)} cy={cy} rx={r2(R * KX)} ry={R} fill={`url(#${id}-side)`} />
          <ellipse cx={r2(cx + D)} cy={cy} rx={r2(R * KX)} ry={R} fill={`url(#${id}-side-v)`} />

          {/* 环面:深环 / 白环交替;每一环是略凸起的台阶,内一环在外一环上投下一圈柔影 */}
          {radii.slice(0, m).map((r, j) => (
            <g key={j}>
              {j > 0 && <ellipse {...E(r)} cx={r2(cx + 3)} cy={r2(cy + 6)} fill="var(--campus-accent-deep)" fillOpacity={fills[j - 1] === 'dark' ? 0.4 : 0.22} filter={`url(#${id}-soft)`} />}
              <ellipse {...E(r)} fill={`url(#${id}-${fills[j]})`} />
              <ellipse {...E(r - 2)} fill="none" stroke={`url(#${id}-bevel)`} strokeWidth="4" />
            </g>
          ))}
          <ellipse {...E(R)} fill="none" stroke="var(--campus-accent-deep)" strokeOpacity=".5" strokeWidth="2.5" />
          {/* 靶心:暖金粗环 + 校色圆台 */}
          <ellipse {...E(rb)} cx={r2(cx + 4)} cy={r2(cy + 8)} fill="var(--campus-accent-deep)" fillOpacity=".4" filter={`url(#${id}-soft)`} />
          <ellipse {...E(rb + 13)} fill={`url(#${id}-gold-face)`} />
          <ellipse {...E(rb + 12)} fill="none" stroke="var(--campus-gold-hi)" strokeOpacity=".8" strokeWidth="2" />
          <ellipse {...E(rb)} fill={`url(#${id}-accent-face)`} />
          <ellipse {...E(rb)} fill={`url(#${id}-gloss)`} />
          <ellipse {...E(rb - 3)} fill="none" stroke={`url(#${id}-accent-edge)`} strokeWidth="3" />
          <ellipse cx={r2(cx - rb * 0.3)} cy={r2(cy - rb * 0.5)} rx={r2(rb * 0.42)} ry={r2(rb * 0.2)} fill={`url(#${id}-spot)`} />

          {/* 托架:横在靶底的一根立体横梁 */}
          <rect x={ledgeX0} y={r2(ledgeY + 8)} width={r2(ledgeX1 - ledgeX0)} height="24" rx="7" fill="var(--theme-ink)" fillOpacity=".2" filter={`url(#${id}-soft)`} />
          <rect x={ledgeX0} y={ledgeY} width={r2(ledgeX1 - ledgeX0)} height="24" rx="6" fill={`url(#${id}-ledge)`} />
          <rect x={r2(ledgeX0 + 4)} y={r2(ledgeY + 3)} width={r2(ledgeX1 - ledgeX0 - 8)} height="4" rx="2" fill="var(--theme-surface)" fillOpacity=".55" />

          {/* 引线:卡片右缘 → 折点 → 对应一环 */}
          {cards.map(c => {
            const ex = colR + 46;
            const dark = fills[c.j] === 'dark';
            return (
              <g key={c.j}>
                <path d={`M ${colR + 6} ${c.ccy} L ${ex} ${c.ccy} L ${c.ax} ${c.ay}`} fill="none" stroke="var(--theme-accent)" strokeOpacity=".6" strokeWidth="2" strokeDasharray="2 7" strokeLinecap="round" />
                <circle cx={colR + 6} cy={c.ccy} r="5" fill="var(--theme-accent)" />
                <circle cx={c.ax} cy={c.ay} r="9" fill={dark ? 'var(--theme-surface)' : 'var(--theme-accent)'} stroke={dark ? 'var(--theme-accent)' : 'var(--theme-surface)'} strokeWidth="3" />
              </g>
            );
          })}

          {/* 箭:靶面上的影子 → 尾羽 → 箭杆 → 箭头;命中处的冲击光线 */}
          <polygon points={shaft} transform={`translate(${shadowOff.x} ${shadowOff.y})`} fill="var(--campus-accent-deep)" fillOpacity=".45" filter={`url(#${id}-soft)`} />
          {[0, 1].map(k => <polygon key={`fb${k}`} points={fletchB(k)} fill={`url(#${id}-accent-side)`} stroke="var(--theme-surface)" strokeWidth="1.5" strokeLinejoin="round" />)}
          {[0, 1].map(k => <polygon key={`fa${k}`} points={fletch(k)} fill={`url(#${id}-accent-face)`} stroke="var(--theme-surface)" strokeWidth="1.5" strokeLinejoin="round" />)}
          <polygon points={shaft} fill={`url(#${id}-shaft)`} stroke="var(--campus-gold-lo)" strokeWidth="1.2" />
          <line x1={P(tip, 36, -3).split(',')[0]} y1={P(tip, 36, -3).split(',')[1]} x2={P(tail, -10, -3).split(',')[0]} y2={P(tail, -10, -3).split(',')[1]} stroke="var(--theme-surface)" strokeOpacity=".75" strokeWidth="2" strokeLinecap="round" />
          <polygon points={head} fill={`url(#${id}-gold-face)`} stroke="var(--campus-gold-deep)" strokeWidth="1.5" strokeLinejoin="round" />
          <polygon points={headLit} fill="var(--theme-surface)" fillOpacity=".35" />
          {[-160, -115, -25, 15].map((deg, i) => {
            const a = (deg * Math.PI) / 180;
            return <line key={i} x1={r2(tip.x + Math.cos(a) * 20)} y1={r2(tip.y + Math.sin(a) * 20)} x2={r2(tip.x + Math.cos(a) * 38)} y2={r2(tip.y + Math.sin(a) * 38)} stroke="var(--campus-gold-hi)" strokeWidth="3.5" strokeLinecap="round" />;
          })}
          <Sparkles points={[[r2(tail.x + 40), r2(tail.y + 64), 12, 'star', 'gold'], [r2(cx + R * 0.98), r2(cy - R * 0.98), 8, 'star', 'accent'], [r2(cx - R * 1.02), r2(cy - R * 0.92), 7, 'dot', 'gold'], [r2(cx + R * 1.12), r2(cy + R * 0.5), 9, 'star', 'gold']]} />
        </svg>

        {cards.map(c => (
          <div key={c.j} className={`cp-g5-tg-ringno campus-fade${fills[c.j] === 'dark' ? ' is-dark' : ''}`} style={{ left: r2(cx - mid(c.j) * 0.17 * KX), top: r2(cy - mid(c.j) * 0.985), ...enterDelay(2 + c.j) }}>{c.rg?.no}</div>
        ))}
        <div className="cp-g5-tg-core campus-rise" style={{ left: cx, top: r2(cy + 10), width: r2(coreW), ...enterDelay(3) }}>
          <div className="cp-g5-tg-core-label">{p.coreLabel}</div>
          <div className="cp-g5-tg-core-title" style={{ fontSize: coreSize }}>{p.coreTitle}</div>
        </div>
        {cards.map(c => (
          <div key={c.j} className="cp-g5-tg-card cp-g5-glass campus-rise" style={{ left: c.left, width: c.width, top: c.top, height: r2(cardH), ...enterDelay(4 + c.j) }}>
            <NoSeal no={c.rg?.no} />
            <div className="cp-g5-tg-text">
              <div className="cp-g5-tg-tag">{c.rg?.tag}</div>
              <h3 className="cp-g5-tg-title">{c.rg?.title}</h3>
              <p className="cp-g5-tg-desc">{c.rg?.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </CampusFrame>
  );
}

TargetFocus.META = {
  id: 'target-focus',
  label: '特色 · 立体靶心',
  roles: ['statement', 'context', 'observation'],
  defaults: DEFAULTS,
  copyBudgets: { title: 22, coreLabel: 5, coreTitle: 10, 'rings[].no': 2, 'rings[].tag': 6, 'rings[].title': 10, 'rings[].desc': 26 },
  controls: [
    { ...CHAPTER_CONTROL, default: 1 },
    { key: 'ringCount', type: 'number', label: '环数', default: 4, min: 3, max: 4, description: '靶上的环数(不含靶心)与左侧说明卡数量;第一项对应最外环,越往内越聚焦。' },
  ],
};
