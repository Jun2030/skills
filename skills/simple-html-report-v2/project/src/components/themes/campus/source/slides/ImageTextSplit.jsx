// 图文分栏:一侧大图(媒体槽 + 图号图注),另一侧标签、标题、导语和 2–4 条编号要点;图片可左可右。
// 适合案例呈现、实地调研、作品展示。
import React from 'react';
import { useThemeStyle, enterDelay } from '../../../shared/style.jsx';
import { MediaSlot } from '../../../shared/MediaSlot.jsx';
import { safeArray, clamp } from '../../../chart-safety.mjs';
import { CampusFrame, TitleRow, CHAPTER_CONTROL } from '../kit/chrome.jsx';

const DEFAULTS = {
  chapterIndex: 3,
  imageSide: 'left',
  pointCount: 4,
  images: [],
  sectionNo: '3.1',
  title: '案例呈现',
  figureNo: '图 3-1',
  caption: '一支评测视频从选题到发布的制作现场（示意）',
  kicker: '典型案例',
  heading: '一支评测视频的生产全过程',
  lead: '以一支科技产品评测视频为例，观察数据如何进入选题、制作与复盘的每一个环节。',
  points: [
    { no: '01', title: '选题：数据先行', desc: '参考同类选题的历史表现与搜索热度，确定切入角度。' },
    { no: '02', title: '测试：封面与标题', desc: '准备多套封面与标题，小范围投放后选出点击率最高的一组。' },
    { no: '03', title: '制作：分工协作', desc: '脚本、拍摄、剪辑分工推进，关键节点在协作表格里同步。' },
    { no: '04', title: '复盘：回流选题库', desc: '发布后按核心指标复盘，结论写回选题库，指导下一支作品。' },
  ],
};

const CSS = `
.cp-its{flex:1;min-height:0;display:flex;gap:44px;}
.cp-its.is-right{flex-direction:row-reverse;}
.cp-its-media{flex:0 0 54%;min-width:0;display:flex;flex-direction:column;}
.cp-its-photo{flex:1;min-height:0;}
.cp-its-caption{flex:none;display:flex;align-items:center;gap:16px;margin-top:16px;}
.cp-its-caption .campus-seal{height:34px;min-width:0;padding:0 14px;font-size:19px;border-radius:999px;}
.cp-its-caption-text{font-size:20px;line-height:1.4;color:var(--theme-muted);}
.cp-its-text{flex:1;min-width:0;display:flex;flex-direction:column;}
.cp-its-heading{margin-top:18px;font-family:var(--theme-font-serif);font-weight:700;font-size:40px;line-height:1.25;letter-spacing:.04em;color:var(--theme-accent);text-wrap:balance;}
.cp-its-lead{margin-top:14px;font-size:23px;line-height:1.66;color:var(--theme-ink);text-wrap:pretty;}
.cp-its-rule{flex:none;display:flex;align-items:center;gap:6px;margin:20px 0 4px;}
.cp-its-rule-thick{width:90px;height:5px;border-radius:3px;background:var(--campus-fill);}
.cp-its-rule-thin{flex:1;height:1.5px;background:var(--campus-fade-line);}
.cp-its-points{flex:1;min-height:0;display:grid;grid-auto-rows:minmax(0,1fr);}
.cp-its-point{display:flex;align-items:center;gap:22px;min-height:0;border-bottom:1px dashed var(--campus-accent-line);}
.cp-its-point:last-child{border-bottom:0;}
.cp-its-point .campus-seal{align-self:center;}
.cp-its-point-title{font-size:24px;line-height:1.35;font-weight:700;color:var(--theme-ink);}
.cp-its-point-desc{margin-top:4px;font-size:21px;line-height:1.55;color:var(--theme-muted);text-wrap:pretty;}
`;

export function ImageTextSplit(props) {
  useThemeStyle('campus-image-text-split-style', CSS);
  const p = { ...DEFAULTS, ...props };
  const points = safeArray(p.points).slice(0, clamp(p.pointCount, 2, 4));
  return (
    <CampusFrame chapterIndex={p.chapterIndex}>
      <TitleRow no={p.sectionNo} title={p.title} className="campus-rise" style={enterDelay(0)} />
      <div className={`cp-its${p.imageSide === 'right' ? ' is-right' : ''}`}>
        <figure className="cp-its-media campus-rise" style={{ margin: 0, ...enterDelay(1) }}>
          <div className="cp-its-photo campus-photo">
            <MediaSlot id="image-text-split-photo" fit="cover" radius={10} placeholder="案例图片" />
          </div>
          <figcaption className="cp-its-caption">
            <div className="campus-seal">{p.figureNo}</div>
            <div className="cp-its-caption-text">{p.caption}</div>
          </figcaption>
        </figure>
        <section className="cp-its-text">
          <div className="campus-label-row campus-rise" style={enterDelay(2)}><div className="campus-chip">{p.kicker}</div></div>
          <h3 className="cp-its-heading campus-rise" style={enterDelay(2)}>{p.heading}</h3>
          <p className="cp-its-lead campus-rise" style={enterDelay(3)}>{p.lead}</p>
          <div className="cp-its-rule campus-draw" style={enterDelay(3)} aria-hidden="true"><div className="cp-its-rule-thick" /><div className="cp-its-rule-thin" /></div>
          <div className="cp-its-points">
            {points.map((point, i) => (
              <div className="cp-its-point campus-rise" style={enterDelay(4 + i)} key={i}>
                <div className="campus-seal">{point?.no}</div>
                <div>
                  <div className="cp-its-point-title">{point?.title}</div>
                  <p className="cp-its-point-desc">{point?.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </CampusFrame>
  );
}

ImageTextSplit.META = {
  id: 'image-text-split',
  label: '图文分栏 · 大图配编号要点',
  roles: ['case', 'context', 'image'],
  defaults: DEFAULTS,
  copyBudgets: { lead: 48, heading: 16, caption: 28, 'points[].title': 10, 'points[].desc': 30 },
  controls: [
    { ...CHAPTER_CONTROL, default: 3 },
    { key: 'imageSide', type: 'radio', label: '图片位置', default: 'left', options: [{ value: 'left', label: '左侧' }, { value: 'right', label: '右侧' }], description: '大图放在左侧还是右侧。' },
    { key: 'pointCount', type: 'number', label: '要点数量', default: 4, min: 2, max: 4, description: '文字一侧的编号要点条数。' },
  ],
};
