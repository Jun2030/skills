// 厦门大学 · 南方之强 · 深蓝弧幕(视频背景)——样板校,写其他视频学校时照这个文件的结构来。
//
// 还原依据:模板第 62–64 页(封面原版 / 长标题版 / 关键词大字版)与第 65–69 页(目录 2–6 项),坐标取自
// `python3 -I scripts/campus-schools/extract-assets.py --school xmu --dump-only` 导出的 output/campus-schools/xmu/slide-<id>.txt。
// 叠放顺序照模板:视频 → 左侧深色渐变遮罩(PNG)→ 文字 / 校徽 → 底部弧幕(SVG);目录:视频(裁切)→ 弧带 + 右幕 → 校徽水印 → 白色细弧线 → 文字。
//
// 通用字段 → 模板字段:
//   封面 原版       title → 主标题;subtitle(空时 kicker)→ 副标题
//   封面 长标题版    title → 主标题(两行,每行 ≤ 10 字);subtitle(空时 kicker)→ 副标题
//   封面 关键词版    kit 的 coverKeyword(keyword → 场景名推出的短词,如「本科毕业论文答辩」→「毕业答辩」→ 学校口号「南方之强」)→ 主标题;
//                   title → 副标题(完整题目;超过 16 字时拆成两行)
//   三版共用        presenterLabel / presenter [/ advisor] / date → 讲堂信息(「汇报人：…　|　…」);motto → 封面-页脚(「校训　…」)
//   目录            title → 目录-标题;subtitle → 目录-英文;items[i] 的 no / title / desc → toc.i.num / title / desc;
//                   封面-页脚与封面同一段文字(data-sync-text,预览里改一处两页一起变)
import React from 'react';
import { NativeText, SchoolImage, SchoolStage, SchoolVideo, Layer, charCount, coverKeyword, fitText, splitTitle, useSchoolStyle } from '../kit.jsx';
import { schoolFontStack } from '../fonts.mjs';

const HEAVY = schoolFontStack('Source Han Serif CN Heavy');
const SEMI = schoolFontStack('Source Han Serif CN SemiBold');
const SANS = schoolFontStack('思源黑体 CN Regular', 'sans');
const NUM = `'Playfair Display Black',${schoolFontStack('Source Han Serif CN Heavy')}`;

const CSS = `
.cp-sch-xmu{background:var(--sch-navy);color:var(--sch-white);}
.cp-sch-xmu .xm-title{font-family:${HEAVY};font-weight:900;color:var(--sch-white);line-height:1.2;text-shadow:0 4px 24px var(--sch-title-shadow);}
.cp-sch-xmu .xm-sub{font-family:${SEMI};font-weight:600;color:var(--sch-white);line-height:1.2;white-space:nowrap;}
.cp-sch-xmu .xm-info{font-family:${SANS};font-size:30px;letter-spacing:6px;color:var(--sch-white);line-height:1.2;white-space:nowrap;}
.cp-sch-xmu .xm-dash{position:absolute;height:4px;background:var(--sch-orange);}
.cp-sch-xmu .xm-foot{font-family:${SANS};font-size:19px;letter-spacing:6px;color:var(--sch-white-80);text-align:right;line-height:1.2;white-space:nowrap;}
.cp-sch-xmu .xm-toc-title{font-family:${HEAVY};font-weight:900;font-size:108px;letter-spacing:16px;color:var(--sch-white);line-height:1.3;white-space:nowrap;}
.cp-sch-xmu .xm-toc-en{font-family:${SANS};font-size:28px;letter-spacing:8px;color:var(--sch-orange);line-height:1;white-space:nowrap;}
.cp-sch-xmu .xm-num{font-family:${NUM};font-weight:900;font-size:80px;color:var(--sch-orange);line-height:1;white-space:nowrap;}
.cp-sch-xmu .xm-item{font-family:${SEMI};font-weight:600;letter-spacing:6px;color:var(--sch-white);line-height:1.2;white-space:nowrap;}
.cp-sch-xmu .xm-desc{font-family:${SANS};letter-spacing:2px;color:var(--sch-desc);line-height:1.2;white-space:nowrap;}
`;

// 三种封面的文字框位置(模板第 62 / 63 / 64 页)
const COVER = {
  default: { title: [108, 329.24, 1008, 187.2], titleSize: 192, titleSpacing: 12, sub: [108, 538.4, 1008, 79.2], subSize: 52, subSpacing: 6, info: [108, 692.17, 1008, 57.6], dash: 648 },
  long_title: { title: [108, 292, 1008, 224.38], titleSize: 92, titleSpacing: 4, sub: [108, 524.38, 1008, 72], subSize: 48, subSpacing: 6, info: [108, 670.95, 1008, 57.6], dash: 626.78 },
  keyword: { title: [108, 329.24, 1008, 187.2], titleSize: 192, titleSpacing: 12, sub: [108, 538.4, 1008, 84], subSize: 60, subSpacing: 4, info: [108, 692.17, 1008, 57.6], dash: 648,
    // 完整题目拆成两行时:60px 两行高约 144px,在 84px 的框里居中会上压大字、下压橙色短线,
    // 改用大字下沿到短线之间的框(约 112px)和 46px 字号,两行正好放下
    sub2: [108, 530, 1008, 112], sub2Size: 46 },
};

// 目录:每种条目数下序号框左上角(模板「目录-0N-序号」,按从上到下排);条目标题在序号右侧 139.2、下移 0.87,说明再下移 67.6
const TOC_NUMS = {
  2: [[953.56, 437.53], [980.56, 627.53]],
  3: [[968.23, 345.53], [956.18, 531.53], [1019.87, 717.53]],
  4: [[962.58, 275.29], [954.58, 445.69], [983.91, 618.69], [1069.01, 789.87]],
  5: [[1000.32, 235.53], [958.47, 395.53], [960.39, 555.53], [1018.86, 715.53], [1103.04, 875.53]],
  6: [[1001.68, 231.53], [964.94, 360.33], [952.45, 489.13], [977.26, 617.93], [1035.03, 746.73], [1103.04, 875.53]],
};

const LOGO = [108, 75.41, 264.39, 74.88];
// 关键词版副标题(完整题目)一行约 16 字(字段表「约容纳」),更长时拆成两行
const KEYWORD_SUB_LINE = 16;
const FOOT = [1060, 1016, 760, 40];

function infoLine(p) {
  const parts = [];
  const presenter = String(p.presenter ?? '').trim();
  if (presenter) parts.push(`${p.presenterLabel || '汇报人'}：${presenter}`);
  const advisor = String(p.advisor ?? '').trim();
  if (advisor) parts.push(`${p.advisorLabel || '指导教师'}：${advisor}`);
  const date = String(p.date ?? '').trim();
  if (date) parts.push(date);
  return parts.join('　|　');
}

function footLine(p, school) {
  const motto = String(p.motto ?? '').trim() || school.defaults.motto;
  return `${school.defaults.mottoLabel}　${motto}`;
}

function Footer({ school, p }) {
  return <NativeText school="xmu" field="封面-页脚" sync="xmu-footer" rect={FOOT} anchor="middle" className="xm-foot">{footLine(p, school)}</NativeText>;
}

function coverTexts(school, p, variant) {
  const sub = String(p.subtitle ?? '').trim() || String(p.kicker ?? '').trim();
  if (variant === 'keyword') {
    const full = String(p.title ?? '').replace(/\n/g, '').trim();
    return {
      title: coverKeyword(school, p),
      sub: charCount(full) > KEYWORD_SUB_LINE ? splitTitle(full, KEYWORD_SUB_LINE + 2) : full,
    };
  }
  if (variant === 'long_title') return { title: splitTitle(p.title, school.titleCaps.long_title), sub };
  return { title: String(p.title ?? '').replace(/\n/g, ''), sub };
}

function Cover({ school, props: p, variant }) {
  useSchoolStyle(school, 'campus-school-xmu-style', CSS);
  const box = COVER[variant] || COVER.default;
  const { title, sub } = coverTexts(school, p, variant);
  const info = infoLine(p);
  const long = variant === 'long_title';
  const titleSize = fitText(title, { size: box.titleSize, width: box.title[2], spacing: box.titleSpacing });
  const twoLineSub = Boolean(box.sub2) && sub.includes('\n');
  const subRect = twoLineSub ? box.sub2 : box.sub;
  const subSize = twoLineSub ? box.sub2Size : box.subSize;
  return (
    <SchoolStage school={school} page="cover">
      <SchoolVideo school={school} file="video-media7.mp4" poster="video-media7-poster.jpg" rect={[0, 0, 1920, 1080]} />
      <SchoolImage school={school} file="img-image61.png" rect={[0, 0, 1920, 1080]} />
      <NativeText school="xmu" field="主标题" rect={box.title} anchor={long ? 'top' : 'middle'} nowrap className="xm-title"
        style={{ fontSize: titleSize, letterSpacing: box.titleSpacing * (titleSize / box.titleSize), lineHeight: long ? 1.18 : 1.2 }}>{title}</NativeText>
      {sub ? <NativeText school="xmu" field="副标题" rect={subRect} anchor="middle" className="xm-sub"
        style={{ fontSize: fitText(sub, { size: subSize, width: subRect[2], spacing: box.subSpacing }), letterSpacing: box.subSpacing }}>{sub}</NativeText> : null}
      <div className="xm-dash" style={{ left: 118, top: box.dash - 2, width: 38 }} aria-hidden="true" />
      {info ? <NativeText school="xmu" field="讲堂信息" rect={box.info} anchor="middle" className="xm-info"
        style={{ fontSize: fitText(info, { size: 30, width: box.info[2], spacing: 6 }) }}>{info}</NativeText> : null}
      <SchoolImage school={school} file="logo-image62.png" rect={LOGO} />
      <Layer school={school} name="cover-band" rect={[-4, 826, 1928, 278]} />
      <Footer school={school} p={p} />
    </SchoolStage>
  );
}

function Toc({ school, props: p, items, count }) {
  useSchoolStyle(school, 'campus-school-xmu-style', CSS);
  const nums = TOC_NUMS[count];
  return (
    <SchoolStage school={school} page="toc">
      <SchoolVideo school={school} file="video-media7.mp4" poster="video-media7-poster.jpg" rect={[0, 0, 1002, 1080]} crop={{ l: 0.43877, r: 0.03909 }} />
      <Layer school={school} name="toc-curtain" rect={[788, -34, 1156, 1145]} />
      <SchoolImage school={school} file="img-image63.png" rect={[1314.81, 0, 1080, 1080]} alpha={0.09} />
      <Layer school={school} name="toc-goldline" rect={[808, -23, 226, 1127]} />
      <SchoolImage school={school} file="logo-image62.png" rect={LOGO} />
      <NativeText school="xmu" field="目录-标题" rect={[1150, 70, 400, 120]} anchor="bottom" className="xm-toc-title">{p.title}</NativeText>
      <NativeText school="xmu" field="目录-英文" rect={[1400.91, 140, 400, 30]} className="xm-toc-en">{p.subtitle}</NativeText>
      {items.map((item, i) => {
        const [x, y] = nums[i];
        const title = String(item?.title ?? '');
        const desc = String(item?.desc ?? '').trim();
        return (
          <React.Fragment key={i}>
            <NativeText school="xmu" field={`toc.${i}.num`} rect={[x, y, 110, 96.94]} anchor="middle" className="xm-num">{item?.no || String(i + 1).padStart(2, '0')}</NativeText>
            <NativeText school="xmu" field={`toc.${i}.title`} rect={[x + 139.2, y + 0.87, 441.4, 64.8]} anchor="middle" className="xm-item"
              style={{ fontSize: fitText(title, { size: 44, width: 560, spacing: 6 }) }}>{title}</NativeText>
            {desc ? <NativeText school="xmu" field={`toc.${i}.desc`} rect={[x + 139.2, y + 68.47, 441.4, 43.2]} anchor="middle" className="xm-desc"
              style={{ fontSize: fitText(desc, { size: 26, width: 600, spacing: 2 }) }}>{desc}</NativeText> : null}
          </React.Fragment>
        );
      })}
      <Footer school={school} p={p} />
    </SchoolStage>
  );
}

export default {
  Cover,
  Toc,
  coverClear: (props, variant) => {
    const clear = [];
    if (!coverTexts({ defaults: {}, titleCaps: { long_title: 10 } }, props, variant).sub) clear.push('副标题');
    if (!infoLine(props)) clear.push('讲堂信息');
    return clear;
  },
  // 条目说明为空时清空模板里对应的说明框
  tocClear: (props, count) => (Array.isArray(props?.items) ? props.items.slice(0, count) : [])
    .map((item, i) => (String(item?.desc ?? '').trim() ? null : `toc.${i}.desc`)).filter(Boolean),
};
