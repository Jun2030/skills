// 立体漏斗:左侧 3–5 层由宽到窄的立体漏斗段(每层有上表面椭圆、柱面明暗,越往下校色越深),
// 漏斗口上方落着一把彩色小球(待筛选的样本),出口下方是一枚暖金结果球;每层写名称与数值,
// 右侧对应一张说明卡,层与层之间标出筛选条件 / 保留比例。适合文献筛选、样本筛选、逐层聚焦。
import React from 'react';
import { useThemeStyle, enterDelay } from '../../../shared/style.jsx';
import { safeArray, safeNumber, safeMax, safePercent, clamp } from '../../../chart-safety.mjs';
import { CampusFrame, TitleRow, CHAPTER_CONTROL, TITLE_ROW_SPACE, useCampusLayout, textWidthEm } from '../kit/chrome.jsx';
import { ToneDefs } from '../kit/feature-b.jsx';
import { useFeatureCStyle, useSvgId, Stop, r2, Sparkles, KickerChip, NoSeal } from '../kit/feature-c.jsx';

const DEFAULTS = {
  chapterIndex: 1,
  layerCount: 4,
  sectionNo: '1.5',
  title: '文献检索与逐层筛选',
  note: '示例数据',
  resultLabel: '纳入综述',
  resultValue: '23',
  resultUnit: '篇',
  resultText: '形成文献综述表，提炼本文的研究切入点。',
  layers: [
    { no: '01', name: '检索文献', value: '1246', unit: '篇', filter: '', desc: '在中英文数据库检索「组合导航 + 抗差 / 高灵敏度」主题文献。' },
    { no: '02', name: '去重合并', value: '862', unit: '篇', filter: '剔除重复 · 保留 69%', desc: '合并多库检索结果，剔除重复条目与非学术文献。' },
    { no: '03', name: '摘要筛选', value: '214', unit: '篇', filter: '标题摘要 · 保留 25%', desc: '阅读标题与摘要，保留与深组合跟踪、抗差直接相关的研究。' },
    { no: '04', name: '全文精读', value: '68', unit: '篇', filter: '全文评估 · 保留 32%', desc: '精读全文，按方法、数据与结论完整性评估。' },
    { no: '05', name: '质量评估', value: '41', unit: '篇', filter: '方法可复现 · 保留 60%', desc: '保留方法描述完整、实验可复现的研究。' },
  ],
};

const CSS = `
.cp-g5-fn-face{position:absolute;transform:translate(-50%,-50%);display:flex;align-items:baseline;justify-content:center;gap:10px;white-space:nowrap;color:var(--theme-on-accent);}
.cp-g5-fn-face.is-light{color:var(--theme-accent);}
.cp-g5-fn-name{font-size:22px;font-weight:700;letter-spacing:.06em;}
.cp-g5-fn-value{font-family:var(--theme-font-serif);font-weight:700;font-size:var(--cp-g5-fn-num,40px);line-height:1;font-variant-numeric:lining-nums;}
.cp-g5-fn-unit{font-size:19px;font-weight:700;}
.cp-g5-fn-row{position:absolute;transform:translateY(-50%);display:flex;align-items:center;gap:16px;padding:14px 26px 14px 22px;}
.cp-g5-fn-row-body{flex:1;min-width:0;display:flex;flex-direction:column;gap:10px;}
.cp-g5-fn-desc{font-size:21px;line-height:1.5;color:var(--theme-ink);text-wrap:pretty;}
.cp-g5-fn-bar{position:relative;height:8px;border-radius:4px;background:var(--campus-neutral-wash);overflow:hidden;}
.cp-g5-fn-bar-fill{position:absolute;left:0;top:0;bottom:0;border-radius:4px;background:linear-gradient(90deg,var(--campus-fb-accent-mist) 0%,var(--theme-accent) 100%);}
.cp-g5-fn-filter{position:absolute;transform:translate(-100%,-50%);display:flex;align-items:center;gap:8px;height:34px;padding:0 14px 0 10px;border-radius:999px;background:var(--theme-surface);border:1.5px solid var(--campus-gold-line);color:var(--campus-gold-ink);font-size:18px;font-weight:700;letter-spacing:.04em;white-space:nowrap;box-shadow:0 6px 14px rgb(var(--campus-gold-rgb) / .2);}
.cp-g5-fn-filter-arrow{flex:none;display:block;color:var(--campus-gold);}
.cp-g5-fn-result{position:absolute;transform:translate(-50%,-50%);display:flex;align-items:baseline;gap:4px;white-space:nowrap;color:var(--campus-gold-deep);}
.cp-g5-fn-result-value{font-family:var(--theme-font-serif);font-weight:700;font-size:44px;line-height:1;font-variant-numeric:lining-nums;}
.cp-g5-fn-result-unit{font-size:19px;font-weight:700;}
.cp-g5-fn-result-card{position:absolute;transform:translateY(-50%);display:flex;flex-direction:column;align-items:flex-start;gap:10px;}
.cp-g5-fn-result-text{font-family:var(--theme-font-serif);font-weight:700;font-size:26px;line-height:1.35;color:var(--theme-ink);text-wrap:pretty;}
.cp-g5-fn-note{position:absolute;right:0;top:0;font-size:18px;letter-spacing:.06em;color:var(--theme-faint);}
.cp-g5-fn.is-dense .cp-g5-fn-row{padding:10px 24px 10px 20px;}
.cp-g5-fn.is-dense .cp-g5-fn-name{font-size:21px;}
`;

// 漏斗口上方的小球(以漏斗口半径为单位的偏移 + 半径 + 色调)。
const BALLS = [
  [-0.62, -0.62, 15, 'accent'], [-0.3, -0.92, 12, 'gold'], [0.04, -0.66, 17, 'mist'], [0.36, -0.95, 11, 'accent'],
  [0.6, -0.6, 14, 'gold'], [-0.12, -1.18, 10, 'mist'], [0.22, -1.32, 9, 'gold'], [-0.46, -1.26, 8, 'accent'],
  [0.74, -1.1, 8, 'mist'], [-0.82, -0.98, 9, 'gold'],
];

export function FunnelLayers(props) {
  useThemeStyle('campus-funnel-layers-style', CSS);
  useFeatureCStyle();
  const p = { ...DEFAULTS, ...props };
  const id = useSvgId('cp-g5-fn');
  const { bodyW, bodyH } = useCampusLayout();
  const layers = safeArray(p.layers).slice(0, clamp(Math.round(p.layerCount) || 4, 3, 5));
  const n = Math.max(1, layers.length);
  const W = bodyW;
  const H = bodyH - TITLE_ROW_SPACE;

  // 竖向:上方 84px 给小球,下方 resultH 给出口与结果球,中间是 n 层漏斗段,层间留 gap 露出下一层的上表面。
  const rTop = Math.round(Math.min(W * 0.2, 330));
  const ryK = 0.17;
  const topY = 96;
  const resultH = 168;
  const gap = 16;
  const th = (H - topY - resultH - gap * (n - 1)) / n;
  const fx = Math.round(rTop + 30);
  const rMin = rTop * 0.3;
  const radiusAt = t => rTop - (rTop - rMin) * t;
  // 说明卡下方的细条:各层数值相对最大一层的比例(数值写成「1,246」这类带千分位的文字也能读出)。
  const nums = layers.map(ly => Math.max(0, safeNumber(parseFloat(String(ly?.value ?? '').replace(/,/g, '')), 0)));
  const numMax = safeMax(nums, 1);
  const segs = layers.map((ly, i) => {
    const y0 = topY + i * (th + gap);
    const y1 = y0 + th;
    const r0 = radiusAt(i / n);
    const r1 = radiusAt((i + 1) / n) * 1.04;
    const pct = n > 1 ? Math.round(34 + 66 * (i / (n - 1))) : 100;
    return { ly, i, y0: r2(y0), y1: r2(y1), r0: r2(r0), r1: r2(r1), pct, light: pct < 58, ratio: r2(Math.max(2, safePercent(nums[i], numMax, 0))) };
  });
  const last = segs[segs.length - 1];
  const spoutR = r2((last ? last.r1 : rMin) * 0.42);
  const spoutY0 = last ? last.y1 : H - resultH;
  const orbR = 54;
  const orbY = r2(H - orbR - 8);
  // 说明卡列的左缘:默认离漏斗口 236px;筛选条件胶囊(右缘贴着说明卡列、左缘不能压到漏斗侧边)写得长时整列右移。
  const pillW = text => {
    const chars = Array.from(String(text ?? '')).length;
    return textWidthEm(text) * 18 + chars * 0.04 * 18 + 24 + 8 + 14 + 6;
  };
  const colX = Math.round(Math.max(fx + rTop + 236, ...segs.slice(1).map(sg => (sg.ly?.filter ? fx + sg.r0 + 16 + pillW(sg.ly.filter) + 14 : 0))));
  const mixColor = (pct, base = 'var(--theme-accent)') => `color-mix(in srgb, ${base} ${clamp(pct, 0, 100)}%, var(--theme-surface))`;
  const sidePath = s => {
    const ry0 = r2(s.r0 * ryK);
    const ry1 = r2(s.r1 * ryK);
    return `M ${r2(fx - s.r0)} ${s.y0} L ${r2(fx - s.r1)} ${s.y1} A ${r2(s.r1)} ${ry1} 0 0 0 ${r2(fx + s.r1)} ${s.y1} L ${r2(fx + s.r0)} ${s.y0} A ${r2(s.r0)} ${ry0} 0 0 1 ${r2(fx - s.r0)} ${s.y0} Z`;
  };

  return (
    <CampusFrame chapterIndex={p.chapterIndex}>
      <TitleRow no={p.sectionNo} title={p.title} className="campus-rise" style={enterDelay(0)} />
      <div className={`cp-g5-fig cp-g5-fn${n >= 5 ? ' is-dense' : ''}`}>
        <svg className="cp-g5-svg campus-fade" style={{ width: W, height: H, ...enterDelay(1) }} viewBox={`0 0 ${W} ${H}`} aria-hidden="true">
          <defs>
            <ToneDefs id={id} tones={['accent', 'gold', 'mist']} />
            {segs.map(s => (
              <React.Fragment key={s.i}>
                <linearGradient id={`${id}-side-${s.i}`} x1="0" y1="0" x2="1" y2="0">
                  <Stop offset="0" color={mixColor(s.pct * 0.62)} />
                  <Stop offset=".3" color={mixColor(s.pct * 0.82)} />
                  <Stop offset=".72" color={mixColor(s.pct)} />
                  <Stop offset="1" color={mixColor(Math.min(100, s.pct + 10), 'var(--campus-accent-lo)')} />
                </linearGradient>
                <linearGradient id={`${id}-top-${s.i}`} x1="0" y1="0" x2="1" y2="1">
                  <Stop offset="0" color={mixColor(s.pct * 0.3)} />
                  <Stop offset="1" color={mixColor(s.pct * 0.55)} />
                </linearGradient>
              </React.Fragment>
            ))}
            <linearGradient id={`${id}-inner`} x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" color="var(--theme-accent)" opacity=".42" />
              <Stop offset="1" color="var(--campus-fb-accent-pale)" opacity=".9" />
            </linearGradient>
            <linearGradient id={`${id}-spout`} x1="0" y1="0" x2="1" y2="0">
              <Stop offset="0" color="var(--campus-accent-hi)" />
              <Stop offset=".6" color="var(--theme-accent)" />
              <Stop offset="1" color="var(--campus-accent-deep)" />
            </linearGradient>
            <radialGradient id={`${id}-orb`} cx=".36" cy=".3" r=".8">
              <Stop offset="0" color="var(--campus-gold-hi)" />
              <Stop offset=".5" color="var(--campus-gold)" />
              <Stop offset="1" color="var(--campus-gold-lo)" />
            </radialGradient>
            <radialGradient id={`${id}-ball-accent`} cx=".35" cy=".3" r=".75">
              <Stop offset="0" color="var(--campus-fb-accent-mist)" />
              <Stop offset=".55" color="var(--theme-accent)" />
              <Stop offset="1" color="var(--campus-accent-lo)" />
            </radialGradient>
            <radialGradient id={`${id}-ball-gold`} cx=".35" cy=".3" r=".75">
              <Stop offset="0" color="var(--campus-gold-hi)" />
              <Stop offset=".6" color="var(--campus-gold)" />
              <Stop offset="1" color="var(--campus-gold-lo)" />
            </radialGradient>
            <radialGradient id={`${id}-ball-mist`} cx=".35" cy=".3" r=".75">
              <Stop offset="0" color="var(--theme-surface)" />
              <Stop offset=".6" color="var(--campus-g5-haze)" />
              <Stop offset="1" color="var(--campus-fb-accent-mist)" />
            </radialGradient>
            <radialGradient id={`${id}-glow`} cx=".5" cy=".5" r=".5">
              <Stop offset="0" color="var(--campus-gold-hi)" opacity=".9" />
              <Stop offset=".45" color="var(--campus-gold-hi)" opacity=".3" />
              <Stop offset="1" color="var(--campus-gold-hi)" opacity="0" />
            </radialGradient>
            <radialGradient id={`${id}-halo`} cx=".5" cy=".5" r=".5">
              <Stop offset="0" color="var(--theme-accent)" opacity=".14" />
              <Stop offset="1" color="var(--theme-accent)" opacity="0" />
            </radialGradient>
            <filter id={`${id}-blur`} x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="12" /></filter>
          </defs>

          <ellipse cx={fx} cy={r2(H * 0.45)} rx={r2(rTop * 1.3)} ry={r2(H * 0.55)} fill={`url(#${id}-halo)`} />

          {/* 引线:漏斗侧面 → 右侧说明卡 */}
          {segs.map(s => {
            const y = r2((s.y0 + s.y1) / 2 + s.r1 * ryK * 0.5);
            const x0 = r2(fx + (s.r0 + s.r1) / 2 + 12);
            return (
              <g key={`l${s.i}`}>
                <line x1={x0} y1={y} x2={colX} y2={y} stroke="var(--theme-accent)" strokeOpacity=".45" strokeWidth="2" strokeDasharray="2 7" strokeLinecap="round" />
                <circle cx={x0} cy={y} r="4.5" fill="var(--theme-accent)" />
              </g>
            );
          })}

          {/* 出口:细管 + 落下的水滴 + 结果球与光晕 */}
          <rect x={r2(fx - spoutR)} y={r2(spoutY0 - 6)} width={r2(spoutR * 2)} height="44" fill={`url(#${id}-spout)`} />
          <ellipse cx={fx} cy={r2(spoutY0 + 38)} rx={spoutR} ry={r2(spoutR * ryK * 1.6)} fill={`url(#${id}-spout)`} />
          {[0, 1, 2].map(k => <circle key={k} cx={fx} cy={r2(spoutY0 + 58 + k * 13)} r={r2(4.5 - k)} fill="var(--campus-gold)" fillOpacity={0.9 - k * 0.25} />)}
          <circle cx={fx} cy={orbY} r={r2(orbR * 2)} fill={`url(#${id}-glow)`} />
          <ellipse cx={fx} cy={r2(orbY + orbR + 4)} rx={r2(orbR * 0.9)} ry="9" fill="var(--campus-gold-lo)" fillOpacity=".3" filter={`url(#${id}-blur)`} />
          <circle cx={fx} cy={orbY} r={orbR} fill={`url(#${id}-orb)`} />
          <ellipse cx={r2(fx - orbR * 0.3)} cy={r2(orbY - orbR * 0.48)} rx={r2(orbR * 0.42)} ry={r2(orbR * 0.22)} fill="var(--theme-surface)" fillOpacity=".55" />
          <circle cx={fx} cy={orbY} r={r2(orbR + 9)} fill="none" stroke="var(--campus-gold-line)" strokeWidth="2" strokeDasharray="2 7" strokeLinecap="round" />

          {/* 漏斗段:从下往上画,上一层压住下一层上表面的后半圈 */}
          {[...segs].reverse().map(s => (
            <g key={s.i}>
              <ellipse cx={r2(fx + 10)} cy={r2(s.y1 + 14)} rx={r2(s.r1 * 1.05)} ry={r2(s.r1 * ryK + 6)} fill="var(--theme-accent)" fillOpacity=".18" filter={`url(#${id}-blur)`} />
              <path d={sidePath(s)} fill={`url(#${id}-side-${s.i})`} />
              <path d={sidePath(s)} fill={`url(#${id}-gloss)`} opacity=".5" />
              <path d={`M ${r2(fx - s.r1)} ${s.y1} A ${s.r1} ${r2(s.r1 * ryK)} 0 0 0 ${r2(fx + s.r1)} ${s.y1}`} fill="none" stroke="var(--theme-surface)" strokeOpacity=".35" strokeWidth="2" />
              <ellipse cx={fx} cy={s.y0} rx={s.r0} ry={r2(s.r0 * ryK)} fill={`url(#${id}-top-${s.i})`} />
              {s.i === 0 && <ellipse cx={fx} cy={r2(s.y0 + 2)} rx={r2(s.r0 * 0.9)} ry={r2(s.r0 * ryK * 0.82)} fill={`url(#${id}-inner)`} />}
              <ellipse cx={fx} cy={s.y0} rx={s.r0} ry={r2(s.r0 * ryK)} fill="none" stroke="var(--theme-surface)" strokeWidth="2.5" />
            </g>
          ))}

          {/* 漏斗口上方待筛选的小球 */}
          {BALLS.map(([dx, dy, r, tone], k) => (
            <g key={k}>
              <circle cx={r2(fx + dx * rTop * 0.82)} cy={r2(topY + dy * 60 + 10)} r={r} fill={`url(#${id}-ball-${tone})`} />
              <circle cx={r2(fx + dx * rTop * 0.82 - r * 0.32)} cy={r2(topY + dy * 60 + 10 - r * 0.34)} r={r2(r * 0.3)} fill="var(--theme-surface)" fillOpacity=".7" />
            </g>
          ))}
          <Sparkles points={[[r2(fx + orbR + 46), r2(orbY - 36), 10, 'star', 'gold'], [r2(fx - orbR - 40), r2(orbY - 20), 8, 'star', 'gold'], [r2(fx - orbR - 24), r2(orbY + 30), 5, 'dot', 'gold']]} />
        </svg>

        {segs.map(s => (
          <div key={`f${s.i}`} className={`cp-g5-fn-face campus-rise${s.light ? ' is-light' : ''}`} style={{ left: fx, top: r2((s.y0 + s.y1) / 2 + s.r1 * ryK * 0.5), '--cp-g5-fn-num': `${n >= 5 ? 34 : 40}px`, ...enterDelay(2 + s.i) }}>
            <div className="cp-g5-fn-name">{s.ly?.name}</div>
            <div className="cp-g5-fn-value">{s.ly?.value}</div>
            <div className="cp-g5-fn-unit">{s.ly?.unit}</div>
          </div>
        ))}
        {segs.map(s => (
          <div key={`r${s.i}`} className="cp-g5-fn-row cp-g5-glass campus-rise" style={{ left: colX, right: 0, top: r2((s.y0 + s.y1) / 2 + s.r1 * ryK * 0.5), maxHeight: r2(th + gap - 4), ...enterDelay(3 + s.i) }}>
            <NoSeal no={s.ly?.no} />
            <div className="cp-g5-fn-row-body">
              <p className="cp-g5-fn-desc">{s.ly?.desc}</p>
              <div className="cp-g5-fn-bar" aria-hidden="true"><div className="cp-g5-fn-bar-fill campus-draw" style={{ width: `${s.ratio}%`, ...enterDelay(5 + s.i) }} /></div>
            </div>
          </div>
        ))}
        {segs.slice(1).map(s => (s.ly?.filter ? (
          <div key={`c${s.i}`} className="cp-g5-fn-filter campus-rise" style={{ left: colX - 14, top: r2(s.y0 - gap / 2 + 2), ...enterDelay(4 + s.i) }}>
            <svg className="cp-g5-fn-filter-arrow" width="14" height="16" viewBox="0 0 14 16" aria-hidden="true"><path d="M7 1 V12 M2 8 L7 14 L12 8" stroke="currentColor" strokeWidth="2.6" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
            <div>{s.ly.filter}</div>
          </div>
        ) : null))}

        <div className="cp-g5-fn-result campus-rise" style={{ left: fx, top: orbY, ...enterDelay(8) }}>
          <div className="cp-g5-fn-result-value">{p.resultValue}</div>
          <div className="cp-g5-fn-result-unit">{p.resultUnit}</div>
        </div>
        <div className="cp-g5-fn-result-card campus-rise" style={{ left: r2(fx + orbR * 2 + 34), right: 0, top: orbY, ...enterDelay(9) }}>
          <KickerChip text={p.resultLabel} gold />
          <p className="cp-g5-fn-result-text">{p.resultText}</p>
        </div>
        <div className="cp-g5-fn-note campus-fade" style={enterDelay(2)}>{p.note}</div>
      </div>
    </CampusFrame>
  );
}

FunnelLayers.META = {
  id: 'funnel-layers',
  label: '特色 · 立体漏斗',
  roles: ['process', 'distribution', 'result'],
  defaults: DEFAULTS,
  copyBudgets: { title: 22, 'layers[].no': 2, note: 12, resultLabel: 6, resultValue: 5, resultUnit: 3, resultText: 32, 'layers[].name': 5, 'layers[].value': 5, 'layers[].unit': 2, 'layers[].filter': 12, 'layers[].desc': 34 },
  controls: [
    { ...CHAPTER_CONTROL, default: 1 },
    { key: 'layerCount', type: 'number', label: '层数', default: 4, min: 3, max: 5, description: '漏斗的层数与右侧说明卡数量;第二层起每层可写一条筛选条件(filter),标在与上一层之间。' },
  ],
};
