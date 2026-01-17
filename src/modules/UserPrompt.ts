/**
 * ユーザー確認フローモジュール
 * Y/n入力による続行確認
 */

/**
 * 入力読み取りを抽象化するインターフェース
 * テスト時にモックを注入可能にする
 */
export interface InputReader {
  read(): Promise<string>
}

/**
 * 標準入力から読み取るデフォルト実装
 * Bun.stdin.stream() を使用
 */
export const stdinReader: InputReader = {
  async read(): Promise<string> {
    const stdin = Bun.stdin.stream()
    const reader = stdin.getReader()
    try {
      const { value } = await reader.read()
      if (!value) return ""
      return new TextDecoder().decode(value).trim().toLowerCase()
    } finally {
      reader.releaseLock()
    }
  }
}

/**
 * テスト用のモックリーダーを作成するファクトリ関数
 * @param input モックとして返す入力文字列
 * @returns InputReader インターフェースを実装したモックオブジェクト
 */
export function createMockReader(input: string): InputReader {
  return {
    async read(): Promise<string> {
      return input
    }
  }
}

/**
 * ユーザーに続行確認を求める
 * @param message 確認メッセージ（デフォルト: "続行しますか？ (Y/n): "）
 * @param reader 入力リーダー（デフォルト: stdinReader）
 * @returns true: 続行, false: キャンセル
 */
export async function confirmContinue(
  message = "続行しますか？ (Y/n): ",
  reader: InputReader = stdinReader
): Promise<boolean> {
  process.stdout.write(message)
  const input = await reader.read()

  // 空入力、"y"、"yes" の場合は続行
  return input === "" || input === "y" || input === "yes"
}
