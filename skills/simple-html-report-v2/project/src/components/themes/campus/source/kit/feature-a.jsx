// campus 特色页(A 组)共用部件:立体柱状图、大数字、舞台卡片、环形轨道、卷轴图文这几页用到的
// SVG 渐变、图标、指标条、玻璃卡与大数字字形。
//
// 立体 / 玻璃质感的约定(导出可编辑 PPTX 用):
//   - 立体面、玻璃、光环这些图形画在 SVG 里(导出时整块转成图片),SVG 里不放任何文字;
//     数字、标题、说明都是叠在图形上的独立 HTML 文本元素,导出后仍可编辑。
//   - SVG 渐变的色标写成 stop-color="currentColor",颜色由 CSS 的 color 读 token 决定:
//     导出引擎会把每个 SVG 元素的计算后 color 内联进去,渐变脱离页面也能保持校色。
//   - 不用 backdrop-filter、mix-blend-mode、文字渐变;玻璃感 = 半透明白 + 渐变描边 + 高光条。
import React from 'react';
import { useThemeStyle } from '../../../shared/style.jsx';
import { safeNumber, clamp } from '../../../chart-safety.mjs';
import { CAMPUS_FEATURE_A_TOKENS_CSS } from './base.jsx';

const FEATURE_A_CSS = `
/* 渐变色标:颜色读 token(见文件头的说明) */
.campus-fa-stop{stop-color:currentColor;}

/* —— 玻璃面板:半透明白 + 白色发丝边 + 柔和校色投影(投影在 ::before 上) —— */
.campus-fa-glass{position:relative;isolation:isolate;border-radius:var(--campus-radius);}
.campus-fa-glass::before{content:'';position:absolute;inset:0;z-index:-1;border-radius:inherit;background:var(--campus-glass);border:1.5px solid var(--campus-glass-edge);box-shadow:0 18px 40px rgb(var(--theme-accent-rgb) / .12),0 2px 6px rgb(0 0 0 / .04);pointer-events:none;}

/* —— 圆形图标章:渐变圆 + 白色外圈;is-gold 用点缀金 —— */
.campus-fa-orb{position:relative;isolation:isolate;flex:none;display:grid;place-items:center;border-radius:50%;color:var(--theme-on-accent);}
.campus-fa-orb-shape{position:absolute;inset:0;border-radius:50%;background:var(--campus-fill);box-shadow:0 10px 22px rgb(var(--theme-accent-rgb) / .3);}
.campus-fa-orb-ring{position:absolute;inset:-7px;border-radius:50%;border:1.5px solid var(--campus-accent-line);}
.campus-fa-orb.is-gold .campus-fa-orb-shape{background:var(--campus-fill-gold);box-shadow:0 10px 22px var(--campus-spark-glow);}
.campus-fa-orb.is-gold .campus-fa-orb-ring{border-color:var(--campus-spark-soft);}
.campus-fa-orb-body{position:relative;display:grid;place-items:center;}

/* —— 指标条:图标章 + 说明 + 大数字 + 上升箭头 —— */
.campus-fa-metric{display:flex;align-items:center;gap:22px;min-height:0;padding:16px 26px 16px 20px;}
.campus-fa-metric-text{flex:1;min-width:0;}
.campus-fa-metric-label{font-size:22px;line-height:1.35;font-weight:700;color:var(--theme-ink);}
.campus-fa-metric-note{margin-top:4px;font-size:18px;line-height:1.4;color:var(--theme-faint);}
.campus-fa-metric-figure{flex:none;display:flex;align-items:baseline;gap:6px;}
.campus-fa-metric-value{font-family:var(--theme-font-serif);font-weight:700;font-size:54px;line-height:1;color:var(--theme-accent);font-variant-numeric:lining-nums;white-space:nowrap;}
.campus-fa-metric-unit{font-size:21px;font-weight:700;color:var(--theme-accent);white-space:nowrap;}
.campus-fa-metric.is-gold .campus-fa-metric-value,.campus-fa-metric.is-gold .campus-fa-metric-unit{color:var(--campus-spark-lo);}
.campus-fa-metric-trend{flex:none;display:block;color:var(--campus-spark);}

/* —— 双段标签:浅色眉题 + 渐变主标签(斜切尾) —— */
.campus-fa-tagpair{display:flex;align-items:stretch;height:46px;}
.campus-fa-tagpair-soft{display:flex;align-items:center;padding:0 30px 0 20px;margin-right:-18px;border-radius:12px 0 0 12px;background:var(--campus-spark-soft);color:var(--campus-spark-deep);font-size:20px;font-weight:700;letter-spacing:.06em;white-space:nowrap;}
.campus-fa-tagpair-main{position:relative;isolation:isolate;display:flex;align-items:center;padding:0 40px 0 26px;color:var(--theme-on-accent);font-size:22px;font-weight:700;letter-spacing:.08em;white-space:nowrap;}
.campus-fa-tagpair-shape{position:absolute;inset:0;z-index:-1;background:var(--campus-fill);border-radius:12px 4px 4px 12px;clip-path:polygon(0 0,100% 0,calc(100% - 16px) 100%,0 100%);}
.campus-fa-tagpair-text{position:relative;}
`;

/** 注入 feature-a 的 token 与共用样式(页面渲染开头调用一次)。 */
export function useFeatureAStyle() {
  useThemeStyle('campus-feature-a-tokens-style', CAMPUS_FEATURE_A_TOKENS_CSS);
  useThemeStyle('campus-feature-a-style', FEATURE_A_CSS);
}

/**
 * SVG 渐变。stops = [[offset, 颜色 token 或 CSS 颜色表达式], ...]。
 * 色标用 currentColor + CSS color,导出时颜色被内联,渐变脱离页面仍然正确。
 */
export function LinearGrad({ id, x1 = 0, y1 = 0, x2 = 0, y2 = 1, stops = [], units }) {
  return (
    <linearGradient id={id} x1={x1} y1={y1} x2={x2} y2={y2} gradientUnits={units}>
      {stops.map(([offset, color], i) => (
        <stop key={i} className="campus-fa-stop" offset={offset} stopColor="currentColor" style={{ color }} />
      ))}
    </linearGradient>
  );
}

export function RadialGrad({ id, cx = 0.5, cy = 0.5, r = 0.5, fx, fy, stops = [], units }) {
  return (
    <radialGradient id={id} cx={cx} cy={cy} r={r} fx={fx} fy={fy} gradientUnits={units}>
      {stops.map(([offset, color], i) => (
        <stop key={i} className="campus-fa-stop" offset={offset} stopColor="currentColor" style={{ color }} />
      ))}
    </radialGradient>
  );
}

/** 柔化滤镜:立体图形的落地投影、光晕用。 */
export function BlurFilter({ id, std = 12 }) {
  return (
    <filter id={id} x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation={std} />
    </filter>
  );
}

/** 皇冠(最高 / 重点柱子上方)。 */
export function CrownIcon({ size = 56, className = '', style }) {
  return (
    <svg className={className} style={style} width={size} height={size * 0.82} viewBox="0 0 64 52" aria-hidden="true">
      <path d="M6 18 L20 30 L32 8 L44 30 L58 18 L52 44 H12 Z" fill="currentColor" />
      <rect x="11" y="46" width="42" height="5" rx="2.5" fill="currentColor" />
      <circle cx="6" cy="16" r="4.5" fill="currentColor" />
      <circle cx="32" cy="6" r="4.5" fill="currentColor" />
      <circle cx="58" cy="16" r="4.5" fill="currentColor" />
      <path d="M32 24 L35 31 L42 31 L36.5 35.5 L38.5 42 L32 38 L25.5 42 L27.5 35.5 L22 31 L29 31 Z" fill="rgb(255 255 255 / .85)" />
    </svg>
  );
}

/** 上升趋势箭头(指标条右侧):一粗一细两支。 */
export function TrendIcon({ size = 46, className = '', style }) {
  return (
    <svg className={className} style={style} width={size * 0.8} height={size} viewBox="0 0 40 50" aria-hidden="true">
      <path d="M14 48 V16 H5 L17 2 L29 16 H20 V48 Z" fill="currentColor" />
      <path d="M31 48 V30 H26.5 L33 22 L39.5 30 H35 V48 Z" fill="currentColor" opacity=".55" />
    </svg>
  );
}

/** 指标条里的图标:折线上扬。 */
export function SparkLineIcon({ size = 30 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 30 30" aria-hidden="true">
      <path d="M3 22 L11 14 L16 18 L26 7" stroke="currentColor" strokeWidth="3.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M19 6 H27 V14" stroke="currentColor" strokeWidth="3.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** 勾选(标签前的小方块里)。 */
export function CheckGlyph({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" aria-hidden="true">
      <path d="M3.5 9.5 L7.5 13.2 L14.5 5" stroke="currentColor" strokeWidth="2.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** 一组渐淡的人字箭头(口号条两端、阶段条之间)。direction: 'left' | 'right'。 */
export function ChevronRun({ direction = 'right', count = 3, size = 26, className = '', style }) {
  const w = size * 0.62;
  const total = count * w + 6;
  return (
    <svg className={className} style={style} width={total} height={size} viewBox={`0 0 ${total} ${size}`} aria-hidden="true">
      {Array.from({ length: count }, (_, i) => {
        const k = direction === 'right' ? i : count - 1 - i;
        const x = 3 + i * w;
        const d = direction === 'right'
          ? `M${x} 3 L${x + w * 0.62} ${size / 2} L${x} ${size - 3}`
          : `M${x + w * 0.62} 3 L${x} ${size / 2} L${x + w * 0.62} ${size - 3}`;
        return <path key={i} d={d} stroke="currentColor" strokeWidth="3.6" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity={0.35 + 0.65 * ((k + 1) / count)} />;
      })}
    </svg>
  );
}

/** 圆形图标章:children 是图标或编号(编号是可编辑文本)。gold 用点缀金。 */
export function IconOrb({ size = 72, gold = false, ring = true, className = '', style, children }) {
  return (
    <div className={`campus-fa-orb${gold ? ' is-gold' : ''} ${className}`} style={{ width: size, height: size, ...style }}>
      <div className="campus-fa-orb-shape" aria-hidden="true" />
      {ring && <div className="campus-fa-orb-ring" aria-hidden="true" />}
      <div className="campus-fa-orb-body">{children}</div>
    </div>
  );
}

/** 指标条:图标章 + 说明(标题 + 注释)+ 大数字(值 + 单位)+ 上升箭头。文字各自独立成块。 */
export function MetricStrip({ value, unit, label, note, gold = false, compact = false, className = '', style }) {
  useFeatureAStyle();
  return (
    <div className={`campus-fa-metric campus-fa-glass${gold ? ' is-gold' : ''} ${className}`} style={style}>
      <IconOrb size={compact ? 54 : 62} gold={gold} ring={false}><SparkLineIcon size={compact ? 24 : 28} /></IconOrb>
      <div className="campus-fa-metric-text">
        <div className="campus-fa-metric-label">{label}</div>
        {note ? <div className="campus-fa-metric-note">{note}</div> : null}
      </div>
      <div className="campus-fa-metric-figure">
        <div className="campus-fa-metric-value">{value}</div>
        {unit ? <div className="campus-fa-metric-unit">{unit}</div> : null}
      </div>
      <TrendIcon className="campus-fa-metric-trend" size={compact ? 38 : 46} />
    </div>
  );
}

/** 双段标签:浅色眉题 + 渐变主标签(两段各自是可编辑文本)。 */
export function TagPair({ soft, main, className = '', style }) {
  useFeatureAStyle();
  return (
    <div className={`campus-fa-tagpair ${className}`} style={style}>
      {soft ? <div className="campus-fa-tagpair-soft">{soft}</div> : null}
      <div className="campus-fa-tagpair-main">
        <div className="campus-fa-tagpair-shape" aria-hidden="true" />
        <div className="campus-fa-tagpair-text">{main}</div>
      </div>
    </div>
  );
}

/**
 * 大数字字形:0–9 的轮廓(取自仓库自带字体 Newsreader 800 的衬线等高数字,SIL OFL),
 * 单位是字体设计单位(每 em 2000,基线 y=0、向上为负,数字高约 1380)。
 * 大数字页用它画「图案填充的数字」:数字是整块图形,数值来自页面的数字控件,换数字不需要换图。
 */
export const NUMERAL_GLYPHS = Object.freeze({
  '0': { x0: 80, x1: 1262, d: 'M676 -128Q734 -128 772 -180Q809 -232 827 -342Q845 -453 845 -627Q845 -788 834 -902Q824 -1015 803 -1086Q782 -1157 748 -1190Q713 -1224 665 -1224Q608 -1224 570 -1172Q533 -1120 514 -1010Q496 -900 496 -726Q496 -565 506 -451Q517 -337 538 -266Q560 -195 594 -162Q629 -128 676 -128ZM674 -1382Q861 -1382 993 -1300Q1125 -1219 1194 -1063Q1262 -907 1262 -682Q1262 -455 1193 -296Q1124 -137 991 -54Q858 30 668 30Q481 30 349 -52Q217 -133 148 -290Q80 -447 80 -670Q80 -898 149 -1056Q218 -1215 351 -1298Q484 -1382 674 -1382Z' },
  '1': { x0: 144, x1: 1210, d: 'M551 -136V-1174L635 -1097L185 -949L144 -1055L708 -1352H955V-136L1210 -66V0H279V-66Z' },
  '2': { x0: 107, x1: 1220, d: 'M816 -181 1140 -534H1220L1117 62H1059L936 0H138V-63L477 -429Q567 -525 618 -600Q669 -674 691 -736Q713 -797 713 -854Q713 -950 658 -1008Q604 -1067 507 -1067Q440 -1067 387 -1044Q334 -1020 294 -970Q255 -919 228 -839L107 -868Q163 -1131 310 -1256Q457 -1382 679 -1382Q811 -1382 912 -1334Q1012 -1285 1068 -1198Q1125 -1111 1125 -995Q1125 -922 1102 -858Q1079 -794 1024 -728Q969 -662 876 -584Q782 -507 640 -407L427 -261L437 -353H1155Z' },
  '3': { x0: 126, x1: 1193, d: 'M442 -598 411 -732Q540 -766 608 -803Q677 -840 702 -884Q728 -928 728 -982Q728 -1050 683 -1092Q638 -1135 556 -1135Q459 -1135 394 -1088Q330 -1040 296 -937L168 -985Q202 -1106 268 -1195Q335 -1284 437 -1333Q539 -1382 679 -1382Q811 -1382 896 -1344Q980 -1307 1021 -1242Q1062 -1176 1062 -1093Q1062 -999 1008 -928Q955 -857 866 -818Q777 -778 670 -774L701 -790Q852 -806 962 -772Q1072 -738 1132 -660Q1193 -582 1193 -468Q1193 -335 1112 -222Q1031 -109 872 -40Q713 30 479 30Q347 30 270 6Q192 -17 159 -58Q126 -100 126 -154Q126 -213 162 -249Q197 -285 256 -285Q290 -285 319 -267Q348 -249 376 -224Q403 -199 432 -173Q461 -147 494 -129Q526 -111 566 -111Q637 -111 690 -144Q744 -178 775 -242Q806 -307 806 -398Q806 -485 768 -539Q730 -593 660 -612Q591 -631 496 -609Z' },
  '4': { x0: 50, x1: 1292, d: 'M997 -1352V-119L1183 -59V0H393V-59L593 -119V-1149L718 -1185L196 -530L160 -612H1101L1292 -640L1238 -362H50V-557L659 -1352Z' },
  '5': { x0: 124, x1: 1204, d: 'M477 30Q345 30 268 6Q190 -17 157 -58Q124 -100 124 -154Q124 -213 160 -249Q195 -285 254 -285Q288 -285 317 -267Q346 -249 374 -224Q401 -199 430 -173Q459 -147 492 -129Q524 -111 564 -111Q637 -111 695 -136Q753 -160 787 -208Q821 -256 821 -326Q821 -372 798 -410Q775 -448 712 -478Q650 -509 532 -532Q415 -555 225 -569L446 -1352H914L1204 -1391L1080 -1010H472L610 -1220L436 -811L398 -893Q585 -874 714 -843Q844 -812 926 -770Q1007 -728 1052 -678Q1096 -628 1112 -572Q1129 -516 1129 -456Q1129 -353 1084 -264Q1040 -176 956 -110Q871 -44 750 -7Q630 30 477 30Z' },
  '6': { x0: 117, x1: 1249, d: 'M1082 -1400 1137 -1292Q985 -1244 878 -1191Q772 -1138 703 -1076Q634 -1013 596 -935Q557 -857 542 -760Q527 -664 527 -543Q527 -386 548 -293Q568 -200 607 -160Q646 -121 699 -121Q753 -121 788 -149Q822 -177 838 -232Q854 -286 854 -365Q854 -509 812 -570Q770 -630 689 -630Q658 -630 626 -626Q595 -622 564 -614Q534 -605 504 -589Q475 -573 449 -549L369 -563Q477 -650 547 -704Q617 -759 667 -788Q717 -816 761 -827Q805 -838 859 -838Q976 -838 1064 -791Q1152 -744 1200 -657Q1249 -570 1249 -448Q1249 -292 1174 -186Q1098 -79 970 -24Q841 30 684 30Q490 30 364 -42Q239 -113 178 -240Q117 -367 117 -532Q117 -642 142 -746Q167 -850 230 -945Q292 -1040 402 -1123Q511 -1206 678 -1276Q846 -1346 1082 -1400Z' },
  '7': { x0: 133, x1: 1238, d: 'M196 -1004 543 -1176 217 -803H133L236 -1418H288L430 -1352H1238V-1316L782 0H377L1098 -1228L1056 -1004Z' },
  '8': { x0: 117, x1: 1227, d: 'M693 -1382Q849 -1382 952 -1346Q1054 -1309 1105 -1240Q1156 -1171 1156 -1076Q1156 -944 1045 -876Q934 -809 721 -786L664 -805Q772 -849 825 -910Q878 -970 878 -1056Q878 -1110 856 -1150Q833 -1189 786 -1212Q739 -1234 664 -1234Q557 -1234 510 -1189Q464 -1144 464 -1085Q464 -1020 506 -981Q547 -942 614 -918Q682 -893 764 -872Q846 -851 928 -822Q1009 -793 1076 -745Q1144 -697 1186 -618Q1227 -540 1227 -420Q1227 -276 1156 -176Q1086 -75 956 -22Q825 30 647 30Q488 30 368 -9Q249 -48 183 -124Q117 -201 117 -312Q117 -392 148 -450Q179 -509 241 -551Q303 -593 396 -624Q488 -654 610 -679L650 -653Q548 -615 493 -572Q438 -529 418 -477Q398 -425 398 -358Q398 -275 430 -222Q462 -170 522 -146Q583 -121 665 -121Q749 -121 804 -142Q859 -163 887 -204Q915 -245 915 -305Q915 -373 874 -412Q833 -452 766 -478Q699 -503 619 -524Q539 -545 458 -574Q378 -603 310 -650Q243 -697 202 -774Q162 -850 162 -968Q162 -1096 228 -1189Q293 -1282 412 -1332Q532 -1382 693 -1382Z' },
  '9': { x0: 87, x1: 1220, d: 'M338 48 283 -60Q417 -103 510 -154Q602 -205 661 -268Q720 -332 752 -412Q784 -491 796 -590Q809 -689 809 -810Q809 -968 789 -1060Q769 -1152 731 -1192Q693 -1231 638 -1231Q585 -1231 550 -1204Q515 -1177 498 -1125Q482 -1073 482 -999Q482 -898 501 -837Q520 -776 557 -750Q594 -723 649 -723Q679 -723 710 -726Q741 -729 772 -737Q803 -745 834 -760Q864 -775 894 -798L969 -784Q861 -700 790 -647Q720 -594 670 -565Q619 -536 574 -525Q530 -514 476 -514Q360 -514 272 -561Q185 -608 136 -696Q87 -783 87 -904Q87 -1061 163 -1168Q239 -1274 367 -1328Q495 -1382 652 -1382Q846 -1382 972 -1310Q1098 -1239 1159 -1112Q1220 -986 1220 -821Q1220 -710 1197 -605Q1174 -500 1118 -404Q1061 -307 961 -224Q861 -140 708 -71Q555 -2 338 48Z' },
});
export const NUMERAL_ADVANCE = 1342;
export const NUMERAL_TOP = -1420;
export const NUMERAL_BOTTOM = 62;

/**
 * 大数字的排版:把 1–2 位整数换成字形路径与水平偏移(字体单位)。
 * 返回 { glyphs: [{ d, dx }], x0, x1, y0, y1 },x0/x1 是整组字形的实际左右边界。
 */
export function numeralLayout(value, { min = 0, max = 99, tracking = -60 } = {}) {
  const n = clamp(Math.round(safeNumber(value, 0)), min, max);
  const chars = String(n).split('');
  let pen = 0;
  const glyphs = chars.map((ch, i) => {
    const g = NUMERAL_GLYPHS[ch] || NUMERAL_GLYPHS['0'];
    const dx = pen;
    pen += NUMERAL_ADVANCE + (i < chars.length - 1 ? tracking : 0);
    return { d: g.d, dx, x0: dx + g.x0, x1: dx + g.x1 };
  });
  const x0 = glyphs.length ? glyphs[0].x0 : 0;
  const x1 = glyphs.length ? glyphs[glyphs.length - 1].x1 : NUMERAL_ADVANCE;
  return { value: n, glyphs, x0, x1, y0: NUMERAL_TOP, y1: NUMERAL_BOTTOM };
}
