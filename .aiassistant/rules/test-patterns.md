---
apply: 常に使用する
---

# テストパターンガイド

## テストフレームワーク

Bun の組み込みテストフレームワーク（`bun:test`）を使用する。

```typescript
import { describe, test, expect, beforeEach, afterEach, spyOn, mock, type Mock } from 'bun:test';
```

## ファイル配置

テストファイルは対象モジュールと同階層の `__tests__/` ディレクトリに配置する。

```
src/
├── modules/
│   ├── __tests__/
│   │   ├── helpers/          # テストヘルパー
│   │   │   └── tempDir.ts
│   │   ├── ModuleName.test.ts
│   │   └── ...
│   └── ModuleName.ts
├── cli/
│   ├── __tests__/
│   │   └── index.test.ts
│   └── index.ts
└── commands/
    └── backup/
        ├── __tests__/
        │   └── index.test.ts
        └── index.ts
```

## テスト構造

### describe によるグループ化

モジュール名 → 関数名の階層でグループ化する。セクション区切りには `// =====================` コメントを使用する。

```typescript
describe('ModuleName', () => {
  // =====================
  // functionA
  // =====================
  describe('functionA', () => {
    test('正常系のテスト', () => {
      // ...
    });

    test('異常系のテスト', () => {
      // ...
    });
  });

  // =====================
  // functionB
  // =====================
  describe('functionB', () => {
    // ...
  });
});
```

### テスト名の規則

日本語で「〜する」「〜を返す」「〜をスローする」形式で記述し、条件と期待される結果を明確にする。

```typescript
// 良い例
test('引数なしでデフォルト値 configPath: "config.ts" を返す', () => {});
test('--help オプションでヘルプを表示し null を返す', () => {});
test('存在しないファイルの場合エラーをスローする', () => {});
test('ドットで始まるファイル名を dot__ 形式に変換する', () => {});

// 避けるべき例
test('test parseBackupArgs', () => {});  // 英語、具体性がない
test('works correctly', () => {});        // 何をテストしているか不明
```

## セットアップとクリーンアップ

### beforeEach / afterEach パターン

各テストの前後で状態を初期化・復元する。

```typescript
describe('ModuleName', () => {
  let tempDir: string;
  let consoleSpy: Mock<typeof console.log>;

  beforeEach(() => {
    tempDir = createTempDir('test-prefix-');
    consoleSpy = spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    cleanupTempDir(tempDir);
    consoleSpy.mockRestore();
  });
});
```

## モック/スパイ

### console 出力のモック

```typescript
let logSpy: Mock<typeof console.log>;
let errorSpy: Mock<typeof console.error>;

beforeEach(() => {
  logSpy = spyOn(console, 'log').mockImplementation(() => {});
  errorSpy = spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  logSpy.mockRestore();
  errorSpy.mockRestore();
});
```

### process.exit のモック

`process.exit` をモックして例外をスローさせ、終了コードを検証する。

```typescript
let exitSpy: Mock<typeof process.exit>;

beforeEach(() => {
  exitSpy = spyOn(process, 'exit').mockImplementation(() => {
    throw new Error('process.exit called');
  });
});

afterEach(() => {
  exitSpy.mockRestore();
});

// テスト
test('エラー時に process.exit(1) を呼ぶ', async () => {
  await expect(main(['--invalid'])).rejects.toThrow('process.exit called');
  expect(exitSpy).toHaveBeenCalledWith(1);
});
```

### 依存性注入によるモック

テスト対象の関数に依存性を注入可能な設計にする。

```typescript
// 実装側
export interface MainDependencies {
  confirmContinue: () => Promise<boolean>;
}

export async function main(args: string[], deps?: MainDependencies) {
  const confirm = deps?.confirmContinue ?? confirmContinue;
  // ...
}

// テスト側
const confirmMock = mock(() => Promise.resolve(true));
const deps: MainDependencies = { confirmContinue: confirmMock };

test('確認プロンプトで続行を選択した場合', async () => {
  await main(['--config', configPath], deps);
  expect(confirmMock).toHaveBeenCalled();
});
```

## 一時ディレクトリ管理

### ヘルパー関数の使用

`src/modules/__tests__/helpers/tempDir.ts` のヘルパーを使用する。

```typescript
import {
  createTempDir,
  cleanupTempDir,
  createTestFiles,
} from './helpers/tempDir.ts';

let tempDir: string;

beforeEach(() => {
  tempDir = createTempDir('my-test-');
});

afterEach(() => {
  cleanupTempDir(tempDir);
});

test('ファイル操作のテスト', () => {
  createTestFiles(tempDir, {
    'src/index.ts': 'export {}',
    'src/lib/util.ts': 'export const util = {}',
    '.gitignore': 'node_modules',
  });

  // テスト実行
});
```

## アサーション

### 基本的なアサーション

```typescript
expect(result).toBe(true);                    // 厳密等価
expect(result).toEqual({ key: 'value' });     // 深い等価
expect(result).toBeNull();                    // null チェック
expect(array.sort()).toEqual(['a', 'b']);     // 配列の等価（ソート後比較）
```

### 関数呼び出しの検証

```typescript
// 呼び出されたことを確認
expect(spy).toHaveBeenCalled();

// 特定の引数で呼び出されたことを確認
expect(spy).toHaveBeenCalledWith('expected argument');

// 呼び出し回数を確認
expect(spy).toHaveBeenCalledTimes(3);

// n回目の呼び出し引数を確認
expect(spy).toHaveBeenNthCalledWith(1, 'first call arg');
expect(spy).toHaveBeenNthCalledWith(2, 'second call arg');

// 部分一致
expect(spy).toHaveBeenCalledWith(expect.stringContaining('partial'));
```

### 例外のテスト

```typescript
// 同期関数
expect(() => validateConfig(invalidConfig)).toThrow('エラーメッセージ');
expect(() => validateConfig(invalidConfig)).toThrow(/正規表現パターン/);

// 非同期関数
await expect(loadConfig('nonexistent.ts')).rejects.toThrow('エラーメッセージ');
```

### mock.calls による詳細検証

呼び出し順序や複数回の呼び出しを詳細に検証する場合。

```typescript
const calls = spy.mock.calls;
expect(calls[0]?.[0]).toBe('first call first arg');
expect(calls[1]?.[0]).toBe('second call first arg');
```

## テストの分類

### ユニットテストとインテグレーションテスト

大きなテストファイルでは、ユニットテストとインテグレーションテストを分けて記述する。

```typescript
describe('FileResolver', () => {
  // =====================
  // ユニットテスト
  // =====================
  describe('ユニットテスト', () => {
    describe('isGlobPattern', () => {
      // ファイルシステムに依存しないテスト
    });
  });

  // =====================
  // インテグレーションテスト
  // =====================
  describe('インテグレーションテスト', () => {
    let tempDir: string;

    beforeEach(() => {
      tempDir = createTempDir();
    });

    afterEach(() => {
      cleanupTempDir(tempDir);
    });

    describe('resolveTargetFiles', () => {
      // 実際のファイルシステムを使用するテスト
    });
  });
});
```

## エッジケースのテスト

以下のエッジケースを網羅的にテストする。

- 空配列・空文字列
- null / undefined（該当する場合）
- 存在しないファイル/ディレクトリ
- 境界値
- 往復変換（encode → decode で元に戻ることを確認）

```typescript
test('空文字列を処理できる', () => {
  expect(convertDotPath('')).toBe('');
});

test('空配列の場合は何もしない', async () => {
  await runPostActions([], '/tmp');
  expect(logSpy).not.toHaveBeenCalled();
});

test('convertDotPath との往復変換で元に戻る', () => {
  const testPaths = ['.gitignore', '.claude/.env', 'src/index.ts'];
  for (const path of testPaths) {
    expect(revertDotPath(convertDotPath(path))).toBe(path);
  }
});
```

## 設定ファイルを使用するテスト

動的に設定ファイルを生成してテストする。

```typescript
test('設定ファイルでバックアップを実行する', async () => {
  const sourceDir = join(tempDir, 'source');
  const targetDir = join(tempDir, 'target');

  createTestFiles(tempDir, {
    'source/file.txt': 'content',
  });

  const configContent = `
export const config = {
  source: "${sourceDir}",
  destination: "${targetDir}",
  includes: ["file.txt"],
  excludes: [],
}
`;
  createTestFiles(tempDir, { 'config.ts': configContent });

  await main(['--config', join(tempDir, 'config.ts')]);

  expect(existsSync(join(targetDir, 'file.txt'))).toBe(true);
});
```
