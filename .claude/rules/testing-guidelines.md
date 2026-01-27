---
paths:
    - "**/*.ts"
---
# テスト方針ガイドライン

このドキュメントは、新規モジュールにテストを追加する際の汎用的な指針を提供します。

---

## 目次

1. [概要](#概要)
2. [テスト作成の基本原則](#テスト作成の基本原則)
3. [ディレクトリ・ファイル構成](#ディレクトリファイル構成)
4. [テストパターン別ベストプラクティス](#テストパターン別ベストプラクティス)
5. [命名規則とテスト記述スタイル](#命名規則とテスト記述スタイル)
6. [共通ユーティリティ](#共通ユーティリティ)
7. [新規テスト作成チェックリスト](#新規テスト作成チェックリスト)
8. [カバレッジ目標](#カバレッジ目標)

---

## 概要

### このガイドラインの目的

- **新規モジュール**にテストを追加する際の指針を提供する
- テストの**一貫性**と**保守性**を確保する
- よく使われる**テストパターン**を体系化し、参照しやすくする

### テスト環境

- **テストランナー**: Bun Test（ビルトイン）
- **テストコマンド**: `bun test`
- **カバレッジ計測**: `bun test --coverage`

### package.json スクリプト

```json
{
  "scripts": {
    "test": "bun test",
    "test:watch": "bun test --watch",
    "test:coverage": "bun test --coverage"
  }
}
```

---

## テスト作成の基本原則

### Arrange-Act-Assert (AAA) パターン

各テストは以下の3段階で構成します:

```typescript
test("ドットで始まるファイル名を変換する", () => {
  // Arrange: テストデータの準備
  const input = ".gitignore"

  // Act: テスト対象の実行
  const result = convertDotPath(input)

  // Assert: 結果の検証
  expect(result).toBe("dot__gitignore")
})
```

### テストの独立性

- 各テストは**他のテストに依存しない**こと
- テスト間で**状態を共有しない**こと
- `beforeEach` / `afterEach` でセットアップ・クリーンアップを行う

```typescript
describe("FileResolver", () => {
  let tempDir: string

  beforeEach(() => {
    tempDir = createTempDir()  // 毎回新しい一時ディレクトリ
  })

  afterEach(() => {
    cleanupTempDir(tempDir)    // 必ずクリーンアップ
  })

  test("テスト1", () => { /* tempDir を使用 */ })
  test("テスト2", () => { /* 別の tempDir を使用 */ })
})
```

### 一つのテストには一つの検証

- 1つのテストで検証する項目は**1つに絞る**
- 複数の条件を検証したい場合は**テストを分割**する

```typescript
// Good: 1つの検証項目
test("成功時に ✓ を含むメッセージを出力する", () => {
  logResult({ success: true, source: "a.ts", destination: "b.ts" })
  expect(logSpy).toHaveBeenCalledWith(expect.stringContaining("✓"))
})

test("失敗時に ✗ を含むエラーを出力する", () => {
  logResult({ success: false, source: "a.ts", destination: "b.ts", error: "エラー" })
  expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining("✗"))
})

// Bad: 複数の検証を1つのテストに詰め込む
test("成功時と失敗時の出力を検証", () => {
  // 成功時
  logResult({ success: true, ... })
  expect(logSpy).toHaveBeenCalled()

  // 失敗時
  logResult({ success: false, ... })
  expect(errorSpy).toHaveBeenCalled()
})
```

---

## ディレクトリ・ファイル構成

```
src/
├── modules/
│   ├── __tests__/           # テストファイル格納ディレクトリ
│   │   ├── ModuleName.test.ts
│   │   ├── helpers/         # テストヘルパー関数
│   │   │   └── tempDir.ts
│   │   └── fixtures/        # テスト用フィクスチャ
│   │       └── configs.ts
│   └── ModuleName.ts
└── types/
```

### 命名規則

| 対象 | パターン | 例 |
|------|----------|-----|
| テストファイル | `<ModuleName>.test.ts` | `PathConverter.test.ts` |
| ヘルパー | 機能を表す名前 | `tempDir.ts`, `mockReader.ts` |
| フィクスチャ | データ種別を表す名前 | `configs.ts`, `testData.ts` |

---

## テストパターン別ベストプラクティス

### 4.1 純粋関数のユニットテスト

入力に対して常に同じ出力を返す関数のテストです。最もシンプルで書きやすいパターンです。

**特徴:**
- モックやスパイが不要
- 入力と期待値のペアを列挙するだけ
- 境界値や異常値のテストが重要

**コード例:**

```typescript
import { describe, test, expect } from "bun:test"
import { convertDotPath, revertDotPath } from "../PathConverter"

describe("convertDotPath", () => {
  test("ドットで始まるファイル名を dot__ 形式に変換する", () => {
    expect(convertDotPath(".gitignore")).toBe("dot__gitignore")
  })

  test("複数のドットパスを含むパスを変換する", () => {
    expect(convertDotPath(".claude/.env")).toBe("dot__claude/dot__env")
  })

  test("変換不要なパスはそのまま返す", () => {
    expect(convertDotPath("src/index.ts")).toBe("src/index.ts")
  })

  test("空文字列を処理できる", () => {
    expect(convertDotPath("")).toBe("")
  })

  // 往復変換の検証
  test("convertDotPath との往復変換で元に戻る", () => {
    const testPaths = [".gitignore", ".claude/.env", "src/index.ts"]
    for (const path of testPaths) {
      expect(revertDotPath(convertDotPath(path))).toBe(path)
    }
  })
})
```

**参照:** `src/modules/__tests__/PathConverter.test.ts`

---

### 4.2 コンソール出力のスパイテスト

`console.log` や `console.error` を使用する関数のテストです。

**特徴:**
- `spyOn` でコンソールメソッドをスパイ
- `mockImplementation(() => {})` で実際の出力を抑制
- `afterEach` で必ず `mockRestore()` を呼び出す

**コード例:**

```typescript
import { describe, test, expect, beforeEach, afterEach, spyOn, type Mock } from "bun:test"
import { logResult } from "../Logger"

describe("Logger", () => {
  let logSpy: Mock<typeof console.log>
  let errorSpy: Mock<typeof console.error>

  beforeEach(() => {
    logSpy = spyOn(console, "log").mockImplementation(() => {})
    errorSpy = spyOn(console, "error").mockImplementation(() => {})
  })

  afterEach(() => {
    logSpy.mockRestore()
    errorSpy.mockRestore()
  })

  describe("logResult", () => {
    test("成功時に ✓ を含むメッセージを console.log で出力", () => {
      const result = {
        success: true,
        source: "src/index.ts",
        destination: "files/src/index.ts",
      }

      logResult(result)

      expect(logSpy).toHaveBeenCalledTimes(1)
      expect(logSpy).toHaveBeenCalledWith("✓ src/index.ts → files/src/index.ts")
      expect(errorSpy).not.toHaveBeenCalled()
    })

    test("失敗時に ✗ を含むエラーを console.error で出力", () => {
      const result = {
        success: false,
        source: "src/missing.ts",
        destination: "files/src/missing.ts",
        error: "ファイルが見つかりません",
      }

      logResult(result)

      expect(errorSpy).toHaveBeenCalledWith(
        "✗ src/missing.ts - ファイルが見つかりません"
      )
      expect(logSpy).not.toHaveBeenCalled()
    })
  })
})
```

**参照:** `src/modules/__tests__/Logger.test.ts`

---

### 4.3 ファイルシステム操作のテスト

実際のファイルを読み書きする関数のテストです。一時ディレクトリを使用してテストを隔離します。

**特徴:**
- `createTempDir()` で一時ディレクトリを作成
- `createTestFiles()` でテスト用ファイル構造を作成
- `afterEach` で `cleanupTempDir()` を必ず実行

**コード例:**

```typescript
import { describe, test, expect, beforeEach, afterEach } from "bun:test"
import { resolveGlobPattern, getFilesRecursively } from "../FileResolver"
import { createTempDir, cleanupTempDir, createTestFiles } from "./helpers/tempDir"

describe("FileResolver インテグレーションテスト", () => {
  let tempDir: string

  beforeEach(() => {
    tempDir = createTempDir()
  })

  afterEach(() => {
    cleanupTempDir(tempDir)
  })

  describe("resolveGlobPattern", () => {
    test("glob パターンでファイルを取得できる", () => {
      createTestFiles(tempDir, {
        "src/index.ts": "export {}",
        "src/utils.ts": "export {}",
        "src/helper.js": "module.exports = {}",
      })

      const result = resolveGlobPattern("src/*.ts", tempDir)

      expect(result.sort()).toEqual(["src/index.ts", "src/utils.ts"])
    })

    test("ドットファイルも取得できる", () => {
      createTestFiles(tempDir, {
        ".gitignore": "node_modules",
        ".env": "SECRET=xxx",
        "config.ts": "export {}",
      })

      const result = resolveGlobPattern("*", tempDir)

      expect(result.sort()).toEqual([".env", ".gitignore", "config.ts"])
    })
  })

  describe("getFilesRecursively", () => {
    test("存在しないディレクトリの場合は空配列を返す", () => {
      const result = getFilesRecursively(`${tempDir}/nonexistent`, tempDir)
      expect(result).toEqual([])
    })
  })
})
```

**参照:** `src/modules/__tests__/FileResolver.test.ts`

---

### 4.4 依存性注入（DI）パターン

外部依存（stdin、外部API等）を持つ関数をテスト可能にするパターンです。

**特徴:**
- インターフェースを定義し、デフォルト実装とモック実装を用意
- テスト時はモック実装を注入
- 本番コードはデフォルト引数でそのまま動作

**インターフェース定義:**

```typescript
// InputReader インターフェース
export interface InputReader {
  read(): Promise<string>
}

// 本番用実装
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

// テスト用モック生成関数
export function createMockReader(input: string): InputReader {
  return {
    async read(): Promise<string> {
      return input
    }
  }
}

// DI を使用した関数シグネチャ
export async function confirmContinue(
  message = "続行しますか？ (Y/n): ",
  reader: InputReader = stdinReader  // デフォルト引数で本番実装を使用
): Promise<boolean>
```

**テストコード:**

```typescript
import { describe, test, expect } from "bun:test"
import { confirmContinue, createMockReader } from "../UserPrompt"

describe("confirmContinue", () => {
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

  test('"n" 入力で false を返す', async () => {
    const mockReader = createMockReader("n")
    const result = await confirmContinue(undefined, mockReader)
    expect(result).toBe(false)
  })

  test("その他の入力で false を返す", async () => {
    const mockReader = createMockReader("invalid")
    const result = await confirmContinue(undefined, mockReader)
    expect(result).toBe(false)
  })
})
```

**参照:** `src/modules/__tests__/UserPrompt.test.ts`

---

### 4.5 非同期処理・エラーケースのテスト

Promise を返す関数や、エラーをスローする関数のテストです。

**非同期関数のテスト:**

```typescript
test("非同期関数が正しい値を返す", async () => {
  const result = await asyncFunction()
  expect(result).toBe(expectedValue)
})
```

**エラーのテスト:**

```typescript
test("無効な入力でエラーをスローする", () => {
  expect(() => validateInput(invalidData)).toThrow("エラーメッセージ")
})

// 非同期エラーの場合
test("存在しないファイルでエラーをスローする", async () => {
  await expect(loadConfig("/nonexistent")).rejects.toThrow()
})
```

**特定のエラーメッセージを検証:**

```typescript
test("config がエクスポートされていない場合のエラー", async () => {
  await expect(loadConfig("./invalid-config.ts")).rejects.toThrow(
    /config.*エクスポート/
  )
})
```

---

## 命名規則とテスト記述スタイル

### describe ブロック

- モジュール名または関数名を使用
- ネストして論理的にグループ化

```typescript
describe("FileResolver", () => {
  describe("ユニットテスト", () => {
    describe("isGlobPattern", () => {
      // ...
    })
  })

  describe("インテグレーションテスト", () => {
    describe("resolveGlobPattern", () => {
      // ...
    })
  })
})
```

### test ケース

- **日本語**で動作を説明
- 「〜する」「〜を返す」「〜の場合」の形式

```typescript
describe("convertDotPath", () => {
  test("ドットで始まるファイル名を dot__ 形式に変換する", () => {})
  test("複数のドットディレクトリを含むパスを変換する", () => {})
  test("変換不要なパスはそのまま返す", () => {})
  test("空文字列を処理できる", () => {})
})
```

### 条件分岐のテスト命名

```typescript
test("成功時に ✓ を含むメッセージを出力する", () => {})
test("失敗時に ✗ を含むエラーを出力する", () => {})
test("オプション指定時に追加情報を表示する", () => {})
test("存在しないファイルの場合は空配列を返す", () => {})
```

---

## 共通ユーティリティ

### 一時ディレクトリ管理

`src/modules/__tests__/helpers/tempDir.ts`:

```typescript
import { mkdtempSync, rmSync, mkdirSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join, dirname } from "node:path"

/**
 * 一時ディレクトリを作成する
 */
export function createTempDir(prefix = "backupper-test-"): string {
  return mkdtempSync(join(tmpdir(), prefix))
}

/**
 * 一時ディレクトリを削除する
 */
export function cleanupTempDir(dir: string): void {
  rmSync(dir, { recursive: true, force: true })
}

/**
 * テスト用ファイル構造を作成する
 * @param baseDir ベースディレクトリ
 * @param files ファイルパスと内容のマップ（相対パス → 内容）
 */
export function createTestFiles(
  baseDir: string,
  files: Record<string, string>
): void {
  for (const [filePath, content] of Object.entries(files)) {
    const fullPath = join(baseDir, filePath)
    const dir = dirname(fullPath)
    mkdirSync(dir, { recursive: true })
    writeFileSync(fullPath, content)
  }
}
```

### テストフィクスチャの例

`src/modules/__tests__/fixtures/configs.ts`:

```typescript
import type { Config } from "../../../types/config"

export const validConfig: Config = {
  base: "/tmp/test-base",
  outputDir: "./files",
  includes: ["src/", "*.json"],
  excludes: ["node_modules/", "*.log"]
}

export const invalidConfig: Partial<Config> = {
  base: "/nonexistent/path",
  outputDir: "",
  includes: [],
  excludes: []
}
```

---

## 新規テスト作成チェックリスト

### 事前準備

- [ ] テスト対象モジュールの**入力・出力**を整理する
- [ ] **外部依存**（ファイルシステム、stdin、console等）を特定する
- [ ] 適用する**テストパターン**を選択する（本ガイドの4.1〜4.5）

### テストファイル作成

- [ ] `src/modules/__tests__/<ModuleName>.test.ts` を作成する
- [ ] 必要なimport文を追加する:
  - `bun:test` から `describe, test, expect` 等
  - テスト対象モジュール
  - 必要に応じてヘルパー関数

### テストケース作成

- [ ] **正常系**のテストを作成する
- [ ] **異常系・エラーケース**のテストを作成する
- [ ] **境界値**のテストを作成する（空文字、0、null等）
- [ ] AAA パターン（Arrange-Act-Assert）に沿って記述する

### クリーンアップ

- [ ] スパイを使用した場合、`afterEach` で `mockRestore()` を呼ぶ
- [ ] 一時ディレクトリを使用した場合、`afterEach` で `cleanupTempDir()` を呼ぶ

### 確認

- [ ] `bun test <テストファイル>` で単体実行が成功する
- [ ] `bun test` で全テストが成功する
- [ ] テスト名が**日本語で何をテストしているか明確**である

---

## カバレッジ目標

| 指標 | 目標 |
|------|------|
| Line Coverage | 90% 以上 |
| Branch Coverage | 85% 以上 |
| Function Coverage | 100% |

### モジュール種別ごとの目標

| 種別 | 目標 | 理由 |
|------|------|------|
| 純粋関数 | 100% | 全ケースをテスト可能 |
| コアロジック | 90%以上 | 重要な分岐を網羅 |
| UI/IO関連 | 85%以上 | 一部モック困難なケースを許容 |

---

## 付録: 既存テストの参照先

各パターンの実装例として、以下のファイルを参照してください:

| パターン | 参照ファイル | 説明 |
|----------|-------------|------|
| 純粋関数 | `PathConverter.test.ts` | 入力→出力のシンプルなテスト |
| スパイテスト | `Logger.test.ts` | console.log/error のスパイ |
| ファイルシステム | `FileResolver.test.ts` | 一時ディレクトリの使用 |
| DI パターン | `UserPrompt.test.ts` | InputReader の注入 |
| CLI引数解析 | `ParseCliArguments.test.ts` | 引数パターンの網羅 |
| 設定ファイル | `ConfigLoader.test.ts` | 動的importのテスト |

### ヘルパー関数

| ファイル | 提供する機能 |
|----------|-------------|
| `helpers/tempDir.ts` | 一時ディレクトリ作成・削除、テストファイル作成 |

---

## 参考リンク

- [Bun Test Documentation](https://bun.sh/docs/cli/test)
- [Bun Mock Documentation](https://bun.sh/docs/test/mocks)
