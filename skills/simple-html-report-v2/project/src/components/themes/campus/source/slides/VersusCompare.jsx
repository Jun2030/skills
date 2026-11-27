// 左右对比:顶部两块对比方名牌(对照方中性灰、主张方校色渐变)夹一枚渐变「VS」圆章,
// 下面逐行按对比维度展开,维度标签落在中轴上。适合新旧模式、两种方案、国内外现状的对比。
import React from 'react';
import { useThemeStyle, enterDelay } from '../../../shared/style.jsx';
import { safeArray, clamp } from '../../../chart-safety.mjs';
import { CampusFrame, TitleRow, ConclusionBar, CHAPTER_CONTROL } from '../kit/chrome.jsx';

const DEFAULTS = {
  chapterIndex: 1,
  rowCount: 5,
  showConclusion: true,
  sectionNo: '1.4',
  title: '两种创作模式的对比',
  leftTitle: '传统自媒体',
  leftNote: '经验驱动 · 单账号运营',
  rightTitle: '数据驱动创作',
  rightNote: '指标驱动 · 矩阵化运营',
  vsLabel: 'VS',
  rows: [
    { dimension: '选题依据', left: '凭个人兴趣与经验判断，追热点', right: '结合历史数据与 A/B 测试确定选题' },
    { dimension: '生产方式', left: '个人包办，产能依赖灵感', right: '工作室分工协作，流程标准化' },
    { dimension: '效果评估', left: '只看播放量，复盘随意', right: '多项核心指标量化评估，定期复盘' },
    { dimension: '账号布局', left: '单一账号，受算法波动影响大', right: '多账号矩阵覆盖不同圈层、分散风险' },
    { dimension: '用户关系', left: '以流量为目标，关系浅', right: '真诚沟通累积信任，形成稳定社群' },
    { dimension: '变现方式', left: '广告接单为主，收入不稳定', right: '以信任为背书发展自有品牌' },
  ],
  conclusionLabel: '核心差异',
  conclusion: '差别不在“有没有数据”，而在数据是否进入选题、生产与复盘的全流程。',
};

const CSS = `
.cp-vs{flex:1;min-height:0;display:grid;grid-template-columns:minmax(0,1fr) 240px minmax(0,1fr);grid-template-rows:auto minmax(0,1fr);}
.cp-vs-plate{position:relative;display:flex;flex-direction:column;justify-content:center;gap:8px;min-height:124px;padding:18px 40px;border-radius:var(--campus-radius);}
.cp-vs-plate.is-left{align-items:flex-end;text-align:right;background:var(--campus-neutral-fill);}
.cp-vs-plate.is-right{background:var(--campus-fill-deep);color:var(--theme-on-accent);box-shadow:var(--campus-shadow-lift);}
.cp-vs-plate-cap{position:absolute;top:0;width:64px;height:6px;border-radius:0 0 4px 4px;}
.cp-vs-plate.is-left .cp-vs-plate-cap{right:40px;background:var(--campus-neutral);}
.cp-vs-plate.is-right .cp-vs-plate-cap{left:40px;background:var(--campus-spark);}
.cp-vs-plate-title{font-family:var(--theme-font-serif);font-weight:700;font-size:44px;line-height:1.15;letter-spacing:.08em;}
.cp-vs-plate.is-left .cp-vs-plate-title{color:var(--theme-ink);}
.cp-vs-plate-note{font-size:20px;letter-spacing:.06em;}
.cp-vs-plate.is-left .cp-vs-plate-note{color:var(--theme-muted);}
.cp-vs-plate.is-right .cp-vs-plate-note{color:var(--campus-on-accent-muted);}
.cp-vs-badge-cell{position:relative;display:flex;align-items:center;justify-content:center;}
.cp-vs-badge-ring{position:absolute;left:50%;top:50%;width:136px;height:136px;margin:-68px 0 0 -68px;border-radius:50%;border:2px dashed var(--campus-accent-line);}
.cp-vs-badge{position:relative;z-index:1;width:112px;height:112px;border-radius:50%;background:var(--campus-fill);box-shadow:0 12px 26px rgb(var(--theme-accent-rgb) / .32);}
.cp-vs-badge-text{position:absolute;z-index:2;left:50%;top:50%;transform:translate(-50%,-50%);font-family:var(--theme-font-serif);font-weight:700;font-style:italic;font-size:46px;line-height:1;color:var(--theme-on-accent);letter-spacing:.02em;}
.cp-vs-rows{grid-column:1 / -1;display:grid;grid-template-columns:minmax(0,1fr) 240px minmax(0,1fr);grid-auto-rows:minmax(0,1fr);row-gap:12px;padding-top:14px;position:relative;}
.cp-vs-axis{position:absolute;left:50%;top:0;bottom:0;width:0;margin-left:-1px;border-left:2px dashed var(--campus-accent-line);}
.cp-vs-cell{display:flex;align-items:center;gap:16px;min-height:0;padding:0 40px;border-radius:var(--campus-radius-sm);}
.cp-vs-cell.is-left{background:var(--campus-neutral-wash);justify-content:flex-end;text-align:right;}
.cp-vs-cell.is-right{background:var(--campus-wash);}
.cp-vs-text{font-size:25px;line-height:1.5;}
.cp-vs-cell.is-left .cp-vs-text{color:var(--theme-muted);}
.cp-vs-cell.is-right .cp-vs-text{color:var(--theme-ink);font-weight:700;}
.cp-vs-cell.is-right .campus-mark{flex:none;}
.cp-vs-dim{position:relative;z-index:1;display:flex;align-items:center;justify-content:center;}
.cp-vs-dim .campus-chip{height:42px;padding:0 22px;font-size:20px;letter-spacing:.12em;}
.cp-vs-rows.is-6 .cp-vs-text{font-size:22px;}
`;

export function VersusCompare(props) {
  useThemeStyle('campus-versus-compare-style', CSS);
  const p = { ...DEFAULTS, ...props };
  const rows = safeArray(p.rows).slice(0, clamp(p.rowCount, 3, 6));
  return (
    <CampusFrame chapterIndex={p.chapterIndex}>
      <TitleRow no={p.sectionNo} title={p.title} className="campus-rise" style={enterDelay(0)} />
      <div className="cp-vs">
        <div className="cp-vs-plate is-left campus-rise" style={enterDelay(1)}>
          <div className="cp-vs-plate-cap" aria-hidden="true" />
          <h3 className="cp-vs-plate-title">{p.leftTitle}</h3>
          <div className="cp-vs-plate-note">{p.leftNote}</div>
        </div>
        <div className="cp-vs-badge-cell campus-fade" style={enterDelay(2)}>
          <div className="cp-vs-badge-ring" aria-hidden="true" />
          <div className="cp-vs-badge" />
          <div className="cp-vs-badge-text">{p.vsLabel}</div>
        </div>
        <div className="cp-vs-plate is-right campus-rise" style={enterDelay(1)}>
          <div className="cp-vs-plate-cap" aria-hidden="true" />
          <h3 className="cp-vs-plate-title">{p.rightTitle}</h3>
          <div className="cp-vs-plate-note">{p.rightNote}</div>
        </div>
        <div className={`cp-vs-rows is-${rows.length}`}>
          <div className="cp-vs-axis" />
          {rows.map((row, i) => (
            <React.Fragment key={i}>
              <div className="cp-vs-cell is-left campus-rise" style={enterDelay(3 + i)}>
                <div className="cp-vs-text">{row?.left}</div>
              </div>
              <div className="cp-vs-dim campus-fade" style={enterDelay(3 + i)}>
                <div className="campus-chip">{row?.dimension}</div>
              </div>
              <div className="cp-vs-cell is-right campus-rise" style={enterDelay(3 + i)}>
                <div className="campus-mark" />
                <div className="cp-vs-text">{row?.right}</div>
              </div>
            </React.Fragment>
          ))}
        </div>
      </div>
      {p.showConclusion && <ConclusionBar label={p.conclusionLabel} text={p.conclusion} className="campus-rise" style={enterDelay(9)} />}
    </CampusFrame>
  );
}

VersusCompare.META = {
  id: 'versus-compare',
  label: '左右对比 · 双方名牌配维度逐行对照',
  roles: ['comparison', 'context'],
  defaults: DEFAULTS,
  copyBudgets: { 'rows[].left': 18, 'rows[].right': 20, 'rows[].dimension': 7, leftTitle: 8, rightTitle: 8, conclusion: 44 },
  controls: [
    { ...CHAPTER_CONTROL },
    { key: 'rowCount', type: 'number', label: '对比维度数', default: 5, min: 3, max: 6, description: '逐行对比的维度数量。' },
    { key: 'showConclusion', type: 'toggle', label: '底部结论条', default: true, description: '页面底部的校色结论条。' },
  ],
};
