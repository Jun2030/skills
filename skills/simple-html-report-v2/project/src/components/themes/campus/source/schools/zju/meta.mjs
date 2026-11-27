// 浙江大学 · 天空白雾 · 拱门(视频背景)。求是拱门视频 + 顶部白雾,居中书法大标题;目录是底部白色圆角卡片。
// 数据来自设计交付包的 catalog.json / schools_meta.json 和素材清单 ../../assets/schools/zju/manifest.json。
// 本文件是这所学校唯一允许写颜色字面量的地方(palette、accent),页面 CSS 读 var(--sch-*)。
export default Object.freeze({
  key: 'zju',
  name: '浙江大学',
  nameEn: 'ZHEJIANG UNIVERSITY',
  accent: '#003F88',  // 设计主色,经校色规整不变
  media: 'video',
  style: '天空白雾 · 拱门',
  scene: '大学生创新大赛项目路演答辩',
  coverVariants: Object.freeze(['default', 'long_title']),
  // 主标题容量(视觉字数):原版单行 11 字(66pt 书法字);长标题版两行、每行 15 字(46pt)。没有关键词版,再长按长标题版缩字
  titleCaps: Object.freeze({ default: 11, long_title: 15 }),
  toc: Object.freeze({ min: 2, max: 6, default: 4 }),
  page2: false,
  coverToToc: 'morph',
  logo: Object.freeze({ color: 'logo-image53.png', inverse: null, hasName: true }),
  slides: Object.freeze({ cover: { default: 348, long_title: 264 }, toc: { 2: 320, 3: 321, 4: 292, 5: 322, 6: 323 } }),
  fonts: Object.freeze(['Alimama DongFangDaKai', '思源宋体 CN Heavy', 'D-DIN']),
  // 封面不显示的通用字段(docs/campus-schools.md「各校字段落点」、SKILL.md 有同一张表):副标题为空时副标题行显示场景名,此时奖杯槽位不再重复场景名
  hiddenFields: Object.freeze([]),
  palette: Object.freeze({
    blue: '#0B3F8F',                    // 标题、副标题、序号、胶囊文字、图标描边
    'blue-0': 'rgba(11,63,143,0)',      // 「目录」两侧渐隐短线的透明端
    'blue-en': '#2E6BD1',               // 英文行、CONTENTS
    label: '#6B7280',                   // 封面信息「标签：」
    ink: '#1C2433',                     // 封面信息内容
    desc: '#4B5563',                    // 目录说明
    'fog-a': 'rgba(255,255,255,.84)',   // !!天空白雾:顶 → 中 → 透明
    'fog-b': 'rgba(242,247,253,.48)',
    'fog-c': 'rgba(242,247,253,0)',
    base: '#F7FAFE',                    // 目录底色 / 底部白雾实色端
    'mist-a': 'rgba(247,250,254,0)',    // 目录-底部白雾
    'mist-b': 'rgba(247,250,254,.75)',
    card: 'rgba(255,255,255,.96)',      // 目录卡片
    'card-edge': '#BFD6F4',
    'card-shadow': 'rgba(11,63,143,.16)',
    divider: '#D6E3F5',
    pill: '#EAF2FC',                    // 目录胶囊
    'pill-edge': '#9CC0EE',
  }),
  // 这所学校自己的文字(不是示例内容):goal 没写对应通用字段时使用
  defaults: Object.freeze({
    titleEn: 'Seeking Truth, Pursuing Innovation',  // 封面英文行(校训「求是创新」的英文)
    tocTitleEn: 'CONTENTS',
  }),
});
