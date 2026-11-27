// campus 特色页(B 组)共用部件:立体图形的 SVG 渐变定义、几何工具(扇环、六边形、弧线箭头)、斜切标签、玻璃胶囊。
//
// 图形与文字分离:立体环、六边形、球、箭头都画在 SVG(或不含文字的 div)里,导出 PPTX 时可以整块转成图片;
// 数字、标题、说明一律是叠在图形上的独立 HTML 文本元素(水平排布),导出后仍是可编辑文本。
//
// SVG 渐变的颜色写法:<stop stop-color="currentColor"> + 行内 color 读 token。导出引擎把 SVG 克隆成独立图片时
// 只携带每个元素计算后的 color / fill / stroke 等少数属性,stop-color 若直接写 var(...) 会在独立图片里失效变黑,
// 而 currentColor 取的是克隆时写进去的计算色,浏览器里和导出后都成立。
// 渐变 id 用 React.useId 生成,同一份 deck 里同一页出现多次也不会互相串用。
import React from 'react';
import { useThemeStyle } from '../../../shared/style.jsx';
import { safeNumber, clamp } from '../../../chart-safety.mjs';
import { CAMPUS_FEATURE_B_CSS } from './base.jsx';
import { useCampusLayout } from './chrome.jsx';

const KIT_CSS = `
.cp-fb-fig{position:relative;flex:1;min-height:0;}
.cp-fb-svg{position:absolute;display:block;overflow:visible;pointer-events:none;}
.cp-fb-at{position:absolute;transform:translate(-50%,-50%);text-align:center;}

/* 斜切标签:平行四边形渐变底(不含文字)+ 叠在上面的标题文字 */
.cp-fb-slant{position:relative;isolation:isolate;display:inline-flex;align-items:center;min-height:50px;padding:6px 34px 6px 26px;color:var(--theme-on-accent);}
.cp-fb-slant-shape{position:absolute;inset:0;z-index:-1;background:var(--campus-fill);clip-path:polygon(14px 0,100% 0,calc(100% - 14px) 100%,0 100%);}
.cp-fb-slant-shade{position:absolute;z-index:-2;left:8px;right:-6px;top:6px;bottom:-6px;background:rgb(var(--theme-accent-rgb) / .2);clip-path:polygon(14px 0,100% 0,calc(100% - 14px) 100%,0 100%);}
.cp-fb-slant-text{font-weight:700;font-size:24px;line-height:1.25;letter-spacing:.06em;white-space:nowrap;}
.cp-fb-slant.is-gold{color:var(--campus-gold-deep);}
.cp-fb-slant.is-gold .cp-fb-slant-shape{background:var(--campus-gold-fill);}
.cp-fb-slant.is-gold .cp-fb-slant-shade{background:rgb(var(--campus-gold-rgb) / .28);}

/* 玻璃胶囊:白色半透明底 + 白色描边 + 柔和投影,压在浅底上的小标签 */
.cp-fb-pill{position:relative;isolation:isolate;display:inline-flex;align-items:center;justify-content:center;height:46px;padding:0 24px;border-radius:999px;color:var(--theme-accent);font-weight:700;font-size:21px;letter-spacing:.1em;white-space:nowrap;}
.cp-fb-pill::before{content:'';position:absolute;inset:0;z-index:-1;border-radius:inherit;background:var(--theme-surface);border:1.5px solid var(--campus-accent-line);box-shadow:0 8px 18px rgb(var(--theme-accent-rgb) / .14);}
.cp-fb-pill.is-gold{color:var(--campus-gold-ink);}
.cp-fb-pill.is-gold::before{border-color:var(--campus-gold-line);box-shadow:0 8px 18px rgb(var(--campus-gold-rgb) / .2);}
`;

/** 特色页公共样式:暖金 token(base.jsx 末尾的 feature-b 区块)+ 本 kit 的通用类。 */
export function useFeatureBStyle() {
  useThemeStyle('campus-feature-b-token-style', CAMPUS_FEATURE_B_CSS);
  useThemeStyle('campus-feature-b-kit-style', KIT_CSS);
}

/** 保留两位小数,保证 SSR 结果在不同平台逐字节一致。 */
export const r2 = value => Math.round(safeNumber(value, 0) * 100) / 100;

/** 页内唯一、可用作 SVG id 的前缀。 */
export function useSvgId(prefix) {
  const raw = React.useId();
  return `${prefix}-${String(raw).replace(/[^a-zA-Z0-9]/g, '')}`;
}

/** 渐变色标:颜色经 currentColor 读 token(见文件头说明)。 */
export function Stop({ offset, color, opacity = 1 }) {
  return <stop offset={offset} stopColor="currentColor" stopOpacity={opacity} style={{ color }} />;
}

/**
 * 立体图形的三种色调。每种有受光面(hi)、本色(mid)、背光面(lo)、侧壁暗部(deep)。
 *   accent 校色;gold 暖金(第二色);mist 按白色稀释的浅校色(玻璃感的浅色块)。
 */
export const FB_TONES = Object.freeze({
  accent: { hi: 'var(--campus-accent-hi)', mid: 'var(--theme-accent)', lo: 'var(--campus-accent-lo)', deep: 'var(--campus-accent-deep)' },
  gold: { hi: 'var(--campus-gold-hi)', mid: 'var(--campus-gold)', lo: 'var(--campus-gold-lo)', deep: 'var(--campus-gold-deep)' },
  mist: { hi: 'var(--campus-fb-accent-mist)', mid: 'var(--campus-accent-hi)', lo: 'var(--theme-accent)', deep: 'var(--campus-accent-lo)' },
});
export const toneOf = name => (FB_TONES[name] ? name : 'accent');

/**
 * 每种色调的一组渐变:
 *   `${id}-${tone}-face`  正面色块(135°,与 --campus-fill 同向:暗端左上、亮端右下);纯色填充风格(brand.fill='solid')时退成本色
 *   `${id}-${tone}-side`  侧壁(竖向,本色 → 暗部)
 *   `${id}-${tone}-edge`  高光描边(左上亮、右下透明)
 * 以及与色调无关的 `${id}-gloss`(顶部白色光泽)和 `${id}-floor`(落地阴影)。
 */
export function ToneDefs({ id, tones = ['accent', 'gold'] }) {
  const { fill } = useCampusLayout();
  const solid = fill === 'solid';
  return (
    <defs>
      {tones.map(name => {
        const t = FB_TONES[toneOf(name)];
        return (
          <React.Fragment key={name}>
            <linearGradient id={`${id}-${name}-face`} x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" color={solid ? t.mid : t.lo} />
              <Stop offset=".5" color={t.mid} />
              <Stop offset="1" color={solid ? t.mid : t.hi} />
            </linearGradient>
            <linearGradient id={`${id}-${name}-side`} x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" color={t.lo} />
              <Stop offset="1" color={t.deep} />
            </linearGradient>
            <linearGradient id={`${id}-${name}-edge`} x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" color="var(--theme-surface)" opacity=".95" />
              <Stop offset=".55" color="var(--theme-surface)" opacity=".25" />
              <Stop offset="1" color="var(--theme-surface)" opacity="0" />
            </linearGradient>
          </React.Fragment>
        );
      })}
      <linearGradient id={`${id}-gloss`} x1="0" y1="0" x2="0" y2="1">
        <Stop offset="0" color="var(--theme-surface)" opacity=".55" />
        <Stop offset=".45" color="var(--theme-surface)" opacity=".08" />
        <Stop offset="1" color="var(--theme-surface)" opacity="0" />
      </linearGradient>
      <radialGradient id={`${id}-spot`} cx=".5" cy=".5" r=".5">
        <Stop offset="0" color="var(--theme-surface)" opacity=".42" />
        <Stop offset="1" color="var(--theme-surface)" opacity="0" />
      </radialGradient>
      <radialGradient id={`${id}-floor`} cx=".5" cy=".5" r=".5">
        <Stop offset="0" color="var(--theme-accent)" opacity=".3" />
        <Stop offset=".6" color="var(--theme-accent)" opacity=".08" />
        <Stop offset="1" color="var(--theme-accent)" opacity="0" />
      </radialGradient>
    </defs>
  );
}

/** 极坐标:角度 0 = 正上方,顺时针。 */
export function pt(cx, cy, r, deg) {
  const rad = (safeNumber(deg, 0) - 90) * Math.PI / 180;
  return { x: r2(cx + r * Math.cos(rad)), y: r2(cy + r * Math.sin(rad)) };
}

/** 扇环路径:圆心 (cx, cy),外半径 ro、内半径 ri,从 a0 顺时针到 a1(度)。 */
export function sectorPath(cx, cy, ro, ri, a0, a1) {
  const span = clamp(safeNumber(a1, 0) - safeNumber(a0, 0), 0.01, 359.9);
  const large = span > 180 ? 1 : 0;
  const p1 = pt(cx, cy, ro, a0);
  const p2 = pt(cx, cy, ro, a0 + span);
  const p3 = pt(cx, cy, ri, a0 + span);
  const p4 = pt(cx, cy, ri, a0);
  return `M ${p1.x} ${p1.y} A ${r2(ro)} ${r2(ro)} 0 ${large} 1 ${p2.x} ${p2.y} L ${p3.x} ${p3.y} A ${r2(ri)} ${r2(ri)} 0 ${large} 0 ${p4.x} ${p4.y} Z`;
}

/** 圆弧路径(只有线):半径 r,从 a0 顺时针到 a1。 */
export function arcPath(cx, cy, r, a0, a1) {
  const span = clamp(safeNumber(a1, 0) - safeNumber(a0, 0), 0.01, 359.9);
  const p1 = pt(cx, cy, r, a0);
  const p2 = pt(cx, cy, r, a0 + span);
  return `M ${p1.x} ${p1.y} A ${r2(r)} ${r2(r)} 0 ${span > 180 ? 1 : 0} 1 ${p2.x} ${p2.y}`;
}

/** 圆弧端点的小箭头:在角度 deg 处沿切线方向(dir=1 顺时针,-1 逆时针)画一个三角形。 */
export function arcHead(cx, cy, r, deg, dir = 1, size = 11) {
  const rad = (safeNumber(deg, 0) - 90) * Math.PI / 180;
  const tx = -Math.sin(rad) * dir;
  const ty = Math.cos(rad) * dir;
  const p = pt(cx, cy, r, deg);
  const tip = { x: r2(p.x + tx * size), y: r2(p.y + ty * size) };
  const back = { x: p.x - tx * size * 0.6, y: p.y - ty * size * 0.6 };
  const a = { x: r2(back.x - ty * size * 0.8), y: r2(back.y + tx * size * 0.8) };
  const b = { x: r2(back.x + ty * size * 0.8), y: r2(back.y - tx * size * 0.8) };
  return `${tip.x},${tip.y} ${a.x},${a.y} ${b.x},${b.y}`;
}

/**
 * 六边形顶点。flat=false 尖顶朝上(顶点在 -90°、-30°…),flat=true 平顶(顶点在 0°、60°…,左右是尖角)。
 * 返回 [{x,y}…],从最上(或最右)开始顺时针。
 */
export function hexPoints(cx, cy, r, flat = false) {
  const start = flat ? 0 : -90;
  return Array.from({ length: 6 }, (_, i) => {
    const rad = (start + i * 60) * Math.PI / 180;
    return { x: r2(cx + r * Math.cos(rad)), y: r2(cy + r * Math.sin(rad)) };
  });
}

/** 圆角六边形路径:在每个顶点处用二次曲线倒角,radius 为倒角长度。 */
export function roundedPolyPath(points, radius = 10) {
  const n = points.length;
  if (!n) return '';
  const parts = [];
  for (let i = 0; i < n; i += 1) {
    const prev = points[(i - 1 + n) % n];
    const cur = points[i];
    const next = points[(i + 1) % n];
    const d1 = Math.max(1, Math.hypot(cur.x - prev.x, cur.y - prev.y));
    const d2 = Math.max(1, Math.hypot(next.x - cur.x, next.y - cur.y));
    const k1 = Math.min(radius, d1 / 2) / d1;
    const k2 = Math.min(radius, d2 / 2) / d2;
    const a = { x: r2(cur.x + (prev.x - cur.x) * k1), y: r2(cur.y + (prev.y - cur.y) * k1) };
    const b = { x: r2(cur.x + (next.x - cur.x) * k2), y: r2(cur.y + (next.y - cur.y) * k2) };
    parts.push(`${i === 0 ? 'M' : 'L'} ${a.x} ${a.y} Q ${cur.x} ${cur.y} ${b.x} ${b.y}`);
  }
  return `${parts.join(' ')} Z`;
}

/**
 * 立体六边柱(SVG 片段,放在含 ToneDefs 的 <svg> 里):顶面渐变 + 光泽 + 内描边,向下挤出 depth 的侧壁。
 * 侧壁只画朝下的几个面,朝左的面比朝右的面亮,模拟左上方来光。glass 为 true 时整体略透明,叠在一起有玻璃感。
 */
export function HexPrism({ id, cx, cy, r, depth, tone = 'accent', flat = false, glass = true, corner = 10 }) {
  const t = toneOf(tone);
  const top = hexPoints(cx, cy, r, flat);
  const faces = top.map((a, i) => {
    const b = top[(i + 1) % 6];
    const nx = b.y - a.y;
    const ny = -(b.x - a.x);
    if (ny <= 0.01) return null;
    const pts = [a, b, { x: b.x, y: r2(b.y + depth) }, { x: a.x, y: r2(a.y + depth) }];
    const lit = nx < -0.01 ? 0.22 : nx > 0.01 ? 0 : 0.1;
    return { d: `M ${pts.map(q => `${q.x} ${q.y}`).join(' L ')} Z`, lit, key: i };
  }).filter(Boolean);
  const inner = hexPoints(cx, cy, r * 0.84, flat);
  const c = { x: r2(cx), y: r2(cy) };
  const facetA = flat ? [top[3], top[4], c] : [top[5], top[0], c];
  const facetB = flat ? [top[4], top[5], c] : [top[0], top[1], c];
  const tri = list => `M ${list.map(q => `${q.x} ${q.y}`).join(' L ')} Z`;
  return (
    <g opacity={glass ? 0.96 : 1}>
      <ellipse cx={r2(cx + r * 0.08)} cy={r2(cy + r * (flat ? 0.87 : 1) + depth + 8)} rx={r2(r * 1.05)} ry={r2(r * 0.16)} fill={`url(#${id}-floor)`} />
      {faces.map(f => (
        <g key={f.key}>
          <path d={f.d} fill={`url(#${id}-${t}-side)`} fillOpacity={glass ? 0.7 : 1} />
          {f.lit ? <path d={f.d} fill="var(--theme-surface)" fillOpacity={f.lit} /> : null}
        </g>
      ))}
      {glass ? faces.map(f => <path key={`g${f.key}`} d={f.d} fill={`url(#${id}-gloss)`} fillOpacity=".6" />) : null}
      {top.filter(q => q.y > cy + r * 0.3).map((q, i) => (
        <line key={`e${i}`} x1={q.x} y1={q.y} x2={q.x} y2={r2(q.y + depth)} stroke="var(--theme-surface)" strokeOpacity=".55" strokeWidth="2" />
      ))}
      <path d={roundedPolyPath(top, corner)} fill={`url(#${id}-${t}-face)`} />
      {glass ? <path d={roundedPolyPath(top, corner)} fill="var(--theme-surface)" fillOpacity=".1" /> : null}
      {glass ? <ellipse cx={r2(cx - r * 0.24)} cy={r2(cy - r * 0.36)} rx={r2(r * 0.42)} ry={r2(r * 0.26)} fill={`url(#${id}-spot)`} /> : null}
      <path d={tri(facetA)} fill="var(--theme-surface)" fillOpacity=".16" />
      <path d={tri(facetB)} fill="var(--theme-surface)" fillOpacity=".07" />
      <path d={roundedPolyPath(top, corner)} fill={`url(#${id}-gloss)`} />
      <path d={roundedPolyPath(inner, corner * 0.8)} fill="none" stroke="var(--theme-surface)" strokeOpacity=".42" strokeWidth="1.5" />
      <path d={roundedPolyPath(top, corner)} fill="none" stroke={`url(#${id}-${t}-edge)`} strokeWidth="3" />
    </g>
  );
}

/** 斜切标签:平行四边形渐变底 + 标题;tone='gold' 用暖金。标题是独立的可编辑文本块。 */
export function SlantTag({ text, tone = 'accent', className = '', style }) {
  useFeatureBStyle();
  return (
    <div className={`cp-fb-slant${tone === 'gold' ? ' is-gold' : ''} ${className}`} style={style}>
      <div className="cp-fb-slant-shade" aria-hidden="true" />
      <div className="cp-fb-slant-shape" aria-hidden="true" />
      <div className="cp-fb-slant-text">{text}</div>
    </div>
  );
}

/** 玻璃胶囊小标签。 */
export function GlassPill({ text, tone = 'accent', className = '', style }) {
  useFeatureBStyle();
  return <div className={`cp-fb-pill${tone === 'gold' ? ' is-gold' : ''} ${className}`} style={style}>{text}</div>;
}
