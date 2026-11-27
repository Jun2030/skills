// 树状结构图:顶部根节点 → 横向 2–6 个一级节点 → 每个一级节点下竖排 2–8 个叶子;
// 可切换成「一页并排两棵树」(如学生 / 管理员两种角色各一棵)。叶子多、栏窄时自动收紧(叶子改成居中串排)。
// 几何按外壳的正文区尺寸计算(useCampusLayout),连线是不含文字的细条元素,节点文字是独立文本。
// 适合系统功能模块树、研究框架分解、问题树。
import React from 'react';
import { useThemeStyle, enterDelay } from '../../../shared/style.jsx';
import { safeArray, safeDenominator, safeMax, clamp } from '../../../chart-safety.mjs';
import { CampusFrame, TitleRow, ConclusionBar, CHAPTER_CONTROL, TITLE_ROW_SPACE, CONCLUSION_SPACE, useCampusLayout } from '../kit/chrome.jsx';
import { useStructureStyle } from '../kit/structure.jsx';

const DEFAULTS = {
  chapterIndex: 3,
  treeMode: 'dual',
  branchCount: 4,
  secondBranchCount: 5,
  showRootNote: true,
  showConclusion: true,
  sectionNo: '3.2',
  title: '系统功能结构图',
  root: '学生',
  rootNote: 'STUDENT',
  branches: [
    { name: '个人资料管理', labels: ['修改资料', '登录', '注册'] },
    { name: '在线测试', labels: ['练习', '考试'] },
    { name: '数据分析', labels: ['排行榜', '技能分布', '题型分析', '技能成熟度'] },
    { name: '试卷管理', labels: ['查看试卷', '删除试卷'] },
    { name: '功能模块五', labels: ['子功能一', '子功能二'] },
    { name: '功能模块六', labels: ['子功能一', '子功能二'] },
  ],
  secondRoot: '管理员',
  secondRootNote: 'ADMINISTRATOR',
  secondBranches: [
    { name: '试卷管理', labels: ['删除试卷', '关闭试卷'] },
    { name: '试题管理', labels: ['添加试题', '修改试题', '删除试题'] },
    { name: '用户管理', labels: ['添加用户', '编辑用户', '删除用户', '审核用户'] },
    { name: '系统数据分析', labels: ['技能占比', '题型占比', '作答分布'] },
    { name: '个人资料管理', labels: ['更新资料', '退出系统'] },
  ],
  conclusionLabel: '角色划分',
  conclusion: '学生侧重在线测试与自我分析，管理员侧重题库、试卷与用户管理。',
};

const MAX_LEAVES = 8;
const TREE_GAP = 72;      // 双树之间的间距(中间画一道虚线分隔)
const STEM = 52;          // 根节点到一级节点之间的连线区高度
const BRANCH_H = 62;
const LEAF_TOP = 24;      // 一级节点到第一片叶子的距离
const COL_MAX = 360;      // 一级节点栏宽上限
const NARROW_AT = 200;    // 栏宽低于它时叶子改为居中串排

const CSS = `
.cp-tr{position:relative;flex:1;min-height:0;}
.cp-tr-tree{position:absolute;top:0;bottom:0;}
.cp-tr-split{position:absolute;top:8%;bottom:4%;width:0;border-left:2px dashed var(--campus-accent-line);}
/* 根节点:渐变圆角块 + 虚线外环 + 顶部点缀色短线 */
.cp-tr-root{position:absolute;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;padding:0 24px;border-radius:20px;background:var(--campus-fill-deep);color:var(--theme-on-accent);box-shadow:0 14px 30px rgb(var(--theme-accent-rgb) / .3);text-align:center;}
.cp-tr-root-ring{position:absolute;border-radius:26px;border:1.5px dashed var(--campus-accent-line);pointer-events:none;}
.cp-tr-root-spark{position:absolute;left:50%;top:0;width:44px;height:5px;margin-left:-22px;border-radius:0 0 4px 4px;background:var(--campus-spark);}
.cp-tr-root-title{font-family:var(--theme-font-serif);font-weight:700;font-size:32px;line-height:1.15;letter-spacing:.1em;white-space:nowrap;}
.cp-tr-root-note{font-size:14px;line-height:1;font-weight:600;letter-spacing:.2em;color:var(--campus-on-accent-muted);white-space:nowrap;}
/* 连线:不含文字的细条 */
.cp-tr-line{position:absolute;background:var(--campus-accent-line);border-radius:2px;}
.cp-tr-line.is-strong{background:rgb(var(--theme-accent-rgb) / .55);}
.cp-tr-joint{position:absolute;width:14px;height:14px;margin:-7px 0 0 -7px;border-radius:50%;background:var(--theme-surface);border:3.5px solid var(--theme-accent);}
/* 一级节点 */
.cp-tr-branch{position:absolute;display:flex;align-items:center;justify-content:center;padding:0 10px;border-radius:12px;background:var(--campus-fill);color:var(--theme-on-accent);box-shadow:var(--campus-shadow-lift);text-align:center;}
.cp-tr-branch-name{font-family:var(--theme-font-serif);font-weight:700;font-size:25px;line-height:1.15;letter-spacing:.04em;text-wrap:balance;}
.cp-tr-tree.is-narrow .cp-tr-branch{padding:0 4px;}
.cp-tr-tree.is-narrow .cp-tr-branch-name{font-size:21px;letter-spacing:0;}
/* 叶子:白底小卡;宽栏时左侧梳齿式,窄栏时居中串排 */
.cp-tr-leaf{position:absolute;display:flex;align-items:center;padding:0 14px 0 18px;border-radius:10px;background:var(--theme-surface);border:1px solid var(--campus-card-edge);box-shadow:0 6px 16px rgb(var(--theme-accent-rgb) / .08);}
.cp-tr-leaf-bar{position:absolute;left:0;top:10px;bottom:10px;width:4px;border-radius:0 3px 3px 0;background:var(--campus-fill-bar);}
.cp-tr-leaf-text{min-width:0;font-size:22px;line-height:1.3;font-weight:500;color:var(--theme-ink);text-wrap:balance;}
.cp-tr-tree.is-narrow .cp-tr-leaf{justify-content:center;padding:0 8px;text-align:center;}
.cp-tr-tree.is-narrow .cp-tr-leaf-text{font-size:21px;}
.cp-tr-tree.is-narrow .cp-tr-leaf-bar{display:none;}
`;

/** 一棵树的几何:根节点、一级节点、叶子与连线的位置都按给定宽高算出(px)。 */
function layoutTree({ W, H, branches, narrow, single }) {
  const n = Math.max(1, branches.length);
  const gap = single ? 22 : 14;
  // 一级节点少时栏宽封顶,整棵树水平居中,避免短标签被拉成长条
  const colW = Math.min(COL_MAX, (W - (n - 1) * gap) / n);
  const x0 = (W - (n * colW + (n - 1) * gap)) / 2;
  const counts = branches.map(b => safeArray(b?.labels).slice(0, MAX_LEAVES).length);
  const k = Math.max(1, safeMax(counts, 1));
  const rootH = 86;
  const leafGap = k >= 7 ? 10 : k >= 5 ? 12 : 16;
  const leafRoom = H - rootH - STEM - BRANCH_H - LEAF_TOP;
  const leafH = clamp((leafRoom - (k - 1) * leafGap) / safeDenominator(k, 1), 40, narrow ? 84 : 74);
  const total = rootH + STEM + BRANCH_H + LEAF_TOP + k * leafH + (k - 1) * leafGap;
  const top = Math.max(0, (H - total) / 2);
  const rootW = clamp(W * (single ? 0.26 : 0.42), 220, 420);
  const busY = top + rootH + STEM / 2;
  const branchY = top + rootH + STEM;
  const leafY0 = branchY + BRANCH_H + LEAF_TOP;
  const cols = branches.map((b, i) => {
    const x = x0 + i * (colW + gap);
    const leaves = safeArray(b?.labels).slice(0, MAX_LEAVES);
    return { x, cx: x + colW / 2, leaves, name: b?.name };
  });
  return { n, colW, narrow, leafH, leafGap, rootW, rootH, top, busY, branchY, leafY0, cols };
}

function Tree({ W, H, left, root, rootNote, showNote, branches, narrow, single, delay }) {
  const g = layoutTree({ W, H, branches, narrow, single });
  const r2 = v => Math.round(v * 10) / 10;
  const first = g.cols[0]?.cx ?? W / 2;
  const last = g.cols[g.cols.length - 1]?.cx ?? W / 2;
  return (
    <div className={`cp-tr-tree${g.narrow ? ' is-narrow' : ''}`} style={{ left, width: W }}>
      {/* 根 → 总线 → 各一级节点 */}
      <div className="cp-tr-line is-strong campus-fade" style={{ left: r2(W / 2 - 1.5), top: r2(g.top + g.rootH), width: 3, height: r2(STEM / 2), ...enterDelay(delay + 1) }} aria-hidden="true" />
      {g.n > 1 && <div className="cp-tr-line is-strong campus-draw" style={{ left: r2(first), top: r2(g.busY - 1.5), width: r2(last - first), height: 3, ...enterDelay(delay + 1) }} aria-hidden="true" />}
      {g.cols.map((c, i) => (
        <div className="cp-tr-line is-strong campus-fade" key={`d${i}`} style={{ left: r2(c.cx - 1.5), top: r2(g.busY), width: 3, height: r2(STEM / 2), ...enterDelay(delay + 2) }} aria-hidden="true" />
      ))}
      <div className="cp-tr-joint campus-fade" style={{ left: r2(W / 2), top: r2(g.busY), ...enterDelay(delay + 1) }} aria-hidden="true" />
      <div className="cp-tr-root-ring campus-fade" style={{ left: r2((W - g.rootW) / 2 - 8), top: r2(g.top - 8), width: r2(g.rootW + 16), height: g.rootH + 16, ...enterDelay(delay) }} aria-hidden="true" />
      <div className="cp-tr-root campus-rise" style={{ left: r2((W - g.rootW) / 2), top: r2(g.top), width: r2(g.rootW), height: g.rootH, ...enterDelay(delay) }}>
        <div className="cp-tr-root-spark" aria-hidden="true" />
        <div className="cp-tr-root-title">{root}</div>
        {showNote ? <div className="cp-tr-root-note">{rootNote}</div> : null}
      </div>
      {g.cols.map((c, i) => {
        const leafX = g.narrow ? c.x : c.x + 40;
        const leafW = g.narrow ? g.colW : g.colW - 40;
        const spineX = g.narrow ? c.cx : c.x + 20;
        const lastMid = g.leafY0 + (c.leaves.length - 1) * (g.leafH + g.leafGap) + g.leafH / 2;
        return (
          <React.Fragment key={i}>
            {c.leaves.length > 0 && (
              <div className="cp-tr-line campus-fade" style={{ left: r2(spineX - 1.5), top: r2(g.branchY + BRANCH_H), width: 3, height: r2(lastMid - g.branchY - BRANCH_H), ...enterDelay(delay + 3 + i) }} aria-hidden="true" />
            )}
            <div className="cp-tr-branch campus-rise" style={{ left: r2(c.x), top: r2(g.branchY), width: r2(g.colW), height: BRANCH_H, ...enterDelay(delay + 2 + i) }}>
              <div className="cp-tr-branch-name">{c.name}</div>
            </div>
            {c.leaves.map((leaf, j) => {
              const y = g.leafY0 + j * (g.leafH + g.leafGap);
              return (
                <React.Fragment key={j}>
                  {!g.narrow && <div className="cp-tr-line campus-fade" style={{ left: r2(spineX), top: r2(y + g.leafH / 2 - 1.5), width: r2(leafX - spineX), height: 3, ...enterDelay(delay + 3 + i) }} aria-hidden="true" />}
                  <div className="cp-tr-leaf campus-rise" style={{ left: r2(leafX), top: r2(y), width: r2(leafW), height: r2(g.leafH), ...enterDelay(delay + 3 + i) }}>
                    <div className="cp-tr-leaf-bar" aria-hidden="true" />
                    <div className="cp-tr-leaf-text">{leaf}</div>
                  </div>
                </React.Fragment>
              );
            })}
          </React.Fragment>
        );
      })}
    </div>
  );
}

export function TreeStructure(props) {
  useStructureStyle();
  useThemeStyle('campus-tree-structure-style', CSS);
  const p = { ...DEFAULTS, ...props };
  const { bodyW, bodyH } = useCampusLayout();
  const dual = p.treeMode === 'dual';
  const H = bodyH - TITLE_ROW_SPACE - (p.showConclusion ? CONCLUSION_SPACE : 0);
  const branches = safeArray(p.branches).slice(0, clamp(p.branchCount, 2, dual ? 5 : 6));
  const second = safeArray(p.secondBranches).slice(0, clamp(p.secondBranchCount, 2, 5));
  const treeW = dual ? (bodyW - TREE_GAP) / 2 : bodyW;
  // 栏宽低于阈值时叶子改为居中串排,省出左侧梳齿占的宽度;两棵树并排时统一按较窄的那棵决定,保持一页一种画法
  const colWidth = list => (treeW - (list.length - 1) * (dual ? 14 : 22)) / Math.max(1, list.length);
  const narrow = (dual ? [branches, second] : [branches]).some(list => colWidth(list) < NARROW_AT);
  return (
    <CampusFrame chapterIndex={p.chapterIndex}>
      <TitleRow no={p.sectionNo} title={p.title} className="campus-rise" style={enterDelay(0)} />
      <div className="cp-tr">
        <Tree W={treeW} H={H} left={0} root={p.root} rootNote={p.rootNote} showNote={p.showRootNote} branches={branches} narrow={narrow} single={!dual} delay={1} />
        {dual && <div className="cp-tr-split campus-fade" style={{ left: treeW + TREE_GAP / 2, ...enterDelay(2) }} aria-hidden="true" />}
        {dual && <Tree W={treeW} H={H} left={treeW + TREE_GAP} root={p.secondRoot} rootNote={p.secondRootNote} showNote={p.showRootNote} branches={second} narrow={narrow} single={false} delay={3} />}
      </div>
      {p.showConclusion && <ConclusionBar label={p.conclusionLabel} text={p.conclusion} className="campus-rise" style={enterDelay(10)} />}
    </CampusFrame>
  );
}

TreeStructure.META = {
  id: 'tree-structure',
  label: '树状结构图 · 根节点分叉到叶子(可双树并排)',
  roles: ['relationship', 'breakdown'],
  defaults: DEFAULTS,
  copyBudgets: {
    root: 6,
    secondRoot: 6,
    rootNote: 14,
    secondRootNote: 14,
    'branches[].name': 6,
    'branches[].labels[]': 8,
    'secondBranches[].name': 6,
    'secondBranches[].labels[]': 8,
    conclusionLabel: 4,
    conclusion: 40,
  },
  controls: [
    { ...CHAPTER_CONTROL, default: 3 },
    { key: 'treeMode', type: 'radio', label: '树的数量', default: 'dual', options: [{ value: 'single', label: '一棵树' }, { value: 'dual', label: '两棵树并排' }], description: '一页放一棵树,或左右并排两棵(如两种角色各一棵)。' },
    { key: 'branchCount', type: 'number', label: '一级节点数', default: 4, min: 2, max: 6, countArrays: ['branches'], description: '(左侧)树的一级节点数;两棵树并排时最多 5 个。每个一级节点下的叶子按 labels 显示,最多 8 个;并排两棵树时叶子建议不超过 6 个、每个不超过 6 字。' },
    { key: 'secondBranchCount', type: 'number', label: '右侧树一级节点数', default: 5, min: 2, max: 5, countArrays: ['secondBranches'], description: '两棵树并排时右侧那棵树的一级节点数。' },
    { key: 'showRootNote', type: 'toggle', label: '根节点副题', default: true, description: '根节点名称下方的一行小字(英文或说明)。' },
    { key: 'showConclusion', type: 'toggle', label: '底部结论条', default: true, description: '页面底部的校色结论条。' },
  ],
};
