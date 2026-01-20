/**
 * 実行するshellコマンドの定義
 */
export interface Action {
  /**
   * コマンド名
   *
   * @example 'git'
   */
  command: string,
  /**
   * コマンド引数
   *
   * @example ['add', '-A']
   */
  args: string[],
  /**
   * 環境変数
   *
   * @example { GIT_AUTHOR_NAME: 'backupper' }
   */
  env?: Record<string, string>,

  /**
   * 実行するディレクトリ
   * @default リストア時はConfig.source、バックアップ時はConfig.target
   */
  cwd?: string
}

/**
 * バックアップ固有の設定
 */
export interface BackupOptions {
  /**
   * 同期モード
   * true の場合、ソースに存在しないファイルをターゲットから削除
   * @default false
   */
  sync?: boolean
  /**
   * バックアップ実行後に実行されるコマンド
   */
  postRunActions?: Action[]
}

/**
 * リストア固有の設定
 */
export interface RestoreOptions {
  /**
   * 元のファイルを保存
   * true の場合、既存ファイルを上書きする前に .bak ファイルを作成
   * @default false
   */
  preserveOriginal?: boolean
  /**
   * リストア実行後に実行されるコマンド
   */
  postRunActions?: Action[]
}

/**
 * コピー設定の型定義
 */
export interface Config {
  /** コピー元のディレクトリ（絶対パス） */
  source: string
  /** コピー先の出力ディレクトリ（相対パスまたは絶対パス） */
  target: string
  /**
   * コピー対象の相対パス
   * - 末尾が `/` の場合はディレクトリ全体
   * - glob 特殊文字（*, ?, [], {}）を含む場合は glob パターン
   * - それ以外は単一ファイル
   *
   * 例: "src/", "src/**\/*.ts", "*.json", "config.ts"
   */
  includes: string[]
  /** 除外するファイル/ディレクトリのパターン（glob形式） */
  excludes: string[]

  /** バックアップ固有の設定 */
  backup?: BackupOptions
  /** リストア固有の設定 */
  restore?: RestoreOptions
}

/**
 * 設定オブジェクトを型安全に定義するためのヘルパー関数
 *
 * @example
 * ```typescript
 * import { defineConfig } from './src/types/config.ts';
 *
 * export default defineConfig({
 *   source: '/path/to/source',
 *   target: './files',
 *   includes: ['.claude/', 'config.ts'],
 *   excludes: ['node_modules'],
 * });
 * ```
 */
export function defineConfig(config: Config): Config {
  return config;
}
