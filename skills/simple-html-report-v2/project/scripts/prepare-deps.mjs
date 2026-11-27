#!/usr/bin/env node
// 准备安装版 skill 的运行依赖(render_goal_deck.sh / .ps1 每次生成前调用;依赖已就绪时秒过)。
//
// 依赖默认不装进技能目录:宿主(如豆包工作)校验技能目录的体积 / 文件数,就地 npm install 后
// project/node_modules 约 2500 个文件、70 MB,用过一次技能就可能被判超限、移走。放法见 dashi-paths.mjs:
//
//   link(缺省)  装到 ~/.dashi-ppt/deps/<依赖指纹>/,project/node_modules 是指向它的符号链接 / junction;
//                链接建不出来时自动改用 external(不需要链接也能运行)。
//   external     装到同一位置,技能目录里不放链接;npm 命令经 scripts/dashi-run.mjs 解析外部依赖。
//   local        旧做法,就地装进 project/node_modules。外部目录不可写 / 外部安装失败时也自动退回这里。
//
// 升级:技能目录里已有就地安装的 project/node_modules(真目录)时,不动它、继续用(依赖清单变了就照旧
// 在原地补装),只提示可以迁移;加 --migrate 才会装到外部目录并删掉这份就地安装。
// 依赖指纹只由依赖清单决定:多个版本 / 多个技能目录可共用同一份外部依赖,依赖一变就换新目录,旧目录保留。
//
// 用法:node scripts/prepare-deps.mjs [--migrate] [--quiet]
// 退出码:0 依赖可用;1 安装失败。
import { spawnSync } from 'node:child_process';
import {
  copyFileSync, existsSync, lstatSync, mkdirSync, readFileSync, readdirSync, readlinkSync, renameSync,
  rmSync, rmdirSync, statSync, symlinkSync, unlinkSync, writeFileSync,
} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  DEPS_READY_MARK, depsHome, externalDepsRoot, isDepsReady, isDirectory, resolveDepsMode,
} from './dashi-paths.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(HERE, '..');
const LOCAL_NODE_MODULES = path.join(PROJECT_ROOT, 'node_modules');
const MIRROR_REGISTRY = 'registry=https://registry.npmmirror.com';
const STAGING_MAX_AGE_MS = 6 * 60 * 60 * 1000;
const args = new Set(process.argv.slice(2));
const quiet = args.has('--quiet');

const info = message => { if (!quiet) console.log(`[dashi-ppt] ${message}`); };
const warn = message => console.error(`[dashi-ppt] ${message}`);

try {
  process.exit(main());
} catch (error) {
  warn(`依赖准备出错: ${error?.message || error}`);
  process.exit(1);
}

function main() {
  restoreNpmrc();
  const { mode, invalid } = resolveDepsMode();
  if (invalid) warn(`DASHI_PPT_DEPS_MODE / config.json 的 depsMode 值「${invalid}」无效(可选 link / external / local),按 link 处理。`);

  const local = lstatOrNull(LOCAL_NODE_MODULES);
  if (mode === 'local') {
    if (local?.isSymbolicLink()) removeLink(LOCAL_NODE_MODULES);
    return finish(ensureLocalInstall());
  }
  if (local && !local.isSymbolicLink()) {
    if (!args.has('--migrate')) {
      info('project/node_modules 是就地安装的依赖(在技能目录里),继续沿用。'
        + '它约有 2500 个文件,可能让宿主判定技能目录超限;运行 `node <skill-root>/project/scripts/prepare-deps.mjs --migrate` '
        + '可改为装到技能目录之外并删除这份就地安装。');
      return finish(ensureLocalInstall());
    }
  }

  const depsRoot = externalDepsRoot(PROJECT_ROOT);
  if (!isDepsReady(depsRoot)) {
    const installed = installExternal(depsRoot);
    if (!installed) {
      warn(`依赖装不到技能目录之外(${displayPath(depsHome())}),改为就地安装到 project/node_modules。`
        + '这样技能目录会多出约 2500 个文件;可设置环境变量 DASHI_PPT_DEPS_DIR 指向一个可写目录后重试。');
      if (lstatOrNull(LOCAL_NODE_MODULES)?.isSymbolicLink()) removeLink(LOCAL_NODE_MODULES);
      return finish(ensureLocalInstall());
    }
  }
  touchUsed(depsRoot);
  const externalModules = path.join(depsRoot, 'node_modules');

  if (local && !local.isSymbolicLink() && args.has('--migrate')) {
    rmSync(LOCAL_NODE_MODULES, { recursive: true, force: true });
    info('已删除技能目录里就地安装的 project/node_modules,改用技能目录之外的依赖。');
  }

  if (mode === 'external') {
    if (lstatOrNull(LOCAL_NODE_MODULES)?.isSymbolicLink()) removeLink(LOCAL_NODE_MODULES);
    info(`依赖就绪(不依赖链接):${displayPath(depsRoot)}`);
    return finish(externalModules);
  }

  if (!ensureLink(externalModules)) {
    warn('无法在 project/ 下创建指向外部依赖的链接,改用不依赖链接的方式运行(效果相同);'
      + '也可设置 DASHI_PPT_DEPS_MODE=external 跳过建链接。');
  } else {
    info(`依赖就绪:project/node_modules → ${displayPath(externalModules)}`);
  }
  return finish(externalModules);
}

// 依赖可用后装无头浏览器(chromium headless shell)。沙箱型宿主(如豆包)会拦完整版 Chrome 的单例锁,
// headless shell 同一沙箱下可正常导出。幂等(已装秒过);下载失败不阻塞(导出回退系统 Chrome)。
// 浏览器下载到 Playwright 的用户级缓存(macOS ~/Library/Caches/ms-playwright 等),不在技能目录里。
function finish(nodeModules) {
  if (!nodeModules) return 1;
  const cli = path.join(nodeModules, 'playwright-core', 'cli.js');
  if (existsSync(cli) && process.env.DASHI_PPT_SKIP_BROWSER_INSTALL !== '1') {
    const env = { ...process.env };
    // 镜像模式下浏览器二进制同样走 npmmirror(官方认可的 playwright 镜像),否则国内下载必败。
    if (!env.PLAYWRIGHT_DOWNLOAD_HOST && readText(path.join(PROJECT_ROOT, '.npmrc')).includes(MIRROR_REGISTRY)) {
      env.PLAYWRIGHT_DOWNLOAD_HOST = 'https://cdn.npmmirror.com/binaries/playwright';
    }
    spawnSync(process.execPath, [cli, 'install', 'chromium-headless-shell'], { stdio: 'ignore', env });
  }
  return 0;
}

// 旧做法:就地 npm install(依赖缺失或清单比安装哨兵新时才装)。返回 node_modules 路径或 null。
function ensureLocalInstall() {
  const stamp = path.join(LOCAL_NODE_MODULES, '.package-lock.json');
  const stale = !isDirectory(LOCAL_NODE_MODULES)
    || !existsSync(stamp)
    || ['package.json', 'package-lock.json'].some(name => mtimeMs(path.join(PROJECT_ROOT, name)) > mtimeMs(stamp));
  if (!stale) return LOCAL_NODE_MODULES;
  probeRegistry();
  return runNpmInstall(PROJECT_ROOT) ? LOCAL_NODE_MODULES : null;
}

// 外部安装:在 deps/ 下的临时目录装好、写就绪标记,再整体改名成 deps/<指纹>/(并发安装时先到先得)。
function installExternal(depsRoot) {
  const home = path.dirname(depsRoot);
  const staging = `${depsRoot}.staging-${process.pid}-${Date.now().toString(36)}`;
  try {
    mkdirSync(home, { recursive: true });
    cleanupStaleStaging(home, path.basename(depsRoot));
    mkdirSync(staging, { recursive: true });
  } catch (error) {
    warn(`无法创建依赖目录: ${error?.code || error?.message || error}`);
    return false;
  }
  try {
    probeRegistry();
    for (const name of ['package.json', 'package-lock.json', '.npmrc']) {
      const from = path.join(PROJECT_ROOT, name);
      if (existsSync(from)) copyFileSync(from, path.join(staging, name));
    }
    info(`首次准备运行依赖(装到技能目录之外:${displayPath(depsRoot)}),需要一两分钟…`);
    if (!runNpmInstall(staging)) return false;
    writeFileSync(path.join(staging, DEPS_READY_MARK), `${JSON.stringify({
      fingerprint: path.basename(depsRoot),
      version: readJson(path.join(PROJECT_ROOT, 'package.json'))?.version || '',
      node: process.version,
      installedAt: new Date().toISOString(),
    }, null, 2)}\n`);
    if (isDepsReady(depsRoot)) return true; // 并发的另一次安装已经先完成
    if (existsSync(depsRoot)) {
      // 没有就绪标记的残留(中断的旧安装):挪开再删,不影响正在用它的进程
      const broken = `${depsRoot}.broken-${process.pid}`;
      renameSync(depsRoot, broken);
      rmSync(broken, { recursive: true, force: true });
    }
    try {
      renameSync(staging, depsRoot);
    } catch (error) {
      if (!isDepsReady(depsRoot)) throw error;
    }
    return isDepsReady(depsRoot);
  } catch (error) {
    warn(`外部依赖安装失败: ${error?.message || error}`);
    return false;
  } finally {
    if (existsSync(staging)) rmSync(staging, { recursive: true, force: true });
  }
}

function cleanupStaleStaging(home, fingerprint) {
  let entries = [];
  try {
    entries = readdirSync(home);
  } catch {
    return;
  }
  for (const entry of entries) {
    if (!entry.startsWith(`${fingerprint}.staging-`) && !entry.startsWith(`${fingerprint}.broken-`)) continue;
    const full = path.join(home, entry);
    if (Date.now() - mtimeMs(full) > STAGING_MAX_AGE_MS) rmSync(full, { recursive: true, force: true });
  }
}

// project/node_modules → 外部 node_modules。已是指向别处的链接(旧指纹 / 失效)就改指;只动链接本身。
function ensureLink(target) {
  const current = lstatOrNull(LOCAL_NODE_MODULES);
  if (current?.isSymbolicLink()) {
    if (sameDirectory(LOCAL_NODE_MODULES, target)) return true;
    removeLink(LOCAL_NODE_MODULES);
  } else if (current) {
    return false; // 真目录:调用方已处理(--migrate 才会删),这里不覆盖
  }
  try {
    symlinkSync(target, LOCAL_NODE_MODULES, process.platform === 'win32' ? 'junction' : 'dir');
    return isDirectory(LOCAL_NODE_MODULES);
  } catch (error) {
    warn(`创建链接失败: ${error?.code || error?.message || error}`);
    if (lstatOrNull(LOCAL_NODE_MODULES)?.isSymbolicLink()) removeLink(LOCAL_NODE_MODULES);
    return false;
  }
}

function sameDirectory(link, target) {
  try {
    const raw = readlinkSync(link);
    if (path.resolve(path.dirname(link), raw) === path.resolve(target)) return isDirectory(link);
    return isDirectory(link) && statSync(link).ino === statSync(target).ino;
  } catch {
    return false;
  }
}

function removeLink(link) {
  try {
    unlinkSync(link);
  } catch {
    rmdirSync(link); // Windows junction
  }
}

// 首装前探测 npm 源(官方可达走官方,不可达锁 npmmirror);探测失败不阻塞,缺省 .npmrc 已指 npmmirror。
function probeRegistry() {
  const probe = path.join(HERE, 'ensure-registry.mjs');
  if (existsSync(probe)) spawnSync(process.execPath, [probe], { stdio: 'ignore', cwd: PROJECT_ROOT });
}

function runNpmInstall(cwd) {
  const result = spawnSync('npm', ['install', '--no-audit', '--no-fund'], {
    cwd,
    // 输出走 stderr:调用方(dashi-run.mjs)的 stdout 可能是要给程序解析的 JSON
    stdio: ['ignore', 2, 2],
    shell: process.platform === 'win32',
  });
  if (result.status === 0) return true;
  warn(`npm install 失败(退出码 ${result.status ?? result.error?.code ?? '未知'})。`);
  return false;
}

// .npmrc 缺失时从模板重建(npm publish 会剔除 .npmrc,个别安装路径可能丢失)。
function restoreNpmrc() {
  const npmrc = path.join(PROJECT_ROOT, '.npmrc');
  const template = path.join(PROJECT_ROOT, 'npmrc.template');
  if (!existsSync(npmrc) && existsSync(template)) copyFileSync(template, npmrc);
}

function touchUsed(depsRoot) {
  try {
    writeFileSync(path.join(depsRoot, '.last-used'), `${new Date().toISOString()}\n`);
  } catch {
    // 只是记录,写不了不影响
  }
}

// 提示里的路径把用户主目录写成 ~(日志会被宿主转给模型和用户,不必暴露完整本机路径)
function displayPath(target) {
  const home = os.homedir();
  const resolved = path.resolve(target);
  return home && resolved.startsWith(home + path.sep) ? `~${path.sep}${path.relative(home, resolved)}` : resolved;
}

function lstatOrNull(target) {
  try {
    return lstatSync(target);
  } catch {
    return null;
  }
}

function mtimeMs(file) {
  try {
    return statSync(file).mtimeMs;
  } catch {
    return 0;
  }
}

function readText(file) {
  try {
    return readFileSync(file, 'utf8');
  } catch {
    return '';
  }
}

function readJson(file) {
  try {
    return JSON.parse(readFileSync(file, 'utf8'));
  } catch {
    return null;
  }
}

