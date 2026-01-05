# CLAUDE.md

`/Users/otto/workspace/craftbank/arrangement-env/front` 内の指定したファイルを `./files/` にコピーしgitでの管理をするためのリポジトリです。

## 構成

- `docs/task-list.md` タスク一覧
- `docks/tasks/` タスクごとの仕様書
- `files/` コピーされたファイルを保存するディレクトリ
- `scripts/` コピーを実行する `.ts` のスクリプト
- `config.ts` コピー設定を管理するファイル
- `.claude/agents/copy-and-commit.md` コピーをしてコミットを行うサブエージェント

## 技術

- 言語: TypeScript
- 実行環境: Bun