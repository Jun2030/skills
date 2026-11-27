// 扇形展开卡:页面中央 3–6 张校色渐变卡片像折扇一样从底部一个轴心展开(每张有旋转、层叠投影和玻璃高光),
// 卡片上端各有一枚白色玻璃圆章写编号与短名,轴心是一枚立体圆钮写主题;左右两栏是与卡片编号对应的说明
// (两栏条数相等;单数张时正中那张的说明放在圆钮正下方的一张居中玻璃卡里)。
// 适合多维度展开、研究视角、课程 / 能力清单。
// 卡片与圆钮都是不含文字的 SVG 图形(卡片在 SVG 里旋转);编号、短名、说明都是不旋转的水平 HTML 文本。
import React from 'react';
import { useThemeStyle, enterDelay } from '../../../shared/style.jsx';
import { safeArray, safeRatio, clamp } from '../../../chart-safety.mjs';
import { CampusFrame, TitleRow, CHAPTER_CONTROL, TITLE_ROW_SPACE, useCampusLayout } from '../kit/chrome.jsx';
import { useSvgId, ToneDefs, Stop, arcPath, pt, r2 } from '../kit/feature-b.jsx';
import { useFeatureDStyle, MetalDefs, G6Point, rotate, pad2 } from '../kit/feature-d.jsx';

const DEFAULTS = {
  chapterIndex: 2,
  cardCount: 5,
  highlightIndex: 3,
  sectionNo: '2.1',
  title: '研究方法：五个视角展开管理会计分析',
  hubTitle: '研究方法',
  hubNote: '五个分析视角',
  cards: [
    { name: '作业成本', title: '以作业为核心归集成本', desc: '按资源、作业、成本对象、成本动因四要素核算。' },
    { name: '竞争对手', title: '比较价格与服务质量', desc: '区分直接竞争与替代性竞争两类对手。' },
    { name: '价值链', title: '消除不增值的作业', desc: '对不可消除的作业，尽可能提高效率。' },
    { name: '战略成本', title: '找出成本优劣的根源', desc: '逐项比较公司与关键对手的经营活动成本。' },
    { name: '营运管理', title: '多维度盈利能力分析', desc: '从区域、产品、部门、渠道、人员五个维度计量。' },
    { name: '成本管理', title: '四个改进方向', desc: '思想革新化、方法科学化、手段电子化、组织合理化。' },
  ],
};

// 扇面总张角(度),随卡片数增加。
const SPREAD = { 3: 60, 4: 74, 5: 88, 6: 100 };

const CSS = `
.cp-g6-fs{position:relative;flex:1;min-height:0;}
.cp-g6-fs-seal{position:absolute;transform:translate(-50%,-50%);display:flex;flex-direction:column;align-items:center;gap:4px;text-align:center;}
.cp-g6-fs-no{font-family:var(--theme-font-serif);font-weight:700;font-size:34px;line-height:1;color:var(--theme-accent);font-variant-numeric:lining-nums;letter-spacing:.02em;}
.cp-g6-fs-name{font-weight:700;font-size:22px;line-height:1.2;letter-spacing:.04em;color:var(--theme-ink);white-space:nowrap;}
.cp-g6-fs-seal.is-gold .cp-g6-fs-no{color:var(--campus-gold-lo);}
.cp-g6-fs-seal.is-gold .cp-g6-fs-name{color:var(--campus-gold-ink);}
.cp-g6-fs-seal.is-tight .cp-g6-fs-no{font-size:30px;}
.cp-g6-fs-seal.is-tight .cp-g6-fs-name{font-size:21px;letter-spacing:0;}
.cp-g6-fs-hub{position:absolute;transform:translate(-50%,-50%);display:flex;flex-direction:column;align-items:center;gap:6px;text-align:center;}
.cp-g6-fs-hub-title{font-family:var(--theme-font-serif);font-weight:700;font-size:32px;line-height:1.1;letter-spacing:.06em;color:var(--theme-on-accent);white-space:nowrap;}
.cp-g6-fs-hub-note{font-size:18px;line-height:1.2;letter-spacing:.08em;color:var(--campus-on-accent-muted);white-space:nowrap;}
.cp-g6-fs-col{position:absolute;top:0;bottom:0;display:flex;flex-direction:column;justify-content:center;gap:18px;padding-bottom:20px;}
.cp-g6-fs-card{padding:16px 22px 16px 16px;}
.cp-g6-fs-col.is-few .cp-g6-fs-card{padding-top:24px;padding-bottom:24px;}
.cp-g6-fs-mid{position:absolute;transform:translateX(-50%);padding:14px 30px 14px 18px;}
.cp-g6-fs-mid .cp-g6-point-desc{white-space:nowrap;}
`;

export function FanSpread(props) {
  useThemeStyle('campus-fan-spread-style', CSS);
  useFeatureDStyle();
  const p = { ...DEFAULTS, ...props };
  const id = useSvgId('cp-g6-fs');
  const { bodyW, bodyH } = useCampusLayout();
  const cards = safeArray(p.cards).slice(0, clamp(Math.round(p.cardCount) || 5, 3, 6));
  const n = clamp(cards.length, 3, 6);
  const hi = clamp(Math.round(p.highlightIndex) || 0, 0, n) - 1;
  const W = bodyW;
  const H = bodyH - TITLE_ROW_SPACE;
  const cx = r2(W / 2);
  // 单数张时正中那张的说明放在圆钮正下方,扇面整体上移 midH 给它让位;两侧说明栏条数相等。
  const odd = n % 2 === 1;
  const midIdx = odd ? (n - 1) / 2 : -1;
  const midH = odd ? 112 : 0;
  const py = r2(H - 118 - midH);
  const hubR = 92;
  const sideMin = clamp(Math.round(W * 0.21), 320, 380);
  const d0 = 36;
  // 卡片高度先按正文高度取;再从预设张角开始逐步收拢,直到扇面最外侧不碰到两侧说明栏(rail 等窄正文区下扇面更收、更高)。
  // 卡片宽度:相邻两张在顶端错开约一张卡宽。
  // 扇面最外圈虚线弧顶(轴心上方 d0 + ch + 66)与正文区顶部留约 20px。
  const ch = Math.min(H - 240 - midH, 560);
  const avail = W / 2 - sideMin - 36;
  let spread = SPREAD[n];
  let cw = 200;
  for (let k = 0; k < 24; k += 1) {
    const st = safeRatio(spread, n - 1, 30);
    cw = clamp(Math.round((d0 + ch) * st * Math.PI / 180 * 0.98), 150, 220);
    const hr = spread / 2 * Math.PI / 180;
    if (Math.sin(hr) * (d0 + ch) + Math.cos(hr) * cw / 2 <= avail) break;
    spread -= 3;
  }
  const half = spread / 2;
  const step = safeRatio(spread, n - 1, 30);
  const rad = half * Math.PI / 180;
  const sealR = r2(cw * 0.36);
  const sealD = d0 + ch - cw * 0.5;
  const fanHalfW = Math.sin(rad) * (d0 + ch) + Math.cos(rad) * cw / 2;
  const colW = Math.round(W / 2 - fanHalfW - 36);
  const items = cards.map((c, i) => {
    const deg = -half + i * step;
    const seal = rotate(0, -sealD, deg);
    return { ...c, i, deg, seal: { x: r2(cx + seal.x), y: r2(py + seal.y) }, gold: i === hi };
  });
  // 绘制顺序:两端在下、中间在上。
  const mid = (n - 1) / 2;
  const order = [...items].sort((a, b) => Math.abs(b.i - mid) - Math.abs(a.i - mid) || a.i - b.i);
  const sideItems = items.filter(it => it.i !== midIdx);
  const leftN = sideItems.length / 2;
  const cols = [sideItems.slice(0, leftN), sideItems.slice(leftN)];
  const midItem = odd ? items[midIdx] : null;
  const tight = cw < 170;

  return (
    <CampusFrame chapterIndex={p.chapterIndex}>
      <TitleRow no={p.sectionNo} title={p.title} className="campus-rise" style={enterDelay(0)} />
      <div className="cp-g6-fs">
        <svg className="cp-g6-svg campus-fade" style={{ left: 0, top: 0, width: W, height: H, ...enterDelay(1) }} viewBox={`0 0 ${W} ${H}`} aria-hidden="true">
          <ToneDefs id={id} tones={['accent', 'gold']} />
          <MetalDefs id={id} />
          <defs>
            <filter id={`${id}-blur`} x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="12" /></filter>
            <linearGradient id={`${id}-card`} x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" color="var(--campus-accent-hi)" />
              <Stop offset=".55" color="var(--theme-accent)" />
              <Stop offset="1" color="var(--campus-accent-lo)" />
            </linearGradient>
            <linearGradient id={`${id}-card-gold`} x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" color="var(--campus-gold-hi)" />
              <Stop offset=".55" color="var(--campus-gold)" />
              <Stop offset="1" color="var(--campus-gold-lo)" />
            </linearGradient>
            <linearGradient id={`${id}-glare`} x1="0" y1="0" x2="1" y2="0">
              <Stop offset="0" color="var(--theme-surface)" opacity=".38" />
              <Stop offset=".4" color="var(--theme-surface)" opacity=".1" />
              <Stop offset=".41" color="var(--theme-surface)" opacity="0" />
              <Stop offset="1" color="var(--theme-surface)" opacity="0" />
            </linearGradient>
          </defs>
          {/* 扇面背景:柔光 + 两道扇形虚线 + 放射细线 */}
          <circle cx={cx} cy={py} r={r2(d0 + ch + 40)} fill={`url(#${id}-halo)`} />
          <path d={arcPath(cx, py, d0 + ch + 34, -half - 14, half + 14)} fill="none" stroke="var(--theme-accent)" strokeOpacity=".2" strokeWidth="2" strokeDasharray="3 9" strokeLinecap="round" />
          <path d={arcPath(cx, py, d0 + ch + 66, -half - 8, half + 8)} fill="none" stroke="var(--theme-accent)" strokeOpacity=".12" strokeWidth="1.5" />
          {items.map(it => {
            const a = pt(cx, py, d0 + ch + 48, it.deg);
            return <circle key={it.i} cx={a.x} cy={a.y} r={it.gold ? 6 : 4} fill={it.gold ? 'var(--campus-gold)' : 'var(--theme-accent)'} fillOpacity={it.gold ? 1 : 0.45} />;
          })}
          <ellipse cx={cx} cy={r2(py + hubR + 6)} rx={r2(fanHalfW * 0.7)} ry="26" fill={`url(#${id}-shadow)`} />
          {order.map(it => {
            const x = r2(-cw / 2);
            const y = r2(-(d0 + ch));
            const fill = it.gold ? `url(#${id}-card-gold)` : `url(#${id}-card)`;
            return (
              <g key={it.i} transform={`translate(${cx} ${py}) rotate(${r2(it.deg)})`}>
                <rect x={r2(x + 8)} y={r2(y + 18)} width={cw} height={ch} rx="22" fill={it.gold ? 'var(--campus-gold-deep)' : 'var(--campus-accent-deep)'} opacity=".4" filter={`url(#${id}-blur)`} />
                <rect x={x} y={y} width={cw} height={ch} rx="22" fill={fill} />
                <rect x={x} y={y} width={cw} height={ch} rx="22" fill={`url(#${id}-glare)`} />
                <rect x={x} y={y} width={cw} height={r2(ch * 0.4)} rx="22" fill={`url(#${id}-gloss)`} />
                <rect x={r2(x + 9)} y={r2(y + 9)} width={r2(cw - 18)} height={r2(ch - 18)} rx="15" fill="none" stroke="var(--theme-surface)" strokeOpacity=".42" strokeWidth="1.5" />
                <rect x={x} y={y} width={cw} height={ch} rx="22" fill="none" stroke="var(--theme-surface)" strokeOpacity=".7" strokeWidth="2" />
                {/* 卡面纹样:圆章下方的一串渐小圆点 + 渐隐竖线 */}
                {[0, 1, 2].map(k => <circle key={k} cx="0" cy={r2(-sealD + sealR + 30 + k * 22)} r={r2(4.5 - k * 1.2)} fill={it.gold ? 'var(--campus-gold-deep)' : 'var(--theme-surface)'} fillOpacity={0.7 - k * 0.18} />)}
                <line x1="0" y1={r2(-sealD + sealR + 100)} x2="0" y2={r2(-d0 - ch * 0.18)} stroke="var(--theme-surface)" strokeOpacity=".28" strokeWidth="2" strokeDasharray="2 8" strokeLinecap="round" />
                {/* 白色玻璃圆章(不随旋转变形) */}
                <circle cx="0" cy={r2(-sealD + 6)} r={r2(sealR + 4)} fill="var(--theme-ink)" fillOpacity=".16" />
                <circle cx="0" cy={r2(-sealD)} r={r2(sealR + 4)} fill={it.gold ? `url(#${id}-metal-gold)` : 'var(--theme-surface)'} fillOpacity={it.gold ? 1 : 0.55} />
                <circle cx="0" cy={r2(-sealD)} r={sealR} fill="var(--theme-surface)" />
                <circle cx="0" cy={r2(-sealD)} r={r2(sealR - 7)} fill="none" stroke={it.gold ? 'var(--campus-gold-line)' : 'var(--campus-accent-line)'} strokeWidth="1.5" strokeDasharray="2 5" strokeLinecap="round" />
              </g>
            );
          })}
          {/* 轴心圆钮:金属外圈 + 校色球面 + 高光 */}
          <circle cx={r2(cx + 5)} cy={r2(py + 10)} r={r2(hubR + 10)} fill="var(--theme-accent)" fillOpacity=".22" filter={`url(#${id}-blur)`} />
          <circle cx={cx} cy={py} r={r2(hubR + 12)} fill="var(--theme-surface)" fillOpacity=".8" />
          <circle cx={cx} cy={py} r={hubR} fill={`url(#${id}-metal-gold)`} />
          <circle cx={cx} cy={py} r={r2(hubR - 10)} fill={`url(#${id}-disc-accent)`} />
          <circle cx={cx} cy={py} r={r2(hubR - 18)} fill="none" stroke="var(--theme-surface)" strokeOpacity=".4" strokeWidth="1.5" strokeDasharray="2 6" strokeLinecap="round" />
          <ellipse cx={r2(cx - hubR * 0.28)} cy={r2(py - hubR * 0.42)} rx={r2(hubR * 0.42)} ry={r2(hubR * 0.2)} fill="var(--theme-surface)" fillOpacity=".3" />
        </svg>

        {items.map(it => (
          <div className={`cp-g6-fs-seal campus-fade${it.gold ? ' is-gold' : ''}${tight ? ' is-tight' : ''}`} style={{ left: it.seal.x, top: it.seal.y, ...enterDelay(3 + it.i) }} key={it.i}>
            <div className="cp-g6-fs-no">{pad2(it.i + 1)}</div>
            <div className="cp-g6-fs-name">{it.name}</div>
          </div>
        ))}
        <div className="cp-g6-fs-hub campus-fade" style={{ left: cx, top: py, ...enterDelay(3) }}>
          <div className="cp-g6-fs-hub-title">{p.hubTitle}</div>
          <div className="cp-g6-fs-hub-note">{p.hubNote}</div>
        </div>

        {cols.map((list, ci) => (
          <div className={`cp-g6-fs-col ${ci ? 'is-right' : 'is-left'}${list.length <= 2 ? ' is-few' : ''}`} key={ci} style={ci ? { right: 0, width: colW } : { left: 0, width: colW }}>
            {list.map(it => (
              <div className={`cp-g6-fs-card cp-g6-glass${it.gold ? ' is-gold' : ''} campus-rise`} style={enterDelay(4 + it.i)} key={it.i}>
                <G6Point no={pad2(it.i + 1)} title={it.title} desc={it.desc} tone={it.gold ? 'gold' : 'accent'} />
              </div>
            ))}
          </div>
        ))}
        {midItem ? (
          <div className={`cp-g6-fs-mid cp-g6-glass${midItem.gold ? ' is-gold' : ''} campus-rise`} style={{ left: cx, top: r2(py + hubR + 16), width: 'max-content', maxWidth: r2(Math.max(420, W - 2 * colW - 24)), ...enterDelay(4 + midItem.i) }}>
            <G6Point no={pad2(midItem.i + 1)} title={midItem.title} desc={midItem.desc} tone={midItem.gold ? 'gold' : 'accent'} />
          </div>
        ) : null}
      </div>
    </CampusFrame>
  );
}

FanSpread.META = {
  id: 'fan-spread',
  label: '特色 · 扇形展开卡',
  roles: ['breakdown', 'context', 'observation'],
  defaults: DEFAULTS,
  copyBudgets: { title: 28, hubTitle: 5, hubNote: 8, 'cards[].name': 4, 'cards[].title': 11, 'cards[].desc': 26 },
  controls: [
    { ...CHAPTER_CONTROL },
    { key: 'cardCount', type: 'number', label: '扇叶数量', default: 5, min: 3, max: 6, countArrays: ['cards'], description: '展开的卡片张数;说明按编号分到左右两栏(两栏条数相等,单数时正中那张的说明放在圆钮正下方)。' },
    { key: 'highlightIndex', type: 'number', label: '强调第几张', default: 3, min: 0, max: 6, maxFromKey: 'cardCount', description: '用暖金强调的那一张卡片(两侧对应的说明同步强调);填 0 表示不强调。' },
  ],
};
