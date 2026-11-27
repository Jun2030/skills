// 消融实验表:前几列是模块开关(表头是模块名,单元格是图形化的勾选标记),后几列是指标数值;
// 两层渐变表头(「模块配置 / 评价指标」分组 + 列名),「完整模型」行高亮,每列最优值自动加粗,指标表头标 ↑↓ 方向,
// 数值下方可带相对第一行(基线)的变化量;右侧 2–3 条「每个模块带来多少提升」的解读,底部结论条。
// 勾选标记是不含文字的图形,模块名、数值、变化量、解读都是 HTML 文本。
import React from 'react';
import { useThemeStyle, enterDelay } from '../../../shared/style.jsx';
import { safeArray, safeNumber, clamp } from '../../../chart-safety.mjs';
import { CampusFrame, TitleRow, ConclusionBar, CHAPTER_CONTROL } from '../kit/chrome.jsx';
import { LabelRow } from '../kit/parts.jsx';
import { DirArrow } from '../kit/evidence.jsx';
import { useDataStyle, countOf, formatNumber, compactNumber, bestRows, KeyBar, KeyStar, CheckDot, TableFoot, InsightItems } from '../kit/data.jsx';

const MODULE_KEYS = ['m1', 'm2', 'm3', 'm4', 'm5'];
const METRIC_KEYS = ['v1', 'v2', 'v3', 'v4'];

const DEFAULTS = {
  chapterIndex: 4,
  rowCount: 5,
  moduleCount: 4,
  metricCount: 4,
  fullRow: 5,
  showDelta: true,
  showGains: true,
  gainCount: 3,
  showFootnote: true,
  showConclusion: true,
  sectionNo: '4.4',
  title: '消融实验：各损失项的贡献',
  tableLabel: '消融结果',
  tableNote: 'DTU 验证集 · 示例数据',
  rowHead: '实验设置',
  moduleGroup: '模块配置',
  metricGroup: '评价指标',
  modules: [
    { name: '梯度项' },
    { name: 'SSIM' },
    { name: 'Smooth' },
    { name: 'top-K' },
    { name: '示例模块' },
  ],
  metrics: [
    { name: 'Acc.', better: 'low', decimals: 3 },
    { name: 'Comp.', better: 'low', decimals: 3 },
    { name: 'overall', better: 'low', decimals: 3 },
    { name: 'f-score', better: 'high', decimals: 2 },
  ],
  rows: [
    { name: '基线（仅像素光度损失）', m1: false, m2: false, m3: false, m4: false, m5: false, v1: 1.712, v2: 1.854, v3: 1.783, v4: 38.62 },
    { name: '+ 梯度项', m1: true, m2: false, m3: false, m4: false, m5: false, v1: 1.534, v2: 1.701, v3: 1.618, v4: 43.15 },
    { name: '+ 梯度项 + SSIM', m1: true, m2: true, m3: false, m4: false, m5: false, v1: 1.401, v2: 1.598, v3: 1.5, v4: 47.2 },
    { name: '+ 梯度项 + SSIM + Smooth', m1: true, m2: true, m3: true, m4: false, m5: false, v1: 1.322, v2: 1.553, v3: 1.438, v4: 49.36 },
    { name: '完整模型（本文）', m1: true, m2: true, m3: true, m4: true, m5: false, v1: 1.255, v2: 1.491, v3: 1.373, v4: 51.98 },
    { name: '完整模型去掉 SSIM', m1: true, m2: false, m3: true, m4: true, m5: false, v1: 1.36, v2: 1.58, v3: 1.47, v4: 47.85 },
    { name: '完整模型去掉 Smooth', m1: true, m2: true, m3: false, m4: true, m5: false, v1: 1.298, v2: 1.533, v3: 1.416, v4: 49.9 },
  ],
  gainsLabel: '模块贡献',
  gainsNote: 'overall 变化',
  gains: [
    { value: '−0.165', title: '梯度项', text: 'overall 由 1.783 降到 1.618，对光照变化更鲁棒。' },
    { value: '−0.118', title: 'SSIM', text: '相似纹理处约束更强，f-score 再提升 4.05。' },
    { value: '−0.127', title: 'Smooth + top-K', text: '边缘噪声被过滤，遮挡区域的完整性提高。' },
  ],
  footnote: '✓ 表示启用该模块；加粗为各列最优，↓ 越低越好、↑ 越高越好；小字为相对第一行的变化。',
  conclusionLabel: '消融结论',
  conclusion: '三项改进逐项叠加都带来稳定提升，梯度项贡献最大；完整模型在四项指标上全部最优。',
};

const CSS = `
.cp-g3-ab{flex:1;min-height:0;display:flex;gap:28px;}
.cp-g3-ab-card{flex:1 1 0;min-width:0;min-height:0;display:flex;flex-direction:column;padding:22px 26px 18px;}
.cp-g3-ab-top{flex:none;margin-bottom:18px;}
.cp-g3-ab-side{flex:0 0 500px;}
.campus[data-campus-nav="rail"] .cp-g3-ab-side{flex-basis:430px;}
.cp-g3-ab-table{flex:1;min-height:0;}
/* 两层表头:分组行 + 列名行,共用一块渐变底 */
.cp-g3-ab-head{flex:none;display:grid;grid-template-columns:var(--cp-g3-cols);grid-template-rows:auto auto;border-radius:var(--campus-radius-sm) var(--campus-radius-sm) 0 0;background:var(--campus-fill-deep);color:var(--theme-on-accent);box-shadow:0 8px 18px rgb(var(--theme-accent-rgb) / .18);}
.cp-g3-ab-group{display:flex;align-items:center;justify-content:center;gap:10px;min-width:0;margin:10px 10px 0;padding:0 8px 8px;border-bottom:1.5px solid var(--campus-on-accent-line);font-size:19px;line-height:1.2;font-weight:700;letter-spacing:.14em;color:var(--campus-on-accent-muted);}
.cp-g3-ab-group .campus-note-mark{flex:none;}
.cp-g3-ab-rowhead{grid-row:1 / span 2;display:flex;align-items:center;padding:0 18px 0 22px;font-size:21px;font-weight:700;letter-spacing:.04em;}
.cp-g3-ab-th{display:flex;align-items:center;justify-content:center;gap:6px;min-width:0;padding:10px 6px 12px;font-size:20px;line-height:1.2;font-weight:700;text-align:center;}
.cp-g3-ab-th.is-num{justify-content:flex-end;padding-right:18px;}
.cp-g3-ab-th .cp-ev-dir{color:var(--campus-spark);}
.cp-g3-ab-th.is-sep,.cp-g3-ab-cell.is-sep{box-shadow:inset 1.5px 0 0 var(--campus-on-accent-line);}
.cp-g3-ab-cell.is-sep{box-shadow:inset 1.5px 0 0 var(--campus-accent-line);}
.cp-g3-ab-body .cp-g3-tb-row{max-height:110px;}
.cp-g3-ab-name{display:flex;align-items:center;gap:10px;min-width:0;padding:6px 12px 6px 22px;font-size:21px;line-height:1.3;color:var(--theme-ink);}
.cp-g3-tb-row.is-key .cp-g3-ab-name{font-weight:700;color:var(--theme-accent);}
.cp-g3-ab-cell{display:flex;align-items:center;justify-content:center;min-width:0;}
.cp-g3-ab-cell.is-num{flex-direction:column;align-items:flex-end;justify-content:center;gap:6px;padding:4px 18px 4px 6px;}
.cp-g3-ab-delta{font-family:var(--theme-font-serif);font-weight:600;font-size:18px;line-height:1;color:var(--theme-faint);white-space:nowrap;font-variant-numeric:lining-nums tabular-nums;}
.cp-g3-ab-delta.is-good{color:var(--campus-accent-soft);}
.cp-g3-ab.is-dense .cp-g3-ab-name{font-size:20px;}
.cp-g3-ab.is-dense .cp-g3-num{font-size:22px;}
.cp-g3-ab-side .cp-g3-ins-value{font-size:34px;}
`;

export function AblationTable(props) {
  useDataStyle();
  useThemeStyle('campus-ablation-table-style', CSS);
  const p = { ...DEFAULTS, ...props };
  const rows = safeArray(p.rows).slice(0, countOf(p.rowCount, 3, 7));
  const modules = safeArray(p.modules).slice(0, countOf(p.moduleCount, 1, 5));
  const metrics = safeArray(p.metrics).slice(0, countOf(p.metricCount, 1, 4));
  const gains = safeArray(p.gains).slice(0, countOf(p.gainCount, 2, 3));
  const full = clamp(Math.round(safeNumber(p.fullRow, 0)), 0, rows.length) - 1;
  const mKeys = METRIC_KEYS.slice(0, metrics.length);
  const best = bestRows(rows, mKeys, metrics.map(m => m?.better));
  const nameFr = p.showGains ? 2 : 2.6;
  const cols = `minmax(0,${nameFr}fr) repeat(${modules.length}, minmax(0,.86fr)) repeat(${metrics.length}, minmax(0,1.18fr))`;
  const dense = rows.length > 5;
  const checkSize = dense ? 30 : 34;
  const base = rows[0];
  return (
    <CampusFrame chapterIndex={p.chapterIndex}>
      <TitleRow no={p.sectionNo} title={p.title} className="campus-rise" style={enterDelay(0)} />
      <div className={`cp-g3-ab${dense ? ' is-dense' : ''}`}>
        <section className="cp-g3-ab-card campus-card campus-rise" style={enterDelay(1)}>
          <div className="cp-g3-ab-top"><LabelRow label={p.tableLabel} note={p.tableNote} /></div>
          <div className="cp-g3-tb cp-g3-ab-table" style={{ '--cp-g3-cols': cols }}>
            <div className="cp-g3-ab-head">
              <div className="cp-g3-ab-rowhead">{p.rowHead}</div>
              <div className="cp-g3-ab-group" style={{ gridColumn: `2 / span ${modules.length}` }}>
                <div className="campus-note-mark" aria-hidden="true" />
                <div>{p.moduleGroup}</div>
              </div>
              <div className="cp-g3-ab-group" style={{ gridColumn: `${2 + modules.length} / span ${metrics.length}` }}>
                <div className="campus-note-mark" aria-hidden="true" />
                <div>{p.metricGroup}</div>
              </div>
              {modules.map((m, i) => <div className="cp-g3-ab-th" key={`m${i}`}>{m?.name}</div>)}
              {metrics.map((m, i) => (
                <div className={`cp-g3-ab-th is-num${i === 0 ? ' is-sep' : ''}`} key={`v${i}`}>
                  <div>{m?.name}</div>
                  <DirArrow dir={m?.better} size={16} />
                </div>
              ))}
            </div>
            <div className="cp-g3-tb-body cp-g3-ab-body">
              {rows.map((row, r) => (
                <div className={`cp-g3-tb-row campus-fade${r === full ? ' is-key' : ''}`} style={enterDelay(3 + r)} key={r}>
                  {r === full && <KeyBar />}
                  <div className="cp-g3-ab-name">
                    {r === full && <KeyStar />}
                    <div>{row?.name}</div>
                  </div>
                  {modules.map((_, c) => (
                    <div className="cp-g3-ab-cell" key={`m${c}`}><CheckDot on={row?.[MODULE_KEYS[c]] === true} size={checkSize} /></div>
                  ))}
                  {metrics.map((metric, c) => {
                    const key = mKeys[c];
                    const value = safeNumber(row?.[key], 0);
                    const diff = value - safeNumber(base?.[key], 0);
                    const good = metric?.better === 'low' ? diff < 0 : metric?.better === 'high' ? diff > 0 : false;
                    const sign = diff > 0 ? '+' : diff < 0 ? '−' : '±';
                    return (
                      <div className={`cp-g3-ab-cell is-num${c === 0 ? ' is-sep' : ''}`} key={`v${c}`}>
                        <div className={`cp-g3-num${best[c].has(r) ? ' is-best' : ''}`}>{compactNumber(value, metric?.decimals)}</div>
                        {p.showDelta && r > 0 ? (
                          <div className={`cp-g3-ab-delta${good ? ' is-good' : ''}`}>{`${sign}${compactNumber(Math.abs(diff), metric?.decimals)}`}</div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
          {p.showFootnote && <TableFoot text={p.footnote} className="campus-fade" style={enterDelay(10)} />}
        </section>
        {p.showGains && (
          <aside className="cp-g3-ab-side cp-g3-ins campus-card campus-rise" style={enterDelay(2)}>
            <LabelRow label={p.gainsLabel} note={p.gainsNote} />
            <InsightItems items={gains} delay={5} enter={enterDelay} boxed />
          </aside>
        )}
      </div>
      {p.showConclusion && <ConclusionBar label={p.conclusionLabel} text={p.conclusion} className="campus-rise" style={enterDelay(11)} />}
    </CampusFrame>
  );
}

const VALUE_BOUND = { min: -1000000000, max: 1000000000, semantics: 'magnitude' };

AblationTable.META = {
  id: 'ablation-table',
  label: '消融实验 · 模块开关表配贡献解读',
  roles: ['comparison', 'metrics', 'result'],
  defaults: DEFAULTS,
  copyBudgets: {
    tableLabel: 8, tableNote: 16, rowHead: 6, moduleGroup: 6, metricGroup: 6, 'modules[].name': 6, 'metrics[].name': 7,
    'rows[].name': 14, gainsLabel: 6, gainsNote: 10, 'gains[].value': 7, 'gains[].title': 10, 'gains[].text': 30,
    footnote: 48, conclusion: 52,
  },
  numberBounds: {
    'rows[].v1': VALUE_BOUND,
    'rows[].v2': VALUE_BOUND,
    'rows[].v3': VALUE_BOUND,
    'rows[].v4': VALUE_BOUND,
    'metrics[].decimals': { min: 0, max: 4, semantics: 'count' },
  },
  controls: [
    { ...CHAPTER_CONTROL, default: 4 },
    { key: 'rowCount', type: 'number', label: '实验行数', default: 5, min: 3, max: 7, countArrays: ['rows'], description: '消融表的行数(每行一种模块组合);第一行通常是基线,变化量相对它计算。rows 里 m1–m5 写 true / false 表示是否启用对应模块,v1–v4 是各指标数值。' },
    { key: 'moduleCount', type: 'number', label: '模块列数', default: 4, min: 1, max: 5, countArrays: ['modules'], description: '模块开关列的列数(模块名在 modules 里),依次读取 rows 里的 m1–m5。' },
    { key: 'metricCount', type: 'number', label: '指标列数', default: 4, min: 1, max: 4, countArrays: ['metrics'], description: '指标列的列数,依次读取 rows 里的 v1–v4;metrics[].better 写 high(越高越好)或 low(越低越好),每列最优值自动加粗,decimals 是小数位数。' },
    { key: 'fullRow', type: 'number', label: '完整模型行', default: 5, min: 0, max: 7, maxFromKey: 'rowCount', description: '高亮第几行(完整模型 / 本文方法);0 表示不高亮。' },
    { key: 'showDelta', type: 'toggle', label: '相对基线变化', default: true, description: '数值下方的小字变化量(相对第一行),朝好的方向变化时用校色。' },
    { key: 'showGains', type: 'toggle', label: '右侧模块贡献', default: true, description: '右侧「每个模块带来多少提升」的解读栏;关掉后表格占满整行。' },
    { key: 'gainCount', type: 'number', label: '贡献条数', default: 3, min: 2, max: 3, countArrays: ['gains'], description: '右侧解读的条数,value 是大号数字(如「−0.165」「+4.05」)。' },
    { key: 'showFootnote', type: 'toggle', label: '表注', default: true, description: '表格下方的一行注释。' },
    { key: 'showConclusion', type: 'toggle', label: '底部结论条', default: true, description: '页面底部的校色结论条。' },
  ],
};
