// 单篇论文介绍:一篇重点文献讲透。左侧论文首页缩略图(带放大镜角标),右侧论文题目、作者、成段摘要、
// 一行 2–4 个信息标签(发表时间 / 期刊 / 分区 / 引用数等,每个是「标签名 + 值」)、浅底「影响因子」大数字块。
// 变体「要点」:缩略图移到右侧,左侧是题目 + 简介 + 2–3 条 01 / 02 / 03 编号精读要点。
// 视觉:白底直接落在页面上,细线框 + 浅灰 / 浅校色平涂底,小圆角,不用投影、渐变条、星标。
// 缩略图:写了 props.images(论文首页截图)就放图;没写就画一张论文首页(题目 / 期刊 / 年份 / 作者跟随字段,
// 正文是不含文字的灰条,导出时整张 SVG 转成图片,上面的题目等仍是文字)。
import React from 'react';
import { useThemeStyle, enterDelay } from '../../../shared/style.jsx';
import { MediaSlot } from '../../../shared/MediaSlot.jsx';
import { safeArray, safeNumber, clamp } from '../../../chart-safety.mjs';
import { CampusFrame, TitleRow, CHAPTER_CONTROL, TITLE_ROW_SPACE, DECK_LEVEL_TEXT, textWidthEm, useCampusLayout } from '../kit/chrome.jsx';
import { NarrIcon, parseEmphasis, plainText, useNarrativeStyle } from '../kit/narrative.jsx';

/** 一段文字:**词** 显示为段内强调;普通文字也包进行内 span,导出 PPTX 时整段是一个文本框(不按行拆碎)。 */
function Para({ text, as: Tag = 'p', className = '', style, ...rest }) {
  return (
    <Tag className={className} style={style} {...rest}>
      {parseEmphasis(text).map((part, i) => (part.em
        ? <strong className="cp-g1-em" key={i}>{part.text}</strong>
        : <span key={i}>{part.text}</span>))}
    </Tag>
  );
}

const DEFAULTS = {
  chapterIndex: 1,
  introMode: 'abstract',
  mediaMode: 'auto',
  fieldCount: 3,
  pointCount: 3,
  showMetric: true,
  sectionNo: '1.3',
  title: '代表性文献精读',
  paperTitle: '基于时空图注意力网络的城市路网交通流多步预测方法',
  authors: '陈思远，刘佳宁，周文博，等',
  abstract: '针对城市路网交通流**时空依赖复杂、长时预测误差累积**的问题，提出一种融合动态邻接矩阵与多头时间注意力的图神经网络模型。模型按小时更新路段间的相关结构，并在解码阶段引入误差校正分支。在两个城市的真实检测器数据上，60 分钟预测的平均绝对误差较主流基线降低约 12%，且在早晚高峰时段更为稳定。',
  fields: [
    { label: '发表时间', value: '2024 年 6 月' },
    { label: '期刊名称', value: '示例交通工程学报' },
    { label: '论文分区', value: '中科院一区 · Top' },
    { label: '被引次数', value: '126 次' },
  ],
  metricValue: '6.8',
  metricLabel: '影响因子',
  metricNote: '期刊 2024 年 JCR 影响因子，位列交通运输领域前 10%',
  points: [
    { title: '研究问题与动机', body: '路网结构随时段变化，静态图难以刻画早晚高峰的传播关系。' },
    { title: '模型结构与关键设计', body: '动态邻接矩阵 + 多头时间注意力，解码端加误差校正分支。' },
    { title: '实验结论与可借鉴之处', body: '长时预测误差降低约 12%，校正分支思路可直接用于本研究。' },
  ],
};

const RATIO = 0.72;   // 论文首页宽高比(接近 A4)

const CSS = `
.cp-pin{flex:1;min-height:0;display:flex;align-items:center;gap:72px;padding:6px 8px 0 34px;}
.cp-pin.is-points{padding:6px 34px 0 8px;}
/* —— 缩略图:细线框白纸,放大镜角标压在左边框上 —— */
.cp-pin-thumb{position:relative;flex:none;}
/* 线框与底色画在 ::before 上(导出为原生圆角矩形;容器自己不带底色边框,里面的 SVG 按矢量高清栅格化,文字仍是文本) */
.cp-pin-sheet{position:absolute;inset:0;isolation:isolate;overflow:hidden;border-radius:8px;}
.cp-pin-sheet::before{content:'';position:absolute;inset:0;z-index:-1;border-radius:inherit;background:var(--theme-surface);border:1.5px solid var(--theme-line);pointer-events:none;}
.cp-pin-sheet-art{position:absolute;inset:0;width:100%;height:100%;display:block;}
.cp-pin-art-bar{fill:var(--campus-neutral-soft);}
.cp-pin-art-bar.is-soft{fill:var(--campus-neutral-wash);}
.cp-pin-art-mark{fill:rgb(var(--theme-accent-rgb) / .07);}
.cp-pin-art-tick{fill:var(--theme-accent);}
.cp-pin-art-rule{fill:var(--theme-accent);}
.cp-pin-art-box{fill:var(--campus-paper);stroke:var(--theme-line);stroke-width:1;}
.cp-pin-art-curve{fill:none;stroke:var(--theme-accent);stroke-width:1.6;stroke-linejoin:round;stroke-linecap:round;}
.cp-pin-art-curve.is-b{stroke:var(--campus-neutral);stroke-dasharray:3 2.5;}
.cp-pin-sheet-head{position:absolute;display:flex;justify-content:space-between;align-items:baseline;gap:10px;}
.cp-pin-sheet-journal{min-width:0;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;font-weight:700;color:var(--theme-accent);letter-spacing:.04em;}
.cp-pin-sheet-year{flex:none;color:var(--theme-faint);font-variant-numeric:lining-nums;}
.cp-pin-sheet-titles{position:absolute;display:flex;flex-direction:column;align-items:center;text-align:center;}
.cp-pin-sheet-title{font-family:var(--theme-font-serif);font-weight:700;line-height:1.32;color:var(--theme-ink);text-wrap:balance;}
.cp-pin-sheet-authors{margin-top:.7em;color:var(--theme-muted);}
.cp-pin-photo{position:absolute;inset:0;}
.cp-pin-lens{position:absolute;left:-34px;width:68px;height:68px;display:grid;place-items:center;color:var(--theme-on-accent);isolation:isolate;}
.cp-pin-lens::before{content:'';position:absolute;inset:-7px;z-index:-1;border-radius:50%;background:var(--theme-bg);}
.cp-pin-lens-dot{position:absolute;inset:0;z-index:-1;border-radius:50%;background:var(--theme-accent);}
.cp-pin-lens svg{position:relative;}
.cp-pin-lens-ring{position:absolute;left:-46px;width:92px;height:92px;border-radius:50%;border:1.5px solid var(--campus-accent-line);}
.cp-pin.is-points .cp-pin-lens{left:auto;right:-34px;}
.cp-pin.is-points .cp-pin-lens-ring{left:auto;right:-46px;}
/* —— 右侧信息 —— */
.cp-pin-info{flex:1;min-width:0;display:flex;flex-direction:column;justify-content:center;}
.cp-pin-title{font-family:var(--theme-font-serif);font-weight:700;font-size:42px;line-height:1.3;letter-spacing:.02em;color:var(--theme-ink);text-wrap:balance;}
.cp-pin-title.is-md{font-size:38px;}
.cp-pin-title.is-sm{font-size:34px;}
.cp-pin-authors{margin-top:14px;font-size:21px;line-height:1.4;color:var(--theme-muted);}
.cp-pin-rule{flex:none;height:1.5px;margin:26px 0 24px;background:var(--theme-line);}
.cp-pin-rule::before{content:'';display:block;width:64px;height:100%;background:var(--theme-accent);}
.cp-pin-abstract{font-size:22px;line-height:1.75;color:var(--theme-ink);text-align:justify;text-wrap:pretty;}
.cp-pin-abstract.is-sm{font-size:21px;line-height:1.7;}
.cp-pin-abstract.is-xs{font-size:20px;line-height:1.65;}
.cp-pin-fields{flex:none;display:grid;gap:16px;margin-top:30px;}
.cp-pin-field{position:relative;isolation:isolate;min-width:0;display:flex;flex-direction:column;justify-content:center;gap:6px;padding:14px 20px;border-radius:8px;}
.cp-pin-field::before{content:'';position:absolute;inset:0;z-index:-1;border-radius:inherit;background:var(--campus-neutral-wash);border:1px solid var(--theme-line);pointer-events:none;}
.cp-pin-field-label{font-size:18px;line-height:1.3;color:var(--theme-faint);letter-spacing:.06em;}
.cp-pin-field-value{font-size:22px;line-height:1.35;font-weight:700;color:var(--theme-ink);}
.cp-pin-fields.is-tight .cp-pin-field-value{font-size:20px;}
.cp-pin-metric{position:relative;isolation:isolate;flex:none;display:flex;align-items:center;gap:28px;margin-top:18px;padding:18px 30px;border-radius:8px;}
.cp-pin-metric::before{content:'';position:absolute;inset:0;z-index:-1;border-radius:inherit;background:var(--campus-accent-wash);border:1px solid rgb(var(--theme-accent-rgb) / .14);pointer-events:none;}
.cp-pin-metric-value{flex:none;font-family:var(--theme-font-serif);font-weight:700;font-size:64px;line-height:1;color:var(--theme-accent);font-variant-numeric:lining-nums;letter-spacing:.01em;}
.cp-pin-metric-split{flex:none;align-self:stretch;width:1.5px;margin:4px 0;background:var(--campus-accent-line);}
.cp-pin-metric-text{min-width:0;display:flex;flex-direction:column;gap:6px;}
.cp-pin-metric-label{font-size:22px;line-height:1.3;font-weight:700;color:var(--theme-accent);letter-spacing:.06em;}
.cp-pin-metric-note{font-size:19px;line-height:1.5;color:var(--theme-muted);}
/* —— 要点变体:编号 + 标题 + 一行说明,条目之间细线分隔 —— */
.cp-pin-points{flex:none;display:flex;flex-direction:column;margin-top:26px;}
.cp-pin-point{display:flex;align-items:flex-start;gap:26px;padding:22px 0;border-top:1px solid var(--theme-line);}
.cp-pin-point:last-child{border-bottom:1px solid var(--theme-line);}
.cp-pin-point-no{flex:none;width:64px;font-family:var(--theme-font-serif);font-weight:700;font-size:46px;line-height:1;color:var(--theme-accent);font-variant-numeric:lining-nums;}
.cp-pin-point-text{min-width:0;display:flex;flex-direction:column;gap:8px;padding-top:2px;}
.cp-pin-point-title{font-size:24px;line-height:1.3;font-weight:700;color:var(--theme-ink);}
.cp-pin-point-body{font-size:20px;line-height:1.6;color:var(--theme-muted);}
.cp-pin.is-points .cp-pin-abstract{margin-top:22px;}
.campus[data-campus-nav="rail"] .cp-pin{gap:56px;}
`;

/** 论文首页里的灰条、高亮、小图(纯装饰,不含文字)。坐标按缩略图实际像素给出,导出时整张转成图片。 */
function SheetArt({ w, h, textBottom }) {
  const px = v => Math.round(v * 10) / 10;
  const mx = w * 0.08;
  const inner = w - mx * 2;
  const bar = Math.max(3, h * 0.0085);
  const step = h * 0.0205;
  const out = [];
  // 页眉下的校色细线
  out.push(<rect className="cp-pin-art-rule" x={px(mx)} y={px(h * 0.062)} width={px(inner)} height={px(Math.max(1.4, h * 0.0028))} key="rule" />);
  // 单位行:两条居中短灰条
  const affTop = textBottom + h * 0.018;
  [0.62, 0.44].forEach((k, i) => out.push(<rect className="cp-pin-art-bar is-soft" x={px((w - inner * k) / 2)} y={px(affTop + i * step)} width={px(inner * k)} height={px(bar)} rx={px(bar / 2)} key={`aff${i}`} />));
  // 摘要段:浅校色高亮底 + 左侧校色竖标(精读标记)+ 6 行灰条
  const absTop = affTop + step * 2 + h * 0.02;
  const absRows = 6;
  out.push(<rect className="cp-pin-art-mark" x={px(mx - w * 0.025)} y={px(absTop - step * 0.55)} width={px(inner + w * 0.05)} height={px(step * (absRows + 0.4))} rx={px(w * 0.012)} key="mark" />);
  out.push(<rect className="cp-pin-art-tick" x={px(mx - w * 0.025)} y={px(absTop - step * 0.55)} width={px(Math.max(2.4, w * 0.009))} height={px(step * (absRows + 0.4))} key="tick" />);
  const absLens = [1, 0.97, 1, 0.94, 0.99, 0.58];
  absLens.forEach((k, i) => out.push(<rect className="cp-pin-art-bar" x={px(mx)} y={px(absTop + i * step)} width={px(inner * k)} height={px(bar)} rx={px(bar / 2)} key={`abs${i}`} />));
  // 正文两栏:右栏上部一张小图(两条曲线)
  const bodyTop = absTop + step * (absRows + 1.3);
  const colGap = w * 0.05;
  const colW = (inner - colGap) / 2;
  const bottom = h * 0.95;
  const rows = Math.max(0, Math.floor((bottom - bodyTop) / step));
  const leftLens = [1, 0.96, 1, 0.92, 1, 0.98, 0.7, 0, 1, 0.95, 1, 0.97, 0.88, 1, 0.93, 1, 0.99, 0.6, 0, 1, 0.97, 1, 0.9];
  for (let i = 0; i < rows; i += 1) {
    const k = leftLens[i % leftLens.length];
    if (k > 0) out.push(<rect className="cp-pin-art-bar" x={px(mx)} y={px(bodyTop + i * step)} width={px(colW * k)} height={px(bar)} rx={px(bar / 2)} key={`l${i}`} />);
  }
  const figH = Math.min(step * 9, Math.max(0, bottom - bodyTop - step * 2));
  const fx = mx + colW + colGap;
  if (figH > step * 3) {
    out.push(<rect className="cp-pin-art-box" x={px(fx)} y={px(bodyTop - bar / 2)} width={px(colW)} height={px(figH)} rx={px(w * 0.008)} key="fig" />);
    const cx0 = fx + colW * 0.1;
    const cw = colW * 0.8;
    const cy0 = bodyTop + figH * 0.18;
    const ch = figH * 0.64;
    const curveA = [0.92, 0.6, 0.42, 0.34, 0.27, 0.24, 0.2, 0.19, 0.16];
    const curveB = [0.92, 0.74, 0.58, 0.5, 0.45, 0.41, 0.39, 0.37, 0.36];
    const pts = arr => arr.map((v, i) => `${px(cx0 + cw * (i / (arr.length - 1)))},${px(cy0 + ch * v)}`).join(' ');
    out.push(<polyline className="cp-pin-art-curve is-b" points={pts(curveB)} key="cb" />);
    out.push(<polyline className="cp-pin-art-curve" points={pts(curveA)} key="ca" />);
  }
  const rightStart = figH > step * 3 ? bodyTop + figH + step * 0.9 : bodyTop;
  const rightRows = Math.max(0, Math.floor((bottom - rightStart) / step));
  const rightLens = [0.6, 0, 1, 0.94, 1, 0.97, 1, 0.9, 1, 0.98, 0.75, 0, 1, 0.96];
  for (let i = 0; i < rightRows; i += 1) {
    const k = rightLens[i % rightLens.length];
    if (k > 0) out.push(<rect className="cp-pin-art-bar" x={px(fx)} y={px(rightStart + i * step)} width={px(colW * k)} height={px(bar)} rx={px(bar / 2)} key={`r${i}`} />);
  }
  return (
    <svg className="cp-pin-sheet-art" width={px(w)} height={px(h)} viewBox={`0 0 ${px(w)} ${px(h)}`} aria-hidden="true">{out}</svg>
  );
}

/** 从信息标签里认出期刊名与年份,给手绘首页的页眉用;认不出时取前两个标签的值。 */
function sheetHeader(fields) {
  const find = re => fields.find(field => re.test(String(field?.label ?? '')))?.value;
  const journal = find(/期刊|会议|来源|出处|刊物|venue|journal/i) ?? fields[1]?.value ?? fields[0]?.value ?? '';
  const year = find(/时间|年份|日期|年|date|year/i) ?? '';
  return { journal: String(journal ?? ''), year: String(year ?? '') };
}

function Thumb({ w, h, p, fields, useImage, lensTop, delay }) {
  const head = sheetHeader(fields);
  const titleSize = clamp(w * (plainText(p.paperTitle).length > 30 ? 0.04 : 0.046), 13, 26);
  const smallSize = clamp(w * 0.03, 11, 17);
  // 题目块的底部(估算):用来接着往下排单位行与摘要灰条
  const perLine = Math.max(4, Math.floor((w * 0.82) / titleSize));
  const titleLines = clamp(Math.ceil(textWidthEm(plainText(p.paperTitle)) / perLine), 1, 4);
  const textBottom = h * 0.098 + titleLines * titleSize * 1.32 + smallSize * 0.7 + smallSize * 1.4;
  return (
    <div className="cp-pin-thumb campus-rise" style={{ width: w, height: h, ...enterDelay(delay) }}>
      <div className="cp-pin-sheet">
        {useImage ? (
          <div className="cp-pin-photo"><MediaSlot id="paper-intro-0" fit="cover" radius={6} placeholder="论文首页" /></div>
        ) : (
          <>
            <SheetArt w={w} h={h} textBottom={textBottom} />
            <div className="cp-pin-sheet-head" style={{ left: w * 0.08, right: w * 0.08, top: h * 0.026, fontSize: smallSize }}>
              <div className="cp-pin-sheet-journal" {...DECK_LEVEL_TEXT}>{head.journal}</div>
              {head.year ? <div className="cp-pin-sheet-year" {...DECK_LEVEL_TEXT}>{head.year}</div> : null}
            </div>
            <div className="cp-pin-sheet-titles" style={{ left: w * 0.09, right: w * 0.09, top: h * 0.098 }}>
              <Para text={plainText(p.paperTitle)} className="cp-pin-sheet-title" style={{ fontSize: titleSize }} {...DECK_LEVEL_TEXT} />
              {p.authors ? <div className="cp-pin-sheet-authors" style={{ fontSize: smallSize }} {...DECK_LEVEL_TEXT}>{p.authors}</div> : null}
            </div>
          </>
        )}
      </div>
      <div className="cp-pin-lens-ring" style={{ top: lensTop - 12 }} aria-hidden="true" />
      <div className="cp-pin-lens" style={{ top: lensTop }} aria-hidden="true"><div className="cp-pin-lens-dot" /><NarrIcon name="search" size={34} stroke={2.2} /></div>
    </div>
  );
}

export function PaperIntro(props) {
  useNarrativeStyle();
  useThemeStyle('campus-paper-intro-style', CSS);
  const p = { ...DEFAULTS, ...props };
  const { bodyH, bodyW } = useCampusLayout();
  const pointsMode = p.introMode === 'points';
  const fields = safeArray(p.fields).slice(0, clamp(Math.round(safeNumber(p.fieldCount, 3)), 2, 4));
  const points = safeArray(p.points).slice(0, clamp(Math.round(safeNumber(p.pointCount, 3)), 2, 3));
  const useImage = p.mediaMode === 'image' || (p.mediaMode === 'auto' && safeArray(p.images).some(item => (typeof item === 'string' ? item.trim() !== '' : Boolean(item?.src))));
  // 缩略图:高度取满绘图区(留一点上下余量),宽度按 A4 比例,最宽不超过正文区的 34%
  const H = bodyH - TITLE_ROW_SPACE;
  const thumbH0 = Math.round(H - 34);
  const thumbW = Math.round(Math.min(thumbH0 * RATIO, bodyW * (pointsMode ? 0.32 : 0.34)));
  const thumbH = Math.round(thumbW / RATIO);
  const titleLen = textWidthEm(plainText(p.paperTitle));
  const titleSize = titleLen > 40 ? ' is-sm' : titleLen > 26 ? ' is-md' : '';
  const absLen = plainText(p.abstract).length;
  const absSize = pointsMode
    ? (absLen > 90 ? ' is-xs' : ' is-sm')
    : (absLen > 170 ? ' is-xs' : absLen > 130 ? ' is-sm' : '');
  const thumb = <Thumb w={thumbW} h={thumbH} p={p} fields={fields} useImage={useImage} lensTop={Math.round(thumbH * 0.3)} delay={pointsMode ? 4 : 1} />;
  return (
    <CampusFrame chapterIndex={p.chapterIndex}>
      <TitleRow no={p.sectionNo} title={p.title} className="campus-rise" style={enterDelay(0)} />
      <div className={`cp-pin${pointsMode ? ' is-points' : ''}`}>
        {!pointsMode && thumb}
        <section className="cp-pin-info">
          <Para text={p.paperTitle} className={`cp-pin-title${titleSize} campus-rise`} style={enterDelay(pointsMode ? 1 : 2)} />
          {p.authors ? <div className="cp-pin-authors campus-rise" style={enterDelay(pointsMode ? 1 : 2)}>{p.authors}</div> : null}
          {!pointsMode && <div className="cp-pin-rule campus-draw" style={enterDelay(3)} aria-hidden="true" />}
          <Para text={p.abstract} className={`cp-pin-abstract${absSize} campus-rise`} style={enterDelay(pointsMode ? 2 : 3)} />
          {!pointsMode && (
            <div className={`cp-pin-fields${fields.length >= 4 ? ' is-tight' : ''}`} style={{ gridTemplateColumns: `repeat(${fields.length}, minmax(0,1fr))` }}>
              {fields.map((field, i) => (
                <div className="cp-pin-field campus-rise" style={enterDelay(4 + i)} key={i}>
                  <div className="cp-pin-field-label">{field?.label}</div>
                  <div className="cp-pin-field-value">{field?.value}</div>
                </div>
              ))}
            </div>
          )}
          {!pointsMode && p.showMetric && (
            <div className="cp-pin-metric campus-rise" style={enterDelay(8)}>
              <div className="cp-pin-metric-value">{p.metricValue}</div>
              <div className="cp-pin-metric-split" aria-hidden="true" />
              <div className="cp-pin-metric-text">
                <div className="cp-pin-metric-label">{p.metricLabel}</div>
                <Para text={p.metricNote} className="cp-pin-metric-note" />
              </div>
            </div>
          )}
          {pointsMode && (
            <div className="cp-pin-points">
              {points.map((point, i) => (
                <div className="cp-pin-point campus-rise" style={enterDelay(3 + i)} key={i}>
                  <div className="cp-pin-point-no">{String(i + 1).padStart(2, '0')}</div>
                  <div className="cp-pin-point-text">
                    <div className="cp-pin-point-title">{point?.title}</div>
                    <Para text={point?.body} className="cp-pin-point-body" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
        {pointsMode && thumb}
      </div>
    </CampusFrame>
  );
}

PaperIntro.META = {
  id: 'paper-intro',
  label: '单篇论文介绍 · 首页缩略图配摘要与影响因子',
  roles: ['case', 'context', 'observation'],
  defaults: DEFAULTS,
  copyBudgets: {
    paperTitle: 44,
    authors: 32,
    abstract: 190,
    'fields[].label': 6,
    'fields[].value': 12,
    metricValue: 6,
    metricLabel: 8,
    metricNote: 40,
    'points[].title': 14,
    'points[].body': 34,
  },
  controls: [
    { ...CHAPTER_CONTROL, default: 1 },
    { key: 'introMode', type: 'radio', label: '版式', default: 'abstract', options: [{ value: 'abstract', label: '摘要与指标' }, { value: 'points', label: '编号精读要点' }], description: '摘要与指标:左侧论文首页,右侧题目、作者、成段摘要、信息标签与影响因子块;编号精读要点:首页移到右侧,左侧是题目、简介和 2–3 条 01 / 02 / 03 要点(不显示信息标签与影响因子)。' },
    { key: 'mediaMode', type: 'radio', label: '论文首页', default: 'auto', options: [{ value: 'auto', label: '自动' }, { value: 'drawn', label: '绘制首页' }, { value: 'image', label: '首页截图' }], description: '自动(默认):goal 里写了 props.images(论文首页截图)就放截图,没写就画一张论文首页(题目、期刊、年份、作者跟随本页字段);在页面上上传截图前先切到「首页截图」。' },
    { key: 'images', type: 'images', label: '论文首页截图', description: '论文首页截图(竖版,按 A4 比例裁切显示)。「论文首页」为「自动」时,goal 里写了 props.images 就显示截图。' },
    { key: 'fieldCount', type: 'number', label: '信息标签数', default: 3, min: 2, max: 4, countArrays: ['fields'], description: '摘要下方一行信息标签的个数(发表时间 / 期刊名称 / 论文分区 / 被引次数等,每个是标签名 + 值);期刊、时间类标签的值同时显示在绘制的首页页眉上。' },
    { key: 'showMetric', type: 'toggle', label: '影响因子块', default: true, description: '信息标签下方的浅底大数字块(数值 + 名称 + 一行说明),常用来放影响因子、被引次数或核心指标。' },
    { key: 'pointCount', type: 'number', label: '精读要点数', default: 3, min: 2, max: 3, countArrays: ['points'], description: '「编号精读要点」版式里 01 / 02 / 03 要点的条数。' },
  ],
};
