// 成员介绍:顶部一句团队简介,下面 1–6 张成员卡(人像槽 + 姓名牌 + 职务标签 + 分工说明),第一位可用校色姓名牌强调。
// 适合课题组、项目团队、社团骨干介绍。
import React from 'react';
import { useThemeStyle, enterDelay } from '../../../shared/style.jsx';
import { MediaSlot } from '../../../shared/MediaSlot.jsx';
import { safeArray, clamp } from '../../../chart-safety.mjs';
import { CampusFrame, TitleRow, CHAPTER_CONTROL } from '../kit/chrome.jsx';

const DEFAULTS = {
  chapterIndex: 1,
  memberCount: 5,
  showLead: true,
  highlightFirst: true,
  images: [],
  sectionNo: '01',
  title: '团队成员',
  leadLabel: '课题组',
  lead: '五名成员来自新闻传播、统计与设计三个专业，分工覆盖调研、数据分析与可视化呈现。',
  members: [
    { name: '示例同学', role: '项目负责人', duty: '统筹研究设计与进度，负责案例分析与报告撰写。' },
    { name: '成员乙', role: '数据分析', duty: '负责平台数据采集、清洗与统计建模。' },
    { name: '成员丙', role: '调研访谈', duty: '设计访谈提纲，完成创作者与观众访谈。' },
    { name: '成员丁', role: '文献综述', duty: '梳理理论脉络与相关研究，撰写综述章节。' },
    { name: '成员戊', role: '视觉设计', duty: '负责图表可视化与答辩材料设计。' },
    { name: '成员己', role: '指导老师', duty: '在这里写成员的分工说明。' },
  ],
};

const CSS = `
.cp-tm-lead{position:relative;flex:none;display:flex;align-items:center;gap:24px;margin-bottom:26px;padding:16px 30px 16px 18px;border-radius:999px;}
.cp-tm-lead-text{flex:1;min-width:0;font-size:23px;line-height:1.6;color:var(--theme-ink);}
/* 三行子网格:人像 / 姓名牌 / 职务与分工;分工长短不一时各列姓名牌仍然对齐 */
.cp-tm{flex:1;min-height:0;display:grid;grid-auto-flow:column;grid-auto-columns:minmax(0,1fr);grid-template-rows:minmax(0,1fr) auto auto;column-gap:26px;}
.cp-tm-card{grid-row:1 / -1;display:grid;grid-template-rows:subgrid;min-width:0;min-height:0;}
.cp-tm-photo{min-height:0;}
.cp-tm-plate{position:relative;display:flex;align-items:center;justify-content:center;height:62px;margin:-31px 18px 0;border-radius:999px;background:var(--theme-surface);box-shadow:0 8px 20px rgb(var(--theme-accent-rgb) / .14);font-family:var(--theme-font-serif);font-weight:700;font-size:30px;letter-spacing:.14em;color:var(--theme-ink);}
.cp-tm-card.is-lead .cp-tm-plate{background:var(--campus-fill);color:var(--theme-on-accent);box-shadow:var(--campus-shadow-lift);}
.cp-tm-crown{position:absolute;left:50%;top:-14px;width:28px;height:28px;margin-left:-14px;border-radius:50%;display:grid;place-items:center;background:var(--theme-surface);color:var(--campus-spark);box-shadow:0 3px 8px rgb(var(--theme-accent-rgb) / .2);}
.cp-tm-info{display:flex;flex-direction:column;align-items:center;gap:12px;padding:18px 14px 0;text-align:center;}
.cp-tm-info .campus-chip{height:34px;}
.cp-tm-duty{font-size:21px;line-height:1.6;color:var(--theme-muted);text-wrap:balance;}
.cp-tm.is-1,.cp-tm.is-2{grid-auto-columns:calc((100% - 52px) / 3);justify-content:center;}
.cp-tm.is-6 .cp-tm-plate{font-size:26px;letter-spacing:.1em;margin-left:12px;margin-right:12px;}
.cp-tm.is-6 .cp-tm-duty{font-size:19px;}
`;

export function TeamMembers(props) {
  useThemeStyle('campus-team-members-style', CSS);
  const p = { ...DEFAULTS, ...props };
  const members = safeArray(p.members).slice(0, clamp(p.memberCount, 1, 6));
  return (
    <CampusFrame chapterIndex={p.chapterIndex}>
      <TitleRow no={p.sectionNo} title={p.title} className="campus-rise" style={enterDelay(0)} />
      {p.showLead && (
        <div className="cp-tm-lead campus-wash campus-rise" style={enterDelay(1)}>
          <div className="campus-chip">{p.leadLabel}</div>
          <p className="cp-tm-lead-text">{p.lead}</p>
        </div>
      )}
      <div className={`cp-tm is-${members.length}`}>
        {members.map((m, i) => (
          <section className={`cp-tm-card campus-rise${p.highlightFirst && i === 0 ? ' is-lead' : ''}`} style={enterDelay(2 + i)} key={i}>
            <div className="cp-tm-photo campus-photo">
              <MediaSlot id={`team-members-${i}`} fit="cover" radius={10} placeholder="人像" />
            </div>
            <div className="cp-tm-plate">
              {p.highlightFirst && i === 0 && (
                <div className="cp-tm-crown" aria-hidden="true">
                  <svg width="16" height="16" viewBox="0 0 24 24"><path fill="currentColor" d="M12 1.5l2.6 7.1 7.4.3-5.8 4.6 2 7.2L12 16.6l-6.2 4.1 2-7.2L2 8.9l7.4-.3z" /></svg>
                </div>
              )}
              <div>{m?.name}</div>
            </div>
            <div className="cp-tm-info">
              <div className="campus-chip is-soft">{m?.role}</div>
              <p className="cp-tm-duty">{m?.duty}</p>
            </div>
          </section>
        ))}
      </div>
    </CampusFrame>
  );
}

TeamMembers.META = {
  id: 'team-members',
  label: '成员介绍 · 人像配姓名分工',
  roles: ['team', 'case'],
  defaults: DEFAULTS,
  copyBudgets: { lead: 48, 'members[].duty': 24, 'members[].name': 5, 'members[].role': 6 },
  controls: [
    { ...CHAPTER_CONTROL },
    { key: 'memberCount', type: 'number', label: '成员人数', default: 5, min: 1, max: 6, countArrays: ['images'], description: '成员卡数量(姓名分工 members 按同样的人数显示);少于 3 人时按 3 栏宽度居中。' },
    { key: 'showLead', type: 'toggle', label: '团队简介', default: true, description: '成员卡上方的一句团队简介。' },
    { key: 'highlightFirst', type: 'toggle', label: '强调第一位', default: true, description: '第一位成员(如负责人)的姓名牌用校色实底。' },
  ],
};
