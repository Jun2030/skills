// 上海交通大学 · 红韵天空(3D 建筑)——样板校,写其他 3D 学校时照这个文件的结构来。
//
// 还原依据:模板第 1、2 页(封面原版 / 长标题版)与第 3–7 页(目录 2–6 项),坐标取自
// `python3 -I scripts/campus-schools/extract-assets.py --school sjtu --dump-only` 导出的 output/campus-schools/sjtu/slide-<id>.txt
// (1920×1080 舞台 px,字号已按 1pt = 2px 换算)。矢量装饰层由 ./layers.json 合成,box 抄自素材清单 manifest.json 的 layers。
//
// 通用字段 → 模板字段:
//   封面 原版     title → 主标题(单行,超长自动缩小);subtitle → 副标题(为空时清空副标题,两侧短横线也不画)
//   封面 长标题版  title → 主标题(拆成两行,每行 ≤ 14 字;标题一行放得下时第二行接 subtitle);模板这一版没有副标题框
//   目录          title → 目录标题;subtitle → 英文目录标题;items[i].no / title → toc.i.num / toc.i.title
// 校门 3D 渲染图在封面和目录上姿态不同,两张图都打 data-morph-key="school-model",放映时封面 → 目录平滑移动。
import React from 'react';
import { NativeText, SchoolImage, SchoolStage, Layer, MORPH_MODEL, MORPH_LOGO, fitText, splitTitle, useSchoolStyle } from '../kit.jsx';
import { schoolFontStack } from '../fonts.mjs';

const TITLE_FONT = schoolFontStack('Ma Shan Zheng');
const ITEM_FONT = schoolFontStack('Source Han Serif SC Heavy');
const SUB_FONT = "'SimHei','Heiti SC','STHeiti','PingFang SC','Microsoft YaHei',sans-serif";
const LATIN_SERIF = "'Times New Roman','Times','Newsreader',serif";

const CSS = `
.cp-sch-sjtu.is-cover{background:var(--sch-sky);}
.cp-sch-sjtu .sj-title{font-family:${TITLE_FONT};color:var(--sch-red);text-align:center;line-height:1.2;font-weight:400;}
.cp-sch-sjtu .sj-sub{font-family:${SUB_FONT};font-size:33.28px;color:var(--sch-red-deep);text-align:center;letter-spacing:.5em;text-indent:.5em;line-height:1.2;white-space:nowrap;}
.cp-sch-sjtu.is-toc{background:linear-gradient(190deg,var(--sch-toc-bg-a),var(--sch-toc-bg-b));}
.cp-sch-sjtu .sj-toc-title{font-family:${TITLE_FONT};font-size:166.4px;color:var(--sch-red);line-height:1.2;white-space:nowrap;}
.cp-sch-sjtu .sj-toc-en{font-family:${LATIN_SERIF};font-size:34.42px;color:var(--sch-red);letter-spacing:.25em;line-height:1.2;white-space:nowrap;}
.cp-sch-sjtu .sj-row{position:absolute;border-radius:35.6px;background:var(--sch-row-fill);border:1.2px solid var(--sch-row-edge);}
.cp-sch-sjtu .sj-num{font-family:${LATIN_SERIF};font-weight:700;font-size:48.2px;color:var(--sch-num-ink);text-align:center;line-height:1.2;white-space:nowrap;}
.cp-sch-sjtu .sj-item{font-family:${ITEM_FONT};color:var(--sch-red-ink);line-height:1.2;white-space:nowrap;}
.cp-sch-sjtu .sj-mark{position:absolute;height:3px;border-radius:1.5px;background:var(--sch-red-mark);}
`;

// 目录:每种条目数的第一行顶边与行距(模板第 4–7、3 页「目录 1 · 浅色圆角底框」的 y 与相邻两行之差)
const TOC_ROWS = { 2: [509.4, 152], 3: [449.4, 136], 4: [399.4, 124], 5: [357.4, 114], 6: [321.36, 105.59] };
// 行尾线性图标:第一项校门、最后一项嫩芽,中间按顺序取学士帽 / 烧瓶 / 地球 / 人群(与模板各版一致)
const TOC_ICONS = { 2: ['gate', 'sprout'], 3: ['gate', 'cap', 'sprout'], 4: ['gate', 'cap', 'flask', 'sprout'], 5: ['gate', 'cap', 'flask', 'globe', 'sprout'], 6: ['gate', 'cap', 'flask', 'globe', 'people', 'sprout'] };
// 图标层的位置:相对所在行顶边的偏移(取自 6 项版,行顶 321.36 + i × 105.59)
const ICON_BOX = {
  gate: [1661, 1.64, 108, 69], cap: [1674, 4.05, 85, 67], flask: [1683, 4.46, 68, 68],
  globe: [1686, 2.87, 67, 67], people: [1667, 3.28, 101, 70], sprout: [1680, 8.69, 75, 63],
};

function Cover({ school, props: p, variant }) {
  useSchoolStyle(school, 'campus-school-sjtu-style', CSS);
  const long = variant === 'long_title';
  // 长标题版是两行大字:标题本身要拆两行时拆开;一行放得下时第二行放副标题(和模板「标题 / 副标题」两行的写法一致)
  const subtitleText = String(p.subtitle ?? '').trim();
  const split = splitTitle(p.title, school.titleCaps.long_title);
  const title = long
    ? (split.includes('\n') || !subtitleText ? split : `${split}\n${subtitleText}`)
    : String(p.title ?? '').replace(/\n/g, '');
  const titleSize = long
    ? fitText(title, { size: 112, width: 1680 })
    : fitText(title, { size: 176.74, width: 1680 });
  const subtitle = subtitleText;
  return (
    <SchoolStage school={school} page="cover">
      <SchoolImage school={school} file="img-image1.jpg" rect={[0, 0, 1920, 1080]} />
      {long
        ? <NativeText school="sjtu" field="主标题" rect={[120, 228, 1680, 271.42]} className="sj-title" style={{ fontSize: titleSize, lineHeight: 1.18 }}>{title}</NativeText>
        : <NativeText school="sjtu" field="主标题" rect={[120, 218.07, 1680, 218.07]} anchor="middle" nowrap className="sj-title" style={{ fontSize: titleSize }}>{title}</NativeText>}
      {!long && subtitle ? (
        <>
          <NativeText school="sjtu" field="副标题" rect={[600, 446.46, 720, 44.76]} anchor="middle" letterGap=" " className="sj-sub" style={{ fontSize: fitText(subtitle, { size: 33.28, width: 560, spacing: 16.64 }) }}>{subtitle}</NativeText>
          <Layer school={school} name="cover-dashes" rect={[609, 465, 702, 14]} />
        </>
      ) : null}
      <SchoolImage school={school} file="logo-image2.png" rect={[744.61, 94.57, 430.78, 125.79]} morph={MORPH_LOGO} />
      <SchoolImage school={school} file="model-image3.png" rect={[242.3, 445.7, 1435.4, 656]} morph={MORPH_MODEL} />
      <Layer school={school} name="cover-ribbons" rect={[-6, 738, 1932, 349]} />
    </SchoolStage>
  );
}

function Toc({ school, props: p, items, count }) {
  useSchoolStyle(school, 'campus-school-sjtu-style', CSS);
  const [top, pitch] = TOC_ROWS[count];
  const icons = TOC_ICONS[count];
  return (
    <SchoolStage school={school} page="toc">
      <Layer school={school} name="toc-back" rect={[285, -4, 1639, 1088]} />
      <SchoolImage school={school} file="model-image4.png" rect={[-586.1, 97.56, 1819.64, 1094.9]} morph={MORPH_MODEL} />
      <SchoolImage school={school} file="logo-image2.png" rect={[68.23, 63.21, 330.54, 96.52]} morph={MORPH_LOGO} />
      <Layer school={school} name="toc-front" rect={[697, 839, 1227, 245]} />
      <NativeText school="sjtu" field="目录标题" rect={[932.45, 95.26, 332.84, 190.52]} anchor="middle" className="sj-toc-title">{p.title}</NativeText>
      <NativeText school="sjtu" field="英文目录标题" rect={[1265.29, 200.85, 360, 45.91]} anchor="middle" letterGap=" " className="sj-toc-en">{p.subtitle}</NativeText>
      <Layer school={school} name="toc-title-lines" rect={[1181, 244, 643, 22]} />
      {items.map((item, i) => {
        const y = top + i * pitch;
        const icon = ICON_BOX[icons[i]];
        const text = String(item?.title ?? '');
        return (
          <React.Fragment key={i}>
            <div className="sj-row" style={{ left: 967.46, top: y, width: 848.74, height: 78.04 }} aria-hidden="true" />
            <Layer school={school} name="toc-num" rect={[958, y - 4.36, 185, 87]} />
            <NativeText school="sjtu" field={`toc.${i}.num`} rect={[1004.19, y + 8.03, 75.75, 60.83]} anchor="middle" className="sj-num">{item?.no || String(i + 1).padStart(2, '0')}</NativeText>
            <NativeText school="sjtu" field={`toc.${i}.title`} rect={[1177.49, y + 8.03, 482.04, 60.83]} anchor="middle" className="sj-item" style={{ fontSize: fitText(text, { size: 41.32, width: 482 }) }}>{text}</NativeText>
            <div className="sj-mark" style={{ left: 1400.15, top: y + 70.8, width: 17.22 }} aria-hidden="true" />
            <Layer school={school} name={`icon-${icons[i]}`} rect={[icon[0], y + icon[1], icon[2], icon[3]]} />
          </React.Fragment>
        );
      })}
    </SchoolStage>
  );
}

export default {
  Cover,
  Toc,
  // 原版的副标题为空时清空模板里的副标题框(导出换回原生页时写 "")
  coverClear: (props, variant) => (variant === 'default' && !String(props?.subtitle ?? '').trim() ? ['副标题'] : []),
};
