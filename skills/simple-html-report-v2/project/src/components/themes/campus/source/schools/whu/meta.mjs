// 武汉大学 · 书法樱约(视频背景)。封面樱花推镜视频播放一次停在末帧,文字在樱花移开后上浮出现;目录是杂志式左白右视频。
// 数据来自设计交付包的 catalog.json / schools_meta.json 和素材清单 ../../assets/schools/whu/manifest.json。
// 本文件是这所学校唯一允许写颜色字面量的地方(palette、accent),页面 CSS 读 var(--sch-*)。
export default Object.freeze({
  key: 'whu',
  name: '武汉大学',
  nameEn: 'WUHAN UNIVERSITY',
  accent: '#006568',  // 设计主色 #00787B 经校色规整(渐变亮端压白字对比度)调成这个值
  media: 'video',
  style: '书法樱约',
  scene: '本科招生宣讲会',
  coverVariants: Object.freeze(['default', 'long_title', 'keyword']),
  // 主标题容量(视觉字数):原版单行 5 字(110pt);长标题版两行、每行 8 字(64pt);再长用关键词大字版(完整题目放引言)
  titleCaps: Object.freeze({ default: 5, long_title: 8 }),
  toc: Object.freeze({ min: 2, max: 6, default: 4 }),
  page2: false,
  coverToToc: 'none',
  // 封面视频按设计「播放一次停在末帧」(文字出场时刻对着樱花移开的时刻),不循环
  coverVideoLoop: false,
  logo: Object.freeze({ color: 'logo-image58.png', inverse: null, hasName: true }),
  slides: Object.freeze({ cover: { default: 349, long_title: 259, keyword: 350 }, toc: { 2: 324, 3: 325, 4: 287, 5: 326, 6: 327 } }),
  fonts: Object.freeze(['Source Han Serif CN Heavy', 'Source Han Serif CN SemiBold', 'Source Han Serif CN Medium']),
  // 封面不显示的通用字段(docs/campus-schools.md「各校字段落点」、SKILL.md 有同一张表):答辩人 / 导师 / 日期并进封面页脚;单位没有对应框(正文页页脚显示);关键词版的引言放完整题目,subtitle 不显示
  hiddenFields: Object.freeze(['unit']),
  palette: Object.freeze({
    ink: '#1D2B4A',                       // 主标题、活动名称文字、封面页脚
    quote: '#34456A',                     // 引言
    green: '#00787B',                     // 武大绿:活动名称底、当前目录项
    'green-line': 'rgba(0,120,123,.75)',  // 目录竖线与圆点描边
    slate: '#3A4152',                     // 目录 / CONTENTS
    'en-gray': '#8A93A6',                 // 目录英文小字
    'item-gray': '#6B7488',               // 目录序号 / 条目
    'arrow-gray': '#9AA2B3',              // 序号后的 ›
    'foot-gray': '#7A8296',               // 目录页脚
    white: '#FFFFFF',
    'white-0': 'rgba(255,255,255,0)',
    'hl-shadow': 'rgba(122,138,166,.22)', // 当前项高亮外投影
    glow: 'rgba(255,255,255,.92)',        // 封面引言 / 页脚的白色光晕(压在樱花与天空上时托住字形)
    'glow-soft': 'rgba(255,255,255,.6)',
    veil: 'rgba(255,255,255,.5)',         // 封面页脚下的淡白薄雾
  }),
  // 这所学校自己的文字(不是示例内容):goal 没写对应通用字段时使用
  defaults: Object.freeze({
    keyword: '樱约珞珈',                   // 关键词大字版的主标题
    motto: '珞珈山下，樱花如约而至',        // 引言(副标题为空时)
    footerTag: '自强 弘毅 求是 拓新',       // 目录页脚(校训)
    tocTitleEn: 'CONTENTS',
  }),
});
