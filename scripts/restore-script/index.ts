import { existsSync, mkdirSync, readdirSync } from "node:fs"
import { basename, dirname, join, relative } from "node:path"

// ============================================
// 定数
// ============================================

const SOURCE_DIR = "files"

// ============================================
// 型定義
// ============================================

interface RestoreResult {
  success: boolean
  source: string
  destination: string
  skipped?: boolean
  error?: string
}

interface CliOptions {
  targetPath: string
  force: boolean
  dryRun: boolean
}

// ============================================
// コマンドライン引数パーサー
// ============================================

/**
 * ヘルプメッセージを表示する
 */
function showHelp(): void {
  console.log(`
使用方法: bun run scripts/restore-script/index.ts <復元先パス> [オプション]

引数:
  <復元先パス>    ファイルを復元するベースパス（必須）

オプション:
  --force         既存ファイルを上書きする
  --dry-run       実際には復元せず、動作内容のみ表示
  --help, -h      このヘルプを表示
`)
}

/**
 * コマンドライン引数を解析する
 */
function parseArgs(args: string[]): CliOptions | null {
  const options: CliOptions = {
    targetPath: "",
    force: false,
    dryRun: false,
  }

  for (const arg of args) {
    if (arg === "--help" || arg === "-h") {
      showHelp()
      return null
    } else if (arg === "--force") {
      options.force = true
    } else if (arg === "--dry-run") {
      options.dryRun = true
    } else if (!arg.startsWith("-")) {
      options.targetPath = arg
    }
  }

  return options
}

/**
 * 引数のバリデーションを行う
 */
function validateArgs(options: CliOptions): void {
  if (!options.targetPath) {
    throw new Error("復元先パスが指定されていません")
  }
}

// ============================================
// パス逆変換関数
// ============================================

/**
 * dot__ で始まるファイル・ディレクトリ名を . に変換する
 * 例: dot__claude/settings.json → .claude/settings.json
 */
function revertDotPath(relativePath: string): string {
  const parts = relativePath.split("/")
  const revertedParts = parts.map((part) => {
    if (part.startsWith("dot__")) {
      return `.${part.slice(5)}`
    }
    return part
  })
  return revertedParts.join("/")
}

// ============================================
// ファイル一覧取得
// ============================================

/**
 * ディレクトリ内のすべてのファイルを再帰的に取得する
 */
function getFilesRecursively(dirPath: string, basePath: string): string[] {
  const files: string[] = []

  if (!existsSync(dirPath)) {
    return files
  }

  const entries = readdirSync(dirPath, { withFileTypes: true })

  for (const entry of entries) {
    const fullPath = join(dirPath, entry.name)
    const relativePath = relative(basePath, fullPath)

    if (entry.isDirectory()) {
      files.push(...getFilesRecursively(fullPath, basePath))
    } else {
      files.push(relativePath)
    }
  }

  return files
}

// ============================================
// 復元実行関数
// ============================================

/**
 * ファイルを復元する
 */
async function restoreFile(
  source: string,
  destination: string,
  options: CliOptions
): Promise<RestoreResult> {
  try {
    // 既存ファイルチェック
    if (existsSync(destination) && !options.force) {
      return {
        success: true,
        source,
        destination,
        skipped: true,
      }
    }

    // ドライランの場合は実際のコピーを行わない
    if (options.dryRun) {
      return {
        success: true,
        source,
        destination,
      }
    }

    // 復元先ディレクトリを作成
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
// ログ出力
// ============================================

/**
 * 復元結果をログ出力する
 */
function logResult(result: RestoreResult, dryRun: boolean): void {
  const prefix = dryRun ? "[DRY-RUN] " : ""

  if (result.skipped) {
    console.log(`⊘ ${result.source} - 既存ファイルのためスキップ`)
  } else if (result.success) {
    console.log(`${prefix}✓ ${result.source} → ${result.destination}`)
  } else {
    console.error(`✗ ${result.source} - ${result.error}`)
  }
}

/**
 * サマリーを出力する
 */
function logSummary(results: RestoreResult[]): void {
  const successCount = results.filter((r) => r.success && !r.skipped).length
  const skippedCount = results.filter((r) => r.skipped).length
  const failureCount = results.filter((r) => !r.success).length

  console.log("")
  console.log("=".repeat(50))
  console.log(
    `復元完了: 成功 ${successCount} 件, スキップ ${skippedCount} 件, 失敗 ${failureCount} 件`
  )
  console.log("=".repeat(50))
}

// ============================================
// メイン処理
// ============================================

async function main(): Promise<void> {
  // 1. コマンドライン引数を解析
  const args = process.argv.slice(2)
  const options = parseArgs(args)

  if (options === null) {
    // ヘルプ表示の場合は終了
    process.exit(0)
  }

  // 2. 引数のバリデーション
  try {
    validateArgs(options)
  } catch (error) {
    console.error(
      `エラー: ${error instanceof Error ? error.message : String(error)}`
    )
    showHelp()
    process.exit(1)
  }

  // 3. files/ ディレクトリの存在確認
  if (!existsSync(SOURCE_DIR)) {
    console.error(`エラー: ${SOURCE_DIR}/ ディレクトリが存在しません`)
    process.exit(1)
  }

  console.log("復元スクリプトを開始します...")
  if (options.dryRun) {
    console.log("[DRY-RUN モード]")
  }
  console.log(`復元先: ${options.targetPath}`)
  console.log("")

  // 4. files/ 内の全ファイル一覧を取得
  const sourceFiles = getFilesRecursively(SOURCE_DIR, SOURCE_DIR)
  console.log(`対象ファイル数: ${sourceFiles.length}`)
  console.log("")

  // 5. 復元実行
  const results: RestoreResult[] = []

  for (const relativePath of sourceFiles) {
    // パス逆変換
    const revertedPath = revertDotPath(relativePath)
    const sourcePath = join(SOURCE_DIR, relativePath)
    const destPath = join(options.targetPath, revertedPath)

    // 復元実行
    const result = await restoreFile(sourcePath, destPath, options)
    results.push(result)
    logResult(result, options.dryRun)
  }

  // 6. サマリー出力
  logSummary(results)
}

// 実行
main().catch((error) => {
  console.error("予期せぬエラーが発生しました:", error)
  process.exit(1)
})
