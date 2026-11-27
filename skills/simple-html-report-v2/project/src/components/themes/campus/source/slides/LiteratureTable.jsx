// 文献综述表:左窄列是学者 / 机构(可带一枚关键词标签),可选年份列,右宽列是 1–3 行方法描述;
// 底部一条「已有研究的共性 → 本研究的切入点」对照结论,讲清楚本研究与他们的差别。
// 适合开题、硕博答辩研究现状章的「学者 | 方法」综述表。
import React from 'react';
import { useThemeStyle, enterDelay } from '../../../shared/style.jsx';
import { safeArray, clamp } from '../../../chart-safety.mjs';
import { CampusFrame, TitleRow, CHAPTER_CONTROL } from '../kit/chrome.jsx';
import { useStructureStyle, LinkDot, SparkStar } from '../kit/structure.jsx';

const DEFAULTS = {
  chapterIndex: 2,
  rowCount: 5,
  showYear: false,
  showKeyword: true,
  showSummary: true,
  sectionNo: '2.2',
  title: '高灵敏度跟踪方法研究现状',
  headWho: '学者 / 机构',
  headYear: '年份',
  headMethod: '研究方法与主要结论',
  rows: [
    { who: '学者 A', year: '20XX', keyword: '长相干积分', method: '采用 1 s 相干积分时间，实现室内 15 dB-Hz 弱信号的稳定跟踪，取得厘米级载波相位量测信息。' },
    { who: '学者 B', year: '20XX', keyword: '惯性辅助协同跟踪', method: '基于惯性辅助的紧组合结构设计协同跟踪环路，仿真显示 25 dB-Hz 弱信号下可稳定跟踪并保持载波相位锁定。' },
    { who: '学者 C', year: '20XX', keyword: '环路带宽设计', method: '根据载波环路噪声与带宽的关系，设计惯导辅助载波和码跟踪环路的实现方案。' },
    { who: '学者 D', year: '20XX', keyword: '比特同步', method: '提出改进直方图的位同步方法，利用直方图思想和调制周期性电文快速实现比特同步。' },
    { who: '学者 E', year: '20XX', keyword: '多通道联合', method: '提出适用于城市环境的多通道联合载波跟踪环路。' },
    { who: '学者 F', year: '20XX', keyword: '关键词', method: '在这里写第六位学者 / 机构的研究方法与主要结论。' },
  ],
  summaryLabel: '已有研究',
  summary: '常用长相干、差分相干等方法提高环路信噪比，但积分时间受比特跳变制约，加长后还会降低动态性能。',
  focusLabel: '本文切入',
  focus: '用惯性信息辅助跟踪环路，协调弱信号能力与动态能力之间的冲突。',
};

const CSS = `
.cp-lt{min-height:0;}
.cp-lt-who{flex-direction:column;align-items:flex-start;justify-content:center;gap:8px;padding-left:34px;}
.cp-lt-bar{position:absolute;left:0;top:14px;bottom:14px;width:6px;border-radius:0 4px 4px 0;background:var(--campus-fill-bar);opacity:.9;}
.cp-lt-name{font-family:var(--theme-font-serif);font-weight:700;font-size:26px;line-height:1.25;letter-spacing:.04em;color:var(--theme-ink);}
.cp-lt-key{display:inline-flex;align-items:center;max-width:100%;padding:4px 12px;border-radius:999px;background:var(--campus-accent-tint);font-size:18px;line-height:1.3;font-weight:700;color:var(--theme-accent);}
.cp-lt-year{justify-content:center;font-family:var(--theme-font-serif);font-weight:700;font-size:24px;color:var(--campus-accent-soft);font-variant-numeric:lining-nums tabular-nums;}
.cp-lt-method{font-size:22px;line-height:1.6;color:var(--theme-ink);}
.cp-lt.is-dense .cp-lt-method{font-size:21px;line-height:1.5;}
.cp-lt.is-dense .campus-xt-td{padding-top:9px;padding-bottom:9px;}
/* 底部对照结论:左「已有研究」浅底面板 → 圆钮箭头 → 右「本文切入」渐变面板 */
.cp-lt-gap{flex:none;display:grid;grid-template-columns:minmax(0,1.15fr) 56px minmax(0,1fr);align-items:stretch;margin-top:22px;min-height:118px;}
.cp-lt-gap.is-solo{grid-template-columns:minmax(0,1fr);}
.cp-lt-sum{display:flex;flex-direction:column;justify-content:center;gap:10px;padding:16px 26px;border-radius:var(--campus-radius);background:var(--campus-neutral-wash);border:1px solid var(--campus-neutral-soft);}
.cp-lt-sum .campus-chip{align-self:flex-start;height:32px;font-size:18px;background:var(--campus-neutral);box-shadow:none;}
.cp-lt-sum-text{font-size:21px;line-height:1.55;color:var(--theme-muted);text-wrap:pretty;}
.cp-lt-link{display:flex;align-items:center;justify-content:center;}
.cp-lt-focus{position:relative;isolation:isolate;display:flex;flex-direction:column;justify-content:center;gap:10px;padding:16px 28px;border-radius:var(--campus-radius);background:var(--campus-fill-deep);color:var(--theme-on-accent);box-shadow:var(--campus-shadow-lift);}
.cp-lt-focus-label{align-self:flex-start;display:flex;align-items:center;gap:8px;height:34px;padding:0 16px 0 12px;border-radius:999px;background:var(--campus-on-accent-glass);font-family:var(--theme-font-serif);font-weight:700;font-size:20px;line-height:1;letter-spacing:.12em;}
.cp-lt-focus-star{flex:none;display:block;color:var(--campus-spark);}
.cp-lt-focus-text{font-size:23px;line-height:1.5;font-weight:700;text-wrap:pretty;}
`;

export function LiteratureTable(props) {
  useStructureStyle();
  useThemeStyle('campus-literature-table-style', CSS);
  const p = { ...DEFAULTS, ...props };
  const rows = safeArray(p.rows).slice(0, clamp(p.rowCount, 3, 6));
  const cols = ['minmax(280px,.3fr)', p.showYear ? '136px' : null, 'minmax(0,1fr)'].filter(Boolean).join(' ');
  const dense = rows.length >= 6;
  return (
    <CampusFrame chapterIndex={p.chapterIndex}>
      <TitleRow no={p.sectionNo} title={p.title} className="campus-rise" style={enterDelay(0)} />
      <div className="campus-xt-stage">
      <div className={`cp-lt campus-xt campus-card campus-rise${dense ? ' is-dense' : ''}`} style={{ '--cp-xt-cols': cols, maxHeight: 60 + rows.length * 150, ...enterDelay(1) }}>
        <div className="campus-xt-head">
          <div className="campus-xt-th" style={{ paddingLeft: 34 }}><div className="campus-xt-mark" aria-hidden="true" /><div>{p.headWho}</div></div>
          {p.showYear && <div className="campus-xt-th is-center"><div>{p.headYear}</div></div>}
          <div className="campus-xt-th"><div>{p.headMethod}</div></div>
        </div>
        <div className="campus-xt-body">
          {rows.map((row, i) => (
            <div className={`campus-xt-row campus-fade${i % 2 ? ' is-zebra' : ''}`} style={enterDelay(2 + i)} key={i}>
              <div className="cp-lt-bar" aria-hidden="true" />
              <div className="campus-xt-td cp-lt-who">
                <div className="cp-lt-name">{row?.who}</div>
                {p.showKeyword ? <div className="cp-lt-key">{row?.keyword}</div> : null}
              </div>
              {p.showYear && <div className="campus-xt-td cp-lt-year"><div>{row?.year}</div></div>}
              <div className="campus-xt-td cp-lt-method"><p>{row?.method}</p></div>
            </div>
          ))}
        </div>
      </div>
      </div>
      <div className={`cp-lt-gap campus-rise${p.showSummary ? '' : ' is-solo'}`} style={enterDelay(9)}>
        {p.showSummary && (
          <>
            <div className="cp-lt-sum">
              <div className="campus-chip">{p.summaryLabel}</div>
              <p className="cp-lt-sum-text">{p.summary}</p>
            </div>
            <div className="cp-lt-link"><LinkDot direction="right" size={44} /></div>
          </>
        )}
        <div className="cp-lt-focus">
          <div className="cp-lt-focus-label">
            <SparkStar size={17} className="cp-lt-focus-star" />
            <div>{p.focusLabel}</div>
          </div>
          <p className="cp-lt-focus-text">{p.focus}</p>
        </div>
      </div>
    </CampusFrame>
  );
}

LiteratureTable.META = {
  id: 'literature-table',
  label: '文献综述表 · 学者方法配本文切入点',
  roles: ['context', 'comparison'],
  defaults: DEFAULTS,
  copyBudgets: {
    headWho: 8,
    headYear: 4,
    headMethod: 12,
    'rows[].who': 8,
    'rows[].year': 6,
    'rows[].keyword': 8,
    'rows[].method': 64,
    summaryLabel: 5,
    summary: 48,
    focusLabel: 5,
    focus: 40,
  },
  controls: [
    { ...CHAPTER_CONTROL, default: 2 },
    { key: 'rowCount', type: 'number', label: '文献行数', default: 5, min: 3, max: 6, description: '综述表里的学者 / 机构行数。' },
    { key: 'showYear', type: 'toggle', label: '年份列', default: false, description: '学者列与方法列之间的一列年份。' },
    { key: 'showKeyword', type: 'toggle', label: '关键词标签', default: true, description: '学者名下方的一枚关键词标签,概括这项工作的方法。' },
    { key: 'showSummary', type: 'toggle', label: '已有研究小结', default: true, description: '底部左侧「已有研究的共性」面板;关掉后只留右侧「本文切入」。' },
  ],
};
