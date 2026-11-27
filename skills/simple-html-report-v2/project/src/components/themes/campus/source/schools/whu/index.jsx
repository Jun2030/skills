// 武汉大学 · 书法樱约(视频背景)。
//
// 还原依据:模板第 54 / 55 / 56 页(封面原版 / 长标题版 / 关键词大字版)与第 58、59、57、60、61 页(目录 2–6 项),坐标取自
// `python3 -I scripts/campus-schools/extract-assets.py --school whu --dump-only` 导出的 output/campus-schools/whu/slide-<id>.txt。
// 叠放顺序照模板:
//   封面  背景图(视频末帧)→ 樱花推镜视频(播放一次停在末帧)→ 主标题 / 引言 / 活动名称胶囊 → 校徽 → 页脚
//   目录  白底 → 老图书馆视频 → 左侧白色渐隐幕 → 校徽 → 目录 / CONTENTS → 当前项高亮条(第 1 项)→ 英文小字 / 序号 / 条目 → 竖线与圆点 → 页脚
//
// 文字出场(模板动画,时间从视频开始播放算):主标题 1.75 s 起淡入上浮 1.2 s,页脚 1.9 s 淡入 0.6 s,引言 2.15 s、
// 活动名称 2.4 s 起淡入上浮 0.9 s——正好是前景樱花移开的时刻。网页里按视频的实际播放进度(currentTime,并按视频时长
// 换算)排这几段动画:视频开始 / 继续播放时排上,播完或没有播放(缩略图、导出截图、不能自动播放、减少动态效果)时
// 文字直接是最终状态。
//
// 通用字段 → 模板字段:
//   封面 原版       title → 主标题(单行);subtitle(空时 motto,再空用学校引言「珞珈山下，樱花如约而至」)→ 引言
//   封面 长标题版    title → 主标题(两行,每行 ≤ 8 字);引言同上
//   封面 关键词版    kit 的 coverKeyword(keyword → 场景名推出的短词 → 「樱约珞珈」)→ 主标题;title → 引言(完整题目)
//   三版共用        kicker → 活动名称(胶囊);英文校名 · 汇报人 · 指导教师 · 日期 → 目录页脚(模板这一行用两个空格夹「·」)
//   目录            title → 目录英文大标题(「目录」);subtitle → 目录英文大标题#2(CONTENTS);
//                   items[i] 的 no / title / note → toc.i.num(「01  ›」)/ title / en(一行放不下时在词间折成两行,同模板);页脚是英文校名 · 校训
//                   第 1 项是模板的「当前项」(高亮条、武大绿、粗体),其余为灰色
import React from 'react';
import { NativeText, SchoolImage, SchoolStage, SchoolVideo, box, charCount, coverKeyword, fitText, splitTitle, useSchoolStyle, wrapWords } from '../kit.jsx';
import { schoolFontStack } from '../fonts.mjs';

const HEAVY = schoolFontStack('Source Han Serif CN Heavy');
const SEMI = schoolFontStack('Source Han Serif CN SemiBold');
const MEDIUM = schoolFontStack('Source Han Serif CN Medium');
const SANS = schoolFontStack('思源黑体', 'sans');

const COVER_VIDEO = 'video-media5.mp4';
// 模板里文字出场时刻(秒,相对封面视频开始播放)按原视频时长 SOURCE_DURATION 定;网页视频转码后时长略有不同,按比例换算
const SOURCE_DURATION = 5.089;
const CUES = { title: [1.75, 1.2], foot: [1.9, 0.6], quote: [2.15, 0.9], event: [2.4, 0.9] };
const SEP = '  ·  ';

const CSS = `
.cp-sch-whu{background:var(--sch-white);color:var(--sch-ink);}
.cp-sch-whu .wh-title{font-family:${HEAVY};font-weight:900;color:var(--sch-ink);line-height:1.2;}
.cp-sch-whu .wh-quote{font-family:${MEDIUM};font-weight:500;color:var(--sch-quote);line-height:1.2;white-space:nowrap;}
.cp-sch-whu .wh-quote.is-dist{text-align:justify;text-align-last:justify;}
.cp-sch-whu .wh-event{position:absolute;border-radius:40.72px;background:var(--sch-green);}
.cp-sch-whu .wh-event-text{font-family:${SEMI};font-weight:600;font-size:40px;letter-spacing:4px;color:var(--sch-ink);text-align:center;line-height:1.2;white-space:nowrap;}
.cp-sch-whu .wh-foot{font-family:${MEDIUM};font-weight:500;font-size:21px;letter-spacing:4px;color:var(--sch-ink);line-height:1.2;white-space:pre;}
.cp-sch-whu.is-toc .wh-foot{color:var(--sch-foot-gray);}
/* 封面引言(关键词版是完整题目)与页脚压在樱花和天空上:加一圈柔和的白色光晕托住字形,樱花最密的第一帧(缩略图、
   不能自动播放时)也读得出来;只是网页效果,导出时文字填进原生页的文本框,原生页照模板。 */
.cp-sch-whu.is-cover .wh-quote{text-shadow:0 0 2px var(--sch-glow),0 0 12px var(--sch-glow),0 0 26px var(--sch-glow-soft);}
.cp-sch-whu.is-cover .wh-foot{text-shadow:0 0 2px var(--sch-glow),0 0 8px var(--sch-glow),0 0 18px var(--sch-glow-soft);}
/* 页脚下面一层很淡的白色薄雾(椭圆渐隐,无硬边),樱花最密时把细小的页脚字托出来 */
.cp-sch-whu .wh-foot-veil{position:absolute;pointer-events:none;background:radial-gradient(50% 50% at 50% 50%,var(--sch-veil) 0%,var(--sch-veil) 45%,var(--sch-white-0) 100%);}
.cp-sch-whu .wh-veil{position:absolute;background:linear-gradient(90deg,var(--sch-white) 42%,var(--sch-white-0) 100%);pointer-events:none;}
.cp-sch-whu .wh-toc-title{font-family:${HEAVY};font-weight:900;font-size:160px;letter-spacing:8px;color:var(--sch-slate);line-height:1.2;white-space:nowrap;}
.cp-sch-whu .wh-toc-en{font-family:${MEDIUM};font-weight:500;font-size:48px;letter-spacing:8px;color:var(--sch-slate);line-height:1.2;white-space:nowrap;}
.cp-sch-whu .wh-hl{position:absolute;border-radius:44.64px;background:linear-gradient(90deg,var(--sch-white) 60%,var(--sch-white-0) 100%);filter:drop-shadow(0 4px 12px var(--sch-hl-shadow));}
.cp-sch-whu .wh-en{font-family:${SANS};font-weight:600;letter-spacing:3px;color:var(--sch-en-gray);text-align:right;line-height:1.14;white-space:nowrap;}
.cp-sch-whu .wh-num{font-family:${MEDIUM};font-weight:500;color:var(--sch-item-gray);line-height:1.2;white-space:pre;}
.cp-sch-whu .wh-arrow{color:var(--sch-arrow-gray);}
.cp-sch-whu .wh-item{font-family:${MEDIUM};font-weight:500;letter-spacing:4px;color:var(--sch-item-gray);line-height:1.2;white-space:nowrap;}
.cp-sch-whu .wh-layer{pointer-events:none;}
.cp-sch-whu .wh-layer>*{pointer-events:auto;}
.cp-sch-whu .wh-en.is-current{color:var(--sch-green);}
.cp-sch-whu .wh-num.is-current,.cp-sch-whu .wh-num.is-current .wh-arrow,.cp-sch-whu .wh-item.is-current{font-family:${HEAVY};font-weight:900;color:var(--sch-green);}
.cp-sch-whu .wh-vline{position:absolute;width:2.5px;background:var(--sch-green-line);}
.cp-sch-whu .wh-dot{position:absolute;box-sizing:border-box;width:14.25px;height:14.25px;border-radius:50%;background:var(--sch-white);border:2.5px solid var(--sch-green-line);}
@keyframes wh-rise{from{opacity:0;transform:translateY(var(--wh-rise,0px));}to{opacity:1;transform:none;}}
.cp-sch-whu.is-cued .wh-cue{animation:wh-rise var(--wh-dur) cubic-bezier(0,0,.2,1) var(--wh-delay) both;}
@media (prefers-reduced-motion: reduce){.cp-sch-whu.is-cued .wh-cue{animation:none;}}
`;

// 封面三种版式的文字框(模板第 54 / 55 / 56 页)
const COVER = {
  default: { title: [105.14, 301.28, 1100.62, 252], titleSize: 220, titleSpacing: 0, quote: [113.78, 555.61, 788.89, 57.6], event: [113.78, 675.95, 527.55, 81.44] },
  long_title: { title: [105.14, 292, 1100, 299.84], titleSize: 128, titleSpacing: 4, quote: [113.78, 603.84, 788.89, 57.6], event: [113.78, 705.44, 527.55, 81.44] },
  keyword: { title: [105.14, 301.28, 1100.62, 252], titleSize: 220, titleSpacing: 0, quote: [113.78, 555.61, 1080, 80], event: [113.78, 675.61, 527.55, 81.44] },
};

// 目录:第一行顶边、行距、行高、字号(条目 / 序号、英文小字)、英文框相对行顶的偏移与高度(模板各版「目录序号0N」「目录英文0N」)
const TOC = {
  2: { top: 449.2, pitch: 124, h: 89.28, size: 48, arrow: 36, en: 24, enDy: 7.2, enH: 74.88 },
  3: { top: 449.2, pitch: 116, h: 89.28, size: 48, arrow: 36, en: 24, enDy: 7.2, enH: 74.88 },
  4: { top: 449.28, pitch: 106.56, h: 89.28, size: 48, arrow: 36, en: 24, enDy: 7.2, enH: 74.88 },
  5: { top: 449.2, pitch: 95, h: 89.28, size: 48, arrow: 36, en: 24, enDy: 7.2, enH: 74.88 },
  6: { top: 438, pitch: 83, h: 80, size: 42, arrow: 42, en: 21, enDy: 6, enH: 68 },
};

const clean = value => String(value ?? '').trim();
// 关键词版引言放完整题目。单行最多约 13 字(56px 时约 750px):再长一行会伸到右侧老图书馆的屋顶上(视频末帧
// 屋顶从舞台 x≈1000 起),所以超过 13 字就拆成两行,每行宽度也不超过原版引言框宽 788.89。
const KEYWORD_QUOTE_CAP = 13;
const KEYWORD_QUOTE_W = 788.89;
// 两行时引言框加高、活动名称胶囊整体下移(导出时经 coverBoxes 把原生页上这两个形状挪到同样的位置);两行字号上限 48
const KEYWORD_QUOTE_2 = [113.78, 555.61, 788.89, 120];
const KEYWORD_EVENT_2 = [113.78, 715.61, 527.55, 81.44];
const KEYWORD_QUOTE_2_SIZE = 48;
// 目录英文小标折行宽度(模板「目录英文0N」框宽 221.28,右对齐)
const EN_W = 200;  // 留余量:PowerPoint 里这款黑体的大写字母比网页估算宽

// 拆两行时不在这些常见词中间断开(论文题目里最常见的双字词;只是兜底的打分项,不求完整)
const KEEP_WORDS = new Set(('管理 会计 企业 经营 应用 研究 数字 经济 背景 制造 工具 优化 对策 问题 现状 融合 视角 视域 分析 系统 设计 实现 方法 技术 '
  + '模型 数据 发展 影响 机制 策略 城市 环境 网络 智能 评价 基于 财务 成本 控制 绩效 预算 风险 价值 战略 创新 教育 教学 学生 高校 社会 文化 '
  + '政策 产业 金融 市场 资源 信息 平台 服务 质量 效率 路径 演变 驱动 导航 组合 信号 算法 检测 识别 结构 材料 性能 生态 治理 乡村 振兴 体系 '
  + '建设 改革 实践 理论 综述 探讨 探究 中国 我国 时空 特征 效应 构建 提升 案例').split(' '));

/**
 * 关键词版引言(完整题目):≤ 13 字一行;更长拆成两行——题目里写了换行就照写的拆,否则在中点附近找断点:
 * 标点后、「的 / 之 / 下 / 中」后、「与 / 和 / 及 / 在 / 对」前优先,不拆开常见双字词和连续的字母数字。
 */
function keywordQuote(p) {
  const raw = String(p?.title ?? '').trim();
  const full = raw.replace(/\n/g, '');
  if (charCount(full) <= KEYWORD_QUOTE_CAP) return full;
  if (raw.includes('\n')) return splitTitle(raw, KEYWORD_QUOTE_CAP);
  const chars = Array.from(full);
  const width = list => charCount(list.join(''));
  const total = width(chars);
  let best = null;
  for (let at = 1; at < chars.length; at += 1) {
    const off = Math.abs(width(chars.slice(0, at)) - total / 2);
    if (off > Math.max(2, total * 0.2)) continue;
    const a = chars[at - 1];
    const b = chars[at];
    let score = off;
    if ('，,、：:；;'.includes(a)) score -= 3;
    if ('的之下中'.includes(a)) score -= 1.5;
    if ('与和及暨并在对'.includes(b)) score -= 1.5;
    if (KEEP_WORDS.has(a + b)) score += 4;
    if (/[A-Za-z0-9]/.test(a) && /[A-Za-z0-9]/.test(b)) score += 6;
    if (/[，,、：:；;。）)」』]/.test(b)) score += 6;  // 标点不放到第二行开头
    if (!best || score < best.score) best = { at, score };
  }
  if (!best) return splitTitle(full, Math.ceil(total / 2) + 1);
  return `${chars.slice(0, best.at).join('').trim()}\n${chars.slice(best.at).join('').trim()}`;
}

function coverTexts(school, p, variant) {
  const quote = clean(p.subtitle) || clean(p.motto) || school.defaults.motto;
  if (variant === 'keyword') {
    // 完整题目放引言:超过一行约 18 字(字段表「约容纳」)时拆成两行,左半幅放得下,不压到右边的老图书馆和樱花
    return { title: coverKeyword(school, p), quote: keywordQuote(p) };
  }
  if (variant === 'long_title') return { title: splitTitle(p.title, school.titleCaps.long_title), quote };
  return { title: String(p.title ?? '').replace(/\n/g, ''), quote };
}

function coverFoot(school, p) {
  const parts = [school.nameEn];
  if (clean(p.presenter)) parts.push(`${clean(p.presenterLabel) || '汇报人'}：${clean(p.presenter)}`);
  if (clean(p.advisor)) parts.push(`${clean(p.advisorLabel) || '指导教师'}：${clean(p.advisor)}`);
  if (clean(p.date)) parts.push(clean(p.date));
  return parts.join(SEP);
}

/** 封面文字出场跟着视频播放进度走:播放时按 currentTime 排动画,播完 / 没播放时是最终状态。 */
function useVideoCues(ref) {
  React.useEffect(() => {
    const stage = ref.current?.closest('.cp-sch');
    const video = stage?.querySelector('video');
    if (!stage || !video) return undefined;
    const cue = () => {
      const scale = Number.isFinite(video.duration) && video.duration > 0 ? video.duration / SOURCE_DURATION : 1;
      stage.style.setProperty('--wh-scale', String(scale));
      stage.style.setProperty('--wh-now', `${video.currentTime || 0}s`);
      stage.classList.remove('is-cued');
      void stage.offsetWidth;  // 重新开始动画
      stage.classList.add('is-cued');
    };
    const done = () => stage.classList.remove('is-cued');
    video.addEventListener('play', cue);
    video.addEventListener('ended', done);
    if (!video.paused && !video.ended) cue();
    return () => {
      video.removeEventListener('play', cue);
      video.removeEventListener('ended', done);
      stage.classList.remove('is-cued');
    };
  }, [ref]);
}

const cueStyle = ([at, dur], rise) => ({
  '--wh-delay': `calc(${at}s * var(--wh-scale, 1) - var(--wh-now, 0s))`,
  '--wh-dur': `${dur}s`,
  '--wh-rise': `${rise}px`,
});

function Cover({ school, props: p, variant }) {
  useSchoolStyle(school, 'campus-school-whu-style', CSS);
  const cueRef = React.useRef(null);
  useVideoCues(cueRef);
  const cfg = COVER[variant] || COVER.default;
  const long = variant === 'long_title';
  const { title, quote } = coverTexts(school, p, variant);
  const titleSize = fitText(title, { size: cfg.titleSize, width: cfg.title[2], spacing: cfg.titleSpacing });
  const keyword = variant === 'keyword';
  // 关键词版引言:一行时按原版引言框宽缩字;两行时框加高到 120、字号上限 48(原生页按行内字号同比缩排,两边一致)
  const quote2 = keyword && quote.includes('\n');
  const quoteRect = quote2 ? KEYWORD_QUOTE_2 : cfg.quote;
  const eventRect = quote2 ? KEYWORD_EVENT_2 : cfg.event;
  const quoteSize = keyword
    ? (quote2
      ? fitText(quote, { size: KEYWORD_QUOTE_2_SIZE, width: KEYWORD_QUOTE_W, spacing: 2 })
      : fitText(quote, { size: 56, width: KEYWORD_QUOTE_W, spacing: 2 }))
    : fitText(quote, { size: 56, width: cfg.quote[2], spacing: 6 });
  const event = clean(p.kicker);
  const foot = coverFoot(school, p);
  return (
    <SchoolStage school={school} page="cover">
      <SchoolImage school={school} file="bg-image54.jpg" rect={[0, 0, 1920, 1080]} />
      <SchoolVideo school={school} file={COVER_VIDEO} poster="video-media5-poster.jpg" rect={[0.5, 0, 1919, 1080]} loop={school.coverVideoLoop !== false} />
      <span ref={cueRef} hidden />
      <div className="cp-sch-abs wh-layer wh-cue" style={{ ...box([0, 0, 1920, 1080]), ...cueStyle(CUES.title, 32.4) }}>
        {long
          ? <NativeText school="whu" field="主标题（在前景樱花之后）" rect={cfg.title} className="wh-title"
            style={{ fontSize: titleSize, letterSpacing: cfg.titleSpacing * (titleSize / cfg.titleSize), lineHeight: 1.09, marginTop: -6 }}>{title}</NativeText>
          : <NativeText school="whu" field="主标题（在前景樱花之后）" rect={cfg.title} anchor="middle" nowrap className="wh-title"
            style={{ fontSize: titleSize }}>{title}</NativeText>}
      </div>
      <div className="cp-sch-abs wh-layer wh-cue" style={{ ...box([0, 0, 1920, 1080]), ...cueStyle(CUES.quote, 21.6) }}>
        <NativeText school="whu" field="引言" rect={quoteRect} anchor="middle" className={keyword ? 'wh-quote' : 'wh-quote is-dist'}
          style={keyword ? { fontSize: quoteSize, letterSpacing: 2, fontWeight: 700, lineHeight: 1.2 } : { fontSize: quoteSize, letterSpacing: 6 * (quoteSize / 56) }}>{quote}</NativeText>
      </div>
      {event ? (
        <div className="cp-sch-abs wh-layer wh-cue" style={{ ...box([0, 0, 1920, 1080]), ...cueStyle(CUES.event, 21.6) }}>
          <div className="wh-event" style={box(eventRect)} aria-hidden="true" />
          <NativeText school="whu" field="活动名称" rect={eventRect} anchor="middle" className="wh-event-text"
            style={{ fontSize: fitText(event, { size: 40, width: eventRect[2] - 48, spacing: 4 }) }}>{event}</NativeText>
        </div>
      ) : null}
      <SchoolImage school={school} file="logo-image56.png" rect={[135.25, 121.41, 207.75, 65.33]} />
      <div className="cp-sch-abs wh-layer wh-cue" style={{ ...box([0, 0, 1920, 1080]), ...cueStyle(CUES.foot, 0) }}>
        <div className="wh-foot-veil" style={box([20, 952, 1040, 104])} aria-hidden="true" />
        <NativeText school="whu" field="目录页脚" rect={[108, 982.08, 864, 43.2]} anchor="middle" className="wh-foot"
          style={{ fontSize: fitText(foot, { size: 21, width: 864, spacing: 4 }) }}>{foot}</NativeText>
      </div>
    </SchoolStage>
  );
}

function TocNum({ index, no, current, size, arrow }) {
  const field = `toc.${index}.num`;
  // 「01  ›」:序号和 › 是两种字号 / 颜色,外层带字段名,导出取整段文字(两个空格保留)
  return (
    <div className={`cp-sch-text-inner wh-num${current ? ' is-current' : ''}`} style={{ fontSize: size }}
      data-native-field={field} data-editable-path={`school.whu.${field}`}>
      <span>{no}</span><span className="wh-arrow" style={{ fontSize: arrow }}>{'  ›'}</span>
    </div>
  );
}

function Toc({ school, props: p, items, count }) {
  useSchoolStyle(school, 'campus-school-whu-style', CSS);
  const cfg = TOC[count];
  const lastTop = cfg.top + (count - 1) * cfg.pitch;
  const lineTop = cfg.top + 7.2;
  const foot = `${school.nameEn}${SEP}${school.defaults.footerTag}`;
  return (
    <SchoolStage school={school} page="toc">
      <SchoolVideo school={school} file="video-media6.mp4" poster="video-media6-poster.jpg" rect={[0, 0, 1920, 1080]} />
      <div className="wh-veil" style={box([0, 0, 1415.75, 1080])} aria-hidden="true" />
      <SchoolImage school={school} file="logo-image56.png" rect={[111, 72, 192.32, 60.48]} />
      <NativeText school="whu" field="目录英文大标题" rect={[85.17, 211.37, 864, 193.87]} anchor="middle" className="wh-toc-title">{p.title}</NativeText>
      <div className="wh-hl" style={box([60.48, cfg.top, 864, cfg.h])} aria-hidden="true" />
      {items.map((item, i) => {
        const y = cfg.top + i * cfg.pitch;
        const current = i === 0;
        const title = String(item?.title ?? '');
        // 英文小标:模板框(221 宽、两行高)不会自动缩小,原文就是两行短语(ABOUT / WUHAN UNIV)。
        // 一行放不下时在词间折成两行(导出时是两段,和原生页一致),单词本身太长再缩字(导出侧按同一比例缩)
        const en = wrapWords(clean(item?.note), { size: cfg.en, width: EN_W, spacing: 3 });
        return (
          <React.Fragment key={i}>
            {en ? <NativeText school="whu" field={`toc.${i}.en`} rect={[127.2, y + cfg.enDy, 221.28, cfg.enH]} anchor="middle"
              className={`wh-en${current ? ' is-current' : ''}`} style={{ fontSize: fitText(en, { size: cfg.en, width: EN_W, spacing: 3 }) }}>{en}</NativeText> : null}
            <div className="cp-sch-abs cp-sch-box is-middle" style={box([411.84, y, 129.6, cfg.h])}>
              <TocNum index={i} no={item?.no || String(i + 1).padStart(2, '0')} current={current} size={cfg.size} arrow={cfg.arrow} />
            </div>
            <NativeText school="whu" field={`toc.${i}.title`} rect={[519.56, y, 374.4, cfg.h]} anchor="middle"
              className={`wh-item${current ? ' is-current' : ''}`} style={{ fontSize: fitText(title, { size: cfg.size, width: 374, spacing: 4 }) }}>{title}</NativeText>
          </React.Fragment>
        );
      })}
      <NativeText school="whu" field="目录页脚" rect={[108, 982.08, 864, 43.2]} anchor="middle" className="wh-foot">{foot}</NativeText>
      <div className="wh-vline" style={{ left: 377.28 - 1.25, top: lineTop, height: lastTop + cfg.h + 10 - lineTop }} aria-hidden="true" />
      <div className="wh-dot" style={{ left: 377.28 - 7.125, top: cfg.top + cfg.h / 2 - 7.125 }} aria-hidden="true" />
      <NativeText school="whu" field="目录英文大标题#2" rect={[431.83, 339.3, 421.5, 58.16]} anchor="middle" className="wh-toc-en">{p.subtitle}</NativeText>
    </SchoolStage>
  );
}

export default {
  Cover,
  Toc,
  // 活动名称为空时不画胶囊,导出时清空模板里的活动名称框
  coverClear: props => (clean(props?.kicker) ? [] : ['活动名称']),
  // 关键词版题目拆成两行时引言框加高、活动名称胶囊下移,原生页上同名形状挪到同样的位置
  coverBoxes: (props, variant) => (variant === 'keyword' && keywordQuote(props).includes('\n')
    ? { 引言: KEYWORD_QUOTE_2, 活动名称: KEYWORD_EVENT_2 }
    : {}),
  // 条目没有英文小标时清空模板里的英文框
  tocClear: (props, count) => (Array.isArray(props?.items) ? props.items.slice(0, count) : [])
    .map((item, i) => (clean(item?.note) ? null : `toc.${i}.en`)).filter(Boolean),
};
