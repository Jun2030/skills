// 矩阵热力图:3×3 到 8×8 的数值矩阵,单元格颜色深浅随数值变化(校色的不同透明度),格内显示数值,
// 左上角是斜线表头(行标题 / 列标题),下方一条色标;右侧 2–3 条解读,底部结论条。
// 两种用法:混淆矩阵(按矩阵最大值换算深浅,对角线描边强调)与相关系数矩阵(-1 ~ 1,正值校色、负值中性灰,对角线淡化)。
// 色块只是背景,行列标签、格内数值、色标刻度都是 HTML 文本。
import React from 'react';
import { useThemeStyle, enterDelay } from '../../../shared/style.jsx';
import { safeArray, safeNumber, safeRatio, safeMax, safeMin, clamp } from '../../../chart-safety.mjs';
import { CampusFrame, TitleRow, ConclusionBar, CHAPTER_CONTROL, useCampusLayout, TITLE_ROW_SPACE, CONCLUSION_SPACE } from '../kit/chrome.jsx';
import { LabelRow } from '../kit/parts.jsx';
import { useDataStyle, countOf, compactNumber, InsightItems } from '../kit/data.jsx';

const KEYS = ['v1', 'v2', 'v3', 'v4', 'v5', 'v6', 'v7', 'v8'];

const DEFAULTS = {
  chapterIndex: 4,
  size: 5,
  mode: 'confusion',
  decimals: 0,
  showInsights: true,
  insightCount: 3,
  showConclusion: true,
  sectionNo: '4.3',
  title: '试题知识点自动分类的混淆矩阵',
  matrixLabel: '混淆矩阵',
  matrixNote: '测试集 476 道题 · 示例数据',
  rowTitle: '真实类别',
  colTitle: '预测类别',
  labels: [
    { name: 'Java' },
    { name: '操作系统' },
    { name: '计算机网络' },
    { name: 'MySQL' },
    { name: 'HTML' },
    { name: '数据结构' },
    { name: 'Python' },
    { name: '软件工程' },
  ],
  rows: [
    { v1: 86, v2: 4, v3: 2, v4: 3, v5: 5, v6: 0, v7: 0, v8: 0 },
    { v1: 6, v2: 71, v3: 9, v4: 3, v5: 1, v6: 2, v7: 1, v8: 2 },
    { v1: 3, v2: 8, v3: 77, v4: 4, v5: 2, v6: 1, v7: 2, v8: 3 },
    { v1: 2, v2: 2, v3: 3, v4: 84, v5: 1, v6: 3, v7: 2, v8: 1 },
    { v1: 4, v2: 1, v3: 2, v4: 2, v5: 91, v6: 0, v7: 3, v8: 1 },
    { v1: 3, v2: 2, v3: 1, v4: 4, v5: 0, v6: 79, v7: 6, v8: 5 },
    { v1: 5, v2: 1, v3: 2, v4: 1, v5: 4, v6: 7, v7: 72, v8: 3 },
    { v1: 2, v2: 3, v3: 4, v4: 2, v5: 1, v6: 6, v7: 2, v8: 80 },
  ],
  insightsLabel: '矩阵解读',
  insights: [
    { value: '85.9%', title: '整体准确率', text: '对角线上的样本占全部 476 道题的比例。' },
    { value: '91%+', title: 'MySQL、HTML 最准', text: '题干里的 SQL 语句和标签名特征明显，很少被误判。' },
    { value: '9', title: '操作系统 → 计算机网络', text: '两类都涉及进程通信与协议，最容易混淆。' },
  ],
  conclusionLabel: '分类效果',
  conclusion: '五类知识点的召回率都在 78% 以上，误判主要集中在内容相近的操作系统与计算机网络之间。',
};

const CSS = `
.cp-g3-hm{flex:1;min-height:0;display:flex;gap:28px;}
.cp-g3-hm-card{flex:1 1 0;min-width:0;min-height:0;display:flex;flex-direction:column;padding:22px 26px 16px;}
.cp-g3-hm-top{flex:none;margin-bottom:14px;}
.cp-g3-hm-side{flex:0 0 480px;}
.campus[data-campus-nav="rail"] .cp-g3-hm-side{flex-basis:420px;}
.cp-g3-hm-stage{flex:1;min-height:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;}
.cp-g3-hm-grid{display:grid;gap:var(--cp-g3-hm-gap,6px);}
/* 斜线表头:行标题在左下、列标题在右上,中间一道斜线 */
.cp-g3-hm-corner{position:relative;min-width:0;border-radius:var(--campus-radius-sm);background:var(--campus-wash);overflow:hidden;}
.cp-g3-hm-corner > svg{position:absolute;inset:0;width:100%;height:100%;}
.cp-g3-hm-corner-col{position:absolute;right:10px;top:8px;font-size:var(--cp-g3-hm-axis,19px);line-height:1.15;font-weight:700;color:var(--theme-accent);text-align:right;}
.cp-g3-hm-corner-row{position:absolute;left:10px;bottom:8px;font-size:var(--cp-g3-hm-axis,19px);line-height:1.15;font-weight:700;color:var(--theme-muted);}
.cp-g3-hm-col{display:flex;align-items:flex-end;justify-content:center;min-width:0;padding:0 2px 8px;font-size:var(--cp-g3-hm-label,20px);line-height:1.2;font-weight:700;color:var(--theme-ink);text-align:center;text-wrap:balance;border-bottom:3px solid var(--campus-accent-line);}
.cp-g3-hm-row{display:flex;align-items:center;justify-content:flex-end;gap:10px;min-width:0;padding-right:12px;font-size:var(--cp-g3-hm-label,20px);line-height:1.2;font-weight:700;color:var(--theme-ink);text-align:right;border-right:3px solid var(--campus-accent-line);}
.cp-g3-hm-cell{position:relative;display:flex;align-items:center;justify-content:center;min-width:0;border-radius:var(--cp-g3-hm-r,10px);font-family:var(--theme-font-serif);font-weight:700;font-size:var(--cp-g3-hm-num,28px);line-height:1;color:var(--theme-ink);font-variant-numeric:lining-nums tabular-nums;white-space:nowrap;}
.cp-g3-hm-cell.is-dark{color:var(--theme-on-accent);}
.cp-g3-hm-cell.is-diag{box-shadow:0 0 0 2.5px var(--theme-surface),0 0 0 4.5px var(--campus-spark),0 8px 16px rgb(var(--theme-accent-rgb) / .22);}
.cp-g3-hm-cell.is-self{background:var(--campus-paper)!important;color:var(--theme-faint);box-shadow:inset 0 0 0 1.5px var(--theme-line);}
/* 色标 */
.cp-g3-hm-scale{flex:none;display:flex;align-items:center;gap:14px;}
.cp-g3-hm-scale-bar{position:relative;width:var(--cp-g3-hm-scale-w,420px);height:14px;border-radius:999px;box-shadow:inset 0 0 0 1px var(--theme-line);}
.cp-g3-hm-scale-tick{font-family:var(--theme-font-serif);font-weight:700;font-size:18px;line-height:1;color:var(--theme-muted);white-space:nowrap;font-variant-numeric:lining-nums;}
.cp-g3-hm-scale-mid{position:absolute;left:50%;top:-5px;bottom:-5px;width:2px;margin-left:-1px;border-radius:1px;background:var(--theme-surface);box-shadow:0 0 0 1px var(--theme-line);}
`;

export function HeatmapMatrix(props) {
  useDataStyle();
  useThemeStyle('campus-heatmap-matrix-style', CSS);
  const p = { ...DEFAULTS, ...props };
  const { bodyW, bodyH } = useCampusLayout();
  const n = countOf(p.size, 3, 8);
  const labels = safeArray(p.labels).slice(0, n);
  const rows = safeArray(p.rows).slice(0, n);
  const insights = safeArray(p.insights).slice(0, countOf(p.insightCount, 2, 3));
  const corr = p.mode === 'correlation';
  const decimals = countOf(p.decimals, 0, 3);
  const values = rows.map(row => KEYS.slice(0, n).map(k => safeNumber(row?.[k], 0)));
  const flat = values.flat();
  const top = corr ? Math.max(1, safeMax(flat.map(Math.abs), 1)) : Math.max(safeMax(flat, 1), 0) || 1;
  const low = corr ? -top : Math.min(0, safeMin(flat, 0));

  // 几何:按正文区尺寸算出方格边长(格子保持正方形),最密的 8×8 仍不小于 18px 字号
  const sideW = p.showInsights ? 480 + 28 : 0;
  const availW = bodyW - sideW - 52 - 20;
  const availH = bodyH - TITLE_ROW_SPACE - (p.showConclusion ? CONCLUSION_SPACE : 0) - 38 - 56 - 30 - 46;
  const labelW = n >= 7 ? 130 : 160;
  const headH = n >= 7 ? 64 : 72;
  const gap = n >= 7 ? 4 : 6;
  // 高度决定格高;格宽可以比格高宽(最多 1.8 倍),把卡片的横向空间用起来,列标签也不必折成三行
  const cellH = Math.floor(clamp(Math.min((availW - labelW - gap * n) / n, (availH - headH - gap * n) / n), 40, 132));
  const cellW = Math.floor(clamp((availW - labelW - gap * n) / n, cellH, cellH * 1.8));
  const cell = cellH;
  const num = n <= 4 ? 34 : n <= 5 ? 30 : n <= 6 ? 25 : 19;
  const vars = {
    '--cp-g3-hm-gap': `${gap}px`,
    '--cp-g3-hm-num': `${num}px`,
    '--cp-g3-hm-label': `${n >= 7 ? 18 : n >= 6 ? 19 : 20}px`,
    '--cp-g3-hm-axis': `${n >= 7 ? 18 : 19}px`,
    '--cp-g3-hm-r': `${n >= 7 ? 7 : 10}px`,
    '--cp-g3-hm-scale-w': `${Math.round(clamp(cellW * n * 0.6, 260, 560))}px`,
    gridTemplateColumns: `${labelW}px repeat(${n}, ${cellW}px)`,
    gridTemplateRows: `${headH}px repeat(${n}, ${cell}px)`,
  };

  const shade = v => {
    if (corr) {
      const t = clamp(safeRatio(Math.abs(v), top, 0), 0, 1);
      return v >= 0
        ? { bg: `rgb(var(--theme-accent-rgb) / ${(0.05 + t * 0.9).toFixed(3)})`, dark: t > 0.5 }
        : { bg: `rgb(var(--campus-g3-ink-rgb) / ${(0.04 + t * 0.62).toFixed(3)})`, dark: t > 0.62 };
    }
    const t = clamp(safeRatio(v - low, top - low, 0), 0, 1);
    return { bg: `rgb(var(--theme-accent-rgb) / ${(0.04 + t * 0.92).toFixed(3)})`, dark: t > 0.48 };
  };
  const scaleBg = corr
    ? 'linear-gradient(90deg,rgb(var(--campus-g3-ink-rgb) / .66) 0%,rgb(var(--campus-g3-ink-rgb) / .04) 50%,rgb(var(--theme-accent-rgb) / .05) 50%,rgb(var(--theme-accent-rgb) / .95) 100%)'
    : 'linear-gradient(90deg,rgb(var(--theme-accent-rgb) / .04) 0%,rgb(var(--theme-accent-rgb) / .96) 100%)';

  return (
    <CampusFrame chapterIndex={p.chapterIndex}>
      <TitleRow no={p.sectionNo} title={p.title} className="campus-rise" style={enterDelay(0)} />
      <div className="cp-g3-hm">
        <section className="cp-g3-hm-card campus-card campus-rise" style={enterDelay(1)}>
          <div className="cp-g3-hm-top"><LabelRow label={p.matrixLabel} note={p.matrixNote} /></div>
          <div className="cp-g3-hm-stage">
            <div className="cp-g3-hm-grid" style={vars}>
              <div className="cp-g3-hm-corner">
                <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
                  <line x1="0" y1="0" x2="100" y2="100" stroke="currentColor" strokeWidth="1.5" vectorEffect="non-scaling-stroke" style={{ color: 'var(--campus-accent-line)' }} />
                </svg>
                <div className="cp-g3-hm-corner-col">{p.colTitle}</div>
                <div className="cp-g3-hm-corner-row">{p.rowTitle}</div>
              </div>
              {labels.map((label, c) => <div className="cp-g3-hm-col" key={`c${c}`}>{label?.name}</div>)}
              {values.map((line, r) => (
                <React.Fragment key={r}>
                  <div className="cp-g3-hm-row">{labels[r]?.name}</div>
                  {line.map((v, c) => {
                    const diag = r === c;
                    const { bg, dark } = shade(v);
                    const cls = diag && corr ? ' is-self' : diag ? ' is-diag' : '';
                    return (
                      <div className={`cp-g3-hm-cell campus-fade${dark ? ' is-dark' : ''}${cls}`} style={{ background: bg, ...enterDelay(3 + Math.min(r + c, 8)) }} key={c}>
                        {compactNumber(v, decimals)}
                      </div>
                    );
                  })}
                </React.Fragment>
              ))}
            </div>
            <div className="cp-g3-hm-scale campus-fade" style={enterDelay(10)}>
              <div className="cp-g3-hm-scale-tick">{compactNumber(low, corr ? 1 : decimals)}</div>
              <div className="cp-g3-hm-scale-bar" style={{ background: scaleBg }} aria-hidden="true">
                {corr ? <div className="cp-g3-hm-scale-mid" /> : null}
              </div>
              <div className="cp-g3-hm-scale-tick">{compactNumber(top, corr ? 1 : decimals)}</div>
            </div>
          </div>
        </section>
        {p.showInsights && (
          <aside className="cp-g3-hm-side cp-g3-ins campus-card campus-rise" style={enterDelay(2)}>
            <LabelRow label={p.insightsLabel} />
            <InsightItems items={insights} delay={6} enter={enterDelay} boxed />
          </aside>
        )}
      </div>
      {p.showConclusion && <ConclusionBar label={p.conclusionLabel} text={p.conclusion} className="campus-rise" style={enterDelay(11)} />}
    </CampusFrame>
  );
}

const CELL_BOUND = { min: -1000000000, max: 1000000000, semantics: 'magnitude' };

HeatmapMatrix.META = {
  id: 'heatmap-matrix',
  label: '矩阵热力图 · 混淆 / 相关系数矩阵配解读',
  roles: ['relationship', 'comparison', 'result'],
  defaults: DEFAULTS,
  copyBudgets: {
    matrixLabel: 8, matrixNote: 16, rowTitle: 5, colTitle: 5, 'labels[].name': 6,
    insightsLabel: 6, 'insights[].value': 7, 'insights[].title': 11, 'insights[].text': 28, conclusion: 52,
  },
  numberBounds: Object.fromEntries(KEYS.map(k => [`rows[].${k}`, CELL_BOUND])),
  controls: [
    { ...CHAPTER_CONTROL, default: 4 },
    { key: 'size', type: 'number', label: '矩阵阶数', default: 5, min: 3, max: 8, countArrays: ['labels', 'rows'], description: '矩阵的行列数(3×3 到 8×8):labels 是行列共用的类别 / 变量名,rows 的第 i 行 v1–v8 是该行各列的数值。' },
    { key: 'mode', type: 'radio', label: '矩阵类型', default: 'confusion', options: [{ value: 'confusion', label: '混淆矩阵' }, { value: 'correlation', label: '相关系数' }], description: '混淆矩阵:行为真实类别、列为预测类别,深浅按矩阵最大值换算,对角线描边强调;相关系数:取值 -1 ~ 1,正值用校色、负值用中性灰,对角线(自身)淡化。' },
    { key: 'decimals', type: 'number', label: '小数位数', default: 0, min: 0, max: 3, description: '格内数值显示的小数位数(混淆矩阵的计数用 0,相关系数用 2)。' },
    { key: 'showInsights', type: 'toggle', label: '右侧解读', default: true, description: '右侧 2–3 条解读;关掉后矩阵居中、方格放大。' },
    { key: 'insightCount', type: 'number', label: '解读条数', default: 3, min: 2, max: 3, countArrays: ['insights'], description: '右侧解读的条数,value 是大号数字(可留空)。' },
    { key: 'showConclusion', type: 'toggle', label: '底部结论条', default: true, description: '页面底部的校色结论条。' },
  ],
};
