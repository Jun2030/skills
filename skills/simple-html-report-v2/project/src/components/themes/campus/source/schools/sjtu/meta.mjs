// 上海交通大学 · 红韵天空(3D 建筑)。样板校之一:3D 校门渲染图、封面 → 目录共享元素平滑移动。
// 数据来自设计交付包的 catalog.json / schools_meta.json 和素材清单 ../../assets/schools/sjtu/manifest.json。
// 本文件是这所学校唯一允许写颜色字面量的地方(palette、accent),页面 CSS 读 var(--sch-*)。
export default Object.freeze({
  key: 'sjtu',
  name: '上海交通大学',
  nameEn: 'SHANGHAI JIAO TONG UNIVERSITY',
  accent: '#B10D1C',  // 设计主色(标题红),经校色规整不变
  media: '3d',
  style: '红韵天空',
  scene: '学校概况与人才培养介绍',
  coverVariants: Object.freeze(['default', 'long_title']),
  // 主标题容量(视觉字数):原版单行 9 字(88pt);长标题版两行、每行 14 字(56pt)。按它自动选封面变体
  titleCaps: Object.freeze({ default: 9, long_title: 14 }),
  toc: Object.freeze({ min: 2, max: 6, default: 6 }),
  page2: false,
  coverToToc: 'morph',
  logo: Object.freeze({ color: 'logo-image2.png', inverse: null, hasName: true }),
  slides: Object.freeze({ cover: { default: 340, long_title: 258 }, toc: { 2: 296, 3: 297, 4: 298, 5: 299, 6: 275 } }),
  fonts: Object.freeze(['Ma Shan Zheng', 'Source Han Serif SC Heavy']),
  // 封面不显示的通用字段(docs/campus-schools.md「各校字段落点」、SKILL.md 有同一张表):模板封面只有主标题 / 副标题两个文字框(长标题版只有主标题),场景名与答辩人、导师、单位、日期都不显示
  hiddenFields: Object.freeze(['kicker', 'presenter', 'advisor', 'unit', 'date']),
  palette: Object.freeze({
    red: '#B10D1C',            // 主标题、目录标题
    'red-deep': '#840A13',     // 副标题
    'red-ink': '#920813',      // 目录条目文字
    'red-line': '#AE1221',     // 标题红色短线
    'red-line-soft': 'rgba(210,75,84,.45)',
    'red-mark': 'rgba(206,59,71,.7)',
    'num-ink': '#FFF9F3',      // 编号文字
    'row-fill': 'rgba(255,249,247,.6)',
    'row-edge': 'rgba(244,223,225,.6)',
    'sky': '#EEE8EF',          // 封面底色(背景图加载前)
    'toc-bg-a': '#F8EAF0',
    'toc-bg-b': '#FFF9F5',
  }),
  defaults: Object.freeze({
    tocTitleEn: 'CONTENTS',
  }),
});
