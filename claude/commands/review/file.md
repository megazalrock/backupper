---
description: 指定されたファイルをレビュー
argument-hint: [file path]
---
指定されたファイルのレビューを以下の手順で行ってください。
1. `$ARGUMENTS` のファイルを code-reviewer サブエージェントでレビュー
2. ファイルの指定がない場合はファイルの指定が必要な旨を表示して終了する
3`.mgzl/reviews/` ディレクトリにレビュー結果を `yyyy-MM-dd-[review-result-name].md` のファイル名で保存
4`AskUserQuestion` ツールを利用して、 `mcp__jetbrains__open_file_in_editor` ツールを使用して作成したレビュー報告書を開くかどうかユーザーに尋ねる