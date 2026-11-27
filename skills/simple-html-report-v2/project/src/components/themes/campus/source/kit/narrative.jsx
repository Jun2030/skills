// campus 的「叙述骨架」页部件(g1 组):段内关键词强调、线性小图标、成对 / 汇聚连线的几何工具。
// 供研究背景、研究意义、国内外研究现状、问题 → 工作映射、目标与内容、创新点、论文结构、参考文献、致谢这组文字页共用。
//
// 与其他 kit 一样只读 token;图标与连线画在不含文字的 SVG 里(纯装饰),文字一律是独立的块级 HTML 元素。
// 页面在自己的 useThemeStyle 之前调用 useNarrativeStyle(),保证注入顺序「kit → 页面」。
import React from 'react';
import { useThemeStyle } from '../../../shared/style.jsx';
import { safeNumber, safeRatio, clamp } from '../../../chart-safety.mjs';

const NARRATIVE_CSS = `
/* —— 段内关键词强调:**词** 渲染成加粗的校色字 + 一道压在字脚的浅校色荧光笔(用下划线画,不用背景:
   行内元素带背景会让导出引擎把整段拆成逐行碎片,用下划线时整段仍导出为一个可编辑文本框) —— */
.cp-g1-em{font-weight:700;color:var(--theme-accent);text-decoration-line:underline;text-decoration-color:rgb(var(--theme-accent-rgb) / .18);text-decoration-thickness:.36em;text-underline-offset:-.2em;text-decoration-skip-ink:none;}
/* 深色 / 渐变色块上的强调:白字加粗 + 一道实色点缀色下划线(半透明的荧光笔在深色底上只剩一道灰印,看不出强调) */
.cp-g1-on-fill .cp-g1-em{color:var(--theme-on-accent);text-decoration-color:var(--campus-spark);text-decoration-thickness:.12em;text-underline-offset:.22em;}

/* —— 线性小图标(纯装饰) —— */
.cp-g1-icon{flex:none;display:block;}

/* —— 小节小标题:渐变编号块 + 衬线标题 + 渐隐线 —— */
.cp-g1-head{display:flex;align-items:center;gap:14px;}
.cp-g1-head .campus-seal{height:40px;min-width:40px;padding:0 9px;font-size:21px;border-radius:9px;}
.cp-g1-head-title{flex:none;max-width:80%;font-family:var(--theme-font-serif);font-weight:700;font-size:28px;line-height:1.25;letter-spacing:.04em;color:var(--theme-ink);}
.cp-g1-head::after{content:'';flex:1;min-width:24px;height:2px;border-radius:1px;background:var(--campus-fade-line);}
`;

export function useNarrativeStyle() {
  useThemeStyle('campus-narrative-kit-style', NARRATIVE_CSS);
}

/**
 * 段内强调的写法:正文里用 **两个星号** 包住要强调的关键词(可多处),例如
 * 「我国财务人员约 1700 万，**管理会计人才缺口约 300 万**。」
 * 渲染成 <strong class="cp-g1-em">,显示时不带星号;文本编辑把整段当一个块(行内 strong 不拆块)。
 * 外层是 p 元素时,导出 PPTX 后整段是一个可编辑文本框(导出引擎按整段取一种字样,强调词的加粗着色在 PPTX 里不保留)。
 * 没有配对的星号原样显示。返回 [{ text, em }]。
 */
export function parseEmphasis(value) {
  const text = String(value ?? '');
  const parts = [];
  const re = /\*\*([^*]+?)\*\*/g;
  let last = 0;
  let match;
  while ((match = re.exec(text))) {
    if (match.index > last) parts.push({ text: text.slice(last, match.index), em: false });
    parts.push({ text: match[1], em: true });
    last = match.index + match[0].length;
  }
  if (last < text.length) parts.push({ text: text.slice(last), em: false });
  return parts;
}

/** 去掉强调标记后的纯文本(估算字宽、判断长短用)。 */
export const plainText = value => parseEmphasis(value).map(part => part.text).join('');

/** 带段内强调的一段文字:as 是外层块级元素(默认 p),一段文案独占这个元素。 */
export function EmText({ text, as: Tag = 'p', className = '', style }) {
  useNarrativeStyle();
  const parts = parseEmphasis(text);
  return (
    <Tag className={className} style={style}>
      {parts.map((part, i) => (part.em
        ? <strong className="cp-g1-em" key={i}>{part.text}</strong>
        : <React.Fragment key={i}>{part.text}</React.Fragment>))}
    </Tag>
  );
}

/** 小节小标题:渐变编号块(no 为空时不画)+ 衬线标题 + 渐隐线。no、title 各是独立文本。 */
export function NarrHead({ no, title, className = '', style }) {
  useNarrativeStyle();
  return (
    <div className={`cp-g1-head ${className}`} style={style}>
      {no ? <div className="campus-seal">{no}</div> : null}
      <h3 className="cp-g1-head-title">{title}</h3>
    </div>
  );
}

/**
 * 线性小图标(纯装饰,stroke 用 currentColor)。
 * name:globe 地球 / pin 定位 / target 靶心 / book 书本 / cap 学位帽 / people 同伴 / heart 心 / bulb 灯泡 /
 *       flag 旗 / scale 天平 / gear 齿轮 / chart 图表 / quill 笔 / home 家 / check 对勾 /
 *       search 放大镜 / trend 上升曲线 / flask 烧瓶 / layers 图层 / shield 盾牌 / clock 时钟 / wave 波形。不认识的名字画一个小菱形。
 */
const ICON_PATHS = {
  globe: ['M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18Z', 'M3 12h18', 'M12 3c2.6 2.6 3.8 5.6 3.8 9s-1.2 6.4-3.8 9c-2.6-2.6-3.8-5.6-3.8-9S9.4 5.6 12 3Z'],
  pin: ['M12 21s-6.5-6.2-6.5-11a6.5 6.5 0 0 1 13 0c0 4.8-6.5 11-6.5 11Z', 'M12 7.4a2.6 2.6 0 1 0 0 5.2a2.6 2.6 0 1 0 0-5.2Z'],
  target: ['M12 3.5a8.5 8.5 0 1 0 8.5 8.5', 'M12 7.5a4.5 4.5 0 1 0 4.5 4.5', 'M12 12l7.5-7.5', 'M16.5 4.2v3.3h3.3'],
  book: ['M4 5.5c2.8-1.2 5.5-1.2 8 .6v13.4c-2.5-1.8-5.2-1.8-8-.6Z', 'M20 5.5c-2.8-1.2-5.5-1.2-8 .6v13.4c2.5-1.8 5.2-1.8 8-.6Z'],
  cap: ['M2.5 9.5 12 5l9.5 4.5L12 14Z', 'M6.5 11.6v4.2c1.6 1.6 3.4 2.2 5.5 2.2s3.9-.6 5.5-2.2v-4.2', 'M21.5 9.5v5'],
  people: ['M9 11a3.2 3.2 0 1 0 0-6.4a3.2 3.2 0 1 0 0 6.4Z', 'M3 19.5c.6-3.4 2.9-5.4 6-5.4s5.4 2 6 5.4', 'M15.6 5a3 3 0 0 1 0 5.8', 'M17.4 14.4c2 .6 3.2 2.3 3.6 5.1'],
  heart: ['M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.2a4.3 4.3 0 0 1 7.5 2.6C19.5 15.4 12 20 12 20Z'],
  bulb: ['M9 17.5h6', 'M10 20.5h4', 'M12 3.5a6 6 0 0 0-3.6 10.8c.4.4.6 1 .6 1.6v1.6h6v-1.6c0-.6.2-1.2.6-1.6A6 6 0 0 0 12 3.5Z'],
  flag: ['M5 21V4', 'M5 4.5c4-2 7 2 13 0v8.5c-6 2-9-2-13 0'],
  scale: ['M12 4v16', 'M7 20h10', 'M4.5 7.5h15', 'M4.5 7.5 2 13.5a2.8 2.8 0 0 0 5 0Z', 'M19.5 7.5 17 13.5a2.8 2.8 0 0 0 5 0Z'],
  gear: ['M12 8.8a3.2 3.2 0 1 0 0 6.4a3.2 3.2 0 1 0 0-6.4Z', 'M12 2.8v2.6M12 18.6v2.6M2.8 12h2.6M18.6 12h2.6M5.5 5.5l1.9 1.9M16.6 16.6l1.9 1.9M5.5 18.5l1.9-1.9M16.6 7.4l1.9-1.9'],
  chart: ['M4 20h16', 'M6.5 16.5v-5', 'M11 16.5V8', 'M15.5 16.5v-3.5', 'M19.5 5.5l-4 4-3-2.5-5 4'],
  quill: ['M19.5 4.5C12 5 7.5 9.5 6 18', 'M6 18l-1.5 2.5', 'M9.5 12.5h5', 'M19.5 4.5c-.5 6-4 9.5-10 10'],
  home: ['M3.5 11 12 4l8.5 7', 'M6 9.5V20h12V9.5', 'M10 20v-5h4v5'],
  check: ['M5 12.5l4.4 4.2L19 7'],
  // 以下为 paper-intro / figure-points 补充的图标(放大镜、上升曲线、烧瓶、图层、盾牌、时钟、波形)
  search: ['M10.5 4a6.5 6.5 0 1 0 0 13a6.5 6.5 0 1 0 0-13Z', 'M15.3 15.3 20.5 20.5'],
  trend: ['M3.5 17.5l5-5.5 3.5 3 8-8.5', 'M15 6.5h5v5'],
  flask: ['M9.5 3.5h5', 'M10.5 3.5v6L5 18.6c-.6 1 .1 2 1.2 2h11.6c1.1 0 1.8-1 1.2-2L13.5 9.5v-6', 'M7.6 14.5h8.8'],
  layers: ['M12 4 3 8.6l9 4.6 9-4.6Z', 'M3 12.6l9 4.6 9-4.6', 'M3 16.4l9 4.6 9-4.6'],
  shield: ['M12 3.2 5 6v5.6c0 4.4 3 7.6 7 9.2 4-1.6 7-4.8 7-9.2V6Z', 'M9 12l2.2 2.2L15.5 10'],
  clock: ['M12 3.5a8.5 8.5 0 1 0 0 17a8.5 8.5 0 1 0 0-17Z', 'M12 7.5V12l3 2'],
  wave: ['M2.5 12h3l2-5.5 3.5 11 3-8 2 2.5h5.5'],
};
export const NARR_ICON_NAMES = Object.freeze(Object.keys(ICON_PATHS));

export function NarrIcon({ name, size = 28, stroke = 1.8, className = '', style }) {
  const paths = ICON_PATHS[name];
  return (
    <svg className={`cp-g1-icon ${className}`} style={style} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      {paths
        ? paths.map((d, i) => <path key={i} d={d} fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" />)
        : <path d="M12 6l6 6-6 6-6-6Z" fill="currentColor" />}
    </svg>
  );
}

/**
 * 等高行的纵向中心(百分比):total 行、每行高度相同、行间距 gap(px)、整列高度 height(px)。
 * 用于把一列等高卡片与旁边 SVG 连线(viewBox 0..100,preserveAspectRatio="none")对齐。
 */
export function rowCenterPct(index, total, gap, height) {
  const n = Math.max(1, Math.round(safeNumber(total, 1)));
  const g = Math.max(0, safeNumber(gap, 0));
  const h = Math.max(1, safeNumber(height, 1));
  const rowH = Math.max(0, (h - g * (n - 1)) / n);
  const i = clamp(Math.round(safeNumber(index, 0)), 0, n - 1);
  return clamp(safeRatio(i * (rowH + g) + rowH / 2, h, 0.5) * 100, 0, 100);
}

/** 保留两位小数(几何坐标保持确定性)。 */
export const r2 = value => Math.round(safeNumber(value, 0) * 100) / 100;
