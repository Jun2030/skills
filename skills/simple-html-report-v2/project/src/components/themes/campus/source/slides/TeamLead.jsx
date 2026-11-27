// 团队「负责人 + 骨干」:左侧一张负责人大卡(校色渐变底板 + 白框人像 + 姓名 + 职称 / 年级 + 2–3 条简介或职责),
// 右侧 2–6 张骨干小卡(人像 + 姓名 + 职称 + 分工)。和等权并列的成员介绍不同,这一页是主次结构。
// 人像都是共享媒体槽:负责人是第 1 张(images[0]),骨干依次是第 2 张起。适合项目申报的「研究团队」、开题的「课题组」。
import React from 'react';
import { useThemeStyle, enterDelay } from '../../../shared/style.jsx';
import { MediaSlot } from '../../../shared/MediaSlot.jsx';
import { safeArray, clamp } from '../../../chart-safety.mjs';
import { CampusFrame, TitleRow, SparkStar, CHAPTER_CONTROL } from '../kit/chrome.jsx';
import { useAffairsStyle } from '../kit/affairs.jsx';

const DEFAULTS = {
  chapterIndex: 5,
  memberCount: 4,
  pointCount: 3,
  images: [],
  sectionNo: '5.5',
  title: '研究团队与分工',
  leadBadge: '项目负责人',
  lead: {
    name: '示例同学',
    title: '硕士研究生 · 导航制导与控制',
    points: [
      '负责课题总体方案设计与进度把控，主持深组合滤波器设计',
      '已完成软件接收机调试与松组合定位解算，具备平台基础',
      '参与省部级组合导航课题 1 项，熟悉惯导与卫星导航原理',
    ],
  },
  teamLabel: '骨干成员',
  teamNote: '4 人 · 覆盖算法、平台、测试三条线',
  members: [
    { name: '导师甲', title: '教授 · 博士生导师', duty: '把握研究方向，指导抗差估计理论与论文写作' },
    { name: '成员乙', title: '博士研究生', duty: '负责频率稳定度传递算法与弱信号跟踪仿真' },
    { name: '成员丙', title: '硕士研究生', duty: '负责惯导解算模块与车载数据同步采集' },
    { name: '成员丁', title: '硕士研究生', duty: '负责城市复杂环境实测与定位精度评估' },
    { name: '成员戊', title: '本科生', duty: '在这里写成员的分工说明' },
    { name: '成员己', title: '工程师', duty: '在这里写成员的分工说明' },
  ],
};

const CSS = `
.cp-g4-team{flex:1;min-height:0;display:flex;gap:30px;}
/* 负责人大卡:渐变底板 + 光环装饰 */
.cp-g4-team-lead{position:relative;isolation:isolate;flex:0 0 600px;min-height:0;display:flex;flex-direction:column;padding:30px 34px 30px;color:var(--theme-on-accent);border-radius:var(--campus-radius-lg);}
.campus[data-campus-nav="rail"] .cp-g4-team-lead{flex-basis:540px;padding-left:28px;padding-right:28px;}
.campus[data-campus-nav="rail"] .cp-g4-team-portrait{flex-basis:236px;height:350px;}
.campus[data-campus-nav="rail"] .cp-g4-team-name{font-size:42px;letter-spacing:.06em;}
.cp-g4-team-lead-bg{position:absolute;inset:0;z-index:-2;border-radius:inherit;background:var(--campus-fill-deep);box-shadow:var(--campus-shadow-lift);}
.cp-g4-team-lead-ring{position:absolute;z-index:-1;border-radius:50%;border:1.5px solid var(--campus-on-accent-line);}
.cp-g4-team-lead-ring.is-a{right:-120px;top:-120px;width:380px;height:380px;}
.cp-g4-team-lead-ring.is-b{right:-60px;top:-60px;width:260px;height:260px;border-color:rgb(255 255 255 / .18);}
.cp-g4-team-lead-glow{position:absolute;z-index:-1;left:-80px;bottom:-120px;width:360px;height:360px;border-radius:50%;background:radial-gradient(circle,rgb(255 255 255 / .12) 0%,rgb(255 255 255 / 0) 70%);}
.cp-g4-team-lead-top{flex:none;display:flex;gap:28px;align-items:stretch;}
.cp-g4-team-portrait{flex:0 0 252px;height:336px;padding:8px;border-radius:var(--campus-radius);background:var(--theme-surface);box-shadow:0 14px 30px rgb(0 0 0 / .18);}
.cp-g4-team-id{flex:1;min-width:0;display:flex;flex-direction:column;justify-content:flex-end;gap:14px;padding-bottom:6px;}
.cp-g4-team-badge{align-self:flex-start;display:flex;align-items:center;gap:8px;height:38px;padding:0 16px 0 12px;border-radius:999px;background:var(--campus-on-accent-glass);border:1px solid var(--campus-on-accent-line);font-size:19px;font-weight:700;letter-spacing:.08em;white-space:nowrap;}
.cp-g4-team-badge-star{flex:none;display:block;color:var(--campus-spark);}
.cp-g4-team-name{font-family:var(--theme-font-serif);font-size:50px;line-height:1.15;font-weight:700;letter-spacing:.1em;}
.cp-g4-team-title{font-size:21px;line-height:1.45;color:var(--campus-on-accent-muted);}
.cp-g4-team-rule{flex:none;display:flex;align-items:center;gap:10px;margin:26px 0 18px;}
.cp-g4-team-rule-line{flex:1;height:1.5px;background:var(--campus-on-accent-line);}
.cp-g4-team-rule-mark{flex:none;width:9px;height:9px;border-radius:2px;transform:rotate(45deg);background:var(--campus-spark);}
.cp-g4-team-points{flex:1;min-height:0;display:flex;flex-direction:column;justify-content:center;gap:18px;}
.cp-g4-team-point{display:flex;align-items:flex-start;gap:14px;}
.cp-g4-team-point-no{flex:none;display:grid;place-items:center;width:30px;height:30px;margin-top:2px;border-radius:8px;background:var(--campus-on-accent-glass);font-family:var(--theme-font-serif);font-weight:700;font-size:17px;line-height:1;}
.cp-g4-team-point-text{font-size:21px;line-height:1.55;}
/* 右侧:骨干成员 */
.cp-g4-team-side{flex:1;min-width:0;min-height:0;display:flex;flex-direction:column;}
.cp-g4-team-side-head{flex:none;display:flex;align-items:center;gap:16px;margin-bottom:20px;}
.cp-g4-team-side-head::after{content:'';flex:1;height:2px;border-radius:1px;background:var(--campus-fade-line);order:3;}
.cp-g4-team-side-note{order:2;font-size:19px;color:var(--theme-faint);white-space:nowrap;}
.cp-g4-team-grid{flex:1;min-height:0;display:grid;gap:22px;}
.cp-g4-team-card{position:relative;min-width:0;min-height:0;display:flex;gap:22px;padding:18px;}
.cp-g4-team-card-photo{flex:0 0 auto;aspect-ratio:3 / 4;height:100%;max-height:300px;padding:6px;border-radius:12px;background:var(--campus-paper);border:1px solid var(--campus-card-edge);}
.cp-g4-team-card-info{flex:1;min-width:0;display:flex;flex-direction:column;justify-content:center;gap:10px;}
.cp-g4-team-card-name{font-family:var(--theme-font-serif);font-size:30px;line-height:1.2;font-weight:700;letter-spacing:.08em;color:var(--theme-ink);}
.cp-g4-team-card-title{align-self:flex-start;display:flex;align-items:center;height:32px;padding:0 12px;border-radius:7px;background:var(--campus-accent-tint);color:var(--theme-accent);font-size:18px;font-weight:700;letter-spacing:.04em;white-space:nowrap;}
.cp-g4-team-card-duty{font-size:20px;line-height:1.55;color:var(--theme-muted);text-wrap:pretty;}
.cp-g4-team-card-cap{position:absolute;left:18px;top:0;width:54px;height:5px;border-radius:0 0 3px 3px;background:var(--campus-fill);}
/* 姓名 + 职称 */
.cp-g4-team-card-head{display:flex;flex-direction:column;gap:10px;}
/* 3 列(5–6 人):人像在上,姓名与职称同一行 */
.cp-g4-team-grid.is-vertical .cp-g4-team-card{flex-direction:column;gap:12px;padding:14px 14px 16px;}
.cp-g4-team-grid.is-vertical .cp-g4-team-card-photo{flex:1 1 0;min-height:0;height:auto;max-height:none;aspect-ratio:auto;}
.cp-g4-team-grid.is-vertical .cp-g4-team-card-info{flex:none;gap:7px;padding:0 6px;}
.cp-g4-team-grid.is-vertical .cp-g4-team-card-name{font-size:26px;}
.cp-g4-team-grid.is-vertical .cp-g4-team-card-duty{font-size:19px;line-height:1.45;}
.cp-g4-team-grid.is-vertical .cp-g4-team-card-head{flex-direction:row;align-items:center;justify-content:space-between;gap:8px;}
.cp-g4-team-grid.is-vertical .cp-g4-team-card-title{align-self:center;height:30px;font-size:17px;padding:0 10px;}
`;

export function TeamLead(props) {
  useAffairsStyle();
  useThemeStyle('campus-team-lead-style', CSS);
  const p = { ...DEFAULTS, ...props };
  const members = safeArray(p.members).slice(0, clamp(p.memberCount, 2, 6));
  const points = safeArray(p.lead?.points).slice(0, clamp(p.pointCount, 2, 3));
  const cols = members.length >= 5 ? 3 : 2;
  // 竖卡(人像在上):5–6 人三列时、或只有 1 行 2 人时
  const vertical = cols === 3 || members.length <= 2;
  const rows = Math.ceil(members.length / cols);
  return (
    <CampusFrame chapterIndex={p.chapterIndex}>
      <TitleRow no={p.sectionNo} title={p.title} className="campus-rise" style={enterDelay(0)} />
      <div className="cp-g4-team">
        <section className="cp-g4-team-lead campus-rise" style={enterDelay(1)}>
          <div className="cp-g4-team-lead-bg" aria-hidden="true" />
          <div className="cp-g4-team-lead-ring is-a" aria-hidden="true" />
          <div className="cp-g4-team-lead-ring is-b" aria-hidden="true" />
          <div className="cp-g4-team-lead-glow" aria-hidden="true" />
          <div className="cp-g4-team-lead-top">
            <div className="cp-g4-team-portrait">
              <MediaSlot id="team-lead-0" fit="cover" radius={10} placeholder="负责人照片" />
            </div>
            <div className="cp-g4-team-id">
              <div className="cp-g4-team-badge">
                <SparkStar size={18} className="cp-g4-team-badge-star" />
                <div>{p.leadBadge}</div>
              </div>
              <h3 className="cp-g4-team-name">{p.lead?.name}</h3>
              <div className="cp-g4-team-title">{p.lead?.title}</div>
            </div>
          </div>
          <div className="cp-g4-team-rule" aria-hidden="true">
            <div className="cp-g4-team-rule-mark" />
            <div className="cp-g4-team-rule-line" />
          </div>
          <div className="cp-g4-team-points">
            {points.map((point, i) => (
              <div className="cp-g4-team-point" key={i}>
                <div className="cp-g4-team-point-no">{i + 1}</div>
                <p className="cp-g4-team-point-text">{point}</p>
              </div>
            ))}
          </div>
        </section>
        <div className="cp-g4-team-side">
          <div className="cp-g4-team-side-head campus-rise" style={enterDelay(2)}>
            <div className="campus-chip">{p.teamLabel}</div>
            <div className="cp-g4-team-side-note">{p.teamNote}</div>
          </div>
          <div className={`cp-g4-team-grid is-cols-${cols}${vertical ? ' is-vertical' : ''}`} style={{ gridTemplateColumns: `repeat(${cols}, minmax(0,1fr))`, gridTemplateRows: `repeat(${rows}, minmax(0,1fr))` }}>
            {members.map((m, i) => (
              <section className="cp-g4-team-card campus-card campus-rise" style={enterDelay(3 + i)} key={i}>
                <div className="cp-g4-team-card-cap" aria-hidden="true" />
                <div className="cp-g4-team-card-photo">
                  <MediaSlot id={`team-lead-${i + 1}`} fit="cover" radius={8} placeholder="人像" />
                </div>
                <div className="cp-g4-team-card-info">
                  <div className="cp-g4-team-card-head">
                    <h3 className="cp-g4-team-card-name">{m?.name}</h3>
                    <div className="cp-g4-team-card-title">{m?.title}</div>
                  </div>
                  <p className="cp-g4-team-card-duty">{m?.duty}</p>
                </div>
              </section>
            ))}
          </div>
        </div>
      </div>
    </CampusFrame>
  );
}

TeamLead.META = {
  id: 'team-lead',
  label: '团队 · 负责人大卡配骨干小卡',
  roles: ['team', 'case'],
  defaults: DEFAULTS,
  copyBudgets: {
    leadBadge: 6,
    'lead.name': 5,
    'lead.title': 16,
    'lead.points[]': 30,
    teamLabel: 6,
    teamNote: 20,
    'members[].name': 5,
    'members[].title': 9,
    'members[].duty': 24,
  },
  controls: [
    { ...CHAPTER_CONTROL, default: 5 },
    { key: 'memberCount', type: 'number', label: '骨干人数', default: 4, min: 2, max: 6, countArrays: ['members'], mediaSlots: [{ field: 'images', countKey: null, min: 0, max: 7, maxCount: 7 }], description: '右侧骨干成员卡的数量(members 的前几位);2–4 人排两列,5–6 人排三列。只控制骨干人数,不控制图片:人像图片共 7 个图位,images[0] 是负责人,images[1] 起依次是骨干成员(只显示前「骨干人数」位)。' },
    { key: 'pointCount', type: 'number', label: '负责人简介条数', default: 3, min: 2, max: 3, countArrays: ['lead.points'], description: '负责人大卡里简介 / 职责的条数(lead.points 的前几条)。' },
  ],
};
