// deck 级信息在页面里的唯一入口。
// 学校名称、校徽、页眉页脚说明、章节导航、高亮色和外观开关是整份 deck 共用的数据,不进任何一页的 props;
// 浏览器运行时把 goal.json 里的 `brand` 经这个 context 提供给所有页面。
import React from 'react';
import { DECK_BRAND_STYLE_OPTIONS, deckBrandStyle } from '../../../deck-brand.mjs';
import { guardAccent, isWarmAccent } from '../../../deck-accent.mjs';

export const DeckBrandContext = React.createContext(null);

// 外观开关(fill / nav / titleStyle)的合法取值与读取函数,和 goal 校验共用同一份定义(src/deck-brand.mjs)。
export { DECK_BRAND_STYLE_OPTIONS, deckBrandStyle };
// 校色规整(src/deck-accent.mjs):主题按自己的渐变参数把任意校色规整成可用的颜色。
export { guardAccent, isWarmAccent };

/**
 * 读取 deck 级信息。defaults 是主题自己的兜底值(goal 没提供某个字段时使用)。
 * 返回 { name, nameEn, mark, logo, logoHasName, logoPlate, headerNote, footerNote, accent, chapters, fill, nav, titleStyle }。
 */
export function useDeckBrand(defaults = {}) {
  const brand = React.useContext(DeckBrandContext);
  return React.useMemo(() => ({ ...defaults, ...(brand || {}) }), [defaults, brand]);
}

/**
 * 把 deck 的高亮色变成可以直接挂在主题根节点上的行内样式。
 * 主题基座把它展开到自己的根元素上,整份 deck 的色调就由 goal 里的 brand.accent 决定。
 */
export function deckAccentStyle(brand) {
  return brand && brand.accent ? { '--theme-accent-rgb': brand.accent } : undefined;
}
