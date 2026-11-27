// 等距立体积木:左侧 3–6 块等距视角(isometric)的立体方块排成一座「后高前低」的阶梯台——最里面一块最高(核心),
// 往前一圈圈降低,所有顶面都露在外面;三排按深 / 中 / 浅三档上色(最里排深校色、中排校色、前排浅校色玻璃),
// 每块顶面写编号与短名,其中一块用暖金强调;竖向有富余(rail 导航、积木少)时积木按可用高度拔高;
// 积木立在一块白色玻璃底板上。右侧是导语 + 与积木编号对应的说明卡。适合系统组成、知识结构、能力模块。
// 方块、底板都是不含文字的 SVG 图形;编号、短名、说明都是叠在上面的水平 HTML 文本。
import React from 'react';
import { useThemeStyle, enterDelay } from '../../../shared/style.jsx';
import { safeArray, safeRatio, safeMin, safeMax, clamp } from '../../../chart-safety.mjs';
import { CampusFrame, TitleRow, CHAPTER_CONTROL, TITLE_ROW_SPACE, useCampusLayout } from '../kit/chrome.jsx';
import { useSvgId, ToneDefs, Stop, r2 } from '../kit/feature-b.jsx';
import { useFeatureDStyle, MetalDefs, StageHalo, G6Point, isoBox, polyPath, pad2 } from '../kit/feature-d.jsx';

const DEFAULTS = {
  chapterIndex: 2,
  blockCount: 6,
  highlightIndex: 1,
  sectionNo: '2.3',
  title: '系统组成：六个模块搭起在线测试平台',
  lead: '以 Spring Boot 后端为核心，数据存储、负载均衡、容器化、持续集成与前台页面逐层配合。',
  blocks: [
    { name: '后端框架', title: 'Spring Boot 后端', desc: '整合 Spring、SpringMVC 与 MyBatis，承载全部业务接口。' },
    { name: '数据存储', title: 'MySQL + MongoDB', desc: 'MySQL 存用户与试题，MongoDB 存详细试卷。' },
    { name: '负载均衡', title: 'Nginx 请求分发', desc: '把请求分发到 3 个 Tomcat 容器，提升并发能力。' },
    { name: '容器化', title: 'Docker 容器', desc: '各组件运行在独立容器中，交付部署更快。' },
    { name: '持续集成', title: 'Jenkins 自动发布', desc: '打包、发布测试、监控与邮件告警自动完成。' },
    { name: '前台页面', title: '学生端前台', desc: '在线测试、我的试卷、排行榜与个人数据分析。' },
  ],
};

// 积木在地面网格上的位置(gx 向右下、gy 向左下),按编号顺序(由里到外、每排从左到右);层级 = gx + gy,越往前越矮。
const CELLS = {
  3: [[0, 0], [0, 1], [1, 0]],
  4: [[0, 0], [0, 1], [1, 0], [1, 1]],
  5: [[0, 0], [0, 1], [1, 0], [0, 2], [2, 0]],
  6: [[0, 0], [0, 1], [1, 0], [0, 2], [1, 1], [2, 0]],
};
const HEIGHTS = [1.3, 0.92, 0.58];
const GAP = 1.13;
// 三排三档:最里排深校色、中排校色、前排浅色玻璃(半透明浅校色 + 校色描边),一眼能分出前后。
const TONES = ['deep', 'accent', 'glass'];

const CSS = `
.cp-g6-ib{flex:1;min-height:0;display:flex;gap:36px;}
.cp-g6-ib-fig{position:relative;flex:none;height:100%;}
.cp-g6-ib-label{position:absolute;transform:translate(-50%,-50%);display:flex;flex-direction:column;align-items:center;gap:2px;text-align:center;}
.cp-g6-ib-no{font-family:var(--theme-font-serif);font-weight:700;font-size:34px;line-height:1;color:var(--theme-on-accent);font-variant-numeric:lining-nums;letter-spacing:.02em;}
.cp-g6-ib-name{font-weight:700;font-size:22px;line-height:1.25;letter-spacing:.06em;color:var(--theme-on-accent);white-space:nowrap;}
.cp-g6-ib-label.is-gold .cp-g6-ib-no,.cp-g6-ib-label.is-gold .cp-g6-ib-name{color:var(--campus-gold-deep);}
.cp-g6-ib-label.is-glass .cp-g6-ib-no{color:var(--theme-accent);}
.cp-g6-ib-label.is-glass .cp-g6-ib-name{color:var(--campus-accent-deep);}
.cp-g6-ib-side{flex:1;min-width:0;display:flex;flex-direction:column;justify-content:center;gap:22px;padding:4px 0 10px;}
.cp-g6-ib-lead{position:relative;padding:2px 0 2px 26px;font-size:23px;line-height:1.6;color:var(--theme-ink);text-wrap:pretty;}
.cp-g6-ib-lead::before{content:'';position:absolute;left:0;top:6px;bottom:6px;width:6px;border-radius:3px;background:var(--campus-fill-bar);}
.cp-g6-ib-list{display:grid;gap:14px;}
.cp-g6-ib-card{padding:16px 24px 16px 16px;}
.cp-g6-ib-side.is-dense .cp-g6-ib-list{gap:10px;}
.cp-g6-ib-side.is-dense .cp-g6-ib-card{padding:10px 22px 10px 14px;}
.cp-g6-ib-side.is-dense .cp-g6-point-text{gap:2px;padding-top:4px;}
.cp-g6-ib-side.is-dense .cp-g6-point-title{font-size:23px;}
.cp-g6-ib-side.is-dense .cp-g6-point-desc{line-height:1.45;}
.cp-g6-ib-side.is-few .cp-g6-ib-card{padding:24px 26px 24px 18px;}
`;

/** 一块等距方块(SVG 片段):右侧面最暗、左侧面次之、顶面最亮(光从左上来)。 */
function Block({ id, box, tone }) {
  const t = tone;
  if (t === 'glass') {
    const edge = { fill: 'none', stroke: 'var(--theme-accent)', strokeOpacity: 0.5, strokeWidth: 1.6, strokeLinejoin: 'round' };
    return (
      <g>
        <path d={polyPath(box.right)} fill={`url(#${id}-glass-side)`} fillOpacity=".92" />
        <path d={polyPath(box.right)} fill="var(--theme-accent)" fillOpacity=".12" />
        <path d={polyPath(box.left)} fill={`url(#${id}-glass-side)`} fillOpacity=".72" />
        <path d={polyPath(box.left)} fill="var(--theme-surface)" fillOpacity=".3" />
        <path d={polyPath(box.left)} fill={`url(#${id}-gloss)`} />
        <path d={polyPath(box.top)} fill={`url(#${id}-glass-face)`} fillOpacity=".94" />
        <path d={polyPath(box.top)} fill={`url(#${id}-gloss)`} />
        <path d={polyPath(box.right)} {...edge} />
        <path d={polyPath(box.left)} {...edge} />
        <path d={polyPath(box.top)} {...edge} strokeOpacity=".62" />
        {/* 玻璃高光:顶面内圈白线 + 左面一道斜向反光条 */}
        <path d={polyPath(box.top.map(q => ({ x: box.center.x + (q.x - box.center.x) * 0.86, y: box.center.y + (q.y - box.center.y) * 0.86 })))} fill="none" stroke="var(--theme-surface)" strokeOpacity=".95" strokeWidth="2" strokeLinejoin="round" />
        <line x1={box.top[2].x} y1={r2(box.top[2].y + 1)} x2={box.left[2].x} y2={r2(box.left[2].y - 1)} stroke="var(--theme-surface)" strokeOpacity=".95" strokeWidth="2.5" />
        <path d={polyPath([
          { x: box.left[0].x + (box.left[1].x - box.left[0].x) * 0.18, y: box.left[0].y + (box.left[1].y - box.left[0].y) * 0.18 + 6 },
          { x: box.left[0].x + (box.left[1].x - box.left[0].x) * 0.34, y: box.left[0].y + (box.left[1].y - box.left[0].y) * 0.34 + 6 },
          { x: box.left[3].x + (box.left[2].x - box.left[3].x) * 0.1, y: box.left[3].y + (box.left[2].y - box.left[3].y) * 0.1 - 6 },
          { x: box.left[3].x + (box.left[2].x - box.left[3].x) * -0.04, y: box.left[3].y + (box.left[2].y - box.left[3].y) * -0.04 - 6 },
        ])} fill="var(--theme-surface)" fillOpacity=".38" />
      </g>
    );
  }
  return (
    <g>
      <path d={polyPath(box.right)} fill={`url(#${id}-${t}-side)`} />
      <path d={polyPath(box.right)} fill="var(--theme-ink)" fillOpacity=".16" />
      <path d={polyPath(box.left)} fill={`url(#${id}-${t}-side)`} />
      <path d={polyPath(box.left)} fill="var(--theme-surface)" fillOpacity=".16" />
      <path d={polyPath(box.left)} fill={`url(#${id}-gloss)`} opacity=".7" />
      <path d={polyPath(box.top)} fill={`url(#${id}-${t}-face)`} />
      <path d={polyPath(box.top)} fill="var(--theme-surface)" fillOpacity={t === 'deep' ? 0.04 : 0.2} />
      <path d={polyPath(box.top)} fill={`url(#${id}-gloss)`} opacity={t === 'deep' ? 0.55 : 1} />
      {/* 高光棱线:顶面四边 + 正前方竖棱 */}
      <path d={polyPath(box.top)} fill="none" stroke="var(--theme-surface)" strokeOpacity=".75" strokeWidth="2" strokeLinejoin="round" />
      <line x1={box.top[2].x} y1={box.top[2].y} x2={box.left[2].x} y2={box.left[2].y} stroke="var(--theme-surface)" strokeOpacity=".55" strokeWidth="2" />
      <line x1={box.top[3].x} y1={r2(box.top[3].y + 2)} x2={box.left[3].x} y2={r2(box.left[3].y - 2)} stroke="var(--theme-surface)" strokeOpacity=".35" strokeWidth="1.5" />
    </g>
  );
}

export function IsoBlocks(props) {
  useThemeStyle('campus-iso-blocks-style', CSS);
  useFeatureDStyle();
  const p = { ...DEFAULTS, ...props };
  const id = useSvgId('cp-g6-ib');
  const { bodyW, bodyH, fill } = useCampusLayout();
  const solid = fill === 'solid';
  const blocks = safeArray(p.blocks).slice(0, clamp(Math.round(p.blockCount) || 6, 3, 6));
  const n = clamp(blocks.length, 3, 6);
  const hi = clamp(Math.round(p.highlightIndex) || 1, 1, n) - 1;
  const H = bodyH - TITLE_ROW_SPACE;
  // 正文区偏高(rail 导航:1580×960)时积木组受宽度限制,左栏多分一些宽度,让积木按可用高度放大。
  const FW = Math.round(bodyW * (H / bodyW > 0.5 ? 0.58 : 0.5));
  const C = 0.8660254;

  // 1) 以边长 1 摆出各方块(顶面最上角的屏幕坐标)与底板;hk 是高度系数。
  const layout = hk => {
    const unit = CELLS[n].map(([gx, gy], i) => {
      const level = gx + gy;
      const h = HEIGHTS[level] * hk;
      const ux = (gx - gy) * C * GAP;
      const uy = (gx + gy) * 0.5 * GAP;
      return { i, gx, gy, level, h, x: ux, y: uy - h };
    });
    // 圆形玻璃台:地面上包住所有积木的一个圆(等距投影后是扁椭圆)。
    const ground = unit.flatMap(b => {
      const gx = b.gx * GAP;
      const gy = b.gy * GAP;
      return [[gx, gy], [gx + 1, gy], [gx, gy + 1], [gx + 1, gy + 1]].map(([u, v]) => ({ x: (u - v) * C, y: (u + v) * 0.5 }));
    });
    const gcx = (safeMin(ground.map(q => q.x), 0) + safeMax(ground.map(q => q.x), 0)) / 2;
    const gcy = (safeMin(ground.map(q => q.y), 0) + safeMax(ground.map(q => q.y), 0)) / 2;
    const disc = { x: gcx, y: gcy + 0.08, rx: (safeMax(ground.map(q => q.x), 1) - safeMin(ground.map(q => q.x), 0)) / 2 + 0.32, t: 0.2 };
    disc.ry = disc.rx * 0.5;
    const ext = [
      ...unit.flatMap(b => [{ x: b.x - C, y: b.y }, { x: b.x + C, y: b.y + b.h + 1 }]),
      { x: disc.x - disc.rx, y: disc.y }, { x: disc.x + disc.rx, y: disc.y + disc.ry + disc.t },
    ];
    const x0 = safeMin(ext.map(q => q.x), 0);
    const x1 = safeMax(ext.map(q => q.x), 1);
    const y0 = safeMin(ext.map(q => q.y), 0);
    const y1 = safeMax(ext.map(q => q.y), 1);
    const sw = Math.min(safeRatio(FW - 30, x1 - x0, 100), 190);
    const sh = safeRatio(H - 120, y1 - y0, 100);
    return { unit, disc, x0, x1, y0, y1, sw, sh };
  };
  // 积木组通常受宽度限制;竖向有富余时(rail 导航、积木少时)把积木拔高,让整组用满可用高度(最多拔高 40%)。
  let L = layout(1);
  for (let hk = 1.4; hk > 1; hk -= 0.05) {
    const t = layout(hk);
    if (t.sh >= t.sw) { L = t; break; }
  }
  const { unit, disc, x0, x1, y0, y1 } = L;
  // 2) 等比放大到左栏(底部留出光环),居中。
  const s = Math.min(L.sw, safeRatio(H - 70, y1 - y0, 100));
  const ox = (FW - (x1 - x0) * s) / 2 - x0 * s;
  const oy = (H - 40 - (y1 - y0) * s) / 2 - y0 * s + 16;
  const placed = unit.map(b => {
    const box = isoBox(ox + b.x * s, oy + b.y * s, s, s, b.h * s);
    const tone = b.i === hi ? 'gold' : TONES[b.level] || 'accent';
    return { ...b, box, tone };
  });
  // 绘制顺序:先画后排(层级小)的高方块,再画前排。
  const order = [...placed].sort((a, b) => a.level - b.level || a.gx - b.gx);
  const D = { x: r2(ox + disc.x * s), y: r2(oy + disc.y * s), rx: r2(disc.rx * s), ry: r2(disc.ry * s), t: r2(disc.t * s) };
  const discSide = `M ${r2(D.x - D.rx)} ${D.y} L ${r2(D.x - D.rx)} ${r2(D.y + D.t)} A ${D.rx} ${D.ry} 0 0 0 ${r2(D.x + D.rx)} ${r2(D.y + D.t)} L ${r2(D.x + D.rx)} ${D.y} Z`;
  const dense = n >= 5;
  const topY = safeMin(placed.map(b => b.box.top[0].y), H * 0.3);
  const fs0 = clamp(s * 0.26, 26, 46);
  const floaters = [
    { x: FW * 0.1, y: Math.max(fs0 * 1.2, topY - 10), s: fs0, tone: 'accent', o: 0.9 },
    { x: FW * 0.88, y: Math.max(fs0, topY + s * 0.35), s: fs0 * 0.8, tone: 'gold', o: 0.95 },
    { x: FW * 0.78, y: Math.max(fs0 * 0.6, topY - s * 0.35), s: fs0 * 0.5, tone: 'glass', o: 0.95 },
  ];

  return (
    <CampusFrame chapterIndex={p.chapterIndex}>
      <TitleRow no={p.sectionNo} title={p.title} className="campus-rise" style={enterDelay(0)} />
      <div className="cp-g6-ib">
        <div className="cp-g6-ib-fig" style={{ width: FW }}>
          <svg className="cp-g6-svg campus-fade" style={{ left: 0, top: 0, width: FW, height: H, ...enterDelay(1) }} viewBox={`0 0 ${FW} ${H}`} aria-hidden="true">
            <ToneDefs id={id} tones={['accent', 'gold']} />
            <defs>
              {/* 深档(最里排):压暗一档的校色 */}
              <linearGradient id={`${id}-deep-face`} x1="0" y1="0" x2="1" y2="1">
                <Stop offset="0" color={solid ? 'var(--campus-accent-lo)' : 'var(--campus-accent-deep)'} />
                <Stop offset=".55" color="var(--campus-accent-lo)" />
                <Stop offset="1" color={solid ? 'var(--campus-accent-lo)' : 'var(--theme-accent)'} />
              </linearGradient>
              <linearGradient id={`${id}-deep-side`} x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" color="var(--campus-accent-lo)" />
                <Stop offset="1" color="var(--campus-accent-deep)" />
              </linearGradient>
              {/* 浅档(前排):浅校色玻璃 */}
              <linearGradient id={`${id}-glass-face`} x1="0" y1="0" x2="1" y2="1">
                <Stop offset="0" color="var(--theme-surface)" />
                <Stop offset=".5" color="var(--campus-fb-accent-pale)" />
                <Stop offset="1" color={solid ? 'var(--campus-fb-accent-pale)' : 'var(--campus-fb-accent-mist)'} />
              </linearGradient>
              <linearGradient id={`${id}-glass-side`} x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" color="var(--campus-fb-accent-pale)" />
                <Stop offset="1" color="var(--campus-fb-accent-mist)" />
              </linearGradient>
            </defs>
            <MetalDefs id={id} />
            <circle cx={r2(FW / 2)} cy={r2(H * 0.46)} r={r2(Math.min(FW, H) * 0.52)} fill={`url(#${id}-halo)`} />
            <StageHalo id={id} cx={D.x} cy={r2(D.y + D.t + 6)} rx={r2(D.rx * 1.06)} ry={r2(D.ry * 1.06)} glow={false} />
            {/* 圆形玻璃台:侧壁(校色金属)+ 白色玻璃台面 + 内圈虚线 */}
            <path d={discSide} fill={`url(#${id}-metal-accent)`} />
            <path d={discSide} fill="var(--theme-surface)" fillOpacity=".35" />
            <ellipse cx={D.x} cy={D.y} rx={D.rx} ry={D.ry} fill="var(--theme-surface)" fillOpacity=".92" />
            <ellipse cx={D.x} cy={D.y} rx={D.rx} ry={D.ry} fill={`url(#${id}-halo)`} />
            <ellipse cx={D.x} cy={D.y} rx={r2(D.rx - 4)} ry={r2(D.ry - 2)} fill="none" stroke="var(--theme-surface)" strokeWidth="3" />
            <ellipse cx={D.x} cy={D.y} rx={r2(D.rx * 0.9)} ry={r2(D.ry * 0.9)} fill="none" stroke="var(--theme-accent)" strokeOpacity=".22" strokeWidth="1.5" strokeDasharray="3 8" strokeLinecap="round" />
            {order.map(b => <Block key={b.i} id={id} box={b.box} tone={b.tone} />)}
            {/* 悬浮的小积木点缀:左上一块校色、右上一大一小(暖金 / 浅校色) */}
            {floaters.map((f, k) => (
              <g key={`f${k}`} opacity={f.o}>
                <ellipse cx={r2(f.x)} cy={r2(f.y + f.s * 2.1)} rx={r2(f.s * 0.8)} ry={r2(f.s * 0.2)} fill="var(--theme-accent)" fillOpacity=".12" />
                <Block id={id} box={isoBox(f.x, f.y - f.s * 0.5, f.s, f.s, f.s)} tone={f.tone} />
              </g>
            ))}
          </svg>
          {placed.map(b => (
            <div className={`cp-g6-ib-label campus-fade is-${b.tone}`} style={{ left: b.box.center.x, top: b.box.center.y, ...enterDelay(3 + b.i) }} key={b.i}>
              <div className="cp-g6-ib-no">{pad2(b.i + 1)}</div>
              <div className="cp-g6-ib-name">{blocks[b.i]?.name}</div>
            </div>
          ))}
        </div>
        <div className={`cp-g6-ib-side${dense ? ' is-dense' : ''}${n <= 3 ? ' is-few' : ''}`}>
          <p className="cp-g6-ib-lead campus-rise" style={enterDelay(2)}>{p.lead}</p>
          <div className="cp-g6-ib-list">
            {blocks.map((b, i) => (
              <div className={`cp-g6-ib-card cp-g6-glass${i === hi ? ' is-gold' : ''} campus-rise`} style={enterDelay(3 + i)} key={i}>
                <G6Point no={pad2(i + 1)} title={b?.title} desc={b?.desc} tone={i === hi ? 'gold' : 'accent'} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </CampusFrame>
  );
}

IsoBlocks.META = {
  id: 'iso-blocks',
  label: '特色 · 等距立体积木',
  roles: ['relationship', 'breakdown', 'context'],
  defaults: DEFAULTS,
  copyBudgets: { title: 28, lead: 46, 'blocks[].name': 4, 'blocks[].title': 14, 'blocks[].desc': 30 },
  controls: [
    { ...CHAPTER_CONTROL },
    { key: 'blockCount', type: 'number', label: '积木数量', default: 6, min: 3, max: 6, countArrays: ['blocks'], description: '积木块数:3 块呈三角,4 块呈菱形,5 块呈 V 形,6 块是完整的三层阶梯台;第 1 块在最里面、最高。' },
    { key: 'highlightIndex', type: 'number', label: '强调第几块', default: 1, min: 1, max: 6, maxFromKey: 'blockCount', description: '用暖金强调的那一块积木(右侧对应的说明卡同步强调)。' },
  ],
};
