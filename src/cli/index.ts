import { main as backupMain } from '../commands/backup/index.ts';
import { main as restoreMain } from '../commands/restore/index.ts';
import { parseMainArgs, showMainHelp } from '../modules/ParseCliArguments.ts';

/**
 * CLIルーター
 * サブコマンドに応じて適切な処理を呼び出す
 */
export async function runCli(args: string[]): Promise<void> {
  const result = parseMainArgs(args);

  switch (result.type) {
    case 'help':
      showMainHelp();
      break;
    case 'subcommand':
      if (result.command === 'backup') {
        await backupMain(result.args);
      } else {
        await restoreMain(result.args);
      }
      break;
    case 'error':
      console.error(`エラー: ${result.message}`);
      showMainHelp();
      process.exit(1);
  }
}
