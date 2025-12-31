---
paths: **/*.{test,spec}.ts
---
# テストガイドライン

このドキュメントでは、テストコードの記述方法とテスト実行方法を説明します。

## テスト環境

### テストフレームワーク

- **フレームワーク**: Vitest
- **環境**: Nuxt環境でのテスト
## テストの実行

### 主要コマンド

テストの実行は必ず `docker compose exec -T` 経由で行います。また、 `cd` で移動する必要はありません。
また常に `-T` オプションを付与して非インタラクティブモードで実行してください。

```bash
# 特定のファイルのみテスト実行
docker compose exec -T front pnpm vitest run path/to/test.test.ts
```

## テストカバレッジ

- **カバレッジの確認は適宜人間が行う**

## テスト構造のパターン

### AAA（Arrange–Act–Assert）パターンに従う

```ts
it('should work', async () => {
  // Arrange
  const pivotConfigs = [
    makePivotConfig({
      filters: [
        makePivotFilter({
          key: 'foo'
        })
      ]
    })
  ]
  registerEndpoint('/api/custom_view_pivots', () => ({
    data: pivotConfigs
  }))

  // Act
  const { getCustomViewPivots } = useGetCustomViewPivots()
  const actual = await getCustomViewPivots()

  // Assert
  expect(actual).toStrictEqual(pivotConfigs)
})
```

### 規約
- `describe()` で論理的にテストをグループ化する
- `it()` に統一
- テスト間で状態が混ざらないよう、`beforeEach` で `vi.clearAllMocks()` を実行する。
    - vitest.config.tsで指定して、全テストに反映させる予定

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    clearMocks: true,
    restoreMocks: true,
  },
});
```

## ファイル構成

- ファイル名は `.test.ts` で終わるようにする
    - 既存の `.spec.ts` は **新規追加はしない**
    - 触る機会があれば `.test.ts` に順次リネームしていく
- 対象ファイルと同名のテストファイルにする
    ```ts
    DateFilterGenerator.vue
    __tests__/DateFilterGenerator.test.ts
    ```
- 対象ファイルと同じフォルダ内に `__tests__` フォルダを作り、その中にテストを置く

## カバレッジ

- 全ての Composable と Utility 関数にユニットテストを用意する
    - 新しく作る Composable / Utility は **原則テスト必須**
- コンポーネントのテスト観点：
    - props の動作
    - emit の確認
    - リアクティブな挙動
    - 条件付き描画（v-if 等）

## モック

- `vi.mock()` はファイルの先頭に記述する
- スパイやスタブには `vi.fn()` を使う
- `useRoute`, `useRouter`, `useNuxtApp` 等の auto-import された関数は [`mockNuxtImport`](https://nuxt.com/docs/4.x/getting-started/testing#mocknuxtimport) を使用
- `<NuxtLink>` などの Nuxt コンポーネントは [`mockComponent`](https://nuxt.com/docs/4.x/getting-started/testing#mockcomponent) を使ってモック化する
- mockの集約
    - 同じディレクトリに `__mocks__` を作成し、それ以下に `xxx.mock.ts` を作成する

    ```
    ┗ UseGetOrganizationItems.ts
      ┣ __tests__
      ┃ ┗ UseGetOrganizationItems.test.ts
      ┗ __mocks__
        ┣ UseGetOrganizationItems.mock.ts
        ┗ UseGetOrganizationItems // 場合によっては更に階層を分けても良い
          ┣ OneLevelOrganizationItems.mock.ts
          ┗ TwoLevelOrganizationItems.mock.ts
    ```

    - **mocks** に「していい」候補
        - `api` 層
          → どのレイヤーからも呼ばれるので、モックの再利用価値が高い

        - 副作用を持つ composables

          例：

            - ログイン状態を扱う `useAuth`
            - ローカルストレージ / Cookie を読む `useStorage系`
        - stores（もし使っていれば）

          → `useUserStore` などをモックしてコンポーネントをテストしたい時

    - 原則として「**再利用するモック / ダミーデータ / factory**」を置く場所とする

  （1 テストファイルからしか使わない簡単なモックは、テスト内にベタ書き OK）

    - 中身は：
        - API / composable / store の **ダミー実装を返す factory**
        - または **モックレスポンス用のデータ**
- その他共通の処理
    - 2 箇所以上で同じようなモックをコピペし始めたら、`test/` に昇格させる

```
┣ test/                # ここが「共通テスト用」ディレクトリ
┃ ┣ setup/
┃ ┃ ┗ setupTests.ts    # 全テスト共通のセットアップ
┃ ┣ utils/
┃ ┃ ┗ mountWithPlugins.ts 
┃ ┣ mocks/
┃ ┃ ┣ nuxt.mock.ts     # NuxtLink, useRoute などの共通モック
┃ ┣ fixtures/
┃ ┃ ┣ user.fixture.ts  # domainで分けられないものは直下
┃ ┃ ┣ organization.fixture.ts
┃ ┃ ┗ orders           # domainごとに分ける
┃ ┃   ┗ order.fixture.ts
```

## NGパターン

- `.skip()` は理由付きのみ
- コンポーネントは DOM 経由で検証
- 無意味な `waitFor` / `nextTick` 乱用禁止
- グローバルステート共有禁止
- 「前のテストの結果に依存する」書き方は禁止（1つの `it` の中でシナリオを完結させること）
