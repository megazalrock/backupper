import { runCli } from "../src/cli/index.ts"

runCli(process.argv.slice(2)).catch((error) => {
  console.error("予期せぬエラー:", error)
  process.exit(1)
})
