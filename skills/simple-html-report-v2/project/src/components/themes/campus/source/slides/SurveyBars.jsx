// 问卷结果:顶部样本说明(有效问卷 N 份、回收率…),下方 3–7 道题,每题右侧一条横向 100% 堆叠条
// (李克特 5 级,颜色从校色深到中性灰,条上标各选项百分比),行末是「认同率」(前两级之和);
// 也可切换为「每题一个百分比 + 单色条」。底部结论条。
// 堆叠条只是色块,题目、百分比、图例、样本数字都是 HTML 文本。
import React from 'react';
import { useThemeStyle, enterDelay } from '../../../shared/style.jsx';
import { safeArray, safeNumber, safeRatio, clamp } from '../../../chart-safety.mjs';
import { CampusFrame, TitleRow, ConclusionBar, CHAPTER_CONTROL } from '../kit/chrome.jsx';
import { LabelRow } from '../kit/parts.jsx';
import { useDataStyle, countOf, formatNumber } from '../kit/data.jsx';

const LEVEL_KEYS = ['p1', 'p2', 'p3', 'p4', 'p5'];

const DEFAULTS = {
  chapterIndex: 3,
  questionCount: 6,
  mode: 'stacked',
  showTop2: true,
  showSample: true,
  sampleCount: 4,
  showConclusion: true,
  sectionNo: '3.3',
  title: '问卷调查：企业管理会计应用现状',
  sampleLabel: '调查样本',
  samples: [
    { value: '126', label: '有效问卷（份）' },
    { value: '90.0%', label: '有效回收率' },
    { value: '42', label: '覆盖企业（家）' },
    { value: '2026.03', label: '调查时间' },
  ],
  chartLabel: '题项认同度',
  chartNote: '单位：% · 示例数据',
  levels: [
    { name: '非常同意' },
    { name: '比较同意' },
    { name: '一般' },
    { name: '不太同意' },
    { name: '非常不同意' },
  ],
  top2Label: '认同率',
  questions: [
    { text: '企业已建立全面预算管理制度', p1: 32, p2: 41, p3: 15, p4: 9, p5: 3, value: 73 },
    { text: '成本核算能细化到作业层面', p1: 18, p2: 34, p3: 26, p4: 15, p5: 7, value: 52 },
    { text: '管理会计信息能支持经营决策', p1: 27, p2: 43, p3: 18, p4: 9, p5: 3, value: 70 },
    { text: '财务人员具备管理会计技能', p1: 12, p2: 29, p3: 31, p4: 20, p5: 8, value: 41 },
    { text: '企业愿意投入管理会计信息化建设', p1: 35, p2: 38, p3: 17, p4: 7, p5: 3, value: 73 },
    { text: '管理会计报告被管理层定期使用', p1: 21, p2: 33, p3: 24, p4: 15, p5: 7, value: 54 },
    { text: '绩效考核与管理会计指标挂钩', p1: 16, p2: 30, p3: 28, p4: 18, p5: 8, value: 46 },
  ],
  conclusionLabel: '调查发现',
  conclusion: '企业普遍认可管理会计的价值，但人员技能与作业成本核算是最明显的短板。',
};

// 五级色:认同侧校色(深→浅),中立极浅灰,不认同侧中性灰(浅→深)
const LEVEL_FILLS = [
  'var(--campus-fill)',
  'rgb(var(--theme-accent-rgb) / .55)',
  'rgb(var(--campus-g3-ink-rgb) / .08)',
  'rgb(var(--campus-g3-ink-rgb) / .24)',
  'rgb(var(--campus-g3-ink-rgb) / .44)',
];

const CSS = `
.cp-g3-sv-sample{flex:none;display:flex;align-items:stretch;margin:-2px 0 20px;}
.cp-g3-sv-sample-tag{position:relative;isolation:isolate;flex:none;display:flex;align-items:center;gap:10px;padding:0 34px 0 24px;color:var(--theme-on-accent);font-size:21px;font-weight:700;letter-spacing:.1em;white-space:nowrap;}
.cp-g3-sv-sample-shape{position:absolute;inset:0;z-index:-1;border-radius:var(--campus-radius) 0 0 var(--campus-radius);background:var(--campus-fill-deep);clip-path:polygon(0 0,100% 0,calc(100% - 16px) 100%,0 100%);}
.cp-g3-sv-sample-tag .campus-note-mark{background:var(--campus-spark);}
.cp-g3-sv-sample-body{flex:1;min-width:0;display:grid;grid-auto-flow:column;grid-auto-columns:minmax(0,1fr);margin-left:-16px;padding:12px 10px 12px 34px;border-radius:0 var(--campus-radius) var(--campus-radius) 0;}
.cp-g3-sv-fact{display:flex;align-items:baseline;gap:12px;min-width:0;padding:0 20px;}
.cp-g3-sv-fact + .cp-g3-sv-fact{border-left:1px dashed var(--campus-accent-line);}
.cp-g3-sv-fact-value{flex:none;font-family:var(--theme-font-serif);font-weight:700;font-size:38px;line-height:1.1;color:var(--theme-accent);white-space:nowrap;font-variant-numeric:lining-nums;}
.cp-g3-sv-fact-label{min-width:0;font-size:19px;line-height:1.3;color:var(--theme-muted);}
.cp-g3-sv-card{flex:1;min-height:0;display:flex;flex-direction:column;padding:22px 30px 18px;}
.cp-g3-sv-top{flex:none;display:flex;align-items:center;gap:26px;margin-bottom:12px;}
.cp-g3-sv-top .campus-label-row{flex:1;min-width:0;}
.cp-g3-sv-legend{flex:none;display:flex;align-items:center;gap:6px 18px;flex-wrap:wrap;}
.cp-g3-sv-legend-item{display:flex;align-items:center;gap:8px;}
.cp-g3-sv-legend-sw{flex:none;width:20px;height:14px;border-radius:4px;}
.cp-g3-sv-legend-sw.is-light{box-shadow:inset 0 0 0 1px rgb(var(--campus-g3-ink-rgb) / .16);}
.cp-g3-sv-legend-name{font-size:19px;line-height:1.2;color:var(--theme-muted);white-space:nowrap;}
.cp-g3-sv-list{flex:1;min-height:0;display:flex;flex-direction:column;justify-content:center;}
.cp-g3-sv-row{position:relative;flex:1 1 0;min-height:0;max-height:104px;display:grid;grid-template-columns:52px minmax(0,var(--cp-g3-sv-q,500px)) minmax(0,1fr) var(--cp-g3-sv-end,128px);align-items:center;column-gap:20px;border-bottom:1px dashed var(--theme-line);}
.cp-g3-sv-row:last-child{border-bottom:0;}
.cp-g3-sv-row .campus-seal{min-width:46px;height:42px;font-size:20px;}
.cp-g3-sv-q{min-width:0;font-size:22px;line-height:1.38;color:var(--theme-ink);text-wrap:pretty;}
.cp-g3-sv-bar{position:relative;display:flex;height:44px;border-radius:10px;overflow:hidden;background:var(--campus-neutral-wash);}
.cp-g3-sv-seg{position:relative;min-width:0;display:flex;align-items:center;justify-content:center;}
.cp-g3-sv-seg + .cp-g3-sv-seg{box-shadow:inset 2px 0 0 var(--theme-surface);}
.cp-g3-sv-seg-fill{position:absolute;inset:0;}
.cp-g3-sv-seg-text{position:relative;font-family:var(--theme-font-serif);font-weight:700;font-size:19px;line-height:1;white-space:nowrap;color:var(--theme-ink);font-variant-numeric:lining-nums tabular-nums;}
.cp-g3-sv-seg.is-l1 .cp-g3-sv-seg-text,.cp-g3-sv-seg.is-l2 .cp-g3-sv-seg-text{color:var(--theme-on-accent);}
.cp-g3-sv-end{display:flex;flex-direction:column;align-items:flex-end;gap:4px;}
.cp-g3-sv-end-value{font-family:var(--theme-font-serif);font-weight:700;font-size:34px;line-height:1;color:var(--theme-accent);white-space:nowrap;font-variant-numeric:lining-nums tabular-nums;}
.cp-g3-sv-end-label{font-size:18px;line-height:1;color:var(--theme-faint);white-space:nowrap;}
.cp-g3-sv-row.is-top .cp-g3-sv-end-value{display:flex;align-items:center;height:42px;padding:0 14px;border-radius:999px;background:var(--campus-fill);color:var(--theme-on-accent);font-size:28px;box-shadow:0 6px 14px rgb(var(--theme-accent-rgb) / .26);}
/* 单色条模式:浅灰轨道 + 渐变条,数值在条末 */
.cp-g3-sv-track{position:relative;height:30px;border-radius:999px;background:var(--campus-neutral-wash);}
.cp-g3-sv-fill{position:absolute;left:0;top:0;bottom:0;border-radius:999px;background:var(--campus-fill);box-shadow:0 6px 14px rgb(var(--theme-accent-rgb) / .2);}
.cp-g3-sv-row.is-top .cp-g3-sv-fill{box-shadow:0 0 0 4px rgb(var(--theme-accent-rgb) / .14),0 6px 14px rgb(var(--theme-accent-rgb) / .26);}
.cp-g3-sv-fill-tip{position:absolute;right:6px;top:50%;width:18px;height:18px;margin-top:-9px;border-radius:50%;background:var(--theme-surface);box-shadow:0 0 0 3px rgb(255 255 255 / .35);}
.cp-g3-sv-list.is-sparse .cp-g3-sv-row{max-height:150px;}
.cp-g3-sv-list.is-sparse .cp-g3-sv-q{font-size:25px;}
.cp-g3-sv-list.is-sparse .cp-g3-sv-bar{height:54px;border-radius:12px;}
.cp-g3-sv-list.is-sparse .cp-g3-sv-seg-text{font-size:21px;}
.cp-g3-sv-list.is-sparse .cp-g3-sv-track{height:38px;}
.cp-g3-sv-list.is-sparse .cp-g3-sv-fill-tip{width:22px;height:22px;margin-top:-11px;right:8px;}
.cp-g3-sv-list.is-sparse .cp-g3-sv-end-value{font-size:40px;}
.cp-g3-sv-list.is-sparse .cp-g3-sv-row .campus-seal{min-width:52px;height:48px;font-size:22px;}
.cp-g3-sv-list.is-dense .cp-g3-sv-q{font-size:21px;line-height:1.3;}
.cp-g3-sv-list.is-dense .cp-g3-sv-bar{height:38px;}
.campus[data-campus-nav="rail"] .cp-g3-sv-row{--cp-g3-sv-q:420px;}
`;

export function SurveyBars(props) {
  useDataStyle();
  useThemeStyle('campus-survey-bars-style', CSS);
  const p = { ...DEFAULTS, ...props };
  const questions = safeArray(p.questions).slice(0, countOf(p.questionCount, 3, 7));
  const samples = safeArray(p.samples).slice(0, countOf(p.sampleCount, 2, 4));
  const levels = safeArray(p.levels).slice(0, 5);
  const single = p.mode === 'single';
  const showEnd = p.showTop2 !== false;
  const shares = questions.map(q => {
    const raw = LEVEL_KEYS.map(k => Math.max(0, safeNumber(q?.[k], 0)));
    const total = raw.reduce((a, b) => a + b, 0);
    return { raw, total, top2: total > 0 ? safeRatio(raw[0] + raw[1], total, 0) * 100 : 0 };
  });
  const endValues = questions.map((q, i) => (single ? clamp(safeNumber(q?.value, 0), 0, 100) : shares[i].top2));
  const topIndex = endValues.reduce((best, v, i) => (v > endValues[best] ? i : best), 0);
  const dense = questions.length > 5;
  return (
    <CampusFrame chapterIndex={p.chapterIndex}>
      <TitleRow no={p.sectionNo} title={p.title} className="campus-rise" style={enterDelay(0)} />
      {p.showSample && (
        <div className="cp-g3-sv-sample campus-rise" style={enterDelay(1)}>
          <div className="cp-g3-sv-sample-tag">
            <div className="cp-g3-sv-sample-shape" aria-hidden="true" />
            <div className="campus-note-mark" aria-hidden="true" />
            <div>{p.sampleLabel}</div>
          </div>
          <div className="cp-g3-sv-sample-body campus-card">
            {samples.map((fact, i) => (
              <div className="cp-g3-sv-fact" key={i}>
                <div className="cp-g3-sv-fact-value">{fact?.value}</div>
                <div className="cp-g3-sv-fact-label">{fact?.label}</div>
              </div>
            ))}
          </div>
        </div>
      )}
      <section className="cp-g3-sv-card campus-card campus-rise" style={enterDelay(2)}>
        <div className="cp-g3-sv-top">
          <LabelRow label={p.chartLabel} note={p.chartNote} />
          {!single && (
            <div className="cp-g3-sv-legend">
              {levels.map((level, i) => (
                <div className="cp-g3-sv-legend-item" key={i}>
                  <div className={`cp-g3-sv-legend-sw${i === 2 ? ' is-light' : ''}`} style={{ background: LEVEL_FILLS[i] }} aria-hidden="true" />
                  <div className="cp-g3-sv-legend-name">{level?.name}</div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className={`cp-g3-sv-list${dense ? ' is-dense' : ''}${questions.length <= 4 ? ' is-sparse' : ''}`}>
          {questions.map((q, r) => {
            const { raw, total } = shares[r];
            return (
              <div
                className={`cp-g3-sv-row campus-fade${showEnd && r === topIndex ? ' is-top' : ''}`}
                style={{ ...(showEnd ? null : { '--cp-g3-sv-end': '0px' }), ...enterDelay(3 + r) }}
                key={r}
              >
                <div className={`campus-seal${showEnd && r === topIndex ? '' : ' is-soft'}`}>{`Q${r + 1}`}</div>
                <div className="cp-g3-sv-q">{q?.text}</div>
                {single ? (
                  <div className="cp-g3-sv-track">
                    <div className="cp-g3-sv-fill campus-draw" style={{ width: `${Math.max(endValues[r], 0)}%`, ...enterDelay(4 + r) }}>
                      {endValues[r] >= 8 ? <div className="cp-g3-sv-fill-tip" aria-hidden="true" /> : null}
                    </div>
                  </div>
                ) : (
                  <div className="cp-g3-sv-bar campus-draw" style={enterDelay(4 + r)}>
                    {raw.map((v, k) => {
                      const w = total > 0 ? clamp(safeRatio(v, total, 0) * 100, 0, 100) : 0;
                      if (w <= 0) return null;
                      return (
                        <div className={`cp-g3-sv-seg is-l${k + 1}`} style={{ flex: `${w} 1 0` }} key={k}>
                          <div className="cp-g3-sv-seg-fill" style={{ background: LEVEL_FILLS[k] }} aria-hidden="true" />
                          {w >= 7 ? <div className="cp-g3-sv-seg-text">{`${formatNumber(v, v % 1 ? 1 : 0)}%`}</div> : null}
                        </div>
                      );
                    })}
                  </div>
                )}
                {showEnd ? (
                  <div className="cp-g3-sv-end">
                    <div className="cp-g3-sv-end-value">{`${formatNumber(endValues[r], endValues[r] % 1 ? 1 : 0)}%`}</div>
                    <div className="cp-g3-sv-end-label">{p.top2Label}</div>
                  </div>
                ) : <div />}
              </div>
            );
          })}
        </div>
      </section>
      {p.showConclusion && <ConclusionBar label={p.conclusionLabel} text={p.conclusion} className="campus-rise" style={enterDelay(11)} />}
    </CampusFrame>
  );
}

const PCT = { min: 0, max: 100, semantics: 'percent' };

SurveyBars.META = {
  id: 'survey-bars',
  label: '问卷结果 · 李克特堆叠条配样本说明',
  roles: ['distribution', 'metrics', 'observation'],
  defaults: DEFAULTS,
  copyBudgets: {
    sampleLabel: 5, 'samples[].value': 7, 'samples[].label': 7, chartLabel: 8, chartNote: 14,
    'levels[].name': 5, top2Label: 4, 'questions[].text': 30, conclusion: 52,
  },
  numberBounds: {
    'questions[].p1': PCT,
    'questions[].p2': PCT,
    'questions[].p3': PCT,
    'questions[].p4': PCT,
    'questions[].p5': PCT,
    'questions[].value': PCT,
  },
  controls: [
    { ...CHAPTER_CONTROL, default: 3 },
    { key: 'questionCount', type: 'number', label: '题目数量', default: 6, min: 3, max: 7, countArrays: ['questions'], description: '问卷题目的条数;题目文字最好一行,最多两行。' },
    { key: 'mode', type: 'radio', label: '条形样式', default: 'stacked', options: [{ value: 'stacked', label: '五级堆叠条' }, { value: 'single', label: '单个百分比' }], description: '五级堆叠条:每题 p1–p5 是五个选项的百分比(依次对应 levels 的五级,按合计换算成 100% 宽,占比小于 7% 的段不标数字);单个百分比:每题只画 value 一条单色条。' },
    { key: 'showTop2', type: 'toggle', label: '行末认同率', default: true, description: '每题行末的大号百分比:堆叠条模式是前两级之和(按合计换算),单个百分比模式是 value;最高的一题自动高亮。' },
    { key: 'showSample', type: 'toggle', label: '样本说明', default: true, description: '顶部的样本说明条(有效问卷数、回收率等)。' },
    { key: 'sampleCount', type: 'number', label: '样本说明项数', default: 4, min: 2, max: 4, countArrays: ['samples'], description: '样本说明的项数。' },
    { key: 'showConclusion', type: 'toggle', label: '底部结论条', default: true, description: '页面底部的校色结论条。' },
  ],
};
