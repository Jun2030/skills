// 技术路线图:竖向分层的分支流程——顶部「研究问题」→「理论与方法」(1–4 项)→「研究内容」(2–4 条并列分支,
// 每支 1–3 个节点,支内自上而下)→「验证与成果」(1–3 项);层与层之间是分叉 / 汇聚的总线箭头,左侧一列阶段标签。
// 几何按外壳的正文区尺寸计算(useCampusLayout),研究内容层按最长分支的节点数自动分配高度;连线是 SVG,文字都是独立文本。
// 已有现成路线图时可切到「改用图片」。适合开题报告、经管类论文的研究思路 / 技术路线页。
import React from 'react';
import { useThemeStyle, enterDelay } from '../../../shared/style.jsx';
import { safeArray, safeNumber, safeDenominator, safeMax, safeMin, clamp } from '../../../chart-safety.mjs';
import { CampusFrame, TitleRow, ConclusionBar, CHAPTER_CONTROL, TITLE_ROW_SPACE, CONCLUSION_SPACE, useCampusLayout, SparkStar } from '../kit/chrome.jsx';
import { useDiagramStyle, WireLayer, NumBadge, DiagramImage, diagramMediaControls, isImageMode, r1 } from '../kit/diagram.jsx';

const DEFAULTS = {
  chapterIndex: 2,
  mediaMode: 'auto',
  methodCount: 4,
  branchCount: 3,
  resultCount: 2,
  showConclusion: true,
  sectionNo: '2.4',
  title: '研究路线',
  stages: [
    { no: '01', name: '提出问题' },
    { no: '02', name: '理论方法' },
    { no: '03', name: '研究内容' },
    { no: '04', name: '验证成果' },
  ],
  question: { kicker: '核心问题', title: '复杂环境下观测量异常时，如何实现正常、精确、连续的定位' },
  methods: [
    { title: '卫星 / 惯导深组合理论' },
    { title: '最大似然估计' },
    { title: '权函数抗差估计' },
    { title: '频率稳定度传递' },
  ],
  branches: [
    { no: '1', title: '分析问题', labels: ['观测量对跟踪环路与定位精度的影响', '限制相干积分时间的因素'] },
    { no: '2', title: '搭建平台', labels: ['软件接收机', '惯导解算模块', '导航滤波器'] },
    { no: '3', title: '解决问题', labels: ['权函数抗差，优化导航滤波器', '最大似然估计 + 惯导辅助，提高灵敏度'] },
    { no: '4', title: '第四条分支', labels: ['在这里写研究节点', '一支最多三个节点'] },
  ],
  results: [
    { title: '性能分析', desc: '仿真数据与实测数据双重验证' },
    { title: '总结与展望', desc: '归纳结论，提出后续研究方向' },
    { title: '第三项成果', desc: '在这里写成果或验证方式' },
  ],
  imageCaption: '图 2-3 研究路线图',
  conclusionLabel: '研究难点',
  conclusion: '软件仿真平台的搭建；卫星与惯导数据的同步采集与读取。',
};

const RAIL_W = 148;        // 左侧阶段标签列宽
const RAIL_GAP = 30;
const LAYER_GAP = 46;      // 层与层之间留给箭头 / 总线的高度
const Q_H = 90;
const M_H = 72;
const RES_H = 98;
const HEAD_H = 56;         // 分支卡头
const COL_GAP = 26;

const CSS = `
.cp-g2-tr{position:relative;flex:1;min-height:0;}
.cp-g2-tr-band{position:absolute;border-radius:18px;background:rgb(var(--theme-accent-rgb) / .035);pointer-events:none;}
.cp-g2-tr-band.is-even{background:transparent;border:1.5px dashed rgb(var(--theme-accent-rgb) / .12);}
/* 左侧阶段标签:竖向渐隐轨道 + 渐变书签(编号 + 阶段名) */
.cp-g2-tr-spine{position:absolute;width:3px;border-radius:2px;background:linear-gradient(180deg,rgb(var(--theme-accent-rgb) / .5) 0%,rgb(var(--theme-accent-rgb) / .12) 100%);}
.cp-g2-tr-stage{position:absolute;display:flex;flex-direction:column;justify-content:center;gap:6px;padding:0 18px 0 20px;color:var(--theme-on-accent);}
.cp-g2-tr-stage-shape{position:absolute;inset:0;z-index:-1;background:var(--campus-fill-deep);border-radius:12px 0 0 12px;clip-path:polygon(0 0,calc(100% - 18px) 0,100% 50%,calc(100% - 18px) 100%,0 100%);}
.cp-g2-tr-stage{isolation:isolate;}
.cp-g2-tr-stage-no{font-family:var(--theme-font-serif);font-weight:700;font-size:20px;line-height:1;letter-spacing:.06em;color:var(--campus-spark);font-variant-numeric:lining-nums;}
.cp-g2-tr-stage-name{font-family:var(--theme-font-serif);font-weight:700;font-size:23px;line-height:1.2;letter-spacing:.06em;}
/* 研究问题:渐变横条 + 半透明标签 + 点缀色星标 */
.cp-g2-tr-q{position:absolute;display:flex;align-items:center;gap:22px;padding:0 34px 0 18px;border-radius:var(--campus-radius);background:var(--campus-fill-deep);color:var(--theme-on-accent);box-shadow:var(--campus-shadow-lift);overflow:hidden;}
.cp-g2-tr-q-kicker{flex:none;display:flex;align-items:center;gap:8px;height:40px;padding:0 16px 0 12px;border-radius:999px;background:var(--campus-on-accent-glass);font-size:19px;font-weight:700;letter-spacing:.1em;white-space:nowrap;}
.cp-g2-tr-q-star{flex:none;display:block;color:var(--campus-spark);}
.cp-g2-tr-q-title{flex:1;min-width:0;font-family:var(--theme-font-serif);font-weight:700;font-size:26px;line-height:1.35;letter-spacing:.03em;text-wrap:balance;}
.cp-g2-tr-q-orb{position:absolute;right:-40px;top:-60px;width:180px;height:180px;border-radius:50%;background:rgb(255 255 255 / .08);pointer-events:none;}
/* 理论与方法:白卡,左侧渐变竖条 + 校色小菱形 */
.cp-g2-tr-m{position:absolute;display:flex;align-items:center;gap:14px;padding:0 20px 0 26px;}
.cp-g2-tr-m::after{content:'';position:absolute;left:0;top:14px;bottom:14px;width:5px;border-radius:0 3px 3px 0;background:var(--campus-fill-bar);}
.cp-g2-tr-m-text{min-width:0;font-family:var(--theme-font-serif);font-weight:700;font-size:23px;line-height:1.3;color:var(--theme-ink);text-wrap:balance;}
/* 研究内容:分支栏(浅底虚线框)+ 渐变卡头 + 白色节点 */
.cp-g2-tr-col{position:absolute;border-radius:18px;background:var(--theme-surface);border:1px solid var(--campus-card-edge);box-shadow:var(--campus-shadow);}
.cp-g2-tr-head{position:absolute;display:flex;align-items:center;gap:12px;padding:0 18px;border-radius:14px 14px 4px 4px;background:var(--campus-fill);color:var(--theme-on-accent);box-shadow:0 8px 18px rgb(var(--theme-accent-rgb) / .24);}
.cp-g2-tr-head .cp-g2-badge{background:var(--theme-surface);color:var(--theme-accent);box-shadow:none;}
.cp-g2-tr-head-title{min-width:0;font-family:var(--theme-font-serif);font-weight:700;font-size:24px;line-height:1.2;letter-spacing:.06em;white-space:nowrap;}
.cp-g2-tr-node{position:absolute;display:flex;align-items:center;gap:12px;padding:0 16px 0 18px;border-radius:12px;background:var(--campus-accent-wash);border:1.5px solid rgb(var(--theme-accent-rgb) / .16);}
.cp-g2-tr-node-mark{flex:none;width:9px;height:9px;border-radius:2px;background:var(--campus-fill);transform:rotate(45deg);}
.cp-g2-tr-node-text{min-width:0;font-size:21px;line-height:1.4;color:var(--theme-ink);text-wrap:pretty;}
.cp-g2-tr.is-tight .cp-g2-tr-node-text{font-size:19px;line-height:1.35;}
/* 验证与成果:白卡 + 渐变顶边,最后一项带点缀色星标 */
.cp-g2-tr-res{position:absolute;display:flex;flex-direction:column;justify-content:center;gap:6px;padding:16px 26px 14px;text-align:center;align-items:center;}
.cp-g2-tr-res-cap{position:absolute;left:24px;right:24px;top:0;height:5px;border-radius:0 0 4px 4px;background:var(--campus-fill);}
.cp-g2-tr-res-title{display:flex;align-items:center;gap:10px;font-family:var(--theme-font-serif);font-weight:700;font-size:25px;line-height:1.25;letter-spacing:.06em;color:var(--theme-accent);}
.cp-g2-tr-res-star{flex:none;display:block;color:var(--campus-spark);}
.cp-g2-tr-res-desc{font-size:19px;line-height:1.45;color:var(--theme-muted);}
.cp-g2-tr-media{flex:1;min-height:0;display:flex;}
`;

export function TechRoute(props) {
  useDiagramStyle();
  useThemeStyle('campus-tech-route-style', CSS);
  const p = { ...DEFAULTS, ...props };
  const { bodyW, bodyH } = useCampusLayout();
  const image = isImageMode(p);
  const stages = safeArray(p.stages).slice(0, 4);
  const methods = safeArray(p.methods).slice(0, clamp(p.methodCount, 1, 4));
  const branches = safeArray(p.branches).slice(0, clamp(p.branchCount, 2, 4));
  const results = safeArray(p.results).slice(0, clamp(p.resultCount, 1, 3));
  const q = p.question || {};

  const W = bodyW;
  const H = bodyH - TITLE_ROW_SPACE - (p.showConclusion ? CONCLUSION_SPACE : 0);
  const x0 = RAIL_W + RAIL_GAP;
  const DW = W - x0;
  const k = Math.max(1, safeMax(branches.map(b => safeArray(b?.labels).slice(0, 3).length), 1));
  // 研究内容层吃掉剩余高度;节点高度按最长分支的节点数分配
  const resH0 = H - Q_H - M_H - RES_H - LAYER_GAP * 3;
  const nodeGap = 20;
  const colPad = 12;
  const nodeH = clamp((resH0 - HEAD_H - colPad * 2 - 10 - (k - 1) * nodeGap) / safeDenominator(k, 1), 44, 92);
  const resH = Math.min(resH0, HEAD_H + 10 + colPad * 2 + k * nodeH + (k - 1) * nodeGap + 4);
  const spare = Math.max(0, resH0 - resH);
  const gapY = LAYER_GAP + spare / 4;
  const y = { q: 0, m: Q_H + gapY, r: Q_H + M_H + gapY * 2, s: Q_H + M_H + resH + gapY * 3 };
  const rowH = { q: Q_H, m: M_H, r: resH, s: RES_H };
  const tight = nodeH < 60;

  // 研究问题:居中,宽度 76%
  const qW = DW * 0.78;
  const qX = x0 + (DW - qW) / 2;
  const cx = x0 + DW / 2;
  // 理论与方法:等宽并排(1 项时居中 44%)
  const mGap = 24;
  const mW = methods.length === 1 ? DW * 0.44 : (DW - (methods.length - 1) * mGap) / safeDenominator(methods.length, 1);
  const mX0 = methods.length === 1 ? x0 + (DW - mW) / 2 : x0;
  // 研究内容:分支栏
  const colW = (DW - (branches.length - 1) * COL_GAP) / safeDenominator(branches.length, 1);
  const cols = branches.map((b, i) => ({ x: x0 + i * (colW + COL_GAP), b, nodes: safeArray(b?.labels).slice(0, 3) }));
  // 验证与成果
  const sGap = 30;
  const sW = Math.min(520, (DW - (results.length - 1) * sGap) / safeDenominator(results.length, 1));
  const sX0 = x0 + (DW - (results.length * sW + (results.length - 1) * sGap)) / 2;

  const wires = [];
  // 问题 → 方法层(一支粗箭头)
  wires.push({ points: [[cx, y.q + Q_H + 2], [cx, y.m - 4]], kind: 'main', tail: true });
  // 方法层 → 各分支(分叉总线)
  const bus1 = y.m + M_H + gapY * 0.5;
  const colMid = c => c.x + colW / 2;
  wires.push({ points: [[cx, y.m + M_H + 2], [cx, bus1]], kind: 'main', head: false, tail: true });
  if (cols.length > 1) wires.push({ points: [[colMid(cols[0]), bus1], [colMid(cols[cols.length - 1]), bus1]], kind: 'main', head: false });
  cols.forEach(c => wires.push({ points: [[colMid(c), bus1], [colMid(c), y.r - 4]], kind: 'main' }));
  // 分支内:节点之间的短箭头
  const nodeY = j => y.r + HEAD_H + 10 + colPad + j * (nodeH + nodeGap);
  // 各分支 → 汇聚总线 → 各成果
  const bus2 = y.r + resH + gapY * 0.5;
  cols.forEach(c => wires.push({ points: [[colMid(c), y.r + resH + 2], [colMid(c), bus2]], kind: 'main', head: false, tail: true }));
  const sMid = i => sX0 + i * (sW + sGap) + sW / 2;
  const ends = [...cols.map(colMid), ...results.map((_, i) => sMid(i))];
  if (cols.length && results.length) {
    wires.push({ points: [[safeMin(ends, 0), bus2], [safeMax(ends, 0), bus2]], kind: 'main', head: false });
  }
  results.forEach((_, i) => wires.push({ points: [[sMid(i), bus2], [sMid(i), y.s - 4]], kind: 'main' }));

  const inner = [];
  cols.forEach(c => c.nodes.forEach((_, j) => {
    if (j === 0) return;
    inner.push({ points: [[colMid(c), nodeY(j - 1) + nodeH + 1], [colMid(c), nodeY(j) - 1]], kind: 'sub', headSize: 11 });
  }));
  const rowKeys = ['q', 'm', 'r', 's'];
  const diagram = (
    <div className={`cp-g2-tr cp-g2-stage${tight ? ' is-tight' : ''}`} style={{ width: W, height: r1(H) }}>
      {/* 层底纹 */}
      {rowKeys.map((key, i) => (
        <div key={`b${key}`} className={`cp-g2-tr-band${i % 2 ? ' is-even' : ''} campus-fade`} style={{ left: r1(x0 - 14), top: r1(y[key] - 10), width: r1(DW + 28), height: r1(rowH[key] + 20), ...enterDelay(1) }} aria-hidden="true" />
      ))}
      <div className="cp-g2-tr-spine campus-fade" style={{ left: r1(RAIL_W / 2 - 1.5), top: r1(Q_H / 2), height: r1(y.s + RES_H / 2 - Q_H / 2), ...enterDelay(1) }} aria-hidden="true" />
      {stages.map((s, i) => {
        const key = rowKeys[i];
        const h = Math.min(rowH[key], 96);
        return (
          <div key={`s${i}`} className="cp-g2-tr-stage campus-rise" style={{ left: 0, top: r1(y[key] + rowH[key] / 2 - h / 2), width: RAIL_W, height: r1(h), ...enterDelay(1 + i) }}>
            <div className="cp-g2-tr-stage-shape" aria-hidden="true" />
            <div className="cp-g2-tr-stage-no">{s?.no}</div>
            <div className="cp-g2-tr-stage-name">{s?.name}</div>
          </div>
        );
      })}
      <WireLayer W={W} H={H} wires={wires} className="campus-fade" style={enterDelay(3)} />
      <div className="cp-g2-tr-q campus-rise" style={{ left: r1(qX), top: r1(y.q), width: r1(qW), height: Q_H, ...enterDelay(2) }}>
        <div className="cp-g2-tr-q-orb" aria-hidden="true" />
        <div className="cp-g2-tr-q-kicker">
          <SparkStar size={17} className="cp-g2-tr-q-star" />
          <div>{q.kicker}</div>
        </div>
        <div className="cp-g2-tr-q-title">{q.title}</div>
      </div>
      {methods.map((m, i) => (
        <div key={`m${i}`} className="cp-g2-tr-m campus-card campus-rise" style={{ left: r1(mX0 + i * (mW + mGap)), top: r1(y.m), width: r1(mW), height: M_H, ...enterDelay(3 + i) }}>
          <div className="cp-g2-tr-m-text">{m?.title}</div>
        </div>
      ))}
      {cols.map((c, i) => (
        <React.Fragment key={`c${i}`}>
          <div className="cp-g2-tr-col campus-rise" style={{ left: r1(c.x), top: r1(y.r), width: r1(colW), height: r1(resH), ...enterDelay(5 + i) }} aria-hidden="true" />
          <div className="cp-g2-tr-head campus-rise" style={{ left: r1(c.x), top: r1(y.r), width: r1(colW), height: HEAD_H, ...enterDelay(5 + i) }}>
            <NumBadge no={c.b?.no} size={34} />
            <div className="cp-g2-tr-head-title">{c.b?.title}</div>
          </div>
          {c.nodes.map((node, j) => (
            <div key={j} className="cp-g2-tr-node campus-rise" style={{ left: r1(c.x + colPad), top: r1(nodeY(j)), width: r1(colW - colPad * 2), height: r1(nodeH), ...enterDelay(6 + i + j) }}>
              <div className="cp-g2-tr-node-mark" aria-hidden="true" />
              <div className="cp-g2-tr-node-text">{node}</div>
            </div>
          ))}
        </React.Fragment>
      ))}
      <WireLayer W={W} H={H} wires={inner} className="campus-fade" style={enterDelay(8)} />
      {results.map((s, i) => (
        <div key={`r${i}`} className="cp-g2-tr-res campus-card campus-rise" style={{ left: r1(sX0 + i * (sW + sGap)), top: r1(y.s), width: r1(sW), height: RES_H, ...enterDelay(10 + i) }}>
          <div className="cp-g2-tr-res-cap" aria-hidden="true" />
          <div className="cp-g2-tr-res-title">
            {i === results.length - 1 ? <SparkStar size={18} className="cp-g2-tr-res-star" /> : null}
            <div>{s?.title}</div>
          </div>
          <p className="cp-g2-tr-res-desc">{s?.desc}</p>
        </div>
      ))}
    </div>
  );

  return (
    <CampusFrame chapterIndex={p.chapterIndex}>
      <TitleRow no={p.sectionNo} title={p.title} className="campus-rise" style={enterDelay(0)} />
      {image ? (
        <div className="cp-g2-tr-media campus-rise" style={enterDelay(1)}>
          <DiagramImage id="tech-route-image" placeholder="技术路线图" caption={p.imageCaption} />
        </div>
      ) : diagram}
      {p.showConclusion && <ConclusionBar label={p.conclusionLabel} text={p.conclusion} className="campus-rise" style={enterDelay(12)} />}
    </CampusFrame>
  );
}

TechRoute.META = {
  id: 'tech-route',
  label: '技术路线图 · 问题到成果的分层分支流程',
  roles: ['process', 'context', 'relationship'],
  defaults: DEFAULTS,
  copyBudgets: {
    title: 24,
    'stages[].no': 3,
    'stages[].name': 4,
    'question.kicker': 5,
    'question.title': 40,
    'methods[].title': 12,
    'branches[].no': 2,
    'branches[].title': 6,
    'branches[].labels[]': 18,
    'results[].title': 8,
    'results[].desc': 16,
    imageCaption: 30,
    conclusionLabel: 4,
    conclusion: 44,
  },
  controls: [
    { ...CHAPTER_CONTROL, default: 2 },
    ...diagramMediaControls('技术路线图'),
    { key: 'methodCount', type: 'number', label: '理论方法数量', default: 4, min: 1, max: 4, countArrays: ['methods'], description: '第二层「理论与方法」并排的项数。左侧四个阶段标签写在 stages 里(固定四层)。' },
    { key: 'branchCount', type: 'number', label: '研究分支数量', default: 3, min: 2, max: 4, countArrays: ['branches'], description: '第三层「研究内容」并列的分支数;每支的 labels 是自上而下的 1–3 个节点(超过 3 个只显示前 3 个),各支节点数可以不同。' },
    { key: 'resultCount', type: 'number', label: '成果数量', default: 2, min: 1, max: 3, countArrays: ['results'], description: '第四层「验证与成果」的项数,各分支汇聚后指向它们;最后一项带星标。' },
    { key: 'showConclusion', type: 'toggle', label: '底部结论条', default: true, description: '页面底部的校色结论条(如研究难点)。' },
  ],
};
