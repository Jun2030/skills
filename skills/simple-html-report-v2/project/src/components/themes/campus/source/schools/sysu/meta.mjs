// 中山大学 · 绿拱金线(3D 建筑):绿色拱门 + 金线,怀士堂 3D 渲染图;封面 → 目录时拱门、建筑、水印校徽平滑移动。
// 数据来自设计交付包的 catalog.json / schools_meta.json 和素材清单 ../../assets/schools/sysu/manifest.json。
// 本文件是这所学校唯一允许写颜色字面量的地方(palette、accent),页面 CSS 读 var(--sch-*)。
export default Object.freeze({
  key: 'sysu',
  name: '中山大学',
  nameEn: 'SUN YAT-SEN UNIVERSITY',
  accent: '#146842',  // 设计主色 #17784C 经校色规整(渐变亮端压白字对比度)调成这个值
  media: '3d',
  style: '绿拱金线',
  scene: '课堂授课（《学术写作》第三讲）',
  coverVariants: Object.freeze(['default', 'long_title', 'keyword']),
  // 主标题容量(视觉字数):原版单行 160px,框宽 820 放 5 字,6–7 字自动缩到约 133 / 114px 仍好看(比长标题版只占一行更饱满);
  // 长标题版两行、每行 100px 放 7 字(模板「文献综述怎么写 / 从罗列到对话」);再长用关键词大字版(完整题目进长副标题)
  titleCaps: Object.freeze({ default: 7, long_title: 7 }),
  toc: Object.freeze({ min: 2, max: 6, default: 4 }),
  page2: false,
  coverToToc: 'morph',
  // 只有彩色校徽(绿色,带校名);深色页眉没有白色版 → 显示文字校徽
  logo: Object.freeze({ color: 'logo-image12.png', inverse: null, hasName: true }),
  slides: Object.freeze({ cover: { default: 341, long_title: 273, keyword: 342 }, toc: { 2: 304, 3: 305, 4: 274, 5: 306, 6: 307 } }),
  fonts: Object.freeze(['Source Han Serif CN Heavy', 'Source Han Serif CN SemiBold', 'Source Han Serif CN Medium', 'Cinzel']),
  // 封面不显示的通用字段(docs/campus-schools.md「各校字段落点」、SKILL.md 有同一张表):模板三版都没有副标题框;单位没有对应框(正文页页脚显示)
  hiddenFields: Object.freeze(['subtitle', 'unit']),
  palette: Object.freeze({
    'bg-a': '#FFFFFF',                       // 页面底色渐变(左上 → 右下)
    'bg-b': '#F6F9F6',
    'bg-c': '#E9F1EB',
    'arch-a': '#17784C',                     // 拱门渐变(上 → 下)
    'arch-b': '#0B5A35',
    'arch-c': '#053220',
    'arch-line': 'rgba(11,90,53,.3)',        // 拱门外框线
    'arch-gold': 'rgba(220,194,133,.6)',     // 拱门内金线
    'arch-shadow': 'rgba(11,58,34,.22)',     // 拱门外投影
    'glow-a': 'rgba(230,231,180,.42)',       // 拱门光晕
    'glow-b': 'rgba(140,199,154,0)',
    green: '#0B4F31',                        // 主标题、目录标题、条目标题、主讲人胶囊
    rust: '#B0502E',                         // 眉题、目录序号
    'rust-60': 'rgba(176,80,46,.6)',         // 眉题分隔竖线
    ink: '#24322A',                          // 校训
    gold: '#A8823F',                         // 校训菱形、CONTENTS、条目英文
    'gold-hi': '#DCC285',                    // 拱门题注
    'gold-hi-80': 'rgba(220,194,133,.8)',
    grey: '#8A958E',                         // 英文标识
    desc: '#5E6B63',                         // 目录说明
    rule: '#D3DDD6',                         // 目录分隔线
  }),
  // 这所学校自己的文字(不是示例内容):goal 没写对应通用字段时使用
  defaults: Object.freeze({
    keyword: '中山大学',                              // 关键词大字版的主标题(goal 没写 keyword 时)
    motto: '博学 审问 慎思 明辨 笃行',                  // 校训(逐词之间画金色菱形)
    badge: 'SUN YAT-SEN UNIVERSITY  ·  EST. 1924',   // 右上 / 右下英文标识(模板原文,两个空格)
    archCaption: '康乐园 · 怀士堂',                    // 拱门题注(怀士堂所在的康乐园)
    archCaptionEn: 'SWASEY HALL · 1916',
    tocTitleEn: 'CONTENTS',
  }),
});
