// 中山大学 · 绿拱金线(3D 建筑)。照样板校 ../sjtu/index.jsx 的结构写。
//
// 还原依据:模板第 14 / 15 / 16 页(封面原版 / 长标题版 / 关键词大字版)与第 18、19、17、20、21 页(目录 2–6 项),
// 坐标取自 `python3 -I scripts/campus-schools/extract-assets.py --school sysu --dump-only` 导出的
// output/campus-schools/sysu/slide-<id>.txt(1920×1080 舞台 px,字号已按 1pt = 2px 换算)。
// 拱门(round2SameRect,上半圆 + 直边)、外框线、金线、光晕用 CSS 画:提取脚本的 SVG 层只能把这种预设形状近似成矩形。
//
// 通用字段 → 模板字段:
//   封面 三版共用   kicker [+ titleEn] → 封面-眉题(「第三讲 · 文献综述 | LECTURE 03」:titleEn 空时只显示 kicker、不画竖线)
//                  motto(空时用校训「博学 审问 慎思 明辨 笃行」)→ 封面-校训(词与词之间画金色菱形)
//                  presenterLabel / presenter [/ advisor] [/ date] → 封面-汇报人(胶囊框,内容长时胶囊变宽、再长缩字)
//   封面 原版       title → 封面-主标题(单行,超长自动缩小)
//   封面 长标题版    title → 封面-主标题(两行,每行 ≤ 7 字)
//   封面 关键词版    关键词大字(kit 的 coverKeyword:keyword → 场景名推出的短词 → 学校默认「中山大学」)→ 封面-主标题;title → 封面-副标题（长）(框宽 820,为和建筑留出间距按 780 缩字)
//   subtitle 模板三版都没有对应的框,不显示。
//   学校固定文字:!!英文标识「SUN YAT-SEN UNIVERSITY  ·  EST. 1924」、!!拱门-题注「康乐园 · 怀士堂 / SWASEY HALL · 1916」。
//   这两个是封面与目录共用的 !! 框:只在封面标 data-native-field,目录上用 data-sync-text 跟着封面改。
//   目录            title → 目录-标题;subtitle → 目录-英文;items[i] 的 no / title / note / desc → toc.i.num / title / en / desc
// 3D 渲染图、拱门、水印校徽在封面和目录上位置不同,都打 data-morph-key,放映时封面 → 目录平滑移动(模拟 PowerPoint 平滑)。
import React from 'react';
import { NativeText, SchoolImage, SchoolStage, MORPH_MODEL, box, charCount, coverKeyword, fitText, splitTitle, widthEm, useSchoolStyle } from '../kit.jsx';
import { schoolFontStack } from '../fonts.mjs';
import { schoolAsset } from '../registry.mjs';

const HEAVY = schoolFontStack('Source Han Serif CN Heavy');
const SEMI = schoolFontStack('Source Han Serif CN SemiBold');
const MEDIUM = schoolFontStack('Source Han Serif CN Medium');
const SERIF = schoolFontStack('思源宋体');
const NUM = `'Cinzel',${SERIF}`;

const CSS = `
.cp-sch-sysu{background:linear-gradient(to bottom right,var(--sch-bg-a) 0%,var(--sch-bg-b) 60%,var(--sch-bg-c) 100%);}
.cp-sch-sysu .sy-arch{position:absolute;}
.cp-sch-sysu .sy-wm{position:absolute;}
.cp-sch-sysu .sy-badge{font-family:${SERIF};font-size:20px;letter-spacing:6px;color:var(--sch-grey);text-align:right;line-height:1.2;white-space:pre;}
.cp-sch-sysu .sy-kicker{font-family:${SEMI};font-weight:600;letter-spacing:6px;color:var(--sch-rust);line-height:1.2;white-space:pre;}
.cp-sch-sysu .sy-kicker .sy-bar{font-family:${SERIF};font-weight:400;letter-spacing:0;color:var(--sch-rust-60);}
.cp-sch-sysu .sy-kicker .sy-en{font-family:${SERIF};font-weight:400;font-size:.875em;}
.cp-sch-sysu .sy-title{font-family:${HEAVY};font-weight:900;letter-spacing:4px;color:var(--sch-green);line-height:1.2;}
.cp-sch-sysu .sy-sub{font-family:${SEMI};font-weight:600;letter-spacing:1px;color:var(--sch-green);line-height:1.2;white-space:nowrap;}
.cp-sch-sysu .sy-motto{font-family:${SEMI};font-weight:600;font-size:40px;color:var(--sch-ink);line-height:1.2;white-space:nowrap;}
.cp-sch-sysu .sy-motto .sy-word{letter-spacing:3px;}
.cp-sch-sysu .sy-motto .sy-dia{font-family:${SERIF};font-weight:400;font-size:16px;color:var(--sch-gold);vertical-align:5px;}
.cp-sch-sysu .sy-pill{position:absolute;box-sizing:border-box;border:2px solid var(--sch-green);border-radius:37.44px;}
.cp-sch-sysu .sy-pill-text{font-family:${SEMI};font-weight:600;letter-spacing:2px;color:var(--sch-green);text-align:center;line-height:1.2;white-space:nowrap;}
.cp-sch-sysu .sy-cap{font-size:28px;text-align:center;line-height:1.3;white-space:nowrap;}
.cp-sch-sysu .sy-cap .sy-cap-zh{font-family:${MEDIUM};font-weight:500;font-size:28px;letter-spacing:8px;color:var(--sch-gold-hi);}
.cp-sch-sysu .sy-cap .sy-cap-en{font-family:${SERIF};font-size:18px;letter-spacing:6px;color:var(--sch-gold-hi-80);}
.cp-sch-sysu .sy-toc-title{font-family:${HEAVY};font-weight:900;font-size:108px;letter-spacing:6px;color:var(--sch-green);line-height:1.2;white-space:nowrap;}
.cp-sch-sysu .sy-toc-en{font-family:${SERIF};font-size:34px;letter-spacing:12px;color:var(--sch-gold);line-height:1.2;white-space:nowrap;}
.cp-sch-sysu .sy-num{font-family:${NUM};font-weight:700;color:var(--sch-rust);line-height:1.2;white-space:nowrap;}
.cp-sch-sysu .sy-item{font-family:${MEDIUM};font-weight:500;letter-spacing:4px;color:var(--sch-green);line-height:1.2;white-space:nowrap;}
.cp-sch-sysu .sy-item-en{font-family:${SERIF};font-size:20px;letter-spacing:6px;color:var(--sch-gold);text-align:right;line-height:1.2;white-space:nowrap;}
.cp-sch-sysu .sy-desc{font-family:${SERIF};letter-spacing:1px;color:var(--sch-desc);line-height:1.2;white-space:nowrap;}
.cp-sch-sysu .sy-rule{position:absolute;height:0;border-top:1.5px solid var(--sch-rule);}
`;

const LOGO = [108, 72, 280, 80.64];

// 拱门四层(外框线 / 拱门 / 金线 / 光晕)与题注、英文标识、水印校徽:封面在右,目录在左
const ARCH = {
  cover: { line: [950.4, 175.68, 806.4, 904.32], fill: [979.2, 204.48, 748.8, 875.52], gold: [999.36, 224.64, 708.48, 855.36], glow: [1036.8, 345.19, 633.6, 518.4] },
  toc: { line: [129.6, 151.2, 878.4, 987.84], fill: [158.4, 180, 820.8, 959.04], gold: [178.56, 200.16, 780.48, 938.88], glow: [221.54, 286.07, 694.52, 568.25] },
};
const CAPTION = { cover: [1123.2, 288.96, 460.8, 89.28], toc: [355.68, 264.48, 460.8, 89.28] };
const BADGE = { cover: [1149.12, 79.2, 662.4, 43.2], toc: [1149.12, 1005.12, 662.4, 43.2] };
const WATERMARK = { cover: { rect: [-252, 698.4, 705.6, 705.6], alpha: 0.05 }, toc: { rect: [1504.8, 655.2, 705.6, 705.6], alpha: 0.045 } };
const MODEL = { cover: { file: 'model-image13.png', rect: [741.55, 320.36, 1296.61, 920.89] }, toc: { file: 'model-image14.png', rect: [-33.35, 321.52, 1168.12, 817.52] } };
const MORPH_ARCH = 'sysu-arch';
const MORPH_WATERMARK = 'sysu-watermark';

// 三种封面的文字框(模板第 14 / 15 / 16 页)
const COVER = {
  default: { kicker: [108, 355.51, 748.8, 46.08], title: [102.24, 413.42, 820, 180], titleSize: 160, motto: [108, 600.03, 748.8, 72] },
  long_title: { kicker: [108, 355.51, 748.8, 46.08], title: [102.24, 409.59, 820, 228.8], titleSize: 100, motto: [108, 654.39, 748.8, 72] },
  keyword: { kicker: [108, 340, 748.8, 46.08], title: [102.24, 396, 820, 180], titleSize: 160, sub: [108.24, 580, 820, 68], motto: [108, 668, 748.8, 72] },
};
const PILL = [108, 852.48, 388.8, 74.88];
const PILL_MAX = 748.8;

// 目录:每种条目数的第一条标题框顶边 top、行距 pitch;序号框相对标题框的偏移与高度、说明框与分隔线的偏移(模板第 18–21、17 页)
const TOC_BIG = { numDy: 0, numH: 89.28, numSize: 60, titleH: 63.36, titleSize: 44, descSize: 28 };
const TOC = {
  2: { ...TOC_BIG, top: 453.9, pitch: 184, descDy: 66.2, ruleDy: 123.8 },
  3: { ...TOC_BIG, top: 381.9, pitch: 164, descDy: 66.2, ruleDy: 123.8 },
  4: { ...TOC_BIG, top: 346.05, pitch: 144, descDy: 66.24, ruleDy: 123.84 },
  5: { ...TOC_BIG, top: 300.8, pitch: 126, descDy: 62, ruleDy: 110 },
  6: { numDy: -4, numH: 76, numSize: 50, titleH: 54, titleSize: 38, descSize: 24, top: 295.8, pitch: 106, descDy: 54, ruleDy: 94 },
};
const TOC_X = { num: 1144.8, title: 1288.8, en: 1537.92, right: 1811.52 };

const str = value => String(value ?? '').trim();

// 题目拆两行:先用 kit 的 splitTitle(标点、「的 / 与 / 和」处断);断点落在常见双字词中间(如「有|机」「街|区」)时,
// 改在最均衡、又不拆词的位置断(两行都不超过 perLine)。
const TITLE_WORDS = new Set(('有机 更新 策略 研究 方法 分析 设计 系统 模型 城市 街区 传统 交通 流量 预测 深度 学习 优化 应用 实现 机制 评价 '
  + '影响 因素 数据 智能 算法 网络 技术 发展 管理 建设 保护 空间 规划 文化 教育 学生 社会 经济 环境 能源 材料 结构 控制 信息 识别 检测 '
  + '图像 语言 历史 理论 实践 创新 治理 服务 平台 工程 生态 乡村 产业 政策 风险 安全 健康 医疗 资源 老城 基于 面向 视角 背景 路径 对策 '
  + '探索 构建 体系 模式 效应 关系 演变 特征 协同 融合 转型 驱动 视域 时代 中国 我国 区域 绿色 低碳 数字 课程 教学 写作 综述 文献').split(' '));
function splitTitleWords(title, perLine) {
  const text = String(title ?? '').trim();
  const base = splitTitle(text, perLine);
  if (!base.includes('\n') || text.includes('\n')) return base;
  const [a, b] = base.split('\n');
  if (!TITLE_WORDS.has(`${Array.from(a).slice(-1)[0]}${Array.from(b)[0]}`)) return base;
  const chars = Array.from(text);
  let best = null;
  for (let at = 1; at < chars.length; at += 1) {
    if (TITLE_WORDS.has(`${chars[at - 1]}${chars[at]}`)) continue;
    const head = chars.slice(0, at).join('');
    const tail = chars.slice(at).join('');
    const score = Math.max(charCount(head), charCount(tail));
    if (score <= perLine && (!best || score < best.score)) best = { text: `${head}\n${tail}`, score };
  }
  return best ? best.text : base;
}

/**
 * 单行大字放不下时(按原字号要缩到一半以下,例如手动选了原版又写了长题目)改成两行再缩字,保证不溢出框宽。
 * 返回 { text, size, two }。
 */
const TWO_LINE_HEIGHT = 1.05;
function fitBigText(text, { size, width, spacing, height }) {
  const one = fitText(text, { size, width, spacing, minScale: 0.1 });
  if (text.includes('\n') || one >= size * 0.5) return { text, size: one, two: text.includes('\n') };
  const split = splitTitleWords(text, Math.ceil(charCount(text) / 2) + 1);
  // 两行还要放进原来的框高(行距 TWO_LINE_HEIGHT),不压到上下的眉题 / 校训
  const fit = Math.min(fitText(split, { size, width, spacing, minScale: 0.1 }), Math.floor((height / 2 / TWO_LINE_HEIGHT) * 100) / 100);
  return { text: split, size: fit, two: split.includes('\n') };
}

/** 一段对应模板文字框、但里面有几种样式的文字:外层定位,里层整层带 data-native-field(导出取整层文字)。 */
function RichText({ field, sync, rect, anchor = 'middle', className = '', style, children }) {
  const attrs = {
    'data-native-field': field || undefined,
    'data-editable-path': field ? `school.sysu.${field}` : undefined,
    'data-sync-text': sync || undefined,
  };
  return (
    <div className={`cp-sch-abs cp-sch-box ${anchor === 'middle' ? 'is-middle' : anchor === 'bottom' ? 'is-bottom' : ''}`} style={box(rect)}>
      <div className={`cp-sch-text-inner ${className}`} style={style} {...attrs}>{children}</div>
    </div>
  );
}

// 拱门、水印校徽参与封面 → 目录的平滑移动:编辑器把它们复制到页面外的过渡层里飞,那里没有本页的 class 样式和
// --sch-* 变量,所以外观全部写在行内样式里(颜色取 meta.mjs 的调色板)。
const LAYER = { position: 'absolute', display: 'block', boxSizing: 'border-box' };

/** 上半圆拱门(round2SameRect adj1=50%):四层按外框线的位置用百分比摆,平滑移动时整组一起缩放。 */
function Arch({ school, page }) {
  const a = ARCH[page];
  const c = school.palette;
  const [ox, oy, ow, oh] = a.line;
  const pct = ([x, y, w, h]) => ({ left: `${((x - ox) / ow) * 100}%`, top: `${((y - oy) / oh) * 100}%`, width: `${(w / ow) * 100}%`, height: `${(h / oh) * 100}%` });
  const round = ([, , w, h]) => ({ borderRadius: `50% 50% 0 0 / ${((w / 2) / h) * 100}% ${((w / 2) / h) * 100}% 0 0` });
  const outline = color => ({ border: `1.5px solid ${color}`, borderBottom: 0 });
  return (
    <div className="sy-arch" style={box(a.line)} data-morph-key={MORPH_ARCH} aria-hidden="true">
      <i style={{ ...LAYER, ...pct(a.line), ...round(a.line), ...outline(c['arch-line']) }} />
      <i style={{ ...LAYER, ...pct(a.fill), ...round(a.fill), background: `linear-gradient(180deg,${c['arch-a']} 0%,${c['arch-b']} 52%,${c['arch-c']} 100%)`, boxShadow: `0 24px 80px ${c['arch-shadow']}` }} />
      <i style={{ ...LAYER, ...pct(a.gold), ...round(a.gold), ...outline(c['arch-gold']) }} />
      <i style={{ ...LAYER, ...pct(a.glow), borderRadius: '50%', background: `radial-gradient(ellipse farthest-corner at 50% 50%,${c['glow-a']} 0%,${c['glow-b']} 45%,${c['glow-b']} 100%)` }} />
    </div>
  );
}

/** 水印校徽:透明度放在里层图片上(平滑移动的复制品只改外层位置,不会闪成不透明)。 */
function Watermark({ school, page }) {
  const { rect, alpha } = WATERMARK[page];
  return (
    <div className="sy-wm" style={box(rect)} data-morph-key={MORPH_WATERMARK} aria-hidden="true">
      <img src={schoolAsset(school.key, 'logo-image11.png')} alt="" style={{ ...LAYER, left: 0, top: 0, width: '100%', height: '100%', maxWidth: 'none', opacity: alpha, pointerEvents: 'none' }} decoding="async" draggable="false" />
    </div>
  );
}

/** 英文标识(!! 框,封面 / 目录共用):封面标字段,目录跟着封面改。 */
function Badge({ school, page }) {
  return (
    <NativeText school="sysu" field={page === 'cover' ? '!!英文标识' : undefined} sync="sysu-badge" rect={BADGE[page]} anchor="middle" className="sy-badge">
      {school.defaults.badge}
    </NativeText>
  );
}

/** 拱门题注(!! 框):中文一行 + 英文一行。 */
function Caption({ school, page }) {
  return (
    <RichText field={page === 'cover' ? '!!拱门-题注' : undefined} sync="sysu-arch-caption" rect={CAPTION[page]} anchor="top" className="sy-cap">
      <span className="sy-cap-zh">{school.defaults.archCaption}</span><br /><span className="sy-cap-en">{school.defaults.archCaptionEn}</span>
    </RichText>
  );
}

function Model({ school, page }) {
  const m = MODEL[page];
  return <SchoolImage school={school} file={m.file} rect={m.rect} morph={MORPH_MODEL} />;
}

function presenterLine(p) {
  const parts = [];
  const presenter = str(p.presenter);
  if (presenter) parts.push(`${str(p.presenterLabel) || '汇报人'}：${presenter}`);
  const advisor = str(p.advisor);
  if (advisor) parts.push(`${str(p.advisorLabel) || '指导教师'}：${advisor}`);
  const date = str(p.date);
  if (date) parts.push(date);
  return parts.join(' · ');
}

/** 汇报人胶囊宽度:内容长时变宽(到校训行宽为止),再长缩字。模板里胶囊就是文字框本身(带描边),导出时按同样的宽度改原生框。 */
function pillWidth(pill) {
  return Math.min(PILL_MAX, Math.max(PILL[2], widthEm(pill) * 30 + Array.from(pill).length * 2 + 80));
}

function mottoWords(p, school) {
  const motto = str(p.motto) || school.defaults.motto;
  return motto.split(/[\s·・、，,|/◆]+/).filter(Boolean);
}

function coverTexts(school, p, variant) {
  if (variant === 'keyword') return { title: coverKeyword(school, p), sub: str(p.title).replace(/\n/g, '') };
  if (variant === 'long_title') return { title: splitTitleWords(p.title, school.titleCaps.long_title), sub: '' };
  return { title: str(p.title).replace(/\n/g, ''), sub: '' };
}

function Cover({ school, props: p, variant }) {
  useSchoolStyle(school, 'campus-school-sysu-style', CSS);
  const c = COVER[variant] || COVER.default;
  const long = variant === 'long_title';
  const texts = coverTexts(school, p, variant);
  const { sub } = texts;
  const kicker = str(p.kicker);
  const en = str(p.titleEn);
  const kickerSize = fitText(en ? `${kicker}      ${en}` : kicker, { size: 32, width: c.kicker[2], spacing: 6 });
  // 模板框宽 820,右端压在建筑渲染图下面;缩字按 750 算,长题目也不钻到建筑后面
  const big = fitBigText(texts.title, { size: c.titleSize, width: 750, spacing: 4, height: c.title[3] });
  const title = big.text;
  const titleSize = big.size;
  const words = mottoWords(p, school);
  const pill = presenterLine(p);
  const pillW = pillWidth(pill);
  const pillSize = fitText(pill, { size: 30, width: pillW - 64, spacing: 2 });
  return (
    <SchoolStage school={school} page="cover">
      <Watermark school={school} page="cover" />
      <Arch school={school} page="cover" />
      <SchoolImage school={school} file="logo-image12.png" rect={LOGO} />
      <Badge school={school} page="cover" />
      {kicker ? (
        <RichText field="封面-眉题" rect={c.kicker} className="sy-kicker" style={{ fontSize: kickerSize }}>
          {kicker}{en ? <><span className="sy-bar">{'   |   '}</span><span className="sy-en">{en}</span></> : null}
        </RichText>
      ) : null}
      <NativeText school="sysu" field="封面-主标题" rect={c.title} anchor={long ? 'top' : 'middle'} nowrap className="sy-title"
        style={{ fontSize: titleSize, letterSpacing: 4 * (titleSize / c.titleSize), lineHeight: long ? 1.07 : big.two ? TWO_LINE_HEIGHT : 1.2 }}>{title}</NativeText>
      <RichText field="封面-校训" rect={c.motto} className="sy-motto">
        {words.map((word, i) => (
          <React.Fragment key={i}>{i ? <> <span className="sy-dia">◆</span> </> : null}<span className="sy-word">{word}</span></React.Fragment>
        ))}
      </RichText>
      {pill ? (
        <>
          <div className="sy-pill" style={box([PILL[0], PILL[1], pillW, PILL[3]])} aria-hidden="true" />
          <NativeText school="sysu" field="封面-汇报人" rect={[PILL[0], PILL[1], pillW, PILL[3]]} anchor="middle" className="sy-pill-text" style={{ fontSize: pillSize }}>{pill}</NativeText>
        </>
      ) : null}
      <Model school={school} page="cover" />
      <Caption school={school} page="cover" />
      {variant === 'keyword' && sub ? (
        <NativeText school="sysu" field="封面-副标题（长）" rect={c.sub} className="sy-sub" style={{ fontSize: fitText(sub, { size: 44, width: 780, spacing: 1 }) }}>{sub}</NativeText>
      ) : null}
    </SchoolStage>
  );
}

function Toc({ school, props: p, items, count }) {
  useSchoolStyle(school, 'campus-school-sysu-style', CSS);
  const t = TOC[count];
  const heading = str(p.title);
  const headingEn = str(p.subtitle);
  return (
    <SchoolStage school={school} page="toc">
      <Watermark school={school} page="toc" />
      <Arch school={school} page="toc" />
      <Badge school={school} page="toc" />
      <NativeText school="sysu" field="目录-标题" rect={[1140.48, 103.68, 288, 144]} anchor="bottom" nowrap className="sy-toc-title"
        style={{ fontSize: fitText(heading, { size: 108, width: 240, spacing: 6 }) }}>{heading}</NativeText>
      {headingEn ? <NativeText school="sysu" field="目录-英文" rect={[1379.47, 172.8, 374.4, 57.6]} anchor="bottom" className="sy-toc-en"
        style={{ fontSize: fitText(headingEn, { size: 34, width: 430, spacing: 12 }) }}>{headingEn}</NativeText> : null}
      {items.map((item, i) => {
        const y = t.top + i * t.pitch;
        const title = str(item?.title);
        const en = str(item?.note);
        const desc = str(item?.desc);
        // 条目标题与右侧英文小标同一行:英文越短,标题可用的宽度越大(模板框宽 270,英文为空时可到整行)
        const enWidth = en ? widthEm(en) * 20 + Array.from(en).length * 6 : 0;
        const titleRoom = Math.max(270, TOC_X.right - TOC_X.title - enWidth - (en ? 28 : 0));
        return (
          <React.Fragment key={i}>
            <NativeText school="sysu" field={`toc.${i}.num`} rect={[TOC_X.num, y + t.numDy, 136.8, t.numH]} anchor="middle" className="sy-num" style={{ fontSize: t.numSize }}>
              {item?.no || String(i + 1).padStart(2, '0')}
            </NativeText>
            <NativeText school="sysu" field={`toc.${i}.title`} rect={[TOC_X.title, y, titleRoom, t.titleH]} anchor="middle" className="sy-item"
              style={{ fontSize: fitText(title, { size: t.titleSize, width: titleRoom, spacing: 4 }) }}>{title}</NativeText>
            {en ? <NativeText school="sysu" field={`toc.${i}.en`} rect={[TOC_X.en, y, 273.6, t.titleH]} anchor="middle" className="sy-item-en"
              style={{ fontSize: fitText(en, { size: 20, width: 273.6, spacing: 6 }) }}>{en}</NativeText> : null}
            {desc ? <NativeText school="sysu" field={`toc.${i}.desc`} rect={[TOC_X.title, y + t.descDy, 522.72, 46.08]} anchor="middle" className="sy-desc"
              style={{ fontSize: fitText(desc, { size: t.descSize, width: 522.72, spacing: 1 }) }}>{desc}</NativeText> : null}
            <div className="sy-rule" style={{ left: TOC_X.num, top: y + t.ruleDy - 0.75, width: 666.72 }} aria-hidden="true" />
          </React.Fragment>
        );
      })}
      <Caption school={school} page="toc" />
      <Model school={school} page="toc" />
      <SchoolImage school={school} file="logo-image12.png" rect={LOGO} />
    </SchoolStage>
  );
}

export default {
  Cover,
  Toc,
  // 模板里有、网页没显示的框:眉题 / 主讲人为空时清空
  coverClear: (props, variant) => {
    const clear = [];
    if (!str(props?.kicker)) clear.push('封面-眉题');
    if (!presenterLine(props || {})) clear.push('封面-汇报人');
    if (variant === 'keyword' && !str(props?.title)) clear.push('封面-副标题（长）');
    return clear;
  },
  // 胶囊随内容加宽:原生页上的「封面-汇报人」框(带描边的胶囊)改成同样宽
  coverBoxes: props => {
    const pill = presenterLine(props || {});
    const w = pill ? pillWidth(pill) : PILL[2];
    return w > PILL[2] + 0.5 ? { '封面-汇报人': [PILL[0], PILL[1], Math.round(w * 100) / 100, PILL[3]] } : {};
  },
  // 目录英文标题、条目英文小标、条目说明为空时清空模板里对应的框
  tocClear: (props, count) => {
    const clear = str(props?.subtitle) ? [] : ['目录-英文'];
    const items = Array.isArray(props?.items) ? props.items.slice(0, count) : [];
    for (let i = 0; i < count; i += 1) {
      if (!str(items[i]?.note)) clear.push(`toc.${i}.en`);
      if (!str(items[i]?.desc)) clear.push(`toc.${i}.desc`);
    }
    return clear;
  },
};
