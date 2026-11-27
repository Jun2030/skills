// campus 的页面外壳与通用部件:导航栏(10 种可替换样式)、标题行(3 种装饰)、底部结论条、页脚页码。
// 页面只组合这些部件,不各自实现页眉页脚;卡片、标签、数字等通用样式类在 base.jsx 里,序号卡片在 parts.jsx 里。
//
// 导航样式、填充风格、标题装饰都是 deck 级开关(goal 的 brand.nav / brand.fill / brand.titleStyle),
// 由 base.jsx 写到主题根节点的 data-campus-* 属性上,这里的部件按它渲染,页面不需要关心。
import React from 'react';
import { useThemeStyle } from '../../../shared/style.jsx';
import { DeckPageNumber } from '../../../runtime-helpers.jsx';
import { useDeckBrand, deckBrandStyle } from '../../../shared/DeckBrand.jsx';
import { safeArray, clamp, safeNumber } from '../../../chart-safety.mjs';
import { campusSchool, schoolLogos } from '../schools/registry.mjs';

// 学校信息是整份 deck 共用的数据(校名、校徽、页眉页脚文字、章节导航),不属于任何一页的 props。
// goal.json 的 brand 字段经 shared/DeckBrand.jsx 提供;这里是 goal 没写某个字段时的兜底值。
export const CAMPUS_BRAND_DEFAULTS = Object.freeze({
  name: '南昌项目汇报',
  nameEn: 'NANCHANG PROJECT BRIEFING',
  mark: '昌',
  logo: null,
  // 只在有校徽图片时起作用:LOGO 已包含校名(页眉只显示 LOGO)、深色页眉上给 LOGO 垫白色底板
  logoHasName: false,
  logoPlate: true,
  headerNote: 'CITY SIGNAL · PROJECT BRIEFING',
  footerNote: '南昌主题 · 项目汇报',
  // 页眉的章节标签是每页固定的部分:goal 没写 brand.chapters 时用这组通用章节名占位,不让页眉空着。
  chapters: ['现状扫描', '关键进展', '风险判断', '行动计划'],
});

export const useCampusBrand = () => useDeckBrand(CAMPUS_BRAND_DEFAULTS);

// 页脚说明的占位部分(主题默认值「学校名称 · 学院名称」的后半段;只写了校名时跟随规则得到「<校名> · 学院名称」)
const FOOTER_UNIT_PLACEHOLDER = /\s*[·•|｜]\s*学院名称\s*$/;

/**
 * 正文页页脚说明。选了学校(brand.school)、页脚还带着「学院名称」占位(goal 没写 footerNote)时:
 * 封面写了单位(deck 级封面信息 brand.cover.unit)→「<校名> · <单位>」,没写 → 只显示校名。不选学校时原样显示。
 */
export function campusFooterNote(brand) {
  const note = String(brand?.footerNote ?? '');
  if (!campusSchool(brand?.school) || !FOOTER_UNIT_PLACEHOLDER.test(note)) return note;
  const head = note.replace(FOOTER_UNIT_PLACEHOLDER, '');
  const unit = String(brand?.cover?.unit ?? '').trim();
  return unit ? `${head} · ${unit}` : head;
}

/**
 * 内容区(正文区)约定:各导航样式下正文区在 1920×1080 舞台上的位置。只有三种盒子,新增导航样式一律复用其中之一。
 * 与 base.jsx 里 .campus[data-campus-nav] 的 --campus-body-* 变量一一对应,改一处必须同步另一处。
 *   顶部导航(tabs / band / slant / underline / cells / folder / solid / steps)  正文区 1760×886(base.jsx 的默认值)
 *   inline       页眉变薄(章节导航并进标题行),正文区 1760×902
 *   rail         左侧竖栏,正文区 1580×960(更窄、更高)
 */
export const CAMPUS_STAGE = Object.freeze({ w: 1920, h: 1080 });
const TOP_BOX = Object.freeze({ top: 128, left: 80, right: 80, bottom: 66 });
const NAV_BODY = Object.freeze({
  tabs: TOP_BOX,
  band: TOP_BOX,
  slant: TOP_BOX,
  underline: TOP_BOX,
  cells: TOP_BOX,
  folder: TOP_BOX,
  solid: TOP_BOX,
  steps: TOP_BOX,
  inline: Object.freeze({ top: 112, left: 80, right: 80, bottom: 66 }),
  rail: Object.freeze({ top: 54, left: 268, right: 72, bottom: 66 }),
});
/** 第二批顶部导航样式(共用 TopNav 骨架,各自的形状只在 CSS 里不同)。 */
export const TOP_NAV_STYLES = Object.freeze(['slant', 'underline', 'cells', 'folder', 'solid', 'steps']);
/** 标题行占用的高度(行高 + 下边距)与底部结论条占用的高度(单行时的最小高度 + 上边距)。 */
export const TITLE_ROW_SPACE = 86;
export const CONCLUSION_SPACE = 98;

/**
 * 读 deck 级外观开关与正文区尺寸。按固定尺寸计算几何的页面(中心辐射、甘特等)用 bodyW / bodyH,
 * 不要写死 1760 之类的数值:左侧竖栏导航下正文区更窄、更高。
 * 返回 { nav, fill, titleStyle, bodyW, bodyH }。
 */
export function useCampusLayout() {
  const brand = useCampusBrand();
  const nav = deckBrandStyle(brand, 'nav');
  const box = NAV_BODY[nav] || TOP_BOX;
  return {
    nav,
    fill: deckBrandStyle(brand, 'fill'),
    titleStyle: deckBrandStyle(brand, 'titleStyle'),
    bodyW: CAMPUS_STAGE.w - box.left - box.right,
    bodyH: CAMPUS_STAGE.h - box.top - box.bottom,
  };
}

// deck 级文字(校名、页眉页脚说明、章节名)不是某一页的文案,不参与逐页文本编辑。
// 这个标记只对元素自身生效,所以要打在每个文字元素上,而不是它们的容器上。
export const DECK_LEVEL_TEXT = Object.freeze({ 'data-editable-skip': 'true' });

/** 页面声明的「当前第几章」控件(1 起)换成章节下标;没有章节时返回 -1。 */
export function chapterSlot(chapters, chapterIndex) {
  const list = safeArray(chapters);
  if (!list.length) return -1;
  return clamp(Math.round(safeNumber(chapterIndex, 1)), 1, list.length) - 1;
}

/** 所有带页眉的页面共用的「当前章节」控件声明。 */
export const CHAPTER_CONTROL = Object.freeze({
  key: 'chapterIndex',
  type: 'number',
  label: '当前章节',
  default: 1,
  min: 1,
  max: 8,
  description: '页眉章节导航里高亮第几章;章节名称取自整份演示稿的章节设置,没有设置章节时不显示导航。',
});

// 外壳把当前章节交给标题行(标题行内嵌式导航要用)。
const FrameContext = React.createContext({ chapterIndex: 1 });

const pad2 = i => String(i + 1).padStart(2, '0');

/**
 * 文字宽度估算(单位 em):汉字和全角符号按 1,其余按 0.58,空格按 0.3。
 * 导航用它在渲染时决定长章名 / 长标题下的降级方式(静态渲染没有排版结果可量)。
 */
const WIDE_CHAR = /[ᄀ-ᅟ⺀-〾ぁ-㏿㐀-䶿一-鿿ꥠ-꥿가-힣豈-﫿︰-﹏＀-｠￠-￦]/;
export function textWidthEm(text) {
  let w = 0;
  for (const ch of Array.from(String(text ?? ''))) w += WIDE_CHAR.test(ch) ? 1 : ch === ' ' ? 0.3 : 0.58;
  return w;
}
const textWidthPx = (text, size, tracking = 0) => {
  const chars = Array.from(String(text ?? '')).length;
  return textWidthEm(text) * size + chars * tracking * size;
};
/** 竖栏导航:任一章名达到 7 个汉字宽时整列切换到长章名排法(见 CSS 的 .campus-rail-nav.is-long)。 */
const RAIL_LONG_EM = 6.5;

/**
 * 标题行内嵌导航的排法:'full' 全部章节显示「编号 + 章名」;'compact' 只有当前章显示章名、其余只显示编号;
 * 'current' 只保留当前章一个胶囊。按标题、编号装饰和章节胶囊的估算宽度,取正文区宽度内放得下的第一档。
 * 数值与 CHROME_CSS 里 .campus-title-row / .campus-inline-* 的尺寸对应,改样式时同步这里。
 */
export function inlineNavFit({ title, no, titleStyle, chapters, chapterIndex, bodyW, extra = 0 }) {
  const list = safeArray(chapters);
  if (!list.length) return 'full';
  const current = chapterSlot(list, chapterIndex);
  const many = list.length > 5;
  const nameSize = many ? 17 : 19;
  const itemPad = many ? 24 : 36;
  const numW = 20;
  const nameW = name => textWidthPx(name, nameSize, 0.04);
  const fullItem = name => itemPad + numW + 8 + nameW(name);
  const navFrame = 24 + 10;
  const gaps = (list.length - 1) * 2;
  const full = navFrame + gaps + list.reduce((s, name) => s + fullItem(name), 0);
  const compact = navFrame + gaps + list.reduce((s, name, i) => s + (i === current ? fullItem(name) : 28 + numW), 0);
  const single = navFrame + fullItem(list[current]);
  const noLen = Array.from(String(no ?? '')).length;
  const mark = !no ? 0 : titleStyle === 'bar' ? 49 + 24 * noLen : titleStyle === 'wing' ? 72 : 100 + 18 * noLen;
  // 标题(46px 衬线 + .04em 字距)、行内间距 20px × 3、延伸线至少留 60px
  const used = mark + textWidthPx(title, 46, 0.04) + 60 + 60 + extra;
  const room = bodyW - used;
  if (full <= room) return 'full';
  if (compact <= room) return 'compact';
  return 'current';
}

/**
 * 顶部导航(TOP_NAV_STYLES)的排法:'full' 正常字号;'tight' 收小字号与留白;'compact' 只有当前章显示章名、其余章只留编号。
 * 按校徽校名与章节条目的估算宽度取放得下的第一档。数值与 CHROME_CSS 里 .campus-top 的尺寸对应,改样式时同步这里。
 */
const TOP_NAV_METRICS = Object.freeze({
  //            条目左右留白合计  条目间距  导航外框   只留编号时的条目宽   额外占用(页签、轨道等)
  slant: { pad: 62, gap: -4, frame: 8, compact: 58, extra: 0 },
  underline: { pad: 48, gap: 0, frame: 0, compact: 52, extra: 0 },
  cells: { pad: 52, gap: 4, frame: 0, compact: 56, extra: 0, equal: true },
  folder: { pad: 44, gap: 2, frame: 0, compact: 50, extra: 96 },
  solid: { pad: 48, gap: 0, frame: 14, compact: 54, extra: 0 },
  steps: { pad: 44, gap: 34, frame: 0, compact: 40, extra: 0 },
});
const NAME_MAX_EM = 10;
const CURRENT_NAME_MAX_EM = 14;
/**
 * 校名字号档位:按校名的估算宽度(em)缩小字号与字距,长校名(10 个字以上)、长英文名在各导航里都不溢出。
 * 返回 { scale, en },scale 乘在各处校名的基础字号上(CSS 变量 --cb-scale),en 是英文名的档位(''、'is-en-long'、'is-en-xlong')。
 */
export function brandNameFit(brand) {
  const em = textWidthEm(brand?.name);
  const scale = em > 9.5 ? 0.76 : em > 7.5 ? 0.84 : em > 6.5 ? 0.92 : 1;
  const enChars = Array.from(String(brand?.nameEn ?? '')).length;
  const en = enChars > 36 ? 'is-en-xlong' : enChars > 24 ? 'is-en-long' : '';
  return { scale, en };
}
/** 校徽图片在页眉里的最大尺寸:与文字校名并排时按校徽处理(高 60、宽不超过 120);LOGO 已含校名时按组合标处理(高 64、宽不超过 300)。 */
export const BRAND_LOGO_BOX = Object.freeze({
  emblem: { h: 60, w: 120 },
  full: { h: 64, w: 300 },
  stackEmblem: { h: 64, w: 150 },
  stackFull: { h: 92, w: 164 },
});
/** 校徽校名占用的宽度估算(顶部导航据此决定章节的排法)。校徽图片按最大宽度计。 */
export function brandWidthPx(brand) {
  const { logo, logoHasName, plateAllowed } = brandLogo(brand || {}, 'default');
  if (logo && logoHasName) return BRAND_LOGO_BOX.full.w + (plateAllowed ? 16 : 0);
  const { scale, en } = brandNameFit(brand);
  const name = textWidthPx(brand?.name, 28 * scale, scale < 1 ? 0.04 : 0.08);
  const enSize = en === 'is-en-xlong' ? 10 : en === 'is-en-long' ? 11 : 12;
  const enTrack = en === 'is-en-xlong' ? 0.06 : en === 'is-en-long' ? 0.1 : 0.18;
  const enW = Array.from(String(brand?.nameEn ?? '')).length * enSize * (0.62 + enTrack);
  const markW = logo ? BRAND_LOGO_BOX.emblem.w : 58;
  return markW + 16 + Math.max(name, enW);
}
export function topNavFit({ nav, chapters, chapterIndex, brand }) {
  const metrics = TOP_NAV_METRICS[nav];
  const list = safeArray(chapters);
  if (!metrics || !list.length) return 'full';
  const current = chapterSlot(list, chapterIndex);
  const room = CAMPUS_STAGE.w - 160 - brandWidthPx(brand) - 40 - metrics.extra;
  const numW = 30;
  const itemW = (name, size, i) => metrics.pad + numW + Math.min(textWidthPx(name, size, 0.05), (i === current ? CURRENT_NAME_MAX_EM : NAME_MAX_EM) * size);
  const total = widths => metrics.frame + (list.length - 1) * metrics.gap
    + (metrics.equal ? Math.max(...widths) * widths.length : widths.reduce((a, b) => a + b, 0));
  const fullSize = list.length > 5 ? 19 : 20;
  if (total(list.map((name, i) => itemW(name, fullSize, i))) <= room) return 'full';
  if (total(list.map((name, i) => itemW(name, 17, i))) <= room) return 'tight';
  return 'compact';
}

const CHROME_CSS = `
.campus-frame{position:absolute;inset:0;}

/* —— 校徽校名 —— */
.campus-brand{--cb-scale:1;flex:none;display:flex;align-items:center;gap:16px;min-width:0;color:var(--theme-accent);}
.campus-brand-mark{position:relative;flex:none;width:58px;height:58px;border-radius:50%;display:grid;place-items:center;background:var(--campus-fill);color:var(--theme-on-accent);box-shadow:0 6px 16px rgb(var(--theme-accent-rgb) / .28);font-family:var(--theme-font-serif);font-weight:700;font-size:17px;letter-spacing:.02em;line-height:1;}
.campus-brand-mark.is-single{font-size:27px;}
.campus-brand-ring{position:absolute;inset:-6px;border-radius:50%;border:1.5px solid var(--campus-accent-line);pointer-events:none;}
/* 校徽图片:按图片原比例算好宽高(CampusLogo),不裁切不拉伸;导出 PPTX 时图片框与图片同比例 */
.campus-brand-logo{position:relative;flex:none;display:flex;align-items:center;justify-content:center;}
.campus-brand-logo img{position:relative;display:block;object-fit:contain;}
/* 深色页眉上的白色圆角底板:底板是不含文字的独立元素,LOGO 叠在上面 */
.campus-brand-plate{position:absolute;inset:-7px -9px;border-radius:12px;background:var(--theme-surface);box-shadow:0 4px 12px rgb(0 0 0 / .14);pointer-events:none;}
.campus-brand-text{min-width:0;}
.campus-brand-name{font-family:var(--theme-font-serif);font-weight:700;font-size:calc(28px * var(--cb-scale));line-height:1.1;letter-spacing:.08em;white-space:nowrap;}
.campus-brand-en{margin-top:6px;font-size:12px;line-height:1;letter-spacing:.18em;font-weight:600;color:var(--theme-faint);white-space:nowrap;}
.campus-brand.is-name-long .campus-brand-name{letter-spacing:.04em;}
.campus-brand.is-en-long .campus-brand-en{font-size:11px;letter-spacing:.1em;}
.campus-brand.is-en-xlong .campus-brand-en{font-size:10px;letter-spacing:.06em;}
.campus-brand.is-inverse{color:var(--theme-on-accent);}
.campus-brand.is-inverse .campus-brand-mark{background:var(--campus-on-accent-glass);box-shadow:none;}
.campus-brand.is-inverse .campus-brand-ring{border-color:var(--campus-on-accent-line);}
.campus-brand.is-inverse .campus-brand-en{color:var(--campus-on-accent-muted);}
.campus-brand.has-plate{gap:24px;}
.campus-brand.is-stack{flex-direction:column;gap:14px;text-align:center;}
.campus-brand.is-stack .campus-brand-mark{width:64px;height:64px;}
.campus-brand.is-stack .campus-brand-text{max-width:176px;}
.campus-brand.is-stack .campus-brand-name{font-size:calc(24px * var(--cb-scale));letter-spacing:.1em;white-space:normal;text-wrap:balance;line-height:1.2;}
.campus-brand.is-stack.is-name-long .campus-brand-name{letter-spacing:.02em;}
.campus-brand.is-stack .campus-brand-en{font-size:10px;letter-spacing:.12em;white-space:normal;text-wrap:balance;line-height:1.35;}
.campus-brand.is-stack.is-en-long .campus-brand-en,.campus-brand.is-stack.is-en-xlong .campus-brand-en{font-size:9px;letter-spacing:.06em;}
.campus-brand.is-stack.has-plate{gap:20px;}

/* —— 导航 1:顶部标签(默认)。白色玻璃页眉 + 顶边校色渐变线;章节放在浅校色胶囊轨道里,当前章是渐变胶囊 —— */
.campus-header{position:absolute;z-index:3;top:0;left:0;right:0;height:var(--campus-header-h);display:flex;align-items:center;justify-content:space-between;gap:48px;padding:0 var(--campus-pad-x);background:linear-gradient(180deg,rgb(255 255 255 / .8) 0%,rgb(255 255 255 / .96) 100%);box-shadow:0 8px 28px rgb(var(--theme-accent-rgb) / .07);}
.campus-header-line{position:absolute;left:0;right:0;top:0;height:5px;background:var(--campus-fill);}
.campus-header-note{display:flex;align-items:center;gap:14px;font-size:16px;letter-spacing:.24em;font-weight:600;color:var(--theme-faint);white-space:nowrap;}
.campus-tabs{flex:0 1 auto;min-width:0;display:flex;align-items:center;gap:4px;padding:6px;border-radius:999px;background:rgb(var(--theme-accent-rgb) / .06);}
.campus-tab{flex:0 1 auto;min-width:0;display:flex;align-items:center;gap:10px;height:50px;padding:0 24px;border-radius:999px;color:var(--theme-muted);white-space:nowrap;}
.campus-tab-no{font-family:var(--theme-font-serif);font-weight:700;font-size:17px;line-height:1;color:var(--campus-accent-soft);font-variant-numeric:lining-nums;}
.campus-tab-name{font-size:21px;line-height:1;font-weight:500;letter-spacing:.06em;overflow:hidden;text-overflow:ellipsis;}
.campus-tab.is-current{background:var(--campus-fill);color:var(--theme-on-accent);box-shadow:var(--campus-shadow-lift);}
.campus-tab.is-current .campus-tab-no{color:var(--campus-spark);}
.campus-tab.is-current .campus-tab-name{font-weight:700;}
.campus-tabs.is-many .campus-tab{padding:0 16px;gap:8px;}
.campus-tabs.is-many .campus-tab-name{font-size:19px;}

/* —— 导航 2:顶部通栏色条。整条渐变色条,校徽在左,章节项在右;当前章是一张与页面底色相连的「页签」 —— */
.campus-band{position:absolute;z-index:3;top:0;left:0;right:0;height:var(--campus-header-h);display:flex;align-items:stretch;justify-content:space-between;gap:40px;padding:0 var(--campus-pad-x);background:var(--campus-fill-deep);color:var(--theme-on-accent);box-shadow:0 10px 30px rgb(var(--theme-accent-rgb) / .2);overflow:hidden;}
.campus-band > .campus-brand{align-self:center;}
.campus-band-orb{position:absolute;border-radius:50%;background:rgb(255 255 255 / .07);pointer-events:none;}
.campus-band-nav{position:relative;flex:0 1 auto;min-width:0;display:flex;align-items:stretch;}
.campus-band-item{position:relative;flex:0 1 auto;min-width:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:7px;padding:10px 30px 0;color:var(--campus-on-accent-muted);white-space:nowrap;}
.campus-band-item + .campus-band-item::before{content:'';position:absolute;left:0;top:30px;bottom:22px;width:1px;background:var(--campus-on-accent-line);}
.campus-band-no{font-family:var(--theme-font-serif);font-weight:700;font-size:17px;line-height:1;letter-spacing:.06em;font-variant-numeric:lining-nums;}
.campus-band-name{font-size:21px;line-height:1;font-weight:500;letter-spacing:.06em;overflow:hidden;text-overflow:ellipsis;}
.campus-band-item.is-current{color:var(--theme-accent);}
.campus-band-item.is-current::before,.campus-band-item.is-current + .campus-band-item::before{display:none;}
.campus-band-tab{position:absolute;z-index:-1;left:0;right:0;top:16px;bottom:0;border-radius:16px 16px 0 0;background:var(--theme-bg);}
.campus-band-item.is-current .campus-band-no{color:var(--campus-spark);}
.campus-band-item.is-current .campus-band-name{font-weight:700;}
.campus-band-nav.is-many .campus-band-item{padding:10px 18px 0;}
.campus-band-nav.is-many .campus-band-name{font-size:19px;}
.campus-band .campus-header-note{align-self:center;color:var(--campus-on-accent-muted);}

/* —— 导航 3:左侧竖栏。竖向渐变色栏,校徽在顶;编号 + 章节名,当前章是一块与页面底色相连的白色页签 —— */
.campus-rail{position:absolute;z-index:3;left:0;top:0;bottom:0;width:204px;display:flex;flex-direction:column;align-items:stretch;background:var(--campus-fill-deep);color:var(--theme-on-accent);box-shadow:10px 0 30px rgb(var(--theme-accent-rgb) / .18);overflow:hidden;}
.campus-rail > .campus-brand{align-self:center;margin-top:40px;}
.campus-rail-rule{flex:none;align-self:center;width:44px;height:3px;margin:28px 0 18px;border-radius:2px;background:var(--campus-spark);}
.campus-rail-nav{flex:1;min-height:0;display:flex;flex-direction:column;justify-content:flex-start;gap:4px;padding-left:16px;}
.campus-rail-item{position:relative;flex:0 1 96px;min-height:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;padding:6px 14px 6px 0;color:var(--campus-on-accent-muted);text-align:center;}
.campus-rail-no{font-family:var(--theme-font-serif);font-weight:700;font-size:28px;line-height:1;font-variant-numeric:lining-nums;}
.campus-rail-name{font-size:20px;line-height:1.3;font-weight:500;letter-spacing:.06em;}
.campus-rail-item.is-current{color:var(--theme-accent);}
.campus-rail-tab{position:absolute;z-index:-1;inset:0 0 0 0;border-radius:18px 0 0 18px;background:var(--theme-bg);}
.campus-rail-item.is-current .campus-rail-name{font-weight:700;}
.campus-rail-item.is-current .campus-rail-no{color:var(--theme-accent);}
.campus-rail-spark{position:absolute;left:12px;top:50%;width:6px;height:34px;margin-top:-17px;border-radius:3px;background:var(--campus-spark);}
.campus-rail-nav.is-many .campus-rail-no{font-size:24px;}
.campus-rail-nav.is-many .campus-rail-name{font-size:18px;}
.campus-rail-nav.is-many .campus-rail-item{gap:5px;}
.campus-rail-note{flex:none;align-self:center;max-height:340px;overflow:hidden;margin:18px 0 40px;writing-mode:vertical-rl;font-size:14px;letter-spacing:.24em;font-weight:600;color:var(--campus-on-accent-muted);white-space:nowrap;}
.campus-rail-nav.is-empty{justify-content:center;}
/* 长章节名(任一章名 ≥ 7 个汉字宽):整列统一缩到 18px、收紧字距,条目左右留白对称,竖条贴近页签左缘,8 字以内单行;更长的折两行 */
.campus-rail-nav.is-long .campus-rail-item{padding:6px 8px;}
.campus-rail-nav.is-long .campus-rail-name{font-size:18px;letter-spacing:.02em;text-wrap:balance;}
.campus-rail-nav.is-long .campus-rail-spark{left:6px;}

/* —— 导航 4:标题行内嵌。页眉只留校徽校名(右侧是页眉说明),章节导航并进标题行的右端 —— */
.campus-header.is-slim{gap:32px;}
.campus-header.is-slim .campus-brand-mark{width:50px;height:50px;font-size:15px;}
.campus-header.is-slim .campus-brand-mark.is-single{font-size:23px;}
.campus-header.is-slim .campus-brand-name{font-size:calc(25px * var(--cb-scale));}
.campus-header.is-slim .campus-brand-en{margin-top:5px;font-size:11px;}
.campus-inline-nav{flex:0 1 auto;min-width:0;display:flex;align-items:center;gap:2px;margin-left:24px;padding:5px;border-radius:999px;background:rgb(var(--theme-accent-rgb) / .06);}
.campus-inline-item{flex:0 1 auto;min-width:0;display:flex;align-items:center;gap:8px;height:42px;padding:0 18px;border-radius:999px;color:var(--theme-muted);white-space:nowrap;}
.campus-inline-no{font-family:var(--theme-font-serif);font-weight:700;font-size:15px;line-height:1;color:var(--campus-accent-soft);font-variant-numeric:lining-nums;}
.campus-inline-name{font-size:19px;line-height:1;font-weight:500;letter-spacing:.04em;overflow:hidden;text-overflow:ellipsis;}
.campus-inline-item.is-current{background:var(--campus-fill);color:var(--theme-on-accent);box-shadow:0 6px 16px rgb(var(--theme-accent-rgb) / .26);}
.campus-inline-item.is-current .campus-inline-no{color:var(--campus-spark);}
.campus-inline-item.is-current .campus-inline-name{font-weight:700;}
.campus-inline-nav.is-many .campus-inline-item{padding:0 12px;}
.campus-inline-nav.is-many .campus-inline-name{font-size:17px;}
/* 标题较长、放不下全部章节名时的两级降级(由 TitleRow 按估算宽度选择):
   compact 只有当前章显示「编号 + 章名」,其余章只显示编号;current 只保留当前章一个胶囊 */
.campus-inline-nav.is-compact .campus-inline-item:not(.is-current){padding:0 14px;}

/* —— 导航 5–10:第二批顶部导航(TopNav)。共用骨架:校徽在左、章节条目在右;条目 = 编号 + 章名,
   形状画在不含文字的 .campus-top-shape 上(导出时可栅格化),编号 / 章名是叠在上面的独立文本。
   is-tight 收小字号;is-compact 时其余章只留编号(条目里不渲染章名) —— */
.campus-top{position:absolute;z-index:3;top:0;left:0;right:0;height:var(--campus-header-h);display:flex;align-items:center;justify-content:space-between;gap:40px;padding:0 var(--campus-pad-x);}
.campus-top-bg{position:absolute;z-index:-1;inset:0;pointer-events:none;}
.campus-top-nav{position:relative;flex:0 1 auto;min-width:0;display:flex;align-items:center;}
.campus-top-item{position:relative;isolation:isolate;flex:0 1 auto;min-width:0;display:flex;align-items:center;justify-content:center;gap:9px;white-space:nowrap;color:var(--theme-muted);}
.campus-top-no{position:relative;flex:none;font-family:var(--theme-font-serif);font-weight:700;font-size:17px;line-height:1;letter-spacing:.02em;font-variant-numeric:lining-nums;color:var(--campus-accent-soft);}
.campus-top-name{position:relative;min-width:0;max-width:10em;overflow:hidden;text-overflow:ellipsis;font-size:20px;line-height:1.15;font-weight:500;letter-spacing:.05em;}
.campus-top-item.is-current .campus-top-name{max-width:14em;font-weight:700;}
.campus-top-shape{position:absolute;z-index:-1;inset:0;pointer-events:none;}
.campus-top-lift{position:absolute;z-index:-1;inset:0;pointer-events:none;}
.campus-top.is-many .campus-top-name{font-size:19px;letter-spacing:.04em;}
.campus-top.is-tight .campus-top-name{font-size:17px;letter-spacing:.02em;}
.campus-top.is-tight .campus-top-no{font-size:15px;}
/* 浅色页眉(slant / underline / cells / steps):白色玻璃底 + 带校色倾向的柔和投影 */
.campus-top.is-light .campus-top-bg{background:linear-gradient(180deg,rgb(255 255 255 / .82) 0%,rgb(255 255 255 / .97) 100%);box-shadow:0 8px 28px rgb(var(--theme-accent-rgb) / .07);}

/* 5 · slant 斜切标签:平行四边形标签连排,浅校色底 + 左缘一道斜向色条;当前章是带投影的渐变实底,左缘色条换成点缀金 */
.campus-top.is-slant .campus-top-nav{padding:0 4px 0 8px;}
.campus-top.is-slant .campus-top-item{height:48px;padding:0 30px 0 32px;margin-left:-4px;}
.campus-top.is-slant .campus-top-shape{clip-path:polygon(16px 0,100% 0,calc(100% - 16px) 100%,0 100%);background:linear-gradient(135deg,rgb(var(--theme-accent-rgb) / .05) 0%,rgb(var(--theme-accent-rgb) / .13) 100%);}
.campus-top.is-slant .campus-top-edge{position:absolute;z-index:-1;inset:0;pointer-events:none;clip-path:polygon(16px 0,21px 0,5px 100%,0 100%);background:var(--campus-accent-line);}
.campus-top.is-slant .campus-top-item.is-current{color:var(--theme-on-accent);}
.campus-top.is-slant .campus-top-item.is-current .campus-top-lift{filter:drop-shadow(0 7px 10px rgb(var(--theme-accent-rgb) / .3));}
.campus-top.is-slant .campus-top-item.is-current .campus-top-shape{background:var(--campus-fill);}
.campus-top.is-slant .campus-top-item.is-current .campus-top-edge{background:var(--campus-spark);}
.campus-top.is-slant .campus-top-item.is-current .campus-top-no{color:var(--campus-spark);}
.campus-top.is-slant.is-many .campus-top-item,.campus-top.is-slant.is-tight .campus-top-item{padding:0 24px 0 26px;}
.campus-top.is-slant.is-compact .campus-top-item:not(.is-current){padding:0 18px 0 22px;}

/* 6 · underline 下划线:页眉底边一道细校色线;章节是纯文字,当前章加粗变校色,底边压一段渐变粗条 + 点缀金小菱形,条目底部有一层淡淡的校色光 */
.campus-top.is-underline{align-items:stretch;}
.campus-top.is-underline > .campus-brand{align-self:center;}
.campus-top.is-underline .campus-top-rule{position:absolute;left:0;right:0;bottom:0;height:2px;background:var(--campus-accent-tint);pointer-events:none;}
.campus-top.is-underline .campus-top-nav{align-self:stretch;align-items:stretch;}
.campus-top.is-underline .campus-top-item{padding:4px 24px 0;}
.campus-top.is-underline .campus-top-item + .campus-top-item::before{content:'';position:absolute;left:0;top:50%;width:1px;height:22px;margin-top:-9px;background:var(--campus-accent-tint);}
.campus-top.is-underline .campus-top-item.is-current::before,.campus-top.is-underline .campus-top-item.is-current + .campus-top-item::before{display:none;}
.campus-top.is-underline .campus-top-item.is-current{color:var(--theme-accent);}
.campus-top.is-underline .campus-top-item.is-current .campus-top-no{color:var(--theme-accent);}
.campus-top.is-underline .campus-top-item.is-current .campus-top-shape{top:14px;border-radius:14px 14px 0 0;background:linear-gradient(0deg,rgb(var(--theme-accent-rgb) / .1) 0%,rgb(var(--theme-accent-rgb) / .02) 70%,rgb(var(--theme-accent-rgb) / 0) 100%);}
.campus-top.is-underline .campus-top-bar{position:absolute;z-index:1;left:14px;right:14px;bottom:0;height:6px;border-radius:3px 3px 0 0;background:var(--campus-fill);pointer-events:none;}
.campus-top.is-underline .campus-top-tick{position:absolute;z-index:2;left:50%;bottom:1px;width:8px;height:8px;margin-left:-4px;border-radius:1px;background:var(--campus-spark);box-shadow:0 0 0 2px var(--theme-surface);transform:rotate(45deg);pointer-events:none;}
.campus-top.is-underline.is-many .campus-top-item,.campus-top.is-underline.is-tight .campus-top-item{padding:4px 18px 0;}
.campus-top.is-underline.is-compact .campus-top-item:not(.is-current){padding:4px 16px 0;}

/* 7 · cells 平铺方格:页眉底边一道渐变粗线,等宽方格立在线上(浅校色渐变底、上圆角、方格之间留白缝);当前章是渐变实底并略高出一截 */
.campus-top.is-cells{align-items:flex-end;}
.campus-top.is-cells > .campus-brand{align-self:center;}
.campus-top.is-cells .campus-top-rule{position:absolute;left:0;right:0;bottom:0;height:4px;background:var(--campus-fill);pointer-events:none;}
.campus-top.is-cells .campus-top-nav{display:grid;grid-auto-flow:column;grid-auto-columns:minmax(0,1fr);gap:4px;margin-bottom:4px;}
.campus-top.is-cells .campus-top-item{height:52px;padding:2px 26px 0;}
.campus-top.is-cells .campus-top-shape{border-radius:10px 10px 0 0;background:linear-gradient(180deg,rgb(var(--theme-accent-rgb) / .05) 0%,rgb(var(--theme-accent-rgb) / .14) 100%);box-shadow:inset 0 -2px 0 rgb(var(--theme-accent-rgb) / .12);}
.campus-top.is-cells .campus-top-item.is-current{height:62px;color:var(--theme-on-accent);}
.campus-top.is-cells .campus-top-item.is-current .campus-top-shape{background:var(--campus-fill);box-shadow:0 -6px 16px rgb(var(--theme-accent-rgb) / .22);}
.campus-top.is-cells .campus-top-item.is-current .campus-top-no{color:var(--campus-spark);}
.campus-top.is-cells .campus-top-spark{position:absolute;top:7px;left:50%;width:22px;height:3px;margin-left:-11px;border-radius:2px;background:var(--campus-spark);pointer-events:none;}
.campus-top.is-cells.is-many .campus-top-item,.campus-top.is-cells.is-tight .campus-top-item{padding:2px 18px 0;}
.campus-top.is-cells.is-compact .campus-top-nav{grid-auto-columns:auto;}
.campus-top.is-cells.is-compact .campus-top-item:not(.is-current){padding:2px 22px 0;}

/* 8 · folder 文件夹页签:白色页眉 + 底边渐变线;校徽校名放在左侧一张垂下来的渐变页签里(后面一层压暗的折耳);章节用细竖线隔开,当前章是渐变胶囊 */
.campus-top.is-folder .campus-top-bg{bottom:12px;background:linear-gradient(180deg,rgb(255 255 255 / .84) 0%,rgb(255 255 255 / .98) 100%);box-shadow:0 8px 24px rgb(var(--theme-accent-rgb) / .08);}
.campus-top.is-folder .campus-top-rule{position:absolute;left:0;right:0;bottom:12px;height:4px;background:var(--campus-fill);pointer-events:none;}
.campus-top.is-folder .campus-top-tab{position:relative;isolation:isolate;flex:none;align-self:flex-start;display:flex;align-items:center;height:calc(var(--campus-header-h) + 4px);padding:0 46px 10px;margin-left:-14px;}
.campus-top.is-folder .campus-top-tab-ear{position:absolute;z-index:-2;left:-12px;right:-12px;top:0;height:calc(100% - 22px);background:var(--campus-accent-lo);clip-path:polygon(0 0,100% 0,calc(100% - 12px) 100%,12px 100%);pointer-events:none;}
.campus-top.is-folder .campus-top-tab-face{position:absolute;z-index:-1;inset:0;background:var(--campus-fill-deep);clip-path:polygon(0 0,100% 0,calc(100% - 24px) 100%,24px 100%);pointer-events:none;}
.campus-top.is-folder .campus-top-tab-lift{position:absolute;z-index:-1;inset:0;filter:drop-shadow(0 8px 12px rgb(var(--theme-accent-rgb) / .28));pointer-events:none;}
.campus-top.is-folder .campus-top-tab-spark{position:absolute;left:50%;bottom:4px;width:28px;height:3px;margin-left:-14px;border-radius:2px;background:var(--campus-spark);pointer-events:none;}
.campus-top.is-folder .campus-top-nav{align-self:center;margin-top:-12px;}
.campus-top.is-folder .campus-top-item{height:44px;padding:0 22px;}
.campus-top.is-folder .campus-top-item + .campus-top-item::before{content:'';position:absolute;left:-1px;top:50%;width:1.5px;height:20px;margin-top:-10px;border-radius:1px;background:var(--campus-accent-line);}
.campus-top.is-folder .campus-top-item.is-current::before,.campus-top.is-folder .campus-top-item.is-current + .campus-top-item::before{display:none;}
.campus-top.is-folder .campus-top-item.is-current{color:var(--theme-on-accent);margin:0 6px;}
.campus-top.is-folder .campus-top-item.is-current .campus-top-shape{border-radius:999px;background:var(--campus-fill);box-shadow:0 6px 14px rgb(var(--theme-accent-rgb) / .28);}
.campus-top.is-folder .campus-top-item.is-current .campus-top-no{color:var(--campus-spark);}
.campus-top.is-folder.is-many .campus-top-item,.campus-top.is-folder.is-tight .campus-top-item{padding:0 16px;}
.campus-top.is-folder.is-compact .campus-top-item:not(.is-current){padding:0 14px;}

/* 9 · solid 深色通栏胶囊:整条渐变色条,章节放在一条半透明白轨道里,白字 + 细竖线分隔;当前章是白色胶囊、校色字 */
.campus-top.is-solid .campus-top-bg{background:var(--campus-fill-deep);box-shadow:0 10px 30px rgb(var(--theme-accent-rgb) / .2);overflow:hidden;}
.campus-top.is-solid .campus-top-nav{padding:6px;}
.campus-top.is-solid .campus-top-track{position:absolute;z-index:-1;inset:0;border-radius:999px;background:var(--campus-on-accent-glass);box-shadow:inset 0 0 0 1px var(--campus-on-accent-line);pointer-events:none;}
.campus-top.is-solid .campus-top-item{height:48px;padding:0 24px;color:var(--campus-on-accent-muted);}
.campus-top.is-solid .campus-top-no{color:rgb(255 255 255 / .62);}
.campus-top.is-solid .campus-top-item + .campus-top-item::before{content:'';position:absolute;left:0;top:50%;width:1px;height:18px;margin-top:-9px;background:var(--campus-on-accent-line);}
.campus-top.is-solid .campus-top-item.is-current::before,.campus-top.is-solid .campus-top-item.is-current + .campus-top-item::before{display:none;}
.campus-top.is-solid .campus-top-item.is-current{color:var(--theme-accent);}
.campus-top.is-solid .campus-top-item.is-current .campus-top-shape{border-radius:999px;background:var(--theme-surface);box-shadow:0 6px 16px rgb(0 0 0 / .16);}
.campus-top.is-solid .campus-top-item.is-current .campus-top-no{color:var(--theme-accent);}
.campus-top.is-solid .campus-top-dot{position:relative;flex:none;width:6px;height:6px;margin-right:-1px;border-radius:50%;background:var(--campus-spark);}
.campus-top.is-solid.is-many .campus-top-item,.campus-top.is-solid.is-tight .campus-top-item{padding:0 18px;}
.campus-top.is-solid.is-compact .campus-top-item:not(.is-current){padding:0 16px;}

/* 10 · steps 进度步骤:章节节点用连线串起来——讲过的章节是渐变实心节点 + 实线,当前章节点放大并带点缀金外环,未讲的是空心节点 + 虚线 */
.campus-top.is-steps .campus-top-rule{position:absolute;left:0;right:0;bottom:0;height:2px;background:var(--campus-accent-wash);pointer-events:none;}
.campus-top.is-steps .campus-top-item{flex:none;gap:10px;padding:0 6px;}
.campus-top.is-steps .campus-top-node{position:relative;isolation:isolate;flex:none;width:32px;height:32px;display:grid;place-items:center;}
.campus-top.is-steps .campus-top-node .campus-top-shape{border-radius:50%;background:var(--theme-surface);box-shadow:inset 0 0 0 2px var(--campus-accent-line);}
.campus-top.is-steps .campus-top-no{font-size:15px;color:var(--campus-accent-soft);}
.campus-top.is-steps .campus-top-item.is-todo{color:var(--theme-faint);}
.campus-top.is-steps .campus-top-item.is-done{color:var(--theme-muted);}
.campus-top.is-steps .campus-top-item.is-done .campus-top-shape{background:var(--campus-fill);box-shadow:none;}
.campus-top.is-steps .campus-top-item.is-done .campus-top-no{color:var(--theme-on-accent);}
.campus-top.is-steps .campus-top-item.is-current{gap:14px;padding:0 8px 0 10px;color:var(--theme-accent);}
.campus-top.is-steps .campus-top-item.is-current .campus-top-node{width:40px;height:40px;}
.campus-top.is-steps .campus-top-item.is-current .campus-top-shape{background:var(--campus-fill);box-shadow:0 0 0 4px var(--theme-surface),0 0 0 6px var(--campus-spark),0 8px 16px rgb(var(--theme-accent-rgb) / .3);}
.campus-top.is-steps .campus-top-item.is-current .campus-top-no{font-size:17px;color:var(--theme-on-accent);}
.campus-top.is-steps .campus-top-link{position:relative;flex:none;width:34px;height:3px;margin:0 4px;border-radius:2px;background:var(--campus-fill);}
.campus-top.is-steps .campus-top-link.is-todo{height:0;background:none;border-top:2px dashed var(--campus-accent-line);border-radius:0;}
.campus-top.is-steps.is-compact .campus-top-link,.campus-top.is-steps.is-tight .campus-top-link{width:22px;}

/* 页眉说明前的小菱形 */
.campus-note-mark{flex:none;width:8px;height:8px;border-radius:1px;background:var(--campus-spark);transform:rotate(45deg);}

/* —— 正文区与页脚 —— */
.campus-body{position:absolute;z-index:2;top:var(--campus-body-top);bottom:var(--campus-body-bottom);left:var(--campus-body-left);right:var(--campus-body-right);display:flex;flex-direction:column;}
.campus-frame.is-bleed .campus-body{inset:0;}
.campus-footer{position:absolute;z-index:3;left:var(--campus-body-left);right:var(--campus-body-right);bottom:20px;height:28px;display:flex;align-items:center;justify-content:space-between;color:var(--theme-faint);}
.campus-footer-note{display:flex;align-items:center;gap:12px;min-width:0;margin-right:32px;font-size:16px;letter-spacing:.14em;}
.campus-footer-note > div:last-child{min-width:0;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;}
.campus-footer-mark{flex:none;width:8px;height:8px;border-radius:1px;background:var(--campus-fill);transform:rotate(45deg);}
.campus-footer-end{display:flex;align-items:center;gap:14px;}
.campus-footer-bar{width:40px;height:3px;border-radius:2px;background:var(--campus-fade-line);transform:scaleX(-1);}
.campus-page-no{font-family:var(--theme-font-serif);font-size:20px;letter-spacing:.06em;color:var(--theme-faint);font-variant-numeric:lining-nums tabular-nums;}
.campus-page-no b{color:var(--theme-accent);font-weight:700;}
.campus-page-no.is-inverse{color:var(--campus-on-accent-muted);}
.campus-page-no.is-inverse b{color:var(--theme-on-accent);}

/* —— 标题行:小节编号装饰 + 宋体标题 + 渐隐延伸;三种装饰由 brand.titleStyle 选择 —— */
.campus-title-row{flex:none;display:flex;align-items:center;gap:20px;height:60px;margin-bottom:26px;}
.campus-title{flex:0 1 auto;min-width:0;font-family:var(--theme-font-serif);font-weight:700;font-size:46px;line-height:1.2;letter-spacing:.04em;color:var(--theme-ink);white-space:nowrap;}
.campus-title-mark{position:relative;flex:none;display:flex;align-items:center;}
.campus-title-no{position:relative;font-family:var(--theme-font-serif);font-weight:700;line-height:1;font-variant-numeric:lining-nums;white-space:nowrap;}
.campus-title-tail{position:relative;flex:1;min-width:40px;height:20px;display:flex;align-items:center;}
.campus-title-line{flex:1;height:2px;border-radius:1px;background:var(--campus-fade-line);}
.campus-title-aside{flex:none;font-size:18px;letter-spacing:.08em;color:var(--theme-faint);}
/* ribbon:书签箭头(渐变)+ 一枚淡色折角箭头,尾部是点缀色菱形起头的渐隐线 */
.campus-title-row.is-ribbon .campus-title-mark{height:56px;padding:0 34px 0 20px;}
.campus-title-row.is-ribbon .campus-title-shape{position:absolute;inset:0;background:var(--campus-fill);clip-path:polygon(0 0,80% 0,100% 50%,80% 100%,0 100%);}
.campus-title-row.is-ribbon .campus-title-ghost{position:absolute;top:0;bottom:0;right:-24px;width:26px;background:rgb(var(--theme-accent-rgb) / .28);clip-path:polygon(0 0,40% 0,100% 50%,40% 100%,0 100%,60% 50%);}
.campus-title-row.is-ribbon .campus-title-no{color:var(--theme-on-accent);font-size:30px;}
.campus-title-row.is-ribbon .campus-title{margin-left:22px;}
/* bar:竖向渐变条 + 校色衬线编号 + 斜杠,尾部是粗细两道渐隐线 */
.campus-title-row.is-bar .campus-title-mark{gap:16px;height:56px;}
.campus-title-row.is-bar .campus-title-shape{width:10px;height:54px;border-radius:5px;background:var(--campus-fill-bar);}
.campus-title-row.is-bar .campus-title-no{color:var(--theme-accent);font-size:40px;}
.campus-title-row.is-bar .campus-title-slash{width:3px;height:40px;margin-left:4px;border-radius:2px;background:var(--campus-accent-line);transform:skewX(-20deg);}
.campus-title-row.is-bar .campus-title-tail{flex-direction:column;align-items:stretch;justify-content:center;gap:5px;}
.campus-title-row.is-bar .campus-title-line.is-thick{flex:none;width:140px;height:5px;border-radius:3px;background:var(--campus-fill);}
.campus-title-row.is-bar .campus-title-line.is-thin{flex:none;height:1.5px;}
/* wing:圆形渐变徽章(带外环)+ 编号,尾部是「圆点 + 渐细翼线」 */
.campus-title-row.is-wing .campus-title-mark{width:62px;height:62px;justify-content:center;}
.campus-title-row.is-wing .campus-title-shape{position:absolute;inset:0;border-radius:50%;background:var(--campus-fill);box-shadow:0 8px 18px rgb(var(--theme-accent-rgb) / .28);}
.campus-title-row.is-wing .campus-title-ring{position:absolute;inset:-7px;border-radius:50%;border:1.5px dashed var(--campus-accent-line);}
.campus-title-row.is-wing .campus-title-no{color:var(--theme-on-accent);font-size:24px;}
.campus-title-row.is-wing .campus-title{margin-left:10px;}
.campus-title-row.is-wing .campus-title-tail{gap:10px;}
.campus-title-row.is-wing .campus-title-dot{flex:none;width:10px;height:10px;border-radius:50%;background:var(--campus-spark);}
.campus-title-row.is-wing .campus-title-dot.is-ring{width:14px;height:14px;background:transparent;border:2px solid var(--campus-accent-line);}
.campus-title-row.is-wing .campus-title-wing{flex:none;width:96px;height:4px;border-radius:2px;background:var(--campus-fill);clip-path:polygon(0 0,100% 30%,100% 70%,0 100%);}

/* —— 底部结论条:渐变色条 + 半透明白标签 + 右侧淡色箭头组 —— */
.campus-conclusion{position:relative;flex:none;display:flex;align-items:center;gap:0;min-height:76px;margin-top:22px;padding:10px 120px 10px 14px;background:var(--campus-fill-deep);color:var(--theme-on-accent);border-radius:var(--campus-radius);box-shadow:var(--campus-shadow-lift);}
.campus-conclusion-label{flex:none;display:flex;align-items:center;gap:10px;height:50px;padding:0 24px 0 18px;margin-right:26px;border-radius:999px;background:var(--campus-on-accent-glass);}
.campus-conclusion-star{flex:none;display:block;color:var(--campus-spark);}
.campus-conclusion-label-text{font-family:var(--theme-font-serif);font-weight:700;font-size:25px;line-height:1;letter-spacing:.12em;white-space:nowrap;}
.campus-conclusion-text{flex:1;min-width:0;padding:6px 0;font-size:25px;line-height:1.45;font-weight:600;letter-spacing:.02em;}
.campus-conclusion.no-label{padding-left:34px;}
.campus-conclusion-deco{position:absolute;right:30px;top:50%;margin-top:-17px;display:block;color:rgb(255 255 255 / .3);}

/* —— 流程箭头 —— */
.campus-arrow{flex:none;display:block;color:var(--theme-accent);}
`;

export function useChromeStyle() {
  useThemeStyle('campus-chrome-style', CHROME_CSS);
}

/**
 * 校徽图片:按图片原比例在最大框(box.w × box.h)里算出宽高,图片元素与图片同比例(不裁切、不拉伸,
 * 导出 PPTX 时图片框就是图片本身的比例)。比例在图片加载后读出;加载前按最大高度、宽度自适应。
 */
const useIsoLayoutEffect = typeof window === 'undefined' ? React.useEffect : React.useLayoutEffect;
function CampusLogo({ src, alt, box, plate }) {
  const ref = React.useRef(null);
  const [ratio, setRatio] = React.useState(null);
  const measure = React.useCallback(() => {
    const img = ref.current;
    if (img && img.naturalWidth > 0 && img.naturalHeight > 0) setRatio(img.naturalWidth / img.naturalHeight);
  }, []);
  useIsoLayoutEffect(() => {
    setRatio(null);
    if (ref.current?.complete) measure();
  }, [src, measure]);
  const h = ratio ? Math.min(box.h, box.w / ratio) : box.h;
  const size = ratio
    ? { width: Math.round(h * ratio), height: Math.round(h) }
    : { height: box.h, maxWidth: box.w };
  return (
    <div className="campus-brand-logo" data-logo-ratio={ratio ? ratio.toFixed(3) : undefined}>
      {plate && <div className="campus-brand-plate" aria-hidden="true" />}
      <img ref={ref} src={src} alt={alt || ''} style={size} decoding="async" onLoad={measure} />
    </div>
  );
}

/**
 * 页眉用哪张校徽:选了学校(brand.school)且 LOGO 还是学校自带的那张(或学校只有白色版)时,
 * 深色页眉(tone='inverse')换成学校的白色版、不垫白底,浅色页眉用彩色版(没有彩色版就显示文字校徽);
 * 用户上传了自己的 LOGO 或清空过 LOGO 时按原规则。
 */
export function brandLogo(brand, tone = 'default') {
  const logo = typeof brand.logo === 'string' ? brand.logo.trim() : '';
  const school = campusSchool(brand.school);
  const logos = schoolLogos(school);
  if (school && (logo ? logo === logos.color : !logos.color)) {
    const src = tone === 'inverse' ? (logos.inverse || logos.color) : logos.color;
    return { logo: src, logoHasName: src ? Boolean(school.logo?.hasName) : false, plateAllowed: !(tone === 'inverse' && logos.inverse) && brand.logoPlate !== false };
  }
  return { logo, logoHasName: Boolean(brand.logoHasName), plateAllowed: brand.logoPlate !== false };
}

/**
 * 校徽校名:有校徽图片时图片代替圆形文字校徽、旁边照常写校名(brand.logoHasName 为真时只显示图片);
 * 没有图片时显示渐变圆章 + 校名。tone='inverse' 用在渐变色块上(此时 brand.logoPlate 不为 false 就给图片垫白底);
 * layout='stack' 上下排列(左侧竖栏用)。长校名按 brandNameFit 缩小字号,竖栏里可以折行。
 */
export function CampusBrand({ tone = 'default', layout = 'row' }) {
  useChromeStyle();
  const brand = useCampusBrand();
  const { logo, logoHasName, plateAllowed } = brandLogo(brand, tone);
  const showName = !logo || !logoHasName;
  const plate = Boolean(logo) && tone === 'inverse' && plateAllowed;
  const stack = layout === 'stack';
  const fit = brandNameFit(brand);
  const box = BRAND_LOGO_BOX[stack ? (showName ? 'stackEmblem' : 'stackFull') : (showName ? 'emblem' : 'full')];
  const classes = ['campus-brand', tone === 'inverse' ? 'is-inverse' : '', stack ? 'is-stack' : '', logo ? 'has-logo' : '',
    showName ? '' : 'is-logo-only', plate ? 'has-plate' : '', fit.scale < 1 ? 'is-name-long' : '', fit.en].filter(Boolean).join(' ');
  return (
    <div className={classes} style={fit.scale < 1 ? { '--cb-scale': fit.scale } : undefined}>
      {logo
        ? <CampusLogo src={logo} alt={brand.name} box={box} plate={plate} />
        : (
          <div className={`campus-brand-mark${Array.from(String(brand.mark || '')).length <= 1 ? ' is-single' : ''}`}>
            <div className="campus-brand-ring" aria-hidden="true" />
            <div {...DECK_LEVEL_TEXT}>{brand.mark}</div>
          </div>
        )}
      {showName && (
        <div className="campus-brand-text">
          <div className="campus-brand-name" {...DECK_LEVEL_TEXT}>{brand.name}</div>
          {brand.nameEn ? <div className="campus-brand-en" {...DECK_LEVEL_TEXT}>{brand.nameEn}</div> : null}
        </div>
      )}
    </div>
  );
}

/** 页眉说明(没有章节时代替导航):点缀色小菱形 + 字距拉开的英文说明。 */
function HeaderNote({ text }) {
  return (
    <div className="campus-header-note">
      <div className="campus-note-mark" aria-hidden="true" />
      <div {...DECK_LEVEL_TEXT}>{text}</div>
    </div>
  );
}

/**
 * 章节导航条目:编号 + 章节名,两段都是 deck 级文字。variant 对应 tabs / band / rail / inline 四种导航的条目外观(第二批顶部样式见 TopNav)。
 * 章节名来自 brand.chapters,当前章节由页面的 chapterIndex 控件决定。
 */
export function ChapterNav({ chapterIndex = 1, variant = 'tabs', fit = 'full' }) {
  useChromeStyle();
  const brand = useCampusBrand();
  const chapters = safeArray(brand.chapters);
  const current = chapterSlot(chapters, chapterIndex);
  if (!chapters.length) return null;
  const many = chapters.length > 5 ? ' is-many' : '';
  if (variant === 'inline' && fit !== 'full') {
    // 标题行放不下全部章名时的降级(见 inlineNavFit):compact 其余章只留编号,current 只留当前章
    const shown = fit === 'current' ? [current] : chapters.map((_, i) => i);
    return (
      <nav className={`campus-inline-nav${many} is-${fit === 'current' ? 'current' : 'compact'}`}>
        {shown.map(i => (
          <div className={`campus-inline-item${i === current ? ' is-current' : ''}`} key={i}>
            <div className="campus-inline-no" {...DECK_LEVEL_TEXT}>{pad2(i)}</div>
            {i === current && <div className="campus-inline-name" {...DECK_LEVEL_TEXT}>{chapters[i]}</div>}
          </div>
        ))}
      </nav>
    );
  }
  if (variant === 'band') {
    return (
      <nav className={`campus-band-nav${many}`}>
        {chapters.map((name, i) => (
          <div className={`campus-band-item${i === current ? ' is-current' : ''}`} key={i}>
            {i === current && <div className="campus-band-tab" aria-hidden="true" />}
            <div className="campus-band-no" {...DECK_LEVEL_TEXT}>{pad2(i)}</div>
            <div className="campus-band-name" {...DECK_LEVEL_TEXT}>{name}</div>
          </div>
        ))}
      </nav>
    );
  }
  if (variant === 'rail') {
    return (
      <nav className={`campus-rail-nav${many}${chapters.some(name => textWidthEm(name) > RAIL_LONG_EM) ? ' is-long' : ''}`}>
        {chapters.map((name, i) => (
          <div className={`campus-rail-item${i === current ? ' is-current' : ''}`} key={i}>
            {i === current && <div className="campus-rail-tab" aria-hidden="true" />}
            {i === current && <div className="campus-rail-spark" aria-hidden="true" />}
            <div className="campus-rail-no" {...DECK_LEVEL_TEXT}>{pad2(i)}</div>
            <div className="campus-rail-name" {...DECK_LEVEL_TEXT}>{name}</div>
          </div>
        ))}
      </nav>
    );
  }
  const prefix = variant === 'inline' ? 'campus-inline' : 'campus-tab';
  return (
    <nav className={`${variant === 'inline' ? 'campus-inline-nav' : 'campus-tabs'}${many}`}>
      {chapters.map((name, i) => (
        <div className={`${variant === 'inline' ? 'campus-inline-item' : 'campus-tab'}${i === current ? ' is-current' : ''}`} key={i}>
          <div className={`${prefix}-no`} {...DECK_LEVEL_TEXT}>{pad2(i)}</div>
          <div className={`${prefix}-name`} {...DECK_LEVEL_TEXT}>{name}</div>
        </div>
      ))}
    </nav>
  );
}

/**
 * 第二批顶部导航(TOP_NAV_STYLES):校徽 + 章节条目。条目状态 is-done / is-current / is-todo(讲过 / 当前 / 未讲);
 * fit 见 topNavFit,'compact' 时只有当前章渲染章名。形状元素都不含文字,编号与章名是独立的 deck 级文本。
 */
function TopNav({ nav, chapterIndex }) {
  const brand = useCampusBrand();
  const chapters = safeArray(brand.chapters);
  const current = chapterSlot(chapters, chapterIndex);
  const fit = topNavFit({ nav, chapters, chapterIndex, brand });
  const light = nav === 'slant' || nav === 'underline' || nav === 'cells' || nav === 'steps';
  const inverse = nav === 'solid' || nav === 'folder';
  const classes = ['campus-top', `is-${nav}`, light ? 'is-light' : '', chapters.length > 5 ? 'is-many' : '', fit === 'full' ? '' : `is-${fit}`]
    .filter(Boolean).join(' ');
  const items = [];
  chapters.forEach((name, i) => {
    const state = i < current ? 'is-done' : i === current ? 'is-current' : 'is-todo';
    const isCurrent = i === current;
    const no = <div className="campus-top-no" {...DECK_LEVEL_TEXT}>{pad2(i)}</div>;
    if (nav === 'steps' && i > 0) {
      items.push(<div className={`campus-top-link${i <= current ? '' : ' is-todo'}`} aria-hidden="true" key={`link-${i}`} />);
    }
    items.push(
      <div className={`campus-top-item ${state}`} key={i}>
        {nav === 'steps' ? (
          <div className="campus-top-node">
            <div className="campus-top-shape" aria-hidden="true" />
            {no}
          </div>
        ) : (
          <>
            <div className="campus-top-lift" aria-hidden="true"><div className="campus-top-shape" /></div>
            {nav === 'slant' && <div className="campus-top-edge" aria-hidden="true" />}
            {nav === 'underline' && isCurrent && <div className="campus-top-bar" aria-hidden="true" />}
            {nav === 'underline' && isCurrent && <div className="campus-top-tick" aria-hidden="true" />}
            {nav === 'cells' && isCurrent && <div className="campus-top-spark" aria-hidden="true" />}
            {nav === 'solid' && isCurrent && <div className="campus-top-dot" aria-hidden="true" />}
            {no}
          </>
        )}
        {(fit !== 'compact' || isCurrent) && <div className="campus-top-name" {...DECK_LEVEL_TEXT}>{name}</div>}
      </div>,
    );
  });
  return (
    <header className={classes} data-nav-fit={fit}>
      <div className="campus-top-bg" aria-hidden="true" />
      {(nav === 'underline' || nav === 'cells' || nav === 'folder' || nav === 'steps') && <div className="campus-top-rule" aria-hidden="true" />}
      {nav === 'folder' ? (
        <div className="campus-top-tab">
          <div className="campus-top-tab-ear" aria-hidden="true" />
          <div className="campus-top-tab-lift" aria-hidden="true"><div className="campus-top-tab-face" /></div>
          <div className="campus-top-tab-spark" aria-hidden="true" />
          <CampusBrand tone="inverse" />
        </div>
      ) : <CampusBrand tone={inverse ? 'inverse' : 'default'} />}
      {chapters.length
        ? <nav className="campus-top-nav">{nav === 'solid' && <div className="campus-top-track" aria-hidden="true" />}{items}</nav>
        : <HeaderNote text={brand.headerNote} />}
    </header>
  );
}

/** 页码:由运行时填充。tone='inverse' 用在渐变色块上。 */
export function CampusPageNumber({ tone = 'default', className = '', style }) {
  useChromeStyle();
  return <DeckPageNumber className={`campus-page-no${tone === 'inverse' ? ' is-inverse' : ''} ${className}`} style={style} separator=" / " />;
}

/** 导航栏:按 brand.nav 渲染十种样式之一;没有章节时各自退化为「校徽 + 页眉说明」。 */
function CampusNav({ chapterIndex }) {
  const brand = useCampusBrand();
  const { nav } = useCampusLayout();
  if (TOP_NAV_STYLES.includes(nav)) return <TopNav nav={nav} chapterIndex={chapterIndex} />;
  const hasChapters = safeArray(brand.chapters).length > 0;
  if (nav === 'band') {
    return (
      <header className="campus-band">
        <div className="campus-band-orb" aria-hidden="true" style={{ left: -60, top: -120, width: 260, height: 260 }} />
        <CampusBrand tone="inverse" />
        {hasChapters ? <ChapterNav chapterIndex={chapterIndex} variant="band" /> : <HeaderNote text={brand.headerNote} />}
      </header>
    );
  }
  if (nav === 'rail') {
    return (
      <aside className="campus-rail">
        <CampusBrand tone="inverse" layout="stack" />
        <div className="campus-rail-rule" aria-hidden="true" />
        {hasChapters ? <ChapterNav chapterIndex={chapterIndex} variant="rail" /> : <div className="campus-rail-nav is-empty" />}
        {/* 竖排的页眉说明:章节超过 4 个时竖栏放不下,省略 */}
        {safeArray(brand.chapters).length <= 4 && <div className="campus-rail-note" {...DECK_LEVEL_TEXT}>{brand.headerNote}</div>}
      </aside>
    );
  }
  return (
    <header className={`campus-header${nav === 'inline' ? ' is-slim' : ''}`}>
      <div className="campus-header-line" aria-hidden="true" />
      <CampusBrand />
      {hasChapters && nav === 'tabs'
        ? <ChapterNav chapterIndex={chapterIndex} variant="tabs" />
        : <HeaderNote text={brand.headerNote} />}
    </header>
  );
}

/**
 * 页面外壳。
 *   layout       'content' 有导航与页脚的内容页 | 'bleed' 整页铺满,页眉页脚由页面自己摆放(章节页、封面、结语)
 *   chapterIndex 当前章节(1 起),用于导航的高亮
 *   backdrop     铺在正文下面的背景层
 *   bodyStyle    正文区的附加样式
 * 正文区的位置随导航样式变化(见 useCampusLayout),页面在正文区里用 flex / grid 排版即可。
 */
export function CampusFrame({ children, layout = 'content', chapterIndex = 1, backdrop = null, bodyStyle }) {
  useChromeStyle();
  const brand = useCampusBrand();
  const frame = React.useMemo(() => ({ chapterIndex }), [chapterIndex]);
  if (layout === 'bleed') {
    return (
      <div className="campus-frame is-bleed">
        {backdrop}
        <main className="campus-body" style={bodyStyle}>{children}</main>
      </div>
    );
  }
  return (
    <FrameContext.Provider value={frame}>
      <div className="campus-frame">
        {backdrop}
        <CampusNav chapterIndex={chapterIndex} />
        <main className="campus-body" style={bodyStyle}>{children}</main>
        <footer className="campus-footer">
          <div className="campus-footer-note">
            <div className="campus-footer-mark" aria-hidden="true" />
            <div {...DECK_LEVEL_TEXT}>{campusFooterNote(brand)}</div>
          </div>
          <div className="campus-footer-end">
            <div className="campus-footer-bar" aria-hidden="true" />
            <CampusPageNumber />
          </div>
        </footer>
      </div>
    </FrameContext.Provider>
  );
}

/** 标题行的编号装饰:三种样式共用一个结构,形状元素不含文字(导出时形状可被栅格化,编号仍是文本)。 */
export function TitleMark({ no, variant }) {
  if (variant === 'bar') {
    return (
      <div className="campus-title-mark">
        <div className="campus-title-shape" aria-hidden="true" />
        <div className="campus-title-no">{no}</div>
        <div className="campus-title-slash" aria-hidden="true" />
      </div>
    );
  }
  return (
    <div className="campus-title-mark">
      <div className="campus-title-shape" aria-hidden="true" />
      {variant === 'ribbon' && <div className="campus-title-ghost" aria-hidden="true" />}
      {variant === 'wing' && <div className="campus-title-ring" aria-hidden="true" />}
      <div className="campus-title-no">{no}</div>
    </div>
  );
}

export function TitleTail({ variant }) {
  if (variant === 'bar') {
    return (
      <div className="campus-title-tail" aria-hidden="true">
        <div className="campus-title-line is-thick" />
        <div className="campus-title-line is-thin" />
      </div>
    );
  }
  if (variant === 'wing') {
    return (
      <div className="campus-title-tail" aria-hidden="true">
        <div className="campus-title-dot" />
        <div className="campus-title-wing" />
        <div className="campus-title-dot is-ring" />
        <div className="campus-title-line" />
      </div>
    );
  }
  return (
    <div className="campus-title-tail" aria-hidden="true">
      <div className="campus-note-mark" style={{ marginRight: 12 }} />
      <div className="campus-title-line" />
    </div>
  );
}

/**
 * 标题行:小节编号装饰 + 宋体标题 + 渐隐延伸;no 为空时只显示标题。
 * 装饰样式默认取 deck 级 brand.titleStyle('ribbon' | 'bar' | 'wing'),个别页面可传 variant 覆盖。
 * 导航样式为「标题行内嵌」时,章节导航画在标题行右端。
 */
export function TitleRow({ no, title, aside = null, variant, className = '', style }) {
  useChromeStyle();
  const layout = useCampusLayout();
  const { chapterIndex } = React.useContext(FrameContext);
  const brand = useCampusBrand();
  const kind = ['ribbon', 'bar', 'wing'].includes(variant) ? variant : layout.titleStyle;
  const fit = layout.nav === 'inline'
    ? inlineNavFit({ title, no, titleStyle: kind, chapters: brand.chapters, chapterIndex, bodyW: layout.bodyW, extra: aside ? 260 : 0 })
    : 'full';
  return (
    <div className={`campus-title-row is-${kind} ${className}`} style={style}>
      {no ? <TitleMark no={no} variant={kind} /> : null}
      <h2 className="campus-title">{title}</h2>
      <TitleTail variant={kind} />
      {aside}
      {layout.nav === 'inline' && <ChapterNav chapterIndex={chapterIndex} variant="inline" fit={fit} />}
    </div>
  );
}

/** 小星标(点缀色,纯装饰):结论条、状态徽标、推荐小旗、长结论标题徽标等共用这一枚。 */
export function SparkStar({ size = 22, className = '' }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path fill="currentColor" d="M12 1.5l2.6 7.1 7.4.3-5.8 4.6 2 7.2L12 16.6l-6.2 4.1 2-7.2L2 8.9l7.4-.3z" />
    </svg>
  );
}

/** 底部结论条:渐变色条 + 一句话结论;label 为空时只显示结论。 */
export function ConclusionBar({ label, text, className = '', style }) {
  useChromeStyle();
  return (
    <div className={`campus-conclusion${label ? '' : ' no-label'} ${className}`} style={style}>
      {label ? (
        <div className="campus-conclusion-label">
          <SparkStar className="campus-conclusion-star" />
          <div className="campus-conclusion-label-text">{label}</div>
        </div>
      ) : null}
      <p className="campus-conclusion-text">{text}</p>
      <svg className="campus-conclusion-deco" width="64" height="34" viewBox="0 0 64 34" aria-hidden="true">
        <path d="M4 3 L18 17 L4 31" stroke="currentColor" strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M24 3 L38 17 L24 31" stroke="currentColor" strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity=".7" />
        <path d="M44 3 L58 17 L44 31" stroke="currentColor" strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity=".4" />
      </svg>
    </div>
  );
}

/** 流程箭头(纯装饰):direction 为 'right' 或 'down'。 */
export function FlowArrow({ direction = 'right', size = 34, className = '', style }) {
  useChromeStyle();
  const rotate = direction === 'down' ? 90 : 0;
  return (
    <svg className={`campus-arrow ${className}`} style={style} width={size} height={size} viewBox="0 0 34 34" aria-hidden="true">
      <g transform={`rotate(${rotate} 17 17)`}>
        <path d="M4 17 H25" stroke="currentColor" strokeWidth="3.5" fill="none" strokeLinecap="round" />
        <path d="M18 9 L27 17 L18 25" stroke="currentColor" strokeWidth="3.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </svg>
  );
}

