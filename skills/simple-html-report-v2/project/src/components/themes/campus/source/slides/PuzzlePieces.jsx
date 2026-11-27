// 立体拼图:3–4 块互相咬合的立体拼图块(有厚度、倒角高光、拼缝),每块写编号与短标题;
// 其中一块可以「抬起」换成暖金色,原位露出一个有深度的凹槽(深色槽底 + 左上内壁投影 + 右下内壁受光);
// 4 块拼成 2×2 时中央压一枚核心圆章,说明卡分列左右;3 块拼成一排时同样居中,首尾两块的说明卡分列左右、
// 中间一块的说明卡在正下方,核心写在上方胶囊里(正文区太窄放不下左右两列时,三张卡退回一排排在下方)。
// 适合研究内容的组成、系统模块、多学科融合。
import React from 'react';
import { useThemeStyle, enterDelay } from '../../../shared/style.jsx';
import { safeArray, safeNumber, clamp } from '../../../chart-safety.mjs';
import { CampusFrame, TitleRow, CHAPTER_CONTROL, TITLE_ROW_SPACE, useCampusLayout } from '../kit/chrome.jsx';
import { ToneDefs } from '../kit/feature-b.jsx';
import { useFeatureCStyle, useSvgId, Stop, r2, puzzlePath, Sparkles, NoSeal, KickerChip, spreadPositions } from '../kit/feature-c.jsx';

const DEFAULTS = {
  chapterIndex: 3,
  pieceCount: 4,
  highlightIndex: 2,
  sectionNo: '3.1',
  title: '无监督多视点重建的四个组成部分',
  core: '无监督重建',
  pieces: [
    { no: '01', label: '光度一致性', title: '鲁棒的光度一致性', desc: '在像素差之外加入图像梯度项，约束力更强。' },
    { no: '02', label: '遮挡处理', title: 'top-K 视图选择', desc: '只取光度一致性最好的 K 个不相交视图计算损失，隐式处理遮挡。' },
    { no: '03', label: '损失函数', title: '三项无监督损失', desc: 'SSIM、Smooth 与鲁棒光度一致性加权组合。' },
    { no: '04', label: '网络架构', title: '参考 MVSNet 构建', desc: '特征提取、可微单应投影、代价体正则化、深度图优化四个部分。' },
  ],
};

const CSS = `
.cp-g5-pz-piece{position:absolute;transform:translate(-50%,-50%);display:flex;flex-direction:column;align-items:center;gap:4px;text-align:center;color:var(--theme-on-accent);}
.cp-g5-pz-piece.is-glass{color:var(--theme-accent);}
.cp-g5-pz-piece.is-gold{color:var(--campus-gold-deep);}
.cp-g5-pz-no{font-family:var(--theme-font-serif);font-weight:700;font-size:var(--cp-g5-pz-no,64px);line-height:1;font-variant-numeric:lining-nums;}
.cp-g5-pz-label{font-family:var(--theme-font-serif);font-weight:700;font-size:var(--cp-g5-pz-label,28px);line-height:1.2;letter-spacing:.06em;white-space:nowrap;}
.cp-g5-pz-core{position:absolute;transform:translate(-50%,-50%);display:flex;align-items:center;justify-content:center;text-align:center;padding:0 18px;font-family:var(--theme-font-serif);font-weight:700;font-size:26px;line-height:1.25;letter-spacing:.06em;color:var(--theme-accent);text-wrap:balance;}
.cp-g5-pz-card{position:absolute;display:flex;flex-direction:column;gap:10px;padding:22px 26px 24px;}
.cp-g5-pz-card-head{display:flex;align-items:center;gap:14px;}
.cp-g5-pz-card-title{font-family:var(--theme-font-serif);font-weight:700;font-size:28px;line-height:1.25;letter-spacing:.03em;color:var(--theme-ink);text-wrap:balance;}
.cp-g5-pz-card-desc{font-size:21px;line-height:1.55;color:var(--theme-muted);text-wrap:pretty;}
.cp-g5-pz-kicker{position:absolute;left:50%;top:0;transform:translateX(-50%);}
.cp-g5-pz-card.is-narrow{padding:20px 22px 22px;}
.cp-g5-pz-card.is-narrow .cp-g5-pz-card-head{gap:12px;}
.cp-g5-pz-card.is-narrow .cp-g5-pz-card-title{font-size:25px;}
.cp-g5-pz-card.is-narrow .cp-g5-seal{min-width:44px;height:44px;font-size:22px;}
`;

// 每块的色调:校色实心 / 磨砂玻璃交替;抬起的一块换暖金。
const TONES = ['accent', 'glass', 'glass', 'accent'];
const TONES_ROW = ['accent', 'glass', 'accent'];

export function PuzzlePieces(props) {
  useThemeStyle('campus-puzzle-pieces-style', CSS);
  useFeatureCStyle();
  const p = { ...DEFAULTS, ...props };
  const id = useSvgId('cp-g5-pz');
  const { bodyW, bodyH } = useCampusLayout();
  const pieces = safeArray(p.pieces).slice(0, clamp(Math.round(p.pieceCount) || 4, 3, 4));
  const n = pieces.length === 3 ? 3 : 4;
  const grid = n === 4;
  const rows = grid ? 2 : 1;
  const cols = grid ? 2 : 3;
  const lifted = clamp(Math.round(safeNumber(p.highlightIndex, 0)), 0, n) - 1;
  const W = bodyW;
  const H = bodyH - TITLE_ROW_SPACE;

  // 拼图平放在一块倾斜的「桌面」上:先在平面坐标里排好格子(原点在拼图中心),再整体旋转 θ、纵向压缩 K 映射到屏幕;
  // 厚度沿屏幕竖直向下挤出。文字不跟着变形,按映射后的中心点水平摆放。
  const TH = (20 * Math.PI) / 180;
  const K = 0.62;
  const cos = Math.cos(TH);
  const sin = Math.sin(TH);
  const map = (x, y) => ({ x: r2(x * cos - y * sin), y: r2((x * sin + y * cos) * K) });
  const spanX = grid ? 2 * (cos + sin) : 3 * cos + sin;
  const spanY = grid ? 2 * (sin + cos) * K : (3 * sin + cos) * K;
  // 左右说明卡占的宽度(含与拼图的间距):按正文区宽度取,rail 导航下收窄一些,把宽度让给拼图。
  const side = clamp(W * 0.205, 340, 390);
  const sBelow = Math.min((W * 0.74) / spanX, (H - 300) / (spanY + 0.12));
  const sAround = Math.min((W - 2 * side) / spanX, (H - 270) / (spanY + 0.12));
  const around = grid || sAround >= sBelow * 0.74;
  const s = Math.round(grid
    ? Math.min((W - 2 * side) / spanX, (H - 150) / (spanY + 0.2))
    : (around ? sAround : sBelow));
  const depth = Math.round(s * 0.12);
  const gx = r2(W / 2);
  // 抬起的高度要让出一截凹槽:抬高 0.32 格、侧壁只留一个厚度,槽口露出约 0.2 格。
  const liftY = lifted >= 0 ? -Math.round(s * 0.32) : 0;
  // 一排时:眉题胶囊 + 拼图 + 下方说明卡(估 180 高)整体在正文区里竖向居中。
  const rowTop = grid ? 0 : Math.max(0, Math.round((H - (64 + spanY * s + s * 0.08 + depth + 40 + 180)) / 2));
  const gy = r2(grid ? (H - depth) / 2 + Math.round(s * 0.06) : rowTop + 64 + (spanY * s) / 2 + Math.round(s * 0.08));
  const matrix = `matrix(${r2(cos * 1000) / 1000} ${r2(sin * K * 1000) / 1000} ${r2(-sin * 1000) / 1000} ${r2(cos * K * 1000) / 1000} 0 0)`;
  const x0 = -(cols * s) / 2;
  const y0 = -(rows * s) / 2;
  // 拼缝的榫卯方向按棋盘格交替,相邻两块共用一条边(符号相反)。
  const hEdge = (r, c) => ((r + c) % 2 === 0 ? 1 : -1);
  const vEdge = (r, c) => ((r + c) % 2 === 0 ? -1 : 1);
  const cells = pieces.map((pc, i) => {
    const r = grid ? Math.floor(i / 2) : 0;
    const c = grid ? i % 2 : i;
    const edges = {
      top: r > 0 ? -hEdge(r - 1, c) : 0,
      bottom: r < rows - 1 ? hEdge(r, c) : 0,
      left: c > 0 ? -vEdge(r, c - 1) : 0,
      right: c < cols - 1 ? vEdge(r, c) : 0,
    };
    const x = x0 + c * s;
    const y = y0 + r * s;
    const tone = i === lifted ? 'gold' : (grid ? TONES : TONES_ROW)[i] || 'accent';
    const ctr = map(x + s / 2, y + s / 2);
    return { pc, i, r, c, x, y, edges, tone, d: puzzlePath(x, y, s, s, edges), cx: r2(gx + ctr.x), cy: r2(gy + ctr.y) };
  });
  const pillarTop = -Math.round(s * 0.05);
  const steps = 14;
  const faceFill = t => (t === 'gold' ? `url(#${id}-gold-face)` : t === 'glass' ? `url(#${id}-glass)` : `url(#${id}-accent-face)`);
  const sideFill = t => (t === 'gold' ? `url(#${id}-gold-side)` : t === 'glass' ? `url(#${id}-glass-side)` : `url(#${id}-accent-side)`);
  const flat = cells.filter(c => c.i !== lifted);
  const up = cells.find(c => c.i === lifted);
  const plane = (dy, children, key) => (
    <g key={key} transform={`translate(${gx} ${r2(gy + dy)})`}><g transform={matrix}>{children}</g></g>
  );
  const corners = [map(x0, y0), map(-x0, y0), map(-x0, -y0), map(x0, -y0)];
  const minX = gx + Math.min(...corners.map(q => q.x));
  const maxX = gx + Math.max(...corners.map(q => q.x));
  const maxY = gy + Math.max(...corners.map(q => q.y)) + depth;

  // 说明卡位置:2×2 按映射后的左右分两列(各取 x 较小 / 较大的两块),1×3 排在拼图下方。
  const gapX = 48;
  const order = [...cells].sort((a, b) => a.cx - b.cx);
  const leftSet = new Set(order.slice(0, grid ? 2 : 1).map(c => c.i));
  const rightSet = new Set(order.slice(grid ? 2 : n - 1).map(c => c.i));
  // 左右两列各两张卡:理想高度对齐各自的拼图块,放不下时互相推开。
  const sideY = {};
  [true, false].forEach(left => {
    const list = cells.filter(c => (left ? leftSet : rightSet).has(c.i));
    const ys = spreadPositions(list.map(c => c.cy + (c.i === lifted ? liftY : 0)), 232, 26, 0, H);
    list.forEach((c, k) => { sideY[c.i] = ys[k]; });
  });
  const cardOf = c => {
    if (grid || (around && (leftSet.has(c.i) || rightSet.has(c.i)))) {
      const left = leftSet.has(c.i);
      const width = Math.round(left ? minX - gapX : W - maxX - gapX);
      return { left: left ? 0 : Math.round(W - width), width, top: sideY[c.i], side: left ? 'left' : 'right' };
    }
    const width = Math.round(around ? Math.min(s * 1.25, W * 0.34) : Math.min(s * 0.98, (W - 60) / 3));
    return { left: Math.round(clamp(c.cx - width / 2, 0, W - width)), width, top: Math.round(maxY + (around ? 40 : 50)), side: 'below' };
  };

  return (
    <CampusFrame chapterIndex={p.chapterIndex}>
      <TitleRow no={p.sectionNo} title={p.title} className="campus-rise" style={enterDelay(0)} />
      <div className={`cp-g5-fig cp-g5-pz is-${grid ? 'grid' : 'row'}`}>
        <svg className="cp-g5-svg campus-fade" style={{ width: W, height: H, ...enterDelay(1) }} viewBox={`0 0 ${W} ${H}`} aria-hidden="true">
          <defs>
            <ToneDefs id={id} tones={['accent', 'gold']} />
            <linearGradient id={`${id}-glass`} x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" color="var(--theme-surface)" />
              <Stop offset=".6" color="var(--campus-g5-sky)" />
              <Stop offset="1" color="var(--campus-fb-accent-pale)" />
            </linearGradient>
            <linearGradient id={`${id}-glass-side`} x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" color="var(--campus-g5-haze)" />
              <Stop offset="1" color="var(--campus-fb-accent-mist)" />
            </linearGradient>
            <linearGradient id={`${id}-bevel`} x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" color="var(--theme-surface)" opacity=".95" />
              <Stop offset=".45" color="var(--theme-surface)" opacity=".2" />
              <Stop offset="1" color="var(--theme-surface)" opacity="0" />
            </linearGradient>
            <radialGradient id={`${id}-halo`} cx=".5" cy=".5" r=".5">
              <Stop offset="0" color="var(--theme-accent)" opacity=".16" />
              <Stop offset="1" color="var(--theme-accent)" opacity="0" />
            </radialGradient>
            <radialGradient id={`${id}-core`} cx=".38" cy=".32" r=".75">
              <Stop offset="0" color="var(--theme-surface)" />
              <Stop offset=".7" color="var(--campus-g5-sky)" />
              <Stop offset="1" color="var(--campus-fb-accent-pale)" />
            </radialGradient>
            <linearGradient id={`${id}-slot-wall`} x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" color="var(--campus-accent-deep)" />
              <Stop offset="1" color="var(--campus-accent-lo)" />
            </linearGradient>
            <linearGradient id={`${id}-slot-floor`} x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" color="var(--campus-accent-lo)" />
              <Stop offset=".6" color="var(--campus-accent-deep)" />
              <Stop offset="1" color="var(--campus-accent-lo)" />
            </linearGradient>
            {up && <clipPath id={`${id}-slot`}><path d={up.d} transform={matrix} /></clipPath>}
            <filter id={`${id}-blur`} x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="14" /></filter>
            <filter id={`${id}-soft`} x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="6" /></filter>
          </defs>

          <ellipse cx={gx} cy={r2(gy + depth)} rx={r2((maxX - minX) * 0.62)} ry={r2((maxY - gy) * 1.5 + 40)} fill={`url(#${id}-halo)`} />
          {/* 整组落地投影 */}
          {plane(depth + 26, <rect x={r2(x0)} y={r2(y0)} width={r2(cols * s)} height={r2(rows * s)} rx="30" fill="var(--theme-accent)" fillOpacity=".22" filter={`url(#${id}-blur)`} />, 'shadow')}

          {/* 厚度:同一轮廓沿屏幕竖直方向连续下移 */}
          {Array.from({ length: steps }, (_, k) => {
            const t = (steps - k) / steps;
            return plane(depth * t, flat.map(c => <path key={c.i} d={c.d} fill={sideFill(c.tone)} />), `e${k}`);
          })}
          {plane(depth, flat.map(c => <path key={c.i} d={c.d} fill="none" stroke="var(--theme-ink)" strokeOpacity=".12" strokeWidth="1.5" />), 'eline')}
          {/* 抬起那一块的凹槽:裁到槽口轮廓里,先铺暗色内壁,再把槽底(槽口下移一个厚度)铺成深色渐变,
              左上内壁向槽底投下柔影、右下槽口描一道受光细边 */}
          {up && (
            <g key="slot" transform={`translate(${gx} ${gy})`}>
              <g clipPath={`url(#${id}-slot)`}>
                <path d={up.d} transform={matrix} fill={`url(#${id}-slot-wall)`} />
                <g transform={`translate(0 ${depth})`}>
                  <path d={up.d} transform={matrix} fill={`url(#${id}-slot-floor)`} />
                </g>
                <g transform="translate(7 9)">
                  <path d={up.d} transform={matrix} fill="none" stroke="var(--campus-accent-deep)" strokeOpacity=".8" strokeWidth={r2(depth * 1.4)} filter={`url(#${id}-soft)`} />
                </g>
                <g transform="translate(-3 -4)">
                  <path d={up.d} transform={matrix} fill="none" stroke="var(--theme-surface)" strokeOpacity=".28" strokeWidth="3" />
                </g>
              </g>
              <path d={up.d} transform={matrix} fill="none" stroke="var(--campus-accent-deep)" strokeOpacity=".55" strokeWidth="2" />
            </g>
          )}

          {/* 顶面:渐变 + 光泽 + 倒角高光 + 拼缝 */}
          {plane(0, flat.map(c => (
            <g key={`f${c.i}`}>
              <path d={c.d} fill={faceFill(c.tone)} />
              <path d={c.d} fill={`url(#${id}-gloss)`} opacity=".7" />
              <path d={c.d} fill="none" stroke={`url(#${id}-bevel)`} strokeWidth="6" />
              <path d={c.d} fill="none" stroke="var(--theme-surface)" strokeOpacity=".9" strokeWidth="2.5" />
            </g>
          )), 'faces')}

          {/* 抬起的一块:悬空投影 + 侧壁 + 顶面 */}
          {up && plane(depth + 34, <path d={up.d} fill="var(--campus-accent-deep)" fillOpacity=".22" filter={`url(#${id}-blur)`} />, 'ushadow')}
          {up && Array.from({ length: steps }, (_, k) => {
            const t = (steps - k) / steps;
            return plane(liftY + depth * t, <path d={up.d} fill={sideFill('gold')} />, `ue${k}`);
          })}
          {up && plane(liftY, (
            <>
              <path d={up.d} fill={faceFill('gold')} />
              <path d={up.d} fill={`url(#${id}-gloss)`} />
              <path d={up.d} fill="none" stroke={`url(#${id}-bevel)`} strokeWidth="6" />
              <path d={up.d} fill="none" stroke="var(--campus-gold-hi)" strokeWidth="2" />
            </>
          ), 'up')}

          {/* 2×2 中央的核心圆台:略高出拼图面,最后画,压在中央 */}
          {grid && plane(0, <circle cx="0" cy="0" r={r2(s * 0.36)} fill="var(--theme-accent)" fillOpacity=".25" filter={`url(#${id}-soft)`} />, 'cshadow')}
          {grid && Array.from({ length: 8 }, (_, k) => plane(pillarTop + (depth * 0.6 - pillarTop) * ((8 - k) / 8), <circle cx="0" cy="0" r={r2(s * 0.3)} fill={`url(#${id}-accent-side)`} />, `ce${k}`))}
          {grid && plane(pillarTop, (
            <>
              <circle cx="0" cy="0" r={r2(s * 0.3)} fill={`url(#${id}-accent-face)`} />
              <circle cx="0" cy="0" r={r2(s * 0.3 - 9)} fill={`url(#${id}-core)`} />
              <circle cx="0" cy="0" r={r2(s * 0.3 - 17)} fill="none" stroke="var(--campus-gold-line)" strokeWidth="2" strokeDasharray="2 7" strokeLinecap="round" />
            </>
          ), 'core')}

          {/* 连接线:卡片 → 拼图块 */}
          {cells.map(c => {
            const k = cardOf(c);
            const tone = c.i === lifted ? 'var(--campus-gold)' : 'var(--theme-accent)';
            const py = c.cy + (c.i === lifted ? liftY : 0);
            if (k.side === 'below') {
              return <g key={`k${c.i}`}><line x1={c.cx} y1={r2(py + s * 0.24)} x2={c.cx} y2={k.top - 6} stroke={tone} strokeOpacity=".5" strokeWidth="2" strokeDasharray="2 7" strokeLinecap="round" /><circle cx={c.cx} cy={k.top - 6} r="5" fill={tone} /></g>;
            }
            const xa = k.side === 'left' ? k.width + 6 : k.left - 6;
            const edge = map(k.side === 'left' ? c.x + s * 0.06 : c.x + s * 0.94, c.y + s / 2);
            const xb = gx + edge.x;
            const yb = gy + edge.y + (c.i === lifted ? liftY : 0);
            return <g key={`k${c.i}`}><path d={`M ${xa} ${k.top} L ${r2((xa + xb) / 2)} ${k.top} L ${r2(xb)} ${r2(yb)}`} fill="none" stroke={tone} strokeOpacity=".5" strokeWidth="2" strokeDasharray="2 7" strokeLinecap="round" /><circle cx={xa} cy={k.top} r="5" fill={tone} /><circle cx={r2(xb)} cy={r2(yb)} r="6" fill="var(--theme-surface)" stroke={tone} strokeWidth="2.5" /></g>;
          })}
          {up && <Sparkles points={[[r2(up.cx - s * 0.62), r2(up.cy + liftY - s * 0.3), 13, 'star', 'gold'], [r2(up.cx + s * 0.66), r2(up.cy + liftY - s * 0.05), 8, 'star', 'gold'], [r2(up.cx + s * 0.2), r2(up.cy + liftY - s * 0.5), 5, 'dot', 'gold']]} />}
        </svg>

        {!grid && <KickerChip className="cp-g5-pz-kicker campus-rise" style={{ top: rowTop, ...enterDelay(2) }} text={p.core} />}
        {grid && (
          <div className="cp-g5-pz-core campus-rise" style={{ left: gx, top: r2(gy + pillarTop), width: r2(s * 0.56), height: r2(s * 0.36), ...enterDelay(6) }}>{p.core}</div>
        )}
        {cells.map(c => {
          const isUp = c.i === lifted;
          // 2×2 时文字从格心往外推一点,让开中央圆台;一排时紧挨抬起块的两块把文字往远离它的一侧推,免得被抬起块的榫头压住。
          // 一排时还要让开邻块伸进来的榫头:哪一侧是卯口(-1),文字就往另一侧挪。
          const nearUp = !grid && up && !isUp && Math.abs(c.c - up.c) === 1;
          const holeShift = (c.edges.left === -1 ? 1 : 0) - (c.edges.right === -1 ? 1 : 0);
          const away = grid
            ? map((c.c === 0 ? -1 : 1) * s * 0.12, (c.r === 0 ? -1 : 1) * s * 0.12)
            : map(holeShift * s * 0.1 + (nearUp ? Math.sign(c.c - up.c) * s * 0.06 : 0), nearUp ? s * 0.06 : 0);
          const px = c.cx + away.x;
          const py = c.cy + away.y + (isUp ? liftY : 0);
          return (
            <div key={c.i} className={`cp-g5-pz-piece campus-rise${c.tone === 'glass' ? ' is-glass' : ''}${c.tone === 'gold' ? ' is-gold' : ''}`} style={{ left: r2(px), top: r2(py), '--cp-g5-pz-no': `${Math.round(clamp(s * 0.18, 40, 64))}px`, '--cp-g5-pz-label': `${Math.round(clamp(s * 0.085, 21, 28))}px`, ...enterDelay(3 + c.i) }}>
              <div className="cp-g5-pz-no">{c.pc?.no}</div>
              <div className="cp-g5-pz-label">{c.pc?.label}</div>
            </div>
          );
        })}
        {cells.map(c => {
          const k = cardOf(c);
          return (
            <div key={`c${c.i}`} className={`cp-g5-pz-card cp-g5-glass campus-rise${c.i === lifted ? ' is-gold' : ''}${k.width < 320 ? ' is-narrow' : ''}`} style={{ left: k.left, width: k.width, top: k.top, transform: k.side === 'below' ? undefined : 'translateY(-50%)', ...enterDelay(7 + c.i) }}>
              <div className="cp-g5-pz-card-head">
                <NoSeal no={c.pc?.no} gold={c.i === lifted} />
                <h3 className="cp-g5-pz-card-title">{c.pc?.title}</h3>
              </div>
              <p className="cp-g5-pz-card-desc">{c.pc?.desc}</p>
            </div>
          );
        })}
      </div>
    </CampusFrame>
  );
}

PuzzlePieces.META = {
  id: 'puzzle-pieces',
  label: '特色 · 立体拼图',
  roles: ['relationship', 'breakdown', 'context'],
  defaults: DEFAULTS,
  copyBudgets: { title: 22, core: 8, 'pieces[].no': 2, 'pieces[].label': 5, 'pieces[].title': 10, 'pieces[].desc': 32 },
  controls: [
    { ...CHAPTER_CONTROL, default: 3 },
    { key: 'pieceCount', type: 'number', label: '拼图块数', default: 4, min: 3, max: 4, description: '4 块拼成 2×2(中央压核心圆章,说明卡分列左右);3 块拼成一排(核心写在上方胶囊里,说明卡排在下方)。' },
    { key: 'highlightIndex', type: 'number', label: '抬起的一块', default: 2, min: 0, max: 4, maxFromKey: 'pieceCount', description: '第几块拼图抬起并换成暖金色,原位露出凹槽;0 表示都不抬起。' },
  ],
};
