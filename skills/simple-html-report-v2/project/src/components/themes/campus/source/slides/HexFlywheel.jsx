// 立体六边形飞轮:左侧 3–4 枚立体玻璃六边柱互相咬合成一组(之间有循环箭头,外圈一道旋转轨道),
// 右侧同样数量的渐变箭头块从左到右递进,下面是对应的编号卡,底部一道双向箭头写循环说明。
// 适合「几个环节互相带动、转一圈又回到起点」的研究路线、机制、方法论。
import React from 'react';
import { useThemeStyle, enterDelay } from '../../../shared/style.jsx';
import { safeArray, clamp } from '../../../chart-safety.mjs';
import { CampusFrame, TitleRow, CHAPTER_CONTROL, TITLE_ROW_SPACE, useCampusLayout } from '../kit/chrome.jsx';
import { NumberCard } from '../kit/parts.jsx';
import { useFeatureBStyle, useSvgId, ToneDefs, HexPrism, arcPath, arcHead, r2 } from '../kit/feature-b.jsx';

const DEFAULTS = {
  chapterIndex: 2,
  stageCount: 3,
  sectionNo: '2.1',
  title: '研究路线：三个环节循环推进',
  badge: '研究路线',
  lead: '以「分析问题 → 搭建平台 → 解决问题」为主线，每一轮的性能分析结果再回到问题分析。',
  loopNote: '逐轮迭代 · 持续逼近研究目标',
  stages: [
    { no: '01', name: '分析问题', goal: '复杂环境下观测量异常时，如何连续、精确地定位', title: '影响机理分析', desc: '分析观测量对跟踪环路和定位精度的影响，梳理限制相干积分时间的因素。' },
    { no: '02', name: '搭建平台', goal: '为算法验证准备可复现的软件仿真环境', title: '软件仿真平台', desc: '由软件接收机、惯导解算与导航滤波器三部分组成，是本研究的难点之一。' },
    { no: '03', name: '解决问题', goal: '优化导航滤波器，提高抗差能力与灵敏度', title: '抗差与灵敏度', desc: '以权函数抗差优化导航滤波器；用最大似然估计与惯导辅助提高灵敏度。' },
    { no: '04', name: '性能分析', goal: '检验改进效果，把新问题带回下一轮', title: '总结与展望', desc: '对照改进前后的定位结果评估性能，总结结论并提出后续研究方向。' },
  ],
};

const TONES = ['accent', 'mist', 'gold', 'accent'];
const SQ3 = 1.7320508;

const CSS = `
.cp-hf{flex:1;min-height:0;display:flex;gap:44px;}
.cp-hf-left{position:relative;flex:none;height:100%;}
.cp-hf-hex-text{position:absolute;transform:translate(-50%,-50%);display:flex;flex-direction:column;align-items:center;gap:12px;}
.cp-hf-hex-no{font-family:var(--theme-font-serif);font-weight:700;font-size:58px;line-height:1;color:var(--theme-on-accent);font-variant-numeric:lining-nums;letter-spacing:.02em;}
.cp-hf-hex-text.is-gold .cp-hf-hex-no{color:var(--campus-gold-deep);}
.cp-hf-hex-name{display:flex;align-items:center;height:44px;padding:0 20px;border-radius:999px;background:rgb(0 0 0 / .26);border:1.5px solid rgb(255 255 255 / .45);color:var(--theme-on-accent);font-weight:700;font-size:22px;letter-spacing:.08em;white-space:nowrap;}
.cp-hf.is-4 .cp-hf-hex-no{font-size:46px;}
.cp-hf.is-4 .cp-hf-hex-name{height:40px;padding:0 16px;font-size:21px;}
.cp-hf-badge{position:absolute;left:0;top:0;isolation:isolate;display:flex;align-items:center;height:62px;padding:0 28px;color:var(--theme-on-accent);font-family:var(--theme-font-serif);font-weight:700;font-size:28px;letter-spacing:.1em;white-space:nowrap;}
.cp-hf-badge-shape{position:absolute;inset:0;z-index:-1;border-radius:16px;background:var(--campus-fill);box-shadow:var(--campus-shadow-lift);}
.cp-hf-badge-tail{position:absolute;z-index:-1;left:34px;bottom:-15px;width:24px;height:16px;background:var(--theme-accent);clip-path:polygon(0 0,100% 0,20% 100%);}
.cp-hf-right{flex:1;min-width:0;display:grid;grid-template-rows:auto auto auto auto;align-content:center;row-gap:26px;padding-bottom:10px;}
.cp-hf-lead{position:relative;padding:4px 0 4px 26px;font-size:23px;line-height:1.6;color:var(--theme-ink);text-wrap:pretty;}
.cp-hf-lead::before{content:'';position:absolute;left:0;top:6px;bottom:6px;width:6px;border-radius:3px;background:var(--campus-fill-bar);}
.cp-hf-arrows,.cp-hf-cards{display:grid;column-gap:22px;}
.cp-hf-arrow{position:relative;isolation:isolate;min-height:172px;display:flex;flex-direction:column;justify-content:center;gap:12px;padding:20px 64px 20px 26px;}
.cp-hf-arrow-shape{position:absolute;inset:0;z-index:-1;background:linear-gradient(90deg,rgb(var(--theme-accent-rgb) / .04) 0%,rgb(var(--theme-accent-rgb) / .16) 58%,rgb(var(--theme-accent-rgb) / .72) 80%,var(--theme-accent) 100%);clip-path:polygon(0 0,calc(100% - 52px) 0,100% 50%,calc(100% - 52px) 100%,0 100%,22px 50%);}
.cp-hf-arrow.is-gold .cp-hf-arrow-shape{background:linear-gradient(90deg,rgb(var(--campus-gold-rgb) / .06) 0%,rgb(var(--campus-gold-rgb) / .24) 58%,rgb(var(--campus-gold-rgb) / .8) 80%,var(--campus-gold) 100%);}
.cp-hf-arrow.is-mist .cp-hf-arrow-shape{background:linear-gradient(90deg,rgb(var(--theme-accent-rgb) / .03) 0%,rgb(var(--theme-accent-rgb) / .1) 58%,rgb(var(--theme-accent-rgb) / .45) 80%,var(--campus-fb-accent-mist) 100%);}
.cp-hf-arrow-gloss{position:absolute;left:0;right:0;top:0;height:50%;z-index:-1;background:linear-gradient(180deg,rgb(255 255 255 / .5) 0%,rgb(255 255 255 / 0) 100%);clip-path:polygon(0 0,calc(100% - 52px) 0,100% 100%,11px 100%);}
.cp-hf-arrow-tag{align-self:flex-start;display:flex;align-items:center;height:40px;padding:0 18px;margin-left:12px;border-radius:999px;background:var(--campus-fill);color:var(--theme-on-accent);font-weight:700;font-size:21px;letter-spacing:.08em;white-space:nowrap;box-shadow:0 6px 14px rgb(var(--theme-accent-rgb) / .22);}
.cp-hf-arrow.is-gold .cp-hf-arrow-tag{background:var(--campus-gold-fill);color:var(--campus-gold-deep);box-shadow:0 6px 14px rgb(var(--campus-gold-rgb) / .3);}
.cp-hf-arrow-goal{margin-left:12px;font-size:22px;line-height:1.5;color:var(--theme-ink);font-weight:600;text-wrap:pretty;}
.cp-hf-card{display:flex;flex-direction:column;min-height:250px;}
.cp-hf-card .campus-ncard-title{font-size:26px;}
.cp-hf-card .campus-ncard-no{font-size:34px;}
.cp-hf-card.is-gold .campus-ncard-head > .campus-ncard-shape{background:var(--campus-gold-fill);}
.cp-hf-card.is-gold .campus-ncard-head{color:var(--campus-gold-deep);}
.cp-hf-card.is-gold .campus-ncard-head .campus-ncard-title{color:var(--campus-gold-deep);}
.cp-hf-card.is-gold .campus-ncard-head-rule{background:rgb(0 0 0 / .18);}
.cp-hf-card.is-mist .campus-ncard-head > .campus-ncard-shape{background:linear-gradient(135deg,var(--campus-accent-hi) 0%,var(--campus-fb-accent-mist) 100%);}
.cp-hf-desc{padding:22px 26px 22px;font-size:23px;line-height:1.62;color:var(--theme-muted);text-wrap:pretty;}
.cp-hf.is-4 .cp-hf-desc{padding:16px 20px 0;font-size:21px;line-height:1.55;}
.cp-hf.is-4 .cp-hf-arrow{padding-right:58px;}
.cp-hf.is-4 .cp-hf-card .campus-ncard-title{font-size:24px;}
.cp-hf.is-4 .cp-hf-card .campus-ncard-head{padding:12px 22px 18px 18px;gap:12px;}
.cp-hf-loop{position:relative;display:flex;align-items:center;justify-content:center;height:56px;}
.cp-hf-loop svg{position:absolute;inset:0;width:100%;height:100%;overflow:visible;}
.cp-hf-loop-text{position:relative;display:flex;align-items:center;height:48px;padding:0 30px;border-radius:999px;background:var(--campus-fill);color:var(--theme-on-accent);font-weight:700;font-size:21px;letter-spacing:.08em;white-space:nowrap;box-shadow:var(--campus-shadow-lift);}
`;

// 尖顶六边形的中心排布(以边长 1 为单位):3 枚呈品字,4 枚呈菱形;循环顺序即数组顺序。
const LAYOUTS = {
  3: [{ x: 0, y: 0 }, { x: SQ3 / 2, y: -1.5 }, { x: SQ3, y: 0 }],
  4: [{ x: 0, y: 0 }, { x: SQ3 / 2, y: -1.5 }, { x: SQ3, y: 0 }, { x: SQ3 / 2, y: 1.5 }],
};
const DEPTH = 0.42;

export function HexFlywheel(props) {
  useThemeStyle('campus-hex-flywheel-style', CSS);
  useFeatureBStyle();
  const p = { ...DEFAULTS, ...props };
  const id = useSvgId('cp-hf');
  const { bodyW, bodyH } = useCampusLayout();
  const stages = safeArray(p.stages).slice(0, clamp(Math.round(p.stageCount) || 3, 3, 4));
  const n = stages.length === 4 ? 4 : 3;
  const layout = LAYOUTS[n];
  const H = bodyH - TITLE_ROW_SPACE;
  // 六边形边长:按左栏可用宽度(正文宽的 38%)和高度共同约束;组团高度 = 中心纵向跨度 + 2 倍边长 + 侧壁。
  const spanY = n === 4 ? 3 : 1.5;
  const s = Math.floor(Math.min((bodyW * 0.38) / (2 * SQ3 + 0.25), (H - 70) / (spanY + 2 + DEPTH)));
  const depth = Math.round(s * DEPTH);
  const clusterW = Math.round(s * (2 * SQ3 + 0.25));
  const LW = clusterW + 24;
  const ox = Math.round(LW / 2 - (SQ3 / 2) * s);
  // 组团纵向居中(顶部让出一点给气泡标签):最上面一枚的顶点在 oy - 2.5s。
  const oy = Math.round((H - (spanY + 2) * s - depth) / 2 + 2.5 * s + 24);
  const hexes = layout.map((q, i) => ({ i, cx: r2(ox + q.x * s), cy: r2(oy + q.y * s), tone: TONES[i] }));
  // 绘制顺序:靠上的先画(在后面),靠下的后画(在前面)。
  const order = [...hexes].sort((a, b) => a.cy - b.cy || a.cx - b.cx);
  const gx = r2(hexes.reduce((a, h) => a + h.cx, 0) / n);
  const gy = r2(hexes.reduce((a, h) => a + h.cy, 0) / n + depth * 0.4);
  const orbitR = r2(Math.min(n === 4 ? s * 2.6 : s * 2.0, LW / 2 + 6, H - gy - 4));
  const arrows = hexes.map((h, i) => {
    const next = hexes[(i + 1) % n];
    const mx = (h.cx + next.cx) / 2;
    const my = (h.cy + next.cy) / 2;
    const deg = Math.atan2(next.cy - h.cy, next.cx - h.cx) * 180 / Math.PI;
    return { mx: r2(mx), my: r2(my), deg: r2(deg), tone: next.tone };
  });
  const L = r2(s * 0.62);
  const w = r2(s * 0.13);
  const hw = r2(s * 0.27);
  const head = r2(s * 0.26);
  const arrowShape = `${-L / 2},${-w} ${L / 2 - head},${-w} ${L / 2 - head},${-hw} ${L / 2},0 ${L / 2 - head},${hw} ${L / 2 - head},${w} ${-L / 2},${w}`;
  const cols = { gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` };
  return (
    <CampusFrame chapterIndex={p.chapterIndex}>
      <TitleRow no={p.sectionNo} title={p.title} className="campus-rise" style={enterDelay(0)} />
      <div className={`cp-hf is-${n}`}>
        <div className="cp-hf-left" style={{ width: LW }}>
          <svg className="cp-fb-svg campus-fade" style={{ left: 0, top: 0, width: LW, height: H, ...enterDelay(1) }} viewBox={`0 0 ${LW} ${H}`} aria-hidden="true">
            <ToneDefs id={id} tones={['accent', 'mist', 'gold']} />
            <circle cx={gx} cy={gy} r={orbitR} fill="none" stroke="var(--campus-accent-line)" strokeWidth="2" strokeDasharray="2 10" strokeLinecap="round" />
            <path d={arcPath(gx, gy, orbitR, 252, 300)} fill="none" stroke="var(--theme-accent)" strokeWidth="4" strokeLinecap="round" />
            <polygon points={arcHead(gx, gy, orbitR, 300, 1, 13)} fill="var(--theme-accent)" />
            <path d={arcPath(gx, gy, orbitR, 20, 70)} fill="none" stroke="var(--campus-gold)" strokeWidth="4" strokeLinecap="round" />
            <polygon points={arcHead(gx, gy, orbitR, 70, 1, 13)} fill="var(--campus-gold)" />
            {order.map(h => <HexPrism key={h.i} id={id} cx={h.cx} cy={h.cy} r={s * 0.985} depth={depth} tone={h.tone} corner={s * 0.06} />)}
            {arrows.map((a, i) => (
              <g key={i} transform={`translate(${a.mx} ${a.my}) rotate(${a.deg})`}>
                <polygon points={arrowShape} transform="translate(3 6)" fill="var(--theme-ink)" fillOpacity=".18" />
                <polygon points={arrowShape} fill={`url(#${id}-${a.tone}-face)`} stroke="var(--theme-surface)" strokeWidth="3" strokeLinejoin="round" />
              </g>
            ))}
          </svg>
          <div className="cp-hf-badge campus-rise" style={{ top: Math.max(0, Math.round(oy - 1.5 * s - s - 40)), left: 0, ...enterDelay(2) }}>
            <div className="cp-hf-badge-shape" aria-hidden="true" />
            <div className="cp-hf-badge-tail" aria-hidden="true" />
            <div>{p.badge}</div>
          </div>
          {hexes.map(h => (
            <div className={`cp-hf-hex-text campus-fade${h.tone === 'gold' ? ' is-gold' : ''}`} key={h.i} style={{ left: h.cx, top: h.cy - s * 0.12, ...enterDelay(3 + h.i) }}>
              <div className="cp-hf-hex-no">{stages[h.i]?.no}</div>
              <div className="cp-hf-hex-name">{stages[h.i]?.name}</div>
            </div>
          ))}
        </div>
        <div className="cp-hf-right">
          <p className="cp-hf-lead campus-rise" style={enterDelay(2)}>{p.lead}</p>
          <div className="cp-hf-arrows" style={cols}>
            {stages.map((st, i) => (
              <div className={`cp-hf-arrow is-${TONES[i]} campus-rise`} key={i} style={enterDelay(3 + i)}>
                <div className="cp-hf-arrow-shape" aria-hidden="true" />
                <div className="cp-hf-arrow-gloss" aria-hidden="true" />
                <div className="cp-hf-arrow-tag">{st?.name}</div>
                <p className="cp-hf-arrow-goal">{st?.goal}</p>
              </div>
            ))}
          </div>
          <div className="cp-hf-cards" style={cols}>
            {stages.map((st, i) => (
              <NumberCard variant="head" key={i} no={st?.no} title={st?.title} className={`cp-hf-card is-${TONES[i]} campus-rise`} style={enterDelay(5 + i)}>
                <p className="cp-hf-desc">{st?.desc}</p>
              </NumberCard>
            ))}
          </div>
          <div className="cp-hf-loop campus-rise" style={enterDelay(9)}>
            <svg viewBox="0 0 1000 56" preserveAspectRatio="none" aria-hidden="true">
              <line x1="16" y1="28" x2="984" y2="28" stroke="var(--campus-accent-line)" strokeWidth="3" />
              <polygon points="0,28 22,16 22,40" fill="var(--theme-accent)" />
              <polygon points="1000,28 978,16 978,40" fill="var(--theme-accent)" />
            </svg>
            <div className="cp-hf-loop-text">{p.loopNote}</div>
          </div>
        </div>
      </div>
    </CampusFrame>
  );
}

HexFlywheel.META = {
  id: 'hex-flywheel',
  label: '特色 · 立体六边形飞轮',
  roles: ['process', 'relationship', 'context'],
  defaults: DEFAULTS,
  copyBudgets: { badge: 6, lead: 48, loopNote: 22, 'stages[].name': 5, 'stages[].goal': 24, 'stages[].title': 7, 'stages[].desc': 40 },
  controls: [
    { ...CHAPTER_CONTROL, default: 2 },
    { key: 'stageCount', type: 'number', label: '环节数量', default: 3, min: 3, max: 4, description: '左侧六边形与右侧箭头块、编号卡的数量:3 个呈品字,4 个呈菱形。' },
  ],
};
