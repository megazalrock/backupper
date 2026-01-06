# 配列ユーティリティ (`utils/array`)

## 概要

`utils/array`ディレクトリには、配列操作のためのユーティリティ関数が含まれています。これらの関数は、配列の差分検出や重複削除といった一般的な配列操作を型安全に実行できます。

## 関数一覧

### 差分検出関数

#### difference

```typescript
difference<T extends Primitive>(newArray: T[], oldArray: T[]): { added: T[], deleted: T[] }
```

プリミティブ値の配列の差分を取得します。`Array.includes()`を使用しているため、プリミティブ値（`number`、`string`、`boolean`、`bigint`、`symbol`、`null`、`undefined`）のみに対応しています。

**パラメータ**:
- `newArray`: 新しい配列
- `oldArray`: 古い配列

**戻り値**:
- `added`: `newArray`にあって`oldArray`にない要素の配列
- `deleted`: `oldArray`にあって`newArray`にない要素の配列

**使用例**:
```typescript
import { difference } from '~/utils/array/difference'

const newArray = [1, 2, 3]
const oldArray = [2, 3, 4]

const result = difference(newArray, oldArray)
// { added: [1], deleted: [4] }

// 文字列の配列でも使用可能
const newTags = ['tag1', 'tag2']
const oldTags = ['tag2', 'tag3']
const tagDiff = difference(newTags, oldTags)
// { added: ['tag1'], deleted: ['tag3'] }
```

#### differenceBy

```typescript
differenceBy<T>(
  newArray: T[],
  oldArray: T[],
  iteratee: (item: T) => Primitive
): { added: T[], deleted: T[] }
```

iteratee関数で指定した値を比較して配列の差分を取得します。オブジェクト配列でも使用可能ですが、iteratee関数の戻り値はプリミティブ値である必要があります。

**パラメータ**:
- `newArray`: 新しい配列
- `oldArray`: 古い配列
- `iteratee`: 比較に使用する値を返す関数

**戻り値**:
- `added`: iterateeの結果が`oldArray`のいずれとも一致しない`newArray`の要素
- `deleted`: iterateeの結果が`newArray`のいずれとも一致しない`oldArray`の要素

**使用例**:
```typescript
import { differenceBy } from '~/utils/array/differenceBy'

// オブジェクト配列のID比較
const newUsers = [
  { id: 1, name: 'Alice' },
  { id: 2, name: 'Bob' }
]
const oldUsers = [
  { id: 2, name: 'Bob' },
  { id: 3, name: 'Charlie' }
]

const result = differenceBy(newUsers, oldUsers, user => user.id)
// {
//   added: [{ id: 1, name: 'Alice' }],
//   deleted: [{ id: 3, name: 'Charlie' }]
// }

// 複合キーでの比較
const newItems = [
  { categoryId: 1, itemId: 1, name: 'Item 1-1' },
  { categoryId: 1, itemId: 2, name: 'Item 1-2' }
]
const oldItems = [
  { categoryId: 1, itemId: 2, name: 'Item 1-2' },
  { categoryId: 2, itemId: 1, name: 'Item 2-1' }
]

const itemDiff = differenceBy(
  newItems,
  oldItems,
  item => `${item.categoryId}-${item.itemId}`
)
// {
//   added: [{ categoryId: 1, itemId: 1, name: 'Item 1-1' }],
//   deleted: [{ categoryId: 2, itemId: 1, name: 'Item 2-1' }]
// }

// プロパティの計算結果で比較
const items1 = [{ id: 1, value: 10 }, { id: 2, value: 20 }]
const items2 = [{ id: 3, value: 20 }, { id: 4, value: 40 }]

const valueDiff = differenceBy(items1, items2, item => item.value * 2)
// value * 2 の結果で比較: [20, 40] vs [40, 80]
// { added: [{ id: 1, value: 10 }], deleted: [{ id: 4, value: 40 }] }
```

### 重複削除関数

#### filterDuplicates

```typescript
filterDuplicates<T extends Primitive>(arr: T[]): T[]
```

プリミティブ値の配列から重複を削除します。`new Set()`を利用しているため、プリミティブ値のみに対応しています。

**パラメータ**:
- `arr`: 重複を削除する配列

**戻り値**:
- 重複が削除された配列（元の配列の順序を保持）

**使用例**:
```typescript
import { filterDuplicates } from '~/utils/array/filterDuplicates'

const numbers = [1, 2, 2, 3, 3, 3]
const unique = filterDuplicates(numbers)
// [1, 2, 3]

const tags = ['tag1', 'tag2', 'tag1', 'tag3']
const uniqueTags = filterDuplicates(tags)
// ['tag1', 'tag2', 'tag3']
```

#### filterDuplicatesBy

```typescript
filterDuplicatesBy<T>(arr: T[], closure: (element: T) => Primitive): T[]
```

closure関数で指定した値を基準に配列から重複を削除します。`Map`を使用しているため、オブジェクト配列でも使用可能ですが、closure関数の戻り値はプリミティブ値である必要があります。

**パラメータ**:
- `arr`: 重複を削除する配列
- `closure`: 重複判定に使用する値を返す関数

**戻り値**:
- 重複が削除された配列（最初に出現した要素を保持、順序を保持）

**使用例**:
```typescript
import { filterDuplicatesBy } from '~/utils/array/filterDuplicates'

// IDで重複削除
const users = [
  { id: 1, name: 'Alice' },
  { id: 2, name: 'Bob' },
  { id: 1, name: 'Alice Duplicate' }
]
const uniqueUsers = filterDuplicatesBy(users, user => user.id)
// [{ id: 1, name: 'Alice' }, { id: 2, name: 'Bob' }]
// 最初に出現した { id: 1, name: 'Alice' } が保持される

// プロパティの計算結果で重複削除
const items = [
  { id: 1, category: 'A' },
  { id: 2, category: 'B' },
  { id: 3, category: 'A' }
]
const uniqueByCategory = filterDuplicatesBy(items, item => item.category)
// [{ id: 1, category: 'A' }, { id: 2, category: 'B' }]
```

## 使用例

### 実装例: 配列の変更を検出してAPI送信

```typescript
import { differenceBy } from '~/utils/array/differenceBy'

interface ScheduleItem {
  id: number
  title: string
  startDate: string
}

async function updateSchedules(
  currentSchedules: ScheduleItem[],
  originalSchedules: ScheduleItem[]
): Promise<void> {
  const { added, deleted } = differenceBy(
    currentSchedules,
    originalSchedules,
    schedule => schedule.id
  )

  // 追加されたスケジュールを登録
  if (added.length > 0) {
    await api.createSchedules(added)
  }

  // 削除されたスケジュールを削除
  if (deleted.length > 0) {
    await api.deleteSchedules(deleted.map(s => s.id))
  }
}
```

### 実装例: フォーム入力から重複を除去

```typescript
import { filterDuplicates } from '~/utils/array/filterDuplicates'

function processFormTags(tags: string[]): string[] {
  // 重複を削除し、空文字列を除外
  const uniqueTags = filterDuplicates(tags)
  return uniqueTags.filter(tag => tag.trim() !== '')
}

// 使用例
const formTags = ['tag1', 'tag2', 'tag1', '', 'tag3']
const processedTags = processFormTags(formTags)
// ['tag1', 'tag2', 'tag3']
```

### 実装例: 複数プロパティによる重複削除

```typescript
import { filterDuplicatesBy } from '~/utils/array/filterDuplicates'

interface Product {
  categoryId: number
  productCode: string
  name: string
}

function removeDuplicateProducts(products: Product[]): Product[] {
  // categoryIdとproductCodeの組み合わせで重複削除
  return filterDuplicatesBy(
    products,
    product => `${product.categoryId}-${product.productCode}`
  )
}
```

## ベストプラクティス

### 1. 適切な関数の選択

**プリミティブ値の配列**には`difference`と`filterDuplicates`を使用:
```typescript
// Good
const diff = difference([1, 2, 3], [2, 3, 4])
const unique = filterDuplicates([1, 2, 2, 3])

// Avoid（オブジェクト配列ではないのにByバージョンを使用）
const diff = differenceBy([1, 2, 3], [2, 3, 4], x => x)
```

**オブジェクト配列**には`differenceBy`と`filterDuplicatesBy`を使用:
```typescript
// Good
const diff = differenceBy(users1, users2, user => user.id)

// Avoid（オブジェクトの参照比較になり、意図しない結果になる）
const diff = difference(users1, users2) // 型エラー
```

### 2. iteratee/closureの設計

**シンプルなプロパティアクセス**を優先:
```typescript
// Good
differenceBy(items, prevItems, item => item.id)

// Good（複合キーが必要な場合）
differenceBy(items, prevItems, item => `${item.categoryId}-${item.itemId}`)

// Avoid（不必要に複雑）
differenceBy(items, prevItems, item => JSON.stringify(item))
```

### 3. null/undefinedの扱い

`null`と`undefined`は異なる値として扱われます:
```typescript
const items = [
  { id: 1 },
  { id: null },
  { id: undefined }
]

const result = filterDuplicatesBy(items, item => item.id)
// [{ id: 1 }, { id: null }, { id: undefined }]
// null と undefined は別の値として扱われる
```

### 4. 順序の保持

すべての関数は元の配列の順序を保持します:
```typescript
const items = [
  { id: 3, name: 'C' },
  { id: 1, name: 'A' },
  { id: 2, name: 'B' }
]

const unique = filterDuplicatesBy(items, item => item.id)
// 順序は保持される: [{ id: 3, ... }, { id: 1, ... }, { id: 2, ... }]
```

## 注意事項

### 1. プリミティブ値の制約

`difference`と`filterDuplicates`はプリミティブ値のみに対応しています。オブジェクトを含む配列では`differenceBy`や`filterDuplicatesBy`を使用してください:

```typescript
// ❌ エラー: オブジェクトはPrimitive型ではない
const diff = difference([{ id: 1 }], [{ id: 2 }])

// ✅ OK
const diff = differenceBy([{ id: 1 }], [{ id: 2 }], obj => obj.id)
```

### 2. iteratee/closureの戻り値

`differenceBy`と`filterDuplicatesBy`のiteratee/closure関数は、必ずプリミティブ値を返す必要があります:

```typescript
// ✅ OK
differenceBy(items, prevItems, item => item.id) // number
differenceBy(items, prevItems, item => `${item.a}-${item.b}`) // string

// ❌ NG: オブジェクトを返している
differenceBy(items, prevItems, item => ({ id: item.id }))
```

### 3. 重複要素の扱い（differenceBy）

`differenceBy`は重複要素を含む配列を渡した場合、重複も結果に含めます:

```typescript
const newArray = [
  { id: 1, name: 'Alice' },
  { id: 1, name: 'Alice Duplicate' },
  { id: 2, name: 'Bob' }
]
const oldArray = [
  { id: 2, name: 'Bob' },
  { id: 3, name: 'Charlie' }
]

const result = differenceBy(newArray, oldArray, item => item.id)
// {
//   added: [
//     { id: 1, name: 'Alice' },
//     { id: 1, name: 'Alice Duplicate' } // 重複も含まれる
//   ],
//   deleted: [{ id: 3, name: 'Charlie' }]
// }

// 重複を除外したい場合は、事前にfilterDuplicatesByを適用
const uniqueNewArray = filterDuplicatesBy(newArray, item => item.id)
const result = differenceBy(uniqueNewArray, oldArray, item => item.id)
// { added: [{ id: 1, name: 'Alice' }], deleted: [{ id: 3, name: 'Charlie' }] }
```

### 4. +0 と -0 の扱い

`Set`の仕様により、`+0`と`-0`は同じ値として扱われます:

```typescript
const result = filterDuplicates([+0, -0])
// [0] （+0 のみが残る）
```

### 5. NaN の扱い

`Set`は`NaN`を正しく重複として認識します:

```typescript
const result = filterDuplicates([NaN, NaN, 1])
// [NaN, 1]
```

### 6. 大文字小文字の区別

文字列の比較では大文字小文字が区別されます。大文字小文字を無視したい場合は、iteratee/closureで変換してください:

```typescript
const items = [
  { code: 'ABC' },
  { code: 'abc' },
  { code: 'DEF' }
]

// 大文字小文字を区別
const result1 = filterDuplicatesBy(items, item => item.code)
// [{ code: 'ABC' }, { code: 'abc' }, { code: 'DEF' }]

// 大文字小文字を無視
const result2 = filterDuplicatesBy(items, item => item.code.toLowerCase())
// [{ code: 'ABC' }, { code: 'DEF' }]
```

## 参考

- [MDN: Set - 値の等価性](https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Global_Objects/Set#%E5%80%A4%E3%81%AE%E7%AD%89%E4%BE%A1%E6%80%A7)
- [MDN: Map - キーの等価性](https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Global_Objects/Map#%E3%82%AD%E3%83%BC%E3%81%AE%E7%AD%89%E4%BE%A1%E6%80%A7)
- [type-fest: Primitive型](https://github.com/sindresorhus/type-fest)
