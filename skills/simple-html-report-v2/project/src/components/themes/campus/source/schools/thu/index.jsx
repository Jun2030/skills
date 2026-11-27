// 清华大学 · 礼堂与二校门(视频背景)。
//
// 还原依据:模板第 36 / 37 页(封面原版 / 长标题版)与第 38 页(「第二页」,只作目录的设计语言参考),坐标取自
// `python3 -I scripts/campus-schools/extract-assets.py --school thu --dump-only` 导出的 output/campus-schools/thu/slide-<id>.txt。
// 封面叠放顺序照模板:大礼堂视频(左右各裁 2.2%,下沿超出舞台)→ 文字衬底(全屏 PNG)→ 眉题 / 主标题 / 校训 → 地点胶囊 → 校徽。
//
// 通用字段 → 模板字段:
//   封面 原版       kicker(空时学校眉题「SINCE 1911 · GRAND AUDITORIUM」)→ 眉题;title → 主标题(单行);
//                   subtitle(空时 motto,再空时校训「自强不息·厚德载物」)→ 校训
//   封面 长标题版    title 超过 10 字:拆成均衡的两行(每行 ≤ 14 字)→ 主标题,kicker 与 subtitle 用「 · 」连成一行 → 眉题
//                   (这一版模板没有校训框);title 一行放得下(手动选了这一版):主标题 = title / subtitle(空时校训)两行,kicker → 眉题
//   两版共用        汇报人 / 指导教师 / 单位 / 日期 → 地点胶囊:地点标签 = presenterLabel(紫色胶囊),
//                   地点说明 = 「林晓舟　|　指导教师：…　|　…　|　2026年6月」;这些都没写时保留学校自己的「大礼堂 · 清华早期四大建筑之一」
//
// 目录:模板没有目录页(tocNative: false)。按封面与第二页的设计语言自绘:第二页的二校门视频与文字衬底、左侧大标题
// (第二页「行胜于言」的位置与字号)、右侧半透明紫色「玻璃条」+ 紫色胶囊序号(第二页校训 / 学风 / 传统三条的样式)、左下地点胶囊。
// 根节点不带 data-campus-native-*,文字不标 data-native-field(导出按普通页面);文字仍可编辑(data-editable-path)。
import React from 'react';
import { NativeText, SchoolImage, SchoolStage, SchoolVideo, box, charCount, fitText, lines, splitTitle, useSchoolStyle } from '../kit.jsx';
import { schoolFontStack } from '../fonts.mjs';

const HEAVY = schoolFontStack('Source Han Serif SC Heavy');
const SERIF_B = schoolFontStack('Source Han Serif CN SemiBold');
const SANS = schoolFontStack('Microsoft YaHei', 'sans');
const LATIN = `Arial,'Helvetica Neue',${SANS}`;

const CSS = `
.cp-sch-thu{background:var(--sch-sky);color:var(--sch-white);}
.cp-sch-thu .th-eyebrow{font-family:${LATIN};font-weight:300;font-size:24px;letter-spacing:8px;color:var(--sch-white);text-align:center;line-height:1.2;white-space:pre;}
.cp-sch-thu .th-title{font-family:${HEAVY};font-weight:900;color:var(--sch-white);text-align:center;line-height:1.2;text-shadow:0 4px 14px var(--sch-shadow-title);}
.cp-sch-thu .th-motto{font-family:${SERIF_B};font-weight:600;font-size:48px;letter-spacing:16px;color:var(--sch-white);text-align:center;line-height:1.2;white-space:nowrap;text-shadow:0 3px 9px var(--sch-shadow-title);}
.cp-sch-thu .th-pill{position:absolute;border-radius:999px;background:var(--sch-purple);}
.cp-sch-thu .th-pill-text{font-family:${SANS};font-weight:700;font-size:22px;color:var(--sch-white);text-align:center;line-height:1.2;white-space:nowrap;}
.cp-sch-thu .th-note{font-family:${SANS};font-size:24px;letter-spacing:2px;color:var(--sch-white);line-height:1.2;white-space:pre;text-shadow:0 3px 9px var(--sch-shadow-note);}
.cp-sch-thu .th-toc-eyebrow{font-family:${SANS};font-size:26px;letter-spacing:6px;color:var(--sch-white);line-height:1.2;white-space:nowrap;text-shadow:0 3px 9px var(--sch-shadow-eyebrow);}
.cp-sch-thu .th-toc-title{font-family:${HEAVY};font-weight:900;font-size:160px;letter-spacing:16px;color:var(--sch-white);line-height:1.2;white-space:nowrap;text-shadow:0 4px 14px var(--sch-shadow-title);}
.cp-sch-thu .th-toc-lead{font-family:${SANS};font-size:30px;letter-spacing:2px;color:var(--sch-white);line-height:1.2;white-space:nowrap;text-shadow:0 3px 9px var(--sch-shadow-sub);}
.cp-sch-thu .th-glass{position:absolute;border-radius:999px;background:var(--sch-glass);border:1.5px solid var(--sch-glass-edge);box-sizing:border-box;}
.cp-sch-thu .th-tag{font-family:${SANS};font-weight:700;font-size:24px;color:var(--sch-white);text-align:center;line-height:1.2;white-space:nowrap;}
.cp-sch-thu .th-item{font-family:${SERIF_B};font-weight:600;font-size:32px;letter-spacing:4px;color:var(--sch-white);line-height:1.2;white-space:nowrap;}
.cp-sch-thu .th-desc{font-family:${SANS};font-size:20px;letter-spacing:1px;color:var(--sch-white-82);line-height:1.2;white-space:nowrap;margin-top:6px;}
`;

// 两种封面的文字框位置(模板第 36 / 37 页)
const COVER = {
  default: { eyebrow: [288, 183.79, 1343.95, 29.08], title: [160.8, 220.32, 1598.4, 179.33], titleSize: 148, titleSpacing: 12, lineHeight: 1.2 },
  long_title: { eyebrow: [288, 168, 1343.95, 29.08], title: [160.8, 208, 1598.4, 245.12], titleSize: 104, titleSpacing: 10, lineHeight: 1.14 },
};
const MOTTO = [288, 402.82, 1343.95, 58.16];
const PLACE = [86.4, 953.28, 112.32, 51.84];
const PLACE_NOTE = [223.2, 953.28, 864, 51.84];
const LOGO = [78.4, 63.67, 228.88, 80.72];
const VIDEO_COVER = { file: 'video-media1.mp4', poster: 'video-media1-poster.jpg', rect: [0.02, 0, 1919.95, 1130.33], crop: { l: 0.02203, r: 0.02203 } };
const VIDEO_PAGE2 = { file: 'video-media2.mp4', poster: 'video-media2-poster.jpg', rect: [0.02, 0, 1919.93, 1080], crop: { l: 0.11103, t: 0.19322, r: 0.0818 } };

const clean = value => String(value ?? '').trim();

/** 封面地点胶囊:有汇报信息时 = 「汇报人」+「姓名　|　指导教师：…　|　单位　|　日期」;都没有时用学校自己的地点题注。 */
function placeTexts(p, school) {
  const parts = [];
  const presenter = clean(p.presenter);
  if (presenter) parts.push(presenter);
  const advisor = clean(p.advisor);
  if (advisor) parts.push(`${clean(p.advisorLabel) || '指导教师'}：${advisor}`);
  const unit = clean(p.unit);
  if (unit) parts.push(unit);
  const date = clean(p.date);
  if (date) parts.push(date);
  if (!parts.length) return { label: school.defaults.place, note: school.defaults.placeNote };
  const label = presenter ? clean(p.presenterLabel) || '汇报人' : date && parts.length === 1 ? clean(p.dateLabel) || '日期' : clean(p.unitLabel) || '学院';
  return { label, note: parts.join('　|　') };
}

function coverTexts(school, p, variant) {
  const kicker = clean(p.kicker);
  const subtitle = clean(p.subtitle);
  if (variant === 'long_title') {
    const raw = clean(p.title);
    // 标题一行放得下(手动选了长标题版):照模板「百年清华 弦歌不辍 / 自强不息 厚德载物」,第二行放副标题(没有时放校训)
    if (!raw.includes('\n') && charCount(raw) <= school.titleCaps.default) {
      const second = subtitle || clean(p.motto) || school.defaults.motto;
      return { eyebrow: kicker || school.defaults.eyebrow, title: second ? `${raw}\n${second}` : raw, motto: '' };
    }
    // 真的长:拆成均衡的两行,副标题并进眉题一行(这一版模板没有校训框)
    const perLine = Math.min(school.titleCaps.long_title, Math.max(6, Math.ceil(charCount(raw) / 2)));
    return {
      eyebrow: [kicker, subtitle].filter(Boolean).join('  ·  ') || school.defaults.eyebrow,
      title: splitTitle(raw, perLine),
      motto: '',
    };
  }
  return {
    eyebrow: kicker || school.defaults.eyebrow,
    title: String(p.title ?? '').replace(/\n/g, ''),
    motto: subtitle || clean(p.motto) || school.defaults.motto,
  };
}

/** 左下角紫色胶囊 + 说明(封面「地点标签 / 地点说明」;目录页沿用同一样式,不标导出字段)。 */
function Place({ label, note, native }) {
  const Text = native ? NativeText : EditText;
  return (
    <>
      <div className="th-pill" style={box(PLACE)} aria-hidden="true" />
      <Text school="thu" field={native ? '地点标签' : 'toc.place'} rect={PLACE} anchor="middle" className="th-pill-text"
        style={{ fontSize: fitText(label, { size: 22, width: PLACE[2] - 20 }) }}>{label}</Text>
      <Text school="thu" field={native ? '地点说明' : 'toc.placeNote'} rect={PLACE_NOTE} anchor="middle" className="th-note"
        style={{ fontSize: fitText(note, { size: 24, width: PLACE_NOTE[2], spacing: 2 }) }}>{note}</Text>
    </>
  );
}

function Cover({ school, props: p, variant }) {
  useSchoolStyle(school, 'campus-school-thu-style', CSS);
  const v = COVER[variant] ? variant : 'default';
  const layout = COVER[v];
  const { eyebrow, title, motto } = coverTexts(school, p, v);
  const titleSize = fitText(title, { size: layout.titleSize, width: layout.title[2], spacing: layout.titleSpacing });
  const place = placeTexts(p, school);
  return (
    <SchoolStage school={school} page="cover">
      <SchoolVideo school={school} file={VIDEO_COVER.file} poster={VIDEO_COVER.poster} rect={VIDEO_COVER.rect} crop={VIDEO_COVER.crop} />
      <SchoolImage school={school} file="img-image46.png" rect={[0.02, 0, 1919.95, 1080]} />
      <NativeText school="thu" field="眉题" rect={layout.eyebrow} className="th-eyebrow"
        style={{ fontSize: fitText(eyebrow, { size: 24, width: layout.eyebrow[2], spacing: 8 }) }}>{eyebrow}</NativeText>
      <NativeText school="thu" field="主标题" rect={layout.title} nowrap className="th-title"
        style={{ fontSize: titleSize, letterSpacing: layout.titleSpacing * (titleSize / layout.titleSize), lineHeight: layout.lineHeight }}>{title}</NativeText>
      {v === 'default' ? (
        <NativeText school="thu" field="校训" rect={MOTTO} className="th-motto"
          style={{ fontSize: fitText(motto, { size: 48, width: MOTTO[2], spacing: 16 }) }}>{motto}</NativeText>
      ) : null}
      <Place label={place.label} note={place.note} native />
      <SchoolImage school={school} file="logo-image47.png" rect={LOGO} />
    </SchoolStage>
  );
}

/** 目录页的可编辑文字:和 NativeText 一样的排版与编辑路径,但不带 data-native-field(这一页不是模板原生页)。 */
function EditText({ field, school, rect, anchor = 'top', className = '', style, children }) {
  const path = `school.${school}.${field}`;
  if (anchor !== 'top') {
    return (
      <div className={`cp-sch-abs cp-sch-box ${anchor === 'middle' ? 'is-middle' : 'is-bottom'}`} style={box(rect)}>
        <div className={`cp-sch-text-inner ${className}`} style={style} data-editable-path={path}>{lines(children)}</div>
      </div>
    );
  }
  return <div className={`cp-sch-text ${className}`} style={box(rect, style)} data-editable-path={path}>{lines(children)}</div>;
}

// 目录右栏:第二页「玻璃条」的位置与尺寸(x 1245.6、宽 587.52、高 89.28、行距 115.2,首条顶边 216);
// 胶囊序号在条内偏移 17.28、103.68 × 54.72;条目文字从 x 1396.8 起。条目多或带说明时压缩高度与间距,底边不过 925(让开左下胶囊)。
const BAR = { x: 1245.6, w: 587.52, top: 216, bottom: 925, h: 89.28, hDesc: 112, gap: 25.92, minGap: 16 };
const TAG = { dx: 17.28, w: 103.68, h: 54.72 };
const ITEM_X = 1396.8;
const ITEM_W = 414.72;

function barLayout(count, withDesc) {
  let h = withDesc ? BAR.hDesc : BAR.h;
  let gap = BAR.gap;
  const room = BAR.bottom - BAR.top;
  if (count * h + (count - 1) * gap > room) {
    gap = Math.max(BAR.minGap, Math.min(gap, (room - count * h) / Math.max(1, count - 1)));
    h = Math.min(h, (room - (count - 1) * gap) / count);
  }
  return Array.from({ length: count }, (_, i) => [BAR.x, BAR.top + i * (h + gap), BAR.w, h]);
}

function Toc({ school, props: p, items, count }) {
  useSchoolStyle(school, 'campus-school-thu-style', CSS);
  const withDesc = items.some(item => clean(item?.desc));
  const bars = barLayout(count, withDesc);
  const eyebrow = clean(p.subtitle);
  const lead = clean(p.lead) || school.defaults.tocLead;
  const title = String(p.title ?? '');
  return (
    <SchoolStage school={school} page="toc">
      <SchoolVideo school={school} file={VIDEO_PAGE2.file} poster={VIDEO_PAGE2.poster} rect={VIDEO_PAGE2.rect} crop={VIDEO_PAGE2.crop} />
      <SchoolImage school={school} file="img-image46.png" rect={[0, 0, 1919.95, 1080]} />
      <SchoolImage school={school} file="img-image46.png" rect={[0, 708.69, 1919.95, 371.31]} crop={{ t: 0.6562 }} />
      {eyebrow ? <EditText school="thu" field="toc.eyebrow" rect={[86.4, 224.88, 720, 31.5]} className="th-toc-eyebrow">{eyebrow}</EditText> : null}
      <EditText school="thu" field="toc.title" rect={[86.4, 272.46, 1080, 193.87]} className="th-toc-title"
        style={{ fontSize: fitText(title, { size: 160, width: 1080, spacing: 16 }) }}>{title}</EditText>
      {lead ? <EditText school="thu" field="toc.lead" rect={[86.4, 469.62, 1080, 36.35]} className="th-toc-lead"
        style={{ fontSize: fitText(lead, { size: 30, width: 1080, spacing: 2 }) }}>{lead}</EditText> : null}
      {items.map((item, i) => {
        const [x, y, w, h] = bars[i];
        const itemTitle = String(item?.title ?? '');
        const desc = clean(item?.desc);
        const no = clean(item?.no) || String(i + 1).padStart(2, '0');
        const tagRect = [x + TAG.dx, y + (h - TAG.h) / 2, TAG.w, TAG.h];
        return (
          <React.Fragment key={i}>
            <div className="th-glass" style={box([x, y, w, h])} aria-hidden="true" />
            <div className="th-pill" style={box(tagRect)} aria-hidden="true" />
            <EditText school="thu" field={`toc.${i}.num`} rect={tagRect} anchor="middle" className="th-tag">{no}</EditText>
            <div className="cp-sch-abs cp-sch-box is-middle" style={box([ITEM_X, y, ITEM_W, h])}>
              <div className="cp-sch-text-inner th-item" data-editable-path={`school.thu.toc.${i}.title`}
                style={{ fontSize: fitText(itemTitle, { size: 32, width: ITEM_W, spacing: 4 }) }}>{lines(itemTitle)}</div>
              {desc ? <div className="cp-sch-text-inner th-desc" data-editable-path={`school.thu.toc.${i}.desc`}
                style={{ fontSize: fitText(desc, { size: 20, width: ITEM_W, spacing: 1 }) }}>{lines(desc)}</div> : null}
            </div>
          </React.Fragment>
        );
      })}
      <Place label={school.defaults.tocPlace} note={school.defaults.tocPlaceNote} />
      <SchoolImage school={school} file="logo-image47.png" rect={LOGO} />
    </SchoolStage>
  );
}

export default {
  Cover,
  Toc,
  tocNative: false,
  // 长标题版模板没有校训框,本来就不在字段里;原版的校训总有文字(subtitle → motto → 学校校训),其余字段也总有文字
  coverClear: () => [],
};
