// 学校素材是否可用(浏览器运行时)。
//
// 渲染时 deck 只带选中学校的素材(schools/bundle.mjs)。通过预览服务打开时,切到别的学校由服务兜底提供素材,
// 一律视为可用;只有 file:// 直接打开、且切到了 deck 里没带素材的学校时才会缺图:
//   - 页眉校徽是学校素材时先探测这张图(new Image),加载失败 → 这所学校标为「缺素材」;
//   - 学校封面 / 目录舞台(kit.jsx 的 SchoolStage)里任何一张图 / 视频加载失败 → 同样标为「缺素材」。
// 标为缺素材后,campus 页面外壳(kit/base.jsx 的 withCampusBase)把 brand.school 当作未选、去掉指向学校素材的 LOGO,
// 封面 / 目录退回通用版,不出现破图;同时派发 window 事件 `dashi:campus-school-assets-missing`(预览面板显示一句提示)。
import { SCHOOL_ASSET_PREFIX_RE } from './registry.mjs';

const status = new Map(); // key → 'missing' | 'ok'
const probing = new Set();
const listeners = new Set();

function isFileProtocol() {
  try {
    return typeof window !== 'undefined' && window.location?.protocol === 'file:';
  } catch {
    return false;
  }
}

/** 这所学校的素材是否已知缺失(只在 file:// 下可能为 true)。 */
export function schoolAssetsMissing(key) {
  return Boolean(key) && status.get(key) === 'missing';
}

export function subscribeSchoolAssets(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** 标记一所学校缺素材(只在 file:// 下生效,重复调用无副作用)。 */
export function markSchoolAssetsMissing(key, detail = '') {
  if (!key || !isFileProtocol() || status.get(key) === 'missing') return;
  status.set(key, 'missing');
  try {
    console.warn(`[campus] 本地直接打开时没有带「${key}」的学校素材${detail ? `(${detail})` : ''},封面 / 目录先显示通用版;通过预览服务打开可看到学校定制版。`);
    window.dispatchEvent(new CustomEvent('dashi:campus-school-assets-missing', { detail: { school: key, file: detail } }));
  } catch {}
  for (const listener of [...listeners]) {
    try { listener(key); } catch {}
  }
}

/** file:// 下探测一张学校素材图(通常是页眉校徽);加载失败就标记缺素材。非 file:// 或已探测过时什么都不做。 */
export function probeSchoolAsset(key, src) {
  if (!key || !src || !isFileProtocol() || status.has(key) || probing.has(src)) return;
  if (!SCHOOL_ASSET_PREFIX_RE.test(src)) return;
  probing.add(src);
  try {
    const img = new Image();
    img.onload = () => { if (!status.has(key)) status.set(key, 'ok'); };
    img.onerror = () => markSchoolAssetsMissing(key, src);
    img.src = src;
  } catch {}
}

/** 监听学校舞台里图片 / 视频的加载失败(file:// 下);返回取消函数。 */
export function watchSchoolStage(key, node) {
  if (!key || !node || !isFileProtocol()) return () => {};
  const fail = event => {
    const el = event?.target;
    if (el && (el.tagName === 'IMG' || el.tagName === 'VIDEO')) markSchoolAssetsMissing(key, el.getAttribute('src') || '');
  };
  node.addEventListener('error', fail, true);
  for (const img of node.querySelectorAll('img')) {
    if (img.complete && img.naturalWidth === 0 && img.getAttribute('src')) markSchoolAssetsMissing(key, img.getAttribute('src'));
  }
  return () => node.removeEventListener('error', fail, true);
}
