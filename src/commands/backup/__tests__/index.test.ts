import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import {
  describe,
  test,
  expect,
  beforeEach,
  afterEach,
  spyOn,
  type Mock,
} from 'bun:test';

import {
  createTempDir,
  cleanupTempDir,
  createTestFiles,
} from '../../../modules/__tests__/helpers/tempDir.ts';
import { main } from '../index.ts';

describe('commands/backup', () => {
  describe('main', () => {
    let tempDir: string;
    let exitSpy: Mock<typeof process.exit>;
    let consoleLogSpy: Mock<typeof console.log>;
    let consoleErrorSpy: Mock<typeof console.error>;

    beforeEach(() => {
      tempDir = createTempDir('backup-test-');
      exitSpy = spyOn(process, 'exit').mockImplementation(() => {
        throw new Error('process.exit called');
      });
      consoleLogSpy = spyOn(console, 'log').mockImplementation(() => {});
      consoleErrorSpy = spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
      cleanupTempDir(tempDir);
      exitSpy.mockRestore();
      consoleLogSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });

    // =====================
    // 引数解析
    // =====================
    describe('引数解析', () => {
      test('--help オプションで process.exit(0) を呼ぶ', async () => {
        await expect(main(['--help'])).rejects.toThrow('process.exit called');
        expect(exitSpy).toHaveBeenCalledWith(0);
      });

      test('--config オプションで指定した設定ファイルを使用する', async () => {
        // 有効な設定ファイルを作成
        const sourceDir = join(tempDir, 'source');
        const targetDir = join(tempDir, 'target');
        createTestFiles(tempDir, {
          'source/test.txt': 'content',
        });

        const configContent = `
export const config = {
  source: "${sourceDir}",
  target: "${targetDir}",
  includes: ["test.txt"],
  excludes: [],
}
`;
        createTestFiles(tempDir, {
          'test-config.ts': configContent,
        });

        await main(['--config', join(tempDir, 'test-config.ts')]);

        // 設定ファイルが使用されたことを確認
        expect(consoleLogSpy).toHaveBeenCalledWith(
          expect.stringContaining('test-config.ts'),
        );
      });

      test('不正な引数でエラーを出力し process.exit(1) を呼ぶ', async () => {
        // --config に値を渡さない場合
        await expect(main(['--config'])).rejects.toThrow('process.exit called');
        expect(exitSpy).toHaveBeenCalledWith(1);
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          expect.stringContaining('--config'),
        );
      });
    });

    // =====================
    // 設定ファイル読み込み
    // =====================
    describe('設定ファイル読み込み', () => {
      test('存在しない設定ファイルでエラーを出力し process.exit(1) を呼ぶ', async () => {
        const nonexistentPath = join(tempDir, 'nonexistent-config.ts');

        await expect(main(['--config', nonexistentPath])).rejects.toThrow(
          'process.exit called',
        );
        expect(exitSpy).toHaveBeenCalledWith(1);
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          expect.stringContaining('設定ファイルが見つかりません'),
        );
      });
    });

    // =====================
    // ファイルコピー
    // =====================
    describe('ファイルコピー', () => {
      test('includes で指定したファイルをコピーする', async () => {
        const sourceDir = join(tempDir, 'source');
        const targetDir = join(tempDir, 'target');

        createTestFiles(tempDir, {
          'source/file1.txt': 'content1',
          'source/file2.txt': 'content2',
        });

        const configContent = `
export const config = {
  source: "${sourceDir}",
  target: "${targetDir}",
  includes: ["file1.txt", "file2.txt"],
  excludes: [],
}
`;
        createTestFiles(tempDir, { 'config.ts': configContent });

        await main(['--config', join(tempDir, 'config.ts')]);

        expect(existsSync(join(targetDir, 'file1.txt'))).toBe(true);
        expect(existsSync(join(targetDir, 'file2.txt'))).toBe(true);
        expect(readFileSync(join(targetDir, 'file1.txt'), 'utf-8')).toBe(
          'content1',
        );
        expect(readFileSync(join(targetDir, 'file2.txt'), 'utf-8')).toBe(
          'content2',
        );
      });

      test('includes でディレクトリを指定した場合、再帰的にコピーする', async () => {
        const sourceDir = join(tempDir, 'source');
        const targetDir = join(tempDir, 'target');

        createTestFiles(tempDir, {
          'source/src/index.ts': 'export {}',
          'source/src/lib/util.ts': 'export const util = {}',
          'source/src/lib/deep/nested.ts': 'export const nested = {}',
        });

        const configContent = `
export const config = {
  source: "${sourceDir}",
  target: "${targetDir}",
  includes: ["src/"],
  excludes: [],
}
`;
        createTestFiles(tempDir, { 'config.ts': configContent });

        await main(['--config', join(tempDir, 'config.ts')]);

        expect(existsSync(join(targetDir, 'src/index.ts'))).toBe(true);
        expect(existsSync(join(targetDir, 'src/lib/util.ts'))).toBe(true);
        expect(existsSync(join(targetDir, 'src/lib/deep/nested.ts'))).toBe(true);
      });

      test('includes で glob パターンを指定した場合、マッチするファイルをコピーする', async () => {
        const sourceDir = join(tempDir, 'source');
        const targetDir = join(tempDir, 'target');

        createTestFiles(tempDir, {
          'source/src/index.ts': 'export {}',
          'source/src/util.ts': 'export {}',
          'source/src/helper.js': 'module.exports = {}',
        });

        const configContent = `
export const config = {
  source: "${sourceDir}",
  target: "${targetDir}",
  includes: ["**/*.ts"],
  excludes: [],
}
`;
        createTestFiles(tempDir, { 'config.ts': configContent });

        await main(['--config', join(tempDir, 'config.ts')]);

        expect(existsSync(join(targetDir, 'src/index.ts'))).toBe(true);
        expect(existsSync(join(targetDir, 'src/util.ts'))).toBe(true);
        expect(existsSync(join(targetDir, 'src/helper.js'))).toBe(false);
      });

      test('excludes で指定したファイルは除外する', async () => {
        const sourceDir = join(tempDir, 'source');
        const targetDir = join(tempDir, 'target');

        createTestFiles(tempDir, {
          'source/src/index.ts': 'export {}',
          'source/src/index.test.ts': 'test',
          'source/src/__tests__/util.test.ts': 'test',
        });

        const configContent = `
export const config = {
  source: "${sourceDir}",
  target: "${targetDir}",
  includes: ["src/"],
  excludes: ["*.test.ts", "__tests__"],
}
`;
        createTestFiles(tempDir, { 'config.ts': configContent });

        await main(['--config', join(tempDir, 'config.ts')]);

        expect(existsSync(join(targetDir, 'src/index.ts'))).toBe(true);
        expect(existsSync(join(targetDir, 'src/index.test.ts'))).toBe(false);
        expect(existsSync(join(targetDir, 'src/__tests__'))).toBe(false);
      });

      test('ドットファイルを dot__ 形式に変換してコピーする', async () => {
        const sourceDir = join(tempDir, 'source');
        const targetDir = join(tempDir, 'target');

        createTestFiles(tempDir, {
          'source/.gitignore': 'node_modules',
          'source/.env': 'SECRET=xxx',
        });

        const configContent = `
export const config = {
  source: "${sourceDir}",
  target: "${targetDir}",
  includes: [".gitignore", ".env"],
  excludes: [],
}
`;
        createTestFiles(tempDir, { 'config.ts': configContent });

        await main(['--config', join(tempDir, 'config.ts')]);

        expect(existsSync(join(targetDir, 'dot__gitignore'))).toBe(true);
        expect(existsSync(join(targetDir, 'dot__env'))).toBe(true);
        expect(readFileSync(join(targetDir, 'dot__gitignore'), 'utf-8')).toBe(
          'node_modules',
        );
      });

      test('コピー先ディレクトリが存在しない場合は作成する', async () => {
        const sourceDir = join(tempDir, 'source');
        const targetDir = join(tempDir, 'deeply/nested/target');

        createTestFiles(tempDir, {
          'source/file.txt': 'content',
        });

        const configContent = `
export const config = {
  source: "${sourceDir}",
  target: "${targetDir}",
  includes: ["file.txt"],
  excludes: [],
}
`;
        createTestFiles(tempDir, { 'config.ts': configContent });

        expect(existsSync(targetDir)).toBe(false);

        await main(['--config', join(tempDir, 'config.ts')]);

        expect(existsSync(targetDir)).toBe(true);
        expect(existsSync(join(targetDir, 'file.txt'))).toBe(true);
      });
    });

    // =====================
    // 同期モード
    // =====================
    describe('同期モード (config.backup.sync = true)', () => {
      test('ソースに存在しないファイルを削除する', async () => {
        const sourceDir = join(tempDir, 'source');
        const targetDir = join(tempDir, 'target');

        // ソースにはsrc/file1.txtのみ、ターゲットにはsrc/file1.txtとsrc/orphan.txtがある状態
        // findOrphanedFiles は includes パターンの範囲内のファイルのみを削除対象とする
        createTestFiles(tempDir, {
          'source/src/file1.txt': 'content1',
          'target/src/file1.txt': 'old content',
          'target/src/orphan.txt': 'should be deleted',
        });

        const configContent = `
export const config = {
  source: "${sourceDir}",
  target: "${targetDir}",
  includes: ["src/"],
  excludes: [],
  backup: {
    sync: true,
  },
}
`;
        createTestFiles(tempDir, { 'config.ts': configContent });

        await main(['--config', join(tempDir, 'config.ts')]);

        expect(existsSync(join(targetDir, 'src/file1.txt'))).toBe(true);
        expect(existsSync(join(targetDir, 'src/orphan.txt'))).toBe(false);
      });

      test('削除後に空になったディレクトリを削除する', async () => {
        const sourceDir = join(tempDir, 'source');
        const targetDir = join(tempDir, 'target');

        // ソースにはsrc/index.tsのみ、ターゲットにはsrc/index.tsとsrc/old-dir/orphan.tsがある状態
        createTestFiles(tempDir, {
          'source/src/index.ts': 'export {}',
          'target/src/index.ts': 'old export',
          'target/src/old-dir/orphan.ts': 'should be deleted',
        });

        const configContent = `
export const config = {
  source: "${sourceDir}",
  target: "${targetDir}",
  includes: ["src/"],
  excludes: [],
  backup: {
    sync: true,
  },
}
`;
        createTestFiles(tempDir, { 'config.ts': configContent });

        await main(['--config', join(tempDir, 'config.ts')]);

        expect(existsSync(join(targetDir, 'src/index.ts'))).toBe(true);
        expect(existsSync(join(targetDir, 'src/old-dir'))).toBe(false);
      });

      test('ルートディレクトリ(target)は削除しない', async () => {
        const sourceDir = join(tempDir, 'source');
        const targetDir = join(tempDir, 'target');

        // ターゲットには孤児ファイルのみがある状態（includesパターンの範囲内）
        createTestFiles(tempDir, {
          'source/src/keep.txt': 'keep',
          'target/src/orphan.txt': 'should be deleted',
        });

        const configContent = `
export const config = {
  source: "${sourceDir}",
  target: "${targetDir}",
  includes: ["src/"],
  excludes: [],
  backup: {
    sync: true,
  },
}
`;
        createTestFiles(tempDir, { 'config.ts': configContent });

        await main(['--config', join(tempDir, 'config.ts')]);

        // ターゲットディレクトリ自体は残っている
        expect(existsSync(targetDir)).toBe(true);
        // src/keep.txtはコピーされ、src/orphan.txtは削除される
        expect(existsSync(join(targetDir, 'src/keep.txt'))).toBe(true);
        expect(existsSync(join(targetDir, 'src/orphan.txt'))).toBe(false);
      });
    });
  });
});
