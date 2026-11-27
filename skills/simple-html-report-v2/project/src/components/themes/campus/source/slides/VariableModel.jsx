// 变量关系模型图(经管 / 教育类的理论模型):左侧自变量组(1–4 个)→ 上方 / 下方中介变量(0–2 个)→ 右侧因变量(1–2 个),
// 可有一个调节变量指向某条路径的中点;每条路径标假设编号(H1、H2…),假设清单放在右侧或下方。
// 路径由假设清单自动生成:hypotheses[].from / to 写变量代码(X、X1、M、M2、Y、W…),调节假设的 to 写被调节的假设编号(如 H1);
// from / to 留空的假设只进清单、不画线(如中介效应)。连线是直线箭头(SVG),变量名、代码、假设编号都是 HTML 文本。
// 几何按外壳的正文区尺寸计算(useCampusLayout)。已有现成模型图时可切到「改用图片」。
import React from 'react';
import { useThemeStyle, enterDelay } from '../../../shared/style.jsx';
import { safeArray, safeDenominator, clamp } from '../../../chart-safety.mjs';
import { CampusFrame, TitleRow, CHAPTER_CONTROL, TITLE_ROW_SPACE, useCampusLayout } from '../kit/chrome.jsx';
import { LabelRow } from '../kit/parts.jsx';
import { useDiagramStyle, WireLayer, WireTag, GroupFrame, DotGrid, DiagramImage, diagramMediaControls, isImageMode, tagWidth, r1 } from '../kit/diagram.jsx';

const DEFAULTS = {
  chapterIndex: 2,
  mediaMode: 'auto',
  hypothesesPosition: 'right',
  independentCount: 3,
  mediatorCount: 1,
  dependentCount: 1,
  showModerator: true,
  hypothesisCount: 5,
  sectionNo: '2.3',
  title: '研究模型与研究假设',
  independentLabel: '自变量 · 管理会计工具应用',
  independents: [
    { code: 'X1', name: '预算管理' },
    { code: 'X2', name: '成本管理' },
    { code: 'X3', name: '绩效管理' },
    { code: 'X4', name: '营运管理' },
  ],
  mediatorLabel: '中介变量',
  mediators: [
    { code: 'M', name: '内部控制质量' },
    { code: 'M2', name: '信息透明度' },
  ],
  dependentLabel: '因变量',
  dependents: [
    { code: 'Y', name: '企业经营绩效' },
    { code: 'Y2', name: '可持续发展能力' },
  ],
  moderatorLabel: '调节变量',
  moderator: { code: 'W', name: '企业信息化水平' },
  hypothesesLabel: '研究假设',
  hypotheses: [
    { no: 'H1', from: 'X', to: 'Y', text: '管理会计工具应用正向影响企业经营绩效。' },
    { no: 'H2', from: 'X', to: 'M', text: '管理会计工具应用正向影响内部控制质量。' },
    { no: 'H3', from: 'M', to: 'Y', text: '内部控制质量正向影响企业经营绩效。' },
    { no: 'H4', from: '', to: '', text: '内部控制质量在工具应用与经营绩效之间起中介作用。' },
    { no: 'H5', from: 'W', to: 'H1', text: '信息化水平正向调节工具应用与经营绩效的关系。' },
    { no: 'H6', from: '', to: '', text: '在这里写第六条假设，一句话即可。' },
  ],
  imageCaption: '图 2-2 研究模型',
};

const CSS = `
.cp-g2-vm-main{flex:1;min-height:0;display:flex;gap:40px;}
.cp-g2-vm-main.is-bottom{flex-direction:column;gap:22px;}
.cp-g2-vm-canvas{flex:none;}
.cp-g2-vm-stage{position:absolute;}
/* 变量节点 */
.cp-g2-vm-node{position:absolute;isolation:isolate;display:flex;align-items:center;gap:14px;padding:0 20px 0 16px;}
.cp-g2-vm-node::before{content:'';position:absolute;inset:0;z-index:-1;border-radius:14px;background:var(--theme-surface);border:1.5px solid rgb(var(--theme-accent-rgb) / .2);box-shadow:var(--campus-shadow);}
.cp-g2-vm-code{flex:none;display:flex;align-items:center;justify-content:center;min-width:46px;height:36px;padding:0 8px;border-radius:10px;background:var(--campus-accent-tint);color:var(--theme-accent);font-family:var(--theme-font-serif);font-weight:700;font-style:italic;font-size:20px;line-height:1;white-space:nowrap;}
.cp-g2-vm-name{min-width:0;font-family:var(--theme-font-serif);font-weight:700;font-size:24px;line-height:1.25;letter-spacing:.03em;color:var(--theme-ink);text-wrap:pretty;}
/* 中介:校色粗描边 */
.cp-g2-vm-node.is-m::before{border:2.5px solid var(--theme-accent);}
.cp-g2-vm-node.is-m .cp-g2-vm-code{background:var(--campus-fill);color:var(--theme-on-accent);}
/* 因变量:渐变实底 */
/* 渐变底画在节点自身上(不放伪元素):伪元素上的渐变块导出时被当装饰、透明度压到 8%,PPTX 里深色节点发白 */
.cp-g2-vm-node.is-y{border-radius:14px;background:var(--campus-fill-deep);box-shadow:var(--campus-shadow-lift);}
.cp-g2-vm-node.is-y::before{display:none;}
.cp-g2-vm-node.is-y .cp-g2-vm-code{background:var(--campus-on-accent-glass);color:var(--theme-on-accent);}
.cp-g2-vm-node.is-y .cp-g2-vm-name{color:var(--theme-on-accent);}
/* 调节:虚线框 + 浅底 */
.cp-g2-vm-node.is-w::before{background:var(--campus-accent-wash);border:2px dashed var(--campus-accent-line);box-shadow:none;}
.cp-g2-vm-role{position:absolute;z-index:3;display:flex;align-items:center;gap:7px;height:30px;padding:0 13px 0 10px;border-radius:9px 9px 9px 3px;background:var(--theme-surface);border:1.5px solid var(--campus-accent-line);color:var(--theme-accent);font-size:18px;line-height:1;font-weight:700;letter-spacing:.08em;white-space:nowrap;}
.cp-g2-vm-role-mark{flex:none;width:7px;height:7px;border-radius:1px;background:var(--campus-spark);transform:rotate(45deg);}
.cp-g2-vm-tag{font-style:italic;}
/* 假设清单 */
.cp-g2-vm-side{flex:1;min-width:0;display:flex;flex-direction:column;gap:16px;}
.cp-g2-vm-list{flex:1;min-height:0;display:grid;grid-auto-rows:minmax(0,1fr);row-gap:12px;}
.cp-g2-vm-list.is-few{grid-auto-rows:minmax(0,150px);align-content:center;}
.cp-g2-vm-main.is-bottom .cp-g2-vm-side{flex:none;}
.cp-g2-vm-main.is-bottom .cp-g2-vm-list{grid-template-columns:repeat(var(--cp-g2-vm-cols),minmax(0,1fr));grid-auto-rows:auto;column-gap:18px;}
.cp-g2-vm-hyp{display:flex;align-items:center;gap:16px;padding:12px 22px 12px 16px;min-height:0;}
.cp-g2-vm-hno{flex:none;display:flex;align-items:center;justify-content:center;min-width:56px;height:38px;padding:0 10px;border-radius:999px;background:var(--campus-fill);color:var(--theme-on-accent);box-shadow:0 6px 14px rgb(var(--theme-accent-rgb) / .24);font-family:var(--theme-font-serif);font-weight:700;font-style:italic;font-size:20px;line-height:1;white-space:nowrap;}
.cp-g2-vm-hno.is-soft{background:var(--campus-accent-tint);color:var(--theme-accent);box-shadow:none;}
.cp-g2-vm-htext{min-width:0;font-size:21px;line-height:1.5;color:var(--theme-ink);text-wrap:pretty;}
.cp-g2-vm-main.is-bottom .cp-g2-vm-htext{font-size:20px;}
.cp-g2-vm-media{flex:none;display:flex;}
`;

/** 从矩形中心沿方向 (dx, dy) 出发,与矩形边界的交点(连线贴着节点边缘起止)。 */
function edgePoint(b, dx, dy, pad = 4) {
  const hw = b.w / 2 + pad;
  const hh = b.h / 2 + pad;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;
  const tx = ux === 0 ? Infinity : hw / Math.abs(ux);
  const ty = uy === 0 ? Infinity : hh / Math.abs(uy);
  const m = Math.min(tx, ty);
  const t = Number.isFinite(m) ? m : 0;
  return [b.cx + ux * t, b.cy + uy * t];
}

export function VariableModel(props) {
  useDiagramStyle();
  useThemeStyle('campus-variable-model-style', CSS);
  const p = { ...DEFAULTS, ...props };
  const { bodyW, bodyH } = useCampusLayout();
  const image = isImageMode(p);
  const bottom = p.hypothesesPosition === 'bottom';
  const xs = safeArray(p.independents).slice(0, clamp(p.independentCount, 1, 4));
  const ms = safeArray(p.mediators).slice(0, clamp(p.mediatorCount, 0, 2));
  const ys = safeArray(p.dependents).slice(0, clamp(p.dependentCount, 1, 2));
  const hyps = safeArray(p.hypotheses).slice(0, clamp(p.hypothesisCount, 1, 6));
  const showW = Boolean(p.showModerator);

  // 画布尺寸:假设在右侧时占 60%,在下方时占满宽、让出底部清单的高度
  const H0 = bodyH - TITLE_ROW_SPACE;
  const bottomCols = hyps.length <= 3 ? hyps.length : hyps.length === 4 ? 2 : 3;
  const bottomRows = Math.ceil(hyps.length / safeDenominator(bottomCols, 1));
  const listH = bottom ? 54 + bottomRows * 92 + (bottomRows - 1) * 12 : 0;
  const CW = bottom ? bodyW : Math.round((bodyW - 40) * 0.6);
  const CH = bottom ? H0 - listH - 22 : H0;
  const PADX = 40;
  const PADY = 34;
  const DW = CW - PADX * 2;
  const DH = CH - PADY * 2;

  // —— 节点布局 ——
  const xw = clamp(Math.max(DW * 0.29, xs.length > 1 ? tagWidth(p.independentLabel) + 30 : 0), 230, 340);
  const xItemH = clamp((DH * 0.62 - 64) / Math.max(1, xs.length) - 14, 56, 76);
  const xPanelH = 64 + xs.length * xItemH + (xs.length - 1) * 14 + 18;
  const midY = DH / 2 + (showW && ms.length < 2 ? -DH * 0.06 : 0);
  const xPanel = { x: 0, y: midY - xPanelH / 2, w: xw, h: xPanelH };
  const xItems = xs.length > 1 ? xs.map((v, i) => ({ v, x: 16, y: xPanel.y + 52 + i * (xItemH + 14), w: xw - 32, h: xItemH })) : xs.map(v => ({ v, x: 0, y: midY - xItemH / 2 - 6, w: xw, h: xItemH + 12 }));
  const yw = xw;
  const yItemH = ys.length > 1 ? clamp(xItemH + 10, 66, 90) : 112;
  const yPanelH = ys.length > 1 ? 64 + ys.length * yItemH + 14 + 18 : yItemH;
  const yPanel = { x: DW - yw, y: midY - yPanelH / 2, w: yw, h: yPanelH };
  const yItems = ys.length > 1
    ? ys.map((v, i) => ({ v, x: DW - yw + 16, y: yPanel.y + 52 + i * (yItemH + 14), w: yw - 32, h: yItemH }))
    : ys.map(v => ({ v, x: DW - yw, y: yPanel.y, w: yw, h: yItemH }));
  const mw = clamp(DW * 0.3, 260, 330);
  const mh = 94;
  const mBoxes = ms.map((v, i) => ({ v, x: DW / 2 - mw / 2, y: i === 0 ? 18 : DH - mh - 4, w: mw, h: mh }));
  const box = (b, side) => ({ ...b, side, cx: b.x + b.w / 2, cy: b.y + b.h / 2 });

  // 变量代码 → 盒子:X = 自变量组,Y = 因变量(组),M = 第一个中介,其余按代码精确匹配
  const lookup = code => {
    const c = String(code ?? '').trim().toUpperCase();
    if (!c) return null;
    if (c === 'X') return xs.length ? box(xs.length > 1 ? xPanel : xItems[0], 'left') : null;
    if (c === 'Y') return ys.length ? box(ys.length > 1 ? yPanel : yItems[0], 'right') : null;
    if (c === 'M' && mBoxes[0]) return box(mBoxes[0]);
    const same = it => String(it.v?.code ?? '').trim().toUpperCase() === c;
    if (xItems.find(same)) return box(xItems.find(same), 'left');
    if (yItems.find(same)) return box(yItems.find(same), 'right');
    if (mBoxes.find(same)) return box(mBoxes.find(same));
    if (c === 'W' || c === String(p.moderator?.code ?? '').trim().toUpperCase()) return 'W';
    return null;
  };

  const paths = new Map();
  const wires = [];
  const tags = [];
  hyps.forEach(h => {
    const a = lookup(h?.from);
    const b = lookup(h?.to);
    if (!a || !b || a === 'W' || b === 'W') return;
    // 左栏(自变量)的出线一律从右边缘出发、右栏(因变量)的入线一律从左边缘进入,纵向位置朝对方靠拢;其余按中心连线与边框求交
    const sideOut = box => (box.side === 'left' ? [box.x + box.w + 4, clamp(b.cy, box.y + 64, box.y + box.h - 28)] : null);
    const sideIn = box => (box.side === 'right' ? [box.x - 6, clamp(a.cy, box.y + 40, box.y + box.h - 28)] : null);
    const s = sideOut(a) || edgePoint(a, b.cx - a.cx, b.cy - a.cy);
    const e = sideIn(b) || edgePoint(b, s[0] - b.cx, s[1] - b.cy, 6);
    paths.set(String(h?.no ?? '').trim().toUpperCase(), { s, e });
    wires.push({ points: [s, e], kind: 'main', tail: true });
    // 被调节的路径:编号放在前三分之一处,给调节箭头留出中点
    const no = String(h?.no ?? '').trim().toUpperCase();
    const moderated = showW && hyps.some(m => String(m?.to ?? '').trim().toUpperCase() === no && lookup(m?.from) === 'W');
    const t = moderated ? 0.28 : 0.45;
    tags.push({ x: s[0] + (e[0] - s[0]) * t, y: s[1] + (e[1] - s[1]) * t, text: h?.no });
  });
  // 调节变量:放在空着的上方或下方,箭头指向被调节路径的中点
  let wBox = null;
  const modHyp = showW ? hyps.find(h => lookup(h?.from) === 'W' && paths.has(String(h?.to ?? '').trim().toUpperCase())) : null;
  if (showW) {
    const target = modHyp ? paths.get(String(modHyp.to).trim().toUpperCase()) : null;
    const mx = target ? (target.s[0] + target.e[0]) / 2 : DW / 2;
    const my = target ? (target.s[1] + target.e[1]) / 2 : midY;
    const ww = clamp(DW * 0.3, 270, 330);
    const wh = 84;
    // 候选位置依次是:下方居中、上方居中、右上、右下、左上、左下;取第一个不压住其他节点的
    const cx = clamp(mx - ww / 2, 0, DW - ww);
    const cands = [[cx, DH - wh - 4], [cx, 18], [DW - ww, 18], [DW - ww, DH - wh - 4], [0, 18], [0, DH - wh - 4]];
    const solids = [xs.length > 1 ? xPanel : xItems[0], ys.length > 1 ? yPanel : yItems[0], ...mBoxes].filter(Boolean);
    const clear = ([x, y]) => solids.every(o => x + ww + 16 <= o.x || o.x + o.w + 16 <= x || y + wh + 26 <= o.y || o.y + o.h + 26 <= y);
    const [wx, wy] = cands.find(clear) || cands[0];
    wBox = box({ v: p.moderator, x: wx, y: wy, w: ww, h: wh });
    if (target) {
      const s = edgePoint(wBox, mx - wBox.cx, my - wBox.cy);
      wires.push({ points: [s, [mx, my]], kind: 'sub', tail: true, headSize: 14 });
      tags.push({ x: s[0] + (mx - s[0]) * 0.45, y: s[1] + (my - s[1]) * 0.45, text: modHyp?.no, soft: true });
    }
  }

  const role = (text, x, y, k) => (text ? (
    <div className="cp-g2-vm-role campus-rise" style={{ left: r1(x), top: r1(y), ...enterDelay(k) }}>
      <div className="cp-g2-vm-role-mark" aria-hidden="true" />
      <div>{text}</div>
    </div>
  ) : null);
  const node = (it, kind, k) => (
    <div className={`cp-g2-vm-node is-${kind} campus-rise`} style={{ left: r1(it.x), top: r1(it.y), width: r1(it.w), height: r1(it.h), ...enterDelay(k) }}>
      <div className="cp-g2-vm-code">{it.v?.code}</div>
      <div className="cp-g2-vm-name">{it.v?.name}</div>
    </div>
  );

  const diagram = (
    <div className="cp-g2-vm-canvas cp-g2-canvas campus-rise" style={{ width: CW, height: r1(CH), ...enterDelay(1) }}>
      <DotGrid />
      <div className="cp-g2-vm-stage cp-g2-stage" style={{ left: PADX, top: PADY, width: r1(DW), height: r1(DH) }}>
        {xs.length > 1 ? <GroupFrame box={{ left: xPanel.x, top: xPanel.y, width: xPanel.w, height: xPanel.h }} label={p.independentLabel} className="campus-fade" style={enterDelay(2)} /> : (xItems[0] ? role(p.independentLabel, xItems[0].x + 14, xItems[0].y - 16, 2) : null)}
        {ys.length > 1 ? <GroupFrame box={{ left: yPanel.x, top: yPanel.y, width: yPanel.w, height: yPanel.h }} label={p.dependentLabel} className="campus-fade" style={enterDelay(2)} /> : null}
        <WireLayer W={DW} H={DH} wires={wires} headSize={16} className="campus-fade" style={enterDelay(4)} />
        {xItems.map((it, i) => <React.Fragment key={`x${i}`}>{node(it, 'x', 2 + i)}</React.Fragment>)}
        {mBoxes.map((it, i) => <React.Fragment key={`m${i}`}>{node(it, 'm', 3 + i)}{role(p.mediatorLabel, it.x + 14, it.y - 16, 3 + i)}</React.Fragment>)}
        {yItems.map((it, i) => <React.Fragment key={`y${i}`}>{node(it, 'y', 4 + i)}</React.Fragment>)}
        {ys.length === 1 && yItems[0] ? role(p.dependentLabel, yItems[0].x + 14, yItems[0].y - 16, 4) : null}
        {wBox ? <>{node(wBox, 'w', 5)}{role(p.moderatorLabel, wBox.x + 14, wBox.y - 16, 5)}</> : null}
        {tags.map((t, i) => <WireTag key={`t${i}`} x={t.x} y={t.y} text={t.text} tone={t.soft ? 'soft' : 'solid'} className="cp-g2-vm-tag campus-fade" style={enterDelay(7)} />)}
      </div>
    </div>
  );

  return (
    <CampusFrame chapterIndex={p.chapterIndex}>
      <TitleRow no={p.sectionNo} title={p.title} className="campus-rise" style={enterDelay(0)} />
      <div className={`cp-g2-vm-main${bottom ? ' is-bottom' : ''}`}>
        {image ? (
          <div className="cp-g2-vm-media campus-rise" style={{ width: CW, height: r1(CH), ...enterDelay(1) }}>
            <DiagramImage id="variable-model-image" placeholder="研究模型图" caption={p.imageCaption} />
          </div>
        ) : diagram}
        <aside className="cp-g2-vm-side" style={bottom ? { height: listH } : undefined}>
          <LabelRow label={p.hypothesesLabel} className="campus-rise" style={enterDelay(3)} />
          <div className={`cp-g2-vm-list${!bottom && hyps.length <= 3 ? ' is-few' : ''}`} style={{ '--cp-g2-vm-cols': bottomCols }}>
            {hyps.map((h, i) => {
              const drawn = paths.has(String(h?.no ?? '').trim().toUpperCase()) || h === modHyp;
              return (
                <div className="cp-g2-vm-hyp campus-card campus-rise" key={i} style={enterDelay(5 + i)}>
                  <div className={`cp-g2-vm-hno${drawn ? '' : ' is-soft'}`}>{h?.no}</div>
                  <p className="cp-g2-vm-htext">{h?.text}</p>
                </div>
              );
            })}
          </div>
        </aside>
      </div>
    </CampusFrame>
  );
}

VariableModel.META = {
  id: 'variable-model',
  label: '变量关系模型 · 自变量到因变量的假设路径',
  roles: ['relationship', 'context', 'statement'],
  defaults: DEFAULTS,
  copyBudgets: {
    title: 22,
    independentLabel: 14,
    'independents[].code': 3,
    'independents[].name': 8,
    mediatorLabel: 6,
    'mediators[].code': 3,
    'mediators[].name': 8,
    dependentLabel: 6,
    'dependents[].code': 3,
    'dependents[].name': 8,
    moderatorLabel: 6,
    'moderator.code': 3,
    'moderator.name': 8,
    hypothesesLabel: 6,
    'hypotheses[].no': 4,
    'hypotheses[].from': 3,
    'hypotheses[].to': 3,
    'hypotheses[].text': 30,
    imageCaption: 30,
  },
  controls: [
    { ...CHAPTER_CONTROL, default: 2 },
    ...diagramMediaControls('研究模型图'),
    { key: 'hypothesesPosition', type: 'radio', label: '假设清单位置', default: 'right', options: [{ value: 'right', label: '右侧' }, { value: 'bottom', label: '下方' }], description: '假设清单放在模型图右侧(竖排),或模型图下方(多列)。' },
    { key: 'independentCount', type: 'number', label: '自变量个数', default: 3, min: 1, max: 4, countArrays: ['independents'], description: '左侧自变量的个数;多于 1 个时框成一组,组名写 independentLabel,假设里用 X 指整组、X1 / X2 指单个。' },
    { key: 'mediatorCount', type: 'number', label: '中介变量个数', default: 1, min: 0, max: 2, countArrays: ['mediators'], description: '中介变量个数(0–2):第一个放在上方、第二个放在下方;假设里用 M 指第一个,或写它的代码。' },
    { key: 'dependentCount', type: 'number', label: '因变量个数', default: 1, min: 1, max: 2, countArrays: ['dependents'], description: '右侧因变量的个数;2 个时框成一组,假设里用 Y 指整组。' },
    { key: 'showModerator', type: 'toggle', label: '调节变量', default: true, description: '显示调节变量;它的假设写 from: W、to: 被调节的假设编号(如 H1),箭头指向那条路径的中点。' },
    { key: 'hypothesisCount', type: 'number', label: '假设条数', default: 5, min: 1, max: 6, countArrays: ['hypotheses'], description: '假设清单条数。每条的 from / to 写变量代码就在图上画出这条路径并标编号;两者留空的假设只进清单(编号显示成浅色)。' },
  ],
};
