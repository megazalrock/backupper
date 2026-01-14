# CLAUDE.md

`/Users/otto/workspace/craftbank/arrangement-env/front` 内の指定したファイルを `./files/` にコピーしgitでの管理をするためのリポジトリです。

## 構成

- `files/` コピーされたファイルを保存するディレクトリ（実行時に作成）
- `src/copyScript/index.ts` コピーを実行する `.ts` のスクリプト
- `src/modules/ConfigLoader.ts` configファイルの読み込みなどをするモジュール
- `src/modules/ParseCliArguments.ts` コマンドライン引数のパースを行うモジュール
- `src/types/config.ts` コピー設定の型定義
- `scripts/backup.ts` バックアップを実行する `.ts` のスクリプト
- `config.example.ts` コピー設定のテンプレート（`config.ts`にコピーして使用）

## 技術

- 言語: TypeScript
- 実行環境: Bun

## 命名規則

- 関数名は `camelCase` で記述する
- 変数名は `camelCase` で記述する
- クラス名は `PascalCase` で記述する
- インターフェース名は `PascalCase` で記述する
- 型名は `PascalCase` で記述する
- `index.ts` は全て小文字で記述する

## ツール

- ユーザーに選択肢を選ばせる場合は `AskUserQuestion` を利用する