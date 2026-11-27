// campus 主题基座:设计 token、通用版式类、入场动画和页面外壳。
// 颜色字面量只允许出现在这个文件里;页面和其他 kit 组件一律读 token。
//
// 视觉规则(写页面前先读,docs/theme-standard.md §2.11 有完整说明):
//   - 底色是带一点校色倾向的冷白,左上 / 右下各有一团极淡的校色光晕(--campus-page-bg)。
//   - 深色块(卡头、标签、编号、结论条、导航当前项、章节色块)一律用同一条校色渐变 --campus-fill:
//     135° 从压暗的校色(--campus-accent-lo)经校色本色到提亮的校色(--campus-accent-hi)——暗端在左上、亮端在右下。
//     大面积色块用 --campus-fill-deep(亮端多一层柔光)。deck 选 brand.fill='solid' 时两者都退回纯色。
//   - 白卡(campus-card)是白底 + 大圆角 + 带校色倾向的柔和投影;投影画在 ::before 上,
//     卡片本身保持普通形状,导出 PPTX 时卡里的形状和文字都不会被整块栅格化。
//   - 浅校色面(--campus-wash)用于次级信息;点缀色 --campus-spark(暖金)只用于很小的高光标记。
//   - 压在渐变色块上的文字一律用 --theme-on-accent;标题、编号、数字用衬线(宋体),正文、标签用黑体。
//   - 所有与校色相关的颜色都从 --theme-accent-rgb 派生;不用 mix-blend-mode、backdrop-filter、文字渐变。
import React from 'react';
import { useThemeStyle } from '../../../shared/style.jsx';
import { DeckBrandContext, deckBrandStyle, guardAccent, isWarmAccent } from '../../../shared/DeckBrand.jsx';
import { useChromeStyle } from './chrome.jsx';
import { usePartsStyle } from './parts.jsx';
import { SCHOOL_ASSET_PREFIX_RE } from '../schools/registry.mjs';
import { probeSchoolAsset, schoolAssetsMissing, subscribeSchoolAssets } from '../schools/availability.mjs';

/**
 * 校色:主题默认值、预览工作台的预置校色、校色规整参数。颜色字面量只写在本文件里,
 * 全稿外观 / 学校信息的声明(deck-styles.mjs)从这里取。预置色只按颜色起名,不对应具体学校。
 * 评审一直在用的四色(朱红 / 靛蓝 / 松绿 / 绛紫)都在里面;每一个都满足下面的规整条件(不会被自动调整)。
 */
export const CAMPUS_DEFAULT_ACCENT = '#00D9C6';
export const CAMPUS_ACCENT_PRESETS = Object.freeze([
  { value: '#00D9C6', label: '霓虹青' },
  { value: '#0A6BFF', label: '赣江蓝' },
  { value: '#FFB84A', label: '赤金' },
  { value: '#F25555', label: '朱红' },
  { value: '#8B5CF6', label: '夜紫' },
  { value: '#38BDF8', label: '天际蓝' },
  { value: '#1F4E9C', label: '深蓝' },
  { value: '#0B1F3A', label: '夜色蓝' },
  { value: '#14B8A6', label: '青绿' },
  { value: '#E2E8F0', label: '雾银' },
]);
/**
 * 校色规整参数(src/deck-accent.mjs 的 guardAccent):渐变最亮的一端 --campus-accent-hi 是校色按通道 ×1.3,
 * 白字压在这一端上对比度要 ≥ 4.5(WCAG AA);HSL 亮度低于 .2 时提亮,饱和度低于 .12(接近黑 / 白 / 灰)时
 * 换成石墨蓝灰。预览工作台用同一份参数提示「已自动调整为 #xxxxxx」。
 */
export const CAMPUS_ACCENT_GUARD = Object.freeze({
  brightFactor: 1.3,
  minContrast: 4.5,
  minLightness: 0.2,
  minSaturation: 0.12,
  neutralHue: 214,
  neutralSaturation: 0.22,
});

export const CAMPUS_BASE_CSS = `
.campus,.campus *{box-sizing:border-box;}
.campus{
  /* —— 标准 token(所有主题同名) —— */
  --theme-accent-rgb:166 25 46;                       /* 高亮色:整份 deck 的色调由这一个值决定,其余深浅都从它派生 */
  --theme-accent:rgb(var(--theme-accent-rgb));
  --theme-on-accent:#ffffff;
  --theme-bg:color-mix(in srgb,rgb(var(--theme-accent-rgb)) 3%,#f6f7fb);
  --theme-surface:#ffffff;
  --theme-ink:#1b1d2a;
  --theme-muted:rgb(27 29 42 / .74);
  --theme-faint:rgb(27 29 42 / .52);
  --theme-line:rgb(27 29 42 / .11);
  --theme-font-sans:'Inter','Noto Sans SC','PingFang SC','Microsoft YaHei',system-ui,sans-serif;
  --theme-font-serif:'Newsreader','Noto Serif SC','Source Han Serif SC','Songti SC','STSong','SimSun',serif;

  /* —— 校色的深浅:按通道等比提亮 / 压暗,色相和饱和度不变,四种校色都成立 —— */
  --campus-accent-hi:rgb(from rgb(var(--theme-accent-rgb)) calc(r * 1.3) calc(g * 1.3) calc(b * 1.3));
  --campus-accent-lo:rgb(from rgb(var(--theme-accent-rgb)) calc(r * .64) calc(g * .64) calc(b * .64));
  --campus-accent-wash:rgb(var(--theme-accent-rgb) / .06);    /* 浅校色底:斑马行、次级面板 */
  --campus-accent-tint:rgb(var(--theme-accent-rgb) / .12);    /* 稍深的校色底:浅标签、占位 */
  --campus-accent-line:rgb(var(--theme-accent-rgb) / .3);     /* 校色细线 */
  --campus-accent-soft:rgb(var(--theme-accent-rgb) / .7);     /* 弱化的校色文字 */
  --campus-on-accent-muted:rgb(255 255 255 / .78);            /* 渐变色块上的次级文字 */
  --campus-on-accent-line:rgb(255 255 255 / .3);              /* 渐变色块上的细线 */
  --campus-on-accent-glass:rgb(255 255 255 / .16);            /* 渐变色块上的半透明白:标签底、当前项 */
  --campus-shade:rgb(0 0 0 / .18);                            /* 叠在色块上的加深遮罩 */
  --campus-paper:color-mix(in srgb,rgb(var(--theme-accent-rgb)) 2%,#fbfbfd);  /* 卡片内的次级纸色 */
  --campus-neutral:rgb(27 29 42 / .5);                        /* 中性灰:对照方、对照系列 */
  --campus-neutral-soft:rgb(27 29 42 / .18);                  /* 浅中性灰:轨道、底槽 */
  --campus-neutral-wash:rgb(27 29 42 / .045);                 /* 极浅中性底:对照方的面板 */
  --campus-neutral-fill:linear-gradient(135deg,rgb(27 29 42 / .08) 0%,rgb(27 29 42 / .03) 100%);  /* 对照方的名牌底 */

  /* —— 点缀色:唯一的固定色,只用于徽章、星标、数据高亮这类很小的标记,不随校色变化 —— */
  --campus-spark:#e8a838;
  --campus-spark-soft:rgb(232 168 56 / .2);

  /* —— 渐变体系:方向统一 135°,深端在左上,亮端在右下(竖向 180° 的深端在上、亮端在下) —— */
  --campus-fill:linear-gradient(135deg,var(--campus-accent-lo) 0%,var(--theme-accent) 48%,var(--campus-accent-hi) 100%);
  --campus-fill-deep:linear-gradient(0deg,rgb(255 255 255 / .1) 0%,rgb(255 255 255 / 0) 42%),linear-gradient(135deg,var(--campus-accent-lo) 0%,var(--theme-accent) 54%,var(--campus-accent-hi) 100%);
  --campus-fill-bar:linear-gradient(180deg,var(--campus-accent-lo) 0%,var(--theme-accent) 42%,var(--campus-accent-hi) 100%);
  --campus-fill-soft:linear-gradient(180deg,rgb(var(--theme-accent-rgb) / .3) 0%,rgb(var(--theme-accent-rgb) / .5) 100%);
  --campus-wash:linear-gradient(135deg,rgb(var(--theme-accent-rgb) / .035) 0%,rgb(var(--theme-accent-rgb) / .1) 100%);
  --campus-fade-line:linear-gradient(90deg,rgb(var(--theme-accent-rgb) / .55) 0%,rgb(var(--theme-accent-rgb) / 0) 100%);
  --campus-page-bg:radial-gradient(circle at 96% 0%,rgb(var(--theme-accent-rgb) / .11) 0%,rgb(var(--theme-accent-rgb) / 0) 38%),radial-gradient(circle at 0% 100%,rgb(var(--theme-accent-rgb) / .07) 0%,rgb(var(--theme-accent-rgb) / 0) 34%);

  /* —— 投影:带校色倾向、很柔;卡片用 shadow,渐变色块用 shadow-lift —— */
  --campus-shadow:0 14px 36px rgb(var(--theme-accent-rgb) / .1),0 2px 6px rgb(27 29 42 / .05);
  --campus-shadow-lift:0 10px 24px rgb(var(--theme-accent-rgb) / .26);
  --campus-card-edge:rgb(var(--theme-accent-rgb) / .1);       /* 白卡的发丝边 */

  /* 图表色阶:只用校色深浅 + 中性灰区分系列,不引入第二种彩色 */
  --campus-tone-1:var(--theme-accent);
  --campus-tone-2:rgb(var(--theme-accent-rgb) / .58);
  --campus-tone-3:rgb(var(--theme-accent-rgb) / .3);
  --campus-tone-4:rgb(27 29 42 / .5);
  --campus-tone-5:rgb(27 29 42 / .28);
  --campus-tone-6:rgb(27 29 42 / .13);

  /* —— 尺寸 —— */
  --campus-pad-x:80px;                                        /* 页面左右边距(顶部导航时) */
  --campus-header-h:96px;                                     /* 顶部导航栏高度 */
  --campus-radius:16px;                                       /* 卡片圆角 */
  --campus-radius-sm:10px;                                    /* 编号块、表头、小面板的圆角 */
  --campus-radius-lg:24px;                                    /* 大色块的圆角 */
  /* 正文区(内容区)的位置:随导航样式变化,外壳与页面都从这里读,页面的几何计算用 useCampusLayout() 的同名数值 */
  --campus-body-top:128px;
  --campus-body-left:80px;
  --campus-body-right:80px;
  --campus-body-bottom:66px;
  --campus-body-w:calc(1920px - var(--campus-body-left) - var(--campus-body-right));

  position:relative;width:100%;height:100%;overflow:hidden;
  color:var(--theme-ink);font-family:var(--theme-font-sans);
  background-color:var(--theme-bg);
  background-image:var(--campus-page-bg);
}
/* 顶部导航(band / tabs / slant / underline / cells / folder / solid / steps)用上面的默认值:正文区 1760×886;
   只有 inline(薄页眉)与 rail(左侧竖栏)换盒子。与 chrome.jsx 的 NAV_BODY 一一对应。 */
.campus[data-campus-nav="inline"]{--campus-header-h:84px;--campus-body-top:112px;}
.campus[data-campus-nav="rail"]{--campus-body-top:54px;--campus-body-left:268px;--campus-body-right:72px;}
/* 纯色填充:深色块全部退回校色实底,底色与装饰不变 */
.campus[data-campus-fill="solid"]{
  --campus-fill:var(--theme-accent);
  --campus-fill-deep:var(--theme-accent);
  --campus-fill-bar:var(--theme-accent);
  --campus-fill-soft:rgb(var(--theme-accent-rgb) / .4);
}
/* 校色本身是金 / 橙 / 黄色系时(data-campus-spark="cool"),暖金点缀色与校色糊在一起:
   点缀色和特色页的第二色整组换成与校色拉开的冷调银蓝(同样三级明暗),其余 token 不变。
   选择器比 .campus 多一个属性,不受 feature-a / feature-b token 区块注入顺序影响。 */
.campus[data-campus-spark="cool"]{
  --campus-spark:#8fa8c2;
  --campus-spark-soft:rgb(143 168 194 / .24);
  --campus-spark-hi:#e3ebf3;
  --campus-spark-lo:#5f7891;
  --campus-spark-deep:#3f5266;
  --campus-spark-glow:rgb(63 82 102 / .3);
  --campus-spark-haze:rgb(143 168 194 / .38);
  --campus-spark-fade:rgb(143 168 194 / 0);
  --campus-gold-hi:#e6edf4;
  --campus-gold:#9fb5cb;
  --campus-gold-lo:#647d97;
  --campus-gold-deep:#3f5266;
  --campus-gold-ink:#4b6079;
  --campus-gold-rgb:159 181 203;
  --campus-gold-wash:linear-gradient(135deg,rgb(159 181 203 / .08) 0%,rgb(159 181 203 / .22) 100%);
  --campus-gold-tint:rgb(159 181 203 / .22);
  --campus-gold-line:rgb(159 181 203 / .6);
}
/* 零优先级的 margin 归零:页面自己的类可以直接覆盖 */
:where(.campus) :where(h1,h2,h3,p){margin:0;}
.campus-serif{font-family:var(--theme-font-serif);}

/* —— 卡片与色块语言 —— */
/* 白卡:投影与发丝边画在 ::before 上(z-index:-1,压在卡片内容之下) */
.campus-card{position:relative;isolation:isolate;background:transparent;border-radius:var(--campus-radius);}
.campus-card::before{content:'';position:absolute;inset:0;z-index:-1;border-radius:inherit;background:var(--theme-surface);border:1px solid var(--campus-card-edge);box-shadow:var(--campus-shadow);pointer-events:none;}
.campus-wash{background:var(--campus-wash);border-radius:var(--campus-radius-sm);}
.campus-solid{background:var(--campus-fill);color:var(--theme-on-accent);}
/* 渐变标签:小节名、栏目名(胶囊形);is-soft 浅校色底 */
.campus-chip{display:inline-flex;align-items:center;height:38px;padding:0 18px;border-radius:999px;background:var(--campus-fill);color:var(--theme-on-accent);font-size:19px;font-weight:700;letter-spacing:.06em;line-height:1;white-space:nowrap;box-shadow:0 6px 14px rgb(var(--theme-accent-rgb) / .22);}
.campus-chip.is-soft{background:var(--campus-accent-tint);color:var(--theme-accent);box-shadow:none;}
/* 栏目行:渐变标签 + 渐隐延伸线 */
.campus-label-row{display:flex;align-items:center;gap:18px;}
.campus-label-row::after{content:'';flex:1;height:2px;border-radius:1px;background:var(--campus-fade-line);}
/* LabelRow 用真实元素画延伸线(伪元素作 flex 子项时导出引擎拿不到它的位置,会画到行的左上角压住胶囊) */
.campus-label-line{flex:1;min-width:0;height:2px;border-radius:1px;background:var(--campus-fade-line);}
.campus-label-row.has-line::after{display:none;}
/* 渐变卡头:卡片顶部的校色条(上圆角跟随卡片) */
.campus-card-head{display:flex;align-items:center;gap:14px;min-height:58px;padding:0 24px;background:var(--campus-fill-deep);color:var(--theme-on-accent);border-radius:var(--campus-radius) var(--campus-radius) 0 0;font-size:24px;font-weight:700;letter-spacing:.06em;}
/* 衬线数字 */
.campus-num{font-family:var(--theme-font-serif);font-weight:700;font-variant-numeric:lining-nums tabular-nums;color:var(--theme-accent);line-height:1;}
/* 编号块:渐变圆角方块 + 衬线数字 + 柔和投影;is-soft 浅校色底 */
.campus-seal{flex:none;display:flex;align-items:center;justify-content:center;min-width:48px;height:48px;padding:0 10px;background:var(--campus-fill);color:var(--theme-on-accent);border-radius:var(--campus-radius-sm);box-shadow:0 6px 14px rgb(var(--theme-accent-rgb) / .24);font-family:var(--theme-font-serif);font-weight:700;font-size:25px;line-height:1;font-variant-numeric:lining-nums;white-space:nowrap;}
.campus-seal.is-soft{background:var(--campus-accent-tint);color:var(--theme-accent);box-shadow:none;}
/* 菱形点:清单条目前的渐变小菱形;is-spark 用点缀色 */
.campus-mark{flex:none;width:11px;height:11px;border-radius:2px;background:var(--campus-fill);transform:rotate(45deg);}
.campus-mark.is-spark{background:var(--campus-spark);}
/* 照片框:白底大圆角 + 内边距 + 柔和投影,媒体槽放在里面 */
.campus-photo{position:relative;isolation:isolate;border-radius:var(--campus-radius);padding:10px;}
.campus-photo::before{content:'';position:absolute;inset:0;z-index:-1;border-radius:inherit;background:var(--theme-surface);border:1px solid var(--campus-card-edge);box-shadow:var(--campus-shadow);}
.campus-photo .media-slot{border-radius:calc(var(--campus-radius) - 6px)!important;}

/* —— 媒体槽空态:浅校色渐变底 + 校色细框,和页面同色系 —— */
.campus .media-slot:not(.is-filled){background:var(--campus-wash);box-shadow:inset 0 0 0 1.5px var(--campus-accent-line);}
.campus .media-slot:not(.is-filled) .media-slot-label{color:var(--campus-accent-soft);font-size:24px;font-weight:600;letter-spacing:.12em;}
.campus .media-slot:not(.is-filled) .media-slot-hint{color:var(--theme-faint);font-size:18px;}

@keyframes campus-rise{from{opacity:0;translate:0 22px;}to{opacity:1;translate:0 0;}}
@keyframes campus-fade{from{opacity:0;}to{opacity:1;}}
@keyframes campus-grow{from{scale:1 0;}to{scale:1 1;}}
@keyframes campus-draw{from{scale:0 1;}to{scale:1 1;}}
@media (prefers-reduced-motion:no-preference){
  [data-deck-active] .campus-rise{animation:campus-rise 560ms cubic-bezier(.2,.7,.2,1) both;animation-delay:var(--enter-delay,0ms);}
  [data-deck-active] .campus-fade{animation:campus-fade 620ms ease both;animation-delay:var(--enter-delay,0ms);}
  [data-deck-active] .campus-grow{transform-origin:50% 100%;animation:campus-grow 700ms cubic-bezier(.2,.8,.2,1) both;animation-delay:var(--enter-delay,0ms);}
  [data-deck-active] .campus-draw{transform-origin:0 50%;animation:campus-draw 560ms cubic-bezier(.2,.8,.2,1) both;animation-delay:var(--enter-delay,0ms);}
}

/* —— 南昌主题覆盖:深色赣江蓝底 + 霓虹青/赤金高亮。内部仍复用 campus 组件类,保证页面契约稳定。 —— */
.campus[data-camp-theme="nanchang"]{
  --theme-accent-rgb:0 217 198;
  --theme-accent:rgb(var(--theme-accent-rgb));
  --theme-on-accent:#f7fbff;
  --theme-bg:#06101f;
  --theme-surface:#0e1c32;
  --theme-ink:#f4f8ff;
  --theme-muted:rgb(226 238 255 / .78);
  --theme-faint:rgb(226 238 255 / .54);
  --theme-line:rgb(226 238 255 / .15);
  --campus-accent-hi:rgb(58 255 236);
  --campus-accent-lo:rgb(5 88 137);
  --campus-accent-wash:rgb(0 217 198 / .1);
  --campus-accent-tint:rgb(0 217 198 / .17);
  --campus-accent-line:rgb(0 217 198 / .42);
  --campus-accent-soft:rgb(104 241 224 / .9);
  --campus-on-accent-muted:rgb(247 251 255 / .78);
  --campus-on-accent-line:rgb(247 251 255 / .28);
  --campus-on-accent-glass:rgb(247 251 255 / .14);
  --campus-shade:rgb(0 0 0 / .34);
  --campus-paper:#0b1830;
  --campus-neutral:rgb(226 238 255 / .52);
  --campus-neutral-soft:rgb(226 238 255 / .2);
  --campus-neutral-wash:rgb(226 238 255 / .07);
  --campus-neutral-fill:linear-gradient(135deg,rgb(226 238 255 / .12) 0%,rgb(226 238 255 / .04) 100%);
  --campus-spark:#ffb84a;
  --campus-spark-soft:rgb(255 184 74 / .25);
  --campus-fill:linear-gradient(135deg,#07559a 0%,#00d9c6 57%,#ffb84a 100%);
  --campus-fill-deep:linear-gradient(160deg,#0b2041 0%,#0a6bff 62%,#00d9c6 100%);
  --campus-fill-bar:linear-gradient(180deg,#0a6bff 0%,#00d9c6 58%,#ffb84a 100%);
  --campus-fill-soft:linear-gradient(180deg,rgb(0 217 198 / .28) 0%,rgb(10 107 255 / .42) 100%);
  --campus-wash:linear-gradient(135deg,rgb(0 217 198 / .08) 0%,rgb(10 107 255 / .16) 100%);
  --campus-fade-line:linear-gradient(90deg,rgb(0 217 198 / .7) 0%,rgb(0 217 198 / 0) 100%);
  --campus-page-bg:radial-gradient(circle at 88% 2%,rgb(0 217 198 / .2) 0%,rgb(0 217 198 / 0) 34%),radial-gradient(circle at 4% 94%,rgb(10 107 255 / .2) 0%,rgb(10 107 255 / 0) 38%),linear-gradient(145deg,#06101f 0%,#0b1f3a 100%);
  --campus-shadow:0 18px 46px rgb(0 0 0 / .38),0 0 0 1px rgb(0 217 198 / .08);
  --campus-shadow-lift:0 12px 28px rgb(0 0 0 / .46),0 0 26px rgb(0 217 198 / .16);
  --campus-card-edge:rgb(0 217 198 / .18);
  --campus-tone-1:#00d9c6;
  --campus-tone-2:#0a6bff;
  --campus-tone-3:#ffb84a;
  --campus-tone-4:#f25555;
  --campus-tone-5:#8b5cf6;
  --campus-tone-6:rgb(226 238 255 / .36);
  background-color:var(--theme-bg);
  background-image:var(--campus-page-bg),linear-gradient(90deg,rgb(255 255 255 / .025) 1px,transparent 1px),linear-gradient(0deg,rgb(255 255 255 / .025) 1px,transparent 1px);
  background-size:auto,48px 48px,48px 48px;
}
.campus[data-camp-theme="nanchang"]::before{content:'';position:absolute;inset:0;z-index:0;pointer-events:none;background:linear-gradient(118deg,transparent 0 38%,rgb(0 217 198 / .08) 38.1% 38.3%,transparent 38.4% 100%),linear-gradient(24deg,transparent 0 66%,rgb(10 107 255 / .06) 66.1% 66.3%,transparent 66.4% 100%);mix-blend-mode:screen;}
.campus[data-camp-theme="nanchang"]::after{content:'';position:absolute;z-index:0;right:-180px;bottom:-300px;width:900px;height:620px;border:2px solid rgb(0 217 198 / .16);border-left-color:transparent;border-radius:52% 48% 0 0;transform:rotate(-12deg);pointer-events:none;box-shadow:0 0 34px rgb(0 217 198 / .08);}
.campus[data-camp-theme="nanchang"] .campus-header,
.campus[data-camp-theme="nanchang"] .campus-top.is-light .campus-top-bg,
.campus[data-camp-theme="nanchang"] .campus-top.is-folder .campus-top-bg{background:linear-gradient(180deg,rgb(11 31 58 / .96) 0%,rgb(6 16 31 / .98) 100%);box-shadow:0 8px 28px rgb(0 0 0 / .28);}
.campus[data-camp-theme="nanchang"] .campus-header-note,
.campus[data-camp-theme="nanchang"] .campus-tab,
.campus[data-camp-theme="nanchang"] .campus-inline-item,
.campus[data-camp-theme="nanchang"] .campus-top-item{color:var(--theme-muted);}
.campus[data-camp-theme="nanchang"] .campus-tabs,
.campus[data-camp-theme="nanchang"] .campus-inline-nav{background:rgb(0 217 198 / .1);}
`;

// 给页面组件套上主题外壳。所有页面都经 runtime.jsx 的 definePages 统一包裹,页面自身不处理 token。
// 根节点上的 data-campus-* 属性来自 deck 级 brand 的外观开关(填充风格、导航样式、标题装饰),
// CSS 与 kit 组件都只从这里读,页面不各自读取。
/**
 * 学校素材缺失时的 brand(只在 file:// 直接打开、切到 deck 里没带素材的学校时发生,见 schools/availability.mjs):
 * 把 school 当作未选(封面 / 目录退回通用版),去掉指向学校素材的 LOGO(页眉显示文字校徽),不出现破图。
 * 素材可用(或不是 file://)时原样返回同一个对象。
 */
function useSchoolAssetGuard(brand) {
  const key = typeof brand?.school === 'string' ? brand.school.trim() : '';
  const [, bump] = React.useState(0);
  React.useEffect(() => {
    if (!key) return undefined;
    const off = subscribeSchoolAssets(hit => { if (hit === key) bump(n => n + 1); });
    if (typeof brand?.logo === 'string' && SCHOOL_ASSET_PREFIX_RE.test(brand.logo)) probeSchoolAsset(key, brand.logo);
    return off;
  }, [key, brand?.logo]);
  return React.useMemo(() => {
    if (!key || !schoolAssetsMissing(key)) return brand;
    const logo = typeof brand.logo === 'string' && SCHOOL_ASSET_PREFIX_RE.test(brand.logo) ? '' : brand.logo;
    return { ...brand, school: '', logo };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [brand, key, key && schoolAssetsMissing(key)]);
}

export function withCampusBase(Component) {
  function CampusPage(props = {}) {
    // 注入顺序固定为 基座 → 外壳 → 部件 → 页面:页面样式总在 kit 之后,同优先级时页面覆盖 kit。
    useThemeStyle('campus-base-style', CAMPUS_BASE_CSS);
    useChromeStyle();
    usePartsStyle();
    // deck 的校色(goal 的 brand.accent 或预览工作台里选的)先经规整再覆盖基座默认的高亮色;
    // 规整后的校色是金 / 橙 / 黄色系时,点缀色换成冷调(data-campus-spark="cool")。
    const deckBrand = React.useContext(DeckBrandContext);
    const brand = useSchoolAssetGuard(deckBrand);
    const accent = React.useMemo(() => campusAccent(brand?.accent), [brand?.accent]);
    // 页面可以给根节点补充属性(学校定制封面 / 目录的导出标记 data-campus-native-*,见 schools/dispatch.jsx)
    const extra = typeof Component.campusRootAttrs === 'function' ? Component.campusRootAttrs(props, brand) : null;
    return React.createElement('div', {
      className: 'campus',
      'data-camp-theme': 'nanchang',
      style: accent ? { '--theme-accent-rgb': accent.rgb } : undefined,
      'data-campus-spark': accent?.warm ? 'cool' : undefined,
      'data-campus-fill': deckBrandStyle(brand, 'fill'),
      'data-campus-nav': deckBrandStyle(brand, 'nav'),
      'data-campus-title': deckBrandStyle(brand, 'titleStyle'),
      ...(extra || {}),
    }, brand === deckBrand
      ? React.createElement(Component, props)
      : React.createElement(DeckBrandContext.Provider, { value: brand }, React.createElement(Component, props)));
  }
  CampusPage.displayName = `Campus(${Component.displayName || Component.name || 'Page'})`;
  return CampusPage;
}

/** deck 的校色 → 实际使用的校色("r g b")与是否暖色系;没有设置或无法识别时返回 null(用基座默认值)。 */
export function campusAccent(value) {
  if (!value) return null;
  const guarded = guardAccent(value, CAMPUS_ACCENT_GUARD);
  if (!guarded.ok) return null;
  return { rgb: guarded.rgb, hex: guarded.hex, adjusted: guarded.adjusted, warm: isWarmAccent(guarded.rgb) };
}

/* ── feature-a 页新增(特色页 A 组:立体柱、大数字、舞台卡片、环形轨道、卷轴) ──
   立体 / 玻璃图形需要不透明的明暗面:受光面用浅校色、背光面用更深的校色;第二色只用点缀金(同一个暖金的三级明暗)。
   由 kit/feature-a.jsx 的 useFeatureAStyle() 注入,只有用到这组页面时才生效。 */
export const CAMPUS_FEATURE_A_TOKENS_CSS = `
.campus{
  --campus-accent-pale:color-mix(in srgb,rgb(var(--theme-accent-rgb)) 18%,#ffffff);
  --campus-accent-mist:color-mix(in srgb,rgb(var(--theme-accent-rgb)) 7%,#ffffff);
  --campus-accent-deep:rgb(from rgb(var(--theme-accent-rgb)) calc(r * .42) calc(g * .42) calc(b * .42));
  --campus-accent-steel:color-mix(in srgb,rgb(var(--theme-accent-rgb)) 26%,#8a90a0);
  --campus-spark-hi:#fbe2a6;
  --campus-spark-lo:#c27d1f;
  --campus-spark-deep:#8e5913;
  --campus-spark-glow:rgb(194 125 31 / .32);
  --campus-spark-haze:rgb(232 168 56 / .35);
  --campus-spark-fade:rgb(232 168 56 / 0);
  --campus-fill-gold:linear-gradient(135deg,var(--campus-spark-lo) 0%,var(--campus-spark) 52%,var(--campus-spark-hi) 100%);
  --campus-glass:linear-gradient(160deg,rgb(255 255 255 / .96) 0%,rgb(255 255 255 / .72) 100%);
  --campus-glass-edge:rgb(255 255 255 / .95);
  --campus-on-gold:#ffffff;
}
.campus[data-campus-fill="solid"]{--campus-fill-gold:var(--campus-spark);}
`;

/* ── feature-b 特色页新增(kit/feature-b.jsx 注入)──
 * 特色页的大图形用「校色 + 暖金」双色:暖金是点缀色 --campus-spark 的同色系深浅,只在特色页的立体图形、
 * 第二组标签上作第二色,常规页仍只把 --campus-spark 用于小标记。
 * 另补两档按白色稀释的校色(mist / pale),用于玻璃感图形的浅色块;深一档的 deep 用于立体图形的背光面。
 * 合并时改名:mist / pale / glass / glass-edge 和 feature-a 区块同名但取值不同,两组页面同在一份稿子里会互相覆盖,
 * 所以本组这四个改用 --campus-fb-* 前缀;--campus-accent-deep 两组取值相同,保留同名。 */
export const CAMPUS_FEATURE_B_CSS = `
.campus{
  --campus-gold-hi:#f7dc9e;
  --campus-gold:#e2a64c;
  --campus-gold-lo:#a96e27;
  --campus-gold-deep:#7f5016;
  --campus-gold-ink:#9a621f;
  --campus-gold-rgb:226 166 76;
  --campus-gold-fill:linear-gradient(135deg,var(--campus-gold-lo) 0%,var(--campus-gold) 50%,var(--campus-gold-hi) 100%);
  --campus-gold-wash:linear-gradient(135deg,rgb(226 166 76 / .05) 0%,rgb(226 166 76 / .16) 100%);
  --campus-gold-tint:rgb(226 166 76 / .16);
  --campus-gold-line:rgb(226 166 76 / .45);
  --campus-accent-deep:rgb(from rgb(var(--theme-accent-rgb)) calc(r * .42) calc(g * .42) calc(b * .42));
  --campus-fb-accent-mist:color-mix(in srgb,rgb(var(--theme-accent-rgb)) 52%,#ffffff);
  --campus-fb-accent-pale:color-mix(in srgb,rgb(var(--theme-accent-rgb)) 20%,#ffffff);
  --campus-fb-glass:rgb(255 255 255 / .62);
  --campus-fb-glass-edge:rgb(255 255 255 / .9);
}
.campus[data-campus-fill="solid"]{--campus-gold-fill:var(--campus-gold);}
`;

/* ── g3 数据与实验页新增(kit/data.jsx 注入)──
 * 热力图、问卷条这类「按数值调透明度」的图形需要一个中性墨色的 RGB 三元组:
 * 正值 / 认同侧用 rgb(var(--theme-accent-rgb) / a),负值 / 不认同侧用 rgb(var(--campus-g3-ink-rgb) / a)。
 * 取值与 --theme-ink 同一个墨色(不随校色变化)。 */
export const CAMPUS_G3_DATA_CSS = `
.campus{
  --campus-g3-ink-rgb:27 29 42;
}
`;

/* ── g5 特色页 C 组(递进与路径:领奖台、道路、山峰、靶心、漏斗、拼图)新增 ──
 * 由 kit/feature-c.jsx 的 useFeatureCStyle() 注入(同时注入 feature-b 区块的暖金 / 玻璃 token)。
 * steel:旗杆、金属件的冷灰(带一点校色);haze:按白色稀释三成多的校色,介于 fb-accent-pale 与 fb-accent-mist 之间,
 * 用于远处的山、玻璃台面这类「浅但看得出校色」的面;sky:几乎是白的校色,画远景天光。 */
export const CAMPUS_FEATURE_C_CSS = `
.campus{
  --campus-g5-steel:color-mix(in srgb,rgb(var(--theme-accent-rgb)) 22%,#9aa0ae);
  --campus-g5-haze:color-mix(in srgb,rgb(var(--theme-accent-rgb)) 34%,#ffffff);
  --campus-g5-sky:color-mix(in srgb,rgb(var(--theme-accent-rgb)) 6%,#ffffff);
}
`;
