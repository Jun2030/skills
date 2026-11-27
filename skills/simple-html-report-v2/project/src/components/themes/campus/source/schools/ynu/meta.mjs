// 云南大学 · 航拍 · 磨砂玻璃卡片(视频背景)。封面:航拍视频 + 天空蓝渐变遮罩 + 居中大标题 + 信息胶囊;目录:模糊底图 + 右侧磨砂玻璃卡片。
// 数据来自设计交付包的 catalog.json / schools_meta.json 和素材清单 ../../assets/schools/ynu/manifest.json。
// 本文件是这所学校唯一允许写颜色字面量的地方(palette、accent),页面 CSS 读 var(--sch-*)。
export default Object.freeze({
  key: 'ynu',
  name: '云南大学',
  nameEn: 'YUNNAN UNIVERSITY',
  accent: '#2B3F81',  // 设计主色(云大蓝),经校色规整不变
  media: 'video',
  style: '航拍 · 磨砂玻璃卡片',
  scene: '年度事业发展报告',
  coverVariants: Object.freeze(['default', 'long_title']),
  // 主标题容量(视觉字数,字段表「约容纳」):原版单行 14 字(62pt);长标题版单行 16 字(54pt),更长时缩字 / 拆两行
  titleCaps: Object.freeze({ default: 14, long_title: 16 }),
  toc: Object.freeze({ min: 2, max: 6, default: 5 }),
  page2: false,
  coverToToc: 'none',
  // 模板里只有白色校徽校名(压在视频 / 深蓝模糊底上),浅色页眉没有可用的彩色版 → 浅色页眉显示文字校徽
  logo: Object.freeze({ color: null, inverse: 'logo-image67.png', hasName: true }),
  slides: Object.freeze({ cover: { default: 353, long_title: 256 }, toc: { 2: 332, 3: 333, 4: 334, 5: 257, 6: 335 } }),
  fonts: Object.freeze(['Alimama ShuHeiTi', '思源宋体 CN Heavy']),
  // 封面不显示的通用字段(docs/campus-schools.md「各校字段落点」、SKILL.md 有同一张表):副标题为空时显示场景名;答辩人 / 导师 / 单位 / 日期并进汇报信息胶囊
  hiddenFields: Object.freeze([]),
  palette: Object.freeze({
    navy: '#2B3F81',                       // 云大蓝:舞台底色(视频 / 底图加载前)
    white: '#FFFFFF',
    'glass-fill': 'rgba(255,255,255,.14)', // 信息胶囊 / 目录卡片的半透明填充
    'glass-edge': 'rgba(255,255,255,.55)', // 目录卡片描边
    'glass-edge-hi': 'rgba(255,255,255,.7)', // 信息胶囊描边
    'glass-sheen': 'rgba(255,255,255,.06)',  // 卡片上缘的一点高光(模拟磨砂玻璃的渐变)
    spirit: '#B9CCEA',                     // 目录左下「云大精神」
    en: '#C9D8F0',                         // 目录条目英文
    'title-shadow': 'rgba(10,31,61,.45)',
    'sub-shadow': 'rgba(10,31,61,.35)',
  }),
  // 这所学校自己的文字(不是示例内容):goal 没写对应通用字段时使用
  defaults: Object.freeze({
    motto: '会泽百家 · 至公天下',   // 云大精神:封面副标题兜底、目录左下
    tocTitleEn: 'CONTENTS',
  }),
});
