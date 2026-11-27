// campus 的「证据型」页面部件:子图角标、图号图注、长结论标题头、设备外框(手机 / 浏览器)、指标方向箭头、公式排版。
// 用在多图网格、结论式大图、界面截图网格、实验对比、公式 + 符号说明这几页,也可以给以后的页面复用。
//
// 与 parts.jsx 一样只读 token;装饰形状(设备外框、角标底、箭头)都画在不含文字的元素上或本身就是带文字的圆角色块,
// 不用 clip-path 包住文字,导出 PPTX 时文字仍是可编辑文本。
import React from 'react';
import { useThemeStyle } from '../../../shared/style.jsx';
import { ChapterNav, useCampusLayout, TitleMark, TitleTail, SparkStar } from './chrome.jsx';

const EVIDENCE_CSS = `
/* —— 子图角标:压在图片左上角的渐变小牌,(a)(b)… —— */
.cp-ev-tag{position:absolute;z-index:2;top:8px;left:8px;display:flex;align-items:center;height:30px;padding:0 10px;border-radius:8px 8px 8px 3px;background:var(--campus-fill);color:var(--theme-on-accent);font-family:var(--theme-font-serif);font-weight:700;font-size:18px;line-height:1;letter-spacing:.02em;white-space:nowrap;box-shadow:0 4px 10px rgb(var(--theme-accent-rgb) / .28);pointer-events:none;font-variant-numeric:lining-nums;}
.cp-ev-tag.is-soft{background:var(--theme-surface);color:var(--theme-accent);box-shadow:0 2px 8px rgb(0 0 0 / .14);}

/* —— 图号图注:渐变胶囊图号 + 一句图注 —— */
.cp-ev-cap{display:flex;align-items:center;gap:14px;min-width:0;}
.cp-ev-cap .campus-seal{height:34px;min-width:0;padding:0 14px;font-size:19px;border-radius:999px;}
.cp-ev-cap-text{min-width:0;font-size:20px;line-height:1.4;color:var(--theme-muted);}

/* —— 指标方向箭头(↑ 越高越好 / ↓ 越低越好):SVG 形状,不是文字 —— */
.cp-ev-dir{flex:none;display:block;}

/* —— 长结论标题头:沿用标题行的三种编号装饰,标题可占两行,右侧「结果 N」徽标与连排页码 —— */
.cp-ev-fhead{flex:none;display:flex;flex-direction:column;margin-bottom:22px;}
.cp-ev-fhead-main{display:flex;align-items:center;gap:22px;min-height:60px;}
.cp-ev-fhead .campus-title-row{height:auto;margin:0;flex:none;}
.cp-ev-fhead-title{flex:1;min-width:0;font-family:var(--theme-font-serif);font-weight:700;font-size:40px;line-height:1.32;letter-spacing:.03em;color:var(--theme-ink);text-wrap:balance;}
.cp-ev-fhead-badge{flex:none;display:flex;flex-direction:column;align-items:center;gap:8px;}
.cp-ev-fhead-kicker{display:flex;align-items:center;gap:8px;height:46px;padding:0 20px 0 16px;border-radius:12px 12px 12px 4px;background:var(--campus-fill);color:var(--theme-on-accent);box-shadow:var(--campus-shadow-lift);white-space:nowrap;}
.cp-ev-fhead-kicker-text{font-family:var(--theme-font-serif);font-weight:700;font-size:25px;line-height:1;letter-spacing:.08em;}
.cp-ev-fhead-star{flex:none;display:block;color:var(--campus-spark);}
.cp-ev-fhead-count{font-family:var(--theme-font-serif);font-weight:700;font-size:19px;line-height:1;letter-spacing:.12em;color:var(--campus-accent-soft);white-space:nowrap;font-variant-numeric:lining-nums;}
.cp-ev-fhead-tail{display:flex;align-items:center;gap:20px;margin-top:14px;min-height:20px;}
.cp-ev-fhead-tail .campus-title-tail{flex:1;}
.cp-ev-fhead-tail.is-bar .campus-title-tail{flex-direction:column;align-items:stretch;justify-content:center;gap:5px;}
.cp-ev-fhead-tail.is-bar .campus-title-line.is-thick{flex:none;width:140px;height:5px;border-radius:3px;background:var(--campus-fill);}
.cp-ev-fhead-tail.is-bar .campus-title-line.is-thin{flex:none;height:1.5px;}
.cp-ev-fhead-tail.is-wing .campus-title-tail{gap:10px;}
.cp-ev-fhead-tail.is-wing .campus-title-dot{flex:none;width:10px;height:10px;border-radius:50%;background:var(--campus-spark);}
.cp-ev-fhead-tail.is-wing .campus-title-dot.is-ring{width:14px;height:14px;background:transparent;border:2px solid var(--campus-accent-line);}
.cp-ev-fhead-tail.is-wing .campus-title-wing{flex:none;width:96px;height:4px;border-radius:2px;background:var(--campus-fill);clip-path:polygon(0 0,100% 30%,100% 70%,0 100%);}

/* —— 设备外框:手机(校色渐变机身 + 灵动岛)、浏览器窗口(渐变标题栏 + 三个圆点 + 地址栏)、无外框 —— */
.cp-ev-dev{position:relative;isolation:isolate;display:flex;flex-direction:column;min-width:0;min-height:0;}
.cp-ev-dev-screen{position:relative;flex:1;min-height:0;overflow:hidden;}
.cp-ev-dev-screen .media-slot{border-radius:inherit!important;}
.cp-ev-dev.is-phone{padding:var(--cp-ev-bezel,11px);border-radius:var(--cp-ev-phone-r,38px);}
.cp-ev-dev.is-phone > .cp-ev-dev-shape{position:absolute;inset:0;z-index:-1;border-radius:inherit;background:var(--campus-fill-deep);box-shadow:var(--campus-shadow-lift);}
.cp-ev-dev.is-phone > .cp-ev-dev-rim{position:absolute;inset:3px;z-index:-1;border-radius:calc(var(--cp-ev-phone-r,38px) - 3px);border:1.5px solid rgb(255 255 255 / .22);pointer-events:none;}
.cp-ev-dev.is-phone > .cp-ev-dev-key{position:absolute;right:-3px;width:4px;border-radius:0 3px 3px 0;background:var(--campus-accent-lo);}
.cp-ev-dev.is-phone .cp-ev-dev-screen{border-radius:calc(var(--cp-ev-phone-r,38px) - var(--cp-ev-bezel,11px));background:var(--theme-surface);}
.cp-ev-dev-island{position:absolute;z-index:3;top:calc(var(--cp-ev-bezel,11px) + 9px);left:50%;width:30%;max-width:96px;height:16px;margin-left:min(-15%,-48px);border-radius:10px;background:var(--theme-ink);pointer-events:none;}
.cp-ev-dev.is-browser{border-radius:14px;}
.cp-ev-dev.is-browser::before{content:'';position:absolute;inset:0;z-index:-1;border-radius:inherit;background:var(--theme-surface);border:1px solid var(--campus-card-edge);box-shadow:var(--campus-shadow);}
.cp-ev-dev-bar{position:relative;flex:none;display:flex;align-items:center;gap:8px;height:var(--cp-ev-bar,34px);padding:0 14px;border-radius:14px 14px 0 0;background:var(--campus-fill-deep);}
.cp-ev-dev-dot{flex:none;width:11px;height:11px;border-radius:50%;background:rgb(255 255 255 / .5);}
.cp-ev-dev-dot.is-spark{background:var(--campus-spark);}
.cp-ev-dev-url{flex:1;max-width:46%;height:16px;margin-left:12px;border-radius:8px;background:var(--campus-on-accent-glass);}
.cp-ev-dev.is-browser .cp-ev-dev-screen{margin:0 1px 1px;border-radius:0 0 13px 13px;background:var(--theme-surface);}
.cp-ev-dev.is-plain{padding:8px;border-radius:var(--campus-radius);}
.cp-ev-dev.is-plain::before{content:'';position:absolute;inset:0;z-index:-1;border-radius:inherit;background:var(--theme-surface);border:1px solid var(--campus-card-edge);box-shadow:var(--campus-shadow);}
.cp-ev-dev.is-plain .cp-ev-dev-screen{border-radius:calc(var(--campus-radius) - 6px);}

/* —— 公式:衬线字体,拉丁字母斜体,数字与运算符正体;上下标、分式、大型运算符都用行内排版(全部是 span,导出仍是文本) —— */
.cp-fx{font-family:var(--theme-font-serif);font-weight:500;line-height:1.5;color:var(--theme-ink);white-space:nowrap;font-variant-numeric:lining-nums;}
.cp-fx-v{font-style:italic;}
.cp-fx-o{margin:0 .22em;}
.cp-fx-p{margin-right:.18em;}
.cp-fx-fn{margin-right:.12em;}
.cp-fx-sub,.cp-fx-sup{font-size:.62em;line-height:1;}
.cp-fx-sub{vertical-align:-.36em;margin-left:.04em;}
.cp-fx-sup{vertical-align:.62em;margin-left:.04em;}
.cp-fx-ss{display:inline-flex;flex-direction:column;justify-content:center;vertical-align:middle;margin-left:.04em;line-height:1;}
.cp-fx-ss > .cp-fx-sub,.cp-fx-ss > .cp-fx-sup{vertical-align:baseline;margin-left:0;}
.cp-fx-ss > .cp-fx-sup{margin-bottom:.1em;}
.cp-fx-frac{display:inline-flex;flex-direction:column;align-items:center;vertical-align:middle;margin:0 .12em;font-size:.9em;line-height:1.15;}
.cp-fx-num{padding:0 .18em .08em;}
.cp-fx-den{padding:.1em .18em 0;border-top:.07em solid currentColor;align-self:stretch;text-align:center;}
.cp-fx-big{display:inline-flex;flex-direction:column;align-items:center;vertical-align:middle;margin:0 .14em 0 .06em;line-height:1;}
.cp-fx-bigop{font-size:1.6em;line-height:1.05;font-style:normal;}
.cp-fx-lim{font-size:.58em;line-height:1.1;}
.cp-fx-bigside{font-size:1.5em;line-height:1;vertical-align:-.16em;margin-right:.04em;}
.cp-fx-sqrt-sign{font-size:1.1em;}
.cp-fx-sqrt{padding:0 .1em;border-top:.07em solid currentColor;}
.cp-fx-bar{border-top:.06em solid currentColor;padding-top:.02em;}
.cp-fx-b{font-weight:700;}
.cp-fx-hl{padding:.02em .2em .06em;margin:0 .06em;border-radius:.24em;background:var(--campus-accent-tint);color:var(--theme-accent);box-shadow:0 0 0 .06em var(--campus-accent-line);-webkit-box-decoration-break:clone;box-decoration-break:clone;}
.cp-fx-t{font-style:normal;}
/* 直接带字的行内元素一律 line-height:1(数字、括号也包在 .cp-fx-n 里),行盒高度仍由外层 .cp-fx 的 1.5 撑开,网页排版不变。
   导出 PPTX 时每段字是一个独立文本框、行距取自己的 line-height:底字按 1.5 倍、下标按 1 倍排,
   PowerPoint / WPS 会把底字基线压低半个多行距,下标反而比底字基线高,看起来像上标。 */
.cp-fx-v,.cp-fx-t,.cp-fx-fn,.cp-fx-o,.cp-fx-p,.cp-fx-n,.cp-fx-sqrt-sign{line-height:1;}
`;

export function useEvidenceStyle() {
  useThemeStyle('campus-evidence-style', EVIDENCE_CSS);
}

/** 子图角标:放在 position:relative 的图框里,压在左上角。soft=true 用白底校色字(深色图片上更清楚时)。 */
export function FigureTag({ children, soft = false, className = '', style }) {
  useEvidenceStyle();
  if (children == null || children === '') return null;
  return <div className={`cp-ev-tag${soft ? ' is-soft' : ''} ${className}`} style={style}>{children}</div>;
}

/** 图号图注:渐变胶囊图号 + 一句图注,两段各自是可编辑文本。no 为空时只显示图注。 */
export function FigureCaption({ no, text, className = '', style }) {
  useEvidenceStyle();
  return (
    <div className={`cp-ev-cap ${className}`} style={style}>
      {no ? <div className="campus-seal">{no}</div> : null}
      {text ? <div className="cp-ev-cap-text">{text}</div> : null}
    </div>
  );
}

/** 指标方向箭头:dir='high' 画向上箭头(越高越好),'low' 画向下箭头(越低越好),其他值不画。纯装饰,不是文字。 */
export function DirArrow({ dir, size = 18, className = '', style }) {
  useEvidenceStyle();
  if (dir !== 'high' && dir !== 'low') return null;
  const up = dir === 'high';
  return (
    <svg className={`cp-ev-dir ${className}`} style={style} width={size} height={size} viewBox="0 0 18 18" aria-hidden="true">
      <g transform={up ? undefined : 'rotate(180 9 9)'}>
        <path d="M9 15.5 V3.5" stroke="currentColor" strokeWidth="2.4" fill="none" strokeLinecap="round" />
        <path d="M4 8.2 L9 3 L14 8.2" stroke="currentColor" strokeWidth="2.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </svg>
  );
}

/**
 * 设备外框。kind:
 *   'phone'   手机:校色渐变机身 + 灵动岛 + 侧键,屏幕圆角
 *   'browser' 浏览器窗口:渐变标题栏(三个圆点 + 地址栏)+ 白底窗口
 *   'plain'   无外框:白底圆角相框(campus-photo 的质感)
 * children 放媒体槽;外框只是装饰,没有文字。外框尺寸由调用方给(style 的 width / height)。
 */
export function DeviceFrame({ kind = 'plain', className = '', style, children }) {
  useEvidenceStyle();
  if (kind === 'phone') {
    return (
      <div className={`cp-ev-dev is-phone ${className}`} style={style}>
        <div className="cp-ev-dev-shape" aria-hidden="true" />
        <div className="cp-ev-dev-rim" aria-hidden="true" />
        <div className="cp-ev-dev-key" style={{ top: '18%', height: '9%' }} aria-hidden="true" />
        <div className="cp-ev-dev-key" style={{ top: '30%', height: '6%' }} aria-hidden="true" />
        <div className="cp-ev-dev-screen">{children}</div>
        <div className="cp-ev-dev-island" aria-hidden="true" />
      </div>
    );
  }
  if (kind === 'browser') {
    return (
      <div className={`cp-ev-dev is-browser ${className}`} style={style}>
        <div className="cp-ev-dev-bar" aria-hidden="true">
          <div className="cp-ev-dev-dot is-spark" />
          <div className="cp-ev-dev-dot" />
          <div className="cp-ev-dev-dot" />
          <div className="cp-ev-dev-url" />
        </div>
        <div className="cp-ev-dev-screen">{children}</div>
      </div>
    );
  }
  return (
    <div className={`cp-ev-dev is-plain ${className}`} style={style}>
      <div className="cp-ev-dev-screen">{children}</div>
    </div>
  );
}

/**
 * 长结论标题头:一句完整结论当标题(可占两行),左侧是与普通标题行相同的小节编号装饰(随 brand.titleStyle),
 * 右侧是「结果 N」徽标和连排页码(如 1 / 3);标题下方是同款的渐隐延伸线,
 * 「标题行内嵌」导航时章节胶囊画在延伸线右端。
 *   no        小节编号(为空时不画编号装饰)
 *   kicker    徽标文字,如「结果 1」(为空时不画徽标)
 *   counter   连排页码,如「1 / 3」(为空时不画)
 *   chapterIndex 当前章节(内嵌导航用)
 */
export function FindingTitle({ no, title, kicker, counter, chapterIndex = 1, className = '', style }) {
  useEvidenceStyle();
  const layout = useCampusLayout();
  const kind = layout.titleStyle;
  return (
    <div className={`cp-ev-fhead ${className}`} style={style}>
      <div className="cp-ev-fhead-main">
        {no ? <div className={`campus-title-row is-${kind}`}><TitleMark no={no} variant={kind} /></div> : null}
        <h2 className="cp-ev-fhead-title">{title}</h2>
        {kicker || counter ? (
          <div className="cp-ev-fhead-badge">
            {kicker ? (
              <div className="cp-ev-fhead-kicker">
                <SparkStar size={20} className="cp-ev-fhead-star" />
                <div className="cp-ev-fhead-kicker-text">{kicker}</div>
              </div>
            ) : null}
            {counter ? <div className="cp-ev-fhead-count">{counter}</div> : null}
          </div>
        ) : null}
      </div>
      <div className={`cp-ev-fhead-tail is-${kind}`}>
        <TitleTail variant={kind} />
        {layout.nav === 'inline' && <ChapterNav chapterIndex={chapterIndex} variant="inline" />}
      </div>
    </div>
  );
}

/* ———————————————————— 公式排版 ————————————————————
 * 写法是 LaTeX 的一个小子集,适合 AI 直接生成:
 *   上下标     x_i  x^2  x_{ij}  x^{2k}  x_i^2(上下标同时出现时上下对齐)
 *   分式       \frac{a}{b}
 *   根号       \sqrt{x}
 *   高亮       \hl{…}           关键项加校色浅底(如新增的项)
 *   正体文字   \text{…}         单位、中文、缩写(SSIM)
 *   加粗       \mathbf{x}       向量、矩阵
 *   帽子 / 横线 \hat{x}  \bar{x}  \tilde{x}
 *   大型运算符 \sum_{i=1}^{n}  \prod  \int  \oint(求和与连乘的上下限排在符号上下,积分排在右侧)
 *   希腊字母与符号 \alpha … \omega  \nabla  \partial  \odot  \cdot  \times  \le  \ge  \approx  \in  \|(范数双竖线)…
 *   函数名     \log  \exp  \max  \min  \arg  \softmax …(正体)
 *   空白       \,  \;  \quad(普通空格会被忽略)
 * 拉丁字母自动斜体,数字、括号、运算符正体;- 自动换成减号 −。也可以直接写 Unicode 符号(Σ、∇、‖、≤)。
 * 不认识的命令原样显示命令名,不会报错。
 */
const SYMBOLS = {
  alpha: 'α', beta: 'β', gamma: 'γ', delta: 'δ', epsilon: 'ϵ', varepsilon: 'ε', zeta: 'ζ', eta: 'η', theta: 'θ', vartheta: 'ϑ',
  iota: 'ι', kappa: 'κ', lambda: 'λ', mu: 'μ', nu: 'ν', xi: 'ξ', pi: 'π', rho: 'ρ', sigma: 'σ', tau: 'τ', upsilon: 'υ',
  phi: 'ϕ', varphi: 'φ', chi: 'χ', psi: 'ψ', omega: 'ω',
  Gamma: 'Γ', Delta: 'Δ', Theta: 'Θ', Lambda: 'Λ', Xi: 'Ξ', Pi: 'Π', Sigma: 'Σ', Upsilon: 'Υ', Phi: 'Φ', Psi: 'Ψ', Omega: 'Ω',
  nabla: '∇', partial: '∂', infty: '∞', ell: 'ℓ', hbar: 'ℏ', emptyset: '∅', prime: '′', degree: '°', angle: '∠',
};
const OPERATORS = {
  cdot: '·', times: '×', div: '÷', pm: '±', mp: '∓', odot: '⊙', otimes: '⊗', oplus: '⊕', circ: '∘', ast: '∗', star: '⋆',
  le: '≤', leq: '≤', ge: '≥', geq: '≥', ne: '≠', neq: '≠', approx: '≈', sim: '∼', simeq: '≃', equiv: '≡', propto: '∝',
  in: '∈', notin: '∉', subset: '⊂', subseteq: '⊆', supset: '⊃', cup: '∪', cap: '∩', perp: '⊥', parallel: '∥',
  to: '→', rightarrow: '→', leftarrow: '←', Rightarrow: '⇒', Leftarrow: '⇐', Leftrightarrow: '⇔', mapsto: '↦', gets: '←',
  ll: '≪', gg: '≫', forall: '∀', exists: '∃', land: '∧', lor: '∨', neg: '¬', setminus: '∖',
};
const PUNCT = {
  '|': '‖', Vert: '‖', lVert: '‖', rVert: '‖', vert: '|', lvert: '|', rvert: '|', mid: '∣', langle: '⟨', rangle: '⟩',
  lfloor: '⌊', rfloor: '⌋', lceil: '⌈', rceil: '⌉', '{': '{', '}': '}', '%': '%', '#': '#', '&': '&', '_': '_', '$': '$',
  cdots: '⋯', ldots: '…', dots: '…', vdots: '⋮',
};
const BIG_OPS = { sum: '∑', prod: '∏', coprod: '∐', bigcup: '⋃', bigcap: '⋂', int: '∫', iint: '∬', iiint: '∭', oint: '∮' };
const SIDE_LIMIT_OPS = new Set(['int', 'iint', 'iiint', 'oint']);
const SPACES = { ',': ' ', ':': ' ', ';': ' ', ' ': ' ', quad: ' ', qquad: '  ', '!': '' };
const FUNCTIONS = new Set(['sin', 'cos', 'tan', 'cot', 'sec', 'csc', 'arcsin', 'arccos', 'arctan', 'sinh', 'cosh', 'tanh', 'log', 'ln', 'lg', 'exp',
  'max', 'min', 'arg', 'argmax', 'argmin', 'sup', 'inf', 'lim', 'det', 'dim', 'ker', 'deg', 'gcd', 'Pr', 'tr', 'sgn', 'sign', 'softmax', 'sigmoid', 'ReLU', 'mod']);
const ACCENTS = { hat: '̂', tilde: '̃', dot: '̇', ddot: '̈', vec: '⃗', check: '̌' };
const IGNORED = new Set(['left', 'right', 'big', 'Big', 'bigg', 'Bigg', 'bigl', 'bigr', 'Bigl', 'Bigr', 'displaystyle', 'limits', 'nolimits', 'mathit', 'mathrm', 'operatorname']);
const OP_CHARS = new Set(['+', '−', '=', '<', '>', '±', '×', '÷', '·', '⊙', '⊗', '⊕', '≤', '≥', '≠', '≈', '≡', '∝', '∈', '→', '←', '⇒', '⇔', '∼', '∗', '∘']);
const PUNCT_CHARS = new Set([',', ';', ':']);
const isLetter = ch => /[A-Za-z]/.test(ch);
const isDigit = ch => /[0-9.]/.test(ch);

/** 把公式标记解析成节点树(纯函数,无副作用;输入非字符串时返回空)。 */
export function parseFormula(source) {
  const src = typeof source === 'string' ? source : source == null ? '' : String(source);
  let pos = 0;
  const peek = () => src[pos];

  const readCommandName = () => {
    // 调用前 src[pos] === '\\'
    pos += 1;
    if (pos >= src.length) return '';
    if (isLetter(src[pos])) {
      const start = pos;
      while (pos < src.length && isLetter(src[pos])) pos += 1;
      return src.slice(start, pos);
    }
    const ch = src[pos];
    pos += 1;
    return ch;
  };

  const readRawGroup = () => {
    // \text{…}:原样读到配对的 }
    while (peek() === ' ') pos += 1;
    if (peek() !== '{') return '';
    pos += 1;
    let depth = 1;
    const start = pos;
    while (pos < src.length) {
      if (src[pos] === '{') depth += 1;
      else if (src[pos] === '}') { depth -= 1; if (depth === 0) break; }
      pos += 1;
    }
    const text = src.slice(start, pos);
    pos += 1;
    return text;
  };

  const readArg = () => {
    while (peek() === ' ') pos += 1;
    if (pos >= src.length) return { t: 'group', c: [] };
    if (peek() === '{') {
      pos += 1;
      const c = parseList('}');
      return { t: 'group', c };
    }
    const atom = readAtom();
    return atom || { t: 'group', c: [] };
  };

  const readAtom = () => {
    const ch = peek();
    if (ch === undefined) return null;
    if (ch === '{') {
      pos += 1;
      return { t: 'group', c: parseList('}') };
    }
    if (ch === '\\') {
      const name = readCommandName();
      if (name === 'frac' || name === 'dfrac' || name === 'tfrac') return { t: 'frac', n: readArg(), d: readArg() };
      if (name === 'sqrt') return { t: 'sqrt', c: readArg() };
      if (name === 'hl' || name === 'boxed') return { t: 'hl', c: readArg() };
      if (name === 'text' || name === 'textrm' || name === 'mbox') return { t: 'text', v: readRawGroup() };
      if (name === 'mathbf' || name === 'bm' || name === 'boldsymbol') return { t: 'bold', c: readArg() };
      if (name === 'bar' || name === 'overline') return { t: 'bar', c: readArg() };
      if (ACCENTS[name]) return { t: 'accent', mark: ACCENTS[name], c: readArg() };
      if (BIG_OPS[name]) return { t: 'big', v: BIG_OPS[name], side: SIDE_LIMIT_OPS.has(name) };
      if (FUNCTIONS.has(name)) return { t: 'fn', v: name };
      if (SYMBOLS[name]) return { t: 'var', v: SYMBOLS[name] };
      if (OPERATORS[name]) return { t: 'op', v: OPERATORS[name] };
      if (PUNCT[name]) return { t: 'punct', v: PUNCT[name] };
      if (Object.prototype.hasOwnProperty.call(SPACES, name)) return { t: 'space', v: SPACES[name] };
      if (IGNORED.has(name)) return { t: 'group', c: [] };
      return name ? { t: 'text', v: name } : null;
    }
    if (ch === ' ' || ch === '\t' || ch === '\n') { pos += 1; return { t: 'group', c: [] }; }
    if (isDigit(ch)) {
      const start = pos;
      while (pos < src.length && isDigit(src[pos])) pos += 1;
      return { t: 'num', v: src.slice(start, pos) };
    }
    pos += 1;
    if (isLetter(ch)) return { t: 'var', v: ch };
    if (ch === '-') return { t: 'op', v: '−' };
    if (ch === '*') return { t: 'op', v: '∗' };
    if (OP_CHARS.has(ch)) return { t: 'op', v: ch };
    if (PUNCT_CHARS.has(ch)) return { t: 'punct', v: ch, gap: true };
    if (ch === "'") return { t: 'punct', v: '′' };
    if (/[α-ωΑ-Ω∇∂∞]/.test(ch)) return { t: 'var', v: ch };
    if (/[∑∏∫∮]/.test(ch)) return { t: 'big', v: ch, side: ch === '∫' || ch === '∮' };
    return { t: 'punct', v: ch };
  };

  const parseList = (closer) => {
    const out = [];
    while (pos < src.length) {
      const ch = peek();
      if (closer && ch === closer) { pos += 1; break; }
      if (ch === '_' || ch === '^') {
        // 上下标挂在前一个节点上;前面没有节点时挂在空底上
        const base = out.length ? out.pop() : { t: 'group', c: [] };
        out.push(attachScripts(base));
        continue;
      }
      // 连续的字母合并成一个斜体节点(最后一个字母带上下标时单独拆出)
      if (isLetter(ch)) {
        const start = pos;
        while (pos < src.length && isLetter(src[pos])) pos += 1;
        const run = src.slice(start, pos);
        const next = peek();
        if ((next === '_' || next === '^') && run.length > 1) {
          out.push({ t: 'var', v: run.slice(0, -1) });
          out.push({ t: 'var', v: run.slice(-1) });
        } else {
          out.push({ t: 'var', v: run });
        }
        continue;
      }
      if (ch === ' ' || ch === '\t' || ch === '\n') { pos += 1; continue; }
      const atom = readAtom();
      if (atom) out.push(atom);
    }
    return out.filter(node => !(node.t === 'group' && !node.c.length && !node.keep));
  };

  const attachScripts = (base) => {
    let sub = null;
    let sup = null;
    while (peek() === '_' || peek() === '^') {
      const which = peek();
      pos += 1;
      // 宽容写法:`T_urban` 这类紧跟 3 个及以上连续英文字母(没写花括号)时整段作上下标;
      // 严格按 LaTeX 只有第一个字母是下标,会排成「T_u rban」。1–2 个字母仍按 LaTeX 规则。
      const word = /^[A-Za-z]{3,}/.exec(src.slice(pos));
      if (word) {
        pos += word[0].length;
        if (which === '_') sub = { t: 'var', v: word[0] }; else sup = { t: 'var', v: word[0] };
        continue;
      }
      const arg = readArg();
      if (which === '_') sub = arg; else sup = arg;
    }
    return { t: 'scripts', base: { ...base, keep: true }, sub, sup };
  };

  return parseList(undefined);
}

function renderNodes(nodes, keyPrefix) {
  return nodes.map((node, i) => renderNode(node, `${keyPrefix}.${i}`));
}

function renderNode(node, key) {
  if (!node) return null;
  switch (node.t) {
    case 'var': return <span className="cp-fx-v" key={key}>{node.v}</span>;
    case 'num': return <span className="cp-fx-n" key={key}>{node.v}</span>;
    case 'text': return <span className="cp-fx-t" key={key}>{node.v}</span>;
    case 'fn': return <span className="cp-fx-fn" key={key}>{node.v}</span>;
    case 'op': return <span className="cp-fx-o" key={key}>{node.v}</span>;
    case 'punct': return <span className={node.gap ? 'cp-fx-p' : 'cp-fx-n'} key={key}>{node.v}</span>;
    case 'space': return <React.Fragment key={key}>{node.v}</React.Fragment>;
    case 'group': return <React.Fragment key={key}>{renderNodes(node.c, key)}</React.Fragment>;
    case 'frac':
      return (
        <span className="cp-fx-frac" key={key}>
          <span className="cp-fx-num">{renderNode(node.n, `${key}n`)}</span>
          <span className="cp-fx-den">{renderNode(node.d, `${key}d`)}</span>
        </span>
      );
    case 'sqrt':
      return (
        <React.Fragment key={key}>
          <span className="cp-fx-sqrt-sign">√</span>
          <span className="cp-fx-sqrt">{renderNode(node.c, `${key}c`)}</span>
        </React.Fragment>
      );
    case 'hl': return <span className="cp-fx-hl" key={key}>{renderNode(node.c, `${key}c`)}</span>;
    case 'bold': return <span className="cp-fx-b" key={key}>{renderNode(node.c, `${key}c`)}</span>;
    case 'bar': return <span className="cp-fx-bar" key={key}>{renderNode(node.c, `${key}c`)}</span>;
    case 'accent': {
      const inner = node.c?.t === 'group' && node.c.c.length === 1 ? node.c.c[0] : node.c;
      if (inner?.t === 'var' && inner.v.length === 1) return <span className="cp-fx-v" key={key}>{`${inner.v}${node.mark}`}</span>;
      return <span className="cp-fx-bar" key={key}>{renderNode(node.c, `${key}c`)}</span>;
    }
    case 'big': return <span className="cp-fx-bigside" key={key}>{node.v}</span>;
    case 'scripts': {
      const { base, sub, sup } = node;
      if (base?.t === 'big' && !base.side) {
        return (
          <span className="cp-fx-big" key={key}>
            <span className="cp-fx-lim">{sup ? renderNode(sup, `${key}u`) : ' '}</span>
            <span className="cp-fx-bigop">{base.v}</span>
            <span className="cp-fx-lim">{sub ? renderNode(sub, `${key}l`) : ' '}</span>
          </span>
        );
      }
      const baseEl = renderNode({ ...base, keep: undefined }, `${key}b`);
      if (sub && sup) {
        return (
          <React.Fragment key={key}>
            {baseEl}
            <span className="cp-fx-ss">
              <span className="cp-fx-sup">{renderNode(sup, `${key}u`)}</span>
              <span className="cp-fx-sub">{renderNode(sub, `${key}l`)}</span>
            </span>
          </React.Fragment>
        );
      }
      return (
        <React.Fragment key={key}>
          {baseEl}
          {sub ? <span className="cp-fx-sub">{renderNode(sub, `${key}l`)}</span> : null}
          {sup ? <span className="cp-fx-sup">{renderNode(sup, `${key}u`)}</span> : null}
        </React.Fragment>
      );
    }
    default: return null;
  }
}

const textEm = value => [...String(value || '')].reduce((sum, ch) => sum + (/[　-鿿＀-￯]/.test(ch) ? 1 : 0.52), 0);

function measureNodes(nodes) {
  return (nodes || []).reduce((sum, node) => sum + measureNode(node), 0);
}

function measureNode(node) {
  if (!node) return 0;
  switch (node.t) {
    case 'var': case 'num': return textEm(node.v);
    case 'text': return textEm(node.v);
    case 'fn': return textEm(node.v) + 0.12;
    case 'op': return 0.62 + 0.44;
    case 'punct': return (node.v === '‖' ? 0.42 : 0.34) + (node.gap ? 0.18 : 0);
    case 'space': return 0.25;
    case 'group': return measureNodes(node.c);
    case 'frac': return 0.9 * Math.max(measureNode(node.n), measureNode(node.d)) + 0.6;
    case 'sqrt': return measureNode(node.c) + 0.75;
    case 'hl': return measureNode(node.c) + 0.52;
    case 'bold': case 'bar': case 'accent': return measureNode(node.c);
    case 'big': return 0.95;
    case 'scripts': {
      const sub = node.sub ? measureNode(node.sub) : 0;
      const sup = node.sup ? measureNode(node.sup) : 0;
      if (node.base?.t === 'big' && !node.base.side) return Math.max(1.05, 0.58 * Math.max(sub, sup)) + 0.2;
      return measureNode(node.base) + 0.62 * (node.sub && node.sup ? Math.max(sub, sup) : sub + sup) + 0.06;
    }
    default: return 0;
  }
}

/**
 * 估算公式排出来有多宽(单位 em,偏保守)。页面用它在给定宽度里挑字号:fontSize = min(基准字号, 可用宽度 / 估算宽度)。
 * 估算只依赖字符串,渲染结果确定。
 */
export function formulaWidthEm(expr) {
  return Math.max(1, measureNodes(parseFormula(expr)) * 1.22);
}

/**
 * 公式:把上面的标记写法排成 HTML(全部是 span,文本编辑与 PPTX 导出都按一段文字处理)。
 *   expr  公式标记字符串
 *   as    外层元素,默认 div(独占块级元素);在表格单元格里可以用 'span'
 */
export function Formula({ expr, as: Tag = 'div', className = '', style }) {
  useEvidenceStyle();
  const nodes = React.useMemo(() => parseFormula(expr), [expr]);
  return <Tag className={`cp-fx ${className}`} style={style}>{renderNodes(nodes, 'f')}</Tag>;
}
