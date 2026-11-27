// campus 学校素材的预览服务侧兜底(规则见 src/components/themes/campus/source/schools/bundle.mjs)。
//
// 渲染时 deck 只带选中学校的素材;预览工作台里切到另一所学校时:
//   - resolveSchoolAssetFallback:deck 目录里找不到的 assets/schools/<key>/<文件>,从仓库(或 Skill 安装目录)
//     的素材目录 src/components/themes/campus/source/assets/schools/ 只读提供;只认登记过的学校 key 与单层文件名。
//   - ensureDeckSchoolAssets:自动保存 / 烧回 index.html 时,把 deck 状态里选中学校的素材和字体补拷进 deck,
//     保存后的稿子离开预览服务也不缺图。
import { copyFileSync, existsSync, mkdirSync, readdirSync, realpathSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseSchoolAssetPath, schoolFontFileNames, selectedSchoolKeys, SCHOOL_ASSET_DIR } from '../../src/components/themes/campus/source/schools/bundle.mjs';
import { isPathInside } from './static-serve.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

/** 仓库里的学校素材目录(可用 DASHI_CAMPUS_SCHOOL_ASSETS_DIR 指到别处,测试用)。 */
export function schoolAssetSourceDir() {
  return path.resolve(process.env.DASHI_CAMPUS_SCHOOL_ASSETS_DIR || path.join(ROOT, 'src/components/themes/campus/source/assets/schools'));
}

/** 请求路径 → 仓库素材文件的绝对路径;不是学校素材、或文件不存在时返回 null。 */
export function resolveSchoolAssetFallback(pathname, sourceDir = schoolAssetSourceDir()) {
  const hit = parseSchoolAssetPath(pathname);
  if (!hit) return null;
  const file = path.join(sourceDir, hit.key, hit.file);
  try {
    const real = realpathSync(file);
    if (!isPathInside(realpathSync(sourceDir), real)) return null;
    return statSync(real).isFile() ? real : null;
  } catch {
    return null;
  }
}

/**
 * 把这些学校的素材补拷进 deck(已存在的文件不动)。返回补拷的文件数;不认识的 key 忽略。
 * deckRoot 是 deck 的 ppt 目录(index.html 所在目录)。
 */
export function ensureDeckSchoolAssets(deckRoot, schools, sourceDir = schoolAssetSourceDir()) {
  let copied = 0;
  for (const key of selectedSchoolKeys(schools)) {
    const files = [];
    const dir = path.join(sourceDir, key);
    if (existsSync(dir)) {
      for (const name of readdirSync(dir)) {
        if (parseSchoolAssetPath(`${SCHOOL_ASSET_DIR}/${key}/${name}`)) files.push([path.join(dir, name), path.join(deckRoot, SCHOOL_ASSET_DIR, key, name)]);
      }
    }
    for (const name of schoolFontFileNames(key)) {
      files.push([path.join(sourceDir, '_fonts', name), path.join(deckRoot, SCHOOL_ASSET_DIR, '_fonts', name)]);
    }
    for (const [from, to] of files) {
      if (existsSync(to) || !existsSync(from)) continue;
      mkdirSync(path.dirname(to), { recursive: true });
      copyFileSync(from, to);
      copied += 1;
    }
  }
  return copied;
}
