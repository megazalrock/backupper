/**
 * コピー設定の型定義
 */
export interface Config {
  /** コピー元のベースパス（絶対パス） */
  base: string
  /** コピー対象の相対パス。末尾が `/` の場合はディレクトリ全体 */
  targetFiles: string[]
  /** 除外するファイル/ディレクトリのパターン（glob形式） */
  exclude: string[]
}
