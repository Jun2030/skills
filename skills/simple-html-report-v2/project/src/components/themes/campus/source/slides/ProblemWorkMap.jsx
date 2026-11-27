// 研究内容总览(问题 → 工作 → 目标):左列 2–5 个「待解决的问题」,右列一一对应的「本文工作」,中间箭头成对连接;
// 所有工作再经汇聚连线指向最右侧的「研究目标」(也可放到底部)。和成对条目的区别是有明确的方向、连线和汇聚点。
// 适合硕士 / 博士答辩的研究内容总览、开题的「问题 → 研究内容」映射。
import React from 'react';
import { useThemeStyle, enterDelay } from '../../../shared/style.jsx';
import { safeArray, clamp } from '../../../chart-safety.mjs';
import { CampusFrame, TitleRow, SparkStar, CHAPTER_CONTROL } from '../kit/chrome.jsx';
import { useStructureStyle, LinkDot } from '../kit/structure.jsx';
import { useNarrativeStyle, EmText, NarrIcon, r2 } from '../kit/narrative.jsx';

const DEFAULTS = {
  chapterIndex: 3,
  pairCount: 4,
  goalPosition: 'right',
  sectionNo: '3.0',
  title: '研究内容总览',
  problemLabel: '待解决的问题',
  workLabel: '本文工作',
  goalLabel: '研究目标',
  pairs: [
    { no: '01', problem: '城市环境信号弱，长时间相干积分受导航比特跳变限制', workTitle: '消除比特跳变限制', work: '用最大似然估计检测比特边缘，延长相干积分时间' },
    { no: '02', problem: '积分时间加长后可容忍频偏减小，能量损失增大', workTitle: '频率稳定度传递', work: '强信号通道辅助补偿弱信号通道的频率偏差' },
    { no: '03', problem: '多路径、遮挡导致观测量异常，滤波器易发散', workTitle: '权函数抗差估计', work: '观测量分三类定权，结合惯导预报剔除粗差' },
    { no: '04', problem: '缺少可验证算法的深组合软件平台', workTitle: '搭建仿真平台', work: '软件接收机、惯导解算与导航滤波器一体化' },
    { no: '05', problem: '在这里写第五个待解决的问题', workTitle: '对应的本文工作', work: '一句话说明这项工作怎么解决左侧的问题' },
  ],
  goal: '在城市复杂环境下实现**正常、精确、连续**的北斗 / INS 深组合定位',
};

const CSS = `
.cp-g1-pw{flex:1;min-height:0;display:flex;flex-direction:column;}
/* 栏头:三枚标签与下方三列对齐 */
.cp-g1-pw-heads{flex:none;display:grid;grid-template-columns:var(--cp-g1-pw-cols);align-items:center;margin-bottom:10px;}
.cp-g1-pw-heads > .campus-chip{justify-self:start;}
.cp-g1-pw-heads .is-problem{background:var(--campus-neutral);box-shadow:none;}
.cp-g1-pw-heads .is-goal{justify-self:center;}
.cp-g1-pw-stage{position:relative;flex:1;min-height:0;display:grid;grid-template-columns:var(--cp-g1-pw-cols);}
.cp-g1-pw-rows{grid-column:1 / span 3;min-height:0;display:grid;grid-template-columns:subgrid;grid-auto-rows:minmax(0,1fr);}
/* 每行用上下内边距留缝(而不是 gap),各行中心正好落在 (i + .5) / n 处,汇聚连线据此对齐 */
.cp-g1-pw-row{min-height:0;display:grid;grid-template-columns:subgrid;grid-column:1 / -1;padding:9px 0;}
.cp-g1-pw-prob{position:relative;min-width:0;display:flex;align-items:center;gap:18px;padding:12px 24px 12px 20px;border-radius:var(--campus-radius);background:var(--campus-neutral-wash);border:1.5px dashed var(--campus-neutral-soft);}
.cp-g1-pw-qno{flex:none;width:46px;height:46px;display:grid;place-items:center;border-radius:50%;background:var(--theme-surface);box-shadow:inset 0 0 0 2px var(--campus-neutral-soft);font-family:var(--theme-font-serif);font-weight:700;font-size:21px;line-height:1;color:var(--theme-muted);font-variant-numeric:lining-nums;}
.cp-g1-pw-ptext{min-width:0;font-size:22px;line-height:1.5;color:var(--theme-ink);text-wrap:pretty;}
.cp-g1-pw-link{position:relative;display:flex;align-items:center;justify-content:center;}
.cp-g1-pw-link-line{position:absolute;left:0;right:0;top:50%;height:2px;margin-top:-1px;background:linear-gradient(90deg,var(--campus-neutral-soft) 0%,rgb(var(--theme-accent-rgb) / .6) 100%);}
.cp-g1-pw-link .campus-link-dot{position:relative;}
.cp-g1-pw-work{position:relative;min-width:0;display:flex;align-items:center;gap:18px;padding:12px 24px 12px 22px;}
.cp-g1-pw-work .campus-seal{height:46px;min-width:46px;font-size:21px;}
.cp-g1-pw-wtext{min-width:0;}
.cp-g1-pw-wtitle{font-family:var(--theme-font-serif);font-weight:700;font-size:26px;line-height:1.25;letter-spacing:.03em;color:var(--theme-accent);}
.cp-g1-pw-wdesc{margin-top:4px;font-size:20px;line-height:1.45;color:var(--theme-muted);text-wrap:pretty;}
/* 汇聚连线:SVG 只画线,圆点与箭头是 HTML 小块 */
.cp-g1-pw-merge{position:relative;grid-column:4;min-height:0;}
.cp-g1-pw-merge svg{position:absolute;inset:0;width:100%;height:100%;overflow:visible;color:var(--theme-accent);}
.cp-g1-pw-mdot{position:absolute;left:-6px;width:12px;height:12px;margin-top:-6px;border-radius:50%;background:var(--theme-surface);box-shadow:inset 0 0 0 3px var(--theme-accent);}
.cp-g1-pw-mhead{position:absolute;right:-2px;top:50%;width:16px;height:22px;margin-top:-11px;background:var(--theme-accent);clip-path:polygon(0 0,100% 50%,0 100%);}
/* 目标面板:高渐变卡,靶心图标 + 目标句 */
.cp-g1-pw-goal{position:relative;isolation:isolate;grid-column:5;min-height:0;display:flex;flex-direction:column;justify-content:center;gap:22px;margin:9px 0;padding:30px 30px;border-radius:var(--campus-radius-lg);background:var(--campus-fill-deep);color:var(--theme-on-accent);box-shadow:var(--campus-shadow-lift);overflow:hidden;}
.cp-g1-pw-ring{position:absolute;z-index:-1;right:-90px;bottom:-90px;width:300px;height:300px;border-radius:50%;border:2px solid rgb(255 255 255 / .12);pointer-events:none;}
.cp-g1-pw-ring.is-2{right:-40px;bottom:-40px;width:200px;height:200px;border-color:rgb(255 255 255 / .16);}
.cp-g1-pw-ring.is-3{right:10px;bottom:10px;width:100px;height:100px;background:rgb(255 255 255 / .08);border:0;}
.cp-g1-pw-gicon{width:76px;height:76px;display:grid;place-items:center;border-radius:50%;background:var(--campus-on-accent-glass);box-shadow:inset 0 0 0 1.5px var(--campus-on-accent-line);}
.cp-g1-pw-gtext{font-family:var(--theme-font-serif);font-weight:700;font-size:31px;line-height:1.5;letter-spacing:.03em;text-wrap:pretty;}
.cp-g1-pw-gstar{display:flex;align-items:center;gap:8px;color:var(--campus-spark);}
.cp-g1-pw-gstar-line{flex:1;height:2px;border-radius:1px;background:linear-gradient(90deg,var(--campus-spark) 0%,rgb(255 255 255 / 0) 100%);}
/* 目标在底部:三列铺满宽度,下方一条汇聚括线 + 目标色带 */
.cp-g1-pw.is-bottom .cp-g1-pw-rows{grid-column:1 / span 3;}
.cp-g1-pw-funnel{position:relative;flex:none;height:44px;color:var(--theme-accent);}
.cp-g1-pw-funnel svg{position:absolute;inset:0;width:100%;height:100%;overflow:visible;}
.cp-g1-pw-band{position:relative;isolation:isolate;flex:none;display:flex;align-items:center;gap:22px;min-height:96px;padding:12px 40px 12px 16px;border-radius:var(--campus-radius);background:var(--campus-fill-deep);color:var(--theme-on-accent);box-shadow:var(--campus-shadow-lift);overflow:hidden;}
.cp-g1-pw-band .cp-g1-pw-gicon{flex:none;width:64px;height:64px;}
.cp-g1-pw-band-label{flex:none;display:flex;align-items:center;gap:10px;height:46px;padding:0 20px 0 16px;border-radius:999px;background:var(--campus-on-accent-glass);font-family:var(--theme-font-serif);font-weight:700;font-size:23px;letter-spacing:.12em;white-space:nowrap;}
.cp-g1-pw-band .cp-g1-pw-gtext{font-size:28px;line-height:1.45;}
/* 行多时收紧 */
.cp-g1-pw.is-5 .cp-g1-pw-row{padding:7px 0;}
.cp-g1-pw.is-5 .cp-g1-pw-ptext{font-size:21px;line-height:1.42;}
.cp-g1-pw.is-5 .cp-g1-pw-wtitle{font-size:24px;}
.cp-g1-pw.is-5 .cp-g1-pw-wdesc{font-size:19px;line-height:1.38;}
.cp-g1-pw.is-2 .cp-g1-pw-row,.cp-g1-pw.is-3 .cp-g1-pw-row{padding:14px 0;}
.cp-g1-pw.is-2 .cp-g1-pw-ptext,.cp-g1-pw.is-3 .cp-g1-pw-ptext{font-size:24px;line-height:1.6;}
.cp-g1-pw.is-2 .cp-g1-pw-wtitle,.cp-g1-pw.is-3 .cp-g1-pw-wtitle{font-size:29px;}
.cp-g1-pw.is-2 .cp-g1-pw-wdesc,.cp-g1-pw.is-3 .cp-g1-pw-wdesc{font-size:22px;line-height:1.55;margin-top:8px;}
.campus[data-campus-nav="rail"] .cp-g1-pw-gtext{font-size:28px;}
`;

export function ProblemWorkMap(props) {
  useStructureStyle();
  useNarrativeStyle();
  useThemeStyle('campus-problem-work-map-style', CSS);
  const p = { ...DEFAULTS, ...props };
  const pairs = safeArray(p.pairs).slice(0, clamp(p.pairCount, 2, 5));
  const n = pairs.length;
  const bottom = p.goalPosition === 'bottom';
  const cols = bottom
    ? 'minmax(0,1fr) 96px minmax(0,1.12fr)'
    : 'minmax(0,1fr) 84px minmax(0,1.12fr) 92px minmax(0,.72fr)';
  const centers = pairs.map((_, i) => r2(((i + 0.5) / n) * 100));
  return (
    <CampusFrame chapterIndex={p.chapterIndex}>
      <TitleRow no={p.sectionNo} title={p.title} className="campus-rise" style={enterDelay(0)} />
      <div className={`cp-g1-pw is-${n}${bottom ? ' is-bottom' : ''}`} style={{ '--cp-g1-pw-cols': cols }}>
        <div className="cp-g1-pw-heads campus-rise" style={enterDelay(1)}>
          <div className="campus-chip is-problem">{p.problemLabel}</div>
          <div />
          <div className="campus-chip">{p.workLabel}</div>
          {!bottom && <div />}
          {!bottom && <div className="campus-chip is-goal">{p.goalLabel}</div>}
        </div>
        <div className="cp-g1-pw-stage">
          <div className="cp-g1-pw-rows">
            {pairs.map((pair, i) => (
              <div className="cp-g1-pw-row campus-rise" style={enterDelay(2 + i)} key={i}>
                <div className="cp-g1-pw-prob">
                  <div className="cp-g1-pw-qno">{pair?.no}</div>
                  <EmText className="cp-g1-pw-ptext" text={pair?.problem} />
                </div>
                <div className="cp-g1-pw-link">
                  <div className="cp-g1-pw-link-line" aria-hidden="true" />
                  <LinkDot direction="right" size={40} />
                </div>
                <div className="cp-g1-pw-work campus-card">
                  <div className="campus-seal" aria-hidden="true"><NarrIcon name="check" size={24} stroke={2.6} /></div>
                  <div className="cp-g1-pw-wtext">
                    <div className="cp-g1-pw-wtitle">{pair?.workTitle}</div>
                    <EmText className="cp-g1-pw-wdesc" text={pair?.work} />
                  </div>
                </div>
              </div>
            ))}
          </div>
          {!bottom && (
            <>
              <div className="cp-g1-pw-merge campus-fade" style={enterDelay(3 + n)} aria-hidden="true">
                <svg viewBox="0 0 100 100" preserveAspectRatio="none">
                  {centers.map((y, i) => (
                    <path key={i} d={`M0 ${y} C 52 ${y}, 46 50, 98 50`} fill="none" stroke="currentColor" strokeOpacity=".55" strokeWidth="2.5" vectorEffect="non-scaling-stroke" />
                  ))}
                </svg>
                {centers.map((y, i) => <div className="cp-g1-pw-mdot" style={{ top: `${y}%` }} key={i} />)}
                <div className="cp-g1-pw-mhead" />
              </div>
              <section className="cp-g1-pw-goal campus-rise" style={enterDelay(4 + n)}>
                <div className="cp-g1-pw-ring" aria-hidden="true" />
                <div className="cp-g1-pw-ring is-2" aria-hidden="true" />
                <div className="cp-g1-pw-ring is-3" aria-hidden="true" />
                <div className="cp-g1-pw-gicon" aria-hidden="true"><NarrIcon name="target" size={42} stroke={1.8} /></div>
                <div className="cp-g1-pw-gstar" aria-hidden="true"><SparkStar size={20} /><div className="cp-g1-pw-gstar-line" /></div>
                <EmText className="cp-g1-pw-gtext cp-g1-on-fill" text={p.goal} />
              </section>
            </>
          )}
        </div>
        {bottom && (
          <>
            <div className="cp-g1-pw-funnel campus-fade" style={enterDelay(3 + n)} aria-hidden="true">
              <svg viewBox="0 0 100 44" preserveAspectRatio="none">
                <path d="M1 2 V14 Q1 22 9 22 H44 Q50 22 50 30 V42" fill="none" stroke="currentColor" strokeOpacity=".7" strokeWidth="2.5" vectorEffect="non-scaling-stroke" />
                <path d="M99 2 V14 Q99 22 91 22 H56 Q50 22 50 30 V42" fill="none" stroke="currentColor" strokeOpacity=".7" strokeWidth="2.5" vectorEffect="non-scaling-stroke" />
              </svg>
            </div>
            <section className="cp-g1-pw-band campus-rise" style={enterDelay(4 + n)}>
              <div className="cp-g1-pw-gicon" aria-hidden="true"><NarrIcon name="target" size={36} stroke={1.8} /></div>
              <div className="cp-g1-pw-band-label"><div>{p.goalLabel}</div></div>
              <EmText className="cp-g1-pw-gtext cp-g1-on-fill" text={p.goal} />
            </section>
          </>
        )}
      </div>
    </CampusFrame>
  );
}

ProblemWorkMap.META = {
  id: 'problem-work-map',
  label: '研究内容总览 · 问题到工作汇聚目标',
  roles: ['breakdown', 'relationship', 'context'],
  defaults: DEFAULTS,
  copyBudgets: {
    problemLabel: 7,
    workLabel: 7,
    goalLabel: 6,
    'pairs[].no': 3,
    'pairs[].problem': 30,
    'pairs[].workTitle': 10,
    'pairs[].work': 26,
    goal: 40,
  },
  controls: [
    { ...CHAPTER_CONTROL, default: 3 },
    { key: 'pairCount', type: 'number', label: '问题数量', default: 4, min: 2, max: 5, description: '「问题 → 本文工作」的对数;每对左侧一个待解决的问题,右侧对应的工作。' },
    { key: 'goalPosition', type: 'radio', label: '研究目标位置', default: 'right', options: [{ value: 'right', label: '最右侧' }, { value: 'bottom', label: '底部' }], description: '各项工作汇聚到的「研究目标」放在最右侧(汇聚连线)还是底部(括线 + 色带)。' },
  ],
};
