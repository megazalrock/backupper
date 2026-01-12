import type { Config } from 'types/config.ts'

/**
 * コピー設定
 */
export const config: Config = {
  base: "/Users/otto/workspace/craftbank/arrangement-env/front",
  targetFiles: [
    ".claude/",
    ".mgzl/",
    ".mcp.json",
    "tsconfig.mgzl.json"
  ],
  exclude: [
    "node_modules",
    "*.log",
    ".DS_Store",
  ],
}
