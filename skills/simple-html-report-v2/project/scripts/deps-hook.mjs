// 「不依赖链接」方式(DASHI_PPT_DEPS_MODE=external)的模块解析钩子,由 scripts/dashi-run.mjs 经
// NODE_OPTIONS=--import 注入每个 node 进程(含 tsx 子进程、后台预览服务)。
//
// Node 的 ESM 解析不认 NODE_PATH,技能目录里又没有 node_modules:这里注册一个 resolve 钩子,
// 裸模块名(react、playwright-core …)按常规解析失败时,改从外部依赖目录再解析一次。
// CommonJS 的 require 由同时设置的 NODE_PATH 兜住。
// 同一个文件既是注册入口(主线程)又是钩子模块(Node 的模块钩子线程):宿主限制技能目录文件数,少一个文件是一个。
import { register } from 'node:module';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { isMainThread } from 'node:worker_threads';

const nodeModules = String(process.env.DASHI_PPT_NODE_MODULES || '').trim();
if (isMainThread && nodeModules && typeof register === 'function') {
  // 从「依赖目录根下的一个文件」出发解析,等价于站在外部依赖旁边 import。
  const parentURL = pathToFileURL(path.join(path.dirname(path.resolve(nodeModules)), 'package.json')).href;
  register(import.meta.url, { data: { parentURL } });
}

let fallbackParentURL = '';

export async function initialize(data) {
  fallbackParentURL = String(data?.parentURL || '');
}

export async function resolve(specifier, context, nextResolve) {
  try {
    return await nextResolve(specifier, context);
  } catch (error) {
    if (!fallbackParentURL || error?.code !== 'ERR_MODULE_NOT_FOUND' || !isBareSpecifier(specifier)) throw error;
    if (context?.parentURL === fallbackParentURL) throw error;
    return nextResolve(specifier, { ...context, parentURL: fallbackParentURL });
  }
}

function isBareSpecifier(specifier) {
  const value = String(specifier || '');
  if (!value || value.startsWith('.') || value.startsWith('/') || value.startsWith('#')) return false;
  if (/^[a-zA-Z][a-zA-Z\d+.-]*:/.test(value)) return false; // node: / file: / data: / http: / Windows 盘符
  return true;
}
