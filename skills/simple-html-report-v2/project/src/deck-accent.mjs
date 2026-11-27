// 校色规整:用户在 goal 或预览工作台里可以任意选一个校色,主题按它派生整套色调(渐变、浅底、强调字)。
// 过浅 / 过暗 / 接近灰的颜色会让「深色块上压白字」「浅底上压校色字」看不清或整套色调发灰,
// 这里把任意输入规整成一个可用的校色。纯函数,不读 DOM:主题基座(campus 的 withCampusBase)用它决定实际校色,
// 预览工作台经浏览器运行时(window.__guardDeckAccent)用同一个函数、同一份参数给出「已自动调整为 #xxxxxx」的提示。
//
// 规整规则(spec 由主题声明,campus 的取值见 source/kit/base.jsx 的 CAMPUS_ACCENT_GUARD):
//   1. 饱和度过低(接近黑 / 白 / 灰,HSL 饱和度 < minSaturation):没有可保留的色相,换成一档带冷调的石墨蓝灰
//      (色相 neutralHue、饱和度 neutralSaturation,亮度沿用原色但落在可用区间里)。
//   2. 过暗(HSL 亮度 < minLightness):保持色相与饱和度,把亮度提到 minLightness,渐变的深浅两端才拉得开。
//   3. 过浅:主题渐变里最亮的一端是校色按通道乘以 brightFactor(上限 255),白字压在这一端上的对比度要 ≥ minContrast
//      (WCAG AA 4.5);不够时保持色相与饱和度、二分查找降低亮度,取满足要求的最亮一档。
//   满足要求的颜色原样返回(adjusted=false),评审常用的四色都不会被改动。

const DEFAULT_SPEC = Object.freeze({
  brightFactor: 1.3,
  minContrast: 4.5,
  minLightness: 0.2,
  minSaturation: 0.12,
  neutralHue: 214,
  neutralSaturation: 0.22,
});

const clamp255 = value => Math.max(0, Math.min(255, Math.round(value)));

/** '#RRGGBB'、'RRGGBB'、'#RGB'、'r g b'、'r,g,b' → [r, g, b];无法识别时返回 null。 */
export function parseRgb(value) {
  if (Array.isArray(value) && value.length === 3 && value.every(n => Number.isFinite(Number(n)))) return value.map(n => clamp255(Number(n)));
  if (typeof value !== 'string') return null;
  const text = value.trim();
  const hex6 = text.match(/^#?([0-9a-f]{6})$/i);
  if (hex6) {
    const n = parseInt(hex6[1], 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  const hex3 = text.match(/^#([0-9a-f]{3})$/i);
  if (hex3) return [...hex3[1]].map(ch => parseInt(ch + ch, 16));
  const parts = text.split(/[\s,]+/).filter(Boolean);
  if (parts.length === 3 && parts.every(part => /^\d{1,3}$/.test(part) && Number(part) <= 255)) return parts.map(Number);
  return null;
}

export const rgbToHex = rgb => `#${rgb.map(n => clamp255(n).toString(16).padStart(2, '0')).join('').toUpperCase()}`;
export const rgbToTriplet = rgb => rgb.map(clamp255).join(' ');

/** WCAG 相对亮度。 */
export function relativeLuminance(rgb) {
  const [r, g, b] = rgb.map(n => {
    const c = clamp255(n) / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG 对比度(1–21)。 */
export function contrastRatio(a, b) {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

export function rgbToHsl(rgb) {
  const [r, g, b] = rgb.map(n => clamp255(n) / 255);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h;
  if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  return [h * 60, s, l];
}

export function hslToRgb([h, s, l]) {
  const hue = ((h % 360) + 360) % 360 / 360;
  if (!s) return [l, l, l].map(v => clamp255(v * 255));
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const channel = t => {
    let x = t;
    if (x < 0) x += 1;
    if (x > 1) x -= 1;
    if (x < 1 / 6) return p + (q - p) * 6 * x;
    if (x < 1 / 2) return q;
    if (x < 2 / 3) return p + (q - p) * (2 / 3 - x) * 6;
    return p;
  };
  return [channel(hue + 1 / 3), channel(hue), channel(hue - 1 / 3)].map(v => clamp255(v * 255));
}

/** 主题渐变最亮的一端:按通道乘以 brightFactor,上限 255(与 campus 的 --campus-accent-hi 同一算法)。 */
export const brightEnd = (rgb, factor = DEFAULT_SPEC.brightFactor) => rgb.map(n => clamp255(n * factor));

const WHITE = [255, 255, 255];

/**
 * 规整校色。input 可以是 '#RRGGBB' / 'r g b' / [r, g, b];spec 见文件头(缺省取 DEFAULT_SPEC)。
 * 返回 { ok, input, hex, rgb, adjusted, reasons, contrast }:
 *   input    原色的 '#RRGGBB'(无法识别时为 null,ok=false,其余字段为 null)
 *   hex/rgb  实际使用的校色('#RRGGBB' / 'r g b')
 *   reasons  做了哪些调整:'low-saturation' | 'too-dark' | 'too-light'
 *   contrast 白字压在最亮一端上的对比度
 */
export function guardAccent(input, spec = {}) {
  const opts = { ...DEFAULT_SPEC, ...(spec || {}) };
  const source = parseRgb(input);
  if (!source) return { ok: false, input: null, hex: null, rgb: null, adjusted: false, reasons: [], contrast: null };
  const reasons = [];
  let [h, s, l] = rgbToHsl(source);
  if (s < opts.minSaturation) {
    reasons.push('low-saturation');
    h = opts.neutralHue;
    s = opts.neutralSaturation;
  }
  if (l < opts.minLightness) {
    if (!reasons.length) reasons.push('too-dark');
    l = opts.minLightness;
  }
  let rgb = reasons.length ? hslToRgb([h, s, l]) : source;
  const passes = color => contrastRatio(WHITE, brightEnd(color, opts.brightFactor)) >= opts.minContrast;
  if (!passes(rgb)) {
    reasons.push('too-light');
    // 二分查找满足对比度的最亮一档(亮度越低对比度越高,单调)
    let lo = 0;
    let hi = l;
    for (let i = 0; i < 24; i += 1) {
      const mid = (lo + hi) / 2;
      if (passes(hslToRgb([h, s, mid]))) lo = mid;
      else hi = mid;
    }
    rgb = hslToRgb([h, s, lo]);
    // 取整误差兜底:逐档压暗到达标
    for (let guard = 0; guard < 40 && !passes(rgb); guard += 1) rgb = rgb.map(n => clamp255(n - 1));
  }
  return {
    ok: true,
    input: rgbToHex(source),
    hex: rgbToHex(rgb),
    rgb: rgbToTriplet(rgb),
    adjusted: rgbToHex(rgb) !== rgbToHex(source),
    reasons,
    contrast: Math.round(contrastRatio(WHITE, brightEnd(rgb, opts.brightFactor)) * 100) / 100,
  };
}

/**
 * 校色是否落在金 / 橙 / 黄色系(与暖金点缀色糊在一起的范围):HSL 色相 18°–70° 且有一定饱和度。
 * 主题据此把点缀色换成与校色拉开的冷调(campus 的 data-campus-spark="cool")。
 */
export function isWarmAccent(input) {
  const rgb = parseRgb(input);
  if (!rgb) return false;
  const [h, s] = rgbToHsl(rgb);
  return s >= 0.3 && h >= 18 && h <= 70;
}

export const DECK_ACCENT_GUARD_DEFAULTS = DEFAULT_SPEC;
