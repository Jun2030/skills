// 四川大学 · 红幕通栏(3D 建筑)。
//
// 还原依据:模板第 8 页(封面原版)与第 10 / 11 / 9 / 12 / 13 页(目录 2–6 项),坐标取自
// `python3 -I scripts/campus-schools/extract-assets.py --school scu --dump-only` 导出的 output/campus-schools/scu/slide-<id>.txt
// (1920×1080 舞台 px,字号已按 1pt = 2px 换算)。这所学校没有矢量装饰层:红幕、光晕、细线、方框都是简单形状,直接用 CSS 画。
//
// 叠放顺序照模板:
//   封面  背景图 → 光晕 → 顶栏两行 → 3D 牌坊 → 红色通栏 → 地影 → 白色校徽校名 → 竖分隔线 → 标题 / 副标题 / 英文 → 答辩人胶囊 / 日期
//   目录  背景图 → 光晕 → 右侧红幕 → 校徽水印(5%)→ 目录标题 / CONTENTS / 引言 → 竖排条目与分隔线 → 3D 牌坊
//         (5、6 项版中间几条压在牌坊上面,和模板的 z 顺序一致)
//
// 通用字段 → 模板字段:
//   封面  title ≤ 11 字   → !!通栏标题 = title;!!通栏副标题 = subtitle(空时 kicker)
//         title > 11 字   → !!通栏标题 = kicker(场景名);!!通栏副标题 = title(设计说明「长论文题放副标题行」);没有 kicker 时标题自己缩字
//         !!通栏英文 = titleEn;空时:写了导师 / 单位 →「指导教师：… · 单位」(模板没有导师 / 单位框,并进这一行,导出不丢);
//                    都没写 → 按 kicker 推出场景英文 + 日期里的年份(如 DOCTORAL DISSERTATION DEFENSE · 2026)
//         !!汇报人 = 「presenterLabel：presenter」;!!日期 = date(「2026年11月」这类写法规整成模板的「2026 · 11」)
//         !!顶栏左 / !!顶栏右 是学校自己的文字(英文校名、1896 — 2026 · 建校一百三十周年),写在 meta.defaults
//   目录  title → !!目录标题;subtitle → !!目录英文;lead → !!目录引言(空则清空);
//         items[i]:no → toc.i.num(数字编号转成「壹贰叁…」大写数字,和模板一致)、title → toc.i.title(竖排)、
//         desc → toc.i.desc(竖排)、note → toc.i.en(竖排、拉丁字母侧转)
// 竖排文字用 writing-mode: vertical-rl(汉字直立、拉丁字母侧转,对应模板的 eaVert),DOM 里仍是普通文本,可编辑,导出仍是文本框。
import React from 'react';
import { NativeText, SchoolImage, SchoolStage, MORPH_MODEL, box, charCount, fitText, joinInfo, labeled, useSchoolStyle, widthEm } from '../kit.jsx';
import { schoolFontStack } from '../fonts.mjs';

const HEAVY = schoolFontStack('Source Han Serif CN Heavy');
const SEMI = schoolFontStack('Source Han Serif CN SemiBold');
const SERIF = schoolFontStack('Source Han Serif CN');
const CINZEL = `'Cinzel',${schoolFontStack('Source Han Serif CN')}`;

const CSS = `
.cp-sch-scu{background:var(--sch-paper);}
.cp-sch-scu .sc-glow{position:absolute;border-radius:50%;background:radial-gradient(circle farthest-corner,var(--sch-glow-a) 0%,var(--sch-glow-b) 50%,var(--sch-glow-c) 100%);pointer-events:none;}
.cp-sch-scu .sc-curtain{position:absolute;background:linear-gradient(180deg,var(--sch-curtain-a),var(--sch-curtain-b));}
.cp-sch-scu .sc-top-left{font-family:${CINZEL};font-size:22px;letter-spacing:8px;color:var(--sch-ink-red);line-height:1.2;white-space:nowrap;}
.cp-sch-scu .sc-top-right{font-family:${SERIF};font-size:22px;color:var(--sch-grey);line-height:1.2;text-align:right;white-space:pre;}
.cp-sch-scu .sc-top-right .sc-years{font-family:${CINZEL};letter-spacing:4px;}
.cp-sch-scu .sc-top-right .sc-note{letter-spacing:2px;}
.cp-sch-scu .sc-vline{position:absolute;width:0;border-left:1.5px solid var(--sch-white-45);}
.cp-sch-scu .sc-title{font-family:${HEAVY};font-weight:900;color:var(--sch-white);line-height:1.2;white-space:nowrap;}
.cp-sch-scu .sc-sub{font-family:${SERIF};font-weight:400;color:var(--sch-blush);line-height:1.2;white-space:nowrap;}
.cp-sch-scu .sc-en{font-family:${CINZEL};font-size:20px;letter-spacing:6px;color:var(--sch-blush-en);line-height:1.2;white-space:nowrap;}
.cp-sch-scu .sc-pill{position:absolute;box-sizing:border-box;border:2px solid var(--sch-white-80);border-radius:36px;}
.cp-sch-scu .sc-presenter{font-family:${SEMI};font-weight:600;color:var(--sch-white);text-align:center;line-height:1.2;white-space:nowrap;}
.cp-sch-scu .sc-date{font-family:${CINZEL};font-size:24px;letter-spacing:4px;color:var(--sch-blush);text-align:center;line-height:1.2;white-space:nowrap;}
.cp-sch-scu .sc-toc-title{font-family:${HEAVY};font-weight:900;font-size:96px;letter-spacing:8px;color:var(--sch-ink);line-height:1.2;white-space:nowrap;}
.cp-sch-scu .sc-toc-en{font-family:${CINZEL};font-size:32px;letter-spacing:10px;color:var(--sch-ink-red);line-height:1.2;white-space:nowrap;}
.cp-sch-scu .sc-lead{font-family:${SERIF};font-size:30px;letter-spacing:4px;color:var(--sch-grey);line-height:1.2;white-space:nowrap;}
.cp-sch-scu .sc-numbox{position:absolute;box-sizing:border-box;border:2px solid var(--sch-gold);}
.cp-sch-scu .sc-num{font-family:${HEAVY};font-weight:900;font-size:34px;color:var(--sch-gold);text-align:center;line-height:1.2;white-space:nowrap;}
.cp-sch-scu .sc-dot{position:absolute;background:var(--sch-gold);clip-path:polygon(50% 0,100% 50%,50% 100%,0 50%);}
.cp-sch-scu .sc-sep{position:absolute;width:0;border-left:1.5px solid var(--sch-white-20);}
.cp-sch-scu .sc-col{position:absolute;display:flex;justify-content:center;align-items:flex-start;}
.cp-sch-scu .sc-col>.cp-sch-text{position:relative;writing-mode:vertical-rl;text-orientation:mixed;line-height:1.2;white-space:normal;overflow-wrap:anywhere;}
.cp-sch-scu .sc-item{font-family:${HEAVY};font-weight:900;color:var(--sch-white);}
.cp-sch-scu .sc-desc{font-family:${SERIF};font-weight:400;color:var(--sch-blush);}
.cp-sch-scu .sc-col>.sc-item-en{font-family:${CINZEL};font-size:20px;letter-spacing:4px;color:var(--sch-blush-en);white-space:nowrap;}
`;

// 光晕:模板是 circle 路径渐变,100% 落在外接方框的角上(圆周处约 0.26 不透明度,能看到圆盘边缘),
// 所以用 farthest-corner 渐变 + 圆形裁切。

// ———— 封面 ————

const TITLE_CAP = 11;          // 通栏标题约 11 字(字段表「约容纳」)
const TITLE_BOX = [717.12, 803.52, 806.4, 103.68];
const SUB_BOX = [717.12, 912.96, 806.4, 51.84];
const EN_BOX = [717.12, 976.32, 806.4, 37.44];
const PILL = [1529.28, 840.96, 302.4, 72];
const DATE_BOX = [1529.28, 936, 302.4, 43.2];

/** 场景名 → 英文场景行(模板「DOCTORAL DISSERTATION DEFENSE」的位置);认不出时用英文校名。 */
export function sceneEnglish(kicker, fallback) {
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

function yearOf(date) {
  return String(date ?? '').match(/(?:19|20)\d{2}/)?.[0] || '';
}

/** 「2026年11月」「2026.11」「2026-11」→ 模板的「2026 · 11」;其他写法原样保留。 */
export function designDate(date) {
  const text = String(date ?? '').trim();
  const m = text.match(/^((?:19|20)\d{2})\s*[年.\-/]\s*(\d{1,2})\s*月?$/);
  return m ? `${m[1]} · ${m[2].padStart(2, '0')}` : text;
}

/** 按框宽缩字(模板 normAutofit),字距随字号等比缩小。 */
function scaled(text, size, width, spacing) {
  const fontSize = fitText(text, { size, width, spacing });
  return { fontSize, letterSpacing: spacing * (fontSize / size) };
}

function coverTexts(p, school) {
  const title = String(p.title ?? '').replace(/\n/g, '').trim();
  const kicker = String(p.kicker ?? '').trim();
  const subtitle = String(p.subtitle ?? '').trim();
  const long = charCount(title) > TITLE_CAP;
  const big = long && kicker ? kicker : title;
  const sub = long && kicker ? title : (subtitle || kicker);
  const titleEn = String(p.titleEn ?? '').trim();
  const year = yearOf(p.date);
  // 模板没有导师 / 单位框:写了时放进通栏下方这一行(原来的英文场景行),网页与原生页同一写法,导出后不丢导师
  const people = joinInfo([labeled(p.advisorLabel, p.advisor, '指导教师'), String(p.unit ?? '').trim()], '　·　');
  const en = titleEn || people || [sceneEnglish(kicker, school.nameEn), year].filter(Boolean).join(' · ');
  const presenter = String(p.presenter ?? '').trim();
  const presenterLine = presenter ? `${String(p.presenterLabel ?? '').trim() || '答辩人'}：${presenter}` : '';
  return { big, sub, en, presenterLine, date: designDate(p.date) };
}

function Cover({ school, props: p }) {
  useSchoolStyle(school, 'campus-school-scu-style', CSS);
  const d = school.defaults;
  const t = coverTexts(p, school);
  return (
    <SchoolStage school={school} page="cover">
      <SchoolImage school={school} file="bg-image5.jpg" rect={[0, 0, 1920, 1080]} />
      <div className="sc-glow" style={box([539.57, -11.75, 840.96, 840.96])} aria-hidden="true" />
      <NativeText school="scu" field="!!顶栏左" rect={[86.4, 48.96, 576, 40.32]} className="sc-top-left">{d.topLeft}</NativeText>
      <div className="cp-sch-text sc-top-right" style={box([1180.8, 48.96, 652.32, 40.32])} data-native-field="!!顶栏右" data-editable-path="school.scu.!!顶栏右">
        <span className="sc-years">{d.topRightYears}</span><span className="sc-note">{d.topRightNote}</span>
      </div>
      <SchoolImage school={school} file="model-image6.png" rect={[391.78, 58.12, 1136.44, 710.65]} morph={MORPH_MODEL} />
      <div className="sc-curtain" style={box([0, 756, 1920, 324])} aria-hidden="true" />
      <SchoolImage school={school} file="img-image7.png" rect={[371.38, 714.96, 1177.34, 105.12]} />
      <SchoolImage school={school} file="logo-image8.png" rect={[108, 835.2, 502.51, 165.6]} />
      <div className="sc-vline" style={{ left: 664.53, top: 843.84, height: 149.76 }} aria-hidden="true" />
      {t.big ? <NativeText school="scu" field="!!通栏标题" rect={TITLE_BOX} anchor="middle" className="sc-title"
        style={scaled(t.big, 68, TITLE_BOX[2] * 0.96, 4)}>{t.big}</NativeText> : null}
      {t.sub ? <NativeText school="scu" field="!!通栏副标题" rect={SUB_BOX} anchor="middle" className="sc-sub"
        style={scaled(t.sub, 32, SUB_BOX[2], 2)}>{t.sub}</NativeText> : null}
      {t.en ? <NativeText school="scu" field="!!通栏英文" rect={EN_BOX} className="sc-en"
        style={scaled(t.en, 20, EN_BOX[2] * 0.85, 6)}>{t.en}</NativeText> : null}
      {t.presenterLine ? (
        <>
          <div className="sc-pill" style={box(PILL)} aria-hidden="true" />
          <NativeText school="scu" field="!!汇报人" rect={PILL} anchor="middle" className="sc-presenter"
            style={{ fontSize: fitText(t.presenterLine, { size: 28, width: PILL[2] - 44 }) }}>{t.presenterLine}</NativeText>
        </>
      ) : null}
      {t.date ? <NativeText school="scu" field="!!日期" rect={DATE_BOX} className="sc-date"
        style={{ fontSize: fitText(t.date, { size: 24, width: DATE_BOX[2], spacing: 4 }) }}>{t.date}</NativeText> : null}
    </SchoolStage>
  );
}

// ———— 目录 ————

// 每种条目数下,各条序号方框的左边 x(从右往左第 1、2…条;模板「!!目录序号框N」),与竖分隔线的 x
const TOC_COLS = {
  2: { nums: [1616.96, 1408.96], seps: [1550.4] },
  3: { nums: [1688.96, 1512.96, 1336.96], seps: [1638.4, 1462.4] },
  4: { nums: [1725.12, 1584, 1442.88, 1301.76], seps: [1692, 1550.88, 1409.76] },
  5: { nums: [1776.96, 1644.96, 1512.96, 1380.96, 1248.96], seps: [1748.4, 1616.4, 1484.4, 1352.4] },
  6: { nums: [1787.96, 1677.96, 1567.96, 1457.96, 1347.96, 1237.96], seps: [1770.4, 1660.4, 1550.4, 1440.4, 1330.4] },
};
const NUM_Y = 115.2;
const NUM_SIZE = 74.88;
const ITEM_BOX = { dx: -23.04, y: 223.2, w: 120.96, h: 360 };
const DOT_BOX = { dx: 30.24, y: 604.8, s: 14.4 };
const DESC_BOX = { dx: 5.76, y: 645.12, w: 63.36, h: 180 };
const EN_COL = { dx: 14.4, y: 849.6, w: 46.08, h: 165.6 };
const SEP_Y = 115.2;
const SEP_H = 885.6;

const CN_NUMS = ['壹', '贰', '叁', '肆', '伍', '陆', '柒', '捌', '玖', '拾'];

/** 模板序号是大写数字:「01」「2」这类纯数字编号转成「壹」「贰」;其他写法原样保留。 */
export function upperNumeral(no, i) {
  const text = String(no ?? '').trim();
  if (!text) return CN_NUMS[i] || String(i + 1);
  const m = text.match(/^0*(\d{1,2})$/);
  if (m && Number(m[1]) >= 1 && Number(m[1]) <= CN_NUMS.length) return CN_NUMS[Number(m[1]) - 1];
  return text;
}

/**
 * 竖排条目标题:模板一列 4 字最好看(60pt 字号、字距 16)。字多时先在一列里缩字(不小于 40px),
 * 还放不下再分成两列(两列平均分字,字号按框宽 120.96 算)。返回 { text(两列时含 \n), size, spacing }。
 */
export function verticalTitle(raw, base, pitch = 141) {
  const text = String(raw ?? '').replace(/\n/g, '').trim();
  const chars = Array.from(text);
  const n = Math.max(1, chars.reduce((sum, ch) => sum + (ch.codePointAt(0) < 0x2e80 ? 0.6 : 1), 0));
  const ratio = 16 / 60;                                   // 字距 / 字号
  const room = ITEM_BOX.h * 0.97;                          // 留一点余量,避免最后一个字被挤到下一列
  const single = Math.min(base, Math.floor((room / n / (1 + ratio)) * 100) / 100);
  if (single >= 40 || chars.length <= 1) return { text, size: Math.max(single, 24), spacing: Math.max(single, 24) * ratio };
  // 两列:宽度不超过框宽,也不超过列距的 78%(6 项版列距只有 110,不能挤到相邻条目)
  const per = Math.ceil(chars.length / 2);
  const cols = `${chars.slice(0, per).join('')}\n${chars.slice(per).join('')}`;
  const byWidth = Math.min(ITEM_BOX.w, pitch * 0.78) / 2 / 1.2;
  const byHeight = room / per / (1 + ratio);
  const double = Math.floor(Math.min(base, byWidth, byHeight) * 100) / 100;
  if (single >= double) return { text, size: Math.max(single, 20), spacing: Math.max(single, 20) * ratio };
  return { text: cols, size: double, spacing: double * ratio };
}

/** 竖排小字(副项):一列放不下时 CSS 自动换到第二列;两列也放不下再缩字。 */
function verticalFit(raw, { size, spacing, width, height }) {
  const n = Math.max(1, widthEm(String(raw ?? '').replace(/\n/g, '')));
  let s = size;
  for (let k = 0; k < 40; k += 1) {
    const sp = spacing * (s / size);
    const per = Math.max(1, Math.floor((height * 0.97) / (s + sp)));
    const cols = Math.ceil(n / per);
    if (cols * s * 1.2 <= width + 0.5) return { size: s, spacing: sp };
    s *= 0.95;
  }
  return { size: s, spacing: spacing * (s / size) };
}

function TocColumn({ school, item, i, x, count, pitch }) {
  const titleBase = count === 6 ? 54 : 60;
  const vt = verticalTitle(item?.title, titleBase, pitch);
  const desc = String(item?.desc ?? '').trim();
  const df = verticalFit(desc, { size: 26, spacing: 8, width: DESC_BOX.w, height: DESC_BOX.h });
  const en = String(item?.note ?? '').trim();
  const enSize = fitText(en, { size: 20, width: EN_COL.h * 0.8, spacing: 4 });
  return (
    <>
      <div className="sc-numbox" style={box([x, NUM_Y, NUM_SIZE, NUM_SIZE])} aria-hidden="true" />
      <NativeText school="scu" field={`toc.${i}.num`} rect={[x, NUM_Y, NUM_SIZE, NUM_SIZE]} anchor="middle" className="sc-num">{upperNumeral(item?.no, i)}</NativeText>
      <div className="sc-col" style={box([x + ITEM_BOX.dx, ITEM_BOX.y, ITEM_BOX.w, ITEM_BOX.h])}>
        <NativeText school="scu" field={`toc.${i}.title`} className="sc-item"
          style={{ fontSize: vt.size, letterSpacing: vt.spacing, height: ITEM_BOX.h }}>{vt.text}</NativeText>
      </div>
      <div className="sc-dot" style={box([x + DOT_BOX.dx, DOT_BOX.y, DOT_BOX.s, DOT_BOX.s])} aria-hidden="true" />
      {desc ? (
        <div className="sc-col" style={box([x + DESC_BOX.dx, DESC_BOX.y, DESC_BOX.w, DESC_BOX.h])}>
          <NativeText school="scu" field={`toc.${i}.desc`} className="sc-desc"
            style={{ fontSize: df.size, letterSpacing: df.spacing, height: DESC_BOX.h }}>{desc}</NativeText>
        </div>
      ) : null}
      {en ? (
        <div className="sc-col" style={box([x + EN_COL.dx, EN_COL.y, EN_COL.w, EN_COL.h])}>
          <NativeText school="scu" field={`toc.${i}.en`} className="sc-item-en" style={{ fontSize: enSize, letterSpacing: 4 * (enSize / 20), height: EN_COL.h }}>{en}</NativeText>
        </div>
      ) : null}
    </>
  );
}

function Toc({ school, props: p, items, count }) {
  useSchoolStyle(school, 'campus-school-scu-style', CSS);
  const layout = TOC_COLS[count];
  // 5、6 项版里第 4 条起(最左一条除外)和对应分隔线压在 3D 牌坊上面(模板 z 顺序)
  const above = i => count >= 5 && i >= 3 && i < count - 1;
  const lead = String(p.lead ?? '').trim();
  const columns = flag => items.map((item, i) => (above(i) === flag
    ? <TocColumn key={i} school={school} item={item} i={i} x={layout.nums[i]} count={count} pitch={layout.nums[0] - layout.nums[1]} /> : null));
  const seps = flag => layout.seps.map((x, j) => ((count >= 5 && j >= 3) === flag
    ? <div key={`s${j}`} className="sc-sep" style={{ left: x - 0.75, top: SEP_Y, height: SEP_H }} aria-hidden="true" /> : null));
  return (
    <SchoolStage school={school} page="toc">
      <SchoolImage school={school} file="bg-image5.jpg" rect={[0, 0, 1920, 1080]} />
      <div className="sc-glow" style={box([234.72, 299.48, 725.76, 725.76])} aria-hidden="true" />
      <div className="sc-curtain" style={box([1180.8, 0, 739.2, 1080])} aria-hidden="true" />
      <SchoolImage school={school} file="img-image9.png" rect={[1427.08, 611.2, 665.2, 665.2]} alpha={0.05} />
      <NativeText school="scu" field="!!目录标题" rect={[108, 79.2, 273.6, 122.4]} anchor="bottom" className="sc-toc-title">{p.title}</NativeText>
      <NativeText school="scu" field="!!目录英文" rect={[328.32, 144, 432, 46.08]} anchor="bottom" className="sc-toc-en">{p.subtitle}</NativeText>
      {lead ? <NativeText school="scu" field="!!目录引言" rect={[112.32, 218.51, 864, 51.84]} className="sc-lead"
        style={scaled(lead, 30, 864, 4)}>{lead}</NativeText> : null}
      {columns(false)}
      {seps(false)}
      <SchoolImage school={school} file="model-image10.png" rect={[-79.26, 156.27, 1378.06, 1012.18]} morph={MORPH_MODEL} />
      {columns(true)}
      {seps(true)}
    </SchoolStage>
  );
}

export default {
  Cover,
  Toc,
  // 模板里有、网页没显示的文字框:导出换回原生页时清空
  coverClear: (props) => {
    const t = coverTexts(props || {}, { nameEn: 'SICHUAN UNIVERSITY' });
    const clear = [];
    if (!t.big) clear.push('!!通栏标题');
    if (!t.sub) clear.push('!!通栏副标题');
    if (!t.presenterLine) clear.push('!!汇报人');
    if (!t.date) clear.push('!!日期');
    return clear;
  },
  tocClear: (props, count) => {
    const clear = String(props?.lead ?? '').trim() ? [] : ['!!目录引言'];
    const list = Array.isArray(props?.items) ? props.items.slice(0, count) : [];
    for (let i = 0; i < count; i += 1) {
      if (!String(list[i]?.desc ?? '').trim()) clear.push(`toc.${i}.desc`);
      if (!String(list[i]?.note ?? '').trim()) clear.push(`toc.${i}.en`);
    }
    return clear;
  },
};
