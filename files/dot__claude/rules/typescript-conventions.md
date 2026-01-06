---
paths: **/*.{ts,vue}
---

# TypeScript規約

このドキュメントでは、プロジェクト内で使用するTypeScriptの規約を定義します。

## 確認のためのツール

- mcp__eslint__lint-files eslintのチェック
- mcp__jetbrains__get_file_problems IDEで検知したファイルの問題

## 厳格設定

- **ベース設定**: `@tsconfig/strictest`を使用
- TypeScriptの最も厳格な型チェック設定を採用しています

## 使用制限

### 非推奨な機能の使用制限

以下の機能は極力使用を避け、使用する場合は**必ず理由をコメントで残す**こととします。

- **`!` (Non-null assertion operator)**: 値がnullでないことを保証する演算子
- **`as` (Type assertion)**: 型を強制的に変換する演算子
- **`any`型**: すべての型を許容する型

### 使用時の条件

上記の機能を使用する場合は、**必ず理由をコメントで残してください**。

#### Non-null assertion operatorのコメント例

```typescript
// これ以前にnullチェックを行っているため `!` を許容
const value = foo.bar!; 
```

#### anyのESLint無効化の記述方法

```typescript
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- オフにした理由
const data: any = fetchData();
```

## 型定義

### 配置

- **ディレクトリ**: `types/`ディレクトリ内に型定義ファイルを配置します

## 実装例

### $axiosのエラーの扱い方

```typescript
import type { AxiosError } from 'axios';
const fetchSomething = async () => {
  const { $toast, $bugsnag } = useNuxtApp()
  try {
    // API呼び出し
  } catch (e: unknown) {
    if (e instanceof AxiosError) {
      if (e.response?.status === 404) {
        $toast.error(`適切なエラーメッセージ`);
      } else if (e.response?.status === 500) {
        $toast.error(`適切なエラーメッセージ`);
      }
      $bugsnag.notify(e);
    } else {
      // その他のエラーとして処理
    }
  }
}

```