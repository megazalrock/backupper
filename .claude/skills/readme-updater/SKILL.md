---
name: readme-updater
description: README.mdを更新します。README.mdの更新が要求された場合、アプリケーションのインターフェースが変更された場合、プロジェクトの構造が変化した場合などに呼び出します。
---
# Test runner

## 概要

README.mdをプロジェクトの構造やインターフェースに合わせて更新するスキルです。

## コマンド

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