// 总结页:左侧一张「研究结论」大卡(渐变编号块),右侧上下两块「研究不足」(浅校色面板)与「未来展望」(渐变卡头白卡)。
// 适合结论与展望、总结与反思。
import React from 'react';
import { useThemeStyle, enterDelay } from '../../../shared/style.jsx';
import { safeArray, clamp } from '../../../chart-safety.mjs';
import { CampusFrame, TitleRow, CHAPTER_CONTROL } from '../kit/chrome.jsx';

const DEFAULTS = {
  chapterIndex: 4,
  conclusionCount: 3,
  limitCount: 3,
  outlookCount: 3,
  sectionNo: '4.1',
  title: '结论与展望',
  conclusionsLabel: '研究结论',
  conclusions: [
    { no: '01', title: '数据驱动的生产模型', desc: '从数据评估到流程反馈、再回流创作，构成一套可复制的内容工业化生产模型。' },
    { no: '02', title: '生态化的矩阵策略', desc: '四象限账号矩阵让头部创作者在平台不确定性中实现多方面的持续增长。' },
    { no: '03', title: '以信任为基础的变现', desc: '以内容与观众建立深度信任，再发展品牌电商，是稳固且高价值的变现道路。' },
    { no: '04', title: '第四条结论', desc: '在这里写第四条研究结论。' },
  ],
  limitsLabel: '研究不足',
  limits: [
    { text: '以单一个案为主，结论推广到其他类型创作者时需要谨慎。' },
    { text: '主要依赖公开的二手资料，难以获取平台后台的完整数据。' },
    { text: '观察时段集中在近七年，平台规则变化对结论的影响有待追踪。' },
  ],
  outlookLabel: '未来展望',
  outlooks: [
    { text: '扩展到多个不同体量的创作者，开展比较研究。' },
    { text: '结合访谈与问卷，补充一手数据检验研究假设。' },
    { text: '跟踪平台规则与 AI 工具的变化，检验机制的长期适用性。' },
  ],
};

const CSS = `
.cp-so{flex:1;min-height:0;display:flex;gap:30px;}
.cp-so-main{flex:1.25 1 0;min-width:0;display:flex;flex-direction:column;}
.cp-so-list{flex:1;min-height:0;display:grid;grid-auto-rows:minmax(0,1fr);padding:6px 34px 10px;}
.cp-so-item{display:flex;align-items:center;gap:30px;border-bottom:1px dashed var(--campus-accent-line);}
.cp-so-item:last-child{border-bottom:0;}
.cp-so-no{flex:none;display:grid;place-items:center;width:78px;height:78px;border-radius:22px;background:var(--campus-fill);color:var(--theme-on-accent);box-shadow:0 10px 22px rgb(var(--theme-accent-rgb) / .26);font-size:38px;}
.cp-so-item-body{flex:1;min-width:0;}
.cp-so-item-title{font-family:var(--theme-font-serif);font-weight:700;font-size:30px;line-height:1.3;letter-spacing:.04em;color:var(--theme-ink);}
.cp-so-item-desc{margin-top:8px;font-size:22px;line-height:1.62;color:var(--theme-muted);text-wrap:pretty;}
.cp-so-list.is-4 .cp-so-no{width:66px;height:66px;font-size:32px;border-radius:18px;}
.cp-so-list.is-4 .cp-so-item-title{font-size:27px;}
.cp-so-list.is-4 .cp-so-item-desc{font-size:21px;line-height:1.5;margin-top:4px;}
.cp-so-side{flex:1 1 0;min-width:0;display:flex;flex-direction:column;gap:24px;}
.cp-so-box{position:relative;flex:1 1 0;min-height:0;display:flex;flex-direction:column;padding:24px 32px 26px;border-radius:var(--campus-radius);}
/* 条目按行等分内容区、每条在自己那一行里垂直居中:条目少时不在下半截留空;两块的高度按条目数分配(行内 flex-grow) */
.cp-so-box-items{flex:1;min-height:0;display:grid;grid-auto-rows:minmax(0,1fr);align-items:center;row-gap:10px;margin-top:18px;}
.cp-so-box-item{display:flex;align-items:baseline;gap:16px;}
.cp-so-box-item .campus-mark{transform:translateY(-3px) rotate(45deg);}
.cp-so-box-text{font-size:24px;line-height:1.62;text-wrap:pretty;}
.cp-so-box.is-limit{background:var(--campus-wash);padding-left:44px;}
.cp-so-box-bar{position:absolute;left:16px;top:24px;bottom:24px;width:6px;border-radius:3px;background:var(--campus-accent-line);}
.cp-so-box.is-limit .cp-so-box-text{color:var(--theme-ink);}
.cp-so-box.is-limit .campus-mark{background:var(--campus-accent-line);}
/* 未来展望:白卡 + 渐变卡头,和左侧结论卡同一语言,避免右下出现大面积实色 */
.cp-so-box.is-outlook{padding:0;}
.cp-so-box.is-outlook .cp-so-box-items{margin:0;padding:16px 32px 18px;}
.cp-so-box.is-outlook .cp-so-box-text{color:var(--theme-ink);}
`;

export function SummaryOutlook(props) {
  useThemeStyle('campus-summary-outlook-style', CSS);
  const p = { ...DEFAULTS, ...props };
  const conclusions = safeArray(p.conclusions).slice(0, clamp(p.conclusionCount, 2, 4));
  const limits = safeArray(p.limits).slice(0, clamp(p.limitCount, 1, 3));
  const outlooks = safeArray(p.outlooks).slice(0, clamp(p.outlookCount, 1, 3));
  return (
    <CampusFrame chapterIndex={p.chapterIndex}>
      <TitleRow no={p.sectionNo} title={p.title} className="campus-rise" style={enterDelay(0)} />
      <div className="cp-so">
        <section className="cp-so-main campus-card campus-rise" style={enterDelay(1)}>
          <div className="campus-card-head">{p.conclusionsLabel}</div>
          <div className={`cp-so-list is-${conclusions.length}`}>
            {conclusions.map((item, i) => (
              <div className="cp-so-item" key={i}>
                <div className="cp-so-no campus-num">{item?.no}</div>
                <div className="cp-so-item-body">
                  <h3 className="cp-so-item-title">{item?.title}</h3>
                  <p className="cp-so-item-desc">{item?.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
        <div className="cp-so-side">
          <section className="cp-so-box is-limit campus-rise" style={{ ...enterDelay(2), flexGrow: limits.length + 1.5 }}>
            <div className="cp-so-box-bar" aria-hidden="true" />
            <div><div className="campus-chip is-soft" style={{ display: 'inline-flex' }}>{p.limitsLabel}</div></div>
            <div className="cp-so-box-items">
              {limits.map((item, i) => (
                <div className="cp-so-box-item" key={i}>
                  <div className="campus-mark" />
                  <p className="cp-so-box-text">{item?.text}</p>
                </div>
              ))}
            </div>
          </section>
          <section className="cp-so-box is-outlook campus-card campus-rise" style={{ ...enterDelay(3), flexGrow: outlooks.length + 1.5 }}>
            <div className="campus-card-head">{p.outlookLabel}</div>
            <div className="cp-so-box-items">
              {outlooks.map((item, i) => (
                <div className="cp-so-box-item" key={i}>
                  <div className="campus-mark is-spark" />
                  <p className="cp-so-box-text">{item?.text}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </CampusFrame>
  );
}

SummaryOutlook.META = {
  id: 'summary-outlook',
  label: '总结展望 · 结论配不足与展望',
  roles: ['result', 'actions', 'observation'],
  defaults: DEFAULTS,
  copyBudgets: { 'conclusions[].title': 12, 'conclusions[].desc': 44, 'limits[].text': 30, 'outlooks[].text': 30 },
  controls: [
    { ...CHAPTER_CONTROL, default: 4 },
    { key: 'conclusionCount', type: 'number', label: '结论条数', default: 3, min: 2, max: 4, description: '左侧研究结论的条数。' },
    { key: 'limitCount', type: 'number', label: '不足条数', default: 3, min: 1, max: 3, description: '右上「研究不足」的条数。' },
    { key: 'outlookCount', type: 'number', label: '展望条数', default: 3, min: 1, max: 3, description: '右下「未来展望」的条数。' },
  ],
};
