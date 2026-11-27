#!/usr/bin/env node
// 安装版 project/package.json 里每条 npm 命令的启动器:
//   node scripts/dashi-run.mjs node scripts/<x>.mjs [参数…]
//   node scripts/dashi-run.mjs tsx  scripts/<x>.jsx [参数…]
//
// 依赖可能在 project/node_modules(就地安装,或指向外部依赖的链接),也可能只在技能目录之外的
// ~/.dashi-ppt/deps/<指纹>/(「不依赖链接」方式,见 dashi-paths.mjs)。这里找到当前该用的那一份:
//   - project/node_modules 可用:原样启动,与以前完全一样;
//   - 只有外部依赖:给子进程设 DASHI_PPT_NODE_MODULES / NODE_PATH / PATH,并用 NODE_OPTIONS=--import
//     注入 deps-hook.mjs,让 ESM 裸模块名也能解析到外部依赖(子进程、后台预览服务都会继承);
//   - 哪份都没有:tsx 命令先自动准备依赖(prepare-deps.mjs);node 命令照常启动(不需要依赖的命令照样能用)。
// 本脚本不往 stdout 打印任何东西(layout:query 等命令的 JSON 输出要保持干净)。
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { resolveActiveNodeModules } from './dashi-paths.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(HERE, '..');

const [runner, script, ...rest] = process.argv.slice(2);
if (!['node', 'tsx'].includes(runner) || !script) {
  console.error('Usage: node scripts/dashi-run.mjs <node|tsx> <script> [args...]');
  process.exit(2);
}

let active = resolveActiveNodeModules(PROJECT_ROOT);
if (!active && runner === 'tsx') {
  console.error('[dashi-ppt] 还没有安装运行依赖,先自动准备(只在第一次需要)…');
  const prepared = spawnSync(process.execPath, [path.join(HERE, 'prepare-deps.mjs')], { stdio: ['ignore', 2, 2] });
  if (prepared.status !== 0) {
    console.error('[dashi-ppt] 依赖准备失败,请查看上面的 npm 输出。');
    process.exit(prepared.status || 1);
  }
  active = resolveActiveNodeModules(PROJECT_ROOT);
}

const env = { ...process.env };
if (active?.kind === 'external') applyExternalDepsEnv(env, active.dir);

const args = runner === 'tsx' ? [resolveTsxCli(active?.dir), script, ...rest] : [script, ...rest];
const result = spawnSync(process.execPath, args, { stdio: 'inherit', env });
if (result.error) {
  console.error(`[dashi-ppt] 启动失败: ${result.error.message}`);
  process.exit(1);
}
if (result.signal) process.kill(process.pid, result.signal);
process.exit(result.status ?? 1);

function applyExternalDepsEnv(target, nodeModules) {
  target.DASHI_PPT_NODE_MODULES = nodeModules;
  target.NODE_PATH = [nodeModules, target.NODE_PATH].filter(Boolean).join(path.delimiter);
  const pathKey = Object.keys(target).find(key => key.toUpperCase() === 'PATH') || 'PATH';
  target[pathKey] = [path.join(nodeModules, '.bin'), target[pathKey]].filter(Boolean).join(path.delimiter);
  // file:// URL 不含空格(百分号编码),NODE_OPTIONS 里不需要引号
  const hook = `--import=${pathToFileURL(path.join(HERE, 'deps-hook.mjs')).href}`;
  if (!String(target.NODE_OPTIONS || '').includes(hook)) {
    target.NODE_OPTIONS = [target.NODE_OPTIONS, hook].filter(Boolean).join(' ');
  }
}

function resolveTsxCli(nodeModules) {
  const dir = nodeModules ? path.join(nodeModules, 'tsx') : '';
  if (dir) {
    try {
      const pkg = JSON.parse(readFileSync(path.join(dir, 'package.json'), 'utf8'));
      const bin = typeof pkg.bin === 'string' ? pkg.bin : pkg.bin?.tsx;
      if (bin && existsSync(path.join(dir, bin))) return path.join(dir, bin);
    } catch {
      // 落到下面的报错
    }
  }
  console.error('[dashi-ppt] 找不到 tsx(运行依赖不完整)。请运行 <skill-root>/scripts/render_goal_deck.sh 重新准备依赖。');
  process.exit(1);
}
