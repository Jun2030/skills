// 成果清单:按类别分组(论文 / 专利 / 软著 / 获奖 / 项目),2–4 组自动分栏。
// 每组是一张卡:渐变卡头放组名、一句构成说明和该组数量的大数字;下面 2–5 条文献式条目,条目前是编号,
// 条目下可带「第一作者」「已录用」这类小标签(第一枚实心)。适合硕博答辩的「科研成果」、结题汇报的「成果产出」。
import React from 'react';
import { useThemeStyle, enterDelay } from '../../../shared/style.jsx';
import { safeArray, clamp } from '../../../chart-safety.mjs';
import { CampusFrame, TitleRow, ConclusionBar, CHAPTER_CONTROL } from '../kit/chrome.jsx';
import { useAffairsStyle, TagRow } from '../kit/affairs.jsx';

const DEFAULTS = {
  chapterIndex: 5,
  groupCount: 3,
  itemCount: 3,
  showConclusion: true,
  sectionNo: '5.3',
  title: '攻读学位期间取得的科研成果',
  groups: [
    {
      name: '学术论文',
      note: '示例数据 · 一作 2 篇',
      count: '3',
      unit: '篇',
      items: [
        { text: '示例同学, 导师甲. 基于无监督学习的多视点三维重建方法[J]. 计算机工程与应用, 2024.', tags: ['第一作者', '已录用'] },
        { text: '示例同学, 成员乙. 融合几何约束的深度估计网络[C]. 全国图像图形学学术会议, 2024.', tags: ['第一作者', '已发表'] },
        { text: '成员乙, 示例同学. 面向弱纹理区域的立体匹配改进算法[J]. 计算机应用, 2025.', tags: ['第二作者', '在投'] },
        { text: '在这里填写第四篇论文的作者、题名、刊物与年份。', tags: ['作者顺序', '状态'] },
        { text: '在这里填写第五篇论文的作者、题名、刊物与年份。', tags: ['作者顺序', '状态'] },
      ],
    },
    {
      name: '专利与软著',
      note: '示例数据 · 授权 1 项',
      count: '2',
      unit: '项',
      items: [
        { text: '一种基于 B/S 模式的在线测试系统及其组卷方法：发明专利，申请号 2024XXXXXXXX.X。', tags: ['第一发明人', '实审中'] },
        { text: 'Java 编程知识在线测试系统 V1.0：计算机软件著作权，登记号 2024SRXXXXXX。', tags: ['著作权人', '已登记'] },
        { text: '在这里填写第三项专利或软著的名称、类型与编号。', tags: ['角色', '状态'] },
        { text: '在这里填写第四项专利或软著的名称、类型与编号。', tags: ['角色', '状态'] },
        { text: '在这里填写第五项专利或软著的名称、类型与编号。', tags: ['角色', '状态'] },
      ],
    },
    {
      name: '竞赛获奖',
      note: '示例数据 · 省级以上 2 项',
      count: '3',
      unit: '项',
      items: [
        { text: '全国大学生计算机设计大赛（软件应用与开发类），2024 年。', tags: ['国家级二等奖', '队长'] },
        { text: '省大学生程序设计竞赛，2023 年。', tags: ['省级一等奖'] },
        { text: '校级“挑战杯”课外学术科技作品竞赛，2023 年。', tags: ['校级特等奖'] },
        { text: '在这里填写第四项获奖的赛事名称与年份。', tags: ['奖项等级'] },
        { text: '在这里填写第五项获奖的赛事名称与年份。', tags: ['奖项等级'] },
      ],
    },
    {
      name: '参与项目',
      note: '示例数据 · 主持 1 项',
      count: '2',
      unit: '项',
      items: [
        { text: '大学生创新训练计划项目：面向课程的在线测评平台建设，2023—2024。', tags: ['主持', '已结题'] },
        { text: '横向课题：教学资源平台持续集成与运维，2024。', tags: ['参与'] },
        { text: '在这里填写第三个项目的名称、来源与起止时间。', tags: ['角色'] },
        { text: '在这里填写第四个项目的名称、来源与起止时间。', tags: ['角色'] },
        { text: '在这里填写第五个项目的名称、来源与起止时间。', tags: ['角色'] },
      ],
    },
  ],
  conclusionLabel: '成果小结',
  conclusion: '围绕课题共形成论文 3 篇、专利与软著 2 项、竞赛获奖 3 项，成果与学位论文各章一一对应。',
};

const CSS = `
.cp-g4-ach{flex:1;min-height:0;display:grid;grid-auto-flow:column;grid-auto-columns:minmax(0,1fr);column-gap:26px;}
.cp-g4-ach-card{min-width:0;min-height:0;display:flex;flex-direction:column;}
/* 卡头:渐变色块 + 组名 / 说明 + 右侧大数字;右下角一道斜切 */
.cp-g4-ach-head{position:relative;isolation:isolate;flex:none;display:flex;align-items:center;gap:16px;min-height:118px;padding:16px 26px 22px;color:var(--theme-on-accent);}
.cp-g4-ach-head-shape{position:absolute;inset:0;z-index:-1;background:var(--campus-fill-deep);border-radius:var(--campus-radius) var(--campus-radius) 0 0;clip-path:polygon(0 0,100% 0,100% calc(100% - 18px),calc(100% - 26px) 100%,0 100%);}
.cp-g4-ach-head-ring{position:absolute;right:-30px;top:-40px;width:170px;height:170px;border-radius:50%;border:22px solid rgb(255 255 255 / .07);z-index:-1;}
.cp-g4-ach-name-wrap{flex:1;min-width:0;}
.cp-g4-ach-name{font-family:var(--theme-font-serif);font-size:30px;line-height:1.25;font-weight:700;letter-spacing:.06em;}
.cp-g4-ach-note{margin-top:6px;font-size:18px;line-height:1.35;color:var(--campus-on-accent-muted);letter-spacing:.02em;}
.cp-g4-ach-count{flex:none;display:flex;align-items:baseline;gap:4px;}
.cp-g4-ach-num{font-family:var(--theme-font-serif);font-weight:700;font-size:76px;line-height:.9;font-variant-numeric:lining-nums;}
.cp-g4-ach-unit{font-size:22px;font-weight:700;color:var(--campus-on-accent-muted);}
.cp-g4-ach-star{position:absolute;left:26px;bottom:-2px;width:42px;height:4px;border-radius:2px;background:var(--campus-spark);}
/* 条目 */
.cp-g4-ach-list{flex:1;min-height:0;display:flex;flex-direction:column;padding:8px 26px 14px;}
.cp-g4-ach-item{position:relative;flex:1 1 0;max-height:210px;display:grid;grid-template-columns:42px minmax(0,1fr);align-content:center;column-gap:10px;padding:16px 0 15px;}
.cp-g4-ach-item + .cp-g4-ach-item{border-top:1px dashed var(--theme-line);}
.cp-g4-ach-idx{font-family:var(--theme-font-serif);font-weight:700;font-size:20px;line-height:30px;color:var(--theme-accent);font-variant-numeric:lining-nums;white-space:nowrap;}
.cp-g4-ach-text{font-size:21px;line-height:1.5;color:var(--theme-ink);text-wrap:pretty;}
.cp-g4-ach-tags{margin-top:10px;}
.cp-g4-ach.is-dense .cp-g4-ach-item{padding:11px 0 10px;}
.cp-g4-ach.is-dense .cp-g4-ach-text{font-size:19px;line-height:1.45;}
.cp-g4-ach.is-dense .cp-g4-ach-idx{font-size:18px;line-height:28px;}
.cp-g4-ach.is-dense .cp-g4-ach-tags{margin-top:7px;}
.cp-g4-ach.is-dense .cp-g4-tag{height:27px;font-size:17px;padding:0 10px;}
.cp-g4-ach.is-4 .cp-g4-ach-head{padding-left:22px;padding-right:20px;}
.cp-g4-ach.is-4 .cp-g4-ach-name{font-size:27px;}
.cp-g4-ach.is-4 .cp-g4-ach-num{font-size:64px;}
.cp-g4-ach.is-4 .cp-g4-ach-list{padding-left:22px;padding-right:20px;}
.cp-g4-ach.is-4 .cp-g4-ach-item{grid-template-columns:36px minmax(0,1fr);}
.campus[data-campus-nav="rail"] .cp-g4-ach.is-4 .cp-g4-ach-name{font-size:25px;}
.cp-g4-ach.is-tight .cp-g4-ach-head{min-height:92px;padding-top:12px;padding-bottom:18px;}
.cp-g4-ach.is-tight .cp-g4-ach-num{font-size:56px;}
.cp-g4-ach.is-tight .cp-g4-ach-name{font-size:25px;}
.cp-g4-ach.is-tight .cp-g4-ach-note{margin-top:3px;font-size:17px;}
.cp-g4-ach.is-tight .cp-g4-ach-list{padding-top:4px;padding-bottom:8px;}
.cp-g4-ach.is-tight .cp-g4-ach-item{padding:7px 0 7px;}
.cp-g4-ach.is-tight .cp-g4-ach-text{font-size:18px;line-height:1.4;}
.cp-g4-ach.is-tight .cp-g4-ach-idx{font-size:17px;line-height:25px;}
.cp-g4-ach.is-tight .cp-g4-ach-tags{margin-top:5px;gap:6px;}
.cp-g4-ach.is-tight .cp-g4-tag{height:24px;font-size:16px;padding:0 8px;}
.cp-g4-ach.is-sparse .cp-g4-ach-list{justify-content:center;}
.cp-g4-ach.is-sparse .cp-g4-ach-text{font-size:23px;line-height:1.55;}
.cp-g4-ach.is-sparse .cp-g4-ach-item{max-height:260px;}
`;

export function AchievementList(props) {
  useAffairsStyle();
  useThemeStyle('campus-achievement-list-style', CSS);
  const p = { ...DEFAULTS, ...props };
  const groups = safeArray(p.groups).slice(0, clamp(p.groupCount, 2, 4));
  const perGroup = clamp(p.itemCount, 2, 5);
  // 每栏条目多、或栏数多时收紧行距与字号
  const dense = perGroup >= 4 || (groups.length >= 4 && perGroup >= 3);
  // 栏多且条目多(4 栏 × 4–5 条、3 栏 × 5 条)时再收一档:卡头变矮、正文 18px
  const tight = (groups.length >= 4 && perGroup >= 4) || (groups.length >= 3 && perGroup >= 5);
  const sparse = perGroup <= 2;
  return (
    <CampusFrame chapterIndex={p.chapterIndex}>
      <TitleRow no={p.sectionNo} title={p.title} className="campus-rise" style={enterDelay(0)} />
      <div className={`cp-g4-ach is-${groups.length}${dense ? ' is-dense' : ''}${tight ? ' is-tight' : ''}${sparse ? ' is-sparse' : ''}`}>
        {groups.map((group, g) => {
          const items = safeArray(group?.items).slice(0, perGroup);
          return (
            <section className="cp-g4-ach-card campus-card campus-rise" style={enterDelay(1 + g)} key={g}>
              <div className="cp-g4-ach-head">
                <div className="cp-g4-ach-head-shape" aria-hidden="true" />
                <div className="cp-g4-ach-head-ring" aria-hidden="true" />
                <div className="cp-g4-ach-name-wrap">
                  <h3 className="cp-g4-ach-name">{group?.name}</h3>
                  <div className="cp-g4-ach-note">{group?.note}</div>
                </div>
                <div className="cp-g4-ach-count">
                  <div className="cp-g4-ach-num">{group?.count}</div>
                  <div className="cp-g4-ach-unit">{group?.unit}</div>
                </div>
                <div className="cp-g4-ach-star" aria-hidden="true" />
              </div>
              <div className="cp-g4-ach-list">
                {items.map((item, i) => (
                  <div className="cp-g4-ach-item campus-fade" style={enterDelay(3 + g + i)} key={i}>
                    <div className="cp-g4-ach-idx">{`[${i + 1}]`}</div>
                    <div>
                      <p className="cp-g4-ach-text">{item?.text}</p>
                      <TagRow tags={item?.tags} max={3} className="cp-g4-ach-tags" />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          );
        })}
      </div>
      {p.showConclusion && <ConclusionBar label={p.conclusionLabel} text={p.conclusion} className="campus-rise" style={enterDelay(10)} />}
    </CampusFrame>
  );
}

AchievementList.META = {
  id: 'achievement-list',
  label: '成果清单 · 分类大数字配文献式条目',
  roles: ['result', 'metrics', 'case'],
  defaults: DEFAULTS,
  copyBudgets: {
    'groups[].name': 6,
    'groups[].note': 14,
    'groups[].count': 3,
    'groups[].unit': 2,
    'groups[].items[].text': 64,
    'groups[].items[].tags[]': 6,
    conclusionLabel: 4,
    conclusion: 44,
  },
  controls: [
    { ...CHAPTER_CONTROL, default: 5 },
    { key: 'groupCount', type: 'number', label: '成果类别数', default: 3, min: 2, max: 4, countArrays: ['groups'], description: '分几栏(类别):每栏是组名 name、构成说明 note、数量 count + 单位 unit 和若干条目 items。4 栏时每条建议不超过 40 字;4 栏 × 4–5 条或 3 栏 × 5 条时自动收紧排版,此时每条建议不超过 32 字。' },
    { key: 'itemCount', type: 'number', label: '每类条目数', default: 3, min: 2, max: 5, countArrays: ['groups[].items'], description: '每个类别最多显示几条(items 的前几项);每条是文献式文本 text 和最多 3 枚小标签 tags(第一枚实心,如「第一作者」,其余浅色,如「已录用」)。' },
    { key: 'showConclusion', type: 'toggle', label: '底部结论条', default: true, description: '页面底部的一句成果小结。' },
  ],
};
