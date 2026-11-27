// 舞台卡片(特色页):3–5 张向中心微微转动的玻璃卡排成一道弧形墙,下方是发光的底座圆环,
// 圆环上浮着一枚立体数字球(如「4 大 / 改进方向」)。
// 透视感只靠卡片外形实现:每张卡画成梯形(离中心越近越小、越远),文字始终是正放的 HTML 文本,
// 放在梯形的内接矩形里,导出 PPTX 后可直接编辑;卡片外形、光环、球体是 SVG 图形。
import React from 'react';
import { useThemeStyle, enterDelay } from '../../../shared/style.jsx';
import { safeArray, safeRatio, clamp } from '../../../chart-safety.mjs';
import { CampusFrame, TitleRow, CHAPTER_CONTROL, TITLE_ROW_SPACE, useCampusLayout } from '../kit/chrome.jsx';
import { useFeatureAStyle, LinearGrad, RadialGrad, BlurFilter, numeralLayout } from '../kit/feature-a.jsx';

const DEFAULTS = {
  chapterIndex: 2,
  cardCount: 4,
  sectionNo: '2.5',
  title: '成本管理分析：四个改进方向',
  ballValue: '4',
  ballSuffix: '大',
  ballCaption: '改进方向',
  cards: [
    { no: '01', title: '思想革新化', body: '树立竞争观念、效益观念、经营观念和法制观念，改变只重事后算账的做法。' },
    { no: '02', title: '方法科学化', body: '融合国内经验与国外方法：目标成本管理、责任成本管理、厂内经济核算、本量利分析。' },
    { no: '03', title: '手段电子化', body: '应用计算机加速信息处理，建立成本管理信息系统，推广检测手段和监控装置。' },
    { no: '04', title: '组织合理化', body: '统一领导、分级管理，建立成本管理责任制度，把成本责任落实到每个环节。' },
    { no: '05', title: '示例方向', body: '舞台上最多放 5 张卡片，这一张是补充位的示例文字。' },
  ],
};

const CSS = `
.cp-sc{position:relative;flex:1;min-height:0;}
.cp-sc-svg{position:absolute;left:0;top:0;overflow:visible;}
.cp-sc-card{position:absolute;display:flex;flex-direction:column;align-items:flex-start;}
.cp-sc-chip{position:relative;isolation:isolate;display:flex;align-items:center;gap:12px;height:52px;padding:0 26px 0 20px;color:var(--theme-on-accent);white-space:nowrap;}
.cp-sc-chip-shape{position:absolute;inset:0;z-index:-1;border-radius:12px;background:var(--campus-fill);box-shadow:0 12px 22px rgb(var(--theme-accent-rgb) / .3);}
.cp-sc-card.is-gold .cp-sc-chip-shape{background:var(--campus-fill-gold);box-shadow:0 12px 22px var(--campus-spark-glow);}
.cp-sc-chip-lip{position:absolute;left:8px;right:8px;bottom:-7px;height:7px;z-index:-2;border-radius:0 0 10px 10px;background:var(--campus-accent-deep);opacity:.55;}
.cp-sc-card.is-gold .cp-sc-chip-lip{background:var(--campus-spark-deep);}
.cp-sc-no{font-family:var(--theme-font-serif);font-weight:700;font-size:24px;line-height:1;opacity:.82;font-variant-numeric:lining-nums;}
.cp-sc-title{font-family:var(--theme-font-serif);font-weight:700;font-size:28px;line-height:1;letter-spacing:.08em;}
.cp-sc-body{margin-top:28px;font-size:23px;line-height:1.72;color:var(--theme-ink);text-wrap:pretty;}
.cp-sc.is-dense .cp-sc-body{font-size:21px;line-height:1.62;margin-top:22px;}
.cp-sc.is-dense .cp-sc-title{font-size:25px;letter-spacing:.04em;}
.cp-sc.is-dense .cp-sc-chip{padding:0 18px 0 16px;gap:8px;}
.cp-sc-ball{position:absolute;display:flex;flex-direction:column;align-items:center;justify-content:center;color:var(--theme-on-accent);text-align:center;}
.cp-sc-ball-figure{display:flex;align-items:baseline;justify-content:center;gap:2px;}
.cp-sc-ball-value{font-family:var(--theme-font-serif);font-weight:700;font-size:92px;line-height:.9;font-variant-numeric:lining-nums;}
.cp-sc-ball-suffix{font-family:var(--theme-font-serif);font-weight:700;font-size:46px;line-height:1;}
.cp-sc-ball-caption{margin-top:12px;font-family:var(--theme-font-serif);font-weight:700;font-size:28px;line-height:1.2;letter-spacing:.12em;}
.cp-sc-ball-rule{width:44px;height:3px;margin-top:10px;border-radius:2px;background:var(--campus-spark);}
`;

/** 多边形的圆角路径(每个角用二次曲线切圆)。 */
function roundedPath(points, r) {
  const n = points.length;
  let d = '';
  for (let i = 0; i < n; i += 1) {
    const [x, y] = points[i];
    const [px, py] = points[(i - 1 + n) % n];
    const [nx, ny] = points[(i + 1) % n];
    const l1 = Math.max(1, Math.hypot(x - px, y - py));
    const l2 = Math.max(1, Math.hypot(nx - x, ny - y));
    const a = Math.min(r, l1 / 2);
    const b = Math.min(r, l2 / 2);
    const sx = x - safeRatio(x - px, l1, 0) * a;
    const sy = y - safeRatio(y - py, l1, 0) * a;
    const ex = x + safeRatio(nx - x, l2, 0) * b;
    const ey = y + safeRatio(ny - y, l2, 0) * b;
    d += `${i === 0 ? 'M' : 'L'}${sx.toFixed(1)} ${sy.toFixed(1)} Q${x.toFixed(1)} ${y.toFixed(1)} ${ex.toFixed(1)} ${ey.toFixed(1)} `;
  }
  return `${d}Z`;
}

export function StageCards(props) {
  useThemeStyle('campus-stage-cards-style', CSS);
  useFeatureAStyle();
  const p = { ...DEFAULTS, ...props };
  const { bodyW, bodyH } = useCampusLayout();
  const cards = safeArray(p.cards).slice(0, clamp(p.cardCount, 3, 5));
  const n = Math.max(1, cards.length);
  const W = bodyW;
  const H = bodyH - TITLE_ROW_SPACE;
  const cx = W / 2;
  // 球与底座:球半径随可用高度缩放,底座圆环在球的下半部。
  const R = Math.round(clamp(H * 0.165, 110, 146));
  const ballCy = H - R - 46;
  const ringCy = ballCy + R * 0.72;
  // 卡片:沿一道内凹的弧排开,中心处更远(更小),两端更近(更大);每张卡是梯形。
  const gap = n >= 5 ? 22 : 30;
  const cw = (W - (n - 1) * gap) / n;
  const cardH = Math.min(H - 150, 600);
  const yc = 10 + cardH / 2;
  const depth = n >= 5 ? 0.17 : 0.16;
  const f = x => 1 - depth * (1 - (safeRatio(x - cx, cx, 0) ** 2));
  const project = x => cx + (x - cx) * (1 - depth * 0.35 * (1 - (safeRatio(x - cx, cx, 0) ** 2)));
  const ballTop = ballCy - R - 18;
  const shapes = cards.map((card, i) => {
    const xl = i * (cw + gap);
    const xr = xl + cw;
    const fl = f(xl);
    const fr = f(xr);
    const pl = project(xl);
    const pr = project(xr);
    const tl = yc - (cardH / 2) * fl;
    const bl = yc + (cardH / 2) * fl;
    const tr = yc - (cardH / 2) * fr;
    const br = yc + (cardH / 2) * fr;
    const pts = [[pl, tl], [pr, tr], [pr, br], [pl, bl]];
    // 文字区:梯形的内接矩形;压在球上方的卡片,文字区下沿让出球的位置。
    const pad = n >= 5 ? 26 : 34;
    const left = pl + pad;
    const right = pr - pad;
    const top = Math.max(tl, tr) + 30;
    let bottom = Math.min(bl, br) - 26;
    if (pr > cx - R - 30 && pl < cx + R + 30) bottom = Math.min(bottom, ballTop - 8);
    const gold = i >= Math.ceil(n / 2);
    // 卡片底部的描边大序号(纯装饰,用大数字字形画;压在球上方的卡片不画)
    const overBall = pr > cx - R - 30 && pl < cx + R + 30;
    const centerCard = n % 2 === 1 && i === (n - 1) / 2;
    const ghost = centerCard ? null : { side: pl + (pr - pl) / 2 < cx ? 'l' : 'r', y: Math.min(bl, br) - 30, x: pl < cx ? pl + pad - 4 : pr - pad + 4, overBall };
    return { card, i, pts, left, right, top, bottom, gold, near: pl < cx ? 'l' : 'r', ghost };
  });
  const at = r => ({ left: cx - r, top: ballCy - r, width: r * 2, height: r * 2 });
  return (
    <CampusFrame chapterIndex={p.chapterIndex}>
      <TitleRow no={p.sectionNo} title={p.title} className="campus-rise" style={enterDelay(0)} />
      <div className={`cp-sc${n >= 5 ? ' is-dense' : ''}`}>
        <svg className="cp-sc-svg campus-fade" style={{ width: W, height: H, ...enterDelay(1) }} viewBox={`0 0 ${W} ${H}`} aria-hidden="true">
          <defs>
            <LinearGrad id="cp-sc-glass" x1={0} y1={0} x2={0} y2={1} stops={[[0, 'rgb(255 255 255 / .97)'], [0.7, 'rgb(255 255 255 / .86)'], [1, 'var(--campus-accent-mist)']]} />
            <LinearGrad id="cp-sc-edge" x1={0} y1={0} x2={1} y2={1} stops={[[0, 'rgb(255 255 255 / 1)'], [0.5, 'rgb(var(--theme-accent-rgb) / .16)'], [1, 'rgb(255 255 255 / .9)']]} />
            <LinearGrad id="cp-sc-sheen" x1={0} y1={0} x2={1} y2={0.4} stops={[[0, 'rgb(255 255 255 / .9)'], [0.4, 'rgb(255 255 255 / 0)']]} />
            <LinearGrad id="cp-sc-ring" x1={0} y1={0} x2={1} y2={0} stops={[[0, 'var(--campus-accent-lo)'], [0.5, 'var(--theme-accent)'], [1, 'var(--campus-accent-hi)']]} />
            <LinearGrad id="cp-sc-plate" x1={0} y1={0} x2={0} y2={1} stops={[[0, 'rgb(255 255 255 / .98)'], [1, 'var(--campus-accent-mist)']]} />
            <LinearGrad id="cp-sc-beam" x1={0} y1={0} x2={0} y2={1} stops={[[0, 'rgb(255 255 255 / 0)'], [1, 'rgb(255 255 255 / .75)']]} />
            <RadialGrad id="cp-sc-floorglow" stops={[[0, 'rgb(var(--theme-accent-rgb) / .22)'], [1, 'rgb(var(--theme-accent-rgb) / 0)']]} />
            <RadialGrad id="cp-sc-ball" cx={0.38} cy={0.32} r={0.75} stops={[[0, 'var(--campus-accent-pale)'], [0.22, 'var(--campus-accent-hi)'], [0.62, 'var(--theme-accent)'], [1, 'var(--campus-accent-deep)']]} />
            <RadialGrad id="cp-sc-spec" stops={[[0, 'rgb(255 255 255 / .75)'], [1, 'rgb(255 255 255 / 0)']]} />
            <LinearGrad id="cp-sc-ghost" x1={0} y1={0} x2={0} y2={1} stops={[[0, 'rgb(var(--theme-accent-rgb) / .13)'], [1, 'rgb(var(--theme-accent-rgb) / .015)']]} />
            <BlurFilter id="cp-sc-blur" std={16} />
            <BlurFilter id="cp-sc-blur-s" std={6} />
          </defs>
          {/* 地面光晕与底座圆环 */}
          <ellipse cx={cx} cy={ringCy + 6} rx={W * 0.46} ry={R * 1.05} style={{ fill: 'url(#cp-sc-floorglow)' }} />
          <ellipse cx={cx} cy={ringCy + 10} rx={R * 3.3} ry={R * 0.62} fill="none" style={{ stroke: 'rgb(var(--theme-accent-rgb) / .14)' }} strokeWidth="2" />
          <ellipse cx={cx} cy={ringCy + 16} rx={R * 2.45} ry={R * 0.5} style={{ fill: 'rgb(var(--theme-accent-rgb) / .2)' }} filter="url(#cp-sc-blur)" />
          <ellipse cx={cx} cy={ringCy + 8} rx={R * 2.35} ry={R * 0.46} fill="none" style={{ stroke: 'url(#cp-sc-ring)' }} strokeWidth="20" />
          <ellipse cx={cx} cy={ringCy + 2} rx={R * 2.35} ry={R * 0.46} fill="none" style={{ stroke: 'rgb(255 255 255 / .75)' }} strokeWidth="3" />
          <ellipse cx={cx} cy={ringCy} rx={R * 1.85} ry={R * 0.34} style={{ fill: 'url(#cp-sc-plate)', stroke: 'rgb(255 255 255 / .95)' }} strokeWidth="2" />
          <ellipse cx={cx} cy={ringCy} rx={R * 1.45} ry={R * 0.25} fill="none" style={{ stroke: 'rgb(var(--theme-accent-rgb) / .3)' }} strokeWidth="2" strokeDasharray="5 9" />
          <polygon points={`${cx - R * 1.3},${ringCy} ${cx + R * 1.3},${ringCy} ${cx + R * 0.9},${ballCy - R * 1.2} ${cx - R * 0.9},${ballCy - R * 1.2}`} style={{ fill: 'url(#cp-sc-beam)' }} opacity=".7" />
          {/* 玻璃卡:投影 + 玻璃面 + 发丝边 + 左上高光 */}
          {shapes.map(({ i, pts }) => (
            <path key={`s${i}`} d={roundedPath(pts.map(([x, y]) => [x, y + 22]), 26)} style={{ fill: 'rgb(var(--theme-accent-rgb) / .16)' }} filter="url(#cp-sc-blur)" />
          ))}
          {shapes.map(({ i, pts, near }) => {
            const [a, b, c, d] = pts;
            const lip = near === 'l' ? [[a[0], a[1] + 18], [a[0] + 9, a[1] + 22], [d[0] + 9, d[1] - 22], [d[0], d[1] - 18]] : [[b[0], b[1] + 18], [b[0] - 9, b[1] + 22], [c[0] - 9, c[1] - 22], [c[0], c[1] - 18]];
            return (
              <g key={`c${i}`}>
                <path d={roundedPath(pts, 26)} style={{ fill: 'url(#cp-sc-glass)', stroke: 'url(#cp-sc-edge)' }} strokeWidth="2.5" />
                <path d={roundedPath(pts, 26)} style={{ fill: 'url(#cp-sc-sheen)' }} opacity=".7" />
                <polygon points={lip.map(q => q.join(',')).join(' ')} style={{ fill: 'rgb(var(--theme-accent-rgb) / .1)' }} />
              </g>
            );
          })}
          {/* 卡底描边大序号 */}
          {shapes.map(({ i, ghost }) => {
            if (!ghost) return null;
            const lay = numeralLayout(i + 1);
            const gh = 128;
            const k = gh / (lay.y1 - lay.y0);
            const gw = (1342 * 2 - 60) * k;
            const gxl = ghost.side === 'l' ? ghost.x : ghost.x - gw;
            const zero = numeralLayout(0).glyphs[0];
            return (
              <g key={`g${i}`} transform={`translate(${gxl} ${ghost.y - gh}) scale(${k}) translate(0 ${-lay.y0})`} style={{ fill: 'url(#cp-sc-ghost)' }}>
                <path d={zero.d} />
                <path d={lay.glyphs[0].d} transform="translate(1282 0)" />
              </g>
            );
          })}
          {/* 立体球:落影 + 球体 + 白色厚边 + 高光 */}
          <ellipse cx={cx} cy={ringCy + 4} rx={R * 0.95} ry={R * 0.2} style={{ fill: 'rgb(var(--theme-accent-rgb) / .45)' }} filter="url(#cp-sc-blur-s)" />
          <circle cx={cx} cy={ballCy} r={R + 16} style={{ fill: 'rgb(255 255 255 / .55)', stroke: 'rgb(255 255 255 / .95)' }} strokeWidth="2" />
          <circle cx={cx} cy={ballCy} r={R + 4} style={{ fill: 'rgb(var(--theme-accent-rgb) / .22)' }} filter="url(#cp-sc-blur-s)" />
          <circle cx={cx} cy={ballCy} r={R} style={{ fill: 'url(#cp-sc-ball)' }} />
          <ellipse cx={cx - R * 0.32} cy={ballCy - R * 0.5} rx={R * 0.46} ry={R * 0.24} style={{ fill: 'url(#cp-sc-spec)' }} />
          <circle cx={cx} cy={ballCy} r={R - 10} fill="none" style={{ stroke: 'rgb(255 255 255 / .28)' }} strokeWidth="1.5" />
        </svg>
        {shapes.map(({ card, i, left, right, top, bottom, gold }) => (
          <div key={i} className={`cp-sc-card campus-rise${gold ? ' is-gold' : ''}`} style={{ left, top, width: right - left, height: Math.max(0, bottom - top), ...enterDelay(2 + i) }}>
            <div className="cp-sc-chip">
              <div className="cp-sc-chip-lip" aria-hidden="true" />
              <div className="cp-sc-chip-shape" aria-hidden="true" />
              <div className="cp-sc-no">{card?.no}</div>
              <div className="cp-sc-title">{card?.title}</div>
            </div>
            <p className="cp-sc-body">{card?.body}</p>
          </div>
        ))}
        <div className="cp-sc-ball campus-rise" style={{ ...at(R), ...enterDelay(3) }}>
          <div className="cp-sc-ball-figure">
            <div className="cp-sc-ball-value">{p.ballValue}</div>
            <div className="cp-sc-ball-suffix">{p.ballSuffix}</div>
          </div>
          <div className="cp-sc-ball-caption">{p.ballCaption}</div>
          <div className="cp-sc-ball-rule" aria-hidden="true" />
        </div>
      </div>
    </CampusFrame>
  );
}

StageCards.META = {
  id: 'stage-cards',
  label: '特色 · 弧形玻璃卡配底座数字球',
  roles: ['breakdown', 'actions', 'statement'],
  defaults: DEFAULTS,
  copyBudgets: { ballValue: 2, ballSuffix: 2, ballCaption: 5, 'cards[].title': 6, 'cards[].body': 56 },
  controls: [
    { ...CHAPTER_CONTROL, default: 2 },
    { key: 'cardCount', type: 'number', label: '卡片数量', default: 4, min: 3, max: 5, description: '弧形排开的玻璃卡数量;后一半卡片的标签用点缀金。' },
  ],
};
