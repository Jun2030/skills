// 页面角色词表:页面「适合讲什么」的唯一词汇来源。
//
// 每个页面在自己的 META.roles 里显式声明角色(见 docs/theme-standard.md),
// 选页(deckComposer / layout:query / goal:scaffold)只认这份声明,不再从 slot 名或 label 文案里猜。
// 新增角色只改这里;页面声明了词表之外的角色会在生成 metadata 时报错。

export const PAGE_ROLES = Object.freeze({
  cover: '封面:一份 deck 的第一页',
  breakdown: '目录 / 结构总览',
  transition: '章节过渡页',
  statement: '摘要、主张、核心观点',
  context: '背景、现状、研究方法',
  metrics: '关键指标、数字、数据图表',
  trend: '走势、时间线、阶段变化',
  comparison: '对比、矩阵、象限',
  distribution: '占比、分布、排行',
  relationship: '关系、流向、结构图',
  case: '案例、人物或项目聚焦',
  image: '以图片 / 视频为主的页面',
  process: '流程、步骤、路线',
  risks: '风险、问题、问答',
  observation: '洞察、要点、结论提炼',
  actions: '计划、下一步、行动项',
  result: '成果、结果、总结',
  team: '团队、人物、致谢对象',
  closing: '结语、致谢、封底',
});

export const PAGE_ROLE_KEYS = Object.freeze(Object.keys(PAGE_ROLES));

// 调用方常用的直觉词 → 词表里的角色。
export const ROLE_ALIASES = Object.freeze({
  agenda: 'breakdown',
  contents: 'breakdown',
  list: 'breakdown',
  section: 'transition',
  chapter: 'transition',
  summary: 'statement',
  insight: 'observation',
  quote: 'observation',
  numbers: 'metrics',
  chart: 'metrics',
  timeline: 'trend',
  compare: 'comparison',
  flow: 'process',
  roadmap: 'actions',
  product: 'case',
  feature: 'case',
  faq: 'risks',
  visual: 'image',
  gallery: 'image',
  media: 'image',
  picture: 'image',
  photo: 'image',
  conclusion: 'result',
  thanks: 'closing',
});

// 模糊意图:一次命中多种角色。
export const ROLE_GROUPS = Object.freeze({
  data: ['metrics', 'trend', 'comparison', 'distribution'],
  report: ['context', 'metrics', 'statement', 'result'],
});

/** 把调用方传入的角色词归一到词表角色(或角色组名);未知词原样返回。 */
export function normalizeRole(role) {
  const key = String(role || '').trim().toLowerCase();
  return ROLE_ALIASES[key] || key;
}

/** 页面声明的角色列表。 */
export function pageRoles(page) {
  return Array.isArray(page?.roles) ? page.roles : [];
}

/** 页面是否承担某个角色;role 可以是词表角色、别名或角色组。 */
export function pageHasRole(page, role) {
  const normalized = normalizeRole(role);
  const declared = pageRoles(page);
  const group = ROLE_GROUPS[normalized];
  return group ? group.some(item => declared.includes(item)) : declared.includes(normalized);
}

export const isCoverPage = page => pageHasRole(page, 'cover');
export const isClosingPage = page => pageHasRole(page, 'closing');

/** 校验页面声明的角色;返回错误文案数组(空数组表示通过)。 */
export function validateDeclaredRoles(roles) {
  if (!Array.isArray(roles) || !roles.length) return ['roles 必须是非空数组'];
  const unknown = roles.filter(role => !PAGE_ROLE_KEYS.includes(role));
  const errors = [];
  if (unknown.length) errors.push(`roles 含词表之外的角色: ${unknown.join(', ')}(可用: ${PAGE_ROLE_KEYS.join(', ')})`);
  if (new Set(roles).size !== roles.length) errors.push('roles 有重复项');
  return errors;
}
