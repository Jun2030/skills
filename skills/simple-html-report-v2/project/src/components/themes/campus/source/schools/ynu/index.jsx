// 云南大学 · 航拍 · 磨砂玻璃卡片(视频背景)。照样板校 ../xmu/index.jsx 的结构写。
//
// 还原依据:模板第 70 / 71 页(封面原版 / 长标题版)与第 73 / 74 / 75 / 72 / 76 页(目录 2–6 项),坐标取自
// `python3 -I scripts/campus-schools/extract-assets.py --school ynu --dump-only` 导出的 output/campus-schools/ynu/slide-<id>.txt。
// 叠放顺序照模板:封面 视频 → 天空蓝渐变遮罩 ×2(上)→ 同一张遮罩上下翻转压在下半幅 → 主标题 / 副标题 / 信息胶囊 → 校徽;
// 目录 模糊底图 → 校徽 → 「目录 CONTENTS」与云大精神 → 磨砂玻璃卡片(编号 + 标题 + 英文 + 白色线性图标)。
// 磨砂玻璃用半透明填充 + 描边(底图本身已是模糊的),不用 backdrop-filter(导出引擎处理不了)。
//
// 通用字段 → 模板字段:
//   封面 原版        title → 主标题（云大精神）(单行大字,超长缩字);subtitle(空时 kicker,再空用云大精神)→ 副标题
//   封面 长标题版    title → 主标题（云大精神）(单行,超过约 22 字时拆两行并缩字);副标题同上
//   两版共用         presenter / advisor / unit / date → 汇报信息(「汇报人：…　|　…」,胶囊随文字加宽)
//   目录             title → 目录标题;subtitle → 英文标题;items[i] 的 no / title / note → toc.i.num / title / en;
//                    云大精神保留学校自己的文字(模板设计,可在预览里改)
// 模板原版把「会泽百家·至公天下」放在主标题、报告名放在副标题;网页版主标题放用户的标题,
// 云大精神在用户没写副标题 / 场景名时作为副标题出现(和长标题版模板一样,宽字距)。
import React from 'react';
import { NativeText, SchoolImage, SchoolStage, SchoolVideo, Layer, fitText, splitTitle, widthEm, charCount, useSchoolStyle } from '../kit.jsx';
import { schoolFontStack } from '../fonts.mjs';

const SHUHEI = schoolFontStack('Alimama ShuHeiTi', 'sans');
const SONG = schoolFontStack('思源宋体 CN Heavy', 'serif');
const SANS = schoolFontStack('思源黑体 CN Regular', 'sans');

const CSS = `
.cp-sch-ynu{background:var(--sch-navy);color:var(--sch-white);}
.cp-sch-ynu .yn-title{font-family:${SHUHEI};font-weight:700;color:var(--sch-white);text-align:center;line-height:1.2;text-shadow:0 4px 20px var(--sch-title-shadow);}
.cp-sch-ynu .yn-sub{font-family:${SONG};font-weight:900;color:var(--sch-white);text-align:center;line-height:1.2;white-space:nowrap;text-shadow:0 4px 12px var(--sch-sub-shadow);}
.cp-sch-ynu .yn-pill{position:absolute;box-sizing:border-box;border-radius:33.12px;background:var(--sch-glass-fill);border:1.5px solid var(--sch-glass-edge-hi);}
.cp-sch-ynu .yn-info{font-family:${SONG};font-weight:900;font-size:32px;letter-spacing:2px;color:var(--sch-white);text-align:center;line-height:1.2;white-space:nowrap;}
.cp-sch-ynu .yn-toc-title{font-family:${SHUHEI};font-weight:700;font-size:132px;letter-spacing:12px;color:var(--sch-white);line-height:1.2;white-space:nowrap;}
.cp-sch-ynu .yn-toc-en{font-family:${SANS};font-size:36px;letter-spacing:20px;color:var(--sch-white);line-height:1.2;white-space:nowrap;}
.cp-sch-ynu .yn-spirit{font-family:${SANS};font-size:24px;letter-spacing:6px;color:var(--sch-spirit);line-height:1.2;white-space:nowrap;}
.cp-sch-ynu .yn-card{position:absolute;box-sizing:border-box;border-radius:20.16px;border:1.5px solid var(--sch-glass-edge);
  background:linear-gradient(180deg,var(--sch-glass-sheen),transparent 55%),var(--sch-glass-fill);}
.cp-sch-ynu .yn-num{font-family:${SHUHEI};font-weight:700;font-size:60px;color:var(--sch-white);line-height:1.2;white-space:nowrap;}
.cp-sch-ynu .yn-item{font-family:${SONG};font-weight:900;letter-spacing:2px;color:var(--sch-white);line-height:1.2;white-space:nowrap;}
.cp-sch-ynu .yn-item-en{font-family:${SANS};letter-spacing:6px;color:var(--sch-en);line-height:1.2;white-space:nowrap;}
`;

const STAGE = [0, 0, 1920, 1080];
// 阿里妈妈数黑体在浏览器里的字形比 PowerPoint 偏下(实测「目录」约 9px、序号约 4px),按对比图上移
const SHUHEI_DY = -9;
const TITLE = [72, 136.77, 1775.95, 172.8];
const SUB = [72, 321.09, 1775.95, 72];
// 信息胶囊:模板宽 685.59(文字框 627.7,两侧各留约 29),文字更长时以画面中线为轴加宽
const PILL = { top: 423.01, height: 66.24, width: 685.59, text: 627.7, pad: 28.94, max: 1500 };
const LOGO_COVER = [842.78, 938.5, 234.45, 72];
const LOGO_TOC = [122.4, 100.8, 234.45, 72];

// 目录:第一张卡片顶边、卡片间距、卡片高、标题框 / 英文框相对卡片顶边的偏移(模板第 73–76、72 页)
const TOC_ROWS = {
  2: { top: 392.1, pitch: 172, h: 123.84, title: 17.2, en: 76.4 },
  3: { top: 314.1, pitch: 164, h: 123.84, title: 17.2, en: 76.4 },
  4: { top: 241.1, pitch: 158, h: 123.84, title: 17.2, en: 76.4 },
  5: { top: 172.8, pitch: 152.64, h: 123.84, title: 17.28, en: 76.32 },
  6: { top: 151.5, pitch: 133, h: 112, title: 12, en: 67 },
};
// 卡片右侧白色线性图标:第一项年度综述、最后一项工作展望,中间按模板顺序取(与模板各版一致)
const TOC_ICONS = {
  2: ['overview', 'outlook'],
  3: ['overview', 'education', 'outlook'],
  4: ['overview', 'education', 'research', 'outlook'],
  5: ['overview', 'education', 'research', 'campus', 'outlook'],
  6: ['overview', 'education', 'research', 'campus', 'global', 'outlook'],
};
// 图标层(SVG 含描边余量)相对卡片垂直居中的尺寸:线性图标 56 → 层 72;地球组合 48 → 层 64×63
const ICON_LAYER = { global: { x: 1676, w: 64, h: 63, inner: 48, pad: 7.5 } };
const ICON_DEFAULT = { x: 1672, w: 72, h: 72, inner: 56, pad: 8 };

const clean = v => String(v ?? '').trim();

function motto(school, p) {
  return clean(p?.motto) || school.defaults.motto;
}

function infoLine(p) {
  const parts = [];
  if (clean(p.presenter)) parts.push(`${clean(p.presenterLabel) || '汇报人'}：${clean(p.presenter)}`);
  if (clean(p.advisor)) parts.push(`${clean(p.advisorLabel) || '指导教师'}：${clean(p.advisor)}`);
  if (clean(p.unit)) parts.push(`${clean(p.unitLabel) || '单位'}：${clean(p.unit)}`);
  if (clean(p.date)) parts.push(clean(p.date));
  return parts.join('　|　');
}

/** 信息胶囊:模板宽 685.59(文字框 627.7),文字更长时以画面中线为轴加宽;导出时原生页的胶囊底与文字框改成同样大小。 */
function pillLayout(info) {
  const need = widthEm(info) * 32 + 2 * Array.from(info).length;
  const textW = Math.min(PILL.max - PILL.pad * 2, Math.max(PILL.text, need + 8));
  const pillW = Math.max(PILL.width, textW + PILL.pad * 2);
  return { textW, pillW, pillX: 960 - pillW / 2 };
}

function coverTexts(school, p, variant) {
  const own = clean(p.subtitle) || clean(p.kicker);
  const sub = own || motto(school, p);
  const raw = String(p.title ?? '').trim();
  let title = raw.replace(/\n/g, '');
  if (variant === 'long_title') {
    // 单行 108px 能放下约 16 字;缩到 80% 仍放不下(约 20 字以上)或用户自己写了换行时拆两行
    const single = widthEm(title) * 108 + 4 * Array.from(title).length;
    if (raw.includes('\n') || single > TITLE[2] * 1.25) title = splitTitle(raw, Math.ceil(charCount(title) / 2));
  }
  return { title, sub, subIsMotto: !own };
}

function Cover({ school, props: p, variant }) {
  useSchoolStyle(school, 'campus-school-ynu-style', CSS);
  const long = variant === 'long_title';
  const { title, sub, subIsMotto } = coverTexts(school, p, variant);
  const twoRows = title.includes('\n');
  const base = long ? 108 : 124;
  const spacing = long ? 4 : 8;
  const titleSize = twoRows
    ? Math.min(80, fitText(title, { size: 80, width: TITLE[2], spacing: 4 }))
    : fitText(title, { size: base, width: TITLE[2], spacing });
  const subSpacing = subIsMotto ? 16 : 6;
  const subSize = fitText(sub, { size: 52, width: SUB[2], spacing: subSpacing });
  const info = infoLine(p);
  const { textW, pillW, pillX } = pillLayout(info);
  return (
    <SchoolStage school={school} page="cover">
      <SchoolVideo school={school} file="video-media8.mp4" poster="video-media8-poster.jpg" rect={[0.5, 0, 1919, 1080]} />
      <SchoolImage school={school} file="img-image66.png" rect={STAGE} />
      <SchoolImage school={school} file="img-image66.png" rect={STAGE} />
      <SchoolImage school={school} file="img-image66.png" rect={[0, 530.67, 1920, 549.33]} style={{ transform: 'scaleY(-1)' }} />
      <NativeText school="ynu" field="主标题（云大精神）" rect={TITLE} anchor="middle" nowrap className="yn-title"
        style={{ fontSize: titleSize, letterSpacing: (twoRows ? 4 : spacing) * (titleSize / (twoRows ? 80 : base)), lineHeight: twoRows ? 1.1 : 1.2 }}>{title}</NativeText>
      <NativeText school="ynu" field="副标题" sync={subIsMotto ? 'ynu-motto' : undefined} rect={SUB} anchor="middle" className="yn-sub"
        style={{ fontSize: subSize, letterSpacing: subSpacing * (subSize / 52) }}>{sub}</NativeText>
      {info ? (
        <>
          <div className="yn-pill" style={{ left: pillX, top: PILL.top, width: pillW, height: PILL.height }} aria-hidden="true" />
          <NativeText school="ynu" field="汇报信息" rect={[960 - textW / 2, PILL.top, textW, PILL.height]} anchor="middle" className="yn-info"
            style={{ fontSize: fitText(info, { size: 32, width: textW, spacing: 2 }) }}>{info}</NativeText>
        </>
      ) : null}
      <SchoolImage school={school} file="logo-image67.png" rect={LOGO_COVER} />
    </SchoolStage>
  );
}

function Toc({ school, props: p, items, count }) {
  useSchoolStyle(school, 'campus-school-ynu-style', CSS);
  const row = TOC_ROWS[count];
  const icons = TOC_ICONS[count];
  return (
    <SchoolStage school={school} page="toc">
      <SchoolImage school={school} file="bg-image68.jpg" rect={STAGE} />
      <SchoolImage school={school} file="logo-image67.png" rect={LOGO_TOC} />
      <NativeText school="ynu" field="目录标题" rect={[118.08, 352.8 + SHUHEI_DY, 518.4, 158.4]} anchor="middle" className="yn-toc-title"
        style={{ fontSize: fitText(p.title, { size: 132, width: 640, spacing: 12 }) }}>{p.title}</NativeText>
      <NativeText school="ynu" field="英文标题" rect={[126.72, 515.52, 518.4, 57.6]} anchor="middle" className="yn-toc-en"
        style={{ fontSize: fitText(p.subtitle, { size: 36, width: 620, spacing: 20 }) }}>{p.subtitle}</NativeText>
      <NativeText school="ynu" field="云大精神" sync="ynu-motto" rect={[126.72, 928.8, 576, 46.08]} anchor="middle" className="yn-spirit">{motto(school, p)}</NativeText>
      {items.map((item, i) => {
        const top = row.top + i * row.pitch;
        const title = String(item?.title ?? '');
        const en = clean(item?.note);
        const icon = ICON_LAYER[icons[i]] || ICON_DEFAULT;
        // 没有英文小标时标题在卡片里垂直居中
        const titleTop = en ? top + row.title : top + (row.h - 57.6) / 2;
        return (
          <React.Fragment key={i}>
            <div className="yn-card" style={{ left: 784.8, top, width: 1015.2, height: row.h }} aria-hidden="true" />
            <NativeText school="ynu" field={`toc.${i}.num`} rect={[839.52, top + SHUHEI_DY / 2, 129.6, row.h]} anchor="middle" className="yn-num">{item?.no || String(i + 1).padStart(2, '0')}</NativeText>
            <NativeText school="ynu" field={`toc.${i}.title`} rect={[986.4, titleTop - 3, 678, 57.6]} anchor="middle" className="yn-item"
              style={{ fontSize: fitText(title, { size: 40, width: 670, spacing: 2 }) }}>{title}</NativeText>
            {en ? <NativeText school="ynu" field={`toc.${i}.en`} rect={[989.28, top + row.en, 678, 31.68]} anchor="middle" className="yn-item-en"
              style={{ fontSize: fitText(en, { size: 20, width: 670, spacing: 6 }) }}>{en}</NativeText> : null}
            <Layer school={school} name={`icon-${icons[i]}`} rect={[icon.x, top + (row.h - icon.inner) / 2 - icon.pad, icon.w, icon.h]} />
          </React.Fragment>
        );
      })}
    </SchoolStage>
  );
}

export default {
  Cover,
  Toc,
  // 副标题总有内容(兜底是云大精神);汇报信息全空时清空模板里的信息框
  coverClear: props => (infoLine(props || {}) ? [] : ['汇报信息']),
  // 信息胶囊随文字加宽:原生页的「信息胶囊底」和「汇报信息」框改成和网页一样的位置与宽度
  coverBoxes: props => {
    const info = infoLine(props || {});
    if (!info) return {};
    const { textW, pillW, pillX } = pillLayout(info);
    if (pillW <= PILL.width + 0.5) return {};
    const r = v => Math.round(v * 100) / 100;
    return { 信息胶囊底: [r(pillX), PILL.top, r(pillW), PILL.height], 汇报信息: [r(960 - textW / 2), PILL.top, r(textW), PILL.height] };
  },
  // 条目没写英文小标时清空模板里对应的英文框
  tocClear: (props, count) => Array.from({ length: count }, (_, i) => (Array.isArray(props?.items) ? props.items[i] : null))
    .map((item, i) => (clean(item?.note) ? null : `toc.${i}.en`)).filter(Boolean),
};
