// 北京大学 · 匾额请柬(视频背景)。封面左侧红色匾额形请柬(三种变体),目录是红底上的匾额卡片(壹贰叁…,2–6 项)。
// 数据来自设计交付包的 catalog.json / schools_meta.json 和素材清单 ../../assets/schools/pku/manifest.json。
// 本文件是这所学校唯一允许写颜色字面量的地方(palette、accent),页面 CSS 读 var(--sch-*)。
export default Object.freeze({
  key: 'pku',
  name: '北京大学',
  nameEn: 'PEKING UNIVERSITY',
  accent: '#9B0000',  // 设计主色(北大红,请柬底色),经校色规整不变
  media: 'video',
  style: '匾额请柬',
  scene: '毕业典礼暨学位授予仪式',
  coverVariants: Object.freeze(['default', 'long_title', 'keyword']),
  // 主标题容量(视觉字数):原版 72pt 两行、每行 2 字(共 4 字,「燕园 / 启航」);长标题版 50pt 两行,
  // 每行 4 字是原字号、6 字缩到约 37pt 仍在内框里;再长用关键词大字版(大字放关键词,完整题目放「主标题·副行」)
  titleCaps: Object.freeze({ default: 4, long_title: 6 }),
  toc: Object.freeze({ min: 2, max: 6, default: 5 }),
  page2: false,
  coverToToc: 'none',
  logo: Object.freeze({ color: null, inverse: 'logo-image50.png', hasName: true }),
  slides: Object.freeze({ cover: { default: 346, long_title: 284, keyword: 347 }, toc: { 2: 316, 3: 317, 4: 318, 5: 285, 6: 319 } }),
  fonts: Object.freeze(['寒蝉锦书宋 Heavy', '寒蝉锦书宋 Bold', '寒蝉锦书宋 Medium', 'Cinzel']),
  // 封面不显示的通用字段(docs/campus-schools.md「各校字段落点」、SKILL.md 有同一张表):答辩人 / 导师 / 单位 / 日期放在请柬「英文」行(两行);写了时 titleEn 不显示
  hiddenFields: Object.freeze([]),
  palette: Object.freeze({
    red: '#9B0000',                        // 封面请柬底色
    card: '#6E0000',                       // 目录匾额卡片底色
    'toc-bg': '#8E0000',                   // 目录背景图加载前的底色
    gold: '#D9AE5F',                       // 金框、菱形饰、时间线节点
    'gold-70': 'rgba(217,174,95,.7)',      // 请柬内框
    'gold-65': 'rgba(217,174,95,.65)',     // 目录时间线
    'gold-60': 'rgba(217,174,95,.6)',      // 卡片内框
    'gold-text': '#F3D28B',                // 主标题、底部信息、序号
    'gold-soft': '#E8CFA0',                // 英文行、典礼名称、条目说明
    white: '#FFFFFF',
    'plaque-shadow': 'rgba(26,0,0,.35)',   // 请柬外投影
  }),
  // 这所学校自己的文字(不是示例内容):goal 没写对应通用字段时使用
  defaults: Object.freeze({
    keyword: '燕园启航',                   // 关键词大字版的主标题
    motto: '思想自由 · 兼容并包',           // 封面底部信息
    tocMotto: '思想自由　兼容并包',         // 目录底部信息(模板原文用全角空格)
  }),
});
