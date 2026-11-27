// 环形占比图:左侧环形图(圆心是总量),右侧逐项图例明细(色块 + 名称 + 说明 + 占比 + 占比条),底部一句解读。
// 扇区按校色深浅 + 中性灰排色;占比数字与说明都是 HTML 文本。
import React from 'react';
import { useThemeStyle, enterDelay } from '../../../shared/style.jsx';
import { safeArray, safeNumber, safePercent, clamp } from '../../../chart-safety.mjs';
import { CampusFrame, TitleRow, ConclusionBar, CHAPTER_CONTROL } from '../kit/chrome.jsx';
import { LabelRow, toneVar } from '../kit/parts.jsx';

const DEFAULTS = {
  chapterIndex: 3,
  segmentCount: 5,
  showConclusion: true,
  sectionNo: '3.6',
  title: '内容类型占比',
  chartLabel: '样本构成',
  chartNote: '示例数据',
  centerValue: '1,286',
  centerLabel: '样本视频（支）',
  unit: '%',
  segments: [
    { name: '科技产品评测', value: 34, desc: '新品评测与横向对比，主账号的核心栏目' },
    { name: '影像创作与技巧', value: 26, desc: '拍摄、剪辑与调色教程，长尾流量稳定' },
    { name: '行业观察', value: 17, desc: '行业事件解读与深度访谈' },
    { name: '团队日常', value: 14, desc: '幕后花絮与生活化内容，拉近距离' },
    { name: '品牌合作', value: 9, desc: '商业合作与自有品牌相关内容' },
    { name: '其他', value: 0, desc: '在这里说明其他类型' },
  ],
  conclusionLabel: '解读',
  conclusion: '“评测 + 教程”两类专业内容占六成，构成账号的口碑基础；生活化内容负责拉近距离。',
};

const CSS = `
.cp-db{flex:1;min-height:0;display:flex;gap:30px;}
.cp-db-figure{flex:0 0 700px;display:flex;flex-direction:column;padding:24px 32px 26px;}
.campus[data-campus-nav="rail"] .cp-db-figure{flex-basis:640px;}
.cp-db-ring{position:relative;flex:1;min-height:0;margin-top:18px;display:flex;align-items:center;justify-content:center;}
.cp-db-ring svg{position:relative;height:100%;max-width:100%;aspect-ratio:1 / 1;display:block;}
.cp-db-track{fill:none;stroke:var(--campus-neutral-wash);}
.cp-db-seg{fill:none;}
.cp-db-disc{position:absolute;left:50%;top:50%;height:44%;aspect-ratio:1 / 1;transform:translate(-50%,-50%);border-radius:50%;background:var(--theme-surface);box-shadow:0 14px 32px rgb(var(--theme-accent-rgb) / .18);}
.cp-db-center{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);display:flex;flex-direction:column;align-items:center;gap:10px;text-align:center;}
.cp-db-center-value{font-family:var(--theme-font-serif);font-weight:700;font-size:72px;line-height:1;color:var(--theme-accent);font-variant-numeric:lining-nums;}
.cp-db-center-label{font-size:20px;letter-spacing:.06em;color:var(--theme-muted);}
.cp-db-list{flex:1;min-width:0;display:flex;flex-direction:column;justify-content:center;gap:10px;}
.cp-db-row{flex:1 1 0;min-height:0;max-height:150px;display:grid;grid-template-columns:28px minmax(0,1fr) 170px;align-items:center;column-gap:22px;padding:0 22px;border-radius:var(--campus-radius-sm);}
.cp-db-row:nth-child(odd){background:var(--campus-wash);}
.cp-db-swatch{width:26px;height:26px;border-radius:8px;}
.cp-db-name{font-size:24px;line-height:1.3;font-weight:700;color:var(--theme-ink);}
.cp-db-desc{margin-top:4px;font-size:19px;line-height:1.4;color:var(--theme-faint);}
.cp-db-share{display:flex;flex-direction:column;align-items:flex-end;gap:10px;}
.cp-db-value{display:flex;align-items:baseline;gap:4px;}
.cp-db-num{font-size:46px;}
.cp-db-unit{font-family:var(--theme-font-serif);font-weight:700;font-size:22px;color:var(--campus-accent-soft);}
.cp-db-track-bar{position:relative;width:170px;height:8px;border-radius:4px;background:var(--campus-neutral-wash);}
.cp-db-fill{position:absolute;left:0;top:0;bottom:0;border-radius:4px;}
.cp-db-list.is-6 .cp-db-num{font-size:40px;}
.cp-db-list.is-6 .cp-db-name{font-size:22px;}
`;

const R = 38;
const STROKE = 20;

export function DonutBreakdown(props) {
  useThemeStyle('campus-donut-breakdown-style', CSS);
  const p = { ...DEFAULTS, ...props };
  const segments = safeArray(p.segments).slice(0, clamp(p.segmentCount, 2, 6));
  const values = segments.map(s => Math.max(0, safeNumber(s?.value, 0)));
  const total = values.reduce((sum, v) => sum + v, 0);
  // 每段扇区用 pathLength=100 的圆描边画出,段与段之间留 0.6 的缝。
  let acc = 0;
  const arcs = values.map((v, i) => {
    const share = safePercent(v, total, 0);
    const start = acc;
    acc += share;
    const len = Math.max(0, share - (share > 1 ? 0.6 : 0));
    return { i, len, offset: -start };
  });
  return (
    <CampusFrame chapterIndex={p.chapterIndex}>
      <TitleRow no={p.sectionNo} title={p.title} className="campus-rise" style={enterDelay(0)} />
      <div className="cp-db">
        <section className="cp-db-figure campus-card campus-rise" style={enterDelay(1)}>
          <LabelRow label={p.chartLabel} note={p.chartNote} />
          <div className="cp-db-ring">
            <div className="cp-db-disc" aria-hidden="true" />
            <svg viewBox="0 0 100 100" aria-hidden="true">
              <circle className="cp-db-track" cx="50" cy="50" r={R} strokeWidth={STROKE} />
              <g transform="rotate(-90 50 50)">
                {arcs.map(arc => (
                  <circle
                    key={arc.i}
                    className="cp-db-seg campus-fade"
                    cx="50" cy="50" r={R}
                    pathLength="100"
                    strokeWidth={STROKE}
                    strokeDasharray={`${arc.len} ${100 - arc.len}`}
                    strokeDashoffset={arc.offset}
                    style={{ stroke: toneVar(arc.i), ...enterDelay(2 + arc.i) }}
                  />
                ))}
              </g>
            </svg>
            <div className="cp-db-center">
              <div className="cp-db-center-value">{p.centerValue}</div>
              <div className="cp-db-center-label">{p.centerLabel}</div>
            </div>
          </div>
        </section>
        <div className={`cp-db-list is-${segments.length}`}>
          {segments.map((seg, i) => (
            <div className="cp-db-row campus-rise" style={enterDelay(2 + i)} key={i}>
              <div className="cp-db-swatch" style={{ background: i === 0 ? 'var(--campus-fill)' : toneVar(i) }} />
              <div>
                <div className="cp-db-name">{seg?.name}</div>
                <div className="cp-db-desc">{seg?.desc}</div>
              </div>
              <div className="cp-db-share">
                <div className="cp-db-value">
                  <div className="cp-db-num campus-num">{seg?.value}</div>
                  <div className="cp-db-unit">{p.unit}</div>
                </div>
                <div className="cp-db-track-bar">
                  <div className="cp-db-fill" style={{ width: `${safePercent(values[i], total, 0)}%`, background: i === 0 ? 'var(--campus-fill)' : toneVar(i) }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      {p.showConclusion && <ConclusionBar label={p.conclusionLabel} text={p.conclusion} className="campus-rise" style={enterDelay(9)} />}
    </CampusFrame>
  );
}

DonutBreakdown.META = {
  id: 'donut-breakdown',
  label: '环形占比 · 图例明细配一句解读',
  roles: ['distribution', 'metrics'],
  defaults: DEFAULTS,
  copyBudgets: { 'segments[].name': 8, 'segments[].desc': 20, centerLabel: 8, conclusion: 44 },
  numberBounds: { 'segments[].value': { min: 0, max: 1000000000, semantics: 'magnitude' } },
  controls: [
    { ...CHAPTER_CONTROL, default: 3 },
    { key: 'segmentCount', type: 'number', label: '扇区数量', default: 5, min: 2, max: 6, description: '环形图的扇区数,右侧明细随之增减;各扇区按 value 占总和的比例绘制。' },
    { key: 'showConclusion', type: 'toggle', label: '底部结论条', default: true, description: '页面底部的一句解读。' },
  ],
};
