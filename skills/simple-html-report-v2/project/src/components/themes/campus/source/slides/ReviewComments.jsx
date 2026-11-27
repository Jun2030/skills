// 评审 / 盲审意见页:上部 2–3 个评分格(评阅人 + 等级印章),中部 1–2 段评语引文(大引号、来源署名),
// 下部可选「评审意见 → 修改说明」两列对照表。适合硕博答辩的盲审意见、答辩后的修改说明。
import React from 'react';
import { useThemeStyle, enterDelay } from '../../../shared/style.jsx';
import { safeArray, clamp } from '../../../chart-safety.mjs';
import { CampusFrame, TitleRow, CHAPTER_CONTROL } from '../kit/chrome.jsx';
import { useStructureStyle, QuoteGlyph, ChainArrow } from '../kit/structure.jsx';

const DEFAULTS = {
  chapterIndex: 4,
  scoreCount: 3,
  quoteCount: 2,
  showRevisions: true,
  revisionCount: 3,
  sectionNo: '5.2',
  title: '盲审意见与修改说明',
  scores: [
    { label: '评阅人 1', grade: '优秀', note: '同意答辩' },
    { label: '评阅人 2', grade: '良好', note: '同意答辩' },
    { label: '评阅人 3', grade: '良好', note: '修改后答辩' },
  ],
  quotes: [
    { source: '评阅人 1', text: '论文针对城市复杂环境下北斗 / INS 深组合的弱信号跟踪与观测异常问题开展研究，选题有明确的工程意义。作者搭建了软件接收机与深组合仿真平台，提出的频率稳定度传递与权函数抗差两种方法思路清晰、推导完整，实验设计较合理，结论可信，表明作者具备扎实的理论基础和独立科研能力。' },
    { source: '评阅人 2', text: '论文工作量饱满，软件平台搭建与数据处理较扎实，写作规范、条理清楚。不足之处在于实测场景偏少，部分结论主要依赖仿真数据；建议补充高楼峡谷、树荫道等典型城市场景的实测结果，并对比不同积分时间下的跟踪性能，进一步说明方法的适用范围。' },
  ],
  headNo: '序号',
  headOpinion: '评审意见',
  headAction: '修改说明',
  revisions: [
    { no: '1', opinion: '实测场景偏少，典型城市场景覆盖不足', action: '补充树荫道、高架两类典型场景的实测与对比分析' },
    { no: '2', opinion: '不同积分时间下的跟踪性能对比不够充分', action: '增加 20 / 60 / 120 ms 三种积分时间的对比实验' },
    { no: '3', opinion: '研究现状部分的归纳不够系统', action: '按灵敏度、抗差两条主线重写文献综述' },
    { no: '4', opinion: '在这里写第四条评审意见', action: '在这里写对应的修改说明' },
  ],
};

const CSS = `
.cp-rc{flex:1;min-height:0;display:flex;flex-direction:column;justify-content:center;gap:22px;}
.cp-rc.is-roomy .cp-rc-quote-text{font-size:26px;line-height:1.75;}
.cp-rc.is-roomy .cp-rc-quote{padding:30px 44px 26px 46px;}
/* 评分格:左侧评阅人与结论,右侧渐变圆形「等级印章」(虚线外环) */
.cp-rc-scores{flex:none;display:grid;grid-auto-flow:column;grid-auto-columns:minmax(0,1fr);column-gap:26px;}
.cp-rc-score{display:flex;align-items:center;justify-content:space-between;gap:20px;min-height:124px;padding:18px 26px 18px 30px;}
.cp-rc-score-cap{position:absolute;top:0;left:30px;width:60px;height:6px;border-radius:0 0 4px 4px;background:var(--campus-fill);}
.cp-rc-score-label{font-family:var(--theme-font-serif);font-weight:700;font-size:26px;line-height:1.25;letter-spacing:.06em;color:var(--theme-ink);}
.cp-rc-score-note{margin-top:8px;display:flex;align-items:center;gap:10px;font-size:20px;line-height:1.3;color:var(--theme-muted);}
.cp-rc-seal{position:relative;flex:none;width:96px;height:96px;display:grid;place-items:center;}
.cp-rc-seal-ring{position:absolute;inset:-7px;border-radius:50%;border:1.5px dashed var(--campus-accent-line);}
.cp-rc-seal-disc{position:absolute;inset:0;border-radius:50%;background:var(--campus-fill);box-shadow:0 10px 22px rgb(var(--theme-accent-rgb) / .3);}
.cp-rc-seal-spark{position:absolute;top:8px;left:50%;width:22px;height:3px;margin-left:-11px;border-radius:2px;background:var(--campus-spark);}
.cp-rc-grade{position:relative;font-family:var(--theme-font-serif);font-weight:700;font-size:30px;line-height:1;letter-spacing:.06em;color:var(--theme-on-accent);white-space:nowrap;}
/* 评语引文 */
.cp-rc-quotes{flex:1 1 auto;min-height:0;max-height:var(--cp-rc-qmax,none);display:grid;grid-auto-flow:column;grid-auto-columns:minmax(0,1fr);column-gap:26px;}
.cp-rc-quote{min-height:0;display:flex;flex-direction:column;padding:22px 32px 18px 34px;}
.cp-rc-quote-glyph{flex:none;color:rgb(var(--theme-accent-rgb) / .22);}
.cp-rc-quote-bar{position:absolute;left:0;top:26px;bottom:26px;width:6px;border-radius:0 4px 4px 0;background:var(--campus-fill-bar);}
.cp-rc-quote-text{flex:1;min-height:0;margin-top:10px;font-family:var(--theme-font-serif);font-size:23px;line-height:1.72;color:var(--theme-ink);text-wrap:pretty;}
.cp-rc-quote-source{flex:none;align-self:flex-end;display:flex;align-items:center;gap:12px;margin-top:10px;font-size:19px;font-weight:700;letter-spacing:.08em;color:var(--theme-accent);}
.cp-rc-quote-dash{width:36px;height:2px;border-radius:1px;background:var(--campus-accent-line);}
/* 意见 → 修改 对照表 */
.cp-rc-rev{flex:none;}
.cp-rc-rev .campus-xt-head{min-height:52px;}
.cp-rc-rev .campus-xt-td{padding-top:11px;padding-bottom:11px;font-size:21px;line-height:1.45;}
.cp-rc-rev-no{justify-content:center;padding:0;}
.cp-rc-rev-no .campus-seal{min-width:36px;height:36px;font-size:19px;}
.cp-rc-rev-arrow{justify-content:center;padding:0;color:var(--theme-accent);}
.cp-rc-rev .campus-xt-td + .cp-rc-rev-arrow,.cp-rc-rev .cp-rc-rev-arrow + .campus-xt-td{border-left:0;}
.cp-rc-rev-opinion{color:var(--theme-muted);}
.cp-rc-rev-action{font-weight:700;}
.cp-rc.is-tight .cp-rc-quote-text{font-size:22px;line-height:1.62;margin-top:6px;}
.cp-rc.is-tight .cp-rc-score{min-height:110px;}
`;

export function ReviewComments(props) {
  useStructureStyle();
  useThemeStyle('campus-review-comments-style', CSS);
  const p = { ...DEFAULTS, ...props };
  const scores = safeArray(p.scores).slice(0, clamp(p.scoreCount, 2, 3));
  const quotes = safeArray(p.quotes).slice(0, clamp(p.quoteCount, 1, 2));
  const revisions = safeArray(p.revisions).slice(0, clamp(p.revisionCount, 2, 4));
  const tight = p.showRevisions && revisions.length >= 4;
  // 没有对照表时评语区很高:字号放大一档,并给评语区封顶高度,整组纵向居中
  const roomy = !p.showRevisions;
  return (
    <CampusFrame chapterIndex={p.chapterIndex}>
      <TitleRow no={p.sectionNo} title={p.title} className="campus-rise" style={enterDelay(0)} />
      <div className={`cp-rc${tight ? ' is-tight' : ''}${roomy ? ' is-roomy' : ''}`} style={roomy ? { '--cp-rc-qmax': '460px' } : undefined}>
        <div className="cp-rc-scores">
          {scores.map((score, i) => (
            <section className="cp-rc-score campus-card campus-rise" style={enterDelay(1 + i)} key={i}>
              <div className="cp-rc-score-cap" aria-hidden="true" />
              <div>
                <h3 className="cp-rc-score-label">{score?.label}</h3>
                <div className="cp-rc-score-note"><div className="campus-mark is-spark" aria-hidden="true" /><div>{score?.note}</div></div>
              </div>
              <div className="cp-rc-seal">
                <div className="cp-rc-seal-ring" aria-hidden="true" />
                <div className="cp-rc-seal-disc" aria-hidden="true" />
                <div className="cp-rc-seal-spark" aria-hidden="true" />
                <div className="cp-rc-grade">{score?.grade}</div>
              </div>
            </section>
          ))}
        </div>
        <div className="cp-rc-quotes">
          {quotes.map((quote, i) => (
            <blockquote className="cp-rc-quote campus-card campus-rise" style={{ margin: 0, ...enterDelay(4 + i) }} key={i}>
              <div className="cp-rc-quote-bar" aria-hidden="true" />
              <QuoteGlyph size={42} className="cp-rc-quote-glyph" />
              <p className="cp-rc-quote-text">{quote?.text}</p>
              <div className="cp-rc-quote-source"><div className="cp-rc-quote-dash" aria-hidden="true" /><div>{quote?.source}</div></div>
            </blockquote>
          ))}
        </div>
        {p.showRevisions && (
          <div className="cp-rc-rev campus-xt campus-card campus-rise" style={{ '--cp-xt-cols': '92px minmax(0,1fr) 64px minmax(0,1.1fr)', ...enterDelay(7) }}>
            <div className="campus-xt-head">
              <div className="campus-xt-th is-center"><div>{p.headNo}</div></div>
              <div className="campus-xt-th"><div>{p.headOpinion}</div></div>
              <div className="campus-xt-th is-center" aria-hidden="true"><ChainArrow size={22} /></div>
              <div className="campus-xt-th"><div className="campus-xt-mark" aria-hidden="true" /><div>{p.headAction}</div></div>
            </div>
            <div className="campus-xt-body">
              {revisions.map((rev, i) => (
                <div className={`campus-xt-row campus-fade${i % 2 ? ' is-zebra' : ''}`} style={enterDelay(8 + i)} key={i}>
                  <div className="campus-xt-td cp-rc-rev-no"><div className="campus-seal is-soft">{rev?.no}</div></div>
                  <div className="campus-xt-td cp-rc-rev-opinion"><div>{rev?.opinion}</div></div>
                  <div className="campus-xt-td cp-rc-rev-arrow" aria-hidden="true"><ChainArrow size={24} /></div>
                  <div className="campus-xt-td cp-rc-rev-action"><div>{rev?.action}</div></div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </CampusFrame>
  );
}

ReviewComments.META = {
  id: 'review-comments',
  label: '评审意见 · 评分印章配评语与修改对照',
  roles: ['result', 'observation', 'risks'],
  defaults: DEFAULTS,
  copyBudgets: {
    'scores[].label': 8,
    'scores[].grade': 2,
    'scores[].note': 10,
    'quotes[].text': 160,
    'quotes[].source': 10,
    headNo: 3,
    headOpinion: 8,
    headAction: 8,
    'revisions[].no': 3,
    'revisions[].opinion': 24,
    'revisions[].action': 26,
  },
  controls: [
    { ...CHAPTER_CONTROL, default: 4 },
    { key: 'scoreCount', type: 'number', label: '评分格数量', default: 3, min: 2, max: 3, description: '顶部评分格的数量(每位评阅人一格,等级写「优秀 / 良好」这类等级词)。' },
    { key: 'quoteCount', type: 'number', label: '评语段数', default: 2, min: 1, max: 2, description: '中部评语引文的段数;只有一段时通栏显示。' },
    { key: 'showRevisions', type: 'toggle', label: '修改对照表', default: true, description: '底部「评审意见 → 修改说明」两列对照表。' },
    { key: 'revisionCount', type: 'number', label: '对照条数', default: 3, min: 2, max: 4, description: '修改对照表的行数。' },
  ],
};
