// 经费预算:左侧科目表(科目 / 金额 / 占比 / 用途说明,4–8 行,末尾合计行加粗强调,金额右对齐),
// 右侧环形占比图(SVG 只画环,圆心总额、图例名称与百分比都是 HTML 文本)。
// 结题变体(mode = final)把列换成「预算 / 支出 / 结余 / 执行率」,环形图改画各科目支出占比,圆心是总执行率。
// 合计、占比、结余、执行率都由数据计算。适合项目申报的「经费预算」、结题汇报的「经费使用情况」。
import React from 'react';
import { useThemeStyle, enterDelay } from '../../../shared/style.jsx';
import { safeArray, safeNumber, safePercent, safeRatio, clamp } from '../../../chart-safety.mjs';
import { CampusFrame, TitleRow, ConclusionBar, CHAPTER_CONTROL, textWidthEm } from '../kit/chrome.jsx';
import { LabelRow } from '../kit/parts.jsx';
import { useStructureStyle } from '../kit/structure.jsx';
import { useAffairsStyle, MiniBar, amountDecimals, formatAmount, shareTone } from '../kit/affairs.jsx';

const DEFAULTS = {
  chapterIndex: 5,
  mode: 'plan',
  rowCount: 6,
  showConclusion: true,
  sectionNo: '5.4',
  title: '经费预算',
  unit: '万元',
  headName: '预算科目',
  headAmount: '金额',
  headShare: '占比',
  headNote: '用途说明',
  headBudget: '预算',
  headSpent: '支出',
  headBalance: '结余',
  headRate: '执行率',
  totalLabel: '合计',
  chartLabel: '经费构成',
  chartNote: '示例数据',
  centerLabel: '总预算',
  rateLabel: '总执行率',
  rows: [
    { name: '设备费', amount: 4.8, spent: 4.6, note: '惯导模块、射频前端与数据采集板卡' },
    { name: '材料费', amount: 1.2, spent: 1.1, note: '天线、线缆与车载测试安装件' },
    { name: '测试化验加工费', amount: 1.5, spent: 1.2, note: '城市复杂环境实测与外场标定' },
    { name: '差旅 / 会议费', amount: 1.0, spent: 0.6, note: '外场采集差旅与学术会议交流' },
    { name: '出版 / 知识产权', amount: 0.8, spent: 0.5, note: '论文版面费与发明专利申请' },
    { name: '劳务费', amount: 0.7, spent: 0.7, note: '参与数据处理的研究生劳务' },
    { name: '专家咨询费', amount: 0.4, spent: 0.2, note: '方案论证与中期检查专家咨询' },
    { name: '其他支出', amount: 0.2, spent: 0.1, note: '在这里说明其他支出用途' },
  ],
  conclusionLabel: '预算说明',
  conclusion: '设备与测试费合计占六成以上，集中用于实测平台搭建，与研究方案的工作量相匹配。',
};

const CSS = `
.cp-g4-bud{flex:1;min-height:0;display:flex;gap:28px;}
.cp-g4-bud-table{flex:1;min-width:0;}
.cp-g4-bud .campus-xt-th{font-size:21px;}
.cp-g4-bud .campus-xt-td{font-size:21px;line-height:1.4;padding-top:8px;padding-bottom:8px;}
.cp-g4-bud .campus-xt-th.is-num{justify-content:flex-end;}
.cp-g4-bud-name{font-weight:700;}
.cp-g4-bud-th-unit{font-size:16px;font-weight:600;letter-spacing:.04em;color:var(--campus-on-accent-muted);}
.cp-g4-bud-swatch{flex:none;width:16px;height:16px;border-radius:5px;}
.cp-g4-bud-num{justify-content:flex-end;font-family:var(--theme-font-serif);font-weight:700;font-size:24px!important;font-variant-numeric:lining-nums tabular-nums;color:var(--theme-ink);white-space:nowrap;}
.cp-g4-bud-num.is-accent{color:var(--theme-accent);}
.cp-g4-bud-num.is-soft{color:var(--theme-muted);}
.cp-g4-bud-share{flex-direction:column;align-items:stretch!important;justify-content:center;gap:6px!important;}
.cp-g4-bud-share-num{text-align:right;font-family:var(--theme-font-serif);font-weight:700;font-size:22px;line-height:1;color:var(--theme-accent);font-variant-numeric:lining-nums tabular-nums;}
.cp-g4-bud-note{color:var(--theme-muted);}
/* 合计行:顶部双线 + 浅校色渐变底,金额放大 */
.cp-g4-bud-total{flex:0 0 auto;min-height:72px;border-top:3px double var(--campus-accent-line)!important;background:var(--campus-wash);border-radius:0 0 var(--campus-radius) var(--campus-radius);}
.cp-g4-bud-total .campus-xt-td{font-weight:700;}
.cp-g4-bud-total-label{font-family:var(--theme-font-serif);font-size:24px;letter-spacing:.3em;color:var(--theme-accent);}
.cp-g4-bud-total .cp-g4-bud-num{font-size:30px!important;color:var(--theme-accent);}
.cp-g4-bud-unit{margin-left:6px;font-family:var(--theme-font-sans);font-size:17px;font-weight:600;color:var(--campus-accent-soft);}
/* 右侧环形图卡 */
.cp-g4-bud-chart{flex:0 0 540px;min-height:0;display:flex;flex-direction:column;padding:22px 28px 24px;}
.campus[data-campus-nav="rail"] .cp-g4-bud-chart{flex-basis:470px;}
.cp-g4-bud-ring{position:relative;flex:1;min-height:0;margin-top:10px;display:flex;align-items:center;justify-content:center;}
.cp-g4-bud-ring svg{position:relative;height:100%;max-height:390px;max-width:100%;aspect-ratio:1 / 1;display:block;}
.cp-g4-bud-track{fill:none;stroke:var(--campus-neutral-wash);}
.cp-g4-bud-seg{fill:none;}
.cp-g4-bud-disc{position:absolute;left:50%;top:50%;height:min(54%,180px);aspect-ratio:1 / 1;transform:translate(-50%,-50%);border-radius:50%;background:var(--theme-surface);box-shadow:0 12px 28px rgb(var(--theme-accent-rgb) / .18);}
.cp-g4-bud-center{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);display:flex;flex-direction:column;align-items:center;gap:8px;text-align:center;}
.cp-g4-bud-center-value{display:flex;align-items:baseline;gap:4px;}
.cp-g4-bud-center-num{font-family:var(--theme-font-serif);font-weight:700;font-size:54px;line-height:1;color:var(--theme-accent);font-variant-numeric:lining-nums;white-space:nowrap;}
.cp-g4-bud-center-unit{font-size:18px;font-weight:700;color:var(--campus-accent-soft);white-space:nowrap;}
.cp-g4-bud-center-label{display:flex;align-items:baseline;gap:8px;font-size:18px;letter-spacing:.1em;color:var(--theme-muted);white-space:nowrap;}
/* 图例:两列,色块 + 名称 + 百分比 */
.cp-g4-bud-legend{flex:none;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px 22px;margin-top:16px;padding-top:16px;border-top:1px dashed var(--theme-line);}
.cp-g4-bud-legend-item{display:flex;align-items:center;gap:10px;min-width:0;}
.cp-g4-bud-legend-name{flex:1;min-width:0;font-size:18px;line-height:1.3;color:var(--theme-muted);overflow-wrap:anywhere;}
.cp-g4-bud-legend-pct{flex:none;font-family:var(--theme-font-serif);font-weight:700;font-size:20px;color:var(--theme-ink);font-variant-numeric:lining-nums tabular-nums;}
/* 结题:环下三格汇总 */
.cp-g4-bud-sums{flex:none;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));margin-top:16px;border-radius:var(--campus-radius-sm);background:var(--campus-wash);}
.cp-g4-bud-sum{display:flex;flex-direction:column;align-items:center;gap:6px;padding:14px 6px;}
.cp-g4-bud-sum + .cp-g4-bud-sum{border-left:1px dashed var(--campus-accent-line);}
.cp-g4-bud-sum-label{font-size:18px;color:var(--theme-muted);letter-spacing:.08em;}
.cp-g4-bud-sum-num{font-family:var(--theme-font-serif);font-weight:700;font-size:28px;line-height:1;color:var(--theme-accent);font-variant-numeric:lining-nums tabular-nums;white-space:nowrap;}
.cp-g4-bud.is-dense .campus-xt-td{padding-top:4px;padding-bottom:4px;font-size:20px;line-height:1.35;}
.cp-g4-bud.is-dense .cp-g4-bud-num{font-size:22px!important;}
.cp-g4-bud.is-dense .cp-g4-bud-total{min-height:64px;}
`;

const R = 38;
const STROKE = 18;

export function BudgetTable(props) {
  useStructureStyle();
  useAffairsStyle();
  useThemeStyle('campus-budget-table-style', CSS);
  const p = { ...DEFAULTS, ...props };
  const final = p.mode === 'final';
  const rows = safeArray(p.rows).slice(0, clamp(p.rowCount, 4, 8));
  const amounts = rows.map(r => Math.max(0, safeNumber(r?.amount, 0)));
  const spents = rows.map(r => Math.max(0, safeNumber(r?.spent, 0)));
  const total = amounts.reduce((sum, v) => sum + v, 0);
  const totalSpent = spents.reduce((sum, v) => sum + v, 0);
  const balances = rows.map((_, i) => amounts[i] - spents[i]);
  const decimals = amountDecimals([...amounts, ...spents]);
  const fmt = v => formatAmount(v, decimals);
  // 环形图:预算模式按金额占比,结题模式按支出占比;段与段之间留 0.6 的缝
  const shareBase = final ? spents : amounts;
  const shareTotal = final ? totalSpent : total;
  let acc = 0;
  const arcs = shareBase.map((v, i) => {
    const share = safePercent(v, shareTotal, 0);
    const start = acc;
    acc += share;
    return { i, len: Math.max(0, share - (share > 1 ? 0.6 : 0)), offset: -start, share };
  });
  const tone = i => (i === 0 ? 'var(--campus-fill)' : shareTone(i, rows.length));
  const stroke = i => shareTone(i, rows.length);
  const pct = v => `${Math.round(v * 10) / 10}%`;
  const cols = final
    ? ['minmax(0,1.25fr)', '150px', '150px', '150px', 'minmax(0,1fr)']
    : ['minmax(0,1fr)', '160px', '170px', 'minmax(0,1.5fr)'];
  const dense = rows.length >= 7;
  const rate = safePercent(totalSpent, total, 0);
  // 圆心数字:位数多时缩小字号,保证放进白色圆盘(约 160px 宽)
  const centerText = final ? `${Math.round(rate * 10) / 10}` : fmt(total);
  const centerSize = Math.round(clamp(safeRatio(final ? 120 : 140, textWidthEm(centerText) * 0.95, 54), 30, 56));
  const nameCell = (row, i) => (
    <div className="campus-xt-td cp-g4-bud-name">
      <div className="cp-g4-bud-swatch" style={{ background: tone(i) }} aria-hidden="true" />
      <div>{row?.name}</div>
    </div>
  );
  return (
    <CampusFrame chapterIndex={p.chapterIndex}>
      <TitleRow no={p.sectionNo} title={p.title} className="campus-rise" style={enterDelay(0)} />
      <div className={`cp-g4-bud${dense ? ' is-dense' : ''}`}>
        <div className="cp-g4-bud-table campus-xt-stage">
          <div className="campus-xt campus-card campus-rise" style={{ '--cp-xt-cols': cols.join(' '), maxHeight: 60 + 72 + rows.length * 112, ...enterDelay(1) }}>
            <div className="campus-xt-head">
              <div className="campus-xt-th"><div>{p.headName}</div></div>
              {final ? (
                <>
                  <div className="campus-xt-th is-num"><div>{p.headBudget}</div></div>
                  <div className="campus-xt-th is-num"><div>{p.headSpent}</div></div>
                  <div className="campus-xt-th is-num"><div>{p.headBalance}</div></div>
                  <div className="campus-xt-th"><div className="campus-xt-mark" aria-hidden="true" /><div>{p.headRate}</div></div>
                </>
              ) : (
                <>
                  <div className="campus-xt-th is-num"><div>{p.headAmount}</div><div className="cp-g4-bud-th-unit">{p.unit}</div></div>
                  <div className="campus-xt-th is-num"><div>{p.headShare}</div></div>
                  <div className="campus-xt-th"><div>{p.headNote}</div></div>
                </>
              )}
            </div>
            <div className="campus-xt-body">
              {rows.map((row, i) => (
                <div className={`campus-xt-row campus-fade${i % 2 ? ' is-zebra' : ''}`} style={enterDelay(2 + i)} key={i}>
                  {nameCell(row, i)}
                  {final ? (
                    <>
                      <div className="campus-xt-td cp-g4-bud-num is-soft"><div>{fmt(amounts[i])}</div></div>
                      <div className="campus-xt-td cp-g4-bud-num"><div>{fmt(spents[i])}</div></div>
                      <div className="campus-xt-td cp-g4-bud-num is-accent"><div>{fmt(balances[i])}</div></div>
                      <div className="campus-xt-td cp-g4-bud-share">
                        <div className="cp-g4-bud-share-num">{pct(safePercent(spents[i], amounts[i], 0))}</div>
                        <MiniBar value={safePercent(spents[i], amounts[i], 0)} />
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="campus-xt-td cp-g4-bud-num"><div>{fmt(amounts[i])}</div></div>
                      <div className="campus-xt-td cp-g4-bud-share">
                        <div className="cp-g4-bud-share-num">{pct(arcs[i].share)}</div>
                        <MiniBar value={arcs[i].share} />
                      </div>
                      <div className="campus-xt-td cp-g4-bud-note"><div>{row?.note}</div></div>
                    </>
                  )}
                </div>
              ))}
              <div className="campus-xt-row cp-g4-bud-total campus-fade" style={enterDelay(3 + rows.length)}>
                <div className="campus-xt-td"><div className="cp-g4-bud-total-label">{p.totalLabel}</div></div>
                {final ? (
                  <>
                    <div className="campus-xt-td cp-g4-bud-num"><div>{fmt(total)}</div></div>
                    <div className="campus-xt-td cp-g4-bud-num"><div>{fmt(totalSpent)}</div></div>
                    <div className="campus-xt-td cp-g4-bud-num"><div>{fmt(total - totalSpent)}</div></div>
                    <div className="campus-xt-td cp-g4-bud-share">
                      <div className="cp-g4-bud-share-num">{pct(rate)}</div>
                      <MiniBar value={rate} />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="campus-xt-td cp-g4-bud-num"><div>{fmt(total)}</div></div>
                    <div className="campus-xt-td cp-g4-bud-share"><div className="cp-g4-bud-share-num">100%</div></div>
                    <div className="campus-xt-td cp-g4-bud-note" />
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
        <section className="cp-g4-bud-chart campus-card campus-rise" style={enterDelay(2)}>
          <LabelRow label={p.chartLabel} note={p.chartNote} />
          <div className="cp-g4-bud-ring">
            <div className="cp-g4-bud-disc" aria-hidden="true" />
            <svg viewBox="0 0 100 100" aria-hidden="true">
              <circle className="cp-g4-bud-track" cx="50" cy="50" r={R} strokeWidth={STROKE} />
              <g transform="rotate(-90 50 50)">
                {arcs.map(arc => (
                  <circle
                    key={arc.i}
                    className="cp-g4-bud-seg campus-fade"
                    cx="50" cy="50" r={R}
                    pathLength="100"
                    strokeWidth={STROKE}
                    strokeDasharray={`${arc.len} ${100 - arc.len}`}
                    strokeDashoffset={arc.offset}
                    style={{ stroke: stroke(arc.i), ...enterDelay(3 + arc.i) }}
                  />
                ))}
              </g>
            </svg>
            <div className="cp-g4-bud-center">
              <div className="cp-g4-bud-center-value">
                <div className="cp-g4-bud-center-num" style={{ fontSize: centerSize }}>{centerText}</div>
                {final ? <div className="cp-g4-bud-center-unit">%</div> : null}
              </div>
              <div className="cp-g4-bud-center-label">
                <div>{final ? p.rateLabel : p.centerLabel}</div>
                {final ? null : <div className="cp-g4-bud-center-unit">{p.unit}</div>}
              </div>
            </div>
          </div>
          {final ? (
            <div className="cp-g4-bud-sums">
              <div className="cp-g4-bud-sum"><div className="cp-g4-bud-sum-label">{p.headBudget}</div><div className="cp-g4-bud-sum-num">{fmt(total)}</div></div>
              <div className="cp-g4-bud-sum"><div className="cp-g4-bud-sum-label">{p.headSpent}</div><div className="cp-g4-bud-sum-num">{fmt(totalSpent)}</div></div>
              <div className="cp-g4-bud-sum"><div className="cp-g4-bud-sum-label">{p.headBalance}</div><div className="cp-g4-bud-sum-num">{fmt(total - totalSpent)}</div></div>
            </div>
          ) : (
            <div className="cp-g4-bud-legend">
              {rows.map((row, i) => (
                <div className="cp-g4-bud-legend-item" key={i}>
                  <div className="cp-g4-bud-swatch" style={{ background: tone(i) }} aria-hidden="true" />
                  <div className="cp-g4-bud-legend-name">{row?.name}</div>
                  <div className="cp-g4-bud-legend-pct">{pct(arcs[i].share)}</div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
      {p.showConclusion && <ConclusionBar label={p.conclusionLabel} text={p.conclusion} className="campus-rise" style={enterDelay(12)} />}
    </CampusFrame>
  );
}

BudgetTable.META = {
  id: 'budget-table',
  label: '经费预算 · 科目表配环形占比',
  roles: ['distribution', 'metrics', 'actions'],
  defaults: DEFAULTS,
  copyBudgets: {
    unit: 4,
    headName: 6,
    headAmount: 4,
    headShare: 4,
    headNote: 6,
    headBudget: 4,
    headSpent: 4,
    headBalance: 4,
    headRate: 4,
    totalLabel: 4,
    chartLabel: 6,
    chartNote: 8,
    centerLabel: 6,
    rateLabel: 6,
    'rows[].name': 8,
    'rows[].note': 20,
    conclusionLabel: 4,
    conclusion: 44,
  },
  numberBounds: {
    'rows[].amount': { min: 0, max: 1000000000, semantics: 'magnitude' },
    'rows[].spent': { min: 0, max: 1000000000, semantics: 'magnitude' },
  },
  controls: [
    { ...CHAPTER_CONTROL, default: 5 },
    { key: 'mode', type: 'radio', label: '表格类型', default: 'plan', options: [{ value: 'plan', label: '预算(申报)' }, { value: 'final', label: '决算(结题)' }], description: '预算:科目 / 预算数 / 占比 / 用途说明,环形图画预算占比;决算:科目 / 预算 / 支出 / 结余 / 执行率,环形图画支出占比,圆心是总执行率。' },
    { key: 'rowCount', type: 'number', label: '科目数', default: 6, min: 4, max: 8, countArrays: ['rows'], description: '预算科目(行)数;每行是 科目 name、预算数 amount、已支出 spent(决算时用)、用途说明 note。合计、占比、结余、执行率自动计算。' },
    { key: 'showConclusion', type: 'toggle', label: '底部结论条', default: true, description: '页面底部的一句预算说明。' },
  ],
};
