import { existsSync, mkdirSync, readdirSync, statSync } from "node:fs"
import { basename, dirname, join, relative } from "node:path"
import { config, type Config } from "../../config"

// ============================================
// 定数
// ============================================

const OUTPUT_DIR = "files"

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
// 設定読み込みモジュール
// ============================================

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
  console.log("コピースクリプトを開始します...")
  console.log("")

  // 1. 設定のバリデーション
  try {
    validateConfig(config)
  } catch (error) {
    console.error(
      `エラー: ${error instanceof Error ? error.message : String(error)}`
    )
    process.exit(1)
  }

  // 2. ファイル一覧を取得
  const targetFiles = resolveTargetFiles(config)
  console.log(`対象ファイル数: ${targetFiles.length}`)
  console.log("")

  // 3. コピー実行
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

  // 4. サマリー出力
  logSummary(results)
}

// 実行
main().catch((error) => {
  console.error("予期せぬエラーが発生しました:", error)
  process.exit(1)
})
