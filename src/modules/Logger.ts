/**
 * ログ出力モジュール
 * コピー/リストア結果の出力、サマリー表示
 */

import type { CopyResult, DeleteResult, RestoreFileInfo } from '../types/result.ts';

/**
 * コピー/リストア結果をログ出力する
 */
export function logResult(result: CopyResult, backupCreated?: string): void {
  if (result.success) {
    console.log(`✓ ${result.source} → ${result.destination}`);
    if (backupCreated) {
      console.log(`  (バックアップ: ${backupCreated})`);
    }
  } else {
    console.error(`✗ ${result.source} - ${result.error}`);
  }
}

/**
 * サマリーを出力する
 */
export function logSummary(
  results: CopyResult[],
  operationType: 'コピー' | 'リストア',
): void {
  const successCount = results.filter((r) => r.success).length;
  const failureCount = results.filter((r) => !r.success).length;

  console.log('');
  console.log('='.repeat(50));
  console.log(`${operationType}完了: 成功 ${successCount} 件, 失敗 ${failureCount} 件`);
  console.log('='.repeat(50));
}

/**
 * リストア対象ファイル一覧を表示
 */
export function logRestoreFileList(files: RestoreFileInfo[]): void {
  console.log('リストア対象:');
  for (const file of files) {
    const status = file.isOverwrite ? '[上書き]' : '[新規]  ';
    console.log(`  ${status} ${file.originalPath}`);
  }
}

/**
 * ドライラン時のファイル一覧を表示
 */
export function logDryRunFileList(files: RestoreFileInfo[]): void {
  console.log('[DRY-RUN] 以下のファイルがリストアされます:');
  for (const file of files) {
    const status = file.isOverwrite ? '[上書き]' : '[新規]  ';
    console.log(`  ${status} ${file.originalPath}`);
  }
  console.log('');
  console.log('実際のファイル操作は行われませんでした。');
}

/**
 * 削除結果をログ出力する
 */
export function logDeleteResult(result: DeleteResult): void {
  if (result.success) {
    console.log(`✓ 削除: ${result.path}`);
  } else {
    console.error(`✗ 削除失敗: ${result.path} - ${result.error}`);
  }
}

/**
 * 同期サマリーを出力する（コピー結果と削除結果を含む）
 */
export function logSyncSummary(
  copyResults: CopyResult[],
  deleteResults: DeleteResult[],
): void {
  const copySuccess = copyResults.filter((r) => r.success).length;
  const copyFailure = copyResults.filter((r) => !r.success).length;
  const deleteSuccess = deleteResults.filter((r) => r.success).length;
  const deleteFailure = deleteResults.filter((r) => !r.success).length;

  console.log('');
  console.log('='.repeat(50));
  console.log(`コピー完了: 成功 ${copySuccess} 件, 失敗 ${copyFailure} 件`);
  console.log(`削除完了: 成功 ${deleteSuccess} 件, 失敗 ${deleteFailure} 件`);
  console.log('='.repeat(50));
}
