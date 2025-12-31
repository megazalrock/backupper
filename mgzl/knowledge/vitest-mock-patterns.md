# Vitestのvi.mockパターン集

このドキュメントは、プロジェクトで使用されているVitestのモックパターンをまとめたものです。

## 1. 基本的なvi.mockパターン

### 1.1 シンプルなモジュールモック

```typescript
// composables/useAuthのモック
vi.mock('~/composables/useAuth', () => ({
  useAuth: () => ({
    loginWith: vi.fn(),
    isLoggedIn: ref(false)
  })
}))

// composables/UseLabelのモック
vi.mock('~/composables/UseLabel', () => ({
  useLabel: () => ({
    partnerLabel: 'パートナー'
  })
}))

// composables/UseBreakpointのモック
vi.mock('~/composables/UseBreakpoint', () => ({
  useBreakpoint: () => ({ pc: true, sp: false })
}))
```

### 1.2 外部ライブラリのモック

```typescript
// heic2anyライブラリのモック（画像変換ライブラリ）
vi.mock('heic2any')
```

## 2. vi.hoistedを使った高度なモックパターン

`vi.hoisted`を使うことで、モックの変数を事前に宣言し、テスト内で動的に振る舞いを変更できます。

### vi.hoistedが必要な場面

#### なぜvi.hoistedが必要か？

Vitestは通常、すべてのインポートとモジュールモックを他のコードよりも先に実行します（ホイスティング）。しかし、モック内で使用する変数や関数を定義する場合、それらもホイスティングされる必要があります。`vi.hoisted`はこの問題を解決します。

```typescript
// ❌ 悪い例: ReferenceError - mockRouterReplaceが定義される前に参照される
const mockRouterReplace = vi.fn()
vi.mock('~/composables/useRouter', () => ({
  useRouter: () => ({
    replace: mockRouterReplace // エラー！
  })
}))

// ✅ 良い例: vi.hoistedで事前に宣言
const { mockRouterReplace } = vi.hoisted(() => ({
  mockRouterReplace: vi.fn()
}))
vi.mock('~/composables/useRouter', () => ({
  useRouter: () => ({
    replace: mockRouterReplace // OK！
  })
}))
```

#### vi.hoistedを使うべき主なケース

1. **モックの外部で定義した変数をモック内で使用する場合**
2. **複数のモックで共有する変数が必要な場合**
3. **テスト中にモックの振る舞いを動的に変更したい場合**
4. **mockNuxtImportと組み合わせて使用する場合**

### 2.1 関数モックの事前宣言

```typescript
// authモジュールのモック（完全なプロパティ構造）
const { useAuthMock } = vi.hoisted(() => ({
  useAuthMock: vi.fn(() => ({
    isClient: computed(() => true),
    isPartner: computed(() => false),
    isAvailableEquipment: computed(() => true),
    myCompanyId: computed(() => 1),
    myCompanyName: computed(() => 'テスト会社')
  }))
}))

vi.mock('~/composables/useAuth', () => {
  return {
    useAuth: useAuthMock
  }
})
```

#### useAuthモックの重要な注意点

useAuthのプロパティは全て`computed()`によるリアクティブな参照として定義されています。テストでモックする際は以下のプロパティが重要です：

- `isClient`: クライアント会社かどうかを示すcomputed
- `isPartner`: パートナー会社かどうかを示すcomputed
- `isAvailableEquipment`: 設備機能が利用可能かどうかを示すcomputed
- `myCompanyId`: 自社のIDを示すcomputed
- `myCompanyName`: 自社名を示すcomputed

```typescript
// useAuthの基本的なモック設定（refを使った場合）
vi.mock('~/composables/useAuth', () => ({
  useAuth: vi.fn(() => ({
    isClient: ref(true),
    isPartner: ref(false),
    isAvailableEquipment: ref(true),
    myCompanyId: ref(123),
    myCompanyName: ref('テスト会社'),
    // その他必要なプロパティ...
  }))
}))
```

### 2.2 APIモックパターン

```typescript
// APIの呼び出しをモック
const { getUsersAllWithOrganizationMock } = vi.hoisted(() => ({
  getUsersAllWithOrganizationMock: vi.fn<() => CompanyUserWithOrganization>(() => ({
    organization: null,
    users: []
  }))
}))

vi.mock('~/api/Users/UseGetUsersAllWithOrganization', () => ({
  useGetUsersAllWithOrganization: vi.fn(() => ({
    getUsersAllWithOrganization: getUsersAllWithOrganizationMock
  }))
}))

// 設備API（useGetAllEquipments）のモックパターン
const { getAllEquipmentsMock } = vi.hoisted(() => ({
  getAllEquipmentsMock: vi.fn<(params: GetAllEquipmentsParams) => Promise<Equipment[]>>(() =>
    Promise.resolve([])
  )
}))

vi.mock('~/api/Equipments/UseGetAllEquipments', () => ({
  useGetAllEquipments: vi.fn(() => ({
    getAllEquipments: getAllEquipmentsMock
  }))
}))
```

#### APIモックの型定義例

```typescript
// GetAllEquipmentsParamsの型（参考）
interface GetAllEquipmentsParams {
  keyword?: string
  page?: number
  per_page?: number
  with_archived?: boolean
}

// 設備APIのモック関数使用例
test('設備一覧取得のテスト', async () => {
  const mockEquipments: Equipment[] = [
    { id: 1, name: 'テスト設備1', type: 'excavator' },
    { id: 2, name: 'テスト設備2', type: 'crane' }
  ]

  getAllEquipmentsMock.mockResolvedValueOnce(mockEquipments)

  const { getAllEquipments } = useGetAllEquipments()
  const result = await getAllEquipments({ keyword: 'test', page: 1, per_page: 10 })

  expect(getAllEquipmentsMock).toHaveBeenCalledWith({
    keyword: 'test',
    page: 1,
    per_page: 10
  })
  expect(result).toEqual(mockEquipments)
})
```

### 2.3 Nuxt関連のモックパターン（mockNuxtImportとの組み合わせ）

プロジェクトでは`mockNuxtImport`と`vi.hoisted`を組み合わせて使用することが多いです。

> **重要**: `mockNuxtImport`は`@nuxt/test-utils/runtime`からインポートします。

```typescript
import { mockNuxtImport } from '@nuxt/test-utils/runtime'

const { mockRouter, mockRoute, mockUseStorage } = vi.hoisted(() => ({
  mockRouter: vi.fn(() => ({
    replace: mockRouterReplace
  })),
  mockRoute: vi.fn(() => ({
    query: {}
  })),
  mockUseStorage: vi.fn(() => ({
    getCookie: mockGetCookie,
    setCookie: mockSetCookie,
    removeCookie: mockRemoveCookie,
    getLocalStorage: mockGetLocalStorage
  }))
}))

// Nuxt Importsのモック
mockNuxtImport('useRouter', () => mockRouter)
mockNuxtImport('useRoute', () => mockRoute)
mockNuxtImport('useStorage', () => mockUseStorage)
```

### 2.4 Vueコンポーネントのテストでのvi.hoisted活用例

Vueコンポーネントのテストでは、ストアのモックなどで頻繁に使用されます：

```typescript
const { mockStore } = vi.hoisted(() => {
  const mockStore = (() => {
    const mockIsActiveSelectTab = ref(false)
    const mockTagItems = ref([
      { id: 1, name: 'タグ1' },
      { id: 2, name: 'タグ2' }
    ])

    return {
      constructionEditForm: {
        stateConstructionGroups: {
          isActiveSelectTab: computed(() => mockIsActiveSelectTab.value),
          changeTab: vi.fn()
        },
        stateFlatConstructions: {
          setFocusedItem: vi.fn()
        }
      },
      baseInputForm: {
        orderItems: ref([{ id: 1, title: '工事案件1' }])
      }
    }
  })
  return { mockStore }
})

// モックの使用
vi.mock('~/composables/stores/documents/UseCreateEditStore', () => ({
  useCreateEditStore: () => mockStore
}))
```

### 2.5 複数APIをまとめてモックする例

複数のAPIエンドポイントを一括でモックし、テスト内で動的に振る舞いを変更する例です：

```typescript
// 複数のAPIエンドポイントをまとめて宣言
const {
  getUsersAllWithOrganizationMock,
  getPartnerAllMock,
  getScheduleLabelsMock
} = vi.hoisted(() => ({
  getUsersAllWithOrganizationMock: vi.fn<() => CompanyUserWithOrganization>(() => ({
    organization: null,
    users: []
  })),
  getPartnerAllMock: vi.fn<() => Partner[]>(() => []),
  getScheduleLabelsMock: vi.fn<() => ScheduleColor[]>(() => [])
}))

// それぞれのAPIモジュールをモック
vi.mock('~/api/Users/UseGetUsersAllWithOrganization', () => ({
  useGetUsersAllWithOrganization: vi.fn(() => ({
    getUsersAllWithOrganization: getUsersAllWithOrganizationMock
  }))
}))

vi.mock('~/api/Partners/UseGetPartnersAll', () => ({
  useGetPartnerAll: vi.fn(() => ({
    getPartnerAll: getPartnerAllMock
  }))
}))

// テスト内で動的に振る舞いを変更
it('ユーザー取得のテスト', () => {
  // 特定のテストケースでモックの返り値を変更
  getUsersAllWithOrganizationMock.mockReturnValueOnce({
    organization: { id: 1, name: 'テスト組織' },
    users: [{ id: 1, name: 'テストユーザー' }]
  })

  // テストの実行...
})
```

## 3. StubAPIを使った統合的なAPIモック

プロジェクトには独自のStubAPIシステムが実装されており、APIリクエストを統一的にモックできます。

### 3.1 StubAPIの基本セットアップ

```typescript
import { registerEndpoint, setupServer } from '~/composables/utils/api/__tests__/utils/StubApi/setupStubApi'

describe('テストスイート', () => {
  setupServer() // サーバーのセットアップ

  test('APIテスト', async () => {
    // エンドポイントの登録
    const mockApi = vi.fn().mockReturnValue({ data: [] })
    registerEndpoint('/api/users/all', mockApi)

    // APIの呼び出し
    await fetchUsers()

    // アサーション
    expect(mockApi).toHaveBeenCalledTimes(1)
  })
})
```

### 3.2 動的パラメータを持つエンドポイント

```typescript
// :idのような動的パラメータを持つエンドポイント
registerEndpoint('api/order_custom_views/:id/columns', mockApi.getColumns)
registerEndpoint('api/order_custom_views/:id/orders', mockApi.getOrders)
```

### 3.3 リクエストメソッド別のハンドリング

```typescript
// GETリクエスト（デフォルト）
registerEndpoint('/api/users', mockApi)

// POST、PUT、PATCH、DELETEも対応
registerEndpoint('/api/users', {
  handler: mockApi,
  method: 'POST'
})
```

## 4. テストユーティリティ

### 4.1 providePlugins

テスト環境でNuxtプラグインを提供するユーティリティ：

```typescript
import providePlugins from '~/test/utils/ProvidePlugins'

// テストファイルの先頭で呼び出し
providePlugins()
```

これにより以下が自動的に提供されます：
- 定数（constants）
- date-fns
- parseDate
- Vuetify
- Bugsnag
- VeeValidate

### 4.2 Vue Test Utilsとの組み合わせ

```typescript
import { mount, flushPromises } from '@vue/test-utils'
import { createVuetify } from 'vuetify'

const createWrapper = (props = {}) => {
  return mount(Component, {
    props: {
      ...defaultProps,
      ...props
    },
    global: {
      plugins: [createVuetify()],
      stubs: {
        ValidationForm,
        ValidationField
      }
    }
  })
}
```

## 5. モックのリセットパターン

### 5.1 beforeEach/afterEachでのリセット

```typescript
import { flushPromises } from '@vue/test-utils'

beforeEach(() => {
  vi.resetModules()
  vi.resetAllMocks()
  mockRouter.mockReset()
  mockLoginWith.mockReset()
  mockIsLoggedIn.value = false
  mockGetCookie.mockReturnValue(null)
})

afterEach(async () => {
  // flushPromises: 保留中のすべてのPromiseを解決する
  // コンポーネントの非同期処理（APIコール、nextTick等）が
  // 次のテストに影響しないようクリーンアップする
  await flushPromises()
})
```

#### flushPromisesとは

`flushPromises`は`@vue/test-utils`が提供するユーティリティで、マイクロタスクキューにある全ての保留中Promiseを解決します。主な用途：

1. **非同期処理の完了待ち**: `await`や`nextTick`を使った処理の完了を待つ
2. **テスト間の分離**: 前のテストの非同期処理が次のテストに影響しないようにする
3. **DOMの更新待ち**: リアクティブなデータ変更後のDOM更新を待つ

```typescript
// 使用例
it('非同期処理のテスト', async () => {
  const wrapper = mount(AsyncComponent)

  // ボタンクリックで非同期処理が開始
  await wrapper.find('button').trigger('click')

  // 非同期処理の完了を待つ
  await flushPromises()

  // 結果を検証
  expect(wrapper.text()).toContain('完了')
})
```

### 5.2 spyOnを使ったモック

```typescript
beforeAll(() => {
  vi.spyOn(useNuxtApp().$datadogRumSdkWrapper, 'setAuthUser')
    .mockImplementation(() => {})
  vi.spyOn(console, 'log').mockImplementation(() => {})
})

// テスト後の復元
afterAll(() => {
  vi.restoreAllMocks()
})
```

## 6. localStorageのモック

```typescript
let setLocalStorageMock: MockInstance
let getLocalStorageMock: MockInstance

beforeAll(() => {
  setLocalStorageMock = vi.spyOn(localStorage, 'setItem').mockImplementation(noop)
  getLocalStorageMock = vi.spyOn(localStorage, 'getItem').mockImplementation(noop)
})

afterAll(() => {
  setLocalStorageMock.mockRestore()
  getLocalStorageMock.mockRestore()
})
```

## 7. vi.hoistedを使う/使わないの判断基準

### vi.hoistedが必要なケース

1. **モック内で外部変数を参照する場合**
   ```typescript
   // vi.hoistedが必要
   const { mockFn } = vi.hoisted(() => ({ mockFn: vi.fn() }))
   vi.mock('~/module', () => ({ useModule: () => mockFn }))
   ```

2. **テスト中にモックの振る舞いを変更する場合**
   ```typescript
   // テストケースごとに返り値を変更したい
   const { mockApi } = vi.hoisted(() => ({ mockApi: vi.fn() }))

   test('ケース1', () => {
     mockApi.mockReturnValue('value1')
     // ...
   })

   test('ケース2', () => {
     mockApi.mockReturnValue('value2')
     // ...
   })
   ```

3. **mockNuxtImportを使用する場合**
   ```typescript
   const { mockRouter } = vi.hoisted(() => ({
     mockRouter: vi.fn(() => ({ push: vi.fn() }))
   }))
   mockNuxtImport('useRouter', () => mockRouter)
   ```

### vi.hoistedが不要なケース

1. **静的な値のみを返すモック**
   ```typescript
   // vi.hoisted不要
   vi.mock('~/composables/UseLabel', () => ({
     useLabel: () => ({ partnerLabel: 'パートナー' })
   }))
   ```

2. **外部ライブラリの単純なモック**
   ```typescript
   // vi.hoisted不要
   vi.mock('heic2any')
   ```

3. **モック内で完結する場合**
   ```typescript
   // vi.hoisted不要
   vi.mock('~/composables/useAuth', () => ({
     useAuth: () => ({
       isLoggedIn: ref(true),
       loginWith: vi.fn()
     })
   }))
   ```

## 8. ベストプラクティス

1. **vi.hoistedの使用**: モック変数を事前に宣言する場合は`vi.hoisted`を使用
2. **型安全性**: TypeScriptの型定義を活用してモックも型安全に
3. **リセット戦略**: 各テスト間で適切にモックをリセット
4. **StubAPIの活用**: APIテストには統一的なStubAPIシステムを使用
5. **providePlugins**: Nuxtプラグインが必要な場合は必ず呼び出し

## 9. トラブルシューティング

### よくあるエラーと解決方法

#### 1. ReferenceError: Cannot access 'mockVariable' before initialization

**原因**: モック内で参照している変数がホイスティングされていない

**解決方法**: `vi.hoisted`を使用する
```typescript
// ❌ エラーが発生
const mockFn = vi.fn()
vi.mock('~/module', () => ({ fn: mockFn }))

// ✅ 正しい
const { mockFn } = vi.hoisted(() => ({ mockFn: vi.fn() }))
vi.mock('~/module', () => ({ fn: mockFn }))
```

#### 2. モックが効かない

**原因**: インポート順序の問題

**解決方法**: `vi.mock`をファイルの最上部に配置
```typescript
// ✅ vi.mockとvi.hoistedは最初に
const { mockFn } = vi.hoisted(() => ({ mockFn: vi.fn() }))
vi.mock('~/module', () => ({ useModule: mockFn }))

// その後にインポート
import { useModule } from '~/module'
```

#### 3. テスト間でモックの状態が共有される

**原因**: モックのリセット漏れ

**解決方法**: `beforeEach`で適切にリセット
```typescript
beforeEach(() => {
  vi.clearAllMocks() // または vi.resetAllMocks()
  mockFn.mockReset()
})
```

## 使用例

```typescript
import { beforeAll, beforeEach, afterEach, describe, test, expect } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import providePlugins from '~/test/utils/ProvidePlugins'

// プラグインの提供
providePlugins()

// モックの定義
const { mockFunction } = vi.hoisted(() => ({
  mockFunction: vi.fn(() => 'mocked value')
}))

vi.mock('~/composables/useExample', () => ({
  useExample: () => ({
    exampleFunction: mockFunction
  })
}))

describe('ExampleComponent', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  test('should call mocked function', () => {
    const { exampleFunction } = useExample()
    const result = exampleFunction()

    expect(mockFunction).toHaveBeenCalled()
    expect(result).toBe('mocked value')
  })
})
```