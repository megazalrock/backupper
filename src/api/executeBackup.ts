import { existsSync, mkdirSync, unlinkSync, rmdirSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';

import { loadConfig, validateBackupConfig } from '../modules/ConfigLoader.ts';
import { filterByOnlyPattern, findOrphanedFiles, resolveTargetFiles, shouldExclude } from '../modules/FileResolver.ts';
import { convertDotPath } from '../modules/PathConverter.ts';
import type { ResolvedConfig } from '../types/config.ts';
import type { CopyResult, DeleteResult } from '../types/result.ts';

import type { BackupOptions, BackupResult } from './types.ts';

/**
 * ファイルを削除する
 */
function deleteFile(filePath: string): DeleteResult {
  try {
    unlinkSync(filePath);
    return {
      success: true,
      path: filePath,
    };
  } catch (error) {
    return {
      success: false,
      path: filePath,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * 空のディレクトリを再帰的に削除する
 */
function removeEmptyDirectories(dirPath: string, rootPath: string): void {
  if (dirPath === rootPath) {
    return;
  }

  try {
    const entries = readdirSync(dirPath);
    if (entries.length === 0) {
      rmdirSync(dirPath);
      const parentDir = dirname(dirPath);
      removeEmptyDirectories(parentDir, rootPath);
    }
  } catch {
    // ディレクトリが存在しない場合などは無視
  }
}

/**
 * ファイルをコピーする
 */
async function copyFile(
  source: string,
  destination: string,
): Promise<CopyResult> {
  try {
    const destDir = dirname(destination);
    if (!existsSync(destDir)) {
      mkdirSync(destDir, { recursive: true });
    }

    const sourceFile = Bun.file(source);
    await Bun.write(destination, sourceFile);

    return {
      success: true,
      source,
      destination,
    };
  } catch (error) {
    return {
      success: false,
      source,
      destination,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * バックアップを実行する（プログラマブルAPI）
 *
 * process.exit を使用せず、エラーは throw する。
 */
export async function executeBackup(options: BackupOptions = {}): Promise<BackupResult> {
  // 設定の解決
  let config: ResolvedConfig;
  if (options.config) {
    config = options.config;
  } else {
    config = await loadConfig(options.configPath ?? 'backupper.config.ts');
  }

  validateBackupConfig(config);

  // ファイル一覧を取得
  let targetFiles = resolveTargetFiles(config);

  if (options.only) {
    targetFiles = filterByOnlyPattern(targetFiles, options.only);
  }

  // コピー実行
  const copyResults: CopyResult[] = [];
  const copiedFiles: string[] = [];

  for (const relativePath of targetFiles) {
    if (shouldExclude(relativePath, config.excludes)) {
      continue;
    }

    copiedFiles.push(relativePath);

    const convertedPath = convertDotPath(relativePath);
    const sourcePath = join(config.source, relativePath);
    const destPath = join(config.destination, convertedPath);

    const result = await copyFile(sourcePath, destPath);
    copyResults.push(result);
  }

  // 同期モード: 孤児ファイルの削除
  const deleteResults: DeleteResult[] = [];

  if (config.backup?.sync) {
    const orphanedFiles = findOrphanedFiles(copiedFiles, config);

    for (const orphanedFile of orphanedFiles) {
      const filePath = join(config.destination, orphanedFile);
      const result = deleteFile(filePath);
      deleteResults.push(result);

      if (result.success) {
        const parentDir = dirname(filePath);
        removeEmptyDirectories(parentDir, config.destination);
      }
    }
  }

  return {
    copyResults,
    deleteResults,
    copiedFiles,
  };
}
