// campus 的卡片、图解与图表部件:序号卡片(6 种结构)、栏目行、编号条目卡、图表刻度 / 网格 / 图例、极坐标。
// 只读 token;图表的文字(刻度、图例、数值)一律是 HTML 文本,SVG 只画线和面,导出后文字仍可编辑。
//
// 序号卡片 NumberCard 的装饰形状(斜切、折角、书签、叠卡)都画在不含文字的元素上,编号和标题是单独的文本元素
// 叠在形状上面:导出 PPTX 时形状可以被转成图片,文字始终是可编辑文本。
import React from 'react';
import { useThemeStyle } from '../../../shared/style.jsx';
import { safeNumber, safeDenominator, clamp } from '../../../chart-safety.mjs';

const PARTS_CSS = `
/* —— 序号卡片:公共部分。白底大圆角,投影画在 ::before 上 —— */
.campus-ncard{position:relative;isolation:isolate;min-width:0;border-radius:var(--campus-radius);}
.campus-ncard::before{content:'';position:absolute;inset:0;z-index:-1;border-radius:inherit;background:var(--theme-surface);border:1px solid var(--campus-card-edge);box-shadow:var(--campus-shadow);pointer-events:none;}
.campus-ncard-no{font-family:var(--theme-font-serif);font-weight:700;line-height:1;font-variant-numeric:lining-nums;white-space:nowrap;}
.campus-ncard-title{position:relative;font-family:var(--theme-font-serif);font-weight:700;font-size:28px;line-height:1.3;letter-spacing:.03em;color:var(--theme-ink);text-wrap:balance;}
.campus-ncard-shape{position:absolute;pointer-events:none;}

/* 1. tab:卡片上沿伸出的渐变编号标签 + 右上角勾选标记;标题下一道短渐变线 */
.campus-ncard.is-tab{margin-top:20px;padding:40px 30px 26px;}
.campus-ncard-tab{position:absolute;top:-20px;left:26px;display:flex;align-items:center;height:42px;padding:0 18px;border-radius:12px 12px 12px 3px;background:var(--campus-fill);color:var(--theme-on-accent);box-shadow:0 8px 18px rgb(var(--theme-accent-rgb) / .3);}
.campus-ncard-tab .campus-ncard-no{font-size:24px;letter-spacing:.02em;}
.campus-ncard-check{position:absolute;top:18px;right:18px;width:32px;height:32px;border-radius:50%;display:grid;place-items:center;background:var(--campus-accent-tint);color:var(--theme-accent);}
.campus-ncard.is-tab > .campus-ncard-title{padding-right:36px;}
.campus-ncard.is-tab > .campus-ncard-title::after{content:'';display:block;width:40px;height:4px;margin-top:14px;border-radius:2px;background:var(--campus-fill);}

/* 2. corner:右上角斜边折角色块里放编号,色块越出卡边并带一个折痕小三角 */
.campus-ncard.is-corner{padding:30px 30px 26px;}
.campus-ncard-corner{position:absolute;top:0;right:-10px;width:118px;height:58px;display:flex;align-items:center;justify-content:center;padding-left:22px;color:var(--theme-on-accent);}
.campus-ncard-corner > .campus-ncard-shape{inset:0;z-index:-1;background:var(--campus-fill);border-radius:0 6px 0 0;clip-path:polygon(22% 0,100% 0,100% 100%,0 100%);}
.campus-ncard-corner-fold{position:absolute;top:58px;right:-10px;width:10px;height:10px;background:var(--campus-accent-lo);clip-path:polygon(0 0,100% 0,0 100%);}
.campus-ncard-corner .campus-ncard-no{font-size:28px;}
.campus-ncard.is-corner > .campus-ncard-title{padding-right:104px;}

/* 3. head:斜切渐变卡头(右下角切角),编号 + 竖线 + 标题 */
.campus-ncard.is-head{padding:0 0 24px;}
.campus-ncard-head{position:relative;display:flex;align-items:center;gap:18px;min-height:88px;padding:14px 30px 20px 24px;color:var(--theme-on-accent);}
.campus-ncard-head > .campus-ncard-shape{inset:0;z-index:-1;background:var(--campus-fill-deep);border-radius:var(--campus-radius) var(--campus-radius) 0 0;clip-path:polygon(0 0,100% 0,100% calc(100% - 22px),calc(100% - 30px) 100%,0 100%);}
.campus-ncard-head .campus-ncard-no{font-size:40px;}
.campus-ncard-head-rule{flex:none;width:1.5px;height:36px;background:var(--campus-on-accent-line);}
.campus-ncard-head .campus-ncard-title{color:var(--theme-on-accent);font-size:28px;}

/* 4. stack:渐变底板上叠一张斜切白卡,大编号压在右上角,底部右侧一枚圆形标记 */
.campus-ncard.is-stack{padding:64px 66px 92px 40px;}
.campus-ncard.is-stack::before{display:none;}
.campus-ncard-back{position:absolute;inset:0;z-index:-2;border-radius:var(--campus-radius-lg);background:var(--campus-fill-deep);box-shadow:var(--campus-shadow-lift);}
.campus-ncard-sheet{position:absolute;z-index:-1;top:40px;left:14px;right:48px;bottom:58px;background:var(--theme-surface);clip-path:polygon(0 0,calc(100% - 44px) 0,100% 44px,100% calc(100% - 16px),82px calc(100% - 16px),64px 100%,46px calc(100% - 16px),0 calc(100% - 16px));}
.campus-ncard.is-stack > .campus-ncard-no{position:absolute;top:10px;right:22px;font-size:54px;color:var(--theme-on-accent);}
.campus-ncard-orb{position:absolute;right:16px;bottom:12px;width:50px;height:50px;border-radius:50%;display:grid;place-items:center;background:var(--theme-surface);color:var(--theme-accent);box-shadow:0 0 0 6px rgb(255 255 255 / .22);}
.campus-ncard.is-stack > .campus-ncard-title{color:var(--theme-accent);}
.campus-ncard.is-stack > .campus-ncard-title::after{content:'';display:block;width:28px;height:4px;margin-top:12px;border-radius:2px;background:var(--campus-fill);}

/* 5. side:左侧悬挂的渐变书签(下端燕尾),编号写在书签上 */
.campus-ncard.is-side{padding:20px 30px 20px 108px;}
.campus-ncard-strip{position:absolute;top:-6px;left:20px;width:62px;height:min(calc(100% - 6px),112px);display:flex;align-items:flex-start;justify-content:center;padding-top:18px;color:var(--theme-on-accent);}
.campus-ncard-strip > .campus-ncard-shape{inset:0;z-index:-1;background:var(--campus-fill-bar);border-radius:6px 6px 0 0;clip-path:polygon(0 0,100% 0,100% 100%,50% calc(100% - 14px),0 100%);}
.campus-ncard-strip-fold{position:absolute;top:0;left:-6px;width:6px;height:6px;background:var(--campus-accent-lo);clip-path:polygon(100% 0,100% 100%,0 100%);}
.campus-ncard-strip .campus-ncard-no{font-size:28px;}

/* 6. ghost:右上角一枚浅色大编号作水印,顶边一小段渐变帽檐,标题前一道竖条 */
.campus-ncard.is-ghost{padding:32px 30px 26px;}
.campus-ncard-cap{position:absolute;top:0;left:30px;width:68px;height:6px;border-radius:0 0 4px 4px;background:var(--campus-fill);}
.campus-ncard.is-ghost > .campus-ncard-no{position:absolute;top:12px;right:22px;font-size:96px;color:rgb(var(--theme-accent-rgb) / .1);}
.campus-ncard.is-ghost > .campus-ncard-title{padding-left:20px;}
.campus-ncard.is-ghost > .campus-ncard-title::before{content:'';position:absolute;left:0;top:.2em;bottom:.2em;width:6px;border-radius:3px;background:var(--campus-fill-bar);}

/* 紧凑档:条目多、行高紧的时候 */
.campus-ncard.is-compact .campus-ncard-title{font-size:25px;}
.campus-ncard.is-compact.is-side{padding:14px 26px 14px 96px;}
.campus-ncard.is-compact .campus-ncard-strip{width:54px;left:18px;padding-top:14px;}
.campus-ncard.is-compact .campus-ncard-strip .campus-ncard-no{font-size:25px;}
.campus-ncard.is-compact.is-head .campus-ncard-head{min-height:76px;}
.campus-ncard.is-compact.is-ghost > .campus-ncard-no{font-size:80px;}

/* —— 编号条目卡(IndexCard):side 结构的条目,标题 + 说明 —— */
.campus-index-card-desc{margin-top:8px;font-size:22px;line-height:1.6;color:var(--theme-muted);text-wrap:pretty;}
.campus-index-card{display:flex;flex-direction:column;justify-content:flex-start;min-height:0;}
.campus-index-card.is-side{padding-top:26px;}
.campus-index-card.is-compact.is-side{padding-top:16px;}
.campus-index-card.is-compact .campus-index-card-desc{margin-top:4px;font-size:20px;line-height:1.5;}

/* —— 图表网格:横向刻度线 + 左侧刻度值(HTML) —— */
.campus-grid{position:absolute;inset:0;pointer-events:none;}
.campus-grid-line{position:absolute;left:0;right:0;height:1px;background:var(--theme-line);}
.campus-grid-line.is-base{height:2px;background:var(--campus-neutral);}
.campus-grid-tick{position:absolute;right:calc(100% + 14px);transform:translateY(-50%);font-family:var(--theme-font-serif);font-weight:700;font-size:18px;line-height:1;color:var(--theme-faint);white-space:nowrap;font-variant-numeric:lining-nums tabular-nums;}

/* —— 图例:色块 + 名称 —— */
.campus-legend{display:flex;align-items:center;flex-wrap:wrap;gap:10px 26px;}
.campus-legend-item{display:flex;align-items:center;gap:10px;}
.campus-legend-swatch{flex:none;width:22px;height:12px;border-radius:4px;}
.campus-legend-swatch.is-line{height:4px;border-radius:2px;}
.campus-legend-swatch.is-outline{border:1.5px solid var(--theme-accent);}
.campus-legend-swatch.is-dashed{height:0;background:none!important;border-top:4px dashed var(--cp-swatch);border-radius:0;}
.campus-legend-name{font-size:19px;line-height:1.2;color:var(--theme-muted);white-space:nowrap;}

/* —— 栏目行的附注 —— */
.campus-label-note{flex:none;order:2;font-size:18px;color:var(--theme-faint);white-space:nowrap;}
.campus-label-row.has-note::after{order:1;}
`;

export function usePartsStyle() {
  useThemeStyle('campus-parts-style', PARTS_CSS);
}

/** 勾选标记(tab 卡右上角)。 */
const CheckIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
    <path d="M3.5 9.5 L7.5 13.2 L14.5 5" stroke="currentColor" strokeWidth="2.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/** 斜向小箭头(stack 卡底部的圆形标记)。 */
const ArrowIcon = () => (
  <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden="true">
    <path d="M5 11 H16 M11.5 6 L16.5 11 L11.5 16" stroke="currentColor" strokeWidth="2.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/** 序号卡片的六种结构(kit 标准部件,页面按内容性质选用;一页之内用同一种)。 */
export const NUMBER_CARD_VARIANTS = Object.freeze(['tab', 'corner', 'head', 'stack', 'side', 'ghost']);

/**
 * 序号卡片。
 *   variant  'tab'    上沿伸出编号标签 + 右上勾选:并列要点、清单、问答
 *            'corner' 右上折角色块放编号:指标、案例、项目
 *            'head'   斜切渐变卡头(编号 + 标题):步骤、栏目、阶段
 *            'stack'  渐变底板叠斜切白卡 + 大编号:3–4 个重点主张、策略
 *            'side'   左侧悬挂书签:纵向条目、编号结论
 *            'ghost'  浅色大编号水印 + 帽檐:象限、对比、轻量信息块
 *   no / title  编号与标题(各自是独立的可编辑文本块);title 为空时不渲染标题
 *   check    tab 卡是否显示右上角勾选标记
 *   compact  条目多时的紧凑档
 * children 是卡片正文,直接排在标题后面(卡片本身可以作为 grid / subgrid 容器使用)。
 */
export function NumberCard({ variant = 'tab', no, title, check = true, compact = false, as: Tag = 'section', className = '', style, children }) {
  usePartsStyle();
  const kind = NUMBER_CARD_VARIANTS.includes(variant) ? variant : 'tab';
  const cls = `campus-ncard is-${kind}${compact ? ' is-compact' : ''} ${className}`;
  const titleEl = title ? <h3 className="campus-ncard-title">{title}</h3> : null;
  if (kind === 'head') {
    return (
      <Tag className={cls} style={style}>
        <div className="campus-ncard-head">
          <div className="campus-ncard-shape" aria-hidden="true" />
          {no ? <div className="campus-ncard-no">{no}</div> : null}
          {no && title ? <div className="campus-ncard-head-rule" aria-hidden="true" /> : null}
          {titleEl}
        </div>
        {children}
      </Tag>
    );
  }
  return (
    <Tag className={cls} style={style}>
      {kind === 'tab' && (
        <>
          <div className="campus-ncard-tab"><div className="campus-ncard-no">{no}</div></div>
          {check && <div className="campus-ncard-check" aria-hidden="true"><CheckIcon /></div>}
        </>
      )}
      {kind === 'corner' && (
        <>
          <div className="campus-ncard-corner">
            <div className="campus-ncard-shape" aria-hidden="true" />
            <div className="campus-ncard-no">{no}</div>
          </div>
          <div className="campus-ncard-corner-fold" aria-hidden="true" />
        </>
      )}
      {kind === 'stack' && (
        <>
          <div className="campus-ncard-back" aria-hidden="true" />
          <div className="campus-ncard-sheet" aria-hidden="true" />
          <div className="campus-ncard-no">{no}</div>
          <div className="campus-ncard-orb" aria-hidden="true"><ArrowIcon /></div>
        </>
      )}
      {kind === 'side' && (
        <div className="campus-ncard-strip">
          <div className="campus-ncard-shape" aria-hidden="true" />
          <div className="campus-ncard-strip-fold" aria-hidden="true" />
          <div className="campus-ncard-no">{no}</div>
        </div>
      )}
      {kind === 'ghost' && (
        <>
          <div className="campus-ncard-cap" aria-hidden="true" />
          <div className="campus-ncard-no">{no}</div>
        </>
      )}
      {titleEl}
      {children}
    </Tag>
  );
}

/** 栏目行:渐变(或浅底)胶囊标签 + 渐隐延伸线,可带一句右侧附注。 */
export function LabelRow({ label, note, soft = false, className = '', style }) {
  usePartsStyle();
  return (
    <div className={`campus-label-row has-line${note ? ' has-note' : ''} ${className}`} style={style}>
      <div className={`campus-chip${soft ? ' is-soft' : ''}`}>{label}</div>
      <div className="campus-label-line" aria-hidden="true" />
      {note ? <div className="campus-label-note">{note}</div> : null}
    </div>
  );
}

/** 编号条目卡:左侧悬挂书签式编号 + 标题 + 说明(side 结构的序号卡片)。compact 用在条目多、行高紧的时候。 */
export function IndexCard({ no, title, desc, compact = false, className = '', style }) {
  return (
    <NumberCard variant="side" no={no} title={title} compact={compact} className={`campus-index-card ${className}`} style={style}>
      {desc ? <p className="campus-index-card-desc">{desc}</p> : null}
    </NumberCard>
  );
}

/** 系列色阶:第 i 个系列 / 扇区的颜色 token(1 起,超出循环)。 */
export const toneVar = i => `var(--campus-tone-${(Math.max(0, Math.round(safeNumber(i, 0))) % 6) + 1})`;

/**
 * 「好看」的坐标上限与刻度:在 steps 与 steps + 1 格之间,挑能盖住最大值、又最贴近最大值的整格刻度
 * (步长取 1 / 2 / 2.5 / 3 / 4 / 5 / 6 / 8 × 10^k)。返回 { max, ticks },ticks 从 0 到 max。
 */
export function niceScale(maxValue, steps = 4) {
  const base = Math.max(2, Math.round(safeNumber(steps, 4)));
  const raw = Math.max(safeNumber(maxValue, 1), 0);
  if (raw <= 0) return { max: base, ticks: Array.from({ length: base + 1 }, (_, i) => i) };
  let best = null;
  for (const n of [base, base + 1]) {
    const rough = raw / n;
    const magnitude = 10 ** Math.floor(Math.log10(safeDenominator(rough, 1)));
    for (const unit of [1, 2, 2.5, 3, 4, 5, 6, 8, 10]) {
      const step = unit * magnitude;
      const top = step * n;
      if (top + 1e-9 < raw) continue;
      if (!best || top < best.top - 1e-9) best = { top, step, n };
      break;
    }
  }
  const decimals = clamp(-Math.floor(Math.log10(safeDenominator(best.step, 1)) + 1e-9) + 1, 0, 4);
  const fmt = value => Number(value.toFixed(decimals));
  return { max: fmt(best.top), ticks: Array.from({ length: best.n + 1 }, (_, i) => fmt(best.step * i)) };
}

/** 图表网格:放在 position:relative 的绘图区里;刻度值是 HTML 文本,画在绘图区左外侧。 */
export function ChartGrid({ ticks = [], max = 1, unit = '' }) {
  usePartsStyle();
  const top = safeDenominator(max, 1);
  return (
    <div className="campus-grid" aria-hidden="true">
      {ticks.map((tick, i) => {
        const y = clamp(100 - (safeNumber(tick, 0) / top) * 100, 0, 100);
        return (
          <React.Fragment key={i}>
            <div className={`campus-grid-line${i === 0 ? ' is-base' : ''}`} style={{ top: `${y}%` }} />
            <div className="campus-grid-tick" style={{ top: `${y}%` }}>{`${tick}${i === ticks.length - 1 && unit ? unit : ''}`}</div>
          </React.Fragment>
        );
      })}
    </div>
  );
}

/** 图例:items = [{ name, tone, shape: 'bar' | 'line' | 'dashed' | 'outline' }]。名称是页面 props 里的文案。 */
export function ChartLegend({ items = [], className = '', style }) {
  usePartsStyle();
  return (
    <div className={`campus-legend ${className}`} style={style}>
      {items.map((item, i) => (
        <div className="campus-legend-item" key={i}>
          <div
            className={`campus-legend-swatch${item.shape === 'line' ? ' is-line' : ''}${item.shape === 'dashed' ? ' is-dashed' : ''}${item.shape === 'outline' ? ' is-outline' : ''}`}
            style={{ background: item.tone, '--cp-swatch': item.tone }}
          />
          <div className="campus-legend-name">{item.name}</div>
        </div>
      ))}
    </div>
  );
}

/** 极坐标:圆心 (cx, cy)、半径 r、角度 deg(0 = 正上方,顺时针)→ 坐标,保留两位小数保证确定性。 */
export function polar(cx, cy, r, deg) {
  const rad = (safeNumber(deg, 0) - 90) * Math.PI / 180;
  return {
    x: Math.round((cx + r * Math.cos(rad)) * 100) / 100,
    y: Math.round((cy + r * Math.sin(rad)) * 100) / 100,
  };
}
