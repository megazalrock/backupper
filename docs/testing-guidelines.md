# テスト方針ガイドライン

このドキュメントでは、`src/modules` 内のモジュールに対するテスト方針を定義します。

## 目次

1. [テスト環境](#テスト環境)
2. [ディレクトリ構成](#ディレクトリ構成)
3. [カバレッジ目標](#カバレッジ目標)
4. [テスト方針](#テスト方針)
5. [モジュール別テスト項目](#モジュール別テスト項目)
6. [テストユーティリティ](#テストユーティリティ)
7. [命名規則](#命名規則)

---

## テスト環境

- **テストランナー**: Bun Test（ビルトイン）
- **テストコマンド**: `bun test`
- **カバレッジ計測**: `bun test --coverage`

### package.json への追加スクリプト

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

## ディレクトリ構成

```
src/
├── modules/
│   ├── __tests__/           # テストファイル格納ディレクトリ
│   │   ├── PathConverter.test.ts
│   │   ├── FileResolver.test.ts
│   │   ├── Logger.test.ts
│   │   ├── UserPrompt.test.ts
│   │   ├── ParseCliArguments.test.ts
│   │   ├── ConfigLoader.test.ts
│   │   └── fixtures/        # テスト用フィクスチャ
│   │       └── ...
│   ├── PathConverter.ts
│   ├── FileResolver.ts
│   ├── Logger.ts
│   ├── UserPrompt.ts
│   ├── ParseCliArguments.ts
│   └── ConfigLoader.ts
└── types/
```

---

## カバレッジ目標

| 指標 | 目標 |
|------|------|
| Line Coverage | 90% 以上 |
| Branch Coverage | 85% 以上 |
| Function Coverage | 100% |

重要度の高いモジュールは特に高いカバレッジを目指す：
- `PathConverter.ts`: 100%（純粋関数のため）
- `FileResolver.ts`: 90%以上（コアロジック）
- `ConfigLoader.ts`: 90%以上（設定読み込みの信頼性）

---

## テスト方針

### ユニットテストとインテグレーションテストの使い分け

| テスト種別 | 対象 | ファイルシステム | 方針 |
|------------|------|------------------|------|
| ユニットテスト | 純粋関数、ロジック検証 | モック使用 | 高速実行を重視 |
| インテグレーションテスト | ファイル操作を含む処理 | 一時ディレクトリ使用 | 実際の動作を検証 |

### ファイルシステム操作のテスト

1. **モック使用（ユニットテスト）**
   - `bun:test` の `mock` 機能で `node:fs` をモック
   - 高速な実行と境界条件のテストに適する

2. **一時ディレクトリ使用（インテグレーションテスト）**
   - `fs.mkdtempSync` で一時ディレクトリを作成
   - テスト後に必ずクリーンアップ
   - 実際のファイルシステム動作を検証

### UserPrompt モジュールの対応

**現状の課題**: `Bun.stdin.stream()` に直接依存しているためテストが困難

**対応方針**: 依存性注入（DI）パターンを導入

```typescript
// 改修後のインターフェース
export interface InputReader {
  read(): Promise<string>
}

// デフォルト実装（本番用）
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

// テスト用モック
export function createMockReader(input: string): InputReader {
  return {
    async read(): Promise<string> {
      return input
    }
  }
}

// 関数シグネチャの変更
export async function confirmContinue(
  message = "続行しますか？ (Y/n): ",
  reader: InputReader = stdinReader
): Promise<boolean>
```

### コンソール出力のテスト

`Logger.ts` のテストでは `console.log` / `console.error` をスパイ:

```typescript
import { describe, test, expect, spyOn } from "bun:test"

describe("logResult", () => {
  test("成功時は console.log を呼び出す", () => {
    const logSpy = spyOn(console, "log").mockImplementation(() => {})

    logResult({ success: true, source: "a.ts", destination: "b.ts" })

    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining("✓"))
    logSpy.mockRestore()
  })
})
```

---

## モジュール別テスト項目

### 1. PathConverter.ts

**テスト種別**: ユニットテストのみ（純粋関数）

| 関数 | テスト項目 |
|------|-----------|
| `convertDotPath` | ドットで始まるファイル名の変換 |
| | ドットで始まるディレクトリ名の変換 |
| | 複数の `.` を含むパスの変換 |
| | 変換不要なパスはそのまま返す |
| | 空文字列の処理 |
| | 単一の `.` は変換しない |
| `revertDotPath` | `dot__` プレフィックスを `.` に戻す |
| | ネストしたパスの復元 |
| | `dot__` を含まないパスはそのまま返す |
| | `convertDotPath` との往復変換 |

### 2. FileResolver.ts

**テスト種別**: ユニットテスト + インテグレーションテスト

| 関数 | テスト項目 | テスト種別 |
|------|-----------|-----------|
| `isGlobPattern` | `*` を含むパターンの判定 | ユニット |
| | `?` を含むパターンの判定 | ユニット |
| | `[]` を含むパターンの判定 | ユニット |
| | `{}` を含むパターンの判定 | ユニット |
| | 通常のパスは false を返す | ユニット |
| `shouldExclude` | 単純なパターンマッチ | ユニット |
| | glob パターンでのマッチ | ユニット |
| | ディレクトリ名でのマッチ | ユニット |
| | 複数パターンのいずれかにマッチ | ユニット |
| | どのパターンにもマッチしない | ユニット |
| `resolveGlobPattern` | glob でファイル取得 | インテグレーション |
| | ドットファイルも取得される | インテグレーション |
| `getFilesRecursively` | ディレクトリの再帰走査 | インテグレーション |
| | 存在しないディレクトリは空配列 | インテグレーション |
| | ネストしたディレクトリ | インテグレーション |
| `resolveTargetFiles` | ディレクトリ指定（末尾 `/`） | インテグレーション |
| | glob パターン指定 | インテグレーション |
| | 単一ファイル指定 | インテグレーション |
| | 存在しないファイルは無視 | インテグレーション |
| `resolveRestoreFiles` | includes パターンにマッチするファイル取得 | インテグレーション |
| | excludes パターンの適用 | インテグレーション |
| | dot__ 形式パスの処理 | インテグレーション |

### 3. Logger.ts

**テスト種別**: ユニットテストのみ（コンソール出力のスパイ）

| 関数 | テスト項目 |
|------|-----------|
| `logResult` | 成功時に `✓` を含むメッセージを出力 |
| | 失敗時に `✗` を含むエラーメッセージを出力 |
| | バックアップパスの表示 |
| `logSummary` | 成功件数と失敗件数の表示 |
| | 区切り線の表示 |
| | 操作タイプ（コピー/リストア）の表示 |
| `logRestoreFileList` | 上書きファイルの表示 |
| | 新規ファイルの表示 |
| `logDryRunFileList` | DRY-RUN ヘッダーの表示 |
| | ファイル一覧の表示 |

### 4. UserPrompt.ts

**テスト種別**: ユニットテスト（DI改修後）

| 関数 | テスト項目 |
|------|-----------|
| `confirmContinue` | 空入力で true を返す |
| | "y" 入力で true を返す |
| | "yes" 入力で true を返す |
| | "Y" 入力で true を返す（大文字） |
| | "n" 入力で false を返す |
| | "no" 入力で false を返す |
| | その他の入力で false を返す |
| | カスタムメッセージの表示 |

### 5. ParseCliArguments.ts

**テスト種別**: ユニットテストのみ

| 関数 | テスト項目 |
|------|-----------|
| `parseBackupArgs` | デフォルト値の設定 |
| | `--config` オプションの解析 |
| | `-c` 短縮オプションの解析 |
| | `--help` で null を返す |
| | `-h` で null を返す |
| | `--config` に値がない場合のエラー |
| `parseRestoreArgs` | デフォルト値の設定 |
| | `--dry-run` フラグの解析 |
| | `--backup` フラグの解析 |
| | `--force` / `-f` フラグの解析 |
| | 複数オプションの組み合わせ |

### 6. ConfigLoader.ts

**テスト種別**: ユニットテスト + インテグレーションテスト

| 関数 | テスト項目 | テスト種別 |
|------|-----------|-----------|
| `loadConfig` | 存在するファイルの読み込み | インテグレーション |
| | 存在しないファイルでエラー | ユニット |
| | config がエクスポートされていない場合のエラー | インテグレーション |
| `validateConfig` | 有効な設定で正常終了 | ユニット |
| | base が存在しない場合のエラー | インテグレーション |
| | outputDir が空の場合のエラー | ユニット |
| `validateConfigForRestore` | 有効な設定で正常終了 | ユニット |
| | outputDir が存在しない場合のエラー | インテグレーション |

---

## テストユーティリティ

### 共通ヘルパー関数

`src/modules/__tests__/helpers/` ディレクトリに配置:

```typescript
// helpers/tempDir.ts
import { mkdtempSync, rmSync, mkdirSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

/**
 * テスト用一時ディレクトリを作成
 */
export function createTempDir(): string {
  return mkdtempSync(join(tmpdir(), "backupper-test-"))
}

/**
 * 一時ディレクトリを削除
 */
export function cleanupTempDir(dir: string): void {
  rmSync(dir, { recursive: true, force: true })
}

/**
 * テスト用のファイル構造を作成
 */
export function createTestFiles(
  baseDir: string,
  files: Record<string, string>
): void {
  for (const [path, content] of Object.entries(files)) {
    const fullPath = join(baseDir, path)
    const dir = fullPath.substring(0, fullPath.lastIndexOf("/"))
    mkdirSync(dir, { recursive: true })
    writeFileSync(fullPath, content)
  }
}
```

### テストフィクスチャの例

```typescript
// fixtures/configs.ts
import type { Config } from "../../types/config"

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

## 命名規則

### テストファイル

- パターン: `<ModuleName>.test.ts`
- 例: `PathConverter.test.ts`, `FileResolver.test.ts`

### describe ブロック

- モジュール名または関数名を使用
- 例: `describe("PathConverter")`, `describe("convertDotPath")`

### test ケース

- 日本語で動作を説明
- 「〜する」「〜を返す」「〜の場合」の形式

```typescript
describe("convertDotPath", () => {
  test("ドットで始まるファイル名を dot__ 形式に変換する", () => {})
  test("複数のドットディレクトリを含むパスを変換する", () => {})
  test("変換不要なパスはそのまま返す", () => {})
})
```

---

## 実装優先度

テストの実装は以下の順序を推奨:

1. **PathConverter.ts** - 純粋関数で最も簡単、テスト作成の練習に最適
2. **ParseCliArguments.ts** - 入出力が明確で書きやすい
3. **Logger.ts** - スパイの使い方を習得
4. **FileResolver.ts** - コアロジック、一時ディレクトリの使い方を習得
5. **ConfigLoader.ts** - 動的 import のテスト
6. **UserPrompt.ts** - DI 改修が必要なため最後

---

## 参考リンク

- [Bun Test Documentation](https://bun.sh/docs/cli/test)
- [Bun Mock Documentation](https://bun.sh/docs/test/mocks)
