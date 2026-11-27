// campus 的「事务与论证」部件(g4 组):开题 / 申报 / 结题与经管类研究内容页共用。
// 进度安排表、成果清单、预期成果、可行性分析、经费预算、负责人 + 骨干、配图时间轴、案例分析、问题—原因—对策。
//
// 与其他 kit 一样只读 token;装饰形状(竖向时间线节点、箭头色带、勾选章、迷你进度条)画在不含文字的元素上,
// 编号、标签、数值都是独立的块级文本元素,导出 PPTX 时仍是可编辑文本。
// 类名一律以 cp-g4- 开头(组前缀),页面私有类再接页面缩写(cp-g4-sch-…)。
// 页面在自己的 useThemeStyle 之前调用 useAffairsStyle(),保证注入顺序「kit → 页面」,同优先级时页面覆盖 kit。
import React from 'react';
import { useThemeStyle } from '../../../shared/style.jsx';
import { safeNumber, safeArray, clamp } from '../../../chart-safety.mjs';
import { CheckGlyph as SharedCheckGlyph } from './feature-a.jsx';

const AFFAIRS_CSS = `
/* —— 小标签:实心(渐变)/ 浅校色 / 描边三种,文字各自独立成块 —— */
.cp-g4-tags{display:flex;flex-wrap:wrap;gap:8px;}
.cp-g4-tag{display:inline-flex;align-items:center;height:30px;padding:0 12px;border-radius:7px;font-size:18px;line-height:1;font-weight:700;letter-spacing:.04em;white-space:nowrap;background:var(--campus-accent-tint);color:var(--theme-accent);}
.cp-g4-tag.is-solid{background:var(--campus-fill);color:var(--theme-on-accent);box-shadow:0 4px 10px rgb(var(--theme-accent-rgb) / .22);}
.cp-g4-tag.is-line{background:transparent;color:var(--theme-muted);border:1.5px solid var(--campus-neutral-soft);}

/* —— 迷你进度条:浅灰底槽 + 渐变填充,右端一颗白点 —— */
.cp-g4-bar{position:relative;height:10px;border-radius:5px;background:var(--campus-neutral-wash);border:1px solid var(--theme-line);}
.cp-g4-bar-fill{position:absolute;left:0;top:0;bottom:0;border-radius:5px;background:var(--campus-fill);}
.cp-g4-bar-fill.is-soft{background:var(--campus-fill-soft);}
.cp-g4-bar-fill.is-gray{background:var(--campus-neutral);}

/* —— 竖向时间线节点:已完成(渐变实心 + 勾)/ 当前(放大 + 点缀色外环 + 柔光)/ 未开始(空心虚线圈) —— */
.cp-g4-node{position:relative;flex:none;display:grid;place-items:center;border-radius:50%;}
.cp-g4-node.is-done{width:34px;height:34px;background:var(--campus-fill);color:var(--theme-on-accent);box-shadow:0 6px 14px rgb(var(--theme-accent-rgb) / .28);}
.cp-g4-node.is-current{width:46px;height:46px;background:var(--campus-fill-deep);color:var(--theme-on-accent);box-shadow:0 0 0 6px var(--theme-surface),0 0 0 9px var(--campus-spark),0 10px 26px rgb(var(--theme-accent-rgb) / .4);}
.cp-g4-node.is-todo{width:32px;height:32px;background:var(--theme-surface);border:2.5px solid var(--campus-accent-line);}
.cp-g4-node-core{width:12px;height:12px;border-radius:50%;background:var(--theme-surface);}
.cp-g4-node.is-todo .cp-g4-node-core{width:10px;height:10px;background:var(--campus-accent-tint);}
.cp-g4-node-no{font-family:var(--theme-font-serif);font-weight:700;font-size:17px;line-height:1;font-variant-numeric:lining-nums;}
.cp-g4-node.is-current .cp-g4-node-no{font-size:22px;}
.cp-g4-node.is-todo .cp-g4-node-no{color:var(--campus-accent-soft);}

/* —— 箭头色带:列头用的右向箭头形状(clip-path,不含文字),三档权重:中性灰 / 浅校色 / 校色渐变 —— */
.cp-g4-chev{position:absolute;inset:0;z-index:-1;clip-path:polygon(0 0,calc(100% - 26px) 0,100% 50%,calc(100% - 26px) 100%,0 100%,22px 50%);}
.cp-g4-chev.is-first{clip-path:polygon(0 0,calc(100% - 26px) 0,100% 50%,calc(100% - 26px) 100%,0 100%);border-radius:var(--campus-radius-sm) 0 0 var(--campus-radius-sm);}
.cp-g4-chev.is-last{clip-path:polygon(0 0,100% 0,100% 100%,0 100%,22px 50%);border-radius:0 var(--campus-radius-sm) var(--campus-radius-sm) 0;}
.cp-g4-chev.is-neutral{background:linear-gradient(135deg,var(--campus-neutral-soft) 0%,color-mix(in srgb,var(--campus-neutral-soft) 55%,transparent) 100%);}
.cp-g4-chev.is-soft{background:linear-gradient(135deg,rgb(var(--theme-accent-rgb) / .2) 0%,rgb(var(--theme-accent-rgb) / .34) 100%);}
.cp-g4-chev.is-solid{background:var(--campus-fill-deep);}

/* —— 勾选章:小圆 + 勾(「已具备」「已完成」等徽标里用) —— */
.cp-g4-check{flex:none;display:grid;place-items:center;border-radius:50%;}

/* —— 角标水印数字:卡片右上角的浅色大号衬线数字 —— */
.cp-g4-ghost{position:absolute;pointer-events:none;font-family:var(--theme-font-serif);font-weight:700;line-height:1;color:rgb(var(--theme-accent-rgb) / .08);font-variant-numeric:lining-nums;white-space:nowrap;}

`;

export function useAffairsStyle() {
  useThemeStyle('campus-g4-affairs-kit-style', AFFAIRS_CSS);
}

/** 勾(纯装饰):与特色页 A 组共用同一枚(kit/feature-a.jsx 的 CheckGlyph,线宽 2.8),这里转出并保留本组的默认尺寸。 */
export function CheckGlyph({ size = 16 }) {
  return <SharedCheckGlyph size={size} />;
}

/** 右向箭头(纯装饰,行内两格之间的连接)。 */
export function ArrowGlyph({ size = 26, stroke = 3 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 26 26" aria-hidden="true">
      <path d="M4 13 H20" stroke="currentColor" strokeWidth={stroke} fill="none" strokeLinecap="round" />
      <path d="M14 6.5 L21 13 L14 19.5" stroke="currentColor" strokeWidth={stroke} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** 标签组:tags 是字符串数组,第一枚可用实心;每枚标签是独立文本块。 */
export function TagRow({ tags, solidFirst = true, max = 4, className = '', style }) {
  useAffairsStyle();
  const list = safeArray(tags).filter(t => t != null && String(t).trim() !== '').slice(0, max);
  if (!list.length) return null;
  return (
    <div className={`cp-g4-tags ${className}`} style={style}>
      {list.map((tag, i) => (
        <div className={`cp-g4-tag${solidFirst && i === 0 ? ' is-solid' : ''}`} key={i}>{tag}</div>
      ))}
    </div>
  );
}

/** 迷你进度条:value 为 0–100;tone 取 'solid' | 'soft' | 'gray'。 */
export function MiniBar({ value, tone = 'solid', className = '', style }) {
  useAffairsStyle();
  const pct = clamp(safeNumber(value, 0), 0, 100);
  return (
    <div className={`cp-g4-bar ${className}`} style={style} aria-hidden="true">
      <div className={`cp-g4-bar-fill${tone === 'soft' ? ' is-soft' : tone === 'gray' ? ' is-gray' : ''}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

/**
 * 竖向时间线节点:state 取 'done' | 'current' | 'todo'。
 * 已完成显示勾;当前 / 未开始显示 label(序号,独立文本块),没有 label 时显示一个小圆点。
 */
export function RailNode({ state = 'todo', label, className = '', style }) {
  useAffairsStyle();
  const kind = ['done', 'current', 'todo'].includes(state) ? state : 'todo';
  const hasLabel = label != null && String(label) !== '';
  return (
    <div className={`cp-g4-node is-${kind} ${className}`} style={style}>
      {kind === 'done'
        ? <CheckGlyph size={17} />
        : hasLabel ? <div className="cp-g4-node-no">{label}</div> : <div className="cp-g4-node-core" aria-hidden="true" />}
    </div>
  );
}

/** 箭头色带的形状层(放在 position:relative 的列头里,文字是列头里的兄弟元素)。 */
export function ChevronShape({ tone = 'solid', first = false, last = false }) {
  useAffairsStyle();
  return <div className={`cp-g4-chev is-${tone}${first ? ' is-first' : ''}${last ? ' is-last' : ''}`} aria-hidden="true" />;
}

/**
 * 金额显示:按一组数值里出现的最多小数位(上限 2 位)统一格式化,千分位用逗号。
 * 例:[12, 8.5] → 1 位小数,显示 12.0 / 8.5。
 */
export function amountDecimals(values) {
  let d = 0;
  for (const v of safeArray(values)) {
    const n = safeNumber(v, 0);
    const s = String(Math.round(Math.abs(n) * 100) / 100);
    const dot = s.indexOf('.');
    if (dot >= 0) d = Math.max(d, s.length - dot - 1);
  }
  return clamp(d, 0, 2);
}
export function formatAmount(value, decimals = 0) {
  const n = safeNumber(value, 0);
  const fixed = (Math.round(n * 100) / 100).toFixed(clamp(decimals, 0, 2));
  const [int, frac] = fixed.split('.');
  const sign = int.startsWith('-') ? '-' : '';
  const digits = sign ? int.slice(1) : int;
  const grouped = digits.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `${sign}${grouped}${frac ? `.${frac}` : ''}`;
}

/**
 * 占比色阶:第 i 个(0 起)扇区 / 科目的颜色,n 个里从校色实色逐级变浅,不引入第二种彩色。
 * 第 0 个返回 null,由调用方用渐变 token(--campus-fill)。
 */
export function shareTone(i, n) {
  const count = Math.max(1, Math.round(safeNumber(n, 1)));
  const idx = clamp(Math.round(safeNumber(i, 0)), 0, count - 1);
  const alpha = count <= 1 ? 1 : 1 - (idx / (count - 1)) * 0.8;
  return `rgb(var(--theme-accent-rgb) / ${Math.round(alpha * 100) / 100})`;
}
