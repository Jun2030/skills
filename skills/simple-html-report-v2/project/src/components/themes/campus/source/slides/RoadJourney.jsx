// 蜿蜒立体道路:一条带透视的 S 形公路从画面底部(近处、宽)左右摆动着伸向远处的天光(远处、窄),
// 路面有厚度、投影、白色路肩线和暖金中线;每个弯道顶点立一枚立体定位针,对应的玻璃说明卡排在同侧,
// 终点插一面暖金旗并写目的地。适合研究历程、成长路径、阶段规划(3–6 段)。
import React from 'react';
import { useThemeStyle, enterDelay } from '../../../shared/style.jsx';
import { safeArray, clamp } from '../../../chart-safety.mjs';
import { CampusFrame, TitleRow, CHAPTER_CONTROL, TITLE_ROW_SPACE, useCampusLayout } from '../kit/chrome.jsx';
import { ToneDefs } from '../kit/feature-b.jsx';
import {
  useFeatureCStyle, useSvgId, Stop, r2, sampleSpline, ribbonEdges, polyPath, Sparkles, FlagMark, PoleDefs,
  MapPin, pinGeometry, NoSeal, spreadPositions,
} from '../kit/feature-c.jsx';

const DEFAULTS = {
  chapterIndex: 4,
  stageCount: 5,
  sectionNo: '4.3',
  title: '研究计划：从开题到答辩的五段路程',
  startLabel: '开题',
  goalLabel: '学位论文答辩',
  stages: [
    { no: '01', time: '2023.01—2023.02', title: '调试软件接收机', desc: '跑通中频数据的捕获、跟踪与定位流程。' },
    { no: '02', time: '2023.03—2023.05', title: '平台搭建与理论验证', desc: '熟悉代码与流程，少量数据处理验证基础理论。' },
    { no: '03', time: '2023.06—2023.09', title: '数据验证与小论文', desc: '得到实验结论，完成并修改小论文、实测数据处理。' },
    { no: '04', time: '2023.10—2023.12', title: '优化平台与中期答辩', desc: '撰写论文前 3 章，优化软件平台。' },
    { no: '05', time: '2024.01—2024.05', title: '整理成果与送审', desc: '完善毕业论文，修改、送审并准备答辩。' },
    { no: '06', time: '示例阶段', title: '成果转化', desc: '整理软件平台与数据，形成可复现的开源版本。' },
  ],
};

const CSS = `
.cp-g5-rd-card{position:absolute;transform:translateY(-50%);display:flex;flex-direction:column;gap:10px;padding:20px 26px 22px;}
.cp-g5-rd-head{display:flex;align-items:center;gap:14px;}
.cp-g5-rd-time{font-size:19px;font-weight:700;letter-spacing:.04em;color:var(--campus-accent-soft);white-space:nowrap;font-variant-numeric:lining-nums;}
.cp-g5-rd-card.is-gold .cp-g5-rd-time{color:var(--campus-gold-ink);}
.cp-g5-rd-title{font-family:var(--theme-font-serif);font-weight:700;font-size:28px;line-height:1.25;letter-spacing:.03em;color:var(--theme-ink);}
.cp-g5-rd-desc{font-size:21px;line-height:1.5;color:var(--theme-muted);text-wrap:pretty;}
.cp-g5-rd.is-dense .cp-g5-rd-card{gap:6px;padding:14px 22px 16px;}
.cp-g5-rd.is-dense .cp-g5-rd-title{font-size:25px;}
.cp-g5-rd.is-dense .cp-g5-seal{min-width:44px;height:44px;font-size:22px;}
.cp-g5-rd-pinno{position:absolute;transform:translate(-50%,-50%);font-family:var(--theme-font-serif);font-weight:700;line-height:1;color:var(--theme-accent);font-variant-numeric:lining-nums;white-space:nowrap;}
.cp-g5-rd-pinno.is-gold{color:var(--campus-gold-ink);}
.cp-g5-rd-goal{position:absolute;transform:translateY(-50%);}
.cp-g5-rd-start{position:absolute;transform:translate(-50%,-50%);}
`;

const SPARKS = [[0, -0.06, 14, 'star', 'gold'], [-0.05, 0.02, 7, 'star', 'gold'], [0.06, 0.05, 8, 'dot', 'gold'], [-0.075, -0.05, 6, 'dot', 'accent'], [0.085, -0.03, 9, 'star', 'accent']];

export function RoadJourney(props) {
  useThemeStyle('campus-road-journey-style', CSS);
  useFeatureCStyle();
  const p = { ...DEFAULTS, ...props };
  const id = useSvgId('cp-g5-rd');
  const { bodyW, bodyH, nav } = useCampusLayout();
  const stages = safeArray(p.stages).slice(0, clamp(Math.round(p.stageCount) || 5, 3, 6));
  const n = Math.max(1, stages.length);
  const W = bodyW;
  const H = bodyH - TITLE_ROW_SPACE;
  const cx = W / 2;

  // 透视:近处(画面底部)比例 1,远处天光(yEnd)比例 0.2;道路半宽、摆幅、厚度、定位针都乘这个比例。
  const yNear = H * 0.86;
  const yEnd = H * 0.04;
  const scaleAt = y => clamp(0.2 + 0.8 * ((y - yEnd) / Math.max(1, H - yEnd)), 0.2, 1.08);
  const colW = Math.round(W * (nav === 'rail' ? 0.305 : 0.285));
  const amp = W * 0.15;
  const hw0 = W * 0.05;
  const SQ = 0.42;
  const yFarPin = H * (n >= 6 ? 0.2 : 0.24);
  const pins = stages.map((st, i) => {
    const u = n > 1 ? i / (n - 1) : 0;
    const y = yNear - (yNear - yFarPin) * (1 - Math.pow(1 - u, 1.3));
    const side = i % 2 === 0 ? -1 : 1;
    const sc = scaleAt(y);
    return { i, st, side, sc, x: r2(cx + side * amp * sc), y: r2(y) };
  });
  const end = { x: r2(cx + (pins.length % 2 === 0 ? -1 : 1) * amp * 0.12), y: r2(yEnd) };
  const start = { x: r2(cx + amp * 0.35), y: r2(H + 60) };
  const samples = sampleSpline([start, ...pins.map(q => ({ x: q.x, y: q.y })), end], 28);
  const hwAt = (k, q) => hw0 * scaleAt(q.y);
  const edges = ribbonEdges(samples, hwAt, SQ);
  const surface = polyPath([...edges.left, ...[...edges.right].reverse()], true);
  // 路面厚度:两条边线整体下移 thick(y),先画在路面下面。
  const thickAt = y => 22 * scaleAt(y);
  const slab = polyPath([...edges.left.map(q => ({ x: q.x, y: q.y + thickAt(q.y) })), ...[...edges.right].reverse().map(q => ({ x: q.x, y: q.y + thickAt(q.y) }))], true);
  const band = (a, b) => {
    const e1 = ribbonEdges(samples, (k, q) => hwAt(k, q) * a, SQ);
    const e2 = ribbonEdges(samples, (k, q) => hwAt(k, q) * b, SQ);
    return [polyPath([...e1.left, ...[...e2.left].reverse()], true), polyPath([...e1.right, ...[...e2.right].reverse()], true)];
  };
  const shoulders = band(0.8, 0.88);
  // 中线:暖金短划,间距随透视缩短。
  const dashes = [];
  {
    let k = 0.015;
    let guard = 0;
    while (k < 0.97 && guard < 200) {
      guard += 1;
      const idx = samples.findIndex(q => q.k >= k);
      const q = samples[Math.max(0, idx)];
      const sc = scaleAt(q?.y ?? H);
      const len = 0.026 * sc;
      const k1 = k;
      const k2 = Math.min(0.99, k + len * 0.6);
      const seg = samples.filter(s => s.k >= k1 && s.k <= k2);
      if (seg.length >= 2) {
        const e = ribbonEdges(seg, (kk, s) => hw0 * scaleAt(s.y) * 0.07, SQ);
        dashes.push(polyPath([...e.left, ...[...e.right].reverse()], true));
      }
      k += len;
    }
  }
  // 说明卡:理想位置与定位针头部同高;同侧相邻两张放不下时互相推开(估计高度按最长的两行说明算)。
  const cardH = n >= 5 ? 178 : 196;
  const heads = pins.map(q => pinGeometry(q.x, q.y, Math.max(25, 40 * q.sc)));
  const spread = {};
  [-1, 1].forEach(side => {
    const idx = pins.map((q, i) => (q.side === side ? i : -1)).filter(i => i >= 0);
    const ys = spreadPositions(idx.map(i => heads[i].cy), cardH, 14, 0, H);
    idx.forEach((i, k) => { spread[i] = ys[k]; });
  });
  const cards = pins.map((q, i) => ({ ...q, head: heads[i], cy: spread[i] }));
  const lastSide = pins.length ? pins[pins.length - 1].side : 1;
  const sparks = SPARKS.map(([fx, fy, s, kind, tone]) => [r2(end.x + fx * W), r2(end.y + 40 + fy * H), s, kind, tone]);

  return (
    <CampusFrame chapterIndex={p.chapterIndex}>
      <TitleRow no={p.sectionNo} title={p.title} className="campus-rise" style={enterDelay(0)} />
      <div className={`cp-g5-fig cp-g5-rd${n >= 5 ? ' is-dense' : ''}`}>
        <svg className="cp-g5-svg campus-fade" style={{ width: W, height: H, ...enterDelay(1) }} viewBox={`0 0 ${W} ${H}`} aria-hidden="true">
          <defs>
            <ToneDefs id={id} tones={['accent', 'gold']} />
            <PoleDefs id={id} />
            <linearGradient id={`${id}-road`} gradientUnits="userSpaceOnUse" x1="0" y1={r2(H)} x2="0" y2={r2(yEnd)}>
              <Stop offset="0" color="var(--campus-accent-lo)" />
              <Stop offset=".45" color="var(--theme-accent)" />
              <Stop offset=".8" color="var(--campus-accent-hi)" />
              <Stop offset="1" color="var(--campus-fb-accent-mist)" />
            </linearGradient>
            <linearGradient id={`${id}-slab`} gradientUnits="userSpaceOnUse" x1="0" y1={r2(H)} x2="0" y2={r2(yEnd)}>
              <Stop offset="0" color="var(--campus-accent-deep)" />
              <Stop offset=".7" color="var(--campus-accent-lo)" />
              <Stop offset="1" color="var(--campus-fb-accent-mist)" />
            </linearGradient>
            <radialGradient id={`${id}-ground`} cx=".5" cy=".62" r=".5">
              <Stop offset="0" color="var(--campus-fb-accent-pale)" opacity=".85" />
              <Stop offset=".6" color="var(--campus-fb-accent-pale)" opacity=".35" />
              <Stop offset="1" color="var(--campus-fb-accent-pale)" opacity="0" />
            </radialGradient>
            <linearGradient id={`${id}-sheen`} gradientUnits="userSpaceOnUse" x1={r2(cx - amp - hw0)} y1="0" x2={r2(cx + amp + hw0)} y2="0">
              <Stop offset="0" color="var(--theme-surface)" opacity=".22" />
              <Stop offset=".5" color="var(--theme-surface)" opacity=".04" />
              <Stop offset="1" color="var(--theme-surface)" opacity="0" />
            </linearGradient>
            <radialGradient id={`${id}-dawn`} cx=".5" cy=".5" r=".5">
              <Stop offset="0" color="var(--campus-gold-hi)" opacity=".95" />
              <Stop offset=".35" color="var(--campus-gold-hi)" opacity=".45" />
              <Stop offset="1" color="var(--campus-gold-hi)" opacity="0" />
            </radialGradient>
            <filter id={`${id}-blur`} x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="12" /></filter>
          </defs>

          {/* 地面与透视线:从底边汇向远处天光 */}
          <ellipse cx={r2(cx)} cy={r2(H * 0.98)} rx={r2(W * 0.5)} ry={r2(H * 0.86)} fill={`url(#${id}-ground)`} />
          {[-0.5, -0.3, -0.12, 0.12, 0.3, 0.5].map((f, i) => (
            <line key={i} x1={r2(cx + f * W * 1.2)} y1={r2(H)} x2={r2(end.x + f * 60)} y2={r2(yEnd + 30)} stroke="var(--theme-accent)" strokeOpacity=".07" strokeWidth="1.5" />
          ))}
          <ellipse cx={end.x} cy={r2(end.y + 34)} rx={r2(W * 0.2)} ry={r2(H * 0.16)} fill={`url(#${id}-dawn)`} />

          {/* 道路:投影 → 厚度 → 路面 → 光泽 → 路肩线 → 中线 */}
          <path d={slab} transform="translate(10 16)" fill="var(--theme-accent)" fillOpacity=".22" filter={`url(#${id}-blur)`} />
          <path d={slab} fill={`url(#${id}-slab)`} />
          <path d={surface} fill={`url(#${id}-road)`} />
          <path d={surface} fill={`url(#${id}-sheen)`} />
          {shoulders.map((d, i) => <path key={i} d={d} fill="var(--theme-surface)" fillOpacity=".85" />)}
          {dashes.map((d, i) => <path key={i} d={d} fill="var(--campus-gold-hi)" />)}

          {/* 定位针与引线 */}
          {cards.map(c => {
            const x2 = c.side < 0 ? colW : W - colW;
            const x1 = c.head.cx + c.side * -1 * (c.head.r + 10);
            return (
              <g key={`l${c.i}`}>
                <path d={`M ${r2(x1)} ${c.head.cy} L ${r2(x2 + c.side * 40 * -1)} ${c.head.cy} L ${r2(x2)} ${c.cy}`} fill="none" stroke={c.i === n - 1 ? 'var(--campus-gold-line)' : 'var(--campus-accent-line)'} strokeWidth="2" strokeDasharray="2 7" strokeLinecap="round" />
                <circle cx={r2(x2)} cy={c.cy} r="5" fill={c.i === n - 1 ? 'var(--campus-gold)' : 'var(--theme-accent)'} />
              </g>
            );
          })}
          {[...cards].sort((a, b) => a.y - b.y).map(c => (
            <MapPin key={c.i} id={id} x={c.x} y={c.y} r={c.head.r} gold={c.i === n - 1} />
          ))}
          <FlagMark id={id} x={end.x} y={r2(end.y + 46)} h={74} gold scale={1.15} />
          <Sparkles points={sparks} />
        </svg>

        <div className="cp-g5-rd-start campus-rise" style={{ left: r2(start.x + hw0 + 70), top: r2(H - 34), ...enterDelay(2) }}>
          <NoSeal no={p.startLabel} round={false} />
        </div>
        <div className="cp-g5-rd-goal campus-rise" style={{ ...(lastSide > 0 ? { right: r2(W - end.x + 30) } : { left: r2(end.x + 70) }), top: r2(end.y + 12), ...enterDelay(3) }}>
          <NoSeal no={p.goalLabel} gold />
        </div>

        {cards.map(c => (
          <React.Fragment key={c.i}>
            <div className={`cp-g5-rd-pinno campus-fade${c.i === n - 1 ? ' is-gold' : ''}`} style={{ left: c.head.cx, top: c.head.cy, fontSize: Math.round(c.head.r * 0.78), ...enterDelay(3 + c.i) }}>{c.st?.no}</div>
            <div className={`cp-g5-rd-card cp-g5-glass campus-rise${c.i === n - 1 ? ' is-gold' : ''}`} style={{ ...(c.side < 0 ? { left: 0 } : { right: 0 }), width: colW, top: c.cy, ...enterDelay(4 + c.i) }}>
              <div className="cp-g5-rd-head">
                <NoSeal no={c.st?.no} gold={c.i === n - 1} />
                <div className="cp-g5-rd-time">{c.st?.time}</div>
              </div>
              <h3 className="cp-g5-rd-title">{c.st?.title}</h3>
              <p className="cp-g5-rd-desc">{c.st?.desc}</p>
            </div>
          </React.Fragment>
        ))}
      </div>
    </CampusFrame>
  );
}

RoadJourney.META = {
  id: 'road-journey',
  label: '特色 · 蜿蜒立体道路',
  roles: ['process', 'trend', 'actions'],
  defaults: DEFAULTS,
  copyBudgets: { title: 22, startLabel: 6, goalLabel: 8, 'stages[].no': 2, 'stages[].time': 16, 'stages[].title': 10, 'stages[].desc': 24 },
  controls: [
    { ...CHAPTER_CONTROL, default: 4 },
    { key: 'stageCount', type: 'number', label: '阶段数量', default: 5, min: 3, max: 6, description: '道路上的弯道与定位针数量;说明卡左右交替排在弯道外侧,最后一段用暖金强调。' },
  ],
};
