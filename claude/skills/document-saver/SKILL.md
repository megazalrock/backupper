---
name: document-saver
description: 調査内容や議論のまとめを統一フォーマットの.mdファイルとして保存する。「ドキュメントを保存」「メモを残す」「調査結果をまとめて」「これを記録して」などの依頼時に使用。
---

# document-saver

調査した内容やユーザーが求めた内容を、統一的なフォーマットで `.md` ファイルとして保存するスキル。

## このスキルを使用するタイミング

1. ユーザーが「ドキュメントを保存して」「メモを残して」と依頼したとき
2. 調査結果をまとめてファイルに保存するよう依頼されたとき
3. 会話の内容や決定事項を記録するよう依頼されたとき
4. 技術的な知見やノウハウを文書化するよう依頼されたとき

## ワークフロー

### Step 1: ドキュメント種類の確認

以下のいずれかを特定する：
- **調査レポート**: コードベースや技術調査の結果
- **技術メモ**: 実装中に得た知見や気づき
- **議論まとめ**: 会話で決定した内容や要件のまとめ
- **その他**: 上記に当てはまらない一般的なドキュメント

### Step 2: 内容の整理

ユーザーから提供された情報や会話の内容を整理し、種類に応じたフォーマットテンプレートに沿って構成する。

**種類別テンプレート**:
| 種類 | テンプレート |
|------|-------------|
| 調査レポート | [format-investigation.md](reference/format-investigation.md) |
| 技術メモ | [format-technical-memo.md](reference/format-technical-memo.md) |
| 議論まとめ | [format-discussion-summary.md](reference/format-discussion-summary.md) |
| その他 | [format-general.md](reference/format-general.md) |

### Step 3: ファイル名の決定

**命名規則**: `yyyy-mm-dd-document-name.md`

- `yyyy-mm-dd`: 作成日（例: 2025-01-05）
- `document-name`: 内容を表す簡潔な英語名（ケバブケース）

**例**:
- `2025-01-05-schedule-api-investigation.md`
- `2025-01-05-vue-composition-api-tips.md`
- `2025-01-05-feature-requirements-summary.md`

### Step 4: 保存先の決定

- **デフォルト**: `.mgzl/tmp/`
- ユーザーが別のディレクトリを指定した場合はそちらに保存

### Step 5: ファイルの作成

Writeツールを使用してファイルを作成する。

## 使用例

### 例1: 調査結果の保存

```
ユーザー: スケジュールAPIの調査結果をまとめて保存して
↓
.mgzl/tmp/2025-01-05-schedule-api-investigation.md に保存
```

### 例2: 技術メモの保存

```
ユーザー: この実装で学んだことをメモしておいて
↓
.mgzl/tmp/2025-01-05-implementation-learnings.md に保存
```

### 例3: 保存先を指定

```
ユーザー: この内容を .mgzl/knowledge/ に保存して
↓
.mgzl/knowledge/2025-01-05-document-name.md に保存
```

## 注意事項

- 保存前にユーザーにファイル名と保存先を確認することを推奨
- 既存ファイルがある場合は上書きする前に確認を取る
- フォーマットは柔軟に調整可能（すべてのセクションが必須ではない）
