// 四象限矩阵:横纵两条校色渐变坐标轴把版面分成四格,每格一张象限卡(编号 + 名称 + 标签 + 说明),可用渐变色卡高亮其中一格。
// 适合账号矩阵、策略定位、二维分类这类「按两个维度切分」的内容。
import React from 'react';
import { useThemeStyle, enterDelay } from '../../../shared/style.jsx';
import { safeArray, safeNumber, clamp } from '../../../chart-safety.mjs';
import { CampusFrame, TitleRow, ConclusionBar, CHAPTER_CONTROL } from '../kit/chrome.jsx';

const DEFAULTS = {
  chapterIndex: 3,
  highlightIndex: 1,
  showExamples: true,
  showConclusion: true,
  sectionNo: '3.3',
  title: '四象限账号矩阵',
  xLabel: '内容专业度',
  xLow: '低',
  xHigh: '高',
  yLabel: '受众覆盖面',
  yLow: '圈层',
  yHigh: '大众',
  exampleLabel: '代表内容',
  quadrants: [
    { no: 'Ⅰ', name: '旗舰内容', tag: '主账号', desc: '高投入的科技与影像深度内容，追求破圈传播与专业口碑，单支作品制作周期长、标准高，是整个矩阵的流量与品牌核心。', example: '深度评测、影像短片' },
    { no: 'Ⅱ', name: '泛生活内容', tag: '生活向子账号', desc: '团队日常、幕后花絮与轻松话题，用低门槛的内容扩大受众面，让观众认识“做内容的人”，为主账号持续导流。', example: '团队日常、幕后花絮' },
    { no: 'Ⅲ', name: '社群互动', tag: '粉丝向账号', desc: '直播、问答与粉丝共创活动，服务最核心的粉丝群体，提升黏性与社群归属感，也是收集选题反馈的重要渠道。', example: '直播问答、粉丝共创' },
    { no: 'Ⅳ', name: '垂直知识', tag: '知识向子账号', desc: '器材、拍摄技巧与行业知识的垂直科普，服务有进阶需求的创作者用户，长期沉淀稳定的搜索流量。', example: '器材科普、技巧教程' },
  ],
  conclusionLabel: '矩阵逻辑',
  conclusion: '大众内容负责拉新，圈层内容负责留存，专业度保证口碑。（账号归类为示意）',
};

const CSS = `
.cp-qm{flex:1;min-height:0;display:grid;grid-template-columns:minmax(0,1fr) 104px minmax(0,1fr);grid-template-rows:46px minmax(0,1fr) 64px minmax(0,1fr);}
.cp-qm-ylabel{grid-column:1 / -1;grid-row:1;display:flex;justify-content:center;align-items:flex-start;}
.cp-qm-ylabel .campus-chip{height:36px;}
.cp-qm-vaxis{grid-column:2;grid-row:2 / -1;position:relative;}
.cp-qm-vline{position:absolute;left:50%;top:10px;bottom:0;width:4px;margin-left:-2px;border-radius:2px;background:var(--campus-fill-bar);}
.cp-qm-vhead{position:absolute;left:50%;top:0;margin-left:-11px;display:block;fill:var(--campus-accent-hi);}
.cp-qm-yend{position:absolute;left:50%;transform:translateX(-50%);padding:6px 0;background:var(--theme-bg);font-size:18px;line-height:1.2;font-weight:700;letter-spacing:.06em;color:var(--theme-accent);white-space:nowrap;}
.cp-qm-yend.is-high{top:24px;}
.cp-qm-yend.is-low{bottom:0;padding-bottom:0;color:var(--theme-faint);}
.cp-qm-haxis{grid-column:1 / -1;grid-row:3;position:relative;display:flex;align-items:center;justify-content:space-between;}
.cp-qm-hline{position:absolute;left:0;right:10px;top:50%;height:4px;margin-top:-2px;border-radius:2px;background:var(--campus-fill);}
.cp-qm-hhead{position:absolute;right:0;top:50%;margin-top:-11px;display:block;fill:var(--campus-accent-lo);}
.cp-qm-xend{position:relative;z-index:1;padding:0 12px;background:var(--theme-bg);font-size:18px;font-weight:700;letter-spacing:.06em;white-space:nowrap;}
.cp-qm-xend.is-low{color:var(--theme-faint);padding-left:0;}
.cp-qm-xend.is-high{display:flex;align-items:center;gap:12px;margin-right:30px;color:var(--theme-accent);}
.cp-qm-xend .campus-chip{height:36px;}
.cp-qm-center{position:absolute;left:50%;top:50%;width:18px;height:18px;margin:-9px 0 0 -9px;border-radius:50%;background:var(--campus-spark);box-shadow:0 0 0 6px var(--campus-spark-soft);}
.cp-qm-cell{position:relative;min-width:0;min-height:0;display:flex;flex-direction:column;padding:26px 32px 26px;}
.cp-qm-ghost{position:absolute;right:26px;bottom:6px;font-family:var(--theme-font-serif);font-weight:700;font-size:120px;line-height:1;color:rgb(var(--theme-accent-rgb) / .06);pointer-events:none;}
.cp-qm-hlbg{position:absolute;inset:0;z-index:-2;border-radius:inherit;background:var(--campus-fill-deep);box-shadow:var(--campus-shadow-lift);}
.cp-qm-cell.is-hl::before{display:none;}
.cp-qm-cell.is-hl{color:var(--theme-on-accent);}
.cp-qm-cell.is-hl .cp-qm-ghost{color:rgb(255 255 255 / .1);}
.cp-qm-head{display:flex;align-items:center;gap:18px;}
.cp-qm-no{flex:none;display:flex;align-items:center;justify-content:center;width:54px;height:54px;border-radius:50%;background:var(--campus-fill);box-shadow:0 6px 14px rgb(var(--theme-accent-rgb) / .28);font-family:var(--theme-font-serif);font-weight:700;font-size:26px;line-height:1;color:var(--theme-on-accent);}
.cp-qm-cell.is-hl .cp-qm-no{background:var(--theme-surface);color:var(--theme-accent);box-shadow:none;}
.cp-qm-name{flex:1;min-width:0;font-family:var(--theme-font-serif);font-weight:700;font-size:34px;line-height:1.2;letter-spacing:.06em;color:var(--theme-ink);}
.cp-qm-cell.is-hl .cp-qm-name{color:var(--theme-on-accent);}
.cp-qm-cell .campus-chip{flex:none;height:34px;font-size:18px;}
.cp-qm-cell.is-hl .campus-chip{background:var(--campus-on-accent-glass);color:var(--theme-on-accent);}
.cp-qm-desc{position:relative;margin-top:18px;padding-top:18px;border-top:1px dashed var(--campus-accent-line);font-size:23px;line-height:1.72;color:var(--theme-ink);text-wrap:pretty;}
.cp-qm-example{position:relative;display:flex;align-items:center;gap:16px;margin-top:18px;padding:10px 16px 10px 10px;border-radius:999px;}
.cp-qm-example .campus-chip{height:32px;font-size:17px;}
.cp-qm-example-text{font-size:21px;font-weight:700;letter-spacing:.04em;color:var(--theme-accent);}
.cp-qm-cell.is-hl .cp-qm-example{background:rgb(0 0 0 / .16);}
.cp-qm-cell.is-hl .cp-qm-example .campus-chip{background:var(--theme-on-accent);color:var(--theme-accent);}
.cp-qm-cell.is-hl .cp-qm-example-text{color:var(--theme-on-accent);}
.cp-qm-cell.is-hl .cp-qm-desc{border-top-color:var(--campus-on-accent-line);color:var(--theme-on-accent);}
`;

// 象限顺序按数学惯例:Ⅰ 右上、Ⅱ 左上、Ⅲ 左下、Ⅳ 右下。
const PLACE = [
  { gridColumn: 3, gridRow: 2 },
  { gridColumn: 1, gridRow: 2 },
  { gridColumn: 1, gridRow: 4 },
  { gridColumn: 3, gridRow: 4 },
];

export function QuadrantMatrix(props) {
  useThemeStyle('campus-quadrant-matrix-style', CSS);
  const p = { ...DEFAULTS, ...props };
  const quadrants = safeArray(p.quadrants).slice(0, 4);
  const highlight = clamp(Math.round(safeNumber(p.highlightIndex, 0)), 0, 4) - 1;
  return (
    <CampusFrame chapterIndex={p.chapterIndex}>
      <TitleRow no={p.sectionNo} title={p.title} className="campus-rise" style={enterDelay(0)} />
      <div className="cp-qm">
        <div className="cp-qm-ylabel campus-fade" style={enterDelay(1)}><div className="campus-chip">{p.yLabel}</div></div>
        <div className="cp-qm-vaxis campus-fade" style={enterDelay(1)}>
          <div className="cp-qm-vline" />
          <svg className="cp-qm-vhead" width="22" height="18" viewBox="0 0 22 18" aria-hidden="true"><polygon points="11,0 22,18 0,18" /></svg>
          <div className="cp-qm-yend is-high">{p.yHigh}</div>
          <div className="cp-qm-yend is-low">{p.yLow}</div>
        </div>
        <div className="cp-qm-haxis campus-fade" style={enterDelay(1)}>
          <div className="cp-qm-hline" />
          <div className="cp-qm-center" aria-hidden="true" />
          <svg className="cp-qm-hhead" width="18" height="22" viewBox="0 0 18 22" aria-hidden="true"><polygon points="18,11 0,0 0,22" /></svg>
          <div className="cp-qm-xend is-low">{p.xLow}</div>
          <div className="cp-qm-xend is-high">
            <div>{p.xHigh}</div>
            <div className="campus-chip">{p.xLabel}</div>
          </div>
        </div>
        {quadrants.map((q, i) => (
          <section className={`cp-qm-cell campus-card campus-rise${i === highlight ? ' is-hl' : ''}`} style={{ ...PLACE[i], ...enterDelay(2 + i) }} key={i}>
            {i === highlight && <div className="cp-qm-hlbg" aria-hidden="true" />}
            <div className="cp-qm-ghost" aria-hidden="true" data-editable-skip="true">{q?.no}</div>
            <div className="cp-qm-head">
              <div className="cp-qm-no">{q?.no}</div>
              <h3 className="cp-qm-name">{q?.name}</h3>
              <div className="campus-chip is-soft">{q?.tag}</div>
            </div>
            <p className="cp-qm-desc">{q?.desc}</p>
            {p.showExamples && (
              <div className="cp-qm-example campus-wash">
                <div className="campus-chip is-soft">{p.exampleLabel}</div>
                <div className="cp-qm-example-text">{q?.example}</div>
              </div>
            )}
          </section>
        ))}
      </div>
      {p.showConclusion && <ConclusionBar label={p.conclusionLabel} text={p.conclusion} className="campus-rise" style={enterDelay(7)} />}
    </CampusFrame>
  );
}

QuadrantMatrix.META = {
  id: 'quadrant-matrix',
  label: '四象限矩阵 · 双轴四格',
  roles: ['comparison', 'relationship', 'breakdown'],
  defaults: DEFAULTS,
  copyBudgets: { 'quadrants[].name': 6, 'quadrants[].tag': 7, 'quadrants[].desc': 60, 'quadrants[].example': 14, conclusion: 44 },
  controls: [
    { ...CHAPTER_CONTROL, default: 3 },
    { key: 'highlightIndex', type: 'number', label: '高亮象限', default: 1, min: 0, max: 4, description: '用渐变色卡高亮第几个象限(Ⅰ 右上、Ⅱ 左上、Ⅲ 左下、Ⅳ 右下);0 表示不高亮。' },
    { key: 'showExamples', type: 'toggle', label: '代表内容', default: true, description: '每个象限底部的一行「代表内容」。' },
    { key: 'showConclusion', type: 'toggle', label: '底部结论条', default: true, description: '页面底部的校色结论条。' },
  ],
};
