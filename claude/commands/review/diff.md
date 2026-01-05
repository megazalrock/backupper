---
description: 指定されたコミットやブランチとの差分をレビュー
argument-hint: [branch/tag/commit]
---

## コンテキスト

- 変更ファイルの一覧: !`git diff $ARGUMENTS --name-only`
- 変更ファイル数: !`git diff --name-only | wc -l

指定されたコミットやブランチとの差分のレビューを以下の手順で行ってください。
1. `git diff $ARGUMENTS` で取得できる差分を code-reviewer サブエージェントでレビュー
2. `.mgzl/reviews/` ディレクトリにレビュー結果を `yyyy-MM-dd-[review-result-name].md` のファイル名で保存
3. `AskUserQuestion` ツールを利用して、 `mcp__jetbrains__open_file_in_editor` ツールを使用して作成したレビュー報告書を開くかどうかユーザーに尋ねる