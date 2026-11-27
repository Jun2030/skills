// 东南大学 · 建筑蓝图(3D 建筑)。照样板校 ../sjtu/index.jsx 的结构写。
//
// 还原依据:模板第 28 / 29 / 30 页(封面原版 / 长标题版 / 关键词大字版)与第 32、33、31、34、35 页(目录 2–6 项),
// 坐标取自 `python3 -I scripts/campus-schools/extract-assets.py --school seu --dump-only` 导出的
// output/campus-schools/seu/slide-<id>.txt(1920×1080 舞台 px,字号已按 1pt = 2px 换算)。
// 背景渐变、图框、图签栏的线、分隔线都是直线 / 矩形,用 CSS 画;网格底纹、3D 光晕、建筑是提取好的图片。
//
// 通用字段 → 模板字段(封面的框在模板里都以 !! 开头,只有图签栏是封面和目录共用的):
//   封面 原版       title → !!校名(152px 单行大字,超长缩字);kicker → !!校训(场景名,金色大字);subtitle → !!导语
//   封面 长标题版    title → !!校名(两行,每行 ≤ 9 字);「东南大学 · kicker」→ !!校训(放不下时只放 kicker);subtitle → !!导语
//   封面 关键词版    关键词大字(kit 的 coverKeyword:keyword → 场景名推出的短词 → 校名「东南大学」)→ !!校名;kicker → !!校训;title [+ 换行 + subtitle] → !!导语
//   三版共用        !!英文校名 = 学校英文名(固定)
//   图签栏(!!,封面标字段;目录取 deck 级封面信息 useDeckCover,并用 data-sync-text 跟着封面上的直接修改):
//                  项目 = 「东南大学 · kicker」;图名 = title;导师 = advisor(空时「—」);答辩人 = presenter(标签按 presenterLabel);
//                  日期 = date;图号 = 「SEU—00」(固定)。标签和内容原文里的连续空格用 white-space:pre 保留。
//   目录            title → 目录-标题;subtitle → 目录-英文;items[i] 的 no / title / note / desc → toc.i.num(「A-」+ 编号)/ title / en / desc
//                  (desc 里的换行分成两段,第二段颜色浅一档,和模板一致);表头「图号 / 图名 / 内容」固定。
// 3D 渲染图、网格底纹、光晕在封面和目录上位置不同,都打 data-morph-key,放映时封面 → 目录平滑移动。
import React from 'react';
import { NativeText, SchoolImage, SchoolStage, MORPH_MODEL, box, charCount, coverKeyword, fitText, splitTitle, useDeckCover, useSchoolStyle } from '../kit.jsx';
import { schoolFontStack } from '../fonts.mjs';

const HEAVY = schoolFontStack('思源黑体 CN Heavy');
const SANS = schoolFontStack('思源黑体 CN Regular', 'sans');

const CSS = `
.cp-sch-seu{background:linear-gradient(55deg,var(--sch-bg-a) 0%,var(--sch-bg-b) 100%);color:var(--sch-white);}
.cp-sch-seu .se-frame{position:absolute;box-sizing:border-box;border:2px solid var(--sch-frame);}
.cp-sch-seu .se-hline{position:absolute;height:0;}
.cp-sch-seu .se-vline{position:absolute;width:0;}
.cp-sch-seu .se-dot{position:absolute;background:var(--sch-mint);}
.cp-sch-seu .se-name{font-family:${HEAVY};font-weight:900;color:var(--sch-white);line-height:1.2;white-space:nowrap;}
.cp-sch-seu .se-name-en{font-family:${SANS};font-weight:300;font-size:29px;letter-spacing:15px;color:var(--sch-pale);line-height:1.2;white-space:nowrap;}
.cp-sch-seu .se-scene{font-family:${SANS};font-weight:500;color:var(--sch-sand);line-height:1.2;white-space:nowrap;}
.cp-sch-seu .se-lead{font-family:${SANS};font-weight:300;font-size:27px;color:var(--sch-lead);line-height:1.44;}
.cp-sch-seu .se-label{font-family:${SANS};font-size:15px;letter-spacing:2px;color:var(--sch-label);line-height:1.2;white-space:pre;}
.cp-sch-seu .se-cell{font-family:${SANS};font-size:27px;color:var(--sch-white);line-height:1.2;white-space:pre;}
.cp-sch-seu .se-cell.is-pale{color:var(--sch-pale);}
.cp-sch-seu .se-cell.is-mint{color:var(--sch-mint);}
.cp-sch-seu .se-toc-title{font-family:${HEAVY};font-weight:900;font-size:92px;letter-spacing:8px;color:var(--sch-white);line-height:1.2;white-space:nowrap;}
.cp-sch-seu .se-toc-en{font-family:${SANS};font-weight:300;font-size:24px;letter-spacing:8px;color:var(--sch-mint);line-height:1.2;white-space:nowrap;}
.cp-sch-seu .se-head{font-family:${SANS};font-weight:300;font-size:15px;letter-spacing:2px;color:var(--sch-label);line-height:1.2;white-space:pre;}
.cp-sch-seu .se-num{font-family:${SANS};font-weight:500;color:var(--sch-mint);line-height:1.2;white-space:nowrap;}
.cp-sch-seu .se-item{font-family:${HEAVY};font-weight:900;letter-spacing:4px;color:var(--sch-white);line-height:1.2;white-space:nowrap;}
.cp-sch-seu .se-item-en{font-family:${SANS};font-weight:300;letter-spacing:8px;color:var(--sch-label);line-height:1.2;white-space:nowrap;}
.cp-sch-seu .se-desc{font-family:${SANS};font-weight:300;color:var(--sch-pale);line-height:1.62;}
.cp-sch-seu .se-desc .se-desc-2{color:var(--sch-lead);}
`;

const MORPH_GRID = 'seu-grid';
const MORPH_GLOW = 'seu-glow';
const GRID = { cover: [0, 0, 2160, 1080], toc: [-120, 0, 2160, 1080] };
const GLOW = { cover: [580, 40, 1500, 1000], toc: [-89, 250, 1150, 780] };
const MODEL = { cover: { file: 'model-image43.png', rect: [844.83, -27.6, 1163.94, 965.95] }, toc: { file: 'model-image44.png', rect: [-134.92, 42.51, 1169.98, 890.99] } };

// 三种封面(模板第 28 / 29 / 30 页):校名、英文校名、分隔线、场景名(框名「!!校训」)、导语
const COVER = {
  default: { name: [88, 259.93, 720, 180], nameSize: 152, nameSpacing: 8, en: 443.93, rule: 507.93, scene: [92, 563.27, 640, 90], sceneSize: 66, sceneSpacing: 28, lead: [96, 656.93, 660, 112] },
  long_title: { name: [88, 259.93, 780, 186.4], nameSize: 76, nameSpacing: 4, en: 454.33, rule: 518.33, scene: [92, 573.67, 640, 90], sceneSize: 48, sceneSpacing: 16, lead: [96, 667.33, 660, 112] },
  keyword: { name: [88, 259.93, 720, 180], nameSize: 152, nameSpacing: 8, en: 443.93, rule: 507.93, scene: [92, 563.27, 760, 90], sceneSize: 52, sceneSpacing: 12, lead: [96, 656.93, 660, 112] },
};

// 图签栏:六栏,标签 / 内容的位置(内容的可用宽度到下一条竖线为止)
const SHEET_LINES = [560, 960, 1200, 1480, 1680];
const SHEET = [
  { key: 'project', x: 60, room: 480 },
  { key: 'title', x: 580, room: 360 },
  { key: 'advisor', x: 980, room: 205, tone: 'is-pale' },
  { key: 'presenter', x: 1220, room: 245 },
  { key: 'date', x: 1500, room: 165 },
  { key: 'sheet', x: 1700, room: 165, tone: 'is-mint', labelY: 958 },
];

// 目录:第一条图号框顶边 y0、行距 pitch,其余框相对图号框的偏移(模板第 32、33、31、34、35 页);竖线高度
const TOC_BIG = { numSize: 34, nameDy: -10, nameH: 60, nameSize: 46, enDy: 50, enSize: 16, descDy: -4, descH: 84, descSize: 23, sepDy: 98 };
const TOC = {
  2: { ...TOC_BIG, y0: 414, pitch: 144, vline: 292 },
  3: { ...TOC_BIG, y0: 414, pitch: 140, vline: 428 },
  4: { ...TOC_BIG, y0: 414, pitch: 124, vline: 520 },
  5: { y0: 404, pitch: 102, numSize: 30, nameDy: -8, nameH: 52, nameSize: 40, enDy: 44, enSize: 15, descDy: -4, descH: 60.9, descSize: 21, sepDy: 82, vline: 530 },
  6: { y0: 398, pitch: 87, numSize: 27, nameDy: -6, nameH: 45.5, nameSize: 35, enDy: 39, enSize: 14, descDy: -3, descH: 55.1, descSize: 19, sepDy: 71, vline: 540 },
};

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
const TWO_LINE_HEIGHT = 1.1;
function fitBigText(text, { size, width, spacing, height }) {
  const one = fitText(text, { size, width, spacing, minScale: 0.1 });
  if (text.includes('\n') || one >= size * 0.5) return { text, size: one, two: text.includes('\n') };
  const split = splitTitleWords(text, Math.ceil(charCount(text) / 2) + 1);
  // 两行还要放进原来的框高(行距 TWO_LINE_HEIGHT),不压到上下的眉题 / 校训
  const fit = Math.min(fitText(split, { size, width, spacing, minScale: 0.1 }), Math.floor((height / 2 / TWO_LINE_HEIGHT) * 100) / 100);
  return { text: split, size: fit, two: split.includes('\n') };
}

function HLine({ x, y, w, width = 1, tone = 'rule-faint' }) {
  return <div className="se-hline" style={{ left: x, top: y - width / 2, width: w, borderTop: `${width}px solid var(--sch-${tone})` }} aria-hidden="true" />;
}
function VLine({ x, y, h, width = 1, tone = 'frame-soft' }) {
  return <div className="se-vline" style={{ left: x - width / 2, top: y, height: h, borderLeft: `${width}px solid var(--sch-${tone})` }} aria-hidden="true" />;
}

/** 封面 / 目录共用的底层:背景渐变(SchoolStage)、网格底纹、3D 光晕。 */
function Backdrop({ school, page }) {
  return (
    <>
      <SchoolImage school={school} file="img-image41.png" rect={GRID[page]} morph={MORPH_GRID} />
      <SchoolImage school={school} file="img-image42.png" rect={GLOW[page]} morph={MORPH_GLOW} />
    </>
  );
}

function Model({ school, page }) {
  const m = MODEL[page];
  return <SchoolImage school={school} file={m.file} rect={m.rect} morph={MORPH_MODEL} />;
}

function sheetTexts(school, p) {
  const labels = school.defaults.labels;
  const presenterLabel = str(p.presenterLabel) || '答辩人';
  const presenterEn = school.defaults.presenterEn[presenterLabel] || 'PRESENTER';
  const kicker = str(p.kicker);
  return {
    project: { label: labels.project, text: kicker ? `${school.name} · ${kicker}` : school.name },
    title: { label: labels.title, text: str(p.title).replace(/\s*\n\s*/g, '') || '—' },
    advisor: { label: labels.advisor, text: str(p.advisor) || '—' },
    presenter: { label: presenterLabel === '答辩人' ? labels.presenter : `${presenterLabel}  ${presenterEn}`, text: str(p.presenter) || '—' },
    date: { label: labels.date, text: str(p.date) || '—' },
    sheet: { label: labels.sheet, text: school.defaults.sheet },
  };
}

// 图签栏在模板里是封面与目录共用的 !! 框(导出时目录跟着封面填)。目录页取 deck 级封面信息(kit 的 useDeckCover:
// 生成时与浏览器里是同一份,预览面板改了封面属性后跟着变);在封面上直接改图签文字时,目录上同一格用 data-sync-text 跟着变。
/** 底部图签栏(!! 框,封面与目录共用):封面标 data-native-field,目录只用 data-sync-text 跟着封面改。 */
function TitleBlock({ school, page, texts }) {
  const onCover = page === 'cover';
  return (
    <>
      <HLine x={40} y={944} w={1840} width={1.5} tone="frame" />
      {SHEET_LINES.map(x => <VLine key={x} x={x} y={944} h={96} />)}
      {SHEET.map((cell, i) => {
        const { label, text } = texts[cell.key];
        return (
          <React.Fragment key={cell.key}>
            <NativeText school="seu" field={onCover ? `!!图签-标签${i}` : undefined} sync={`seu-sheet-label-${i}`} rect={[cell.x, cell.labelY ?? 962.8, 380, 22]} className="se-label">{label}</NativeText>
            <NativeText school="seu" field={onCover ? `!!图签-内容${i}` : undefined} sync={`seu-sheet-${i}`} rect={[cell.x, 990.8, cell.room, 40]} className={`se-cell ${cell.tone || ''}`}
              style={{ fontSize: fitText(text, { size: 27, width: cell.room }) }}>{text}</NativeText>
          </React.Fragment>
        );
      })}
    </>
  );
}

function coverTexts(school, p, variant) {
  const kicker = str(p.kicker);
  const subtitle = str(p.subtitle);
  if (variant === 'keyword') {
    const title = str(p.title).replace(/\s*\n\s*/g, '');
    return { name: coverKeyword(school, p), scene: kicker, lead: [title, subtitle].filter(Boolean).join('\n') };
  }
  if (variant === 'long_title') {
    const withSchool = kicker ? `${school.name} · ${kicker}` : school.name;
    return { name: splitTitleWords(p.title, school.titleCaps.long_title), scene: charCount(withSchool) <= 11 ? withSchool : kicker, lead: subtitle };
  }
  return { name: str(p.title).replace(/\s*\n\s*/g, ''), scene: kicker, lead: subtitle };
}

function Cover({ school, props: p, variant }) {
  useSchoolStyle(school, 'campus-school-seu-style', CSS);
  const c = COVER[variant] || COVER.default;
  const long = variant === 'long_title';
  const texts = coverTexts(school, p, variant);
  const { scene, lead } = texts;
  const big = fitBigText(texts.name, { size: c.nameSize, width: c.name[2], spacing: c.nameSpacing, height: c.name[3] });
  const name = big.text;
  const nameSize = big.size;
  const sceneSize = fitText(scene, { size: c.sceneSize, width: c.scene[2], spacing: c.sceneSpacing });
  const sheet = sheetTexts(school, p);
  return (
    <SchoolStage school={school} page="cover">
      <Backdrop school={school} page="cover" />
      <NativeText school="seu" field="!!校名" rect={c.name} nowrap className="se-name"
        style={{ fontSize: nameSize, letterSpacing: c.nameSpacing * (nameSize / c.nameSize), lineHeight: long || !big.two ? 1.2 : TWO_LINE_HEIGHT }}>{name}</NativeText>
      <NativeText school="seu" field="!!英文校名" rect={[96, c.en, 760, 40]} className="se-name-en">{school.nameEn}</NativeText>
      <HLine x={96} y={c.rule} w={174} width={3} tone="mint" />
      <div className="se-dot" style={box([280, c.rule - 4, 8, 8])} aria-hidden="true" />
      {scene ? <NativeText school="seu" field="!!校训" rect={c.scene} className="se-scene"
        style={{ fontSize: sceneSize, letterSpacing: c.sceneSpacing * (sceneSize / c.sceneSize) }}>{scene}</NativeText> : null}
      {lead ? <NativeText school="seu" field="!!导语" rect={c.lead} className="se-lead"
        style={{ fontSize: fitText(lead, { size: 27, width: 2 * c.lead[2] - 40 }) }}>{lead}</NativeText> : null}
      <div className="se-frame" style={box([40, 40, 1840, 1000])} aria-hidden="true" />
      <TitleBlock school={school} page="cover" texts={sheet} />
      <Model school={school} page="cover" />
    </SchoolStage>
  );
}

function tocNum(item, i) {
  const no = str(item?.no) || String(i + 1).padStart(2, '0');
  return /^\d+$/.test(no) ? `A-${no.padStart(2, '0')}` : no;
}

function Toc({ school, props: p, items, count }) {
  useSchoolStyle(school, 'campus-school-seu-style', CSS);
  const t = TOC[count];
  const heads = school.defaults.headers;
  const heading = str(p.title);
  const headingEn = str(p.subtitle);
  const sheet = sheetTexts(school, useDeckCover());
  return (
    <SchoolStage school={school} page="toc">
      <Backdrop school={school} page="toc" />
      <NativeText school="seu" field="目录-标题" rect={[1014, 104, 700, 110]} nowrap className="se-toc-title"
        style={{ fontSize: fitText(heading, { size: 92, width: 700, spacing: 8 }) }}>{heading}</NativeText>
      {headingEn ? <NativeText school="seu" field="目录-英文" rect={[1020, 220, 840, 34]} className="se-toc-en">{headingEn}</NativeText> : null}
      <NativeText school="seu" field="目录-表头-图号" rect={[1020, 344, 300, 22]} className="se-head">{heads.num}</NativeText>
      <NativeText school="seu" field="目录-表头-图名" rect={[1180, 344, 300, 22]} className="se-head">{heads.title}</NativeText>
      <NativeText school="seu" field="目录-表头-内容" rect={[1450, 344, 300, 22]} className="se-head">{heads.desc}</NativeText>
      <HLine x={1020} y={376} w={840} width={1.5} tone="rule" />
      {items.map((item, i) => {
        const y = t.y0 + i * t.pitch;
        const title = str(item?.title);
        const en = str(item?.note);
        const desc = str(item?.desc);
        const descLines = desc.split('\n').map(line => line.trim()).filter(Boolean);
        return (
          <React.Fragment key={i}>
            <NativeText school="seu" field={`toc.${i}.num`} rect={[1020, y, 150, 50]} className="se-num" style={{ fontSize: t.numSize }}>{tocNum(item, i)}</NativeText>
            <NativeText school="seu" field={`toc.${i}.title`} rect={[1180, y + t.nameDy, 270, t.nameH]} className="se-item"
              style={{ fontSize: fitText(title, { size: t.nameSize, width: 262, spacing: 4 }) }}>{title}</NativeText>
            {en ? <NativeText school="seu" field={`toc.${i}.en`} rect={[1182, y + t.enDy, 270, 24]} className="se-item-en"
              style={{ fontSize: fitText(en, { size: t.enSize, width: 262, spacing: 8 }) }}>{en}</NativeText> : null}
            {descLines.length ? (
              <div className="cp-sch-abs" style={box([1450, y + t.descDy, 420, t.descH])}>
                <div className="cp-sch-text-inner se-desc" data-native-field={`toc.${i}.desc`} data-editable-path={`school.seu.toc.${i}.desc`}
                  style={{ fontSize: fitText(descLines.join(descLines.length > 1 ? '\n' : ''), { size: t.descSize, width: descLines.length > 1 ? 420 : 820 }) }}>
                  {descLines[0]}{descLines.slice(1).map((line, k) => <React.Fragment key={k}><br /><span className="se-desc-2">{line}</span></React.Fragment>)}
                </div>
              </div>
            ) : null}
            {i < count - 1 ? <HLine x={1020} y={y + t.sepDy} w={840} /> : null}
          </React.Fragment>
        );
      })}
      <VLine x={1166} y={350} h={t.vline} tone="rule-faint" />
      <div className="se-frame" style={box([40, 40, 1840, 1000])} aria-hidden="true" />
      <Model school={school} page="toc" />
      <TitleBlock school={school} page="toc" texts={sheet} />
    </SchoolStage>
  );
}

export default {
  Cover,
  Toc,
  // 模板里有、网页没显示的框:场景名 / 导语为空时清空
  coverClear: (props, variant) => {
    const { scene, lead } = coverTexts({ name: '东南大学', defaults: { keyword: '东南大学' }, titleCaps: { long_title: 9 } }, props || {}, variant);
    return [scene ? null : '!!校训', lead ? null : '!!导语'].filter(Boolean);
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
