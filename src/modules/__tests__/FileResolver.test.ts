import { describe, test, expect, beforeEach, afterEach } from 'bun:test';

import type { Config } from '../../types/config';
import {
  isGlobPattern,
  shouldExclude,
  resolveGlobPattern,
  getFilesRecursively,
  resolveTargetFiles,
  resolveRestoreFiles,
  findOrphanedFiles,
} from '../FileResolver';

import {
  createTempDir,
  cleanupTempDir,
  createTestFiles,
} from './helpers/tempDir';

describe('FileResolver', () => {
  // =====================
  // ユニットテスト
  // =====================
  describe('ユニットテスト', () => {
    describe('isGlobPattern', () => {
      test('* を含む場合 true を返す', () => {
        expect(isGlobPattern('*.ts')).toBe(true);
        expect(isGlobPattern('src/**/*.ts')).toBe(true);
      });

      test('? を含む場合 true を返す', () => {
        expect(isGlobPattern('file?.ts')).toBe(true);
      });

      test('[] を含む場合 true を返す', () => {
        expect(isGlobPattern('[abc].ts')).toBe(true);
        expect(isGlobPattern('file[0-9].ts')).toBe(true);
      });

      test('{} を含む場合 true を返す', () => {
        expect(isGlobPattern('{a,b,c}.ts')).toBe(true);
        expect(isGlobPattern('src/{foo,bar}/*.ts')).toBe(true);
      });

      test('通常のパスの場合 false を返す', () => {
        expect(isGlobPattern('src/index.ts')).toBe(false);
        expect(isGlobPattern('path/to/file.json')).toBe(false);
        expect(isGlobPattern('')).toBe(false);
      });
    });

    describe('shouldExclude', () => {
      test('単純パターンにマッチする場合 true を返す', () => {
        expect(shouldExclude('node_modules/pkg/index.js', ['node_modules'])).toBe(true);
      });

      test('glob パターンにマッチする場合 true を返す', () => {
        expect(shouldExclude('src/test.spec.ts', ['*.spec.ts'])).toBe(true);
        expect(shouldExclude('src/components/Button.test.tsx', ['**/*.test.*'])).toBe(true);
      });

      test('ディレクトリ名がパターンにマッチする場合 true を返す', () => {
        expect(shouldExclude('src/__tests__/foo.ts', ['__tests__'])).toBe(true);
        expect(shouldExclude('deep/nested/__mocks__/bar.js', ['__mocks__'])).toBe(true);
      });

      test('複数パターンのいずれかにマッチする場合 true を返す', () => {
        expect(shouldExclude('dist/bundle.js', ['node_modules', 'dist', '*.log'])).toBe(true);
        expect(shouldExclude('error.log', ['node_modules', 'dist', '*.log'])).toBe(true);
      });

      test('どのパターンにもマッチしない場合 false を返す', () => {
        expect(shouldExclude('src/index.ts', ['node_modules', 'dist'])).toBe(false);
        expect(shouldExclude('package.json', ['*.ts', '*.js'])).toBe(false);
      });
    });
  });

  // =====================
  // インテグレーションテスト
  // =====================
  describe('インテグレーションテスト', () => {
    let tempDir: string;

    beforeEach(() => {
      tempDir = createTempDir();
    });

    afterEach(() => {
      cleanupTempDir(tempDir);
    });

    describe('resolveGlobPattern', () => {
      test('glob パターンでファイルを取得できる', () => {
        createTestFiles(tempDir, {
          'src/index.ts': 'export {}',
          'src/utils.ts': 'export {}',
          'src/helper.js': 'module.exports = {}',
          'readme.md': '# readme',
        });

        const result = resolveGlobPattern('src/*.ts', tempDir);
        expect(result.sort()).toEqual(['src/index.ts', 'src/utils.ts']);
      });

      test('ドットファイルも取得できる（dot: true オプション）', () => {
        createTestFiles(tempDir, {
          '.gitignore': 'node_modules',
          '.env': 'SECRET=xxx',
          'config.ts': 'export {}',
        });

        // * パターンで dot: true が有効なため、ドットファイルも含まれる
        const result = resolveGlobPattern('*', tempDir);
        expect(result.sort()).toEqual(['.env', '.gitignore', 'config.ts']);
      });
    });

    describe('getFilesRecursively', () => {
      test('ディレクトリ内のファイルを再帰的に取得する', () => {
        createTestFiles(tempDir, {
          'src/index.ts': 'export {}',
          'src/lib/util.ts': 'export {}',
          'src/lib/deep/nested.ts': 'export {}',
        });

        const result = getFilesRecursively(`${tempDir}/src`, tempDir);
        expect(result.sort()).toEqual([
          'src/index.ts',
          'src/lib/deep/nested.ts',
          'src/lib/util.ts',
        ]);
      });

      test('存在しないディレクトリの場合は空配列を返す', () => {
        const result = getFilesRecursively(`${tempDir}/nonexistent`, tempDir);
        expect(result).toEqual([]);
      });

      test('ネストしたディレクトリを正しく処理する', () => {
        createTestFiles(tempDir, {
          'a/b/c/d/file.txt': 'content',
          'a/b/another.txt': 'content',
          'a/top.txt': 'content',
        });

        const result = getFilesRecursively(`${tempDir}/a`, tempDir);
        expect(result.sort()).toEqual([
          'a/b/another.txt',
          'a/b/c/d/file.txt',
          'a/top.txt',
        ]);
      });
    });

    describe('resolveTargetFiles', () => {
      test('末尾 / でディレクトリ全体を取得する', () => {
        createTestFiles(tempDir, {
          'src/index.ts': 'export {}',
          'src/utils.ts': 'export {}',
          'other.txt': 'content',
        });

        const config: Config = {
          source: tempDir,
          target: `${tempDir}/output`,
          includes: ['src/'],
          excludes: [],
        };

        const result = resolveTargetFiles(config);
        expect(result.sort()).toEqual(['src/index.ts', 'src/utils.ts']);
      });

      test('glob パターンでファイルを取得する', () => {
        createTestFiles(tempDir, {
          'src/index.ts': 'export {}',
          'src/utils.ts': 'export {}',
          'src/helper.js': 'module.exports = {}',
        });

        const config: Config = {
          source: tempDir,
          target: `${tempDir}/output`,
          includes: ['**/*.ts'],
          excludes: [],
        };

        const result = resolveTargetFiles(config);
        expect(result.sort()).toEqual(['src/index.ts', 'src/utils.ts']);
      });

      test('単一ファイルを取得する', () => {
        createTestFiles(tempDir, {
          'config.json': '{}',
          'package.json': '{}',
        });

        const config: Config = {
          source: tempDir,
          target: `${tempDir}/output`,
          includes: ['config.json'],
          excludes: [],
        };

        const result = resolveTargetFiles(config);
        expect(result).toEqual(['config.json']);
      });

      test('存在しないファイルは無視される', () => {
        createTestFiles(tempDir, {
          'exists.txt': 'content',
        });

        const config: Config = {
          source: tempDir,
          target: `${tempDir}/output`,
          includes: ['exists.txt', 'nonexistent.txt'],
          excludes: [],
        };

        const result = resolveTargetFiles(config);
        expect(result).toEqual(['exists.txt']);
      });
    });

    describe('resolveRestoreFiles', () => {
      test('includes パターンにマッチするファイルを取得する', () => {
        createTestFiles(tempDir, {
          'output/src/index.ts': 'export {}',
          'output/src/utils.ts': 'export {}',
          'output/other.txt': 'content',
        });

        const config: Config = {
          source: `${tempDir}/base`,
          target: `${tempDir}/output`,
          includes: ['src/'],
          excludes: [],
        };

        const result = resolveRestoreFiles(config);
        expect(result.sort()).toEqual(['src/index.ts', 'src/utils.ts']);
      });

      test('excludes パターンが適用される', () => {
        createTestFiles(tempDir, {
          'output/src/index.ts': 'export {}',
          'output/src/index.test.ts': 'test',
          'output/src/utils.ts': 'export {}',
        });

        const config: Config = {
          source: `${tempDir}/base`,
          target: `${tempDir}/output`,
          includes: ['src/'],
          excludes: ['*.test.ts'],
        };

        const result = resolveRestoreFiles(config);
        expect(result.sort()).toEqual(['src/index.ts', 'src/utils.ts']);
      });

      test('dot__ 形式のパスを正しく処理する', () => {
        createTestFiles(tempDir, {
          'output/dot__gitignore': 'node_modules',
          'output/dot__env': 'SECRET=xxx',
          'output/config.json': '{}',
        });

        const config: Config = {
          source: `${tempDir}/base`,
          target: `${tempDir}/output`,
          includes: ['.gitignore', '.env'],
          excludes: [],
        };

        const result = resolveRestoreFiles(config);
        expect(result.sort()).toEqual(['dot__env', 'dot__gitignore']);
      });

      test('glob パターンにマッチするファイルを取得する', () => {
        createTestFiles(tempDir, {
          'output/src/index.ts': 'export {}',
          'output/src/utils.ts': 'export {}',
          'output/src/helper.js': 'module.exports = {}',
        });

        const config: Config = {
          source: `${tempDir}/base`,
          target: `${tempDir}/output`,
          includes: ['**/*.ts'],
          excludes: [],
        };

        const result = resolveRestoreFiles(config);
        expect(result.sort()).toEqual(['src/index.ts', 'src/utils.ts']);
      });
    });

    describe('findOrphanedFiles', () => {
      test('glob パターンで孤児ファイルを検出する', () => {
        createTestFiles(tempDir, {
          'target/index.ts': 'export {}',
          'target/orphan.ts': 'orphan',
        });

        const sourceFiles = ['index.ts'];
        const config: Config = {
          source: `${tempDir}/source`,
          target: `${tempDir}/target`,
          includes: ['**/*.ts'],
          excludes: [],
        };

        const result = findOrphanedFiles(sourceFiles, config);
        expect(result).toEqual(['orphan.ts']);
      });

      test('単一ファイルパターンで孤児ファイルを検出する', () => {
        createTestFiles(tempDir, {
          'target/config.json': '{}',
          'target/orphan.json': '{}',
        });

        const sourceFiles = ['config.json'];
        const config: Config = {
          source: `${tempDir}/source`,
          target: `${tempDir}/target`,
          includes: ['config.json', 'orphan.json'],
          excludes: [],
        };

        const result = findOrphanedFiles(sourceFiles, config);
        expect(result).toEqual(['orphan.json']);
      });
    });
  });
});
