// 厦门大学 · 南方之强 · 深蓝弧幕(视频背景)。样板校之一:视频背景、三种封面变体、目录条目沿弧线错落排列。
// 数据来自设计交付包的 catalog.json / schools_meta.json 和素材清单 ../../assets/schools/xmu/manifest.json。
// 本文件是这所学校唯一允许写颜色字面量的地方(palette、accent),页面 CSS 读 var(--sch-*)。
export default Object.freeze({
  key: 'xmu',
  name: '厦门大学',
  nameEn: 'XIAMEN UNIVERSITY',
  accent: '#0D2F6E',  // 设计主色(厦大蓝),经校色规整不变
  media: 'video',
  style: '南方之强 · 深蓝弧幕',
  scene: '研究生阶段性学习汇报',
  coverVariants: Object.freeze(['default', 'long_title', 'keyword']),
  // 主标题容量(视觉字数):原版单行 5 字(96pt);长标题版两行、每行 10 字(46pt);再长用关键词大字版
  titleCaps: Object.freeze({ default: 5, long_title: 10 }),
  toc: Object.freeze({ min: 2, max: 6, default: 4 }),
  page2: false,
  coverToToc: 'none',
  // 模板里只有白色校徽校名(压在视频上),浅色页眉没有可用的彩色版 → 浅色页眉显示文字校徽
  logo: Object.freeze({ color: null, inverse: 'logo-image62.png', hasName: true }),
  slides: Object.freeze({ cover: { default: 351, long_title: 294, keyword: 352 }, toc: { 2: 328, 3: 329, 4: 291, 5: 330, 6: 331 } }),
  fonts: Object.freeze(['Source Han Serif CN Heavy', 'Source Han Serif CN SemiBold', 'Playfair Display Black']),
  // 封面不显示的通用字段(docs/campus-schools.md「各校字段落点」、SKILL.md 有同一张表):单位没有对应框(正文页页脚显示);关键词版副标题放完整题目,subtitle 不显示
  hiddenFields: Object.freeze(['unit']),
  palette: Object.freeze({
    navy: '#0D2F6E',          // 右幕、目录页底色
    'navy-deep': '#0C2B66',   // 封面底幕渐变暗端
    'navy-hi': '#10398A',     // 封面底幕渐变亮端
    orange: '#F59A44',        // 飘带 / 序号 / CONTENTS
    'orange-hi': '#F7AD69',
    'orange-lo': '#F38725',
    desc: '#AFC0D3',          // 目录说明文字
    white: '#FFFFFF',
    'white-80': 'rgba(255,255,255,.8)',
    'title-shadow': 'rgba(0,0,0,.35)',
  }),
  // 这所学校自己的文字(不是示例内容):goal 没写对应通用字段时使用
  defaults: Object.freeze({
    keyword: '南方之强',           // 关键词大字版的主标题
    motto: '自强不息 · 止于至善',  // 页脚校训
    mottoLabel: '校训',
    tocTitleEn: 'CONTENTS',
  }),
});
