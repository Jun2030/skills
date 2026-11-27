// 统计 / 回归结果表:行是变量,列是 2–5 个模型(列头 = 模型编号 + 方法说明),单元格是「系数 + 显著性星号」,
// 下一行小字是括号里的标准误或 t 值;表尾是「样本量 / R² / 控制变量」这类汇总行,表下一行注释;
// 主模型列整列浅色高亮、核心解释变量行高亮;右侧 2–3 条结论。
// 关掉标准误与汇总行、把列头写成「均值 / 标准差 / 最小值 / 最大值」,就是描述性统计表。
// 系数、星号、标准误、汇总值都是 HTML 文本(星号是同一段文字里单独着色的部分)。
import React from 'react';
import { useThemeStyle, enterDelay } from '../../../shared/style.jsx';
import { safeArray, safeNumber, clamp } from '../../../chart-safety.mjs';
import { CampusFrame, TitleRow, ConclusionBar, CHAPTER_CONTROL } from '../kit/chrome.jsx';
import { LabelRow } from '../kit/parts.jsx';
import { useDataStyle, countOf, KeyBar, KeyStar, TableFoot, InsightItems } from '../kit/data.jsx';

const COEF_KEYS = ['c1', 'c2', 'c3', 'c4', 'c5'];
const SE_KEYS = ['s1', 's2', 's3', 's4', 's5'];

const DEFAULTS = {
  chapterIndex: 3,
  rowCount: 5,
  colCount: 3,
  summaryCount: 3,
  focusCol: 2,
  keyRow: 1,
  showSe: true,
  showSummary: true,
  showInsights: true,
  insightCount: 3,
  showFootnote: true,
  showConclusion: true,
  sectionNo: '3.4',
  title: '回归分析：管理会计应用与企业绩效',
  tableLabel: '回归结果',
  tableNote: '被解释变量：ROA · 示例数据',
  varHead: '变量',
  columns: [
    { name: '(1)', note: '基准回归' },
    { name: '(2)', note: '加入控制变量' },
    { name: '(3)', note: '固定效应' },
    { name: '(4)', note: '示例模型' },
    { name: '(5)', note: '示例模型' },
  ],
  rows: [
    { name: '管理会计应用程度', c1: '0.215***', s1: '(0.043)', c2: '0.187***', s2: '(0.041)', c3: '0.162**', s3: '(0.065)', c4: '0.170***', s4: '(0.052)', c5: '0.158**', s5: '(0.067)' },
    { name: '企业规模', c1: '—', s1: '', c2: '0.032**', s2: '(0.014)', c3: '0.028*', s3: '(0.016)', c4: '0.030**', s4: '(0.015)', c5: '0.027*', s5: '(0.016)' },
    { name: '资产负债率', c1: '—', s1: '', c2: '−0.096***', s2: '(0.027)', c3: '−0.081**', s3: '(0.033)', c4: '−0.090***', s4: '(0.029)', c5: '−0.078**', s5: '(0.034)' },
    { name: '营业收入增长率', c1: '—', s1: '', c2: '0.044*', s2: '(0.023)', c3: '0.039', s3: '(0.025)', c4: '0.041*', s4: '(0.024)', c5: '0.036', s5: '(0.026)' },
    { name: '常数项', c1: '0.021', s1: '(0.018)', c2: '−0.315**', s2: '(0.142)', c3: '−0.276*', s3: '(0.151)', c4: '−0.298**', s4: '(0.146)', c5: '−0.262*', s5: '(0.153)' },
    { name: '股权集中度', c1: '—', s1: '', c2: '0.018', s2: '(0.020)', c3: '0.015', s3: '(0.022)', c4: '0.017', s4: '(0.021)', c5: '0.014', s5: '(0.022)' },
    { name: '两职合一', c1: '—', s1: '', c2: '−0.012', s2: '(0.009)', c3: '−0.010', s3: '(0.010)', c4: '−0.011', s4: '(0.010)', c5: '−0.009', s5: '(0.011)' },
  ],
  summary: [
    { name: '样本量 N', c1: '1260', c2: '1260', c3: '1260', c4: '1260', c5: '1260' },
    { name: 'R²', c1: '0.142', c2: '0.276', c3: '0.318', c4: '0.290', c5: '0.305' },
    { name: '控制变量', c1: '否', c2: '是', c3: '是', c4: '是', c5: '是' },
    { name: '年份 / 行业固定', c1: '否', c2: '否', c3: '是', c4: '否', c5: '是' },
  ],
  footnote: '*** p<0.01，** p<0.05，* p<0.1；括号内为稳健标准误。',
  insightsLabel: '主要结论',
  insights: [
    { value: '0.187', title: '应用程度显著提升绩效', text: '控制规模、负债等因素后，系数仍在 1% 水平显著为正。' },
    { value: '−0.096', title: '负债率拖累绩效', text: '资产负债率越高 ROA 越低，与理论预期一致。' },
    { value: '0.318', title: '固定效应后依然稳健', text: '加入年份与行业固定效应，主效应方向和显著性不变。' },
  ],
  conclusionLabel: '研究假设',
  conclusion: '假设 H1 得到支持：管理会计应用程度越高，企业的资产收益率越高。',
};

const CSS = `
.cp-g3-sx{flex:1;min-height:0;display:flex;gap:28px;}
.cp-g3-sx-card{flex:1 1 0;min-width:0;min-height:0;display:flex;flex-direction:column;padding:22px 26px 16px;}
.cp-g3-sx-top{flex:none;margin-bottom:16px;}
.cp-g3-sx-side{flex:0 0 470px;}
.campus[data-campus-nav="rail"] .cp-g3-sx-side{flex-basis:410px;}
.cp-g3-sx-table{flex:1;min-height:0;}
.cp-g3-sx-table .cp-g3-tb-head{min-height:68px;}
.cp-g3-sx-th{position:relative;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:5px;min-width:0;padding:8px 8px;text-align:center;}
.cp-g3-sx-th + .cp-g3-sx-th::before{content:'';position:absolute;left:0;top:16px;bottom:16px;width:1px;background:var(--campus-on-accent-line);}
.cp-g3-sx-th.is-var{align-items:flex-start;padding-left:22px;font-size:21px;font-weight:700;letter-spacing:.04em;}
.cp-g3-sx-th-name{font-family:var(--theme-font-serif);font-size:23px;font-weight:700;line-height:1;font-variant-numeric:lining-nums;}
.cp-g3-sx-th-note{font-size:18px;line-height:1.2;color:var(--campus-on-accent-muted);}
.cp-g3-sx-th.is-focus{background:rgb(255 255 255 / .12);}
.cp-g3-sx-th.is-focus .cp-g3-sx-th-note{color:var(--theme-on-accent);font-weight:700;}
.cp-g3-sx-focus-tick{position:absolute;top:0;left:50%;width:30px;height:4px;margin-left:-15px;border-radius:0 0 3px 3px;background:var(--campus-spark);}
.cp-g3-sx-table .cp-g3-tb-row{max-height:92px;}
/* 3 行及以下:行高上限放宽、系数放大一档,表格不在卡片上半截就结束 */
.cp-g3-sx.is-sparse .cp-g3-sx-table .cp-g3-tb-row{max-height:150px;}
.cp-g3-sx.is-sparse .cp-g3-sx-coef{font-size:27px;}
.cp-g3-sx.is-sparse .cp-g3-sx-name{font-size:23px;}
.cp-g3-sx-name{display:flex;align-items:center;gap:10px;min-width:0;padding:4px 12px 4px 22px;font-size:21px;line-height:1.3;color:var(--theme-ink);}
.cp-g3-tb-row.is-key .cp-g3-sx-name{font-weight:700;color:var(--theme-accent);}
.cp-g3-sx-cell{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;min-width:0;padding:4px 6px;}
.cp-g3-sx-cell.is-focus{background:rgb(var(--theme-accent-rgb) / .07);}
.cp-g3-sx-coef{display:flex;align-items:flex-start;font-family:var(--theme-font-serif);font-weight:600;font-size:23px;line-height:1;color:var(--theme-ink);white-space:nowrap;font-variant-numeric:lining-nums tabular-nums;}
.cp-g3-sx-star{margin-left:2px;font-size:19px;line-height:.8;font-weight:800;color:var(--theme-accent);letter-spacing:-.02em;}
.cp-g3-sx-cell.is-focus .cp-g3-sx-coef{font-weight:800;}
.cp-g3-sx-se{font-family:var(--theme-font-serif);font-size:18px;line-height:1;color:var(--theme-faint);white-space:nowrap;font-variant-numeric:lining-nums tabular-nums;}
/* 汇总行:上方一道双线,浅纸色底 */
.cp-g3-sx-sum{flex:none;display:flex;flex-direction:column;border-top:3px double var(--campus-accent-line);background:var(--campus-paper);}
.cp-g3-sx-sum .cp-g3-tb-row{flex:none;min-height:44px;background:transparent;}
.cp-g3-sx-sum .cp-g3-tb-row:last-child{border-bottom-color:var(--campus-accent-line);}
.cp-g3-sx-sum .cp-g3-sx-name{font-size:20px;font-weight:700;color:var(--theme-muted);}
.cp-g3-sx-sumval{font-family:var(--theme-font-serif);font-size:21px;font-weight:600;line-height:1;color:var(--theme-muted);font-variant-numeric:lining-nums tabular-nums;white-space:nowrap;}
.cp-g3-sx-cell.is-focus .cp-g3-sx-sumval{color:var(--theme-accent);font-weight:800;}
.cp-g3-sx.is-flat .cp-g3-sx-coef{font-size:24px;}
.cp-g3-sx.is-dense .cp-g3-sx-name{font-size:20px;}
.cp-g3-sx.is-dense .cp-g3-sx-coef{font-size:21px;}
`;

/** 「0.215***」→ 系数 + 星号两段(同一个块级元素里,导出与编辑仍是一段文字)。 */
function splitStars(text) {
  const value = String(text ?? '');
  const match = value.match(/^(.*?)(\*+)\s*$/);
  return match ? { coef: match[1], stars: match[2] } : { coef: value, stars: '' };
}

export function StatsTable(props) {
  useDataStyle();
  useThemeStyle('campus-stats-table-style', CSS);
  const p = { ...DEFAULTS, ...props };
  const rows = safeArray(p.rows).slice(0, countOf(p.rowCount, 2, 7));
  const columns = safeArray(p.columns).slice(0, countOf(p.colCount, 2, 5));
  const summary = p.showSummary ? safeArray(p.summary).slice(0, countOf(p.summaryCount, 1, 4)) : [];
  const insights = safeArray(p.insights).slice(0, countOf(p.insightCount, 2, 3));
  const focus = clamp(Math.round(safeNumber(p.focusCol, 0)), 0, columns.length) - 1;
  const key = clamp(Math.round(safeNumber(p.keyRow, 0)), 0, rows.length) - 1;
  const se = p.showSe !== false;
  const cols = `minmax(0,${columns.length > 3 ? 1.5 : 1.7}fr) repeat(${columns.length}, minmax(0,1fr))`;
  const dense = rows.length + summary.length > 8;
  return (
    <CampusFrame chapterIndex={p.chapterIndex}>
      <TitleRow no={p.sectionNo} title={p.title} className="campus-rise" style={enterDelay(0)} />
      <div className={`cp-g3-sx${se ? '' : ' is-flat'}${dense ? ' is-dense' : ''}${rows.length <= 3 ? ' is-sparse' : ''}`}>
        <section className="cp-g3-sx-card campus-card campus-rise" style={enterDelay(1)}>
          <div className="cp-g3-sx-top"><LabelRow label={p.tableLabel} note={p.tableNote} /></div>
          <div className="cp-g3-tb cp-g3-sx-table" style={{ '--cp-g3-cols': cols }}>
            <div className="cp-g3-tb-head">
              <div className="cp-g3-sx-th is-var">{p.varHead}</div>
              {columns.map((col, c) => (
                <div className={`cp-g3-sx-th${c === focus ? ' is-focus' : ''}`} key={c}>
                  {c === focus && <div className="cp-g3-sx-focus-tick" aria-hidden="true" />}
                  <div className="cp-g3-sx-th-name">{col?.name}</div>
                  {col?.note ? <div className="cp-g3-sx-th-note">{col.note}</div> : null}
                </div>
              ))}
            </div>
            <div className="cp-g3-tb-body">
              {rows.map((row, r) => (
                <div className={`cp-g3-tb-row campus-fade${r === key ? ' is-key' : ''}`} style={enterDelay(3 + r)} key={r}>
                  {r === key && <KeyBar />}
                  <div className="cp-g3-sx-name">
                    {r === key && <KeyStar />}
                    <div>{row?.name}</div>
                  </div>
                  {columns.map((_, c) => {
                    const { coef, stars } = splitStars(row?.[COEF_KEYS[c]]);
                    const seText = row?.[SE_KEYS[c]];
                    return (
                      <div className={`cp-g3-sx-cell${c === focus ? ' is-focus' : ''}`} key={c}>
                        <div className="cp-g3-sx-coef"><span>{coef}</span>{stars ? <span className="cp-g3-sx-star">{stars}</span> : null}</div>
                        {se && seText ? <div className="cp-g3-sx-se">{seText}</div> : null}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
            {summary.length > 0 && (
              <div className="cp-g3-sx-sum">
                {summary.map((row, r) => (
                  <div className="cp-g3-tb-row campus-fade" style={enterDelay(9 + r)} key={r}>
                    <div className="cp-g3-sx-name">{row?.name}</div>
                    {columns.map((_, c) => (
                      <div className={`cp-g3-sx-cell${c === focus ? ' is-focus' : ''}`} key={c}>
                        <div className="cp-g3-sx-sumval">{row?.[COEF_KEYS[c]]}</div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
          {p.showFootnote && <TableFoot text={p.footnote} className="campus-fade" style={enterDelay(12)} />}
        </section>
        {p.showInsights && (
          <aside className="cp-g3-sx-side cp-g3-ins campus-card campus-rise" style={enterDelay(2)}>
            <LabelRow label={p.insightsLabel} />
            <InsightItems items={insights} delay={6} enter={enterDelay} boxed />
          </aside>
        )}
      </div>
      {p.showConclusion && <ConclusionBar label={p.conclusionLabel} text={p.conclusion} className="campus-rise" style={enterDelay(13)} />}
    </CampusFrame>
  );
}

StatsTable.META = {
  id: 'stats-table',
  label: '统计表 · 回归系数表配结论',
  roles: ['metrics', 'result', 'comparison'],
  defaults: DEFAULTS,
  copyBudgets: {
    tableLabel: 8, tableNote: 16, varHead: 6, 'columns[].name': 6, 'columns[].note': 7, 'rows[].name': 10,
    'rows[].c1': 9, 'rows[].c2': 9, 'rows[].c3': 9, 'rows[].c4': 9, 'rows[].c5': 9,
    'rows[].s1': 9, 'rows[].s2': 9, 'rows[].s3': 9, 'rows[].s4': 9, 'rows[].s5': 9,
    'summary[].name': 9, 'summary[].c1': 7, 'summary[].c2': 7, 'summary[].c3': 7, 'summary[].c4': 7, 'summary[].c5': 7,
    footnote: 44, insightsLabel: 6, 'insights[].value': 7, 'insights[].title': 11, 'insights[].text': 28, conclusion: 52,
  },
  controls: [
    { ...CHAPTER_CONTROL, default: 3 },
    { key: 'rowCount', type: 'number', label: '变量行数', default: 5, min: 2, max: 7, countArrays: ['rows'], description: '变量(或描述性统计的指标)行数。rows 里 c1–c5 是各列的系数文字,末尾的 * / ** / *** 自动显示为校色星号;s1–s5 是下一行小字(括号里的标准误或 t 值),没有就留空。' },
    { key: 'colCount', type: 'number', label: '模型列数', default: 3, min: 2, max: 5, countArrays: ['columns'], description: '模型列数,columns[].name 是列头编号(如「(1)」或「均值」),note 是列头小字(方法说明);做描述性统计表时列头写「均值 / 标准差 / 最小值 / 最大值」并关掉标准误与汇总行。' },
    { key: 'focusCol', type: 'number', label: '主模型列', default: 2, min: 0, max: 5, maxFromKey: 'colCount', description: '整列浅色高亮第几列(主模型),0 表示不高亮。' },
    { key: 'keyRow', type: 'number', label: '核心变量行', default: 1, min: 0, max: 7, maxFromKey: 'rowCount', description: '高亮第几行(核心解释变量),0 表示不高亮。' },
    { key: 'showSe', type: 'toggle', label: '标准误小字', default: true, description: '系数下方的括号小字(rows 里的 s1–s5)。' },
    { key: 'showSummary', type: 'toggle', label: '表尾汇总行', default: true, description: '表尾的样本量、R²、控制变量等汇总行。' },
    { key: 'summaryCount', type: 'number', label: '汇总行数', default: 3, min: 1, max: 4, countArrays: ['summary'], description: '表尾汇总行的行数。' },
    { key: 'showInsights', type: 'toggle', label: '右侧结论', default: true, description: '右侧 2–3 条结论;关掉后表格占满整行。' },
    { key: 'insightCount', type: 'number', label: '结论条数', default: 3, min: 2, max: 3, countArrays: ['insights'], description: '右侧结论的条数,value 是大号数字(可留空)。' },
    { key: 'showFootnote', type: 'toggle', label: '表注', default: true, description: '表格下方的显著性说明。' },
    { key: 'showConclusion', type: 'toggle', label: '底部结论条', default: true, description: '页面底部的校色结论条。' },
  ],
};
