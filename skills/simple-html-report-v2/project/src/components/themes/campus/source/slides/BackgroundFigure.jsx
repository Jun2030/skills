// 研究背景 · 成段文字配图:1–2 段成段文字(每段一个小标题,段内用 **词** 强调关键词)+ 一张配图(图号、图题、出处);
// 文字上方可选 1–3 个「数字开场」指标(数值 + 单位 + 一句话),压在一条渐变色带里。
// 图可放左侧或右侧;选「不放图」时两段文字左右并排。适合研究背景、选题背景、问题由来。
import React from 'react';
import { useThemeStyle, enterDelay } from '../../../shared/style.jsx';
import { MediaSlot } from '../../../shared/MediaSlot.jsx';
import { safeArray, clamp } from '../../../chart-safety.mjs';
import { CampusFrame, TitleRow, CHAPTER_CONTROL, textWidthEm } from '../kit/chrome.jsx';
import { useNarrativeStyle, EmText, NarrIcon, plainText } from '../kit/narrative.jsx';

const DEFAULTS = {
  chapterIndex: 1,
  paragraphCount: 2,
  showMetrics: true,
  metricCount: 3,
  imageSide: 'right',
  imageFit: 'cover',
  showSource: true,
  images: [],
  sectionNo: '1.1',
  title: '选题背景',
  metricsLabel: '数字开场',
  metrics: [
    { value: '85', unit: '% 以上', label: '西方发达国家财务人员从事管理会计工作' },
    { value: '1700', unit: '万', label: '我国财务会计人员规模，基础岗位严重饱和' },
    { value: '300', unit: '万', label: '我国管理会计人才缺口' },
  ],
  paragraphs: [
    { no: '01', title: '竞争环境倒逼管理升级', body: '全球竞争日益激烈，企业经营环境变化加快，单纯「事后算账」的财务会计已难以支撑决策。**管理会计**把解析过去、控制现在、筹划未来结合起来，直接参与计划编制、经营决策与过程控制，正成为企业改善经营管理、提升经济效益的关键工具。' },
    { no: '02', title: '人才结构与需求错位', body: '我国管理会计研究与应用起步较晚，财务人员多集中在核算岗位，**管理会计人才缺口约 300 万**。企业对能参与预测、决策与控制的复合型财会人才需求迫切，从业者普遍面临从核算型向管理型转型的挑战。' },
  ],
  figureNo: '图 1-1',
  caption: '企业财务人员从核算型向管理型转型（示意）',
  source: '资料来源：根据公开资料整理（示例）',
};

const CSS = `
/* —— 数字开场色带:渐变底 + 半透明标签 + 1–3 个指标(数值 + 单位 + 一句话) —— */
.cp-g1-bg-metrics{position:relative;isolation:isolate;flex:none;display:flex;align-items:stretch;min-height:118px;margin-bottom:24px;padding:14px 18px 14px 14px;border-radius:var(--campus-radius-lg);background:var(--campus-fill-deep);color:var(--theme-on-accent);box-shadow:var(--campus-shadow-lift);overflow:hidden;}
.cp-g1-bg-orb{position:absolute;z-index:-1;right:-70px;top:-120px;width:300px;height:300px;border-radius:50%;background:rgb(255 255 255 / .07);pointer-events:none;}
.cp-g1-bg-orb.is-b{right:180px;top:52px;width:150px;height:150px;background:rgb(255 255 255 / .05);}
.cp-g1-bg-mlabel{flex:none;align-self:center;display:flex;align-items:center;gap:10px;height:46px;margin-right:16px;padding:0 20px 0 16px;border-radius:999px;background:var(--campus-on-accent-glass);font-family:var(--theme-font-serif);font-weight:700;font-size:22px;letter-spacing:.12em;white-space:nowrap;}
.cp-g1-bg-mlabel-mark{flex:none;width:9px;height:9px;border-radius:2px;background:var(--campus-spark);transform:rotate(45deg);}
.cp-g1-bg-mgrid{flex:1;min-width:0;display:grid;grid-auto-flow:column;grid-auto-columns:minmax(0,1fr);}
.cp-g1-bg-metric{position:relative;min-width:0;display:flex;align-items:center;gap:20px;padding:0 26px;}
.cp-g1-bg-metric + .cp-g1-bg-metric::before{content:'';position:absolute;left:0;top:14px;bottom:14px;width:1px;background:var(--campus-on-accent-line);}
.cp-g1-bg-val{flex:none;display:flex;align-items:baseline;gap:6px;white-space:nowrap;}
.cp-g1-bg-num{font-family:var(--theme-font-serif);font-weight:700;font-size:60px;line-height:1;letter-spacing:-.01em;font-variant-numeric:lining-nums;}
.cp-g1-bg-unit{font-size:22px;font-weight:700;line-height:1;color:var(--campus-on-accent-muted);}
.cp-g1-bg-mtext{min-width:0;font-size:20px;line-height:1.45;color:var(--campus-on-accent-muted);text-wrap:pretty;}
.cp-g1-bg-metrics.is-1 .cp-g1-bg-mtext{font-size:23px;color:var(--theme-on-accent);}

/* —— 主体:文字栏 + 配图栏 —— */
.cp-g1-bg-main{flex:1;min-height:0;display:grid;grid-template-columns:minmax(0,1.08fr) minmax(0,.92fr);gap:36px;}
.cp-g1-bg-main.is-left{grid-template-columns:minmax(0,.92fr) minmax(0,1.08fr);}
.cp-g1-bg-main.is-left .cp-g1-bg-fig{order:-1;}
.cp-g1-bg-main.is-none{grid-template-columns:minmax(0,1fr);}

/* 文字栏:一张白卡;每段左侧是「编号块 + 渐隐竖线」的小轨道,右侧是小标题 + 正文 */
.cp-g1-bg-text{position:relative;isolation:isolate;min-height:0;display:flex;flex-direction:column;justify-content:center;padding:34px 44px 34px 34px;overflow:hidden;}
.cp-g1-bg-para{position:relative;min-height:0;display:grid;grid-template-columns:44px minmax(0,1fr);column-gap:20px;}
.cp-g1-bg-para + .cp-g1-bg-para{margin-top:30px;}
.cp-g1-bg-rail{display:flex;flex-direction:column;align-items:center;gap:10px;}
.cp-g1-bg-rail .campus-seal{min-width:44px;height:44px;padding:0 8px;font-size:22px;}
.cp-g1-bg-line{flex:1;width:3px;min-height:20px;border-radius:2px;background:linear-gradient(180deg,rgb(var(--theme-accent-rgb) / .45) 0%,rgb(var(--theme-accent-rgb) / 0) 100%);}
.cp-g1-bg-ptitle{display:flex;align-items:center;gap:16px;min-height:44px;font-family:var(--theme-font-serif);font-weight:700;font-size:29px;line-height:1.25;letter-spacing:.04em;color:var(--theme-ink);}
.cp-g1-bg-ptitle::after{content:'';flex:1;min-width:24px;height:2px;border-radius:1px;background:var(--campus-fade-line);}
.cp-g1-bg-ptitle-text{flex:0 1 auto;min-width:0;}
.cp-g1-bg-body{margin-top:12px;font-size:23px;line-height:1.8;color:var(--theme-ink);text-align:justify;text-wrap:pretty;}
.cp-g1-bg-text.is-single .cp-g1-bg-body{font-size:27px;line-height:1.85;}
.cp-g1-bg-text.is-single .cp-g1-bg-ptitle{font-size:32px;}
.cp-g1-bg-text.is-airy .cp-g1-bg-body{font-size:25px;line-height:1.85;}
.cp-g1-bg-text.is-airy .cp-g1-bg-para + .cp-g1-bg-para{margin-top:40px;}
.cp-g1-bg-text.is-dense .cp-g1-bg-body{font-size:22px;line-height:1.7;}
.cp-g1-bg-text.is-dense .cp-g1-bg-para + .cp-g1-bg-para{margin-top:22px;}
.cp-g1-bg-water{position:absolute;z-index:-1;right:-26px;bottom:-34px;color:rgb(var(--theme-accent-rgb) / .06);pointer-events:none;}

/* 不放图:每段一行「渐变标题块 + 正文」,行高封顶后纵向居中 */
.cp-g1-bg-rows{min-height:0;display:flex;flex-direction:column;justify-content:center;gap:26px;}
.cp-g1-bg-row{flex:1 1 0;min-height:0;max-height:300px;display:grid;grid-template-columns:360px minmax(0,1fr);}
.cp-g1-bg-tag{position:relative;isolation:isolate;display:flex;flex-direction:column;justify-content:center;gap:14px;padding:26px 34px;border-radius:var(--campus-radius) 0 0 var(--campus-radius);background:var(--campus-fill-deep);color:var(--theme-on-accent);overflow:hidden;}
.cp-g1-bg-tag-orb{position:absolute;z-index:-1;right:-60px;bottom:-80px;width:220px;height:220px;border-radius:50%;border:30px solid rgb(255 255 255 / .07);pointer-events:none;}
.cp-g1-bg-tag-no{font-family:var(--theme-font-serif);font-weight:700;font-size:64px;line-height:1;color:var(--theme-on-accent);font-variant-numeric:lining-nums;}
.cp-g1-bg-tag-rule{width:44px;height:4px;border-radius:2px;background:var(--campus-spark);}
.cp-g1-bg-tag-title{font-family:var(--theme-font-serif);font-weight:700;font-size:31px;line-height:1.3;letter-spacing:.04em;text-wrap:balance;}
.cp-g1-bg-row .cp-g1-bg-body{align-self:center;margin:0;padding:28px 48px;font-size:26px;line-height:1.85;}
.cp-g1-bg-rows.is-dense .cp-g1-bg-row .cp-g1-bg-body{font-size:24px;line-height:1.75;}
.cp-g1-bg-rows.is-1 .cp-g1-bg-row{max-height:420px;}
.cp-g1-bg-rows.is-1 .cp-g1-bg-row .cp-g1-bg-body{font-size:29px;}
.campus[data-campus-nav="rail"] .cp-g1-bg-row{grid-template-columns:320px minmax(0,1fr);}

/* 配图栏:白底相框 + 图号胶囊 + 图题 + 出处 */
.cp-g1-bg-fig{min-width:0;min-height:0;display:flex;flex-direction:column;margin:0;}
.cp-g1-bg-photo{flex:1;min-height:0;}
.cp-g1-bg-cap{flex:none;display:flex;align-items:flex-start;gap:14px;margin-top:18px;}
.cp-g1-bg-cap .campus-seal{height:36px;min-width:0;padding:0 14px;font-size:19px;border-radius:999px;}
.cp-g1-bg-cap-text{min-width:0;}
.cp-g1-bg-cap-title{font-size:22px;line-height:1.4;font-weight:700;color:var(--theme-ink);}
.cp-g1-bg-src{margin-top:4px;font-size:18px;line-height:1.4;color:var(--theme-faint);}
`;

const META_SIDES = ['right', 'left', 'none'];

export function BackgroundFigure(props) {
  useNarrativeStyle();
  useThemeStyle('campus-background-figure-style', CSS);
  const p = { ...DEFAULTS, ...props };
  const paragraphs = safeArray(p.paragraphs).slice(0, clamp(p.paragraphCount, 1, 2));
  const metrics = safeArray(p.metrics).slice(0, clamp(p.metricCount, 1, 3));
  const side = META_SIDES.includes(p.imageSide) ? p.imageSide : 'right';
  const showImage = side !== 'none';
  const totalChars = paragraphs.reduce((sum, para) => sum + textWidthEm(plainText(para?.body)), 0);
  const dense = paragraphs.length > 1 && (totalChars > 250 || (p.showMetrics && totalChars > 200));
  const airy = paragraphs.length > 1 && !dense && totalChars < 190;
  const textClass = `cp-g1-bg-text campus-card${paragraphs.length === 1 ? ' is-single' : ''}${dense ? ' is-dense' : ''}${airy ? ' is-airy' : ''}`;

  const paraBlock = (para, i) => (
    <div className="cp-g1-bg-para" key={i}>
      <div className="cp-g1-bg-rail">
        <div className="campus-seal">{para?.no}</div>
        <div className="cp-g1-bg-line" aria-hidden="true" />
      </div>
      <div>
        <div className="cp-g1-bg-ptitle"><h3 className="cp-g1-bg-ptitle-text">{para?.title}</h3></div>
        <EmText className="cp-g1-bg-body" text={para?.body} />
      </div>
    </div>
  );

  return (
    <CampusFrame chapterIndex={p.chapterIndex}>
      <TitleRow no={p.sectionNo} title={p.title} className="campus-rise" style={enterDelay(0)} />
      {p.showMetrics && (
        <section className={`cp-g1-bg-metrics is-${metrics.length} campus-rise`} style={enterDelay(1)}>
          <div className="cp-g1-bg-orb" aria-hidden="true" />
          <div className="cp-g1-bg-orb is-b" aria-hidden="true" />
          <div className="cp-g1-bg-mlabel">
            <div className="cp-g1-bg-mlabel-mark" aria-hidden="true" />
            <div>{p.metricsLabel}</div>
          </div>
          <div className="cp-g1-bg-mgrid">
            {metrics.map((m, i) => (
              <div className="cp-g1-bg-metric" key={i}>
                <div className="cp-g1-bg-val">
                  <div className="cp-g1-bg-num">{m?.value}</div>
                  <div className="cp-g1-bg-unit">{m?.unit}</div>
                </div>
                <p className="cp-g1-bg-mtext">{m?.label}</p>
              </div>
            ))}
          </div>
        </section>
      )}
      <div className={`cp-g1-bg-main is-${side}`}>
        {showImage ? (
          <section className={`${textClass} campus-rise`} style={enterDelay(2)}>
            {paragraphs.length === 1 && <NarrIcon name="chart" size={260} stroke={1.4} className="cp-g1-bg-water" />}
            {paragraphs.map(paraBlock)}
          </section>
        ) : (
          <div className={`cp-g1-bg-rows is-${paragraphs.length}${dense ? ' is-dense' : ''}`}>
            {paragraphs.map((para, i) => (
              <section className="cp-g1-bg-row campus-card campus-rise" style={enterDelay(2 + i)} key={i}>
                <div className="cp-g1-bg-tag">
                  <div className="cp-g1-bg-tag-orb" aria-hidden="true" />
                  <div className="cp-g1-bg-tag-no">{para?.no}</div>
                  <div className="cp-g1-bg-tag-rule" aria-hidden="true" />
                  <h3 className="cp-g1-bg-tag-title">{para?.title}</h3>
                </div>
                <EmText className="cp-g1-bg-body" text={para?.body} />
              </section>
            ))}
          </div>
        )}
        {showImage && (
          <figure className="cp-g1-bg-fig campus-rise" style={enterDelay(3)}>
            <div className="cp-g1-bg-photo campus-photo">
              <MediaSlot id="background-figure-0" fit={p.imageFit === 'contain' ? 'contain' : 'cover'} radius={8} placeholder="背景配图" />
            </div>
            <figcaption className="cp-g1-bg-cap">
              <div className="campus-seal">{p.figureNo}</div>
              <div className="cp-g1-bg-cap-text">
                <div className="cp-g1-bg-cap-title">{p.caption}</div>
                {p.showSource && <div className="cp-g1-bg-src">{p.source}</div>}
              </div>
            </figcaption>
          </figure>
        )}
      </div>
    </CampusFrame>
  );
}

BackgroundFigure.META = {
  id: 'background-figure',
  label: '研究背景 · 成段文字配图',
  roles: ['context', 'image', 'metrics'],
  defaults: DEFAULTS,
  copyBudgets: {
    metricsLabel: 5,
    'metrics[].value': 6,
    'metrics[].unit': 4,
    'metrics[].label': 20,
    'paragraphs[].no': 3,
    'paragraphs[].title': 12,
    'paragraphs[].body': 160,
    figureNo: 6,
    caption: 24,
    source: 28,
  },
  controls: [
    { ...CHAPTER_CONTROL, default: 1 },
    { key: 'paragraphCount', type: 'number', label: '段落数', default: 2, min: 1, max: 2, description: '成段文字的段数(每段一个小标题 + 80–160 字正文;正文里用 **词** 标出要强调的关键词,显示为加粗校色字)。' },
    { key: 'showMetrics', type: 'toggle', label: '数字开场', default: true, description: '文字上方的渐变指标色带(数值 + 单位 + 一句话)。' },
    { key: 'metricCount', type: 'number', label: '开场指标数', default: 3, min: 1, max: 3, description: '数字开场色带里的指标个数。' },
    { key: 'imageSide', type: 'radio', label: '配图位置', default: 'right', options: [{ value: 'right', label: '右侧' }, { value: 'left', label: '左侧' }, { value: 'none', label: '不放图' }], description: '配图放在文字的哪一侧;不放图时两段文字左右并排。' },
    { key: 'imageFit', type: 'radio', label: '图片填充', default: 'cover', options: [{ value: 'cover', label: '铺满裁切' }, { value: 'contain', label: '完整显示' }], description: '照片用铺满裁切;统计图、示意图用完整显示(不裁切)。' },
    { key: 'showSource', type: 'toggle', label: '图片出处', default: true, description: '图题下方的一行资料来源。' },
  ],
};
