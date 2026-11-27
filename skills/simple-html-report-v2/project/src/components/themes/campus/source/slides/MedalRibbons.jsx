// 立体勋章:3–5 枚带绶带的立体勋章挂在一根金属横杆上横排——波纹金边、浮雕环、珐琅章面和高光,绶带是校色条纹;
// 章面上是大数字(或短词)+ 单位,章下是成果名与一句说明。单数枚时中间一枚放大成暖金主章,两侧配月桂枝与放射光。
// 适合成果亮点、获奖、核心指标。
// 勋章、绶带、月桂都是不含文字的 SVG 图形;数字、单位、成果名、说明都是叠在上面的水平 HTML 文本。
import React from 'react';
import { useThemeStyle, enterDelay } from '../../../shared/style.jsx';
import { safeArray, safeRatio, clamp } from '../../../chart-safety.mjs';
import { CampusFrame, TitleRow, CHAPTER_CONTROL, TITLE_ROW_SPACE, useCampusLayout, textWidthEm } from '../kit/chrome.jsx';
import { useSvgId, ToneDefs, Stop, arcPath, pt, r2 } from '../kit/feature-b.jsx';
import { useFeatureDStyle, MetalDefs, scallopPath, polyPath } from '../kit/feature-d.jsx';

const DEFAULTS = {
  chapterIndex: 4,
  medalCount: 5,
  featureCenter: true,
  sectionNo: '4.2',
  title: '成果与开源：毕设博客累计阅读量超过 45000',
  medals: [
    { value: '27,256', unit: '次阅读', name: '技术平台一', desc: '毕设系列博客在第一个平台的阅读量。' },
    { value: '8,823', unit: '次阅读', name: '技术平台二', desc: '同一系列文章在第二个平台的阅读量。' },
    { value: '45000+', unit: '累计阅读', name: '博客累计阅读量', desc: '三个技术平台合计，系列文章持续被检索与引用。' },
    { value: '10,863', unit: '次阅读', name: '技术平台三', desc: '同一系列文章在第三个平台的阅读量。' },
    { value: '开源', unit: '代码与环境', name: '代码与环境开源', desc: '开发环境发布到 dockerhub，毕设代码开源在 GitHub。' },
  ],
};

const CSS = `
.cp-g6-md{position:relative;flex:1;min-height:0;}
.cp-g6-md-face{position:absolute;transform:translate(-50%,-50%);display:flex;flex-direction:column;align-items:center;gap:6px;text-align:center;}
.cp-g6-md-value{font-family:var(--theme-font-serif);font-weight:700;line-height:1;letter-spacing:.01em;color:var(--theme-on-accent);font-variant-numeric:lining-nums;white-space:nowrap;}
.cp-g6-md-unit{font-weight:700;font-size:19px;line-height:1.2;letter-spacing:.1em;color:var(--campus-on-accent-muted);white-space:nowrap;}
.cp-g6-md-face.is-gold .cp-g6-md-value{color:var(--campus-gold-deep);}
.cp-g6-md-face.is-gold .cp-g6-md-unit{color:var(--campus-gold-deep);opacity:.8;}
.cp-g6-md-text{position:absolute;transform:translateX(-50%);display:flex;flex-direction:column;align-items:center;gap:10px;text-align:center;}
.cp-g6-md-name{font-family:var(--theme-font-serif);font-weight:700;font-size:28px;line-height:1.25;letter-spacing:.04em;color:var(--theme-accent);}
.cp-g6-md-text.is-gold .cp-g6-md-name{color:var(--campus-gold-ink);font-size:32px;}
.cp-g6-md-rule{display:flex;align-items:center;gap:10px;}
.cp-g6-md-rule-line{width:46px;height:2px;border-radius:1px;background:var(--campus-accent-line);}
.cp-g6-md-rule-mark{width:9px;height:9px;border-radius:2px;background:var(--campus-spark);transform:rotate(45deg);}
.cp-g6-md-desc{font-size:21px;line-height:1.55;color:var(--theme-muted);text-wrap:pretty;}
`;

/** 一片月桂叶(以叶柄为原点、叶尖朝上的路径)。 */
const LEAF = 'M 0 0 Q -9 -14 0 -30 Q 9 -14 0 0 Z';

export function MedalRibbons(props) {
  useThemeStyle('campus-medal-ribbons-style', CSS);
  useFeatureDStyle();
  const p = { ...DEFAULTS, ...props };
  const id = useSvgId('cp-g6-md');
  const { bodyW, bodyH } = useCampusLayout();
  const medals = safeArray(p.medals).slice(0, clamp(Math.round(p.medalCount) || 5, 3, 5));
  const n = clamp(medals.length, 3, 5);
  const W = bodyW;
  const H = bodyH - TITLE_ROW_SPACE;
  const featured = p.featureCenter !== false && n % 2 === 1 ? (n - 1) / 2 : -1;
  const slot = W / n;
  const rodY = 22;
  const textH = 196;
  // 勋章直径:受每格宽度与可用高度约束;主章放大 1.24 倍。绶带长度吃掉剩余高度,让整组上下撑满。
  const scale = featured >= 0 ? 1.24 : 1;
  const D = Math.round(clamp(Math.min(slot * 0.72, (H - rodY - textH - 130) / scale), 150, 280));
  const DF = Math.round(D * scale);
  const ribbonLen = Math.round(clamp(H - rodY - DF - textH - 40, 96, 210));
  const items = medals.map((m, i) => {
    const big = i === featured;
    const d = big ? DF : D;
    const x = r2(slot * (i + 0.5));
    const cy = r2(rodY + ribbonLen + DF / 2 + (big ? 0 : (DF - D) * 0.2));
    const faceW = d * 0.62;
    const value = String(m?.value ?? '');
    const fs = Math.round(Math.min(d * (big ? 0.24 : 0.22), safeRatio(faceW, textWidthEm(value) || 1, 60) * 0.98));
    return { ...m, i, big, d, r: d / 2, x, cy, fs };
  });
  const textTop = r2(rodY + ribbonLen + DF + 30);
  const textW = Math.round(Math.min(slot - 36, 400));

  const ribbon = (it) => {
    const w = it.big ? 66 : 54;
    const top = rodY;
    const y = it.cy - it.r * 0.35;
    const l = [{ x: it.x - it.r * 0.78, y: top }, { x: it.x - it.r * 0.78 + w, y: top }, { x: it.x + w * 0.5, y }, { x: it.x - w * 0.5, y }];
    const rr = [{ x: it.x + it.r * 0.78 - w, y: top }, { x: it.x + it.r * 0.78, y: top }, { x: it.x + w * 0.5, y }, { x: it.x - w * 0.5, y }];
    return { l, r: rr, w };
  };
  // 月桂枝:主章左右各一枝,从下方向上沿章边弯上去,叶片内外交错。
  const leaves = (it, side) => {
    const out = [];
    const R = it.r + 32;
    for (let k = 0; k < 8; k += 1) {
      const a = side > 0 ? 138 - k * 13 : 222 + k * 13;
      const outer = k % 2 === 0;
      const q = pt(it.x, it.cy, R + (outer ? 7 : -5), a);
      const along = side > 0 ? a - 90 : a + 90;
      out.push({ x: q.x, y: q.y, rot: r2(along + (outer ? 34 : -34) * side), s: 1.25 + k * 0.06, k });
    }
    return out;
  };
  return (
    <CampusFrame chapterIndex={p.chapterIndex}>
      <TitleRow no={p.sectionNo} title={p.title} className="campus-rise" style={enterDelay(0)} />
      <div className="cp-g6-md">
        <svg className="cp-g6-svg campus-fade" style={{ left: 0, top: 0, width: W, height: H, ...enterDelay(1) }} viewBox={`0 0 ${W} ${H}`} aria-hidden="true">
          <ToneDefs id={id} tones={['accent', 'gold']} />
          <MetalDefs id={id} />
          <defs>
            <linearGradient id={`${id}-strap`} x1="0" y1="0" x2="1" y2="0">
              <Stop offset="0" color="var(--campus-accent-lo)" />
              <Stop offset=".28" color="var(--theme-accent)" />
              <Stop offset=".29" color="var(--campus-gold-hi)" />
              <Stop offset=".37" color="var(--campus-gold)" />
              <Stop offset=".38" color="var(--campus-accent-hi)" />
              <Stop offset=".62" color="var(--campus-accent-hi)" />
              <Stop offset=".63" color="var(--campus-gold)" />
              <Stop offset=".71" color="var(--campus-gold-hi)" />
              <Stop offset=".72" color="var(--theme-accent)" />
              <Stop offset="1" color="var(--campus-accent-lo)" />
            </linearGradient>
            <radialGradient id={`${id}-rays`} cx=".5" cy=".5" r=".5">
              <Stop offset="0" color="var(--campus-gold)" opacity=".34" />
              <Stop offset="1" color="var(--campus-gold)" opacity="0" />
            </radialGradient>
          </defs>
          {/* 主章背后的放射光 */}
          {items.filter(it => it.big).map(it => (
            <g key="rays">
              <circle cx={it.x} cy={it.cy} r={r2(it.r * 2.1)} fill={`url(#${id}-halo)`} />
              {Array.from({ length: 24 }, (_, k) => {
                const a0 = k * 15;
                const p0 = pt(it.x, it.cy, it.r * 2, a0 - 3);
                const p1 = pt(it.x, it.cy, it.r * 2, a0 + 3);
                return <path key={k} d={polyPath([{ x: it.x, y: it.cy }, p0, p1])} fill={`url(#${id}-rays)`} opacity={k % 2 ? 0.5 : 1} />;
              })}
            </g>
          ))}
          {/* 横杆 */}
          <rect x={r2(slot * 0.5 - 140)} y={r2(rodY - 6)} width={r2(W - slot + 280)} height="12" rx="6" fill={`url(#${id}-metal-gold-v)`} />
          <rect x={r2(slot * 0.5 - 140)} y={r2(rodY - 4)} width={r2(W - slot + 280)} height="3" rx="1.5" fill="var(--theme-surface)" fillOpacity=".6" />
          {[r2(slot * 0.5 - 146), r2(W - slot * 0.5 + 146)].map((x, k) => <circle key={k} cx={x} cy={rodY} r="12" fill={`url(#${id}-disc-gold)`} />)}
          {items.map(it => {
            const rb = ribbon(it);
            const tone = it.big ? 'gold' : 'accent';
            const scal = scallopPath(it.x, it.cy, it.r, it.big ? 36 : 30, it.big ? 5 : 4.5);
            return (
              <g key={it.i}>
                {/* 绶带:左右两条交叉的条纹带,内侧压暗表示折叠 */}
                <path d={polyPath(rb.r)} fill={`url(#${id}-strap)`} />
                <path d={polyPath(rb.r)} fill="var(--theme-ink)" fillOpacity=".22" />
                <path d={polyPath(rb.l)} fill={`url(#${id}-strap)`} />
                <path d={polyPath([rb.l[0], rb.l[1], { x: (rb.l[1].x + rb.l[2].x) / 2, y: (rb.l[1].y + rb.l[2].y) / 2 }, { x: (rb.l[0].x + rb.l[3].x) / 2, y: (rb.l[0].y + rb.l[3].y) / 2 }])} fill="var(--theme-surface)" fillOpacity=".12" />
                <rect x={r2(rb.l[0].x - 4)} y={r2(rodY - 10)} width={r2(rb.w + 8)} height="20" rx="5" fill={`url(#${id}-metal-accent)`} />
                <rect x={r2(rb.r[0].x - 4)} y={r2(rodY - 10)} width={r2(rb.w + 8)} height="20" rx="5" fill={`url(#${id}-metal-accent)`} />
                {/* 吊环 */}
                <ellipse cx={it.x} cy={r2(it.cy - it.r - 4)} rx="16" ry="12" fill="none" stroke={`url(#${id}-metal-gold)`} strokeWidth="7" />
                {/* 章体:投影 → 波纹金边 → 浮雕环 → 珐琅章面 → 高光 */}
                <circle cx={r2(it.x + 8)} cy={r2(it.cy + 14)} r={r2(it.r)} fill="var(--theme-ink)" fillOpacity=".2" />
                <path d={scal} fill={`url(#${id}-metal-gold)`} />
                <path d={scal} fill="none" stroke="var(--campus-gold-hi)" strokeWidth="1.5" strokeOpacity=".8" />
                <circle cx={it.x} cy={it.cy} r={r2(it.r * 0.86)} fill={`url(#${id}-metal-gold-v)`} />
                <circle cx={it.x} cy={it.cy} r={r2(it.r * 0.86)} fill="none" stroke="var(--campus-gold-deep)" strokeOpacity=".5" strokeWidth="2" />
                {Array.from({ length: it.big ? 28 : 22 }, (_, k) => {
                  const q = pt(it.x, it.cy, it.r * 0.81, k * (360 / (it.big ? 28 : 22)));
                  return <circle key={k} cx={q.x} cy={q.y} r={it.big ? 2.6 : 2.2} fill="var(--campus-gold-hi)" />;
                })}
                <circle cx={it.x} cy={it.cy} r={r2(it.r * 0.75)} fill="var(--campus-gold-deep)" fillOpacity=".55" />
                <circle cx={it.x} cy={it.cy} r={r2(it.r * 0.73)} fill={`url(#${id}-disc-${tone})`} />
                <circle cx={it.x} cy={it.cy} r={r2(it.r * 0.73)} fill={`url(#${id}-gloss)`} />
                <circle cx={it.x} cy={it.cy} r={r2(it.r * 0.64)} fill="none" stroke="var(--theme-surface)" strokeOpacity=".4" strokeWidth="1.5" strokeDasharray="2 6" strokeLinecap="round" />
                <path d={`M ${r2(it.x - it.r * 0.55)} ${r2(it.cy - it.r * 0.18)} A ${r2(it.r * 0.6)} ${r2(it.r * 0.6)} 0 0 1 ${r2(it.x + it.r * 0.2)} ${r2(it.cy - it.r * 0.6)}`} fill="none" stroke="var(--theme-surface)" strokeOpacity=".55" strokeWidth="5" strokeLinecap="round" />
                {it.big ? [-1, 1].map(side => <path key={`stem${side}`} d={side > 0 ? arcPath(it.x, it.cy, it.r + 32, 40, 142) : arcPath(it.x, it.cy, it.r + 32, 218, 320)} fill="none" stroke="var(--campus-gold-lo)" strokeWidth="3" strokeLinecap="round" />) : null}
                {it.big ? [-1, 1].map(side => leaves(it, side).map(lf => (
                  <path key={`${side}-${lf.k}`} d={LEAF} transform={`translate(${lf.x} ${lf.y}) rotate(${lf.rot}) scale(${r2(lf.s)})`} fill={lf.k % 2 ? 'var(--campus-gold-lo)' : `url(#${id}-metal-gold)`} />
                ))) : null}
              </g>
            );
          })}
        </svg>

        {items.map(it => (
          <div className={`cp-g6-md-face campus-fade${it.big ? ' is-gold' : ''}`} style={{ left: it.x, top: it.cy, ...enterDelay(3 + it.i) }} key={`f${it.i}`}>
            <div className="cp-g6-md-value" style={{ fontSize: it.fs }}>{it.value}</div>
            <div className="cp-g6-md-unit">{it.unit}</div>
          </div>
        ))}
        {items.map(it => (
          <div className={`cp-g6-md-text campus-rise${it.big ? ' is-gold' : ''}`} style={{ left: it.x, top: textTop, width: textW, ...enterDelay(4 + it.i) }} key={`t${it.i}`}>
            <h3 className="cp-g6-md-name">{it.name}</h3>
            <div className="cp-g6-md-rule" aria-hidden="true">
              <div className="cp-g6-md-rule-line" />
              <div className="cp-g6-md-rule-mark" />
              <div className="cp-g6-md-rule-line" />
            </div>
            <p className="cp-g6-md-desc">{it.desc}</p>
          </div>
        ))}
      </div>
    </CampusFrame>
  );
}

MedalRibbons.META = {
  id: 'medal-ribbons',
  label: '特色 · 立体勋章成果',
  roles: ['result', 'metrics', 'case'],
  defaults: DEFAULTS,
  copyBudgets: { title: 28, 'medals[].value': 6, 'medals[].unit': 5, 'medals[].name': 8, 'medals[].desc': 30 },
  controls: [
    { ...CHAPTER_CONTROL },
    { key: 'medalCount', type: 'number', label: '勋章数量', default: 5, min: 3, max: 5, countArrays: ['medals'], description: '横排的勋章枚数。' },
    { key: 'featureCenter', type: 'toggle', label: '中间主章', default: true, description: '枚数为单数时,把正中间一枚放大成暖金主章(配月桂枝与放射光);枚数为双数时不生效。' },
  ],
};
