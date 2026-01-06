# アーキテクチャパターン

このドキュメントでは、プロジェクトで採用しているアーキテクチャパターンを説明します。

## コンポーネント構成（Atomic Design）

Atomic Designパターンを採用しています。

### ディレクトリ構造

```
components/
├── atoms/          # 最小単位のUI部品
├── molecules/      # 再利用可能な複合UI部品
├── organisms/      # 複雑なビジネスロジックを持つコンポーネント（ドメイン別）
└── lib/           # 汎用UIコンポーネント
```

### 各レイヤーの役割

#### Atoms（原子）

- **説明**: 最小単位のUI部品
- **例**: Button、Form、Icon、Input等
- **特徴**: 単一の責務を持ち、他のコンポーネントに依存しない

#### Molecules（分子）

- **説明**: Atomsを組み合わせた再利用可能なコンポーネント
- **例**: Modal、Menu、SearchBox等
- **特徴**: 複数のAtomsを組み合わせて、より複雑な機能を提供

#### Organisms（有機体）

- **説明**: ドメイン別の複雑なビジネスロジックを持つコンポーネント
- **例**: OrderForm、ScheduleCalendar、AttendanceTable等
- **特徴**: ビジネスロジックを含み、ドメイン固有の処理を実装

#### Lib（ライブラリ）

- **説明**: 汎用的に使用できるUIコンポーネント
- **特徴**: プロジェクト全体で共通して使用できる

## API設計

### 構造

- **配置**: `api/`ディレクトリ以下にドメイン別に配置
- **例**: `api/Order/`, `api/Schedule/`, `api/Attendance/`

### 形式

- **パターン**: Custom Hooks形式
- **目的**: 再利用性の確保
- **命名**: `Use`プレフィックスを使用（例: `UseGetOrders.ts`）

## 状態管理（Pinia）

localStorageへの永続化が必要な場合はPiniaを使用して状態管理を行います。
その他の場合は基本的に使用しません。

### 配置

- **ディレクトリ**: `composables/stores/`
- **構造**: ドメイン別にStoreを管理
- **命名**: `Use*Store.ts`（例: `UseOrderStore.ts`）

### 機能

- **自動インポート**: `defineStore`、`storeToRefs`が自動的にインポートされます
- **永続化**: localStorageへの自動永続化が可能です。

### 例

```typescript
// composables/stores/UseOrderStore.ts
export const useOrderStore = defineStore('order', () => {
  const orders = ref<Order[]>([]);

  const fetchOrders = async () => {
    // API呼び出し処理
  };

  return {
    orders,
    fetchOrders,
  };
});
```
