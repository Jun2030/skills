// 大数字(特色页):正中一枚「图案填充」的巨型衬线数字(1–2 位),站在发光的圆台上;两侧各 2–3 条带圆形编号章的要点,
// 底部一条通栏口号条。
// 数字是图形:轮廓取自 kit 的 NUMERAL_GLYPHS,里面填校色天空、点缀金的太阳、几何点阵和校园建筑剪影,
// 外面有立体厚度、白色描边和高光;数值来自「大数字」控件,换数字不需要换图。
// 数字里也可以放一张照片(媒体槽被裁成数字的形状):没有上传时显示校园剪影图案。
// 要点、口号、数字下方的说明都是独立的 HTML 文本,导出后可编辑;数字与装饰导出为图片。
import React from 'react';
import { useThemeStyle, enterDelay } from '../../../shared/style.jsx';
import { MediaSlot } from '../../../shared/MediaSlot.jsx';
import { safeArray, safeRatio, clamp } from '../../../chart-safety.mjs';
import { CampusFrame, TitleRow, CHAPTER_CONTROL, TITLE_ROW_SPACE, useCampusLayout } from '../kit/chrome.jsx';
import { useFeatureAStyle, LinearGrad, RadialGrad, BlurFilter, ChevronRun, IconOrb, numeralLayout } from '../kit/feature-a.jsx';

const DEFAULTS = {
  chapterIndex: 3,
  numeral: 5,
  leftCount: 3,
  rightCount: 2,
  showSlogan: true,
  images: [],
  sectionNo: '3.1',
  title: '管理会计研究难点',
  numeralCaption: '大研究难点',
  leftItems: [
    { no: '01', title: '公益属性制约', desc: '最终目的是提高经济效益，具有公益性特征的部门在一定程度上制约了管理会计建设。' },
    { no: '02', title: '数据意识不足', desc: '管理者没有意识到共享经济下数据分析的重要性，难以有效应用管理会计工具。' },
    { no: '03', title: '缺乏独立规划', desc: '企业只把管理会计划归为财务会计的内容，没有对它进行独立规划。' },
  ],
  rightItems: [
    { no: '04', title: '认识过于简单', desc: '管理者对管理会计的认识过于简单，认为它与前方销售没有太大联系。' },
    { no: '05', title: '专业能力不足', desc: '从业人员的知识储备和专业能力不足，面对新要求力不从心。' },
    { no: '06', title: '示例要点', desc: '两侧各可放 2–3 条要点，这一条是补充位的示例文字。' },
  ],
  slogan: '破解落地难题，让管理会计真正服务企业决策',
};

// 数字内部的校园剪影,画在 1000×1000 的归一化坐标里(y 向下,底边 1000),再缩放到数字的外接框。
const FAR_BLOCKS = [
  [0, 610, 70, 390], [62, 540, 64, 460], [120, 600, 54, 400], [168, 500, 78, 500], [240, 575, 60, 425],
  [296, 470, 56, 530], [350, 560, 70, 440], [640, 520, 66, 480], [700, 590, 58, 410], [752, 455, 72, 545],
  [820, 560, 60, 440], [874, 500, 70, 500], [940, 590, 60, 410],
];
const WINDOWS = (() => {
  const list = [];
  for (let r = 0; r < 4; r += 1) for (let c = 0; c < 4; c += 1) list.push([186 + c * 46, 744 + r * 52, 22, 26]);
  for (let r = 0; r < 7; r += 1) for (let c = 0; c < 2; c += 1) list.push([896 + c * 44, 600 + r * 50, 24, 28]);
  return list;
})();

function CampusSkyline() {
  return (
    <g>
      {/* 远景楼群:浅一级的校色 */}
      <g style={{ fill: 'rgb(255 255 255 / .16)' }}>
        {FAR_BLOCKS.map(([x, y, w, h], i) => <rect key={i} x={x} y={y} width={w} height={h} />)}
      </g>
      {/* 近景:图书馆、钟楼主楼、穹顶楼、高楼与树 */}
      <g style={{ fill: 'var(--campus-accent-deep)' }} opacity=".92">
        <circle cx={48} cy={880} r={64} />
        <circle cx={118} cy={905} r={50} />
        <rect x={170} y={712} width={210} height={288} />
        <rect x={160} y={696} width={230} height={22} />
        <rect x={392} y={704} width={236} height={296} />
        <polygon points="380,706 510,620 640,706" />
        <rect x={474} y={440} width={72} height={190} />
        <polygon points="462,446 510,330 558,446" />
        <rect x={500} y={300} width={20} height={40} />
        <rect x={652} y={780} width={200} height={220} />
        <path d="M662 782 A90 90 0 0 1 842 782 Z" />
        <rect x={742} y={664} width={16} height={36} />
        <rect x={872} y={560} width={118} height={440} />
        <circle cx={612} cy={930} r={44} />
        <rect x={0} y={968} width={1000} height={32} />
      </g>
      {/* 窗格、柱廊、钟面:半透明白 */}
      <g style={{ fill: 'rgb(255 255 255 / .3)' }}>
        {WINDOWS.map(([x, y, w, h], i) => <rect key={i} x={x} y={y} width={w} height={h} rx={3} />)}
        {[0, 1, 2, 3, 4, 5].map(i => <rect key={i} x={414 + i * 36} y={736} width={12} height={232} rx={4} />)}
        <circle cx={510} cy={508} r={24} />
        {[0, 1, 2].map(i => <rect key={i} x={680 + i * 56} y={830} width={30} height={120} rx={14} />)}
      </g>
    </g>
  );
}

function NumeralArt({ layout, gx, gy, s, W, H, showFloor }) {
  const box = { x: gx, y: gy, w: (layout.x1 - layout.x0) * s, h: (layout.y1 - layout.y0) * s };
  const glyphTransform = `translate(${gx} ${gy}) scale(${s}) translate(${-layout.x0} ${-layout.y0})`;
  // clipPath 里只能放图形元素(不能套 <g>),所以把整组变换直接写在每个字形路径上。
  const paths = layout.glyphs.map((g, i) => <path key={i} d={g.d} transform={`${glyphTransform} translate(${g.dx} 0)`} />);
  const depth = 18;
  const rim = 12;
  const steps = 6;
  // 字形副本:不用 <use>(导出时 <use> 引用的路径会被内联成默认黑色),每份副本直接写出路径,颜色由外层 <g> 继承。
  const copy = (key, transform, style, extra = {}) => <g key={key} transform={transform} style={style} {...extra}>{paths}</g>;
  const art = `translate(${box.x} ${box.y}) scale(${box.w / 1000} ${box.h / 1000})`;
  const cx = box.x + box.w / 2;
  const floorY = box.y + box.h - 8;
  return (
    <svg className="cp-bn-svg" style={{ width: W, height: H }} viewBox={`0 0 ${W} ${H}`} aria-hidden="true">
      <defs>
        <clipPath id="cp-bn-clip" clipPathUnits="userSpaceOnUse">{paths}</clipPath>
        <LinearGrad id="cp-bn-sky" x1={0} y1={0} x2={0.25} y2={1} stops={[[0, 'var(--campus-accent-lo)'], [0.3, 'var(--theme-accent)'], [0.68, 'var(--campus-accent-hi)'], [1, 'var(--campus-accent-pale)']]} />
        <RadialGrad id="cp-bn-sun" stops={[[0, 'var(--campus-spark-hi)'], [0.45, 'var(--campus-spark)'], [0.62, 'var(--campus-spark-haze)'], [1, 'var(--campus-spark-fade)']]} />
        <RadialGrad id="cp-bn-halo" stops={[[0, 'rgb(var(--theme-accent-rgb) / .2)'], [0.55, 'rgb(var(--theme-accent-rgb) / .07)'], [1, 'rgb(var(--theme-accent-rgb) / 0)']]} />
        <LinearGrad id="cp-bn-gloss" x1={0} y1={0} x2={1} y2={1} stops={[[0, 'rgb(255 255 255 / .38)'], [0.5, 'rgb(255 255 255 / .06)'], [0.5001, 'rgb(255 255 255 / 0)'], [1, 'rgb(255 255 255 / 0)']]} />
        <LinearGrad id="cp-bn-podium" x1={0} y1={0} x2={0} y2={1} stops={[[0, 'rgb(255 255 255 / .98)'], [1, 'var(--campus-accent-mist)']]} />
        <LinearGrad id="cp-bn-podium-side" x1={0} y1={0} x2={1} y2={0} stops={[[0, 'var(--campus-accent-lo)'], [0.5, 'var(--theme-accent)'], [1, 'var(--campus-accent-hi)']]} />
        <pattern id="cp-bn-dots" width={26} height={26} patternUnits="userSpaceOnUse">
          <circle cx={4} cy={4} r={2.4} style={{ fill: 'rgb(255 255 255 / .22)' }} />
        </pattern>
        <BlurFilter id="cp-bn-blur" std={18} />
      </defs>
      {/* 背光晕与圆台 */}
      <ellipse cx={cx} cy={box.y + box.h * 0.48} rx={box.w * 0.95 + 120} ry={box.h * 0.62} style={{ fill: 'url(#cp-bn-halo)' }} />
      {showFloor && (
        <g>
          <ellipse cx={cx} cy={floorY + 26} rx={box.w * 0.62 + 120} ry={46} style={{ fill: 'rgb(var(--theme-accent-rgb) / .16)' }} filter="url(#cp-bn-blur)" />
          <ellipse cx={cx} cy={floorY + 18} rx={box.w * 0.55 + 96} ry={40} style={{ fill: 'url(#cp-bn-podium-side)' }} />
          <ellipse cx={cx} cy={floorY + 6} rx={box.w * 0.55 + 96} ry={40} style={{ fill: 'url(#cp-bn-podium)', stroke: 'rgb(255 255 255 / .95)' }} strokeWidth="2" />
          <ellipse cx={cx} cy={floorY + 6} rx={box.w * 0.42 + 70} ry={28} fill="none" style={{ stroke: 'rgb(var(--theme-accent-rgb) / .28)' }} strokeWidth="2" strokeDasharray="4 8" />
        </g>
      )}
      {/* 落地投影与立体厚度:同一字形逐层向右下错开 */}
      {copy('shadow', 'translate(22 30)', { fill: 'rgb(var(--theme-accent-rgb) / .3)' }, { filter: 'url(#cp-bn-blur)' })}
      {Array.from({ length: steps }, (_, i) => {
        const t = (steps - i) / steps;
        return copy(i, `translate(${depth * t * 0.7} ${depth * t})`, { fill: i === 0 ? 'var(--campus-accent-deep)' : 'var(--campus-accent-lo)' });
      })}
      {/* 白色描边:画在字面之下,只露出外半圈(字形的内部重叠轮廓不会被描出来) */}
      {copy('rim', undefined, { fill: 'rgb(255 255 255 / .95)', stroke: 'rgb(255 255 255 / .95)', strokeWidth: safeRatio(rim, s, 30), strokeLinejoin: 'round' })}
      {/* 字面:校色天空 + 太阳 + 点阵 + 光束 + 校园剪影 */}
      <g clipPath="url(#cp-bn-clip)">
        <rect x={box.x - 10} y={box.y - 10} width={box.w + 20} height={box.h + 20} style={{ fill: 'url(#cp-bn-sky)' }} />
        <rect x={box.x - 10} y={box.y - 10} width={box.w + 20} height={box.h * 0.62} style={{ fill: 'url(#cp-bn-dots)' }} />
        <circle cx={box.x + box.w * 0.7} cy={box.y + box.h * 0.3} r={box.h * 0.2} style={{ fill: 'url(#cp-bn-sun)' }} />
        <g transform={art}>
          <polygon points="80,0 220,0 -60,1000 -200,1000" style={{ fill: 'rgb(255 255 255 / .1)' }} />
          <polygon points="330,0 400,0 120,1000 50,1000" style={{ fill: 'rgb(255 255 255 / .07)' }} />
          <CampusSkyline />
        </g>
        <rect x={box.x - 10} y={box.y - 10} width={box.w + 20} height={box.h + 20} style={{ fill: 'url(#cp-bn-gloss)' }} />
      </g>
    </svg>
  );
}

/** 叠在数字(和照片)之上的点缀金星点。 */
function NumeralRim({ layout, gx, gy, s, W, H }) {
  const bw = (layout.x1 - layout.x0) * s;
  const bh = (layout.y1 - layout.y0) * s;
  const star = (x, y, r, key) => (
    <path key={key} d={`M${x} ${y - r} Q${x + r * 0.16} ${y - r * 0.16} ${x + r} ${y} Q${x + r * 0.16} ${y + r * 0.16} ${x} ${y + r} Q${x - r * 0.16} ${y + r * 0.16} ${x - r} ${y} Q${x - r * 0.16} ${y - r * 0.16} ${x} ${y - r} Z`} style={{ fill: 'var(--campus-spark)' }} />
  );
  return (
    <svg className="cp-bn-svg" style={{ width: W, height: H }} viewBox={`0 0 ${W} ${H}`} aria-hidden="true">
      {star(gx - 26, gy + bh * 0.12, 22, 'a')}
      {star(gx + bw + 34, gy + bh * 0.22, 16, 'b')}
      {star(gx + bw + 12, gy + bh * 0.04, 9, 'c')}
      {star(gx - 44, gy + bh * 0.32, 8, 'd')}
    </svg>
  );
}

function ItemCard({ item, side, delay, shift }) {
  return (
    <div className={`cp-bn-item campus-fa-glass is-${side} campus-rise`} style={{ translate: `${shift}px 0`, ...enterDelay(delay) }}>
      <IconOrb size={86} gold={side === 'right'} className="cp-bn-orb"><div className="cp-bn-no">{item?.no}</div></IconOrb>
      <div className="cp-bn-text">
        <h3 className="cp-bn-title">{item?.title}</h3>
        <p className="cp-bn-desc">{item?.desc}</p>
      </div>
    </div>
  );
}

const CSS = `
.cp-bn{position:relative;flex:1;min-height:0;}
.cp-bn-svg{position:absolute;left:0;top:0;overflow:visible;}
.cp-bn-layer{position:absolute;left:0;top:0;pointer-events:none;}
.cp-bn-photo{position:absolute;left:0;top:0;clip-path:url(#cp-bn-clip);background:rgb(255 255 255 / .01);}
.cp-bn-photo .media-slot{position:absolute;inset:0;width:100%;height:100%;}
.cp-bn-photo .media-slot:not(.is-filled){background:transparent!important;box-shadow:none!important;}
.cp-bn-photo .media-slot:not(.is-filled) > *{opacity:0;transition:opacity .2s;}
.cp-bn-photo:hover .media-slot:not(.is-filled) > *{opacity:1;}
.cp-bn-photo .media-slot:not(.is-filled) .media-slot-label{color:var(--theme-on-accent);}
.cp-bn-tint{position:absolute;inset:0;pointer-events:none;background:linear-gradient(180deg,rgb(var(--theme-accent-rgb) / 0) 45%,rgb(var(--theme-accent-rgb) / .45) 100%);}
.cp-bn-photo:not(:has(.media-slot.is-filled)) .cp-bn-tint{display:none;}
.cp-bn-caption{position:absolute;transform:translate(-50%,0);display:flex;align-items:center;gap:12px;height:54px;padding:0 30px;border-radius:999px;background:var(--campus-fill);color:var(--theme-on-accent);box-shadow:0 12px 26px rgb(var(--theme-accent-rgb) / .34);white-space:nowrap;}
.cp-bn-caption-text{font-family:var(--theme-font-serif);font-weight:700;font-size:28px;line-height:1;letter-spacing:.14em;}
.cp-bn-caption-mark{flex:none;width:9px;height:9px;border-radius:2px;background:var(--campus-spark);transform:rotate(45deg);}
.cp-bn-col{position:absolute;top:0;bottom:0;display:flex;flex-direction:column;justify-content:center;gap:var(--cp-bn-gap,26px);}
.cp-bn-item{display:flex;align-items:center;gap:24px;padding:24px 30px 24px 24px;border-radius:64px 28px 28px 64px;}
.cp-bn-item.is-right{flex-direction:row-reverse;padding:24px 24px 24px 30px;border-radius:28px 64px 64px 28px;text-align:right;}
.cp-bn-no{font-family:var(--theme-font-serif);font-weight:700;font-size:30px;line-height:1;font-variant-numeric:lining-nums;}
.cp-bn-text{flex:1;min-width:0;}
.cp-bn-title{font-family:var(--theme-font-serif);font-weight:700;font-size:30px;line-height:1.25;letter-spacing:.04em;color:var(--theme-accent);}
.cp-bn-item.is-right .cp-bn-title{color:var(--campus-spark-lo);}
.cp-bn-desc{margin-top:8px;font-size:21px;line-height:1.55;color:var(--theme-muted);text-wrap:pretty;}
.cp-bn.is-tight .cp-bn-item{padding-top:18px;padding-bottom:18px;}
.cp-bn.is-tight .cp-bn-title{font-size:28px;}

/* 底部口号条:渐变色板压在一块更浅的底板上(立体厚度),两端人字箭头 */
.cp-bn-slogan{position:relative;flex:none;height:82px;margin-top:22px;display:flex;align-items:center;justify-content:center;gap:34px;color:var(--theme-on-accent);}
.cp-bn-slogan-base{position:absolute;left:10px;right:10px;top:12px;bottom:-10px;border-radius:20px;background:var(--campus-accent-pale);box-shadow:0 16px 30px rgb(var(--theme-accent-rgb) / .18);}
.cp-bn-slogan-face{position:absolute;inset:0;border-radius:18px;background:var(--campus-fill-deep);}
.cp-bn-slogan-shine{position:absolute;left:18px;right:18px;top:6px;height:2px;border-radius:1px;background:linear-gradient(90deg,rgb(255 255 255 / 0),rgb(255 255 255 / .55),rgb(255 255 255 / 0));}
.cp-bn-slogan-text{position:relative;font-family:var(--theme-font-serif);font-weight:700;font-size:31px;line-height:1.2;letter-spacing:.12em;text-align:center;}
.cp-bn-slogan svg{position:relative;flex:none;color:rgb(255 255 255 / .9);}
`;

export function BigNumeral(props) {
  useThemeStyle('campus-big-numeral-style', CSS);
  useFeatureAStyle();
  const p = { ...DEFAULTS, ...props };
  const { bodyW, bodyH, nav } = useCampusLayout();
  const left = safeArray(p.leftItems).slice(0, clamp(p.leftCount, 2, 3));
  const right = safeArray(p.rightItems).slice(0, clamp(p.rightCount, 2, 3));
  const layout = numeralLayout(p.numeral, { min: 0, max: 99 });
  const W = bodyW;
  const H = bodyH - TITLE_ROW_SPACE - (p.showSlogan ? 104 : 0);
  // 中间数字区:正文区宽度的 36%(两位数时放宽到 44%),两侧是要点列。
  const two = layout.glyphs.length > 1;
  const zone = Math.round(W * (two ? 0.46 : 0.38));
  const colW = Math.round((W - zone) / 2 - 12);
  const captionSpace = 74;
  const maxW = zone - 50;
  const maxH = H - captionSpace - 14;
  const wu = layout.x1 - layout.x0;
  const hu = layout.y1 - layout.y0;
  const s = Math.min(safeRatio(maxW, wu, 0.3), safeRatio(maxH, hu, 0.3));
  const gw = wu * s;
  const gh = hu * s;
  const gx = (W - gw) / 2;
  const gy = Math.max(10, (H - captionSpace - gh) / 2 + 6);
  const tight = Math.max(left.length, right.length) >= 3 || nav === 'rail';
  // 三条要点时中间一条向外让出一点,整列沿数字外缘排成弧形。
  const shiftFor = (count, i, dir) => (count === 3 && i === 1 ? dir * 34 : 0);
  return (
    <CampusFrame chapterIndex={p.chapterIndex}>
      <TitleRow no={p.sectionNo} title={p.title} className="campus-rise" style={enterDelay(0)} />
      <div className={`cp-bn${tight ? ' is-tight' : ''}`} style={{ '--cp-bn-gap': `${left.length >= 3 || right.length >= 3 ? 22 : 40}px` }}>
        {/* 图形层的外层要有实际尺寸:导出引擎跳过 0×0 的容器及其子元素 */}
        <div className="cp-bn-layer campus-fade" style={{ width: W, height: H, ...enterDelay(1) }}>
          <NumeralArt layout={layout} gx={gx} gy={gy} s={s} W={W} H={H} showFloor />
        </div>
        <div className="cp-bn-photo campus-fade" style={{ width: W, height: H, ...enterDelay(2) }}>
          <MediaSlot id="big-numeral-photo" fit="cover" radius={0} placeholder="数字内照片" />
          <div className="cp-bn-tint" aria-hidden="true" />
        </div>
        <div className="cp-bn-layer campus-fade" style={{ width: W, height: H, ...enterDelay(2) }}>
          <NumeralRim layout={layout} gx={gx} gy={gy} s={s} W={W} H={H} />
        </div>
        <div className="cp-bn-caption campus-rise" style={{ left: W / 2, top: gy + gh + 4, ...enterDelay(3) }}>
          <div className="cp-bn-caption-mark" aria-hidden="true" />
          <div className="cp-bn-caption-text">{p.numeralCaption}</div>
          <div className="cp-bn-caption-mark" aria-hidden="true" />
        </div>
        <div className="cp-bn-col" style={{ left: 0, width: colW }}>
          {left.map((item, i) => <ItemCard key={i} item={item} side="left" delay={3 + i} shift={shiftFor(left.length, i, -1)} />)}
        </div>
        <div className="cp-bn-col" style={{ right: 0, width: colW }}>
          {right.map((item, i) => <ItemCard key={i} item={item} side="right" delay={4 + i} shift={shiftFor(right.length, i, 1)} />)}
        </div>
      </div>
      {p.showSlogan && (
        <div className="cp-bn-slogan campus-rise" style={enterDelay(8)}>
          <div className="cp-bn-slogan-base" aria-hidden="true" />
          <div className="cp-bn-slogan-face" aria-hidden="true" />
          <div className="cp-bn-slogan-shine" aria-hidden="true" />
          <ChevronRun direction="left" size={28} />
          <p className="cp-bn-slogan-text">{p.slogan}</p>
          <ChevronRun direction="right" size={28} />
        </div>
      )}
    </CampusFrame>
  );
}

BigNumeral.META = {
  id: 'big-numeral',
  label: '特色 · 图案填充大数字配两侧要点',
  roles: ['statement', 'breakdown', 'observation'],
  defaults: DEFAULTS,
  copyBudgets: { numeralCaption: 7, slogan: 26, 'leftItems[].title': 7, 'leftItems[].desc': 38, 'rightItems[].title': 7, 'rightItems[].desc': 38 },
  controls: [
    { ...CHAPTER_CONTROL, default: 3 },
    { key: 'numeral', type: 'number', label: '大数字', default: 5, min: 0, max: 99, description: '正中的大数字(0–99),通常等于要点总数;数字是图形,改这里即可。' },
    { key: 'leftCount', type: 'number', label: '左侧要点数', default: 3, min: 2, max: 3, description: '数字左侧的要点条数。' },
    { key: 'rightCount', type: 'number', label: '右侧要点数', default: 2, min: 2, max: 3, description: '数字右侧的要点条数。' },
    { key: 'showSlogan', type: 'toggle', label: '底部口号条', default: true, description: '页面底部的通栏口号条。' },
  ],
};
