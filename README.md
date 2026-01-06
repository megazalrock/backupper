# docs

`arrangement-env/front` 内の指定ファイルを `./files/` にコピーし、Git で管理するためのリポジトリです。

## インストール

```bash
bun install
```

## 使用方法

```bash
bun run scripts/copy.ts
```

## 設定ファイル仕様（config.ts）

### 構造

```typescript
export const config = {
  base: string,        // コピー元のベースパス
  targetFiles: string[], // コピー対象（ファイルまたはディレクトリ）
  exclude: string[],   // 除外パターン
}
```

### 設定項目

| 項目 | 型 | 説明 |
|------|-----|------|
| `base` | `string` | コピー元のベースパス（絶対パス） |
| `targetFiles` | `string[]` | コピー対象の相対パス。末尾が `/` の場合はディレクトリ全体 |
| `exclude` | `string[]` | 除外するファイル/ディレクトリのパターン |

### 設定例

```typescript
export const config = {
  base: "/Users/otto/workspace/craftbank/arrangement-env/front",
  targetFiles: [
    ".claude/",           // ディレクトリ全体
    ".mgzl/",             // ディレクトリ全体
  ],
  exclude: [
    "node_modules",
    "*.log",
    ".DS_Store",
  ],
}
```

### 動作仕様

- **コピー先**: `./files/` 固定
- **ディレクトリ構造**: 階層を維持してコピー
  - 例: `.claude/settings.local.json` → `files/.claude/settings.local.json`
- **対象の指定方法**:
  - ファイル単体: `".claude/settings.local.json"`
  - ディレクトリ全体: `".claude/"` （末尾に `/`）
- **除外パターン**: glob形式で指定可能

