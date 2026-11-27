// campus 特色页(C 组 · 递进与路径)共用部件:领奖台、道路、山峰、靶心、漏斗、拼图这几页用到的
// 透视几何(一点透视的立方体、贝塞尔采样、带宽度的路面轮廓、拼图块轮廓)、SVG 渐变与装饰(星点、光束、旗帜、定位针),
// 以及叠在图形上的文字块(眉题胶囊、导语、玻璃说明卡)。
//
// 与 A / B 组相同的约定:
//   - 立体图形画在 SVG 里(导出 PPTX 时整块转成图片),SVG 里不放文字;数字、标题、说明是叠在上面的独立 HTML 文本。
//   - SVG 渐变色标用 stop-color="currentColor" + 行内 color 读 token(复用 feature-b 的 Stop),导出后颜色不丢。
//   - 光照来自左上方:朝左 / 朝上的面亮,朝右 / 朝下的面暗;第二色只用暖金 --campus-gold*(橙色校色下整组换成冷调银蓝)。
//   - 几何一律保留两位小数(r2),SSR 结果逐字节稳定。
import React from 'react';
import { useThemeStyle } from '../../../shared/style.jsx';
import { safeNumber, clamp } from '../../../chart-safety.mjs';
import { CAMPUS_FEATURE_C_CSS } from './base.jsx';
import { useFeatureBStyle, Stop, r2 } from './feature-b.jsx';

export { Stop, r2 };
export { useSvgId } from './feature-b.jsx';

const KIT_CSS = `
.cp-g5-fig{position:relative;flex:1;min-height:0;}
.cp-g5-svg{position:absolute;left:0;top:0;display:block;overflow:visible;pointer-events:none;}
.cp-g5-abs{position:absolute;}
/* 胶囊 / 玻璃卡 / 编号徽的 position:relative 用 :where() 降到零特异度:页面给它们加的定位类(position:absolute)
   无论样式注入先后都能生效——否则一份稿子里第一张 C 组页面是靶心 / 拼图 / 道路 / 漏斗时,kit 样式后注入,卡片会掉回文档流。 */

/* 眉题胶囊:渐变底 + 点缀金小菱形;is-gold 用暖金底 */
:where(.cp-g5-chip){position:relative;}
.cp-g5-chip{isolation:isolate;display:inline-flex;align-items:center;gap:10px;height:42px;padding:0 20px 0 16px;color:var(--theme-on-accent);font-weight:700;font-size:20px;letter-spacing:.08em;white-space:nowrap;}
.cp-g5-chip-shape{position:absolute;inset:0;z-index:-1;border-radius:999px;background:var(--campus-fill);box-shadow:0 8px 18px rgb(var(--theme-accent-rgb) / .24);}
.cp-g5-chip-dot{flex:none;width:10px;height:10px;border-radius:2px;background:var(--campus-gold-hi);transform:rotate(45deg);}
.cp-g5-chip.is-gold{color:var(--campus-gold-deep);}
.cp-g5-chip.is-gold .cp-g5-chip-shape{background:var(--campus-gold-fill);box-shadow:0 8px 18px rgb(var(--campus-gold-rgb) / .3);}
.cp-g5-chip.is-gold .cp-g5-chip-dot{background:var(--theme-surface);}

/* 导语块:眉题胶囊 + 左侧渐变竖条的段落 */
.cp-g5-lead{display:flex;flex-direction:column;align-items:flex-start;gap:16px;}
.cp-g5-lead-text{position:relative;padding:2px 0 2px 24px;font-size:22px;line-height:1.62;color:var(--theme-muted);text-wrap:pretty;}
.cp-g5-lead-text::before{content:'';position:absolute;left:0;top:6px;bottom:6px;width:5px;border-radius:3px;background:var(--campus-fill-bar);}

/* 玻璃说明卡:半透明白 + 白色描边 + 柔和校色投影(都在 ::before 上,卡片本身不带投影) */
:where(.cp-g5-glass){position:relative;}
.cp-g5-glass{isolation:isolate;border-radius:20px;}
.cp-g5-glass::before{content:'';position:absolute;inset:0;z-index:-1;border-radius:inherit;background:linear-gradient(150deg,rgb(255 255 255 / .97) 0%,rgb(255 255 255 / .84) 100%);border:1.5px solid rgb(255 255 255 / .95);box-shadow:0 16px 36px rgb(var(--theme-accent-rgb) / .13),0 2px 6px rgb(0 0 0 / .04);pointer-events:none;}
.cp-g5-glass.is-gold::before{border-color:var(--campus-gold-line);box-shadow:0 16px 36px rgb(var(--campus-gold-rgb) / .22),0 2px 6px rgb(0 0 0 / .04);}

/* 编号徽:渐变圆角块(形状不含文字)+ 衬线编号 */
:where(.cp-g5-seal){position:relative;}
.cp-g5-seal{isolation:isolate;flex:none;display:flex;align-items:center;justify-content:center;min-width:52px;height:52px;padding:0 10px;color:var(--theme-on-accent);font-family:var(--theme-font-serif);font-weight:700;font-size:26px;line-height:1;font-variant-numeric:lining-nums;white-space:nowrap;}
.cp-g5-seal-shape{position:absolute;inset:0;z-index:-1;border-radius:14px;background:var(--campus-fill);box-shadow:0 8px 16px rgb(var(--theme-accent-rgb) / .26);}
.cp-g5-seal.is-gold{color:var(--campus-gold-deep);}
.cp-g5-seal.is-gold .cp-g5-seal-shape{background:var(--campus-gold-fill);box-shadow:0 8px 16px rgb(var(--campus-gold-rgb) / .32);}
.cp-g5-seal.is-round .cp-g5-seal-shape{border-radius:50%;}
`;

/** C 组公共样式:feature-b 的暖金 / 玻璃 token + 本组 token(base.jsx 末尾 g5 区块)+ 本 kit 的通用类。 */
export function useFeatureCStyle() {
  useFeatureBStyle();
  useThemeStyle('campus-g5-token-style', CAMPUS_FEATURE_C_CSS);
  useThemeStyle('campus-g5-kit-style', KIT_CSS);
}

/** 眉题胶囊(文字是独立可编辑块)。 */
export function KickerChip({ text, gold = false, className = '', style }) {
  return (
    <div className={`cp-g5-chip${gold ? ' is-gold' : ''} ${className}`} style={style}>
      <div className="cp-g5-chip-shape" aria-hidden="true" />
      <div className="cp-g5-chip-dot" aria-hidden="true" />
      <div>{text}</div>
    </div>
  );
}

/** 编号徽(形状与编号分离)。 */
export function NoSeal({ no, gold = false, round = false, className = '', style }) {
  return (
    <div className={`cp-g5-seal${gold ? ' is-gold' : ''}${round ? ' is-round' : ''} ${className}`} style={style}>
      <div className="cp-g5-seal-shape" aria-hidden="true" />
      <div>{no}</div>
    </div>
  );
}

/* ───────────── 几何工具 ───────────── */

const lerp = (a, b, t) => a + (b - a) * t;

/** 一点透视:点 P 朝灭点 vp 收缩到 s 倍(s<1 表示更远)。 */
export function toward(vp, x, y, s) {
  return { x: r2(vp.x + (x - vp.x) * s), y: r2(vp.y + (y - vp.y) * s) };
}

/**
 * 一点透视的立方体(正面是矩形 x0..x1 × yTop..yBot,背面朝灭点收缩到 s 倍)。
 * 返回各可见面的多边形顶点串:front、top,以及灭点在右侧时的 right、灭点在左侧时的 left。
 */
export function perspectiveBox({ x0, x1, yTop, yBot, vp, s = 0.94 }) {
  const a = toward(vp, x0, yTop, s);
  const b = toward(vp, x1, yTop, s);
  const c = toward(vp, x1, yBot, s);
  const d = toward(vp, x0, yBot, s);
  const pts = list => list.map(q => `${r2(q.x)},${r2(q.y)}`).join(' ');
  return {
    front: pts([{ x: x0, y: yTop }, { x: x1, y: yTop }, { x: x1, y: yBot }, { x: x0, y: yBot }]),
    top: pts([{ x: x0, y: yTop }, { x: x1, y: yTop }, b, a]),
    right: vp.x > x1 ? pts([{ x: x1, y: yTop }, b, c, { x: x1, y: yBot }]) : null,
    left: vp.x < x0 ? pts([a, { x: x0, y: yTop }, { x: x0, y: yBot }, d]) : null,
    backTop: { a, b },
  };
}

/** 三次贝塞尔上的点。 */
export function cubicAt(p0, p1, p2, p3, t) {
  const u = 1 - t;
  return {
    x: u * u * u * p0.x + 3 * u * u * t * p1.x + 3 * u * t * t * p2.x + t * t * t * p3.x,
    y: u * u * u * p0.y + 3 * u * u * t * p1.y + 3 * u * t * t * p2.y + t * t * t * p3.y,
  };
}

/**
 * 过一串点的平滑曲线(Catmull-Rom 换算成三次贝塞尔),按 steps 段均匀采样,返回采样点(含累计弧长 len)。
 * 每个采样点带一个插值参数 k(0 → 1 沿整条曲线),页面用它给宽度、比例做透视插值。
 */
export function sampleSpline(points, steps = 24) {
  const list = points.filter(q => q && Number.isFinite(q.x) && Number.isFinite(q.y));
  if (list.length < 2) return list.map((q, i) => ({ x: q.x, y: q.y, len: 0, k: i }));
  const out = [];
  const segs = list.length - 1;
  for (let i = 0; i < segs; i += 1) {
    const p0 = list[Math.max(0, i - 1)];
    const p1 = list[i];
    const p2 = list[i + 1];
    const p3 = list[Math.min(list.length - 1, i + 2)];
    const c1 = { x: p1.x + (p2.x - p0.x) / 6, y: p1.y + (p2.y - p0.y) / 6 };
    const c2 = { x: p2.x - (p3.x - p1.x) / 6, y: p2.y - (p3.y - p1.y) / 6 };
    for (let j = i === 0 ? 0 : 1; j <= steps; j += 1) {
      const q = cubicAt(p1, c1, c2, p2, j / steps);
      out.push({ x: q.x, y: q.y, seg: i, t: j / steps });
    }
  }
  let len = 0;
  out.forEach((q, i) => {
    if (i > 0) len += Math.hypot(q.x - out[i - 1].x, q.y - out[i - 1].y);
    q.len = len;
  });
  const total = Math.max(1e-6, len);
  out.forEach(q => { q.k = q.len / total; });
  return out;
}

/**
 * 沿采样点的法线向两侧偏移 halfWidth(k) 得到左右边线。
 * squash<1 时按「倾斜的地面」处理:法线在纵向拉伸 1/squash 的地面坐标里求,偏移量的纵向分量再压回 squash 倍——
 * 横穿画面的路段显得扁、弯道处保持宽,和真实透视一致,而且只要地面上的弯道半径大于路宽,边线就不会自交。
 */
export function ribbonEdges(samples, halfWidth, squash = 1) {
  const c = clamp(safeNumber(squash, 1), 0.1, 1);
  const left = [];
  const right = [];
  samples.forEach((q, i) => {
    const a = samples[Math.max(0, i - 1)];
    const b = samples[Math.min(samples.length - 1, i + 1)];
    const dx = b.x - a.x;
    const dy = (b.y - a.y) / c;
    const len = Math.max(1e-6, Math.hypot(dx, dy));
    const nx = -dy / len;
    const ny = (dx / len) * c;
    const w = safeNumber(halfWidth(q.k, q), 0);
    left.push({ x: q.x + nx * w, y: q.y + ny * w, k: q.k });
    right.push({ x: q.x - nx * w, y: q.y - ny * w, k: q.k });
  });
  return { left, right };
}

/**
 * 一列卡片的竖向避让:ideals 是各卡片理想的中心 y,size 是估计的卡片高度。先按理想位置自上而下排,
 * 与上一张的间距不足 gap 时往下推;整列超出 [lo, hi] 时再自下而上往回推。返回与 ideals 同序的中心 y。
 */
export function spreadPositions(ideals, size, gap, lo, hi) {
  const order = ideals.map((y, i) => ({ y: safeNumber(y, lo), i })).sort((a, b) => a.y - b.y);
  const step = size + gap;
  order.forEach((q, k) => {
    const min = k === 0 ? lo + size / 2 : order[k - 1].y + step;
    q.y = Math.max(q.y, min);
  });
  for (let k = order.length - 1; k >= 0; k -= 1) {
    const max = k === order.length - 1 ? hi - size / 2 : order[k + 1].y - step;
    order[k].y = Math.min(order[k].y, max);
  }
  const out = [];
  order.forEach(q => { out[q.i] = r2(q.y); });
  return out;
}

/** 折线 → SVG path(可选闭合)。 */
export function polyPath(points, close = false) {
  if (!points.length) return '';
  return `M ${points.map(q => `${r2(q.x)} ${r2(q.y)}`).join(' L ')}${close ? ' Z' : ''}`;
}

/** 在采样曲线上按弧长比例 k 取点,并给出切线角(度)。 */
export function pointAtK(samples, k) {
  if (!samples.length) return { x: 0, y: 0, angle: 0 };
  const kk = clamp(safeNumber(k, 0), 0, 1);
  let i = samples.findIndex(q => q.k >= kk);
  if (i <= 0) i = 1;
  if (i < 0 || i >= samples.length) i = samples.length - 1;
  const a = samples[Math.max(0, i - 1)];
  const b = samples[i];
  const span = Math.max(1e-6, b.k - a.k);
  const t = clamp((kk - a.k) / span, 0, 1);
  return { x: r2(lerp(a.x, b.x, t)), y: r2(lerp(a.y, b.y, t)), angle: r2(Math.atan2(b.y - a.y, b.x - a.x) * 180 / Math.PI) };
}

/**
 * 拼图块的一条边(从 A 到 B,外法线在行进方向的左侧——按屏幕坐标顺时针绕行时即朝外)。
 * sign:1 凸出的榫头,-1 凹进的卯口,0 平边。榫头的形状对 0.5 对称,相邻两块反向走同一条边时轮廓重合。
 */
export function puzzleEdge(ax, ay, bx, by, sign) {
  const L = Math.hypot(bx - ax, by - ay);
  if (!sign || L < 1) return `L ${r2(bx)} ${r2(by)}`;
  const ux = (bx - ax) / L;
  const uy = (by - ay) / L;
  const nx = uy * sign;
  const ny = -ux * sign;
  const P = (u, v) => `${r2(ax + ux * u * L + nx * v * L)} ${r2(ay + uy * u * L + ny * v * L)}`;
  return [
    `L ${P(0.37, 0)}`,
    `C ${P(0.415, 0)} ${P(0.43, 0.03)} ${P(0.405, 0.075)}`,
    `C ${P(0.335, 0.15)} ${P(0.37, 0.255)} ${P(0.5, 0.255)}`,
    `C ${P(0.63, 0.255)} ${P(0.665, 0.15)} ${P(0.595, 0.075)}`,
    `C ${P(0.57, 0.03)} ${P(0.585, 0)} ${P(0.63, 0)}`,
    `L ${r2(bx)} ${r2(by)}`,
  ].join(' ');
}

/** 拼图块轮廓:格子 (x, y, w, h),四条边的榫卯符号 { top, right, bottom, left }。 */
export function puzzlePath(x, y, w, h, edges = {}) {
  return [
    `M ${r2(x)} ${r2(y)}`,
    puzzleEdge(x, y, x + w, y, edges.top || 0),
    puzzleEdge(x + w, y, x + w, y + h, edges.right || 0),
    puzzleEdge(x + w, y + h, x, y + h, edges.bottom || 0),
    puzzleEdge(x, y + h, x, y, edges.left || 0),
    'Z',
  ].join(' ');
}

/* ───────────── SVG 装饰片段(放在页面自己的 <svg> 里) ───────────── */

/**
 * 星点装饰:points = [[x, y, size, kind, tone]],kind 为 'star'(四角星)或 'dot'(小菱形),
 * tone 为 'gold' | 'accent' | 'white'。坐标由页面按绘图区比例给出(预先写死的比例,不随机)。
 */
export function Sparkles({ points = [], opacity = 1 }) {
  const color = tone => (tone === 'gold' ? 'var(--campus-gold)' : tone === 'white' ? 'var(--theme-surface)' : 'var(--theme-accent)');
  return (
    <g opacity={opacity}>
      {points.map(([x, y, size, kind, tone], i) => {
        const s = safeNumber(size, 8);
        if (kind === 'dot') {
          return <rect key={i} x={r2(x - s / 2)} y={r2(y - s / 2)} width={r2(s)} height={r2(s)} rx={r2(s * 0.18)} transform={`rotate(45 ${r2(x)} ${r2(y)})`} fill={color(tone)} fillOpacity={tone === 'accent' ? 0.32 : 0.85} />;
        }
        const k = s * 0.22;
        const d = `M ${r2(x)} ${r2(y - s)} Q ${r2(x + k)} ${r2(y - k)} ${r2(x + s)} ${r2(y)} Q ${r2(x + k)} ${r2(y + k)} ${r2(x)} ${r2(y + s)} Q ${r2(x - k)} ${r2(y + k)} ${r2(x - s)} ${r2(y)} Q ${r2(x - k)} ${r2(y - k)} ${r2(x)} ${r2(y - s)} Z`;
        return <path key={i} d={d} fill={color(tone)} fillOpacity={tone === 'accent' ? 0.45 : 0.95} />;
      })}
    </g>
  );
}

/** 小旗(旗杆 + 燕尾旗面 + 杆头圆球):杆底在 (x, y),高 h;gold 用暖金旗面。旗面朝右。 */
export function FlagMark({ id, x, y, h, gold = false, scale = 1 }) {
  const fw = 46 * scale;
  const fh = 30 * scale;
  const top = y - h;
  const tone = gold ? 'gold' : 'accent';
  return (
    <g>
      <ellipse cx={r2(x)} cy={r2(y)} rx={r2(9 * scale)} ry={r2(3.4 * scale)} fill="var(--theme-ink)" fillOpacity=".18" />
      <path d={`M ${r2(x + 2 * scale)} ${r2(top + 4)} L ${r2(x + fw)} ${r2(top + 4 + fh * 0.12)} L ${r2(x + fw - 11 * scale)} ${r2(top + 4 + fh * 0.55)} L ${r2(x + fw + 2 * scale)} ${r2(top + 4 + fh)} L ${r2(x + 2 * scale)} ${r2(top + 4 + fh * 0.9)} Z`} fill={`url(#${id}-${tone}-face)`} />
      <path d={`M ${r2(x + 2 * scale)} ${r2(top + 4)} L ${r2(x + fw)} ${r2(top + 4 + fh * 0.12)} L ${r2(x + fw - 6 * scale)} ${r2(top + 4 + fh * 0.32)} L ${r2(x + 2 * scale)} ${r2(top + 4 + fh * 0.3)} Z`} fill="var(--theme-surface)" fillOpacity=".28" />
      <rect x={r2(x - 2 * scale)} y={r2(top)} width={r2(4 * scale)} height={r2(h)} rx={r2(2 * scale)} fill={`url(#${id}-pole)`} />
      <circle cx={r2(x)} cy={r2(top)} r={r2(5.5 * scale)} fill={`url(#${id}-gold-face)`} />
    </g>
  );
}

/** 旗杆与金属件的渐变(配合 FlagMark 使用)。 */
export function PoleDefs({ id }) {
  return (
    <linearGradient id={`${id}-pole`} x1="0" y1="0" x2="1" y2="0">
      <Stop offset="0" color="var(--campus-fb-accent-pale)" />
      <Stop offset=".5" color="var(--theme-surface)" />
      <Stop offset="1" color="var(--campus-g5-steel)" />
    </linearGradient>
  );
}

/**
 * 定位针(水滴形):针尖在 (x, y),头部圆心在针尖上方 1.55r 处。头部中央留一枚白色圆盘,编号是叠在上面的 HTML 文本。
 * 返回头部圆心,页面据此摆编号。
 */
export function pinGeometry(x, y, r) {
  return { cx: r2(x), cy: r2(y - r * 1.55), r: r2(r) };
}
export function MapPin({ id, x, y, r, gold = false }) {
  const g = pinGeometry(x, y, r);
  const tone = gold ? 'gold' : 'accent';
  const d = `M ${r2(x)} ${r2(y)} C ${r2(x - r * 0.35)} ${r2(y - r * 0.5)} ${r2(g.cx - r)} ${r2(g.cy + r * 0.55)} ${r2(g.cx - r)} ${r2(g.cy)} A ${r2(r)} ${r2(r)} 0 1 1 ${r2(g.cx + r)} ${r2(g.cy)} C ${r2(g.cx + r)} ${r2(g.cy + r * 0.55)} ${r2(x + r * 0.35)} ${r2(y - r * 0.5)} ${r2(x)} ${r2(y)} Z`;
  return (
    <g>
      <ellipse cx={r2(x)} cy={r2(y)} rx={r2(r * 0.62)} ry={r2(r * 0.2)} fill="var(--theme-ink)" fillOpacity=".22" />
      <path d={d} fill={`url(#${id}-${tone}-face)`} />
      <path d={d} fill={`url(#${id}-gloss)`} />
      <ellipse cx={r2(g.cx - r * 0.34)} cy={r2(g.cy - r * 0.42)} rx={r2(r * 0.34)} ry={r2(r * 0.2)} fill="var(--theme-surface)" fillOpacity=".38" transform={`rotate(-28 ${r2(g.cx - r * 0.34)} ${r2(g.cy - r * 0.42)})`} />
      <circle cx={g.cx} cy={g.cy} r={r2(r * 0.66)} fill="var(--theme-surface)" />
      <circle cx={g.cx} cy={g.cy} r={r2(r * 0.66)} fill="none" stroke={gold ? 'var(--campus-gold-line)' : 'var(--campus-accent-line)'} strokeWidth="1.5" />
    </g>
  );
}
