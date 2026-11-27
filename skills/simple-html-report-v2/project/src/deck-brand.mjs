// deck 级信息(brand):整份 deck 共用、不属于任何一页的内容——学校名称、校徽、页眉页脚说明、
// 章节导航、高亮色,以及填充风格 / 导航样式 / 标题装饰这几个外观开关。goal.json 顶层的 `brand` 字段经这里归一化后写进成品 HTML,
// 浏览器运行时再经 DeckBrandContext 交给每一页(见 src/components/themes/shared/DeckBrand.jsx)。
//
// 所有字段都可省略;省略的字段由主题自己的默认值兜底。

const TEXT_FIELDS = ['name', 'nameEn', 'mark', 'logo', 'headerNote', 'footerNote'];
/**
 * 校徽图片的两个开关(只有 logo 有值时起作用):
 *   logoHasName  LOGO 已包含校名(横向「校徽 + 校名」组合标):页眉只显示 LOGO,不再画文字校名。默认 false
 *   logoPlate    深色页眉(通栏色条、深色通栏、左侧竖栏、文件夹页签)上给 LOGO 垫一块白色圆角底板。默认 true
 */
const BOOLEAN_FIELDS = ['logoHasName', 'logoPlate'];
/**
 * 学校(school):主题定制的学校风格 key(campus 的 12 所学校,取值表由主题在 deckStyles 里以「学校」选项声明,
 * 见 deckSchoolOptions)。写了且主题认识这个 key 时,封面 / 目录换成这所学校的定制版,校名 / 英文校名 / 校徽 / 校色
 * 没有单独指定时取学校的默认值(resolveDeckBrand 的「选项预设」规则);不写或写 "" 表示通用。
 */
const SCHOOL_KEY = /^[a-z][a-z0-9_-]{0,31}$/;
const MAX_CHAPTERS = 8;

/**
 * 外观开关:整份 deck 一处设置、全稿生效的视觉选项。每个字段只接受列出的取值,第一个是默认值。
 *   fill        色块填充:'gradient' 同一校色的深浅渐变 | 'solid' 纯色实底
 *   nav         导航样式:'band' 顶部通栏色条(默认) | 'tabs' 顶部标签 | 'rail' 左侧竖栏 | 'inline' 标题行内嵌
 *               | 'slant' 斜切标签 | 'underline' 下划线 | 'cells' 平铺方格 | 'folder' 文件夹页签 | 'solid' 深色通栏胶囊
 *               | 'steps' 进度步骤
 *   titleStyle  标题装饰:'ribbon' 书签箭头 | 'bar' 竖条渐隐线 | 'wing' 圆徽翼线
 * 旧主题不读这些字段;新标准主题按自己支持的取值解释,不认识的值退回默认值。
 */
export const DECK_BRAND_STYLE_OPTIONS = Object.freeze({
  fill: Object.freeze(['gradient', 'solid']),
  nav: Object.freeze(['band', 'tabs', 'rail', 'inline', 'slant', 'underline', 'cells', 'folder', 'solid', 'steps']),
  titleStyle: Object.freeze(['ribbon', 'bar', 'wing']),
});
const STYLE_FIELDS = Object.keys(DECK_BRAND_STYLE_OPTIONS);

/** 读外观开关的取值:合法时原样返回,否则返回该字段的默认值(列表第一项)。 */
export function deckBrandStyle(brand, field) {
  const options = DECK_BRAND_STYLE_OPTIONS[field] || [];
  const value = brand && typeof brand[field] === 'string' ? brand[field].trim() : '';
  return options.includes(value) ? value : options[0];
}

/** 把高亮色归一成 "r g b"(0–255 的三个整数,空格分隔);无法识别时返回 null。 */
export function parseAccent(value) {
  if (typeof value !== 'string') return null;
  const text = value.trim();
  const hex = text.match(/^#?([0-9a-f]{6})$/i);
  if (hex) {
    const n = parseInt(hex[1], 16);
    return `${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255}`;
  }
  const parts = text.split(/[\s,]+/).filter(Boolean);
  if (parts.length === 3 && parts.every(part => /^\d{1,3}$/.test(part) && Number(part) <= 255)) {
    return parts.map(Number).join(' ');
  }
  return null;
}

/** 归一化 goal 里的 brand;没有任何有效字段时返回 null。 */
export function normalizeDeckBrand(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return null;
  const brand = {};
  for (const field of TEXT_FIELDS) {
    if (typeof input[field] === 'string' && input[field].trim()) brand[field] = input[field].trim();
  }
  for (const field of BOOLEAN_FIELDS) {
    if (typeof input[field] === 'boolean') brand[field] = input[field];
  }
  const school = typeof input.school === 'string' ? input.school.trim().toLowerCase() : '';
  if (school && SCHOOL_KEY.test(school)) brand.school = school;
  const accent = parseAccent(input.accent);
  if (accent) brand.accent = accent;
  if (Array.isArray(input.chapters)) {
    const chapters = input.chapters.filter(item => typeof item === 'string' && item.trim()).map(item => item.trim()).slice(0, MAX_CHAPTERS);
    if (chapters.length) brand.chapters = chapters;
  }
  // 外观开关只保留合法取值;写成默认值时也原样保留,产物如实反映 goal 的设置。
  for (const field of STYLE_FIELDS) {
    const value = typeof input[field] === 'string' ? input[field].trim() : '';
    if (DECK_BRAND_STYLE_OPTIONS[field].includes(value)) brand[field] = value;
  }
  return Object.keys(brand).length ? brand : null;
}

/**
 * 校验 goal 里的 brand,返回错误文案数组(空数组表示通过)。
 * options.schools:主题声明的学校 key 列表(deckSchoolOptions 的结果);给了就检查 brand.school 在其中。
 */
export function validateDeckBrand(input, options = {}) {
  if (input === undefined || input === null) return [];
  if (typeof input !== 'object' || Array.isArray(input)) return ['deck field brand: must be an object'];
  const errors = [];
  for (const field of TEXT_FIELDS) {
    if (input[field] !== undefined && typeof input[field] !== 'string') errors.push(`deck field brand.${field}: must be a string`);
  }
  for (const field of BOOLEAN_FIELDS) {
    if (input[field] !== undefined && typeof input[field] !== 'boolean') errors.push(`deck field brand.${field}: must be true or false`);
  }
  if (input.accent !== undefined && !parseAccent(input.accent)) {
    errors.push('deck field brand.accent: must be a color like "#B5182A" or "181 24 42"');
  }
  if (input.chapters !== undefined) {
    if (!Array.isArray(input.chapters) || input.chapters.some(item => typeof item !== 'string' || !item.trim())) {
      errors.push('deck field brand.chapters: must be an array of non-empty strings');
    } else if (input.chapters.length > MAX_CHAPTERS) {
      errors.push(`deck field brand.chapters: at most ${MAX_CHAPTERS} chapters`);
    }
  }
  for (const field of STYLE_FIELDS) {
    if (input[field] === undefined) continue;
    const allowed = DECK_BRAND_STYLE_OPTIONS[field];
    if (typeof input[field] !== 'string' || !allowed.includes(input[field].trim())) {
      errors.push(`deck field brand.${field}: must be one of ${allowed.map(value => `"${value}"`).join(', ')}`);
    }
  }
  if (input.school !== undefined) {
    const schools = Array.isArray(options.schools) ? options.schools : null;
    const value = typeof input.school === 'string' ? input.school.trim().toLowerCase() : null;
    const listed = schools?.length ? ` (allowed: ${schools.map(key => `"${key}"`).join(', ')}; omit it or use "" for the generic cover)` : '';
    if (value === null) errors.push(`deck field brand.school: must be a school key string${listed}`);
    else if (value && (!SCHOOL_KEY.test(value) || (schools && !schools.includes(value)))) {
      errors.push(`deck field brand.school: unknown school "${input.school}"${listed || ' (no theme declares this school)'}`);
    }
  }
  const known = new Set([...TEXT_FIELDS, ...BOOLEAN_FIELDS, 'accent', 'chapters', ...STYLE_FIELDS, 'school']);
  for (const key of Object.keys(input)) {
    if (!known.has(key)) errors.push(`deck field brand.${key}: unknown field (allowed: ${[...known].join(', ')})`);
  }
  return errors;
}

// ———— 预览工作台的 deck 级设置(主题在 theme.deckStyles 里声明,选中值存在 deck 状态的 deckStyle 里) ————

const SETTING_KEY = /^[A-Za-z][\w-]{0,40}$/;
const isPlainObject = value => Boolean(value) && typeof value === 'object' && !Array.isArray(value);
const text = value => (typeof value === 'string' ? value.trim() : '');

/**
 * 把主题的 deckStyles 声明展开成设置项列表。声明里可以有分组条目({ type: 'group', key, label, fields: [...] }),
 * 分组外的条目是「全稿外观」里的单选开关(没有 type 或 type 为 'choice')。接受单个主题的声明数组,
 * 或 preview-options.deckStyles 那样按主题 key 分组的对象。同名 key 只取第一次出现的。
 */
export function flattenDeckSettingFields(declarations) {
  const lists = Array.isArray(declarations)
    ? [declarations]
    : isPlainObject(declarations) ? Object.values(declarations).filter(Array.isArray) : [];
  const seen = new Map();
  const visit = item => {
    if (!isPlainObject(item) || typeof item.key !== 'string') return;
    if (item.type === 'group') {
      (Array.isArray(item.fields) ? item.fields : []).forEach(visit);
      return;
    }
    if (!seen.has(item.key)) seen.set(item.key, item);
  };
  lists.forEach(list => list.forEach(visit));
  return [...seen.values()];
}

const initialOf = value => Array.from(text(value))[0] || '';

/**
 * 主题声明的学校 key 列表:deckStyles 里 key 为 school、带 options 的字段的取值(空值「通用」除外)。
 * 接受单个主题的声明数组或按主题分组的对象(同 flattenDeckSettingFields)。
 */
export function deckSchoolOptions(declarations) {
  const field = flattenDeckSettingFields(declarations).find(item => item.key === 'school' && Array.isArray(item.options));
  return field ? field.options.map(option => text(option?.value)).filter(Boolean) : [];
}

/** 媒体地址只收 data:image/、相对路径、http(s):不收 javascript: 之类的协议。 */
function isAcceptableMediaSrc(value) {
  if (/^data:image\//i.test(value)) return true;
  if (/^[a-z][a-z0-9+.-]*:/i.test(value)) return /^https?:/i.test(value);
  return true;
}

/**
 * 页面最终读到的 brand = goal 的 brand + 预览工作台的覆盖值(deck 状态的 deckStyle)。
 *   - 覆盖值是字符串时替换同名字段;空字符串表示「清空」——删掉这个字段,由主题默认值(占位)兜底;
 *     布尔值原样写入;accent 归一成 "r g b"(无法识别时忽略);logo 只收图片地址。
 *   - 主题声明里带 follows 的字段(如页脚说明跟随校名、文字校徽跟随校名首字)没有被单独填写时,按规则跟着来源字段变:
 *       rule 'replace'(默认):把原值里出现的旧来源值(goal 的值与主题默认占位)换成新来源值,不出现新旧并存;
 *       rule 'initial':原值是主题默认值或旧来源的首字时,换成新来源的首字(来源回到占位时回到默认值)。
 *     goal 里写了来源字段但没写跟随字段时同样适用(例如只写了 name,页脚占位「学校名称 · 学院名称」里带出真实校名)。
 * fields 是 flattenDeckSettingFields 的结果(提供默认值与 follows 规则)。不修改入参。
 */
export function resolveDeckBrand(base, overrides, fields = []) {
  const goal = isPlainObject(base) ? base : {};
  const over = isPlainObject(overrides) ? overrides : {};
  const brand = { ...goal };
  for (const [key, raw] of Object.entries(over)) {
    if (!SETTING_KEY.test(key)) continue;
    if (typeof raw === 'boolean') {
      brand[key] = raw;
      continue;
    }
    if (typeof raw !== 'string') continue;
    const value = raw.trim();
    if (!value) {
      delete brand[key];
      continue;
    }
    if (key === 'accent') {
      const rgb = parseAccent(value);
      if (rgb) brand.accent = rgb;
      continue;
    }
    if (key === 'logo' && !isAcceptableMediaSrc(value)) continue;
    brand[key] = value;
  }
  const byKey = new Map((Array.isArray(fields) ? fields : []).filter(field => isPlainObject(field) && typeof field.key === 'string').map(field => [field.key, field]));
  // 选项预设:单选字段(如「学校」)的当前取值带 brand 预设时,goal 和面板都没有单独写的字段取预设值
  // (显式写了的——包括面板里清空的——以显式的为准)。先于跟随规则执行,页脚说明等跟着预设的校名变。
  for (const field of byKey.values()) {
    if (!Array.isArray(field.options)) continue;
    const current = text(brand[field.key]);
    const option = current ? field.options.find(item => isPlainObject(item) && text(item.value) === current && isPlainObject(item.brand)) : null;
    if (!option) continue;
    for (const [key, value] of Object.entries(option.brand)) {
      if (!SETTING_KEY.test(key) || Object.prototype.hasOwnProperty.call(goal, key) || Object.prototype.hasOwnProperty.call(over, key)) continue;
      if (key === 'accent') {
        const rgb = parseAccent(value);
        if (rgb) brand.accent = rgb;
      } else if (typeof value === 'boolean' || (typeof value === 'string' && value.trim())) {
        brand[key] = typeof value === 'string' ? value.trim() : value;
      }
    }
  }
  for (const field of byKey.values()) {
    const follow = typeof field.follows === 'string' ? { key: field.follows } : field.follows;
    if (!isPlainObject(follow) || typeof follow.key !== 'string' || Object.prototype.hasOwnProperty.call(over, field.key)) continue;
    const placeholder = text(byKey.get(follow.key)?.default);
    const nextSource = text(brand[follow.key]) || placeholder;
    const baseSource = text(goal[follow.key]) || placeholder;
    const fieldDefault = text(field.default);
    const baseValue = text(goal[field.key]) || fieldDefault;
    let next = baseValue;
    if (follow.rule === 'initial') {
      if (baseValue === fieldDefault || baseValue === initialOf(baseSource)) {
        next = nextSource && nextSource !== placeholder ? initialOf(nextSource) : fieldDefault;
      }
    } else if (nextSource) {
      for (const previous of new Set([baseSource, placeholder])) {
        if (!previous || previous === nextSource || !next.includes(previous)) continue;
        if (nextSource.includes(previous) && next.includes(nextSource)) continue; // 已经是新值(新校名包含旧校名时)
        next = next.split(previous).join(nextSource);
      }
    }
    if (next && next !== baseValue) brand[field.key] = next;
  }
  return brand;
}
