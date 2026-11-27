// 致谢(内容页):两种形态可切换——
//   letter  一段致谢词:大引号 + 标题 + 成段文字 + 右下落款(署名、日期),可在左侧配一张合影;
//   columns 分栏致谢:2–4 栏(谢师恩 / 谢同窗 / 谢家人 / 谢自己),每栏一枚图标圆章 + 小标题 + 一小段话,可在上方配一张合影横幅。
// 底部可选一句收尾。注意这是正文里的致谢内容页,不是结语 / 封底页。
import React from 'react';
import { useThemeStyle, enterDelay } from '../../../shared/style.jsx';
import { MediaSlot } from '../../../shared/MediaSlot.jsx';
import { safeArray, clamp } from '../../../chart-safety.mjs';
import { CampusFrame, TitleRow, ConclusionBar, CHAPTER_CONTROL } from '../kit/chrome.jsx';
import { QuoteGlyph } from '../kit/structure.jsx';
import { useNarrativeStyle, EmText, NarrIcon } from '../kit/narrative.jsx';

const DEFAULTS = {
  chapterIndex: 5,
  mode: 'letter',
  showPhoto: true,
  thanksCount: 3,
  showClosing: true,
  images: [],
  sectionNo: '',
  title: '致谢',
  heading: '谨以此致谢',
  letter: '四年求学，终有所成。衷心感谢我的导师，从选题、案例选择、资料搜集、开题报告，到论文结构、模型构建与最终定稿，**每一步都离不开老师的悉心指导**。感谢室友、同班同学与同门师兄师姐在生活和学习中的照顾与帮助；感谢家人一直以来的理解与支持。也感谢一直不曾放弃的自己，愿今后继续保持乐观、积极向上的心态。',
  signature: '答辩人　示例同学',
  date: '2026 年 5 月',
  photoCaption: '课题组合影（示例）',
  thanks: [
    { title: '谢师恩', body: '感谢导师从选题、资料搜集、开题报告到论文结构、模型构建与定稿的**全程指导**。' },
    { title: '谢同窗', body: '感谢室友、同班同学与同门师兄师姐在生活和学习中的照顾和帮助。' },
    { title: '谢家人', body: '感谢家人多年来的理解、陪伴与支持，让我能安心完成学业。' },
    { title: '谢自己', body: '感谢一直不曾放弃的自己，愿保持乐观、积极向上的心态继续前行。' },
  ],
  closing: '衷心感谢各位老师在百忙之中参加答辩，恳请批评指正！',
};

const COLUMN_ICONS = ['cap', 'people', 'home', 'heart'];

const CSS = `
/* —— 致谢词形态 —— */
.cp-g1-ak-letter{flex:1;min-height:0;display:grid;grid-template-columns:minmax(0,.82fr) minmax(0,1.18fr);gap:40px;}
.cp-g1-ak-letter.no-photo{grid-template-columns:minmax(0,1fr);justify-items:center;}
.cp-g1-ak-fig{position:relative;min-width:0;min-height:0;display:flex;flex-direction:column;margin:0;}
.cp-g1-ak-photo{flex:1;min-height:0;}
.cp-g1-ak-tape{position:absolute;z-index:3;top:-10px;width:96px;height:26px;border-radius:3px;background:rgb(var(--theme-accent-rgb) / .14);pointer-events:none;}
.cp-g1-ak-tape.is-l{left:-14px;transform:rotate(-30deg);}
.cp-g1-ak-tape.is-r{right:-14px;transform:rotate(30deg);}
.cp-g1-ak-cap{flex:none;display:flex;align-items:center;justify-content:center;gap:12px;margin-top:18px;font-size:20px;line-height:1.4;letter-spacing:.06em;color:var(--theme-muted);}
.cp-g1-ak-card{position:relative;isolation:isolate;min-width:0;min-height:0;width:100%;display:flex;flex-direction:column;justify-content:center;padding:54px 70px 48px 74px;overflow:hidden;}
.cp-g1-ak-letter.no-photo .cp-g1-ak-card{max-width:1360px;padding:56px 110px 50px 120px;}
.cp-g1-ak-ribbon{position:absolute;top:0;right:64px;width:62px;height:118px;display:flex;align-items:flex-start;justify-content:center;padding-top:22px;color:var(--theme-on-accent);}
.cp-g1-ak-ribbon-shape{position:absolute;z-index:-1;inset:0;background:var(--campus-fill-bar);clip-path:polygon(0 0,100% 0,100% 100%,50% calc(100% - 18px),0 100%);}
.cp-g1-ak-side{position:absolute;left:0;top:44px;bottom:44px;width:8px;border-radius:0 4px 4px 0;background:var(--campus-fill-bar);}
.cp-g1-ak-quote{display:block;color:rgb(var(--theme-accent-rgb) / .2);}
.cp-g1-ak-heading{margin-top:16px;font-family:var(--theme-font-serif);font-weight:700;font-size:40px;line-height:1.3;letter-spacing:.1em;color:var(--theme-ink);}
.cp-g1-ak-rule{display:flex;align-items:center;gap:10px;margin:18px 0 22px;}
.cp-g1-ak-rule-bar{width:56px;height:4px;border-radius:2px;background:var(--campus-fill);}
.cp-g1-ak-rule-dot{width:8px;height:8px;border-radius:1px;background:var(--campus-spark);transform:rotate(45deg);}
.cp-g1-ak-body{font-size:25px;line-height:1.95;color:var(--theme-ink);text-align:justify;text-indent:2em;text-wrap:pretty;}
.cp-g1-ak-sign{align-self:flex-end;display:flex;flex-direction:column;align-items:flex-end;gap:6px;margin-top:28px;}
.cp-g1-ak-sign-line{width:220px;height:1.5px;margin-bottom:8px;background:linear-gradient(90deg,rgb(var(--theme-accent-rgb) / 0) 0%,rgb(var(--theme-accent-rgb) / .5) 100%);}
.cp-g1-ak-name{font-family:var(--theme-font-serif);font-weight:700;font-size:26px;line-height:1.3;letter-spacing:.08em;color:var(--theme-ink);}
.cp-g1-ak-date{font-size:20px;line-height:1.3;letter-spacing:.06em;color:var(--theme-faint);}
.cp-g1-ak-heart{position:absolute;z-index:-1;right:-40px;bottom:-60px;color:rgb(var(--theme-accent-rgb) / .05);pointer-events:none;}

/* —— 分栏致谢形态 —— */
.cp-g1-ak-cols{flex:1;min-height:0;display:flex;flex-direction:column;gap:26px;}
.cp-g1-ak-banner{position:relative;flex:0 0 38%;min-height:0;}
.cp-g1-ak-banner-cap{position:absolute;z-index:2;left:30px;bottom:28px;display:flex;align-items:center;gap:10px;height:40px;padding:0 18px 0 14px;border-radius:999px;background:var(--campus-fill);color:var(--theme-on-accent);font-size:19px;font-weight:700;letter-spacing:.06em;box-shadow:var(--campus-shadow-lift);}
.cp-g1-ak-grid{flex:1;min-height:0;display:grid;grid-auto-flow:column;grid-auto-columns:minmax(0,1fr);gap:28px;padding-top:34px;}
.cp-g1-ak-col{position:relative;min-width:0;min-height:0;display:flex;flex-direction:column;align-items:center;padding:58px 34px 28px;text-align:center;}
.cp-g1-ak-badge{position:absolute;top:-36px;left:50%;width:76px;height:76px;margin-left:-38px;display:grid;place-items:center;color:var(--theme-on-accent);}
.cp-g1-ak-badge-shape{position:absolute;inset:0;border-radius:50%;background:var(--campus-fill);box-shadow:0 0 0 7px var(--theme-surface),0 10px 22px rgb(var(--theme-accent-rgb) / .3);}
.cp-g1-ak-badge > svg{position:relative;}
.cp-g1-ak-col-title{font-family:var(--theme-font-serif);font-weight:700;font-size:33px;line-height:1.3;letter-spacing:.14em;color:var(--theme-ink);}
.cp-g1-ak-col .cp-g1-ak-rule{justify-content:center;margin:14px 0 16px;}
.cp-g1-ak-col-body{font-size:23px;line-height:1.8;color:var(--theme-muted);text-wrap:pretty;}
.cp-g1-ak-cols.no-photo .cp-g1-ak-grid{padding-top:44px;}
.cp-g1-ak-cols.no-photo .cp-g1-ak-col{justify-content:center;padding-top:84px;padding-bottom:84px;}
.cp-g1-ak-cols.no-photo .cp-g1-ak-grid.is-2 .cp-g1-ak-col-body{font-size:27px;}
.cp-g1-ak-cols.no-photo .cp-g1-ak-col-body{font-size:25px;line-height:1.9;}
.cp-g1-ak-cols.no-photo .cp-g1-ak-badge{top:-44px;width:92px;height:92px;margin-left:-46px;}
.cp-g1-ak-col{isolation:isolate;overflow:visible;}
.cp-g1-ak-col-water{position:absolute;z-index:-1;left:50%;bottom:18px;margin-left:-90px;color:rgb(var(--theme-accent-rgb) / .05);pointer-events:none;}
.cp-g1-ak-cols.no-photo .cp-g1-ak-col-title{font-size:36px;}
.cp-g1-ak-grid.is-4 .cp-g1-ak-col{padding-left:24px;padding-right:24px;}
.cp-g1-ak-grid.is-4 .cp-g1-ak-col-body{font-size:22px;}
.cp-g1-ak-cols .campus-conclusion{margin-top:0;}
/* 无合影时各栏共用同一组行(subgrid):标题、分隔线、正文在同一条水平线上,正文多一行少一行都从同一位置往下排;
   整组按最长那栏在栏里纵向居中(上下留白写在首尾两行上,不再每栏各自居中、标题高低不齐)。 */
.cp-g1-ak-cols.no-photo .cp-g1-ak-grid{grid-template-rows:minmax(84px,1fr) auto auto auto minmax(84px,1fr);row-gap:0;}
.cp-g1-ak-cols.no-photo .cp-g1-ak-col{display:grid;grid-template-rows:subgrid;grid-row:1 / -1;justify-items:center;align-items:start;align-content:stretch;padding-top:0;padding-bottom:0;}
.cp-g1-ak-cols.no-photo .cp-g1-ak-col-title{grid-row:2;}
.cp-g1-ak-cols.no-photo .cp-g1-ak-col > .cp-g1-ak-rule{grid-row:3;}
.cp-g1-ak-cols.no-photo .cp-g1-ak-col-body{grid-row:4;}
`;

export function Acknowledgement(props) {
  useNarrativeStyle();
  useThemeStyle('campus-acknowledgement-style', CSS);
  const p = { ...DEFAULTS, ...props };
  const columns = p.mode === 'columns';
  const thanks = safeArray(p.thanks).slice(0, clamp(p.thanksCount, 2, 4));
  const photo = Boolean(p.showPhoto);

  if (!columns) {
    return (
      <CampusFrame chapterIndex={p.chapterIndex}>
        <TitleRow no={p.sectionNo} title={p.title} className="campus-rise" style={enterDelay(0)} />
        <div className={`cp-g1-ak-letter${photo ? '' : ' no-photo'}`}>
          {photo && (
            <figure className="cp-g1-ak-fig campus-rise" style={enterDelay(1)}>
              <div className="cp-g1-ak-photo campus-photo">
                <div className="cp-g1-ak-tape is-l" aria-hidden="true" />
                <div className="cp-g1-ak-tape is-r" aria-hidden="true" />
                <MediaSlot id="acknowledgement-photo" fit="cover" radius={10} placeholder="合影" />
              </div>
              <figcaption className="cp-g1-ak-cap">
                <div className="campus-mark is-spark" aria-hidden="true" />
                <div>{p.photoCaption}</div>
              </figcaption>
            </figure>
          )}
          <section className="cp-g1-ak-card campus-card campus-rise" style={enterDelay(2)}>
            <div className="cp-g1-ak-side" aria-hidden="true" />
            <div className="cp-g1-ak-ribbon" aria-hidden="true">
              <div className="cp-g1-ak-ribbon-shape" />
              <NarrIcon name="heart" size={28} stroke={2} />
            </div>
            <NarrIcon name="heart" size={300} stroke={1} className="cp-g1-ak-heart" />
            <QuoteGlyph size={70} className="cp-g1-ak-quote" />
            <h3 className="cp-g1-ak-heading">{p.heading}</h3>
            <div className="cp-g1-ak-rule" aria-hidden="true"><div className="cp-g1-ak-rule-bar" /><div className="cp-g1-ak-rule-dot" /></div>
            <EmText className="cp-g1-ak-body" text={p.letter} />
            <div className="cp-g1-ak-sign">
              <div className="cp-g1-ak-sign-line" aria-hidden="true" />
              <div className="cp-g1-ak-name">{p.signature}</div>
              <div className="cp-g1-ak-date">{p.date}</div>
            </div>
          </section>
        </div>
      </CampusFrame>
    );
  }

  return (
    <CampusFrame chapterIndex={p.chapterIndex}>
      <TitleRow no={p.sectionNo} title={p.title} className="campus-rise" style={enterDelay(0)} />
      <div className={`cp-g1-ak-cols${photo ? '' : ' no-photo'}`}>
        {photo && (
          <div className="cp-g1-ak-banner campus-photo campus-rise" style={enterDelay(1)}>
            <MediaSlot id="acknowledgement-photo" fit="cover" radius={10} placeholder="合影" />
            <div className="cp-g1-ak-banner-cap">
              <NarrIcon name="heart" size={20} stroke={2.2} />
              <div>{p.photoCaption}</div>
            </div>
          </div>
        )}
        <div className={`cp-g1-ak-grid is-${thanks.length}`}>
          {thanks.map((item, i) => (
            <section className="cp-g1-ak-col campus-card campus-rise" style={enterDelay(2 + i)} key={i}>
              <div className="cp-g1-ak-badge" aria-hidden="true">
                <div className="cp-g1-ak-badge-shape" />
                <NarrIcon name={COLUMN_ICONS[i % COLUMN_ICONS.length]} size={photo ? 36 : 42} stroke={1.9} />
              </div>
              {!photo && <NarrIcon name={COLUMN_ICONS[i % COLUMN_ICONS.length]} size={180} stroke={1} className="cp-g1-ak-col-water" />}
              <h3 className="cp-g1-ak-col-title">{item?.title}</h3>
              <div className="cp-g1-ak-rule" aria-hidden="true"><div className="cp-g1-ak-rule-bar" /><div className="cp-g1-ak-rule-dot" /></div>
              <EmText className="cp-g1-ak-col-body" text={item?.body} />
            </section>
          ))}
        </div>
        {p.showClosing && <ConclusionBar text={p.closing} className="campus-rise" style={enterDelay(7)} />}
      </div>
    </CampusFrame>
  );
}

Acknowledgement.META = {
  id: 'acknowledgement',
  label: '致谢 · 致谢词或分栏致谢',
  roles: ['team', 'statement'],
  defaults: DEFAULTS,
  copyBudgets: {
    heading: 10,
    letter: 220,
    signature: 14,
    date: 12,
    photoCaption: 16,
    'thanks[].title': 5,
    'thanks[].body': 48,
    closing: 36,
  },
  controls: [
    { ...CHAPTER_CONTROL, default: 5 },
    { key: 'mode', type: 'radio', label: '致谢形态', default: 'letter', options: [{ value: 'letter', label: '一段致谢词' }, { value: 'columns', label: '分栏致谢' }], description: '一段致谢词(大引号 + 成段文字 + 落款),或分栏致谢(谢师恩 / 谢同窗 / 谢家人…各一小段)。' },
    { key: 'showPhoto', type: 'toggle', label: '合影照片', default: true, description: '致谢词形态放在左侧,分栏形态放在上方横幅。' },
    { key: 'thanksCount', type: 'number', label: '致谢栏数', default: 3, min: 2, max: 4, description: '分栏致谢的栏数(只在「分栏致谢」形态生效)。' },
    { key: 'showClosing', type: 'toggle', label: '底部收尾句', default: true, description: '分栏致谢下方的一句收尾(只在「分栏致谢」形态生效;致谢词形态以落款收尾)。' },
  ],
};
