// 预览服务的运行时目录:导出文件(PPTX / PDF / 导出记录)和本机 HTTPS 自签证书。
//
// 以前固定写在 <project>/output/exports、<project>/output/https-preview。安装版的 <project> 在技能目录里,
// 宿主(如豆包工作)限制技能目录体积 / 文件数,一份带学校原生页的 PPTX 就 50–90 MB,所以:
//   - 预览的稿子在项目之外(安装版的正常用法:稿子写在调用方的工作目录):
//       导出文件 → 稿子旁边的 exports/(<稿子目录>/ppt 的上一级,即 <稿子目录>/exports)
//       证书     → 用户级目录 ~/.dashi-ppt/https-preview(DASHI_PPT_HOME 可改)
//   - 预览的稿子在项目里(开发仓库的主题预览等):保持旧位置不变。
// 环境变量 DASHI_PPT_EXPORT_DIR / DASHI_PPT_CERT_DIR 可直接指定;首选位置建不出来时退回旧位置。
import { mkdirSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

export function resolvePreviewRuntimeDirs({ root, serveRoot, env = process.env }) {
  const legacyExportDir = path.join(root, 'output/exports');
  const legacyCertDir = path.join(root, 'output/https-preview');
  const inProject = isPathInside(path.resolve(root), path.resolve(serveRoot));
  const home = String(env.DASHI_PPT_HOME || '').trim() || path.join(os.homedir(), '.dashi-ppt');
  const exportDir = pickDir(
    String(env.DASHI_PPT_EXPORT_DIR || '').trim() || (inProject ? legacyExportDir : path.join(path.dirname(path.resolve(serveRoot)), 'exports')),
    legacyExportDir,
  );
  const certDir = pickDir(
    String(env.DASHI_PPT_CERT_DIR || '').trim() || (inProject ? legacyCertDir : path.join(home, 'https-preview')),
    legacyCertDir,
  );
  return { exportDir, certDir };
}

function pickDir(preferred, fallback) {
  const target = path.resolve(preferred);
  try {
    mkdirSync(target, { recursive: true });
    return target;
  } catch {
    return path.resolve(fallback);
  }
}

function isPathInside(parent, child) {
  const relative = path.relative(parent, child);
  return relative === '' || (!!relative && !relative.startsWith('..') && !path.isAbsolute(relative));
}
