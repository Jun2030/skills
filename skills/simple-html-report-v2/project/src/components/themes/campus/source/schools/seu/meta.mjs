// 东南大学 · 建筑蓝图(3D 建筑):深蓝图纸网格 + 图框 + 底部图签栏,大礼堂 3D 渲染图;封面 → 目录时建筑、网格、光晕平滑移动。
// 数据来自设计交付包的 catalog.json / schools_meta.json 和素材清单 ../../assets/schools/seu/manifest.json。
// 本文件是这所学校唯一允许写颜色字面量的地方(palette、accent),页面 CSS 读 var(--sch-*)。
export default Object.freeze({
  key: 'seu',
  name: '东南大学',
  nameEn: 'SOUTHEAST UNIVERSITY',
  accent: '#12385F',  // 设计主色,经校色规整不变
  media: '3d',
  style: '建筑蓝图',
  scene: '硕士学位论文开题答辩',
  coverVariants: Object.freeze(['default', 'long_title', 'keyword']),
  // 主标题容量(视觉字数):原版单行 152px,框宽 720 放 4 字(模板「东南大学」),5–6 字缩到约 128 / 114px(比长标题版只占一行更饱满);
  // 长标题版两行、每行 76px 放 9 字(模板「南京老城南传统街区 / 有机更新策略研究」);再长用关键词大字版(完整题目进导语)
  titleCaps: Object.freeze({ default: 6, long_title: 9 }),
  toc: Object.freeze({ min: 2, max: 6, default: 4 }),
  page2: false,
  coverToToc: 'morph',
  // 模板里没有校徽图片(校名是文字):页眉显示文字校徽
  logo: Object.freeze({ color: null, inverse: null, hasName: true }),
  slides: Object.freeze({ cover: { default: 343, long_title: 266, keyword: 344 }, toc: { 2: 312, 3: 313, 4: 267, 5: 314, 6: 315 } }),
  fonts: Object.freeze(['思源黑体 CN Heavy']),
  // 封面不显示的通用字段(docs/campus-schools.md「各校字段落点」、SKILL.md 有同一张表):单位没有对应框(正文页页脚显示)
  hiddenFields: Object.freeze(['unit']),
  palette: Object.freeze({
    'bg-a': '#12385F',                      // 背景渐变(左下 → 右上)
    'bg-b': '#0A1E38',
    frame: 'rgba(197,218,238,.5)',          // 图框、图签上框
    'frame-soft': 'rgba(197,218,238,.35)',  // 图签竖线
    rule: 'rgba(197,218,238,.55)',          // 目录表头线
    'rule-faint': 'rgba(197,218,238,.22)',  // 目录分隔线、竖线
    white: '#FFFFFF',                       // 校名 / 标题、目录条目、图签内容
    pale: '#D6E4F2',                        // 英文校名、导师、条目说明第一行
    mint: '#7CC8B4',                        // 分隔线、CONTENTS、图号、SEU—00
    sand: '#EAD9B5',                        // 封面场景名(模板框名「校训」)
    lead: '#B8CCE0',                        // 导语、条目说明第二行
    label: '#7FA3C6',                       // 图签标签、表头、条目英文
  }),
  // 这所学校自己的文字(不是示例内容):goal 没写对应通用字段时使用
  defaults: Object.freeze({
    keyword: '东南大学',          // 关键词大字版的大字(goal 没写 keyword 时用校名,和模板一致)
    sheet: 'SEU—00',             // 图签「图号」
    tocTitleEn: 'CONTENTS',
    // 图签栏标签(模板原文,中英文之间两个空格);答辩人一栏按 presenterLabel 换中文、英文对应换
    labels: Object.freeze({ project: '项目  PROJECT', title: '图名  TITLE', advisor: '导师  ADVISOR', presenter: '答辩人  CANDIDATE', date: '日期  DATE', sheet: '图号  SHEET' }),
    presenterEn: Object.freeze({ 答辩人: 'CANDIDATE', 汇报人: 'PRESENTER', 主讲人: 'SPEAKER', 报告人: 'SPEAKER', 申报人: 'APPLICANT' }),
    // 目录表头
    headers: Object.freeze({ num: '图号  NO.', title: '图名  TITLE', desc: '内容  SCOPE' }),
  }),
});
