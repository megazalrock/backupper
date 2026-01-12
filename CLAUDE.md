# CLAUDE.md

`/Users/otto/workspace/craftbank/arrangement-env/front` 内の指定したファイルを `./files/` にコピーしgitでの管理をするためのリポジトリです。

## 構成

- `files/` コピーされたファイルを保存するディレクトリ
- `src/copyScript/index.ts` コピーを実行する `.ts` のスクリプト
- `src/modules/ConfigLoader.ts` configファイルの読み込みなどをするモジュール
- `src/modules/ParseCliArguments.ts` コマンドライン引数のパースを行うモジュール
- `src/types/config.ts` コピー設定の型定義
- `scripts/copyScript.ts` コピーを実行する `.ts` のスクリプト
- `config.ts` コピー設定を管理するファイル

## 技術

- 言語: TypeScript
- 実行環境: Bun

## ツール

- ユーザーに選択肢を選ばせる場合は `AskUserQuestion` を利用する