import { DEFAULT_CONFIG_PATH } from "./ConfigLoader.ts"

// ============================================
// 型定義
// ============================================

/**
 * サブコマンドの種類
 */
export type SubCommand = "backup" | "restore"

/**
 * メインCLI引数の解析結果
 */
export type MainCliResult =
  | { type: "help" }
  | { type: "subcommand"; command: SubCommand; args: string[] }
  | { type: "error"; message: string }

/**
 * backup用CLI引数オプション
 */
export interface BackupCliOptions {
  configPath: string
  sync: boolean
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
使用方法: bun run cli backup [オプション]

オプション:
  --config, -c <パス>  設定ファイルのパスを指定（デフォルト: ${DEFAULT_CONFIG_PATH}）
  --sync               ソースで削除されたファイルをターゲットからも削除
  --help, -h           このヘルプを表示
`)
}

/**
 * backup用コマンドライン引数を解析する
 */
export function parseBackupArgs(args: string[]): BackupCliOptions | null {
  const options: BackupCliOptions = {
    configPath: DEFAULT_CONFIG_PATH,
    sync: false,
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
    } else if (arg === "--sync") {
      options.sync = true
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
使用方法: bun run cli restore [オプション]

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

// ============================================
// メインCLI（サブコマンドルーティング）
// ============================================

/**
 * メインヘルプメッセージを表示する
 */
export function showMainHelp(): void {
  console.log(`
Backupper - ファイルバックアップ・リストアツール

使用方法: bun run cli <コマンド> [オプション]

コマンド:
  backup    ファイルをバックアップ (files/ へコピー)
  restore   ファイルをリストア (files/ から元の場所へ復元)

オプション:
  --help, -h      このヘルプを表示

各コマンドの詳細:
  bun run cli backup --help
  bun run cli restore --help
`)
}

/**
 * メインCLI引数を解析する（サブコマンドルーティング用）
 */
export function parseMainArgs(args: string[]): MainCliResult {
  // 引数なし
  if (args.length === 0) {
    return { type: "error", message: "コマンドが指定されていません" }
  }

  const firstArg = args[0]

  // ヘルプオプション
  if (firstArg === "--help" || firstArg === "-h") {
    return { type: "help" }
  }

  // サブコマンド判定
  if (firstArg === "backup" || firstArg === "restore") {
    return {
      type: "subcommand",
      command: firstArg,
      args: args.slice(1),
    }
  }

  // 不明なコマンド
  return { type: "error", message: `不明なコマンド: ${firstArg}` }
}
