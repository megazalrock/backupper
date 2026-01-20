import { copyFileSync, existsSync, mkdirSync } from "node:fs"
import { dirname, join } from "node:path"
import type { Config } from "../../types/config.ts"
import type { CopyResult, RestoreFileInfo } from "../../types/result.ts"
import { loadConfig, validateConfigForRestore } from "../../modules/ConfigLoader.ts"
import {
  parseRestoreArgs,
  showRestoreHelp,
  type RestoreCliOptions,
} from "../../modules/ParseCliArguments.ts"
import { revertDotPath } from "../../modules/PathConverter.ts"
import { resolveRestoreFiles } from "../../modules/FileResolver.ts"
import {
  logResult,
  logSummary,
  logRestoreFileList,
  logDryRunFileList,
} from "../../modules/Logger.ts"
import { confirmContinue } from "../../modules/UserPrompt.ts"

// ============================================
// リストア対象ファイル情報収集
// ============================================

/**
 * リストア対象ファイルの情報を収集
 * @param files files/内の相対パス一覧（dot__形式）
 * @param config 設定
 * @returns リストア対象ファイル情報
 */
function collectRestoreFileInfo(
  files: string[],
  config: Config
): RestoreFileInfo[] {
  const fileInfos: RestoreFileInfo[] = []

  for (const backupPath of files) {
    // dot__形式を.形式に変換
    const originalPath = revertDotPath(backupPath)
    // base側のフルパス
    const destFullPath = join(config.source, originalPath)
    // 上書きかどうか
    const isOverwrite = existsSync(destFullPath)

    fileInfos.push({
      backupPath,
      originalPath,
      isOverwrite,
    })
  }

  return fileInfos
}

// ============================================
// バックアップ作成
// ============================================

/**
 * 既存ファイルのバックアップを作成（.bakファイル）
 * @param filePath バックアップ対象ファイルのパス
 * @returns バックアップファイルのパス
 */
function createBackupFile(filePath: string): string {
  const backupPath = `${filePath}.bak`
  copyFileSync(filePath, backupPath)
  return backupPath
}

// ============================================
// リストア実行
// ============================================

/**
 * ファイルをリストアする
 * @param source files/内のファイルパス
 * @param destination base内のファイルパス
 * @param shouldBackup 既存ファイルをバックアップするか
 * @returns リストア結果とバックアップパス（作成した場合）
 */
async function restoreFile(
  source: string,
  destination: string,
  shouldBackup: boolean
): Promise<{ result: CopyResult; backupPath?: string }> {
  let backupPath: string | undefined

  try {
    // コピー先ディレクトリを作成
    const destDir = dirname(destination)
    if (!existsSync(destDir)) {
      mkdirSync(destDir, { recursive: true })
    }

    // バックアップ作成（オプション有効かつファイルが存在する場合）
    if (shouldBackup && existsSync(destination)) {
      backupPath = createBackupFile(destination)
    }

    // ファイルをコピー
    const sourceFile = Bun.file(source)
    await Bun.write(destination, sourceFile)

    return {
      result: {
        success: true,
        source,
        destination,
      },
      backupPath,
    }
  } catch (error) {
    return {
      result: {
        success: false,
        source,
        destination,
        error: error instanceof Error ? error.message : String(error),
      },
    }
  }
}

// ============================================
// メイン処理
// ============================================

export async function main(cliArgs?: string[]): Promise<void> {
  // 1. コマンドライン引数を解析
  const args = cliArgs ?? process.argv.slice(2)
  let options: RestoreCliOptions

  try {
    const parsed = parseRestoreArgs(args)
    if (parsed === null) {
      // ヘルプ表示の場合は終了
      process.exit(0)
    }
    options = parsed
  } catch (error) {
    console.error(
      `エラー: ${error instanceof Error ? error.message : String(error)}`
    )
    showRestoreHelp()
    process.exit(1)
  }

  console.log("リストアスクリプトを開始します...")
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

  // 3. 設定のバリデーション（リストア用）
  try {
    validateConfigForRestore(config)
  } catch (error) {
    console.error(
      `エラー: ${error instanceof Error ? error.message : String(error)}`
    )
    process.exit(1)
  }

  // 4. リストア対象ファイルを取得
  const restoreFiles = resolveRestoreFiles(config)

  if (restoreFiles.length === 0) {
    console.log("リストア対象のファイルがありません。")
    process.exit(0)
  }

  // 5. ファイル情報を収集（上書き/新規判定）
  const fileInfos = collectRestoreFileInfo(restoreFiles, config)

  console.log(`対象ファイル数: ${fileInfos.length}`)
  console.log("")

  // 6. dry-run の場合はファイル一覧を表示して終了
  if (options.dryRun) {
    logDryRunFileList(fileInfos)
    process.exit(0)
  }

  // 7. ファイル一覧を表示
  logRestoreFileList(fileInfos)
  console.log("")

  // 8. force でなければ確認プロンプト
  if (!options.force) {
    const confirmed = await confirmContinue()
    if (!confirmed) {
      console.log("キャンセルされました。")
      process.exit(0)
    }
    console.log("")
  }

  // 9. リストア実行
  const results: CopyResult[] = []

  for (const fileInfo of fileInfos) {
    const sourcePath = join(config.target, fileInfo.backupPath)
    const destPath = join(config.source, fileInfo.originalPath)

    const { result, backupPath } = await restoreFile(
      sourcePath,
      destPath,
      config.restore?.preserveOriginal ?? false
    )
    results.push(result)

    // 結果のログ出力（.形式のパスで表示）
    logResult(
      {
        ...result,
        source: fileInfo.originalPath,
        destination: destPath,
      },
      backupPath ? `${fileInfo.originalPath}.bak` : undefined
    )
  }

  // 10. サマリー出力
  logSummary(results, "リストア")
}
