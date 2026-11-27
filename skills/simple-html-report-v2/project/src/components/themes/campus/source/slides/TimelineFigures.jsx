// 带配图的时间轴:1–8 个节点排在一条横向渐变轴上,每个节点有年份 / 阶段名、一张小图位、一两行说明;
// 节点不多时(≤ 5)图位整齐排在轴上方、文字在轴下方;节点多时(≥ 6)自动上下交错,图位保持够大。
// 可强调一个节点(如「本文工作」):年份胶囊变渐变实底 + 点缀色外环。适合技术发展史、方法演进、项目历程。
import React from 'react';
import { useThemeStyle, enterDelay } from '../../../shared/style.jsx';
import { MediaSlot } from '../../../shared/MediaSlot.jsx';
import { safeArray, safeNumber, clamp } from '../../../chart-safety.mjs';
import { CampusFrame, TitleRow, ConclusionBar, CHAPTER_CONTROL, useCampusLayout, TITLE_ROW_SPACE, CONCLUSION_SPACE } from '../kit/chrome.jsx';
import { useAffairsStyle } from '../kit/affairs.jsx';

const DEFAULTS = {
  chapterIndex: 2,
  nodeCount: 5,
  arrange: 'auto',
  imageFit: 'contain',
  highlightIndex: 5,
  showConclusion: true,
  images: [],
  sectionNo: '2.1',
  title: '深组合接收机架构的发展历程',
  nodes: [
    { year: '1996', name: '矢量跟踪概念', desc: '提出矢量跟踪概念和集中式深组合理论' },
    { year: '1999', name: '级联式结构', desc: '为解决集中式计算量大，提出含预滤波器的级联式系统' },
    { year: '2007', name: '非相干深组合', desc: '建立非相干深组合导航系统' },
    { year: '2009', name: '完整误差模型', desc: '首次给出基带环路信息与惯导解算误差量之间的完整模型' },
    { year: '2012', name: '双滤波器预滤波', desc: '提出在基带信号预滤波处理中使用双滤波器的方法' },
    { year: '2016', name: '第六个节点', desc: '在这里写这一阶段的进展' },
    { year: '2020', name: '第七个节点', desc: '在这里写这一阶段的进展' },
    { year: '2024', name: '第八个节点', desc: '在这里写这一阶段的进展' },
  ],
  conclusionLabel: '发展脉络',
  conclusion: '架构从集中式走向级联式、从相干走向非相干，模型日趋完整，为本文的深组合设计提供了基础。',
};

const CSS = `
.cp-g4-tlf{position:relative;flex:1;min-height:0;}
/* 横向主轴:渐变粗线 + 右端箭头 */
.cp-g4-tlf-axis{position:absolute;left:0;right:0;height:8px;margin-top:-4px;border-radius:4px;background:linear-gradient(90deg,rgb(var(--theme-accent-rgb) / .22) 0%,var(--campus-accent-lo) 30%,var(--theme-accent) 70%,var(--campus-accent-hi) 100%);}
.cp-g4-tlf-head{position:absolute;right:-6px;width:22px;height:26px;margin-top:-13px;background:var(--campus-accent-hi);clip-path:polygon(0 0,100% 50%,0 100%);}
/* 节点:圆点 + 年份胶囊 */
.cp-g4-tlf-dot{position:absolute;width:24px;height:24px;margin:-12px 0 0 -12px;border-radius:50%;background:var(--theme-surface);border:5px solid var(--theme-accent);box-shadow:0 4px 10px rgb(var(--theme-accent-rgb) / .3);}
.cp-g4-tlf-dot.is-hl{width:34px;height:34px;margin:-17px 0 0 -17px;border:7px solid var(--theme-accent);box-shadow:0 0 0 5px var(--theme-surface),0 0 0 8px var(--campus-spark),0 8px 18px rgb(var(--theme-accent-rgb) / .4);}
.cp-g4-tlf-year{position:absolute;display:flex;align-items:center;justify-content:center;height:44px;padding:0 20px;border-radius:999px;transform:translateX(-50%);background:var(--theme-surface);border:2px solid var(--campus-accent-line);color:var(--theme-accent);font-family:var(--theme-font-serif);font-weight:700;font-size:26px;line-height:1;letter-spacing:.04em;font-variant-numeric:lining-nums;white-space:nowrap;box-shadow:0 6px 14px rgb(var(--theme-accent-rgb) / .12);}
.cp-g4-tlf-year.is-hl{background:var(--campus-fill);border-color:transparent;color:var(--theme-on-accent);box-shadow:0 8px 18px rgb(var(--theme-accent-rgb) / .32);}
/* 节点卡:图位 + 阶段名 + 说明 */
.cp-g4-tlf-card{position:absolute;display:flex;flex-direction:column;min-width:0;}
.cp-g4-tlf-photo{flex:1;min-height:0;}
.cp-g4-tlf-text{flex:none;min-width:0;}
.cp-g4-tlf-name{font-family:var(--theme-font-serif);font-size:26px;line-height:1.3;font-weight:700;letter-spacing:.03em;color:var(--theme-ink);}
.cp-g4-tlf-card.is-hl .cp-g4-tlf-name{color:var(--theme-accent);}
.cp-g4-tlf-desc{margin-top:6px;font-size:20px;line-height:1.5;color:var(--theme-muted);text-wrap:pretty;}
.cp-g4-tlf-stem{position:absolute;width:0;border-left:2px dashed var(--campus-accent-line);}
/* 同侧排列:图在轴上方,文字在轴下方并居中 */
.cp-g4-tlf.is-row .cp-g4-tlf-text{text-align:center;padding:0 6px;}
.cp-g4-tlf.is-row .cp-g4-tlf-photo .media-slot{border-radius:10px;}
/* 交错排列:卡片是白卡,文字在图下方 */
.cp-g4-tlf.is-stagger .cp-g4-tlf-card{padding:12px 12px 14px;}
.cp-g4-tlf.is-stagger .cp-g4-tlf-text{margin-top:10px;padding:0 6px;}
.cp-g4-tlf.is-stagger .cp-g4-tlf-name{font-size:23px;}
.cp-g4-tlf.is-stagger .cp-g4-tlf-desc{margin-top:3px;font-size:18px;line-height:1.45;}
.cp-g4-tlf.is-stagger .cp-g4-tlf-year{height:40px;font-size:23px;padding:0 16px;}
.cp-g4-tlf.is-stagger .cp-g4-tlf-card.is-hl::after{content:'';position:absolute;left:0;right:0;top:0;height:5px;border-radius:var(--campus-radius) var(--campus-radius) 0 0;background:var(--campus-fill);}
.cp-g4-tlf.is-dense-row .cp-g4-tlf-name{font-size:23px;}
.cp-g4-tlf.is-dense-row .cp-g4-tlf-desc{font-size:18px;}
.cp-g4-tlf.is-dense-row .cp-g4-tlf-year{font-size:22px;height:40px;padding:0 14px;}
`;

const pct = v => `${Math.round(v * 10000) / 100}%`;

export function TimelineFigures(props) {
  useAffairsStyle();
  useThemeStyle('campus-timeline-figures-style', CSS);
  const p = { ...DEFAULTS, ...props };
  const nodes = safeArray(p.nodes).slice(0, clamp(p.nodeCount, 1, 8));
  const n = Math.max(1, nodes.length);
  const stagger = p.arrange === 'stagger' || (p.arrange !== 'row' && n >= 6);
  const hl = clamp(Math.round(safeNumber(p.highlightIndex, 0)), 0, n) - 1;
  // 节点中心的横向位置(占比):均匀分布,两端留半格;只有 1–2 个节点时向中间收拢
  const span = n <= 2 ? 0.5 : 1;
  const xOf = i => (1 - span) / 2 + span * ((i + 0.5) / n);
  const gap = 24;
  const rowWidth = n <= 2 ? `calc(${pct(span / n)} - ${gap}px)` : `calc(${pct(1 / n)} - ${gap}px)`;
  // 交错时上下两侧各自把卡片在全宽上均分(上侧 ⌈n/2⌉ 张、下侧 ⌊n/2⌋ 张):每个节点都落在自己那张卡的横向范围内,卡片之间不重叠
  const topCount = Math.ceil(n / 2);
  const bottomCount = Math.max(1, Math.floor(n / 2));
  const slot = i => {
    const count = i % 2 === 0 ? topCount : bottomCount;
    const k = Math.floor(i / 2);
    return { left: `calc(${pct(k / count)} + ${gap / 2}px)`, width: `calc(${pct(1 / count)} - ${gap}px)` };
  };
  // 同侧排列:图位按 4:3 计算高度(卡宽决定,版面不够高时压低),整组「图 + 轴 + 文字」在正文区里纵向居中;
  // 4–5 个节点时卡窄,4:3 的图位太矮、上下留白偏多,改按接近方形(高 = 宽 × 0.88)计算
  const { bodyW, bodyH } = useCampusLayout();
  const availH = bodyH - TITLE_ROW_SPACE - (p.showConclusion ? CONCLUSION_SPACE : 0);
  const cellW = bodyW * (n <= 2 ? span / n : 1 / n) - gap;
  const textH = n >= 5 ? 150 : 160;
  const photoRatio = n >= 4 ? 0.88 : 0.75;
  const photoH = Math.round(clamp(Math.min(cellW * photoRatio + 20, availH - textH - 126), 160, 520));
  const rowTop = Math.round(Math.max(0, (availH - (photoH + 126 + textH)) / 2));
  const axisPx = rowTop + photoH + 40;
  return (
    <CampusFrame chapterIndex={p.chapterIndex}>
      <TitleRow no={p.sectionNo} title={p.title} className="campus-rise" style={enterDelay(0)} />
      <div className={`cp-g4-tlf ${stagger ? 'is-stagger' : 'is-row'}${!stagger && n >= 5 ? ' is-dense-row' : ''}`}>
        {(() => {
          // 轴的纵向位置:同侧排列时在图位下方,交错时居中
          const axisY = stagger ? '50%' : `${axisPx}px`;
          return (
            <>
              <div className="cp-g4-tlf-axis campus-draw" style={{ top: axisY, ...enterDelay(1) }} aria-hidden="true" />
              <div className="cp-g4-tlf-head campus-fade" style={{ top: axisY, ...enterDelay(2) }} aria-hidden="true" />
              {nodes.map((node, i) => {
                const isHl = i === hl;
                const up = !stagger || i % 2 === 0;
                const x = pct(xOf(i));
                const width = rowWidth;
                const cardStyle = stagger
                  ? (up
                    ? { ...slot(i), top: 0, bottom: 'calc(50% + 74px)' }
                    : { ...slot(i), top: 'calc(50% + 74px)', bottom: 0 })
                  : { left: `calc(${x} - (${width}) / 2)`, width, top: rowTop, height: photoH };
                return (
                  <React.Fragment key={i}>
                    {stagger && (
                      <div
                        className="cp-g4-tlf-stem"
                        style={up ? { left: x, top: 'calc(50% - 74px)', height: 52 } : { left: x, top: 'calc(50% + 22px)', height: 52 }}
                        aria-hidden="true"
                      />
                    )}
                    {!stagger && <div className="cp-g4-tlf-stem" style={{ left: x, top: axisPx - 40, height: 28 }} aria-hidden="true" />}
                    <div className={`cp-g4-tlf-dot campus-fade${isHl ? ' is-hl' : ''}`} style={{ left: x, top: axisY, ...enterDelay(2 + i) }} aria-hidden="true" />
                    <div
                      className={`cp-g4-tlf-year campus-fade${isHl ? ' is-hl' : ''}`}
                      style={{ left: x, top: stagger ? (up ? 'calc(50% - 74px)' : 'calc(50% + 30px)') : axisPx + 26, ...enterDelay(2 + i) }}
                    >
                      {node?.year}
                    </div>
                    <section className={`cp-g4-tlf-card${stagger ? ' campus-card' : ''} campus-rise${isHl ? ' is-hl' : ''}`} style={{ ...cardStyle, ...enterDelay(3 + i) }}>
                      <div className={`cp-g4-tlf-photo${stagger ? '' : ' campus-photo'}`}>
                        <MediaSlot id={`timeline-figures-${i}`} fit={p.imageFit === 'cover' ? 'cover' : 'contain'} radius={8} placeholder="阶段配图" />
                      </div>
                      {stagger ? (
                        <div className="cp-g4-tlf-text">
                          <h3 className="cp-g4-tlf-name">{node?.name}</h3>
                          <p className="cp-g4-tlf-desc">{node?.desc}</p>
                        </div>
                      ) : null}
                    </section>
                    {!stagger && (
                      <div className="cp-g4-tlf-card cp-g4-tlf-text campus-rise" style={{ left: `calc(${x} - (${width}) / 2)`, width, top: axisPx + 86, ...enterDelay(4 + i) }}>
                        <h3 className="cp-g4-tlf-name">{node?.name}</h3>
                        <p className="cp-g4-tlf-desc">{node?.desc}</p>
                      </div>
                    )}
                  </React.Fragment>
                );
              })}
            </>
          );
        })()}
      </div>
      {p.showConclusion && <ConclusionBar label={p.conclusionLabel} text={p.conclusion} className="campus-rise" style={enterDelay(12)} />}
    </CampusFrame>
  );
}

TimelineFigures.META = {
  id: 'timeline-figures',
  label: '配图时间轴 · 节点带图位可上下交错',
  roles: ['trend', 'image', 'process'],
  defaults: DEFAULTS,
  copyBudgets: {
    'nodes[].year': 8,
    'nodes[].name': 9,
    'nodes[].desc': 28,
    conclusionLabel: 4,
    conclusion: 46,
  },
  controls: [
    { ...CHAPTER_CONTROL, default: 2 },
    { key: 'nodeCount', type: 'number', label: '节点数量', default: 5, min: 1, max: 8, countArrays: ['images'], description: '时间轴上的节点数(年份 / 阶段名 / 说明 nodes 与配图 images 按同样的个数显示);建议 4–8 个,6 个及以上时自动上下交错。' },
    { key: 'arrange', type: 'radio', label: '排列方式', default: 'auto', options: [{ value: 'auto', label: '自动' }, { value: 'row', label: '同侧排列' }, { value: 'stagger', label: '上下交错' }], description: '自动:5 个及以下同侧排列(图在轴上方、文字在轴下方),6 个及以上上下交错;也可以手动指定。' },
    { key: 'imageFit', type: 'radio', label: '配图适配', default: 'contain', options: [{ value: 'contain', label: '完整显示' }, { value: 'cover', label: '铺满裁切' }], description: '结构图、截图建议完整显示(不裁切);照片可选铺满裁切。' },
    { key: 'highlightIndex', type: 'number', label: '强调节点', default: 5, min: 0, max: 8, maxFromKey: 'nodeCount', description: '用渐变年份胶囊和点缀色外环强调第几个节点(如本文工作所在的阶段);0 表示不强调。' },
    { key: 'showConclusion', type: 'toggle', label: '底部结论条', default: true, description: '页面底部的一句总结。' },
  ],
};
