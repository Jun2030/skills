// 界面截图网格:系统实现 / 成果展示页,一页放 1–6 张界面截图。
//   竖屏   手机截图等高横排(最多 6 张)
//   横屏   网页截图 1 张大图、2 张并排、3–4 张 2×2、5–6 张 3×2
//   一大两小 第 1 张横屏大图在左,其余 1–2 张在右侧上下排
//   混排   第 1 张横屏 + 其余竖屏,等高横排(最多 5 张)
// 每张图下方「编号 + 一句操作说明」;可选步骤箭头串联、设备外框(手机 / 浏览器窗口,纯 CSS 画)、右侧实现要点、底部结论条。
// 截图按设备比例显示(手机 9:19.5、网页 16:10),媒体槽按原比例放入,不裁切。
import React from 'react';
import { useThemeStyle, enterDelay } from '../../../shared/style.jsx';
import { MediaSlot } from '../../../shared/MediaSlot.jsx';
import { safeArray, safeNumber, clamp } from '../../../chart-safety.mjs';
import { CampusFrame, TitleRow, ConclusionBar, FlowArrow, CHAPTER_CONTROL } from '../kit/chrome.jsx';
import { LabelRow } from '../kit/parts.jsx';
import { DeviceFrame, useEvidenceStyle } from '../kit/evidence.jsx';

const DEFAULTS = {
  chapterIndex: 3,
  layout: 'desktop',
  shotCount: 4,
  frame: 'device',
  showArrows: false,
  showPoints: false,
  pointCount: 3,
  showConclusion: true,
  images: [],
  sectionNo: '3.6',
  title: '系统前台实现',
  shots: [
    { no: '图 20', text: '在线测试：计时作答，可部分提交' },
    { no: '图 21', text: '我的试卷：已关闭的试卷不能展开' },
    { no: '图 22', text: '排行榜：按用户综合得分排名' },
    { no: '图 23', text: '我的数据分析：技能与题型占比' },
    { no: '图 13', text: '登录界面：第三方验证码与二次验证' },
    { no: '图 14', text: '注册界面：填写资料后提交审核' },
  ],
  pointsLabel: '实现要点',
  points: [
    { no: '01', title: '计时与提交', desc: '在线测试支持计时、部分提交，交卷后系统更新试题数据。' },
    { no: '02', title: '防止题库泄露', desc: '已关闭的试卷不允许修改，也不允许展开详细内容。' },
    { no: '03', title: '数据分析', desc: '技能、题型、试卷类型三类占比，帮助用户发现薄弱点。' },
    { no: '04', title: '排行榜', desc: '按综合得分排名，后续增加多角度与单场考试排名。' },
  ],
  conclusionLabel: '功能小结',
  conclusion: '前台四个模块串起「作答 → 查卷 → 排名 → 自我分析」的完整使用路径。',
};

// 截图的屏幕比例(宽 / 高)与外框占用的额外宽高(px)
const SCREEN_RATIO = { phone: 9 / 19.5, browser: 16 / 10 };
const CHROME = {
  device: { phone: { w: 22, h: 22 }, browser: { w: 2, h: 35 } },
  plain: { phone: { w: 16, h: 16 }, browser: { w: 16, h: 16 } },
};
const GAP = 36;
const ARROW_W = 40;
const ARROW_GAP = 14;
const CAP_SIDE_W = 250;
const CAP_SIDE_GAP = 24;

const MAX_SHOTS = { phone: 6, desktop: 6, feature: 3, mixed: 5 };

const CSS = `
.cp-sg{flex:1;min-height:0;display:flex;gap:40px;}
.cp-sg-stage{flex:1;min-width:0;min-height:0;display:flex;flex-direction:column;gap:20px;}
.cp-sg-stage.is-feature{flex-direction:row;gap:${GAP}px;}
.cp-sg-col{min-width:0;min-height:0;display:flex;flex-direction:column;gap:20px;}
.cp-sg-row{flex:1;min-width:0;min-height:0;container-type:size;display:flex;align-items:center;justify-content:center;gap:${GAP}px;}
.cp-sg-row.has-arrows{gap:${ARROW_GAP}px;}
.cp-sg-item{flex:none;display:flex;flex-direction:column;margin:0;min-width:0;}
.cp-sg-arrow{flex:none;width:${ARROW_W}px;display:flex;align-items:center;justify-content:center;}
.cp-sg-arrow-disc{width:${ARROW_W}px;height:${ARROW_W}px;border-radius:50%;display:grid;place-items:center;background:var(--theme-surface);color:var(--theme-accent);box-shadow:0 0 0 1px var(--campus-card-edge),0 6px 14px rgb(var(--theme-accent-rgb) / .16);}
.cp-sg-cap{flex:none;display:flex;align-items:flex-start;gap:12px;padding-top:16px;min-width:0;}
.cp-sg-cap .campus-seal{height:32px;min-width:0;padding:0 12px;font-size:18px;border-radius:999px;}
.cp-sg-cap-text{min-width:0;padding-top:3px;font-size:20px;line-height:1.4;color:var(--theme-ink);text-wrap:pretty;}
.cp-sg-cap.is-stack{flex-direction:column;align-items:center;gap:8px;text-align:center;}
.cp-sg-cap.is-stack .cp-sg-cap-text{padding-top:0;font-size:19px;}
.cp-sg-item.is-side{flex-direction:row;align-items:center;gap:${CAP_SIDE_GAP}px;}
.cp-sg-cap.is-side{flex:none;width:${CAP_SIDE_W}px;flex-direction:column;align-items:flex-start;gap:12px;padding:0;}
.cp-sg-cap.is-side .cp-sg-cap-text{padding:0;font-size:22px;line-height:1.5;}
.cp-sg-cap.is-side::after{content:'';display:block;width:56px;height:4px;border-radius:2px;background:var(--campus-fill);}
.cp-sg-side{flex:0 0 440px;display:flex;flex-direction:column;gap:18px;}
.campus[data-campus-nav="rail"] .cp-sg-side{flex-basis:400px;}
.cp-sg-points{flex:1;min-height:0;display:grid;grid-auto-rows:minmax(0,1fr);row-gap:16px;}
.cp-sg-point{display:flex;align-items:flex-start;gap:18px;padding:20px 24px 18px 20px;min-height:0;}
.cp-sg-point-title{font-size:23px;line-height:1.35;font-weight:700;color:var(--theme-ink);}
.cp-sg-point-desc{margin-top:6px;font-size:21px;line-height:1.55;color:var(--theme-muted);text-wrap:pretty;}
.cp-sg-points.is-4 .cp-sg-point{padding:14px 22px 12px 18px;}
.cp-sg-points.is-4 .cp-sg-point-desc{margin-top:4px;font-size:20px;line-height:1.5;}
`;

/**
 * 一行截图:所有外框等高,高度取「行高减图注」与「按宽度能放下的高度」中较小的一个(容器查询单位,随正文区变化)。
 * items: [{ kind: 'phone' | 'browser', index }]
 */
function ShotRow({ items, frame, arrows, capH, capSide = false, renderItem, className = '', style }) {
  const chrome = CHROME[frame] || CHROME.device;
  const ratioSum = items.reduce((sum, item) => sum + SCREEN_RATIO[item.kind], 0);
  const extra = items.reduce((sum, item) => sum + chrome[item.kind].w - chrome[item.kind].h * SCREEN_RATIO[item.kind] + (capSide ? CAP_SIDE_W + CAP_SIDE_GAP : 0), 0);
  const between = items.length - 1;
  const gaps = arrows ? between * (ARROW_W + 2 * ARROW_GAP) : between * GAP;
  const outerH = `min(calc(100cqh - ${capSide ? 0 : capH}px), calc((100cqw - ${Math.round(gaps + extra)}px) / ${ratioSum.toFixed(4)}))`;
  return (
    <div className={`cp-sg-row${arrows ? ' has-arrows' : ''} ${className}`} style={{ '--cp-sg-h': outerH, ...style }}>
      {items.map((item, i) => {
        const c = chrome[item.kind];
        const width = `calc((var(--cp-sg-h) - ${c.h}px) * ${SCREEN_RATIO[item.kind].toFixed(4)} + ${c.w}px)`;
        return (
          <React.Fragment key={item.index}>
            {arrows && i > 0 && (
              <div className="cp-sg-arrow" style={{ height: 'var(--cp-sg-h)' }} aria-hidden="true">
                <div className="cp-sg-arrow-disc"><FlowArrow size={24} /></div>
              </div>
            )}
            {renderItem(item, { width, height: 'var(--cp-sg-h)', side: capSide })}
          </React.Fragment>
        );
      })}
    </div>
  );
}

export function ScreenshotGrid(props) {
  useThemeStyle('campus-screenshot-grid-style', CSS);
  useEvidenceStyle();
  const p = { ...DEFAULTS, ...props };
  const layout = MAX_SHOTS[p.layout] ? p.layout : 'desktop';
  const count = clamp(Math.round(safeNumber(p.shotCount, 1)), 1, MAX_SHOTS[layout]);
  const shots = safeArray(p.shots);
  const points = safeArray(p.points).slice(0, clamp(p.pointCount, 2, 4));
  const frame = p.frame === 'plain' ? 'plain' : 'device';
  const arrows = Boolean(p.showArrows);
  const kindOf = i => (layout === 'phone' || (layout === 'mixed' && i > 0) ? 'phone' : 'browser');
  const all = Array.from({ length: count }, (_, i) => ({ kind: kindOf(i), index: i }));
  const hasPhone = all.some(item => item.kind === 'phone');
  const capH = hasPhone ? 104 : 70;
  // 横屏网格只有 1 张或 2×2 时,上下留白多、左右留白也多:图注改放到截图右侧,截图可以更大
  const capSide = layout === 'desktop' && !p.showPoints && (count === 1 || count === 3 || count === 4);

  const renderItem = (item, size) => {
    const shot = shots[item.index];
    const stacked = item.kind === 'phone';
    return (
      <figure className={`cp-sg-item campus-rise${size.side ? ' is-side' : ''}`} style={{ width: size.side ? 'auto' : size.width, ...enterDelay(2 + item.index) }} key={item.index}>
        <DeviceFrame kind={frame === 'plain' ? 'plain' : item.kind} style={{ width: size.width, height: size.height }}>
          <MediaSlot id={`screenshot-grid-${item.index}`} fit="contain" radius={0} placeholder={item.kind === 'phone' ? '手机截图' : '界面截图'} />
        </DeviceFrame>
        <figcaption className={`cp-sg-cap${size.side ? ' is-side' : stacked ? ' is-stack' : ''}`}>
          <div className="campus-seal">{shot?.no}</div>
          <p className="cp-sg-cap-text">{shot?.text}</p>
        </figcaption>
      </figure>
    );
  };

  let stage;
  if (layout === 'feature' && count > 1) {
    stage = (
      <div className="cp-sg-stage is-feature">
        <div className="cp-sg-col" style={{ flex: '1.9 1 0' }}>
          <ShotRow items={all.slice(0, 1)} frame={frame} arrows={false} capH={capH} renderItem={renderItem} />
        </div>
        <div className="cp-sg-col" style={{ flex: '1 1 0' }}>
          {all.slice(1).map(item => (
            <ShotRow items={[item]} frame={frame} arrows={false} capH={capH} renderItem={renderItem} key={item.index} />
          ))}
        </div>
      </div>
    );
  } else if (layout === 'desktop' && count > 2) {
    const perRow = count <= 4 ? 2 : 3;
    const rows = [];
    for (let i = 0; i < count; i += perRow) rows.push(all.slice(i, i + perRow));
    stage = (
      <div className="cp-sg-stage">
        {rows.map((row, r) => <ShotRow items={row} frame={frame} arrows={arrows && !capSide} capH={capH} capSide={capSide} renderItem={renderItem} key={r} />)}
      </div>
    );
  } else {
    stage = (
      <div className="cp-sg-stage">
        <ShotRow items={all} frame={frame} arrows={arrows && !capSide} capH={capH} capSide={capSide} renderItem={renderItem} />
      </div>
    );
  }

  return (
    <CampusFrame chapterIndex={p.chapterIndex}>
      <TitleRow no={p.sectionNo} title={p.title} className="campus-rise" style={enterDelay(0)} />
      <div className="cp-sg">
        {stage}
        {p.showPoints && (
          <aside className="cp-sg-side">
            <LabelRow label={p.pointsLabel} className="campus-rise" style={enterDelay(2)} />
            <div className={`cp-sg-points is-${points.length}`}>
              {points.map((point, i) => (
                <div className="cp-sg-point campus-card campus-rise" style={enterDelay(3 + i)} key={i}>
                  <div className="campus-seal">{point?.no}</div>
                  <div>
                    <div className="cp-sg-point-title">{point?.title}</div>
                    <p className="cp-sg-point-desc">{point?.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </aside>
        )}
      </div>
      {p.showConclusion && <ConclusionBar label={p.conclusionLabel} text={p.conclusion} className="campus-rise" style={enterDelay(8)} />}
    </CampusFrame>
  );
}

ScreenshotGrid.META = {
  id: 'screenshot-grid',
  label: '界面截图网格 · 竖屏横屏配操作说明',
  roles: ['case', 'image', 'process'],
  defaults: DEFAULTS,
  copyBudgets: { 'shots[].no': 5, 'shots[].text': 18, pointsLabel: 6, 'points[].title': 10, 'points[].desc': 30, conclusion: 44 },
  controls: [
    { ...CHAPTER_CONTROL, default: 3 },
    { key: 'layout', type: 'radio', label: '排布', default: 'desktop', options: [{ value: 'phone', label: '竖屏横排' }, { value: 'desktop', label: '横屏网格' }, { value: 'feature', label: '一大两小' }, { value: 'mixed', label: '横竖混排' }], description: '竖屏横排:手机截图等高横排,最多 6 张;横屏网格:网页截图 1 张大图 / 2 张并排 / 3–4 张 2×2 / 5–6 张 3×2;一大两小:第 1 张大图在左,其余 1–2 张在右;横竖混排:第 1 张横屏,其余竖屏,最多 5 张。' },
    { key: 'shotCount', type: 'number', label: '截图数量', default: 4, min: 1, max: 6, countArrays: ['images'], description: '截图张数(编号与说明 shots 按同样的张数显示);超过当前排布的上限时只显示前几张。' },
    { key: 'frame', type: 'radio', label: '外框', default: 'device', options: [{ value: 'device', label: '设备外框' }, { value: 'plain', label: '白底相框' }], description: '设备外框:竖屏画成手机、横屏画成浏览器窗口;白底相框:统一的白色圆角框。' },
    { key: 'showArrows', type: 'toggle', label: '步骤箭头', default: false, description: '同一行截图之间画箭头,表示操作顺序(启动 → 输入 → 结果)。' },
    { key: 'showPoints', type: 'toggle', label: '右侧要点', default: false, description: '右侧的实现要点卡片(截图 + 3 条技术要点这类页面)。' },
    { key: 'pointCount', type: 'number', label: '要点条数', default: 3, min: 2, max: 4, description: '右侧实现要点的条数。' },
    { key: 'showConclusion', type: 'toggle', label: '底部结论条', default: true, description: '页面底部的校色结论条。' },
  ],
};
