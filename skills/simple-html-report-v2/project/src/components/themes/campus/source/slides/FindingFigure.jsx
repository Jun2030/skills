// 结论式标题 + 整页结果图:一句完整结论当标题(可占两行,带「结果 N」徽标与连排页码 1 / 3),
// 主体是一张按原比例显示、不裁切的大图(近方形多面板图放左侧配侧栏解读,宽图放上方配底栏解读),
// 解读 1–4 条「图里看什么」,可对应子图号;图号图注与出处注。适合理科成果页、文献汇报的「结果 N」、结题汇报。
import React from 'react';
import { useThemeStyle, enterDelay } from '../../../shared/style.jsx';
import { MediaSlot } from '../../../shared/MediaSlot.jsx';
import { safeArray, safeNumber, clamp } from '../../../chart-safety.mjs';
import { CampusFrame, CHAPTER_CONTROL } from '../kit/chrome.jsx';
import { LabelRow } from '../kit/parts.jsx';
import { FindingTitle, FigureCaption, useEvidenceStyle } from '../kit/evidence.jsx';

const DEFAULTS = {
  chapterIndex: 4,
  notesPosition: 'side',
  noteCount: 3,
  showKicker: true,
  showCounter: true,
  showSource: true,
  images: [],
  sectionNo: '4.5',
  kicker: '结果 3',
  counter: '1 / 2',
  title: '不依赖带真值的数据集，本文方法也能完成三维重建，但完整度仍不及有监督方法',
  figureNo: '图 4-8',
  caption: '三种方法在建筑、砖块、咖啡壶三个模型上的重建结果',
  source: '来源：DTU 数据集测试，作者实验结果',
  notesLabel: '图里看什么',
  notes: [
    { tag: '(a)', title: 'Colmap', desc: '受严格的数学限定，重建速度慢 1k～10k 倍。' },
    { tag: '(b)', title: 'MVSNet', desc: '强烈依赖带真值的数据集，难以用于土木工程大规模场景。' },
    { tag: '(c)', title: '本文方法', desc: '只用自监督损失训练即可重建，完整度还有待提高。' },
    { tag: '(d)', title: '真实场景', desc: '在真实拍摄的纸袋场景上，对三种方法做同样的对比。' },
  ],
};

// 空图时的占位比例:侧栏版按近方形,底栏版按宽图;上传图片后按图片自己的比例。
const PLACEHOLDER_RATIO = { side: 1.25, bottom: 2.2 };
const CAPTION_H = 58;
const NOTES_MIN = 520;
const NOTES_ROW_H = 196;

const CSS = `
.cp-ff-main{flex:1;min-height:0;display:flex;gap:40px;container-type:size;}
.cp-ff-figure{flex:none;display:flex;flex-direction:column;min-width:0;}
.cp-ff-frame{flex:none;padding:10px;}
.cp-ff-frame .media-slot{border-radius:8px!important;}
.cp-ff-cap{flex:none;height:${CAPTION_H}px;display:flex;align-items:flex-end;}
.cp-ff-side{flex:1;min-width:0;display:flex;flex-direction:column;gap:18px;}
.cp-ff-notes{flex:1;min-height:0;display:grid;grid-auto-rows:minmax(0,1fr);row-gap:18px;}
.cp-ff-main:not(.is-bottom) .cp-ff-notes{grid-auto-rows:minmax(0,260px);align-content:start;}
.cp-ff-note{display:flex;align-items:center;gap:22px;padding:20px 30px 20px 24px;min-height:0;}
.cp-ff-note .campus-seal{min-width:56px;height:44px;font-size:22px;border-radius:12px 12px 12px 4px;}
.cp-ff-note-title{font-size:25px;line-height:1.35;font-weight:700;color:var(--theme-ink);}
.cp-ff-note-desc{margin-top:6px;font-size:22px;line-height:1.55;color:var(--theme-muted);text-wrap:pretty;}
.cp-ff-source{flex:none;display:flex;align-items:center;gap:12px;font-size:18px;line-height:1.4;color:var(--theme-faint);}
.cp-ff-notes.is-4 .cp-ff-note{padding:16px 24px 14px 20px;}
.cp-ff-notes.is-4 .cp-ff-note-desc{margin-top:4px;font-size:20px;line-height:1.5;}
/* 底栏版:图在上方居中,解读卡横排在下方 */
.cp-ff-main.is-bottom{flex-direction:column;gap:22px;align-items:center;}
.cp-ff-main.is-bottom .cp-ff-figure{align-items:center;}
.cp-ff-main.is-bottom .cp-ff-cap{height:52px;width:100%;justify-content:space-between;gap:24px;}
.cp-ff-main.is-bottom .cp-ff-side{flex:none;align-self:stretch;height:${NOTES_ROW_H}px;flex-direction:row;}
.cp-ff-main.is-bottom .cp-ff-notes{grid-auto-flow:column;grid-auto-columns:minmax(0,1fr);grid-auto-rows:auto;column-gap:22px;}
.cp-ff-main.is-bottom .cp-ff-note{flex-direction:column;align-items:stretch;justify-content:center;gap:10px;padding:20px 24px 18px;}
.cp-ff-main.is-bottom .cp-ff-note-head{display:flex;align-items:center;gap:14px;}
.cp-ff-main.is-bottom .cp-ff-note .campus-seal{min-width:48px;height:38px;font-size:20px;}
.cp-ff-main.is-bottom .cp-ff-note-desc{margin-top:0;font-size:20px;line-height:1.5;}
.cp-ff-main.is-bottom .cp-ff-source{white-space:nowrap;}
`;

export function FindingFigure(props) {
  useThemeStyle('campus-finding-figure-style', CSS);
  useEvidenceStyle();
  const p = { ...DEFAULTS, ...props };
  const bottom = p.notesPosition === 'bottom';
  const notes = safeArray(p.notes).slice(0, clamp(p.noteCount, 1, 4));
  const [aspect, setAspect] = React.useState(null);
  const onAspect = React.useCallback(value => {
    const next = safeNumber(value, 0);
    if (next > 0) setAspect(clamp(next, 0.5, 3.2));
  }, []);
  const ratio = aspect || PLACEHOLDER_RATIO[bottom ? 'bottom' : 'side'];
  const r = ratio.toFixed(4);
  // 图框尺寸:按图片比例在可用区域里放到最大(容器查询单位,正文区随导航变化时自动适配)
  const frameW = bottom
    ? `min(100cqw, calc((100cqh - ${NOTES_ROW_H + 22 + 52 + 20}px) * ${r} + 20px))`
    : `min(calc(100cqw - ${NOTES_MIN + 40}px), calc((100cqh - ${CAPTION_H + 20}px) * ${r} + 20px))`;
  const figureStyle = { width: frameW };
  const frameStyle = { width: '100%', height: `calc((${frameW} - 20px) / ${r} + 20px)` };
  const source = p.showSource ? (
    <div className="cp-ff-source">
      <div className="campus-mark is-spark" aria-hidden="true" />
      <p>{p.source}</p>
    </div>
  ) : null;
  return (
    <CampusFrame chapterIndex={p.chapterIndex}>
      <FindingTitle
        no={p.sectionNo}
        title={p.title}
        kicker={p.showKicker ? p.kicker : ''}
        counter={p.showCounter ? p.counter : ''}
        chapterIndex={p.chapterIndex}
        className="campus-rise"
        style={enterDelay(0)}
      />
      <div className={`cp-ff-main${bottom ? ' is-bottom' : ''}`}>
        <figure className="cp-ff-figure campus-rise" style={{ margin: 0, ...figureStyle, ...enterDelay(1) }}>
          <div className="cp-ff-frame campus-photo" style={frameStyle}>
            <MediaSlot id="finding-figure-main" fit="contain" radius={8} placeholder="结果大图" onAspect={onAspect} />
          </div>
          <figcaption className="cp-ff-cap">
            <FigureCaption no={p.figureNo} text={p.caption} />
            {bottom ? source : null}
          </figcaption>
        </figure>
        <aside className="cp-ff-side">
          {!bottom && <LabelRow label={p.notesLabel} className="campus-rise" style={enterDelay(2)} />}
          <div className={`cp-ff-notes is-${notes.length}`}>
            {notes.map((note, i) => (
              <div className="cp-ff-note campus-card campus-rise" style={enterDelay(3 + i)} key={i}>
                {bottom ? (
                  <>
                    <div className="cp-ff-note-head">
                      <div className="campus-seal">{note?.tag}</div>
                      <div className="cp-ff-note-title">{note?.title}</div>
                    </div>
                    <p className="cp-ff-note-desc">{note?.desc}</p>
                  </>
                ) : (
                  <>
                    <div className="campus-seal">{note?.tag}</div>
                    <div>
                      <div className="cp-ff-note-title">{note?.title}</div>
                      <p className="cp-ff-note-desc">{note?.desc}</p>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
          {!bottom ? source : null}
        </aside>
      </div>
    </CampusFrame>
  );
}

FindingFigure.META = {
  id: 'finding-figure',
  label: '结论式标题 · 整页结果图配解读',
  roles: ['result', 'observation', 'image'],
  defaults: DEFAULTS,
  copyBudgets: { title: 44, kicker: 6, counter: 6, caption: 26, source: 24, notesLabel: 6, 'notes[].tag': 4, 'notes[].title': 10, 'notes[].desc': 30 },
  controls: [
    { ...CHAPTER_CONTROL, default: 4 },
    { key: 'notesPosition', type: 'radio', label: '解读位置', default: 'side', options: [{ value: 'side', label: '右侧栏' }, { value: 'bottom', label: '底栏' }], description: '近方形、多面板的结果图选右侧栏;横向宽图选底栏(解读卡横排在图下方)。图片按原比例显示,不裁切。' },
    { key: 'noteCount', type: 'number', label: '解读条数', default: 3, min: 1, max: 4, description: '「图里看什么」的条数,每条可用 tag 对应子图号。' },
    { key: 'showKicker', type: 'toggle', label: '结果徽标', default: true, description: '标题右侧的「结果 N」徽标。' },
    { key: 'showCounter', type: 'toggle', label: '连排页码', default: true, description: '徽标下方的连排页码(同一结论连排 2–3 页时写 1 / 3、2 / 3)。' },
    { key: 'showSource', type: 'toggle', label: '出处注', default: true, description: '图片出处或数据来源的一行小字。' },
  ],
};
