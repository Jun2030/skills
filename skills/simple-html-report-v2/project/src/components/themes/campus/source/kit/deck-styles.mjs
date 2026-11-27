// campus 声明的全稿级外观开关(deck 级 brand 的 nav / titleStyle / fill),经 runtime.jsx 的 theme.deckStyles
// 进入生成物,渲染器写进成品 HTML 的 preview-options.deckStyles,预览工作台据此在右侧面板渲染「全稿外观」设置组。
// 取值必须与 src/deck-brand.mjs 的 DECK_BRAND_STYLE_OPTIONS 一致(scripts/test/test-campus-standard-theme.mjs 会比对),
// 第一个取值是默认值。label / description 是中文,英文在 i18n/zh-en.json。
//
// 声明里的分组条目({ type: 'group', key, label, fields })是一组非单选的 deck 级设置:campus 的「学校信息」
// (校名、页脚说明、LOGO、文字校徽、校色)。字段类型:'text' 文本、'image' 图片、'toggle' 开关、'color' 颜色;
// default 是主题默认值(goal 没写时页面显示的占位),section 是面板里的小标题,when 是显示条件({ logo: true }
// 表示有 LOGO 时才显示),follows 是跟随规则(见 src/deck-brand.mjs 的 resolveDeckBrand),auto 是上传图片后
// 按宽高比自动设定开关,plate 表示「这是 LOGO 的白底开关」(上传浅色 LOGO 时编辑器自动关掉白底)。颜色字面量(默认校色、预置校色)与校色规整参数都在 base.jsx。
//
// icon 是 64×36 的单色示意图(SVG 片段,不含 <svg> 外壳):只用 currentColor,class="s" 的元素按淡色画,
// class="g" 的元素按面板底色画(用来在实心色块上「挖」出当前项);编辑器负责套外壳和配色,主题不写颜色。

import { CAMPUS_BRAND_DEFAULTS } from './chrome.jsx';
import { CAMPUS_DEFAULT_ACCENT, CAMPUS_ACCENT_PRESETS, CAMPUS_ACCENT_GUARD } from './base.jsx';
import { CAMPUS_SCHOOLS, schoolBrandPreset, schoolLogos } from '../schools/registry.mjs';

/**
 * 「学校」选择(brand.school):通用 + 学校注册表里的每一所。选项上的 brand 是选中后带出的默认值
 * (校名、英文校名、校徽、校色;src/deck-brand.mjs 的 resolveDeckBrand 按「显式写了的优先」套用),
 * image / color 是面板里的校徽小图与色块。type 'select' 由编辑器模板渲染成带校徽的单选列表。
 */
export const CAMPUS_SCHOOL_FIELD = Object.freeze({
  key: 'school',
  type: 'select',
  section: '学校',
  label: '学校',
  default: '',
  description: '选一所学校:封面、目录换成这所学校的定制设计,校名、校徽、校色一起带出;之后仍可单独修改。',
  options: Object.freeze([
    { value: '', label: '通用', description: '不套学校定制设计,封面目录用通用版式' },
    ...CAMPUS_SCHOOLS.map(school => {
      const logos = schoolLogos(school);
      return {
        value: school.key,
        label: school.name,
        description: school.style,
        image: logos.inverse || logos.color || '',
        imageTone: logos.inverse ? 'inverse' : 'color',
        color: school.accent,
        brand: schoolBrandPreset(school),
      };
    }),
  ]),
});

const frame = '<rect x="1" y="1" width="62" height="34" rx="4" class="f"/>';
const titleLine = '<rect x="6" y="22" width="22" height="3" rx="1.5" class="s"/><rect x="6" y="28" width="34" height="2" rx="1" class="s"/>';

const NAV_ICONS = {
  band: `${frame}<rect x="1" y="1" width="62" height="12" rx="4"/><rect x="1" y="7" width="62" height="6"/><rect x="38" y="5" width="11" height="8" rx="2" class="g"/>${titleLine}`,
  tabs: `${frame}<rect x="1" y="1" width="62" height="1.6"/><circle cx="8" cy="8" r="3"/><rect x="22" y="5" width="38" height="6" rx="3" class="s"/><rect x="34" y="5" width="11" height="6" rx="3"/>${titleLine}`,
  rail: `${frame}<rect x="1" y="1" width="14" height="34" rx="4"/><rect x="8" y="1" width="7" height="34"/><rect x="7" y="13" width="8" height="7" rx="2" class="g"/><rect x="20" y="7" width="22" height="3" rx="1.5" class="s"/><rect x="20" y="14" width="38" height="2" rx="1" class="s"/>`,
  inline: `${frame}<circle cx="7" cy="6" r="2.4"/><rect x="5" y="13" width="18" height="3" rx="1.5" class="s"/><rect x="30" y="12" width="30" height="5" rx="2.5" class="s"/><rect x="38" y="12" width="10" height="5" rx="2.5"/><rect x="6" y="24" width="34" height="2" rx="1" class="s"/>`,
  slant: `${frame}<circle cx="8" cy="8" r="3"/><polygon points="22,11 24,5 32,5 30,11" class="s"/><polygon points="31,11 33,5 41,5 39,11"/><polygon points="40,11 42,5 50,5 48,11" class="s"/><polygon points="49,11 51,5 59,5 57,11" class="s"/>${titleLine}`,
  underline: `${frame}<circle cx="8" cy="7" r="3"/><rect x="1" y="13" width="62" height="1.2" class="s"/><rect x="22" y="7" width="7" height="2" rx="1" class="s"/><rect x="33" y="7" width="7" height="2" rx="1"/><rect x="44" y="7" width="7" height="2" rx="1" class="s"/><rect x="55" y="7" width="5" height="2" rx="1" class="s"/><rect x="32" y="11" width="9" height="2.6" rx="1"/>${titleLine}`,
  cells: `${frame}<circle cx="8" cy="7" r="3"/><rect x="1" y="12.5" width="62" height="2"/><rect x="22" y="6" width="9" height="6.5" rx="1.5" class="s"/><rect x="32" y="4" width="9" height="8.5" rx="1.5"/><rect x="42" y="6" width="9" height="6.5" rx="1.5" class="s"/><rect x="52" y="6" width="9" height="6.5" rx="1.5" class="s"/>${titleLine}`,
  folder: `${frame}<rect x="1" y="11" width="62" height="1.6"/><polygon points="4,1 21,1 19,15 6,15"/><rect x="26" y="6" width="6" height="2" rx="1" class="s"/><rect x="35" y="4.5" width="11" height="5" rx="2.5"/><rect x="49" y="6" width="6" height="2" rx="1" class="s"/><rect x="57" y="6" width="4" height="2" rx="1" class="s"/>${titleLine}`,
  solid: `${frame}<rect x="1" y="1" width="62" height="13" rx="4"/><rect x="1" y="8" width="62" height="6"/><rect x="24" y="4" width="36" height="7" rx="3.5" class="g s"/><rect x="36" y="5" width="11" height="5" rx="2.5" class="g"/>${titleLine}`,
  steps: `${frame}<rect x="22" y="7.2" width="10" height="1.6"/><line x1="40" y1="8" x2="55" y2="8" class="d"/><circle cx="22" cy="8" r="2.6"/><circle cx="35" cy="8" r="3.8"/><circle cx="46" cy="8" r="2.4" class="o"/><circle cx="57" cy="8" r="2.4" class="o"/>${titleLine}`,
};

const TITLE_ICONS = {
  ribbon: `${frame}<polygon points="6,11 17,11 21,16 17,21 6,21"/><rect x="25" y="14.5" width="20" height="3.2" rx="1.6" class="s"/><rect x="48" y="15.6" width="11" height="1" class="s"/>`,
  bar: `${frame}<rect x="6" y="10" width="3" height="12" rx="1.5"/><rect x="12" y="13" width="7" height="6" rx="1" class="s"/><rect x="24" y="14.5" width="20" height="3.2" rx="1.6" class="s"/><rect x="47" y="13.6" width="9" height="2" rx="1"/><rect x="47" y="17.4" width="12" height="0.8" class="s"/>`,
  wing: `${frame}<circle cx="12" cy="16" r="5.5"/><circle cx="12" cy="16" r="7.6" class="o d"/><rect x="23" y="14.5" width="20" height="3.2" rx="1.6" class="s"/><polygon points="47,15.2 57,15.8 57,16.6 47,17.2"/>`,
};

const FILL_ICONS = {
  gradient: `${frame}<rect x="8" y="9" width="48" height="18" rx="4" class="grad"/>`,
  solid: `${frame}<rect x="8" y="9" width="48" height="18" rx="4"/>`,
};

/** 学校信息:整份演示稿共用的校名、LOGO、校色(brand 的 name / nameEn / footerNote / logo / mark / logoHasName / logoPlate / accent)。 */
export const CAMPUS_IDENTITY_SETTINGS = Object.freeze({
  key: 'identity',
  type: 'group',
  label: '汇报信息',
  description: '汇报品牌、LOGO、主题色整份演示稿统一,改一处所有页面立即生效。',
  fields: [
    { key: 'name', type: 'text', section: '名称', label: '中文品牌名', default: CAMPUS_BRAND_DEFAULTS.name, maxLength: 24, description: '页眉、封面、目录、结语上的汇报品牌名;清空后显示占位。' },
    { key: 'nameEn', type: 'text', section: '名称', label: '英文副标', default: CAMPUS_BRAND_DEFAULTS.nameEn, maxLength: 64, description: '写在中文品牌名下方的英文副标,建议全大写。' },
    { key: 'footerNote', type: 'text', section: '名称', label: '页脚说明', default: CAMPUS_BRAND_DEFAULTS.footerNote, maxLength: 48, follows: 'name', description: '每页左下角的说明文字;没有单独填写时跟随品牌名。' },
    { key: 'logo', type: 'image', section: '校徽', label: '品牌 LOGO', accept: 'image/png,image/jpeg,image/svg+xml,image/webp', description: '支持 PNG(可透明底)、JPG、SVG、WebP;上传后每页页眉的校徽立即替换。' },
    { key: 'mark', type: 'text', section: '校徽', label: '文字标记', default: CAMPUS_BRAND_DEFAULTS.mark, maxLength: 2, follows: { key: 'name', rule: 'initial' }, when: { logo: false }, description: '没有 LOGO 时圆形标记里的一两个字;默认取品牌名首字。' },
    { key: 'logoHasName', type: 'toggle', section: '校徽', label: 'LOGO 已包含校名', default: CAMPUS_BRAND_DEFAULTS.logoHasName, when: { logo: true }, auto: { image: 'logo', minAspect: 2.2 }, description: '横向的「校徽 + 校名」组合标打开此项,页眉只显示 LOGO;上传时按宽高比自动判断。' },
    { key: 'logoPlate', type: 'toggle', section: '校徽', label: '深色页眉上加白底', default: CAMPUS_BRAND_DEFAULTS.logoPlate, when: { logo: true }, plate: 'logo', description: '通栏色条、深色通栏、左侧竖栏、文件夹页签上给 LOGO 垫一块白色圆角底板,深色 LOGO 也看得清。' },
    { key: 'accent', type: 'color', section: '主题色', label: '主题色', default: CAMPUS_DEFAULT_ACCENT, presets: CAMPUS_ACCENT_PRESETS, guard: CAMPUS_ACCENT_GUARD, description: '色块、强调字、图表主色和浅色底纹由主题色派生。' },
  ],
});

export const CAMPUS_DECK_STYLES = Object.freeze([
  CAMPUS_IDENTITY_SETTINGS,
  {
    key: 'nav',
    label: '导航样式',
    description: '每页页眉的章节标签样式,整份演示稿统一。',
    options: [
      { value: 'band', label: '通栏色条', description: '顶部渐变通栏,当前章是与页面相连的页签', icon: NAV_ICONS.band },
      { value: 'tabs', label: '胶囊标签', description: '白色页眉,章节在浅色胶囊轨道里', icon: NAV_ICONS.tabs },
      { value: 'rail', label: '左侧竖栏', description: '左侧竖向色栏,正文区更窄更高', icon: NAV_ICONS.rail },
      { value: 'inline', label: '标题内嵌', description: '页眉变薄,章节胶囊并进标题行', icon: NAV_ICONS.inline },
      { value: 'slant', label: '斜切标签', description: '平行四边形标签连排,当前章渐变实底', icon: NAV_ICONS.slant },
      { value: 'underline', label: '下划线', description: '纯文字章节,当前章底边压一段粗色条', icon: NAV_ICONS.underline },
      { value: 'cells', label: '平铺方格', description: '等宽方格立在底线上,当前章实底高出一截', icon: NAV_ICONS.cells },
      { value: 'folder', label: '文件夹页签', description: '校名放在垂下的页签里,当前章是胶囊', icon: NAV_ICONS.folder },
      { value: 'solid', label: '深色通栏', description: '深色通栏里一条半透明轨道,当前章是白色胶囊', icon: NAV_ICONS.solid },
      { value: 'steps', label: '进度步骤', description: '章节用连线串起来,讲过、当前、未讲一目了然', icon: NAV_ICONS.steps },
    ],
  },
  {
    key: 'titleStyle',
    label: '标题装饰',
    description: '每页标题前的编号装饰与标题后的延伸线。',
    options: [
      { value: 'ribbon', label: '书签箭头', description: '渐变书签箭头里放小节编号', icon: TITLE_ICONS.ribbon },
      { value: 'bar', label: '竖条斜杠', description: '竖向渐变条 + 校色编号 + 斜杠', icon: TITLE_ICONS.bar },
      { value: 'wing', label: '圆徽翼线', description: '渐变圆徽里放编号,尾部是翼线', icon: TITLE_ICONS.wing },
    ],
  },
  {
    key: 'fill',
    label: '填充风格',
    description: '深色块(标签、编号块、卡头、结论条)的填充方式。',
    options: [
      { value: 'gradient', label: '渐变', description: '同一校色的深浅渐变', icon: FILL_ICONS.gradient },
      { value: 'solid', label: '纯色', description: '校色实底,不用渐变', icon: FILL_ICONS.solid },
    ],
  },
]);


