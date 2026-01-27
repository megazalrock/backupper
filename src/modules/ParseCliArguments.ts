import { DEFAULT_CONFIG_PATH, findDefaultConfigPath } from './ConfigLoader.ts';
import { logHelp } from './Logger.ts';

// ============================================
// 型定義
// ============================================

/**
 * サブコマンドの種類
 */
export type SubCommand = 'backup' | 'restore';

/**
 * メインCLI引数の解析結果
 */
export type MainCliResult =
  | { type: 'help' }
  | { type: 'subcommand'; command: SubCommand; args: string[] }
  | { type: 'error'; message: string };

/**
 * backup用CLI引数オプション
 */
export interface BackupCliOptions {
  configPath: string
  only?: string
}

/**
 * restore用CLI引数オプション
 */
export interface RestoreCliOptions {
  configPath: string
  dryRun: boolean
  force: boolean
  only?: string
}

// 後方互換性のためのエイリアス
export type CliOptions = BackupCliOptions;

// ============================================
// backup用コマンドライン引数パーサー
// ============================================

/**
 * backup用ヘルプメッセージを表示する
 */
export function showBackupHelp(): void {
  logHelp({
    usage: 'bun run cli backup [オプション]',
    options: [
      { name: '--config, -c <パス>', description: `設定ファイルのパスを指定（デフォルト: ${DEFAULT_CONFIG_PATH}）` },
      { name: '--only <glob>', description: '指定したglobパターンに一致するファイルのみをバックアップ' },
      { name: '--help, -h', description: 'このヘルプを表示' },
    ],
  });
}

/**
 * backup用コマンドライン引数を解析する
 */
export function parseBackupArgs(args: string[]): BackupCliOptions | null {
  const options: BackupCliOptions = {
    configPath: findDefaultConfigPath() ?? DEFAULT_CONFIG_PATH,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--help' || arg === '-h') {
      showBackupHelp();
      return null;
    } else if (arg === '--config' || arg === '-c') {
      const nextArg = args[i + 1];
      if (!nextArg || nextArg.startsWith('-')) {
        throw new Error('--config オプションには設定ファイルのパスが必要です');
      }
      options.configPath = nextArg;
      i++; // 次の引数をスキップ
    } else if (arg === '--only') {
      const nextArg = args[i + 1];
      if (!nextArg || nextArg.startsWith('-')) {
        throw new Error('--only オプションにはglobパターンが必要です');
      }
      options.only = nextArg;
      i++; // 次の引数をスキップ
    }
  }

  return options;
}

// 後方互換性のためのエイリアス
export const showHelp = showBackupHelp;
export const parseArgs = parseBackupArgs;

// ============================================
// restore用コマンドライン引数パーサー
// ============================================

/**
 * restore用ヘルプメッセージを表示する
 */
export function showRestoreHelp(): void {
  logHelp({
    usage: 'bun run cli restore [オプション]',
    options: [
      { name: '--config, -c <パス>', description: `設定ファイルのパスを指定（デフォルト: ${DEFAULT_CONFIG_PATH}）` },
      { name: '--dry-run', description: '実際のコピーなしに対象ファイル一覧を表示' },
      { name: '--force, -f', description: '確認プロンプトをスキップ' },
      { name: '--only <glob>', description: '指定したglobパターンに一致するファイルのみをリストア' },
      { name: '--help, -h', description: 'このヘルプを表示' },
    ],
  });
}

/**
 * restore用コマンドライン引数を解析する
 */
export function parseRestoreArgs(args: string[]): RestoreCliOptions | null {
  const options: RestoreCliOptions = {
    configPath: findDefaultConfigPath() ?? DEFAULT_CONFIG_PATH,
    dryRun: false,
    force: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--help' || arg === '-h') {
      showRestoreHelp();
      return null;
    } else if (arg === '--config' || arg === '-c') {
      const nextArg = args[i + 1];
      if (!nextArg || nextArg.startsWith('-')) {
        throw new Error('--config オプションには設定ファイルのパスが必要です');
      }
      options.configPath = nextArg;
      i++; // 次の引数をスキップ
    } else if (arg === '--dry-run') {
      options.dryRun = true;
    } else if (arg === '--force' || arg === '-f') {
      options.force = true;
    } else if (arg === '--only') {
      const nextArg = args[i + 1];
      if (!nextArg || nextArg.startsWith('-')) {
        throw new Error('--only オプションにはglobパターンが必要です');
      }
      options.only = nextArg;
      i++; // 次の引数をスキップ
    }
  }

  return options;
}

// ============================================
// メインCLI（サブコマンドルーティング）
// ============================================

/**
 * メインヘルプメッセージを表示する
 */
export function showMainHelp(): void {
  logHelp({
    usage: 'bun run cli <コマンド> [オプション]',
    description: 'Backupper - ファイルバックアップ・リストアツール',
    commands: [
      { name: 'backup', description: 'ファイルをバックアップ (files/ へコピー)' },
      { name: 'restore', description: 'ファイルをリストア (files/ から元の場所へ復元)' },
    ],
    options: [
      { name: '--help, -h', description: 'このヘルプを表示' },
    ],
    footer: '各コマンドの詳細:\n  bun run cli backup --help\n  bun run cli restore --help',
  });
}

/**
 * メインCLI引数を解析する（サブコマンドルーティング用）
 */
export function parseMainArgs(args: string[]): MainCliResult {
  // 引数なし
  if (args.length === 0) {
    return { type: 'error', message: 'コマンドが指定されていません' };
  }

  const firstArg = args[0];

  // ヘルプオプション
  if (firstArg === '--help' || firstArg === '-h') {
    return { type: 'help' };
  }

  // サブコマンド判定
  if (firstArg === 'backup' || firstArg === 'restore') {
    return {
      type: 'subcommand',
      command: firstArg,
      args: args.slice(1),
    };
  }

  // 不明なコマンド
  return { type: 'error', message: `不明なコマンド: ${firstArg}` };
}
