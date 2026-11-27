// 多图网格(带行列表头):1–12 张同类结果图排成矩阵,左侧行标签(方法 / 对象)、顶部列标签(条件 / 输出),
// 每格图左上角带子图号 (a)(b)…;可选每行末尾一句结论、顶部导语与共享图例(色块图例或色标),底部结论条。
// 图片张数与列数决定网格:4 张 2 列 = 2×2,6 张 3 列 = 2×3,9 张 3 列 = 3×3,8 张 4 列 = 2×4,最多 3 行。
// 图格按「图片比例」等比缩放,整块网格在正文区里居中,不裁切图片。
import React from 'react';
import { useThemeStyle, enterDelay } from '../../../shared/style.jsx';
import { MediaSlot } from '../../../shared/MediaSlot.jsx';
import { safeArray, safeNumber, clamp } from '../../../chart-safety.mjs';
import { CampusFrame, TitleRow, ConclusionBar, CHAPTER_CONTROL, useCampusLayout, TITLE_ROW_SPACE, CONCLUSION_SPACE } from '../kit/chrome.jsx';
import { LabelRow } from '../kit/parts.jsx';
import { ChartLegend } from '../kit/parts.jsx';
import { FigureTag, useEvidenceStyle } from '../kit/evidence.jsx';

const DEFAULTS = {
  chapterIndex: 4,
  figureCount: 9,
  colCount: 3,
  cellRatio: '4:3',
  showRowLabels: true,
  showColLabels: true,
  showTags: true,
  showCaptions: false,
  showRowNotes: false,
  showLead: true,
  legendMode: 'none',
  showConclusion: true,
  images: [],
  sectionNo: '4.3',
  title: 'DTU 数据集重建结果',
  leadLabel: '读图说明',
  lead: '三个模型依次给出输入图像、估计的深度图与重建点云，结果未经任何滤波后处理。',
  cornerLabel: '模型 / 输出',
  notesLabel: '观察',
  cols: [
    { label: '输入图像' },
    { label: '估计的深度图' },
    { label: '重建点云' },
    { label: '点云视角二' },
  ],
  rows: [
    { label: '建筑', note: '外立面平整，门窗边缘清晰。' },
    { label: '砖块', note: '砖缝纹理在深度图中可以分辨。' },
    { label: '雕塑', note: '曲面过渡连续，局部有少量空洞。' },
  ],
  figures: [
    { tag: '(a)', caption: '建筑 · 输入' },
    { tag: '(b)', caption: '建筑 · 深度图' },
    { tag: '(c)', caption: '建筑 · 点云' },
    { tag: '(d)', caption: '砖块 · 输入' },
    { tag: '(e)', caption: '砖块 · 深度图' },
    { tag: '(f)', caption: '砖块 · 点云' },
    { tag: '(g)', caption: '雕塑 · 输入' },
    { tag: '(h)', caption: '雕塑 · 深度图' },
    { tag: '(i)', caption: '雕塑 · 点云' },
    { tag: '(j)', caption: '补充视角一' },
    { tag: '(k)', caption: '补充视角二' },
    { tag: '(l)', caption: '补充视角三' },
  ],
  legendItems: [
    { name: '本文方法' },
    { name: '对照方法' },
    { name: '真值' },
  ],
  scaleLabel: '深度',
  scaleMin: '近',
  scaleMax: '远',
  conclusionLabel: '结果小结',
  conclusion: '未经滤波后处理，三个模型都能从多视点图像恢复出深度图，并重建出完整的点云。',
};

const LEGEND_TONES = ['var(--campus-fill-bar)', 'var(--campus-tone-4)', 'var(--campus-tone-3)', 'var(--campus-tone-5)'];
const RATIOS = { '4:3': 4 / 3, '1:1': 1, '16:9': 16 / 9, '3:4': 3 / 4 };

// 网格的固定尺寸(px):内边距、间距、行标签宽、列标签高、图注高、结论列的最小 / 最大宽度。
const PAD = 18;
const GAP = 12;
const ROW_HEAD = 132;
const COL_HEAD = 46;
const CAPTION = 32;
const NOTE_MIN = 300;
const TOP_H = 48;
const SIDE_W = 400;
const SIDE_GAP = 32;

const CSS = `
.cp-fm-top{flex:none;display:flex;align-items:center;gap:30px;margin:-6px 0 18px;min-height:36px;}
.cp-fm-lead{flex:1;min-width:0;font-size:23px;line-height:1.5;color:var(--theme-muted);}
.cp-fm-legend{flex:none;margin-left:auto;display:flex;align-items:center;gap:16px;padding:6px 18px 6px 8px;border-radius:999px;background:var(--theme-surface);box-shadow:0 0 0 1px var(--campus-card-edge),0 6px 16px rgb(var(--theme-accent-rgb) / .08);}
.cp-fm-legend .campus-chip{height:32px;font-size:18px;padding:0 14px;}
.cp-fm-scale{display:flex;align-items:center;gap:10px;}
.cp-fm-scale-end{font-size:19px;color:var(--theme-muted);white-space:nowrap;}
.cp-fm-scale-bar{width:180px;height:12px;border-radius:6px;background:linear-gradient(90deg,rgb(var(--theme-accent-rgb) / .08) 0%,rgb(var(--theme-accent-rgb) / .45) 45%,var(--theme-accent) 75%,var(--campus-accent-lo) 100%);box-shadow:0 0 0 1px var(--campus-card-edge);}
.cp-fm-stage{flex:1;min-height:0;container-type:size;display:flex;align-items:center;justify-content:center;}
.cp-fm-plate{display:grid;gap:${GAP}px;padding:${PAD}px;align-content:center;}
.cp-fm-plate.has-notes{width:100%;justify-content:center;}
.cp-fm-colband{grid-row:1;border-radius:var(--campus-radius-sm);background:var(--campus-fill-deep);box-shadow:0 8px 18px rgb(var(--theme-accent-rgb) / .2);}
.cp-fm-colhead{grid-row:1;position:relative;display:flex;align-items:center;justify-content:center;gap:10px;padding:0 10px;min-width:0;color:var(--theme-on-accent);font-size:21px;font-weight:700;letter-spacing:.06em;line-height:1.2;text-align:center;}
.cp-fm-colhead + .cp-fm-colhead::before{content:'';position:absolute;left:-${GAP / 2 + 0.5}px;top:12px;bottom:12px;width:1px;background:var(--campus-on-accent-line);}
.cp-fm-corner{grid-row:1;grid-column:1;display:flex;align-items:center;justify-content:center;gap:8px;padding:0 6px;font-size:18px;line-height:1.25;font-weight:600;color:var(--campus-accent-soft);text-align:center;letter-spacing:.04em;}
.cp-fm-notehead{grid-row:1;display:flex;align-items:center;gap:10px;padding:0 16px;border-radius:var(--campus-radius-sm);background:var(--campus-accent-tint);color:var(--theme-accent);font-size:20px;font-weight:700;letter-spacing:.1em;}
.cp-fm-rowhead{position:relative;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;padding:10px 12px 10px 20px;border-radius:var(--campus-radius-sm);background:var(--campus-wash);min-height:0;}
.cp-fm-rowhead-bar{position:absolute;left:0;top:10px;bottom:10px;width:6px;border-radius:3px;background:var(--campus-fill-bar);}
.cp-fm-rowhead-text{font-family:var(--theme-font-serif);font-weight:700;font-size:23px;line-height:1.3;color:var(--theme-accent);text-align:center;text-wrap:balance;}
.cp-fm-cell{min-width:0;min-height:0;display:flex;flex-direction:column;}
.cp-fm-img{position:relative;flex:1;min-height:0;}
.cp-fm-img .media-slot{border-radius:8px!important;}
.cp-fm-img .media-slot.is-filled{box-shadow:0 0 0 1px var(--theme-line);}
.cp-fm-img .media-slot:not(.is-filled) .media-slot-label{font-size:20px;letter-spacing:.08em;}
.cp-fm-cap{flex:none;height:${CAPTION}px;display:flex;align-items:flex-end;justify-content:center;font-size:18px;line-height:1.2;color:var(--theme-muted);white-space:nowrap;}
.cp-fm-note{display:flex;align-items:center;gap:14px;padding:10px 18px;border-radius:var(--campus-radius-sm);background:var(--campus-paper);border:1px dashed var(--campus-accent-line);min-width:0;}
.cp-fm-note .campus-mark{flex:none;}
.cp-fm-note-text{font-size:21px;line-height:1.5;color:var(--theme-ink);text-wrap:pretty;}
.cp-fm-group{display:flex;align-items:stretch;gap:${SIDE_GAP}px;}
.cp-fm-aside{flex:none;width:${SIDE_W}px;display:flex;flex-direction:column;gap:20px;padding:28px 30px;}
.cp-fm-aside-lead{font-size:23px;line-height:1.7;color:var(--theme-ink);text-wrap:pretty;}
.cp-fm-aside-rule{flex:none;display:flex;align-items:center;gap:6px;}
.cp-fm-aside-rule-thick{width:64px;height:5px;border-radius:3px;background:var(--campus-fill);}
.cp-fm-aside-rule-thin{flex:1;height:1.5px;background:var(--campus-fade-line);}
.cp-fm-aside-legend{margin-top:auto;display:flex;flex-direction:column;align-items:flex-start;gap:14px;}
.cp-fm-aside-legend .campus-legend{flex-direction:column;align-items:flex-start;gap:12px;}
.cp-fm-aside-legend .cp-fm-scale-bar{width:200px;}
.cp-fm-plate.is-dense .cp-fm-rowhead-text{font-size:21px;}
.cp-fm-plate.is-dense .cp-fm-colhead{font-size:19px;letter-spacing:.02em;line-height:1.1;}
.cp-fm-plate.is-dense .cp-fm-img .media-slot:not(.is-filled) .media-slot-hint{display:none;}
.cp-fm-plate.is-dense .cp-fm-note-text{font-size:20px;line-height:1.45;}
`;

/** 每格的尺寸表达式:按图片比例在正文区里等比放大,宽受列数限制、高受行数限制,取较小的一边。 */
function cellGeometry({ cols, rows, ratio, rowHead, colHead, notes, captions, side = false }) {
  const capH = captions ? CAPTION : 0;
  const fixedW = 2 * PAD + (rowHead ? ROW_HEAD + GAP : 0) + (notes ? NOTE_MIN + GAP : 0) + (cols - 1) * GAP + (side ? SIDE_W + SIDE_GAP : 0);
  const fixedH = 2 * PAD + (colHead ? COL_HEAD + GAP : 0) + (rows - 1) * GAP;
  const byWidth = `(100cqw - ${fixedW}px) / ${cols}`;
  if (!ratio) {
    return { w: `calc(${byWidth})`, h: `calc((100cqh - ${fixedH}px) / ${rows})` };
  }
  const byHeight = `((100cqh - ${fixedH}px) / ${rows} - ${capH}px) * ${ratio.toFixed(4)}`;
  const w = `min(calc(${byWidth}), calc(${byHeight}))`;
  return { w, h: `calc(${w} / ${ratio.toFixed(4)} + ${capH}px)` };
}

/** 同样的算法用正文区的数值估算网格宽度(px),用来决定导语和图例放在上方还是右侧。 */
function estimatePlateWidth({ cols, rows, ratio, rowHead, colHead, notes, captions, stageW, stageH }) {
  const capH = captions ? CAPTION : 0;
  const fixedW = 2 * PAD + (rowHead ? ROW_HEAD + GAP : 0) + (notes ? NOTE_MIN + GAP : 0) + (cols - 1) * GAP;
  const fixedH = 2 * PAD + (colHead ? COL_HEAD + GAP : 0) + (rows - 1) * GAP;
  const byWidth = (stageW - fixedW) / cols;
  const cw = ratio ? Math.min(byWidth, ((stageH - fixedH) / rows - capH) * ratio) : byWidth;
  return fixedW + cols * Math.max(0, cw);
}

export function FigureMatrix(props) {
  useThemeStyle('campus-figure-matrix-style', CSS);
  useEvidenceStyle();
  const p = { ...DEFAULTS, ...props };
  const count = clamp(Math.round(safeNumber(p.figureCount, 1)), 1, 12);
  // 列数:至少能把图片排进 3 行,也不多于图片张数
  const cols = clamp(Math.max(Math.round(safeNumber(p.colCount, 1)), Math.ceil(count / 3)), 1, Math.min(4, count));
  const rows = Math.ceil(count / cols);
  const figures = safeArray(p.figures);
  const colList = safeArray(p.cols);
  const rowList = safeArray(p.rows);
  const rowHead = p.showRowLabels !== false;
  const colHead = p.showColLabels !== false;
  const notes = Boolean(p.showRowNotes);
  const captions = Boolean(p.showCaptions);
  const ratio = RATIOS[p.cellRatio] || 0;
  const { bodyW, bodyH } = useCampusLayout();
  const hasLegend = p.legendMode === 'items' || p.legendMode === 'scale';
  const hasIntro = Boolean(p.showLead) || hasLegend;
  // 网格按比例缩放后左右留白足够时,导语与图例放到网格右侧的说明卡里(图片因此能再大一些);否则放在网格上方
  const stageH = safeNumber(bodyH, 886) - TITLE_ROW_SPACE - (p.showConclusion ? CONCLUSION_SPACE : 0) - TOP_H;
  const plateW = estimatePlateWidth({ cols, rows, ratio, rowHead, colHead, notes, captions, stageW: safeNumber(bodyW, 1760), stageH });
  const side = hasIntro && !notes && ratio > 0 && safeNumber(bodyW, 1760) - plateW >= SIDE_W + SIDE_GAP + 60;
  const { w, h } = cellGeometry({ cols, rows, ratio, rowHead, colHead, notes, captions, side });
  const colStart = rowHead ? 2 : 1;
  const rowStart = colHead ? 2 : 1;
  const template = {
    gridTemplateColumns: `${rowHead ? `${ROW_HEAD}px ` : ''}repeat(${cols}, ${w})${notes ? ` minmax(${NOTE_MIN}px, 1fr)` : ''}`,
    gridTemplateRows: `${colHead ? `${COL_HEAD}px ` : ''}repeat(${rows}, ${h})`,
  };
  const showTop = hasIntro && !side;
  const legendItems = safeArray(p.legendItems).slice(0, 4).map((item, i) => ({ name: item?.name, tone: LEGEND_TONES[i] }));
  const legend = p.legendMode === 'items'
    ? <ChartLegend items={legendItems} />
    : p.legendMode === 'scale' ? (
      <>
        <div className="campus-chip is-soft">{p.scaleLabel}</div>
        <div className="cp-fm-scale">
          <div className="cp-fm-scale-end">{p.scaleMin}</div>
          <div className="cp-fm-scale-bar" aria-hidden="true" />
          <div className="cp-fm-scale-end">{p.scaleMax}</div>
        </div>
      </>
    ) : null;
  const plate = (
    <div className={`cp-fm-plate campus-card campus-rise${notes ? ' has-notes' : ''}${rows * cols > 6 ? ' is-dense' : ''}`} style={{ ...template, ...enterDelay(2) }}>
      {colHead && (
        <>
          {rowHead && <div className="cp-fm-corner">{p.cornerLabel}</div>}
          <div className="cp-fm-colband" style={{ gridColumn: `${colStart} / span ${cols}` }} aria-hidden="true" />
          {Array.from({ length: cols }, (_, c) => (
            <div className="cp-fm-colhead" style={{ gridColumn: colStart + c }} key={`c${c}`}>{colList[c]?.label}</div>
          ))}
          {notes && <div className="cp-fm-notehead" style={{ gridColumn: colStart + cols }}><div className="campus-mark is-spark" aria-hidden="true" /><div>{p.notesLabel}</div></div>}
        </>
      )}
      {Array.from({ length: rows }, (_, r) => (
        <React.Fragment key={`r${r}`}>
          {rowHead && (
            <div className="cp-fm-rowhead" style={{ gridRow: rowStart + r, gridColumn: 1 }}>
              <div className="cp-fm-rowhead-bar" aria-hidden="true" />
              <div className="cp-fm-rowhead-text">{rowList[r]?.label}</div>
            </div>
          )}
          {notes && (
            <div className="cp-fm-note" style={{ gridRow: rowStart + r, gridColumn: colStart + cols }}>
              <div className="campus-mark" aria-hidden="true" />
              <p className="cp-fm-note-text">{rowList[r]?.note}</p>
            </div>
          )}
        </React.Fragment>
      ))}
      {Array.from({ length: count }, (_, i) => {
        const fig = figures[i];
        return (
          <figure className="cp-fm-cell campus-fade" style={{ margin: 0, gridRow: rowStart + Math.floor(i / cols), gridColumn: colStart + (i % cols), ...enterDelay(3 + i) }} key={`f${i}`}>
            <div className="cp-fm-img">
              <MediaSlot id={`figure-matrix-${i}`} fit="contain" radius={8} placeholder="结果图" />
              {p.showTags !== false && <FigureTag>{fig?.tag}</FigureTag>}
            </div>
            {captions && <figcaption className="cp-fm-cap">{fig?.caption}</figcaption>}
          </figure>
        );
      })}
    </div>
  );
  return (
    <CampusFrame chapterIndex={p.chapterIndex}>
      <TitleRow no={p.sectionNo} title={p.title} className="campus-rise" style={enterDelay(0)} />
      {showTop && (
        <div className="cp-fm-top campus-rise" style={enterDelay(1)}>
          {p.showLead ? <p className="cp-fm-lead">{p.lead}</p> : null}
          {legend && <div className="cp-fm-legend">{legend}</div>}
        </div>
      )}
      <div className="cp-fm-stage">
        {side ? (
          <div className="cp-fm-group">
            {plate}
            <aside className="cp-fm-aside campus-card campus-rise" style={enterDelay(3)}>
              <LabelRow label={p.leadLabel} />
              {p.showLead ? <p className="cp-fm-aside-lead">{p.lead}</p> : null}
              <div className="cp-fm-aside-rule" aria-hidden="true"><div className="cp-fm-aside-rule-thick" /><div className="cp-fm-aside-rule-thin" /></div>
              {legend && <div className="cp-fm-aside-legend">{legend}</div>}
            </aside>
          </div>
        ) : plate}
      </div>
      {p.showConclusion && <ConclusionBar label={p.conclusionLabel} text={p.conclusion} className="campus-rise" style={enterDelay(6)} />}
    </CampusFrame>
  );
}

FigureMatrix.META = {
  id: 'figure-matrix',
  label: '多图网格 · 行列表头配子图号',
  roles: ['result', 'comparison', 'image'],
  defaults: DEFAULTS,
  copyBudgets: {
    leadLabel: 6, lead: 44, cornerLabel: 6, notesLabel: 6, 'cols[].label': 8, 'rows[].label': 10, 'rows[].note': 30,
    'figures[].tag': 4, 'figures[].caption': 12, 'legendItems[].name': 6, scaleLabel: 6, scaleMin: 4, scaleMax: 4, conclusion: 44,
  },
  controls: [
    { ...CHAPTER_CONTROL, default: 4 },
    { key: 'figureCount', type: 'number', label: '图片数量', default: 9, min: 1, max: 12, countArrays: ['images'], description: '网格里的图片张数(子图号与图注 figures 按同样的张数显示)。与列数一起决定网格:4 张 2 列 = 2×2,6 张 3 列 = 2×3,9 张 3 列 = 3×3,8 张 4 列 = 2×4;最多 3 行,放不下时自动加列。' },
    { key: 'colCount', type: 'number', label: '列数', default: 3, min: 1, max: 4, countArrays: ['cols'], description: '每行几张图(顶部列标签 cols 按同样的列数显示);行数 = 图片张数 ÷ 列数,向上取整,行标签取 rows 的前几项。' },
    { key: 'cellRatio', type: 'radio', label: '图片比例', default: '4:3', options: [{ value: '4:3', label: '4:3' }, { value: '1:1', label: '1:1' }, { value: '16:9', label: '16:9' }, { value: '3:4', label: '3:4' }, { value: 'fill', label: '铺满' }], description: '图格按这个比例等比放大并整体居中,图片不裁切;「铺满」时图格占满正文区,图片在格内按原比例居中。' },
    { key: 'showRowLabels', type: 'toggle', label: '行标签', default: true, description: '左侧的行标签(方法 / 对象)。' },
    { key: 'showColLabels', type: 'toggle', label: '列标签', default: true, description: '顶部渐变表头里的列标签(条件 / 输出)。' },
    { key: 'showTags', type: 'toggle', label: '子图号', default: true, description: '每格左上角的子图号角标 (a)(b)…。' },
    { key: 'showCaptions', type: 'toggle', label: '图注', default: false, description: '每格图片下方的一行短图注。' },
    { key: 'showRowNotes', type: 'toggle', label: '行末结论', default: false, description: '每行末尾一句结论(如消融实验每一项的结论),写在 rows[].note。' },
    { key: 'showLead', type: 'toggle', label: '导语', default: true, description: '一句读图说明。网格按比例缩放后两侧留白足够时,导语和图例放进网格右侧的说明卡(标签 leadLabel);否则放在网格上方。' },
    { key: 'legendMode', type: 'radio', label: '共享图例', default: 'none', options: [{ value: 'none', label: '不显示' }, { value: 'items', label: '色块图例' }, { value: 'scale', label: '色标' }], description: '与导语放在一起的共享图例:色块图例列出 legendItems;色标画一条由浅到深的渐变条,两端写 scaleMin / scaleMax。' },
    { key: 'showConclusion', type: 'toggle', label: '底部结论条', default: true, description: '页面底部的校色结论条。' },
  ],
};
