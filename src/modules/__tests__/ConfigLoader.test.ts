import { describe, test, expect, beforeEach, afterEach } from "bun:test"
import {
  loadConfig,
  validateConfig,
  validateConfigForRestore,
  DEFAULT_CONFIG_PATH,
} from "../ConfigLoader"
import type { Config } from "../../types/config"
import {
  createTempDir,
  cleanupTempDir,
  createTestFiles,
} from "./helpers/tempDir"
import { join } from "node:path"

describe("ConfigLoader", () => {
  // =====================
  // 定数のテスト
  // =====================
  describe("定数", () => {
    test("DEFAULT_CONFIG_PATH が正しく定義されている", () => {
      expect(DEFAULT_CONFIG_PATH).toBe("config.ts")
    })
  })

  // =====================
  // loadConfig
  // =====================
  describe("loadConfig", () => {
    let tempDir: string

    beforeEach(() => {
      tempDir = createTempDir("config-loader-test-")
    })

    afterEach(() => {
      cleanupTempDir(tempDir)
    })

    test("存在しないファイルの場合エラーをスローする", async () => {
      const nonexistentPath = join(tempDir, "nonexistent.ts")

      await expect(loadConfig(nonexistentPath)).rejects.toThrow(
        `設定ファイルが見つかりません: ${nonexistentPath}`
      )
    })

    test("存在するファイルから config を読み込む", async () => {
      const configContent = `
export const config = {
  base: "/test/base",
  outputDir: "./files",
  includes: ["src/"],
  excludes: ["node_modules/"],
}
`
      createTestFiles(tempDir, {
        "valid-config.ts": configContent,
      })

      const result = await loadConfig(join(tempDir, "valid-config.ts"))
      expect(result).toEqual({
        source: "/test/base",
        target: "./files",
        includes: ["src/"],
        excludes: ["node_modules/"],
      })
    })

    test("config がエクスポートされていない場合エラーをスローする", async () => {
      const configContent = `
export const settings = {
  base: "/test/base",
  outputDir: "./files",
  includes: ["src/"],
  excludes: [],
}
`
      createTestFiles(tempDir, {
        "no-config-export.ts": configContent,
      })

      const configPath = join(tempDir, "no-config-export.ts")
      await expect(loadConfig(configPath)).rejects.toThrow(
        `設定ファイルに config がエクスポートされていません: ${configPath}`
      )
    })

    test("相対パスを絶対パスに解決して読み込む", async () => {
      const configContent = `
export const config = {
  base: "/resolved/path",
  outputDir: "./out",
  includes: [],
  excludes: [],
}
`
      createTestFiles(tempDir, {
        "relative-config.ts": configContent,
      })

      // 相対パスでも読み込めることを確認
      const absolutePath = join(tempDir, "relative-config.ts")
      const result = await loadConfig(absolutePath)
      expect(result.source).toBe("/resolved/path")
    })
  })

  // =====================
  // validateConfig（backup用）
  // =====================
  describe("validateConfig", () => {
    let tempDir: string

    beforeEach(() => {
      tempDir = createTempDir("validate-config-test-")
    })

    afterEach(() => {
      cleanupTempDir(tempDir)
    })

    test("有効な設定の場合、エラーをスローしない", () => {
      const validConfig: Config = {
        source: tempDir, // 存在するディレクトリ
        target: "./files",
        includes: ["src/"],
        excludes: [],
      }

      expect(() => validateConfig(validConfig)).not.toThrow()
    })

    test("base が存在しない場合、エラーをスローする", () => {
      const invalidConfig: Config = {
        source: "/nonexistent/path/to/base",
        target: "./files",
        includes: ["src/"],
        excludes: [],
      }

      expect(() => validateConfig(invalidConfig)).toThrow(
        "ベースパスが存在しません: /nonexistent/path/to/base"
      )
    })

    test("outputDir が空文字の場合、エラーをスローする", () => {
      const invalidConfig: Config = {
        source: tempDir,
        target: "",
        includes: ["src/"],
        excludes: [],
      }

      expect(() => validateConfig(invalidConfig)).toThrow(
        "outputDir が指定されていません"
      )
    })

    test("outputDir が空白のみの場合、エラーをスローする", () => {
      const invalidConfig: Config = {
        source: tempDir,
        target: "   ",
        includes: ["src/"],
        excludes: [],
      }

      expect(() => validateConfig(invalidConfig)).toThrow(
        "outputDir が指定されていません"
      )
    })
  })

  // =====================
  // validateConfigForRestore
  // =====================
  describe("validateConfigForRestore", () => {
    let tempDir: string

    beforeEach(() => {
      tempDir = createTempDir("validate-restore-test-")
    })

    afterEach(() => {
      cleanupTempDir(tempDir)
    })

    test("有効な設定の場合、エラーをスローしない", () => {
      // base と outputDir の両方が存在する
      createTestFiles(tempDir, {
        "base/.gitkeep": "",
        "files/.gitkeep": "",
      })

      const validConfig: Config = {
        source: join(tempDir, "base"),
        target: join(tempDir, "files"),
        includes: ["src/"],
        excludes: [],
      }

      expect(() => validateConfigForRestore(validConfig)).not.toThrow()
    })

    test("base が存在しない場合、エラーをスローする", () => {
      createTestFiles(tempDir, {
        "files/.gitkeep": "",
      })

      const invalidConfig: Config = {
        source: "/nonexistent/base/path",
        target: join(tempDir, "files"),
        includes: ["src/"],
        excludes: [],
      }

      expect(() => validateConfigForRestore(invalidConfig)).toThrow(
        "ベースパスが存在しません: /nonexistent/base/path"
      )
    })

    test("outputDir が空文字の場合、エラーをスローする", () => {
      createTestFiles(tempDir, {
        "base/.gitkeep": "",
      })

      const invalidConfig: Config = {
        source: join(tempDir, "base"),
        target: "",
        includes: ["src/"],
        excludes: [],
      }

      expect(() => validateConfigForRestore(invalidConfig)).toThrow(
        "outputDir が指定されていません"
      )
    })

    test("outputDir が存在しない場合、エラーをスローする", () => {
      createTestFiles(tempDir, {
        "base/.gitkeep": "",
      })

      const invalidConfig: Config = {
        source: join(tempDir, "base"),
        target: join(tempDir, "nonexistent-output"),
        includes: ["src/"],
        excludes: [],
      }

      expect(() => validateConfigForRestore(invalidConfig)).toThrow(
        `出力ディレクトリが存在しません: ${join(tempDir, "nonexistent-output")}`
      )
    })

    test("outputDir が空白のみの場合、エラーをスローする", () => {
      createTestFiles(tempDir, {
        "base/.gitkeep": "",
      })

      const invalidConfig: Config = {
        source: join(tempDir, "base"),
        target: "   ",
        includes: ["src/"],
        excludes: [],
      }

      expect(() => validateConfigForRestore(invalidConfig)).toThrow(
        "outputDir が指定されていません"
      )
    })
  })
})
