// 测试用例表:顶部一排汇总数字(用例总数、通过数、通过率…,可带一条进度条),下方「编号 / 测试项 / 操作步骤 /
// 预期结果 / 实际结果 / 结论」六列表格,结论列是「通过 / 未通过 / 待测」徽标(外观按词表自动对应),
// 未通过的行浅色提示;右侧可选一个现场照片 / 截图位;底部结论条。
// 表格文字、汇总数字、徽标文字都是 HTML 文本。
import React from 'react';
import { useThemeStyle, enterDelay } from '../../../shared/style.jsx';
import { MediaSlot } from '../../../shared/MediaSlot.jsx';
import { safeArray, safeNumber, clamp } from '../../../chart-safety.mjs';
import { CampusFrame, TitleRow, ConclusionBar, CHAPTER_CONTROL } from '../kit/chrome.jsx';
import { LabelRow } from '../kit/parts.jsx';
import { useDataStyle, countOf, VerdictBadge, verdictKind, VERDICT_HINT } from '../kit/data.jsx';

const DEFAULTS = {
  chapterIndex: 3,
  caseCount: 7,
  statCount: 4,
  showPhoto: false,
  showConclusion: true,
  sectionNo: '3.8',
  title: '系统功能测试',
  stats: [
    { value: '7', label: '测试用例', progress: 0 },
    { value: '6', label: '通过', progress: 0 },
    { value: '1', label: '未通过', progress: 0 },
    { value: '85.7%', label: '通过率', progress: 85.7 },
  ],
  tableLabel: '功能测试用例',
  tableNote: 'Chrome 浏览器 · 示例数据',
  headNo: '编号',
  headItem: '测试项',
  headSteps: '操作步骤',
  headExpected: '预期结果',
  headActual: '实际结果',
  headVerdict: '结论',
  cases: [
    { no: 'TC-01', item: '用户注册', steps: '填写信息，通过验证码二次验证后提交', expected: '注册成功，等待管理员审核', actual: '与预期一致', verdict: '通过' },
    { no: 'TC-02', item: '用户登录', steps: '输入正确的账号和密码后登录', expected: '进入首页，Cookie 保存身份', actual: '与预期一致', verdict: '通过' },
    { no: 'TC-03', item: '密码加密传输', steps: '抓包查看登录请求的内容', expected: '密码以 MD5 密文传输', actual: '与预期一致', verdict: '通过' },
    { no: 'TC-04', item: '试题管理', steps: '管理员新增一道编程题并保存', expected: '题库中出现该题，分类正确', actual: '与预期一致', verdict: '通过' },
    { no: 'TC-05', item: '在线测试', steps: '开始考试，中途部分提交，再提交整卷', expected: '计时正常，提交后更新试题数据', actual: '与预期一致', verdict: '通过' },
    { no: 'TC-06', item: '头像上传', steps: '上传一张 2 MB 的头像图片', expected: '头像经 CDN 返回并显示', actual: '首次加载超时，刷新后正常', verdict: '未通过' },
    { no: 'TC-07', item: '负载均衡', steps: '停掉一个 Tomcat 容器后继续访问', expected: '请求自动转发到其余容器', actual: '与预期一致', verdict: '通过' },
    { no: 'TC-08', item: '关闭试卷保护', steps: '尝试展开一份已关闭的试卷', expected: '系统拒绝展开详细内容', actual: '与预期一致', verdict: '通过' },
    { no: 'TC-09', item: '单场排行榜', steps: '完成考试后查看单场排名', expected: '按本场得分实时排名', actual: '功能尚未接入', verdict: '待测' },
  ],
  photoLabel: '测试现场',
  photoCaption: '在线测试界面（Chrome）',
  conclusionLabel: '测试结论',
  conclusion: '核心功能全部通过；头像上传依赖第三方 CDN，首次加载超时，已加入重试机制。',
};

const CSS = `
.cp-g3-tc-stats{margin:-2px 0 20px;}
.cp-g3-tc-stats .cp-g3-stat{flex-wrap:wrap;}
.cp-g3-tc-progress{flex:0 0 100%;height:6px;margin-top:-2px;border-radius:3px;background:var(--campus-neutral-wash);overflow:hidden;}
.cp-g3-tc-progress-fill{height:100%;border-radius:3px;background:var(--campus-fill);}
.cp-g3-stat.is-lead .cp-g3-tc-progress{background:var(--campus-on-accent-glass);}
.cp-g3-stat.is-lead .cp-g3-tc-progress-fill{background:var(--theme-surface);}
.cp-g3-tc{flex:1;min-height:0;display:flex;gap:26px;}
.cp-g3-tc-card{flex:1 1 0;min-width:0;min-height:0;display:flex;flex-direction:column;padding:20px 24px 18px;}
.cp-g3-tc-top{flex:none;margin-bottom:16px;}
.cp-g3-tc-table{flex:1;min-height:0;}
.cp-g3-tc-table .cp-g3-tb-row{max-height:92px;}
.cp-g3-tc-table .cp-g3-tb-th{padding:8px 14px;}
.cp-g3-tc-table .cp-g3-tb-td{padding:4px 14px;line-height:1.3;}
.cp-g3-tc-no{font-family:var(--theme-font-serif);font-weight:700;font-size:20px;color:var(--campus-accent-soft);white-space:nowrap;font-variant-numeric:lining-nums tabular-nums;}
.cp-g3-tc-item{font-weight:700;}
.cp-g3-tb-row.is-fail{background:linear-gradient(90deg,rgb(var(--theme-accent-rgb) / .1) 0%,rgb(var(--theme-accent-rgb) / .03) 100%);}
.cp-g3-tb-row.is-fail .cp-g3-tc-actual{color:var(--theme-accent);font-weight:700;}
.cp-g3-tc-failbar{position:absolute;left:0;top:7px;bottom:7px;width:5px;border-radius:3px;background:var(--theme-accent);pointer-events:none;}
.cp-g3-tb-row.is-wait .cp-g3-tc-actual{color:var(--theme-faint);}
.cp-g3-tc-table .cp-g3-verdict{height:36px;font-size:19px;padding:0 14px 0 6px;}
.cp-g3-tc-table .cp-g3-verdict-icon{width:26px;height:26px;}
.cp-g3-tc.is-dense .cp-g3-tb-td{font-size:20px;line-height:1.24;padding:3px 12px;}
.cp-g3-tc.is-dense .cp-g3-tc-card{padding-top:16px;padding-bottom:14px;}
.cp-g3-tc.is-dense .cp-g3-tc-top{margin-bottom:12px;}
.cp-g3-tc.is-dense .cp-g3-tb-head{min-height:50px;}
.cp-g3-tc-stats.is-tight{margin-bottom:14px;}
.cp-g3-tc-stats.is-tight .cp-g3-stat{padding:7px 18px;}
.cp-g3-tc-photo{flex:0 0 380px;min-height:0;display:flex;flex-direction:column;padding:20px 22px 18px;}
.campus[data-campus-nav="rail"] .cp-g3-tc-photo{flex-basis:340px;}
.cp-g3-tc-frame{position:relative;flex:1;min-height:0;margin-top:16px;}
.cp-g3-tc-cap{flex:none;display:flex;align-items:center;gap:10px;margin-top:14px;font-size:19px;line-height:1.35;color:var(--theme-muted);}
.cp-g3-tc-cap .campus-mark{width:9px;height:9px;}
`;

export function TestCases(props) {
  useDataStyle();
  useThemeStyle('campus-test-cases-style', CSS);
  const p = { ...DEFAULTS, ...props };
  const cases = safeArray(p.cases).slice(0, countOf(p.caseCount, 5, 9));
  const stats = safeArray(p.stats).slice(0, countOf(p.statCount, 2, 4));
  const photo = p.showPhoto === true;
  const cols = photo
    ? 'minmax(0,.62fr) minmax(0,.95fr) minmax(0,1.5fr) minmax(0,1.3fr) minmax(0,1.18fr) minmax(0,.98fr)'
    : 'minmax(0,.55fr) minmax(0,.9fr) minmax(0,1.6fr) minmax(0,1.35fr) minmax(0,1.25fr) minmax(0,.78fr)';
  const dense = cases.length > 7 || (photo && cases.length > 6);
  return (
    <CampusFrame chapterIndex={p.chapterIndex}>
      <TitleRow no={p.sectionNo} title={p.title} className="campus-rise" style={enterDelay(0)} />
      <div className={`cp-g3-stats cp-g3-tc-stats is-compact${dense ? ' is-tight' : ''}`}>
        {stats.map((item, i) => {
          const ratio = clamp(safeNumber(item?.progress, 0), 0, 100);
          return (
            <div className={`cp-g3-stat campus-rise${i === 0 ? ' is-lead' : ' campus-card'}`} style={enterDelay(1 + i)} key={i}>
              {i === 0 && <div className="cp-g3-stat-shape" aria-hidden="true" />}
              {i === 0 && <div className="cp-g3-stat-orb" aria-hidden="true" />}
              <div className="cp-g3-stat-value">{item?.value}</div>
              <div className="cp-g3-stat-label">{item?.label}</div>
              {ratio > 0 ? (
                <div className="cp-g3-tc-progress" aria-hidden="true"><div className="cp-g3-tc-progress-fill" style={{ width: `${ratio}%` }} /></div>
              ) : null}
            </div>
          );
        })}
      </div>
      <div className={`cp-g3-tc${dense ? ' is-dense' : ''}`}>
        <section className="cp-g3-tc-card campus-card campus-rise" style={enterDelay(3)}>
          <div className="cp-g3-tc-top"><LabelRow label={p.tableLabel} note={p.tableNote} /></div>
          <div className="cp-g3-tb cp-g3-tc-table" style={{ '--cp-g3-cols': cols }}>
            <div className="cp-g3-tb-head">
              <div className="cp-g3-tb-th">{p.headNo}</div>
              <div className="cp-g3-tb-th">{p.headItem}</div>
              <div className="cp-g3-tb-th">{p.headSteps}</div>
              <div className="cp-g3-tb-th">{p.headExpected}</div>
              <div className="cp-g3-tb-th">{p.headActual}</div>
              <div className="cp-g3-tb-th is-center">{p.headVerdict}</div>
            </div>
            <div className="cp-g3-tb-body">
              {cases.map((row, r) => {
                const kind = verdictKind(row?.verdict);
                return (
                  <div className={`cp-g3-tb-row campus-fade is-${kind}`} style={enterDelay(4 + r)} key={r}>
                    {kind === 'fail' && <div className="cp-g3-tc-failbar" aria-hidden="true" />}
                    <div className="cp-g3-tb-td"><div className="cp-g3-tc-no">{row?.no}</div></div>
                    <div className="cp-g3-tb-td cp-g3-tc-item">{row?.item}</div>
                    <div className="cp-g3-tb-td is-muted">{row?.steps}</div>
                    <div className="cp-g3-tb-td">{row?.expected}</div>
                    <div className="cp-g3-tb-td cp-g3-tc-actual">{row?.actual}</div>
                    <div className="cp-g3-tb-td is-center"><VerdictBadge label={row?.verdict} /></div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
        {photo && (
          <aside className="cp-g3-tc-photo campus-card campus-rise" style={enterDelay(4)}>
            <LabelRow label={p.photoLabel} />
            <div className="cp-g3-tc-frame campus-photo">
              <MediaSlot id="test-cases-photo" fit="cover" radius={8} placeholder="测试截图" />
            </div>
            <div className="cp-g3-tc-cap">
              <div className="campus-mark" aria-hidden="true" />
              <div>{p.photoCaption}</div>
            </div>
          </aside>
        )}
      </div>
      {p.showConclusion && <ConclusionBar label={p.conclusionLabel} text={p.conclusion} className="campus-rise" style={enterDelay(12)} />}
    </CampusFrame>
  );
}

TestCases.META = {
  id: 'test-cases',
  label: '测试用例 · 汇总数字配用例表',
  roles: ['result', 'metrics', 'process'],
  defaults: DEFAULTS,
  copyBudgets: {
    'stats[].value': 6, 'stats[].label': 6, tableLabel: 8, tableNote: 16,
    headNo: 4, headItem: 5, headSteps: 6, headExpected: 6, headActual: 6, headVerdict: 4,
    'cases[].no': 6, 'cases[].item': 8, 'cases[].steps': 22, 'cases[].expected': 18, 'cases[].actual': 16, 'cases[].verdict': 4,
    photoLabel: 6, photoCaption: 16, conclusion: 52,
  },
  numberBounds: {
    'stats[].progress': { min: 0, max: 100, semantics: 'percent' },
  },
  controls: [
    { ...CHAPTER_CONTROL, default: 3 },
    { key: 'caseCount', type: 'number', label: '用例行数', default: 7, min: 5, max: 9, countArrays: ['cases'], description: `测试用例的行数,单元格可以写两行。${VERDICT_HINT}` },
    { key: 'statCount', type: 'number', label: '汇总数字个数', default: 4, min: 2, max: 4, countArrays: ['stats'], description: '顶部汇总数字的个数(第一个是渐变底的主数字);stats[].progress 填 0–100 时在该项下方画一条进度条(如通过率),填 0 不画。汇总数字是手填的,不会从表格自动统计:增删用例或改结论后,同步修改用例总数、通过数、通过率(及其 progress)。' },
    { key: 'showPhoto', type: 'toggle', label: '右侧截图位', default: false, description: '表格右侧的一个现场照片 / 系统截图位。默认关闭;goal 里给 images 传图时要同时写 showPhoto: true,否则图不显示。' },
    { key: 'images', type: 'images', label: '测试截图', description: '「右侧截图位」打开时显示的照片或截图(只用第 1 张)。goal 里写 props.images 时要同时写 showPhoto: true。' },
    { key: 'showConclusion', type: 'toggle', label: '底部结论条', default: true, description: '页面底部的校色结论条。' },
  ],
};
