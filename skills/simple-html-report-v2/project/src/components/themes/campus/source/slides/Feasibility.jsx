// 可行性分析:3–4 个维度(理论 / 技术 / 条件 / 时间,可改名),每个维度一张卡(编号块 + 维度名 + 2–3 条论据 + 可选「已具备」徽标),
// 右侧(或底部)一个「前期结果」图位 + 图号与一句说明。适合开题报告、项目申报的「可行性分析 / 研究基础」。
import React from 'react';
import { useThemeStyle, enterDelay } from '../../../shared/style.jsx';
import { MediaSlot } from '../../../shared/MediaSlot.jsx';
import { safeArray, clamp } from '../../../chart-safety.mjs';
import { CampusFrame, TitleRow, CHAPTER_CONTROL } from '../kit/chrome.jsx';
import { LabelRow } from '../kit/parts.jsx';
import { useAffairsStyle, CheckGlyph } from '../kit/affairs.jsx';

const DEFAULTS = {
  chapterIndex: 4,
  dimCount: 4,
  pointCount: 2,
  mediaAt: 'right',
  showBadges: true,
  images: [],
  sectionNo: '4.5',
  title: '可行性分析',
  dims: [
    { name: '理论可行性', badge: '已具备', points: ['深组合与抗差估计理论已较成熟，有大量文献可借鉴', '权函数定权、频率稳定度传递的原理清楚，可推导实现', '在这里补充第三条理论依据'] },
    { name: '技术可行性', badge: '已具备', points: ['已有软件接收机，可实现中频数据的捕获、跟踪和定位', '已实现松组合定位解算，为深组合滤波器设计打好基础', '在这里补充第三条技术基础'] },
    { name: '条件可行性', badge: '已具备', points: ['课题组具备惯导与接收机实测设备和数据采集条件', '导师团队长期从事组合导航研究，可提供持续指导', '在这里补充第三条研究条件'] },
    { name: '时间可行性', badge: '有保障', points: ['研究计划共 17 个月，各阶段留有缓冲', '前期平台已搭好，后续工作可按计划推进', '在这里补充第三条时间保障'] },
  ],
  figureLabel: '前期结果',
  figureNote: '已具备的研究条件',
  figureNo: '图 11',
  figureCaption: '松组合定位解算的位置误差：组一误差随时间累积，组二保持在 ±5 m 以内。',
};

const CSS = `
.cp-g4-fz{flex:1;min-height:0;display:flex;gap:28px;}
.cp-g4-fz.is-bottom{flex-direction:column;gap:24px;}
.cp-g4-fz-dims{flex:1;min-width:0;min-height:0;display:grid;gap:22px;}
.cp-g4-fz.is-right .cp-g4-fz-dims.is-4,.cp-g4-fz.is-none .cp-g4-fz-dims.is-4{grid-template-columns:repeat(2,minmax(0,1fr));grid-template-rows:repeat(2,minmax(0,1fr));}
.cp-g4-fz.is-right .cp-g4-fz-dims.is-3,.cp-g4-fz.is-none .cp-g4-fz-dims.is-3{grid-template-columns:minmax(0,1fr);grid-template-rows:repeat(3,minmax(0,1fr));}
.cp-g4-fz.is-bottom .cp-g4-fz-dims{grid-auto-flow:column;grid-auto-columns:minmax(0,1fr);}
.cp-g4-fz.is-bottom .cp-g4-fz-dims{flex:0 1 auto;}
/* 维度卡 */
.cp-g4-fz-card{position:relative;min-width:0;min-height:0;display:flex;flex-direction:column;padding:24px 28px 22px;overflow:hidden;}
.cp-g4-fz-ghost{right:16px;bottom:-14px;font-size:130px;color:rgb(var(--theme-accent-rgb) / .06);}
.cp-g4-fz-head{position:relative;flex:none;display:flex;align-items:center;gap:16px;}
.cp-g4-fz-no{flex:none;display:grid;place-items:center;width:58px;height:58px;border-radius:14px 14px 14px 4px;background:var(--campus-fill);color:var(--theme-on-accent);box-shadow:0 8px 18px rgb(var(--theme-accent-rgb) / .28);font-family:var(--theme-font-serif);font-weight:700;font-size:26px;line-height:1;font-variant-numeric:lining-nums;}
.cp-g4-fz-head-text{flex:1;min-width:0;display:flex;align-items:center;justify-content:space-between;gap:12px;}
.cp-g4-fz-name{min-width:0;font-family:var(--theme-font-serif);font-size:30px;line-height:1.25;font-weight:700;letter-spacing:.04em;color:var(--theme-ink);}
.cp-g4-fz-badge{flex:none;display:flex;align-items:center;gap:7px;height:36px;padding:0 14px 0 6px;border-radius:999px;background:var(--campus-accent-tint);color:var(--theme-accent);font-size:18px;line-height:1;font-weight:700;letter-spacing:.06em;white-space:nowrap;}
.cp-g4-fz-badge .cp-g4-check{width:26px;height:26px;background:var(--campus-fill);color:var(--theme-on-accent);}
.cp-g4-fz-rule{position:relative;flex:none;height:2px;margin:18px 0 6px;background:linear-gradient(90deg,rgb(var(--theme-accent-rgb) / .3) 0%,rgb(var(--theme-accent-rgb) / 0) 100%);}
.cp-g4-fz-points{position:relative;flex:1;min-height:0;display:flex;flex-direction:column;justify-content:center;gap:12px;}
.cp-g4-fz-point{display:flex;align-items:flex-start;gap:14px;}
.cp-g4-fz-point .campus-mark{margin-top:12px;}
.cp-g4-fz-text{font-size:22px;line-height:1.55;color:var(--theme-ink);text-wrap:pretty;}
.cp-g4-fz-dims.is-3 .cp-g4-fz-card{flex-direction:row;align-items:center;gap:26px;padding:20px 28px;}
.cp-g4-fz.is-right .cp-g4-fz-dims.is-3 .cp-g4-fz-head,.cp-g4-fz.is-none .cp-g4-fz-dims.is-3 .cp-g4-fz-head{flex:0 0 290px;}
.cp-g4-fz.is-right .cp-g4-fz-dims.is-3 .cp-g4-fz-head-text,.cp-g4-fz.is-none .cp-g4-fz-dims.is-3 .cp-g4-fz-head-text{flex-direction:column;align-items:flex-start;gap:10px;}
.cp-g4-fz.is-right .cp-g4-fz-dims.is-3 .cp-g4-fz-rule,.cp-g4-fz.is-none .cp-g4-fz-dims.is-3 .cp-g4-fz-rule{display:none;}
.cp-g4-fz.is-right .cp-g4-fz-dims.is-3 .cp-g4-fz-points,.cp-g4-fz.is-none .cp-g4-fz-dims.is-3 .cp-g4-fz-points{padding-left:26px;border-left:2px dashed var(--campus-accent-line);}
.cp-g4-fz.is-bottom .cp-g4-fz-dims.is-3 .cp-g4-fz-card{flex-direction:column;align-items:stretch;gap:0;padding:24px 28px 22px;}
.cp-g4-fz.is-bottom .cp-g4-fz-text{font-size:21px;line-height:1.5;}
.cp-g4-fz.is-bottom .cp-g4-fz-name{font-size:27px;}
.cp-g4-fz.is-bottom .cp-g4-fz-dims.is-4 .cp-g4-fz-head-text{flex-direction:column;align-items:flex-start;gap:8px;}
.cp-g4-fz.is-bottom .cp-g4-fz-dims.is-4 .cp-g4-fz-badge{height:32px;font-size:17px;}
/* 前期结果图位 */
.cp-g4-fz-figure{flex:0 0 40%;min-width:0;min-height:0;display:flex;flex-direction:column;padding:22px 26px 22px;}
.campus[data-campus-nav="rail"] .cp-g4-fz.is-right .cp-g4-fz-figure{flex-basis:38%;}
.cp-g4-fz-media{position:relative;flex:1;min-height:0;margin-top:18px;padding:8px;border-radius:var(--campus-radius-sm);background:var(--campus-paper);border:1px solid var(--campus-card-edge);}
.cp-g4-fz-cap{flex:none;display:flex;align-items:flex-start;gap:14px;margin-top:16px;}
.cp-g4-fz-cap .campus-seal{height:36px;min-width:0;padding:0 14px;font-size:19px;border-radius:999px;}
.cp-g4-fz-cap-text{font-size:20px;line-height:1.55;color:var(--theme-muted);text-wrap:pretty;}
.cp-g4-fz.is-bottom .cp-g4-fz-figure{flex:1 1 0;flex-direction:row;align-items:stretch;gap:30px;padding:22px 26px;}
.cp-g4-fz.is-bottom .cp-g4-fz-figure-side{flex:0 0 360px;display:flex;flex-direction:column;justify-content:center;}
.cp-g4-fz.is-bottom .cp-g4-fz-media{margin-top:0;}
.cp-g4-fz.is-bottom .cp-g4-fz-cap{flex-direction:column;margin-top:22px;}
.cp-g4-fz-figure-side{display:contents;}
.cp-g4-fz.is-bottom .cp-g4-fz-figure-side{display:flex;}
`;

export function Feasibility(props) {
  useAffairsStyle();
  useThemeStyle('campus-feasibility-style', CSS);
  const p = { ...DEFAULTS, ...props };
  const dims = safeArray(p.dims).slice(0, clamp(p.dimCount, 3, 4));
  const perDim = clamp(p.pointCount, 2, 3);
  const mediaAt = ['right', 'bottom', 'none'].includes(p.mediaAt) ? p.mediaAt : 'right';
  const figure = mediaAt === 'none' ? null : (
    <section className="cp-g4-fz-figure campus-card campus-rise" style={enterDelay(2 + dims.length)}>
      <div className="cp-g4-fz-figure-side">
        <LabelRow label={p.figureLabel} note={p.figureNote} />
        {mediaAt === 'bottom' && (
          <div className="cp-g4-fz-cap">
            <div className="campus-seal">{p.figureNo}</div>
            <p className="cp-g4-fz-cap-text">{p.figureCaption}</p>
          </div>
        )}
      </div>
      <div className="cp-g4-fz-media">
        <MediaSlot id="feasibility-result" fit="contain" radius={8} placeholder="前期结果图" />
      </div>
      {mediaAt === 'right' && (
        <div className="cp-g4-fz-cap">
          <div className="campus-seal">{p.figureNo}</div>
          <p className="cp-g4-fz-cap-text">{p.figureCaption}</p>
        </div>
      )}
    </section>
  );
  return (
    <CampusFrame chapterIndex={p.chapterIndex}>
      <TitleRow no={p.sectionNo} title={p.title} className="campus-rise" style={enterDelay(0)} />
      <div className={`cp-g4-fz is-${mediaAt}`}>
        <div className={`cp-g4-fz-dims is-${dims.length}`}>
          {dims.map((dim, i) => (
            <section className="cp-g4-fz-card campus-card campus-rise" style={enterDelay(1 + i)} key={i}>
              <div className="cp-g4-ghost cp-g4-fz-ghost" aria-hidden="true" data-editable-skip="true">{String(i + 1).padStart(2, '0')}</div>
              <div className="cp-g4-fz-head">
                <div className="cp-g4-fz-no">{String(i + 1).padStart(2, '0')}</div>
                <div className="cp-g4-fz-head-text">
                  <h3 className="cp-g4-fz-name">{dim?.name}</h3>
                  {p.showBadges && dim?.badge ? (
                    <div className="cp-g4-fz-badge">
                      <div className="cp-g4-check" aria-hidden="true"><CheckGlyph size={15} /></div>
                      <div>{dim.badge}</div>
                    </div>
                  ) : null}
                </div>
              </div>
              <div className="cp-g4-fz-rule" aria-hidden="true" />
              <div className="cp-g4-fz-points">
                {safeArray(dim?.points).slice(0, perDim).map((point, j) => (
                  <div className="cp-g4-fz-point" key={j}>
                    <div className="campus-mark" aria-hidden="true" />
                    <p className="cp-g4-fz-text">{point}</p>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
        {figure}
      </div>
    </CampusFrame>
  );
}

Feasibility.META = {
  id: 'feasibility',
  label: '可行性分析 · 维度论据卡配前期结果图',
  roles: ['context', 'observation', 'image'],
  defaults: DEFAULTS,
  copyBudgets: {
    'dims[].name': 6,
    'dims[].badge': 4,
    'dims[].points[]': 30,
    figureLabel: 6,
    figureNote: 12,
    figureNo: 6,
    figureCaption: 44,
  },
  controls: [
    { ...CHAPTER_CONTROL, default: 4 },
    { key: 'dimCount', type: 'number', label: '维度数', default: 4, min: 3, max: 4, countArrays: ['dims'], mediaSlots: [{ field: 'images', countKey: null, min: 0, max: 1, maxCount: 1 }], description: '可行性维度卡的数量(如理论 / 技术 / 条件 / 时间);每张卡是自动编号、维度名 name、徽标 badge 和论据 points。' },
    { key: 'pointCount', type: 'number', label: '每维论据数', default: 2, min: 2, max: 3, countArrays: ['dims[].points'], description: '每张维度卡显示几条论据(points 的前几条)。3 条时每条建议不超过 24 字。' },
    { key: 'mediaAt', type: 'radio', label: '前期结果图位置', default: 'right', options: [{ value: 'right', label: '右侧' }, { value: 'bottom', label: '底部' }, { value: 'none', label: '不放图' }], description: '「前期结果」图位放在维度卡右侧、下方,或不放图(维度卡占满版面)。横向宽图建议放底部。' },
    { key: 'showBadges', type: 'toggle', label: '「已具备」徽标', default: true, description: '维度名右侧的勾选徽标(badge,如「已具备」「有保障」)。' },
  ],
};
