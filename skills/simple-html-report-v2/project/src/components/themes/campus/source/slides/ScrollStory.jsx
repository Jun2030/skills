// 卷轴图文(特色页):整页是一张白纸大卡,右缘卷成一根卷轴(卷轴上竖排两列口号),左上角一条渐变斜签从纸后探出;
// 纸面左侧是照片(媒体槽)+ 金色徽章 + 大号要点数字 + 设问标题,右侧是栏目头、3–4 条要点、2–3 个小指标和可选的勾选标签。
// 纸张、卷轴、斜签、徽章底都是图形;所有文字都是独立的 HTML 文本。竖排口号用「一字宽」的文本块自然折行实现。
import React from 'react';
import { useThemeStyle, enterDelay } from '../../../shared/style.jsx';
import { MediaSlot } from '../../../shared/MediaSlot.jsx';
import { safeArray, clamp } from '../../../chart-safety.mjs';
import { CampusFrame, TitleRow, CHAPTER_CONTROL, TITLE_ROW_SPACE, useCampusLayout } from '../kit/chrome.jsx';
import { useFeatureAStyle, LinearGrad, RadialGrad, BlurFilter, CheckGlyph } from '../kit/feature-a.jsx';

const DEFAULTS = {
  chapterIndex: 1,
  pointCount: 4,
  metricCount: 3,
  tagCount: 4,
  images: [],
  sectionNo: '1.2',
  title: '国内外就业情况与研究现状',
  ribbon: '人才供需 · 国内外对比',
  badge: '缺口',
  bigText: '85%+',
  heading: '西方多数财务工作者从事管理会计',
  subline: '我国财务会计人员严重饱和，管理会计人才供不应求',
  sectionTitle: '国内研究现状',
  points: [
    '缺口大：管理会计人才供不应求，从业者面临转型挑战',
    '起步迅速：约始于上世纪六十年代末，十年间理论与实践快速发展',
    '参与人数增多：参与管理会计研究的人员越来越多',
    '内容变化大：从一维走向多维，核算功能发生巨大变化',
  ],
  metrics: [
    { label: 'A 国管理会计占比', value: '88%' },
    { label: '我国管理会计占比', value: '15%' },
    { label: '我国财务会计人员', value: '1700 万' },
  ],
  tags: ['工作效率', '综合水平', '企业收益', '大局观'],
  sloganA: '补齐人才缺口',
  sloganB: '推动转型发展',
};

const CSS = `
.cp-ss{position:relative;flex:1;min-height:0;}
.cp-ss-svg{position:absolute;left:0;top:0;overflow:visible;}
.cp-ss-ribbon{position:absolute;display:flex;align-items:center;justify-content:center;color:var(--theme-on-accent);font-family:var(--theme-font-serif);font-weight:700;font-size:27px;letter-spacing:.14em;white-space:nowrap;justify-content:flex-start;padding-left:26px;transform:rotate(-2.4deg);transform-origin:0 100%;}
.cp-ss-photo{position:absolute;border-radius:20px;overflow:hidden;}
.cp-ss-photo .media-slot{position:absolute;inset:0;width:100%;height:100%;}
.cp-ss-fade{position:absolute;left:0;right:0;bottom:0;height:38%;pointer-events:none;background:linear-gradient(180deg,rgb(255 255 255 / 0) 0%,rgb(255 255 255 / .92) 100%);}
.cp-ss-badge{position:absolute;display:grid;place-items:center;width:118px;height:118px;color:var(--theme-on-accent);}
.cp-ss-badge-shape{position:absolute;inset:0;border-radius:50%;background:var(--campus-fill-gold);box-shadow:0 12px 26px var(--campus-spark-glow);}
.cp-ss-badge-ring{position:absolute;inset:9px;border-radius:50%;border:2px dashed rgb(255 255 255 / .7);}
.cp-ss-badge-text{position:relative;max-width:2.2em;font-family:var(--theme-font-serif);font-weight:700;font-size:30px;line-height:1.12;letter-spacing:.04em;text-align:center;}
.cp-ss-story{position:absolute;display:flex;flex-direction:column;}
.cp-ss-big{font-family:var(--theme-font-serif);font-weight:700;font-size:84px;line-height:1;letter-spacing:.02em;color:var(--theme-accent);font-variant-numeric:lining-nums;}
.cp-ss-heading{margin-top:12px;font-family:var(--theme-font-serif);font-weight:700;font-size:32px;line-height:1.3;letter-spacing:.04em;color:var(--theme-ink);}
.cp-ss-sub{display:flex;align-items:center;gap:16px;margin-top:12px;}
.cp-ss-sub-text{font-size:20px;line-height:1.5;color:var(--theme-muted);}
.cp-ss-sub-arrow{flex:1;min-width:60px;height:2px;position:relative;background:var(--campus-fade-line);transform:scaleX(-1);}
.cp-ss-col{position:absolute;display:flex;flex-direction:column;gap:24px;}
.cp-ss-col-top{flex:1;min-height:0;display:flex;flex-direction:column;}
.cp-ss-head{display:flex;align-items:center;gap:16px;}
.cp-ss-head-icon{position:relative;flex:none;width:44px;height:44px;display:grid;place-items:center;color:var(--theme-on-accent);}
.cp-ss-head-icon-shape{position:absolute;inset:0;border-radius:10px 10px 10px 2px;background:var(--campus-fill);box-shadow:0 8px 16px rgb(var(--theme-accent-rgb) / .3);}
.cp-ss-head-icon svg{position:relative;}
.cp-ss-head-title{font-family:var(--theme-font-serif);font-weight:700;font-size:34px;line-height:1.2;letter-spacing:.06em;color:var(--theme-accent);}
.cp-ss-head-rule{display:flex;align-items:center;gap:8px;margin:14px 0 6px;}
.cp-ss-head-rule-a{width:180px;height:5px;border-radius:3px;background:var(--campus-fill);}
.cp-ss-head-rule-b{flex:1;height:1.5px;background:var(--campus-fade-line);}
.cp-ss-points{flex:1;min-height:0;display:grid;grid-auto-rows:minmax(0,118px);align-content:space-evenly;margin-top:6px;}
.cp-ss-point{display:flex;align-items:center;gap:16px;min-height:0;border-bottom:1px dashed var(--campus-accent-line);}
.cp-ss-point:last-child{border-bottom:0;}
.cp-ss-point-no{flex:none;display:grid;place-items:center;width:36px;height:36px;border-radius:50%;border:2px solid var(--theme-accent);font-family:var(--theme-font-serif);font-weight:700;font-size:20px;line-height:1;color:var(--theme-accent);}
.cp-ss-point-text{font-size:23px;line-height:1.55;color:var(--theme-ink);}
.cp-ss-metrics{display:grid;grid-auto-flow:column;grid-auto-columns:minmax(0,1fr);gap:16px;}
.cp-ss-metric{display:flex;flex-direction:column;align-items:center;overflow:hidden;border-radius:14px;}
.cp-ss-metric-label{align-self:stretch;padding:9px 10px;background:var(--campus-fill);color:var(--theme-on-accent);font-size:18px;line-height:1.3;font-weight:600;text-align:center;}
.cp-ss-metric-value{padding:16px 8px 18px;font-family:var(--theme-font-serif);font-weight:700;font-size:50px;line-height:1;color:var(--theme-accent);white-space:nowrap;font-variant-numeric:lining-nums;}
.cp-ss-metric:first-child .cp-ss-metric-value{color:var(--campus-spark-lo);}
.cp-ss-tags{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px 18px;}
.cp-ss-tag{display:flex;align-items:center;gap:14px;height:60px;padding:0 16px;border-radius:12px;background:var(--theme-surface);border:1.5px solid var(--campus-accent-line);box-shadow:0 6px 14px rgb(var(--theme-accent-rgb) / .08);}
.cp-ss-tag-box{position:relative;flex:none;width:30px;height:30px;display:grid;place-items:center;color:var(--theme-on-accent);}
.cp-ss-tag-box-shape{position:absolute;inset:0;border-radius:7px;background:var(--campus-fill);}
.cp-ss-tag-box svg{position:relative;}
.cp-ss-tag-text{font-size:22px;font-weight:700;color:var(--theme-ink);white-space:nowrap;}
.cp-ss-slogan{position:absolute;width:1.1em;font-family:var(--theme-font-serif);font-weight:700;font-size:42px;line-height:1.16;letter-spacing:0;color:var(--theme-accent);text-align:center;word-break:break-all;}
.cp-ss-slogan.is-b{color:var(--campus-accent-lo);}
.cp-ss.is-compact .cp-ss-point-text{font-size:22px;line-height:1.5;}
.cp-ss.is-compact .cp-ss-tag{height:54px;}
.cp-ss.is-compact .cp-ss-metric-value{font-size:46px;padding:12px 8px 14px;}
`;

export function ScrollStory(props) {
  useThemeStyle('campus-scroll-story-style', CSS);
  useFeatureAStyle();
  const p = { ...DEFAULTS, ...props };
  const { bodyW, bodyH, nav } = useCampusLayout();
  const points = safeArray(p.points).slice(0, clamp(p.pointCount, 3, 4));
  const metrics = safeArray(p.metrics).slice(0, clamp(p.metricCount, 2, 3));
  const tags = safeArray(p.tags).slice(0, clamp(p.tagCount, 0, 4));
  const W = bodyW;
  const H = bodyH - TITLE_ROW_SPACE;
  // 纸:左上角留出斜签探出的位置;右侧卷轴的宽度。
  const top = 58;
  // 卷角:上沿从 seamT 到 curlTR,下沿从 seamB 到 curlBR(上宽下窄、略向右倾)。
  const rollW = 168;
  const rollX = W - rollW - 10;
  const seamT = rollX - 6;
  const seamB = rollX + 22;
  const curlTR = W - 2;
  const curlBR = W - 30;
  const paperR = seamT;
  const sloganX = rollX + 34;
  const paperPath = (dx, dy) => `M${dx + 26} ${top + dy} H${seamT + dx} L${seamB + dx} ${H - 6 + dy} H${dx + 26} Q${dx} ${H - 6 + dy} ${dx} ${H - 32 + dy} V${top + 26 + dy} Q${dx} ${top + dy} ${dx + 26} ${top + dy} Z`;
  const pad = 46;
  const leftW = Math.round((rollX - pad * 2) * (nav === 'rail' ? 0.44 : 0.45));
  const photoH = Math.round((H - top) * 0.6);
  const colX = pad + leftW + 54;
  const colW = rollX - colX - 34;
  const compact = points.length >= 4 && tags.length > 2;
  // 卷轴两端的「卷纸」椭圆
  const ry = 22;
  return (
    <CampusFrame chapterIndex={p.chapterIndex}>
      <TitleRow no={p.sectionNo} title={p.title} className="campus-rise" style={enterDelay(0)} />
      <div className={`cp-ss${compact ? ' is-compact' : ''}`}>
        <svg className="cp-ss-svg campus-fade" style={{ width: W, height: H, ...enterDelay(1) }} viewBox={`0 0 ${W} ${H}`} aria-hidden="true">
          <defs>
            <LinearGrad id="cp-ss-ribbon" x1={0} y1={0} x2={1} y2={1} stops={[[0, 'var(--campus-accent-deep)'], [0.45, 'var(--theme-accent)'], [1, 'var(--campus-accent-hi)']]} />
            <LinearGrad id="cp-ss-paper" x1={0} y1={0} x2={1} y2={1} stops={[[0, 'rgb(255 255 255 / 1)'], [0.7, 'rgb(255 255 255 / .98)'], [1, 'var(--campus-accent-mist)']]} />
            <LinearGrad id="cp-ss-roll" x1={0} y1={0} x2={1} y2={0.12} stops={[[0, 'var(--campus-accent-pale)'], [0.16, 'rgb(255 255 255 / 1)'], [0.45, 'var(--campus-accent-mist)'], [0.8, 'var(--campus-accent-pale)'], [1, 'color-mix(in srgb,var(--campus-accent-pale) 55%,var(--campus-accent-hi))']]} />
            <LinearGrad id="cp-ss-under" x1={0} y1={0} x2={1} y2={0} stops={[[0, 'rgb(var(--theme-accent-rgb) / 0)'], [1, 'rgb(var(--theme-accent-rgb) / .3)']]} />
            <RadialGrad id="cp-ss-end" stops={[[0, 'var(--campus-accent-pale)'], [0.7, 'rgb(255 255 255 / 1)'], [1, 'var(--campus-accent-mist)']]} />
            <BlurFilter id="cp-ss-blur" std={16} />
          </defs>
          {/* 纸后的渐变底卡:向左上探出,压着斜签文字 */}
          <g transform={`rotate(-2.4 ${pad} ${top})`}>
            <rect x={-8} y={top - 70} width={Math.round(paperR * 0.58)} height={H - top + 40} rx={28} style={{ fill: 'url(#cp-ss-ribbon)' }} />
            <rect x={-8} y={top - 70} width={Math.round(paperR * 0.58)} height={40} rx={20} style={{ fill: 'rgb(255 255 255 / .1)' }} />
          </g>
          {/* 纸张:投影 + 纸面(右缘斜切,接进卷角) */}
          <path d={paperPath(6, 22)} style={{ fill: 'rgb(var(--theme-accent-rgb) / .2)' }} filter="url(#cp-ss-blur)" />
          <path d={paperPath(0, 0)} style={{ fill: 'url(#cp-ss-paper)', stroke: 'rgb(var(--theme-accent-rgb) / .1)' }} strokeWidth="1.5" />
          <path d={`M${seamT - 70} ${top} L${seamT} ${top} L${seamB} ${H - 6} L${seamB - 70} ${H - 6} Z`} style={{ fill: 'url(#cp-ss-under)' }} />
          {/* 卷角:上宽下窄的卷起纸面,外侧压暗、内侧高光,两端露出卷纸的螺旋 */}
          <path d={`M${seamT + 10} ${top - 4} L${curlTR + 14} ${top + 10} L${curlBR + 14} ${H + 2} L${seamB + 10} ${H - 2} Z`} style={{ fill: 'rgb(var(--theme-accent-rgb) / .28)' }} filter="url(#cp-ss-blur)" />
          <path d={`M${seamT} ${top - 2} L${curlTR} ${top - 2} L${curlBR} ${H - 8} L${seamB} ${H - 8} Z`} style={{ fill: 'url(#cp-ss-roll)' }} />
          <path d={`M${seamT + (curlTR - seamT) * 0.2} ${top + 6} L${seamB + (curlBR - seamB) * 0.2} ${H - 14}`} style={{ stroke: 'rgb(255 255 255 / .95)' }} strokeWidth="6" strokeLinecap="round" />
          <path d={`M${seamT} ${top - 2} L${seamB} ${H - 8}`} style={{ stroke: 'rgb(var(--theme-accent-rgb) / .2)' }} strokeWidth="2" />
          {[[top - 2, seamT, curlTR, 1], [H - 8, seamB, curlBR, 0.8]].map(([y, l, r, k], i) => (
            <g key={i}>
              <ellipse cx={(l + r) / 2} cy={y} rx={(r - l) / 2} ry={ry * k} style={{ fill: 'url(#cp-ss-end)', stroke: 'rgb(var(--theme-accent-rgb) / .32)' }} strokeWidth="1.5" />
              <ellipse cx={(l + r) / 2 + 8} cy={y} rx={(r - l) * 0.3} ry={ry * k * 0.62} fill="none" style={{ stroke: 'rgb(var(--theme-accent-rgb) / .3)' }} strokeWidth="1.5" />
              <ellipse cx={(l + r) / 2 + 13} cy={y} rx={(r - l) * 0.15} ry={ry * k * 0.32} fill="none" style={{ stroke: 'rgb(var(--theme-accent-rgb) / .38)' }} strokeWidth="1.5" />
            </g>
          ))}
          <line x1={sloganX + 26} y1={top + 44} x2={sloganX + 26} y2={top + 78} style={{ stroke: 'var(--campus-spark)' }} strokeWidth="3" strokeLinecap="round" />
        </svg>
        <div className="cp-ss-ribbon campus-rise" style={{ left: pad - 6, top: top - 64, width: 520, height: 54, ...enterDelay(1) }}>{p.ribbon}</div>
        <div className="cp-ss-photo campus-photo campus-rise" style={{ left: pad, top: top + 58, width: leftW, height: photoH, ...enterDelay(2) }}>
          <MediaSlot id="scroll-story-photo" fit="cover" radius={14} placeholder="照片" />
          <div className="cp-ss-fade" aria-hidden="true" />
        </div>
        <div className="cp-ss-badge campus-rise" style={{ left: pad - 34, top: top + 20, ...enterDelay(3) }}>
          <div className="cp-ss-badge-shape" aria-hidden="true" />
          <div className="cp-ss-badge-ring" aria-hidden="true" />
          <div className="cp-ss-badge-text">{p.badge}</div>
        </div>
        <div className="cp-ss-story" style={{ left: pad + 8, top: top + 58 + photoH - 34, width: leftW - 8 }}>
          <div className="cp-ss-big campus-rise" style={enterDelay(3)}>{p.bigText}</div>
          <h3 className="cp-ss-heading campus-rise" style={enterDelay(4)}>{p.heading}</h3>
          <div className="cp-ss-sub campus-rise" style={enterDelay(4)}>
            <p className="cp-ss-sub-text">{p.subline}</p>
          </div>
        </div>
        <div className="cp-ss-col" style={{ left: colX, top: top + 44, width: colW, bottom: 40 }}>
          <div className="cp-ss-col-top">
          <div className="cp-ss-head campus-rise" style={enterDelay(3)}>
            <div className="cp-ss-head-icon" aria-hidden="true">
              <div className="cp-ss-head-icon-shape" />
              <CheckGlyph size={22} />
            </div>
            <h3 className="cp-ss-head-title">{p.sectionTitle}</h3>
          </div>
          <div className="cp-ss-head-rule campus-draw" style={enterDelay(4)} aria-hidden="true"><div className="cp-ss-head-rule-a" /><div className="cp-ss-head-rule-b" /></div>
          <div className="cp-ss-points">
            {points.map((text, i) => (
              <div key={i} className="cp-ss-point campus-rise" style={enterDelay(4 + i)}>
                <div className="cp-ss-point-no" aria-hidden="true">{i + 1}</div>
                <p className="cp-ss-point-text">{text}</p>
              </div>
            ))}
          </div>
          </div>
          <div className="cp-ss-metrics">
            {metrics.map((m, i) => (
              <div key={i} className="cp-ss-metric campus-card campus-rise" style={enterDelay(8 + i)}>
                <div className="cp-ss-metric-label">{m?.label}</div>
                <div className="cp-ss-metric-value">{m?.value}</div>
              </div>
            ))}
          </div>
          {tags.length > 0 && (
            <div className="cp-ss-tags">
              {tags.map((tag, i) => (
                <div key={i} className="cp-ss-tag campus-rise" style={enterDelay(10 + i)}>
                  <div className="cp-ss-tag-box" aria-hidden="true"><div className="cp-ss-tag-box-shape" /><CheckGlyph size={18} /></div>
                  <div className="cp-ss-tag-text">{tag}</div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="cp-ss-slogan campus-rise" style={{ left: sloganX + 52, top: top + 96, ...enterDelay(6) }}>{p.sloganA}</div>
        <div className="cp-ss-slogan is-b campus-rise" style={{ left: sloganX, top: top + 96 + 150, ...enterDelay(7) }}>{p.sloganB}</div>
      </div>
    </CampusFrame>
  );
}

ScrollStory.META = {
  id: 'scroll-story',
  label: '特色 · 卷轴大卡配照片要点与指标',
  roles: ['case', 'context', 'metrics'],
  defaults: DEFAULTS,
  copyBudgets: { ribbon: 12, badge: 4, bigText: 6, heading: 16, subline: 26, sectionTitle: 8, 'points[]': 30, 'metrics[].label': 8, 'metrics[].value': 6, 'tags[]': 5, sloganA: 6, sloganB: 6 },
  controls: [
    { ...CHAPTER_CONTROL, default: 1 },
    { key: 'pointCount', type: 'number', label: '要点数量', default: 4, min: 3, max: 4, description: '右侧编号要点的条数。' },
    { key: 'metricCount', type: 'number', label: '指标数量', default: 3, min: 2, max: 3, description: '要点下方的小指标卡数量。' },
    { key: 'tagCount', type: 'number', label: '标签数量', default: 4, min: 0, max: 4, description: '底部勾选标签的数量;0 表示不显示。' },
  ],
};
