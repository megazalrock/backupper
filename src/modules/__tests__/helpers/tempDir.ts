/**
 * テスト用一時ディレクトリ管理ヘルパー
 */

import { mkdtempSync, rmSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';

/**
 * 一時ディレクトリを作成する
 */
export function createTempDir(prefix = 'backupper-test-'): string {
  return mkdtempSync(join(tmpdir(), prefix));
}

/**
 * 一時ディレクトリを削除する
 */
export function cleanupTempDir(dir: string): void {
  rmSync(dir, { recursive: true, force: true });
}

/**
 * テスト用ファイル構造を作成する
 * @param baseDir ベースディレクトリ
 * @param files ファイルパスと内容のマップ（相対パス → 内容）
 */
export function createTestFiles(
  baseDir: string,
  files: Record<string, string>,
): void {
  for (const [filePath, content] of Object.entries(files)) {
    const fullPath = join(baseDir, filePath);
    const dir = dirname(fullPath);
    mkdirSync(dir, { recursive: true });
    writeFileSync(fullPath, content);
  }
}
