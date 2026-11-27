// 清华大学 · 礼堂与二校门(视频背景)。封面两种变体(原版 / 长标题版);模板没有目录页,目录按封面与「第二页」的设计语言自绘。
// 数据来自设计交付包的 catalog.json / schools_meta.json 和素材清单 ../../assets/schools/thu/manifest.json。
// 本文件是这所学校唯一允许写颜色字面量的地方(palette、accent),页面 CSS 读 var(--sch-*)。
export default Object.freeze({
  key: 'thu',
  name: '清华大学',
  nameEn: 'TSINGHUA UNIVERSITY',
  accent: '#660874',  // 设计主色(清华紫,胶囊标签),经校色规整不变
  media: 'video',
  style: '礼堂与二校门',
  scene: '学校 / 校训介绍',
  coverVariants: Object.freeze(['default', 'long_title']),
  // 主标题容量(视觉字数):原版单行 10 字(74pt、字距 6pt,框宽 1598px);长标题版两行、每行 14 字(52pt、字距 5pt)
  titleCaps: Object.freeze({ default: 10, long_title: 14 }),
  toc: null,
  page2: true,
  coverToToc: 'fade',
  logo: Object.freeze({ color: null, inverse: 'logo-image47.png', hasName: true }),
  slides: Object.freeze({ cover: { default: 345, long_title: 276 }, page2: 277 }),
  fonts: Object.freeze(['Source Han Serif SC Heavy', 'Source Han Serif CN SemiBold']),
  // 封面不显示的通用字段(docs/campus-schools.md「各校字段落点」、SKILL.md 有同一张表):答辩人 / 导师 / 单位 / 日期并进左下地点胶囊;长标题版副标题并进眉题
  hiddenFields: Object.freeze([]),
  palette: Object.freeze({
    purple: '#660874',                     // 地点标签 / 胶囊标签
    white: '#FFFFFF',
    'white-82': 'rgba(255,255,255,.82)',   // 目录条目说明
    sky: '#24357A',                        // 视频 / 海报加载前的底色(取海报天空的深蓝)
    glass: 'rgba(42,15,69,.55)',           // 第二页「玻璃条」填充
    'glass-edge': 'rgba(255,255,255,.35)', // 玻璃条描边
    'shadow-title': 'rgba(26,10,46,.45)',  // 主标题 / 校训投影
    'shadow-sub': 'rgba(26,10,46,.5)',     // 副标题投影
    'shadow-note': 'rgba(26,10,46,.55)',   // 地点说明投影
    'shadow-eyebrow': 'rgba(26,10,46,.4)', // 第二页眉题投影
  }),
  // 这所学校自己的文字(不是示例内容):goal 没写对应通用字段时使用
  defaults: Object.freeze({
    eyebrow: 'SINCE 1911  ·  GRAND AUDITORIUM', // 封面眉题(kicker 为空时);原文两个空格,保留
    motto: '自强不息·厚德载物',                   // 封面校训行(subtitle 为空时)
    place: '大礼堂',                              // 封面地点标签(没有汇报人 / 日期信息时)
    placeNote: '清华早期四大建筑之一',
    tocLead: '自强不息　厚德载物',                 // 目录页(自绘,视频取自「第二页」二校门):目录引言为空时(校训,写法同模板第二页「内容1」)
    tocPlace: '二校门',
    tocPlaceNote: '清华园的标志性入口',
  }),
});
