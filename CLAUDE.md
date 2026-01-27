# CLAUDE.md

configで指定されたファイルを別ディレクトリにコピーするアプリケーションのリポジトリです。
ユーザーに対しては**必ず日本語で応答**します。

## 構成

```
├── files/                      # コピーされたファイルを保存するディレクトリ（実行時に作成）
├── scripts/
│   └── cli.ts                  # CLIエントリーポイント
├── src/
│   ├── api/
│   │   ├── executeBackup.ts    # バックアップAPI
│   │   ├── executeRestore.ts   # リストアAPI
│   │   ├── index.ts            # APIエクスポート
│   │   └── types.ts            # API用型定義
│   ├── bin.ts                  # パッケージバイナリエントリーポイント
│   ├── cli/
│   │   └── index.ts            # CLIルーター（サブコマンドのルーティング）
│   ├── commands/
│   │   ├── backup/
│   │   │   └── index.ts        # バックアップコマンドの実装
│   │   └── restore/
│   │       └── index.ts        # リストアコマンドの実装
│   ├── index.ts                # ライブラリエクスポート
│   ├── modules/
│   │   ├── ActionRunner.ts     # 後処理コマンドの実行
│   │   ├── ConfigLoader.ts     # configファイルの読み込み・バリデーション
│   │   ├── FileResolver.ts     # ファイル解決・glob処理・除外判定
│   │   ├── Logger.ts           # コピー/リストア結果のログ出力
│   │   ├── ParseCliArguments.ts # コマンドライン引数のパース
│   │   ├── PathConverter.ts    # ドット形式パスの変換（. ↔ dot__）
│   │   └── UserPrompt.ts       # ユーザー確認プロンプト
│   └── types/
│       ├── config.ts           # 設定の型定義
│       └── result.ts           # 処理結果の型定義
├── backupper.config.example.ts # コピー設定のテンプレート（backupper.config.tsにコピーして使用）
└── backupper.config.ts         # 実際の設定ファイル（.gitignore対象）
```

## 技術

- 言語: TypeScript
- 実行環境: Bun
- リンター: ESLint（@stylistic、import-x プラグイン使用）

## コマンド

### メインコマンド

- `bun run cli` CLIを実行（ヘルプ表示）
- `bun run backup` バックアップを実行
- `bun run restore` リストアを実行

### テスト

- `bun run test` テストを実行
- `bun run test:coverage` カバレッジつきでテストを実行
- `bun run test:watch` ウォッチモードでテストを実行

### リンター

- `bun run lint` ESLintチェックを実行
- `bun run lint:fix` ESLint自動修正を実行

## CLIオプション

### backup コマンド

```bash
bun run cli backup [オプション]
```

| オプション | 短縮形 | 説明 |
|-----------|--------|------|
| `--config <パス>` | `-c` | 設定ファイルのパスを指定 |
| `--help` | `-h` | ヘルプを表示 |

### restore コマンド

```bash
bun run cli restore [オプション]
```

| オプション | 短縮形 | 説明 |
|-----------|--------|------|
| `--config <パス>` | `-c` | 設定ファイルのパスを指定 |
| `--dry-run` | - | 実行内容を表示するのみ（実際には実行しない） |
| `--force` | `-f` | 確認プロンプトをスキップして実行 |
| `--help` | `-h` | ヘルプを表示 |

## 主要機能

### バックアップ機能

- **単一ファイル**: `"config.ts"`
- **ディレクトリ全体**: `".claude/"` （末尾に `/`）
- **globパターン**: `"src/**/*.ts"`, `"*.json"`
- **除外**: `excludes` パターンでフィルタリング
- **同期モード**: `config.backup.sync = true` でソースに存在しないファイルを出力先から削除

### リストア機能

- **ドライラン**: `--dry-run` フラグで実行内容を事前確認
- **強制実行**: `--force` フラグで確認プロンプトをスキップ
- **バックアップ保存**: `config.restore.preserveOriginal = true` で既存ファイルを `.bak` として保存

### パス変換

ドットで始まるパスを `dot__` 形式に変換してgit管理を容易にする：
- `.claude/` → `dot__claude/`
- リストア時に自動的に元の形式に戻す

### 後処理（postRunActions）

`backup.postRunActions` / `restore.postRunActions` で各処理後に任意のシェルコマンドを実行可能（git commit等の自動化に活用）

## 命名規則

- 関数名は `camelCase` で記述する
- 変数名は `camelCase` で記述する
- クラス名は `PascalCase` で記述する
- インターフェース名は `PascalCase` で記述する
- 型名は `PascalCase` で記述する
- `index.ts` は全て小文字で記述する

## importパス

- **相対パス**を使用する（パスエイリアス `@/` 等は使用しない）
- **拡張子 `.ts` を必ず付与**する（ESLintの `import-x/extensions` ルールで強制）

```typescript
// 正しい例
import { foo } from '../modules/Foo.ts';
import type { Config } from '../../types/config.ts';

// 誤った例（拡張子なし）
import { foo } from '../modules/Foo';
```

## ツール

- ユーザーに選択肢を選ばせる場合は `AskUserQuestion` を利用する

## スキル

- `test-runner` テストを実行する際に必ず利用する
