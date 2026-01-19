/**
 * ファイル解決モジュール
 * ファイル一覧取得、除外判定、glob処理
 */

import { existsSync, readdirSync } from "node:fs"
import { basename, join, relative } from "node:path"
import type { Config } from "../types/config.ts"
import { convertDotPath, revertDotPath } from "./PathConverter.ts"

/**
 * glob 特殊文字を含むかどうかを判定する
 * glob 特殊文字: *, ?, [, ], {, }
 */
export function isGlobPattern(pattern: string): boolean {
  return /[*?\[\]{}]/.test(pattern)
}

/**
 * 除外パターンにマッチするかどうかを判定する
 */
export function shouldExclude(
  relativePath: string,
  excludePatterns: string[]
): boolean {
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

/**
 * glob パターンにマッチするファイルを取得する
 */
export function resolveGlobPattern(pattern: string, basePath: string): string[] {
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

/**
 * ディレクトリ内のすべてのファイルを再帰的に取得する
 */
export function getFilesRecursively(
  dirPath: string,
  basePath: string
): string[] {
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
 * backup用: base → outputDir のファイル一覧を取得
 * targetFiles から実際のファイルパス一覧を取得する
 * - 末尾 `/` → ディレクトリ全体を再帰取得
 * - glob 特殊文字を含む → glob パターンとして解決
 * - それ以外 → 単一ファイルとして扱う
 */
export function resolveTargetFiles(cfg: Config): string[] {
  const files: string[] = []

  for (const target of cfg.includes) {
    if (target.endsWith("/")) {
      // ディレクトリ全体
      const fullPath = join(cfg.source, target)
      const dirFiles = getFilesRecursively(fullPath, cfg.source)
      files.push(...dirFiles)
    } else if (isGlobPattern(target)) {
      // glob パターン
      const globFiles = resolveGlobPattern(target, cfg.source)
      files.push(...globFiles)
    } else {
      // 単一ファイル
      const fullPath = join(cfg.source, target)
      if (existsSync(fullPath)) {
        files.push(target)
      }
    }
  }

  return files
}

/**
 * restore用: outputDir 内のファイル一覧を取得（includesパターンに従う）
 * files/（outputDir）を走査し、includesパターンにマッチするファイルを取得
 */
export function resolveRestoreFiles(cfg: Config): string[] {
  // outputDir内の全ファイルを取得
  const allFiles = getFilesRecursively(cfg.target, cfg.target)
  const matchedFiles: string[] = []

  for (const file of allFiles) {
    // dot__形式のパスを元のパス形式（.形式）に変換してパターンマッチング
    const originalPath = revertDotPath(file)

    // includesパターンにマッチするか確認
    let isIncluded = false
    for (const pattern of cfg.includes) {
      if (pattern.endsWith("/")) {
        // ディレクトリパターン: パスがこのディレクトリで始まるか確認
        const dirPattern = pattern.slice(0, -1) // 末尾の / を除去
        if (originalPath.startsWith(dirPattern + "/") || originalPath.startsWith(dirPattern)) {
          isIncluded = true
          break
        }
      } else if (isGlobPattern(pattern)) {
        // globパターン
        const glob = new Bun.Glob(pattern)
        if (glob.match(originalPath)) {
          isIncluded = true
          break
        }
      } else {
        // 単一ファイル: 完全一致
        if (originalPath === pattern) {
          isIncluded = true
          break
        }
      }
    }

    // excludesパターンに該当しないか確認
    if (isIncluded && !shouldExclude(originalPath, cfg.excludes)) {
      matchedFiles.push(file)
    }
  }

  return matchedFiles
}

/**
 * ターゲットディレクトリ内の削除対象ファイル（孤児ファイル）を特定する
 * ソースに対応がないファイルを検出する
 */
export function findOrphanedFiles(
  sourceFiles: string[],
  config: Config
): string[] {
  // ソースファイルを convertDotPath() で変換してセットを作成
  const sourceSet = new Set(sourceFiles.map((file) => convertDotPath(file)))

  // ターゲットディレクトリ内の全ファイルを取得
  const targetFiles = getFilesRecursively(config.target, config.target)

  const orphanedFiles: string[] = []

  for (const targetFile of targetFiles) {
    // ターゲットファイルがソースセットに含まれていない場合
    if (!sourceSet.has(targetFile)) {
      // dot__形式のパスを元のパス形式（.形式）に変換してパターンマッチング
      const originalPath = revertDotPath(targetFile)

      // includesパターンの範囲内かどうか確認
      let isInScope = false
      for (const pattern of config.includes) {
        if (pattern.endsWith("/")) {
          // ディレクトリパターン: パスがこのディレクトリで始まるか確認
          const dirPattern = pattern.slice(0, -1) // 末尾の / を除去
          if (originalPath.startsWith(dirPattern + "/") || originalPath.startsWith(dirPattern)) {
            isInScope = true
            break
          }
        } else if (isGlobPattern(pattern)) {
          // globパターン
          const glob = new Bun.Glob(pattern)
          if (glob.match(originalPath)) {
            isInScope = true
            break
          }
        } else {
          // 単一ファイル: 完全一致
          if (originalPath === pattern) {
            isInScope = true
            break
          }
        }
      }

      // includesパターンの範囲内かつ excludesパターンに該当しない場合
      if (isInScope && !shouldExclude(originalPath, config.excludes)) {
        orphanedFiles.push(targetFile)
      }
    }
  }

  return orphanedFiles
}
