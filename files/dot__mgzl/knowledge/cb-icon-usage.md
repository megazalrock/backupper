# CbIcon コンポーネント使用ガイド

## 概要

`CbIcon`は、SVGアイコンを表示するためのアトミックコンポーネントです。`nuxt-svgo`を使用してSVGファイルを動的に読み込み、サイズや色を統一的に管理します。

**ファイル**: `components/lib/atoms/CbIcon.vue`

**Figma**: [UI Master Components](https://www.figma.com/design/WFeEGTGLPaP4gDcSHRziGJ/%E2%9C%8F%EF%B8%8F-UPDATING___UI-Master-Components?node-id=121-6339)

## 基本的な使い方

```vue
<template>
  <cb-icon name="calendar" size-px="24px" color="green" />
</template>

<script setup lang="ts">
import CbIcon from '~/components/lib/atoms/CbIcon.vue'
</script>
```

## Props

| Prop | 型 | 必須 | デフォルト | 説明 |
|------|-----|------|------------|------|
| `name` | `IconName` | ○ | - | アイコン名（`assets/icons/*.svg`に対応） |
| `size-px` | `SizePx` | ○ | - | アイコンサイズ |
| `color` | `IconColor` | - | `undefined` | アイコンの色 |
| `disabled` | `boolean` | - | `false` | 無効状態の表示 |
| `hover` | `boolean` | - | `true` | ホバー時の色変化を有効化 |
| `inline` | `boolean` | - | `false` | インライン表示（`d-inline-block`） |

## 型定義

### SizePx（サイズ）

```typescript
const sizesPx = ['10px', '12px', '14px', '16px', '20px', '24px', '28px', '32px'] as const
type SizePx = typeof sizesPx[number]
```

### IconColor（色）

```typescript
const iconColors = ['green', 'gray', 'red', 'white', 'black', 'blue', 'yellow'] as const
type IconColor = typeof iconColors[number]
```

### IconName（アイコン名）

利用可能なアイコンは `components/lib/atoms/types.ts` の `iconNames` で定義されています。主なアイコン：

- **ナビゲーション**: `arrow-left`, `arrow-right`, `chevron-down`, `chevron-up`, `chevron-left`, `chevron-right`
- **アクション**: `edit`, `delete`, `copy`, `save`, `search`, `filter`, `plus`, `minus`, `close`
- **カレンダー**: `calendar`, `calendar-today`, `calendar-edit`, `calendar-sync`
- **ファイル**: `document`, `folder`, `attach-file`, `download`
- **ユーザー**: `person`, `person-group`, `person-plus`
- **状態**: `check`, `check-circle`, `close-circle`, `alert`, `information`
- **その他**: `clock`, `map-pin`, `mail`, `setting`, `menu`, `dots`

## 色の仕様

### 通常時の色

| 色名 | カラーコード |
|------|-------------|
| `green` | `#008767` |
| `gray` | `#919191` |
| `red` | `#DD5853` |
| `white` | `#FFFFFF` |
| `black` | `#1B1B1B` |
| `blue` | `#0077DC` |
| `yellow` | `#E6B502` |

### disabled時の色

`disabled=true`の場合、自動的に淡い色に変換されます。

| 色名 | カラーコード |
|------|-------------|
| `green` | `#A2CBC4` |
| `gray` | `#D4D4D4` |
| `red` | `#FFDAD5` |
| `blue` | `#AFC6FF` |
| `yellow` | `#FFE587` |

### hover時の色

`hover=true`（デフォルト）の場合、マウスホバー時に濃い色に変化します。

| 色名 | カラーコード |
|------|-------------|
| `green` | `#006C51` |
| `gray` | `#474747` |
| `red` | `#AF2D31` |
| `blue` | `#004787` |
| `yellow` | `#A07F09` |

## 使用例

### 基本的な使用

```vue
<!-- 緑色のカレンダーアイコン -->
<cb-icon name="calendar" size-px="24px" color="green" />

<!-- グレーの矢印アイコン -->
<cb-icon name="arrow-right" size-px="16px" color="gray" />
```

### ソートアイコン（条件分岐）

```vue
<cb-icon
  v-if="sortDirection === 'asc'"
  name="menu-swap-up-active"
  size-px="24px"
  color="green"
/>
<cb-icon
  v-else-if="sortDirection === 'desc'"
  name="menu-swap-down-active"
  size-px="24px"
  color="green"
/>
<cb-icon
  v-else
  name="menu-swap"
  size-px="24px"
  color="gray"
/>
```

### 無効状態

```vue
<!-- 無効状態のアイコン（色が淡くなり、クリック不可） -->
<cb-icon
  name="edit"
  size-px="20px"
  color="green"
  :disabled="!canEdit"
/>
```

### ホバー無効

```vue
<!-- ホバー時の色変化を無効にする -->
<cb-icon
  name="information"
  size-px="16px"
  color="blue"
  :hover="false"
/>
```

### インライン表示

```vue
<!-- テキストと同じ行に表示 -->
<span>
  詳細を見る
  <cb-icon name="chevron-right" size-px="14px" color="green" inline />
</span>
```

## 注意点

1. **色の指定なし**: `color`を指定しない場合、SVG本来の色が使用されます
2. **ホバー効果**: `color`が未指定の場合、`hover`を`true`にしてもホバー効果は適用されません
3. **アイコンの追加**: 新しいアイコンを追加する場合は、`assets/icons/`にSVGファイルを配置し、`components/lib/atoms/types.ts`の`iconNames`に追加が必要です

## 関連コンポーネント

- **CbIconButton** (`components/lib/molecules/CbIconButton.vue`): アイコンをボタンとして使用する場合はこちらを使用
