---
description: 対話形式で実装計画書を作成
argument-hint: [what to do]
---

## コンテキスト
- 実装内容: $ARGUMENTS

## タスク

1. $ARGUMENTS についてので実装計画書を書くための情報を AskUserQuestion を利用して対話形式で収集する
2. 収集した情報を元に @implementation-plan-creator エージェントを利用して実装計画書を作成する
3. 作成した実装計画書の不明点を @implementation-plan-investigator エージェントを利用して解決する
4. ユーザーに確認する必要がある内容は AskUserQuestion でユーザーに尋ねる
5. 実装計画書が完成したら mcp__jetbrains__open_file_in_editor を利用してファイルを開くかどうか AskUserQuestion でユーザーに尋ねる
