/**
 * コピー設定の型定義
 */
export interface Config {
  /** コピー元のベースパス（絶対パス） */
  base: string
  /** コピー先の出力ディレクトリ（相対パスまたは絶対パス） */
  outputDir: string
  /**
   * コピー対象の相対パス
   * - 末尾が `/` の場合はディレクトリ全体
   * - glob 特殊文字（*, ?, [], {}）を含む場合は glob パターン
   * - それ以外は単一ファイル
   *
   * 例: "src/", "src/**\/*.ts", "*.json", "config.ts"
   */
  targetFiles: string[]
  /** 除外するファイル/ディレクトリのパターン（glob形式） */
  exclude: string[]
}
