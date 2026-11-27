// 实验设置 / 数据集:左侧「实验环境 / 超参数」键值表,右侧「数据集划分」表(子集 × 规模 / 占比 / 用途,
// 顶部一条 100% 占比条,可带一排数据集概况数字);右侧也可以换成 1–4 张样例图(媒体槽)。底部结论条。
// 键值、数字、表头都是 HTML 文本;占比条和行内细条只是不含文字的色块。
import React from 'react';
import { useThemeStyle, enterDelay } from '../../../shared/style.jsx';
import { MediaSlot } from '../../../shared/MediaSlot.jsx';
import { safeArray, safeNumber, safeRatio, clamp } from '../../../chart-safety.mjs';
import { CampusFrame, TitleRow, ConclusionBar, CHAPTER_CONTROL } from '../kit/chrome.jsx';
import { LabelRow } from '../kit/parts.jsx';
import { FigureTag } from '../kit/evidence.jsx';
import { useDataStyle, countOf, formatNumber } from '../kit/data.jsx';

const DEFAULTS = {
  chapterIndex: 4,
  paramCount: 7,
  mediaMode: 'auto',
  splitCount: 3,
  showFacts: true,
  factCount: 4,
  sampleCount: 3,
  showConclusion: true,
  sectionNo: '4.1',
  title: '实验环境与数据集',
  paramsLabel: '实验环境与超参数',
  paramsNote: '训练与开发环境',
  headKey: '项目',
  headValue: '配置',
  params: [
    { key: 'GPU', value: 'NVIDIA GeForce RTX 2080 Ti' },
    { key: 'CUDA / cuDNN', value: 'CUDA V10.0 · cuDNN V7.0' },
    { key: '操作系统', value: 'Ubuntu 16.04.6 LTS' },
    { key: '框架与工具', value: 'TensorFlow-GPU · Docker · Python' },
    { key: '点云可视化', value: 'Meshlab' },
    { key: '损失权重', value: 'α = 12，β = 6，γ = 0.18' },
    { key: '训练轮数', value: '200k 轮' },
    { key: '学习率', value: '0.001（示例数据）' },
  ],
  datasetLabel: 'DTU 数据集划分',
  datasetNote: '划分为示例数据',
  facts: [
    { value: '124', label: '个场景' },
    { value: '49', label: '个视角 / 物体' },
    { value: '7', label: '种光照' },
    { value: '1600×1200', label: '分辨率' },
  ],
  headName: '子集',
  headSize: '规模',
  headShare: '占比',
  headNote: '用途',
  splits: [
    { name: '训练集', size: '79 个场景', share: 63.7, note: '无监督训练，不使用深度真值' },
    { name: '验证集', size: '18 个场景', share: 14.5, note: '调参与选择检查点' },
    { name: '测试集', size: '22 个场景', share: 17.7, note: '定量评估 Acc. / Comp.' },
    { name: '未使用', size: '5 个场景', share: 4.0, note: '标定异常，剔除' },
  ],
  samplesLabel: '数据集样例',
  samplesNote: '每个物体 49 个视角 × 7 种光照',
  samples: [
    { tag: '(a)', title: 'DTU · 建筑模型' },
    { tag: '(b)', title: 'DTU · 砖块' },
    { tag: '(c)', title: 'Tanks and Temples · 雕像' },
    { tag: '(d)', title: 'Tanks and Temples · 骏马' },
  ],
  conclusionLabel: '设置要点',
  conclusion: '在 DTU 上训练和测试，再用从未见过的 Tanks and Temples 大型室外场景检验泛化能力。',
};

// 子集色阶:第一项校色渐变,其余依次浅校色、中性灰
const SPLIT_TONES = ['var(--campus-fill-bar)', 'var(--campus-tone-2)', 'var(--campus-tone-3)', 'var(--campus-tone-5)'];
const SPLIT_FLAT = ['var(--theme-accent)', 'var(--campus-tone-2)', 'var(--campus-tone-3)', 'var(--campus-tone-5)'];

const CSS = `
.cp-g3-st{flex:1;min-height:0;display:flex;gap:28px;}
.cp-g3-st-card{min-width:0;min-height:0;display:flex;flex-direction:column;padding:22px 26px 22px;}
.cp-g3-st-card.is-params{flex:0 0 41%;}
.cp-g3-st-card.is-data{flex:1 1 0;}
.cp-g3-st-top{flex:none;margin-bottom:18px;}
.cp-g3-st-top .campus-label-row{min-width:0;}
/* 键值表:左列浅校色底的键,右列值;行等分剩余高度 */
.cp-g3-st-kvwrap{flex:1;min-height:0;display:flex;flex-direction:column;}
.cp-g3-st-kvwrap > .cp-g3-tb-head{--cp-g3-cols:minmax(0,210px) minmax(0,1fr);}
.cp-g3-st-kv{flex:1;min-height:0;display:flex;flex-direction:column;border-radius:0 0 var(--campus-radius-sm) var(--campus-radius-sm);overflow:hidden;box-shadow:inset 0 0 0 1px var(--theme-line);}
.cp-g3-st-kv-row{position:relative;flex:1 1 0;min-height:0;max-height:128px;display:grid;grid-template-columns:minmax(0,210px) minmax(0,1fr);}
.cp-g3-st-kv-row + .cp-g3-st-kv-row{border-top:1px solid var(--theme-line);}
.cp-g3-st-kv-key{display:flex;align-items:center;gap:12px;min-width:0;padding:6px 16px 6px 20px;background:var(--campus-accent-wash);font-size:21px;line-height:1.3;font-weight:700;color:var(--theme-accent);}
.cp-g3-st-kv-row:nth-child(even) .cp-g3-st-kv-key{background:var(--campus-accent-tint);}
.cp-g3-st-kv-key .campus-mark{width:9px;height:9px;}
.cp-g3-st-kv-value{display:flex;align-items:center;min-width:0;padding:6px 20px;font-size:22px;line-height:1.35;color:var(--theme-ink);text-wrap:pretty;font-variant-numeric:lining-nums tabular-nums;}
.cp-g3-st-kv-row:nth-child(even) .cp-g3-st-kv-value{background:var(--campus-paper);}
.cp-g3-st-kv.is-dense .cp-g3-st-kv-key{font-size:20px;}
.cp-g3-st-kv.is-dense .cp-g3-st-kv-value{font-size:21px;}
/* 数据集概况:一排浅校色数字块 */
.cp-g3-st-facts{flex:none;display:grid;grid-auto-flow:column;grid-auto-columns:minmax(0,1fr);gap:14px;margin-bottom:22px;}
.cp-g3-st-fact{position:relative;display:flex;flex-direction:column;justify-content:center;gap:8px;min-width:0;padding:14px 18px 14px 22px;border-radius:var(--campus-radius-sm);background:var(--campus-wash);}
.cp-g3-st-fact-bar{position:absolute;left:0;top:14px;bottom:14px;width:4px;border-radius:0 3px 3px 0;background:var(--campus-fill-bar);}
.cp-g3-st-fact-value{font-family:var(--theme-font-serif);font-weight:700;font-size:38px;line-height:1;color:var(--theme-accent);white-space:nowrap;font-variant-numeric:lining-nums;}
.cp-g3-st-fact-label{font-size:19px;line-height:1.3;color:var(--theme-muted);}
.cp-g3-st-facts.is-4 .cp-g3-st-fact-value{font-size:34px;}
/* 100% 占比条 */
.cp-g3-st-ratio{flex:none;display:flex;height:30px;margin-bottom:20px;border-radius:999px;overflow:hidden;box-shadow:0 8px 18px rgb(var(--theme-accent-rgb) / .14);}
.cp-g3-st-seg{position:relative;min-width:0;display:flex;align-items:center;justify-content:center;font-family:var(--theme-font-serif);font-weight:700;font-size:20px;line-height:1;white-space:nowrap;color:var(--theme-ink);font-variant-numeric:lining-nums;}
.cp-g3-st-seg + .cp-g3-st-seg{box-shadow:inset 2px 0 0 var(--theme-surface);}
.cp-g3-st-seg.is-first{color:var(--theme-on-accent);}
.cp-g3-st-seg-fill{position:absolute;inset:0;z-index:0;}
/* 划分表 */
.cp-g3-st-table{flex:1;min-height:0;}
.cp-g3-st-table .cp-g3-tb-row{max-height:124px;}
/* 只有 2 个子集时行高上限放宽,数据集卡不在上半截就结束 */
.cp-g3-st-table.is-few .cp-g3-tb-row{max-height:168px;}
.cp-g3-st-name{display:flex;align-items:center;gap:12px;min-width:0;font-weight:700;}
.cp-g3-st-swatch{flex:none;width:16px;height:16px;border-radius:5px;}
.cp-g3-st-share{display:flex;flex-direction:column;align-items:flex-end;justify-content:center;gap:8px;min-width:0;}
.cp-g3-st-share-bar{width:min(100%,130px);height:6px;border-radius:3px;background:var(--campus-neutral-wash);overflow:hidden;}
.cp-g3-st-share-fill{height:100%;border-radius:3px;}
.cp-g3-st-size{font-family:var(--theme-font-serif);font-weight:600;font-size:23px;color:var(--theme-ink);white-space:nowrap;font-variant-numeric:lining-nums tabular-nums;}
/* 样例图 */
.cp-g3-st-samples{flex:1;min-height:0;display:grid;gap:20px;}
.cp-g3-st-sample{min-width:0;min-height:0;display:flex;flex-direction:column;}
.cp-g3-st-sample-photo{position:relative;flex:1;min-height:0;}
.cp-g3-st-sample-cap{flex:none;display:flex;align-items:center;gap:10px;margin-top:12px;font-size:20px;line-height:1.35;color:var(--theme-muted);}
.cp-g3-st-sample-cap .campus-mark{width:9px;height:9px;}
.campus[data-campus-nav="rail"] .cp-g3-st-card.is-params{flex-basis:40%;}
.campus[data-campus-nav="rail"] .cp-g3-st-kv-row,.campus[data-campus-nav="rail"] .cp-g3-st-kvwrap > .cp-g3-tb-head{grid-template-columns:minmax(0,180px) minmax(0,1fr);}
`;

function SplitTable({ p, splits, total }) {
  return (
    <div className={`cp-g3-tb cp-g3-st-table${splits.length <= 2 ? ' is-few' : ''}`} style={{ '--cp-g3-cols': 'minmax(0,1.05fr) minmax(0,1fr) minmax(0,.9fr) minmax(0,1.7fr)' }}>
      <div className="cp-g3-tb-head">
        <div className="cp-g3-tb-th">{p.headName}</div>
        <div className="cp-g3-tb-th is-num">{p.headSize}</div>
        <div className="cp-g3-tb-th is-num">{p.headShare}</div>
        <div className="cp-g3-tb-th">{p.headNote}</div>
      </div>
      <div className="cp-g3-tb-body">
        {splits.map((row, i) => {
          const share = Math.max(0, safeNumber(row?.share, 0));
          const width = clamp(safeRatio(share, total, 0) * 100, 0, 100);
          return (
            <div className="cp-g3-tb-row campus-fade" style={enterDelay(5 + i)} key={i}>
              <div className="cp-g3-tb-td">
                <div className="cp-g3-st-name">
                  <div className="cp-g3-st-swatch" style={{ background: SPLIT_TONES[i % SPLIT_TONES.length] }} aria-hidden="true" />
                  <div>{row?.name}</div>
                </div>
              </div>
              <div className="cp-g3-tb-td is-num"><div className="cp-g3-st-size">{row?.size}</div></div>
              <div className="cp-g3-tb-td is-num">
                <div className="cp-g3-st-share">
                  <div className={`cp-g3-num${i === 0 ? ' is-best' : ''}`}>{`${formatNumber(share, share % 1 ? 1 : 0)}%`}</div>
                  <div className="cp-g3-st-share-bar" aria-hidden="true">
                    <div className="cp-g3-st-share-fill" style={{ width: `${width}%`, background: SPLIT_FLAT[i % SPLIT_FLAT.length] }} />
                  </div>
                </div>
              </div>
              <div className="cp-g3-tb-td is-muted">{row?.note}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function SetupTables(props) {
  useDataStyle();
  useThemeStyle('campus-setup-tables-style', CSS);
  const p = { ...DEFAULTS, ...props };
  const params = safeArray(p.params).slice(0, countOf(p.paramCount, 4, 8));
  const splits = safeArray(p.splits).slice(0, countOf(p.splitCount, 2, 4));
  const facts = safeArray(p.facts).slice(0, countOf(p.factCount, 2, 4));
  const samples = safeArray(p.samples).slice(0, countOf(p.sampleCount, 1, 4));
  const images = p.mediaMode === 'image' || (p.mediaMode === 'auto' && safeArray(p.images).some(item => (typeof item === 'string' ? item.trim() !== '' : Boolean(item?.src))));
  const shares = splits.map(row => Math.max(0, safeNumber(row?.share, 0)));
  const total = shares.reduce((a, b) => a + b, 0);
  const sampleCols = samples.length === 4 ? 2 : samples.length;
  return (
    <CampusFrame chapterIndex={p.chapterIndex}>
      <TitleRow no={p.sectionNo} title={p.title} className="campus-rise" style={enterDelay(0)} />
      <div className="cp-g3-st">
        <section className="cp-g3-st-card is-params campus-card campus-rise" style={enterDelay(1)}>
          <div className="cp-g3-st-top"><LabelRow label={p.paramsLabel} note={p.paramsNote} /></div>
          <div className="cp-g3-st-kvwrap">
          <div className="cp-g3-tb-head">
            <div className="cp-g3-tb-th">{p.headKey}</div>
            <div className="cp-g3-tb-th">{p.headValue}</div>
          </div>
          <div className={`cp-g3-st-kv${params.length > 6 ? ' is-dense' : ''}`}>
            {params.map((row, i) => (
              <div className="cp-g3-st-kv-row campus-fade" style={enterDelay(2 + i)} key={i}>
                <div className="cp-g3-st-kv-key">
                  <div className={`campus-mark${i === 0 ? ' is-spark' : ''}`} aria-hidden="true" />
                  <div>{row?.key}</div>
                </div>
                <div className="cp-g3-st-kv-value">{row?.value}</div>
              </div>
            ))}
          </div>
          </div>
        </section>
        <section className="cp-g3-st-card is-data campus-card campus-rise" style={enterDelay(2)}>
          {images ? (
            <>
              <div className="cp-g3-st-top"><LabelRow label={p.samplesLabel} note={p.samplesNote} /></div>
              <div className="cp-g3-st-samples" style={{ gridTemplateColumns: `repeat(${sampleCols}, minmax(0,1fr))` }}>
                {samples.map((item, i) => (
                  <figure className="cp-g3-st-sample campus-rise" style={{ margin: 0, ...enterDelay(3 + i) }} key={i}>
                    <div className="cp-g3-st-sample-photo campus-photo">
                      <MediaSlot id={`setup-tables-sample-${i}`} fit="cover" radius={8} placeholder="样例图" />
                      <FigureTag>{item?.tag}</FigureTag>
                    </div>
                    <figcaption className="cp-g3-st-sample-cap">
                      <div className="campus-mark" aria-hidden="true" />
                      <div>{item?.title}</div>
                    </figcaption>
                  </figure>
                ))}
              </div>
            </>
          ) : (
            <>
              <div className="cp-g3-st-top"><LabelRow label={p.datasetLabel} note={p.datasetNote} /></div>
              {p.showFacts && (
                <div className={`cp-g3-st-facts is-${facts.length}`}>
                  {facts.map((fact, i) => (
                    <div className="cp-g3-st-fact campus-rise" style={enterDelay(3 + i)} key={i}>
                      <div className="cp-g3-st-fact-bar" aria-hidden="true" />
                      <div className="cp-g3-st-fact-value">{fact?.value}</div>
                      <div className="cp-g3-st-fact-label">{fact?.label}</div>
                    </div>
                  ))}
                </div>
              )}
              <div className="cp-g3-st-ratio campus-draw" style={enterDelay(4)} aria-hidden="true">
                {splits.map((row, i) => {
                  const w = total > 0 ? clamp(safeRatio(shares[i], total, 0) * 100, 0, 100) : 100 / Math.max(1, splits.length);
                  return (
                    <div className={`cp-g3-st-seg${i === 0 ? ' is-first' : ''}`} style={{ flex: `${w} 1 0` }} key={i}>
                      <div className="cp-g3-st-seg-fill" style={{ background: i === 0 ? 'var(--campus-fill)' : SPLIT_FLAT[i % SPLIT_FLAT.length] }} />
                    </div>
                  );
                })}
              </div>
              <SplitTable p={p} splits={splits} total={total} />
            </>
          )}
        </section>
      </div>
      {p.showConclusion && <ConclusionBar label={p.conclusionLabel} text={p.conclusion} className="campus-rise" style={enterDelay(9)} />}
    </CampusFrame>
  );
}

SetupTables.META = {
  id: 'setup-tables',
  label: '实验设置 · 参数表配数据集划分',
  roles: ['context', 'metrics', 'distribution'],
  defaults: DEFAULTS,
  copyBudgets: {
    paramsLabel: 10, paramsNote: 12, headKey: 6, headValue: 10, datasetLabel: 10, datasetNote: 12, samplesLabel: 10, samplesNote: 16,
    'params[].key': 7, 'params[].value': 26, 'facts[].value': 9, 'facts[].label': 8,
    'splits[].name': 7, 'splits[].size': 8, 'splits[].note': 16, 'samples[].title': 16, 'samples[].tag': 4,
    conclusion: 52,
  },
  numberBounds: {
    'splits[].share': { min: 0, max: 100, semantics: 'percent' },
  },
  controls: [
    { ...CHAPTER_CONTROL, default: 4 },
    { key: 'paramCount', type: 'number', label: '参数行数', default: 7, min: 4, max: 8, countArrays: ['params'], description: '左侧键值表的行数(实验环境、超参数各一行,key 是名称,value 是取值)。' },
    { key: 'mediaMode', type: 'radio', label: '右侧内容', default: 'auto', options: [{ value: 'auto', label: '自动' }, { value: 'table', label: '数据集划分表' }, { value: 'image', label: '样例图' }], description: '自动(默认):给了 images 就显示样例图,没给就显示数据集划分表;数据集划分表:子集 × 规模 / 占比 / 用途,顶部一条占比条;样例图:换成 1–4 张数据集样例图。' },
    { key: 'splitCount', type: 'number', label: '子集行数', default: 3, min: 2, max: 4, countArrays: ['splits'], description: '划分表的行数(训练 / 验证 / 测试…);share 是占比(0–100 的数字),占比条按各行 share 换算。' },
    { key: 'showFacts', type: 'toggle', label: '数据集概况', default: true, description: '划分表上方一排概况数字(场景数、视角数、分辨率等)。' },
    { key: 'factCount', type: 'number', label: '概况数字个数', default: 4, min: 2, max: 4, countArrays: ['facts'], description: '概况数字的个数。' },
    { key: 'sampleCount', type: 'number', label: '样例图数量', default: 3, min: 1, max: 4, countArrays: ['samples'], description: '右侧为样例图时的图片张数(图注 samples 按同样的张数显示);4 张时排成 2×2。' },
    { key: 'images', type: 'images', label: '样例图', countKey: 'sampleCount', description: '右侧内容为「样例图」时显示的图片,按顺序放进各图位。右侧内容为「自动」时,goal 里写了 props.images 就显示样例图;在页面上上传前,先把右侧内容切到「样例图」。' },
    { key: 'showConclusion', type: 'toggle', label: '底部结论条', default: true, description: '页面底部的校色结论条。' },
  ],
};
