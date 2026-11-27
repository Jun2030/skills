// 河南大学 · 汝窑天青(3D 建筑):天青釉色底 + 冰裂开片纹理,3D 南大门在右;目录是碎成 N 片的汝窑圆盘,大门平滑移到左侧。
// 数据来自设计交付包的 catalog.json / schools_meta.json 和素材清单 ../../assets/schools/henu/manifest.json。
// 本文件是这所学校唯一允许写颜色字面量的地方(palette、accent),页面 CSS 读 var(--sch-*)。
export default Object.freeze({
  key: 'henu',
  name: '河南大学',
  nameEn: 'HENAN UNIVERSITY',
  accent: '#47605A',  // 设计主色 #4F6B64 经校色规整(渐变亮端压白字对比度)调成这个值
  media: '3d',
  style: '汝窑天青',
  scene: '本科毕业论文答辩',
  coverVariants: Object.freeze(['default']),
  // 只有原版封面(本身是两行长标题设计):每行约 10 字(74px 字号、框宽 760),超过两行时缩字
  titleCaps: Object.freeze({ default: 10, long_title: 10 }),
  toc: Object.freeze({ min: 2, max: 6, default: 4 }),
  page2: false,
  coverToToc: 'morph',
  // 交付包里的两张校徽图:image17 是彩色圆章 + 白色「河南大學 Henan University」(深色底用,即白色版);
  // image18 是整枚黑色(模板只裁用它右侧的黑色校名)。提取脚本把 image17 的彩色圆章和 image18 的深色校名拼成
  // logo-color.png(scripts/campus-schools/extract-assets.py 的 COMPOSITE_LOGOS),作为浅色页眉用的彩色校徽
  logo: Object.freeze({ color: 'logo-color.png', inverse: 'logo-image17.png', hasName: true }),
  slides: Object.freeze({ cover: { default: 295 }, toc: { 2: 308, 3: 309, 4: 289, 5: 310, 6: 311 } }),
  fonts: Object.freeze(['Cinzel', 'Source Han Serif CN Light', 'Source Han Serif CN Medium', 'Source Han Serif CN SemiBold', '思源宋体 CN Heavy']),
  // 封面不显示的通用字段(docs/campus-schools.md「各校字段落点」、SKILL.md 有同一张表):通用字段都有对应位置(场景英文按场景名自动推出)
  hiddenFields: Object.freeze([]),
  palette: Object.freeze({
    paper: '#D3E0D9',                    // 天青底图加载前的底色
    ink: '#22302D',                      // 标题、目录标题、条目标题、信息内容
    cinnabar: '#A63A2C',                 // 眉题、条目编号
    sage: '#5F7D75',                     // 校训、信息标签、CONTENTS、条目英文
    celadon: '#4F6B64',                  // 副题、目录引言、条目说明
    'shard-shadow': 'rgba(47,71,67,.3)', // 瓷片外投影
  }),
  // 这所学校自己的文字(不是示例内容)
  defaults: Object.freeze({
    motto: '明德新民  ·  止于至善',     // 校训(模板原文 · 两侧各两个空格)
    tocTitleEn: 'CONTENTS',
  }),
});
