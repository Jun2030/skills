// 东北大学 · 雪国来信(明信片,视频在明信片的照片框里)。封面 = 明信片正面,目录 = 明信片背面,封面 → 目录平滑过渡。
// 数据来自设计交付包的 catalog.json / schools_meta.json 和素材清单 ../../assets/schools/neu/manifest.json。
// 素材里 logo-image74(邮戳)、logo-image75(邮票)被交付包标成了校徽,实际是装饰图;真正的校徽校名是 logo-image71。
// 本文件是这所学校唯一允许写颜色字面量的地方(palette、accent),页面 CSS 读 var(--sch-*)。
export default Object.freeze({
  key: 'neu',
  name: '东北大学',
  nameEn: 'NORTHEASTERN UNIVERSITY',
  accent: '#204198',  // 设计主色(东大蓝),经校色规整不变
  media: 'video',
  style: '雪国来信（明信片）',
  scene: '新生入学',
  coverVariants: Object.freeze(['default', 'long_title', 'keyword']),
  // 主标题容量(视觉字数,字段表「约容纳」):原版单行 4 字(72pt);长标题版两行、每行 6 字(50pt);再长用关键词大字版
  titleCaps: Object.freeze({ default: 4, long_title: 6 }),
  toc: Object.freeze({ min: 2, max: 6, default: 4 }),
  page2: false,
  coverToToc: 'morph',
  logo: Object.freeze({ color: 'logo-image71.png', inverse: null, hasName: true }),
  slides: Object.freeze({ cover: { default: 354, long_title: 280, keyword: 355 }, toc: { 2: 336, 3: 337, 4: 281, 5: 338, 6: 339 } }),
  fonts: Object.freeze(['Source Han Serif CN Heavy', 'Source Han Serif CN SemiBold', 'Source Han Serif CN Medium', '思源宋体 CN Heavy', 'LXGW WenKai', 'Cutive Mono']),
  // 封面不显示的通用字段(docs/campus-schools.md「各校字段落点」、SKILL.md 有同一张表):导师并进「寄自」一行(放得下时也带单位);副标题显示在校歌引句位置
  hiddenFields: Object.freeze([]),
  palette: Object.freeze({
    blue: '#204198',                        // 东大蓝:主标题、寄自、序号、邮编格
    ink: '#18295C',                         // 正文墨色:英文校名、引句、手写值
    label: '#5A6787',                       // 标签(主讲人 FROM)、说明
    'line-cover': '#8396BF',                // 封面虚线
    'line-toc': '#A9B6D3',                  // 目录虚线
    seam: 'rgba(32,65,152,.45)',            // 明信片背面中缝
    card: '#FBFAF6',                        // 明信片卡纸
    paper: '#EEEAE3',                       // 信纸底色(纹理图加载前)
    'card-shadow': 'rgba(28,36,51,.26)',
    'stamp-shadow': 'rgba(28,36,51,.3)',
  }),
  // 这所学校自己的文字(不是示例内容):goal 没写对应通用字段时使用
  defaults: Object.freeze({
    keyword: '东北大学',                                // 关键词大字版的主标题
    motto: '自强不息，知行合一',                         // 校训:封面引句、目录收件栏兜底
    postcode: '110819',                                 // 东北大学邮编(明信片背面邮编格)
    toName: '各位老师、同学',                            // 收件人(目录引言 lead 为空时)
    address: '辽宁省沈阳市和平区文化路三号巷 11 号',      // 明信片收件栏校址(设计模板原文,逐字一致)
    tocTitleEn: 'CONTENTS',
  }),
});
