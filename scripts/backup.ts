/**
 * コピースクリプトのエントリーポイント
 * 使用方法: bun run scripts/backup.ts [オプション]
 */
import { main } from "../src/copyScript/index.ts"

main().catch((error) => {
  console.error("予期せぬエラーが発生しました:", error)
  process.exit(1)
})
