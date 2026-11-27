// 文献 / 期刊信息卡:左侧竖版论文首页或期刊封面(媒体槽,A4 竖版比例,后面叠两张纸作装饰),
// 右侧字段化信息卡(标题 + 期刊 / 年份 / 单位 / 收录等级等字段,字段名小字、值大字)+ 收录标签 + 一句「为什么读这篇」。
// 变体:2–5 张封面横排成墙,每张带题名和出处。适合文献汇报首页、已发表论文、成果展示。
import React from 'react';
import { useThemeStyle, enterDelay } from '../../../shared/style.jsx';
import { MediaSlot } from '../../../shared/MediaSlot.jsx';
import { safeArray, clamp } from '../../../chart-safety.mjs';
import { CampusFrame, TitleRow, ConclusionBar, CHAPTER_CONTROL, TITLE_ROW_SPACE, CONCLUSION_SPACE, useCampusLayout } from '../kit/chrome.jsx';
import { useStructureStyle, QuoteGlyph } from '../kit/structure.jsx';

const DEFAULTS = {
  chapterIndex: 2,
  cardMode: 'single',
  fieldCount: 6,
  coverCount: 4,
  showTags: true,
  showInsight: true,
  images: [],
  sectionNo: '2.4',
  title: '精读文献',
  kicker: '文献信息',
  paperTitle: '城市峡谷环境下惯性辅助的 GNSS 弱信号长相干跟踪方法',
  fields: [
    { label: '期刊 / 会议', value: '示例导航学报' },
    { label: '发表年份', value: '2022 年第 4 期' },
    { label: '作者单位', value: '示例大学 导航研究所' },
    { label: '收录等级', value: 'EI · 中文核心' },
    { label: '研究对象', value: '弱信号载波跟踪环路' },
    { label: '数据来源', value: '城市实测 + 软件仿真' },
  ],
  tags: ['EI 收录', '中文核心', '示例文献'],
  insightLabel: '为什么读这篇',
  insight: '它给出了惯性辅助长相干积分的完整实现，正好对应本研究“灵敏度”这条主线，可直接作为对比基线。',
  covers: [
    { title: '惯性辅助长相干跟踪方法', source: '示例导航学报 · 2022' },
    { title: '深组合接收机抗差估计', source: '示例测绘学报 · 2021' },
    { title: '多通道联合载波跟踪环路', source: '示例电子学报 · 2020' },
    { title: '城市环境组合导航综述', source: '示例导航年会 · 2023' },
    { title: '第五篇文献题名', source: '期刊名 · 年份' },
  ],
  conclusionLabel: '阅读重点',
  conclusion: '四篇文献分别对应灵敏度、抗差与平台架构三条主线，是开题综述的核心来源。',
};

const CSS = `
.cp-pc{flex:1;min-height:0;display:flex;gap:56px;}
/* 竖版封面:后面错开叠两张纸,前面是白框里的媒体槽 */
.cp-pc-cover{position:relative;flex:none;align-self:center;}
.cp-pc-sheet{position:absolute;inset:0;border-radius:var(--campus-radius);background:var(--theme-surface);border:1px solid var(--campus-card-edge);box-shadow:var(--campus-shadow);}
.cp-pc-sheet.is-1{transform:translate(18px,14px);background:var(--campus-paper);}
.cp-pc-sheet.is-2{transform:translate(34px,28px);background:var(--campus-accent-wash);}
.cp-pc-photo{position:absolute;inset:0;}
.cp-pc-ribbon{position:absolute;z-index:0;top:26px;right:-30px;width:30px;height:84px;background:var(--campus-fill-bar);clip-path:polygon(0 0,100% 0,100% 100%,50% 82%,0 100%);box-shadow:var(--campus-shadow-lift);}
.cp-pc-info{flex:1;min-width:0;display:flex;flex-direction:column;justify-content:center;}
.cp-pc-title{margin-top:18px;font-family:var(--theme-font-serif);font-weight:700;font-size:38px;line-height:1.3;letter-spacing:.03em;color:var(--theme-ink);text-wrap:balance;}
.cp-pc-rule{flex:none;display:flex;align-items:center;gap:6px;margin:22px 0 6px;}
.cp-pc-rule-thick{width:90px;height:5px;border-radius:3px;background:var(--campus-fill);}
.cp-pc-rule-thin{flex:1;height:1.5px;background:var(--campus-fade-line);}
.cp-pc-fields{flex:0 1 auto;min-height:0;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));grid-auto-rows:minmax(0,auto);gap:16px 20px;align-content:center;padding:14px 0 4px;}
.cp-pc-field{position:relative;min-height:96px;display:flex;flex-direction:column;justify-content:center;gap:6px;padding:12px 22px 12px 28px;border-radius:14px;background:var(--theme-surface);border:1px solid var(--campus-card-edge);box-shadow:0 8px 20px rgb(var(--theme-accent-rgb) / .06);}
.cp-pc-field-bar{position:absolute;left:0;top:16px;bottom:16px;width:5px;border-radius:0 3px 3px 0;background:var(--campus-fill-bar);}
.cp-pc-field-label{font-size:18px;line-height:1.3;font-weight:600;letter-spacing:.12em;color:var(--theme-faint);}
.cp-pc-field-value{font-size:25px;line-height:1.35;font-weight:700;color:var(--theme-ink);text-wrap:balance;}
.cp-pc-tags{flex:none;display:flex;flex-wrap:wrap;gap:12px;margin-top:18px;}
.cp-pc-tag{display:flex;align-items:center;height:38px;padding:0 18px;border-radius:999px;background:var(--campus-accent-tint);color:var(--theme-accent);font-size:19px;font-weight:700;letter-spacing:.06em;}
.cp-pc-tag:first-child{background:var(--campus-fill);color:var(--theme-on-accent);box-shadow:0 6px 14px rgb(var(--theme-accent-rgb) / .22);}
.cp-pc-insight{position:relative;flex:none;display:flex;gap:20px;margin-top:22px;padding:20px 26px 20px 22px;border-radius:var(--campus-radius);background:var(--campus-wash);}
.cp-pc-insight-glyph{flex:none;color:rgb(var(--theme-accent-rgb) / .35);}
.cp-pc-insight-label{font-family:var(--theme-font-serif);font-weight:700;font-size:22px;line-height:1.2;letter-spacing:.1em;color:var(--theme-accent);}
.cp-pc-insight-text{margin-top:8px;font-size:22px;line-height:1.6;color:var(--theme-ink);text-wrap:pretty;}
/* 封面墙 */
.cp-pc-wall{flex:1;min-height:0;display:flex;justify-content:center;align-items:flex-start;}
.cp-pc-item{flex:none;display:flex;flex-direction:column;margin:0;}
.cp-pc-item-frame{position:relative;flex:none;}
.cp-pc-item-cap{margin-top:18px;display:flex;flex-direction:column;gap:6px;}
.cp-pc-item-title{font-family:var(--theme-font-serif);font-weight:700;font-size:24px;line-height:1.3;color:var(--theme-ink);text-wrap:balance;}
.cp-pc-item-source{display:flex;align-items:center;gap:10px;font-size:19px;line-height:1.3;color:var(--theme-muted);}
.cp-pc-item-source .campus-mark{width:9px;height:9px;}
`;

const RATIO = 0.72;   // 竖版封面宽高比(接近 A4)

export function PaperCard(props) {
  useStructureStyle();
  useThemeStyle('campus-paper-card-style', CSS);
  const p = { ...DEFAULTS, ...props };
  const { bodyW, bodyH } = useCampusLayout();
  const wall = p.cardMode === 'wall';
  const fields = safeArray(p.fields).slice(0, clamp(p.fieldCount, 2, 6));
  const tags = safeArray(p.tags).slice(0, 4);
  const covers = safeArray(p.covers).slice(0, clamp(p.coverCount, 2, 5));
  const H = bodyH - TITLE_ROW_SPACE - (wall && p.showInsight ? CONCLUSION_SPACE : 0);
  if (wall) {
    // 封面墙:按张数等分宽度,高度不超过绘图区(留出题名);超高时按高度反推宽度,整排居中
    const gap = 36;
    const capH = 108;
    const n = Math.max(1, covers.length);
    const wByWidth = (bodyW - (n - 1) * gap) / n;
    const h = Math.min(wByWidth / RATIO, H - capH - 10);
    const w = Math.round(h * RATIO);
    return (
      <CampusFrame chapterIndex={p.chapterIndex}>
        <TitleRow no={p.sectionNo} title={p.title} className="campus-rise" style={enterDelay(0)} />
        <div className="cp-pc-wall" style={{ gap }}>
          {covers.map((cover, i) => (
            <figure className="cp-pc-item campus-rise" style={{ width: w, ...enterDelay(1 + i) }} key={i}>
              <div className="cp-pc-item-frame campus-photo" style={{ width: w, height: Math.round(h) }}>
                <MediaSlot id={`paper-card-${i}`} fit="cover" radius={8} placeholder="论文首页" />
              </div>
              <figcaption className="cp-pc-item-cap">
                <div className="cp-pc-item-title">{cover?.title}</div>
                <div className="cp-pc-item-source"><div className="campus-mark" aria-hidden="true" /><div>{cover?.source}</div></div>
              </figcaption>
            </figure>
          ))}
        </div>
        {p.showInsight && <ConclusionBar label={p.conclusionLabel} text={p.conclusion} className="campus-rise" style={enterDelay(8)} />}
      </CampusFrame>
    );
  }
  // 单篇:封面高度取满绘图区(留出叠纸的错位),宽度按竖版比例
  const coverH = Math.round(H - 64);
  const coverW = Math.round(Math.min(coverH * RATIO, bodyW * 0.38));
  return (
    <CampusFrame chapterIndex={p.chapterIndex}>
      <TitleRow no={p.sectionNo} title={p.title} className="campus-rise" style={enterDelay(0)} />
      <div className="cp-pc">
        <div className="cp-pc-cover campus-rise" style={{ width: coverW, height: Math.round(coverW / RATIO), marginRight: 34, ...enterDelay(1) }}>
          <div className="cp-pc-sheet is-2" aria-hidden="true" />
          <div className="cp-pc-sheet is-1" aria-hidden="true" />
          <div className="cp-pc-photo campus-photo">
            <MediaSlot id="paper-card-0" fit="cover" radius={8} placeholder="论文首页" />
          </div>
          <div className="cp-pc-ribbon" aria-hidden="true" />
        </div>
        <section className="cp-pc-info">
          <div className="campus-label-row campus-rise" style={enterDelay(2)}><div className="campus-chip">{p.kicker}</div></div>
          <h3 className="cp-pc-title campus-rise" style={enterDelay(2)}>{p.paperTitle}</h3>
          <div className="cp-pc-rule campus-draw" style={enterDelay(3)} aria-hidden="true"><div className="cp-pc-rule-thick" /><div className="cp-pc-rule-thin" /></div>
          <div className="cp-pc-fields">
            {fields.map((field, i) => (
              <div className="cp-pc-field campus-rise" style={enterDelay(3 + i)} key={i}>
                <div className="cp-pc-field-bar" aria-hidden="true" />
                <div className="cp-pc-field-label">{field?.label}</div>
                <div className="cp-pc-field-value">{field?.value}</div>
              </div>
            ))}
          </div>
          {p.showTags && (
            <div className="cp-pc-tags campus-rise" style={enterDelay(8)}>
              {tags.map((tag, i) => <div className="cp-pc-tag" key={i}>{tag}</div>)}
            </div>
          )}
          {p.showInsight && (
            <div className="cp-pc-insight campus-rise" style={enterDelay(9)}>
              <QuoteGlyph size={44} className="cp-pc-insight-glyph" />
              <div>
                <div className="cp-pc-insight-label">{p.insightLabel}</div>
                <p className="cp-pc-insight-text">{p.insight}</p>
              </div>
            </div>
          )}
        </section>
      </div>
    </CampusFrame>
  );
}

PaperCard.META = {
  id: 'paper-card',
  label: '文献信息卡 · 竖版首页配字段信息',
  roles: ['case', 'context', 'result'],
  defaults: DEFAULTS,
  copyBudgets: {
    kicker: 6,
    paperTitle: 40,
    'fields[].label': 6,
    'fields[].value': 14,
    'tags[]': 6,
    insightLabel: 7,
    insight: 52,
    'covers[].title': 14,
    'covers[].source': 14,
    conclusionLabel: 4,
    conclusion: 44,
  },
  controls: [
    { ...CHAPTER_CONTROL, default: 2 },
    { key: 'cardMode', type: 'radio', label: '版式', default: 'single', options: [{ value: 'single', label: '单篇信息卡' }, { value: 'wall', label: '多张封面横排' }], description: '单篇:左侧论文首页 + 右侧字段信息;多张:2–5 张论文首页 / 期刊封面横排成墙。' },
    { key: 'fieldCount', type: 'number', label: '字段数量', default: 6, min: 2, max: 6, description: '单篇信息卡里的字段数(期刊、年份、单位、收录等级等),两列排布。' },
    { key: 'coverCount', type: 'number', label: '封面数量', default: 4, min: 2, max: 5, countArrays: ['covers'], mediaSlots: [{ field: 'images', countKey: null, maxCount: 5 }], description: '多张封面横排时的张数(每张的题名和出处取 covers 对应项,图片取 images 对应项);单篇信息卡只用第 1 张图。' },
    { key: 'showTags', type: 'toggle', label: '收录标签', default: true, description: '单篇信息卡里字段下方的一排标签(收录等级、类型等),最多 4 枚。' },
    { key: 'showInsight', type: 'toggle', label: '阅读要点', default: true, description: '单篇时是底部「为什么读这篇」;多张时是页面底部的结论条。' },
  ],
};
