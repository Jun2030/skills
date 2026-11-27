// deck 级的「封面信息」:封面页上的题目、场景名、答辩人、导师、单位、日期,作为只读信息提供给整份 deck 的所有页面。
//
// 用途:学校定制目录页要显示封面上的信息(东南大学的图签栏、东北大学的主讲人 / 日期),
// 选了学校时正文页页脚显示「<校名> · <单位>」。其他页面不读它,旧 12 套主题不受影响。
//
// 来源(两端拿到的是同一份):
//   - 生成 deck 时:src/renderDeck.jsx 从 deck 里第一页封面(DECK_COVER_LAYOUTS)的 props 取出这些字段,
//     写进 #preview-options 的 deckCover;
//   - 浏览器运行时:src/components/themes/client-runtime.jsx 读 deckCover,封面页渲染时(含预览面板改过的属性)
//     换成封面当前的值;合并进 DeckBrandContext 的 brand.cover(页面经 useDeckBrand / useCampusBrand 读)。
// 只取 goal / 面板里实际写了的字段,不带页面默认值(「姓名」这类占位):读的一方自己决定空值怎么显示。

/** 提供 deck 级封面信息的页面(按 layout 名)。 */
export const DECK_COVER_LAYOUTS = Object.freeze(['campus_temp_cover']);

/** brand.cover 里的字段(与 campus_temp_cover 的通用字段同名)。 */
export const DECK_COVER_KEYS = Object.freeze([
  'title', 'kicker', 'subtitle',
  'presenterLabel', 'presenter',
  'advisorLabel', 'advisor',
  'unitLabel', 'unit',
  'dateLabel', 'date',
]);

/** 页面 props → 封面信息(只收字符串字段);一个字段都没有时返回 null。 */
export function pickDeckCover(props) {
  if (!props || typeof props !== 'object') return null;
  const out = {};
  for (const key of DECK_COVER_KEYS) {
    const value = props[key];
    if (typeof value === 'string') out[key] = value;
    else if (typeof value === 'number' && Number.isFinite(value)) out[key] = String(value);
  }
  return Object.keys(out).length ? Object.freeze(out) : null;
}

/** 两份封面信息是否相同(字段逐个比较)。 */
export function sameDeckCover(a, b) {
  if (a === b) return true;
  if (!a || !b) return false;
  return DECK_COVER_KEYS.every(key => (a[key] ?? '') === (b[key] ?? ''));
}

function coverPropsOf(slide) {
  if (!slide || typeof slide !== 'object') return null;
  if (DECK_COVER_LAYOUTS.includes(slide.layout)) return slide.props || {};
  for (const variant of Array.isArray(slide.variants) ? slide.variants : []) {
    if (variant && DECK_COVER_LAYOUTS.includes(variant.layout)) return variant.props || {};
  }
  return null;
}

/** 组好的 deck(deckComposer 的输出)或 goal 的 slides → 第一页封面的封面信息;没有封面页时返回 null。 */
export function deckCoverFromSlides(slides) {
  for (const slide of Array.isArray(slides) ? slides : []) {
    const props = coverPropsOf(slide);
    if (props) return pickDeckCover(props);
  }
  return null;
}
