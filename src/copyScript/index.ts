import { existsSync, mkdirSync, readdirSync } from "node:fs"
import { basename, dirname, join, relative } from "node:path"
import type { Config } from "../types/config.ts"
import { loadConfig, validateConfig } from "../modules/ConfigLoader.ts"
import { parseArgs, showHelp, type CliOptions } from "../modules/ParseCliArguments.ts"

// ============================================
// 型定義
// ============================================

interface CopyResult {
  success: boolean
  source: string
  destination: string
  error?: string
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
// glob パターン判定
// ============================================

/**
 * glob 特殊文字を含むかどうかを判定する
 * glob 特殊文字: *, ?, [, ], {, }
 */
function isGlobPattern(pattern: string): boolean {
  return /[*?\[\]{}]/.test(pattern)
}

/**
 * glob パターンにマッチするファイルを取得する
 */
function resolveGlobPattern(pattern: string, basePath: string): string[] {
  const glob = new Bun.Glob(pattern)
  const files: string[] = []

  for (const file of glob.scanSync({
    cwd: basePath,
    dot: true, // . で始まるファイル/ディレクトリにもマッチ
    onlyFiles: true,
  })) {
    files.push(file)
  }

  return files
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
 * - 末尾 `/` → ディレクトリ全体を再帰取得
 * - glob 特殊文字を含む → glob パターンとして解決
 * - それ以外 → 単一ファイルとして扱う
 */
function resolveTargetFiles(cfg: Config): string[] {
  const files: string[] = []

  for (const target of cfg.targetFiles) {
    if (target.endsWith("/")) {
      // ディレクトリ全体（既存動作）
      const fullPath = join(cfg.base, target)
      const dirFiles = getFilesRecursively(fullPath, cfg.base)
      files.push(...dirFiles)
    } else if (isGlobPattern(target)) {
      // glob パターン（新機能）
      const globFiles = resolveGlobPattern(target, cfg.base)
      files.push(...globFiles)
    } else {
      // 単一ファイル（既存動作）
      const fullPath = join(cfg.base, target)
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
    if (shouldExclude(relativePath, config.exclude)) {
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
  logSummary(results)
}
