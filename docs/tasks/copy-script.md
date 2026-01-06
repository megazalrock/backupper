# コピースクリプトの仕様

`scripts/copy-script/index.ts` に作成

## 概要

`arrangement-env/front` 内の指定ファイルを `./files/` にコピーするスクリプト。

## 機能

### 1. 設定ファイルの読み込み

- `config.ts` から設定を読み込む
- 設定の型定義は `Config` インターフェースに従う

### 2. ファイルコピーの実行

- 設定ファイルで指定されたルールに基づきファイルをコピーする
- コピー先は `./files/` 固定
- ディレクトリ構造を維持してコピー

### 3. ドット変換

- `.`（ドット）から始まるファイル・ディレクトリ名は先頭の `.` を `dot__` に置換する
- 例:
  - `.claude/settings.json` → `files/dot__claude/settings.json`
  - `.mgzl/config.yaml` → `files/dot__mgzl/config.yaml`
  - `src/.env` → `files/src/dot__env`

### 4. 除外処理

- `exclude` に指定されたパターンにマッチするファイル・ディレクトリはコピーしない
- glob形式でパターン指定可能

### 5. ログ出力

- コンソールに出力
- 出力内容:
  - コピー成功: `✓ {コピー元} → {コピー先}`
  - コピー失敗: `✗ {コピー元} - {エラー内容}`
  - サマリー: コピー成功数、失敗数

## 設定ファイル仕様

### 型定義

```typescript
interface Config {
  /** コピー元のベースパス（絶対パス） */
  base: string
  /** コピー対象の相対パス。末尾が `/` の場合はディレクトリ全体 */
  targetFiles: string[]
  /** 除外するファイル/ディレクトリのパターン（glob形式） */
  exclude: string[]
}
```

### 設定例

```typescript
export const config: Config = {
  base: "/Users/otto/workspace/craftbank/arrangement-env/front",
  targetFiles: [
    ".claude/",    // ディレクトリ全体
    ".mgzl/",      // ディレクトリ全体
  ],
  exclude: [
    "node_modules",
    "*.log",
    ".DS_Store",
  ],
}
```

## ファイル構造

```
scripts/
└── copy-script/
    └── index.ts      # メインスクリプト
```

## モジュール構成

### 1. 設定読み込みモジュール

- `config.ts` をインポートして設定を取得
- 設定のバリデーション（base パスの存在確認など）

### 2. ファイルコピー処理

- **パス変換関数**: ドット変換を行う
- **除外判定関数**: glob パターンとマッチするか判定
- **コピー実行関数**: 実際のファイルコピーを行う

## 処理フロー

```
1. 設定ファイル読み込み
2. base パスの存在確認
3. targetFiles をループ
   3.1. 末尾が `/` ならディレクトリ内のファイル一覧を取得
   3.2. 各ファイルに対して:
        - 除外パターンチェック → マッチしたらスキップ
        - コピー先パスを生成（ドット変換含む）
        - コピー先ディレクトリを作成
        - ファイルをコピー
        - 結果をログ出力
4. サマリーを出力
```

## 実行方法

```bash
bun run scripts/copy-script/index.ts
```

## エラーハンドリング

| エラー | 対応 |
|--------|------|
| base パスが存在しない | エラーメッセージを出力して終了 |
| コピー元ファイルが存在しない | 警告を出力してスキップ |
| コピー先への書き込み失敗 | エラーを出力して次のファイルへ |