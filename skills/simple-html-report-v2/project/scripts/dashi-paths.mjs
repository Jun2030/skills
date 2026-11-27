// 运行时文件的落点(安装版 skill 的 project/scripts/ 随包分发)。
//
// 宿主(如豆包工作)会校验已安装技能目录的体积 / 文件数,超限的技能被移走、不可用。所以运行时产生的
// 大量文件——npm 依赖(约 2500 个文件、70 MB)、学校原生模板下载缓存(每所 45–90 MB)、本机 HTTPS 证书——
// 默认都放在技能目录之外的用户级目录:
//
//   ~/.dashi-ppt/                      DASHI_PPT_HOME 可改
//     deps/<依赖指纹>/node_modules     DASHI_PPT_DEPS_DIR 可改 deps 这一层
//     campus-native/<学校>.pptx        DASHI_CAMPUS_NATIVE_CACHE_DIR 可改(实现在导出引擎 native-fetch.mjs)
//     https-preview/                   DASHI_PPT_CERT_DIR 可改
//     config.json                      { "depsMode": "link" | "external" | "local" }
//
// 依赖的三种放法(环境变量 DASHI_PPT_DEPS_MODE 优先,其次 config.json 的 depsMode,缺省 link):
//   link      依赖装在 deps/<指纹>/,project/node_modules 只是指向它的符号链接(Windows 用 junction)。
//   external  同样装在 deps/<指纹>/,但技能目录里不放任何链接;project 的 npm 命令经 scripts/dashi-run.mjs
//             启动,用模块解析钩子 + NODE_PATH 找到外部依赖。宿主统计文件数时如果会跟随符号链接,用这个。
//   local     旧做法:就地装进 project/node_modules(外部目录不可写时也会自动退回这里)。
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, statSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

export const DEPS_READY_MARK = '.dashi-deps-ready.json';
const MODE_ALIASES = new Map([
  ['link', 'link'],
  ['symlink', 'link'],
  ['junction', 'link'],
  ['external', 'external'],
  ['nolink', 'external'],
  ['no-link', 'external'],
  ['local', 'local'],
  ['inplace', 'local'],
  ['in-place', 'local'],
]);

export function dashiHome(env = process.env) {
  const explicit = String(env.DASHI_PPT_HOME || '').trim();
  return path.resolve(explicit || path.join(os.homedir(), '.dashi-ppt'));
}

export function readDashiConfig(env = process.env) {
  try {
    const config = JSON.parse(readFileSync(path.join(dashiHome(env), 'config.json'), 'utf8'));
    return config && typeof config === 'object' ? config : {};
  } catch {
    return {};
  }
}

/** 依赖放法:link | external | local;写错的值当作缺省 link,并在 invalid 里带回原值供提示。 */
export function resolveDepsMode(env = process.env) {
  const fromEnv = String(env.DASHI_PPT_DEPS_MODE || '').trim().toLowerCase();
  const fromConfig = String(readDashiConfig(env).depsMode || '').trim().toLowerCase();
  const raw = fromEnv || fromConfig;
  const mode = MODE_ALIASES.get(raw);
  return { mode: mode || 'link', source: raw ? (fromEnv ? 'env' : 'config') : 'default', invalid: raw && !mode ? raw : '' };
}

export function depsHome(env = process.env) {
  const explicit = String(env.DASHI_PPT_DEPS_DIR || '').trim();
  return path.resolve(explicit || path.join(dashiHome(env), 'deps'));
}

/**
 * 依赖指纹:只看依赖本身(lock 里除根条目外的全部包 + 根的依赖声明)和平台。
 * 版本号变了但依赖没变时指纹不变,继续用同一份外部依赖;依赖一变就换目录,新旧版本互不干扰。
 */
export function depsFingerprint(projectRoot) {
  const pkg = readJson(path.join(projectRoot, 'package.json')) || {};
  const lock = readJson(path.join(projectRoot, 'package-lock.json')) || {};
  const packages = { ...(lock.packages || {}) };
  delete packages[''];
  const payload = stableStringify({
    dependencies: pkg.dependencies || {},
    devDependencies: pkg.devDependencies || {},
    optionalDependencies: pkg.optionalDependencies || {},
    packages,
    platform: process.platform,
    arch: process.arch,
  });
  return createHash('sha256').update(payload).digest('hex').slice(0, 16);
}

export function externalDepsRoot(projectRoot, env = process.env) {
  return path.join(depsHome(env), depsFingerprint(projectRoot));
}

export function isDepsReady(depsRoot) {
  return existsSync(path.join(depsRoot, DEPS_READY_MARK)) && isDirectory(path.join(depsRoot, 'node_modules'));
}

/**
 * 当前该用哪一份依赖:{ dir, kind: 'project' | 'external' },都没有返回 null。
 * project/node_modules 能用(真目录或指向有效目标的链接)就用它;否则用外部 deps/<指纹>/node_modules。
 */
export function resolveActiveNodeModules(projectRoot, env = process.env) {
  const local = path.join(projectRoot, 'node_modules');
  const external = externalDepsRoot(projectRoot, env);
  const { mode } = resolveDepsMode(env);
  if (mode !== 'external' && isDirectory(local)) return { dir: local, kind: 'project' };
  if (mode !== 'local' && isDepsReady(external)) return { dir: path.join(external, 'node_modules'), kind: 'external' };
  if (isDirectory(local)) return { dir: local, kind: 'project' };
  return null;
}

export function isDirectory(target) {
  try {
    return statSync(target).isDirectory();
  } catch {
    return false;
  }
}

function readJson(file) {
  try {
    return JSON.parse(readFileSync(file, 'utf8'));
  } catch {
    return null;
  }
}

function stableStringify(value) {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}
