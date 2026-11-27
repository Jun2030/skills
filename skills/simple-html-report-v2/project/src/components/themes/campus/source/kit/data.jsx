// campus 的「数据与实验」部件(g3 组):数据表骨架、关键行标记、模块开关勾选标记、测试结论徽标、
// 涨跌胶囊、汇总数字条、右侧解读栏、数值格式化与坐标范围。
// 供实验设置表、曲线小图网格、消融表、测试用例表、问卷结果、统计表、前后对比、矩阵热力图这几页共用。
//
// 与 parts.jsx 一样只读 token;装饰形状(勾选圆片、关键行竖条、箭头)画在不含文字的元素上或是 SVG,
// 数字与文字都是独立的块级 HTML 文本,导出 PPTX 时仍可编辑。
// 页面在自己的 useThemeStyle 之前调用 useDataStyle(),保证注入顺序「kit → 页面」,同优先级时页面覆盖 kit。
import React from 'react';
import { useThemeStyle } from '../../../shared/style.jsx';
import { safeNumber, safeArray, safeDenominator, safeMax, safeMin, clamp } from '../../../chart-safety.mjs';
import { SparkStar } from './chrome.jsx';
import { CAMPUS_G3_DATA_CSS } from './base.jsx';

const DATA_CSS = `
/* —— 数据表骨架:渐变表头 + 斑马行 + 等宽数字;列宽由页面经 --cp-g3-cols 给出 —— */
.cp-g3-tb{position:relative;display:flex;flex-direction:column;min-height:0;}
.cp-g3-tb-head{flex:none;position:relative;display:grid;grid-template-columns:var(--cp-g3-cols);align-items:stretch;min-height:56px;border-radius:var(--campus-radius-sm) var(--campus-radius-sm) 0 0;background:var(--campus-fill-deep);color:var(--theme-on-accent);box-shadow:0 8px 18px rgb(var(--theme-accent-rgb) / .18);}
.cp-g3-tb-th{position:relative;display:flex;align-items:center;gap:8px;min-width:0;padding:8px 18px;font-size:21px;line-height:1.25;font-weight:700;letter-spacing:.04em;}
.cp-g3-tb-th + .cp-g3-tb-th::before{content:'';position:absolute;left:0;top:16px;bottom:16px;width:1px;background:var(--campus-on-accent-line);}
.cp-g3-tb-th.is-num{justify-content:flex-end;text-align:right;}
.cp-g3-tb-th.is-center{justify-content:center;text-align:center;}
.cp-g3-tb-th .cp-ev-dir{color:var(--campus-spark);}
.cp-g3-tb-body{flex:1;min-height:0;display:flex;flex-direction:column;}
.cp-g3-tb-row{position:relative;flex:1 1 0;min-height:0;display:grid;grid-template-columns:var(--cp-g3-cols);align-items:stretch;border-bottom:1px solid var(--theme-line);}
.cp-g3-tb-row:nth-child(even){background:var(--campus-accent-wash);}
.cp-g3-tb-row.is-key{background:linear-gradient(90deg,rgb(var(--theme-accent-rgb) / .07) 0%,rgb(var(--theme-accent-rgb) / .17) 100%);border-bottom-color:var(--campus-accent-line);}
.cp-g3-tb-td{display:flex;align-items:center;gap:10px;min-width:0;padding:6px 18px;font-size:21px;line-height:1.38;color:var(--theme-ink);text-wrap:pretty;}
.cp-g3-tb-td.is-num{justify-content:flex-end;text-align:right;}
.cp-g3-tb-td.is-center{justify-content:center;text-align:center;}
.cp-g3-tb-td.is-muted{color:var(--theme-muted);}
.cp-g3-num{font-family:var(--theme-font-serif);font-weight:600;font-size:24px;line-height:1;color:var(--theme-muted);font-variant-numeric:lining-nums tabular-nums;white-space:nowrap;}
.cp-g3-tb-row.is-key .cp-g3-num{color:var(--theme-ink);}
.cp-g3-num.is-best,.cp-g3-tb-row.is-key .cp-g3-num.is-best{font-weight:800;color:var(--theme-accent);}
/* 关键行:左缘渐变竖条 + 行名前的点缀色星标 */
.cp-g3-keybar{position:absolute;left:0;top:7px;bottom:7px;width:6px;border-radius:3px;background:var(--campus-fill-bar);pointer-events:none;}
.cp-g3-keystar{flex:none;display:block;color:var(--campus-spark);}
/* 表注:点缀色小菱形 + 一行注释 */
.cp-g3-foot{flex:none;display:flex;align-items:flex-start;gap:12px;margin-top:14px;font-size:18px;line-height:1.45;color:var(--theme-faint);}
.cp-g3-foot > .campus-mark{margin-top:6px;}

/* —— 模块开关:渐变圆片 + 白勾(启用)/ 虚线空圈(未启用) —— */
.cp-g3-check{flex:none;position:relative;display:grid;place-items:center;border-radius:50%;}
.cp-g3-check.is-on{background:var(--campus-fill);color:var(--theme-on-accent);box-shadow:0 5px 12px rgb(var(--theme-accent-rgb) / .3);}
.cp-g3-check.is-off{border:2px dashed var(--campus-neutral-soft);background:var(--theme-surface);}
.cp-g3-check.is-off::after{content:'';width:30%;height:2.5px;border-radius:2px;background:var(--campus-neutral-soft);}
.cp-g3-check > svg{display:block;}

/* —— 测试结论徽标:通过(渐变 + 勾)/ 未通过(白底校色描边 + 叉)/ 待测(中性灰 + 虚线圈)/ 其他(中性灰点) —— */
.cp-g3-verdict{flex:none;display:inline-flex;align-items:center;gap:8px;height:40px;padding:0 16px 0 7px;border-radius:999px;font-size:20px;line-height:1;font-weight:700;letter-spacing:.06em;white-space:nowrap;}
.cp-g3-verdict-icon{flex:none;width:28px;height:28px;border-radius:50%;display:grid;place-items:center;}
.cp-g3-verdict-icon > svg{display:block;}
.cp-g3-verdict.is-pass{background:var(--campus-fill);color:var(--theme-on-accent);box-shadow:0 6px 14px rgb(var(--theme-accent-rgb) / .24);}
.cp-g3-verdict.is-pass .cp-g3-verdict-icon{background:var(--campus-on-accent-glass);}
.cp-g3-verdict.is-fail{background:var(--theme-surface);color:var(--theme-accent);box-shadow:inset 0 0 0 2px var(--theme-accent);}
.cp-g3-verdict.is-fail .cp-g3-verdict-icon{background:var(--campus-accent-tint);}
.cp-g3-verdict.is-wait{background:var(--campus-neutral-wash);color:var(--theme-muted);border:1.5px dashed var(--campus-neutral-soft);}
.cp-g3-verdict.is-wait .cp-g3-verdict-icon{background:var(--theme-surface);color:var(--campus-neutral);}
.cp-g3-verdict.is-other{background:var(--campus-neutral-wash);color:var(--theme-muted);border:1.5px solid var(--campus-neutral-soft);}
.cp-g3-verdict.is-other .cp-g3-verdict-icon{background:var(--theme-surface);color:var(--campus-neutral);}

/* —— 涨跌胶囊:向好是渐变实底、变差是中性灰描边;箭头是 SVG —— */
.cp-g3-delta{flex:none;display:inline-flex;align-items:center;gap:6px;height:36px;padding:0 14px 0 10px;border-radius:999px;font-family:var(--theme-font-serif);font-weight:700;font-size:21px;line-height:1;white-space:nowrap;font-variant-numeric:lining-nums tabular-nums;}
.cp-g3-delta > svg{flex:none;display:block;}
.cp-g3-delta.is-good{background:var(--campus-fill);color:var(--theme-on-accent);box-shadow:0 6px 14px rgb(var(--theme-accent-rgb) / .26);}
.cp-g3-delta.is-good > svg{color:var(--campus-spark);}
.cp-g3-delta.is-bad{background:var(--campus-neutral-wash);color:var(--theme-muted);box-shadow:inset 0 0 0 1.5px var(--campus-neutral-soft);}
.cp-g3-delta.is-flat{background:var(--campus-accent-tint);color:var(--theme-accent);}

/* —— 汇总数字条:一排数字块,第一块是渐变底,其余白卡;数字衬线 —— */
.cp-g3-stats{flex:none;display:grid;grid-auto-flow:column;grid-auto-columns:minmax(0,1fr);gap:18px;}
.cp-g3-stat{position:relative;display:flex;align-items:center;gap:16px;min-width:0;padding:14px 22px;}
.cp-g3-stat-value{flex:none;font-family:var(--theme-font-serif);font-weight:700;font-size:44px;line-height:1;letter-spacing:.01em;color:var(--theme-accent);white-space:nowrap;font-variant-numeric:lining-nums;}
.cp-g3-stat-label{min-width:0;font-size:20px;line-height:1.3;color:var(--theme-muted);}
.cp-g3-stat.is-lead{border-radius:var(--campus-radius);color:var(--theme-on-accent);}
.cp-g3-stat.is-lead > .cp-g3-stat-shape{position:absolute;inset:0;z-index:-1;border-radius:inherit;background:var(--campus-fill-deep);box-shadow:var(--campus-shadow-lift);}
.cp-g3-stat.is-lead .cp-g3-stat-value{color:var(--theme-on-accent);}
.cp-g3-stat.is-lead .cp-g3-stat-label{color:var(--campus-on-accent-muted);}
.cp-g3-stat-orb{position:absolute;right:-14px;top:-26px;width:110px;height:110px;border-radius:50%;background:rgb(255 255 255 / .08);pointer-events:none;}
.cp-g3-stat.is-lead{isolation:isolate;overflow:hidden;}
.cp-g3-stat-tick{position:absolute;left:22px;bottom:9px;width:28px;height:3px;border-radius:2px;background:var(--campus-spark);}
.cp-g3-stats.is-compact .cp-g3-stat{padding:10px 18px;gap:12px;}
.cp-g3-stats.is-compact .cp-g3-stat-value{font-size:36px;}
.cp-g3-stats.is-compact .cp-g3-stat-label{font-size:19px;}

/* —— 右侧解读栏:栏目行 + 编号条目(可带一个大号数值,如「+0.12」) —— */
.cp-g3-ins{min-width:0;min-height:0;display:flex;flex-direction:column;padding:22px 26px 18px;}
.cp-g3-ins-list{flex:1;min-height:0;display:flex;flex-direction:column;justify-content:space-around;gap:6px;margin-top:10px;}
.cp-g3-ins-item{position:relative;display:grid;grid-template-columns:auto minmax(0,1fr);column-gap:16px;align-items:start;padding:14px 0 12px;}
.cp-g3-ins-item + .cp-g3-ins-item{border-top:1px dashed var(--campus-accent-line);}
.cp-g3-ins-item > .campus-seal{min-width:42px;height:42px;font-size:21px;margin-top:2px;}
.cp-g3-ins-main{min-width:0;}
.cp-g3-ins-head{display:flex;align-items:baseline;flex-wrap:wrap;gap:4px 14px;}
.cp-g3-ins-value{font-family:var(--theme-font-serif);font-weight:700;font-size:36px;line-height:1;color:var(--theme-accent);white-space:nowrap;font-variant-numeric:lining-nums;}
.cp-g3-ins-title{font-size:22px;line-height:1.35;font-weight:700;color:var(--theme-ink);}
.cp-g3-ins-text{margin-top:6px;font-size:20px;line-height:1.55;color:var(--theme-muted);text-wrap:pretty;}
.cp-g3-ins.is-compact .cp-g3-ins-item{padding:10px 0 8px;}
/* boxed:条目各自是一块浅校色面板,平分栏高 */
.cp-g3-ins-list.is-boxed{justify-content:stretch;gap:14px;margin-top:18px;}
.cp-g3-ins-list.is-boxed > .cp-g3-ins-item{flex:1 1 0;min-height:0;align-content:center;padding:16px 20px 16px 18px;border-radius:var(--campus-radius-sm);background:var(--campus-wash);}
.cp-g3-ins-list.is-boxed > .cp-g3-ins-item + .cp-g3-ins-item{border-top:0;}
.cp-g3-ins-list.is-boxed > .cp-g3-ins-item::after{content:'';position:absolute;right:18px;top:18px;width:8px;height:8px;border-radius:1px;background:var(--campus-accent-line);transform:rotate(45deg);}
.cp-g3-ins-list.is-boxed > .cp-g3-ins-item:first-child{background:linear-gradient(135deg,rgb(var(--theme-accent-rgb) / .07) 0%,rgb(var(--theme-accent-rgb) / .16) 100%);}
.cp-g3-ins-list.is-boxed > .cp-g3-ins-item:first-child::after{background:var(--campus-spark);}
.cp-g3-ins.is-compact .cp-g3-ins-text{font-size:19px;line-height:1.5;margin-top:4px;}
.cp-g3-ins.is-compact .cp-g3-ins-value{font-size:30px;}
`;

export function useDataStyle() {
  useThemeStyle('campus-g3-data-token-style', CAMPUS_G3_DATA_CSS);
  useThemeStyle('campus-g3-data-kit-style', DATA_CSS);
}

/** 数值 → 固定小数位的文本(小数位 0–4)。 */
export const formatNumber = (value, decimals = 2) => safeNumber(value, 0).toFixed(clamp(Math.round(safeNumber(decimals, 2)), 0, 4));

/**
 * 超长数值的紧凑写法:绝对值 ≥ 10 万时按中文习惯写成「万 / 亿」(万保留 1 位、亿保留 2 位小数),否则同 formatNumber。
 * 表格格子、坐标刻度、热力图方格放不下 9 位以上的数字,极端数据时用它避免溢出。
 */
export function compactNumber(value, decimals = 2) {
  const v = safeNumber(value, 0);
  const a = Math.abs(v);
  // 阈值按四舍五入后的值判断,99 999 999 写成 1.00亿 而不是 10000.0万
  if (a >= 0.99995e8) return `${(v / 1e8).toFixed(2)}亿`;
  if (a >= 1e5) return `${(v / 1e4).toFixed(1)}万`;
  return formatNumber(v, decimals);
}

/** 数量控件取值:四舍五入后钳在 [min, max]。 */
export const countOf = (value, min, max) => clamp(Math.round(safeNumber(value, min)), min, max);

/** 「好看」的步长:1 / 2 / 2.5 / 5 × 10^k,不小于 raw。 */
function niceStep(raw) {
  const r = Math.abs(safeNumber(raw, 1)) || 1;
  const magnitude = 10 ** Math.floor(Math.log10(safeDenominator(r, 1)));
  for (const unit of [1, 2, 2.5, 5, 10]) {
    if (unit * magnitude >= r - 1e-12) return unit * magnitude;
  }
  return 10 * magnitude;
}

/**
 * 坐标范围:按数据的最小 / 最大值取整格刻度。zero=true 时范围总包含 0(柱、损失曲线);
 * zero=false 时下限可以抬高(精度类曲线集中在 60–90 时不把线压扁)。返回 { min, max, ticks }。
 */
export function niceRange(values, { steps = 4, zero = true, pad = 0 } = {}) {
  const list = safeArray(values).map(v => safeNumber(v, 0));
  let lo = safeMin(list, 0);
  let hi = safeMax(list, 1);
  // pad:数据上下各留出数据跨度的这一比例(曲线端点不压在坐标轴 / 顶线上);强制含 0 的一侧不留
  const margin = Math.max(0, safeNumber(pad, 0)) * (hi - lo);
  if (margin > 0) {
    if (!(zero && lo >= 0)) lo -= margin;
    if (!(zero && hi <= 0)) hi += margin;
  }
  if (zero) { lo = Math.min(lo, 0); hi = Math.max(hi, 0); }
  if (hi - lo <= 0) {
    const pad = Math.abs(hi) > 0 ? Math.abs(hi) * 0.5 : 1;
    hi += pad;
    if (!zero || lo < 0) lo -= pad;
  }
  const count = Math.max(2, Math.round(safeNumber(steps, 4)));
  const step = niceStep((hi - lo) / count);
  const min = Math.floor(lo / step + 1e-9) * step;
  const max = Math.ceil(hi / step - 1e-9) * step;
  const n = clamp(Math.round((max - min) / step), 1, 12);
  // 刻度需要的小数位:让步长成为整数的最小位数(0–4)
  let decimals = 0;
  while (decimals < 4 && Math.abs(step * 10 ** decimals - Math.round(step * 10 ** decimals)) > 1e-6) decimals += 1;
  const fmt = v => Number(v.toFixed(decimals));
  const ticks = Array.from({ length: n + 1 }, (_, i) => fmt(min + i * step));
  // labels:刻度文字统一小数位(「1.0」「1.2」,不是「1」「1.2」)
  return { min: fmt(min), max: fmt(min + n * step), ticks, decimals, labels: ticks.map(t => t.toFixed(decimals)) };
}

/**
 * 每列最优值的行下标集合:better='high' 取最大、'low' 取最小,其他取值不标。
 * rows 是对象数组,keys 是每列读取的字段名(与 better 一一对应)。
 */
export function bestRows(rows, keys, betters) {
  const list = safeArray(rows);
  return safeArray(keys).map((key, c) => {
    const better = safeArray(betters)[c];
    if ((better !== 'high' && better !== 'low') || !list.length) return new Set();
    const values = list.map(row => safeNumber(row?.[key], 0));
    const target = better === 'low' ? safeMin(values, 0) : safeMax(values, 0);
    return new Set(values.map((v, i) => (v === target ? i : -1)).filter(i => i >= 0));
  });
}

/** 关键行(完整模型、本文方法、核心解释变量)左缘的渐变竖条,放在 position:relative 的行里。 */
export function KeyBar() {
  return <div className="cp-g3-keybar" aria-hidden="true" />;
}

/** 关键行名前的点缀色星标。 */
export function KeyStar({ size = 18 }) {
  return <SparkStar size={size} className="cp-g3-keystar" />;
}

/** 表注:点缀色小菱形 + 一行注释(text 是页面 props 里的文案)。 */
export function TableFoot({ text, className = '', style }) {
  useDataStyle();
  if (!text) return null;
  return (
    <div className={`cp-g3-foot ${className}`} style={style}>
      <div className="campus-mark is-spark" aria-hidden="true" />
      <p>{text}</p>
    </div>
  );
}

/** 模块开关标记:on=true 渐变圆片 + 白勾,否则虚线空圈 + 短横。纯图形,不是文字。 */
export function CheckDot({ on, size = 36, className = '', style }) {
  useDataStyle();
  const icon = Math.round(size * 0.52);
  return (
    <div className={`cp-g3-check ${on ? 'is-on' : 'is-off'} ${className}`} style={{ width: size, height: size, ...style }} aria-hidden="true">
      {on ? (
        <svg width={icon} height={icon} viewBox="0 0 18 18">
          <path d="M3.5 9.5 L7.5 13.2 L14.5 5" stroke="currentColor" strokeWidth="2.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : null}
    </div>
  );
}

/** 测试结论词表:徽标显示 props 里写的字,外观按这张表对应;词表以外的写法显示为中性灰。 */
export const VERDICT_WORDS = Object.freeze({
  pass: ['通过', '已通过', '正常', '符合预期', '成功', 'pass', 'PASS'],
  fail: ['未通过', '不通过', '失败', '异常', '不符合', 'fail', 'FAIL'],
  wait: ['待测', '待测试', '未测', '待复测', '跳过', 'pending'],
});
export const VERDICT_HINT = `结论列按词表显示外观——通过:${VERDICT_WORDS.pass.join(' / ')};未通过:${VERDICT_WORDS.fail.join(' / ')};待测:${VERDICT_WORDS.wait.join(' / ')};词表以外的写法显示为中性灰。`;

export function verdictKind(value) {
  const text = String(value ?? '').trim();
  for (const kind of ['pass', 'fail', 'wait']) {
    if (VERDICT_WORDS[kind].includes(text)) return kind;
  }
  return 'other';
}

function VerdictIcon({ kind }) {
  if (kind === 'pass') {
    return <svg width="16" height="16" viewBox="0 0 18 18"><path d="M3.5 9.5 L7.5 13.2 L14.5 5" stroke="currentColor" strokeWidth="2.8" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>;
  }
  if (kind === 'fail') {
    return <svg width="14" height="14" viewBox="0 0 16 16"><path d="M4 4 L12 12 M12 4 L4 12" stroke="currentColor" strokeWidth="2.8" fill="none" strokeLinecap="round" /></svg>;
  }
  if (kind === 'wait') {
    return <svg width="18" height="18" viewBox="0 0 18 18"><circle cx="9" cy="9" r="6.5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeDasharray="3 3" /></svg>;
  }
  return <svg width="12" height="12" viewBox="0 0 12 12"><circle cx="6" cy="6" r="4" fill="currentColor" /></svg>;
}

/** 测试结论徽标:label 是 props 里的结论文字(可编辑),外观按 VERDICT_WORDS 决定。 */
export function VerdictBadge({ label, className = '', style }) {
  useDataStyle();
  const kind = verdictKind(label);
  return (
    <div className={`cp-g3-verdict is-${kind} ${className}`} style={style}>
      <div className="cp-g3-verdict-icon" aria-hidden="true"><VerdictIcon kind={kind} /></div>
      <div>{label}</div>
    </div>
  );
}

/** 上 / 下箭头(纯装饰)。 */
export function TrendArrow({ dir = 'up', size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" aria-hidden="true">
      <g transform={dir === 'down' ? 'rotate(180 8 8)' : undefined}>
        <path d="M8 13.5 V3" stroke="currentColor" strokeWidth="2.6" fill="none" strokeLinecap="round" />
        <path d="M3.5 7.2 L8 2.7 L12.5 7.2" stroke="currentColor" strokeWidth="2.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </svg>
  );
}

/**
 * 涨跌胶囊:text 是显示的变化量(如「-62.2%」),dir 取 up / down / flat 决定箭头,
 * good 决定外观(向好渐变实底,变差中性灰)。
 */
export function DeltaPill({ text, dir = 'up', good = true, className = '', style }) {
  useDataStyle();
  const kind = dir === 'flat' ? 'is-flat' : good ? 'is-good' : 'is-bad';
  return (
    <div className={`cp-g3-delta ${kind} ${className}`} style={style}>
      {dir !== 'flat' ? <TrendArrow dir={dir} size={16} /> : null}
      <div>{text}</div>
    </div>
  );
}

/** 汇总数字条:items = [{ value, label }],第一项是渐变底的主数字。 */
export function StatStrip({ items = [], compact = false, className = '', style, itemClassName = '', itemStyle }) {
  useDataStyle();
  return (
    <div className={`cp-g3-stats${compact ? ' is-compact' : ''} ${className}`} style={style}>
      {safeArray(items).map((item, i) => (
        <div className={`cp-g3-stat${i === 0 ? ' is-lead' : ' campus-card'} ${itemClassName}`} style={typeof itemStyle === 'function' ? itemStyle(i) : itemStyle} key={i}>
          {i === 0 && <div className="cp-g3-stat-shape" aria-hidden="true" />}
          {i === 0 && <div className="cp-g3-stat-orb" aria-hidden="true" />}
          {i === 0 && <div className="cp-g3-stat-tick" aria-hidden="true" />}
          <div className="cp-g3-stat-value">{item?.value}</div>
          <div className="cp-g3-stat-label">{item?.label}</div>
        </div>
      ))}
    </div>
  );
}

/**
 * value 只是这一条的序号(「01」「1」「02」「No.1」「#1」…,与左侧编号块重复)时视为没写:
 * agent 常把 value 填成序号,渲染出来是「01 01 标题」。value 本意是这条结论的关键数字(0.82、+3.1%)。
 */
export function isSeqValue(value, index) {
  const m = /^(?:no\.?\s*|#)?0*(\d{1,3})[.、)）]?$/i.exec(String(value ?? '').trim());
  return Boolean(m) && Number(m[1]) === index + 1;
}

/**
 * 解读栏的条目列表(不含外框):items = [{ value, title, text }],value / title 可空。
 * 编号用浅底编号块(01、02…),value 是大号衬线数字(如模块带来的提升);value 为空或只是本条序号时不画,标题顶到它的位置。
 */
export function InsightItems({ items = [], delay = 0, enter, boxed = false }) {
  useDataStyle();
  return (
    <div className={`cp-g3-ins-list${boxed ? ' is-boxed' : ''}`}>
      {safeArray(items).map((item, i) => {
        const value = isSeqValue(item?.value, i) ? null : item?.value;
        return (
        <div className="cp-g3-ins-item campus-fade" style={enter ? enter(delay + i) : undefined} key={i}>
          <div className={`campus-seal${i === 0 ? '' : ' is-soft'}`}>{String(i + 1).padStart(2, '0')}</div>
          <div className="cp-g3-ins-main">
            {(value || item?.title) ? (
              <div className="cp-g3-ins-head">
                {value ? <div className="cp-g3-ins-value">{value}</div> : null}
                {item?.title ? <div className="cp-g3-ins-title">{item.title}</div> : null}
              </div>
            ) : null}
            {item?.text ? <p className="cp-g3-ins-text">{item.text}</p> : null}
          </div>
        </div>
        );
      })}
    </div>
  );
}
