---
  paths: **/*.{test,spec}.ts
---

# 利用できる共通モック

共通モックは `test/mocks/` ディレクトリに配置されています。

## useBreakpointMock

**ファイル**: `test/mocks/useBreakpoint.mock.ts`

`useBreakpoint` composableのモック。`vi.mock`の呼び出しがカプセル化されているため、テストファイルで`vi.mock`や`mockNuxtImport`を呼ぶ必要はありません。

### 使用例

```typescript
import { useBreakpointMock } from '~/test/mocks/useBreakpoint.mock'

// デフォルト値のまま使用する場合
useBreakpointMock()

// 初期値を上書きする場合（最もシンプル）
useBreakpointMock({ pc: true })

// 後から値を変更する場合
const breakpointMock = useBreakpointMock()
breakpointMock.mockReturnValue({ sp: true })

// 一度だけ値を変更する場合
breakpointMock.mockReturnValueOnce({ md: true })
```