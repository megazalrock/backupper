/**
 * コピー/リストア結果を表す型
 */
export interface CopyResult {
  success: boolean
  source: string
  destination: string
  error?: string
}

/**
 * リストア対象ファイルの情報を表す型
 */
export interface RestoreFileInfo {
  /** files/ 内の相対パス（dot__形式） */
  backupPath: string
  /** base への相対パス（.形式） */
  originalPath: string
  /** 上書きかどうか */
  isOverwrite: boolean
}
