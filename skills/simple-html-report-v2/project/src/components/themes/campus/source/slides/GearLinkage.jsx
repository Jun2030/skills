// 立体齿轮联动:左侧 2–4 个大小不同、互相咬合的立体齿轮(齿形、厚度、金属轮缘、白色玻璃轮毂),
// 第一个是暖金主动轮,其余是校色从动轮,每个齿轮外侧有一道表示转向的弧形箭头;轮毂里写编号与要素名。
// 右侧是导语 + 与齿轮编号对应的说明卡,齿轮组下方一枚目标胶囊。适合机制联动、产学研协同、模块协作。
// 齿轮、箭头都是不含文字的 SVG 图形;编号、要素名、说明都是叠在上面的水平 HTML 文本。
import React from 'react';
import { useThemeStyle, enterDelay } from '../../../shared/style.jsx';
import { safeArray, safeRatio, safeMin, safeMax, clamp } from '../../../chart-safety.mjs';
import { CampusFrame, TitleRow, CHAPTER_CONTROL, TITLE_ROW_SPACE, useCampusLayout } from '../kit/chrome.jsx';
import { useSvgId, ToneDefs, Stop, arcPath, arcHead, pt, r2 } from '../kit/feature-b.jsx';
import { useFeatureDStyle, MetalDefs, StageHalo, G6Point, gearPath, circlePath, pad2 } from '../kit/feature-d.jsx';

const DEFAULTS = {
  chapterIndex: 3,
  gearCount: 3,
  sectionNo: '3.1',
  title: '研究内容：三项关键技术协同联动',
  lead: '围绕「观测量异常时如何连续、精确定位」，软件平台带动两项算法研究，三者相互支撑、协同推进。',
  goal: '协同目标 · 复杂环境下连续精确定位',
  gears: [
    { name: '平台', title: '深组合软件平台搭建', desc: '设计预滤波器与组合导航滤波器，理清惯导与码环、载波环的耦合关系。' },
    { name: '灵敏度', title: '惯性辅助长相干积分', desc: '消除导航比特跳变，以频率传递辅助弱信号跟踪，提高环路信噪比。' },
    { name: '抗差', title: '权函数定权抗差', desc: '按观测信息的可靠程度分级定权，剔除粗差，防止滤波器发散。' },
    { name: '验证', title: '性能分析与验证', desc: '对照改进前后的定位结果评估性能，把新问题带回下一轮研究。' },
  ],
};

// 以齿距为 1 的单位:各齿轮的齿数,以及从前一个齿轮指向它的方向(度,0 = 正上方,顺时针)。
const TEETH = [20, 13, 16, 11];
// 2 个时斜向并排;3 个时第三个绕到第二个的右下方,组团接近正文左栏的宽高比;4 个时再向右上延伸。
// 只让相邻齿轮咬合:第三个的方向取 125°,与主动轮齿尖之间留出约 1.5 个齿距的空隙(140° 时只有 0.66,看上去贴在一起)。
const DIRS = { 2: [0, 64], 3: [0, 48, 125], 4: [0, 48, 125, 50] };
const TONES = ['gold', 'accent', 'mist', 'accent'];

const CSS = `
.cp-g6-gl{flex:1;min-height:0;display:flex;gap:40px;}
.cp-g6-gl-fig{position:relative;flex:none;height:100%;}
.cp-g6-gl-hub{position:absolute;transform:translate(-50%,-50%);display:flex;flex-direction:column;align-items:center;gap:4px;text-align:center;}
.cp-g6-gl-no{font-family:var(--theme-font-serif);font-weight:700;font-size:22px;line-height:1;letter-spacing:.06em;color:var(--campus-accent-soft);font-variant-numeric:lining-nums;}
.cp-g6-gl-name{font-family:var(--theme-font-serif);font-weight:700;font-size:34px;line-height:1.15;letter-spacing:.06em;color:var(--theme-accent);white-space:nowrap;}
.cp-g6-gl-hub.is-gold .cp-g6-gl-no{color:var(--campus-gold-lo);}
.cp-g6-gl-hub.is-gold .cp-g6-gl-name{color:var(--campus-gold-ink);}
.cp-g6-gl-hub.is-small .cp-g6-gl-name{font-size:27px;letter-spacing:.02em;}
.cp-g6-gl-hub.is-small .cp-g6-gl-no{font-size:19px;}
.cp-g6-gl-goal{position:absolute;transform:translateX(-50%);isolation:isolate;display:flex;align-items:center;gap:12px;height:52px;padding:0 28px;color:var(--theme-on-accent);font-weight:700;font-size:22px;letter-spacing:.08em;white-space:nowrap;}
.cp-g6-gl-goal-shape{position:absolute;inset:0;z-index:-1;border-radius:999px;background:var(--campus-fill);box-shadow:var(--campus-shadow-lift),0 0 0 4px rgb(255 255 255 / .75);}
.cp-g6-gl-goal-mark{flex:none;width:11px;height:11px;border-radius:2px;background:var(--campus-spark);transform:rotate(45deg);}
.cp-g6-gl-side{flex:1;min-width:0;display:flex;flex-direction:column;justify-content:center;gap:22px;padding:4px 0 14px;}
.cp-g6-gl-lead{position:relative;padding:2px 0 2px 26px;font-size:23px;line-height:1.6;color:var(--theme-ink);text-wrap:pretty;}
.cp-g6-gl-lead::before{content:'';position:absolute;left:0;top:6px;bottom:6px;width:6px;border-radius:3px;background:var(--campus-fill-bar);}
.cp-g6-gl-list{display:flex;flex-direction:column;gap:16px;}
.cp-g6-gl-card{padding:18px 26px 18px 18px;}
.cp-g6-gl-side.is-4 .cp-g6-gl-list{gap:12px;}
.cp-g6-gl-side.is-4 .cp-g6-gl-card{padding-top:12px;padding-bottom:12px;}
.cp-g6-gl-side.is-4 .cp-g6-point-desc{line-height:1.45;}
.cp-g6-gl-side.is-2 .cp-g6-gl-card{padding-top:26px;padding-bottom:26px;}
`;

/** 一个立体齿轮(SVG 片段):挤出的侧壁 + 齿面 + 金属轮缘 + 减重孔 + 白色玻璃轮毂。 */
function Gear({ id, g, tooth, depth }) {
  const t = g.tone;
  const outline = gearPath(g.x, g.y, g.r, g.z, tooth, g.phase);
  const steps = Math.max(4, Math.round(depth / 1.6));
  const hub = g.r * (g.z < 14 ? 0.58 : 0.5);
  const holes = g.z >= 14 ? 6 : 5;
  const holeR = (g.r * 0.83 - hub) * 0.42;
  return (
    <g>
      <ellipse cx={r2(g.x + depth * 1.4)} cy={r2(g.y + g.r * 0.95 + depth * 2)} rx={r2(g.r * 0.95)} ry={r2(g.r * 0.18)} fill={`url(#${id}-shadow)`} />
      {Array.from({ length: steps }, (_, k) => {
        const f = (steps - k) / steps;
        return <path key={k} d={gearPath(g.x + depth * 0.62 * f, g.y + depth * f, g.r, g.z, tooth, g.phase)} fill={`url(#${id}-${t}-side)`} />;
      })}
      <path d={outline} fill={`url(#${id}-${t}-face)`} />
      <path d={outline} fill={`url(#${id}-gloss)`} />
      <path d={outline} fill="none" stroke={`url(#${id}-${t}-edge)`} strokeWidth="2.5" strokeLinejoin="round" />
      {/* 轮缘内的凹槽:深色环 + 亮色内盘 */}
      <path d={`${circlePath(g.x, g.y, g.r * 0.84)} ${circlePath(g.x, g.y, g.r * 0.78)}`} fillRule="evenodd" fill={`url(#${id}-${t}-side)`} opacity=".85" />
      <circle cx={r2(g.x)} cy={r2(g.y)} r={r2(g.r * 0.78)} fill="none" stroke="var(--theme-surface)" strokeOpacity=".35" strokeWidth="1.5" />
      {Array.from({ length: holes }, (_, k) => {
        const c = pt(g.x, g.y, (g.r * 0.83 + hub) / 2, g.phase + 18 + k * (360 / holes));
        return (
          <g key={k}>
            <circle cx={c.x} cy={c.y} r={r2(holeR)} fill={`url(#${id}-${t}-side)`} />
            <circle cx={r2(c.x + 2)} cy={r2(c.y + 3)} r={r2(holeR - 3)} fill="var(--theme-bg)" fillOpacity=".55" />
            <path d={arcPath(c.x, c.y, holeR, 120, 260)} fill="none" stroke="var(--theme-surface)" strokeOpacity=".55" strokeWidth="2" strokeLinecap="round" />
          </g>
        );
      })}
      {/* 轮毂:金属外圈 + 白色玻璃盘 */}
      <circle cx={r2(g.x + 3)} cy={r2(g.y + 6)} r={r2(hub + 6)} fill="var(--theme-ink)" fillOpacity=".18" />
      <circle cx={r2(g.x)} cy={r2(g.y)} r={r2(hub + 6)} fill={`url(#${id}-metal-${t === 'gold' ? 'gold' : 'accent'})`} />
      <circle cx={r2(g.x)} cy={r2(g.y)} r={r2(hub)} fill="var(--theme-surface)" />
      <circle cx={r2(g.x)} cy={r2(g.y)} r={r2(hub)} fill={`url(#${id}-hubglass)`} />
      <circle cx={r2(g.x)} cy={r2(g.y)} r={r2(hub - 7)} fill="none" stroke={t === 'gold' ? 'var(--campus-gold-line)' : 'var(--campus-accent-line)'} strokeWidth="1.5" strokeDasharray="2 6" strokeLinecap="round" />
    </g>
  );
}

export function GearLinkage(props) {
  useThemeStyle('campus-gear-linkage-style', CSS);
  useFeatureDStyle();
  const p = { ...DEFAULTS, ...props };
  const id = useSvgId('cp-g6-gl');
  const { bodyW, bodyH } = useCampusLayout();
  const gears = safeArray(p.gears).slice(0, clamp(Math.round(p.gearCount) || 3, 2, 4));
  const n = Math.max(2, gears.length);
  const H = bodyH - TITLE_ROW_SPACE;
  const FW = Math.round(bodyW * 0.55);
  const goalH = 74;

  // 1) 以齿距 1 排出齿轮中心与转角,使相邻齿轮的齿与齿槽对上。
  const unit = [];
  for (let i = 0; i < n; i += 1) {
    const z = TEETH[i];
    const r = z / (2 * Math.PI);
    const step = 360 / z;
    if (i === 0) { unit.push({ x: 0, y: 0, r, z, step, phase: 0 }); continue; }
    const prev = unit[i - 1];
    const dir = DIRS[n][i];
    const c = pt(prev.x, prev.y, prev.r + r + 0.06, dir);
    const fracPrev = (((dir - prev.phase) / prev.step) % 1 + 1) % 1;
    const phase = dir + 180 + (fracPrev + 0.5) * step;
    unit.push({ x: c.x, y: c.y, r, z, step, phase });
  }
  // 2) 按左栏可用空间等比放大,并居中(四周留出转向箭头和侧壁的位置)。
  const tooth1 = 0.56;
  const reach = g => g.r + tooth1 / 2 + 0.55;
  const x0 = safeMin(unit.map(g => g.x - reach(g)), 0);
  const x1 = safeMax(unit.map(g => g.x + reach(g)), 1);
  const y0 = safeMin(unit.map(g => g.y - reach(g)), 0);
  const y1 = safeMax(unit.map(g => g.y + reach(g)), 1);
  const k = Math.min(safeRatio(FW - 20, x1 - x0, 40), safeRatio(H - goalH - 20, y1 - y0, 40), 60);
  const ox = (FW - (x1 - x0) * k) / 2 - x0 * k;
  const oy = (H - goalH - (y1 - y0) * k) / 2 - y0 * k + 6;
  const tooth = tooth1 * k;
  const depth = Math.round(k * 0.36);
  const placed = unit.map((g, i) => ({ ...g, i, x: r2(ox + g.x * k), y: r2(oy + g.y * k), r: r2(g.r * k), tone: TONES[i] }));
  const cxAll = safeRatio(placed.reduce((s, g) => s + g.x, 0), placed.length, FW / 2);
  const cyAll = safeRatio(placed.reduce((s, g) => s + g.y, 0), placed.length, H / 2);
  // 转向箭头:放在齿轮背向齿轮组中心的一侧;主动轮顺时针,依次反向。
  const arrows = placed.map((g, i) => {
    const away = Math.atan2(g.x - cxAll, -(g.y - cyAll)) * 180 / Math.PI;
    const mid = n === 2 ? (i === 0 ? 225 : 45) : (i === 0 ? 235 : away);
    const rr = g.r + tooth / 2 + 22;
    const span = 34;
    const dir = i % 2 === 0 ? 1 : -1;
    return { rr, a0: mid - span, a1: mid + span, head: dir === 1 ? mid + span : mid - span, dir, g };
  });
  const bottom = safeMax(placed.map(g => g.y + g.r + tooth / 2 + depth), H - goalH);
  const goalTop = Math.min(H - 58, bottom + 18);

  return (
    <CampusFrame chapterIndex={p.chapterIndex}>
      <TitleRow no={p.sectionNo} title={p.title} className="campus-rise" style={enterDelay(0)} />
      <div className="cp-g6-gl">
        <div className="cp-g6-gl-fig" style={{ width: FW }}>
          <svg className="cp-g6-svg campus-fade" style={{ left: 0, top: 0, width: FW, height: H, ...enterDelay(1) }} viewBox={`0 0 ${FW} ${H}`} aria-hidden="true">
            <ToneDefs id={id} tones={['accent', 'gold', 'mist']} />
            <MetalDefs id={id} />
            <defs>
              <radialGradient id={`${id}-hubglass`} cx=".35" cy=".3" r=".8">
                <Stop offset="0" color="var(--theme-surface)" opacity="0" />
                <Stop offset="1" color="var(--theme-accent)" opacity=".16" />
              </radialGradient>
            </defs>
            <circle cx={r2(cxAll)} cy={r2(cyAll)} r={r2(Math.min(FW, H) * 0.5)} fill={`url(#${id}-halo)`} />
            <circle cx={r2(cxAll)} cy={r2(cyAll)} r={r2(Math.min(FW, H) * 0.44)} fill="none" stroke="var(--theme-accent)" strokeOpacity=".12" strokeWidth="1.5" strokeDasharray="3 9" strokeLinecap="round" />
            <StageHalo id={id} cx={r2(FW / 2)} cy={r2(goalTop + 26)} rx={r2(FW * 0.36)} ry={36} glow={false} />
            {placed.map(g => <Gear key={g.i} id={id} g={g} tooth={tooth} depth={depth} />)}
            {arrows.map((a, i) => (
              <g key={i}>
                <path d={arcPath(a.g.x, a.g.y, a.rr, a.a0, a.a1)} fill="none" stroke={a.g.tone === 'gold' ? 'var(--campus-gold)' : 'var(--theme-accent)'} strokeOpacity=".7" strokeWidth="5" strokeLinecap="round" />
                <polygon points={arcHead(a.g.x, a.g.y, a.rr, a.head, a.dir, 15)} fill={a.g.tone === 'gold' ? 'var(--campus-gold)' : 'var(--theme-accent)'} />
              </g>
            ))}
          </svg>
          {placed.map((g, i) => (
            <div className={`cp-g6-gl-hub campus-fade${g.tone === 'gold' ? ' is-gold' : ''}${g.z < 14 ? ' is-small' : ''}`} style={{ left: g.x, top: g.y, ...enterDelay(3 + i) }} key={i}>
              <div className="cp-g6-gl-no">{pad2(i + 1)}</div>
              <div className="cp-g6-gl-name">{gears[i]?.name}</div>
            </div>
          ))}
          <div className="cp-g6-gl-goal campus-rise" style={{ left: FW / 2, top: goalTop, ...enterDelay(5) }}>
            <div className="cp-g6-gl-goal-shape" aria-hidden="true" />
            <div className="cp-g6-gl-goal-mark" aria-hidden="true" />
            <div>{p.goal}</div>
          </div>
        </div>
        <div className={`cp-g6-gl-side is-${n}`}>
          <p className="cp-g6-gl-lead campus-rise" style={enterDelay(2)}>{p.lead}</p>
          <div className="cp-g6-gl-list">
            {gears.map((g, i) => (
              <div className={`cp-g6-gl-card cp-g6-glass${i === 0 ? ' is-gold' : ''} campus-rise`} style={enterDelay(3 + i)} key={i}>
                <G6Point no={pad2(i + 1)} title={g?.title} desc={g?.desc} tone={i === 0 ? 'gold' : 'accent'} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </CampusFrame>
  );
}

GearLinkage.META = {
  id: 'gear-linkage',
  label: '特色 · 立体齿轮联动',
  roles: ['relationship', 'process', 'context'],
  defaults: DEFAULTS,
  copyBudgets: { title: 28, lead: 50, goal: 18, 'gears[].name': 3, 'gears[].title': 12, 'gears[].desc': 34 },
  controls: [
    { ...CHAPTER_CONTROL },
    { key: 'gearCount', type: 'number', label: '齿轮数量', default: 3, min: 2, max: 4, countArrays: ['gears'], description: '互相咬合的齿轮个数;第一个是暖金主动轮,右侧说明卡数量相同。' },
  ],
};
