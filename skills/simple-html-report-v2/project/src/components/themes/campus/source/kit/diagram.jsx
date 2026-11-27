// campus 的「图示型」部件(g2 组):原生画出来的流程图、路线图、模型图共用的连线层、箭头、连线标签、编号徽标、
// 画布底纹、分组框,以及「改用图片」的退路(图片模式控件 + 图片位)。
//
// 画法约定:
//   - 节点是绝对定位的 HTML 块,文字是独立的块级文本元素,导出 PPTX 后仍可编辑;
//   - 连线、箭头画在一张铺满绘图区的 SVG 里(WireLayer),导出时整张转成图片,里面不放任何文字;
//   - 连线上的标签(数据形态、是 / 否、1:N、假设编号)是叠在 SVG 上面的 HTML 胶囊(WireTag);
//   - 主路径用校色实线 + 实心箭头,次要路径用浅校色虚线(kind: 'sub'),回流 / 弱关系用中性灰(kind: 'ghost')。
// 几何由页面按 useCampusLayout() 的正文区尺寸算出(px),这里只负责把点列画成圆角折线和箭头。
// 页面要在自己的 useThemeStyle 之前调用 useDiagramStyle(),保证注入顺序「kit → 页面」。
import React from 'react';
import { useThemeStyle } from '../../../shared/style.jsx';
import { MediaSlot } from '../../../shared/MediaSlot.jsx';
import { safeNumber, safeArray, clamp } from '../../../chart-safety.mjs';
import { textWidthEm } from './chrome.jsx';

const DIAGRAM_CSS = `
/* —— 绘图区:相对定位容器,给出实际宽高(导出时不会被当成 0×0 跳过) —— */
.cp-g2-stage{position:relative;flex:none;}
/* 画布底纹:浅校色点阵 + 渐隐,只画在不含文字的独立层上 */
.cp-g2-dots{position:absolute;inset:0;pointer-events:none;border-radius:inherit;background-image:radial-gradient(circle,rgb(var(--theme-accent-rgb) / .16) 1.6px,rgb(var(--theme-accent-rgb) / 0) 2.2px);background-size:28px 28px;background-position:14px 14px;mask-image:linear-gradient(180deg,rgb(0 0 0 / .9) 0%,rgb(0 0 0 / .35) 100%);}
/* 画布面板:浅校色渐变底 + 发丝边 + 大圆角 */
.cp-g2-canvas{position:relative;isolation:isolate;border-radius:var(--campus-radius-lg);}
.cp-g2-canvas::before{content:'';position:absolute;inset:0;z-index:-1;border-radius:inherit;background:var(--campus-wash);border:1px solid var(--campus-card-edge);}

/* —— 连线层 —— */
.cp-g2-wires{position:absolute;left:0;top:0;overflow:visible;pointer-events:none;}
.cp-g2-wire{fill:none;stroke-linecap:round;stroke-linejoin:round;}
.cp-g2-wire.is-main{stroke:var(--theme-accent);stroke-width:3.5;}
.cp-g2-wire.is-sub{stroke:rgb(var(--theme-accent-rgb) / .5);stroke-width:2.6;stroke-dasharray:9 8;}
.cp-g2-wire.is-ghost{stroke:var(--campus-neutral);stroke-width:2.4;stroke-dasharray:3 7;}
.cp-g2-wire.is-halo{stroke:var(--theme-bg);stroke-width:10;}
.cp-g2-head{stroke:none;}
.cp-g2-head.is-main{fill:var(--theme-accent);}
.cp-g2-head.is-sub{fill:rgb(var(--theme-accent-rgb) / .62);}
.cp-g2-head.is-ghost{fill:var(--campus-neutral);}
.cp-g2-tail{fill:var(--theme-surface);stroke-width:3;}
.cp-g2-tail.is-main{stroke:var(--theme-accent);}
.cp-g2-tail.is-sub{stroke:rgb(var(--theme-accent-rgb) / .55);}
.cp-g2-tail.is-ghost{stroke:var(--campus-neutral);}

/* —— 连线标签:白底胶囊 + 校色细框;is-solid 渐变实底,is-soft 浅校色底,is-ghost 中性灰 —— */
.cp-g2-tag{position:absolute;z-index:3;display:flex;align-items:center;justify-content:center;gap:6px;height:34px;padding:0 14px;border-radius:999px;background:var(--theme-surface);border:1.5px solid var(--campus-accent-line);color:var(--theme-accent);font-size:18px;line-height:1;font-weight:700;letter-spacing:.04em;white-space:nowrap;box-shadow:0 4px 12px rgb(var(--theme-accent-rgb) / .12);transform:translate(-50%,-50%);}
.cp-g2-tag.is-solid{background:var(--campus-fill);border-color:transparent;color:var(--theme-on-accent);box-shadow:0 6px 14px rgb(var(--theme-accent-rgb) / .28);font-family:var(--theme-font-serif);}
.cp-g2-tag.is-soft{background:var(--campus-accent-tint);border-color:transparent;box-shadow:none;}
.cp-g2-tag.is-ghost{border-color:var(--campus-neutral-soft);color:var(--theme-muted);box-shadow:none;}
.cp-g2-tag.is-sm{height:30px;padding:0 11px;font-size:18px;}

/* —— 编号徽标:渐变圆片 + 衬线数字;is-soft 浅底,is-ring 白底校色圈,is-spark 点缀色外环 —— */
.cp-g2-badge{flex:none;position:relative;display:grid;place-items:center;border-radius:50%;background:var(--campus-fill);color:var(--theme-on-accent);box-shadow:0 6px 14px rgb(var(--theme-accent-rgb) / .28);font-family:var(--theme-font-serif);font-weight:700;line-height:1;font-variant-numeric:lining-nums;white-space:nowrap;}
.cp-g2-badge.is-soft{background:var(--campus-accent-tint);color:var(--theme-accent);box-shadow:none;}
.cp-g2-badge.is-ring{background:var(--theme-surface);color:var(--theme-accent);border:3px solid var(--theme-accent);box-shadow:0 6px 14px rgb(var(--theme-accent-rgb) / .2);}
.cp-g2-badge.is-spark::after{content:'';position:absolute;inset:-6px;border-radius:50%;border:2px solid var(--campus-spark);pointer-events:none;}

/* —— 分组框:浅校色底纹 + 校色虚线框,左上角渐变标签压在框线上 —— */
.cp-g2-group{position:absolute;border-radius:20px;background:rgb(var(--theme-accent-rgb) / .045);border:1.5px dashed var(--campus-accent-line);pointer-events:none;}
.cp-g2-group-label{position:absolute;z-index:3;display:flex;align-items:center;gap:8px;height:34px;padding:0 16px 0 12px;border-radius:10px 10px 10px 3px;background:var(--campus-fill);color:var(--theme-on-accent);font-size:18px;line-height:1;font-weight:700;letter-spacing:.08em;white-space:nowrap;box-shadow:0 6px 14px rgb(var(--theme-accent-rgb) / .26);}
.cp-g2-group-mark{flex:none;width:7px;height:7px;border-radius:1px;background:var(--campus-spark);transform:rotate(45deg);}

/* —— 改用图片:白底相框里放一个按原比例显示的图片位,下方可带图注 —— */
.cp-g2-figure{flex:1;min-height:0;display:flex;flex-direction:column;gap:14px;}
.cp-g2-figure-frame{flex:1;min-height:0;padding:12px;}
.cp-g2-figure-frame .media-slot{border-radius:10px!important;}
.cp-g2-figure-cap{flex:none;display:flex;align-items:center;gap:12px;font-size:19px;line-height:1.4;color:var(--theme-muted);}
`;

export function useDiagramStyle() {
  useThemeStyle('campus-g2-diagram-kit-style', DIAGRAM_CSS);
}

/** 保留一位小数(几何坐标统一经它取整,保证 SSR 结果逐字节稳定)。 */
export const r1 = value => Math.round(safeNumber(value, 0) * 10) / 10;

/** 估算一段文字在给定字号下的宽度(px)。 */
export const textPx = (text, size) => textWidthEm(text) * safeNumber(size, 18);

/** 连线标签胶囊的估算宽度(px):字宽 + 左右内边距 + 边框。 */
export const tagWidth = (text, size = 18) => Math.ceil(textPx(text, size) * 1.04 + 32);

const DIRS = Object.freeze({ right: [1, 0], left: [-1, 0], down: [0, 1], up: [0, -1] });

/**
 * 点列 → 圆角正交折线的 SVG path。points = [[x, y], …];radius 是拐角圆角半径(按相邻两段长度的一半封顶)。
 * 斜线(两点不在同一水平 / 竖直线上)照样连成直线,不受影响。
 */
export function orthoPath(points, radius = 14) {
  const pts = safeArray(points).map(p => [r1(p?.[0]), r1(p?.[1])]);
  if (pts.length < 2) return '';
  let d = `M ${pts[0][0]} ${pts[0][1]}`;
  for (let i = 1; i < pts.length - 1; i += 1) {
    const [x0, y0] = pts[i - 1];
    const [x1, y1] = pts[i];
    const [x2, y2] = pts[i + 1];
    const l1 = Math.hypot(x1 - x0, y1 - y0);
    const l2 = Math.hypot(x2 - x1, y2 - y1);
    const r = Math.min(safeNumber(radius, 0), l1 / 2, l2 / 2);
    if (r < 0.5 || l1 === 0 || l2 === 0) {
      d += ` L ${x1} ${y1}`;
      continue;
    }
    const ax = x1 - ((x1 - x0) / l1) * r;
    const ay = y1 - ((y1 - y0) / l1) * r;
    const bx = x1 + ((x2 - x1) / l2) * r;
    const by = y1 + ((y2 - y1) / l2) * r;
    d += ` L ${r1(ax)} ${r1(ay)} Q ${x1} ${y1} ${r1(bx)} ${r1(by)}`;
  }
  const last = pts[pts.length - 1];
  return `${d} L ${last[0]} ${last[1]}`;
}

/** 箭头(尖端在 (x, y),沿单位向量 (ux, uy) 指向):带内凹尾部的实心飞镖形。 */
export function arrowHeadPath(x, y, ux, uy, size = 15) {
  const len = Math.hypot(ux, uy) || 1;
  const dx = ux / len;
  const dy = uy / len;
  const nx = -dy;
  const ny = dx;
  const back = size;
  const half = size * 0.62;
  const notch = size * 0.66;
  const p = (a, b) => `${r1(a)} ${r1(b)}`;
  return `M ${p(x, y)} L ${p(x - dx * back + nx * half, y - dy * back + ny * half)} L ${p(x - dx * notch, y - dy * notch)} L ${p(x - dx * back - nx * half, y - dy * back - ny * half)} Z`;
}

/** 方向名 → 单位向量。 */
export const dirVector = dir => DIRS[dir] || DIRS.right;

/**
 * 连线层:一张铺满绘图区的 SVG。wires = [{ points, kind: 'main' | 'sub' | 'ghost', head = true, tail = false, radius, halo }]。
 * 有箭头时,线的最后一段缩短到箭头尾部,线帽不会从箭头尖端露出来;tail 在起点画一枚空心圆钮。
 * halo 在线下面先描一道页面底色的粗线,用于和其他连线交叉时断开(跨线)。
 */
export function WireLayer({ W, H, wires = [], headSize = 15, className = '', style }) {
  const w = r1(Math.max(1, safeNumber(W, 1)));
  const h = r1(Math.max(1, safeNumber(H, 1)));
  const list = safeArray(wires).filter(wire => safeArray(wire?.points).length >= 2);
  return (
    <svg className={`cp-g2-wires ${className}`} style={{ width: w, height: h, ...style }} width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
      {list.map((wire, i) => {
        const kind = ['main', 'sub', 'ghost'].includes(wire.kind) ? wire.kind : 'main';
        const size = safeNumber(wire.headSize, headSize);
        const pts = wire.points.map(p => [safeNumber(p?.[0], 0), safeNumber(p?.[1], 0)]);
        const hasHead = wire.head !== false;
        const end = pts[pts.length - 1];
        const prev = pts[pts.length - 2];
        const ux = end[0] - prev[0];
        const uy = end[1] - prev[1];
        const seg = Math.hypot(ux, uy) || 1;
        const line = pts.slice();
        if (hasHead) {
          const cut = Math.min(size * 0.6, seg * 0.9);
          line[line.length - 1] = [end[0] - (ux / seg) * cut, end[1] - (uy / seg) * cut];
        }
        const d = orthoPath(line, safeNumber(wire.radius, 14));
        return (
          <g key={i}>
            {wire.halo ? <path className="cp-g2-wire is-halo" d={d} /> : null}
            <path className={`cp-g2-wire is-${kind}`} d={d} />
            {hasHead ? <path className={`cp-g2-head is-${kind}`} d={arrowHeadPath(end[0], end[1], ux, uy, size)} /> : null}
            {wire.tail ? <circle className={`cp-g2-tail is-${kind}`} cx={r1(pts[0][0])} cy={r1(pts[0][1])} r={5.5} /> : null}
          </g>
        );
      })}
    </svg>
  );
}

/** 连线标签:以 (x, y) 为中心的胶囊;text 是页面 props 里的文案。tone: 'line' | 'solid' | 'soft' | 'ghost'。 */
export function WireTag({ x, y, text, tone = 'line', small = false, className = '', style }) {
  useDiagramStyle();
  if (text === undefined || text === null || text === '') return null;
  return (
    <div className={`cp-g2-tag is-${tone}${small ? ' is-sm' : ''} ${className}`} style={{ left: r1(x), top: r1(y), ...style }}>
      <div>{text}</div>
    </div>
  );
}

/** 编号徽标:圆形,衬线数字。tone: 'fill' | 'soft' | 'ring';spark 加一圈点缀色外环(当前项 / 重点项)。 */
export function NumBadge({ no, size = 44, tone = 'fill', spark = false, className = '', style }) {
  useDiagramStyle();
  const s = clamp(safeNumber(size, 44), 20, 120);
  return (
    <div className={`cp-g2-badge is-${tone}${spark ? ' is-spark' : ''} ${className}`} style={{ width: s, height: s, fontSize: Math.round(s * 0.46), ...style }}>
      <div>{no}</div>
    </div>
  );
}

/** 分组框:虚线浅底框 + 左上角渐变标签(标签是可编辑文案)。box = { left, top, width, height }(px)。 */
export function GroupFrame({ box, label, className = '', style }) {
  useDiagramStyle();
  const b = { left: r1(box?.left), top: r1(box?.top), width: r1(Math.max(0, safeNumber(box?.width, 0))), height: r1(Math.max(0, safeNumber(box?.height, 0))) };
  return (
    <>
      <div className={`cp-g2-group ${className}`} style={{ ...b, ...style }} aria-hidden="true" />
      {label ? (
        <div className={`cp-g2-group-label ${className}`} style={{ left: r1(b.left + 18), top: r1(b.top - 17), ...style }}>
          <div className="cp-g2-group-mark" aria-hidden="true" />
          <div>{label}</div>
        </div>
      ) : null}
    </>
  );
}

/** 画布点阵底纹(纯装饰)。 */
export function DotGrid({ className = '', style }) {
  useDiagramStyle();
  return <div className={`cp-g2-dots ${className}`} style={style} aria-hidden="true" />;
}

/**
 * 「改用图片」:学生已有现成的图时,把整张原生图换成一个按原比例显示、不裁切的图片位(白底相框)。
 * 图注 caption 可省略。槽位 id 由页面给出(页内唯一,以 -image 结尾对应 images[0])。
 */
export function DiagramImage({ id, placeholder = '流程图 / 结构图', caption, className = '', style }) {
  useDiagramStyle();
  return (
    <div className={`cp-g2-figure ${className}`} style={style}>
      <div className="cp-g2-figure-frame campus-photo">
        <MediaSlot id={id} fit="contain" radius={10} placeholder={placeholder} />
      </div>
      {caption ? (
        <div className="cp-g2-figure-cap">
          <div className="campus-mark is-spark" aria-hidden="true" />
          <p>{caption}</p>
        </div>
      ) : null}
    </div>
  );
}

/**
 * 图片模式控件(「自动 / 原生绘制 / 改用图片」)与图片控件的声明。图片位只在图片模式出现,所以页面 defaults 不声明 images,
 * 由这里的 images 媒体控件声明。默认 `auto`:页面在渲染时自己看 props.images——有图就显示图片位,没图就原生绘制
 * (浏览器端拿到的是精简过的契约,契约层的「写了图就切模式」在 render:goal 产物里不生效,所以由页面判断)。
 * 显式写 `diagram` / `image` 时按写的来。
 */
export const hasAuthoredImages = images => safeArray(images).some(item => (typeof item === 'string' ? item.trim() !== '' : Boolean(item?.src)));
/** 图片模式是否生效:写了 image,或 auto 且 goal / 页面给了图。 */
export const isImageMode = (p, imageValue = 'image') => p?.mediaMode === imageValue || (p?.mediaMode === 'auto' && hasAuthoredImages(p?.images));

export function diagramMediaControls(what = '图') {
  return [
    {
      key: 'mediaMode',
      type: 'radio',
      label: '图的来源',
      default: 'auto',
      options: [{ value: 'auto', label: '自动' }, { value: 'diagram', label: '原生绘制' }, { value: 'image', label: '改用图片' }],
      description: `自动(默认):给了 images 就显示图片,没给就原生绘制;原生绘制:按 props 自动画出${what},文字导出后仍可编辑;改用图片:${what}区换成一个按原比例显示的图片位(已有现成图时用),其余文字保留。`,
    },
    {
      key: 'images',
      type: 'images',
      label: `${what}图片`,
      description: `图片模式下显示的现成${what}(只用第 1 张)。图的来源为「自动」时,goal 里写了 props.images 就显示这张图;在页面上上传前,先把图的来源切到「改用图片」。`,
    },
  ];
}
