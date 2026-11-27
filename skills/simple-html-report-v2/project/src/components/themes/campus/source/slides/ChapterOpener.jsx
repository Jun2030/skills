// 章节过渡页:半幅校色渐变色块(斜边压在照片上;衬线大章节号 + 章节标题 + 英文 + 本章小节),另半幅铺满实景照片。
import React from 'react';
import { useThemeStyle, enterDelay } from '../../../shared/style.jsx';
import { MediaSlot } from '../../../shared/MediaSlot.jsx';
import { safeArray, safeNumber, clamp } from '../../../chart-safety.mjs';
import { CampusFrame, CampusBrand, CampusPageNumber } from '../kit/chrome.jsx';

const DEFAULTS = {
  blockSide: 'left',
  photoCount: 1,
  showPoints: true,
  pointCount: 3,
  images: [],
  title: '研究背景',
  number: '01',
  titleEn: 'RESEARCH BACKGROUND',
  lead: '从内容创作者普遍的“流量焦虑”出发，说明这项研究为什么值得做。',
  points: [
    { index: '1.1', text: '流量焦虑与头部账号的反差' },
    { index: '1.2', text: '三种理论视角的文献综述' },
    { index: '1.3', text: '本文的研究对象与问题' },
    { index: '1.4', text: '研究意义' },
  ],
};

const CSS = `
.cp-chap{position:absolute;inset:0;display:flex;}
.cp-chap.is-right{flex-direction:row-reverse;}
.cp-chap-block{position:relative;z-index:2;flex:0 0 53%;display:flex;flex-direction:column;padding:28px 96px 40px var(--campus-pad-x);color:var(--theme-on-accent);}
.cp-chap.is-right .cp-chap-block{padding-left:120px;padding-right:var(--campus-pad-x);}
/* 色块本体:渐变 + 朝照片一侧的斜边(斜边越出色块 90px 压在照片上),形状元素不含文字 */
.cp-chap-shape{position:absolute;z-index:-1;top:0;bottom:0;left:0;right:-90px;background:var(--campus-fill-deep);clip-path:polygon(0 0,100% 0,calc(100% - 90px) 100%,0 100%);}
.cp-chap.is-right .cp-chap-shape{left:-90px;right:0;clip-path:polygon(0 0,100% 0,100% 100%,90px 100%);}
.cp-chap-orb{position:absolute;z-index:-1;border-radius:50%;border:2px solid rgb(255 255 255 / .1);pointer-events:none;}
.cp-chap-dots{position:absolute;z-index:-1;display:grid;grid-template-columns:repeat(6,8px);gap:14px;pointer-events:none;}
.cp-chap-dot{width:8px;height:8px;border-radius:50%;background:rgb(255 255 255 / .22);}
.cp-chap-top{height:72px;display:flex;align-items:center;}
.cp-chap-main{flex:1;display:flex;flex-direction:column;justify-content:center;}
.cp-chap-num{font-family:var(--theme-font-serif);font-weight:700;font-size:216px;line-height:.86;letter-spacing:-.01em;font-variant-numeric:lining-nums;}
.cp-chap-rule{width:96px;height:6px;margin:36px 0 34px;border-radius:3px;background:var(--campus-spark);}
.cp-chap-title{max-width:820px;font-family:var(--theme-font-serif);font-weight:700;font-size:88px;line-height:1.16;letter-spacing:.05em;text-wrap:balance;}
.cp-chap-en{margin-top:16px;font-size:21px;font-weight:600;letter-spacing:.32em;color:var(--campus-on-accent-muted);}
.cp-chap-lead{margin-top:30px;max-width:820px;font-size:26px;line-height:1.62;color:var(--theme-on-accent);opacity:.92;text-wrap:pretty;}
.cp-chap-points{margin-top:38px;max-width:820px;display:flex;flex-direction:column;gap:12px;}
.cp-chap-point{display:flex;align-items:center;gap:22px;height:58px;padding:0 24px 0 10px;border-radius:999px;background:var(--campus-on-accent-glass);}
.cp-chap-point-index{flex:none;display:grid;place-items:center;min-width:64px;height:40px;padding:0 10px;border-radius:999px;background:var(--theme-surface);color:var(--theme-accent);font-family:var(--theme-font-serif);font-weight:700;font-size:23px;font-variant-numeric:lining-nums;}
.cp-chap-point-text{font-size:25px;line-height:1.3;font-weight:500;}
.cp-chap-foot{height:30px;display:flex;align-items:center;justify-content:flex-end;}
.cp-chap.is-right .cp-chap-foot{justify-content:flex-start;}
.cp-chap-photos{position:relative;flex:1;min-width:0;display:flex;flex-direction:column;gap:8px;background:var(--theme-surface);}
.cp-chap-photo{position:relative;flex:62 1 0;min-height:0;}
.cp-chap-photo + .cp-chap-photo{flex:38 1 0;}
.cp-chap-photo .media-slot{border-radius:0!important;}
.cp-chap-mask{position:absolute;z-index:1;inset:0;pointer-events:none;display:none;background:linear-gradient(90deg,rgb(var(--theme-accent-rgb) / .36) 0%,rgb(var(--theme-accent-rgb) / 0) 38%);}
.cp-chap.is-right .cp-chap-mask{background:linear-gradient(270deg,rgb(var(--theme-accent-rgb) / .36) 0%,rgb(var(--theme-accent-rgb) / 0) 38%);}
.cp-chap-photo:has(.media-slot.is-filled) .cp-chap-mask{display:block;}
.cp-chap-band{position:absolute;z-index:2;left:0;right:0;bottom:0;height:14px;background:var(--campus-fill);}
.cp-chap-photos.is-2 .cp-chap-band{display:none;}
`;

export function ChapterOpener(props) {
  useThemeStyle('campus-chapter-opener-style', CSS);
  const p = { ...DEFAULTS, ...props };
  const points = p.showPoints ? safeArray(p.points).slice(0, clamp(p.pointCount, 2, 4)) : [];
  const photoCount = clamp(Math.round(safeNumber(p.photoCount, 1)), 1, 2);
  return (
    <CampusFrame layout="bleed">
      <div className={`cp-chap${p.blockSide === 'right' ? ' is-right' : ''}`}>
        <section className="cp-chap-block">
          <div className="cp-chap-shape" aria-hidden="true" />
          <div className="cp-chap-orb" aria-hidden="true" style={{ right: -40, top: -170, width: 420, height: 420 }} />
          <div className="cp-chap-orb" aria-hidden="true" style={{ right: 40, top: -90, width: 260, height: 260 }} />
          <div className="cp-chap-dots" aria-hidden="true" style={{ right: 120, top: 300 }}>
            {Array.from({ length: 18 }, (_, i) => <div className="cp-chap-dot" key={i} />)}
          </div>
          <div className="cp-chap-top campus-fade" style={enterDelay(0)}><CampusBrand tone="inverse" /></div>
          <div className="cp-chap-main">
            <div className="cp-chap-num campus-rise" style={enterDelay(1)}>{p.number}</div>
            <div className="cp-chap-rule campus-draw" style={enterDelay(3)} />
            <h2 className="cp-chap-title campus-rise" style={enterDelay(2)}>{p.title}</h2>
            <div className="cp-chap-en campus-rise" style={enterDelay(3)}>{p.titleEn}</div>
            <p className="cp-chap-lead campus-rise" style={enterDelay(4)}>{p.lead}</p>
            {points.length > 0 && (
              <div className="cp-chap-points">
                {points.map((point, i) => (
                  <div className="cp-chap-point campus-rise" style={enterDelay(5 + i)} key={i}>
                    <div className="cp-chap-point-index">{point?.index}</div>
                    <div className="cp-chap-point-text">{point?.text}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="cp-chap-foot"><CampusPageNumber tone="inverse" /></div>
        </section>
        <div className={`cp-chap-photos is-${photoCount}`}>
          <div className="cp-chap-photo campus-fade" style={enterDelay(1)}>
            <MediaSlot id="chapter-opener-photo" fit="cover" radius={0} placeholder="校园实景照片" />
            <div className="cp-chap-mask" />
            <div className="cp-chap-band" />
          </div>
          {photoCount > 1 && (
            <div className="cp-chap-photo campus-fade" style={enterDelay(2)}>
              <MediaSlot id="chapter-opener-photo-1" fit="cover" radius={0} placeholder="校园实景照片" />
              <div className="cp-chap-mask" />
            </div>
          )}
        </div>
      </div>
    </CampusFrame>
  );
}

ChapterOpener.META = {
  id: 'chapter-opener',
  label: '章节过渡 · 校色色块配实景照片',
  roles: ['transition'],
  defaults: DEFAULTS,
  copyBudgets: { title: 12, lead: 48 },
  controls: [
    { key: 'blockSide', type: 'radio', label: '色块位置', default: 'left', options: [{ value: 'left', label: '左侧' }, { value: 'right', label: '右侧' }], description: '校色色块在左还是在右,照片占另一侧。' },
    { key: 'photoCount', type: 'number', label: '照片数量', default: 1, min: 1, max: 2, description: '实景照片的张数;两张时上下拼接。' },
    { key: 'showPoints', type: 'toggle', label: '本章小节', default: true, description: '章节标题下方列出本章的几个小节。' },
    { key: 'pointCount', type: 'number', label: '小节数量', default: 3, min: 2, max: 4, description: '显示的小节条数。' },
  ],
};
