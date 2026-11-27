// 判定流程图:竖向主流程,开始 / 结束是渐变胶囊,处理是白色矩形,判断是菱形(「是」沿主线向下,「否」另走一路);
// 「否」可以回到上游某一步(左侧虚线回流),也可以走向右侧的旁支节点,旁支再并回下游某一步或就此结束。右侧配 2–4 条编号说明。
// 节点形状由内容决定(第一个 = 开始、最后一个 = 结束、写了「否」出口的 = 判断),学生只填文字和去向序号;
// 菱形是不含文字的裁切形状,文字是叠在上面的 HTML。几何按外壳的正文区尺寸计算(useCampusLayout)。
// 已有现成流程图时可切到「改用图片」。适合登录 / 审核 / 算法判定这类带分支的流程。
import React from 'react';
import { useThemeStyle, enterDelay } from '../../../shared/style.jsx';
import { safeArray, safeNumber, safeDenominator, clamp } from '../../../chart-safety.mjs';
import { CampusFrame, TitleRow, CHAPTER_CONTROL, TITLE_ROW_SPACE, useCampusLayout } from '../kit/chrome.jsx';
import { LabelRow } from '../kit/parts.jsx';
import { useDiagramStyle, WireLayer, WireTag, NumBadge, DotGrid, DiagramImage, diagramMediaControls, isImageMode, r1 } from '../kit/diagram.jsx';

const DEFAULTS = {
  chapterIndex: 3,
  mediaMode: 'auto',
  nodeCount: 7,
  noteCount: 4,
  sectionNo: '3.5',
  title: '登录与权限判定流程',
  nodes: [
    { tag: '', text: '打开登录页', yes: '', no: '', noTo: 0, side: '', sideTo: 0 },
    { tag: '01', text: '输入账号、密码与验证码', yes: '', no: '', noTo: 0, side: '', sideTo: 0 },
    { tag: '02', text: '验证码与密码正确？', yes: '是', no: '否', noTo: 2, side: '', sideTo: 0 },
    { tag: '03', text: '是否为管理员？', yes: '是', no: '否', noTo: 0, side: '进入学生端：在线测试与我的试卷', sideTo: 0 },
    { tag: '04', text: '进入管理后台', yes: '', no: '', noTo: 0, side: '', sideTo: 0 },
    { tag: '', text: '审核用户，管理题库与试卷', yes: '', no: '', noTo: 0, side: '', sideTo: 0 },
    { tag: '', text: '退出系统', yes: '', no: '', noTo: 0, side: '', sideTo: 0 },
    { tag: '', text: '第八个节点', yes: '', no: '', noTo: 0, side: '', sideTo: 0 },
    { tag: '', text: '第九个节点', yes: '', no: '', noTo: 0, side: '', sideTo: 0 },
  ],
  notesLabel: '流程说明',
  notes: [
    { no: '01', title: '二次验证', desc: '验证码使用第三方验证服务，登录时再做一次服务端校验。' },
    { no: '02', title: '加密传输', desc: '密码在前端做 MD5 加密后再传输，数据库不存明文。' },
    { no: '03', title: '身份保持', desc: '登录成功后用 Cookie 保存身份，按角色进入不同端。' },
    { no: '04', title: '权限分流', desc: '管理员一侧多出「审核用户」环节，学生无此入口。' },
  ],
  imageCaption: '图 3-6 登录与权限判定流程图',
};

const NOTES_W = 0.37;      // 右侧说明栏占正文宽度的比例
const NOTES_GAP = 44;
const LANE = 30;           // 左侧回流线之间的间距

const CSS = `
.cp-g2-df-main{flex:1;min-height:0;display:flex;gap:${NOTES_GAP}px;}
.cp-g2-df{position:relative;flex:none;}
.cp-g2-df-canvas{flex:none;}
/* 处理:白卡 + 左侧渐变竖条 */
.cp-g2-df-node{position:absolute;isolation:isolate;display:flex;align-items:center;justify-content:center;gap:12px;padding:0 24px;text-align:center;}
.cp-g2-df-node::before{content:'';position:absolute;inset:0;z-index:-1;border-radius:12px;background:var(--theme-surface);border:1.5px solid rgb(var(--theme-accent-rgb) / .2);box-shadow:var(--campus-shadow);}
.cp-g2-df-node::after{content:'';position:absolute;left:0;top:12px;bottom:12px;width:5px;border-radius:0 3px 3px 0;background:var(--campus-fill-bar);}
.cp-g2-df-text{min-width:0;font-size:21px;line-height:1.35;font-weight:600;color:var(--theme-ink);text-wrap:balance;}
/* 开始 / 结束:渐变胶囊 */
/* 渐变底画在节点自身上(不放伪元素):导出引擎把「不带子元素的渐变块」当装饰、透明度压到 8%,伪元素上的深色胶囊在 PPTX 里会变成很淡的浅色块 */
.cp-g2-df-node.is-term{border-radius:999px;background:var(--campus-fill);box-shadow:var(--campus-shadow-lift);}
.cp-g2-df-node.is-term::before{display:none;}
.cp-g2-df-node.is-term::after{display:none;}
.cp-g2-df-node.is-term .cp-g2-df-text{color:var(--theme-on-accent);font-family:var(--theme-font-serif);font-weight:700;font-size:22px;letter-spacing:.06em;}
/* 判断:菱形(三层裁切形状:校色描边 / 白底 / 浅校色),文字居中 */
.cp-g2-df-node.is-judge::before,.cp-g2-df-node.is-judge::after{display:none;}
.cp-g2-df-dia{position:absolute;inset:0;z-index:-1;clip-path:polygon(50% 0,100% 50%,50% 100%,0 50%);background:var(--theme-accent);}
.cp-g2-df-dia.is-inner{inset:4px 7px;background:var(--theme-surface);}
.cp-g2-df-dia.is-tint{inset:4px 7px;background:var(--campus-accent-tint);}
.cp-g2-df-node.is-judge .cp-g2-df-text{color:var(--theme-accent);font-weight:700;font-size:20px;}
/* 旁支:浅校色虚线框 */
.cp-g2-df-node.is-side::before{background:var(--campus-accent-wash);border:1.5px dashed var(--campus-accent-line);box-shadow:none;}
.cp-g2-df-node.is-side::after{display:none;}
.cp-g2-df-node.is-side .cp-g2-df-text{font-size:20px;color:var(--theme-muted);}
.cp-g2-df-tag{position:absolute;z-index:2;}
.cp-g2-df.is-compact .cp-g2-df-text{font-size:20px;line-height:1.3;}
.cp-g2-df.is-compact .cp-g2-df-node.is-judge .cp-g2-df-text{font-size:19px;}
/* 右侧说明 */
.cp-g2-df-side{flex:1;min-width:0;display:flex;flex-direction:column;gap:18px;}
.cp-g2-df-notes{flex:1;min-height:0;display:grid;grid-auto-rows:minmax(0,1fr);row-gap:16px;}
.cp-g2-df-notes.is-2,.cp-g2-df-notes.is-3{grid-auto-rows:minmax(0,200px);align-content:center;}
.cp-g2-df-note{display:flex;align-items:flex-start;gap:18px;padding:22px 26px 18px 22px;min-height:0;}
.cp-g2-df-note-body{flex:1;min-width:0;}
.cp-g2-df-note-title{font-family:var(--theme-font-serif);font-weight:700;font-size:25px;line-height:1.3;letter-spacing:.03em;color:var(--theme-ink);}
.cp-g2-df-note-desc{margin-top:8px;font-size:21px;line-height:1.55;color:var(--theme-muted);text-wrap:pretty;}
.cp-g2-df-media{flex:none;display:flex;}
`;

export function DecisionFlow(props) {
  useDiagramStyle();
  useThemeStyle('campus-decision-flow-style', CSS);
  const p = { ...DEFAULTS, ...props };
  const { bodyW, bodyH } = useCampusLayout();
  const image = isImageMode(p);
  const list = safeArray(p.nodes).slice(0, clamp(p.nodeCount, 5, 9));
  const n = list.length;
  const notes = safeArray(p.notes).slice(0, clamp(p.noteCount, 2, 4));

  const CW = Math.round((bodyW - NOTES_GAP) * (1 - NOTES_W));
  const CH = bodyH - TITLE_ROW_SPACE;
  const PADX = 30;
  const PADY = 26;
  const DW = CW - PADX * 2;
  const H = CH - PADY * 2;
  const nodes = list.map((node, i) => {
    const isJudge = i > 0 && i < n - 1 && Boolean(node?.no);
    const noTo = clamp(Math.round(safeNumber(node?.noTo, 0)), 0, n);
    const sideTo = clamp(Math.round(safeNumber(node?.sideTo, 0)), 0, n);
    return {
      i: i + 1,
      node,
      kind: i === 0 || i === n - 1 ? 'term' : isJudge ? 'judge' : 'proc',
      noTo: isJudge && noTo !== i + 1 && noTo !== i + 2 ? noTo : 0,
      side: isJudge && !(noTo && noTo !== i + 1 && noTo !== i + 2) && node?.side ? node.side : '',
      sideTo: sideTo > i + 1 ? sideTo : 0,
    };
  });
  const loops = nodes.filter(nd => nd.noTo && nd.noTo < nd.i);
  const jumps = nodes.filter(nd => nd.noTo && nd.noTo > nd.i);
  const sides = nodes.filter(nd => nd.side);

  // 竖向:按节点类型给高度,放不下时整体换紧凑档
  const sizes = compact => ({ term: compact ? 54 : 62, proc: compact ? 58 : 70, judge: compact ? 84 : 104 });
  const totalH = compact => nodes.reduce((sum, nd) => sum + sizes(compact)[nd.kind], 0);
  const compact = (H - totalH(false)) / safeDenominator(n - 1, 1) < 40;
  const sz = sizes(compact);
  const gap = clamp((H - totalH(compact)) / safeDenominator(n - 1, 1), 26, 90);
  const usedH = totalH(compact) + gap * (n - 1);
  let yc = Math.max(0, (H - usedH) / 2);
  nodes.forEach(nd => {
    nd.h = sz[nd.kind];
    nd.y = yc;
    yc += nd.h + gap;
  });

  // 横向:左侧回流线 + 主列 + 右侧旁支 / 跳转
  const leftRoom = loops.length ? 50 + loops.length * LANE : 0;
  const sideW = sides.length ? clamp(DW * 0.3, 190, 280) : 0;
  const rightRoom = sides.length ? sideW + 70 : jumps.length ? 34 + jumps.length * LANE : 0;
  const NW = clamp(DW - leftRoom - rightRoom - 20, 260, 420);
  // 整组(回流线 + 主列 + 旁支)在画布里水平居中
  const groupW = leftRoom + NW + rightRoom;
  const mainX = Math.max(0, (DW - groupW) / 2) + leftRoom + NW / 2;
  const sideX = mainX + NW / 2 + 70;
  const box = nd => {
    const w = nd.kind === 'judge' ? NW : nd.kind === 'term' ? NW * 0.72 : NW;
    return { x: mainX - w / 2, y: nd.y, w, h: nd.h, cy: nd.y + nd.h / 2, b: nd.y + nd.h, r: mainX + w / 2 };
  };
  const byI = new Map(nodes.map(nd => [nd.i, nd]));

  const wires = [];
  const tags = [];
  nodes.forEach((nd, k) => {
    if (k === n - 1) return;
    const a = box(nd);
    const b = box(nodes[k + 1]);
    wires.push({ points: [[mainX, a.b + 1], [mainX, b.y - 1]], kind: 'main' });
    if (nd.kind === 'judge' && nd.node?.yes) tags.push({ x: mainX + 34, y: (a.b + b.y) / 2, text: nd.node.yes, tone: 'solid' });
  });
  loops.forEach((nd, k) => {
    const a = box(nd);
    const t = byI.get(nd.noTo);
    const b = box(t);
    const xl = mainX - NW / 2 - 48 - k * LANE;
    wires.push({ points: [[a.x - 1, a.cy], [xl, a.cy], [xl, b.cy], [b.x - 1, b.cy]], kind: 'sub', tail: true, radius: 14 });
    tags.push({ x: xl, y: (a.cy + b.cy) / 2, text: nd.node?.no, tone: 'soft' });
  });
  jumps.forEach((nd, k) => {
    const a = box(nd);
    const b = box(byI.get(nd.noTo));
    const xr = mainX + NW / 2 + 34 + k * LANE;
    wires.push({ points: [[a.r + 1, a.cy], [xr, a.cy], [xr, b.cy], [b.r + 1, b.cy]], kind: 'sub', tail: true, radius: 14 });
    tags.push({ x: (a.r + xr) / 2 + 6, y: a.cy - 22, text: nd.node?.no, tone: 'soft' });
  });
  const sideBoxes = sides.map(nd => {
    const a = box(nd);
    const h = Math.max(sz.proc, Math.min(nd.h, 96));
    const sb = { x: sideX, y: a.cy - h / 2, w: sideW, h, cy: a.cy, b: a.cy + h / 2, cx: sideX + sideW / 2 };
    wires.push({ points: [[a.r + 1, a.cy], [sb.x - 1, a.cy]], kind: 'main', tail: true });
    tags.push({ x: (a.r + sb.x) / 2, y: a.cy - 22, text: nd.node?.no, tone: 'solid' });
    const t = nd.sideTo ? byI.get(nd.sideTo) : null;
    if (t) {
      const b = box(t);
      wires.push({ points: [[sb.cx, sb.b + 1], [sb.cx, b.cy], [b.r + 1, b.cy]], kind: 'sub', tail: true, radius: 16 });
    }
    return { nd, sb };
  });

  const compactCls = compact ? ' is-compact' : '';
  const diagram = (
    <div className="cp-g2-df-canvas cp-g2-canvas campus-rise" style={{ width: CW, height: r1(CH), ...enterDelay(1) }}>
    <DotGrid />
    <div className={`cp-g2-df cp-g2-stage${compactCls}`} style={{ position: 'absolute', left: PADX, top: PADY, width: DW, height: r1(H) }}>
      <WireLayer W={DW} H={H} wires={wires} className="campus-fade" style={enterDelay(3)} />
      {nodes.map((nd, k) => {
        const b = box(nd);
        return (
          <React.Fragment key={k}>
            <div className={`cp-g2-df-node is-${nd.kind} campus-rise`} style={{ left: r1(b.x), top: r1(b.y), width: r1(b.w), height: r1(b.h), ...(nd.kind === 'judge' ? { padding: `0 ${r1(b.w * 0.2)}px` } : null), ...enterDelay(1 + k) }}>
              {nd.kind === 'judge' ? (
                <>
                  <div className="cp-g2-df-dia" aria-hidden="true" />
                  <div className="cp-g2-df-dia is-inner" aria-hidden="true" />
                  <div className="cp-g2-df-dia is-tint" aria-hidden="true" />
                </>
              ) : null}
              <div className="cp-g2-df-text">{nd.node?.text}</div>
            </div>
            {nd.node?.tag ? (
              <NumBadge no={nd.node.tag} size={34} spark={false} className="cp-g2-df-tag campus-rise" style={{ left: r1((nd.kind === 'judge' ? b.x + NW * 0.18 : b.x) - 17), top: r1(b.y - 12), fontSize: 15, ...enterDelay(2 + k) }} />
            ) : null}
          </React.Fragment>
        );
      })}
      {sideBoxes.map(({ nd, sb }, k) => (
        <div key={`s${k}`} className="cp-g2-df-node is-side campus-rise" style={{ left: r1(sb.x), top: r1(sb.y), width: r1(sb.w), height: r1(sb.h), ...enterDelay(4 + nd.i) }}>
          <div className="cp-g2-df-text">{nd.side}</div>
        </div>
      ))}
      {tags.map((t, k) => <WireTag key={`t${k}`} x={t.x} y={t.y} text={t.text} tone={t.tone} small className="campus-fade" style={enterDelay(6 + n)} />)}
    </div>
    </div>
  );

  return (
    <CampusFrame chapterIndex={p.chapterIndex}>
      <TitleRow no={p.sectionNo} title={p.title} className="campus-rise" style={enterDelay(0)} />
      <div className="cp-g2-df-main">
        {image ? (
          <div className="cp-g2-df-media campus-rise" style={{ width: CW, ...enterDelay(1) }}>
            <DiagramImage id="decision-flow-image" placeholder="判定流程图" caption={p.imageCaption} />
          </div>
        ) : diagram}
        <aside className="cp-g2-df-side">
          <LabelRow label={p.notesLabel} className="campus-rise" style={enterDelay(2)} />
          <div className={`cp-g2-df-notes is-${notes.length}`}>
            {notes.map((note, i) => (
              <div className="cp-g2-df-note campus-card campus-rise" key={i} style={enterDelay(4 + i)}>
                <NumBadge no={note?.no} size={44} />
                <div className="cp-g2-df-note-body">
                  <div className="cp-g2-df-note-title">{note?.title}</div>
                  <p className="cp-g2-df-note-desc">{note?.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </CampusFrame>
  );
}

DecisionFlow.META = {
  id: 'decision-flow',
  label: '判定流程图 · 菱形分支配编号说明',
  roles: ['process', 'relationship', 'observation'],
  defaults: DEFAULTS,
  copyBudgets: {
    title: 22,
    'nodes[].tag': 2,
    'nodes[].text': 12,
    'nodes[].yes': 3,
    'nodes[].no': 3,
    'nodes[].side': 16,
    notesLabel: 6,
    'notes[].no': 2,
    'notes[].title': 8,
    'notes[].desc': 30,
    imageCaption: 30,
  },
  numberBounds: {
    'nodes[].noTo': { min: 0, max: 9, semantics: 'index' },
    'nodes[].sideTo': { min: 0, max: 9, semantics: 'index' },
  },
  controls: [
    { ...CHAPTER_CONTROL, default: 3 },
    ...diagramMediaControls('流程图'),
    { key: 'nodeCount', type: 'number', label: '节点数量', default: 7, min: 5, max: 9, countArrays: ['nodes'], description: '主流程自上而下的节点数。第一个画成「开始」、最后一个画成「结束」胶囊;中间写了 no(「否」出口文字)的节点画成菱形判断,yes 写在向下的主线上。「否」的去向:noTo 填上游某一步的序号 → 左侧虚线回流;填下游(隔一步以上)的序号 → 右侧虚线跳转;noTo 为 0 且写了 side → 走向右侧的旁支节点,sideTo 填旁支并回的下游序号(0 表示就此结束)。tag 是节点左上角的小编号,对应右侧说明的编号。' },
    { key: 'noteCount', type: 'number', label: '说明条数', default: 4, min: 2, max: 4, countArrays: ['notes'], description: '右侧编号说明的条数。' },
  ],
};
