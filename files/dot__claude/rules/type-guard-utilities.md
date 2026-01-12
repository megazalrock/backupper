---
paths:
  - "**/*.{ts,vue}"
  - "!**/*.test.ts"
---

# 型ガードユーティリティ (`utils/Type.ts`)

## 概要

`utils/Type.ts`は、TypeScriptの型安全性を向上させるための型定義と型ガード関数を提供します。基本的な型のチェックには、このファイルのユーティリティ関数を使用してください。

## 型定義

### None
```typescript
type None = null | undefined
```
`null`または`undefined`を表す型。


## 型ガード関数

すべての型ガード関数は`Type`名前空間に属しています。使用例: `Type.isString(value)`
主に利用するのは null/undefined チェックの関数です。

### Type.isUndefined
```typescript
Type.isUndefined(value)
```
値が`undefined`かどうかを判定。

### Type.isNull
```typescript
Type.isNull(value)
```
値が`null`かどうかを判定。

### Type.isNone
```typescript
Type.isNone(value)
```
値が `None`かどうか判定

```typescript
// 使用例
if (Type.isNone(value)) {
  // value は null | undefined
  return
}
// value は null でも undefined でもない
```

### Type.isHtmlElement
```typescript
Type.isHtmlElement(value)
```
値が`HTMLElement`インスタンスかどうかを判定。`<div ref="divRef"></div>` などコンポーネントへのrefをチェックするのに使用する。
