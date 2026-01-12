import { existsSync, mkdirSync, readdirSync } from "node:fs"
import { basename, dirname, join, relative, resolve } from "node:path"
import type { Config } from 'types/config.ts'

// ============================================
// 定数
// ============================================

const OUTPUT_DIR = "files"
const DEFAULT_CONFIG_PATH = "config.ts"

// ============================================
// 型定義
// ============================================

interface CopyResult {
  success: boolean
  source: string
  destination: string
  error?: string
}

interface CliOptions {
  configPath: string
}

// ============================================
// コマンドライン引数パーサー
// ============================================

/**
 * ヘルプメッセージを表示する
 */
function showHelp(): void {
  console.log(`
使用方法: bun run scripts/copy-script/index.ts [オプション]

オプション:
  --config, -c <パス>  設定ファイルのパスを指定（デフォルト: ${DEFAULT_CONFIG_PATH}）
  --help, -h           このヘルプを表示
`)
}

/**
 * コマンドライン引数を解析する
 */
function parseArgs(args: string[]): CliOptions | null {
  const options: CliOptions = {
    configPath: DEFAULT_CONFIG_PATH,
  }

  for (let i = 0; i < args.length; i++) {
    const arg = args[i]
    if (arg === "--help" || arg === "-h") {
      showHelp()
      return null
    } else if (arg === "--config" || arg === "-c") {
      const nextArg = args[i + 1]
      if (!nextArg || nextArg.startsWith("-")) {
        throw new Error("--config オプションには設定ファイルのパスが必要です")
      }
      options.configPath = nextArg
      i++ // 次の引数をスキップ
    }
  }

  return options
}

// ============================================
// 設定読み込みモジュール
// ============================================

/**
 * 設定ファイルを動的に読み込む
 */
async function loadConfig(configPath: string): Promise<Config> {
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
 * 設定のバリデーションを行う
 */
function validateConfig(cfg: Config): void {
  if (!existsSync(cfg.base)) {
    throw new Error(`ベースパスが存在しません: ${cfg.base}`)
  }
}

// ============================================
// パス変換関数
// ============================================

/**
 * ドットで始まるファイル・ディレクトリ名を dot__ に変換する
 * 例: .claude/settings.json → dot__claude/settings.json
 */
function convertDotPath(relativePath: string): string {
  const parts = relativePath.split("/")
  const convertedParts = parts.map((part) => {
    if (part.startsWith(".") && part.length > 1) {
      return `dot__${part.slice(1)}`
    }
    return part
  })
  return convertedParts.join("/")
}

// ============================================
// 除外判定関数
// ============================================

/**
 * 除外パターンにマッチするかどうかを判定する
 */
function shouldExclude(relativePath: string, excludePatterns: string[]): boolean {
  for (const pattern of excludePatterns) {
    const glob = new Bun.Glob(pattern)
    // パス全体とファイル名の両方でチェック
    if (glob.match(relativePath) || glob.match(basename(relativePath))) {
      return true
    }
    // ディレクトリ名を含むパスのチェック
    const parts = relativePath.split("/")
    for (const part of parts) {
      if (glob.match(part)) {
        return true
      }
    }
  }
  return false
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

/**
 * targetFiles から実際のファイルパス一覧を取得する
 */
function resolveTargetFiles(cfg: Config): string[] {
  const files: string[] = []

  for (const target of cfg.targetFiles) {
    const fullPath = join(cfg.base, target)

    if (target.endsWith("/")) {
      // ディレクトリ全体
      const dirFiles = getFilesRecursively(fullPath, cfg.base)
      files.push(...dirFiles)
    } else {
      // 単一ファイル
      if (existsSync(fullPath)) {
        files.push(target)
      }
    }
  }

  return files
}

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
// ログ出力
// ============================================

/**
 * コピー結果をログ出力する
 */
function logResult(result: CopyResult): void {
  if (result.success) {
    console.log(`✓ ${result.source} → ${result.destination}`)
  } else {
    console.error(`✗ ${result.source} - ${result.error}`)
  }
}

/**
 * サマリーを出力する
 */
function logSummary(results: CopyResult[]): void {
  const successCount = results.filter((r) => r.success).length
  const failureCount = results.filter((r) => !r.success).length

  console.log("")
  console.log("=".repeat(50))
  console.log(`コピー完了: 成功 ${successCount} 件, 失敗 ${failureCount} 件`)
  console.log("=".repeat(50))
}

// ============================================
// メイン処理
// ============================================

async function main(): Promise<void> {
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
    if (shouldExclude(relativePath, config.exclude)) {
      continue
    }

    // パス変換
    const convertedPath = convertDotPath(relativePath)
    const sourcePath = join(config.base, relativePath)
    const destPath = join(OUTPUT_DIR, convertedPath)

    // コピー実行
    const result = await copyFile(sourcePath, destPath)
    results.push(result)
    logResult(result)
  }

  // 6. サマリー出力
  logSummary(results)
}

// 実行
main().catch((error) => {
  console.error("予期せぬエラーが発生しました:", error)
  process.exit(1)
})
