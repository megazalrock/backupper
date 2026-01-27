---
allowed-tools: Bash(git push:*), Bash(git checkout:*), Bash(git stash:*), Bash(gh pr create:*), Bash(gh pr view:*), Bash(gh pr edit:*)
description: Pull Requestを作成
argument-hint: [branch name]
model: sonnet
---
## コンテキスト
- 対象ブランチ $ARGUMENTS

## タスク
1. 対象ブランチが指定されていない場合は、AskUserQuestionでユーザーにブランチ名を尋ねる
2. 対象ブランチをpush
3. 対象ブランチのプルリクエストを作成する
   - タイトル：変更内容を簡潔に記述
   - 本文：変更内容の目的、概要を記述