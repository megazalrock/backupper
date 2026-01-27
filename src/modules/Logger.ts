/**
 * ログ出力モジュール
 * コピー/リストア結果の出力、サマリー表示
 */

import type { CopyResult, DeleteResult, RestoreFileInfo } from '../types/result.ts';

// ============================================
// ヘルプ出力用の型定義
// ============================================

/**
 * ヘルプのオプション/コマンド項目
 */
export interface HelpItem {
  /** オプション名やコマンド名（例: "--config, -c <パス>"） */
  name: string
  /** 説明 */
  description: string
}

/**
 * ヘルプ設定
 */
export interface HelpConfig {
  /** 使用方法（例: "bun run cli backup [オプション]"） */
  usage: string
  /** ツール説明（オプション） */
  description?: string
  /** サブコマンド一覧（オプション） */
  commands?: HelpItem[]
  /** オプション一覧（オプション） */
  options?: HelpItem[]
  /** フッター情報（オプション） */
  footer?: string
}

// ============================================
// 汎用ログ関数
// ============================================

/**
 * ヘルプメッセージを統一フォーマットで出力する
 */
export function logHelp(config: HelpConfig): void {
  const lines: string[] = [];

  // 説明文
  if (config.description) {
    lines.push(config.description);
    lines.push('');
  }

  // 使用方法
  lines.push(`使用方法: ${config.usage}`);
  lines.push('');

  // コマンド一覧
  if (config.commands && config.commands.length > 0) {
    lines.push('コマンド:');
    const maxNameLength = Math.max(...config.commands.map((c) => c.name.length));
    for (const cmd of config.commands) {
      lines.push(`  ${cmd.name.padEnd(maxNameLength + 2)}${cmd.description}`);
    }
    lines.push('');
  }

  // オプション一覧
  if (config.options && config.options.length > 0) {
    lines.push('オプション:');
    const maxNameLength = Math.max(...config.options.map((o) => o.name.length));
    for (const opt of config.options) {
      lines.push(`  ${opt.name.padEnd(maxNameLength + 2)}${opt.description}`);
    }
    lines.push('');
  }

  // フッター
  if (config.footer) {
    lines.push(config.footer);
  }

  // 末尾の空行を削除
  while (lines.length > 0 && lines[lines.length - 1] === '') {
    lines.pop();
  }

  console.log(lines.join('\n'));
}

/**
 * エラーメッセージを出力する
 */
export function logError(message: string): void {
  console.error(`エラー: ${message}`);
}

/**
 * スクリプト開始メッセージを出力する
 */
export function logScriptStart(scriptType: 'コピー' | 'リストア', configPath: string): void {
  console.log(`${scriptType}スクリプトを開始します...`);
  console.log(`設定ファイル: ${configPath}`);
  console.log('');
}

/**
 * 対象ファイル数を出力する
 */
export function logTargetFileCount(count: number): void {
  console.log(`対象ファイル数: ${count}`);
  console.log('');
}

/**
 * 削除対象ファイル数を出力する（同期モード用）
 */
export function logDeleteTargetCount(count: number): void {
  console.log('');
  console.log(`削除対象ファイル数: ${count}`);
}

/**
 * 情報メッセージを出力する
 */
export function logInfo(message: string): void {
  console.log(message);
}

/**
 * キャンセル通知を出力する
 */
export function logCancelled(): void {
  console.log('キャンセルされました。');
}

/**
 * 空行を出力する
 */
export function logEmptyLine(): void {
  console.log('');
}

/**
 * セパレータ線を出力する
 */
export function logSeparator(): void {
  console.log('='.repeat(50));
}

// ============================================
// アクション実行ログ関数
// ============================================

/**
 * アクション実行開始を出力する
 */
export function logActionStart(command: string): void {
  console.log(`実行中: ${command}`);
}

/**
 * アクション成功を出力する
 */
export function logActionSuccess(command: string): void {
  console.log(`✓ 完了: ${command}`);
}

/**
 * アクション失敗を出力する
 */
export function logActionFailure(command: string, exitCode?: number): void {
  if (exitCode !== undefined) {
    console.error(`✗ 失敗: ${command} (終了コード: ${exitCode})`);
  } else {
    console.error(`✗ 失敗: ${command}`);
  }
}

/**
 * アクションエラー詳細を出力する
 */
export function logActionError(errorMessage: string): void {
  console.error(`  ${errorMessage}`);
}

/**
 * 後処理開始メッセージを出力する
 */
export function logPostActionsStart(): void {
  console.log('');
  console.log('後処理を実行します...');
}

// ============================================
// コピー/リストア結果ログ関数
// ============================================

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

  logEmptyLine();
  logSeparator();
  console.log(`${operationType}完了: 成功 ${successCount} 件, 失敗 ${failureCount} 件`);
  logSeparator();
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

  logEmptyLine();
  logSeparator();
  console.log(`コピー完了: 成功 ${copySuccess} 件, 失敗 ${copyFailure} 件`);
  console.log(`削除完了: 成功 ${deleteSuccess} 件, 失敗 ${deleteFailure} 件`);
  logSeparator();
}
