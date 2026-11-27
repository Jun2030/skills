// 表格页:渐变圆角表头 + 斑马行,三列(序号 / 主要内容 / 说明),行数可调。适合参考文献、数据明细、进度安排。
import React from 'react';
import { useThemeStyle, enterDelay } from '../../../shared/style.jsx';
import { safeArray, clamp } from '../../../chart-safety.mjs';
import { CampusFrame, TitleRow, CHAPTER_CONTROL } from '../kit/chrome.jsx';

const DEFAULTS = {
  chapterIndex: 4,
  rowCount: 8,
  showFootnote: true,
  sectionNo: '4.1',
  title: '参考文献',
  headNo: '序号',
  headMain: '文献',
  headNote: '参考内容',
  rows: [
    { no: '1', main: '[美] 霍克希尔德. 心灵的整饰：人类情感的商业化[M]. 成伯清，淡卫军，王佳鹏，译. 上海：上海三联书店，2020.', note: '用于绪论或理论框架部分，奠定“情感劳动”与“信任经济”分析基础' },
    { no: '2', main: '[美] 梅罗维茨. 消失的地域：电子媒介对社会行为的影响[M]. 肖志军，译. 北京：清华大学出版社，2002.', note: '用于分析影视飓风内容如何构建线上“新场景”与粉丝社群' },
    { no: '3', main: '[美] 尼葛洛庞帝. 数字化生存[M]. 胡泳，范海燕，译. 海口：海南出版社，1997.', note: '用于绪论，阐述研究的宏观数字化时代背景' },
    { no: '4', main: '周葆华. 数据新闻：大数据时代的新闻生产[M]. 北京：中国人民大学出版社，2014.', note: '用于“数据驱动生产机制”，作为数据驱动内容的方法论参照' },
    { no: '5', main: '喻国明. 互联网是一种“高维”媒介——兼论“平台型媒体”是未来媒介发展的主流模式[J]. 新闻与写作，2015(2): 41-44.', note: '用于“矩阵化传播策略”，支撑平台化、生态化布局的分析' },
    { no: '6', main: '喻国明，方可人. 算法推荐必然导致“信息茧房”效应吗？——兼论算法的媒介本质与技术伦理[J]. 编辑之友，2018(5): 5-11.', note: '用于“数据驱动生产机制”，分析创作如何适应与利用算法环境' },
    { no: '7', main: '丁未. 关系赋权：“李子柒”类网红视频的传播逻辑与文化政治[J]. 国际新闻界，2020，42(4): 6-27.', note: '用于“信任经济的商业化路径”，借鉴其“关系赋权”框架分析用户连接' },
    { no: '8', main: '沈阳. 网络直播：参与式文化与体验经济的媒介新景观[M]. 北京：中国传媒大学出版社，2019.', note: '用于分析“荒岛直播”等具体案例的参与式文化与商业体验属性' },
  ],
  footnote: '注：按正文引用顺序排列，著录格式参照 GB/T 7714—2015。',
};

const CSS = `
.cp-dt{flex:1;min-height:0;display:flex;flex-direction:column;}
.cp-dt-row{display:grid;grid-template-columns:104px minmax(0,1.28fr) minmax(0,1fr);align-items:stretch;}
.cp-dt-row > *{display:flex;align-items:center;}
.cp-dt-head{flex:none;min-height:60px;background:var(--campus-fill-deep);color:var(--theme-on-accent);border-radius:var(--campus-radius) var(--campus-radius) 0 0;}
.cp-dt-th{display:flex;align-items:center;gap:12px;padding:0 26px;font-size:22px;font-weight:700;letter-spacing:.12em;}
.cp-dt-th.is-no{justify-content:center;padding:0;}
.cp-dt-body{flex:1;min-height:0;display:flex;flex-direction:column;}
.cp-dt-body .cp-dt-row{flex:1 1 auto;border-top:1px solid var(--theme-line);}
.cp-dt-body .cp-dt-row:first-child{border-top:0;}
.cp-dt-body .cp-dt-row:nth-child(even){background:var(--campus-accent-wash);}
.cp-dt-body .cp-dt-row:last-child{border-radius:0 0 var(--campus-radius) var(--campus-radius);}
.cp-dt-no{justify-content:center;}
.cp-dt-no-badge{display:grid;place-items:center;width:40px;height:40px;border-radius:12px;background:var(--campus-accent-tint);font-size:22px;}
.cp-dt-main{padding:10px 26px;font-size:20px;line-height:1.5;color:var(--theme-ink);text-wrap:pretty;border-left:1px dashed var(--theme-line);}
.cp-dt-note{padding:10px 26px;font-size:20px;line-height:1.5;color:var(--theme-muted);text-wrap:pretty;border-left:1px dashed var(--theme-line);}
.cp-dt-foot{flex:none;display:flex;align-items:center;gap:12px;margin-top:16px;font-size:18px;line-height:1.4;color:var(--theme-faint);}
`;

export function DataTable(props) {
  useThemeStyle('campus-data-table-style', CSS);
  const p = { ...DEFAULTS, ...props };
  const rows = safeArray(p.rows).slice(0, clamp(p.rowCount, 3, 8));
  return (
    <CampusFrame chapterIndex={p.chapterIndex}>
      <TitleRow no={p.sectionNo} title={p.title} className="campus-rise" style={enterDelay(0)} />
      <div className="cp-dt campus-card campus-rise" style={enterDelay(1)}>
        <div className="cp-dt-row cp-dt-head">
          <div className="cp-dt-th is-no">{p.headNo}</div>
          <div className="cp-dt-th">{p.headMain}</div>
          <div className="cp-dt-th">{p.headNote}</div>
        </div>
        <div className="cp-dt-body">
          {rows.map((row, i) => (
            <div className="cp-dt-row campus-fade" style={enterDelay(2 + i)} key={i}>
              <div className="cp-dt-no"><div className="cp-dt-no-badge campus-num">{row?.no}</div></div>
              <div className="cp-dt-main">{row?.main}</div>
              <div className="cp-dt-note">{row?.note}</div>
            </div>
          ))}
        </div>
      </div>
      {p.showFootnote && <div className="cp-dt-foot campus-fade" style={enterDelay(4)}><div className="campus-mark is-spark" aria-hidden="true" /><p>{p.footnote}</p></div>}
    </CampusFrame>
  );
}

DataTable.META = {
  id: 'data-table',
  label: '表格 · 实底表头斑马行',
  roles: ['breakdown', 'metrics'],
  defaults: DEFAULTS,
  copyBudgets: { 'rows[].main': 64, 'rows[].note': 40, footnote: 48 },
  controls: [
    { ...CHAPTER_CONTROL, default: 4 },
    { key: 'rowCount', type: 'number', label: '表格行数', default: 8, min: 3, max: 8, description: '表格显示的数据行数。' },
    { key: 'showFootnote', type: 'toggle', label: '表注', default: true, description: '表格下方的一行注释。' },
  ],
};
