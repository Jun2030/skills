// 实践照片墙:左侧一个衬线大数字(如累计志愿时长)配 2–3 条实践条目,右侧 1–6 个大小错落的照片槽,每张带校色图注。
// 适合志愿服务、社会实践、活动掠影。
import React from 'react';
import { useThemeStyle, enterDelay } from '../../../shared/style.jsx';
import { MediaSlot } from '../../../shared/MediaSlot.jsx';
import { safeArray, clamp } from '../../../chart-safety.mjs';
import { CampusFrame, TitleRow, CHAPTER_CONTROL } from '../kit/chrome.jsx';

const DEFAULTS = {
  chapterIndex: 4,
  photoCount: 5,
  itemCount: 3,
  images: [],
  sectionNo: '04',
  title: '志愿服务与社会实践',
  statValue: '359',
  statUnit: '小时',
  statLabel: '累计志愿服务时长',
  items: [
    { title: '校园志愿服务', note: '迎新、大型活动组织与秩序维护' },
    { title: '社区公益实践', note: '社区宣讲、老年人智能手机课堂' },
    { title: '乡村调研支教', note: '暑期赴县域开展融媒体调研与支教' },
  ],
  quote: '在服务他人中认识社会，在实践中检验所学。',
  captions: [
    { text: '迎新志愿服务' },
    { text: '社区宣讲活动' },
    { text: '暑期乡村支教' },
    { text: '校园文化活动' },
    { text: '县域融媒体调研' },
    { text: '公益科普宣传' },
  ],
};

// 不同照片数的错落网格:第一张始终最大。
const MOSAIC = {
  1: { cols: '1fr', rows: '1fr', areas: ['1 / 1 / 2 / 2'] },
  2: { cols: '1.4fr 1fr', rows: '1fr', areas: ['1 / 1 / 2 / 2', '1 / 2 / 2 / 3'] },
  3: { cols: '1.5fr 1fr', rows: '1fr 1fr', areas: ['1 / 1 / 3 / 2', '1 / 2 / 2 / 3', '2 / 2 / 3 / 3'] },
  4: { cols: '1.4fr 1fr 1fr', rows: '1fr 1fr', areas: ['1 / 1 / 3 / 2', '1 / 2 / 2 / 4', '2 / 2 / 3 / 3', '2 / 3 / 3 / 4'] },
  5: { cols: '1.3fr 1fr 1fr', rows: '1fr 1fr', areas: ['1 / 1 / 3 / 2', '1 / 2 / 2 / 3', '1 / 3 / 2 / 4', '2 / 2 / 3 / 3', '2 / 3 / 3 / 4'] },
  6: { cols: '1.3fr 1fr 1fr', rows: '1fr 1fr', areas: ['1 / 1 / 2 / 2', '1 / 2 / 2 / 3', '1 / 3 / 2 / 4', '2 / 1 / 3 / 2', '2 / 2 / 3 / 3', '2 / 3 / 3 / 4'] },
};

const CSS = `
.cp-pc2{flex:1;min-height:0;display:flex;gap:30px;}
.cp-pc2-side{flex:0 0 500px;display:flex;flex-direction:column;}
.campus[data-campus-nav="rail"] .cp-pc2-side{flex-basis:460px;}
.cp-pc2-stat{position:relative;flex:none;display:flex;flex-direction:column;padding:28px 34px 30px;background:var(--campus-fill-deep);color:var(--theme-on-accent);border-radius:var(--campus-radius-lg);box-shadow:var(--campus-shadow-lift);overflow:hidden;}
.cp-pc2-orb{position:absolute;border-radius:50%;border:2px solid rgb(255 255 255 / .12);pointer-events:none;}
.cp-pc2-stat-num{position:relative;display:flex;align-items:baseline;gap:10px;}
.cp-pc2-stat-value{font-family:var(--theme-font-serif);font-weight:700;font-size:132px;line-height:.92;letter-spacing:-.01em;font-variant-numeric:lining-nums;}
.cp-pc2-stat-unit{font-family:var(--theme-font-serif);font-weight:700;font-size:34px;}
.cp-pc2-stat-label{position:relative;display:flex;align-items:center;gap:12px;margin-top:16px;padding-top:16px;border-top:1px solid var(--campus-on-accent-line);font-size:24px;font-weight:700;letter-spacing:.12em;}
.cp-pc2-items{flex:1;min-height:0;display:grid;grid-auto-rows:minmax(0,1fr);margin-top:6px;}
.cp-pc2-item{display:flex;align-items:center;gap:18px;padding:0 6px;border-bottom:1px dashed var(--campus-accent-line);}
.cp-pc2-item-bar{flex:none;width:6px;height:46px;border-radius:3px;background:var(--campus-fill-bar);}
.cp-pc2-item-title{font-family:var(--theme-font-serif);font-weight:700;font-size:28px;line-height:1.3;letter-spacing:.04em;color:var(--theme-ink);}
.cp-pc2-item-note{margin-top:4px;font-size:20px;line-height:1.45;color:var(--theme-muted);}
.cp-pc2-quote{flex:none;margin-top:16px;padding:16px 24px;border-radius:var(--campus-radius);font-family:var(--theme-font-serif);font-weight:700;font-size:23px;line-height:1.5;letter-spacing:.02em;color:var(--theme-accent);text-wrap:balance;}
.cp-pc2-wall{flex:1;min-width:0;display:grid;gap:16px;}
.cp-pc2-photo{position:relative;min-width:0;min-height:0;}
.cp-pc2-photo .campus-photo{position:absolute;inset:0;}
.cp-pc2-cap{position:absolute;z-index:2;left:20px;bottom:20px;display:flex;align-items:center;height:40px;padding:0 18px;background:var(--campus-fill);color:var(--theme-on-accent);border-radius:999px;font-size:19px;font-weight:700;letter-spacing:.06em;white-space:nowrap;box-shadow:0 6px 14px rgb(var(--theme-accent-rgb) / .3);}
`;

export function PracticeCollage(props) {
  useThemeStyle('campus-practice-collage-style', CSS);
  const p = { ...DEFAULTS, ...props };
  const photos = safeArray(p.captions).slice(0, clamp(p.photoCount, 1, 6));
  const items = safeArray(p.items).slice(0, clamp(p.itemCount, 2, 3));
  const mosaic = MOSAIC[photos.length] || MOSAIC[5];
  return (
    <CampusFrame chapterIndex={p.chapterIndex}>
      <TitleRow no={p.sectionNo} title={p.title} className="campus-rise" style={enterDelay(0)} />
      <div className="cp-pc2">
        <aside className="cp-pc2-side">
          <div className="cp-pc2-stat campus-rise" style={enterDelay(1)}>
            <div className="cp-pc2-orb" aria-hidden="true" style={{ right: -70, top: -90, width: 260, height: 260 }} />
            <div className="cp-pc2-orb" aria-hidden="true" style={{ right: 10, top: -40, width: 150, height: 150 }} />
            <div className="cp-pc2-stat-num">
              <div className="cp-pc2-stat-value">{p.statValue}</div>
              <div className="cp-pc2-stat-unit">{p.statUnit}</div>
            </div>
            <div className="cp-pc2-stat-label"><div className="campus-mark is-spark" aria-hidden="true" /><div>{p.statLabel}</div></div>
          </div>
          <div className="cp-pc2-items">
            {items.map((item, i) => (
              <div className="cp-pc2-item campus-rise" style={enterDelay(2 + i)} key={i}>
                <div className="cp-pc2-item-bar" aria-hidden="true" />
                <div>
                  <div className="cp-pc2-item-title">{item?.title}</div>
                  <div className="cp-pc2-item-note">{item?.note}</div>
                </div>
              </div>
            ))}
          </div>
          <p className="cp-pc2-quote campus-wash campus-rise" style={enterDelay(5)}>{p.quote}</p>
        </aside>
        <div className="cp-pc2-wall" style={{ gridTemplateColumns: mosaic.cols, gridTemplateRows: mosaic.rows }}>
          {photos.map((photo, i) => (
            <div className="cp-pc2-photo campus-fade" style={{ gridArea: mosaic.areas[i], ...enterDelay(2 + i) }} key={i}>
              <div className="campus-photo">
                <MediaSlot id={`practice-collage-${i}`} fit="cover" radius={10} placeholder="实践照片" />
              </div>
              <div className="cp-pc2-cap">{photo?.text}</div>
            </div>
          ))}
        </div>
      </div>
    </CampusFrame>
  );
}

PracticeCollage.META = {
  id: 'practice-collage',
  label: '实践照片墙 · 大数字配错落照片',
  roles: ['case', 'metrics', 'image'],
  defaults: DEFAULTS,
  copyBudgets: { 'items[].title': 8, 'items[].note': 18, 'captions[].text': 9, quote: 24, statLabel: 10 },
  controls: [
    { ...CHAPTER_CONTROL, default: 4 },
    { key: 'photoCount', type: 'number', label: '照片数量', default: 5, min: 1, max: 6, countArrays: ['images'], description: '右侧照片墙的照片张数(图注 captions 按同样的张数显示),网格随张数错落排布。' },
    { key: 'itemCount', type: 'number', label: '实践条目数', default: 3, min: 2, max: 3, description: '左侧大数字下方的实践条目数。' },
  ],
};
