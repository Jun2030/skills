// 方法 + 内容路线:左侧方法清单(一项核心方法 + 若干具体方法),右侧 2–4 步研究内容 / 技术路线(上沿伸出编号标签的序号卡片,圆形箭头连接)。
import React from 'react';
import { useThemeStyle, enterDelay } from '../../../shared/style.jsx';
import { safeArray, clamp } from '../../../chart-safety.mjs';
import { CampusFrame, TitleRow, ConclusionBar, FlowArrow, CHAPTER_CONTROL } from '../kit/chrome.jsx';
import { NumberCard } from '../kit/parts.jsx';

const DEFAULTS = {
  chapterIndex: 2,
  methodCount: 2,
  stepCount: 3,
  showOutputs: true,
  showConclusion: true,
  sectionNo: '2.1',
  title: '研究方法与研究内容',
  methodsLabel: '研究方法',
  coreLabel: '核心方法',
  coreTitle: '个案研究法',
  coreDesc: '以影视飓风及其旗下账号为个案，梳理其发展轨迹和关键转折点。',
  methodsSubLabel: '具体方法',
  methods: [
    { title: '文献分析', desc: '梳理相关学术理论与行业报告，建立分析框架。' },
    { title: '案例资料分析', desc: '系统收集公开视频、创始人访谈、媒体报道、平台数据等二手资料并深度分析。' },
    { title: '比较分析', desc: '与同领域其他头部账号对照，提炼共性与差异。' },
  ],
  stepsLabel: '研究内容',
  outputLabel: '预期产出',
  steps: [
    { no: '01', title: '数据驱动的生产机制', desc: '分析如何以点击率、观看时长等核心指标做量化评估与 A/B 测试，并借助多维表格、AI 点映团等工具完成流程再造、提升效率。', output: '现代内容工业化生产模型' },
    { no: '02', title: '矩阵化传播策略', desc: '分析内部矩阵号的内容矩阵逻辑，如何实现用户覆盖、风险分散与生态协同。', output: '四象限矩阵的生态化策略' },
    { no: '03', title: '信任经济的商业化', desc: '分析长期稳定的高质量输出与不掩饰失败的真诚沟通如何累积情感劳动、构建强信任，并为自有品牌提供消费信用背书，把流量转化为品牌资产。', output: '信任变现的商业化路径' },
    { no: '04', title: '研究内容四', desc: '在这里写第四项研究内容的分析对象与要回答的问题。', output: '对应的预期产出' },
  ],
  conclusionLabel: '研究主线',
  conclusion: '数据评估 → 流程再造 → 矩阵传播 → 信任变现',
};

const CSS = `
.cp-mr-main{flex:1;min-height:0;display:flex;gap:30px;}
.cp-mr-methods{flex:0 0 560px;display:flex;flex-direction:column;}
.campus[data-campus-nav="rail"] .cp-mr-methods{flex-basis:500px;}
.cp-mr-methods-body{flex:1;min-height:0;display:flex;flex-direction:column;padding:22px 26px 24px;}
.cp-mr-core{padding:18px 22px 20px;border-radius:var(--campus-radius-sm);}
.cp-mr-core-title{margin-top:12px;font-family:var(--theme-font-serif);font-weight:700;font-size:36px;line-height:1.2;letter-spacing:.06em;color:var(--theme-accent);}
.cp-mr-core-desc{margin-top:10px;font-size:22px;line-height:1.62;color:var(--theme-ink);text-wrap:pretty;}
.cp-mr-sub{margin-top:24px;}
.cp-mr-list{flex:1;min-height:0;display:flex;flex-direction:column;justify-content:flex-start;margin-top:6px;}
.cp-mr-method{display:flex;gap:16px;padding:16px 0;border-bottom:1px dashed var(--campus-accent-line);}
.cp-mr-list.is-3 .cp-mr-method{padding:11px 0;}
.cp-mr-list.is-3 .cp-mr-method-desc{margin-top:4px;font-size:19px;line-height:1.5;}
.cp-mr-method:last-child{border-bottom:0;}
.cp-mr-method .campus-mark{margin-top:11px;}
.cp-mr-method-title{font-size:23px;line-height:1.35;font-weight:700;color:var(--theme-ink);}
.cp-mr-method-desc{margin-top:6px;font-size:20px;line-height:1.6;color:var(--theme-muted);text-wrap:pretty;}
.cp-mr-route{flex:1;min-width:0;display:flex;flex-direction:column;gap:14px;}
/* 产出紧跟在正文后(按各卡最长的正文对齐),内容短时多出的高度留在卡片底部,不在正文和产出之间拉开空白 */
.cp-mr-steps{flex:1;min-height:0;display:grid;grid-template-rows:auto auto auto minmax(0,1fr);grid-auto-flow:column;column-gap:0;}
.cp-mr-step.campus-ncard{grid-row:1 / -1;min-width:0;display:grid;grid-template-rows:subgrid;padding:44px 0 0;}
.cp-mr-step .campus-ncard-title{padding:0 24px;font-size:28px;line-height:1.28;}
.cp-mr-step-desc{padding:16px 24px 16px;font-size:22px;line-height:1.72;color:var(--theme-ink);text-wrap:pretty;}
.cp-mr-output{margin:0 18px 20px;padding:14px 18px 16px;border-radius:var(--campus-radius-sm);}
.cp-mr-output .campus-chip{height:32px;font-size:17px;}
.cp-mr-output-text{margin-top:10px;font-family:var(--theme-font-serif);font-size:23px;line-height:1.4;font-weight:700;color:var(--theme-accent);text-wrap:balance;}
.cp-mr-link{grid-row:1 / 2;width:50px;display:flex;align-items:center;justify-content:center;padding-top:20px;}
.cp-mr-link-dot{display:grid;place-items:center;width:40px;height:40px;border-radius:50%;background:var(--campus-fill);color:var(--theme-on-accent);box-shadow:0 6px 14px rgb(var(--theme-accent-rgb) / .28);}
.cp-mr-steps.is-4 .cp-mr-link{width:40px;}
.cp-mr-steps.is-4 .cp-mr-link-dot{width:34px;height:34px;}
.cp-mr-steps.is-4 .cp-mr-step .campus-ncard-title{font-size:25px;padding:0 18px;}
.cp-mr-steps.is-4 .cp-mr-step-desc{font-size:20px;padding:14px 18px 14px;}
.cp-mr-steps.is-4 .cp-mr-output{margin:0 14px 16px;}
`;

export function MethodRoadmap(props) {
  useThemeStyle('campus-method-roadmap-style', CSS);
  const p = { ...DEFAULTS, ...props };
  const methods = safeArray(p.methods).slice(0, clamp(p.methodCount, 1, 3));
  const steps = safeArray(p.steps).slice(0, clamp(p.stepCount, 2, 4));
  return (
    <CampusFrame chapterIndex={p.chapterIndex}>
      <TitleRow no={p.sectionNo} title={p.title} className="campus-rise" style={enterDelay(0)} />
      <div className="cp-mr-main">
        <section className="cp-mr-methods campus-card campus-rise" style={enterDelay(1)}>
          <div className="campus-card-head">{p.methodsLabel}</div>
          <div className="cp-mr-methods-body">
            <div className="cp-mr-core campus-wash">
              <div className="campus-chip">{p.coreLabel}</div>
              <div className="cp-mr-core-title">{p.coreTitle}</div>
              <p className="cp-mr-core-desc">{p.coreDesc}</p>
            </div>
            <div className="cp-mr-sub campus-label-row">
              <div className="campus-chip is-soft">{p.methodsSubLabel}</div>
            </div>
            <div className={`cp-mr-list is-${methods.length}`}>
              {methods.map((method, i) => (
                <div className="cp-mr-method" key={i}>
                  <div className="campus-mark" />
                  <div>
                    <div className="cp-mr-method-title">{method?.title}</div>
                    <p className="cp-mr-method-desc">{method?.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
        <section className="cp-mr-route">
          <div className="campus-label-row campus-rise" style={enterDelay(2)}>
            <div className="campus-chip">{p.stepsLabel}</div>
          </div>
          <div className={`cp-mr-steps is-${steps.length}`}>
            {steps.map((step, i) => (
              <React.Fragment key={i}>
                {i > 0 && <div className="cp-mr-link campus-fade" style={enterDelay(3 + i)}><div className="cp-mr-link-dot"><FlowArrow size={24} style={{ color: 'var(--theme-on-accent)' }} /></div></div>}
                <NumberCard variant="tab" no={step?.no} title={step?.title} check={false} className="cp-mr-step campus-rise" style={enterDelay(3 + i)}>
                  <p className="cp-mr-step-desc">{step?.desc}</p>
                  {p.showOutputs ? (
                    <div className="cp-mr-output campus-wash">
                      <div className="campus-chip is-soft">{p.outputLabel}</div>
                      <div className="cp-mr-output-text">{step?.output}</div>
                    </div>
                  ) : <div />}
                </NumberCard>
              </React.Fragment>
            ))}
          </div>
        </section>
      </div>
      {p.showConclusion && <ConclusionBar label={p.conclusionLabel} text={p.conclusion} className="campus-rise" style={enterDelay(8)} />}
    </CampusFrame>
  );
}

MethodRoadmap.META = {
  id: 'method-roadmap',
  label: '方法与路线 · 方法清单配编号步骤',
  roles: ['process', 'context'],
  defaults: DEFAULTS,
  copyBudgets: { coreDesc: 40, 'methods[].desc': 36, 'steps[].desc': 72, conclusion: 44 },
  controls: [
    { ...CHAPTER_CONTROL, default: 2 },
    { key: 'methodCount', type: 'number', label: '具体方法条数', default: 2, min: 1, max: 3, description: '左侧具体方法的条数。' },
    { key: 'stepCount', type: 'number', label: '步骤数量', default: 3, min: 2, max: 4, description: '右侧研究内容 / 技术路线的步骤数。' },
    { key: 'showOutputs', type: 'toggle', label: '步骤产出', default: true, description: '每个步骤底部的「预期产出」。' },
    { key: 'showConclusion', type: 'toggle', label: '底部结论条', default: true, description: '页面底部的校色结论条。' },
  ],
};
