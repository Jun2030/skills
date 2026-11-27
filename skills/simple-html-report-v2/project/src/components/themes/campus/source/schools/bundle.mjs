// campus 学校素材随稿打包规则(纯数据 / 纯函数,渲染器 src/renderDeck.jsx 与预览服务都 import 它)。
//
// 渲染时只把「这份稿子选中的学校」的素材拷进 deck:
//   assets/schools/<key>/…           这所学校的图片、3D 渲染图、视频、装饰层
//   assets/schools/_fonts/<file>      这所学校 meta.fonts 用到的展示字体(fonts.mjs 登记的文件)
// 另外每份 campus 稿都带预览面板「学校」选项用到的校徽(每校的白色版和彩色版,12 校合计不到 1 MB),
// 静态托管 / file:// 打开时面板不出现 404 与破图。没选学校的 campus 稿除徽章外不带任何学校素材。预览工作台里切到别的学校时,预览服务从仓库的素材目录兜底提供
// (scripts/serve-preview-https.mjs),自动保存时把切换后的学校素材补进 deck(scripts/preview/export-routes.mjs)。
import { CAMPUS_SCHOOLS, campusSchool, schoolLogos } from './registry.mjs';
import { SCHOOL_FONTS, SCHOOL_FONT_DIR } from './fonts.mjs';

/** 学校素材在 deck 里的目录前缀(相对 deck 根目录 / 主题 source 目录)。 */
export const SCHOOL_ASSET_DIR = 'assets/schools';

/** 一所学校用到的字体文件名(不含目录);不认识的学校返回 []。 */
export function schoolFontFileNames(key) {
  const school = campusSchool(key);
  if (!school) return [];
  const files = new Set();
  for (const family of school.fonts || []) {
    const font = SCHOOL_FONTS[family];
    if (!font) continue;
    files.add(font.file);
    if (font.bold) files.add(font.bold);
  }
  return [...files];
}

/** 一所学校用到的字体在 deck 里的相对路径(assets/schools/_fonts/<file>)。 */
export function schoolFontFiles(key) {
  return schoolFontFileNames(key).map(file => `${SCHOOL_FONT_DIR}/${file}`);
}

/** goal / deck 状态里的 brand.school → 认识的学校 key 列表(去重、小写;不认识或为空返回 [])。 */
export function selectedSchoolKeys(...values) {
  const keys = new Set();
  for (const value of values.flat()) {
    const school = campusSchool(typeof value === 'string' ? value.trim().toLowerCase() : '');
    if (school) keys.add(school.key);
  }
  return [...keys];
}

/**
 * 面板「学校」选项要用到的校徽:deck 内相对路径列表。
 * 每校的白色版(徽章 option.image)和彩色版(预设 brand.logo)都带上——成品 HTML 的 preview-options 里
 * 两张都会被引用,少带任何一张,成品 deck 的素材检查(validate-swiss-deck)就会报缺文件。
 */
export function schoolBadgeFiles() {
  const files = new Set();
  for (const school of CAMPUS_SCHOOLS) {
    const logos = schoolLogos(school);
    if (logos.inverse) files.add(logos.inverse);
    if (logos.color) files.add(logos.color);
  }
  return [...files];
}

/**
 * 主题 source 目录下的一个素材相对路径(`/` 分隔)要不要拷进 deck。
 * 不在 assets/schools/ 下的素材一律要;学校素材只要选中学校的目录和它用到的字体。
 * keys 为 null 表示「全部学校都要」(多主题调试总览 showcase)。
 */
export function wantSchoolAsset(rel, keys) {
  const prefix = `${SCHOOL_ASSET_DIR}/`;
  if (!rel.startsWith(prefix)) return true;
  if (keys === null) return true;
  if (schoolBadgeFiles().includes(rel)) return true;
  const rest = rel.slice(prefix.length);
  const [dir, ...tail] = rest.split('/');
  if (dir === '_fonts') {
    const name = tail.join('/');
    return keys.some(key => schoolFontFileNames(key).includes(name));
  }
  return keys.includes(dir);
}

/**
 * deck 里请求的路径是不是学校素材(预览服务兜底用):返回 {key, file} 或 null。
 * key 为 '_fonts' 时 file 是字体文件名。只认单层文件名(字母数字 . _ -),不认识的学校 key 返回 null。
 */
export function parseSchoolAssetPath(pathname) {
  const m = /(?:^|\/)assets\/schools\/([a-z0-9_]+)\/([A-Za-z0-9][A-Za-z0-9._-]*)$/.exec(String(pathname || ''));
  if (!m) return null;
  const [, key, file] = m;
  if (file.includes('..')) return null;
  if (key !== '_fonts' && !campusSchool(key)) return null;
  if (!/\.(png|jpe?g|webp|gif|svg|mp4|mov|webm|woff2?|ttf|otf)$/i.test(file)) return null;
  return { key, file };
}
