import { existsSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';

import { loadConfig, validateRestoreConfig } from '../modules/ConfigLoader.ts';
import { filterByOnlyPattern, resolveRestoreFiles } from '../modules/FileResolver.ts';
import { revertDotPath } from '../modules/PathConverter.ts';
import type { ResolvedConfig } from '../types/config.ts';
import type { CopyResult, RestoreFileInfo } from '../types/result.ts';

import type { RestoreOptions, RestoreResult } from './types.ts';

/**
 * リストア対象ファイルの情報を収集
 */
function collectRestoreFileInfo(
  files: string[],
  config: ResolvedConfig,
): RestoreFileInfo[] {
  const fileInfos: RestoreFileInfo[] = [];

  for (const backupPath of files) {
    const originalPath = revertDotPath(backupPath);
    const destFullPath = join(config.source, originalPath);
    const isOverwrite = existsSync(destFullPath);

    fileInfos.push({
      backupPath,
      originalPath,
      isOverwrite,
    });
  }

  return fileInfos;
}

/**
 * 既存ファイルのバックアップを作成（.bakファイル）
 */
async function createBackupFile(filePath: string): Promise<string> {
  const backupPath = `${filePath}.bak`;
  const file = Bun.file(filePath);
  await Bun.write(backupPath, file);
  return backupPath;
}

/**
 * ファイルをリストアする
 */
async function restoreFile(
  source: string,
  destination: string,
  shouldBackup: boolean,
): Promise<{ result: CopyResult; backupPath?: string }> {
  let backupPath: string | undefined;

  try {
    const destDir = dirname(destination);
    if (!existsSync(destDir)) {
      mkdirSync(destDir, { recursive: true });
    }

    if (shouldBackup && existsSync(destination)) {
      backupPath = await createBackupFile(destination);
    }

    const sourceFile = Bun.file(source);
    await Bun.write(destination, sourceFile);

    return {
      result: {
        success: true,
        source,
        destination,
      },
      backupPath,
    };
  } catch (error) {
    return {
      result: {
        success: false,
        source,
        destination,
        error: error instanceof Error ? error.message : String(error),
      },
    };
  }
}

/**
 * リストアを実行する（プログラマブルAPI）
 *
 * process.exit を使用せず、エラーは throw する。
 */
export async function executeRestore(options: RestoreOptions = {}): Promise<RestoreResult> {
  // 設定の解決
  let config: ResolvedConfig;
  if (options.config) {
    config = options.config;
  } else {
    config = await loadConfig(options.configPath ?? 'backupper.config.ts');
  }

  validateRestoreConfig(config);

  // リストア対象ファイルを取得
  let restoreFiles = resolveRestoreFiles(config);

  if (options.only) {
    restoreFiles = filterByOnlyPattern(restoreFiles, options.only);
  }

  // ファイル情報を収集
  const fileInfos = collectRestoreFileInfo(restoreFiles, config);

  // dryRun の場合はファイル情報のみ返す
  if (options.dryRun) {
    return {
      restoreResults: [],
      fileInfos,
    };
  }

  // force でなく confirmContinue も未指定の場合はエラー
  if (!options.force && !options.confirmContinue) {
    throw new Error('force が false の場合、confirmContinue コールバックを指定してください');
  }

  // 確認プロンプト
  if (!options.force && options.confirmContinue) {
    const confirmed = await options.confirmContinue();
    if (!confirmed) {
      return {
        restoreResults: [],
        fileInfos,
        cancelled: true,
      };
    }
  }

  // リストア実行
  const restoreResults: CopyResult[] = [];

  for (const fileInfo of fileInfos) {
    const sourcePath = join(config.destination, fileInfo.backupPath);
    const destPath = join(config.source, fileInfo.originalPath);

    const { result } = await restoreFile(
      sourcePath,
      destPath,
      config.restore?.preserveOriginal ?? false,
    );
    restoreResults.push(result);
  }

  return {
    restoreResults,
    fileInfos,
  };
}
