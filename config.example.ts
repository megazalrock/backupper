import type { Config } from 'src/types/config.ts'

/**
 * コピー設定
 */
export const config: Config = {
  base: "/Users/otto/workspace/craftbank/arrangement-env/front",
  outputDir: "files",
  targetFiles: [
    // ディレクトリ全体（末尾 / ）
    ".claude/",
    ".mgzl/",

    // 単一ファイル
    ".mcp.json",
    "tsconfig.mgzl.json",

    // glob パターン（例）
    // "src/**/*.ts",        // src 配下の全 .ts ファイル
    // "*.json",             // ルート直下の全 .json ファイル
    // "docs/*.md",          // docs 直下の .md ファイル
    // "config/*.{ts,js}",   // config 直下の .ts と .js ファイル
  ],
  exclude: [
    "node_modules",
    "*.log",
    ".DS_Store",
  ],
}
