// campus 学校定制封面 / 目录:学校注册表(纯数据,Node 与浏览器都能直接 import)。
//
// 每所学校一个目录 source/schools/<key>/:
//   meta.mjs    这所学校的基本信息(校名、校色、校徽、画面类型、封面变体、目录条目数、字体、调色板、学校自己的默认文字)
//   index.jsx   封面 / 目录组件(由 ./pages.jsx 汇总;还没实现的学校导出空组件,页面退回通用封面 / 目录)
//   layers.json 需要合成的矢量装饰层(可选,scripts/campus-schools/extract-assets.py 读它)
// 素材在 source/assets/schools/<key>/(提取脚本生成,manifest.json 是清单)。
//
// 12 所学校的 key 由公共约定写死,这里已全部登记(按约定表的顺序)。新增学校时:建目录、写 meta.mjs,
// 在下面加一行 import 和一项列表,在 ./pages.jsx 加一行导出(详见 docs/campus-schools.md)。
import sjtu from './sjtu/meta.mjs';
import scu from './scu/meta.mjs';
import sysu from './sysu/meta.mjs';
import henu from './henu/meta.mjs';
import seu from './seu/meta.mjs';
import thu from './thu/meta.mjs';
import pku from './pku/meta.mjs';
import zju from './zju/meta.mjs';
import whu from './whu/meta.mjs';
import xmu from './xmu/meta.mjs';
import ynu from './ynu/meta.mjs';
import neu from './neu/meta.mjs';

export const CAMPUS_SCHOOLS = Object.freeze([sjtu, scu, sysu, henu, seu, thu, pku, zju, whu, xmu, ynu, neu]);
export const CAMPUS_SCHOOL_KEYS = Object.freeze(CAMPUS_SCHOOLS.map(school => school.key));

const BY_KEY = new Map(CAMPUS_SCHOOLS.map(school => [school.key, school]));

/** 按 key 取学校;不认识的 key(含空串)返回 null。 */
export function campusSchool(key) {
  return typeof key === 'string' ? BY_KEY.get(key.trim()) || null : null;
}

/** 学校素材在 deck 里的相对路径(渲染时只把选中学校的素材拷进 deck 的 assets/schools/,见 ./bundle.mjs)。 */
export const SCHOOL_ASSET_PREFIX_RE = /^(?:\.\/)?assets\/schools\//;

export function schoolAsset(key, file) {
  return file ? `assets/schools/${key}/${file}` : '';
}

/** 学校的彩色校徽(浅色底上用)与白色校徽(深色底上用)在 deck 里的路径;没有的为 ''。 */
export function schoolLogos(school) {
  if (!school) return { color: '', inverse: '' };
  return { color: schoolAsset(school.key, school.logo?.color), inverse: schoolAsset(school.key, school.logo?.inverse) };
}

/**
 * 选了学校、且 goal / 预览面板没有单独指定时,brand 字段取这所学校的默认值
 * (src/deck-brand.mjs 的 resolveDeckBrand 按「学校」选项上的 brand 预设执行)。
 * 校徽:有彩色版时预设为彩色版(深色页眉换白色版由 chrome.jsx 的 CampusBrand 处理);只有白色版时不预设 LOGO,
 * 浅色页眉显示文字校徽、深色页眉显示白色校徽。
 */
export function schoolBrandPreset(school) {
  if (!school) return {};
  const logos = schoolLogos(school);
  return {
    name: school.name,
    nameEn: school.nameEn,
    accent: school.accent,
    ...(logos.color ? { logo: logos.color, logoHasName: Boolean(school.logo?.hasName) } : {}),
  };
}

/** 封面变体在模板里的中文名(控件与文档用)。 */
export const COVER_VARIANT_LABELS = Object.freeze({ default: '原版', long_title: '长标题版', keyword: '关键词大字版' });
