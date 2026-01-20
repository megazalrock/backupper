import { existsSync, mkdirSync, unlinkSync, rmdirSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';

import { runPostActions } from '../../modules/ActionRunner.ts';
import { loadConfig, validateConfig } from '../../modules/ConfigLoader.ts';
import { findOrphanedFiles, resolveTargetFiles, shouldExclude } from '../../modules/FileResolver.ts';
import { logDeleteResult, logResult, logSummary, logSyncSummary } from '../../modules/Logger.ts';
import { parseArgs, showHelp, type BackupCliOptions } from '../../modules/ParseCliArguments.ts';
import { convertDotPath } from '../../modules/PathConverter.ts';
import type { Config } from '../../types/config.ts';
import type { CopyResult, DeleteResult } from '../../types/result.ts';

// ============================================
// コピー・削除実行関数
// ============================================

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
  // ルートディレクトリ自体は削除しない
  if (dirPath === rootPath) {
    return;
  }

  try {
    const entries = readdirSync(dirPath);
    if (entries.length === 0) {
      rmdirSync(dirPath);
      // 親ディレクトリも確認
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
    // コピー先ディレクトリを作成
    const destDir = dirname(destination);
    if (!existsSync(destDir)) {
      mkdirSync(destDir, { recursive: true });
    }

    // ファイルをコピー
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

// ============================================
// メイン処理
// ============================================

export async function main(cliArgs?: string[]): Promise<void> {
  // 1. コマンドライン引数を解析
  const args = cliArgs ?? process.argv.slice(2);
  let options: BackupCliOptions;

  try {
    const parsed = parseArgs(args);
    if (parsed === null) {
      // ヘルプ表示の場合は終了
      process.exit(0);
    }
    options = parsed;
  } catch (error) {
    console.error(
      `エラー: ${error instanceof Error ? error.message : String(error)}`,
    );
    showHelp();
    process.exit(1);
  }

  console.log('コピースクリプトを開始します...');
  console.log(`設定ファイル: ${options.configPath}`);
  console.log('');

  // 2. 設定ファイルを読み込み
  let config: Config;
  try {
    config = await loadConfig(options.configPath);
  } catch (error) {
    console.error(
      `エラー: ${error instanceof Error ? error.message : String(error)}`,
    );
    process.exit(1);
  }

  // 3. 設定のバリデーション
  try {
    validateConfig(config);
  } catch (error) {
    console.error(
      `エラー: ${error instanceof Error ? error.message : String(error)}`,
    );
    process.exit(1);
  }

  // 4. ファイル一覧を取得
  const targetFiles = resolveTargetFiles(config);
  console.log(`対象ファイル数: ${targetFiles.length}`);
  console.log('');

  // 5. コピー実行
  const copyResults: CopyResult[] = [];
  // 除外されていないファイルのリストを保持（削除判定に使用）
  const copiedFiles: string[] = [];

  for (const relativePath of targetFiles) {
    // 除外チェック
    if (shouldExclude(relativePath, config.excludes)) {
      continue;
    }

    copiedFiles.push(relativePath);

    // パス変換
    const convertedPath = convertDotPath(relativePath);
    const sourcePath = join(config.source, relativePath);
    const destPath = join(config.target, convertedPath);

    // コピー実行
    const result = await copyFile(sourcePath, destPath);
    copyResults.push(result);
    logResult(result);
  }

  // 6. 同期モード: 孤児ファイルの削除
  const deleteResults: DeleteResult[] = [];

  if (config.backup?.sync) {
    const orphanedFiles = findOrphanedFiles(copiedFiles, config);

    if (orphanedFiles.length > 0) {
      console.log('');
      console.log(`削除対象ファイル数: ${orphanedFiles.length}`);

      for (const orphanedFile of orphanedFiles) {
        const filePath = join(config.target, orphanedFile);
        const result = deleteFile(filePath);
        deleteResults.push(result);
        logDeleteResult(result);

        // 削除成功時、空になったディレクトリを削除
        if (result.success) {
          const parentDir = dirname(filePath);
          removeEmptyDirectories(parentDir, config.target);
        }
      }
    }
  }

  // 7. サマリー出力
  if (config.backup?.sync) {
    logSyncSummary(copyResults, deleteResults);
  } else {
    logSummary(copyResults, 'コピー');
  }

  // 8. 後処理を実行
  await runPostActions(config.backup?.postRunActions, config.target);
}
