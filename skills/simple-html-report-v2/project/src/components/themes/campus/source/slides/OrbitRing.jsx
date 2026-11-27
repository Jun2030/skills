// 环形轨道(特色页):中心一枚主题圆(外面一圈分成三段的玻璃盘,写三个关键词),外围一段粗弧形轨道,
// 从左上沿逆时针经底部绕到右上,颜色由校色渐变到点缀金;轨道上挂 3–6 个编号节点,
// 每个节点用虚线引到两侧的说明;顶部一句主张,底部可选一条阶段条(3–6 步)。
// 轨道、节点圆、玻璃盘是 SVG 图形;编号、主张、关键词、说明、阶段文字都是 HTML 文本。
import React from 'react';
import { useThemeStyle, enterDelay } from '../../../shared/style.jsx';
import { safeArray, safeRatio, clamp } from '../../../chart-safety.mjs';
import { CampusFrame, TitleRow, CHAPTER_CONTROL, TITLE_ROW_SPACE, useCampusLayout } from '../kit/chrome.jsx';
import { polar } from '../kit/parts.jsx';
import { useFeatureAStyle, LinearGrad, RadialGrad, BlurFilter, IconOrb, ChevronRun } from '../kit/feature-a.jsx';

const DEFAULTS = {
  chapterIndex: 2,
  nodeCount: 5,
  showStages: true,
  stageCount: 6,
  sectionNo: '2.7',
  title: '营运管理分析',
  headline: '多维度计量 · 支持精细化管理',
  hubTitle: '多维盈利分析',
  hubNote: 'PROFITABILITY ANALYSIS',
  keywords: ['维度计量', '动因分析', '精细管理'],
  nodes: [
    { no: '1', title: '区域维度', desc: '按地区计量收入与成本，比较各区域的盈利能力，找出盈亏动因。' },
    { no: '2', title: '产品维度', desc: '按产品归集收入与成本，识别盈利与亏损的产品，支持产品结构调整。' },
    { no: '3', title: '部门维度', desc: '以部门为单元计量业绩，支持统一领导、分级管理的责任考核。' },
    { no: '4', title: '渠道维度', desc: '比较不同销售渠道的投入与产出，为渠道资源配置提供依据。' },
    { no: '5', title: '人员维度', desc: '计量人员层面的业绩贡献，为绩效管理提供数据依据。' },
    { no: '6', title: '示例维度', desc: '轨道上最多 6 个节点，这一条是补充位的示例文字。' },
  ],
  stagesLabel: '六个程序',
  stages: [
    { no: '01', title: '确定分析维度' },
    { no: '02', title: '建立分析模型' },
    { no: '03', title: '制定数据标准' },
    { no: '04', title: '收集数据' },
    { no: '05', title: '加工数据' },
    { no: '06', title: '编制分析报告' },
  ],
};

const CSS = `
.cp-or{position:relative;flex:1;min-height:0;}
.cp-or-svg{position:absolute;left:0;top:0;overflow:visible;}
.cp-or-headline{position:absolute;left:0;right:0;top:0;display:flex;align-items:center;justify-content:center;gap:22px;}
.cp-or-headline-text{font-family:var(--theme-font-serif);font-weight:700;font-size:44px;line-height:1.15;letter-spacing:.1em;color:var(--theme-accent);white-space:nowrap;}
.cp-or-headline-line{flex:none;width:90px;height:3px;border-radius:2px;background:var(--campus-fade-line);}
.cp-or-headline-line.is-left{transform:scaleX(-1);}
.cp-or-hub{position:absolute;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;color:var(--theme-on-accent);text-align:center;}
.cp-or-hub-spark{width:30px;height:3px;border-radius:2px;background:var(--campus-spark);}
.cp-or-hub-title{max-width:86%;font-family:var(--theme-font-serif);font-weight:700;font-size:36px;line-height:1.2;letter-spacing:.06em;text-wrap:balance;}
.cp-or-hub-note{font-size:13px;font-weight:600;letter-spacing:.16em;color:var(--campus-on-accent-muted);}
.cp-or-key{position:absolute;transform:translate(-50%,-50%);font-family:var(--theme-font-serif);font-weight:700;font-size:23px;line-height:1.2;letter-spacing:.12em;color:var(--campus-accent-soft);white-space:nowrap;}
.cp-or-node{position:absolute;transform:translate(-50%,-50%);font-family:var(--theme-font-serif);font-weight:700;font-size:34px;line-height:1;color:var(--theme-accent);font-variant-numeric:lining-nums;}
.cp-or-node.is-gold{color:var(--campus-spark-lo);}
.cp-or-desc{position:absolute;display:flex;flex-direction:column;justify-content:center;}
.cp-or-desc-head{display:flex;align-items:center;gap:16px;}
.cp-or-desc.is-left{align-items:flex-end;text-align:right;}
.cp-or-desc.is-left .cp-or-desc-head{flex-direction:row-reverse;}
.cp-or-desc-title{font-family:var(--theme-font-serif);font-weight:700;font-size:29px;line-height:1.2;letter-spacing:.06em;color:var(--theme-accent);}
.cp-or-desc.is-gold .cp-or-desc-title{color:var(--campus-spark-lo);}
.cp-or-desc-text{margin-top:10px;font-size:21px;line-height:1.6;color:var(--theme-muted);text-wrap:pretty;}
.cp-or-icon{display:block;}
/* 底部阶段条 */
.cp-or-stages{position:relative;flex:none;display:flex;align-items:center;gap:14px;height:96px;margin-top:18px;padding:0 28px 0 14px;border-radius:48px;}
.cp-or-stages-label{flex:none;display:flex;align-items:center;gap:16px;padding-right:22px;margin-right:6px;border-right:1.5px dashed var(--campus-accent-line);}
.cp-or-stages-label-text{font-family:var(--theme-font-serif);font-weight:700;font-size:28px;letter-spacing:.08em;color:var(--theme-accent);white-space:nowrap;}
.cp-or-stage{flex:1;min-width:0;display:flex;flex-direction:column;justify-content:center;gap:6px;}
.cp-or-stage-no{font-family:var(--theme-font-serif);font-weight:700;font-size:22px;line-height:1;color:var(--theme-accent);font-variant-numeric:lining-nums;}
.cp-or-stage:last-child .cp-or-stage-no{color:var(--campus-spark-lo);}
.cp-or-stage-title{font-size:21px;line-height:1.3;font-weight:600;color:var(--theme-ink);}
.cp-or-stage-arrow{flex:none;color:var(--campus-accent-line);}
`;

const KEY_ICON = (
  <svg className="cp-or-icon" width="26" height="26" viewBox="0 0 26 26" aria-hidden="true">
    <circle cx="13" cy="13" r="8" stroke="currentColor" strokeWidth="2.6" fill="none" />
    <circle cx="13" cy="13" r="3" fill="currentColor" />
    <path d="M13 1 V5 M13 21 V25 M1 13 H5 M21 13 H25" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
  </svg>
);
const FLAG_ICON = (
  <svg width="30" height="30" viewBox="0 0 30 30" aria-hidden="true">
    <path d="M4 26 L26 15 L4 4 L8 15 Z" fill="currentColor" />
  </svg>
);

export function OrbitRing(props) {
  useThemeStyle('campus-orbit-ring-style', CSS);
  useFeatureAStyle();
  const p = { ...DEFAULTS, ...props };
  const { bodyW, bodyH } = useCampusLayout();
  const nodes = safeArray(p.nodes).slice(0, clamp(p.nodeCount, 3, 6));
  const stages = safeArray(p.stages).slice(0, clamp(p.stageCount, 3, 6));
  const keywords = safeArray(p.keywords).slice(0, 3);
  const n = Math.max(1, nodes.length);
  const W = bodyW;
  const H = bodyH - TITLE_ROW_SPACE - (p.showStages ? 114 : 0);
  const headH = 62;
  // 轨道:圆心在主张下方的剩余区域正中;半径受高度和宽度双重限制。
  const R = Math.round(Math.min((H - headH) / 2 - 50, W * 0.17));
  const cx = W / 2;
  const cy = headH + (H - headH) / 2 - 4;
  const Rh = Math.round(R * 0.46);
  const Rm = Math.round(R * 0.8);
  // 轨道从左上(-50°)沿逆时针经底部到右上(50°):共 260°。节点均匀分布。
  const A0 = 310;
  const A1 = 50;
  const span = A0 - A1;
  const angleOf = i => A0 - safeRatio(i, n - 1, 0.5) * span;
  const arcPt = deg => polar(cx, cy, R, deg);
  const start = arcPt(A0);
  const end = arcPt(A1);
  const arcPath = `M${start.x} ${start.y} A${R} ${R} 0 1 0 ${end.x} ${end.y}`;
  const inner = polar(cx, cy, R - 10, A0);
  const innerEnd = polar(cx, cy, R - 10, A1);
  const innerPath = `M${inner.x} ${inner.y} A${R - 10} ${R - 10} 0 1 0 ${innerEnd.x} ${innerEnd.y}`;
  const leftCount = Math.ceil(n / 2);
  const placed = nodes.map((node, i) => ({ node, i, deg: angleOf(i), pt: arcPt(angleOf(i)), left: i < leftCount, gold: safeRatio(i, n - 1, 0) > 0.5 }));
  // 两侧说明:每列等分轨道区的高度,按节点由上到下排列。
  const colGap = 92;
  const colW = Math.round(cx - R - colGap);
  const areaTop = headH + 10;
  const areaH = H - areaTop;
  const columns = [placed.filter(d => d.left), placed.filter(d => !d.left).reverse()];
  const descs = columns.flatMap((col, side) => col.map((d, j) => {
    const slot = areaH / col.length;
    const y = areaTop + slot * j;
    return { ...d, side: side === 0 ? 'left' : 'right', x: side === 0 ? 0 : W - colW, y, h: slot };
  }));
  const at = r => ({ left: cx - r, top: cy - r, width: r * 2, height: r * 2 });
  return (
    <CampusFrame chapterIndex={p.chapterIndex}>
      <TitleRow no={p.sectionNo} title={p.title} className="campus-rise" style={enterDelay(0)} />
      <div className="cp-or">
        <svg className="cp-or-svg campus-fade" style={{ width: W, height: H, ...enterDelay(1) }} viewBox={`0 0 ${W} ${H}`} aria-hidden="true">
          <defs>
            <LinearGrad id="cp-or-arc" x1={0} y1={0} x2={1} y2={0} stops={[[0, 'var(--campus-accent-hi)'], [0.38, 'var(--theme-accent)'], [0.62, 'var(--campus-spark-lo)'], [1, 'var(--campus-spark)']]} />
            <RadialGrad id="cp-or-hub" cx={0.38} cy={0.32} r={0.8} stops={[[0, 'var(--campus-accent-hi)'], [0.55, 'var(--theme-accent)'], [1, 'var(--campus-accent-lo)']]} />
            <RadialGrad id="cp-or-disk" stops={[[0.55, 'rgb(255 255 255 / .9)'], [1, 'var(--campus-accent-mist)']]} />
            <RadialGrad id="cp-or-halo" stops={[[0, 'rgb(var(--theme-accent-rgb) / .16)'], [1, 'rgb(var(--theme-accent-rgb) / 0)']]} />
            <BlurFilter id="cp-or-blur" std={14} />
            <BlurFilter id="cp-or-blur-s" std={5} />
          </defs>
          <circle cx={cx} cy={cy} r={R + 120} style={{ fill: 'url(#cp-or-halo)' }} />
          {/* 引线:节点到两侧说明的虚线折线 */}
          {descs.map(d => {
            const ex = d.side === 'left' ? d.x + colW + 18 : d.x - 18;
            const ey = d.y + d.h / 2;
            const mx = d.side === 'left' ? Math.min(d.pt.x - 40, ex + 40) : Math.max(d.pt.x + 40, ex - 40);
            return (
              <g key={`l${d.i}`}>
                <path d={`M${d.pt.x} ${d.pt.y} L${mx} ${ey} L${ex} ${ey}`} fill="none" style={{ stroke: d.gold ? 'var(--campus-spark)' : 'rgb(var(--theme-accent-rgb) / .45)' }} strokeWidth="2" strokeDasharray="2 7" strokeLinecap="round" />
                <circle cx={ex} cy={ey} r={5} style={{ fill: d.gold ? 'var(--campus-spark)' : 'var(--theme-accent)' }} />
              </g>
            );
          })}
          {/* 轨道:投影 + 粗弧 + 内侧高光 */}
          <path d={arcPath} fill="none" style={{ stroke: 'rgb(var(--theme-accent-rgb) / .28)' }} strokeWidth="40" strokeLinecap="round" filter="url(#cp-or-blur)" transform="translate(0 14)" />
          <path d={arcPath} fill="none" style={{ stroke: 'url(#cp-or-arc)' }} strokeWidth="38" strokeLinecap="round" />
          <path d={innerPath} fill="none" style={{ stroke: 'rgb(255 255 255 / .38)' }} strokeWidth="5" strokeLinecap="round" />
          {/* 中间的玻璃盘:三段分隔 */}
          <circle cx={cx} cy={cy} r={Rm} style={{ fill: 'url(#cp-or-disk)', stroke: 'rgb(255 255 255 / .95)' }} strokeWidth="2" />
          <circle cx={cx} cy={cy} r={Rm - 12} fill="none" style={{ stroke: 'rgb(var(--theme-accent-rgb) / .3)' }} strokeWidth="2" strokeDasharray="3 8" strokeLinecap="round" />
          {keywords.map((_, i) => {
            const a = polar(cx, cy, Rh + 6, i * 120);
            const b = polar(cx, cy, Rm - 12, i * 120);
            return <line key={`k${i}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} style={{ stroke: 'rgb(var(--theme-accent-rgb) / .22)' }} strokeWidth="2" />;
          })}
          {/* 主题圆 */}
          <circle cx={cx} cy={cy + 10} r={Rh} style={{ fill: 'rgb(var(--theme-accent-rgb) / .4)' }} filter="url(#cp-or-blur)" />
          <circle cx={cx} cy={cy} r={Rh + 8} style={{ fill: 'rgb(255 255 255 / .9)' }} />
          <circle cx={cx} cy={cy} r={Rh} style={{ fill: 'url(#cp-or-hub)' }} />
          <circle cx={cx} cy={cy} r={Rh - 9} fill="none" style={{ stroke: 'rgb(255 255 255 / .3)' }} strokeWidth="1.5" strokeDasharray="2 6" />
          {/* 节点:白色圆片 + 细环 */}
          {placed.map(d => (
            <g key={`n${d.i}`}>
              <circle cx={d.pt.x} cy={d.pt.y + 5} r={38} style={{ fill: 'rgb(var(--theme-accent-rgb) / .35)' }} filter="url(#cp-or-blur-s)" />
              <circle cx={d.pt.x} cy={d.pt.y} r={38} style={{ fill: 'rgb(255 255 255 / 1)', stroke: d.gold ? 'var(--campus-spark-hi)' : 'var(--campus-accent-pale)' }} strokeWidth="5" />
            </g>
          ))}
        </svg>
        <div className="cp-or-headline campus-rise" style={enterDelay(1)}>
          <div className="cp-or-headline-line is-left" aria-hidden="true" />
          <h3 className="cp-or-headline-text">{p.headline}</h3>
          <div className="cp-or-headline-line" aria-hidden="true" />
        </div>
        {keywords.map((word, i) => {
          const pt = polar(cx, cy, (Rh + Rm) / 2 + 2, i * 120 + 60);
          return <div key={i} className="cp-or-key campus-fade" style={{ left: pt.x, top: pt.y, ...enterDelay(2) }}>{word}</div>;
        })}
        <div className="cp-or-hub campus-fade" style={{ ...at(Rh), ...enterDelay(2) }}>
          <div className="cp-or-hub-spark" aria-hidden="true" />
          <div className="cp-or-hub-title">{p.hubTitle}</div>
          <div className="cp-or-hub-note">{p.hubNote}</div>
        </div>
        {placed.map(d => (
          <div key={d.i} className={`cp-or-node campus-fade${d.gold ? ' is-gold' : ''}`} style={{ left: d.pt.x, top: d.pt.y, ...enterDelay(3 + d.i) }}>{d.node?.no}</div>
        ))}
        {descs.map(d => (
          <div key={d.i} className={`cp-or-desc is-${d.side}${d.gold ? ' is-gold' : ''} campus-rise`} style={{ left: d.x, top: d.y, width: colW, height: d.h, ...enterDelay(3 + d.i) }}>
            <div className="cp-or-desc-head">
              <IconOrb size={54} gold={d.gold} ring={false}>{KEY_ICON}</IconOrb>
              <h3 className="cp-or-desc-title">{d.node?.title}</h3>
            </div>
            <p className="cp-or-desc-text">{d.node?.desc}</p>
          </div>
        ))}
      </div>
      {p.showStages && (
        <div className="cp-or-stages campus-fa-glass campus-rise" style={enterDelay(9)}>
          <div className="cp-or-stages-label">
            <IconOrb size={66} ring={false}>{FLAG_ICON}</IconOrb>
            <div className="cp-or-stages-label-text">{p.stagesLabel}</div>
          </div>
          {stages.map((stage, i) => (
            <React.Fragment key={i}>
              {i > 0 && <ChevronRun className="cp-or-stage-arrow" count={2} size={22} />}
              <div className="cp-or-stage">
                <div className="cp-or-stage-no">{stage?.no}</div>
                <div className="cp-or-stage-title">{stage?.title}</div>
              </div>
            </React.Fragment>
          ))}
        </div>
      )}
    </CampusFrame>
  );
}

OrbitRing.META = {
  id: 'orbit-ring',
  label: '特色 · 环形轨道编号节点配阶段条',
  roles: ['relationship', 'process', 'breakdown'],
  defaults: DEFAULTS,
  copyBudgets: { headline: 16, hubTitle: 8, 'keywords[]': 4, 'nodes[].title': 6, 'nodes[].desc': 34, stagesLabel: 5, 'stages[].title': 7 },
  controls: [
    { ...CHAPTER_CONTROL, default: 2 },
    { key: 'nodeCount', type: 'number', label: '节点数量', default: 5, min: 3, max: 6, description: '弧形轨道上的编号节点数;每个节点对应两侧的一条说明。' },
    { key: 'showStages', type: 'toggle', label: '底部阶段条', default: true, description: '页面底部的阶段 / 步骤条。' },
    { key: 'stageCount', type: 'number', label: '阶段数量', default: 6, min: 3, max: 6, description: '底部阶段条的步骤数。' },
  ],
};
