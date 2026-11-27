// 多图并排:1–4 张图(媒体槽)等宽并排,每张带图号、图题和一句图注;顶部可选一句导语,底部可选结论条。
// 适合研究结果图组、实验对比图、作品组图。
import React from 'react';
import { useThemeStyle, enterDelay } from '../../../shared/style.jsx';
import { MediaSlot } from '../../../shared/MediaSlot.jsx';
import { safeArray, clamp } from '../../../chart-safety.mjs';
import { CampusFrame, TitleRow, ConclusionBar, CHAPTER_CONTROL } from '../kit/chrome.jsx';

const DEFAULTS = {
  chapterIndex: 3,
  figureCount: 3,
  showLead: true,
  showConclusion: true,
  images: [],
  sectionNo: '3.7',
  title: '研究结果图组',
  lead: '三组数据从选题、测试与时长三个角度，验证了“数据评估回流创作”的作用。',
  figures: [
    { no: '图 3-2', title: '各类选题平均完播率', note: '数据驱动选题的完播率整体更高' },
    { no: '图 3-3', title: '封面点击率 A/B 测试', note: '经过测试的封面点击率持续领先' },
    { no: '图 3-4', title: '视频时长与平均观看时长', note: '时长与观看时长呈正相关' },
    { no: '图 3-5', title: '生产流程各节点耗时', note: '剪辑与拍摄是主要耗时环节' },
  ],
  conclusionLabel: '结果小结',
  conclusion: '数据评估不仅提升了单支作品的表现，也让制作流程变得可预期、可优化。',
};

const CSS = `
.cp-fg-lead{flex:none;margin:-6px 0 22px;font-size:24px;line-height:1.5;color:var(--theme-muted);}
.cp-fg{flex:1;min-height:0;display:grid;grid-auto-flow:column;grid-auto-columns:minmax(0,1fr);column-gap:26px;}
.cp-fg-item{min-width:0;min-height:0;display:flex;flex-direction:column;margin:0;}
.cp-fg-photo{flex:1;min-height:0;}
.cp-fg-cap-bar{position:absolute;left:50%;bottom:-3px;width:56px;height:6px;margin-left:-28px;border-radius:3px;background:var(--campus-fill);}
.cp-fg-cap{flex:none;margin-top:18px;display:flex;align-items:flex-start;gap:16px;}
.cp-fg-cap .campus-seal{height:36px;min-width:0;padding:0 14px;font-size:19px;border-radius:999px;}
.cp-fg-cap-title{font-size:23px;line-height:1.35;font-weight:700;color:var(--theme-ink);}
.cp-fg-cap-note{margin-top:4px;font-size:19px;line-height:1.45;color:var(--theme-muted);}
.cp-fg.is-4 .cp-fg-cap{flex-direction:column;gap:10px;}
.cp-fg.is-1{grid-auto-columns:minmax(0,1200px);justify-content:center;}
`;

export function FigureGallery(props) {
  useThemeStyle('campus-figure-gallery-style', CSS);
  const p = { ...DEFAULTS, ...props };
  const figures = safeArray(p.figures).slice(0, clamp(p.figureCount, 1, 4));
  return (
    <CampusFrame chapterIndex={p.chapterIndex}>
      <TitleRow no={p.sectionNo} title={p.title} className="campus-rise" style={enterDelay(0)} />
      {p.showLead && <p className="cp-fg-lead campus-rise" style={enterDelay(1)}>{p.lead}</p>}
      <div className={`cp-fg is-${figures.length}`}>
        {figures.map((fig, i) => (
          <figure className="cp-fg-item campus-rise" style={enterDelay(2 + i)} key={i}>
            <div className="cp-fg-photo campus-photo">
              <div className="cp-fg-cap-bar" aria-hidden="true" />
              <MediaSlot id={`figure-gallery-${i}`} fit="contain" radius={8} placeholder="结果图" />
            </div>
            <figcaption className="cp-fg-cap">
              <div className="campus-seal">{fig?.no}</div>
              <div>
                <div className="cp-fg-cap-title">{fig?.title}</div>
                <div className="cp-fg-cap-note">{fig?.note}</div>
              </div>
            </figcaption>
          </figure>
        ))}
      </div>
      {p.showConclusion && <ConclusionBar label={p.conclusionLabel} text={p.conclusion} className="campus-rise" style={enterDelay(8)} />}
    </CampusFrame>
  );
}

FigureGallery.META = {
  id: 'figure-gallery',
  label: '多图并排 · 图号图题配图注',
  roles: ['result', 'image', 'observation'],
  defaults: DEFAULTS,
  copyBudgets: { lead: 44, 'figures[].title': 14, 'figures[].note': 18, conclusion: 44 },
  controls: [
    { ...CHAPTER_CONTROL, default: 3 },
    { key: 'figureCount', type: 'number', label: '图片数量', default: 3, min: 1, max: 4, countArrays: ['images'], description: '并排的图片张数(图题图注 figures 按同样的张数显示);只有 1 张时居中放大。' },
    { key: 'showLead', type: 'toggle', label: '导语', default: true, description: '标题下方的一句导语。' },
    { key: 'showConclusion', type: 'toggle', label: '底部结论条', default: true, description: '页面底部的校色结论条。' },
  ],
};
