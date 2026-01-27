import { defineConfig } from './src/types/config.ts';

/**
 * コピー設定
 */
export default defineConfig({
  // === コピー元ディレクトリ ===
  // 省略時は process.cwd()（設定ファイルの実行ディレクトリ）が使用されます
  // source: '/path/to/source',',

  destination: '/path/to/destination',
  includes: [
    // ディレクトリ全体（末尾 / ）
    'some/directory/**/*',

    // 単一ファイル
    'some-file.json',

    // glob パターン（例）
    // "src/**/*.ts",        // src 配下の全 .ts ファイル
    // "*.json",             // ルート直下の全 .json ファイル
    // "docs/*.md",          // docs 直下の .md ファイル
    // "config/*.{ts,js}",   // config 直下の .ts と .js ファイル
  ],
  excludes: [
    '.DS_Store',
    'Thumbs.db',
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
