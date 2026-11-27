// 参考文献:一张「装订好的文稿纸」——左缘渐变装订条 + 右上折角,里面是 6–16 条编号文献列表。
// 条目少(≤ 8)时单栏,多时自动分成左右两栏(先排满左栏);字号随条数分档(最小 18px),长条目可以折两行。
// 编号 [1]…[N] 按顺序自动生成;条目里的文献类型标 [J] / [M] / [D] / [C] 等自动加粗着色,写在条目文字里即可。
// 适合参考文献、主要参考资料、文献清单。
import React from 'react';
import { useThemeStyle, enterDelay } from '../../../shared/style.jsx';
import { safeArray, clamp } from '../../../chart-safety.mjs';
import { CampusFrame, TitleRow, CHAPTER_CONTROL } from '../kit/chrome.jsx';
import { useNarrativeStyle, NarrIcon } from '../kit/narrative.jsx';

const DEFAULTS = {
  chapterIndex: 4,
  refCount: 10,
  showLegend: true,
  showNote: true,
  sectionNo: '',
  title: '参考文献',
  legend: '[J] 期刊　[M] 专著　[D] 学位论文　[C] 会议　[S] 标准　[R] 报告',
  note: '著录格式参照 GB/T 7714—2015（示例条目，非真实文献）',
  refs: [
    '作者甲, 作者乙. 管理会计工具在制造企业中的应用研究[J]. 示例会计研究, 2021, 38(4): 45-52.',
    '作者丙. 作业成本法原理与实务[M]. 北京: 示例出版社, 2019: 23-41.',
    '作者丁. 价值链视角下企业成本管理优化研究[D]. 示例市: 示例大学, 2020.',
    'Author A, Author B. Activity-based costing and management accounting practice[J]. Example Journal of Accounting, 2018, 12(3): 101-118.',
    '作者戊. 战略成本管理在零售企业中的应用[J]. 示例财会通讯, 2022(6): 88-93.',
    '作者己, 作者庚. 业财融合背景下管理会计人才培养路径[J]. 示例教育与职业, 2021(15): 66-70.',
    '示例研究机构. 管理会计应用指引汇编[S]. 北京: 示例出版社, 2018.',
    'Author C. Strategic cost analysis in competitive markets[M]. Example City: Example Press, 2017.',
    '作者辛. 多维度盈利能力分析模型构建[J]. 示例财务与会计, 2020(11): 30-34.',
    '作者壬. 共享经济下企业管理会计信息化建设[C]//示例学术年会论文集. 示例市, 2021: 112-118.',
    '作者癸. 平衡计分卡在企业绩效管理中的应用[J]. 示例管理世界, 2019, 35(2): 77-84.',
    'Author D, Author E. Value chain analysis for management accountants[J]. Example Management Review, 2020, 45(1): 23-39.',
    '作者子. 成本管理信息系统设计与实现[D]. 示例市: 示例理工大学, 2019.',
    '作者丑. 预算管理与企业战略目标分解研究[J]. 示例会计之友, 2022(9): 41-47.',
    '示例统计机构. 会计行业人才发展报告[R]. 示例市, 2021.',
    '作者寅. 电子发票与财务数字化转型[EB/OL]. (2022-03-15)[2023-04-01]. 示例网站在线文章.',
  ],
};

// 文献类型标:GB/T 7714 的常用标识(可带 /OL)
const TYPE_MARK = /(\[(?:J|M|D|C|N|R|S|P|A|G|Z|DB|CP|EB)(?:\/OL)?\])/;

const CSS = `
/* —— 文稿纸:白卡 + 左缘装订条(带装订孔)+ 右上折角 —— */
.cp-g1-rl-sheet{position:relative;isolation:isolate;flex:1;min-height:0;display:flex;flex-direction:column;padding:26px 56px 24px 92px;}
.cp-g1-rl-bind{position:absolute;left:0;top:0;bottom:0;width:46px;border-radius:var(--campus-radius) 0 0 var(--campus-radius);background:var(--campus-fill-bar);}
.cp-g1-rl-holes{position:absolute;left:0;top:0;bottom:0;width:46px;display:flex;flex-direction:column;justify-content:space-evenly;align-items:center;padding:40px 0;}
.cp-g1-rl-hole{width:14px;height:14px;border-radius:50%;background:var(--theme-bg);border:2px solid rgb(0 0 0 / .18);}
.cp-g1-rl-fold{position:absolute;right:0;top:0;width:58px;height:58px;border-radius:0 var(--campus-radius) 0 0;background:linear-gradient(225deg,var(--theme-bg) 0%,var(--theme-bg) 49%,rgb(var(--theme-accent-rgb) / .2) 50%,rgb(var(--theme-accent-rgb) / .06) 100%);}
.cp-g1-rl-water{position:absolute;z-index:-1;right:40px;bottom:30px;color:rgb(var(--theme-accent-rgb) / .04);pointer-events:none;}
/* 纸头:书本图标 + 类型图例;纸脚:著录说明 */
.cp-g1-rl-head{flex:none;display:flex;align-items:center;gap:14px;padding:0 60px 16px 0;margin-bottom:14px;border-bottom:2px solid var(--campus-accent-tint);}
.cp-g1-rl-icon{flex:none;width:44px;height:44px;display:grid;place-items:center;border-radius:12px;background:var(--campus-accent-tint);color:var(--theme-accent);}
.cp-g1-rl-legend{min-width:0;font-size:19px;line-height:1.4;letter-spacing:.04em;color:var(--theme-muted);white-space:pre-wrap;}
.cp-g1-rl-note{flex:none;display:flex;align-items:center;gap:10px;margin-top:12px;padding-top:12px;border-top:1.5px dashed var(--theme-line);font-size:18px;line-height:1.4;color:var(--theme-faint);}
/* —— 条目:单栏或双栏(先排满左栏);编号是自动生成的渐变小方签 —— */
.cp-g1-rl-list{flex:1;min-height:0;display:grid;grid-template-columns:repeat(var(--cp-g1-rl-cols),minmax(0,1fr));grid-template-rows:repeat(var(--cp-g1-rl-rows),auto);grid-auto-flow:column;align-content:space-evenly;column-gap:52px;row-gap:var(--cp-g1-rl-gap);}
.cp-g1-rl-list.is-two{background-image:linear-gradient(90deg,transparent calc(50% - 1px),var(--campus-accent-tint) calc(50% - 1px),var(--campus-accent-tint) calc(50% + 1px),transparent calc(50% + 1px));}
.cp-g1-rl-item{min-width:0;display:grid;grid-template-columns:var(--cp-g1-rl-tag) minmax(0,1fr);column-gap:14px;align-items:start;}
.cp-g1-rl-no{display:flex;align-items:center;justify-content:center;height:calc(var(--cp-g1-rl-size) * 1.5);border-radius:7px;background:var(--campus-fill);color:var(--theme-on-accent);font-family:var(--theme-font-serif);font-weight:700;font-size:calc(var(--cp-g1-rl-size) * .9);line-height:1;font-variant-numeric:lining-nums tabular-nums;white-space:nowrap;}
.cp-g1-rl-text{font-size:var(--cp-g1-rl-size);line-height:1.5;color:var(--theme-ink);overflow-wrap:anywhere;text-wrap:pretty;}
.cp-g1-rl-type{font-weight:700;color:var(--theme-accent);}
`;

/** 字号档位:条目越多字越小,最小 18px;8 条以内单栏。 */
function tier(n) {
  if (n <= 6) return { size: 24, gap: 22, cols: 1 };
  if (n <= 8) return { size: 22, gap: 16, cols: 1 };
  if (n <= 10) return { size: 21, gap: 18, cols: 2 };
  if (n <= 12) return { size: 20, gap: 14, cols: 2 };
  if (n <= 14) return { size: 19, gap: 10, cols: 2 };
  return { size: 18, gap: 8, cols: 2 };
}

function RefText({ text }) {
  const parts = String(text ?? '').split(TYPE_MARK);
  return (
    <p className="cp-g1-rl-text">
      {parts.map((part, i) => (i % 2 === 1
        ? <span className="cp-g1-rl-type" key={i}>{part}</span>
        : <React.Fragment key={i}>{part}</React.Fragment>))}
    </p>
  );
}

export function ReferencesList(props) {
  useNarrativeStyle();
  useThemeStyle('campus-references-list-style', CSS);
  const p = { ...DEFAULTS, ...props };
  const refs = safeArray(p.refs).slice(0, clamp(p.refCount, 6, 16));
  const n = refs.length;
  const t = tier(n);
  const rows = Math.ceil(n / t.cols);
  const vars = {
    '--cp-g1-rl-cols': t.cols,
    '--cp-g1-rl-rows': rows,
    '--cp-g1-rl-size': `${t.size}px`,
    '--cp-g1-rl-gap': `${t.gap}px`,
    '--cp-g1-rl-tag': n >= 10 ? `${Math.round(t.size * 2.3)}px` : `${Math.round(t.size * 1.9)}px`,
  };
  return (
    <CampusFrame chapterIndex={p.chapterIndex}>
      <TitleRow no={p.sectionNo} title={p.title} className="campus-rise" style={enterDelay(0)} />
      <section className="cp-g1-rl-sheet campus-card campus-rise" style={{ ...vars, ...enterDelay(1) }}>
        <div className="cp-g1-rl-bind" aria-hidden="true" />
        <div className="cp-g1-rl-holes" aria-hidden="true">
          {[0, 1, 2, 3].map(i => <div className="cp-g1-rl-hole" key={i} />)}
        </div>
        <div className="cp-g1-rl-fold" aria-hidden="true" />
        <NarrIcon name="book" size={300} stroke={1} className="cp-g1-rl-water" />
        {p.showLegend && (
          <div className="cp-g1-rl-head">
            <div className="cp-g1-rl-icon" aria-hidden="true"><NarrIcon name="book" size={26} stroke={2} /></div>
            <div className="cp-g1-rl-legend">{p.legend}</div>
          </div>
        )}
        <div className={`cp-g1-rl-list${t.cols > 1 ? ' is-two' : ''}`}>
          {refs.map((ref, i) => (
            <div className="cp-g1-rl-item campus-fade" style={enterDelay(2 + Math.min(i, 10))} key={i}>
              <div className="cp-g1-rl-no" data-editable-skip="true">{`[${i + 1}]`}</div>
              <RefText text={ref} />
            </div>
          ))}
        </div>
        {p.showNote && (
          <div className="cp-g1-rl-note">
            <div className="campus-mark" aria-hidden="true" />
            <div>{p.note}</div>
          </div>
        )}
      </section>
    </CampusFrame>
  );
}

ReferencesList.META = {
  id: 'references-list',
  label: '参考文献 · 装订文稿纸编号列表',
  roles: ['context', 'breakdown'],
  defaults: DEFAULTS,
  copyBudgets: { title: 10, legend: 40, note: 36, 'refs[]': 120 },
  controls: [
    { ...CHAPTER_CONTROL, default: 4 },
    { key: 'refCount', type: 'number', label: '文献条数', default: 10, min: 6, max: 16, description: '列出的文献条数:8 条以内单栏,更多时自动分左右两栏;条数越多字号越小(最小 18px)。编号 [1]…[N] 自动生成,条目里的 [J] [M] [D] [C] 等类型标自动着色。' },
    { key: 'showLegend', type: 'toggle', label: '类型图例', default: true, description: '纸头的一行文献类型图例(如「[J] 期刊 [M] 专著」)。' },
    { key: 'showNote', type: 'toggle', label: '著录说明', default: true, description: '纸脚的一行说明(如著录格式)。' },
  ],
};
