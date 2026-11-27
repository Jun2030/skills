// 立体领奖台:3–5 级高低不同的透视立体台子立在一块椭圆舞台上,冠军台是校色实心台 + 暖金台面,
// 顶上一道聚光光束、皇冠与星点;其余是磨砂玻璃台。台子正面写名次大号数字、标题与一句说明,台面上方浮着成果数值。
// 排列可选「领奖台」(冠军居中、两侧依次降低)或「阶梯」(从左到右逐级升高)。
// 5 级时台子较窄:除冠军台外只显示名次与标题,说明文字不显示,避免挤成小字堆。
// 适合「三项核心成果」「三大优势」「前三名」这类有主次的并列成果。
import React from 'react';
import { useThemeStyle, enterDelay } from '../../../shared/style.jsx';
import { safeArray, clamp } from '../../../chart-safety.mjs';
import { CampusFrame, TitleRow, CHAPTER_CONTROL, TITLE_ROW_SPACE, useCampusLayout } from '../kit/chrome.jsx';
import { CrownIcon } from '../kit/feature-a.jsx';
import { ToneDefs } from '../kit/feature-b.jsx';
import { useFeatureCStyle, useSvgId, Stop, r2, perspectiveBox, Sparkles, KickerChip } from '../kit/feature-c.jsx';

const DEFAULTS = {
  chapterIndex: 4,
  itemCount: 3,
  arrangement: 'podium',
  showLead: true,
  sectionNo: '4.1',
  title: '本文的三项核心成果',
  kicker: '研究成果',
  lead: '只用自监督损失训练，不依赖真值，在室内与室外两类数据集上都完成了稠密重建。',
  items: [
    { no: '1', value: '1.373', unit: 'mm', title: '整体误差优于经典方法', desc: 'DTU 测试集 overall 指标由 1.472 降到 1.373，越低越好。' },
    { no: '2', value: '124', unit: '个场景', title: '室内全场景验证', desc: '每个物体 49 个视角 × 7 种亮度，结果未做滤波后处理。' },
    { no: '3', value: '2', unit: '个场景', title: '室外泛化重建', desc: '未在 Tanks and Temples 上训练，直接重建雕像与骏马。' },
    { no: '4', value: '3', unit: '项消融', title: '损失项逐一验证', desc: 'SSIM、Smooth、top-K 三项消融都提高了完整度。' },
    { no: '5', value: '200k', unit: '轮', title: '训练配置可复现', desc: 'α = 12、β = 6、γ = 0.18，单卡训练 200k 轮。' },
  ],
};

const CSS = `
.cp-g5-pd-front{position:absolute;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;overflow:hidden;padding-bottom:10px;}
.cp-g5-pd-no{font-family:var(--theme-font-serif);font-weight:700;line-height:.9;font-variant-numeric:lining-nums;color:var(--theme-accent);letter-spacing:-.02em;}
.cp-g5-pd-title{margin-top:10px;font-family:var(--theme-font-serif);font-weight:700;font-size:28px;line-height:1.25;letter-spacing:.03em;color:var(--theme-ink);text-wrap:balance;}
.cp-g5-pd-desc{margin-top:8px;font-size:21px;line-height:1.5;color:var(--theme-muted);text-wrap:pretty;}
.cp-g5-pd-front.is-hero .cp-g5-pd-no{color:var(--theme-on-accent);}
.cp-g5-pd-front.is-hero .cp-g5-pd-title{color:var(--theme-on-accent);}
.cp-g5-pd-front.is-hero .cp-g5-pd-desc{color:var(--campus-on-accent-muted);}
.cp-g5-pd.is-dense .cp-g5-pd-title{font-size:25px;}
.cp-g5-pd-value{position:absolute;transform:translate(-50%,-100%);display:flex;flex-direction:column;align-items:center;}
.cp-g5-pd-crown{display:block;color:var(--campus-gold);margin-bottom:6px;}
.cp-g5-pd-figure{display:flex;align-items:baseline;gap:6px;white-space:nowrap;color:var(--theme-accent);}
.cp-g5-pd-num{font-family:var(--theme-font-serif);font-weight:700;line-height:1;font-variant-numeric:lining-nums;letter-spacing:-.01em;}
.cp-g5-pd-unit{font-size:22px;font-weight:700;letter-spacing:.04em;}
.cp-g5-pd-value.is-hero .cp-g5-pd-figure{color:var(--campus-gold-ink);}
.cp-g5-pd-lead{position:absolute;}
`;

// 名次 → 位置:领奖台冠军居中、亚军在左、季军在右,再往外交替;阶梯从左到右名次升高。
function placeOrder(n, arrangement) {
  if (arrangement === 'ascend') return Array.from({ length: n }, (_, i) => n - 1 - i);
  const row = [0];
  for (let k = 1; k < n; k += 1) {
    if (k % 2 === 1) row.unshift(k);
    else row.push(k);
  }
  return row;
}

// 舞台上方的星点(按绘图区宽高的比例,预先写死)。
const SPARKS = [
  [0.5, 0.05, 15, 'star', 'gold'], [0.43, 0.13, 8, 'star', 'gold'], [0.585, 0.16, 10, 'star', 'gold'],
  [0.36, 0.06, 7, 'dot', 'accent'], [0.64, 0.05, 8, 'dot', 'gold'], [0.395, 0.24, 6, 'dot', 'gold'],
  [0.62, 0.27, 6, 'dot', 'accent'], [0.31, 0.17, 9, 'star', 'accent'], [0.7, 0.14, 9, 'star', 'accent'],
];

// 月桂枝(冠军台正面的淡色水印):以 (cx, cy) 为圆心、半径 R 的两道弧上排叶片,左右镜像。
function Laurel({ cx, cy, R }) {
  const leaves = [];
  for (let j = 0; j < 9; j += 1) {
    const deg = 104 + j * 13;
    const rad = (deg * Math.PI) / 180;
    const off = j % 2 ? 1.06 : 0.94;
    const x = cx + Math.cos(rad) * R * off;
    const y = cy + Math.sin(rad) * R * off;
    const rot = deg + (j % 2 ? 60 : 120);
    const size = 1 - j * 0.04;
    leaves.push({ x: r2(x), y: r2(y), rot: r2(rot), rx: r2(R * 0.2 * size), ry: r2(R * 0.075 * size) });
  }
  return (
    <g fill="var(--theme-surface)" fillOpacity=".16">
      {leaves.map((l, i) => <ellipse key={`l${i}`} cx={l.x} cy={l.y} rx={l.rx} ry={l.ry} transform={`rotate(${l.rot} ${l.x} ${l.y})`} />)}
      {leaves.map((l, i) => <ellipse key={`r${i}`} cx={r2(2 * cx - l.x)} cy={l.y} rx={l.rx} ry={l.ry} transform={`rotate(${r2(180 - l.rot)} ${r2(2 * cx - l.x)} ${l.y})`} />)}
    </g>
  );
}

export function PodiumRank(props) {
  useThemeStyle('campus-podium-rank-style', CSS);
  useFeatureCStyle();
  const p = { ...DEFAULTS, ...props };
  const id = useSvgId('cp-g5-pd');
  const { bodyW, bodyH } = useCampusLayout();
  const items = safeArray(p.items).slice(0, clamp(Math.round(p.itemCount) || 3, 3, 5));
  const n = Math.max(1, items.length);
  const arrangement = p.arrangement === 'ascend' ? 'ascend' : 'podium';
  const order = placeOrder(n, arrangement);
  const W = bodyW;
  const H = bodyH - TITLE_ROW_SPACE;

  // 台子:整组宽度随级数放宽(3 级占 74%、5 级占 92%),居中立在椭圆舞台中部;冠军台高度随级数略增,其余按名次逐级降低。
  const Wp = W * (n === 3 ? 0.74 : n === 4 ? 0.84 : 0.92);
  const sideM = (W - Wp) / 2;
  const gap = n >= 5 ? 20 : 26;
  const bw = (Wp - gap * (n - 1)) / n;
  const floorCy = H - 74;
  const floorRx = Math.min(W * 0.5, Wp / 2 + 120);
  const floorRy = 66;
  const yB = floorCy - 14;
  const Hmax = n === 3 ? 404 : n === 4 ? 430 : 456;
  const y1 = yB - Hmax;
  const step = n >= 5 ? 0.5 / n : 0.6 / n;
  const vp = { x: W / 2, y: -H * 0.6 };
  const S = 0.93;
  const blocks = order.map((rank, pos) => {
    const x0 = sideM + pos * (bw + gap);
    const x1 = x0 + bw;
    const yTop = yB - Hmax * (1 - rank * step);
    const box = perspectiveBox({ x0, x1, yTop, yBot: yB, vp, s: S });
    return { rank, pos, x0: r2(x0), x1: r2(x1), yTop: r2(yTop), box, hero: rank === 0, item: items[rank] };
  });
  // 绘制顺序:离灭点远的先画,冠军台(离得最近)最后画,压住相邻台子的侧面。
  const drawOrder = [...blocks].sort((a, b) => Math.abs(b.x0 + bw / 2 - vp.x) - Math.abs(a.x0 + bw / 2 - vp.x));
  const hero = blocks.find(b => b.hero) || blocks[0];
  const heroBackY = hero ? hero.box.backTop.a.y : y1;
  const heroCx = hero ? r2(hero.x0 + bw / 2) : W / 2;

  // 导语放在较矮的那一侧外台上方。
  const leftLow = blocks[0] && blocks[blocks.length - 1] ? blocks[0].yTop >= blocks[blocks.length - 1].yTop : true;
  const leadW = Math.round(Math.min(bw * (n === 3 ? 1 : 1.5) + sideM - 10, W * 0.36));
  const leadStyle = leftLow ? { left: 0, top: 0, width: leadW } : { right: 0, top: 0, width: leadW };

  const numSize = h => Math.round(clamp(h * 0.24, 64, 124));
  const valueSize = n >= 5 ? 50 : n === 4 ? 56 : 64;
  const sparks = SPARKS.map(([fx, fy, s, kind, tone]) => [r2(heroCx + (fx - 0.5) * bw * 2.2), r2(heroBackY - valueSize - 60 - (0.3 - fy) * 420), s, kind, tone]);

  return (
    <CampusFrame chapterIndex={p.chapterIndex}>
      <TitleRow no={p.sectionNo} title={p.title} className="campus-rise" style={enterDelay(0)} />
      <div className={`cp-g5-fig cp-g5-pd${n >= 5 ? ' is-dense' : ''}`}>
        <svg className="cp-g5-svg campus-fade" style={{ width: W, height: H, ...enterDelay(1) }} viewBox={`0 0 ${W} ${H}`} aria-hidden="true">
          <defs>
            <ToneDefs id={id} tones={['accent', 'gold', 'mist']} />
            <linearGradient id={`${id}-beam`} x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" color="var(--campus-gold-hi)" opacity="0" />
              <Stop offset=".55" color="var(--campus-gold-hi)" opacity=".22" />
              <Stop offset="1" color="var(--campus-gold-hi)" opacity=".6" />
            </linearGradient>
            <radialGradient id={`${id}-halo`} cx=".5" cy=".5" r=".5">
              <Stop offset="0" color="var(--campus-gold-hi)" opacity=".75" />
              <Stop offset=".45" color="var(--campus-gold-hi)" opacity=".22" />
              <Stop offset="1" color="var(--campus-gold-hi)" opacity="0" />
            </radialGradient>
            <radialGradient id={`${id}-glow`} cx=".5" cy=".5" r=".5">
              <Stop offset="0" color="var(--theme-accent)" opacity=".2" />
              <Stop offset=".6" color="var(--theme-accent)" opacity=".06" />
              <Stop offset="1" color="var(--theme-accent)" opacity="0" />
            </radialGradient>
            <linearGradient id={`${id}-floor`} x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" color="var(--theme-surface)" />
              <Stop offset="1" color="var(--campus-g5-sky)" />
            </linearGradient>
            <linearGradient id={`${id}-glass-front`} x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" color="var(--theme-surface)" />
              <Stop offset=".55" color="var(--campus-g5-sky)" />
              <Stop offset="1" color="var(--campus-fb-accent-pale)" />
            </linearGradient>
            <linearGradient id={`${id}-glass-top`} x1="0" y1="1" x2="0" y2="0">
              <Stop offset="0" color="var(--campus-g5-haze)" />
              <Stop offset="1" color="var(--campus-fb-accent-pale)" />
            </linearGradient>
            <linearGradient id={`${id}-glass-side`} x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" color="var(--campus-fb-accent-mist)" />
              <Stop offset="1" color="var(--campus-g5-haze)" />
            </linearGradient>
            <linearGradient id={`${id}-gold-top`} x1="0" y1="1" x2="1" y2="0">
              <Stop offset="0" color="var(--campus-gold)" />
              <Stop offset=".6" color="var(--campus-gold-hi)" />
              <Stop offset="1" color="var(--campus-gold)" />
            </linearGradient>
            <linearGradient id={`${id}-sheen`} x1="0" y1="0" x2="1" y2="0">
              <Stop offset="0" color="var(--theme-surface)" opacity=".34" />
              <Stop offset=".5" color="var(--theme-surface)" opacity=".06" />
              <Stop offset="1" color="var(--theme-surface)" opacity="0" />
            </linearGradient>
            <linearGradient id={`${id}-lip`} x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" color="var(--theme-surface)" opacity=".6" />
              <Stop offset="1" color="var(--theme-surface)" opacity="0" />
            </linearGradient>
            <filter id={`${id}-blur`} x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="16" /></filter>
          </defs>

          {/* 背景:冠军台后面的光晕与扇形光线 */}
          <ellipse cx={heroCx} cy={r2(heroBackY - 40)} rx={r2(W * 0.36)} ry={r2(H * 0.5)} fill={`url(#${id}-glow)`} />
          {[-34, -20, -8, 8, 20, 34].map((deg, i) => {
            const len = Math.max(120, heroBackY + 40);
            const rad = (deg * Math.PI) / 180;
            const tip = { x: r2(heroCx + Math.sin(rad) * len), y: r2(heroBackY - Math.cos(rad) * len) };
            const half = 0.022;
            const a = { x: r2(heroCx + Math.sin(rad - half) * len), y: r2(heroBackY - Math.cos(rad - half) * len) };
            const b = { x: r2(heroCx + Math.sin(rad + half) * len), y: r2(heroBackY - Math.cos(rad + half) * len) };
            return <polygon key={i} points={`${heroCx},${r2(heroBackY)} ${a.x},${a.y} ${tip.x},${tip.y} ${b.x},${b.y}`} fill="var(--theme-accent)" fillOpacity={i % 2 ? 0.035 : 0.05} />;
          })}

          {/* 舞台:椭圆地台 + 厚度 + 两道光环 */}
          <ellipse cx={r2(W / 2)} cy={r2(floorCy + 26)} rx={r2(floorRx * 0.98)} ry={r2(floorRy + 6)} fill="var(--theme-accent)" fillOpacity=".12" filter={`url(#${id}-blur)`} />
          <ellipse cx={r2(W / 2)} cy={r2(floorCy + 12)} rx={r2(floorRx)} ry={floorRy} fill="var(--campus-fb-accent-pale)" />
          <ellipse cx={r2(W / 2)} cy={r2(floorCy)} rx={r2(floorRx)} ry={floorRy} fill={`url(#${id}-floor)`} stroke="var(--theme-surface)" strokeWidth="2" />
          <ellipse cx={r2(W / 2)} cy={r2(floorCy)} rx={r2(floorRx * 0.9)} ry={r2(floorRy * 0.78)} fill="none" stroke="var(--campus-accent-line)" strokeWidth="1.5" strokeDasharray="3 9" strokeLinecap="round" />
          <ellipse cx={r2(W / 2)} cy={r2(floorCy)} rx={r2(floorRx * 0.97)} ry={r2(floorRy * 0.93)} fill="none" stroke="var(--campus-gold-line)" strokeWidth="2" />
          <ellipse cx={r2(W / 2)} cy={r2(floorCy + 30)} rx={r2(floorRx * 1.06)} ry={r2(floorRy * 0.9)} fill="none" stroke="var(--campus-accent-line)" strokeOpacity=".5" strokeWidth="1.5" />

          {/* 冠军光束 */}
          {hero && (
            <polygon
              points={`${r2(heroCx - bw * 0.16)},${-30} ${r2(heroCx + bw * 0.16)},${-30} ${r2(hero.box.backTop.b.x)},${r2(heroBackY)} ${r2(hero.box.backTop.a.x)},${r2(heroBackY)}`}
              fill={`url(#${id}-beam)`}
            />
          )}

          {/* 台子 */}
          {drawOrder.map(b => {
            const h = yB - b.yTop;
            return (
              <g key={b.rank}>
                <ellipse cx={r2(b.x0 + bw / 2)} cy={r2(yB + 4)} rx={r2(bw * 0.56)} ry="16" fill="var(--theme-accent)" fillOpacity=".2" filter={`url(#${id}-blur)`} />
                {b.box.right && <polygon points={b.box.right} fill={b.hero ? `url(#${id}-accent-side)` : `url(#${id}-mist-side)`} />}
                {b.box.left && <polygon points={b.box.left} fill={b.hero ? `url(#${id}-accent-side)` : `url(#${id}-mist-side)`} />}
                {b.box.left && <polygon points={b.box.left} fill="var(--theme-surface)" fillOpacity=".22" />}
                <polygon points={b.box.front} fill={b.hero ? `url(#${id}-accent-face)` : `url(#${id}-glass-front)`} />
                <rect x={b.x0} y={b.yTop} width={r2(bw * 0.4)} height={r2(h)} fill={`url(#${id}-sheen)`} />
                <rect x={b.x0} y={b.yTop} width={r2(bw)} height={r2(Math.min(26, h * 0.1))} fill={`url(#${id}-lip)`} />
                {!b.hero && <polygon points={b.box.front} fill="none" stroke="var(--campus-accent-line)" strokeWidth="1.5" />}
                <polygon points={b.box.top} fill={b.hero ? `url(#${id}-gold-top)` : `url(#${id}-glass-top)`} />
                <polygon points={b.box.top} fill={`url(#${id}-gloss)`} />
                <line x1={b.x0} y1={b.yTop} x2={b.x1} y2={b.yTop} stroke={b.hero ? 'var(--campus-gold-hi)' : 'var(--theme-surface)'} strokeWidth="3" />
                <line x1={b.x0} y1={b.yTop} x2={b.x0} y2={yB} stroke="var(--theme-surface)" strokeOpacity={b.hero ? 0.4 : 0.9} strokeWidth="2" />
                {b.hero && <Laurel cx={r2(b.x0 + bw / 2)} cy={r2(b.yTop + h * 0.36)} R={r2(Math.min(bw * 0.36, h * 0.34))} />}
                {b.hero && <line x1={b.x0} y1={r2(b.yTop + 16)} x2={b.x1} y2={r2(b.yTop + 16)} stroke="var(--campus-gold)" strokeOpacity=".7" strokeWidth="2" />}
                <rect x={b.x0} y={r2(yB - 22)} width={r2(bw)} height="6" fill={b.hero ? 'var(--campus-gold)' : 'var(--campus-accent-line)'} fillOpacity={b.hero ? 0.9 : 0.6} />
                <rect x={b.x0} y={r2(yB - 12)} width={r2(bw)} height="2" fill={b.hero ? 'var(--campus-gold-hi)' : 'var(--campus-accent-line)'} fillOpacity=".7" />
              </g>
            );
          })}

          {/* 冠军台上方的光晕与星点 */}
          {hero && <ellipse cx={heroCx} cy={r2(heroBackY - valueSize - 74)} rx={r2(bw * 0.42)} ry="92" fill={`url(#${id}-halo)`} />}
          <Sparkles points={sparks} />
        </svg>

        {p.showLead && (
          <div className="cp-g5-pd-lead cp-g5-lead campus-rise" style={{ ...leadStyle, ...enterDelay(2) }}>
            <KickerChip text={p.kicker} />
            <p className="cp-g5-lead-text">{p.lead}</p>
          </div>
        )}

        {blocks.map(b => {
          const h = yB - b.yTop;
          const pad = n >= 5 ? 20 : 28;
          const it = b.item;
          const compact = n >= 5;
          return (
            <React.Fragment key={b.rank}>
              <div className={`cp-g5-pd-value campus-rise${b.hero ? ' is-hero' : ''}`} style={{ left: r2(b.x0 + bw / 2), top: r2(b.box.backTop.a.y - 10), ...enterDelay(3 + b.rank) }}>
                {b.hero && <CrownIcon className="cp-g5-pd-crown" size={n >= 5 ? 50 : 58} />}
                <div className="cp-g5-pd-figure">
                  <div className="cp-g5-pd-num" style={{ fontSize: b.hero ? valueSize + 8 : valueSize }}>{it?.value}</div>
                  <div className="cp-g5-pd-unit">{it?.unit}</div>
                </div>
              </div>
              <div className={`cp-g5-pd-front campus-rise${b.hero ? ' is-hero' : ''}`} style={{ left: r2(b.x0 + pad), top: r2(b.yTop + pad + 4), width: r2(bw - pad * 2), height: r2(h - pad * 2), ...enterDelay(4 + b.rank) }}>
                <div className="cp-g5-pd-no" style={{ fontSize: n >= 5 && !b.hero ? Math.round(numSize(h) * 1.15) : numSize(h) }}>{it?.no}</div>
                <h3 className="cp-g5-pd-title">{it?.title}</h3>
                {(!compact || b.hero) && <p className="cp-g5-pd-desc">{it?.desc}</p>}
              </div>
            </React.Fragment>
          );
        })}
      </div>
    </CampusFrame>
  );
}

PodiumRank.META = {
  id: 'podium-rank',
  label: '特色 · 立体领奖台',
  roles: ['result', 'distribution', 'metrics'],
  defaults: DEFAULTS,
  copyBudgets: { title: 22, kicker: 6, lead: 44, 'items[].no': 2, 'items[].value': 6, 'items[].unit': 4, 'items[].title': 10, 'items[].desc': 30 },
  controls: [
    { ...CHAPTER_CONTROL, default: 4 },
    { key: 'itemCount', type: 'number', label: '台子数量', default: 3, min: 3, max: 5, description: '领奖台的级数;第一项是冠军台(校色实心台 + 暖金台面 + 皇冠光束),其余按顺序逐级降低。5 级时台子较窄,除冠军台外只显示名次与标题(说明不显示)。' },
    { key: 'arrangement', type: 'radio', label: '排列方式', default: 'podium', options: [{ value: 'podium', label: '领奖台' }, { value: 'ascend', label: '阶梯' }], description: '领奖台:冠军居中、两侧交替降低;阶梯:从左到右逐级升高,最右是冠军台。' },
    { key: 'showLead', type: 'toggle', label: '显示导语', default: true, description: '在较矮一侧的台子上方显示眉题胶囊与一段导语。' },
  ],
};
