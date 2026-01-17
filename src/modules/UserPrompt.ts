/**
 * ユーザー確認フローモジュール
 * Y/n入力による続行確認
 */

/**
 * ユーザーに続行確認を求める
 * @param message 確認メッセージ（デフォルト: "続行しますか？ (Y/n): "）
 * @returns true: 続行, false: キャンセル
 */
export async function confirmContinue(
  message = "続行しますか？ (Y/n): "
): Promise<boolean> {
  process.stdout.write(message)

  // Bunではconsole.write + ストリーム読み込みを使用
  const stdin = Bun.stdin.stream()
  const reader = stdin.getReader()

  try {
    const { value } = await reader.read()
    if (!value) {
      return false
    }

    const decoder = new TextDecoder()
    const input = decoder.decode(value).trim().toLowerCase()

    // 空入力、"y"、"yes" の場合は続行
    return input === "" || input === "y" || input === "yes"
  } finally {
    reader.releaseLock()
  }
}
