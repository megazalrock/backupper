---
name: schedule-api
description: スケジュール機能のAPI実装・調査時に使用する。エンドポイント一覧の確認、リクエスト/レスポンスの型定義確認、実装計画作成時のAPI仕様確認が必要な場合に呼び出す。
---

# スケジュールAPI取得スキル

## 概要

`/Users/otto/workspace/craftbank/arrangement-env/api/public/docs/openapi.json` からスケジュール関連のAPIエンドポイント情報を取得し、実装に必要なAPI仕様を提供する。

## このスキルを使用するタイミング

以下の場合に使用する：

1. **スケジュール機能の新規実装** - 使用するAPIエンドポイントの仕様確認
2. **API連携の調査** - リクエスト/レスポンスの型定義確認
3. **実装計画作成時** - API仕様に基づく設計
4. **デバッグ時** - APIの期待される動作確認

## 抽出スクリプト

`scripts/extract-schedule-api.sh` を使用して、OpenAPIファイルからスケジュール関連の情報を抽出する。

### スクリプトのオプション

| オプション | 説明 | 用途 |
|---|---|---|
| `--summary` | エンドポイント一覧をテーブル形式で表示 | 全体像の把握 |
| `--paths` | パス情報をJSON形式で抽出 | エンドポイント詳細の確認 |
| `--schemas` | スキーマ情報をJSON形式で抽出 | 型定義の確認 |
| `--responses` | レスポンス情報をJSON形式で抽出 | レスポンス型の確認 |
| `--all` | すべての情報を抽出（デフォルト） | 完全な仕様確認 |

## ワークフロー

### ステップ1: エンドポイント一覧の取得

まず `--summary` オプションでスケジュールAPIの全体像を把握する：

```bash
.claude/skills/schedule-api/scripts/extract-schedule-api.sh --summary
```

出力例：
```
POST    /api/schedule/create                            Create Schedule
PATCH   /api/schedule/{scheduleId}                      Update Schedule
DELETE  /api/schedule/{scheduleId}                      Delete Schedule
GET     /api/schedule/monthly                           Get Schedule List for Calendar Monthly
...
```

### ステップ2: 必要な詳細情報の抽出

ユーザーの要求に応じて適切なオプションを選択する：

| ユーザーの要求 | 使用するオプション |
|---|---|
| エンドポイントのパラメータを知りたい | `--paths` |
| リクエスト/レスポンスの型を知りたい | `--schemas` |
| レスポンス構造を知りたい | `--responses` |
| すべての仕様を確認したい | `--all` |

```bash
# パス情報の詳細を取得
.claude/skills/schedule-api/scripts/extract-schedule-api.sh --paths

# スキーマ情報を取得
.claude/skills/schedule-api/scripts/extract-schedule-api.sh --schemas
```

### ステップ3: 情報の整形と提供

抽出したJSON情報を以下の形式で整理して提供する：

- **エンドポイント情報**: パス、メソッド、概要
- **パラメータ**: クエリパラメータ、パスパラメータ（必須/オプションを明記）
- **リクエストボディ**: スキーマ定義をTypeScript型として提示
- **レスポンス**: レスポンススキーマをTypeScript型として提示

## 使用例

### 例1: エンドポイント一覧の確認

```
ユーザー: スケジュールAPIにはどんなエンドポイントがある？

アシスタント:
1. `--summary` オプションでエンドポイント一覧を取得
2. テーブル形式で一覧を提供
```

### 例2: 特定APIの詳細確認

```
ユーザー: スケジュール作成APIの仕様を教えてください

アシスタント:
1. `--paths` で `/api/schedule/create` の詳細を抽出
2. `--schemas` で `CreateSchedule` スキーマを抽出
3. 必須パラメータとオプションパラメータを整理して提供
```

### 例3: 型定義の確認

```
ユーザー: 月間スケジュール取得APIのレスポンス型を教えて

アシスタント:
1. `--responses` で `MonthlyScheduleResponse` を抽出
2. TypeScript型定義として整形して提供
```

## 注意事項

- スクリプトは `jq` コマンドを使用するため、事前にインストールが必要
- OpenAPIファイルのパス: `/Users/otto/workspace/craftbank/arrangement-env/api/public/docs/openapi.json`
- `$ref` で参照されているスキーマは `--schemas` オプションで別途取得する