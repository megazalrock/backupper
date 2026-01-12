import { DEFAULT_CONFIG_PATH } from "./ConfigLoader.ts"

// ============================================
// 型定義
// ============================================

export interface CliOptions {
  configPath: string
}

// ============================================
// コマンドライン引数パーサー
// ============================================

/**
 * ヘルプメッセージを表示する
 */
export function showHelp(): void {
  console.log(`
使用方法: bun run scripts/copyScript.ts [オプション]

オプション:
  --config, -c <パス>  設定ファイルのパスを指定（デフォルト: ${DEFAULT_CONFIG_PATH}）
  --help, -h           このヘルプを表示
`)
}

/**
 * コマンドライン引数を解析する
 */
export function parseArgs(args: string[]): CliOptions | null {
  const options: CliOptions = {
    configPath: DEFAULT_CONFIG_PATH,
  }

  for (let i = 0; i < args.length; i++) {
    const arg = args[i]
    if (arg === "--help" || arg === "-h") {
      showHelp()
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
