// 机制 / 原理示意图:一张按原比例显示、不裁切的大图,图上叠 2–6 个带编号的标注点(位置用百分比 x / y 给出),
// 旁边(右侧栏或底栏)是对应编号的说明条目,标注点与说明用同一套编号徽标。
// 没上传图片时图框按默认比例显示一张浅色蓝图网格,标注点照样按默认位置排好,版面完整。
// 适合机制示意图、原理图、实验装置图、系统示意图的逐点讲解。
import React from 'react';
import { useThemeStyle, enterDelay } from '../../../shared/style.jsx';
import { MediaSlot } from '../../../shared/MediaSlot.jsx';
import { safeArray, safeNumber, clamp } from '../../../chart-safety.mjs';
import { CampusFrame, TitleRow, CHAPTER_CONTROL } from '../kit/chrome.jsx';
import { LabelRow } from '../kit/parts.jsx';
import { FigureCaption, useEvidenceStyle } from '../kit/evidence.jsx';
import { useDiagramStyle, NumBadge, r1 } from '../kit/diagram.jsx';

const DEFAULTS = {
  chapterIndex: 3,
  notesPosition: 'side',
  markerCount: 5,
  showCaption: true,
  images: [],
  sectionNo: '4.3',
  title: '频率稳定度传递原理',
  notesLabel: '图解',
  points: [
    { no: '1', x: 7, y: 15, title: '强信号通道', desc: '经捕获、跟踪得到跟踪频率等信息。' },
    { no: '2', x: 7, y: 38, title: '惯导辅助', desc: '提供载体运动引起的动态频差预报。' },
    { no: '3', x: 42, y: 26, title: '晶振频偏估计', desc: '扣除动态频差，得到本地晶振不稳定造成的频偏。' },
    { no: '4', x: 72, y: 15, title: '补偿弱信号通道', desc: '把频偏补偿到弱信号通道，缩小跟踪频率差。' },
    { no: '5', x: 72, y: 55, title: '下一历元预测', desc: '再补偿惯导预测的下一历元频偏。' },
    { no: '6', x: 12, y: 80, title: '幅值曲线', desc: '积分时间越长主瓣越窄，频率误差的能量损失越大。' },
  ],
  figureNo: '图 4-3',
  caption: '频率稳定度传递示意：强信号通道辅助弱信号通道跟踪',
};

const PLACEHOLDER_RATIO = { side: 1.64, bottom: 2.2 };
const CAPTION_H = 56;
const NOTES_MIN = 500;
const NOTES_ROW_H = 176;

const CSS = `
.cp-g2-af-main{flex:1;min-height:0;display:flex;gap:40px;container-type:size;}
.cp-g2-af-figure{flex:none;display:flex;flex-direction:column;min-width:0;margin:0;}
.cp-g2-af-frame{position:relative;flex:none;padding:10px;}
.cp-g2-af-frame .media-slot{border-radius:8px!important;}
/* 标注层:与图片区域重合(相框内边距 10px),标注点按百分比定位 */
.cp-g2-af-layer{position:absolute;inset:10px;pointer-events:none;}
.cp-g2-af-blue{position:absolute;inset:10px;border-radius:8px;pointer-events:none;background-image:linear-gradient(rgb(var(--theme-accent-rgb) / .07) 1px,transparent 1px),linear-gradient(90deg,rgb(var(--theme-accent-rgb) / .07) 1px,transparent 1px);background-size:48px 48px;background-position:-1px -1px;}
.cp-g2-af-corner{position:absolute;width:26px;height:26px;border-color:var(--campus-accent-line);border-style:solid;border-width:0;}
.cp-g2-af-corner.is-tl{left:18px;top:18px;border-left-width:3px;border-top-width:3px;border-radius:6px 0 0 0;}
.cp-g2-af-corner.is-tr{right:18px;top:18px;border-right-width:3px;border-top-width:3px;border-radius:0 6px 0 0;}
.cp-g2-af-corner.is-bl{left:18px;bottom:18px;border-left-width:3px;border-bottom-width:3px;border-radius:0 0 0 6px;}
.cp-g2-af-corner.is-br{right:18px;bottom:18px;border-right-width:3px;border-bottom-width:3px;border-radius:0 0 6px 0;}
.cp-g2-af-pin{position:absolute;width:76px;height:76px;margin:-38px 0 0 -38px;display:grid;place-items:center;}
.cp-g2-af-halo{position:absolute;inset:6px;border-radius:50%;background:rgb(var(--theme-accent-rgb) / .16);border:1.5px solid rgb(var(--theme-accent-rgb) / .35);}
.cp-g2-af-halo.is-outer{inset:0;background:transparent;border:1.5px dashed rgb(var(--theme-accent-rgb) / .3);}
.cp-g2-af-pin .cp-g2-badge{border:3px solid var(--theme-surface);}
.cp-g2-af-cap{flex:none;height:${CAPTION_H}px;display:flex;align-items:flex-end;}
/* 说明 */
.cp-g2-af-side{flex:1;min-width:0;display:flex;flex-direction:column;gap:18px;}
.cp-g2-af-notes{flex:1;min-height:0;display:grid;grid-auto-rows:minmax(0,1fr);row-gap:14px;}
.cp-g2-af-notes.is-few{grid-auto-rows:minmax(0,200px);align-content:center;}
.cp-g2-af-note{display:flex;align-items:center;gap:18px;padding:14px 26px 14px 18px;min-height:0;}
.cp-g2-af-note-body{flex:1;min-width:0;}
.cp-g2-af-note-title{font-family:var(--theme-font-serif);font-weight:700;font-size:24px;line-height:1.3;letter-spacing:.03em;color:var(--theme-ink);}
.cp-g2-af-note-desc{margin-top:4px;font-size:21px;line-height:1.5;color:var(--theme-muted);text-wrap:pretty;}
.cp-g2-af-notes.is-dense .cp-g2-af-note-desc{font-size:19px;line-height:1.45;}
.cp-g2-af-notes.is-dense .cp-g2-af-note-title{font-size:22px;}
/* 底栏版 */
.cp-g2-af-main.is-bottom{flex-direction:column;gap:18px;align-items:center;}
.cp-g2-af-main.is-bottom .cp-g2-af-side{flex:none;align-self:stretch;height:${NOTES_ROW_H}px;}
.cp-g2-af-main.is-bottom .cp-g2-af-notes{grid-auto-flow:column;grid-auto-columns:minmax(0,1fr);grid-auto-rows:auto;column-gap:16px;}
.cp-g2-af-main.is-bottom .cp-g2-af-note{flex-direction:column;align-items:flex-start;justify-content:center;gap:8px;padding:16px 20px;}
.cp-g2-af-main.is-bottom .cp-g2-af-note-head{display:flex;align-items:center;gap:12px;}
.cp-g2-af-main.is-bottom .cp-g2-af-note-desc{margin-top:0;font-size:19px;line-height:1.45;}
.cp-g2-af-main.is-bottom .cp-g2-af-cap{height:48px;}
`;

export function AnnotatedFigure(props) {
  useEvidenceStyle();
  useDiagramStyle();
  useThemeStyle('campus-annotated-figure-style', CSS);
  const p = { ...DEFAULTS, ...props };
  const bottom = p.notesPosition === 'bottom';
  const points = safeArray(p.points).slice(0, clamp(p.markerCount, 2, 6));
  const [aspect, setAspect] = React.useState(null);
  const onAspect = React.useCallback(value => {
    const next = safeNumber(value, 0);
    if (next > 0) setAspect(clamp(next, 0.5, 3.2));
  }, []);
  const ratio = aspect || PLACEHOLDER_RATIO[bottom ? 'bottom' : 'side'];
  const r = ratio.toFixed(4);
  const capH = p.showCaption ? CAPTION_H : 0;
  const frameW = bottom
    ? `min(100cqw, calc((100cqh - ${NOTES_ROW_H + 18 + capH + 20}px) * ${r} + 20px))`
    : `min(calc(100cqw - ${NOTES_MIN + 40}px), calc((100cqh - ${capH + 20}px) * ${r} + 20px))`;
  const frameStyle = { width: '100%', height: `calc((${frameW} - 20px) / ${r} + 20px)` };
  const dense = !bottom && points.length >= 5;
  const badge = (pt, size) => <NumBadge no={pt?.no} size={size} />;
  return (
    <CampusFrame chapterIndex={p.chapterIndex}>
      <TitleRow no={p.sectionNo} title={p.title} className="campus-rise" style={enterDelay(0)} />
      <div className={`cp-g2-af-main${bottom ? ' is-bottom' : ''}`}>
        <figure className="cp-g2-af-figure campus-rise" style={{ width: frameW, ...enterDelay(1) }}>
          <div className="cp-g2-af-frame campus-photo" style={frameStyle}>
            <MediaSlot id="annotated-figure-main" fit="contain" radius={8} placeholder="示意图 / 原理图" onAspect={onAspect} />
            {aspect ? null : (
              <div className="cp-g2-af-blue" aria-hidden="true">
                <div className="cp-g2-af-corner is-tl" />
                <div className="cp-g2-af-corner is-tr" />
                <div className="cp-g2-af-corner is-bl" />
                <div className="cp-g2-af-corner is-br" />
              </div>
            )}
            <div className="cp-g2-af-layer">
              {points.map((pt, i) => (
                <div key={i} className="cp-g2-af-pin campus-rise" style={{ left: `${r1(clamp(safeNumber(pt?.x, 50), 0, 100))}%`, top: `${r1(clamp(safeNumber(pt?.y, 50), 0, 100))}%`, ...enterDelay(3 + i) }}>
                  <div className="cp-g2-af-halo is-outer" aria-hidden="true" />
                  <div className="cp-g2-af-halo" aria-hidden="true" />
                  {badge(pt, 44)}
                </div>
              ))}
            </div>
          </div>
          {p.showCaption ? (
            <figcaption className="cp-g2-af-cap">
              <FigureCaption no={p.figureNo} text={p.caption} />
            </figcaption>
          ) : null}
        </figure>
        <aside className="cp-g2-af-side">
          {!bottom && <LabelRow label={p.notesLabel} className="campus-rise" style={enterDelay(2)} />}
          <div className={`cp-g2-af-notes${!bottom && points.length <= 3 ? ' is-few' : ''}${dense ? ' is-dense' : ''}`}>
            {points.map((pt, i) => (
              <div className="cp-g2-af-note campus-card campus-rise" key={i} style={enterDelay(4 + i)}>
                {bottom ? (
                  <>
                    <div className="cp-g2-af-note-head">
                      {badge(pt, 38)}
                      <div className="cp-g2-af-note-title">{pt?.title}</div>
                    </div>
                    <p className="cp-g2-af-note-desc">{pt?.desc}</p>
                  </>
                ) : (
                  <>
                    {badge(pt, dense ? 40 : 46)}
                    <div className="cp-g2-af-note-body">
                      <div className="cp-g2-af-note-title">{pt?.title}</div>
                      <p className="cp-g2-af-note-desc">{pt?.desc}</p>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </aside>
      </div>
    </CampusFrame>
  );
}

AnnotatedFigure.META = {
  id: 'annotated-figure',
  label: '标注示意图 · 大图编号标注配逐点说明',
  roles: ['image', 'relationship', 'observation'],
  defaults: DEFAULTS,
  copyBudgets: {
    title: 22,
    notesLabel: 6,
    'points[].no': 2,
    'points[].title': 8,
    'points[].desc': 26,
    figureNo: 6,
    caption: 28,
  },
  numberBounds: {
    'points[].x': { min: 0, max: 100, semantics: 'percent' },
    'points[].y': { min: 0, max: 100, semantics: 'percent' },
  },
  controls: [
    { ...CHAPTER_CONTROL, default: 3 },
    { key: 'notesPosition', type: 'radio', label: '说明位置', default: 'side', options: [{ value: 'side', label: '右侧栏' }, { value: 'bottom', label: '底栏' }], description: '近方形或常规比例的图选右侧栏;很宽的横图选底栏(说明卡横排在图下方)。图片按原比例显示,不裁切。' },
    { key: 'markerCount', type: 'number', label: '标注点数量', default: 5, min: 2, max: 6, countArrays: ['points'], mediaSlots: [{ field: 'images', countKey: null, min: 0, max: 1, maxCount: 1 }], description: '图上的编号标注点与对应说明的条数。points[].x / y 是标注点在图片上的位置(百分比,0–100,左上角为 0),上传图片后按图里的部件调整。' },
    { key: 'showCaption', type: 'toggle', label: '图号图注', default: true, description: '图片下方的渐变图号胶囊 + 图注。' },
  ],
};
