// 横向时间轴:4–6 个节点沿一条校色渐变主轴排开,节点卡片上下交错或统一放在轴下方,每个节点带年份 / 阶段标签。
// 适合发展历程、研究历程、关键事件回顾。
import React from 'react';
import { useThemeStyle, enterDelay } from '../../../shared/style.jsx';
import { safeArray, clamp } from '../../../chart-safety.mjs';
import { CampusFrame, TitleRow, ConclusionBar, FlowArrow, CHAPTER_CONTROL } from '../kit/chrome.jsx';

const DEFAULTS = {
  chapterIndex: 1,
  itemCount: 5,
  layout: 'alternate',
  showConclusion: true,
  sectionNo: '1.3',
  title: '研究对象的发展历程',
  items: [
    { year: '2016', stage: '起步期', title: '以影像技术科普切入', desc: '从器材评测与拍摄技巧讲解起步，确立“专业、好看”的内容基调。' },
    { year: '2018', stage: '定位期', title: '确立科技 + 影像定位', desc: '内容从单一器材扩展到科技产品与影像创作，形成稳定的受众圈层。' },
    { year: '2020', stage: '扩张期', title: '工作室化团队运作', desc: '组建专业制作团队，选题、拍摄、剪辑分工协作，产能显著提升。' },
    { year: '2022', stage: '矩阵期', title: '多账号矩阵布局', desc: '陆续孵化多个子账号，按内容专业度与受众广度形成四象限矩阵。' },
    { year: '2024', stage: '体系期', title: '数据与工具进入全流程', desc: '以数据评估与 AI 工具辅助选题、测试与复盘，并发展自有品牌。' },
    { year: '2026', stage: '展望', title: '下一阶段节点', desc: '在这里写下一个关键节点的事件与意义。' },
  ],
  conclusionLabel: '阶段特征',
  conclusion: '从“单点爆款”走向“体系化生产”，每个阶段都对应一次生产方式的升级。（时间节点为示例）',
};

const CSS = `
.cp-tl{position:relative;flex:1;min-height:0;}
.cp-tl-axis{position:absolute;left:0;right:8px;height:6px;margin-top:-3px;border-radius:3px;background:var(--campus-fill);}
.cp-tl-axis-end{position:absolute;right:-10px;margin-top:-17px;}
.cp-tl-node{position:absolute;width:34px;height:34px;margin:-17px 0 0 -17px;border-radius:50%;background:var(--campus-fill);box-shadow:0 0 0 6px rgb(var(--theme-accent-rgb) / .14),0 6px 14px rgb(var(--theme-accent-rgb) / .3);}
.cp-tl-node-dot{position:absolute;left:50%;top:50%;width:12px;height:12px;margin:-6px 0 0 -6px;border-radius:50%;background:var(--theme-surface);}
.cp-tl-link{position:absolute;width:0;margin-left:-1px;border-left:2px dashed var(--campus-accent-line);}
.cp-tl-card{position:absolute;display:flex;flex-direction:column;padding:24px 26px 26px 28px;}
.cp-tl-cap{position:absolute;top:0;left:28px;width:60px;height:6px;border-radius:0 0 4px 4px;background:var(--campus-fill);}
.cp-tl-head{display:flex;align-items:center;gap:14px;}
.cp-tl-year{font-size:46px;}
.cp-tl-head .campus-chip{height:32px;padding:0 14px;font-size:18px;}
.cp-tl.is-6 .cp-tl-year{font-size:42px;}
.cp-tl-title{margin-top:14px;font-family:var(--theme-font-serif);font-weight:700;font-size:30px;line-height:1.3;letter-spacing:.03em;color:var(--theme-ink);}
.cp-tl-desc{margin-top:10px;font-size:22px;line-height:1.66;color:var(--theme-muted);text-wrap:pretty;}

/* 同侧:年份在轴上方,卡片在轴下方;整组按内容高度在正文区垂直居中 */
.cp-tl-same{flex:1;min-height:0;display:flex;flex-direction:column;justify-content:center;}
.cp-tl-grid{position:relative;display:grid;grid-template-rows:auto 64px auto;column-gap:26px;}
.cp-tl-stamp{grid-row:1;display:flex;align-items:flex-end;gap:14px;padding:0 0 6px 2px;}
.cp-tl-stamp .campus-num{font-size:62px;}
.cp-tl-stamp .campus-chip{height:32px;padding:0 14px;font-size:18px;margin-bottom:6px;}
.cp-tl-track{grid-row:2;grid-column:1 / -1;position:relative;}
.cp-tl-track .cp-tl-axis{top:50%;}
.cp-tl-track .cp-tl-axis-end{top:50%;}
.cp-tl-cell{grid-row:2;position:relative;}
.cp-tl-cell .cp-tl-node{left:18px;top:50%;}
.cp-tl-cell .cp-tl-link{left:18px;top:50%;bottom:0;}
.cp-tl-grid .cp-tl-card{position:relative;grid-row:3;padding:28px 26px 28px;}
.cp-tl-grid .cp-tl-title{margin-top:0;}
.cp-tl-grid .cp-tl-desc{font-size:23px;line-height:1.7;margin-top:12px;}
`;

// 交错布局:同侧相邻两张卡片之间隔两个节点,卡片宽度可以放到接近两个节点间距。
function alternateGeometry(n) {
  const margin = 1.2;
  const gap = 2.2;
  let step = (100 - margin + gap) / (n + 1);
  let cardW = 2 * step - gap;
  if (cardW > 34) {
    cardW = 34;
    step = (100 - margin - cardW - 2) / Math.max(1, n - 1);
  }
  return { xs: Array.from({ length: n }, (_, i) => margin + i * step), cardW };
}

export function TimelineMilestones(props) {
  useThemeStyle('campus-timeline-milestones-style', CSS);
  const p = { ...DEFAULTS, ...props };
  const items = safeArray(p.items).slice(0, clamp(p.itemCount, 4, 6));
  const same = p.layout === 'same';
  const { xs, cardW } = alternateGeometry(items.length);
  return (
    <CampusFrame chapterIndex={p.chapterIndex}>
      <TitleRow no={p.sectionNo} title={p.title} className="campus-rise" style={enterDelay(0)} />
      {same ? (
        <div className={`cp-tl-same is-${items.length}`}>
          <div className="cp-tl-grid" style={{ gridTemplateColumns: `repeat(${Math.max(1, items.length)}, minmax(0, 1fr))` }}>
            <div className="cp-tl-track">
              <div className="cp-tl-axis campus-draw" style={enterDelay(1)} />
              <div className="cp-tl-axis-end campus-fade" style={enterDelay(3)}><FlowArrow /></div>
            </div>
            {items.map((item, i) => (
              <React.Fragment key={i}>
                <div className="cp-tl-stamp campus-rise" style={{ gridColumn: i + 1, ...enterDelay(2 + i) }}>
                  <div className="campus-num">{item?.year}</div>
                  <div className="campus-chip is-soft">{item?.stage}</div>
                </div>
                <div className="cp-tl-cell" style={{ gridColumn: i + 1 }}>
                  <div className="cp-tl-link campus-fade" style={enterDelay(2 + i)} />
                  <div className="cp-tl-node campus-fade" style={enterDelay(2 + i)}><div className="cp-tl-node-dot" /></div>
                </div>
                <div className="cp-tl-card campus-card campus-rise" style={{ gridColumn: i + 1, ...enterDelay(3 + i) }}>
                  <div className="cp-tl-cap" aria-hidden="true" />
                  <h3 className="cp-tl-title">{item?.title}</h3>
                  <p className="cp-tl-desc">{item?.desc}</p>
                </div>
              </React.Fragment>
            ))}
          </div>
        </div>
      ) : (
        <div className={`cp-tl is-${items.length}`}>
          <div className="cp-tl-axis campus-draw" style={{ top: '50%', ...enterDelay(1) }} />
          <div className="cp-tl-axis-end campus-fade" style={{ top: '50%', ...enterDelay(3) }}><FlowArrow /></div>
          {items.map((item, i) => {
            const x = xs[i];
            const above = i % 2 === 0;
            const linkStyle = above ? { left: `${x}%`, bottom: '50%', height: '64px' } : { left: `${x}%`, top: '50%', height: '64px' };
            const cardStyle = above
              ? { left: `calc(${x}% - 1.5px)`, width: `${cardW}%`, bottom: 'calc(50% + 64px)', maxHeight: 'calc(50% - 64px)' }
              : { left: `calc(${x}% - 1.5px)`, width: `${cardW}%`, top: 'calc(50% + 64px)', maxHeight: 'calc(50% - 64px)' };
            return (
              <React.Fragment key={i}>
                <div className="cp-tl-link campus-fade" style={{ ...linkStyle, ...enterDelay(2 + i) }} />
                <div className="cp-tl-node campus-fade" style={{ left: `${x}%`, top: '50%', ...enterDelay(2 + i) }}><div className="cp-tl-node-dot" /></div>
                <div className="cp-tl-card campus-card campus-rise" style={{ ...cardStyle, ...enterDelay(3 + i) }}>
                  <div className="cp-tl-cap" aria-hidden="true" />
                  <div className="cp-tl-head">
                    <div className="cp-tl-year campus-num">{item?.year}</div>
                    <div className="campus-chip is-soft">{item?.stage}</div>
                  </div>
                  <h3 className="cp-tl-title">{item?.title}</h3>
                  <p className="cp-tl-desc">{item?.desc}</p>
                </div>
              </React.Fragment>
            );
          })}
        </div>
      )}
      {p.showConclusion && <ConclusionBar label={p.conclusionLabel} text={p.conclusion} className="campus-rise" style={enterDelay(9)} />}
    </CampusFrame>
  );
}

TimelineMilestones.META = {
  id: 'timeline-milestones',
  label: '时间轴 · 横向节点上下交错',
  roles: ['trend', 'process', 'case'],
  defaults: DEFAULTS,
  copyBudgets: { 'items[].desc': 34, 'items[].title': 12, conclusion: 44 },
  controls: [
    { ...CHAPTER_CONTROL },
    { key: 'itemCount', type: 'number', label: '节点数量', default: 5, min: 4, max: 6, description: '时间轴上的节点数。' },
    { key: 'layout', type: 'radio', label: '卡片排布', default: 'alternate', options: [{ value: 'alternate', label: '上下交错' }, { value: 'same', label: '统一在下方' }], description: '节点卡片在主轴上下交错,或统一放在主轴下方(年份在上方)。' },
    { key: 'showConclusion', type: 'toggle', label: '底部结论条', default: true, description: '页面底部的校色结论条。' },
  ],
};
