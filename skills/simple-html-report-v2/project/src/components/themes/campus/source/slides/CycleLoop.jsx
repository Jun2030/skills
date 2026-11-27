// 闭环图:3–5 个渐变圆形环节沿圆环首尾相接(带方向箭头),圆心是主题词;右侧用书签编号卡逐条说明每个环节。
// 适合迭代机制、反馈循环、PDCA 这类「转一圈又回到起点」的过程。
import React from 'react';
import { useThemeStyle, enterDelay } from '../../../shared/style.jsx';
import { safeArray, clamp } from '../../../chart-safety.mjs';
import { CampusFrame, TitleRow, ConclusionBar, CHAPTER_CONTROL } from '../kit/chrome.jsx';
import { polar, IndexCard } from '../kit/parts.jsx';

const DEFAULTS = {
  chapterIndex: 3,
  stepCount: 4,
  showConclusion: true,
  sectionNo: '3.2',
  title: '内容生产的闭环机制',
  centerTitle: '闭环迭代',
  centerNote: '数据 → 创作',
  steps: [
    { no: '01', name: '数据评估', title: '量化评估每支作品', desc: '以点击率、完播率、互动率等核心指标评估每支作品的表现，并用 A/B 测试比较不同封面与标题的效果。' },
    { no: '02', name: '流程反馈', title: '把结论写回流程', desc: '把复盘结论沉淀到选题库与协作表格，据此调整选题方向、脚本结构与制作节点，形成可执行的流程规范。' },
    { no: '03', name: '回流创作', title: '指导下一轮创作', desc: '新的选题与表达方式回到视频创作本身，在下一轮作品中验证改进效果，逐步形成可复制的内容生产模型。' },
    { no: '04', name: '发布测试', title: '小范围发布验证', desc: '借助点映团等方式先在小范围观众中验证，再正式发布并持续收集新的数据，进入下一轮评估。' },
    { no: '05', name: '第五环节', title: '第五个环节的标题', desc: '在这里说明这个环节做什么、产出什么。' },
  ],
  conclusionLabel: '机制要点',
  conclusion: '数据不是终点而是起点：每一次评估都回流为下一次创作的依据。',
};

const VB = 600;
const C = VB / 2;
const RING = 212;

const CSS = `
.cp-cy{flex:1;min-height:0;display:flex;gap:56px;}
.cp-cy-figure{position:relative;flex:none;height:100%;aspect-ratio:1 / 1;}
.cp-cy-figure svg{position:absolute;inset:0;width:100%;height:100%;overflow:visible;}
.cp-cy-halo{fill:none;stroke:rgb(var(--theme-accent-rgb) / .08);stroke-width:34;}
.cp-cy-core{fill:var(--theme-surface);stroke:var(--campus-accent-line);stroke-width:2;stroke-dasharray:3 8;stroke-linecap:round;}
.cp-cy-arc{fill:none;stroke:var(--theme-accent);stroke-width:5;stroke-linecap:round;}
.cp-cy-head{fill:var(--theme-accent);}
.cp-cy-node{position:absolute;transform:translate(-50%,-50%);border-radius:50%;background:var(--campus-fill);box-shadow:0 0 0 8px rgb(var(--theme-accent-rgb) / .12),0 12px 24px rgb(var(--theme-accent-rgb) / .3);}
.cp-cy-center{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);display:flex;flex-direction:column;align-items:center;gap:10px;text-align:center;}
.cp-cy-center-spark{width:30px;height:4px;border-radius:2px;background:var(--campus-spark);}
.cp-cy-center-title{font-family:var(--theme-font-serif);font-weight:700;font-size:42px;line-height:1.15;letter-spacing:.08em;color:var(--theme-accent);white-space:nowrap;}
.cp-cy-center-note{font-size:19px;letter-spacing:.06em;color:var(--theme-muted);white-space:nowrap;}
.cp-cy-label{position:absolute;transform:translate(-50%,-50%);display:flex;flex-direction:column;align-items:center;gap:6px;color:var(--theme-on-accent);text-align:center;}
.cp-cy-label-no{font-family:var(--theme-font-serif);font-weight:700;font-size:24px;line-height:1;color:var(--campus-spark);font-variant-numeric:lining-nums;}
.cp-cy-label-name{font-family:var(--theme-font-serif);font-weight:700;font-size:27px;line-height:1.15;letter-spacing:.06em;white-space:nowrap;}
.cp-cy-list{flex:1;min-width:0;display:grid;grid-auto-rows:minmax(0,1fr);row-gap:18px;padding-top:6px;}
`;

export function CycleLoop(props) {
  useThemeStyle('campus-cycle-loop-style', CSS);
  const p = { ...DEFAULTS, ...props };
  const steps = safeArray(p.steps).slice(0, clamp(p.stepCount, 3, 5));
  const n = Math.max(1, steps.length);
  const nodeR = n >= 5 ? 66 : 76;
  const span = 360 / n;
  // 箭头弧线在两个节点之间留出空隙:空隙的半角由节点半径和圆环半径决定。
  const gap = (Math.asin(clamp((nodeR + 16) / RING, 0, 1)) * 180) / Math.PI;
  const nodes = steps.map((_, i) => polar(C, C, RING, i * span));
  const arcs = steps.map((_, i) => {
    const from = i * span + gap;
    const to = (i + 1) * span - gap - 3;
    const a = polar(C, C, RING, from);
    const b = polar(C, C, RING, to);
    // 箭头:沿顺时针切线方向,尖端略超出弧线终点。
    const tip = polar(C, C, RING, to + 4.2);
    const inner = polar(C, C, RING - 11, to - 1);
    const outer = polar(C, C, RING + 11, to - 1);
    return { d: `M ${a.x} ${a.y} A ${RING} ${RING} 0 0 1 ${b.x} ${b.y}`, head: `${tip.x},${tip.y} ${inner.x},${inner.y} ${outer.x},${outer.y}` };
  });
  const pct = v => `${(v / VB) * 100}%`;
  return (
    <CampusFrame chapterIndex={p.chapterIndex}>
      <TitleRow no={p.sectionNo} title={p.title} className="campus-rise" style={enterDelay(0)} />
      <div className="cp-cy">
        <div className="cp-cy-figure">
          <svg viewBox={`0 0 ${VB} ${VB}`} aria-hidden="true">
            <circle className="cp-cy-halo campus-fade" style={enterDelay(1)} cx={C} cy={C} r={RING} />
            <circle className="cp-cy-core campus-fade" style={enterDelay(1)} cx={C} cy={C} r={RING - nodeR - 34} />
            {arcs.map((arc, i) => (
              <g className="campus-fade" style={enterDelay(3 + i)} key={`a${i}`}>
                <path className="cp-cy-arc" d={arc.d} />
                <polygon className="cp-cy-head" points={arc.head} />
              </g>
            ))}
          </svg>
          {nodes.map((pt, i) => (
            <div className="cp-cy-node campus-fade" style={{ left: pct(pt.x), top: pct(pt.y), width: pct(nodeR * 2), height: pct(nodeR * 2), ...enterDelay(2 + i) }} key={`n${i}`} />
          ))}
          <div className="cp-cy-center campus-fade" style={enterDelay(2)}>
            <div className="cp-cy-center-spark" aria-hidden="true" />
            <div className="cp-cy-center-title">{p.centerTitle}</div>
            <div className="cp-cy-center-note">{p.centerNote}</div>
          </div>
          {nodes.map((pt, i) => (
            <div className="cp-cy-label campus-fade" style={{ left: pct(pt.x), top: pct(pt.y), ...enterDelay(2 + i) }} key={i}>
              <div className="cp-cy-label-no">{steps[i]?.no}</div>
              <div className="cp-cy-label-name">{steps[i]?.name}</div>
            </div>
          ))}
        </div>
        <div className={`cp-cy-list is-${n}`}>
          {steps.map((step, i) => (
            <IndexCard className="campus-rise" style={enterDelay(3 + i)} key={i} no={step?.no} title={step?.title} desc={step?.desc} compact={n >= 5} />
          ))}
        </div>
      </div>
      {p.showConclusion && <ConclusionBar label={p.conclusionLabel} text={p.conclusion} className="campus-rise" style={enterDelay(9)} />}
    </CampusFrame>
  );
}

CycleLoop.META = {
  id: 'cycle-loop',
  label: '闭环图 · 环节首尾相接配逐条说明',
  roles: ['process', 'relationship'],
  defaults: DEFAULTS,
  copyBudgets: { 'steps[].name': 4, 'steps[].title': 14, 'steps[].desc': 50, centerTitle: 5, conclusion: 44 },
  controls: [
    { ...CHAPTER_CONTROL, default: 3 },
    { key: 'stepCount', type: 'number', label: '环节数量', default: 4, min: 3, max: 5, description: '闭环上的环节数,右侧说明随之增减。' },
    { key: 'showConclusion', type: 'toggle', label: '底部结论条', default: true, description: '页面底部的校色结论条。' },
  ],
};
