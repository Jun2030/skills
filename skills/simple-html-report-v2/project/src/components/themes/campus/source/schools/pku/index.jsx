// 北京大学 · 匾额请柬(视频背景)。
//
// 还原依据:模板第 39–41 页(封面原版 / 长标题版 / 关键词大字版)与第 42–46 页(目录 5、2、3、4、6 项),坐标取自
// `python3 -I scripts/campus-schools/extract-assets.py --school pku --dump-only` 导出的 output/campus-schools/pku/slide-<id>.txt。
// 封面叠放顺序照模板:西校门视频 → 匾形请柬(北大红、金框、外投影)→ 请柬内框 → 校徽校名 → 文字 → 菱形饰;
// 目录:背景图(红色径向渐变)→ 校徽 → 标题 / 典礼名称 → 时间线 → 节点菱形 → 匾额卡片(外框 + 内框)→ 序号 / 条目 / 说明 → 底部信息。
// 匾形(plaque,四角内凹的四分之一圆,半径 = 短边 × 16.667%)与菱形是 PowerPoint 预设形状,提取脚本只能按外框矩形近似,
// 这里用行内 SVG 按预设形状的几何画(颜色读 var(--sch-*))。
//
// 通用字段 → 模板字段:
//   主标题        原版:title 拆成上下两行(每行 2 字,「燕园 / 启航」);长标题版:title 拆两行(每行 ≤ 6 字,超过 4 字自动缩小);
//                 关键词版:kit 的 coverKeyword(keyword → 场景名推出的短词 → 学校口号「燕园启航」)
//   主标题·副行    关键词版:title(完整题目,一行放不下拆两行)
//   副标题        kicker(场景名,对应模板「二〇二六年毕业典礼」)
//   副标题·下      subtitle(对应「暨学位授予仪式」);为空时清空
//   英文          汇报信息:「答辩人 林晓舟　指导教师 …」/「单位　日期」两行(模板这一行是「COMMENCEMENT 2026」,
//                 通用字段里没有对应的英文;都没写时用 titleEn,再空就清空)
//   底部信息       motto(空时校训「思想自由 · 兼容并包」)
//   目录          title → 目录标题;lead(空时 subtitle)→ 典礼名称;items[i].title / desc(空时英文小标 note)→ toc.i.title / desc,
//                 序号固定用大写数字(壹贰叁肆伍陆)→ toc.i.num;motto(空时「思想自由　兼容并包」)→ 底部信息
import React from 'react';
import { NativeText, SchoolImage, SchoolStage, SchoolVideo, box, coverKeyword, fitText, splitTitle, useSchoolStyle } from '../kit.jsx';
import { schoolFontStack } from '../fonts.mjs';

const HEAVY = schoolFontStack('寒蝉锦书宋 Heavy');
const BOLD = schoolFontStack('寒蝉锦书宋 Bold');
const MEDIUM = schoolFontStack('寒蝉锦书宋 Medium');
const LATIN = `'Cinzel',${MEDIUM}`;

const CSS = `
.cp-sch-pku.is-cover{background:var(--sch-red);}
.cp-sch-pku.is-toc{background:var(--sch-toc-bg);}
.cp-sch-pku .pk-svg{position:absolute;overflow:visible;pointer-events:none;}
.cp-sch-pku .pk-plaque{fill:var(--sch-red);stroke:var(--sch-gold);stroke-width:3;}
.cp-sch-pku .pk-plaque-shadow{filter:drop-shadow(0 6px 20px var(--sch-plaque-shadow));}
.cp-sch-pku .pk-plaque-inner{fill:none;stroke:var(--sch-gold-70);stroke-width:1.2;}
.cp-sch-pku .pk-card{fill:var(--sch-card);stroke:var(--sch-gold);stroke-width:2.5;}
.cp-sch-pku .pk-card-inner{fill:none;stroke:var(--sch-gold-60);stroke-width:1;}
.cp-sch-pku .pk-diamond{fill:var(--sch-gold);}
.cp-sch-pku .pk-line{position:absolute;height:2px;background:var(--sch-gold-65);}
.cp-sch-pku .pk-title{font-family:${HEAVY};font-weight:900;color:var(--sch-gold-text);text-align:center;white-space:nowrap;}
.cp-sch-pku .pk-title-sub{font-family:${BOLD};font-weight:700;font-size:32px;letter-spacing:4px;color:var(--sch-gold-text);text-align:center;line-height:1.2;white-space:nowrap;}
.cp-sch-pku .pk-sub{font-family:${BOLD};font-weight:700;font-size:40px;letter-spacing:8px;color:var(--sch-white);text-align:center;line-height:1.2;white-space:nowrap;}
.cp-sch-pku .pk-sub2{font-family:${MEDIUM};font-weight:500;font-size:30px;letter-spacing:12px;color:var(--sch-white);text-align:center;line-height:1.2;white-space:nowrap;}
.cp-sch-pku .pk-en{font-family:${LATIN};font-weight:700;font-size:20px;letter-spacing:8px;color:var(--sch-gold-soft);text-align:center;line-height:1.5;white-space:nowrap;}
.cp-sch-pku .pk-info{font-family:${LATIN};font-weight:500;font-size:22px;letter-spacing:4px;color:var(--sch-gold-soft);text-align:center;line-height:1.45;white-space:nowrap;}
.cp-sch-pku .pk-foot{font-family:${MEDIUM};font-weight:500;font-size:24px;letter-spacing:8px;color:var(--sch-gold-text);text-align:center;line-height:1.2;white-space:pre;}
.cp-sch-pku .pk-toc-title{font-family:${HEAVY};font-weight:900;font-size:80px;letter-spacing:32px;color:var(--sch-gold-text);text-align:center;line-height:1.2;white-space:nowrap;}
.cp-sch-pku .pk-toc-name{font-family:${MEDIUM};font-weight:500;font-size:30px;letter-spacing:8px;color:var(--sch-gold-soft);text-align:center;line-height:1.2;white-space:nowrap;}
.cp-sch-pku .pk-num{font-family:${HEAVY};font-weight:900;font-size:88px;color:var(--sch-gold-text);text-align:center;line-height:1.2;white-space:nowrap;}
.cp-sch-pku .pk-item{font-family:${BOLD};font-weight:700;font-size:40px;letter-spacing:6px;color:var(--sch-white);text-align:center;line-height:1.2;white-space:nowrap;}
.cp-sch-pku .pk-desc{font-family:${MEDIUM};font-weight:500;font-size:26px;letter-spacing:4px;color:var(--sch-gold-soft);text-align:center;line-height:1.58;white-space:nowrap;}
.cp-sch-pku .pk-desc.is-latin{font-family:${LATIN};font-size:20px;letter-spacing:4px;padding-top:14px;}
.cp-sch-pku .pk-toc-foot{font-family:${MEDIUM};font-weight:500;font-size:28px;letter-spacing:8px;color:var(--sch-gold-text);text-align:center;line-height:1.2;white-space:pre;}
`;

const UPPER_NUMS = ['壹', '贰', '叁', '肆', '伍', '陆'];
const clean = value => String(value ?? '').trim();
const fmt = n => Math.round(n * 100) / 100;

/** PowerPoint 预设形状 plaque:四角是以角点为圆心、半径 r 的内凹四分之一圆。 */
function plaquePath(x, y, w, h, r) {
  return `M${fmt(x)} ${fmt(y + r)} A${fmt(r)} ${fmt(r)} 0 0 0 ${fmt(x + r)} ${fmt(y)} H${fmt(x + w - r)} A${fmt(r)} ${fmt(r)} 0 0 0 ${fmt(x + w)} ${fmt(y + r)} `
    + `V${fmt(y + h - r)} A${fmt(r)} ${fmt(r)} 0 0 0 ${fmt(x + w - r)} ${fmt(y + h)} H${fmt(x + r)} A${fmt(r)} ${fmt(r)} 0 0 0 ${fmt(x)} ${fmt(y + h - r)} Z`;
}

/** 匾形(rect 是模板形状外框;adj 默认 16667 → r = 短边 × 0.16667)。pad 留出描边与投影。 */
function Plaque({ rect, className, pad = 4, svgClass = '' }) {
  const [x, y, w, h] = rect;
  const r = Math.min(w, h) * 0.16667;
  return (
    <svg className={`pk-svg ${svgClass}`} style={box([x - pad, y - pad, w + pad * 2, h + pad * 2])} viewBox={`0 0 ${fmt(w + pad * 2)} ${fmt(h + pad * 2)}`} aria-hidden="true">
      <path className={className} d={plaquePath(pad, pad, w, h, r)} />
    </svg>
  );
}

/** 预设形状 diamond(菱形)。 */
function Diamond({ rect }) {
  const [x, y, w, h] = rect;
  return (
    <svg className="pk-svg" style={box(rect)} viewBox={`0 0 ${fmt(w)} ${fmt(h)}`} aria-hidden="true">
      <path className="pk-diamond" d={`M${fmt(w / 2)} 0 L${fmt(w)} ${fmt(h / 2)} L${fmt(w / 2)} ${fmt(h)} L0 ${fmt(h / 2)} Z`} />
    </svg>
  );
}

// ———— 封面(模板第 39 / 40 / 41 页) ————

const PLAQUE = [166.4, 86.4, 532.8, 907.2];
const PLAQUE_INNER = [189.44, 109.44, 486.72, 861.12];
const COVER_LOGO = [330.13, 161.28, 205.34, 57.6];
const COL = 166.4;
const COL_W = 532.8;
const TEXT_W = 460; // 主标题等估算字号时的可用宽度:留在请柬内框(486.72)以内
const TITLE = {
  default: { rect: [COL, 262.32, COL_W, 308.16], size: 144, spacing: 28, lineHeight: 1.08 },
  long_title: { rect: [COL, 262.4, COL_W, 308.2], size: 100, spacing: 8, lineHeight: 1.14 },
  keyword: { rect: [COL, 316, COL_W, 132], size: 104, spacing: 10, lineHeight: 1.2 },
};
const KEYWORD_SUB = [COL, 448, COL_W, 96]; // 模板「主标题·副行」框 [166.4 472 532.8 48],拆两行时上下各让出 24
const DIAMOND = [422.72, 593.28, 20.16, 20.16];
const SUB = [COL, 636.48, COL_W, 60.48];
const SUB2 = [COL, 699.84, COL_W, 48.96];
const EN = [COL, 760.48, COL_W, 77.44]; // 模板「英文」框 [166.4 780.48 532.8 37.44],中线不变,高度留给两行汇报信息
const FOOT = [COL, 875.52, COL_W, 43.2];

/** 原版主标题:不写换行时拆成上下两行(4 字 → 2 / 2;3 字及以下一行)。 */
function splitHalf(title) {
  const text = clean(title);
  if (text.includes('\n')) return text.split('\n').slice(0, 2).join('\n');
  const chars = Array.from(text);
  if (chars.length <= 3) return text;
  const mid = Math.ceil(chars.length / 2);
  return `${chars.slice(0, mid).join('')}\n${chars.slice(mid).join('')}`;
}

/** 汇报信息(放在模板「英文」行):第一行汇报人 [+ 指导教师],第二行单位 / 日期。 */
function infoText(p) {
  const row1 = [];
  const presenter = clean(p.presenter);
  if (presenter) row1.push(`${clean(p.presenterLabel) || '汇报人'} ${presenter}`);
  const advisor = clean(p.advisor);
  if (advisor) row1.push(`${clean(p.advisorLabel) || '指导教师'} ${advisor}`);
  const row2 = [clean(p.unit), clean(p.date)].filter(Boolean);
  return [row1.join('　'), row2.join('　')].filter(Boolean).join('\n');
}

function coverTexts(school, p, variant) {
  const title = clean(p.title);
  const texts = {
    sub: clean(p.kicker),
    sub2: clean(p.subtitle),
    info: infoText(p),
    en: clean(p.titleEn),
    foot: clean(p.motto) || school.defaults.motto,
    titleSub: '',
  };
  if (variant === 'keyword') {
    texts.title = coverKeyword(school, p);
    const flat = title.replace(/\n/g, '');
    const fits = fitText(flat, { size: 32, width: TEXT_W, spacing: 4 }) >= 32;
    texts.titleSub = fits ? flat : splitTitle(flat, Math.ceil(Array.from(flat).length / 2));
  } else if (variant === 'long_title') {
    texts.title = splitTitle(title, 4);
  } else {
    texts.title = splitHalf(title);
  }
  return texts;
}

function Cover({ school, props: p, variant }) {
  useSchoolStyle(school, 'campus-school-pku-style', CSS);
  const v = TITLE[variant] ? variant : 'default';
  const t = TITLE[v];
  const texts = coverTexts(school, p, v);
  const titleSize = fitText(texts.title, { size: t.size, width: TEXT_W, spacing: t.spacing });
  const enText = texts.info || texts.en;
  return (
    <SchoolStage school={school} page="cover">
      <SchoolVideo school={school} file="video-media3.mp4" poster="video-media3-poster.jpg" rect={[0, 0, 1919, 1080]} />
      <Plaque rect={PLAQUE} className="pk-plaque" svgClass="pk-plaque-shadow" pad={48} />
      <Plaque rect={PLAQUE_INNER} className="pk-plaque-inner" />
      <SchoolImage school={school} file="logo-image50.png" rect={COVER_LOGO} />
      <NativeText school="pku" field="主标题" rect={t.rect} anchor="middle" className="pk-title"
        style={{ fontSize: titleSize, letterSpacing: t.spacing * (titleSize / t.size), lineHeight: t.lineHeight }}>{texts.title}</NativeText>
      {v === 'keyword' && texts.titleSub ? (
        <NativeText school="pku" field="主标题·副行" rect={KEYWORD_SUB} anchor="middle" className="pk-title-sub"
          style={{ fontSize: fitText(texts.titleSub, { size: 32, width: TEXT_W, spacing: 4 }) }}>{texts.titleSub}</NativeText>
      ) : null}
      <Diamond rect={DIAMOND} />
      {texts.sub ? <NativeText school="pku" field="副标题" rect={SUB} anchor="middle" className="pk-sub"
        style={{ fontSize: fitText(texts.sub, { size: 40, width: TEXT_W, spacing: 8 }) }}>{texts.sub}</NativeText> : null}
      {texts.sub2 ? <NativeText school="pku" field="副标题·下" rect={SUB2} anchor="middle" className="pk-sub2"
        style={{ fontSize: fitText(texts.sub2, { size: 30, width: TEXT_W, spacing: 12 }), letterSpacing: texts.sub2.length > 12 ? 6 : 12 }}>{texts.sub2}</NativeText> : null}
      {enText ? <NativeText school="pku" field="英文" rect={EN} anchor="middle" className={texts.info ? 'pk-info' : 'pk-en'}
        style={{ fontSize: texts.info ? fitText(texts.info, { size: 22, width: TEXT_W, spacing: 4 }) : fitText(enText, { size: 20, width: TEXT_W, spacing: 8 }) }}>{enText}</NativeText> : null}
      <NativeText school="pku" field="底部信息" rect={FOOT} anchor="middle" className="pk-foot"
        style={{ fontSize: fitText(texts.foot, { size: 24, width: TEXT_W, spacing: 8 }) }}>{texts.foot}</NativeText>
    </SchoolStage>
  );
}

// ———— 目录(模板第 43 / 44 / 45 / 42 / 46 页 = 2–6 项) ————

// 每种条目数:第一张卡片的 x、相邻卡片的间距、卡片宽(高都是 439.2,顶边 400.32)
const CARDS = {
  2: { x: 641.8, pitch: 341.2, w: 295.2 },
  3: { x: 471.2, pitch: 341.2, w: 295.2 },
  4: { x: 300.6, pitch: 341.2, w: 295.2 },
  5: { x: 129.82, pitch: 341.28, w: 295.2 },
  6: { x: 107, pitch: 290, w: 256 },
};
const CARD_Y = 400.32;
const CARD_H = 439.2;
const INSET = 14.4;
const NODE = 20.16;

/** 条目说明:模板是两行(「全体起立 / 奏唱国歌」);一句话写进来放不下一行时按标点 / 虚词拆成两行。 */
function descRows(desc, width) {
  if (!desc || desc.includes('\n')) return desc;
  const perLine = Math.max(2, Math.floor(width / 30));
  return fitText(desc, { size: 26, width, spacing: 4 }) >= 26 ? desc : splitTitle(desc, perLine);
}

/** 条目说明:desc;没写时用英文小标 note(模板卡片下半是两行说明,空着很突兀),英文用 Cinzel 小字。 */
function itemDesc(item) {
  const desc = clean(item?.desc);
  const text = desc || clean(item?.note);
  return { text, latin: Boolean(text) && !desc && /^[\x20-\x7E]+$/.test(text) };
}

function Toc({ school, props: p, items, count }) {
  useSchoolStyle(school, 'campus-school-pku-style', CSS);
  const layout = CARDS[count] || CARDS[5];
  const gap = layout.pitch - layout.w;
  const title = String(p.title ?? '');
  const name = clean(p.lead) || clean(p.subtitle);
  const foot = clean(p.motto) || school.defaults.tocMotto;
  return (
    <SchoolStage school={school} page="toc">
      <SchoolImage school={school} file="bg-image51.jpg" rect={[0, 0, 1920, 1080]} />
      <SchoolImage school={school} file="logo-image50.png" rect={[852.2, 89.28, 215.6, 60.48]} />
      <NativeText school="pku" field="目录标题" rect={[0, 175.68, 1919.95, 108]} anchor="middle" className="pk-toc-title"
        style={{ fontSize: fitText(title, { size: 80, width: 1600, spacing: 32 }) }}>{title}</NativeText>
      {name ? <NativeText school="pku" field="典礼名称" rect={[0, 288, 1919.95, 48.96]} anchor="middle" className="pk-toc-name"
        style={{ fontSize: fitText(name, { size: 30, width: 1600, spacing: 8 }) }}>{name}</NativeText> : null}
      <div className="pk-line" style={{ left: 79.42, top: 517.4, width: 1761.12 }} aria-hidden="true" />
      {items.slice(1).map((_, i) => (
        <Diamond key={`n${i}`} rect={[layout.x + (i + 1) * layout.pitch - gap / 2 - NODE / 2, 508.32, NODE, NODE]} />
      ))}
      {items.map((item, i) => {
        const x = layout.x + i * layout.pitch;
        const w = layout.w;
        const itemTitle = String(item?.title ?? '');
        const textW = w - INSET * 2 - 24;
        const { text: rawDesc, latin } = itemDesc(item);
        const desc = latin ? rawDesc : descRows(rawDesc, textW);
        return (
          <React.Fragment key={i}>
            <Plaque rect={[x, CARD_Y, w, CARD_H]} className="pk-card" />
            <Plaque rect={[x + INSET, CARD_Y + INSET, w - INSET * 2, CARD_H - INSET * 2]} className="pk-card-inner" />
            <NativeText school="pku" field={`toc.${i}.num`} rect={[x, 455.04, w, 122.4]} anchor="middle" className="pk-num">{UPPER_NUMS[i]}</NativeText>
            <NativeText school="pku" field={`toc.${i}.title`} rect={[x, 604.8, w, 64.8]} anchor="middle" className="pk-item"
              style={{ fontSize: fitText(itemTitle, { size: 40, width: textW, spacing: 6 }) }}>{itemTitle}</NativeText>
            {desc ? <NativeText school="pku" field={`toc.${i}.desc`} rect={[x, 691.2, w, 103.68]} className={latin ? 'pk-desc is-latin' : 'pk-desc'}
              style={{ fontSize: fitText(desc, { size: latin ? 20 : 26, width: textW, spacing: 4 }) }}>{desc}</NativeText> : null}
          </React.Fragment>
        );
      })}
      <NativeText school="pku" field="底部信息" rect={[0, 933.12, 1919.95, 48.96]} anchor="middle" className="pk-toc-foot"
        style={{ fontSize: fitText(foot, { size: 28, width: 1600, spacing: 8 }) }}>{foot}</NativeText>
    </SchoolStage>
  );
}

export default {
  Cover,
  Toc,
  coverClear: (props, variant) => {
    const clear = [];
    if (!clean(props?.kicker)) clear.push('副标题');
    if (!clean(props?.subtitle)) clear.push('副标题·下');
    if (!infoText(props || {}) && !clean(props?.titleEn)) clear.push('英文');
    if (variant === 'keyword' && !clean(props?.title)) clear.push('主标题·副行');
    return clear;
  },
  // 汇报信息写成两行时,原生页的「英文」框(模板单行高 37.44)改成网页同样的高度,中线不变
  coverBoxes: props => (infoText(props || {}).includes('\n') ? { 英文: EN } : {}),
  tocClear: (props, count) => {
    const clear = [];
    if (!clean(props?.lead) && !clean(props?.subtitle)) clear.push('典礼名称');
    const items = Array.isArray(props?.items) ? props.items.slice(0, count) : [];
    for (let i = 0; i < count; i += 1) if (!itemDesc(items[i]).text) clear.push(`toc.${i}.desc`);
    return clear;
  },
};
