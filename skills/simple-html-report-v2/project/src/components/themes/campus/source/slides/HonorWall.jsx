// 荣誉墙:顶部奖项分级数字(国家级 / 省级 / 校级…),中部一排证书照片,底部重点奖项清单。
import React from 'react';
import { useThemeStyle, enterDelay } from '../../../shared/style.jsx';
import { MediaSlot } from '../../../shared/MediaSlot.jsx';
import { safeArray, clamp } from '../../../chart-safety.mjs';
import { CampusFrame, TitleRow, CHAPTER_CONTROL } from '../kit/chrome.jsx';

const DEFAULTS = {
  chapterIndex: 2,
  levelCount: 3,
  certCount: 6,
  awardCount: 8,
  images: [],
  sectionNo: '02',
  title: '荣誉奖项',
  levels: [
    { label: '国家级', value: '3', unit: '项', note: '国家奖学金、全国性学科竞赛' },
    { label: '省级', value: '6', unit: '项', note: '省级学科竞赛与荣誉称号' },
    { label: '校级', value: '14', unit: '项', note: '校级奖学金与评优表彰' },
    { label: '其他', value: '5', unit: '项', note: '社会实践与志愿服务' },
  ],
  certs: [
    { caption: '本科生国家奖学金' },
    { caption: '全国大学生广告艺术大赛一等奖' },
    { caption: '省级优秀学生干部' },
    { caption: '“挑战杯”省级二等奖' },
    { caption: '校级优秀学生' },
    { caption: '大创项目国家级立项' },
  ],
  awardsLabel: '重点奖项',
  awards: [
    { year: '2025', name: '本科生国家奖学金', level: '国家级' },
    { year: '2024', name: '全国大学生广告艺术大赛 一等奖', level: '国家级' },
    { year: '2024', name: '“挑战杯”课外学术科技作品竞赛 省级二等奖', level: '省级' },
    { year: '2024', name: '省级优秀学生干部', level: '省级' },
    { year: '2023', name: '大学生创新创业训练计划 国家级立项', level: '国家级' },
    { year: '2023', name: '校级一等奖学金（连续两年）', level: '校级' },
    { year: '2023', name: '校级优秀学生', level: '校级' },
    { year: '2022', name: '新生辩论赛 最佳辩手', level: '校级' },
  ],
};

const CSS = `
.cp-hw-levels{flex:none;display:grid;grid-auto-flow:column;grid-auto-columns:minmax(0,1fr);gap:24px;}
.cp-hw-level{display:flex;align-items:stretch;min-height:136px;}
.cp-hw-level-label{flex:none;width:96px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;padding:0 22px;background:var(--campus-fill-deep);color:var(--theme-on-accent);border-radius:var(--campus-radius) 0 0 var(--campus-radius);font-family:var(--theme-font-serif);font-weight:700;font-size:27px;line-height:1.25;letter-spacing:.1em;text-align:center;}
.cp-hw-level-main{flex:1;min-width:0;display:flex;flex-direction:column;justify-content:center;gap:8px;padding:12px 26px;}
.cp-hw-level-num{display:flex;align-items:baseline;gap:6px;}
.cp-hw-level-value{font-size:70px;}
.cp-hw-level-unit{font-family:var(--theme-font-serif);font-weight:700;font-size:26px;color:var(--theme-accent);}
.cp-hw-level-note{font-size:19px;line-height:1.4;color:var(--theme-muted);}
.cp-hw-certs{flex:1 1 250px;min-height:0;display:flex;justify-content:center;gap:22px;margin-top:26px;}
.cp-hw-cert{flex:0 0 var(--cp-hw-cert-w);min-width:0;min-height:0;display:flex;flex-direction:column;}
.cp-hw-cert-frame{flex:1;min-height:0;}
.cp-hw-cert-cap{position:absolute;left:50%;bottom:-3px;width:56px;height:6px;margin-left:-28px;border-radius:3px;background:var(--campus-fill);}
.cp-hw-cert-caption{margin-top:14px;font-size:19px;line-height:1.35;text-align:center;color:var(--theme-ink);font-weight:600;}
.cp-hw-awards{flex:none;display:flex;flex-direction:column;margin-top:22px;}
.cp-hw-award-list{margin-top:8px;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));grid-auto-rows:64px;column-gap:56px;}
.cp-hw-award{display:flex;align-items:center;gap:20px;border-bottom:1px dashed var(--campus-accent-line);}
.cp-hw-award-year{flex:none;width:68px;font-size:25px;}
.cp-hw-award-name{flex:1;min-width:0;font-size:21px;line-height:1.4;color:var(--theme-ink);}
.cp-hw-award .campus-chip{flex:none;height:32px;font-size:17px;}
`;

export function HonorWall(props) {
  useThemeStyle('campus-honor-wall-style', CSS);
  const p = { ...DEFAULTS, ...props };
  const levels = safeArray(p.levels).slice(0, clamp(p.levelCount, 2, 4));
  const certs = safeArray(p.certs).slice(0, clamp(p.certCount, 1, 6));
  // 证书少于 3 张时按 3 栏宽度居中,不把单张证书拉成整行。
  const certColumns = Math.max(3, certs.length);
  const awards = safeArray(p.awards).slice(0, clamp(p.awardCount, 2, 8));
  return (
    <CampusFrame chapterIndex={p.chapterIndex}>
      <TitleRow no={p.sectionNo} title={p.title} className="campus-rise" style={enterDelay(0)} />
      <div className="cp-hw-levels">
        {levels.map((level, i) => (
          <div className="cp-hw-level campus-card campus-rise" style={enterDelay(1 + i)} key={i}>
            <div className="cp-hw-level-label"><div className="campus-mark is-spark" aria-hidden="true" /><div>{level?.label}</div></div>
            <div className="cp-hw-level-main">
              <div className="cp-hw-level-num">
                <div className="cp-hw-level-value campus-num">{level?.value}</div>
                <div className="cp-hw-level-unit">{level?.unit}</div>
              </div>
              <div className="cp-hw-level-note">{level?.note}</div>
            </div>
          </div>
        ))}
      </div>
      <div className="cp-hw-certs" style={{ '--cp-hw-cert-w': `calc((100% - ${(certColumns - 1) * 20}px) / ${certColumns})` }}>
        {certs.map((cert, i) => (
          <div className="cp-hw-cert campus-rise" style={enterDelay(3 + i)} key={i}>
            <div className="cp-hw-cert-frame campus-photo">
              <div className="cp-hw-cert-cap" aria-hidden="true" />
              <MediaSlot id={`honor-wall-cert-${i}`} fit="contain" radius={8} placeholder="证书" />
            </div>
            <div className="cp-hw-cert-caption">{cert?.caption}</div>
          </div>
        ))}
      </div>
      <section className="cp-hw-awards campus-rise" style={enterDelay(6)}>
        <div className="campus-label-row">
          <div className="campus-chip">{p.awardsLabel}</div>
        </div>
        <div className="cp-hw-award-list">
          {awards.map((award, i) => (
            <div className="cp-hw-award" key={i}>
              <div className="cp-hw-award-year campus-num">{award?.year}</div>
              <div className="cp-hw-award-name">{award?.name}</div>
              <div className="campus-chip is-soft">{award?.level}</div>
            </div>
          ))}
        </div>
      </section>
    </CampusFrame>
  );
}

HonorWall.META = {
  id: 'honor-wall',
  label: '荣誉墙 · 分级数字配证书与奖项清单',
  roles: ['result', 'metrics', 'case'],
  defaults: DEFAULTS,
  copyBudgets: { 'awards[].name': 24, 'certs[].caption': 16, 'levels[].note': 16 },
  controls: [
    { ...CHAPTER_CONTROL, default: 2 },
    { key: 'levelCount', type: 'number', label: '分级数字数量', default: 3, min: 2, max: 4, description: '顶部奖项分级数字的数量。' },
    { key: 'certCount', type: 'number', label: '证书数量', default: 6, min: 1, max: 6, countArrays: ['images'], description: '中部证书照片的数量(证书说明 certs 按同样的张数显示);少于 3 张时居中排列。' },
    { key: 'awardCount', type: 'number', label: '奖项条数', default: 8, min: 2, max: 8, description: '底部重点奖项清单的条数。' },
  ],
};
