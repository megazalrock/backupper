import { executeBackup } from '../../api/executeBackup.ts';
import { runPostActions } from '../../modules/ActionRunner.ts';
import { loadConfig, validateBackupConfig } from '../../modules/ConfigLoader.ts';
import {
  logDeleteResult,
  logDeleteTargetCount,
  logError,
  logResult,
  logScriptStart,
  logSummary,
  logSyncSummary,
  logTargetFileCount,
} from '../../modules/Logger.ts';
import { parseArgs, showHelp, type BackupCliOptions } from '../../modules/ParseCliArguments.ts';
import type { ResolvedConfig } from '../../types/config.ts';

export async function main(cliArgs?: string[]): Promise<void> {
  // 1. コマンドライン引数を解析
  const args = cliArgs ?? process.argv.slice(2);
  let options: BackupCliOptions;

  try {
    const parsed = parseArgs(args);
    if (parsed === null) {
      process.exit(0);
    }
    options = parsed;
  } catch (error) {
    logError(error instanceof Error ? error.message : String(error));
    showHelp();
    process.exit(1);
  }

  logScriptStart('コピー', options.configPath);

  // 2. 設定ファイルを読み込み
  let config: ResolvedConfig;
  try {
    config = await loadConfig(options.configPath);
  } catch (error) {
    logError(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }

  // 3. 設定のバリデーション
  try {
    validateBackupConfig(config);
  } catch (error) {
    logError(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }

  // 4. バックアップ実行
  const result = await executeBackup({
    config,
    only: options.only,
  });

  // 5. ログ出力
  logTargetFileCount(result.copiedFiles.length);

  for (const copyResult of result.copyResults) {
    logResult(copyResult);
  }

  if (config.backup?.sync && result.deleteResults.length > 0) {
    logDeleteTargetCount(result.deleteResults.length);
    for (const deleteResult of result.deleteResults) {
      logDeleteResult(deleteResult);
    }
  }

  if (config.backup?.sync) {
    logSyncSummary(result.copyResults, result.deleteResults);
  } else {
    logSummary(result.copyResults, 'コピー');
  }

  // 6. 後処理を実行
  await runPostActions(config.backup?.postRunActions, config.destination);
}
