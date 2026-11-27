// 前后对比:左右两个图位(优化前 / 优化后),中间一列 2–4 个指标的变化(指标名 + 前值 → 后值 + 涨跌幅胶囊 + 前后对照细条);
// 底部结论条。图位空时左侧是中性灰底、右侧是浅校色底,仍读得出是一组对比。
// 涨跌幅按前后值自动计算,metrics[].better 决定变化是「向好」(渐变胶囊)还是「变差」(中性灰胶囊)。
// 指标名、数值、涨跌幅、图注都是 HTML 文本;箭头与细条是不含文字的图形。
import React from 'react';
import { useThemeStyle, enterDelay } from '../../../shared/style.jsx';
import { MediaSlot } from '../../../shared/MediaSlot.jsx';
import { safeArray, safeNumber, safeRatio, safeMax, clamp } from '../../../chart-safety.mjs';
import { CampusFrame, TitleRow, ConclusionBar, CHAPTER_CONTROL } from '../kit/chrome.jsx';
import { useDataStyle, countOf, formatNumber, compactNumber, DeltaPill } from '../kit/data.jsx';

const DEFAULTS = {
  chapterIndex: 3,
  imageCount: 2,
  metricCount: 3,
  showNotes: true,
  showConclusion: true,
  images: [],
  sectionNo: '3.7',
  title: '部署优化前后对比',
  beforeLabel: '优化前',
  beforeTitle: 'CentOS 单机部署',
  beforeNote: 'Tomcat、MySQL、MongoDB 运行在同一台服务器上',
  afterLabel: '优化后',
  afterTitle: 'Docker 容器化 + 负载均衡',
  afterNote: 'Nginx 把请求分发到 3 个 Tomcat 容器，数据库各自独立',
  metricsLabel: '关键指标变化',
  metricsNote: '压测结果 · 示例数据',
  metrics: [
    { name: '平均响应时间', before: 820, after: 310, unit: 'ms', better: 'low', decimals: 0 },
    { name: '最大并发用户数', before: 200, after: 650, unit: '人', better: 'high', decimals: 0 },
    { name: '一次部署耗时', before: 40, after: 8, unit: 'min', better: 'low', decimals: 0 },
    { name: '故障恢复时间', before: 15, after: 1, unit: 'min', better: 'low', decimals: 0 },
  ],
  conclusionLabel: '优化效果',
  conclusion: '容器化与负载均衡让响应时间降低六成、并发能力提升两倍多，部署从 40 分钟缩短到 8 分钟。',
};

const CSS = `
.cp-g3-ba{flex:1;min-height:0;display:grid;grid-template-columns:minmax(0,1fr) var(--cp-g3-ba-mid,480px) minmax(0,1fr);gap:24px;}
.campus[data-campus-nav="rail"] .cp-g3-ba{--cp-g3-ba-mid:420px;}
/* 单图:一张合成的前后对比图在左,指标列在右 */
.cp-g3-ba.is-single{grid-template-columns:minmax(0,1fr) var(--cp-g3-ba-mid,480px);}
.cp-g3-ba.is-single .cp-g3-ba-mid{order:2;}
.cp-g3-ba.is-single .cp-g3-ba-side{order:1;}
.cp-g3-ba-chip.is-from{background:var(--campus-neutral-wash)!important;color:var(--theme-muted)!important;box-shadow:inset 0 0 0 1.5px var(--campus-neutral-soft)!important;}
.cp-g3-ba-chip.is-from .cp-g3-ba-chip-dot{background:currentColor!important;opacity:.6!important;}
.cp-g3-ba-side{min-width:0;min-height:0;display:flex;flex-direction:column;padding:20px 22px 18px;}
.cp-g3-ba-head{flex:none;display:flex;align-items:center;gap:14px;min-width:0;margin-bottom:16px;}
.cp-g3-ba-chip{flex:none;display:flex;align-items:center;gap:8px;height:40px;padding:0 18px;border-radius:999px;font-size:20px;font-weight:700;letter-spacing:.08em;white-space:nowrap;}
.cp-g3-ba-side.is-before .cp-g3-ba-chip{background:var(--campus-neutral-wash);color:var(--theme-muted);box-shadow:inset 0 0 0 1.5px var(--campus-neutral-soft);}
.cp-g3-ba-side.is-after .cp-g3-ba-chip{background:var(--campus-fill);color:var(--theme-on-accent);box-shadow:0 6px 14px rgb(var(--theme-accent-rgb) / .26);}
.cp-g3-ba-chip-dot{flex:none;width:8px;height:8px;border-radius:50%;background:currentColor;opacity:.6;}
.cp-g3-ba-side.is-after .cp-g3-ba-chip-dot{background:var(--campus-spark);opacity:1;}
.cp-g3-ba-title{min-width:0;font-family:var(--theme-font-serif);font-size:25px;line-height:1.3;font-weight:700;color:var(--theme-ink);}
.cp-g3-ba-side.is-after .cp-g3-ba-title{color:var(--theme-accent);}
.cp-g3-ba-frame{position:relative;flex:1;min-height:0;}
.cp-g3-ba-side.is-before .media-slot:not(.is-filled){background:var(--campus-neutral-fill);box-shadow:inset 0 0 0 1.5px var(--campus-neutral-soft);}
.cp-g3-ba-side.is-before .media-slot:not(.is-filled) .media-slot-label{color:var(--theme-faint);}
.cp-g3-ba-side.is-after .cp-g3-ba-frame::after{content:'';position:absolute;inset:-3px;border-radius:calc(var(--campus-radius) + 3px);box-shadow:0 0 0 2px var(--campus-accent-line);pointer-events:none;}
.cp-g3-ba-note{flex:none;display:flex;align-items:flex-start;gap:10px;margin-top:14px;font-size:20px;line-height:1.45;color:var(--theme-muted);}
.cp-g3-ba-note .campus-mark{margin-top:8px;width:9px;height:9px;}
.cp-g3-ba-side.is-before .cp-g3-ba-note .campus-mark{background:var(--campus-neutral);}
/* 中间一列:标题 + 指标卡 */
.cp-g3-ba-mid{position:relative;min-width:0;min-height:0;display:flex;flex-direction:column;gap:14px;}
.cp-g3-ba-mid-head{flex:none;display:flex;flex-direction:column;align-items:center;gap:8px;padding-top:2px;}
.cp-g3-ba-mid-arrow{display:flex;align-items:center;justify-content:center;width:64px;height:64px;border-radius:50%;background:var(--campus-fill);color:var(--theme-on-accent);box-shadow:0 0 0 8px rgb(var(--theme-accent-rgb) / .1),var(--campus-shadow-lift);}
.cp-g3-ba-mid-arrow > svg{display:block;}
.cp-g3-ba-mid-label{font-family:var(--theme-font-serif);font-size:25px;font-weight:700;letter-spacing:.08em;color:var(--theme-ink);text-align:center;}
.cp-g3-ba-mid-note{font-size:18px;line-height:1.2;color:var(--theme-faint);text-align:center;}
.cp-g3-ba-list{flex:1;min-height:0;display:flex;flex-direction:column;justify-content:center;gap:14px;}
.cp-g3-ba-metric{flex:1 1 0;min-height:0;max-height:172px;display:flex;flex-direction:column;justify-content:center;gap:10px;padding:14px 22px 16px;}
.cp-g3-ba-mhead{display:flex;align-items:center;justify-content:space-between;gap:12px;}
.cp-g3-ba-mname{min-width:0;font-size:21px;line-height:1.3;font-weight:700;color:var(--theme-ink);}
.cp-g3-ba-values{display:flex;align-items:baseline;gap:12px;min-width:0;}
.cp-g3-ba-v-before{font-family:var(--theme-font-serif);font-weight:600;font-size:28px;line-height:1;color:var(--theme-faint);white-space:nowrap;font-variant-numeric:lining-nums tabular-nums;}
.cp-g3-ba-v-arrow{flex:none;align-self:center;color:var(--campus-accent-line);}
.cp-g3-ba-v-arrow > svg{display:block;}
.cp-g3-ba-v-after{font-family:var(--theme-font-serif);font-weight:700;font-size:40px;line-height:1;color:var(--theme-accent);white-space:nowrap;font-variant-numeric:lining-nums tabular-nums;}
.cp-g3-ba-v-unit{font-size:19px;line-height:1;color:var(--theme-muted);white-space:nowrap;}
.cp-g3-ba-bars{display:flex;flex-direction:column;gap:5px;}
.cp-g3-ba-bar{height:7px;border-radius:4px;background:var(--campus-neutral-wash);overflow:hidden;}
.cp-g3-ba-bar-fill{height:100%;border-radius:4px;}
.cp-g3-ba-bar.is-before .cp-g3-ba-bar-fill{background:var(--campus-tone-5);}
.cp-g3-ba-bar.is-after .cp-g3-ba-bar-fill{background:var(--campus-fill);}
.cp-g3-ba.is-dense .cp-g3-ba-metric{padding:10px 20px 12px;gap:8px;}
.cp-g3-ba.is-dense .cp-g3-ba-v-after{font-size:34px;}
.cp-g3-ba.is-dense .cp-g3-ba-v-before{font-size:25px;}
.cp-g3-ba.is-dense .cp-g3-ba-mid-arrow{width:52px;height:52px;}
`;

const RightArrow = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
    <path d="M4 12 H18" stroke="currentColor" strokeWidth="2.8" fill="none" strokeLinecap="round" />
    <path d="M12.5 6 L19 12 L12.5 18" stroke="currentColor" strokeWidth="2.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/** 前后值 → 涨跌幅文字、方向、是否向好。前值为 0 时不算百分比。 */
function changeOf(metric) {
  const before = safeNumber(metric?.before, 0);
  const after = safeNumber(metric?.after, 0);
  const diff = after - before;
  if (before === 0 || diff === 0) return { text: diff === 0 ? '0%' : '—', dir: 'flat', good: true };
  const pct = safeRatio(diff, Math.abs(before), 0) * 100;
  const abs = Math.abs(pct);
  const text = `${pct > 0 ? '+' : '−'}${formatNumber(abs, abs >= 100 ? 0 : 1)}%`;
  const good = metric?.better === 'low' ? diff < 0 : metric?.better === 'high' ? diff > 0 : true;
  return { text, dir: diff > 0 ? 'up' : 'down', good };
}

function Side({ kind, label, fromLabel, title, note, showNote, delay, slot, placeholder }) {
  return (
    <section className={`cp-g3-ba-side is-${kind} campus-card campus-rise`} style={enterDelay(delay)}>
      <div className="cp-g3-ba-head">
        {fromLabel ? (
          <div className="cp-g3-ba-chip is-from">
            <div className="cp-g3-ba-chip-dot" aria-hidden="true" />
            <div>{fromLabel}</div>
          </div>
        ) : null}
        {fromLabel ? <div className="cp-g3-ba-v-arrow" aria-hidden="true"><RightArrow size={20} /></div> : null}
        <div className="cp-g3-ba-chip">
          <div className="cp-g3-ba-chip-dot" aria-hidden="true" />
          <div>{label}</div>
        </div>
        <div className="cp-g3-ba-title">{title}</div>
      </div>
      <div className="cp-g3-ba-frame campus-photo">
        <MediaSlot id={slot} fit="contain" radius={8} placeholder={placeholder} />
      </div>
      {showNote && note ? (
        <div className="cp-g3-ba-note">
          <div className="campus-mark" aria-hidden="true" />
          <p>{note}</p>
        </div>
      ) : null}
    </section>
  );
}

export function BeforeAfter(props) {
  useDataStyle();
  useThemeStyle('campus-before-after-style', CSS);
  const p = { ...DEFAULTS, ...props };
  const metrics = safeArray(p.metrics).slice(0, countOf(p.metricCount, 2, 4));
  const dense = metrics.length > 3;
  const single = countOf(p.imageCount, 1, 2) === 1;
  return (
    <CampusFrame chapterIndex={p.chapterIndex}>
      <TitleRow no={p.sectionNo} title={p.title} className="campus-rise" style={enterDelay(0)} />
      <div className={`cp-g3-ba${dense ? ' is-dense' : ''}${single ? ' is-single' : ''}`}>
        {!single && <Side kind="before" label={p.beforeLabel} title={p.beforeTitle} note={p.beforeNote} showNote={p.showNotes} delay={1} slot="before-after-before" placeholder="优化前截图" />}
        <div className="cp-g3-ba-mid">
          <div className="cp-g3-ba-mid-head campus-rise" style={enterDelay(2)}>
            {!single && <div className="cp-g3-ba-mid-arrow" aria-hidden="true"><RightArrow size={30} /></div>}
            <div className="cp-g3-ba-mid-label">{p.metricsLabel}</div>
            {p.metricsNote ? <div className="cp-g3-ba-mid-note">{p.metricsNote}</div> : null}
          </div>
          <div className="cp-g3-ba-list">
            {metrics.map((metric, i) => {
              const change = changeOf(metric);
              const before = Math.max(0, safeNumber(metric?.before, 0));
              const after = Math.max(0, safeNumber(metric?.after, 0));
              const top = safeMax([before, after], 1) || 1;
              return (
                <div className="cp-g3-ba-metric campus-card campus-rise" style={enterDelay(3 + i)} key={i}>
                  <div className="cp-g3-ba-mhead">
                    <div className="cp-g3-ba-mname">{metric?.name}</div>
                    <DeltaPill text={change.text} dir={change.dir} good={change.good} />
                  </div>
                  <div className="cp-g3-ba-values">
                    <div className="cp-g3-ba-v-before">{compactNumber(metric?.before, metric?.decimals ?? 0)}</div>
                    <div className="cp-g3-ba-v-arrow" aria-hidden="true"><RightArrow size={20} /></div>
                    <div className="cp-g3-ba-v-after">{compactNumber(metric?.after, metric?.decimals ?? 0)}</div>
                    <div className="cp-g3-ba-v-unit">{metric?.unit}</div>
                  </div>
                  <div className="cp-g3-ba-bars" aria-hidden="true">
                    <div className="cp-g3-ba-bar is-before"><div className="cp-g3-ba-bar-fill" style={{ width: `${clamp(safeRatio(before, top, 0) * 100, 0, 100)}%` }} /></div>
                    <div className="cp-g3-ba-bar is-after"><div className="cp-g3-ba-bar-fill campus-draw" style={{ width: `${clamp(safeRatio(after, top, 0) * 100, 0, 100)}%`, ...enterDelay(5 + i) }} /></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <Side kind="after" label={p.afterLabel} fromLabel={single ? p.beforeLabel : null} title={p.afterTitle} note={p.afterNote} showNote={p.showNotes} delay={2} slot="before-after-after" placeholder={single ? '对比图' : '优化后截图'} />
      </div>
      {p.showConclusion && <ConclusionBar label={p.conclusionLabel} text={p.conclusion} className="campus-rise" style={enterDelay(9)} />}
    </CampusFrame>
  );
}

const VALUE_BOUND = { min: -1000000000, max: 1000000000, semantics: 'magnitude' };

BeforeAfter.META = {
  id: 'before-after',
  label: '前后对比 · 双图位配指标变化',
  roles: ['comparison', 'result', 'image'],
  defaults: DEFAULTS,
  copyBudgets: {
    beforeLabel: 5, afterLabel: 5, beforeTitle: 14, afterTitle: 14, beforeNote: 28, afterNote: 28,
    metricsLabel: 8, metricsNote: 14, 'metrics[].name': 8, 'metrics[].unit': 4, conclusion: 52,
  },
  numberBounds: {
    'metrics[].before': VALUE_BOUND,
    'metrics[].after': VALUE_BOUND,
    'metrics[].decimals': { min: 0, max: 4, semantics: 'count' },
  },
  controls: [
    { ...CHAPTER_CONTROL, default: 3 },
    { key: 'imageCount', type: 'number', label: '图片数量', default: 2, min: 1, max: 2, countArrays: ['images'], description: '2 张:左「优化前」、右「优化后」两个图位,指标列在中间;1 张:左侧一张合成好的前后对比图(标题与说明用 afterTitle / afterNote),指标列在右侧。' },
    { key: 'metricCount', type: 'number', label: '指标个数', default: 3, min: 2, max: 4, countArrays: ['metrics'], description: '中间一列的指标个数:before / after 是前后数值,unit 是单位,better 写 low(越低越好)或 high(越高越好),涨跌幅按前后值自动计算并据此显示向好 / 变差。' },
    { key: 'showNotes', type: 'toggle', label: '图下说明', default: true, description: '两张图下方各一句说明。' },
    { key: 'showConclusion', type: 'toggle', label: '底部结论条', default: true, description: '页面底部的校色结论条。' },
  ],
};
