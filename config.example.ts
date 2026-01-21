import { defineConfig } from './src/types/config.ts';

/**
 * コピー設定
 */
export default defineConfig({
  source: '/Users/otto/workspace/craftbank/arrangement-env/front',
  destination: 'files',
  includes: [
    // ディレクトリ全体（末尾 / ）
    '.claude/',
    '.mgzl/',

    // 単一ファイル
    '.mcp.json',
    'tsconfig.mgzl.json',

    // glob パターン（例）
    // "src/**/*.ts",        // src 配下の全 .ts ファイル
    // "*.json",             // ルート直下の全 .json ファイル
    // "docs/*.md",          // docs 直下の .md ファイル
    // "config/*.{ts,js}",   // config 直下の .ts と .js ファイル
  ],
  excludes: [
    'node_modules',
    '*.log',
    '.DS_Store',
  ],
  // === バックアップ固有の設定 ===
  // backup: {
  //   sync: false, // true: ソースに存在しないファイルをターゲットから削除
  // },
  // === リストア固有の設定 ===
  // restore: {
  //   preserveOriginal: false, // true: リストア時に既存ファイルを.bakとして保存
  // },
});
