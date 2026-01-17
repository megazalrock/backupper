# scripts/restore.ts 仕様書

## 概要

`files/`（outputDir）にバックアップされたファイルを元の場所（base）へ復元するスクリプト。
`scripts/backup.ts` の逆方向の処理を行う。

## 基本動作

### コピー方向

```
backup.ts:  base (元プロジェクト) → outputDir (files/)
restore.ts: outputDir (files/)   → base (元プロジェクト)
```

### パス変換

`backup.ts` で変換された `dot__` プレフィックスを元の `.` に戻す。

| backup後 | restore後 |
|----------|-----------|
| `dot__claude/settings.json` | `.claude/settings.json` |
| `dot__mcp.json` | `.mcp.json` |

## リストア対象の決定

- `config.includes` パターンに従う
- `files/` ディレクトリ内で該当するファイルを走査
- `config.excludes` パターンに該当するファイルは除外

## 新規ファイルの扱い

元の `base` 側に存在しないファイルが `files/` にある場合も、**そのままコピーする**。

## 確認フロー

1. リストア対象ファイル一覧を表示
2. 各ファイルの状態を明示:
   - `[上書き]` - base側に既存ファイルあり
   - `[新規]` - base側に存在しない
3. ユーザーに続行確認（Y/n）
4. 承認後にリストア実行

## CLIオプション

| オプション | 短縮形 | 説明 | デフォルト |
|-----------|--------|------|-----------|
| `--config <path>` | `-c` | 設定ファイルのパス | `config.ts` |
| `--dry-run` | - | 実際のコピーなしに対象ファイル一覧を表示 | `false` |
| `--backup` | - | 上書き前に既存ファイルを `.bak` として保存 | `false` |
| `--force` | `-f` | 確認プロンプトをスキップ | `false` |
| `--help` | `-h` | ヘルプ表示 | - |

### 使用例

```bash
# 通常のリストア（確認あり）
bun run scripts/restore.ts

# ドライラン（実際のコピーなし）
bun run scripts/restore.ts --dry-run

# バックアップを作成しながらリストア
bun run scripts/restore.ts --backup

# 確認なしでリストア
bun run scripts/restore.ts --force

# カスタム設定ファイルを使用
bun run scripts/restore.ts -c my-config.ts
```

## 出力例

### 通常実行

```
リストアスクリプトを開始します...
設定ファイル: config.ts

対象ファイル数: 5

リストア対象:
  [上書き] .claude/settings.json
  [上書き] .mcp.json
  [新規]   .claude/new-file.json
  [上書き] tsconfig.mgzl.json
  [上書き] .mgzl/config.json

続行しますか？ (Y/n): Y

✓ .claude/settings.json → /Users/otto/workspace/.../front/.claude/settings.json
✓ .mcp.json → /Users/otto/workspace/.../front/.mcp.json
✓ .claude/new-file.json → /Users/otto/workspace/.../front/.claude/new-file.json
✓ tsconfig.mgzl.json → /Users/otto/workspace/.../front/tsconfig.mgzl.json
✓ .mgzl/config.json → /Users/otto/workspace/.../front/.mgzl/config.json

==================================================
リストア完了: 成功 5 件, 失敗 0 件
==================================================
```

### --backup オプション使用時

```
✓ .claude/settings.json → /Users/otto/workspace/.../front/.claude/settings.json
  (バックアップ: .claude/settings.json.bak)
```

### --dry-run オプション使用時

```
[DRY-RUN] 以下のファイルがリストアされます:
  [上書き] .claude/settings.json
  [新規]   .claude/new-file.json
  ...

実際のファイル操作は行われませんでした。
```

## コード構成

### 共通化するモジュール

`backup.ts` と共通で使用するモジュールを `src/modules/` に配置:

```
src/modules/
├── ConfigLoader.ts      # 既存（設定ファイル読み込み）
├── ParseCliArguments.ts # 既存（CLI引数パース）→ restore用に拡張
├── PathConverter.ts     # 新規（dot__ ↔ . 変換）
├── FileResolver.ts      # 新規（ファイル一覧取得、除外判定）
└── Logger.ts            # 新規（ログ出力）
```

### 共通化する関数

| 関数名 | 説明 | 配置先 |
|--------|------|--------|
| `convertDotPath` | `.` → `dot__` 変換 | `PathConverter.ts` |
| `revertDotPath` | `dot__` → `.` 変換（新規） | `PathConverter.ts` |
| `shouldExclude` | 除外パターン判定 | `FileResolver.ts` |
| `isGlobPattern` | glob判定 | `FileResolver.ts` |
| `resolveGlobPattern` | globパターン解決 | `FileResolver.ts` |
| `getFilesRecursively` | ディレクトリ再帰走査 | `FileResolver.ts` |
| `logResult` | 結果ログ出力 | `Logger.ts` |
| `logSummary` | サマリー出力 | `Logger.ts` |

### 型定義

`src/types/` に共通型を追加:

```typescript
// src/types/result.ts
export interface CopyResult {
  success: boolean
  source: string
  destination: string
  error?: string
}

export interface RestoreFileInfo {
  /** files/ 内の相対パス（dot__形式） */
  backupPath: string
  /** base への相対パス（.形式） */
  originalPath: string
  /** 上書きかどうか */
  isOverwrite: boolean
}
```

## エラーハンドリング

| エラー | 対応 |
|--------|------|
| 設定ファイルが見つからない | エラーメッセージを表示して終了 |
| `files/` ディレクトリが存在しない | エラーメッセージを表示して終了 |
| `base` ディレクトリが存在しない | エラーメッセージを表示して終了 |
| 個別ファイルのコピー失敗 | エラーをログ出力し、他のファイルは継続 |
| ユーザーが確認でキャンセル | 「キャンセルされました」を表示して終了 |

## 今後の拡張案（スコープ外）

- 差分表示機能（diffを表示してから確認）
- 特定ファイルのみリストア（CLI引数でパス指定）
- インタラクティブモード（ファイルごとに選択）
