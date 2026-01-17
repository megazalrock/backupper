import { main } from "../src/restoreScript/index.ts"

main().catch((error) => {
  console.error("予期せぬエラーが発生しました:", error)
  process.exit(1)
})
