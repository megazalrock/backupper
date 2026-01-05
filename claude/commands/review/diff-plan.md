---
description: 差分をレビューし、レビューを元に修正する実装計画書を作成
argument-hint: [branch/tag/commit]
---
## コンテキスト

- 変更ファイル数: !`git diff --name-only | wc -l`

## タスク

1. 「変更ファイル数」が20を超える場合は、`AskUserQuestion` で続行するかユーザーに尋ねる
2. `/review:diff` でレビューを実行する、ただしレビュー報告書を開くかどうかはユーザーに尋ねない
3. レビュー結果に基づき問題点を解消するための実装計画書を implementation-plan-creator スキルを利用して作成する