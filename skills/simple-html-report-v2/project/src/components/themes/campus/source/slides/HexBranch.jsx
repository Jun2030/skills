// 六边形分支:左侧一枚立体渐变大六边形(外罩一层玻璃六边形)写「数字 + 词」,向右用弧线分出 2–4 枚白色小六边形
// (各写一个短标题),每枚小六边形连到一张白卡,卡里是 2–3 条编号要点。小六边形沿弧线排开,中间的更靠右。
// 适合「N 项举措 / N 项改进 / N 个方面」这类一总多分、每一分下面还有细节的内容。
import React from 'react';
import { useThemeStyle, enterDelay } from '../../../shared/style.jsx';
import { safeArray, clamp } from '../../../chart-safety.mjs';
import { CampusFrame, TitleRow, CHAPTER_CONTROL, TITLE_ROW_SPACE, useCampusLayout } from '../kit/chrome.jsx';
import { useFeatureBStyle, useSvgId, ToneDefs, Stop, HexPrism, hexPoints, roundedPolyPath, r2 } from '../kit/feature-b.jsx';

const DEFAULTS = {
  chapterIndex: 3,
  branchCount: 3,
  sectionNo: '3.1',
  title: '无监督三维重建的三项改进',
  value: '3',
  unit: '项改进',
  note: 'UNSUPERVISED MVS',
  branches: [
    { title: '光度一致性', points: [{ text: '在像素差异项之外加入图像梯度项。' }, { text: '像素梯度差异的约束力更强，损失更鲁棒。' }, { text: '新增项由系数 α 控制权重。' }] },
    { title: '遮挡处理', points: [{ text: '只取光度一致性最好的 top-K 个不相交视图计算损失。' }, { text: '代价体由 H×W×M 经 top-K 选择变为 H×W×K。' }, { text: '无需额外标注，隐式处理遮挡。' }] },
    { title: '损失函数', points: [{ text: 'L_SSIM：图像块级的结构化相似性损失。' }, { text: 'L_Smooth：深度图梯度感知平滑损失。' }, { text: 'L_photo：鲁棒光度一致性损失，三项加权求和。' }] },
    { title: '网络结构', points: [{ text: '参考 MVSNet 的四部分网络架构。' }, { text: '嫁接有监督网络做无监督训练，使用无真值数据集。' }, { text: '源图像与参考图像的特征提取分支共享权值。' }] },
  ],
};

const SQ3 = 1.7320508;

const CSS = `
.cp-hb{position:relative;flex:1;min-height:0;}
.cp-hb-core{position:absolute;transform:translate(-50%,-50%);display:flex;flex-direction:column;align-items:center;text-align:center;color:var(--theme-on-accent);}
.cp-hb-value{font-family:var(--theme-font-serif);font-weight:700;line-height:.92;font-variant-numeric:lining-nums;}
.cp-hb-unit{margin-top:6px;font-family:var(--theme-font-serif);font-weight:700;line-height:1.15;letter-spacing:.12em;white-space:nowrap;}
.cp-hb-note{margin-top:14px;font-size:18px;font-weight:600;letter-spacing:.16em;color:var(--campus-on-accent-muted);white-space:nowrap;}
.cp-hb-sub{position:absolute;transform:translate(-50%,-50%);font-family:var(--theme-font-serif);font-weight:700;font-size:27px;line-height:1.25;letter-spacing:.04em;color:var(--theme-accent);text-align:center;text-wrap:balance;}
.cp-hb-card{position:absolute;isolation:isolate;display:flex;flex-direction:column;justify-content:center;gap:10px;padding:18px 34px 18px 0;}
.cp-hb-card-bg{position:absolute;inset:0;z-index:-1;border-radius:var(--campus-radius);background:var(--theme-surface);border:1px solid var(--campus-card-edge);box-shadow:var(--campus-shadow);}
.cp-hb-point{display:flex;align-items:flex-start;gap:14px;}
.cp-hb-point-no{flex:none;display:grid;place-items:center;width:30px;height:30px;margin-top:2px;border-radius:50%;background:var(--campus-fill);color:var(--theme-on-accent);font-family:var(--theme-font-serif);font-weight:700;font-size:18px;line-height:1;box-shadow:0 4px 10px rgb(var(--theme-accent-rgb) / .25);}
.cp-hb-point-text{flex:1;min-width:0;font-size:22px;line-height:1.5;color:var(--theme-ink);text-wrap:pretty;}
.cp-hb.is-4 .cp-hb-point-text{font-size:21px;line-height:1.42;}
.cp-hb.is-4 .cp-hb-card{gap:6px;padding-top:12px;padding-bottom:12px;}
.cp-hb.is-4 .cp-hb-point-no{width:28px;height:28px;font-size:17px;}
.cp-hb.is-4 .cp-hb-sub{font-size:25px;}
`;

export function HexBranch(props) {
  useThemeStyle('campus-hex-branch-style', CSS);
  useFeatureBStyle();
  const p = { ...DEFAULTS, ...props };
  const id = useSvgId('cp-hb');
  const { bodyW, bodyH } = useCampusLayout();
  const branches = safeArray(p.branches).slice(0, clamp(Math.round(p.branchCount) || 3, 2, 4));
  const k = Math.max(1, branches.length);
  const W = bodyW;
  const H = bodyH - TITLE_ROW_SPACE;
  // 主六边形(平顶,左右是尖角):半径受高度和宽度约束,外罩一层大一号的玻璃六边形。
  const Rm = Math.round(Math.min(H * 0.29, W * 0.125, 230));
  const mx = Math.round(Rm * 1.2);
  const my = Math.round(H / 2 - Rm * 0.04);
  const depth = Math.round(Rm * 0.09);
  // 分支:每枚小六边形占一行,行高均分;小六边形沿弧线排开,中间的更靠右。
  const slot = H / k;
  const rs = Math.round(Math.min(98, (slot - 22) / SQ3));
  const baseX = mx + Rm * 1.2 + 110 + rs;
  const bulge = k >= 3 ? 70 : 40;
  const half = (k - 1) / 2;
  const subs = branches.map((b, i) => {
    const y = r2(slot * (i + 0.5));
    const t = half > 0 ? (i - half) / half : 0;
    const x = r2(baseX + bulge * (1 - t * t));
    return { b, i, x, y };
  });
  const cardH = Math.round(Math.min(slot - 18, 196));
  const cardLeft = sub => r2(sub.x + rs * 0.55);
  const innerPts = hexPoints(mx, my, Rm * 0.84, true);
  return (
    <CampusFrame chapterIndex={p.chapterIndex}>
      <TitleRow no={p.sectionNo} title={p.title} className="campus-rise" style={enterDelay(0)} />
      <div className={`cp-hb is-${k}`}>
        {subs.map(s => (
          <div className="cp-hb-card campus-rise" key={s.i} style={{ left: cardLeft(s), top: s.y - cardH / 2, width: W - cardLeft(s), height: cardH, paddingLeft: rs * 0.55 + 46, ...enterDelay(4 + s.i) }}>
            <div className="cp-hb-card-bg" aria-hidden="true" />
            {safeArray(s.b?.points).slice(0, 3).map((pt, j) => (
              <div className="cp-hb-point" key={j}>
                <div className="cp-hb-point-no">{j + 1}</div>
                <p className="cp-hb-point-text">{pt?.text}</p>
              </div>
            ))}
          </div>
        ))}
        <svg className="cp-fb-svg campus-fade" style={{ left: 0, top: 0, width: W, height: H, ...enterDelay(1) }} viewBox={`0 0 ${W} ${H}`} aria-hidden="true">
          <ToneDefs id={id} tones={['accent']} />
          <defs>
            <linearGradient id={`${id}-halo`} x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" color="var(--campus-fb-accent-mist)" opacity=".35" />
              <Stop offset="1" color="var(--campus-fb-accent-pale)" opacity=".9" />
            </linearGradient>
            <linearGradient id={`${id}-sub`} x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" color="var(--theme-surface)" />
              <Stop offset=".75" color="var(--theme-surface)" />
              <Stop offset="1" color="var(--campus-fb-accent-pale)" />
            </linearGradient>
            <filter id={`${id}-blur`} x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="12" /></filter>
          </defs>
          {subs.map(s => (
            <path key={s.i} d={`M ${r2(mx + Rm)} ${my} C ${r2(mx + Rm + 90)} ${my}, ${r2(s.x - rs - 90)} ${s.y}, ${r2(s.x - rs)} ${s.y}`} fill="none" stroke="var(--campus-accent-line)" strokeWidth="2.5" />
          ))}
          <path d={roundedPolyPath(hexPoints(mx, my, Rm * 1.2, true), Rm * 0.08)} fill={`url(#${id}-halo)`} stroke="var(--theme-surface)" strokeWidth="3" />
          <path d={roundedPolyPath(hexPoints(mx, my, Rm * 1.1, true), Rm * 0.07)} fill="none" stroke="var(--theme-surface)" strokeOpacity=".8" strokeWidth="1.5" />
          <HexPrism id={id} cx={mx} cy={my} r={Rm} depth={depth} tone="accent" flat glass={false} corner={Rm * 0.08} />
          <path d={roundedPolyPath(innerPts, Rm * 0.06)} fill="none" stroke="var(--theme-surface)" strokeOpacity=".5" strokeWidth="2" />
          {subs.map(s => (
            <g key={s.i}>
              <path d={roundedPolyPath(hexPoints(s.x + 4, s.y + 12, rs, true), rs * 0.14)} fill="var(--theme-accent)" fillOpacity=".22" filter={`url(#${id}-blur)`} />
              <path d={roundedPolyPath(hexPoints(s.x, s.y, rs, true), rs * 0.14)} fill={`url(#${id}-sub)`} stroke="var(--theme-surface)" strokeWidth="3" />
              <path d={roundedPolyPath(hexPoints(s.x, s.y, rs * 0.86, true), rs * 0.12)} fill="none" stroke="var(--campus-accent-line)" strokeOpacity=".6" strokeWidth="1.5" strokeDasharray="3 6" />
              <circle cx={r2(s.x - rs)} cy={s.y} r="7" fill="var(--theme-surface)" stroke="var(--theme-accent)" strokeWidth="3" />
            </g>
          ))}
          <circle cx={r2(mx + Rm)} cy={my} r="8" fill="var(--campus-spark)" stroke="var(--theme-surface)" strokeWidth="3" />
        </svg>
        <div className="cp-hb-core campus-fade" style={{ left: mx, top: my, ...enterDelay(2) }}>
          <div className="cp-hb-value" style={{ fontSize: Math.round(Rm * 0.72) }}>{p.value}</div>
          <div className="cp-hb-unit" style={{ fontSize: Math.round(Rm * 0.2) }}>{p.unit}</div>
          {p.note ? <div className="cp-hb-note">{p.note}</div> : null}
        </div>
        {subs.map(s => (
          <div className="cp-hb-sub campus-fade" key={s.i} style={{ left: s.x, top: s.y, width: Math.round(rs * 1.45), ...enterDelay(3 + s.i) }}>{s.b?.title}</div>
        ))}
      </div>
    </CampusFrame>
  );
}

HexBranch.META = {
  id: 'hex-branch',
  label: '特色 · 六边形分支',
  roles: ['breakdown', 'actions', 'result'],
  defaults: DEFAULTS,
  copyBudgets: { value: 3, unit: 5, note: 20, 'branches[].title': 6, 'branches[].points[].text': 28 },
  controls: [
    { ...CHAPTER_CONTROL, default: 3 },
    { key: 'branchCount', type: 'number', label: '分支数量', default: 3, min: 2, max: 4, description: '从主六边形分出的小六边形数量,每枚连一张要点卡(每卡最多 3 条要点)。' },
  ],
};
