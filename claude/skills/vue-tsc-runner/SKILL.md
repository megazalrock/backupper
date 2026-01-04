---
name: vue-tsc-runner
description: TypeScriptの型チェックを行いたい場合に使用するスキルです。TypeScriptの型チェックを求められた場合に呼び出します。
---

# Vue tsc Runner

## 概要

TypeScriptの型チェックを行いたい場合に使用するスキルです。型チェックをするタイミングで呼び出します。

## このスキルを使用するタイミング

TypeScriptの型チェックを実行する必要がある場合に呼び出します。具体的には、以下のシチュエーションで使用します。
- コードの変更が行われた後、型チェックを実行したい場合
- デバッグや開発中の型チェックが必要な場合


## 呼び出しスクリプト

`/Users/otto/workspace/craftbank/docs/claude/skills/vue-tsc-runner/scripts/run-vue-tsc.sh` を使用すると、型エラーの発生しているプロジェクトの全ファイルが取得できます。
使用する場合は**必ず** ` | grep` と組み合わせてフィルタリングを行ってください。

## 使用例

```bash
/Users/otto/workspace/craftbank/docs/claude/skills/vue-tsc-runner/scripts/run-vue-tsc.sh | grep 'AssignDropdownSelectScopeModal.test.ts' # ファイルを指定して実行
```