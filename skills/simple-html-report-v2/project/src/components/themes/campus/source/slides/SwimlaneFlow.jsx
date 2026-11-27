// 泳道流程图:2–4 条横向泳道(角色 / 系统),每条泳道上若干步骤节点,步骤按列对齐(列 = 时间顺序);
// 节点之间有同泳道与跨泳道的箭头,判断节点可以有第二个出口(branch),往回走的箭头画成虚线。
// props 是「泳道列表 + 步骤列表(所属泳道 lane、所在列 col、文字、下一步 next、分支 branch)」,学生不用写坐标;
// 几何按外壳的正文区尺寸计算(useCampusLayout),连线走正交折线。已有现成流程图时可切到「改用图片」。
// 适合业务流程、系统交互流程、多角色协作流程。
import React from 'react';
import { useThemeStyle, enterDelay } from '../../../shared/style.jsx';
import { safeArray, safeNumber, safeDenominator, safeMax, clamp } from '../../../chart-safety.mjs';
import { CampusFrame, TitleRow, ConclusionBar, CHAPTER_CONTROL, TITLE_ROW_SPACE, CONCLUSION_SPACE, useCampusLayout } from '../kit/chrome.jsx';
import { useDiagramStyle, WireLayer, WireTag, NumBadge, DiagramImage, diagramMediaControls, isImageMode, tagWidth, r1 } from '../kit/diagram.jsx';

const DEFAULTS = {
  chapterIndex: 3,
  mediaMode: 'auto',
  laneCount: 4,
  stepCount: 9,
  showConclusion: true,
  sectionNo: '3.3',
  title: '系统总体业务流程',
  lanes: [
    { name: '学生', note: 'STUDENT' },
    { name: '系统', note: 'SYSTEM' },
    { name: '管理员', note: 'ADMIN' },
    { name: '数据库', note: 'DATABASE' },
  ],
  steps: [
    { no: '01', lane: 1, col: 1, text: '在线注册', next: 2, nextLabel: '', branch: 0, branchLabel: '' },
    { no: '02', lane: 1, col: 2, text: '登录系统', next: 3, nextLabel: '', branch: 0, branchLabel: '' },
    { no: '03', lane: 2, col: 3, text: '校验账号与验证码', next: 4, nextLabel: '通过', branch: 2, branchLabel: '失败' },
    { no: '04', lane: 2, col: 4, text: '判断用户角色', next: 5, nextLabel: '学生', branch: 6, branchLabel: '管理员' },
    { no: '05', lane: 1, col: 5, text: '在线测试 / 练习', next: 7, nextLabel: '', branch: 0, branchLabel: '' },
    { no: '06', lane: 3, col: 5, text: '审核新用户', next: 8, nextLabel: '', branch: 0, branchLabel: '' },
    { no: '07', lane: 2, col: 6, text: '自动判卷，更新试题数据', next: 9, nextLabel: '', branch: 0, branchLabel: '' },
    { no: '08', lane: 3, col: 6, text: '维护题库与试卷', next: 9, nextLabel: '', branch: 0, branchLabel: '' },
    { no: '09', lane: 4, col: 7, text: '写入 MySQL / MongoDB', next: 0, nextLabel: '', branch: 0, branchLabel: '' },
    { no: '10', lane: 1, col: 8, text: '查看成绩与数据分析', next: 0, nextLabel: '', branch: 0, branchLabel: '' },
  ],
  imageCaption: '图 3-4 系统总体业务流程图',
  conclusionLabel: '流程要点',
  conclusion: '学生与管理员共用一个登录入口，校验通过后按角色分流；业务数据统一写入数据库。',
};

const HEAD_W = 156;        // 泳道标题列宽
const HEAD_GAP = 14;
const MAX_COLS = 8;

const CSS = `
.cp-g2-sl{position:relative;flex:1;min-height:0;}
/* 泳道:交替的浅校色底 + 虚线分隔;左侧渐变标题块 */
.cp-g2-sl-lane{position:absolute;border-radius:14px;background:rgb(var(--theme-accent-rgb) / .045);}
.cp-g2-sl-lane.is-odd{background:var(--theme-surface);border:1px solid var(--campus-card-edge);}
.cp-g2-sl-guide{position:absolute;width:0;border-left:1.5px dashed rgb(var(--theme-accent-rgb) / .12);pointer-events:none;}
.cp-g2-sl-head{position:absolute;isolation:isolate;display:flex;flex-direction:column;justify-content:center;gap:8px;padding:0 22px;color:var(--theme-on-accent);}
.cp-g2-sl-head-shape{position:absolute;inset:0;z-index:-1;border-radius:14px;background:var(--campus-fill-deep);box-shadow:var(--campus-shadow-lift);}
.cp-g2-sl-head.is-odd .cp-g2-sl-head-shape{background:var(--campus-fill);}
.cp-g2-sl-head-name{font-family:var(--theme-font-serif);font-weight:700;font-size:26px;line-height:1.2;letter-spacing:.08em;}
.cp-g2-sl-head-note{font-size:14px;line-height:1.2;font-weight:600;letter-spacing:.16em;color:var(--campus-on-accent-muted);white-space:nowrap;overflow:hidden;}
.cp-g2-sl-head-bar{width:26px;height:3px;border-radius:2px;background:var(--campus-spark);}
/* 步骤节点 */
.cp-g2-sl-node{position:absolute;isolation:isolate;display:flex;align-items:center;gap:10px;padding:0 14px 0 10px;}
.cp-g2-sl-node::before{content:'';position:absolute;inset:0;z-index:-1;border-radius:12px;background:var(--theme-surface);border:1.5px solid rgb(var(--theme-accent-rgb) / .22);box-shadow:0 8px 20px rgb(var(--theme-accent-rgb) / .1);}
.cp-g2-sl-text{flex:1;min-width:0;font-size:20px;line-height:1.35;font-weight:600;color:var(--theme-ink);text-wrap:pretty;}
.cp-g2-sl-node .cp-g2-badge{font-size:15px;}
/* 开始 / 结束:渐变胶囊 */
/* 渐变底画在节点自身上(不放伪元素):导出引擎把「不带子元素的渐变块」当装饰、透明度压到 8%,伪元素上的深色胶囊在 PPTX 里会变成很淡的浅色块 */
.cp-g2-sl-node.is-start,.cp-g2-sl-node.is-end{border-radius:999px;background:var(--campus-fill);box-shadow:var(--campus-shadow-lift);}
.cp-g2-sl-node.is-start::before,.cp-g2-sl-node.is-end::before{display:none;}
.cp-g2-sl-node.is-start .cp-g2-sl-text,.cp-g2-sl-node.is-end .cp-g2-sl-text{color:var(--theme-on-accent);}
.cp-g2-sl-node.is-start,.cp-g2-sl-node.is-end{padding:0 18px 0 10px;}
/* 判断:六角形(两层裁切形状叠出描边),文字居中 */
.cp-g2-sl-node.is-judge::before{display:none;}
.cp-g2-sl-judge{position:absolute;inset:0;z-index:-1;background:var(--theme-accent);clip-path:polygon(18px 0,calc(100% - 18px) 0,100% 50%,calc(100% - 18px) 100%,18px 100%,0 50%);}
.cp-g2-sl-judge.is-inner{inset:2px;background:var(--theme-surface);}
.cp-g2-sl-judge.is-tint{inset:2px;background:var(--campus-accent-tint);}
.cp-g2-sl-node.is-judge{padding:0 20px 0 18px;}
.cp-g2-sl-node.is-judge .cp-g2-sl-text{color:var(--theme-accent);}
.cp-g2-sl.is-tight .cp-g2-sl-text{font-size:19px;line-height:1.3;}
.cp-g2-sl.is-tight .cp-g2-sl-node .cp-g2-badge{display:none;}
.cp-g2-sl-media{flex:1;min-height:0;display:flex;}
`;


export function SwimlaneFlow(props) {
  useDiagramStyle();
  useThemeStyle('campus-swimlane-flow-style', CSS);
  const p = { ...DEFAULTS, ...props };
  const { bodyW, bodyH } = useCampusLayout();
  const image = isImageMode(p);
  const lanes = safeArray(p.lanes).slice(0, clamp(p.laneCount, 2, 4));
  const L = lanes.length;
  const all = safeArray(p.steps).slice(0, clamp(p.stepCount, 3, 10)).map((s, i) => ({
    i: i + 1,
    s,
    lane: clamp(Math.round(safeNumber(s?.lane, 1)), 1, 4),
    col: clamp(Math.round(safeNumber(s?.col, i + 1)), 1, MAX_COLS),
  }));
  const steps = all.filter(st => st.lane <= L);
  const byIndex = new Map(steps.map(st => [st.i, st]));
  // 节点形状由连接关系决定,不用学生选:有第二个出口的是判断;没有下一步的是结束;没有正向箭头指向它的是开始(回流的虚线不算)
  const ref = (st, key) => byIndex.get(Math.round(safeNumber(st.s?.[key], 0)));
  const targeted = new Set();
  steps.forEach(st => ['next', 'branch'].forEach(key => { const t = ref(st, key); if (t && t !== st && t.col >= st.col) targeted.add(t.i); }));
  steps.forEach(st => {
    const hasNext = Boolean(ref(st, 'next'));
    st.type = ref(st, 'branch') ? 'judge' : !hasNext ? 'end' : !targeted.has(st.i) ? 'start' : 'step';
  });
  const cols = Math.max(1, safeMax(steps.map(st => st.col), 1));

  const W = bodyW;
  const H = bodyH - TITLE_ROW_SPACE - (p.showConclusion ? CONCLUSION_SPACE : 0);
  const laneGap = 10;
  const laneH = (H - (L - 1) * laneGap) / safeDenominator(L, 1);
  const gx = HEAD_W + HEAD_GAP;
  const colW = (W - gx) / safeDenominator(cols, 1);
  const padX = clamp(colW * 0.085, 14, 30);
  const nodeW = Math.min(colW - padX * 2, 300);
  const nodeH = clamp(laneH - 64, 58, 92);
  const tight = nodeW < 156;
  const laneY = l => (l - 1) * (laneH + laneGap);
  const box = st => {
    const x = gx + (st.col - 1) * colW + (colW - nodeW) / 2;
    const y = laneY(st.lane) + (laneH - nodeH) / 2;
    return { x, y, w: nodeW, h: nodeH, cx: x + nodeW / 2, cy: y + nodeH / 2, r: x + nodeW, b: y + nodeH };
  };

  const wires = [];
  const tags = [];
  const link = (from, to, label) => {
    const a = box(from);
    const b = box(to);
    const forward = to.col > from.col;
    if (forward) {
      if (from.lane === to.lane) {
        wires.push({ points: [[a.r + 2, a.cy], [b.x - 2, b.cy]], kind: 'main', tail: true });
        if (label) tags.push({ x: (a.r + b.x) / 2, y: a.y - 20, text: label });
      } else {
        const xm = gx + from.col * colW;
        wires.push({ points: [[a.r + 2, a.cy], [xm, a.cy], [xm, b.cy], [b.x - 2, b.cy]], kind: 'main', tail: true, radius: 16 });
        if (label) tags.push({ x: xm, y: (a.cy + b.cy) / 2, text: label });
      }
      return;
    }
    if (to.col === from.col) {
      const down = to.lane > from.lane;
      wires.push({ points: [[a.cx, down ? a.b + 2 : a.y - 2], [b.cx, down ? b.y - 2 : b.b + 2]], kind: 'main', tail: true });
      if (label) tags.push({ x: a.cx, y: ((down ? a.b : a.y) + (down ? b.y : b.b)) / 2, text: label });
      return;
    }
    // 往回走:虚线
    if (from.lane === to.lane) {
      const yt = laneY(from.lane) + 14;
      wires.push({ points: [[a.cx, a.y - 2], [a.cx, yt], [b.cx, yt], [b.cx, b.y - 2]], kind: 'sub', tail: true, radius: 12 });
      if (label) tags.push({ x: (a.cx + b.cx) / 2, y: yt, text: label, tone: 'soft' });
      return;
    }
    // 跨泳道往回:从节点上(下)沿出发,沿目标泳道的边界走到目标正下(上)方,从目标底(顶)边进入,不和正向箭头抢同一个接口
    const up = to.lane < from.lane;
    const ym = up ? laneY(to.lane) + laneH + laneGap / 2 : laneY(to.lane) - laneGap / 2;
    const bx = b.cx + Math.min(nodeW * 0.22, 36);
    wires.push({ points: [[a.cx, up ? a.y - 2 : a.b + 2], [a.cx, ym], [bx, ym], [bx, up ? b.b + 2 : b.y - 2]], kind: 'sub', tail: true, radius: 12 });
    if (label) tags.push({ x: a.cx, y: ((up ? a.y : a.b) + ym) / 2, text: label, tone: 'soft' });
  };
  steps.forEach(st => {
    const next = ref(st, 'next');
    if (next && next !== st) link(st, next, st.s?.nextLabel);
    const branch = ref(st, 'branch');
    if (branch && branch !== st) link(st, branch, st.s?.branchLabel);
  });

  const diagram = (
    <div className={`cp-g2-sl cp-g2-stage${tight ? ' is-tight' : ''}`} style={{ width: W, height: r1(H) }}>
      {lanes.map((lane, l) => (
        <React.Fragment key={`l${l}`}>
          <div className={`cp-g2-sl-lane${l % 2 ? '' : ' is-odd'} campus-fade`} style={{ left: 0, top: r1(laneY(l + 1)), width: W, height: r1(laneH), ...enterDelay(1) }} aria-hidden="true" />
          <div className={`cp-g2-sl-head${l % 2 ? '' : ' is-odd'} campus-rise`} style={{ left: 0, top: r1(laneY(l + 1)), width: HEAD_W, height: r1(laneH), ...enterDelay(1 + l) }}>
            <div className="cp-g2-sl-head-shape" aria-hidden="true" />
            <div className="cp-g2-sl-head-name">{lane?.name}</div>
            <div className="cp-g2-sl-head-bar" aria-hidden="true" />
            <div className="cp-g2-sl-head-note">{lane?.note}</div>
          </div>
        </React.Fragment>
      ))}
      {Array.from({ length: cols - 1 }, (_, c) => (
        <div key={`g${c}`} className="cp-g2-sl-guide campus-fade" style={{ left: r1(gx + (c + 1) * colW), top: 8, height: r1(H - 16), ...enterDelay(2) }} aria-hidden="true" />
      ))}
      <WireLayer W={W} H={H} wires={wires} className="campus-fade" style={enterDelay(4)} />
      {steps.map((st, k) => {
        const b = box(st);
        const solid = st.type === 'start' || st.type === 'end';
        return (
          <div key={`n${st.i}`} className={`cp-g2-sl-node is-${st.type} campus-rise`} style={{ left: r1(b.x), top: r1(b.y), width: r1(b.w), height: r1(b.h), ...enterDelay(3 + k) }}>
            {st.type === 'judge' ? (
              <>
                <div className="cp-g2-sl-judge" aria-hidden="true" />
                <div className="cp-g2-sl-judge is-inner" aria-hidden="true" />
                <div className="cp-g2-sl-judge is-tint" aria-hidden="true" />
              </>
            ) : null}
            {st.s?.no ? <NumBadge no={st.s.no} size={30} tone={solid ? 'ring' : 'soft'} /> : null}
            <div className="cp-g2-sl-text">{st.s?.text}</div>
          </div>
        );
      })}
      {tags.map((t, k) => <WireTag key={`t${k}`} x={t.x} y={t.y} text={t.text} tone={t.tone || 'line'} small className="campus-fade" style={enterDelay(6 + steps.length)} />)}
    </div>
  );

  return (
    <CampusFrame chapterIndex={p.chapterIndex}>
      <TitleRow no={p.sectionNo} title={p.title} className="campus-rise" style={enterDelay(0)} />
      {image ? (
        <div className="cp-g2-sl-media campus-rise" style={enterDelay(1)}>
          <DiagramImage id="swimlane-flow-image" placeholder="泳道流程图" caption={p.imageCaption} />
        </div>
      ) : diagram}
      {p.showConclusion && <ConclusionBar label={p.conclusionLabel} text={p.conclusion} className="campus-rise" style={enterDelay(14)} />}
    </CampusFrame>
  );
}

SwimlaneFlow.META = {
  id: 'swimlane-flow',
  label: '泳道流程图 · 多角色分道配跨道箭头',
  roles: ['process', 'relationship'],
  defaults: DEFAULTS,
  copyBudgets: {
    title: 24,
    'lanes[].name': 4,
    'lanes[].note': 10,
    'steps[].no': 2,
    'steps[].text': 12,
    'steps[].nextLabel': 4,
    'steps[].branchLabel': 4,
    imageCaption: 30,
    conclusionLabel: 4,
    conclusion: 44,
  },
  numberBounds: {
    'steps[].lane': { min: 1, max: 4, semantics: 'index' },
    'steps[].col': { min: 1, max: 8, semantics: 'index' },
    'steps[].next': { min: 0, max: 10, semantics: 'index' },
    'steps[].branch': { min: 0, max: 10, semantics: 'index' },
  },
  controls: [
    { ...CHAPTER_CONTROL, default: 3 },
    ...diagramMediaControls('泳道流程图'),
    { key: 'laneCount', type: 'number', label: '泳道数量', default: 4, min: 2, max: 4, countArrays: ['lanes'], description: '横向泳道(角色 / 系统)的条数;所属泳道序号超出的步骤不显示。' },
    { key: 'stepCount', type: 'number', label: '步骤数量', default: 9, min: 3, max: 10, countArrays: ['steps'], description: '步骤节点数。每步写 lane(第几条泳道,1 起)、col(第几列 = 时间顺序,1–8)、next(下一步的序号,0 表示没有)、branch(第二个出口,0 表示没有)。节点形状自动决定:有 branch 的画成判断(六角形),没有 next 的画成结束胶囊,没有正向箭头指向的画成开始胶囊;nextLabel / branchLabel 写在对应箭头上(如「通过」「失败」)。指向更早列的箭头自动画成虚线。' },
    { key: 'showConclusion', type: 'toggle', label: '底部结论条', default: true, description: '页面底部的校色结论条。' },
  ],
};
