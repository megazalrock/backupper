import { DEFAULT_CONFIG_PATH } from "./ConfigLoader.ts"

// ============================================
// 型定義
// ============================================

/**
 * backup用CLI引数オプション
 */
export interface BackupCliOptions {
  configPath: string
}

/**
 * restore用CLI引数オプション
 */
export interface RestoreCliOptions {
  configPath: string
  dryRun: boolean
  backup: boolean
  force: boolean
}

// 後方互換性のためのエイリアス
export type CliOptions = BackupCliOptions

// ============================================
// backup用コマンドライン引数パーサー
// ============================================

/**
 * backup用ヘルプメッセージを表示する
 */
export function showBackupHelp(): void {
  console.log(`
使用方法: bun run scripts/backup.ts [オプション]

オプション:
  --config, -c <パス>  設定ファイルのパスを指定（デフォルト: ${DEFAULT_CONFIG_PATH}）
  --help, -h           このヘルプを表示
`)
}

/**
 * backup用コマンドライン引数を解析する
 */
export function parseBackupArgs(args: string[]): BackupCliOptions | null {
  const options: BackupCliOptions = {
    configPath: DEFAULT_CONFIG_PATH,
  }

  for (let i = 0; i < args.length; i++) {
    const arg = args[i]
    if (arg === "--help" || arg === "-h") {
      showBackupHelp()
      return null
    } else if (arg === "--config" || arg === "-c") {
      const nextArg = args[i + 1]
      if (!nextArg || nextArg.startsWith("-")) {
        throw new Error("--config オプションには設定ファイルのパスが必要です")
      }
      options.configPath = nextArg
      i++ // 次の引数をスキップ
    }
  }

  return options
}

// 後方互換性のためのエイリアス
export const showHelp = showBackupHelp
export const parseArgs = parseBackupArgs

// ============================================
// restore用コマンドライン引数パーサー
// ============================================

/**
 * restore用ヘルプメッセージを表示する
 */
export function showRestoreHelp(): void {
  console.log(`
使用方法: bun run scripts/restore.ts [オプション]

オプション:
  --config, -c <パス>  設定ファイルのパスを指定（デフォルト: ${DEFAULT_CONFIG_PATH}）
  --dry-run            実際のコピーなしに対象ファイル一覧を表示
  --backup             上書き前に既存ファイルを .bak として保存
  --force, -f          確認プロンプトをスキップ
  --help, -h           このヘルプを表示
`)
}

/**
 * restore用コマンドライン引数を解析する
 */
export function parseRestoreArgs(args: string[]): RestoreCliOptions | null {
  const options: RestoreCliOptions = {
    configPath: DEFAULT_CONFIG_PATH,
    dryRun: false,
    backup: false,
    force: false,
  }

  for (let i = 0; i < args.length; i++) {
    const arg = args[i]
    if (arg === "--help" || arg === "-h") {
      showRestoreHelp()
      return null
    } else if (arg === "--config" || arg === "-c") {
      const nextArg = args[i + 1]
      if (!nextArg || nextArg.startsWith("-")) {
        throw new Error("--config オプションには設定ファイルのパスが必要です")
      }
      options.configPath = nextArg
      i++ // 次の引数をスキップ
    } else if (arg === "--dry-run") {
      options.dryRun = true
    } else if (arg === "--backup") {
      options.backup = true
    } else if (arg === "--force" || arg === "-f") {
      options.force = true
    }
  }

  return options
}
