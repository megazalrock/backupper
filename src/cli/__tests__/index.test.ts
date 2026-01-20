import {
  describe,
  test,
  expect,
  beforeEach,
  afterEach,
  spyOn,
  type Mock,
} from "bun:test"
import { runCli } from "../index"
import {
  createTempDir,
  cleanupTempDir,
  createTestFiles,
} from "../../modules/__tests__/helpers/tempDir"
import { join } from "node:path"
import { existsSync } from "node:fs"

describe("cli/index", () => {
  describe("runCli", () => {
    let tempDir: string
    let exitSpy: Mock<typeof process.exit>
    let consoleLogSpy: Mock<typeof console.log>
    let consoleErrorSpy: Mock<typeof console.error>

    beforeEach(() => {
      tempDir = createTempDir("cli-test-")
      exitSpy = spyOn(process, "exit").mockImplementation(() => {
        throw new Error("process.exit called")
      })
      consoleLogSpy = spyOn(console, "log").mockImplementation(() => {})
      consoleErrorSpy = spyOn(console, "error").mockImplementation(() => {})
    })

    afterEach(() => {
      cleanupTempDir(tempDir)
      exitSpy.mockRestore()
      consoleLogSpy.mockRestore()
      consoleErrorSpy.mockRestore()
    })

    // =====================
    // ヘルプ表示
    // =====================
    describe("ヘルプ表示", () => {
      test("--help オプションでヘルプを表示する", async () => {
        await runCli(["--help"])

        // ヘルプメッセージが出力されていることを確認
        expect(consoleLogSpy).toHaveBeenCalledWith(
          expect.stringContaining("Backupper")
        )
        expect(consoleLogSpy).toHaveBeenCalledWith(
          expect.stringContaining("backup")
        )
        expect(consoleLogSpy).toHaveBeenCalledWith(
          expect.stringContaining("restore")
        )
      })

      test("-h オプションでヘルプを表示する", async () => {
        await runCli(["-h"])

        // ヘルプメッセージが出力されていることを確認
        expect(consoleLogSpy).toHaveBeenCalledWith(
          expect.stringContaining("Backupper")
        )
      })
    })

    // =====================
    // backup サブコマンド
    // =====================
    describe("backup サブコマンド", () => {
      test("backup コマンドで backupMain を呼び出す", async () => {
        // 実際に backup を実行して動作を確認
        const sourceDir = join(tempDir, "source")
        const targetDir = join(tempDir, "target")

        createTestFiles(tempDir, {
          "source/file.txt": "content",
        })

        const configContent = `
export const config = {
  source: "${sourceDir}",
  target: "${targetDir}",
  includes: ["file.txt"],
  excludes: [],
}
`
        createTestFiles(tempDir, { "config.ts": configContent })

        await runCli(["backup", "--config", join(tempDir, "config.ts")])

        // backup が実行されたことを確認
        expect(existsSync(join(targetDir, "file.txt"))).toBe(true)
      })

      test("backup コマンドに渡された引数を backupMain に渡す", async () => {
        // ヘルプオプションを渡して、backup のヘルプが表示されることを確認
        await expect(runCli(["backup", "--help"])).rejects.toThrow(
          "process.exit called"
        )

        expect(exitSpy).toHaveBeenCalledWith(0)
        // backup のヘルプが表示されていることを確認
        expect(consoleLogSpy).toHaveBeenCalledWith(
          expect.stringContaining("bun run cli backup")
        )
      })
    })

    // =====================
    // restore サブコマンド
    // =====================
    describe("restore サブコマンド", () => {
      test("restore コマンドで restoreMain を呼び出す", async () => {
        // 実際に restore を実行して動作を確認
        const sourceDir = join(tempDir, "source")
        const targetDir = join(tempDir, "target")

        createTestFiles(tempDir, {
          "source/.gitkeep": "",
          "target/file.txt": "content",
        })

        const configContent = `
export const config = {
  source: "${sourceDir}",
  target: "${targetDir}",
  includes: ["file.txt"],
  excludes: [],
}
`
        createTestFiles(tempDir, { "config.ts": configContent })

        await runCli([
          "restore",
          "--config",
          join(tempDir, "config.ts"),
          "--force",
        ])

        // restore が実行されたことを確認
        expect(existsSync(join(sourceDir, "file.txt"))).toBe(true)
      })

      test("restore コマンドに渡された引数を restoreMain に渡す", async () => {
        // ヘルプオプションを渡して、restore のヘルプが表示されることを確認
        await expect(runCli(["restore", "--help"])).rejects.toThrow(
          "process.exit called"
        )

        expect(exitSpy).toHaveBeenCalledWith(0)
        // restore のヘルプが表示されていることを確認
        expect(consoleLogSpy).toHaveBeenCalledWith(
          expect.stringContaining("bun run cli restore")
        )
      })
    })

    // =====================
    // エラーハンドリング
    // =====================
    describe("エラーハンドリング", () => {
      test("引数なしでエラーメッセージを出力し process.exit(1) を呼ぶ", async () => {
        await expect(runCli([])).rejects.toThrow("process.exit called")

        expect(exitSpy).toHaveBeenCalledWith(1)
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          expect.stringContaining("コマンドが指定されていません")
        )
      })

      test("不明なコマンドでエラーメッセージを出力し process.exit(1) を呼ぶ", async () => {
        await expect(runCli(["unknown"])).rejects.toThrow("process.exit called")

        expect(exitSpy).toHaveBeenCalledWith(1)
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          expect.stringContaining("不明なコマンド: unknown")
        )
      })
    })
  })
})
