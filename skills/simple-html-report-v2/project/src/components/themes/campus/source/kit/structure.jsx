// campus 的「结构图与事务表」部件:状态徽标、事务表格骨架、链路箭头、推荐标记、引号。
// 供分层架构、树状结构、状态表、方案矩阵、文献综述表、评审意见、流程链等页面共用。
//
// 与 parts.jsx 一样只读 token;装饰形状(箭头、引号、等级刻度)画在不含文字的元素上,
// 徽标与表头里的文字是独立的块级文本元素,导出 PPTX 时仍是可编辑文本。
// 页面要在自己的 useThemeStyle 之前调用 useStructureStyle(),保证注入顺序「kit → 页面」,同优先级时页面覆盖 kit。
import React from 'react';
import { useThemeStyle } from '../../../shared/style.jsx';
import { SparkStar } from './chrome.jsx';

// 小星标统一用 chrome.jsx 的那一枚;这里转出,structure 组页面原有的引用不变。
export { SparkStar };

const STRUCTURE_CSS = `
/* 表格舞台:占满正文剩余高度,表格本身按行数封顶高度后纵向居中(行少时不把每行拉得过高) */
.campus-xt-stage{flex:1;min-height:0;display:flex;flex-direction:column;justify-content:center;}
.campus-xt-stage > .campus-xt{flex:1 1 auto;}
/* —— 事务表格骨架:白卡里放渐变表头 + 斑马行;列宽由页面经 --cp-xt-cols 给出 —— */
.campus-xt{position:relative;display:flex;flex-direction:column;min-height:0;}
.campus-xt-head{flex:none;position:relative;display:grid;grid-template-columns:var(--cp-xt-cols);min-height:60px;background:var(--campus-fill-deep);color:var(--theme-on-accent);border-radius:var(--campus-radius) var(--campus-radius) 0 0;}
.campus-xt-th{position:relative;display:flex;align-items:center;gap:10px;min-width:0;padding:0 24px;font-size:22px;line-height:1.3;font-weight:700;letter-spacing:.1em;}
.campus-xt-th + .campus-xt-th::before{content:'';position:absolute;left:0;top:18px;bottom:18px;width:1px;background:var(--campus-on-accent-line);}
.campus-xt-th.is-center{justify-content:center;padding:0 8px;text-align:center;}
.campus-xt-body{flex:1;min-height:0;display:flex;flex-direction:column;}
.campus-xt-row{position:relative;flex:1 1 auto;min-height:0;display:grid;grid-template-columns:var(--cp-xt-cols);border-top:1px solid var(--theme-line);}
.campus-xt-row:first-child{border-top:0;}
.campus-xt-row.is-zebra{background:var(--campus-accent-wash);}
.campus-xt-row:last-child{border-radius:0 0 var(--campus-radius) var(--campus-radius);}
.campus-xt-td{display:flex;align-items:center;gap:14px;min-width:0;padding:12px 24px;font-size:22px;line-height:1.5;color:var(--theme-ink);text-wrap:pretty;}
.campus-xt-td + .campus-xt-td{border-left:1px dashed var(--theme-line);}
.campus-xt-td.is-center{justify-content:center;text-align:center;}
.campus-xt-td.is-muted{color:var(--theme-muted);}
/* 表头前的点缀色小菱形 */
.campus-xt-mark{flex:none;width:8px;height:8px;border-radius:1px;background:var(--campus-spark);transform:rotate(45deg);}

/* —— 状态徽标:状态取闭合选项,只用校色深浅、中性灰和点缀色区分 —— */
.campus-state{flex:none;display:inline-flex;align-items:center;gap:9px;height:42px;padding:0 18px 0 8px;border-radius:999px;font-size:20px;line-height:1;font-weight:700;letter-spacing:.06em;white-space:nowrap;}
.campus-state-icon{flex:none;width:28px;height:28px;border-radius:50%;display:grid;place-items:center;}
.campus-state-text{white-space:nowrap;}
.campus-state.is-done{background:var(--campus-fill);color:var(--theme-on-accent);box-shadow:0 6px 14px rgb(var(--theme-accent-rgb) / .22);}
.campus-state.is-done .campus-state-icon{background:var(--campus-on-accent-glass);}
.campus-state.is-over{background:var(--campus-fill-deep);color:var(--theme-on-accent);box-shadow:0 8px 18px rgb(var(--theme-accent-rgb) / .3);}
.campus-state.is-over .campus-state-icon{background:var(--theme-surface);color:var(--campus-spark);}
.campus-state.is-doing{background:var(--campus-accent-tint);color:var(--theme-accent);}
.campus-state.is-doing .campus-state-icon{background:var(--theme-surface);}
.campus-state.is-todo{background:var(--campus-neutral-wash);color:var(--theme-muted);border:1.5px solid var(--campus-neutral-soft);}
.campus-state.is-todo .campus-state-icon{background:var(--theme-surface);color:var(--campus-neutral);}
.campus-state.is-high{background:var(--campus-fill-deep);color:var(--theme-on-accent);box-shadow:0 8px 18px rgb(var(--theme-accent-rgb) / .3);}
.campus-state.is-high .campus-state-icon,.campus-state.is-mid .campus-state-icon,.campus-state.is-low .campus-state-icon{border-radius:8px;}
.campus-state.is-high .campus-state-icon{background:var(--campus-on-accent-glass);}
.campus-state.is-mid{background:var(--campus-accent-tint);color:var(--theme-accent);}
.campus-state.is-mid .campus-state-icon{background:var(--theme-surface);}
.campus-state.is-low{background:var(--campus-neutral-wash);color:var(--theme-muted);border:1.5px solid var(--campus-neutral-soft);}
.campus-state.is-low .campus-state-icon{background:var(--theme-surface);}
/* 词表以外的写法:中性灰底 + 灰色实心小圆点(不借用「未开始」的虚线圈,避免把未知状态读成未开始) */
.campus-state.is-other{background:var(--campus-neutral-wash);color:var(--theme-muted);border:1.5px solid var(--campus-neutral-soft);}
.campus-state.is-other .campus-state-icon{background:var(--theme-surface);color:var(--campus-neutral);}

/* —— 推荐 / 重点标记:渐变小旗 + 点缀色星标 —— */
.campus-pick{flex:none;display:inline-flex;align-items:center;gap:6px;height:32px;padding:0 14px 0 10px;border-radius:8px 8px 8px 2px;background:var(--campus-fill);color:var(--theme-on-accent);box-shadow:0 6px 14px rgb(var(--theme-accent-rgb) / .28);font-size:18px;line-height:1;font-weight:700;letter-spacing:.08em;white-space:nowrap;}
.campus-pick-star{flex:none;display:block;color:var(--campus-spark);}

/* —— 链路圆钮:渐变圆片里一枚白色箭头(流程链、层间连接) —— */
.campus-link-dot{flex:none;display:grid;place-items:center;border-radius:50%;background:var(--campus-fill);color:var(--theme-on-accent);box-shadow:0 6px 14px rgb(var(--theme-accent-rgb) / .28);}
.campus-link-dot > svg{display:block;}
`;

export function useStructureStyle() {
  useThemeStyle('campus-structure-kit-style', STRUCTURE_CSS);
}

/** 状态徽标的七种外观:完成度四种 + 风险等级三种;词表以外的写法用第八种中性灰 other。 */
export const STATE_KINDS = Object.freeze(['done', 'over', 'doing', 'todo', 'high', 'mid', 'low']);

/**
 * 状态词表:徽标上显示的就是 props 里写的状态文字(所见即所填),外观按这张闭合词表对应到七种之一;
 * 也接受 STATE_KINDS 里的英文取值。词表之外的写法显示成中性灰(other),不报错。
 * 改这张表时同步 docs/theme-standard.md 与 SKILL.md 里的词表,以及 StatusTable 的控件说明。
 */
export const STATE_WORDS = Object.freeze({
  done: ['已完成', '完成', '已达成', '达成', '已实现', '通过', '已结题', '已发表', '已录用'],
  over: ['超额完成', '超额', '超额达成', '提前完成', '超出预期'],
  doing: ['进行中', '推进中', '在研', '部分完成', '已启动', '待发表', '在投'],
  todo: ['未开始', '待开展', '计划中', '待启动', '未完成'],
  high: ['高', '高风险', '较高', '严重'],
  mid: ['中', '中风险', '中等', '一般'],
  low: ['低', '低风险', '较低', '轻微'],
});

const STATE_GROUP_NAMES = Object.freeze({ done: '完成', over: '超额', doing: '进行中', todo: '未开始', high: '风险高', mid: '风险中', low: '风险低' });
/** 词表的一句话说明(页面控件说明直接引用,保证和 STATE_WORDS 一致)。 */
export const STATE_WORDS_HINT = `徽标外观按状态词表自动对应——${STATE_KINDS.map(kind => `${STATE_GROUP_NAMES[kind]}:${STATE_WORDS[kind].join(' / ')}`).join(';')};词表以外的写法显示为中性灰。`;

/** 把状态文字(或英文取值)归一到 STATE_KINDS 之一。 */
export function stateKind(value) {
  const text = String(value ?? '').trim();
  const key = text.toLowerCase();
  if (STATE_KINDS.includes(key)) return key;
  const hit = STATE_KINDS.find(kind => STATE_WORDS[kind].includes(text));
  return hit || 'other';
}


/** 状态图标:完成(勾)、超额(星)、进行中(半圆)、未开始(空心圆)、风险等级(三格刻度,亮几格表示高中低)、词表外(灰色实心点)。 */
function StateIcon({ kind }) {
  if (kind === 'done') {
    return <svg width="16" height="16" viewBox="0 0 18 18"><path d="M3.5 9.5 L7.5 13.2 L14.5 5" stroke="currentColor" strokeWidth="2.8" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>;
  }
  if (kind === 'over') return <SparkStar size={17} />;
  if (kind === 'doing') {
    return (
      <svg width="20" height="20" viewBox="0 0 20 20">
        <circle cx="10" cy="10" r="7.5" fill="none" stroke="currentColor" strokeOpacity=".3" strokeWidth="2.5" />
        <path d="M10 2.5 A7.5 7.5 0 0 1 10 17.5 Z" fill="currentColor" />
      </svg>
    );
  }
  if (kind === 'other') {
    return <svg width="12" height="12" viewBox="0 0 12 12"><circle cx="6" cy="6" r="4" fill="currentColor" /></svg>;
  }
  if (kind === 'todo') {
    return <svg width="18" height="18" viewBox="0 0 18 18"><circle cx="9" cy="9" r="6.5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeDasharray="3 3" /></svg>;
  }
  const lit = kind === 'high' ? 3 : kind === 'mid' ? 2 : 1;
  return (
    <svg width="20" height="18" viewBox="0 0 20 18">
      {[0, 1, 2].map(i => (
        <rect key={i} x={1 + i * 6.5} y={12 - i * 5} width="5" height={5 + i * 5} rx="1.4" fill="currentColor" fillOpacity={i < lit ? 1 : 0.25} />
      ))}
    </svg>
  );
}

/**
 * 状态徽标:label 是页面 props 里的状态文字(可编辑),外观按 STATE_WORDS 词表决定(用户不写颜色);
 * 需要强制外观时可另传 state(STATE_KINDS 之一)。
 */
export function StateBadge({ label, state, className = '', style }) {
  useStructureStyle();
  const kind = stateKind(state ?? label);
  return (
    <div className={`campus-state is-${kind} ${className}`} style={style}>
      <div className="campus-state-icon" aria-hidden="true"><StateIcon kind={kind} /></div>
      <div className="campus-state-text">{label}</div>
    </div>
  );
}

/** 推荐 / 重点标记:渐变小旗 + 点缀色星标,label 是可编辑文案。 */
export function PickTag({ label, className = '', style }) {
  useStructureStyle();
  return (
    <div className={`campus-pick ${className}`} style={style}>
      <SparkStar size={15} className="campus-pick-star" />
      <div>{label}</div>
    </div>
  );
}

/** 箭头图形(纯装饰):direction 取 right / left / down / up。 */
export function ChainArrow({ direction = 'right', size = 22, className = '', style }) {
  const rotate = { right: 0, down: 90, left: 180, up: 270 }[direction] ?? 0;
  return (
    <svg className={className} style={style} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <g transform={`rotate(${rotate} 12 12)`}>
        <path d="M4 12 H18" stroke="currentColor" strokeWidth="2.8" fill="none" strokeLinecap="round" />
        <path d="M12.5 6 L19 12 L12.5 18" stroke="currentColor" strokeWidth="2.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </svg>
  );
}

/** 链路圆钮:渐变圆片 + 白色箭头(纯装饰)。 */
export function LinkDot({ direction = 'right', size = 40, className = '', style }) {
  useStructureStyle();
  return (
    <div className={`campus-link-dot ${className}`} style={{ width: size, height: size, ...style }} aria-hidden="true">
      <ChainArrow direction={direction} size={Math.round(size * 0.58)} />
    </div>
  );
}

/** 上下双向箭头(层间调用,纯装饰)。 */
export function DuplexArrow({ size = 26, className = '', style }) {
  return (
    <svg className={className} style={style} width={size * 0.7} height={size} viewBox="0 0 18 26" aria-hidden="true">
      <path d="M9 3 V23" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
      <path d="M3.5 8 L9 2.5 L14.5 8" stroke="currentColor" strokeWidth="2.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3.5 18 L9 23.5 L14.5 18" stroke="currentColor" strokeWidth="2.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** 引号(评语、引文前的装饰,纯装饰)。 */
export function QuoteGlyph({ size = 48, className = '', style }) {
  return (
    <svg className={className} style={style} width={size} height={size * 0.8} viewBox="0 0 40 32" aria-hidden="true">
      <path fill="currentColor" d="M0 32V19.6C0 9.3 5 2.8 14.8 0l2 4.2C11.4 6.3 8.8 9.8 8.6 15H16v17H0zm22.6 0V19.6C22.6 9.3 27.6 2.8 37.4 0l2 4.2c-5.4 2.1-8 5.6-8.2 10.8h7.4v17H22.6z" />
    </svg>
  );
}
