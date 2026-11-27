// 四川大学 · 红幕通栏(3D 建筑):3D 牌坊居中、底部红色通栏;目录是右侧红幕上的竖排条目,牌坊平滑移到左侧。
// 数据来自设计交付包的 catalog.json / schools_meta.json 和素材清单 ../../assets/schools/scu/manifest.json。
// 本文件是这所学校唯一允许写颜色字面量的地方(palette、accent),页面 CSS 读 var(--sch-*)。
export default Object.freeze({
  key: 'scu',
  name: '四川大学',
  nameEn: 'SICHUAN UNIVERSITY',
  accent: '#AB291C',  // 设计主色 #B52B1E 经校色规整(渐变亮端压白字对比度)调成这个值
  media: '3d',
  style: '红幕通栏',
  scene: '博士学位论文答辩',
  coverVariants: Object.freeze(['default']),
  // 只有原版封面(本身是长标题设计):通栏标题约 11 字,超过时通栏放场景名、完整题目放副标题行(见 index.jsx)
  titleCaps: Object.freeze({ default: 11, long_title: 11 }),
  toc: Object.freeze({ min: 2, max: 6, default: 4 }),
  page2: false,
  coverToToc: 'morph',
  // 模板里只有白色校徽校名(压在红幕上);浅色页眉没有可用的彩色版 → 显示文字校徽
  logo: Object.freeze({ color: null, inverse: 'logo-image8.png', hasName: true }),
  slides: Object.freeze({ cover: { default: 269 }, toc: { 2: 300, 3: 301, 4: 270, 5: 302, 6: 303 } }),
  fonts: Object.freeze(['Cinzel', 'Source Han Serif CN', 'Source Han Serif CN Heavy', 'Source Han Serif CN SemiBold']),
  // 封面不显示的通用字段(docs/campus-schools.md「各校字段落点」、SKILL.md 有同一张表):题目超过 11 字时通栏放场景名、副标题行放完整题目,subtitle 不显示;导师 / 单位并进通栏下方一行
  hiddenFields: Object.freeze(['subtitle']),
  palette: Object.freeze({
    paper: '#F3F2EF',                 // 背景图加载前的底色
    'curtain-a': '#B52B1E',           // 红幕渐变(上)
    'curtain-b': '#8C1B12',           // 红幕渐变(下)
    'ink-red': '#AE2519',             // 顶栏英文校名、CONTENTS
    grey: '#585C61',                  // 顶栏右、目录引言
    ink: '#2A2C2E',                   // 目录标题
    white: '#FFFFFF',
    blush: '#F4DAD2',                 // 通栏副标题、日期、目录副项
    'blush-en': '#E6ADA2',            // 通栏英文、目录英文
    gold: '#C9A063',                  // 目录序号框、序号、菱形点
    'white-80': 'rgba(255,255,255,.8)',
    'white-45': 'rgba(255,255,255,.45)',
    'white-20': 'rgba(255,255,255,.2)',
    'glow-a': 'rgba(232,207,194,.88)',  // 牌坊后的暖色光晕(径向渐变)
    'glow-b': 'rgba(238,220,210,.45)',
    'glow-c': 'rgba(243,242,239,0)',
  }),
  // 这所学校自己的文字(不是示例内容)
  defaults: Object.freeze({
    topLeft: 'SICHUAN UNIVERSITY',
    topRightYears: '1896 — 2026',
    topRightNote: '  ·  建校一百三十周年',
    tocTitleEn: 'CONTENTS',
  }),
});
