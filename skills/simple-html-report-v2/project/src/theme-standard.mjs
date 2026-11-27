// 两套主题体系并存时的唯一分流开关。
//
// 本仓库同时有两类主题:
//   - 12 套旧主题(theme01–theme12):页面经 normalizeRuntimePages 登记,key 为 `themeXX_pageNNN`,
//     角色靠 slot / label 关键字推断,封面按页码判断,各自实现媒体槽,沿用原有的校验与豁免方式。
//   - 遵循新主题标准(docs/theme-standard.md)的主题(目前是 campus):页面经 definePages 登记,
//     在 META 里显式声明 id / roles / copyBudgets,key 为 `<themeKey>_<id>`,只认声明的角色,
//     用共享 MediaSlot,并接受新标准的全部校验。
//
// 判定只看页面自己带不带新标准的声明:definePages 登记的页面一定带非空 `roles`,
// normalizeRuntimePages 登记的旧页面一定不带。所有「新规则 / 旧规则」的分叉都经这里,
// 不按主题名或页面 key 的格式去猜。

/** 页面是否按新主题标准声明(definePages 登记、带非空 roles)。 */
export function declaresPageStandard(page) {
  return Array.isArray(page?.roles) && page.roles.length > 0;
}

/** 主题是否遵循新主题标准:它的页面全部按新标准声明。pages 为全部页面(会按 themeKey 过滤)。 */
export function isStandardTheme(themeKey, pages = []) {
  const themePages = (pages || []).filter(page => page?.themeKey === themeKey);
  return themePages.length > 0 && themePages.every(declaresPageStandard);
}

/** 遵循新主题标准的主题 key 列表(保持 pages 中的出现顺序)。 */
export function standardThemeKeys(pages = []) {
  const keys = [...new Set((pages || []).map(page => page?.themeKey).filter(Boolean))];
  return keys.filter(key => isStandardTheme(key, pages));
}
