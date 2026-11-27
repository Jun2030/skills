#!/usr/bin/env node
import fs from 'node:fs';
import https from 'node:https';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const SKILL_ROOT = path.resolve(SCRIPT_DIR, '..');
const INSTALLED_PACKAGE = path.join(SKILL_ROOT, 'project/package.json');
const SOURCE_PACKAGE = path.join(SKILL_ROOT, 'package.json');
// 包名 / 仓库来自 package.json 的 dashiDistribution(开发仓库根 package.json 为唯一来源,sync 时写进
// project/package.json):高校版查的是自己的 npm 包,不会去查原版 dashi-ppt-skill、提示「更新」成原版。
// 端点按国内可达性排序:npmmirror(国内可达)→ npm 官方 → GitHub raw(兜底,兼容 npm 包尚未发布的过渡期)。
// 任一端点拿到版本即停,全部失败保持静默。
const MIRROR_REGISTRY = 'https://registry.npmmirror.com';
const REQUEST_TIMEOUT_MS = 5000;

// 作为模块被测试 import 时不发请求
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main().catch(() => {});

async function main() {
  const local = readLocalPackage();
  const localVersion = local?.version || '';
  const distribution = readDistribution(local);
  if (!localVersion || !distribution) return;
  const remoteVersion = await readRemoteVersion(remoteVersionEndpoints(distribution));
  if (!remoteVersion) return;
  if (compareVersions(remoteVersion, localVersion) <= 0) return;
  const name = distribution.displayName || 'Dashi PPT';
  const repo = distribution.githubRepos[0];
  process.stdout.write(
    `发现 ${name} 新版本 ${remoteVersion}（当前 ${localVersion}）。更新方式：npx ${distribution.npmPackage}@latest`
    + `（国内用 npx --registry=${MIRROR_REGISTRY} ${distribution.npmPackage}@latest），`
    + `${repo ? `或重新拉取 https://github.com/${repo}` : ''}。\n`,
  );
}

export function readDistribution(pkg) {
  const raw = pkg?.dashiDistribution;
  const npmPackage = String(raw?.npmPackage || '').trim();
  if (!npmPackage) return null;
  const githubRepos = (Array.isArray(raw.githubRepos) ? raw.githubRepos : []).map(String).filter(repo => /^[\w.-]+\/[\w.-]+$/.test(repo));
  return {
    npmPackage,
    displayName: String(raw.displayName || ''),
    githubRepos,
    githubBranch: String(raw.githubBranch || 'main'),
    githubSkillPath: String(raw.githubSkillPath || '').replace(/^\/+|\/+$/g, ''),
  };
}

export function remoteVersionEndpoints(distribution) {
  const pick = json => json.version;
  const name = encodeURIComponent(distribution.npmPackage).replace(/^%40/, '@');
  const skillPath = distribution.githubSkillPath ? `${distribution.githubSkillPath}/` : '';
  return [
    { url: `${MIRROR_REGISTRY}/${name}/latest`, pick },
    { url: `https://registry.npmjs.org/${name}/latest`, pick },
    ...distribution.githubRepos.map(repo => ({
      url: `https://raw.githubusercontent.com/${repo}/${distribution.githubBranch}/${skillPath}project/package.json`,
      pick,
    })),
  ];
}

function readLocalPackage() {
  const packagePath = fs.existsSync(INSTALLED_PACKAGE) ? INSTALLED_PACKAGE : SOURCE_PACKAGE;
  try {
    return JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  } catch {
    return null;
  }
}

async function readRemoteVersion(endpoints) {
  for (const endpoint of endpoints) {
    const version = await fetchVersion(endpoint);
    if (version) return version;
  }
  return '';
}

function fetchVersion({ url, pick }) {
  return new Promise(resolve => {
    const request = https.get(url, { timeout: REQUEST_TIMEOUT_MS }, response => {
      if (response.statusCode !== 200) {
        response.resume();
        resolve('');
        return;
      }
      let body = '';
      response.setEncoding('utf8');
      response.on('data', chunk => {
        body += chunk;
      });
      response.on('end', () => {
        try {
          resolve(pick(JSON.parse(body)) || '');
        } catch {
          resolve('');
        }
      });
    });
    request.on('timeout', () => {
      request.destroy();
      resolve('');
    });
    request.on('error', () => resolve(''));
  });
}

export function compareVersions(a, b) {
  const left = parseVersion(a);
  const right = parseVersion(b);
  for (let index = 0; index < Math.max(left.length, right.length); index += 1) {
    const delta = (left[index] || 0) - (right[index] || 0);
    if (delta !== 0) return delta;
  }
  return 0;
}

function parseVersion(version) {
  return String(version)
    .replace(/^v/i, '')
    .split(/[.-]/)
    .map(part => Number.parseInt(part, 10))
    .filter(Number.isFinite);
}
