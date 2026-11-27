// 浙江大学 · 天空白雾 · 拱门(视频背景)。
//
// 还原依据:模板第 47 / 48 页(封面原版 / 长标题版)与第 50、51、49、52、53 页(目录 2–6 项),坐标取自
// `python3 -I scripts/campus-schools/extract-assets.py --school zju --dump-only` 导出的 output/campus-schools/zju/slide-<id>.txt。
// 叠放顺序照模板:
//   封面  视频(放大、顶部对齐)→ 底部蓝色弧带 + 白色弧幕(cover-band.svg)→ 顶部「!!天空白雾」→ 标题 / 英文 / 副标题 → 信息行(图标 + 文字)→ 校徽
//   目录  底色 → 视频(上移,拱门露在中部)→ 顶部白雾 → 底部白雾 → 「目录」+ 两侧渐隐短线 + CONTENTS → 白色圆角卡片(分隔线、序号、胶囊标题、说明)→ 校徽
// 视频尺寸和两层白雾是设计师配合这段视频调好的,位置与渐变照抄模板。封面 → 目录在模板里是平滑(Morph):
// 校徽两页位置相同,打 data-morph-key="school-logo" 让它在切换时保持不动,其余内容交叉淡化。
//
// 通用字段 → 模板字段:
//   封面-校训(模板里放主标题的框) ← title(原版单行;长标题版拆两行,每行 ≤ 15 字)
//   封面-英文   ← titleEn,空时用学校英文行「Seeking Truth, Pursuing Innovation」(校训求是创新)
//   封面-副标题 ← subtitle,空时用 kicker
//   封面-信息1…4(底部一行「标签：内容」):模板里四个图标是固定的(奖杯 / 团队 / 学院 / 日历),按图标含义固定槽位:
//     信息1 奖杯 = 场景 / 赛道(kicker;副标题已经用了 kicker 时不重复)、信息2 团队 = 答辩人 + 导师(两项都有时分两行)、
//     信息3 学院 = 学院 / 单位、信息4 日历 = 日期;位置照模板,空槽位网页不显示,导出时清空文字并隐藏图标(data-campus-native-hide)
//   目录 title → 目录-标题;subtitle → 目录-英文;items[i] 的 no / title / desc → toc.i.num / title / desc(说明为空时清空)
import React from 'react';
import { NativeText, SchoolImage, SchoolStage, SchoolVideo, Layer, MORPH_LOGO, box, fitText, labeled, splitTitle, useSchoolStyle, widthEm } from '../kit.jsx';
import { schoolFontStack } from '../fonts.mjs';

const KAI = schoolFontStack('Alimama DongFangDaKai');
const HEAVY = schoolFontStack('思源宋体 CN Heavy');
const SANS = schoolFontStack('思源黑体 CN', 'sans');
const NUM = `'D-DIN','DIN Alternate','Bahnschrift',${schoolFontStack('思源黑体 CN', 'sans')}`;

const VIDEO = 'video-media4.mp4';
const POSTER = 'video-media4-poster.jpg';
const LOGO = [95.11, 60.52, 282.89, 72.29];

const CSS = `
.cp-sch-zju{background:var(--sch-base);color:var(--sch-blue);}
.cp-sch-zju .zj-fog{position:absolute;background:linear-gradient(180deg,var(--sch-fog-a) 0%,var(--sch-fog-b) 50%,var(--sch-fog-c) 100%);pointer-events:none;}
.cp-sch-zju .zj-mist{position:absolute;background:linear-gradient(180deg,var(--sch-mist-a) 0%,var(--sch-mist-b) 60%,var(--sch-base) 100%);pointer-events:none;}
.cp-sch-zju .zj-title{font-family:${KAI};font-weight:400;color:var(--sch-blue);text-align:center;line-height:1.2;}
.cp-sch-zju .zj-en{font-family:${SANS};font-size:20px;letter-spacing:14px;color:var(--sch-blue-en);text-align:center;line-height:1.2;white-space:nowrap;}
.cp-sch-zju .zj-sub{font-family:${HEAVY};font-weight:900;letter-spacing:4px;color:var(--sch-blue);text-align:center;line-height:1.2;white-space:nowrap;}
.cp-sch-zju .zj-info{font-family:${SANS};font-size:19px;line-height:1.2;white-space:pre;color:var(--sch-ink);}
.cp-sch-zju .zj-info-label{letter-spacing:2px;color:var(--sch-label);font-weight:400;}
.cp-sch-zju .zj-info-value{letter-spacing:1px;color:var(--sch-ink);font-weight:500;}
.cp-sch-zju .zj-toc-title{font-family:${KAI};font-weight:400;font-size:120px;letter-spacing:8px;color:var(--sch-blue);text-align:center;line-height:1.2;white-space:nowrap;}
.cp-sch-zju .zj-toc-line{position:absolute;height:4px;}
.cp-sch-zju .zj-toc-line.is-left{background:linear-gradient(90deg,var(--sch-blue-0),var(--sch-blue));}
.cp-sch-zju .zj-toc-line.is-right{background:linear-gradient(90deg,var(--sch-blue),var(--sch-blue-0));}
.cp-sch-zju .zj-toc-en{font-family:${SANS};font-size:18px;color:var(--sch-blue-en);line-height:1.2;white-space:nowrap;}
.cp-sch-zju .zj-card{position:absolute;box-sizing:border-box;border-radius:34px;background:var(--sch-card);border:4px solid var(--sch-card-edge);box-shadow:0 12px 40px var(--sch-card-shadow);}
.cp-sch-zju .zj-divider{position:absolute;width:2.4px;background:var(--sch-divider);}
.cp-sch-zju .zj-num{font-family:${NUM};font-weight:400;font-size:76px;color:var(--sch-blue);-webkit-text-stroke:2.5px var(--sch-blue);text-align:center;line-height:1;padding-top:12px;white-space:nowrap;}
.cp-sch-zju .zj-pill{position:absolute;box-sizing:border-box;border-radius:28.5px;background:var(--sch-pill);border:3px solid var(--sch-pill-edge);}
.cp-sch-zju .zj-item{font-family:${HEAVY};font-weight:900;letter-spacing:3px;color:var(--sch-blue);text-align:center;line-height:1.2;white-space:nowrap;}
.cp-sch-zju .zj-desc{font-family:${SANS};letter-spacing:1px;color:var(--sch-desc);text-align:center;line-height:1.3;}
`;

// 封面两种版式的文字框(模板第 47 / 48 页)
const COVER = {
  default: { title: [200, 171.96, 1520, 159.95], titleSize: 132, titleSpacing: 6, en: [335.33, 349.37, 1249.33, 37.18], sub: [360, 404.55, 1200, 67.86], subSize: 56 },
  long_title: { title: [200, 140, 1520, 216.38], titleSize: 92, titleSpacing: 4, en: [335.33, 360.38, 1249.33, 37.18], sub: [260, 405.56, 1400, 67.86], subSize: 46 },
};

// 目录:卡片左边与宽度、每列中心 x、序号框 / 说明框宽度、说明字号(模板各版「目录-卡片」「目录-0N-*」);分隔线在相邻两列中间
const TOC = {
  2: { card: [400, 1120], cols: [680, 1240], numW: 300, descW: 360, descSize: 21 },
  3: { card: [240, 1440], cols: [480, 960, 1440], numW: 300, descW: 360, descSize: 21 },
  4: { card: [140, 1640], cols: [345, 755, 1165, 1575], numW: 300, descW: 360, descSize: 21 },
  5: { card: [100, 1720], cols: [272, 616, 960, 1304, 1648], numW: 300, descW: 332, descSize: 19 },
  6: { card: [80, 1760], cols: [226.67, 520, 813.33, 1106.67, 1400, 1693.33], numW: 273.33, descW: 281.33, descSize: 17 },
};

const clean = value => String(value ?? '').trim();

function subtitleOf(p) {
  return clean(p.subtitle) || clean(p.kicker);
}

// 底部四个信息槽(模板「封面-图标N」32×32 与「封面-信息N」300×42 的位置;图标层 SVG 含描边余量,box 取自素材清单)
const INFO_SLOTS = [
  { icon: 'icon-track', iconRect: [326, 1002, 48, 48], rect: [378, 1005, 300, 42] },
  { icon: 'icon-team', iconRect: [694, 1002, 48, 48], rect: [746, 1005, 300, 42] },
  { icon: 'icon-unit', iconRect: [1002, 1002, 48, 48], rect: [1054, 1005, 300, 42] },
  { icon: 'icon-date', iconRect: [1360, 1002, 48, 48], rect: [1412, 1005, 300, 42] },
];
// 信息2 与右边的「学院」图标之间只有约 264px:答辩人和导师写成一行放不下(19px 字号)时分成两行
const TEAM_ROOM = 262;

/**
 * 四个固定槽位的内容(按模板图标含义):[{ rows: [[标签, 内容], …] } | null] × 4。
 * 奖杯 = 场景 / 赛道;团队 = 答辩人 + 指导教师;学院 = 学院 / 单位;日历 = 日期。
 */
function infoSlots(p) {
  const kicker = clean(p.kicker);
  const track = kicker && clean(p.subtitle) && kicker !== clean(p.subtitle) ? [['', kicker]] : null;
  const team = [
    clean(p.presenter) ? [clean(p.presenterLabel) || '汇报人', clean(p.presenter)] : null,
    clean(p.advisor) ? [clean(p.advisorLabel) || '指导教师', clean(p.advisor)] : null,
  ].filter(Boolean);
  const unit = clean(p.unit) ? [[clean(p.unitLabel) || '学院', clean(p.unit)]] : null;
  const date = clean(p.date) ? [[clean(p.dateLabel) || '日期', clean(p.date)]] : null;
  return [track, team.length ? team : null, unit, date].map(rows => (rows ? { rows } : null));
}

/** 一个槽位的文字行:团队两项一行放不下时分两行;返回 { lines: [[标签, 内容]], size }。 */
function slotLines(slot, i) {
  const rows = slot.rows;
  const text = rows.map(([l, v]) => labeled(l, v)).join('　');
  const width = i === 1 ? TEAM_ROOM : 300;
  const one = fitText(text, { size: 19, width, spacing: 1.5 });
  if (rows.length < 2 || one >= 19) return { lines: [rows], size: Math.max(one, 12) };
  // 两行:每行一项,行高 1.1,放进 42px 高的框
  const two = Math.min(17, ...rows.map(row => fitText(labeled(...row), { size: 17, width, spacing: 1.5 })));
  return { lines: rows.map(row => [row]), size: two };
}

function InfoRow({ school, slots }) {
  return INFO_SLOTS.map((pos, i) => {
    const slot = slots[i];
    if (!slot) return null;
    const field = `封面-信息${i + 1}`;
    const { lines, size } = slotLines(slot, i);
    return (
      <React.Fragment key={field}>
        <Layer school={school} name={pos.icon} rect={pos.iconRect} />
        {/* 「标签：内容」两种样式,外层带字段名,导出取整段文字(分两行时是两段) */}
        <div className="cp-sch-abs cp-sch-box is-middle" style={box(pos.rect)}>
          <div className="cp-sch-text-inner zj-info" data-native-field={field} data-editable-path={`school.zju.${field}`}
            style={{ fontSize: size, lineHeight: lines.length > 1 ? 1.1 : 1.2 }}>
            {lines.map((row, k) => (
              <React.Fragment key={k}>
                {k ? <br /> : null}
                {row.map(([label, value], j) => (
                  <React.Fragment key={j}>
                    {j ? <span className="zj-info-value">{'　'}</span> : null}
                    {label ? <span className="zj-info-label">{`${label}：`}</span> : null}
                    <span className="zj-info-value">{value}</span>
                  </React.Fragment>
                ))}
              </React.Fragment>
            ))}
          </div>
        </div>
      </React.Fragment>
    );
  });
}

function coverTitle(school, p, variant) {
  if (variant === 'long_title') return splitTitle(p.title, school.titleCaps.long_title);
  return String(p.title ?? '').replace(/\n/g, '');
}

function Cover({ school, props: p, variant }) {
  useSchoolStyle(school, 'campus-school-zju-style', CSS);
  const cfg = COVER[variant] || COVER.default;
  const long = variant === 'long_title';
  const title = coverTitle(school, p, variant);
  const titleSize = fitText(title, { size: cfg.titleSize, width: cfg.title[2], spacing: cfg.titleSpacing });
  const en = clean(p.titleEn) || school.defaults.titleEn;
  const sub = subtitleOf(p);
  const enSize = fitText(en, { size: 20, width: cfg.en[2], spacing: 14 });
  return (
    <SchoolStage school={school} page="cover">
      <SchoolVideo school={school} file={VIDEO} poster={POSTER} rect={[-143.43, 0, 2206.85, 1242]} />
      <Layer school={school} name="cover-band" rect={[-4, 847, 1928, 237]} />
      <div className="zj-fog" style={box([0, 0, 1920, 600])} aria-hidden="true" />
      {long
        ? <NativeText school="zju" field="封面-校训" rect={cfg.title} className="zj-title"
          style={{ fontSize: titleSize, letterSpacing: cfg.titleSpacing * (titleSize / cfg.titleSize), lineHeight: 1.18 }}>{title}</NativeText>
        : <NativeText school="zju" field="封面-校训" rect={cfg.title} anchor="middle" nowrap className="zj-title"
          style={{ fontSize: titleSize, letterSpacing: cfg.titleSpacing * (titleSize / cfg.titleSize) }}>{title}</NativeText>}
      <NativeText school="zju" field="封面-英文" rect={cfg.en} className="zj-en"
        style={{ fontSize: enSize, letterSpacing: 14 * (enSize / 20) }}>{en}</NativeText>
      {sub ? <NativeText school="zju" field="封面-副标题" rect={cfg.sub} className="zj-sub"
        style={{ fontSize: fitText(sub, { size: cfg.subSize, width: cfg.sub[2], spacing: 4 }) }}>{sub}</NativeText> : null}
      <InfoRow school={school} slots={infoSlots(p)} />
      <SchoolImage school={school} file="logo-image53.png" rect={LOGO} morph={MORPH_LOGO} />
    </SchoolStage>
  );
}

/** 两端分散对齐的拉丁字(模板 align=dist):按框宽估算字距。 */
function spreadSpacing(text, size, width) {
  const n = Array.from(String(text ?? '')).length;
  if (n < 2) return 0;
  return Math.max(0, (width - widthEm(text) * size) / (n - 1));
}

function Toc({ school, props: p, items, count }) {
  useSchoolStyle(school, 'campus-school-zju-style', CSS);
  const cfg = TOC[count];
  const [cardX, cardW] = cfg.card;
  const en = String(p.subtitle ?? '');
  const enGap = spreadSpacing(en, 18, 175.5);
  return (
    <SchoolStage school={school} page="toc">
      <SchoolVideo school={school} file={VIDEO} poster={POSTER} rect={[-106.11, -208.48, 2132.22, 1200]} />
      <div className="zj-fog" style={box([0, 0, 1920, 300])} aria-hidden="true" />
      <div className="zj-mist" style={box([0, 600, 1920, 410])} aria-hidden="true" />
      <NativeText school="zju" field="目录-标题" rect={[760, 96, 400, 120]} anchor="bottom" className="zj-toc-title">{p.title}</NativeText>
      <div className="zj-toc-line is-left" style={{ left: 647.5, top: 158, width: 150 }} aria-hidden="true" />
      <div className="zj-toc-line is-right" style={{ left: 1122.5, top: 158, width: 150 }} aria-hidden="true" />
      <NativeText school="zju" field="目录-英文" rect={[872.25, 224, 175.5 + enGap, 26]} className="zj-toc-en"
        style={{ letterSpacing: enGap }}>{en}</NativeText>
      <div className="zj-card" style={{ left: cardX - 2, top: 666, width: cardW + 4, height: 344 }} aria-hidden="true" />
      {cfg.cols.slice(1).map((c, i) => (
        <div key={`d${i}`} className="zj-divider" style={{ left: (cfg.cols[i] + c) / 2 - 1.2, top: 720, height: 230 }} aria-hidden="true" />
      ))}
      {items.map((item, i) => {
        const c = cfg.cols[i];
        const title = String(item?.title ?? '');
        const desc = clean(item?.desc);
        return (
          <React.Fragment key={i}>
            <NativeText school="zju" field={`toc.${i}.num`} rect={[c - cfg.numW / 2, 723, cfg.numW, 96]} anchor="middle" className="zj-num">{item?.no || String(i + 1).padStart(2, '0')}</NativeText>
            <div className="zj-pill" style={{ left: c - 129.5, top: 827.5, width: 259, height: 57 }} aria-hidden="true" />
            <NativeText school="zju" field={`toc.${i}.title`} rect={[c - 128, 829, 256, 54]} anchor="middle" className="zj-item"
              style={{ fontSize: fitText(title, { size: 26, width: 216, spacing: 3 }) }}>{title}</NativeText>
            {desc ? <NativeText school="zju" field={`toc.${i}.desc`} rect={[c - cfg.descW / 2, 899, cfg.descW, 60]} className="zj-desc"
              style={{ fontSize: fitText(desc, { size: cfg.descSize, width: cfg.descW * 1.9, spacing: 1 }) }}>{desc}</NativeText> : null}
          </React.Fragment>
        );
      })}
      <SchoolImage school={school} file="logo-image53.png" rect={LOGO} morph={MORPH_LOGO} />
    </SchoolStage>
  );
}

export default {
  Cover,
  Toc,
  // 没显示的副标题、没用到的信息框:导出换回原生页时清空
  coverClear: props => {
    const clear = [];
    if (!subtitleOf(props || {})) clear.push('封面-副标题');
    infoSlots(props || {}).forEach((slot, i) => { if (!slot) clear.push(`封面-信息${i + 1}`); });
    return clear;
  },
  // 空槽位的图标在原生页上隐藏(模板四个图标是固定形状)
  coverHide: props => infoSlots(props || {}).map((slot, i) => (slot ? null : `封面-图标${i + 1}`)).filter(Boolean),
  // 条目说明为空时清空模板里对应的说明框
  tocClear: (props, count) => (Array.isArray(props?.items) ? props.items.slice(0, count) : [])
    .map((item, i) => (clean(item?.desc) ? null : `toc.${i}.desc`)).filter(Boolean),
};
