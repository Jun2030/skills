// campus 特色页(D 组 · 对比与聚合)共用部件:立体天平、齿轮联动、等距积木、扇形展开卡、立体勋章、立体书这几页
// 用到的金属 / 玻璃渐变定义、几何工具(齿轮齿形、等距方块、波纹章边、圆角矩形)、要点条目与舞台光环。
//
// 与 feature-a / feature-b 的约定一致:
//   - 立体图形全部画在 SVG(或不含文字的 div)里,导出 PPTX 时整块转成图片;SVG 里不放文字。
//   - 数字、标题、说明是叠在图形上的独立 HTML 文本元素(水平排布,不随图形旋转),导出后仍可编辑。
//   - SVG 渐变色标用 feature-b 的 Stop(stop-color="currentColor" + 行内 color 读 token),导出后颜色不丢。
//   - 光照来自左上方:顶面 / 朝左的面亮,朝右 / 朝下的面暗;第二色只用暖金 --campus-gold-*(校色偏暖时整组换成冷调银蓝)。
//   - 本组 CSS 类名一律以 cp-g6- 开头。
import React from 'react';
import { useThemeStyle } from '../../../shared/style.jsx';
import { safeNumber, clamp } from '../../../chart-safety.mjs';
import { useFeatureBStyle, Stop, r2 } from './feature-b.jsx';

const KIT_CSS = `
.cp-g6-stage{position:relative;flex:1;min-height:0;}
.cp-g6-svg{position:absolute;display:block;overflow:visible;pointer-events:none;}
.cp-g6-at{position:absolute;transform:translate(-50%,-50%);text-align:center;}

/* 要点条目:编号章 + 标题 + 说明;is-gold 用暖金,is-end 右对齐(编号章在右) */
.cp-g6-point{position:relative;display:flex;align-items:flex-start;gap:16px;}
.cp-g6-point.is-end{flex-direction:row-reverse;text-align:right;}
.cp-g6-point-no{position:relative;isolation:isolate;flex:none;display:grid;place-items:center;width:50px;height:50px;color:var(--theme-on-accent);font-family:var(--theme-font-serif);font-weight:700;font-size:23px;line-height:1;font-variant-numeric:lining-nums;}
.cp-g6-point-no-shape{position:absolute;inset:0;z-index:-1;border-radius:14px;background:var(--campus-fill);box-shadow:0 8px 16px rgb(var(--theme-accent-rgb) / .26);transform:rotate(45deg) scale(.8);}
.cp-g6-point-no-ring{position:absolute;inset:-5px;z-index:-2;border-radius:16px;border:1.5px solid var(--campus-accent-line);transform:rotate(45deg) scale(.86);}
.cp-g6-point.is-gold .cp-g6-point-no{color:var(--campus-gold-deep);}
.cp-g6-point.is-gold .cp-g6-point-no-shape{background:var(--campus-gold-fill);box-shadow:0 8px 16px rgb(var(--campus-gold-rgb) / .3);}
.cp-g6-point.is-gold .cp-g6-point-no-ring{border-color:var(--campus-gold-line);}
.cp-g6-point-text{flex:1;min-width:0;display:flex;flex-direction:column;gap:6px;padding-top:6px;}
.cp-g6-point.is-end .cp-g6-point-text{align-items:flex-end;}
.cp-g6-point-title{font-weight:700;font-size:24px;line-height:1.35;color:var(--theme-ink);letter-spacing:.02em;}
.cp-g6-point.is-gold .cp-g6-point-title{color:var(--campus-gold-ink);}
.cp-g6-point.is-accent .cp-g6-point-title{color:var(--theme-accent);}
.cp-g6-point-desc{font-size:21px;line-height:1.55;color:var(--theme-muted);text-wrap:pretty;}

/* 玻璃卡:半透明白 + 白色发丝边 + 渐变描边感的柔和投影(投影在 ::before 上,卡片本身不带 box-shadow) */
.cp-g6-glass{position:relative;isolation:isolate;border-radius:var(--campus-radius);}
.cp-g6-glass::before{content:'';position:absolute;inset:0;z-index:-1;border-radius:inherit;background:linear-gradient(160deg,rgb(255 255 255 / .97) 0%,rgb(255 255 255 / .78) 100%);border:1.5px solid rgb(255 255 255 / .95);box-shadow:0 16px 36px rgb(var(--theme-accent-rgb) / .11),0 2px 6px rgb(0 0 0 / .04),0 0 0 1px rgb(var(--theme-accent-rgb) / .06);pointer-events:none;}
.cp-g6-glass.is-gold::before{box-shadow:0 16px 36px rgb(var(--campus-gold-rgb) / .2),0 2px 6px rgb(0 0 0 / .04),0 0 0 1px rgb(var(--campus-gold-rgb) / .22);}

/* 名牌胶囊:渐变底(不含文字)+ 文字 */
.cp-g6-tag{position:relative;isolation:isolate;display:inline-flex;align-items:center;justify-content:center;height:46px;padding:0 24px;border-radius:999px;color:var(--theme-on-accent);font-weight:700;font-size:22px;letter-spacing:.08em;white-space:nowrap;}
.cp-g6-tag-shape{position:absolute;inset:0;z-index:-1;border-radius:inherit;background:var(--campus-fill);box-shadow:0 8px 18px rgb(var(--theme-accent-rgb) / .26);}
.cp-g6-tag.is-gold{color:var(--campus-gold-deep);}
.cp-g6-tag.is-gold .cp-g6-tag-shape{background:var(--campus-gold-fill);box-shadow:0 8px 18px rgb(var(--campus-gold-rgb) / .32);}
`;

/** 本组页面的公共样式:feature-b 的暖金 / 浅校色 token 与通用类 + 本 kit 的类。页面渲染开头调用一次。 */
export function useFeatureDStyle() {
  useFeatureBStyle();
  useThemeStyle('campus-feature-d-kit-style', KIT_CSS);
}

/**
 * 金属与玻璃渐变(放在页面 <svg> 的 <defs> 位置):
 *   `${id}-metal-gold` / `${id}-metal-accent`   横向金属:亮暗相间的反光带(圆柱、横梁、章边)
 *   `${id}-metal-gold-v` / `${id}-metal-accent-v` 竖向金属(横梁、托盘边)
 *   `${id}-disc-gold` / `${id}-disc-accent`     圆形章面:左上高光的径向渐变
 *   `${id}-halo`                                 舞台光晕(校色径向渐隐)
 *   `${id}-shadow`                               落地阴影(中性灰径向渐隐)
 *   `${id}-sheen`                                玻璃高光(白色自上而下渐隐)
 */
export function MetalDefs({ id }) {
  const g = { hi: 'var(--campus-gold-hi)', mid: 'var(--campus-gold)', lo: 'var(--campus-gold-lo)', deep: 'var(--campus-gold-deep)' };
  const a = { hi: 'var(--campus-accent-hi)', mid: 'var(--theme-accent)', lo: 'var(--campus-accent-lo)', deep: 'var(--campus-accent-deep)' };
  const band = (key, t, vertical) => (
    <linearGradient id={`${id}-metal-${key}${vertical ? '-v' : ''}`} x1="0" y1="0" x2={vertical ? 0 : 1} y2={vertical ? 1 : 0}>
      <Stop offset="0" color={t.lo} />
      <Stop offset=".18" color={t.hi} />
      <Stop offset=".34" color={t.mid} />
      <Stop offset=".62" color={t.lo} />
      <Stop offset=".82" color={t.mid} />
      <Stop offset="1" color={t.deep} />
    </linearGradient>
  );
  const disc = (key, t) => (
    <radialGradient id={`${id}-disc-${key}`} cx=".36" cy=".3" r=".78">
      <Stop offset="0" color={t.hi} />
      <Stop offset=".45" color={t.mid} />
      <Stop offset="1" color={t.lo} />
    </radialGradient>
  );
  return (
    <defs>
      {band('gold', g, false)}
      {band('gold', g, true)}
      {band('accent', a, false)}
      {band('accent', a, true)}
      {disc('gold', g)}
      {disc('accent', a)}
      <radialGradient id={`${id}-halo`} cx=".5" cy=".5" r=".5">
        <Stop offset="0" color="var(--theme-accent)" opacity=".16" />
        <Stop offset=".55" color="var(--theme-accent)" opacity=".06" />
        <Stop offset="1" color="var(--theme-accent)" opacity="0" />
      </radialGradient>
      <radialGradient id={`${id}-shadow`} cx=".5" cy=".5" r=".5">
        <Stop offset="0" color="var(--theme-ink)" opacity=".26" />
        <Stop offset=".55" color="var(--theme-accent)" opacity=".08" />
        <Stop offset="1" color="var(--theme-accent)" opacity="0" />
      </radialGradient>
      <linearGradient id={`${id}-sheen`} x1="0" y1="0" x2="0" y2="1">
        <Stop offset="0" color="var(--theme-surface)" opacity=".7" />
        <Stop offset=".5" color="var(--theme-surface)" opacity=".12" />
        <Stop offset="1" color="var(--theme-surface)" opacity="0" />
      </linearGradient>
    </defs>
  );
}

/** 舞台光环(SVG 片段):一团校色柔光 + 两道透视椭圆细环(实线 + 虚线),压在立体图形下面。 */
export function StageHalo({ id, cx, cy, rx, ry = rx * 0.24, glow = true }) {
  return (
    <g>
      {glow ? <ellipse cx={r2(cx)} cy={r2(cy - ry * 1.6)} rx={r2(rx * 1.05)} ry={r2(rx * 0.72)} fill={`url(#${id}-halo)`} /> : null}
      <ellipse cx={r2(cx)} cy={r2(cy)} rx={r2(rx)} ry={r2(ry)} fill={`url(#${id}-shadow)`} />
      <ellipse cx={r2(cx)} cy={r2(cy)} rx={r2(rx * 0.92)} ry={r2(ry * 0.92)} fill="none" stroke="var(--theme-accent)" strokeOpacity=".22" strokeWidth="2" />
      <ellipse cx={r2(cx)} cy={r2(cy)} rx={r2(rx * 1.16)} ry={r2(ry * 1.16)} fill="none" stroke="var(--theme-accent)" strokeOpacity=".16" strokeWidth="1.5" strokeDasharray="4 10" strokeLinecap="round" />
    </g>
  );
}

/** 要点条目:编号章(旋转方块,不含文字)+ 编号 + 标题 + 说明,各段文字独立成块。 */
export function G6Point({ no, title, desc, tone = 'accent', align = 'start', className = '', style }) {
  return (
    <div className={`cp-g6-point is-${tone === 'gold' ? 'gold' : 'accent'}${align === 'end' ? ' is-end' : ''} ${className}`} style={style}>
      {no ? (
        <div className="cp-g6-point-no">
          <div className="cp-g6-point-no-ring" aria-hidden="true" />
          <div className="cp-g6-point-no-shape" aria-hidden="true" />
          <div>{no}</div>
        </div>
      ) : null}
      <div className="cp-g6-point-text">
        {title ? <div className="cp-g6-point-title">{title}</div> : null}
        {desc ? <p className="cp-g6-point-desc">{desc}</p> : null}
      </div>
    </div>
  );
}

/** 名牌胶囊。 */
export function G6Tag({ text, tone = 'accent', className = '', style }) {
  return (
    <div className={`cp-g6-tag${tone === 'gold' ? ' is-gold' : ''} ${className}`} style={style}>
      <div className="cp-g6-tag-shape" aria-hidden="true" />
      <div>{text}</div>
    </div>
  );
}

/** 两位数编号:1 → '01'。 */
export const pad2 = i => String(clamp(Math.round(safeNumber(i, 0)), 0, 99)).padStart(2, '0');

/** 绕原点旋转一个点(度,SVG 坐标系里正角度为顺时针)。 */
export function rotate(x, y, deg) {
  const rad = safeNumber(deg, 0) * Math.PI / 180;
  const c = Math.cos(rad);
  const s = Math.sin(rad);
  return { x: r2(x * c - y * s), y: r2(x * s + y * c) };
}

/** 折线路径:点列 → 'M x y L …',close 为 true 时闭合。 */
export function polyPath(points, close = true) {
  if (!points.length) return '';
  return `M ${points.map(q => `${r2(q.x)} ${r2(q.y)}`).join(' L ')}${close ? ' Z' : ''}`;
}

/**
 * 齿轮外形路径:中心 (cx, cy)、节圆半径 r、齿数 teeth、齿高 tooth、转角 phase(度,第一个齿的中心角,0 = 正上方)。
 * 每个齿是一个梯形(齿根宽、齿顶窄),齿根之间用节圆以内的圆弧相连。
 */
export function gearPath(cx, cy, r, teeth, tooth, phase = 0) {
  const n = clamp(Math.round(safeNumber(teeth, 12)), 6, 72);
  const step = 360 / n;
  const ro = r + tooth * 0.5;
  const rr = r - tooth * 0.5;
  const at = (rad, deg) => {
    const a = (deg - 90) * Math.PI / 180;
    return { x: r2(cx + rad * Math.cos(a)), y: r2(cy + rad * Math.sin(a)) };
  };
  const parts = [];
  for (let i = 0; i < n; i += 1) {
    const c = safeNumber(phase, 0) + i * step;
    const b0 = at(rr, c - step * 0.29);
    const t0 = at(ro, c - step * 0.15);
    const t1 = at(ro, c + step * 0.15);
    const b1 = at(rr, c + step * 0.29);
    const next = at(rr, c + step * 0.71);
    parts.push(`${i === 0 ? 'M' : 'L'} ${b0.x} ${b0.y} L ${t0.x} ${t0.y} A ${r2(ro)} ${r2(ro)} 0 0 1 ${t1.x} ${t1.y} L ${b1.x} ${b1.y} A ${r2(rr)} ${r2(rr)} 0 0 1 ${next.x} ${next.y}`);
  }
  return `${parts.join(' ')} Z`;
}

/** 圆的路径(可与其他路径拼成带孔的形状,配合 fill-rule="evenodd")。 */
export function circlePath(cx, cy, r) {
  const R = r2(r);
  return `M ${r2(cx - r)} ${r2(cy)} A ${R} ${R} 0 1 0 ${r2(cx + r)} ${r2(cy)} A ${R} ${R} 0 1 0 ${r2(cx - r)} ${r2(cy)} Z`;
}

/** 波纹章边:n 个圆弧凸起围成一圈(勋章外缘)。 */
export function scallopPath(cx, cy, r, bumps = 24, depth = 6) {
  const n = clamp(Math.round(safeNumber(bumps, 24)), 8, 72);
  const step = 360 / n;
  const at = (rad, deg) => {
    const a = (deg - 90) * Math.PI / 180;
    return { x: r2(cx + rad * Math.cos(a)), y: r2(cy + rad * Math.sin(a)) };
  };
  const parts = [];
  for (let i = 0; i < n; i += 1) {
    const a0 = at(r - depth, i * step);
    const mid = at(r + depth, i * step + step / 2);
    const a1 = at(r - depth, (i + 1) * step);
    parts.push(`${i === 0 ? `M ${a0.x} ${a0.y}` : ''} Q ${mid.x} ${mid.y} ${a1.x} ${a1.y}`);
  }
  return `${parts.join(' ')} Z`;
}

/**
 * 等距(isometric)方块的三个可见面:原点是顶面的最上角 (x, y),
 * a 是沿右下轴的边长、b 是沿左下轴的边长、h 是高度(像素)。返回 { top, left, right } 三组顶点。
 */
export function isoBox(x, y, a, b, h) {
  const c = 0.8660254;
  const ax = { x: a * c, y: a * 0.5 };
  const bx = { x: -b * c, y: b * 0.5 };
  const p0 = { x, y };
  const p1 = { x: x + ax.x, y: y + ax.y };
  const p2 = { x: x + ax.x + bx.x, y: y + ax.y + bx.y };
  const p3 = { x: x + bx.x, y: y + bx.y };
  const down = q => ({ x: q.x, y: q.y + h });
  return {
    top: [p0, p1, p2, p3],
    left: [p3, p2, down(p2), down(p3)],
    right: [p2, p1, down(p1), down(p2)],
    center: { x: r2((p0.x + p2.x) / 2), y: r2((p0.y + p2.y) / 2) },
  };
}
