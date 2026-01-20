---
name: test-runner
description: テストを実行するスキルです。テストの実行、カバレッジの計測を求められた場合に**必ず**使用します。
context: fork
---
# Test runner

## 概要

テストの実行やカバレッジの計測をする場合に**必ず**利用するスキルです。

## コマンド

- `bun test` 全テストを実行
- `bun test --coverage` 全テストのカバレッジの計測
- `bun test [<patterns>]` 特定のファイル・ディレクトリのテストを実行

## 使用例

```bash
bun test # 全てのテストを実行
```

```bash
bun test --coverage #全テストのカバレッジの計測
```

```bash
bun test "src/commands/restore/__tests__/index.test.ts" #特定のファイルのみテストを実行
```