---
paths:
    - "**/*.{ts,vue}"
    - "!**/*.test.ts"
---

# 命名規則

このドキュメントでは、プロジェクト内で使用する命名規則を定義します。

## コンポーネント

- **形式**: PascalCase
- **例**: `OrderList.vue`, `ScheduleForm.vue`

## API関数

- **形式**: `Use`プレフィックス
- **例**: `UseGetOrders.ts`, `UseUpdateSchedule.ts`

## Store

- **形式**: `Use*Store.ts`
- **例**: `UseIndexStore.ts`, `UseOrderStore.ts`

## Types

- **配置**: `types/`ディレクトリ内でドメイン別に管理
- **分離**: APIレスポンス型、フォーム型、ビジネスロジック型を分離して定義

## 関数の命名

### booleanを返す関数

#### 引数を取らない場合

- **形式**: `is`で始める
- **例**: `isValid()`, `isEmpty()`, `isActive()`

#### 引数を取る場合

- **形式**: `getIs`で始める
- **例**: `getIsValid(value)`, `getIsEmpty(array)`, `getIsActive(status)`

### Vueコンポーネント用のイベントハンドラ

- **形式**: `handle`で始める
- **例**: `handleClick()`, `handleSubmit()`, `handleChange()`
