// 东北大学 · 雪国来信(明信片)。视频在明信片的照片框里;封面 = 明信片正面,目录 = 明信片背面。照样板校 ../xmu/index.jsx 的结构写。
//
// 还原依据:模板第 77 / 78 / 79 页(封面原版 / 长标题版 / 关键词大字版)与第 81 / 82 / 80 / 83 / 84 页(目录 2–6 项),坐标取自
// `python3 -I scripts/campus-schools/extract-assets.py --school neu --dump-only` 导出的 output/campus-schools/neu/slide-<id>.txt。
// 叠放顺序照模板:信纸纹理 → 上下航空条 → 主讲人 / 日期 → 校徽 → 明信片卡(-2°,投影)→ 左侧文字 → 卡内视频(-2°,裁切)
// → 邮戳波纹 → 邮戳 → 邮票(5°,投影);目录:信纸 → 航空条 → 照片卡(-3°)+ 明信片背面 → 邮编格 / 目录 / 收件栏 → 校徽 → 邮戳邮票 → 视频。
// 素材里的 logo-image74(邮戳)、logo-image75(邮票)不是校徽,按装饰图用。所有分隔线、邮编格用 CSS 画(模板是简单线框)。
//
// 通用字段 → 模板字段:
//   封面 原版        kicker(+ 指导教师 + unit,放不下时不放 unit)→ !!寄自标签(模板没有导师框,导师并进这一行,网页与原生页同一写法);title → 主标题(单行,超长缩字);titleEn(空用英文校名)→ 英文校名;
//                    subtitle(空时用校训)→ 校歌引句
//   封面 长标题版    title → 主标题(两行,每行 ≤ 6 字);其余同上
//   封面 关键词版    kit 的 coverKeyword(keyword → 场景名推出的短词 → 「东北大学」)→ 主标题;title → 副标题（长）(放不下时拆两行,下方文字随之下移);其余同上
//   三版共用         presenterLabel / presenter → !!寄件人_标签 / !!寄件人_值;dateLabel / date → !!日期_标签 / !!日期_值
//                    (标签后接 Cutive Mono 的「  FROM」「  DATE」,两个空格照模板原文保留在 DOM 里)
//   目录             title / subtitle → 目录标题 / 目录英文;items[i] 的 no / title / desc(空时 note)→ toc.i.num(「No.」+ 编号)/ title / desc;
//                    邮编 1–6 固定为东北大学邮编 110819;收件栏:lead(空时「各位老师、同学」)→ 收件_1,校址 → 收件_2,「东北大学　校训」→ 收件_3;
//                    !!寄件人 / !!日期 取 deck 级封面信息(kit 的 useDeckCover),与封面同一段文字(data-sync-text,预览里改一处两页一起变)
// 封面 → 目录的平滑过渡:明信片卡、照片视频打相同的 data-morph-key(模板里 !! 同名形状做 Morph);主讲人 / 日期文字行交叉淡化。
import React from 'react';
import { NativeText, SchoolImage, SchoolStage, box, coverKeyword, cropFrame, fitText, joinInfo, labeled, splitTitle, widthEm, charCount, paletteVars, useDeckCover, useSchoolStyle } from '../kit.jsx';
import { schoolAsset } from '../registry.mjs';
import { schoolFontStack } from '../fonts.mjs';

const HEAVY = schoolFontStack('Source Han Serif CN Heavy');
const SEMI = schoolFontStack('Source Han Serif CN SemiBold');
const MEDIUM = schoolFontStack('Source Han Serif CN Medium');
const KAI = schoolFontStack('LXGW WenKai');
const MONO = `'Cutive Mono','Courier New',monospace`;

const CSS = `
.cp-sch-neu{background:var(--sch-paper);color:var(--sch-ink);}
.nu-card{position:absolute;inset:0;background:var(--sch-card);box-shadow:0 8px 26px var(--sch-card-shadow);}
.cp-sch-neu .nu-stamp{filter:drop-shadow(0 2px 4px var(--sch-stamp-shadow));}
.cp-sch-neu .nu-from{font-family:${MEDIUM};font-weight:500;font-size:24px;letter-spacing:6px;color:var(--sch-blue);line-height:1.2;white-space:nowrap;}
.cp-sch-neu .nu-title{font-family:${HEAVY};font-weight:900;color:var(--sch-blue);line-height:1.2;white-space:nowrap;}
.cp-sch-neu .nu-en{font-family:${MEDIUM};font-weight:500;font-size:22px;letter-spacing:8.6px;color:var(--sch-ink);line-height:1.2;white-space:nowrap;}
.cp-sch-neu .nu-quote{font-family:${KAI};font-size:48px;letter-spacing:4px;color:var(--sch-ink);line-height:1.2;white-space:nowrap;}
.cp-sch-neu .nu-rule{position:absolute;height:3px;border-radius:1.5px;background:var(--sch-blue);}
.nu-label{font-family:${MEDIUM};font-weight:500;font-size:20px;letter-spacing:2px;color:var(--sch-label);line-height:1.2;white-space:pre;}
.nu-label .nu-mono{font-family:${MONO};font-size:17px;letter-spacing:0;}
.nu-value{font-family:${KAI};font-size:32px;color:var(--sch-ink);line-height:1.2;white-space:nowrap;}
.nu-dots{position:absolute;height:0;border-top:2px dotted var(--sch-line-toc);}
.nu-fly.is-cover .nu-dots{border-top-color:var(--sch-line-cover);}
.cp-sch-neu .nu-zip{position:absolute;box-sizing:border-box;border:2.5px solid var(--sch-blue);}
.cp-sch-neu .nu-zip-digit{font-family:${KAI};font-size:34px;color:var(--sch-ink);text-align:center;line-height:1.2;white-space:nowrap;}
.cp-sch-neu .nu-seam{position:absolute;width:0;border-left:2px solid var(--sch-seam);}
.cp-sch-neu .nu-toc-title{font-family:${HEAVY};font-weight:900;font-size:64px;letter-spacing:12px;color:var(--sch-blue);line-height:1.2;white-space:nowrap;}
.cp-sch-neu .nu-toc-en{font-family:${MONO};font-size:20px;letter-spacing:6px;color:var(--sch-label);line-height:1.2;white-space:nowrap;}
.cp-sch-neu .nu-num{font-family:${HEAVY};font-weight:900;color:var(--sch-blue);line-height:1.2;white-space:nowrap;}
.cp-sch-neu .nu-item{font-family:${SEMI};font-weight:700;letter-spacing:6px;color:var(--sch-ink);line-height:1.2;white-space:nowrap;}
.cp-sch-neu .nu-desc{font-family:${KAI};letter-spacing:1px;color:var(--sch-label);line-height:1.2;white-space:nowrap;}
.cp-sch-neu .nu-to{font-family:${KAI};color:var(--sch-ink);line-height:1.2;white-space:nowrap;}
`;

const STAGE = [0, 0, 1920, 1080];
const LOGO = [96, 63.25, 232.67, 62.5];
// 封面:三种版式下各文字框的位置(模板第 77 / 78 / 79 页)
const COVER = {
  default: { title: [90, 354.5, 690, 160], size: 144, spacing: 20, lh: 1.2, en: 522.5, rule: 581.77, quote: 612.83 },
  long_title: { title: [90, 354.5, 690, 236], size: 100, spacing: 12, lh: 0.95 * 1.2, en: 594.5, rule: 653.77, quote: 684.83 },
  keyword: { title: [90, 354.5, 690, 160], size: 144, spacing: 20, lh: 1.2, sub: [90, 522.5, 690, 60], en: 602.5, rule: 661.77, quote: 692.83 },
};
// 明信片(封面正面 / 目录背面)与照片视频:位置、旋转、裁切
const CARD_COVER = { rect: [808.33, 194.46, 999.33, 681.54], rot: -2 };
const CARD_TOC = { rect: [760, 168, 1064, 762], rot: 0 };
const PHOTO_CARD = { rect: [122, 186, 580, 760], rot: -3 };
const VIDEO_COVER = { file: 'video-media9.mp4', poster: 'video-media9-poster.jpg', rect: [827, 217.47, 962, 635.53], rot: -2, crop: { l: 0.05663, r: 0.09147 } };
const VIDEO_TOC = { file: 'video-media10.mp4', poster: 'video-media10-poster.jpg', rect: [140.06, 206.66, 539.58, 743.53], rot: -3, crop: { l: 0.52657, t: 0.02112, r: 0.06523, b: -0.02112 } };
// 主讲人 / 日期两行(行内:标签在 (0,10),手写值在 (150,0),虚线在 (142,44));封面左下,目录收件栏下方,行距 62
const ROWS_COVER = [96, 846];
const ROWS_TOC = [1344, 684];
const ROW_PITCH = 62;
// 目录条目:每种条目数的第一行序号框 y、行距、字号,以及标题 / 说明 / 虚线相对序号框的偏移(模板第 81 / 82 / 80 / 83 / 84 页)
const TOC_ROWS = {
  2: { top: 432, pitch: 136, no: [22, 32], item: 36, desc: 20, dy: [-6, 46, 90], h: [46, 30] },
  3: { top: 432, pitch: 128, no: [22, 32], item: 36, desc: 20, dy: [-6, 46, 90], h: [46, 30] },
  4: { top: 432, pitch: 118, no: [22, 32], item: 36, desc: 20, dy: [-6, 46, 90], h: [46, 30] },
  5: { top: 422, pitch: 96, no: [20, 28], item: 32, desc: 18, dy: [-4, 40, 76], h: [41.6, 27] },
  6: { top: 413, pitch: 81, no: [18, 25], item: 29, desc: 17, dy: [-3, 36, 65], h: [37.7, 25.5] },
};

const clean = v => String(v ?? '').trim();

/** 「日期」这类两字标签照模板写成「日　期」,和三字的「主讲人」对齐。 */
function spaced(label) {
  const chars = Array.from(label);
  return chars.length === 2 && chars.every(ch => ch.codePointAt(0) >= 0x2e80) ? chars.join('　') : label;
}

function rowTexts(p) {
  const rows = [
    { key: 'from', field: '!!寄件人_标签', valueField: '!!寄件人_值', label: spaced(clean(p.presenterLabel) || '主讲人'), mono: 'FROM', value: clean(p.presenter) },
    { key: 'date', field: '!!日期_标签', valueField: '!!日期_值', label: spaced(clean(p.dateLabel) || '日期'), mono: 'DATE', value: clean(p.date) },
  ];
  return rows;
}

/** 主讲人 / 日期两行:整行一个定位框。
 *  不打 data-morph-key:编辑器的共享元素过渡按外框改宽高,文字克隆在过渡层里不随舞台缩放(会显示成放大的字),所以文字行交叉淡化。 */
function SenderRows({ school, page, p, origin }) {
  const [x0, y0] = origin;
  return rowTexts(p).map((row, i) => {
    const valueSize = fitText(row.value, { size: 32, width: 270 });
    // 标签较长(如「答辩人代表  FROM」)时手写值和虚线整体右移,不压字;模板的三字标签 dx = 0
    const labelW = widthEm(row.label) * 20 + 2 * Array.from(row.label).length + (2 + row.mono.length) * 0.6 * 17;
    const dx = Math.max(0, Math.ceil(labelW + 12 - 150));
    return (
      <div key={row.key} className="cp-sch-abs" style={{ left: x0, top: y0 + i * ROW_PITCH, width: 420 + dx, height: 46 }}>
        <div className={`cp-sch-fill nu-fly is-${page}`} style={paletteVars(school)}>
        <div className="cp-sch-text nu-label" style={box([0, 10, 150 + dx, 26])}
          data-native-field={row.field} data-editable-path={row.field ? `school.neu.${row.field}` : undefined} data-sync-text={`neu-${row.key}-label`}>
          <span>{row.label}</span><span className="nu-mono">{`  ${row.mono}`}</span>
        </div>
        <NativeText school="neu" field={row.valueField} sync={`neu-${row.key}-value`} rect={[150 + dx, 0, 270, 40]} className="nu-value" style={{ fontSize: valueSize }}>{row.value}</NativeText>
        <div className="nu-dots" style={{ left: 142 + dx, top: 44, width: 278 }} aria-hidden="true" />
        </div>
      </div>
    );
  });
}

/** 明信片卡纸:外层打 data-morph-key(不旋转,平滑移动时改它的位置和大小),里层旋转并带投影。
 *  过渡时共享元素被克隆到舞台外、外层 style 被改写,所以调色板变量写在里层,相关样式类也不依赖 .cp-sch-neu 祖先。 */
function Card({ school, rect, rot, morph }) {
  return (
    <div className="cp-sch-abs" style={box(rect)} data-morph-key={morph} aria-hidden="true">
      <div className="nu-card" style={{ ...paletteVars(school), ...(rot ? { transform: `rotate(${rot}deg)` } : {}) }} />
    </div>
  );
}

/**
 * 照片框里的视频(poster 垫底 + <video>),裁切按百分比写,平滑移动时随外框缩放。
 * 写法同 kit 的 SchoolVideo(data-school-video、autoplay muted loop playsinline),只是多了旋转和共享元素标记。
 */
function PhotoVideo({ school, video, morph }) {
  const { rect, rot, crop, file, poster } = video;
  const [, , w, h] = rect;
  const f = cropFrame(rect, crop);
  const pct = { left: `${(f.left / w) * 100}%`, top: `${(f.top / h) * 100}%`, width: `${(f.width / w) * 100}%`, height: `${(f.height / h) * 100}%` };
  const src = schoolAsset(school.key, file);
  const posterSrc = schoolAsset(school.key, poster);
  return (
    <div className="cp-sch-abs" style={box(rect)} data-morph-key={morph} aria-hidden="true">
      <div className="cp-sch-clip cp-sch-video-box" style={{ left: 0, top: 0, width: '100%', height: '100%', transform: `rotate(${rot}deg)` }} data-school-video={file}>
        <img className="cp-sch-img" src={posterSrc} alt="" style={pct} decoding="async" draggable="false" />
        <video className="cp-sch-video" style={pct} src={src} poster={posterSrc} autoPlay muted loop playsInline preload="auto" />
      </div>
    </div>
  );
}

/** 两页共用的装饰:信纸纹理、上下航空条、校徽、邮戳波纹 / 邮戳 / 邮票(邮票在最上层,单独渲染)。 */
function Paper({ school }) {
  return (
    <>
      <SchoolImage school={school} file="img-image69.jpg" rect={STAGE} />
      <SchoolImage school={school} file="img-image70.png" rect={[0, 0, 1920, 12]} />
      <SchoolImage school={school} file="img-image70.png" rect={[0, 1068, 1920, 12]} />
    </>
  );
}
function Postmark({ school }) {
  return (
    <>
      <SchoolImage school={school} file="img-image73.png" rect={[1144, 196, 400, 96]} />
      <SchoolImage school={school} file="logo-image74.png" rect={[1529, 155, 230, 230]} />
      <SchoolImage school={school} file="logo-image75.png" rect={[1706, 138, 160, 200]} className="nu-stamp" style={{ transform: 'rotate(5deg)' }} />
    </>
  );
}

// 寄自标签容量(字段表「约容纳」25 字):放不下时先不放单位
const FROM_CAP = 25;
function fromLine(p) {
  const head = [clean(p.kicker), labeled(p.advisorLabel, p.advisor, '指导教师')];
  const full = joinInfo([...head, clean(p.unit)], '　·　');
  return charCount(full) <= FROM_CAP ? full : joinInfo(head, '　·　');
}

function quoteLine(school, p) {
  return clean(p.subtitle) || clean(p.motto) || school.defaults.motto;
}

function coverTitle(school, p, variant) {
  if (variant === 'keyword') return coverKeyword(school, p);
  if (variant === 'long_title') return splitTitle(p.title, school.titleCaps.long_title);
  return clean(p.title).replace(/\n/g, '');
}

function Cover({ school, props: p, variant }) {
  useSchoolStyle(school, 'campus-school-neu-style', CSS);
  const v = COVER[variant] || COVER.default;
  const title = coverTitle(school, p, variant);
  const titleSize = fitText(title, { size: v.size, width: v.title[2], spacing: v.spacing });
  // 关键词版的长副标题:单行缩到 34px 以下就拆两行,下面的英文校名 / 短线 / 引句随之下移
  let sub = '';
  let subSize = 42;
  // 主标题缩字 / 少一行时,下面的副标题、英文校名、短线、引句跟着上移,不留大块空白(模板按满额字数排的位置)
  const designRows = variant === 'long_title' ? 2 : 1;
  const rows = Math.min(designRows, title.split('\n').length);
  const subShift = Math.min(0, (variant === 'keyword' ? 1 : designRows) * titleSize * v.lh - designRows * v.size * v.lh);
  let shift = Math.min(0, rows * titleSize * v.lh - designRows * v.size * v.lh);
  if (variant === 'keyword') {
    sub = clean(p.title).replace(/\n/g, '');
    subSize = fitText(sub, { size: 42, width: v.sub[2], spacing: 4 });
    if (subSize < 34) {
      sub = splitTitle(sub, Math.ceil(charCount(sub) / 2));
      subSize = Math.min(38, fitText(sub, { size: 42, width: v.sub[2], spacing: 4 }));
      shift += Math.max(0, sub.split('\n').length * subSize * 1.2 - v.sub[3]);
    }
  }
  const from = fromLine(p);
  const titleEn = clean(p.titleEn) || school.nameEn;
  const quote = quoteLine(school, p);
  return (
    <SchoolStage school={school} page="cover">
      <Paper school={school} />
      <SenderRows school={school} page="cover" p={p} origin={ROWS_COVER} />
      <SchoolImage school={school} file="logo-image71.png" rect={LOGO} />
      <Card school={school} rect={CARD_COVER.rect} rot={CARD_COVER.rot} morph="neu-card" />
      {from ? <NativeText school="neu" field="!!寄自标签" rect={[90, 314.5, 690, 30]} className="nu-from"
        style={{ fontSize: fitText(from, { size: 24, width: 690, spacing: 6 }) }}>{from}</NativeText> : null}
      <NativeText school="neu" field="主标题" rect={v.title} className="nu-title"
        style={{ fontSize: titleSize, letterSpacing: v.spacing * (titleSize / v.size), lineHeight: v.lh }}>{title}</NativeText>
      {sub ? <NativeText school="neu" field="副标题（长）" rect={[v.sub[0], v.sub[1] + subShift, v.sub[2], v.sub[3] + Math.max(0, shift - subShift)]} className="nu-title"
        style={{ fontSize: subSize, letterSpacing: 4 * (subSize / 42) }}>{sub}</NativeText> : null}
      <NativeText school="neu" field="英文校名" rect={[90, v.en + shift, 690, 34]} className="nu-en"
        style={{ fontSize: fitText(titleEn, { size: 22, width: 690, spacing: 8.6 }) }}>{titleEn}</NativeText>
      <div className="nu-rule" style={{ left: 94.5, top: v.rule + shift - 1.5, width: 46.25 }} aria-hidden="true" />
      <NativeText school="neu" field="校歌引句" rect={[90, v.quote + shift, 690, 52]} className="nu-quote"
        style={{ fontSize: fitText(quote, { size: 48, width: 690, spacing: 4 }) }}>{quote}</NativeText>
      <PhotoVideo school={school} video={VIDEO_COVER} morph="neu-photo" />
      <Postmark school={school} />
    </SchoolStage>
  );
}

function Toc({ school, props: p, items, count }) {
  useSchoolStyle(school, 'campus-school-neu-style', CSS);
  const cover = useDeckCover();
  const row = TOC_ROWS[count];
  const zip = Array.from(school.defaults.postcode);
  const title = clean(p.title);
  const titleW = widthEm(title) * 64 + 12 * Array.from(title).length;
  const toName = clean(p.lead) || school.defaults.toName;
  const toLines = [
    { field: '收件_1', rect: [1432, 458, 420, 44], size: 32, text: toName, line: [1424, 504, 360] },
    { field: '收件_2', rect: [1344, 532, 448, 44], size: 24, text: school.defaults.address, line: [1344, 570, 440] },
    { field: '收件_3', rect: [1344, 598, 448, 44], size: 24, text: `${school.name}　${school.defaults.motto}`, line: [1344, 636, 440] },
  ];
  return (
    <SchoolStage school={school} page="toc">
      <Paper school={school} />
      <Card school={school} rect={PHOTO_CARD.rect} rot={PHOTO_CARD.rot} />
      <Card school={school} rect={CARD_TOC.rect} rot={CARD_TOC.rot} morph="neu-card" />
      {zip.map((digit, i) => (
        <React.Fragment key={`zip${i}`}>
          <div className="nu-zip" style={{ left: 810 + i * 56, top: 212, width: 44, height: 54 }} aria-hidden="true" />
          <NativeText school="neu" field={`邮编${i + 1}`} rect={[810 + i * 56, 212, 44, 54]} anchor="middle" className="nu-zip-digit">{digit}</NativeText>
        </React.Fragment>
      ))}
      <div className="nu-seam" style={{ left: 1299, top: 418, height: 466 }} aria-hidden="true" />
      <NativeText school="neu" field="目录标题" rect={[802.08, 308, 400, 80]} className="nu-toc-title">{title}</NativeText>
      <NativeText school="neu" field="目录英文" rect={[802.08 + titleW - 0.75, 356.67, 280, 30]} className="nu-toc-en">{p.subtitle}</NativeText>
      {items.map((item, i) => {
        const y = row.top + i * row.pitch;
        const text = String(item?.title ?? '');
        const desc = clean(item?.desc) || clean(item?.note);
        const no = clean(item?.no) || String(i + 1).padStart(2, '0');
        return (
          <React.Fragment key={i}>
            <div className="cp-sch-text nu-num" style={box([810, y, 96, 40], { fontSize: row.no[1] })}
              data-native-field={`toc.${i}.num`} data-editable-path={`school.neu.toc.${i}.num`}>
              <span style={{ fontSize: row.no[0] }}>No.</span><span>{no}</span>
            </div>
            <NativeText school="neu" field={`toc.${i}.title`} rect={[906, y + row.dy[0], 380, row.h[0]]} className="nu-item"
              style={{ fontSize: fitText(text, { size: row.item, width: 380, spacing: 6 }) }}>{text}</NativeText>
            {desc ? <NativeText school="neu" field={`toc.${i}.desc`} rect={[906, y + row.dy[1], 380, row.h[1]]} className="nu-desc"
              style={{ fontSize: fitText(desc, { size: row.desc, width: 380, spacing: 1 }) }}>{desc}</NativeText> : null}
            <div className="nu-dots" style={{ left: 810, top: y + row.dy[2] - 1, width: 450 }} aria-hidden="true" />
          </React.Fragment>
        );
      })}
      <div className="cp-sch-text nu-label" style={box([1344, 470, 100, 26])} data-native-field="收件_标签" data-editable-path="school.neu.收件_标签">
        <span>致</span><span className="nu-mono">{'  TO'}</span>
      </div>
      {toLines.map(line => (
        <React.Fragment key={line.field}>
          <NativeText school="neu" field={line.field} rect={line.rect} className="nu-to"
            style={{ fontSize: fitText(line.text, { size: line.size, width: line.rect[2] }) }}>{line.text}</NativeText>
          <div className="nu-dots" style={{ left: line.line[0], top: line.line[1] - 1, width: line.line[2] }} aria-hidden="true" />
        </React.Fragment>
      ))}
      <SenderRows school={school} page="toc" p={cover} origin={ROWS_TOC} />
      <SchoolImage school={school} file="logo-image71.png" rect={LOGO} />
      <Postmark school={school} />
      <PhotoVideo school={school} video={VIDEO_TOC} morph="neu-photo" />
    </SchoolStage>
  );
}

export default {
  Cover,
  Toc,
  coverClear: (props, variant) => {
    const p = props || {};
    const clear = [];
    if (!fromLine(p)) clear.push('!!寄自标签');
    if (!clean(p.presenter)) clear.push('!!寄件人_值');
    if (!clean(p.date)) clear.push('!!日期_值');
    if (variant === 'keyword' && !clean(p.title)) clear.push('副标题（长）');
    return clear;
  },
  // 条目说明(和英文小标)都为空时清空模板里对应的说明框
  tocClear: (props, count) => Array.from({ length: count }, (_, i) => (Array.isArray(props?.items) ? props.items[i] : null))
    .map((item, i) => (clean(item?.desc) || clean(item?.note) ? null : `toc.${i}.desc`)).filter(Boolean),
};
