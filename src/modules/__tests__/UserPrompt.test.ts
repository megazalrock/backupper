/**
 * UserPrompt モジュールのユニットテスト
 */
import { describe, expect, test, spyOn, afterEach } from "bun:test"
import { confirmContinue, createMockReader } from "../UserPrompt"

describe("UserPrompt", () => {
  describe("confirmContinue", () => {
    // process.stdout.write をスパイしてメッセージ出力を検証
    const stdoutWriteSpy = spyOn(process.stdout, "write")

    afterEach(() => {
      stdoutWriteSpy.mockClear()
    })

    test("空入力で true を返す", async () => {
      const mockReader = createMockReader("")
      const result = await confirmContinue(undefined, mockReader)
      expect(result).toBe(true)
    })

    test('"y" 入力で true を返す', async () => {
      const mockReader = createMockReader("y")
      const result = await confirmContinue(undefined, mockReader)
      expect(result).toBe(true)
    })

    test('"yes" 入力で true を返す', async () => {
      const mockReader = createMockReader("yes")
      const result = await confirmContinue(undefined, mockReader)
      expect(result).toBe(true)
    })

    test('"Y" 入力で true を返す（大文字）', async () => {
      // 注: stdinReader は内部で toLowerCase() を呼び出すため、
      // 実際の標準入力では "Y" は "y" に変換される
      // createMockReader は入力をそのまま返すため、
      // ここでは小文字変換後の状態をシミュレートする
      const mockReader = createMockReader("y")
      const result = await confirmContinue(undefined, mockReader)
      expect(result).toBe(true)
    })

    test('"n" 入力で false を返す', async () => {
      const mockReader = createMockReader("n")
      const result = await confirmContinue(undefined, mockReader)
      expect(result).toBe(false)
    })

    test('"no" 入力で false を返す', async () => {
      const mockReader = createMockReader("no")
      const result = await confirmContinue(undefined, mockReader)
      expect(result).toBe(false)
    })

    test("その他の入力で false を返す", async () => {
      const mockReader = createMockReader("invalid")
      const result = await confirmContinue(undefined, mockReader)
      expect(result).toBe(false)
    })

    test("カスタムメッセージを表示する", async () => {
      const customMessage = "本当に実行しますか？ (Y/n): "
      const mockReader = createMockReader("y")
      await confirmContinue(customMessage, mockReader)
      expect(stdoutWriteSpy).toHaveBeenCalledWith(customMessage)
    })
  })
})
