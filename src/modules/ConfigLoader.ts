import { existsSync } from "node:fs"
import { resolve } from "node:path"
import type { Config } from "../types/config.ts"

// ============================================
// 定数
// ============================================

export const DEFAULT_CONFIG_PATH = "config.ts"

// ============================================
// 設定読み込み
// ============================================

/**
 * 設定ファイルを動的に読み込む
 */
export async function loadConfig(configPath: string): Promise<Config> {
  const absolutePath = resolve(configPath)

  if (!existsSync(absolutePath)) {
    throw new Error(`設定ファイルが見つかりません: ${absolutePath}`)
  }

  const module = await import(absolutePath)
  const config = module.config as Config | undefined

  if (!config) {
    throw new Error(`設定ファイルに config がエクスポートされていません: ${absolutePath}`)
  }

  return config
}

/**
 * 設定のバリデーションを行う（backup用）
 */
export function validateConfig(cfg: Config): void {
  if (!existsSync(cfg.source)) {
    throw new Error(`ベースパスが存在しません: ${cfg.source}`)
  }

  if (!cfg.target || cfg.target.trim() === "") {
    throw new Error("outputDir が指定されていません")
  }
}

/**
 * リストア用の設定バリデーション
 * - baseの存在確認
 * - outputDir（files/）の存在確認
 */
export function validateConfigForRestore(cfg: Config): void {
  if (!existsSync(cfg.source)) {
    throw new Error(`ベースパスが存在しません: ${cfg.source}`)
  }

  if (!cfg.target || cfg.target.trim() === "") {
    throw new Error("outputDir が指定されていません")
  }

  if (!existsSync(cfg.target)) {
    throw new Error(`出力ディレクトリが存在しません: ${cfg.target}`)
  }
}
