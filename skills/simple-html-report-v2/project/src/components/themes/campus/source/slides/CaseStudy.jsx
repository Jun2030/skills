// 案例分析:左侧案例概况卡(可选图位 + 案例名称 + 对象 / 行业 / 时间 / 规模等 3–5 个字段),
// 右侧按「背景 / 问题 / 做法 / 成效 / 启示」中的 3–4 段分块叙述,每段是圆形段名章 + 短标题 + 2–3 行正文,
// 段名章由一条竖线串起;任一段可带一个关键数字(如成效里的降幅);底部一句启示。适合经管文科类的案例研究。
import React from 'react';
import { useThemeStyle, enterDelay } from '../../../shared/style.jsx';
import { MediaSlot } from '../../../shared/MediaSlot.jsx';
import { safeArray, clamp } from '../../../chart-safety.mjs';
import { CampusFrame, TitleRow, ConclusionBar, CHAPTER_CONTROL } from '../kit/chrome.jsx';
import { useAffairsStyle } from '../kit/affairs.jsx';

const DEFAULTS = {
  chapterIndex: 3,
  fieldCount: 4,
  sectionCount: 4,
  showPhoto: true,
  showConclusion: true,
  images: [],
  sectionNo: '3.2',
  title: '案例分析：作业成本法在制造企业的应用',
  caseLabel: '案例概况',
  caseName: '示例机械制造企业',
  caseNote: '化名 · 示例数据',
  fields: [
    { label: '所属行业', value: '装备制造（零部件加工）' },
    { label: '研究时段', value: '2021—2023 年' },
    { label: '企业规模', value: '员工约 1200 人，产品 300 余种' },
    { label: '分析方法', value: '作业成本法 + 价值链分析' },
    { label: '资料来源', value: '企业年报、实地访谈与财务数据' },
  ],
  sections: [
    { label: '背景', title: '多品种小批量，间接费用占比高', body: '产品种类多、批量小，制造费用按工时平均分摊，成本信息失真，难以支撑定价与产品取舍。', value: '' },
    { label: '问题', title: '传统核算掩盖了真实盈亏', body: '小批量定制产品被低估成本、大批量产品被高估，部分“盈利”订单实际亏损。', value: '' },
    { label: '做法', title: '识别作业、建立成本库', body: '梳理 9 个环节，按资源—作业—成本对象的路径归集，确定成本动因并重新分配制造费用。', value: '' },
    { label: '成效', title: '成本信息更准，决策有据', body: '重新核定产品毛利，淘汰低效作业，间接费用明显下降（示例数据）。', value: '−18%' },
  ],
  conclusionLabel: '启示',
  conclusion: '作业成本法要和企业信息系统、绩效考核一起推进，才能从“算得准”走到“管得好”。',
};

const CSS = `
.cp-g4-case{flex:1;min-height:0;display:flex;gap:30px;}
/* 左侧:案例概况卡 */
.cp-g4-case-profile{flex:0 0 560px;min-height:0;display:flex;flex-direction:column;overflow:hidden;}
.campus[data-campus-nav="rail"] .cp-g4-case-profile{flex-basis:500px;}
.cp-g4-case-photo{position:relative;flex:1 1 0;min-height:150px;max-height:300px;margin:14px 14px 0;}
.cp-g4-case-head{position:relative;isolation:isolate;flex:none;display:flex;flex-direction:column;gap:10px;padding:22px 30px 24px;}
.cp-g4-case-head-row{display:flex;align-items:center;gap:12px;}
.cp-g4-case-note{font-size:18px;color:var(--theme-faint);letter-spacing:.04em;white-space:nowrap;}
.cp-g4-case-name{font-family:var(--theme-font-serif);font-size:36px;line-height:1.25;font-weight:700;letter-spacing:.04em;color:var(--theme-ink);}
.cp-g4-case-name-bar{width:46px;height:4px;border-radius:2px;background:var(--campus-fill);}
/* 没有图时卡头是渐变色块 */
.cp-g4-case-profile.no-photo .cp-g4-case-head{padding:30px 30px 30px;color:var(--theme-on-accent);}
.cp-g4-case-head-bg{position:absolute;inset:0;z-index:-1;background:var(--campus-fill-deep);clip-path:polygon(0 0,100% 0,100% calc(100% - 24px),calc(100% - 34px) 100%,0 100%);}
.cp-g4-case-profile.no-photo .cp-g4-case-name{color:var(--theme-on-accent);font-size:40px;}
.cp-g4-case-profile.no-photo .cp-g4-case-note{color:var(--campus-on-accent-muted);}
.cp-g4-case-profile.no-photo .cp-g4-case-name-bar{background:var(--campus-spark);}
.cp-g4-case-profile.no-photo .campus-chip{background:var(--campus-on-accent-glass);box-shadow:none;}
/* 字段 */
.cp-g4-case-fields{flex:none;display:flex;flex-direction:column;padding:4px 30px 24px;}
.cp-g4-case-profile.no-photo .cp-g4-case-fields{flex:1;padding-top:12px;}
.cp-g4-case-profile.no-photo .cp-g4-case-field{flex:1 1 0;max-height:112px;}
.cp-g4-case-field{display:grid;grid-template-columns:120px minmax(0,1fr);align-items:center;column-gap:16px;padding:13px 0;border-top:1px dashed var(--theme-line);}
.cp-g4-case-field:first-child{border-top:0;}
.cp-g4-case-label{display:flex;align-items:center;gap:8px;font-size:19px;font-weight:700;letter-spacing:.06em;color:var(--campus-accent-soft);white-space:nowrap;}
.cp-g4-case-value{font-size:21px;line-height:1.45;color:var(--theme-ink);}
/* 右侧:分段叙述 */
.cp-g4-case-story{position:relative;flex:1;min-width:0;min-height:0;display:flex;flex-direction:column;gap:16px;}
.cp-g4-case-spine{position:absolute;left:41px;top:30px;bottom:30px;width:0;border-left:2.5px dashed var(--campus-accent-line);}
.cp-g4-case-sec{position:relative;flex:1 1 0;min-height:0;display:flex;align-items:center;gap:26px;}
.cp-g4-case-seal{position:relative;flex:none;width:84px;height:84px;border-radius:50%;display:grid;place-items:center;background:var(--theme-surface);border:2px solid var(--campus-accent-line);color:var(--theme-accent);font-family:var(--theme-font-serif);font-weight:700;font-size:25px;letter-spacing:.06em;box-shadow:0 0 0 7px var(--theme-bg);}
.cp-g4-case-sec.is-last .cp-g4-case-seal{background:var(--campus-fill);border-color:transparent;color:var(--theme-on-accent);box-shadow:0 0 0 7px var(--theme-bg),0 10px 22px rgb(var(--theme-accent-rgb) / .3);}
.cp-g4-case-card{flex:1;min-width:0;align-self:stretch;display:flex;align-items:center;gap:24px;padding:16px 28px;}
.cp-g4-case-card-text{flex:1;min-width:0;}
.cp-g4-case-sec-title{font-size:24px;line-height:1.35;font-weight:700;color:var(--theme-ink);}
.cp-g4-case-sec-body{margin-top:6px;font-size:21px;line-height:1.55;color:var(--theme-muted);text-wrap:pretty;}
.cp-g4-case-sec.is-last .cp-g4-case-sec-title{color:var(--theme-accent);}
.cp-g4-case-metric{flex:none;display:flex;align-items:center;justify-content:center;min-width:132px;height:84px;padding:0 18px;border-radius:var(--campus-radius-sm);background:var(--campus-wash);border:1px solid var(--campus-accent-line);font-family:var(--theme-font-serif);font-weight:700;font-size:44px;line-height:1;color:var(--theme-accent);font-variant-numeric:lining-nums;white-space:nowrap;}
.cp-g4-case-card-cap{position:absolute;left:0;top:18px;bottom:18px;width:5px;border-radius:0 3px 3px 0;background:var(--campus-fill-bar);}
.cp-g4-case-story.is-3 .cp-g4-case-sec-body{font-size:22px;}
`;

export function CaseStudy(props) {
  useAffairsStyle();
  useThemeStyle('campus-case-study-style', CSS);
  const p = { ...DEFAULTS, ...props };
  const fields = safeArray(p.fields).slice(0, clamp(p.fieldCount, 3, 5));
  const sections = safeArray(p.sections).slice(0, clamp(p.sectionCount, 3, 4));
  return (
    <CampusFrame chapterIndex={p.chapterIndex}>
      <TitleRow no={p.sectionNo} title={p.title} className="campus-rise" style={enterDelay(0)} />
      <div className="cp-g4-case">
        <section className={`cp-g4-case-profile campus-card campus-rise${p.showPhoto ? '' : ' no-photo'}`} style={enterDelay(1)}>
          {p.showPhoto && (
            <div className="cp-g4-case-photo campus-photo">
              <MediaSlot id="case-study-photo" fit="cover" radius={10} placeholder="案例图片" />
            </div>
          )}
          <div className="cp-g4-case-head">
            {!p.showPhoto && <div className="cp-g4-case-head-bg" aria-hidden="true" />}
            <div className="cp-g4-case-head-row">
              <div className="campus-chip">{p.caseLabel}</div>
              <div className="cp-g4-case-note">{p.caseNote}</div>
            </div>
            <h3 className="cp-g4-case-name">{p.caseName}</h3>
            <div className="cp-g4-case-name-bar" aria-hidden="true" />
          </div>
          <div className="cp-g4-case-fields">
            {fields.map((f, i) => (
              <div className="cp-g4-case-field campus-fade" style={enterDelay(2 + i)} key={i}>
                <div className="cp-g4-case-label"><div className="campus-mark" aria-hidden="true" /><div>{f?.label}</div></div>
                <div className="cp-g4-case-value">{f?.value}</div>
              </div>
            ))}
          </div>
        </section>
        <div className={`cp-g4-case-story is-${sections.length}`}>
          <div className="cp-g4-case-spine" aria-hidden="true" />
          {sections.map((sec, i) => (
            <div className={`cp-g4-case-sec campus-rise${i === sections.length - 1 ? ' is-last' : ''}`} style={enterDelay(3 + i)} key={i}>
              <div className="cp-g4-case-seal">{sec?.label}</div>
              <section className="cp-g4-case-card campus-card">
                <div className="cp-g4-case-card-cap" aria-hidden="true" />
                <div className="cp-g4-case-card-text">
                  <h3 className="cp-g4-case-sec-title">{sec?.title}</h3>
                  <p className="cp-g4-case-sec-body">{sec?.body}</p>
                </div>
                {sec?.value ? <div className="cp-g4-case-metric">{sec.value}</div> : null}
              </section>
            </div>
          ))}
        </div>
      </div>
      {p.showConclusion && <ConclusionBar label={p.conclusionLabel} text={p.conclusion} className="campus-rise" style={enterDelay(10)} />}
    </CampusFrame>
  );
}

CaseStudy.META = {
  id: 'case-study',
  label: '案例分析 · 概况卡配分段叙述',
  roles: ['case', 'context', 'observation'],
  defaults: DEFAULTS,
  copyBudgets: {
    caseLabel: 4,
    caseName: 12,
    caseNote: 10,
    'fields[].label': 4,
    'fields[].value': 16,
    'sections[].label': 2,
    'sections[].title': 16,
    'sections[].body': 48,
    'sections[].value': 6,
    conclusionLabel: 4,
    conclusion: 44,
  },
  controls: [
    { ...CHAPTER_CONTROL, default: 3 },
    { key: 'fieldCount', type: 'number', label: '概况字段数', default: 4, min: 3, max: 5, countArrays: ['fields'], mediaSlots: [{ field: 'images', countKey: null, min: 0, max: 1, maxCount: 1 }], description: '左侧概况卡的字段行数(对象 / 行业 / 时间 / 规模 / 方法等,每行是 label + value)。' },
    { key: 'sectionCount', type: 'number', label: '叙述段数', default: 4, min: 3, max: 4, countArrays: ['sections'], description: '右侧分段叙述的段数;每段是两字段名 label(背景 / 问题 / 做法 / 成效 / 启示)、短标题 title、正文 body,可选一个关键数字 value(留空不显示)。最后一段的段名章用渐变实底强调。' },
    { key: 'showPhoto', type: 'toggle', label: '案例图片', default: true, description: '概况卡顶部的案例图片;关闭后卡头换成渐变色块。' },
    { key: 'showConclusion', type: 'toggle', label: '底部启示', default: true, description: '页面底部的一句启示。' },
  ],
};
