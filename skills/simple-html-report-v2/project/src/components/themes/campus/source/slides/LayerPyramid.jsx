// 层级金字塔:3–4 层校色渐变金字塔(越往上越深),每层右侧用引线接一张说明卡。
// 适合分析框架、层级结构、需求层次这类「自下而上逐层递进」的内容。
import React from 'react';
import { useThemeStyle, enterDelay } from '../../../shared/style.jsx';
import { safeArray, clamp } from '../../../chart-safety.mjs';
import { CampusFrame, TitleRow, ConclusionBar, CHAPTER_CONTROL } from '../kit/chrome.jsx';

const DEFAULTS = {
  chapterIndex: 2,
  layerCount: 3,
  showKeywords: true,
  showConclusion: true,
  sectionNo: '2.2',
  title: '综合分析框架',
  layers: [
    { no: '01', name: '关系层', title: '情感劳动与信任经济', keywords: '情感劳动 · 粉丝信任 · 品牌背书', desc: '真诚沟通与长期稳定输出累积粉丝信任，为自有品牌提供消费信用背书，把流量转化为品牌资产。' },
    { no: '02', name: '组织层', title: '媒介生态与矩阵布局', keywords: '平台可供性 · 账号矩阵 · 风险分散', desc: '以多账号矩阵覆盖不同圈层，分散单一平台的算法风险，形成相互导流的内容小生态。' },
    { no: '03', name: '技术层', title: '数据驱动的内容生产', keywords: '量化评估 · A/B 测试 · 流程再造', desc: '以点击率、完播率等指标做量化评估与 A/B 测试，借助协作表格与 AI 工具完成流程再造。' },
    { no: '04', name: '基础层', title: '第四层的标题', keywords: '关键词一 · 关键词二', desc: '在这里说明这一层在框架中的作用，以及它如何支撑上面各层。' },
  ],
  conclusionLabel: '框架逻辑',
  conclusion: '技术层提供效率，组织层分散风险，关系层沉淀信任：三层自下而上共同解释持续增长。',
};

const PYRAMID_W = 720;
const r2 = v => Math.round(v * 100) / 100;

const CSS = `
.cp-py{flex:1;min-height:0;position:relative;display:grid;grid-template-columns:${PYRAMID_W}px minmax(0,1fr);column-gap:56px;}
.cp-py-shape{position:relative;grid-row:1 / -1;grid-column:1;}
.cp-py-layer{position:absolute;left:0;right:0;}
.cp-py-face{position:absolute;inset:0;background:var(--campus-fill);}
/* 越往上的层叠一层越深的黑色遮罩 */
.cp-py-face.is-s1{background:linear-gradient(rgb(0 0 0 / .08),rgb(0 0 0 / .08)),var(--campus-fill);}
.cp-py-face.is-s2{background:linear-gradient(rgb(0 0 0 / .16),rgb(0 0 0 / .16)),var(--campus-fill);}
.cp-py-face.is-s3{background:linear-gradient(rgb(0 0 0 / .24),rgb(0 0 0 / .24)),var(--campus-fill);}
.cp-py-glow{position:absolute;left:12%;right:12%;bottom:-18px;height:36px;border-radius:50%;background:radial-gradient(closest-side,rgb(var(--theme-accent-rgb) / .22),rgb(var(--theme-accent-rgb) / 0));}
.cp-py-label{position:absolute;left:0;right:0;display:flex;flex-direction:column;align-items:center;gap:6px;transform:translateY(-50%);color:var(--theme-on-accent);text-align:center;}
.cp-py-no{font-family:var(--theme-font-serif);font-weight:700;font-size:30px;line-height:1;font-variant-numeric:lining-nums;color:var(--campus-spark);}
.cp-py-name{font-family:var(--theme-font-serif);font-weight:700;font-size:34px;line-height:1.1;letter-spacing:.14em;}
.cp-py.is-4 .cp-py-name{font-size:30px;}
.cp-py.is-4 .cp-py-no{font-size:26px;}
.cp-py-rows{grid-column:2;display:grid;grid-auto-rows:minmax(0,1fr);row-gap:var(--cp-py-gap);}
.cp-py-row{position:relative;min-height:0;display:flex;align-items:center;}
.cp-py-lead{position:absolute;top:50%;height:0;border-top:2px dashed var(--campus-accent-line);}
.cp-py-dot{position:absolute;top:50%;width:16px;height:16px;margin:-8px 0 0 -8px;border-radius:50%;background:var(--theme-surface);border:4px solid var(--theme-accent);}
.cp-py-card{flex:1;min-width:0;align-self:stretch;display:flex;flex-direction:column;justify-content:center;padding:18px 30px 20px 40px;}
.cp-py-bar{position:absolute;left:16px;top:22px;bottom:22px;width:6px;border-radius:3px;background:var(--campus-fill-bar);}
.cp-py-title{font-family:var(--theme-font-serif);font-weight:700;font-size:30px;line-height:1.3;letter-spacing:.04em;color:var(--theme-accent);}
.cp-py-keywords{margin-top:8px;padding-bottom:12px;border-bottom:1px dashed var(--campus-accent-line);font-size:19px;line-height:1.4;font-weight:700;letter-spacing:.04em;color:var(--campus-accent-soft);}
.cp-py-desc{margin-top:12px;font-size:22px;line-height:1.66;color:var(--theme-ink);text-wrap:pretty;}
.cp-py.is-4 .cp-py-title{font-size:27px;}
.cp-py.is-4 .cp-py-desc{font-size:21px;line-height:1.56;margin-top:8px;}
.cp-py.is-4 .cp-py-keywords{padding-bottom:8px;margin-top:4px;}
`;


export function LayerPyramid(props) {
  useThemeStyle('campus-layer-pyramid-style', CSS);
  const p = { ...DEFAULTS, ...props };
  const layers = safeArray(p.layers).slice(0, clamp(p.layerCount, 3, 4));
  const n = Math.max(1, layers.length);
  const gapPct = 1.6;
  const rowGap = n === 4 ? 14 : 18;
  return (
    <CampusFrame chapterIndex={p.chapterIndex}>
      <TitleRow no={p.sectionNo} title={p.title} className="campus-rise" style={enterDelay(0)} />
      <div className={`cp-py is-${n}`} style={{ '--cp-py-gap': `${rowGap}px` }}>
        <div className="cp-py-shape campus-fade" style={enterDelay(1)}>
          <div className="cp-py-glow" aria-hidden="true" />
          {layers.map((_, i) => {
            // 每层是一块梯形:按层的上下沿在金字塔高度上的位置算出左右斜边,形状元素不含文字。
            const y0 = (i / n) * 100 + (i > 0 ? gapPct / 2 : 0);
            const y1 = ((i + 1) / n) * 100 - (i < n - 1 ? gapPct / 2 : 0);
            const shade = clamp(n - 1 - i, 0, 3);
            return (
              <div className="cp-py-layer" key={i} style={{ top: `${r2(y0)}%`, height: `${r2(y1 - y0)}%` }}>
                <div
                  className={`cp-py-face is-s${shade}`}
                  style={{ clipPath: `polygon(${r2(50 - y0 / 2)}% 0, ${r2(50 + y0 / 2)}% 0, ${r2(50 + y1 / 2)}% 100%, ${r2(50 - y1 / 2)}% 100%)` }}
                />
              </div>
            );
          })}
          {layers.map((layer, i) => (
            <div className="cp-py-label" key={i} style={{ top: `${((i + (i === 0 ? 0.68 : 0.55)) / n) * 100}%` }}>
              <div className="cp-py-no">{layer?.no}</div>
              <div className="cp-py-name">{layer?.name}</div>
            </div>
          ))}
        </div>
        <div className="cp-py-rows">
          {layers.map((layer, i) => {
            // 引线从这一层斜边的中点水平伸到说明卡:斜边中点的横坐标随层的高度变化。
            const edge = PYRAMID_W / 2 + (((i + 0.5) / n) * PYRAMID_W) / 2;
            const lead = PYRAMID_W - edge + 56;
            return (
              <div className="cp-py-row" key={i}>
                <div className="cp-py-lead campus-draw" style={{ left: `${-lead}px`, width: `${lead}px`, ...enterDelay(3 + i) }} />
                <div className="cp-py-dot campus-fade" style={{ left: `${-lead}px`, ...enterDelay(3 + i) }} />
                <div className="cp-py-card campus-card campus-rise" style={enterDelay(2 + i)}>
                  <div className="cp-py-bar" aria-hidden="true" />
                  <h3 className="cp-py-title">{layer?.title}</h3>
                  {p.showKeywords && <div className="cp-py-keywords">{layer?.keywords}</div>}
                  <p className="cp-py-desc">{layer?.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      {p.showConclusion && <ConclusionBar label={p.conclusionLabel} text={p.conclusion} className="campus-rise" style={enterDelay(8)} />}
    </CampusFrame>
  );
}

LayerPyramid.META = {
  id: 'layer-pyramid',
  label: '层级金字塔 · 逐层说明',
  roles: ['relationship', 'breakdown', 'context'],
  defaults: DEFAULTS,
  copyBudgets: { 'layers[].name': 4, 'layers[].title': 14, 'layers[].desc': 48, conclusion: 44 },
  controls: [
    { ...CHAPTER_CONTROL, default: 2 },
    { key: 'layerCount', type: 'number', label: '层数', default: 3, min: 3, max: 4, description: '金字塔的层数,右侧说明卡随之增减。' },
    { key: 'showKeywords', type: 'toggle', label: '关键词行', default: true, description: '说明卡标题下的一行关键词。' },
    { key: 'showConclusion', type: 'toggle', label: '底部结论条', default: true, description: '页面底部的校色结论条。' },
  ],
};
