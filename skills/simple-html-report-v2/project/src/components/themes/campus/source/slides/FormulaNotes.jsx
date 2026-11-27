// 公式 + 符号说明:讲模型、损失函数、判别规则这类页面。
//   编号公式  左侧 1–4 条编号公式(每条上方一句说明,关键项可高亮),右侧符号说明表(符号 / 含义 / 单位,3–10 行)
//   总式分项  上方一条总式(居中大字),下方 2–4 张分项卡片,每张写一项的式子、名称和作用
// 底部结论条写「这个式子解决什么问题」。
// 公式写法是 LaTeX 的一个小子集(上下标 _ ^、\frac{}{}、\sqrt{}、\hl{} 高亮、\text{}、\sum 等,完整列表见 kit/evidence.jsx 的 Formula),
// 排成 HTML 文本(衬线斜体、上下标、行内分式),导出 PPTX 后仍是文字;特别复杂的公式可以切到「公式图片」,贴一张公式截图。
// 公式图片位只在 mediaMode='image' 时出现,所以 defaults 不声明 images(声明了就要求默认渲染出媒体槽);
// 图片位改由一个 images 媒体控件声明(与旧主题的图片控件同一写法)。mediaMode 默认 'auto':页面自己看 props.images,
// goal 里写了图就显示公式图片,没写就文字排版(浏览器端的契约是精简过的,契约层的「写了图就切模式」在 render:goal 产物里不生效)。
import React from 'react';
import { useThemeStyle, enterDelay } from '../../../shared/style.jsx';
import { MediaSlot } from '../../../shared/MediaSlot.jsx';
import { safeArray, safeNumber, safeRatio, clamp } from '../../../chart-safety.mjs';
import { CampusFrame, TitleRow, ConclusionBar, CHAPTER_CONTROL, useCampusLayout } from '../kit/chrome.jsx';
import { LabelRow, NumberCard } from '../kit/parts.jsx';
import { Formula, formulaWidthEm, useEvidenceStyle } from '../kit/evidence.jsx';

const DEFAULTS = {
  chapterIndex: 3,
  variant: 'list',
  mediaMode: 'auto',
  formulaCount: 2,
  symbolCount: 7,
  termCount: 3,
  showUnit: true,
  showConclusion: true,
  sectionNo: '3.2',
  title: '鲁棒的光度一致性',
  formulasLabel: '损失函数',
  formulas: [
    { no: '(3-1)', note: '传统光度一致性损失：只比较像素值', expr: 'L_{photo} = \\sum_{m} \\| (I_s - \\hat{I}_s^m) \\odot V_s^m \\|' },
    { no: '(3-2)', note: '本文：加入图像梯度项', expr: 'L_{photo} = \\sum_{m} \\| (I_s - \\hat{I}_s^m) \\odot V_s^m \\| + \\hl{\\alpha \\| (\\nabla I_s - \\nabla \\hat{I}_s^m) \\odot V_s^m \\|}' },
    { no: '(3-3)', note: '总损失：三项加权求和', expr: 'L = \\sum ( \\alpha L_{photo} + \\beta L_{SSIM} + \\gamma L_{Smooth} )' },
    { no: '(3-4)', note: '结构相似性指标（SSIM）', expr: '\\text{SSIM}(x,y) = \\frac{(2\\mu_x \\mu_y + c_1)(2\\sigma_{xy} + c_2)}{(\\mu_x^2 + \\mu_y^2 + c_1)(\\sigma_x^2 + \\sigma_y^2 + c_2)}' },
  ],
  symbolsLabel: '符号说明',
  symbolHead: '符号',
  meaningHead: '含义',
  unitHead: '取值',
  symbols: [
    { symbol: 'I_s', meaning: '参考视图的图像', unit: '—' },
    { symbol: '\\hat{I}_s^m', meaning: '由第 m 张新视图重投影得到的图像', unit: '—' },
    { symbol: 'V_s^m', meaning: '有效像素掩码（重投影可见的区域）', unit: '0 / 1' },
    { symbol: '\\odot', meaning: '逐像素相乘', unit: '—' },
    { symbol: '\\nabla', meaning: '图像梯度', unit: '—' },
    { symbol: '\\alpha', meaning: '梯度项的权重', unit: '12' },
    { symbol: 'm', meaning: '参与计算的新视图编号', unit: '1…M' },
    { symbol: '\\beta', meaning: '结构相似性损失的权重', unit: '6' },
    { symbol: '\\gamma', meaning: '平滑损失的权重', unit: '0.18' },
    { symbol: '\\| \\cdot \\|', meaning: '范数，衡量差异的大小', unit: '—' },
  ],
  totalLabel: '总损失函数',
  totalNo: '(3-5)',
  totalExpr: 'L = \\sum ( \\alpha L_{photo} + \\beta L_{SSIM} + \\gamma L_{Smooth} )',
  terms: [
    { expr: 'L_{photo}', name: '鲁棒光度一致性损失', desc: '上一节加入梯度项的光度一致性，权重 α = 12。' },
    { expr: 'L_{SSIM}', name: '结构化相似性损失', desc: '在图像块层面比较结构相似度，权重 β = 6。' },
    { expr: 'L_{Smooth}', name: '梯度感知平滑损失', desc: '约束深度图平滑并保留边缘，权重 γ = 0.18。' },
    { expr: '\\lambda R', name: '正则项（示例）', desc: '需要时可再加一项，如权重衰减。' },
  ],
  conclusionLabel: '解决什么',
  conclusion: '只比较像素值的损失对光照变化不鲁棒；加入梯度项后，像素梯度的差异约束力更强。',
};

const CSS = `
.cp-fn{flex:1;min-height:0;display:flex;gap:28px;}
.cp-fn-card{min-width:0;display:flex;flex-direction:column;padding:24px 30px 22px;}
.cp-fn-card.is-formulas{flex:1.2 1 0;}
.cp-fn-card.is-symbols{flex:1 1 0;}
.cp-fn-list{flex:1;min-height:0;display:flex;flex-direction:column;margin-top:10px;}
.cp-fn-item{position:relative;flex:1 1 0;min-height:0;display:flex;flex-direction:column;justify-content:center;gap:10px;padding:10px 0;border-bottom:1px dashed var(--campus-accent-line);}
.cp-fn-item:last-child{border-bottom:0;}
.cp-fn-note{display:flex;align-items:center;gap:12px;font-size:20px;line-height:1.35;font-weight:600;color:var(--campus-accent-soft);}
.cp-fn-line{display:flex;align-items:center;gap:24px;min-width:0;}
.cp-fn-line .cp-fx{flex:1;min-width:0;}
.cp-fn-eqno{flex:none;font-family:var(--theme-font-serif);font-weight:700;font-size:23px;line-height:1;color:var(--theme-faint);font-variant-numeric:lining-nums;}
.cp-fn-media{flex:1;min-height:0;margin-top:16px;}
.cp-fn-table{flex:1;min-height:0;display:flex;flex-direction:column;margin-top:16px;}
.cp-fn-row{display:grid;grid-template-columns:var(--cp-fn-cols);align-items:center;column-gap:16px;padding:0 18px;}
.cp-fn-head{flex:none;min-height:54px;border-radius:var(--campus-radius-sm) var(--campus-radius-sm) 0 0;background:var(--campus-fill-deep);color:var(--theme-on-accent);font-size:20px;font-weight:700;letter-spacing:.1em;box-shadow:0 8px 18px rgb(var(--theme-accent-rgb) / .18);}
.cp-fn-head > *:first-child{text-align:center;}
.cp-fn-body{flex:1;min-height:0;display:flex;flex-direction:column;}
.cp-fn-body .cp-fn-row{flex:1 1 0;max-height:84px;min-height:0;border-bottom:1px solid var(--theme-line);}
.cp-fn-body .cp-fn-row:nth-child(even){background:var(--campus-accent-wash);}
.cp-fn-sym{text-align:center;font-size:26px;color:var(--theme-accent);}
.cp-fn-meaning{font-size:21px;line-height:1.4;color:var(--theme-ink);text-wrap:pretty;}
.cp-fn-unit{font-family:var(--theme-font-serif);font-size:21px;line-height:1.3;color:var(--theme-muted);font-variant-numeric:lining-nums;}
.cp-fn-table.is-dense .cp-fn-sym{font-size:24px;}
.cp-fn-table.is-dense .cp-fn-meaning{font-size:20px;line-height:1.35;}
/* 总式分项 */
.cp-fn-total{flex:1;min-height:0;display:flex;flex-direction:column;gap:26px;}
.cp-fn-hero{position:relative;flex:1.15 1 0;min-height:0;display:flex;flex-direction:column;padding:22px 34px 22px;}
.cp-fn-hero-wash{position:absolute;inset:10px;z-index:-1;border-radius:calc(var(--campus-radius) - 4px);background:var(--campus-wash);pointer-events:none;}
.cp-fn-hero-body{flex:1;min-height:0;display:flex;align-items:center;justify-content:center;gap:36px;padding:0 20px;}
.cp-fn-hero-body .cp-fx{min-width:0;}
.cp-fn-hero .cp-fn-eqno{font-size:26px;}
.cp-fn-hero-orb{position:absolute;right:30px;top:24px;width:12px;height:12px;border-radius:50%;background:var(--campus-spark);}
.cp-fn-terms{flex:1 1 0;min-height:0;display:grid;grid-auto-flow:column;grid-auto-columns:minmax(0,1fr);column-gap:24px;}
.cp-fn-term .campus-ncard-head{min-height:80px;}
.cp-fn-term .campus-ncard-no{font-size:30px;}
.cp-fn-term .campus-ncard-no .cp-fx{color:inherit;font-weight:600;}
.cp-fn-term .campus-ncard-title{font-size:25px;}
.cp-fn-term{display:flex;flex-direction:column;}
.cp-fn-term-desc{flex:1;display:flex;align-items:center;padding:12px 28px 0;font-size:22px;line-height:1.6;color:var(--theme-muted);text-wrap:pretty;}
.cp-fn-hero-media{flex:1;min-height:0;margin:6px 0 0;}
`;

// 公式行的基准字号随条数变化;再按估算宽度收小,保证整行放得下
const LIST_FONT = { 1: 46, 2: 40, 3: 36, 4: 32 };
const fitFont = (expr, base, available) => Math.round(clamp(Math.min(base, safeRatio(available, formulaWidthEm(expr), base)), 22, base));

export function FormulaNotes(props) {
  useThemeStyle('campus-formula-notes-style', CSS);
  useEvidenceStyle();
  const p = { ...DEFAULTS, ...props };
  const { bodyW } = useCampusLayout();
  const image = p.mediaMode === 'image' || (p.mediaMode === 'auto' && safeArray(p.images).some(item => (typeof item === 'string' ? item.trim() !== '' : Boolean(item?.src))));
  const total = p.variant === 'total';
  const formulas = safeArray(p.formulas).slice(0, clamp(p.formulaCount, 1, 4));
  const symbols = safeArray(p.symbols).slice(0, clamp(p.symbolCount, 3, 10));
  const terms = safeArray(p.terms).slice(0, clamp(p.termCount, 2, 4));
  const showUnit = p.showUnit !== false;
  // 左侧公式卡的可用宽度:正文区按 1.2 : 1 分给公式卡与符号表,减去卡片内边距与右侧公式编号
  const listWidth = (safeNumber(bodyW, 1760) - 28) * (1.2 / 2.2) - 60 - 110;
  const listBase = LIST_FONT[formulas.length] || 36;
  const heroWidth = safeNumber(bodyW, 1760) - 68 - 40 - 150;
  const media = (
    <div className="cp-fn-media campus-photo">
      <MediaSlot id="formula-notes-image" fit="contain" radius={8} placeholder="公式图片" />
    </div>
  );
  return (
    <CampusFrame chapterIndex={p.chapterIndex}>
      <TitleRow no={p.sectionNo} title={p.title} className="campus-rise" style={enterDelay(0)} />
      {total ? (
        <div className="cp-fn-total">
          <section className="cp-fn-hero campus-card campus-rise" style={enterDelay(1)}>
            <div className="cp-fn-hero-wash" aria-hidden="true" />
            <div className="cp-fn-hero-orb" aria-hidden="true" />
            <LabelRow label={p.totalLabel} />
            {image ? (
              <div className="cp-fn-hero-media campus-photo"><MediaSlot id="formula-notes-image" fit="contain" radius={8} placeholder="公式图片" /></div>
            ) : (
              <div className="cp-fn-hero-body">
                <Formula expr={p.totalExpr} style={{ fontSize: fitFont(p.totalExpr, 60, heroWidth) }} />
                <div className="cp-fn-eqno">{p.totalNo}</div>
              </div>
            )}
          </section>
          <div className="cp-fn-terms">
            {terms.map((term, i) => (
              <NumberCard
                variant="head"
                className="cp-fn-term campus-rise"
                style={enterDelay(2 + i)}
                key={i}
                no={<Formula expr={term?.expr} as="span" />}
                title={term?.name}
              >
                <p className="cp-fn-term-desc">{term?.desc}</p>
              </NumberCard>
            ))}
          </div>
        </div>
      ) : (
        <div className="cp-fn">
          <section className="cp-fn-card is-formulas campus-card campus-rise" style={enterDelay(1)}>
            <LabelRow label={p.formulasLabel} />
            {image ? media : (
              <div className="cp-fn-list">
                {formulas.map((item, i) => (
                  <div className="cp-fn-item campus-fade" style={enterDelay(2 + i)} key={i}>
                    <div className="cp-fn-note"><div className="campus-mark" aria-hidden="true" /><div>{item?.note}</div></div>
                    <div className="cp-fn-line">
                      <Formula expr={item?.expr} style={{ fontSize: fitFont(item?.expr, listBase, listWidth) }} />
                      <div className="cp-fn-eqno">{item?.no}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
          <section className="cp-fn-card is-symbols campus-card campus-rise" style={enterDelay(2)}>
            <LabelRow label={p.symbolsLabel} />
            <div className={`cp-fn-table${symbols.length > 7 ? ' is-dense' : ''}`} style={{ '--cp-fn-cols': showUnit ? '120px minmax(0,1fr) 92px' : '120px minmax(0,1fr)' }}>
              <div className="cp-fn-row cp-fn-head">
                <div>{p.symbolHead}</div>
                <div>{p.meaningHead}</div>
                {showUnit && <div>{p.unitHead}</div>}
              </div>
              <div className="cp-fn-body">
                {symbols.map((row, i) => (
                  <div className="cp-fn-row campus-fade" style={enterDelay(3 + i)} key={i}>
                    <Formula expr={row?.symbol} className="cp-fn-sym" />
                    <div className="cp-fn-meaning">{row?.meaning}</div>
                    {showUnit && <div className="cp-fn-unit">{row?.unit}</div>}
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      )}
      {p.showConclusion && <ConclusionBar label={p.conclusionLabel} text={p.conclusion} className="campus-rise" style={enterDelay(8)} />}
    </CampusFrame>
  );
}

FormulaNotes.META = {
  id: 'formula-notes',
  label: '公式 · 编号公式配符号说明',
  roles: ['context', 'process', 'relationship'],
  defaults: DEFAULTS,
  copyBudgets: {
    formulasLabel: 6, symbolsLabel: 6, totalLabel: 8, 'formulas[].note': 20, 'formulas[].expr': 120, 'symbols[].meaning': 18, 'symbols[].unit': 5,
    'terms[].name': 10, 'terms[].desc': 28, totalExpr: 120, conclusion: 44,
  },
  controls: [
    { ...CHAPTER_CONTROL, default: 3 },
    { key: 'variant', type: 'radio', label: '版式', default: 'list', options: [{ value: 'list', label: '编号公式 + 符号表' }, { value: 'total', label: '总式 + 分项卡片' }], description: '编号公式:左侧 1–4 条编号公式,右侧符号说明表;总式分项:上方一条总式,下方 2–4 张分项卡片(terms)。' },
    { key: 'mediaMode', type: 'radio', label: '公式来源', default: 'auto', options: [{ value: 'auto', label: '自动' }, { value: 'text', label: '文字排版' }, { value: 'image', label: '公式图片' }], description: '自动(默认):给了 images 就显示公式图片,没给就文字排版;文字排版:按 expr 的标记写法排公式(上下标 _ ^、\\frac{}{}、\\sqrt{}、\\hl{} 高亮、\\text{}、\\sum、希腊字母 \\alpha 等),导出后仍是文字;公式图片:公式区换成一个图片位,贴公式截图(特别复杂的公式用)。' },
    { key: 'images', type: 'images', label: '公式图片', description: '公式来源为「公式图片」时显示的公式截图(只用第 1 张)。公式来源为「自动」时,goal 里写了 props.images 就显示这张图;在页面上上传前,先把公式来源切到「公式图片」。' },
    { key: 'formulaCount', type: 'number', label: '公式条数', default: 2, min: 1, max: 4, description: '编号公式的条数,每条带一句说明 note 和编号 no。' },
    { key: 'symbolCount', type: 'number', label: '符号行数', default: 7, min: 3, max: 10, description: '符号说明表的行数。' },
    { key: 'termCount', type: 'number', label: '分项卡片数', default: 3, min: 2, max: 4, description: '总式分项版下方的分项卡片张数。' },
    { key: 'showUnit', type: 'toggle', label: '取值列', default: true, description: '符号说明表的第三列(单位或取值)。' },
    { key: 'showConclusion', type: 'toggle', label: '底部结论条', default: true, description: '页面底部「这个式子解决什么问题」的结论条。' },
  ],
};
