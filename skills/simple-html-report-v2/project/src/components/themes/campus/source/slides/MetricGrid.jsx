// 关键指标卡阵列:顶部一句数据说明,下面 4–8 张指标卡(衬线大数字 + 单位 + 名称 + 注释),可用渐变色卡强调其中一张;指标卡是右上折角编号的序号卡片。
// 适合样本规模、数据概况、成果数字。
import React from 'react';
import { useThemeStyle, enterDelay } from '../../../shared/style.jsx';
import { safeArray, safeNumber, clamp } from '../../../chart-safety.mjs';
import { CampusFrame, TitleRow, CHAPTER_CONTROL, useCampusLayout } from '../kit/chrome.jsx';
import { NumberCard } from '../kit/parts.jsx';

const DEFAULTS = {
  chapterIndex: 2,
  metricCount: 6,
  highlightIndex: 1,
  showLead: true,
  showFootnote: true,
  sectionNo: '2.4',
  title: '样本与数据规模',
  leadLabel: '数据说明',
  lead: '样本取自研究对象主账号及子账号的公开视频与平台公开数据，时间跨度为 2019—2025 年。',
  metrics: [
    { no: '01', label: '样本视频', value: '1,286', unit: '支', note: '覆盖主账号与 4 个子账号' },
    { no: '02', label: '时间跨度', value: '7', unit: '年', note: '2019—2025 年' },
    { no: '03', label: '评论文本', value: '12.6', unit: '万条', note: '用于受众反馈分析' },
    { no: '04', label: '访谈资料', value: '38', unit: '篇', note: '创始人与团队成员公开访谈' },
    { no: '05', label: '分析指标', value: '9', unit: '项', note: '播放、完播、互动等' },
    { no: '06', label: '对照账号', value: '4', unit: '个', note: '同领域头部账号' },
    { no: '07', label: '编码类目', value: '24', unit: '类', note: '内容类型与表达方式' },
    { no: '08', label: '有效问卷', value: '612', unit: '份', note: '观众信任度调查' },
  ],
  footnote: '注：以上数字为示例数据，实际以研究采集结果为准。',
};

const CSS = `
.cp-mg-lead{position:relative;flex:none;display:flex;align-items:center;gap:24px;margin-bottom:24px;padding:16px 30px 16px 18px;border-radius:999px;}
.cp-mg-lead-text{flex:1;min-width:0;font-size:23px;line-height:1.6;color:var(--theme-ink);}
.cp-mg{flex:1;min-height:0;display:grid;gap:24px;}
.cp-mg-card.campus-ncard{min-height:0;display:flex;flex-direction:column;padding:26px 30px 24px;}
.cp-mg-card .campus-ncard-title{font-family:var(--theme-font-sans);font-size:24px;letter-spacing:.04em;}
.cp-mg-value-row{flex:1;min-height:0;display:flex;align-items:center;}
.cp-mg-num{min-width:0;display:flex;flex-wrap:wrap;align-items:baseline;gap:0 8px;}
.cp-mg-value{min-width:0;font-size:96px;letter-spacing:-.01em;overflow-wrap:anywhere;}
.cp-mg-unit{font-family:var(--theme-font-serif);font-weight:700;font-size:30px;color:var(--campus-accent-soft);}
.cp-mg-note{display:flex;align-items:center;gap:10px;padding-top:14px;border-top:1px dashed var(--campus-accent-line);font-size:19px;line-height:1.45;color:var(--theme-muted);}
.cp-mg-note-text{min-width:0;}
.cp-mg-card.is-hl::before{display:none;}
.cp-mg-hlbg{position:absolute;inset:0;z-index:-2;border-radius:inherit;background:var(--campus-fill-deep);box-shadow:var(--campus-shadow-lift);}
.cp-mg-card.is-hl .campus-ncard-title,.cp-mg-card.is-hl .cp-mg-value,.cp-mg-card.is-hl .cp-mg-note{color:var(--theme-on-accent);}
.cp-mg-card.is-hl .cp-mg-unit{color:var(--campus-on-accent-muted);}
.cp-mg-card.is-hl .cp-mg-note{border-top-color:var(--campus-on-accent-line);}
.cp-mg-card.is-hl .campus-ncard-corner > .campus-ncard-shape{background:var(--theme-surface);}
.cp-mg-card.is-hl .campus-ncard-corner{color:var(--theme-accent);}
.cp-mg-card.is-hl .campus-ncard-corner-fold{background:rgb(0 0 0 / .25);}
.cp-mg.is-dense .cp-mg-value{font-size:80px;}
.cp-mg.is-dense .cp-mg-card .campus-ncard-title{font-size:22px;}
.cp-mg-foot{flex:none;margin-top:14px;font-size:18px;line-height:1.4;color:var(--theme-faint);}
`;

// 卡片数 → 列数:4 张两行两列,5–6 张三列,7–8 张四列。
const columnsFor = n => (n <= 4 ? 2 : n <= 6 ? 3 : 4);

// 大数字按内容长度自适应:估算「数值 + 单位」的宽度(衬线粗体等宽数字约 .66em,汉字 1em),
// 放不下时把这一张卡的数值字号缩到刚好放下(不低于 44px);仍放不下时数值和单位允许折行。
const glyphEm = ch => (/[0-9]/.test(ch) ? 0.66 : /[.,:']/.test(ch) ? 0.32 : /[\u2E80-\u9FFF\uFF00-\uFFEF]/.test(ch) ? 1 : ch === ' ' ? 0.3 : 0.62);
const widthEm = text => Array.from(String(text ?? '')).reduce((w, ch) => w + glyphEm(ch), 0);
const CARD_PAD_X = 60;
const GRID_GAP = 24;
const MIN_VALUE_SIZE = 44;
function valueSize(value, unit, cardW, base) {
  const unitW = unit ? widthEm(unit) * 30 + 8 : 0;
  const room = (cardW - CARD_PAD_X - unitW) * 0.96;
  const em = widthEm(value);
  if (!em || em * base <= room) return null;
  return Math.max(MIN_VALUE_SIZE, Math.floor(room / em));
}

export function MetricGrid(props) {
  useThemeStyle('campus-metric-grid-style', CSS);
  const p = { ...DEFAULTS, ...props };
  const metrics = safeArray(p.metrics).slice(0, clamp(p.metricCount, 4, 8));
  const cols = columnsFor(metrics.length);
  const highlight = clamp(Math.round(safeNumber(p.highlightIndex, 0)), 0, metrics.length) - 1;
  const { bodyW } = useCampusLayout();
  const cardW = (bodyW - GRID_GAP * (cols - 1)) / cols;
  const valueSizes = metrics.map(m => valueSize(m?.value, m?.unit, cardW, cols >= 4 ? 80 : 96));
  return (
    <CampusFrame chapterIndex={p.chapterIndex}>
      <TitleRow no={p.sectionNo} title={p.title} className="campus-rise" style={enterDelay(0)} />
      {p.showLead && (
        <div className="cp-mg-lead campus-wash campus-rise" style={enterDelay(1)}>
          <div className="campus-chip">{p.leadLabel}</div>
          <p className="cp-mg-lead-text">{p.lead}</p>
        </div>
      )}
      <div className={`cp-mg${cols >= 4 ? ' is-dense' : ''}`} style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, gridAutoRows: 'minmax(0, 1fr)' }}>
        {metrics.map((m, i) => (
          <NumberCard variant="corner" no={m?.no} title={m?.label} className={`cp-mg-card campus-rise${i === highlight ? ' is-hl' : ''}`} style={enterDelay(2 + i)} key={i}>
            {i === highlight && <div className="cp-mg-hlbg" aria-hidden="true" />}
            <div className="cp-mg-value-row">
              <div className="cp-mg-num">
                <div className="cp-mg-value campus-num" style={valueSizes[i] ? { fontSize: valueSizes[i] } : undefined}>{m?.value}</div>
                <div className="cp-mg-unit">{m?.unit}</div>
              </div>
            </div>
            <div className="cp-mg-note"><div className={`campus-mark${i === highlight ? ' is-spark' : ''}`} aria-hidden="true" /><div className="cp-mg-note-text">{m?.note}</div></div>
          </NumberCard>
        ))}
      </div>
      {p.showFootnote && <p className="cp-mg-foot campus-fade" style={enterDelay(9)}>{p.footnote}</p>}
    </CampusFrame>
  );
}

MetricGrid.META = {
  id: 'metric-grid',
  label: '指标卡阵列 · 大数字配单位与注释',
  roles: ['metrics', 'result', 'context'],
  defaults: DEFAULTS,
  copyBudgets: { lead: 52, 'metrics[].note': 14, 'metrics[].label': 6, 'metrics[].value': 6, footnote: 40 },
  controls: [
    { ...CHAPTER_CONTROL, default: 2 },
    { key: 'metricCount', type: 'number', label: '指标数量', default: 6, min: 4, max: 8, description: '指标卡数量:4 张两列,5–6 张三列,7–8 张四列。' },
    { key: 'highlightIndex', type: 'number', label: '强调指标', default: 1, min: 0, max: 8, maxFromKey: 'metricCount', description: '用渐变色卡强调第几张指标卡;0 表示不强调。' },
    { key: 'showLead', type: 'toggle', label: '数据说明', default: true, description: '指标卡上方的一句数据说明。' },
    { key: 'showFootnote', type: 'toggle', label: '注释', default: true, description: '页面底部的一行注释。' },
  ],
};
