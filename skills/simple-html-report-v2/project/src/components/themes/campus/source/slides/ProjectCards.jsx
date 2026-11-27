// 项目经历卡:1–4 张并排的项目卡,校色卡头写时间与级别,卡内是项目名、角色、简介和成果。
// 卡片下部可放一张项目照片或证书(媒体槽)。适合科研竞赛经历、项目经历、实习经历。
import React from 'react';
import { useThemeStyle, enterDelay } from '../../../shared/style.jsx';
import { MediaSlot } from '../../../shared/MediaSlot.jsx';
import { safeArray, clamp } from '../../../chart-safety.mjs';
import { CampusFrame, TitleRow, ConclusionBar, CHAPTER_CONTROL } from '../kit/chrome.jsx';

const DEFAULTS = {
  chapterIndex: 3,
  projectCount: 3,
  showPhotos: true,
  showConclusion: true,
  images: [],
  sectionNo: '03',
  title: '科研与竞赛经历',
  roleLabel: '角色',
  outcomeLabel: '成果',
  projects: [
    { time: '2024.03—2025.03', level: '国家级', name: '短视频平台青年用户信息茧房研究', role: '项目负责人', desc: '大学生创新创业训练计划项目。设计问卷与访谈提纲，回收有效问卷 600 余份，完成数据分析与研究报告。', outcome: '国家级立项 · 结题优秀' },
    { time: '2024.04—2024.10', level: '国家级', name: '全国大学生广告艺术大赛', role: '策划与文案', desc: '为命题品牌完成整合传播策划，负责消费者洞察与核心创意文案，团队五人协作完成提案。', outcome: '全国一等奖' },
    { time: '2023.10—2024.05', level: '省级', name: '“挑战杯”课外学术科技作品竞赛', role: '核心成员', desc: '围绕县域融媒体中心的内容生产开展调研，负责案例访谈与第三章撰写。', outcome: '省级二等奖' },
    { time: '2023.03—2023.12', level: '校级', name: '第四个项目的名称', role: '担任的角色', desc: '在这里简要说明项目内容、你的具体工作和使用的方法。', outcome: '获得的成果' },
  ],
  conclusionLabel: '收获',
  conclusion: '从选题、调研到成文的完整训练，让我具备了独立开展传播学研究的基本能力。',
};

const CSS = `
.cp-pj{flex:1;min-height:0;display:grid;grid-auto-flow:column;grid-auto-columns:minmax(0,1fr);grid-template-rows:auto auto auto auto auto minmax(0,1fr);column-gap:26px;}
.cp-pj-card{grid-row:1 / -1;display:grid;grid-template-rows:subgrid;min-width:0;min-height:0;}
.cp-pj-card > *{min-width:0;}
.cp-pj-head{position:relative;display:flex;align-items:center;justify-content:space-between;gap:12px;min-height:68px;padding:0 24px;color:var(--theme-on-accent);}
.cp-pj-head-shape{position:absolute;inset:0;z-index:-1;background:var(--campus-fill-deep);border-radius:var(--campus-radius) var(--campus-radius) 0 0;clip-path:polygon(0 0,100% 0,100% calc(100% - 16px),calc(100% - 22px) 100%,0 100%);}
.cp-pj-time{font-family:var(--theme-font-serif);font-weight:700;font-size:23px;letter-spacing:.02em;font-variant-numeric:lining-nums;white-space:nowrap;}
.cp-pj-level{flex:none;display:flex;align-items:center;gap:8px;height:34px;padding:0 14px 0 12px;background:var(--theme-surface);color:var(--theme-accent);border-radius:999px;font-size:18px;font-weight:700;letter-spacing:.08em;}
.cp-pj-name{padding:24px 28px 0;font-family:var(--theme-font-serif);font-weight:700;font-size:31px;line-height:1.32;letter-spacing:.03em;color:var(--theme-ink);text-wrap:balance;}
.cp-pj-role{display:flex;align-items:center;gap:14px;margin:18px 28px 0;padding-bottom:18px;border-bottom:1px dashed var(--campus-accent-line);}
.cp-pj-role .campus-chip{height:32px;font-size:17px;}
.cp-pj-role-text{font-size:22px;font-weight:700;color:var(--theme-accent);}
.cp-pj-desc{padding:16px 28px 0;font-size:22px;line-height:1.7;color:var(--theme-muted);text-wrap:pretty;}
.cp-pj-outcome{display:flex;align-items:center;gap:14px;margin:20px 28px 0;padding:12px 18px 12px 12px;border-radius:var(--campus-radius-sm);}
.cp-pj-outcome .campus-chip{height:32px;font-size:17px;}
.cp-pj-outcome-text{font-family:var(--theme-font-serif);font-weight:700;font-size:24px;line-height:1.3;color:var(--theme-accent);}
.cp-pj-photo{min-height:0;margin:20px 22px 22px;}
/* 少于 3 张时按 3 栏的卡宽居中,不把一两张卡拉满整行 */
.cp-pj.is-1,.cp-pj.is-2{grid-auto-columns:calc((100% - 52px) / 3);justify-content:center;}
/* 不放照片时卡片按内容收高,整组在纵向居中 */
.cp-pj.no-photo{grid-template-rows:auto auto auto auto auto 28px;align-content:center;}
.cp-pj.is-4 .cp-pj-photo{margin:18px 18px 18px;}
.cp-pj.is-4 .cp-pj-name{font-size:27px;padding:20px 24px 0;}
.cp-pj.is-4 .cp-pj-desc{font-size:20px;padding:14px 24px 0;}
.cp-pj.is-4 .cp-pj-role,.cp-pj.is-4 .cp-pj-outcome{margin-left:24px;margin-right:24px;}
.cp-pj.is-4 .cp-pj-time{font-size:20px;}
.cp-pj.is-4 .cp-pj-head{padding:0 18px;}
`;

export function ProjectCards(props) {
  useThemeStyle('campus-project-cards-style', CSS);
  const p = { ...DEFAULTS, ...props };
  const projects = safeArray(p.projects).slice(0, clamp(p.projectCount, 1, 4));
  return (
    <CampusFrame chapterIndex={p.chapterIndex}>
      <TitleRow no={p.sectionNo} title={p.title} className="campus-rise" style={enterDelay(0)} />
      <div className={`cp-pj is-${projects.length}${p.showPhotos ? '' : ' no-photo'}`}>
        {projects.map((proj, i) => (
          <section className="cp-pj-card campus-card campus-rise" style={enterDelay(1 + i)} key={i}>
            <div className="cp-pj-head">
              <div className="cp-pj-head-shape" aria-hidden="true" />
              <div className="cp-pj-time">{proj?.time}</div>
              <div className="cp-pj-level"><div className="campus-mark is-spark" aria-hidden="true" /><div>{proj?.level}</div></div>
            </div>
            <h3 className="cp-pj-name">{proj?.name}</h3>
            <div className="cp-pj-role">
              <div className="campus-chip is-soft">{p.roleLabel}</div>
              <div className="cp-pj-role-text">{proj?.role}</div>
            </div>
            <p className="cp-pj-desc">{proj?.desc}</p>
            <div className="cp-pj-outcome campus-wash">
              <div className="campus-chip">{p.outcomeLabel}</div>
              <div className="cp-pj-outcome-text">{proj?.outcome}</div>
            </div>
            {p.showPhotos ? (
              <div className="cp-pj-photo campus-photo">
                <MediaSlot id={`project-cards-${i}`} fit="cover" radius={8} placeholder="项目照片 / 证书" />
              </div>
            ) : <div />}
          </section>
        ))}
      </div>
      {p.showConclusion && <ConclusionBar label={p.conclusionLabel} text={p.conclusion} className="campus-rise" style={enterDelay(7)} />}
    </CampusFrame>
  );
}

ProjectCards.META = {
  id: 'project-cards',
  label: '项目经历卡 · 时间级别配角色成果与照片',
  roles: ['case', 'result'],
  defaults: DEFAULTS,
  copyBudgets: { 'projects[].name': 16, 'projects[].desc': 48, 'projects[].outcome': 12, 'projects[].role': 7, conclusion: 44 },
  controls: [
    { ...CHAPTER_CONTROL, default: 3 },
    { key: 'projectCount', type: 'number', label: '项目数量', default: 3, min: 1, max: 4, countArrays: ['images'], description: '并排的项目卡数量(项目信息 projects 与项目照片 images 按同样的张数显示);少于 3 张时按 3 栏宽度居中。' },
    { key: 'showPhotos', type: 'toggle', label: '项目照片', default: true, description: '每张卡片下部的项目照片 / 证书媒体槽。' },
    { key: 'showConclusion', type: 'toggle', label: '底部结论条', default: true, description: '页面底部的校色结论条。' },
  ],
};
