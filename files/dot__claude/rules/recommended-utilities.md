---
paths:
    - "**/*.{ts,vue}"
    - "!**/*.test.ts"
---

# 使用が推奨されるユーティリティの一覧

このドキュメントでは、プロジェクト内で使用が推奨されるユーティリティ関数を一覧化します。

## 日付操作

### safeParseDate

**ファイル**: `utils/date/safeParseDate.ts`

**使用すべき場面**: 日付文字列を `Date` 型に変換する際、`null` が渡される可能性がある場合に使用します。`$parseDate` を直接呼び出す代わりにこの関数を使うことで、`null` の扱いを安全に処理できます。

```typescript
import { safeParseDate } from '~/utils/date/safeParseDate'

// nullを渡すとnullが返る
const date1 = safeParseDate(null) // => null

// 日付文字列を渡すとDateが返る
const date2 = safeParseDate('2025-01-15') // => Date

// 空文字列はエラーをthrowする
const date3 = safeParseDate('') // => Error: Invalid date format: empty string
```

## 非同期処理

### wait

**ファイル**: `utils/wait.ts`

**使用すべき場面**: 指定したミリ秒だけ処理を待機させたい場合に使用します。ポーリング処理やアニメーションのタイミング調整、APIリクエストの間隔を空ける場合などに便利です。

```typescript
import { wait } from '~/utils/wait'

// 1秒待機してから次の処理を実行
await wait(1000)
console.log('1秒経過しました')

// ポーリング処理の例
const pollData = async () => {
  while (shouldContinue) {
    await fetchData()
    await wait(5000) // 5秒間隔でポーリング
  }
}
```
