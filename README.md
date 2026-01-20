# backupper

指定したディレクトリのファイルをバックアップ・リストアするためのCLIツールです。

## 機能

- **バックアップ**: 指定したファイル/ディレクトリを `./files/` にコピー
- **リストア**: バックアップしたファイルを元の場所に復元
- **パス変換**: ドットで始まるパスを `dot__` 形式に変換してgit管理を容易化
- **後処理**: backup/restore 後に任意のシェルコマンドを実行可能

## インストール

```bash
bun install
```

## セットアップ

1. `config.example.ts` を `config.ts` にコピー
2. `config.ts` を編集して設定をカスタマイズ

```bash
cp config.example.ts config.ts
```

## 使用方法

### バックアップ

```bash
bun run backup
```

### リストア

```bash
bun run restore
```

### CLIオプション

#### backup コマンド

| オプション | 短縮形 | 説明 |
|-----------|--------|------|
| `--config <パス>` | `-c` | 設定ファイルのパスを指定 |
| `--help` | `-h` | ヘルプを表示 |

#### restore コマンド

| オプション | 短縮形 | 説明 |
|-----------|--------|------|
| `--config <パス>` | `-c` | 設定ファイルのパスを指定 |
| `--dry-run` | - | 実行内容を表示するのみ（実際には実行しない） |
| `--force` | `-f` | 確認プロンプトをスキップして実行 |
| `--help` | `-h` | ヘルプを表示 |

## 設定ファイル（config.ts）

```typescript
import type { Config } from 'src/types/config.ts';

export const config: Config = {
  source: '/path/to/source',  // コピー元のベースパス
  target: 'files',            // コピー先ディレクトリ
  includes: [
    '.claude/',               // ディレクトリ全体（末尾 / ）
    '.mcp.json',              // 単一ファイル
    'src/**/*.ts',            // globパターン
  ],
  excludes: [
    'node_modules',
    '*.log',
    '.DS_Store',
  ],
  // バックアップ固有の設定
  backup: {
    sync: false,              // true: ソースに存在しないファイルをターゲットから削除
  },
  // リストア固有の設定
  restore: {
    preserveOriginal: false,  // true: 既存ファイルを.bakとして保存
  },
};
```

### 設定項目

| 項目 | 型 | 説明 |
|------|-----|------|
| `source` | `string` | コピー元のベースパス（絶対パス） |
| `target` | `string` | コピー先ディレクトリ |
| `includes` | `string[]` | コピー対象のパス（ファイル、ディレクトリ、globパターン） |
| `excludes` | `string[]` | 除外するファイル/ディレクトリのパターン |
| `backup.sync` | `boolean` | ソースに存在しないファイルをターゲットから削除 |
| `restore.preserveOriginal` | `boolean` | リストア時に既存ファイルを `.bak` として保存 |

### パス指定方法

- **単一ファイル**: `"config.ts"`
- **ディレクトリ全体**: `".claude/"` （末尾に `/`）
- **globパターン**: `"src/**/*.ts"`, `"*.json"`

## テスト

```bash
bun run test              # テストを実行
bun run test:coverage     # カバレッジつきで実行
bun run test:watch        # ウォッチモードで実行
```

## リンター

```bash
bun run lint              # ESLintチェックを実行
bun run lint:fix          # ESLint自動修正を実行
```

## 技術スタック

- 言語: TypeScript
- 実行環境: Bun
- リンター: ESLint

## ライセンス

Private
