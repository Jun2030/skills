// 封面 campus_temp_cover 的通用字段默认值(TempCover.META.defaults 用它;学校目录页读 deck 级封面信息时也按它补默认值,
// 两页显示的标签一致)。
export const TEMP_COVER_DEFAULTS = Object.freeze({
  kicker: '项目汇报',
  title: '汇报标题写在这里',
  subtitle: '副标题：一句话说明这次汇报的判断与动作',
  // 以下字段通用封面只在写了内容时显示(指导教师、单位);关键词、英文标题、校训只用于学校定制封面,留空时用学校自己的文字
  keyword: '',
  titleEn: '',
  presenterLabel: '汇报人',
  presenter: '姓名',
  advisorLabel: '协作方',
  advisor: '',
  unitLabel: '部门 / 项目组',
  unit: '',
  dateLabel: '日期',
  date: '2026 年 11 月',
  motto: '',
  coverVariant: 'auto',
});

/**
 * 学校定制封面用的字段:副标题还是通用封面的占位说明(goal 没写 subtitle)时当作没写——
 * 学校封面大多拿副标题顶替别的框(或在空时用场景名 / 校训兜底),不能把「副标题：一句话说明…」填进去、导出进原生页。
 */
export function schoolCoverProps(p) {
  return p && p.subtitle === TEMP_COVER_DEFAULTS.subtitle ? { ...p, subtitle: '' } : p;
}

