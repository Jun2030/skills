#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="${DASHI_PPT_PROJECT_ROOT:-$(cd "$SCRIPT_DIR/../project" && pwd)}"
CALLER_CWD="$(pwd)"

if [[ $# -ne 2 ]]; then
  echo "Usage: render_goal_deck.sh <goal-spec.json> <output/ppt/index.html>" >&2
  exit 2
fi

SPEC_PATH="$1"
OUT_PATH="$2"

if [[ "$SPEC_PATH" != /* ]]; then
  SPEC_PATH="$CALLER_CWD/$SPEC_PATH"
fi

if [[ "$OUT_PATH" != /* ]]; then
  OUT_PATH="$CALLER_CWD/$OUT_PATH"
fi

cd "$PROJECT_ROOT"
# 运行依赖默认装在技能目录之外(~/.dashi-ppt/deps/<依赖指纹>/),project/node_modules 只是链接;
# DASHI_PPT_DEPS_MODE=external 连链接也不放,=local 就地安装(旧做法)。已就绪时秒过;
# 也负责 .npmrc 重建、npm 源探测和无头浏览器(chromium headless shell)安装。详见 project/scripts/prepare-deps.mjs。
node scripts/prepare-deps.mjs
mkdir -p "$(dirname "$OUT_PATH")"
npm run props:safe -- --goal "$SPEC_PATH" --write
npm run validate:goal-spec -- "$SPEC_PATH"
npm run render:goal -- "$SPEC_PATH" "$OUT_PATH"
npm run validate:swiss -- "$OUT_PATH"
npm run validate:goal-copy -- "$SPEC_PATH" "$OUT_PATH"
OUT_DIR="$(dirname "$OUT_PATH")"
# 缺省端口落在 SKILL.md 约定的 5200-5999 段(4178/4300/4400 为用户保留端口);被占用时服务自增。
PREVIEW_PORT="${DASHI_PPT_PREVIEW_PORT:-5200}"
npm run preview:start -- "$OUT_DIR" "$PREVIEW_PORT"
