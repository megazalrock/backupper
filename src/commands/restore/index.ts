import { executeRestore } from '../../api/executeRestore.ts';
import { runPostActions } from '../../modules/ActionRunner.ts';
import { loadConfig, validateRestoreConfig } from '../../modules/ConfigLoader.ts';
import {
  logCancelled,
  logDryRunFileList,
  logEmptyLine,
  logError,
  logInfo,
  logRestoreFileList,
  logResult,
  logScriptStart,
  logSummary,
  logTargetFileCount,
} from '../../modules/Logger.ts';
import {
  parseRestoreArgs,
  showRestoreHelp,
  type RestoreCliOptions,
} from '../../modules/ParseCliArguments.ts';
import { confirmContinue as defaultConfirmContinue } from '../../modules/UserPrompt.ts';
import type { ResolvedConfig } from '../../types/config.ts';

export async function main(
  cliArgs?: string[],
  deps: { confirmContinue?: () => Promise<boolean> } = {},
): Promise<void> {
  const { confirmContinue = defaultConfirmContinue } = deps;

  // 1. コマンドライン引数を解析
  const args = cliArgs ?? process.argv.slice(2);
  let options: RestoreCliOptions;

  try {
    const parsed = parseRestoreArgs(args);
    if (parsed === null) {
      process.exit(0);
    }
    options = parsed;
  } catch (error) {
    logError(error instanceof Error ? error.message : String(error));
    showRestoreHelp();
    process.exit(1);
  }

  logScriptStart('リストア', options.configPath);

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
    validateRestoreConfig(config);
  } catch (error) {
    logError(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }

  // 4. ファイル情報の取得（dryRun で実行して fileInfos を得る）
  const dryResult = await executeRestore({
    config,
    only: options.only,
    dryRun: true,
  });

  if (dryResult.fileInfos.length === 0) {
    logInfo('リストア対象のファイルがありません。');
    process.exit(0);
  }

  logTargetFileCount(dryResult.fileInfos.length);

  // 5. dry-run の場合はファイル一覧を表示して終了
  if (options.dryRun) {
    logDryRunFileList(dryResult.fileInfos);
    process.exit(0);
  }

  // 6. ファイル一覧を表示
  logRestoreFileList(dryResult.fileInfos);
  logEmptyLine();

  // 7. force でなければ確認プロンプト
  if (!options.force) {
    const confirmed = await confirmContinue();
    if (!confirmed) {
      logCancelled();
      process.exit(0);
    }
    logEmptyLine();
  }

  // 8. リストア実行
  const result = await executeRestore({
    config,
    only: options.only,
    force: true,
  });

  // 9. ログ出力
  for (const restoreResult of result.restoreResults) {
    logResult(restoreResult);
  }

  // 10. サマリー出力
  logSummary(result.restoreResults, 'リストア');

  // 11. 後処理を実行
  await runPostActions(config.restore?.postRunActions, config.source);
}
