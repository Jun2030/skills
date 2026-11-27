// 申报 / 结题状态表:渐变表头 + 斑马行,其中一列是状态徽标(已完成 / 超额完成 / 进行中 / 未开始,或高 / 中 / 低风险),
// 状态取闭合选项,外观只用校色深浅、中性灰和点缀色区分;可带合计行,底部一句总结。
// 状态列可放在最后(序号 / 内容 / 目标 / 实际 / 状态)或中间(风险 / 所属 / 等级 / 应对)。
// 适合考核指标完成对照、研究计划进展、风险评估表。
import React from 'react';
import { useThemeStyle, enterDelay } from '../../../shared/style.jsx';
import { safeArray, clamp } from '../../../chart-safety.mjs';
import { CampusFrame, TitleRow, ConclusionBar, CHAPTER_CONTROL } from '../kit/chrome.jsx';
import { useStructureStyle, StateBadge, STATE_WORDS_HINT } from '../kit/structure.jsx';

const DEFAULTS = {
  chapterIndex: 4,
  rowCount: 7,
  stateAt: 'last',
  showMeta: true,
  showTotal: true,
  showConclusion: true,
  sectionNo: '6.1',
  title: '研究计划与进展',
  headNo: '序号',
  headMain: '工作内容和要求',
  headMeta: '起讫日期',
  headDetail: '预期成果',
  headState: '状态',
  rows: [
    { no: '1', main: '调试软件接收机', meta: '2023.01—2023.02', detail: '可以处理中频数据', status: '已完成' },
    { no: '2', main: '基础理论验证、平台搭建、少量数据处理', meta: '2023.03—2023.05', detail: '熟悉代码、了解流程', status: '进行中' },
    { no: '3', main: '数据验证，小论文撰写', meta: '2023.06—2023.07', detail: '获得实验结论、小论文写好', status: '未开始' },
    { no: '4', main: '修改小论文，实测数据处理', meta: '2023.08—2023.09', detail: '小论文发表', status: '未开始' },
    { no: '5', main: '撰写大论文，优化软件平台，完成中期答辩', meta: '2023.10—2023.12', detail: '论文前 3 章节 + 相关小论文', status: '未开始' },
    { no: '6', main: '整理成果，完善毕业论文', meta: '2024.01—2024.02', detail: '学位论文初稿', status: '未开始' },
    { no: '7', main: '论文修改、送审及答辩', meta: '2024.03—2024.05', detail: '学位论文终稿', status: '未开始' },
    { no: '8', main: '第八项工作内容', meta: '起止时间', detail: '对应的预期成果', status: '未开始' },
  ],
  total: { no: '合计', main: '7 个阶段，共 17 个月', meta: '2023.01—2024.05', detail: '学位论文终稿 + 相关小论文', status: '进行中' },
  conclusionLabel: '当前进展',
  conclusion: '软件接收机已调试完成，松组合定位解算已实现，为深组合平台搭建打好基础。',
};

const CSS = `
.cp-st{min-height:0;}
.cp-st .campus-xt-td{font-size:22px;}
.cp-st-no{justify-content:center;padding-left:0;padding-right:0;}
.cp-st-no .campus-seal{min-width:42px;height:42px;font-size:21px;}
.cp-st-main{font-weight:700;}
.cp-st-meta{font-family:var(--theme-font-serif);font-weight:700;color:var(--campus-accent-soft);font-variant-numeric:lining-nums tabular-nums;letter-spacing:.02em;}
.cp-st-detail{color:var(--theme-muted);}
/* 状态列:整列浅校色底,徽标居中 */
.cp-st-state{justify-content:center;background:rgb(var(--theme-accent-rgb) / .035);}
.campus-xt-th.cp-st-state-th{justify-content:center;}
/* 合计行:顶部双线 + 浅校色渐变底,文字加粗 */
.cp-st-total{flex:0 0 auto;border-top:3px double var(--campus-accent-line);background:var(--campus-wash);border-radius:0 0 var(--campus-radius) var(--campus-radius);}
.cp-st-total .campus-xt-td{font-weight:700;color:var(--theme-ink);}
.cp-st-total .cp-st-no-text{font-family:var(--theme-font-serif);font-size:22px;letter-spacing:.12em;color:var(--theme-accent);}
.cp-st-total .cp-st-state{background:transparent;}
.cp-st.is-dense .campus-xt-td{padding-top:6px;padding-bottom:6px;font-size:21px;line-height:1.35;}
.cp-st.is-dense .campus-state{height:38px;}
`;

export function StatusTable(props) {
  useStructureStyle();
  useThemeStyle('campus-status-table-style', CSS);
  const p = { ...DEFAULTS, ...props };
  const rows = safeArray(p.rows).slice(0, clamp(p.rowCount, 3, 8));
  const middle = p.stateAt === 'middle';
  // 列的顺序:序号 | 主列 | (附加列) | [状态] | 说明列 | [状态]
  // 状态列在中间(风险表)时说明列放最后、给得更宽;在最后(完成情况表)时主列更宽
  const cols = [
    { key: 'no', width: '96px' },
    { key: 'main', width: middle ? 'minmax(0,1fr)' : 'minmax(0,1.25fr)' },
    p.showMeta ? { key: 'meta', width: middle ? 'minmax(0,.58fr)' : 'minmax(0,.72fr)' } : null,
    middle ? { key: 'state', width: '190px' } : null,
    { key: 'detail', width: middle ? 'minmax(0,1.45fr)' : 'minmax(0,1fr)' },
    middle ? null : { key: 'state', width: '200px' },
  ].filter(Boolean);
  const heads = { no: p.headNo, main: p.headMain, meta: p.headMeta, detail: p.headDetail, state: p.headState };
  const dense = rows.length + (p.showTotal ? 1 : 0) >= 8;
  const cell = (row, key, isTotal) => {
    if (key === 'no') {
      return (
        <div className="campus-xt-td cp-st-no" key={key}>
          {isTotal ? <div className="cp-st-no-text">{row?.no}</div> : <div className="campus-seal is-soft">{row?.no}</div>}
        </div>
      );
    }
    if (key === 'state') {
      return <div className="campus-xt-td cp-st-state" key={key}><StateBadge label={row?.status} /></div>;
    }
    return <div className={`campus-xt-td cp-st-${key}`} key={key}><div>{row?.[key]}</div></div>;
  };
  return (
    <CampusFrame chapterIndex={p.chapterIndex}>
      <TitleRow no={p.sectionNo} title={p.title} className="campus-rise" style={enterDelay(0)} />
      <div className="campus-xt-stage">
      <div className={`cp-st campus-xt campus-card campus-rise${dense ? ' is-dense' : ''}`} style={{ '--cp-xt-cols': cols.map(c => c.width).join(' '), maxHeight: 60 + (rows.length + (p.showTotal ? 1 : 0)) * 128, ...enterDelay(1) }}>
        <div className="campus-xt-head">
          {cols.map(c => (
            <div className={`campus-xt-th${c.key === 'no' ? ' is-center' : ''}${c.key === 'state' ? ' cp-st-state-th' : ''}`} key={c.key}>
              {c.key === 'state' ? <div className="campus-xt-mark" aria-hidden="true" /> : null}
              <div>{heads[c.key]}</div>
            </div>
          ))}
        </div>
        <div className="campus-xt-body">
          {rows.map((row, i) => (
            <div className={`campus-xt-row campus-fade${i % 2 ? ' is-zebra' : ''}`} style={enterDelay(2 + i)} key={i}>
              {cols.map(c => cell(row, c.key, false))}
            </div>
          ))}
          {p.showTotal && (
            <div className="campus-xt-row cp-st-total campus-fade" style={enterDelay(3 + rows.length)}>
              {cols.map(c => cell(p.total, c.key, true))}
            </div>
          )}
        </div>
      </div>
      </div>
      {p.showConclusion && <ConclusionBar label={p.conclusionLabel} text={p.conclusion} className="campus-rise" style={enterDelay(10)} />}
    </CampusFrame>
  );
}

StatusTable.META = {
  id: 'status-table',
  label: '状态表 · 完成度或风险等级徽标',
  roles: ['actions', 'risks', 'result'],
  defaults: DEFAULTS,
  copyBudgets: {
    headNo: 3,
    headMain: 8,
    headMeta: 8,
    headDetail: 8,
    headState: 4,
    'rows[].no': 3,
    'rows[].main': 22,
    'rows[].meta': 16,
    'rows[].detail': 28,
    'rows[].status': 5,
    'total.no': 3,
    'total.main': 22,
    'total.meta': 16,
    'total.detail': 28,
    'total.status': 5,
    conclusionLabel: 4,
    conclusion: 44,
  },
  controls: [
    { ...CHAPTER_CONTROL, default: 4 },
    { key: 'rowCount', type: 'number', label: '表格行数', default: 7, min: 3, max: 8, description: `表格的数据行数(不含合计行)。每行的 status 直接写状态文字,${STATE_WORDS_HINT}` },
    { key: 'stateAt', type: 'radio', label: '状态列位置', default: 'last', options: [{ value: 'last', label: '最后一列' }, { value: 'middle', label: '说明列之前' }], description: '完成情况表放最后一列;风险评估表(风险 / 所属 / 等级 / 应对)放在说明列之前。' },
    { key: 'showMeta', type: 'toggle', label: '附加列', default: true, description: '主列后面的附加列(起讫日期、目标要求、所属课题等)。' },
    { key: 'showTotal', type: 'toggle', label: '合计行', default: true, description: '表格底部强调显示的合计 / 汇总行。' },
    { key: 'showConclusion', type: 'toggle', label: '底部结论条', default: true, description: '页面底部的一句总结。' },
  ],
};
