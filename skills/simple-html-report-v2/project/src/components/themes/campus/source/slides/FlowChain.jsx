// 长流程链 / 因果链:4–9 个环节横向排开,每环带序号、标题和一句说明,环节之间用渐变圆钮箭头相连;
// 超过 5 个环节时折成两行蛇形(第一行从左到右,右端转弯,第二行从右到左),链尾可接一个结果块。
// 几何按外壳的正文区尺寸计算(useCampusLayout),转弯连线是 SVG,文字都是独立文本。
// 适合作业流程、工艺流程、传导路径、实施步骤这类线性长链。
import React from 'react';
import { useThemeStyle, enterDelay } from '../../../shared/style.jsx';
import { safeArray, safeDenominator, clamp } from '../../../chart-safety.mjs';
import { CampusFrame, TitleRow, ConclusionBar, CHAPTER_CONTROL, TITLE_ROW_SPACE, CONCLUSION_SPACE, useCampusLayout } from '../kit/chrome.jsx';
import { NumberCard } from '../kit/parts.jsx';
import { useStructureStyle, LinkDot, SparkStar } from '../kit/structure.jsx';

const DEFAULTS = {
  chapterIndex: 2,
  stepCount: 8,
  showEnd: true,
  showLead: true,
  showConclusion: true,
  sectionNo: '2.2',
  title: '作业实施模型',
  lead: '作业实施模型由实施理论和实施步骤两部分构成，从作业认定到得出结果共九个环节。',
  steps: [
    { no: '01', title: '作业认定', desc: '从满足顾客需要出发，界定企业开展的各项作业。' },
    { no: '02', title: '作业调研', desc: '调查各部门的作业内容、资源耗用与工时。' },
    { no: '03', title: '作业识别', desc: '区分增值与不增值作业，确定作业中心。' },
    { no: '04', title: '运行分析', desc: '分析作业运行效率，找出可精简的环节。' },
    { no: '05', title: '成本归集', desc: '按资源动因把资源耗费归集到各项作业。' },
    { no: '06', title: '建成本库', desc: '把同质作业的成本合并为作业成本库。' },
    { no: '07', title: '成本分配', desc: '按成本动因把作业成本分配给成本对象。' },
    { no: '08', title: '比例计算', desc: '计算各成本对象的动因比例与分摊金额。' },
    { no: '09', title: '第九个环节', desc: '在这里写这个环节做什么，一句话即可。' },
  ],
  endLabel: '结果',
  endTitle: '客观的成本信息',
  endDesc: '科学分配制造费用，为经营决策提供准确依据。',
  conclusionLabel: '模型主线',
  conclusion: '把企业视为一系列作业的集合，按“资源 → 作业 → 成本对象”逐层归集与分配成本。',
};

const LEAD_SPACE = 64;
const GAP = 62;        // 同一行相邻环节之间的间距(放箭头圆钮)
const TURN = 66;       // 两行蛇形时右侧留给转弯连线的宽度
const ROW_GAP = 70;
const TAB = 20;        // tab 序号卡的编号标签高出卡片上沿的距离

const CSS = `
.cp-fc-lead{flex:none;display:flex;align-items:center;gap:14px;height:${LEAD_SPACE - 18}px;margin:0 0 18px;font-size:23px;line-height:1.45;color:var(--theme-muted);}
.cp-fc{position:relative;flex:1;min-height:0;}
.cp-fc svg.cp-fc-wire{position:absolute;inset:0;width:100%;height:100%;overflow:visible;pointer-events:none;}
.cp-fc-turn{fill:none;stroke:rgb(var(--theme-accent-rgb) / .45);stroke-width:3;stroke-linecap:round;stroke-dasharray:2 9;}
.cp-fc-turn-head{fill:none;stroke:rgb(var(--theme-accent-rgb) / .6);stroke-width:3.5;stroke-linecap:round;stroke-linejoin:round;}
.cp-fc-track{position:absolute;left:0;right:0;border-radius:var(--campus-radius-lg);background:var(--campus-wash);}
.cp-fc-card.campus-ncard.is-tab{position:absolute;margin-top:0;display:flex;flex-direction:column;padding:42px 24px 20px;}
.cp-fc-card .campus-ncard-title{font-size:27px;line-height:1.25;}
.cp-fc-card.campus-ncard.is-tab > .campus-ncard-title::after{margin-top:12px;}
.cp-fc-desc{margin-top:12px;font-size:21px;line-height:1.55;color:var(--theme-muted);text-wrap:pretty;}
.cp-fc.is-tight .cp-fc-card.campus-ncard.is-tab{padding:38px 20px 16px;}
.cp-fc.is-tight .cp-fc-card .campus-ncard-title{font-size:25px;}
.cp-fc.is-tight .cp-fc-desc{margin-top:10px;}
.cp-fc-dot{position:absolute;}
/* 链尾结果块:渐变大卡,点缀色星标 + 半透明标签 */
.cp-fc-end{position:absolute;display:flex;flex-direction:column;justify-content:center;gap:12px;padding:24px 26px;border-radius:var(--campus-radius);background:var(--campus-fill-deep);color:var(--theme-on-accent);box-shadow:var(--campus-shadow-lift);}
.cp-fc-end-label{align-self:flex-start;display:flex;align-items:center;gap:8px;height:38px;padding:0 16px 0 12px;border-radius:999px;background:var(--campus-on-accent-glass);font-family:var(--theme-font-serif);font-weight:700;font-size:21px;line-height:1;letter-spacing:.12em;}
.cp-fc-end-star{flex:none;display:block;color:var(--campus-spark);}
.cp-fc-end-title{font-family:var(--theme-font-serif);font-weight:700;font-size:30px;line-height:1.25;letter-spacing:.04em;text-wrap:balance;}
.cp-fc-end-desc{font-size:21px;line-height:1.55;color:var(--campus-on-accent-muted);text-wrap:pretty;}
.cp-fc.is-tight .cp-fc-end,.cp-fc.is-snake .cp-fc-end{gap:8px;padding:18px 24px;}
.cp-fc.is-tight .cp-fc-end-label{height:34px;font-size:20px;}
.cp-fc.is-tight .cp-fc-end-title{font-size:27px;}
.cp-fc-end-orb{position:absolute;right:-26px;bottom:-30px;width:130px;height:130px;border-radius:50%;background:rgb(255 255 255 / .08);pointer-events:none;}
`;

export function FlowChain(props) {
  useStructureStyle();
  useThemeStyle('campus-flow-chain-style', CSS);
  const p = { ...DEFAULTS, ...props };
  const { bodyW, bodyH } = useCampusLayout();
  const steps = safeArray(p.steps).slice(0, clamp(p.stepCount, 4, 9));
  const cells = steps.length + (p.showEnd ? 1 : 0);
  const twoRows = steps.length > 5;
  const cols = twoRows ? Math.ceil(cells / 2) : Math.max(1, cells);
  const W = bodyW;
  const H = bodyH - TITLE_ROW_SPACE - (p.showLead ? LEAD_SPACE : 0) - (p.showConclusion ? CONCLUSION_SPACE : 0);
  const turn = twoRows ? TURN : 0;
  const colW = (W - turn - (cols - 1) * GAP) / safeDenominator(cols, 1);
  // 行高:两行时平分(上限 268),一行时上限 330;整组在绘图区内纵向居中
  const tight = colW < 280;
  const rowH = twoRows ? Math.min(tight ? 300 : 268, (H - ROW_GAP) / 2) : Math.min(330, H - 40);
  const blockH = twoRows ? rowH * 2 + ROW_GAP : rowH;
  const top = Math.max(0, (H - blockH) / 2);
  const at = c => {
    const row = c < cols ? 0 : 1;
    const col = row === 0 ? c : cols - 1 - (c - cols);
    return { row, col, x: col * (colW + GAP), y: top + row * (rowH + ROW_GAP) };
  };
  const r1 = v => Math.round(v * 10) / 10;
  const cardBox = c => {
    const pos = at(c);
    return { left: r1(pos.x), top: r1(pos.y + TAB), width: r1(colW), height: r1(rowH - TAB) };
  };
  const midY = row => top + row * (rowH + ROW_GAP) + TAB + (rowH - TAB) / 2;
  // 相邻两格之间的箭头圆钮(同一行内);跨行的那一步由右侧转弯连线承担
  const links = [];
  for (let c = 1; c < cells; c += 1) {
    const a = at(c - 1);
    const b = at(c);
    if (a.row !== b.row) continue;
    const x = (a.col < b.col ? a.x + colW : b.x + colW) + GAP / 2;
    links.push({ x, y: midY(a.row), dir: a.col < b.col ? 'right' : 'left', delay: 2 + c });
  }
  const turnPath = (() => {
    if (!twoRows || cells <= cols) return null;
    const x0 = (cols - 1) * (colW + GAP) + colW;
    const xr = W - 22;
    const y0 = midY(0);
    const y1 = midY(1);
    const r = 26;
    return {
      wire: `M ${r1(x0 + 4)} ${r1(y0)} H ${r1(xr - r)} Q ${r1(xr)} ${r1(y0)} ${r1(xr)} ${r1(y0 + r)} V ${r1(y1 - r)} Q ${r1(xr)} ${r1(y1)} ${r1(xr - r)} ${r1(y1)} H ${r1(x0 + 8)}`,
      head: `M ${r1(x0 + 20)} ${r1(y1 - 9)} L ${r1(x0 + 8)} ${r1(y1)} L ${r1(x0 + 20)} ${r1(y1 + 9)}`,
    };
  })();
  return (
    <CampusFrame chapterIndex={p.chapterIndex}>
      <TitleRow no={p.sectionNo} title={p.title} className="campus-rise" style={enterDelay(0)} />
      {p.showLead && (
        <div className="cp-fc-lead campus-rise" style={enterDelay(1)}>
          <div className="campus-mark is-spark" aria-hidden="true" />
          <p>{p.lead}</p>
        </div>
      )}
      <div className={`cp-fc${tight ? ' is-tight' : ''}${twoRows ? ' is-snake' : ''}`}>
        {!twoRows && <div className="cp-fc-track campus-fade" style={{ top: r1(top + TAB + (rowH - TAB) * 0.3), height: r1((rowH - TAB) * 0.4), left: -24, right: -24, ...enterDelay(1) }} aria-hidden="true" />}
        {turnPath && (
          <svg className="cp-fc-wire campus-fade" style={enterDelay(3 + cols)} viewBox={`0 0 ${r1(W)} ${r1(H)}`} preserveAspectRatio="none" aria-hidden="true">
            <path className="cp-fc-turn" d={turnPath.wire} />
            <path className="cp-fc-turn-head" d={turnPath.head} />
          </svg>
        )}
        {turnPath && <LinkDot direction="down" size={44} className="cp-fc-dot campus-fade" style={{ left: r1(W - 44), top: r1((midY(0) + midY(1)) / 2 - 22), ...enterDelay(3 + cols) }} />}
        {steps.map((step, i) => (
          <NumberCard variant="tab" no={step?.no} title={step?.title} check={false} key={i} className="cp-fc-card campus-rise" style={{ ...cardBox(i), ...enterDelay(2 + i) }}>
            <p className="cp-fc-desc">{step?.desc}</p>
          </NumberCard>
        ))}
        {p.showEnd && (
          <div className="cp-fc-end campus-rise" style={{ ...cardBox(steps.length), ...enterDelay(3 + steps.length) }}>
            <div className="cp-fc-end-orb" aria-hidden="true" />
            <div className="cp-fc-end-label">
              <SparkStar size={18} className="cp-fc-end-star" />
              <div>{p.endLabel}</div>
            </div>
            <div className="cp-fc-end-title">{p.endTitle}</div>
            <p className="cp-fc-end-desc">{p.endDesc}</p>
          </div>
        )}
        {links.map((l, i) => (
          <LinkDot key={i} direction={l.dir} size={40} className="cp-fc-dot campus-fade" style={{ left: r1(l.x - 20), top: r1(l.y - 20), ...enterDelay(l.delay) }} />
        ))}
      </div>
      {p.showConclusion && <ConclusionBar label={p.conclusionLabel} text={p.conclusion} className="campus-rise" style={enterDelay(12)} />}
    </CampusFrame>
  );
}

FlowChain.META = {
  id: 'flow-chain',
  label: '长流程链 · 多环节蛇形折行配结果块',
  roles: ['process', 'relationship'],
  defaults: DEFAULTS,
  copyBudgets: {
    lead: 44,
    'steps[].no': 3,
    'steps[].title': 6,
    'steps[].desc': 24,
    endLabel: 4,
    endTitle: 8,
    endDesc: 22,
    conclusionLabel: 4,
    conclusion: 44,
  },
  controls: [
    { ...CHAPTER_CONTROL, default: 2 },
    { key: 'stepCount', type: 'number', label: '环节数量', default: 8, min: 4, max: 9, description: '链条上的环节数;超过 5 个时自动折成两行蛇形(第二行从右往左)。' },
    { key: 'showEnd', type: 'toggle', label: '链尾结果块', default: true, description: '链条末尾的渐变结果块(结论、产出或最终结果)。' },
    { key: 'showLead', type: 'toggle', label: '导语', default: true, description: '标题下方的一句导语。' },
    { key: 'showConclusion', type: 'toggle', label: '底部结论条', default: true, description: '页面底部的校色结论条。' },
  ],
};
