import fs from 'node:fs';
import path from 'node:path';

// 运行依赖目录。通常就是 <root>/node_modules(开发仓库、就地安装、或安装版里指向外部依赖的链接);
// 安装版用「不依赖链接」方式(DASHI_PPT_DEPS_MODE=external)时技能目录里没有 node_modules,
// 由 scripts/dashi-run.mjs 通过 DASHI_PPT_NODE_MODULES 告知外部依赖的位置。
export function resolveNodeModulesDir(root, env = process.env) {
  const local = path.join(root, 'node_modules');
  const external = String(env.DASHI_PPT_NODE_MODULES || '').trim();
  if (!external || fs.existsSync(local)) return local;
  return path.resolve(external);
}
