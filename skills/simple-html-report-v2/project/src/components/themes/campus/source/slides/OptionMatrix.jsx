// 多方案文字对比矩阵:首列是方案名(编号 + 名称 + 一行出处 / 备注),其余 2–4 列是对比维度,单元格是 1–3 行短句,
// 行高随内容自适应;可把一行标成推荐 / 本文采用(整行浅校色底 + 左侧渐变条 + 小旗标记)。
// 适合研究方法比较、技术路线选型、几种方案的优缺点对照。
import React from 'react';
import { useThemeStyle, enterDelay } from '../../../shared/style.jsx';
import { safeArray, clamp, safeNumber } from '../../../chart-safety.mjs';
import { CampusFrame, TitleRow, ConclusionBar, CHAPTER_CONTROL } from '../kit/chrome.jsx';
import { useStructureStyle, PickTag } from '../kit/structure.jsx';

const DEFAULTS = {
  chapterIndex: 2,
  rowCount: 5,
  dimensionCount: 3,
  highlightIndex: 1,
  showConclusion: true,
  sectionNo: '2.8',
  title: '六种分析方法对比',
  cornerLabel: '分析方法',
  pickLabel: '本文主线',
  dimensions: ['核心思路', '分析内容', '主要作用', '适用情境'],
  rows: [
    { no: '01', name: '作业成本', note: '第 2.1 节', cells: ['以作业为核算对象，把企业视为满足顾客需要的一系列作业', '成本链分析、动因分析、作业分析', '科学分配制造费用，提供客观成本信息', '制造费用占比高、产品种类多的企业'] },
    { no: '02', name: '竞争对手分析', note: '第 2.3 节', cells: ['区分第一类与其他类竞争对手', '价格与服务质量上的竞争', '说明利润不只来自企业内部效率', '同质产品竞争激烈的市场'] },
    { no: '03', name: '价值链管理分析', note: '第 2.4 节', cells: ['梳理从原材料到最终用户的全部增值活动', '识别并消除不增加价值的作业', '提高顾客价值与企业整体竞争力', '链条长、协作环节多的企业'] },
    { no: '04', name: '战略成本分析', note: '第 2.6 节', cells: ['以行业价值链为基础，逐项比较与对手的成本', '外部环境、内部条件、竞争态势', '找出成本优势或劣势的根源', '制定竞争战略前的成本定位'] },
    { no: '05', name: '营运管理分析', note: '第 2.7 节', cells: ['按区域、产品等维度计量盈利能力', '区域、产品、部门、渠道、人员五个维度', '分析盈亏动因，支持精细化管理', '已建立完整业务信息系统的企业'] },
    { no: '06', name: '成本管理分析', note: '第 2.5 节', cells: ['从思想、方法、手段、组织四方面改进', '目标成本、责任成本、本量利分析', '改变只重事后算账的做法', '成本管控粗放、以事后核算为主的企业'] },
  ],
  conclusionLabel: '选择依据',
  conclusion: '作业成本法直接回答“成本怎么分”，其余方法分别从竞争、价值链与营运角度补充。',
};

const CSS = `
.cp-om{min-height:0;}
.cp-om .campus-xt-head{min-height:64px;}
.cp-om-corner{gap:12px;}
.cp-om-corner-slash{flex:none;width:2px;height:26px;border-radius:1px;background:var(--campus-on-accent-line);transform:skewX(-20deg);}
.cp-om-dim-no{flex:none;font-family:var(--theme-font-serif);font-size:18px;font-weight:700;color:var(--campus-spark);font-variant-numeric:lining-nums;}
.cp-om .campus-xt-row{min-height:0;}
.cp-om-name{flex-direction:column;align-items:flex-start;justify-content:center;gap:6px;padding-left:28px;}
.cp-om-name-line{display:flex;align-items:center;gap:14px;}
.cp-om-name .campus-seal{min-width:40px;height:40px;font-size:20px;}
.cp-om-name-text{font-family:var(--theme-font-serif);font-weight:700;font-size:26px;line-height:1.25;letter-spacing:.03em;color:var(--theme-ink);}
.cp-om-name-note{padding-left:54px;font-size:18px;line-height:1.3;color:var(--theme-faint);}
.cp-om-cell{align-items:center;font-size:22px;line-height:1.5;color:var(--theme-ink);}
/* 推荐行:浅校色渐变底 + 左侧渐变竖条 + 小旗,名称变校色 */
.cp-om-row.is-pick{background:var(--campus-wash);}
.cp-om-pick-bar{position:absolute;left:0;top:10px;bottom:10px;width:7px;border-radius:0 4px 4px 0;background:var(--campus-fill-bar);}
.cp-om-row.is-pick .cp-om-name-text{color:var(--theme-accent);}
.cp-om-row.is-pick .cp-om-cell{font-weight:700;}
.cp-om-name .campus-pick{margin-left:54px;}
.cp-om.is-dense .campus-xt-td{padding-top:9px;padding-bottom:9px;}
.cp-om.is-dense .cp-om-cell{font-size:21px;line-height:1.45;}
.cp-om.is-dense .cp-om-name-text{font-size:24px;}
.cp-om.is-dense .campus-pick{height:28px;font-size:17px;}
`;

export function OptionMatrix(props) {
  useStructureStyle();
  useThemeStyle('campus-option-matrix-style', CSS);
  const p = { ...DEFAULTS, ...props };
  const rows = safeArray(p.rows).slice(0, clamp(p.rowCount, 2, 6));
  const dimCount = clamp(p.dimensionCount, 2, 4);
  const dims = safeArray(p.dimensions).slice(0, dimCount);
  const pick = clamp(Math.round(safeNumber(p.highlightIndex, 0)), 0, rows.length);
  const cols = `318px repeat(${Math.max(1, dims.length)},minmax(0,1fr))`;
  const dense = rows.length >= 5 && dims.length >= 4;
  return (
    <CampusFrame chapterIndex={p.chapterIndex}>
      <TitleRow no={p.sectionNo} title={p.title} className="campus-rise" style={enterDelay(0)} />
      <div className="campus-xt-stage">
      <div className={`cp-om campus-xt campus-card campus-rise${dense ? ' is-dense' : ''}`} style={{ '--cp-xt-cols': cols, maxHeight: 64 + rows.length * 170, ...enterDelay(1) }}>
        <div className="campus-xt-head">
          <div className="campus-xt-th cp-om-corner">
            <div className="campus-xt-mark" aria-hidden="true" />
            <div>{p.cornerLabel}</div>
            <div className="cp-om-corner-slash" aria-hidden="true" />
          </div>
          {dims.map((dim, j) => <div className="campus-xt-th" key={j}><div>{dim}</div></div>)}
        </div>
        <div className="campus-xt-body">
          {rows.map((row, i) => {
            const isPick = pick === i + 1;
            const cells = safeArray(row?.cells).slice(0, dims.length);
            return (
              <div className={`campus-xt-row cp-om-row campus-fade${isPick ? ' is-pick' : (i % 2 ? ' is-zebra' : '')}`} style={enterDelay(2 + i)} key={i}>
                {isPick && <div className="cp-om-pick-bar" aria-hidden="true" />}
                <div className="campus-xt-td cp-om-name">
                  <div className="cp-om-name-line">
                    <div className={`campus-seal${isPick ? '' : ' is-soft'}`}>{row?.no}</div>
                    <div className="cp-om-name-text">{row?.name}</div>
                  </div>
                  {isPick ? <PickTag label={p.pickLabel} /> : <div className="cp-om-name-note">{row?.note}</div>}
                </div>
                {dims.map((_, j) => <div className="campus-xt-td cp-om-cell" key={j}><div>{cells[j]}</div></div>)}
              </div>
            );
          })}
        </div>
      </div>
      </div>
      {p.showConclusion && <ConclusionBar label={p.conclusionLabel} text={p.conclusion} className="campus-rise" style={enterDelay(9)} />}
    </CampusFrame>
  );
}

OptionMatrix.META = {
  id: 'option-matrix',
  label: '方案对比矩阵 · 多方案按维度文字对照',
  roles: ['comparison', 'context'],
  defaults: DEFAULTS,
  copyBudgets: {
    cornerLabel: 6,
    pickLabel: 5,
    'rows[].no': 3,
    'rows[].name': 7,
    'rows[].note': 10,
    'rows[].cells[]': 30,
    'dimensions[]': 8,
    conclusionLabel: 4,
    conclusion: 44,
  },
  controls: [
    { ...CHAPTER_CONTROL, default: 2 },
    { key: 'rowCount', type: 'number', label: '方案数量', default: 5, min: 2, max: 6, description: '参与对比的方案 / 方法行数。' },
    { key: 'dimensionCount', type: 'number', label: '对比维度数', default: 3, min: 2, max: 4, countArrays: ['dimensions', 'rows[].cells'], description: '方案名之后的维度列数;每行的 cells 按同样的列数显示,每格 1–3 行短句。' },
    { key: 'highlightIndex', type: 'number', label: '推荐行', default: 1, min: 0, max: 6, maxFromKey: 'rowCount', description: '标成推荐 / 本文采用的是第几行;0 表示不标。被标的行显示「推荐」小旗,不显示备注。' },
    { key: 'showConclusion', type: 'toggle', label: '底部结论条', default: true, description: '页面底部的校色结论条。' },
  ],
};
