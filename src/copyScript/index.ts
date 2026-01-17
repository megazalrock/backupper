import { existsSync, mkdirSync } from "node:fs"
import { dirname, join } from "node:path"
import type { Config } from "../types/config.ts"
import type { CopyResult } from "../types/result.ts"
import { loadConfig, validateConfig } from "../modules/ConfigLoader.ts"
import { parseArgs, showHelp, type CliOptions } from "../modules/ParseCliArguments.ts"
import { convertDotPath } from "../modules/PathConverter.ts"
import { resolveTargetFiles, shouldExclude } from "../modules/FileResolver.ts"
import { logResult, logSummary } from "../modules/Logger.ts"

// ============================================
// コピー実行関数
// ============================================

/**
 * ファイルをコピーする
 */
async function copyFile(
  source: string,
  destination: string
): Promise<CopyResult> {
  try {
    // コピー先ディレクトリを作成
    const destDir = dirname(destination)
    if (!existsSync(destDir)) {
      mkdirSync(destDir, { recursive: true })
    }

    // ファイルをコピー
    const sourceFile = Bun.file(source)
    await Bun.write(destination, sourceFile)

    return {
      success: true,
      source,
      destination,
    }
  } catch (error) {
    return {
      success: false,
      source,
      destination,
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

// ============================================
// メイン処理
// ============================================

export async function main(): Promise<void> {
  // 1. コマンドライン引数を解析
  const args = process.argv.slice(2)
  let options: CliOptions

  try {
    const parsed = parseArgs(args)
    if (parsed === null) {
      // ヘルプ表示の場合は終了
      process.exit(0)
    }
    options = parsed
  } catch (error) {
    console.error(
      `エラー: ${error instanceof Error ? error.message : String(error)}`
    )
    showHelp()
    process.exit(1)
  }

  console.log("コピースクリプトを開始します...")
  console.log(`設定ファイル: ${options.configPath}`)
  console.log("")

  // 2. 設定ファイルを読み込み
  let config: Config
  try {
    config = await loadConfig(options.configPath)
  } catch (error) {
    console.error(
      `エラー: ${error instanceof Error ? error.message : String(error)}`
    )
    process.exit(1)
  }

  // 3. 設定のバリデーション
  try {
    validateConfig(config)
  } catch (error) {
    console.error(
      `エラー: ${error instanceof Error ? error.message : String(error)}`
    )
    process.exit(1)
  }

  // 4. ファイル一覧を取得
  const targetFiles = resolveTargetFiles(config)
  console.log(`対象ファイル数: ${targetFiles.length}`)
  console.log("")

  // 5. コピー実行
  const results: CopyResult[] = []

  for (const relativePath of targetFiles) {
    // 除外チェック
    if (shouldExclude(relativePath, config.excludes)) {
      continue
    }

    // パス変換
    const convertedPath = convertDotPath(relativePath)
    const sourcePath = join(config.base, relativePath)
    const destPath = join(config.outputDir, convertedPath)

    // コピー実行
    const result = await copyFile(sourcePath, destPath)
    results.push(result)
    logResult(result)
  }

  // 6. サマリー出力
  logSummary(results, "コピー")
}
