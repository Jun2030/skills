// 中心辐射:中央一枚渐变圆形核心概念,左右两列 4–6 张要素卡(大编号水印卡),每张卡用引线指向圆心。
// 几何按外壳的正文区尺寸计算(useCampusLayout),四种导航样式下都不溢出、不变形。
// 适合理论框架、概念图、研究思路这类「一个核心 + 若干组成要素」的内容。
import React from 'react';
import { useThemeStyle, enterDelay } from '../../../shared/style.jsx';
import { safeArray, safeRatio, clamp } from '../../../chart-safety.mjs';
import { CampusFrame, TitleRow, ConclusionBar, CHAPTER_CONTROL, TITLE_ROW_SPACE, CONCLUSION_SPACE, useCampusLayout } from '../kit/chrome.jsx';
import { NumberCard } from '../kit/parts.jsx';

const DEFAULTS = {
  chapterIndex: 2,
  itemCount: 6,
  showConclusion: true,
  sectionNo: '2.3',
  title: '理论框架',
  hubTitle: '可持续创作',
  hubNote: 'SUSTAINABLE CREATION',
  items: [
    { no: '01', title: '数据评估', desc: '以点击率、完播率等核心指标量化评估作品表现，替代“凭感觉”的经验判断。' },
    { no: '02', title: '流程再造', desc: '借助协作表格与 AI 工具重组选题、制作与复盘流程，把经验变成规范。' },
    { no: '03', title: '团队协作', desc: '工作室化的专业分工，让创作从依赖个人灵感走向可预期的稳定产能。' },
    { no: '04', title: '账号矩阵', desc: '主账号与多个子账号覆盖不同圈层，分散单一平台、单一账号的算法风险。' },
    { no: '05', title: '真诚沟通', desc: '不掩饰失败的公开复盘与长期稳定的输出，持续累积观众对创作者的信任。' },
    { no: '06', title: '品牌变现', desc: '以观众信任为消费信用背书发展自有品牌，形成健康可持续的商业循环。' },
  ],
  conclusionLabel: '框架说明',
  conclusion: '六个要素分属生产、组织与关系三个层面，共同支撑“可持续创作”这一核心。',
};

const HUB_R = 146;
const RING_R = 178;
const CARD_GAP = 24;
// 卡片高度上限:要素少时卡片不拉满整列,整组在纵向居中。
const CARD_MAX_H = 248;

const CSS = `
.cp-hs{position:relative;flex:1;min-height:0;}
.cp-hs svg{position:absolute;inset:0;width:100%;height:100%;overflow:visible;}
.cp-hs-ring{fill:none;stroke:var(--campus-accent-line);stroke-width:2;stroke-dasharray:3 9;stroke-linecap:round;}
.cp-hs-spoke{stroke:var(--campus-accent-line);stroke-width:2.5;}
.cp-hs-glow{position:absolute;border-radius:50%;background:radial-gradient(circle at 50% 50%,rgb(var(--theme-accent-rgb) / .16) 0%,rgb(var(--theme-accent-rgb) / 0) 70%);}
.cp-hs-hub{position:absolute;border-radius:50%;background:var(--campus-fill-deep);box-shadow:0 22px 48px rgb(var(--theme-accent-rgb) / .34);}
.cp-hs-hub-ring{position:absolute;border-radius:50%;border:10px solid rgb(var(--theme-accent-rgb) / .1);}
.cp-hs-hub-text{position:absolute;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;color:var(--theme-on-accent);text-align:center;}
.cp-hs-hub-title{font-family:var(--theme-font-serif);font-weight:700;font-size:46px;line-height:1.16;letter-spacing:.06em;text-wrap:balance;}
.cp-hs-hub-note{font-size:14px;font-weight:600;letter-spacing:.2em;color:var(--campus-on-accent-muted);}
.cp-hs-hub-spark{width:30px;height:3px;border-radius:2px;background:var(--campus-spark);}
.cp-hs-end{position:absolute;width:16px;height:16px;margin:-8px 0 0 -8px;border-radius:50%;background:var(--theme-surface);border:4px solid var(--theme-accent);box-shadow:0 3px 8px rgb(var(--theme-accent-rgb) / .3);}
.cp-hs-card{position:absolute;display:flex;flex-direction:column;justify-content:center;}
.cp-hs-desc{margin-top:12px;font-size:23px;line-height:1.62;color:var(--theme-muted);text-wrap:pretty;}
.cp-hs-card .campus-ncard-title{font-size:31px;}
.cp-hs.is-tight .cp-hs-desc{font-size:22px;line-height:1.56;margin-top:8px;}
.cp-hs.is-tight .cp-hs-card .campus-ncard-title{font-size:29px;}
.cp-hs.is-tight .cp-hs-card{padding-top:26px;padding-bottom:22px;}
`;

export function HubSpokes(props) {
  useThemeStyle('campus-hub-spokes-style', CSS);
  const p = { ...DEFAULTS, ...props };
  const { bodyW, bodyH } = useCampusLayout();
  const items = safeArray(p.items).slice(0, clamp(p.itemCount, 4, 6));
  // 绘图区尺寸由外壳的正文区约定换算:正文区减去标题行和(可选的)结论条,导航样式变化时随之变化。
  const W = bodyW;
  const H = bodyH - TITLE_ROW_SPACE - (p.showConclusion ? CONCLUSION_SPACE : 0);
  const CARD_W = Math.round(W * 0.31);
  const leftCount = Math.ceil(items.length / 2);
  const rightCount = items.length - leftCount;
  const cx = W / 2;
  const cy = H / 2;
  const cards = items.map((item, i) => {
    const left = i < leftCount;
    const k = left ? leftCount : rightCount;
    const j = left ? i : i - leftCount;
    const h = Math.min(CARD_MAX_H, (H - (k - 1) * CARD_GAP) / Math.max(1, k));
    const offset = (H - (k * h + (k - 1) * CARD_GAP)) / 2;
    const top = offset + j * (h + CARD_GAP);
    const x = left ? 0 : W - CARD_W;
    const anchor = { x: left ? CARD_W : W - CARD_W, y: top + h / 2 };
    const dx = anchor.x - cx;
    const dy = anchor.y - cy;
    const len = Math.max(1, Math.hypot(dx, dy));
    const ring = { x: cx + safeRatio(dx, len) * RING_R, y: cy + safeRatio(dy, len) * RING_R };
    return { item, left, top, h, x, anchor, ring };
  });
  const tight = Math.max(leftCount, rightCount) >= 3;
  const at = r => ({ left: cx - r, top: cy - r, width: r * 2, height: r * 2 });
  return (
    <CampusFrame chapterIndex={p.chapterIndex}>
      <TitleRow no={p.sectionNo} title={p.title} className="campus-rise" style={enterDelay(0)} />
      <div className={`cp-hs${tight ? ' is-tight' : ''}`}>
        <div className="cp-hs-glow campus-fade" style={{ ...at(RING_R + 90), ...enterDelay(1) }} />
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden="true">
          <circle className="cp-hs-ring campus-fade" style={enterDelay(1)} cx={cx} cy={cy} r={RING_R} />
          {cards.map((c, i) => (
            <line className="cp-hs-spoke campus-fade" style={enterDelay(3 + i)} key={i} x1={c.anchor.x} y1={c.anchor.y} x2={c.ring.x} y2={c.ring.y} />
          ))}
        </svg>
        <div className="cp-hs-hub-ring campus-fade" style={{ ...at(HUB_R + 16), ...enterDelay(1) }} />
        <div className="cp-hs-hub campus-fade" style={{ ...at(HUB_R), ...enterDelay(1) }} />
        <div className="cp-hs-hub-text campus-fade" style={{ ...at(HUB_R), ...enterDelay(2) }}>
          <div className="cp-hs-hub-spark" aria-hidden="true" />
          <div className="cp-hs-hub-title">{p.hubTitle}</div>
          <div className="cp-hs-hub-note">{p.hubNote}</div>
        </div>
        {cards.map((c, i) => (
          <React.Fragment key={i}>
            <div className="cp-hs-end campus-fade" style={{ left: c.ring.x, top: c.ring.y, ...enterDelay(3 + i) }} />
            <NumberCard variant="ghost" no={c.item?.no} title={c.item?.title} className="cp-hs-card campus-rise" style={{ left: c.x, top: c.top, width: CARD_W, height: c.h, ...enterDelay(2 + i) }}>
              <p className="cp-hs-desc">{c.item?.desc}</p>
            </NumberCard>
          </React.Fragment>
        ))}
      </div>
      {p.showConclusion && <ConclusionBar label={p.conclusionLabel} text={p.conclusion} className="campus-rise" style={enterDelay(9)} />}
    </CampusFrame>
  );
}

HubSpokes.META = {
  id: 'hub-spokes',
  label: '中心辐射 · 核心概念配周边要素',
  roles: ['relationship', 'breakdown', 'context'],
  defaults: DEFAULTS,
  copyBudgets: { hubTitle: 6, 'items[].title': 8, 'items[].desc': 36, conclusion: 44 },
  controls: [
    { ...CHAPTER_CONTROL, default: 2 },
    { key: 'itemCount', type: 'number', label: '要素数量', default: 6, min: 4, max: 6, description: '围绕核心概念的要素卡数量,左右两列分摊。' },
    { key: 'showConclusion', type: 'toggle', label: '底部结论条', default: true, description: '页面底部的校色结论条。' },
  ],
};
