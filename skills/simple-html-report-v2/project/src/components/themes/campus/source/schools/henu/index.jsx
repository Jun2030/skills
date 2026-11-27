// 河南大学 · 汝窑天青(3D 建筑)。
//
// 还原依据:模板第 22 页(封面原版)与第 24 / 25 / 23 / 26 / 27 页(目录 2–6 项),坐标取自
// `python3 -I scripts/campus-schools/extract-assets.py --school henu --dump-only` 导出的 output/campus-schools/henu/slide-<id>.txt
// (1920×1080 舞台 px,字号已按 1pt = 2px 换算)。没有矢量装饰层:底色、开片纹理、瓷片都是交付包里的图片。
//
// 叠放顺序照模板:
//   封面  天青底图 → 开片纹理 → 校训 → 眉题 / 标题 / 副题 / 四栏信息 → 校徽(彩色圆章 + 黑色校名两张图裁切拼成)→ 3D 南大门
//   目录  天青底图 → 开片纹理(整体左移 40、下移 3)→ 校训 → 目录标题 / CONTENTS / 引言 → N 片瓷片(带外投影)→ 条目 → 3D 南大门
//         (5、6 项版中间几条压在大门上面,和模板 z 顺序一致)
//
// 通用字段 → 模板字段:
//   封面  kicker → 封面-眉题(后接按场景推出的英文,如 UNDERGRADUATE THESIS DEFENSE;原文中间 4 个空格保留在 DOM 里)
//         title  → 封面-标题(两行设计:超过一行容量时在标点 / 「的 与 和」处拆两行,再按框宽缩字)
//         subtitle → 封面-副题(空则清空)
//         presenter / advisor / unit / date(连同各自的 label)→ 封面-信息1…4:按顺序填有内容的几栏,空的不占位、清空对应字段;
//                                                     各栏放得进模板间距时 x 用模板位置,否则按内容宽度往后排(导出时原生框跟着挪,coverBoxes)
//         motto → !!校训(空时用学校校训「明德新民  ·  止于至善」;封面与目录共用的 !! 字段,只在封面标 data-native-field,
//                 目录上用同一个 sync,预览里改一处两页一起变)
//   目录  title → 目录-标题;subtitle → 目录-英文;lead → 目录-引言(空则清空);
//         items[i]:no → toc.i.num、note → toc.i.en(第 1 段)、title → toc.i.title(第 2 段)、desc → toc.i.desc(第 3 段)
import React from 'react';
import { NativeText, SchoolImage, SchoolStage, MORPH_MODEL, box, charCount, fitText, splitTitle, useSchoolStyle, widthEm } from '../kit.jsx';
import { schoolFontStack } from '../fonts.mjs';

const HEAVY = schoolFontStack('思源宋体 CN Heavy');
const SEMI = schoolFontStack('Source Han Serif CN SemiBold');
const MEDIUM = schoolFontStack('Source Han Serif CN Medium');
const LIGHT = schoolFontStack('Source Han Serif CN Light');
const SANS = schoolFontStack('思源黑体 CN', 'sans');
const CINZEL = `'Cinzel',${schoolFontStack('Source Han Serif CN Light')}`;

const CSS = `
.cp-sch-henu{background:var(--sch-paper);}
.cp-sch-henu .hn-motto{font-family:${LIGHT};font-weight:300;font-size:18px;letter-spacing:12px;color:var(--sch-sage);text-align:right;line-height:1.2;white-space:pre;}
.cp-sch-henu .hn-kicker{color:var(--sch-cinnabar);line-height:1.2;white-space:pre;}
.cp-sch-henu .hn-kicker .hn-k-zh{font-family:${SEMI};font-weight:600;font-size:24px;letter-spacing:8px;}
.cp-sch-henu .hn-kicker .hn-k-en{font-family:${CINZEL};font-weight:400;font-size:14px;letter-spacing:4px;}
.cp-sch-henu .hn-title{font-family:${HEAVY};font-weight:900;color:var(--sch-ink);line-height:1.36;white-space:nowrap;}
.cp-sch-henu .hn-sub{font-family:${LIGHT};font-weight:300;font-size:24px;letter-spacing:2px;color:var(--sch-celadon);line-height:1.2;white-space:nowrap;}
.cp-sch-henu .hn-info{white-space:nowrap;}
.cp-sch-henu .hn-info .hn-i-label{font-family:${SANS};font-size:15px;letter-spacing:6px;color:var(--sch-sage);line-height:1.4;}
.cp-sch-henu .hn-info .hn-i-value{font-family:${MEDIUM};font-weight:500;font-size:22px;letter-spacing:1px;color:var(--sch-ink);line-height:1.4;}
.cp-sch-henu .hn-toc-title{font-family:${HEAVY};font-weight:900;font-size:84px;letter-spacing:4px;color:var(--sch-ink);line-height:1.2;white-space:nowrap;}
.cp-sch-henu .hn-toc-en{font-family:${SANS};font-size:18px;letter-spacing:12px;color:var(--sch-sage);line-height:1.2;white-space:nowrap;}
.cp-sch-henu .hn-lead{font-family:${LIGHT};font-weight:300;font-size:26px;letter-spacing:6px;color:var(--sch-celadon);line-height:1.2;white-space:nowrap;}
.cp-sch-henu .hn-shard{filter:drop-shadow(0 12px 13px var(--sch-shard-shadow));}
.cp-sch-henu .hn-item{position:absolute;display:flex;flex-direction:column;align-items:flex-start;}
.cp-sch-henu .hn-item .cp-sch-text{position:relative;}
.cp-sch-henu .hn-item-head{display:flex;align-items:baseline;}
.cp-sch-henu .hn-num{font-family:${HEAVY};font-weight:900;font-size:22px;letter-spacing:2px;color:var(--sch-cinnabar);line-height:1.2;white-space:nowrap;}
.cp-sch-henu .hn-en{font-family:${SANS};font-size:12px;letter-spacing:6px;color:var(--sch-sage);line-height:1.2;white-space:nowrap;margin-left:26px;}
.cp-sch-henu .hn-item-title{font-family:${HEAVY};font-weight:900;letter-spacing:4px;color:var(--sch-ink);line-height:1.2;white-space:nowrap;margin-top:5px;}
.cp-sch-henu .hn-desc{font-family:${SANS};letter-spacing:1px;color:var(--sch-celadon);line-height:1.4;margin-top:12px;}
`;

/** 场景名 → 英文场景(模板眉题后半「UNDERGRADUATE THESIS DEFENSE」);认不出时用英文校名。 */
function sceneEnglish(kicker, fallback) {
  const k = String(kicker ?? '');
  if (/[A-Za-z]{3,}/.test(k)) return k.replace(/[^\x20-\x7e]+/g, ' ').replace(/\s+/g, ' ').trim().toUpperCase();
  const rules = [
    [/博士/, 'DOCTORAL DISSERTATION DEFENSE'],
    [/硕士/, "MASTER'S THESIS DEFENSE"],
    [/开题/, 'THESIS PROPOSAL DEFENSE'],
    [/中期/, 'MID-TERM REVIEW'],
    [/毕业设计/, 'GRADUATION PROJECT DEFENSE'],
    [/本科|学士|毕业论文/, 'UNDERGRADUATE THESIS DEFENSE'],
    [/答辩/, 'THESIS DEFENSE'],
    [/课程|讲|课堂/, 'COURSE PRESENTATION'],
    [/汇报|报告/, 'ACADEMIC REPORT'],
  ];
  for (const [re, en] of rules) if (re.test(k)) return en;
  return fallback;
}

// ———— 封面 ————

const TITLE_BOX = [104, 388, 760, 200];
const TITLE_FIT_W = 620;
const INFO_X0 = 110;
const INFO_Y = 782;
const KICKER_GAP = '    ';   // 模板眉题中文与英文之间的 4 个空格

function coverTitle(p, school) {
  const raw = String(p.title ?? '').trim();
  const cap = school.titleCaps.default;
  const text = raw.includes('\n') ? raw.split('\n').slice(0, 2).join('\n') : (charCount(raw) > cap ? splitTitle(raw, cap) : raw);
  // 框宽 760 的右端压在 3D 大门上:缩字按 620 算(模板原文一行 8 字约 608px),长题目不钻到大门后面
  return { text, size: fitText(text, { size: 74, width: TITLE_FIT_W, spacing: 2 }) };
}

// 模板「封面-信息1…4」四个框的 x(宽 280,框与框有重叠,模板按示例文字的长短错开);导出时原生页上就是这几个位置
const INFO_NATIVE_X = [110, 290, 490, 760];

/**
 * 四栏信息:有内容的按顺序排(空的不占位)。每栏内容都放得进模板的间距时,x 用模板的位置(和原生页一致);
 * 有一栏放不下时按内容宽度往后推(最小间距 180),网页不压字;导出时原生页上的信息框挪到同样的位置(coverBoxes)。
 */
function infoColumns(p) {
  const cols = [
    [p.presenterLabel || '答辩人', p.presenter],
    [p.advisorLabel || '指导教师', p.advisor],
    [p.unitLabel || '学院专业', p.unit],
    [p.dateLabel || '答辩日期', p.date],
  ].map(([label, value]) => [String(label ?? '').trim(), String(value ?? '').trim()]).filter(([, value]) => value);
  const widths = cols.map(([label, value]) => Math.max(Array.from(label).length * 21, widthEm(value) * 22 + Array.from(value).length));
  const native = widths.every((w, i) => i === widths.length - 1 || w + 24 <= INFO_NATIVE_X[i + 1] - INFO_NATIVE_X[i]);
  let x = INFO_X0;
  return cols.map(([label, value], i) => {
    const col = { field: `封面-信息${i + 1}`, label, value, x: native ? INFO_NATIVE_X[i] : x };
    x += Math.max(180, Math.ceil(widths[i] + 72));
    return col;
  });
}

function mottoText(p, school) {
  return String(p.motto ?? '').trim() || school.defaults.motto;
}

function Motto({ school, p, marked }) {
  const text = mottoText(p, school);
  return marked
    ? <NativeText school="henu" field="!!校训" sync="henu-motto" rect={[1220, 92, 600, 30]} className="hn-motto">{text}</NativeText>
    // 目录页上的校训是封面同一个 !! 字段(导出时封面改了目录跟着改),这里只同步、不再标 data-native-field
    : <div className="cp-sch-text hn-motto" style={box([1220, 92, 600, 30])} data-editable-path="school.henu.!!校训" data-sync-text="henu-motto">{text}</div>;
}

function Cover({ school, props: p }) {
  useSchoolStyle(school, 'campus-school-henu-style', CSS);
  const kicker = String(p.kicker ?? '').trim();
  const kickerEn = sceneEnglish(kicker, school.nameEn);
  const title = coverTitle(p, school);
  const sub = String(p.subtitle ?? '').trim();
  const info = infoColumns(p);
  // 模板是两行标题;标题只有一行时眉题和标题下移半行、副题上移半行,三者间距与两行版一致,不在标题下留一整行空白
  const shift = title.text && !title.text.includes('\n') && sub ? Math.round(title.size * 1.36 / 2) : 0;
  return (
    <SchoolStage school={school} page="cover">
      <SchoolImage school={school} file="img-image15.jpg" rect={[0, 0, 1920, 1080]} />
      <SchoolImage school={school} file="img-image16.png" rect={[0, 0, 1920, 1080]} />
      <Motto school={school} p={p} marked />
      {kicker ? (
        <div className="cp-sch-text hn-kicker" style={box([110, 336 + shift, 760, 36])} data-native-field="封面-眉题" data-editable-path="school.henu.封面-眉题">
          <span className="hn-k-zh">{kicker}</span><span className="hn-k-en">{`${KICKER_GAP}${kickerEn}`}</span>
        </div>
      ) : null}
      {title.text ? <NativeText school="henu" field="封面-标题" rect={[TITLE_BOX[0], TITLE_BOX[1] + shift, TITLE_BOX[2], TITLE_BOX[3]]} className="hn-title"
        style={{ fontSize: title.size, letterSpacing: 2 }}>{title.text}</NativeText> : null}
      {sub ? <NativeText school="henu" field="封面-副题" rect={[110, 604 - shift, 720, 40]} className="hn-sub"
        style={{ fontSize: fitText(sub, { size: 24, width: 720, spacing: 2 }) }}>{sub}</NativeText> : null}
      {info.map(col => (
        <div key={col.field} className="cp-sch-text hn-info" style={{ left: col.x, top: INFO_Y }} data-native-field={col.field} data-editable-path={`school.henu.${col.field}`}>
          <span className="hn-i-label">{col.label}</span><br /><span className="hn-i-value">{col.value}</span>
        </div>
      ))}
      <SchoolImage school={school} file="logo-image17.png" rect={[112, 75.93, 59, 56.69]} crop={{ r: 0.70781 }} />
      <SchoolImage school={school} file="logo-image18.png" rect={[173.75, 75.93, 141, 56.69]} crop={{ l: 0.30581, r: -0.0041 }} />
      <SchoolImage school={school} file="model-image19.png" rect={[702.62, 85.86, 1432.07, 982.21]} morph={MORPH_MODEL} />
    </SchoolStage>
  );
}

// ———— 目录 ————

// 每种条目数:瓷片图(文件、位置)与各条文字框(x, y, 宽;高 186),条目标题 / 说明字号
const TOC = {
  2: {
    shards: [['img-image25.png', [935.42, 126.96, 514.5, 858]], ['img-image26.png', [1338.58, 126.04, 466.5, 855]]],
    items: [[1055.19, 483.82, 300], [1399.66, 438.86, 300]], title: 44, desc: 18,
  },
  3: {
    shards: [['img-image27.png', [936.74, 123.52, 474, 660.5]], ['img-image28.png', [1371.59, 125.55, 432.5, 621]], ['img-image29.png', [1005.5, 557.7, 750.5, 432]]],
    items: [[1038, 341.19, 292], [1420.73, 340.3, 292], [1233.82, 679, 292]], title: 44, desc: 18,
  },
  4: {
    shards: [['img-image20.png', [926, 117, 416, 556]], ['img-image21.png', [1287, 111, 521, 485]], ['img-image22.png', [1334, 474, 480, 519]], ['img-image23.png', [940, 588, 511, 411]]],
    items: [[1016, 324, 286], [1383, 253, 286], [1447, 615, 286], [1092, 684, 286]], title: 44, desc: 18,
  },
  5: {
    shards: [['img-image30.png', [954.35, 122.62, 464, 438.5]], ['img-image31.png', [1366.61, 122.58, 415.5, 438.5]], ['img-image32.png', [1368.7, 420.72, 435.5, 485]],
      ['img-image33.png', [1135.33, 555.5, 490.5, 434]], ['img-image34.png', [936.31, 434.23, 436.5, 485.5]]],
    items: [[1086.42, 235.8, 236], [1441.32, 242.69, 236], [1518.87, 572.35, 236], [1239.88, 752.67, 236], [974.98, 567.33, 236]], title: 40, desc: 17,
  },
  6: {
    shards: [['img-image35.png', [1031.31, 122.23, 352.5, 432]], ['img-image36.png', [1334.08, 122.45, 400, 432]], ['img-image37.png', [1363.3, 319.08, 441, 424.5]],
      ['img-image38.png', [1355.08, 548.05, 406, 440.5]], ['img-image39.png', [993.74, 548.24, 407, 440.5]], ['img-image40.png', [936.2, 284.34, 431.5, 486.5]]],
    items: [[1122.01, 198.18, 232], [1400.42, 210.2, 232], [1556, 452.02, 232], [1418.72, 706.49, 232], [1119.15, 722.01, 232], [962.93, 446.74, 232]], title: 36, desc: 16,
  },
};
const ITEM_H = 186;

/** 条目标题:一行放不下时拆两行(每行容量按框宽算,约 5–6 字),仍放不下再缩字。 */
function itemTitle(raw, size, width) {
  const text = String(raw ?? '').replace(/\n/g, '').trim();
  const cap = Math.max(2, Math.floor((width + 4) / (size + 4)));
  const split = charCount(text) > cap ? splitTitle(text, cap) : text;
  return { text: split, size: fitText(split, { size, width, spacing: 4 }) };
}

function TocItem({ item, i, pos, layout }) {
  const [x, y, w] = pos;
  const t = itemTitle(item?.title, layout.title, w);
  const en = String(item?.note ?? '').trim();
  const desc = String(item?.desc ?? '').trim();
  // 说明一行放不下时先缩字(不小于 82%),再放不下才折行
  const descSize = Math.max(layout.desc * 0.82, fitText(desc, { size: layout.desc, width: w - 4, spacing: 1 }));
  return (
    <div className="hn-item" style={{ left: x, top: y, width: w, height: ITEM_H }}>
      <div className="hn-item-head">
        <NativeText school="henu" field={`toc.${i}.num`} className="hn-num">{item?.no || String(i + 1).padStart(2, '0')}</NativeText>
        {en ? <NativeText school="henu" field={`toc.${i}.en`} className="hn-en"
          style={{ fontSize: fitText(en, { size: 12, width: w - 60, spacing: 6 }) }}>{en}</NativeText> : null}
      </div>
      <NativeText school="henu" field={`toc.${i}.title`} className="hn-item-title" style={{ fontSize: t.size }}>{t.text}</NativeText>
      {desc ? <NativeText school="henu" field={`toc.${i}.desc`} className="hn-desc" style={{ fontSize: descSize, width: w }}>{desc}</NativeText> : null}
    </div>
  );
}

function Toc({ school, props: p, items, count }) {
  useSchoolStyle(school, 'campus-school-henu-style', CSS);
  const layout = TOC[count];
  const lead = String(p.lead ?? '').trim();
  // 5、6 项版第 4 条起(最后一条除外)在模板里排在 3D 大门之后
  const above = i => count >= 5 && i >= 3 && i < count - 1;
  const list = flag => items.map((item, i) => (above(i) === flag
    ? <TocItem key={i} item={item} i={i} pos={layout.items[i]} layout={layout} /> : null));
  return (
    <SchoolStage school={school} page="toc">
      <SchoolImage school={school} file="img-image15.jpg" rect={[0, 0, 1920, 1080]} />
      <SchoolImage school={school} file="img-image16.png" rect={[-40, 3, 1920, 1080]} />
      <Motto school={school} p={p} />
      <NativeText school="henu" field="目录-标题" rect={[108, 143.12, 300, 110]} anchor="bottom" className="hn-toc-title">{p.title}</NativeText>
      <NativeText school="henu" field="目录-英文" rect={[300, 217.12, 400, 30]} className="hn-toc-en">{p.subtitle}</NativeText>
      {lead ? <NativeText school="henu" field="目录-引言" rect={[112, 281.12, 700, 44]} className="hn-lead"
        style={{ fontSize: fitText(lead, { size: 26, width: 700, spacing: 6 }) }}>{lead}</NativeText> : null}
      {layout.shards.map(([file, rect]) => <SchoolImage key={file} school={school} file={file} rect={rect} className="hn-shard" />)}
      {list(false)}
      <SchoolImage school={school} file="model-image24.png" rect={[-222.97, 281.12, 1248.97, 893.02]} morph={MORPH_MODEL} />
      {list(true)}
    </SchoolStage>
  );
}

export default {
  Cover,
  Toc,
  // 模板里有、网页没显示的文字框:导出换回原生页时清空
  coverClear: (props) => {
    const p = props || {};
    const clear = [];
    if (!String(p.kicker ?? '').trim()) clear.push('封面-眉题');
    if (!String(p.title ?? '').trim()) clear.push('封面-标题');
    if (!String(p.subtitle ?? '').trim()) clear.push('封面-副题');
    for (let i = infoColumns(p).length; i < 4; i += 1) clear.push(`封面-信息${i + 1}`);
    return clear;
  },
  // 有一栏放不下、网页按内容宽度往后排时,原生页的信息框也挪到同样的位置(框宽 280、高 70 照模板)
  coverBoxes: props => Object.fromEntries(infoColumns(props || {})
    .map((col, i) => (col.x !== INFO_NATIVE_X[i] ? [col.field, [col.x, INFO_Y, 280, 70]] : null)).filter(Boolean)),
  tocClear: (props, count) => {
    const clear = String(props?.lead ?? '').trim() ? [] : ['目录-引言'];
    const list = Array.isArray(props?.items) ? props.items.slice(0, count) : [];
    for (let i = 0; i < count; i += 1) {
      if (!String(list[i]?.desc ?? '').trim()) clear.push(`toc.${i}.desc`);
      if (!String(list[i]?.note ?? '').trim()) clear.push(`toc.${i}.en`);
    }
    return clear;
  },
};
