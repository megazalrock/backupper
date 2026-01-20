import {
  describe,
  test,
  expect,
  beforeEach,
  afterEach,
  spyOn,
  mock,
  type Mock,
} from "bun:test"

// confirmContinue をモックして stdin 待機を回避
const confirmContinueMock = mock(() => Promise.resolve(true))
mock.module("../../../modules/UserPrompt.ts", () => ({
  confirmContinue: confirmContinueMock,
}))

import { main } from "../index"
import {
  createTempDir,
  cleanupTempDir,
  createTestFiles,
} from "../../../modules/__tests__/helpers/tempDir"
import { join } from "node:path"
import { existsSync, readFileSync } from "node:fs"

describe("commands/restore", () => {
  describe("main", () => {
    let tempDir: string
    let exitSpy: Mock<typeof process.exit>
    let consoleLogSpy: Mock<typeof console.log>
    let consoleErrorSpy: Mock<typeof console.error>
    let stdoutWriteSpy: Mock<typeof process.stdout.write>

    beforeEach(() => {
      tempDir = createTempDir("restore-test-")
      exitSpy = spyOn(process, "exit").mockImplementation(() => {
        throw new Error("process.exit called")
      })
      consoleLogSpy = spyOn(console, "log").mockImplementation(() => {})
      consoleErrorSpy = spyOn(console, "error").mockImplementation(() => {})
      stdoutWriteSpy = spyOn(process.stdout, "write").mockImplementation(
        () => true
      )
    })

    afterEach(() => {
      cleanupTempDir(tempDir)
      exitSpy.mockRestore()
      consoleLogSpy.mockRestore()
      consoleErrorSpy.mockRestore()
      stdoutWriteSpy.mockRestore()
    })

    // =====================
    // 引数解析
    // =====================
    describe("引数解析", () => {
      test("--help オプションで process.exit(0) を呼ぶ", async () => {
        await expect(main(["--help"])).rejects.toThrow("process.exit called")
        expect(exitSpy).toHaveBeenCalledWith(0)
      })

      test("--config オプションで指定した設定ファイルを使用する", async () => {
        // 有効な設定ファイルを作成
        const sourceDir = join(tempDir, "source")
        const targetDir = join(tempDir, "target")
        createTestFiles(tempDir, {
          "source/.gitkeep": "",
          "target/test.txt": "content",
        })

        const configContent = `
export const config = {
  source: "${sourceDir}",
  target: "${targetDir}",
  includes: ["test.txt"],
  excludes: [],
}
`
        createTestFiles(tempDir, {
          "test-config.ts": configContent,
        })

        await main(["--config", join(tempDir, "test-config.ts"), "--force"])

        // 設定ファイルが使用されたことを確認
        expect(consoleLogSpy).toHaveBeenCalledWith(
          expect.stringContaining("test-config.ts")
        )
      })

      test("--dry-run オプションでファイル一覧のみ表示して終了する", async () => {
        const sourceDir = join(tempDir, "source")
        const targetDir = join(tempDir, "target")

        createTestFiles(tempDir, {
          "source/.gitkeep": "",
          "target/src/index.ts": "export {}",
        })

        const configContent = `
export const config = {
  source: "${sourceDir}",
  target: "${targetDir}",
  includes: ["src/"],
  excludes: [],
}
`
        createTestFiles(tempDir, { "config.ts": configContent })

        await expect(
          main(["--config", join(tempDir, "config.ts"), "--dry-run"])
        ).rejects.toThrow("process.exit called")

        expect(exitSpy).toHaveBeenCalledWith(0)
        // ファイルはコピーされていない
        expect(existsSync(join(sourceDir, "src/index.ts"))).toBe(false)
      })

      test("--force オプションで確認プロンプトをスキップする", async () => {
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

        await main(["--config", join(tempDir, "config.ts"), "--force"])

        // 確認プロンプトが表示されていないことを確認
        expect(stdoutWriteSpy).not.toHaveBeenCalledWith(
          expect.stringContaining("続行しますか")
        )
        // ファイルがリストアされていることを確認
        expect(existsSync(join(sourceDir, "file.txt"))).toBe(true)
      })

      test("不正な引数でエラーを出力し process.exit(1) を呼ぶ", async () => {
        // --config に値を渡さない場合
        await expect(main(["--config"])).rejects.toThrow("process.exit called")
        expect(exitSpy).toHaveBeenCalledWith(1)
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          expect.stringContaining("--config")
        )
      })
    })

    // =====================
    // 設定ファイル読み込み
    // =====================
    describe("設定ファイル読み込み", () => {
      test("存在しない設定ファイルでエラーを出力し process.exit(1) を呼ぶ", async () => {
        const nonexistentPath = join(tempDir, "nonexistent-config.ts")

        await expect(main(["--config", nonexistentPath])).rejects.toThrow(
          "process.exit called"
        )
        expect(exitSpy).toHaveBeenCalledWith(1)
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          expect.stringContaining("設定ファイルが見つかりません")
        )
      })
    })

    // =====================
    // リストア対象ファイル収集
    // =====================
    describe("リストア対象ファイル収集", () => {
      test("リストア対象がない場合メッセージを出力し process.exit(0) を呼ぶ", async () => {
        const sourceDir = join(tempDir, "source")
        const targetDir = join(tempDir, "target")

        // targetDir は存在するがファイルがない状態
        createTestFiles(tempDir, {
          "source/.gitkeep": "",
          "target/.gitkeep": "",
        })

        const configContent = `
export const config = {
  source: "${sourceDir}",
  target: "${targetDir}",
  includes: ["src/"],
  excludes: [],
}
`
        createTestFiles(tempDir, { "config.ts": configContent })

        await expect(
          main(["--config", join(tempDir, "config.ts")])
        ).rejects.toThrow("process.exit called")

        expect(exitSpy).toHaveBeenCalledWith(0)
        expect(consoleLogSpy).toHaveBeenCalledWith(
          "リストア対象のファイルがありません。"
        )
      })

      test("上書き対象ファイルを正しく判定する", async () => {
        const sourceDir = join(tempDir, "source")
        const targetDir = join(tempDir, "target")

        // sourceDir に既存ファイルがある状態
        createTestFiles(tempDir, {
          "source/existing.txt": "old content",
          "target/existing.txt": "new content",
        })

        const configContent = `
export const config = {
  source: "${sourceDir}",
  target: "${targetDir}",
  includes: ["existing.txt"],
  excludes: [],
}
`
        createTestFiles(tempDir, { "config.ts": configContent })

        await main(["--config", join(tempDir, "config.ts"), "--force"])

        // 上書きされていることを確認
        expect(readFileSync(join(sourceDir, "existing.txt"), "utf-8")).toBe(
          "new content"
        )
      })

      test("新規ファイルを正しく判定する", async () => {
        const sourceDir = join(tempDir, "source")
        const targetDir = join(tempDir, "target")

        // sourceDir に新規ファイルがない状態
        createTestFiles(tempDir, {
          "source/.gitkeep": "",
          "target/new-file.txt": "new content",
        })

        const configContent = `
export const config = {
  source: "${sourceDir}",
  target: "${targetDir}",
  includes: ["new-file.txt"],
  excludes: [],
}
`
        createTestFiles(tempDir, { "config.ts": configContent })

        await main(["--config", join(tempDir, "config.ts"), "--force"])

        // 新規ファイルが作成されていることを確認
        expect(existsSync(join(sourceDir, "new-file.txt"))).toBe(true)
        expect(readFileSync(join(sourceDir, "new-file.txt"), "utf-8")).toBe(
          "new content"
        )
      })
    })

    // =====================
    // ファイルリストア
    // =====================
    describe("ファイルリストア", () => {
      test("files/ のファイルを source にコピーする", async () => {
        const sourceDir = join(tempDir, "source")
        const targetDir = join(tempDir, "target")

        createTestFiles(tempDir, {
          "source/.gitkeep": "",
          "target/src/index.ts": "export {}",
          "target/src/lib/util.ts": "export const util = {}",
        })

        const configContent = `
export const config = {
  source: "${sourceDir}",
  target: "${targetDir}",
  includes: ["src/"],
  excludes: [],
}
`
        createTestFiles(tempDir, { "config.ts": configContent })

        await main(["--config", join(tempDir, "config.ts"), "--force"])

        expect(existsSync(join(sourceDir, "src/index.ts"))).toBe(true)
        expect(existsSync(join(sourceDir, "src/lib/util.ts"))).toBe(true)
        expect(readFileSync(join(sourceDir, "src/index.ts"), "utf-8")).toBe(
          "export {}"
        )
      })

      test("dot__ 形式を . 形式に変換してリストアする", async () => {
        const sourceDir = join(tempDir, "source")
        const targetDir = join(tempDir, "target")

        createTestFiles(tempDir, {
          "source/.gitkeep": "",
          "target/dot__gitignore": "node_modules",
          "target/dot__env": "SECRET=xxx",
        })

        const configContent = `
export const config = {
  source: "${sourceDir}",
  target: "${targetDir}",
  includes: [".gitignore", ".env"],
  excludes: [],
}
`
        createTestFiles(tempDir, { "config.ts": configContent })

        await main(["--config", join(tempDir, "config.ts"), "--force"])

        expect(existsSync(join(sourceDir, ".gitignore"))).toBe(true)
        expect(existsSync(join(sourceDir, ".env"))).toBe(true)
        expect(readFileSync(join(sourceDir, ".gitignore"), "utf-8")).toBe(
          "node_modules"
        )
      })

      test("リストア先ディレクトリが存在しない場合は作成する", async () => {
        const sourceDir = join(tempDir, "source")
        const targetDir = join(tempDir, "target")

        createTestFiles(tempDir, {
          "source/.gitkeep": "",
          "target/deep/nested/file.txt": "content",
        })

        const configContent = `
export const config = {
  source: "${sourceDir}",
  target: "${targetDir}",
  includes: ["deep/"],
  excludes: [],
}
`
        createTestFiles(tempDir, { "config.ts": configContent })

        await main(["--config", join(tempDir, "config.ts"), "--force"])

        expect(existsSync(join(sourceDir, "deep/nested/file.txt"))).toBe(true)
      })
    })

    // =====================
    // バックアップ作成
    // =====================
    describe("バックアップ作成 (config.restore.preserveOriginal = true)", () => {
      test("上書き時に既存ファイルの .bak を作成する", async () => {
        const sourceDir = join(tempDir, "source")
        const targetDir = join(tempDir, "target")

        createTestFiles(tempDir, {
          "source/file.txt": "original content",
          "target/file.txt": "new content",
        })

        const configContent = `
export const config = {
  source: "${sourceDir}",
  target: "${targetDir}",
  includes: ["file.txt"],
  excludes: [],
  restore: {
    preserveOriginal: true,
  },
}
`
        createTestFiles(tempDir, { "config.ts": configContent })

        await main(["--config", join(tempDir, "config.ts"), "--force"])

        // .bak ファイルが作成されていることを確認
        expect(existsSync(join(sourceDir, "file.txt.bak"))).toBe(true)
        expect(readFileSync(join(sourceDir, "file.txt.bak"), "utf-8")).toBe(
          "original content"
        )
        // 新しい内容に上書きされていることを確認
        expect(readFileSync(join(sourceDir, "file.txt"), "utf-8")).toBe(
          "new content"
        )
      })

      test("新規ファイルの場合は .bak を作成しない", async () => {
        const sourceDir = join(tempDir, "source")
        const targetDir = join(tempDir, "target")

        createTestFiles(tempDir, {
          "source/.gitkeep": "",
          "target/new-file.txt": "new content",
        })

        const configContent = `
export const config = {
  source: "${sourceDir}",
  target: "${targetDir}",
  includes: ["new-file.txt"],
  excludes: [],
  restore: {
    preserveOriginal: true,
  },
}
`
        createTestFiles(tempDir, { "config.ts": configContent })

        await main(["--config", join(tempDir, "config.ts"), "--force"])

        // 新規ファイルが作成されていることを確認
        expect(existsSync(join(sourceDir, "new-file.txt"))).toBe(true)
        // .bak ファイルは作成されていないことを確認
        expect(existsSync(join(sourceDir, "new-file.txt.bak"))).toBe(false)
      })
    })

    // =====================
    // 確認プロンプト
    // =====================
    describe("確認プロンプト", () => {
      test("force=false かつ dry-run=false の場合、確認プロンプトを表示しようとする", async () => {
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

        // モックの呼び出し回数をリセット
        confirmContinueMock.mockClear()

        // モックがtrueを返すので正常に処理が進む
        await main(["--config", join(tempDir, "config.ts")])

        // confirmContinue が呼ばれたことを確認（確認プロンプト表示を意図）
        expect(confirmContinueMock).toHaveBeenCalled()
      })
    })
  })
})
