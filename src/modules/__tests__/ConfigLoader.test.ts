import { join } from 'node:path';

import { describe, test, expect, beforeEach, afterEach } from 'bun:test';

import type { ResolvedConfig } from '../../types/config.ts';
import {
  loadConfig,
  validateBackupConfig,
  validateRestoreConfig,
  DEFAULT_CONFIG_PATH,
  DEFAULT_CONFIG_PATHS,
  getConfigFileExtension,
  findDefaultConfigPath,
} from '../ConfigLoader.ts';

import {
  createTempDir,
  cleanupTempDir,
  createTestFiles,
} from './helpers/tempDir.ts';

describe('ConfigLoader', () => {
  // =====================
  // 定数のテスト
  // =====================
  describe('定数', () => {
    test('DEFAULT_CONFIG_PATH が正しく定義されている', () => {
      expect(DEFAULT_CONFIG_PATH).toBe('backupper.config.ts');
    });

    test('DEFAULT_CONFIG_PATHS が正しい優先順位で定義されている', () => {
      expect(DEFAULT_CONFIG_PATHS).toEqual([
        'backupper.config.ts',
        'backupper.config.json',
      ]);
    });
  });

  // =====================
  // getConfigFileExtension
  // =====================
  describe('getConfigFileExtension', () => {
    test('.ts ファイルの場合 ".ts" を返す', () => {
      expect(getConfigFileExtension('config.ts')).toBe('.ts');
      expect(getConfigFileExtension('/path/to/backupper.config.ts')).toBe('.ts');
    });

    test('.json ファイルの場合 ".json" を返す', () => {
      expect(getConfigFileExtension('config.json')).toBe('.json');
      expect(getConfigFileExtension('/path/to/backupper.config.json')).toBe('.json');
    });

    test('未対応の拡張子の場合 null を返す', () => {
      expect(getConfigFileExtension('config.js')).toBeNull();
      expect(getConfigFileExtension('config.yaml')).toBeNull();
      expect(getConfigFileExtension('config.yml')).toBeNull();
      expect(getConfigFileExtension('config')).toBeNull();
    });
  });

  // =====================
  // findDefaultConfigPath
  // =====================
  describe('findDefaultConfigPath', () => {
    let tempDir: string;
    let originalCwd: string;

    beforeEach(() => {
      tempDir = createTempDir('find-config-test-');
      originalCwd = process.cwd();
      process.chdir(tempDir);
    });

    afterEach(() => {
      process.chdir(originalCwd);
      cleanupTempDir(tempDir);
    });

    test('.ts ファイルのみ存在する場合 .ts パスを返す', () => {
      createTestFiles(tempDir, {
        'backupper.config.ts': 'export default {}',
      });

      expect(findDefaultConfigPath()).toBe('backupper.config.ts');
    });

    test('.json ファイルのみ存在する場合 .json パスを返す', () => {
      createTestFiles(tempDir, {
        'backupper.config.json': '{}',
      });

      expect(findDefaultConfigPath()).toBe('backupper.config.json');
    });

    test('両方存在する場合 .ts を優先する', () => {
      createTestFiles(tempDir, {
        'backupper.config.ts': 'export default {}',
        'backupper.config.json': '{}',
      });

      expect(findDefaultConfigPath()).toBe('backupper.config.ts');
    });

    test('どちらも存在しない場合 null を返す', () => {
      expect(findDefaultConfigPath()).toBeNull();
    });
  });

  // =====================
  // loadConfig
  // =====================
  describe('loadConfig', () => {
    let tempDir: string;

    beforeEach(() => {
      tempDir = createTempDir('config-loader-test-');
    });

    afterEach(() => {
      cleanupTempDir(tempDir);
    });

    test('存在しないファイルの場合エラーをスローする', async () => {
      const nonexistentPath = join(tempDir, 'nonexistent.ts');

      await expect(loadConfig(nonexistentPath)).rejects.toThrow(
        `設定ファイルが見つかりません: ${nonexistentPath}`,
      );
    });

    test('存在するファイルから config を読み込む', async () => {
      const configContent = `
export const config = {
  source: "/test/base",
  destination: "./files",
  includes: ["src/"],
  excludes: ["node_modules/"],
}
`;
      createTestFiles(tempDir, {
        'valid-config.ts': configContent,
      });

      const result = await loadConfig(join(tempDir, 'valid-config.ts'));
      expect(result).toEqual({
        source: '/test/base',
        destination: './files',
        includes: ['src/'],
        excludes: ['node_modules/'],
      });
    });

    test('config がエクスポートされていない場合エラーをスローする', async () => {
      const configContent = `
export const settings = {
  source: "/test/base",
  destination: "./files",
  includes: ["src/"],
  excludes: [],
}
`;
      createTestFiles(tempDir, {
        'no-config-export.ts': configContent,
      });

      const configPath = join(tempDir, 'no-config-export.ts');
      await expect(loadConfig(configPath)).rejects.toThrow(
        `設定ファイルに config がエクスポートされていません: ${configPath}`,
      );
    });

    test('default エクスポートから config を読み込む', async () => {
      const configContent = `
export default {
  source: "/test/default-export",
  destination: "./files",
  includes: ["lib/"],
  excludes: ["dist/"],
}
`;
      createTestFiles(tempDir, {
        'default-export-config.ts': configContent,
      });

      const result = await loadConfig(join(tempDir, 'default-export-config.ts'));
      expect(result).toEqual({
        source: '/test/default-export',
        destination: './files',
        includes: ['lib/'],
        excludes: ['dist/'],
      });
    });

    test('default と config の両方がある場合、default を優先する', async () => {
      const configContent = `
export default {
  source: "/test/default-wins",
  destination: "./default-files",
  includes: ["default/"],
  excludes: [],
}

export const config = {
  source: "/test/named-export",
  destination: "./named-files",
  includes: ["named/"],
  excludes: [],
}
`;
      createTestFiles(tempDir, {
        'both-exports-config.ts': configContent,
      });

      const result = await loadConfig(join(tempDir, 'both-exports-config.ts'));
      expect(result.source).toBe('/test/default-wins');
      expect(result.destination).toBe('./default-files');
    });

    test('default も config もない場合、ヒント付きエラーをスローする', async () => {
      const configContent = `
export const settings = {
  source: "/test/base",
  destination: "./files",
  includes: ["src/"],
  excludes: [],
}
`;
      createTestFiles(tempDir, {
        'no-valid-export.ts': configContent,
      });

      const configPath = join(tempDir, 'no-valid-export.ts');
      await expect(loadConfig(configPath)).rejects.toThrow(
        /ヒント: 'export default defineConfig\(\{ \.\.\. \}\)' または 'export const config = \{ \.\.\. \}' の形式でエクスポートしてください/,
      );
    });

    test('相対パスを絶対パスに解決して読み込む', async () => {
      const configContent = `
export const config = {
  source: "/resolved/path",
  destination: "./out",
  includes: [],
  excludes: [],
}
`;
      createTestFiles(tempDir, {
        'relative-config.ts': configContent,
      });

      // 相対パスでも読み込めることを確認
      const absolutePath = join(tempDir, 'relative-config.ts');
      const result = await loadConfig(absolutePath);
      expect(result.source).toBe('/resolved/path');
    });

    test('source 未指定時に process.cwd() が使用される', async () => {
      const configContent = `
export default {
  destination: "./files",
  includes: ["src/"],
  excludes: [],
}
`;
      createTestFiles(tempDir, {
        'no-source-config.ts': configContent,
      });

      const result = await loadConfig(join(tempDir, 'no-source-config.ts'));
      expect(result.source).toBe(process.cwd());
    });

    test('source 明示指定時はその値が使用される', async () => {
      const configContent = `
export default {
  source: "/explicit/source/path",
  destination: "./files",
  includes: ["src/"],
  excludes: [],
}
`;
      createTestFiles(tempDir, {
        'explicit-source-config.ts': configContent,
      });

      const result = await loadConfig(join(tempDir, 'explicit-source-config.ts'));
      expect(result.source).toBe('/explicit/source/path');
    });

    test('名前付きエクスポートで source 省略時も process.cwd() が使用される', async () => {
      const configContent = `
export const config = {
  destination: "./files",
  includes: ["lib/"],
  excludes: [],
}
`;
      createTestFiles(tempDir, {
        'named-no-source-config.ts': configContent,
      });

      const result = await loadConfig(join(tempDir, 'named-no-source-config.ts'));
      expect(result.source).toBe(process.cwd());
    });

    test('空文字 source は空文字のまま（?? は null/undefined のみ置換）', async () => {
      const configContent = `
export default {
  source: "",
  destination: "./files",
  includes: [],
  excludes: [],
}
`;
      createTestFiles(tempDir, {
        'empty-source-config.ts': configContent,
      });

      const result = await loadConfig(join(tempDir, 'empty-source-config.ts'));
      // ?? 演算子は null/undefined のみ置換するので、空文字はそのまま
      expect(result.source).toBe('');
    });

    test('対応していない拡張子の場合エラーをスローする', async () => {
      createTestFiles(tempDir, {
        'config.yaml': 'destination: ./files',
      });

      await expect(loadConfig(join(tempDir, 'config.yaml'))).rejects.toThrow(
        /対応していない設定ファイル形式です.*\n対応形式: \.ts, \.json/,
      );
    });
  });

  // =====================
  // loadConfig (JSON)
  // =====================
  describe('loadConfig (JSON)', () => {
    let tempDir: string;

    beforeEach(() => {
      tempDir = createTempDir('json-config-test-');
    });

    afterEach(() => {
      cleanupTempDir(tempDir);
    });

    test('有効な JSON 設定ファイルを読み込む', async () => {
      const jsonConfig = JSON.stringify({
        destination: './files',
        includes: ['src/'],
        excludes: ['node_modules/'],
      });
      createTestFiles(tempDir, {
        'config.json': jsonConfig,
      });

      const result = await loadConfig(join(tempDir, 'config.json'));
      expect(result).toEqual({
        source: process.cwd(),
        destination: './files',
        includes: ['src/'],
        excludes: ['node_modules/'],
      });
    });

    test('source 指定ありの JSON 設定を読み込む', async () => {
      const jsonConfig = JSON.stringify({
        source: '/custom/source',
        destination: './files',
        includes: ['src/'],
        excludes: [],
      });
      createTestFiles(tempDir, {
        'config.json': jsonConfig,
      });

      const result = await loadConfig(join(tempDir, 'config.json'));
      expect(result.source).toBe('/custom/source');
    });

    test('backup オプション付きの JSON 設定を読み込む', async () => {
      const jsonConfig = JSON.stringify({
        destination: './files',
        includes: ['src/'],
        excludes: [],
        backup: {
          sync: true,
        },
      });
      createTestFiles(tempDir, {
        'config.json': jsonConfig,
      });

      const result = await loadConfig(join(tempDir, 'config.json'));
      expect(result.backup?.sync).toBe(true);
    });

    test('restore オプション付きの JSON 設定を読み込む', async () => {
      const jsonConfig = JSON.stringify({
        destination: './files',
        includes: ['src/'],
        excludes: [],
        restore: {
          preserveOriginal: true,
        },
      });
      createTestFiles(tempDir, {
        'config.json': jsonConfig,
      });

      const result = await loadConfig(join(tempDir, 'config.json'));
      expect(result.restore?.preserveOriginal).toBe(true);
    });

    test('postRunActions 付きの JSON 設定を読み込む', async () => {
      const jsonConfig = JSON.stringify({
        destination: './files',
        includes: ['src/'],
        excludes: [],
        backup: {
          postRunActions: [
            { command: 'git', args: ['add', '-A'] },
            { command: 'git', args: ['commit', '-m', 'backup'], env: { GIT_AUTHOR_NAME: 'test' } },
          ],
        },
      });
      createTestFiles(tempDir, {
        'config.json': jsonConfig,
      });

      const result = await loadConfig(join(tempDir, 'config.json'));
      expect(result.backup?.postRunActions).toEqual([
        { command: 'git', args: ['add', '-A'] },
        { command: 'git', args: ['commit', '-m', 'backup'], env: { GIT_AUTHOR_NAME: 'test' } },
      ]);
    });

    test('cwd 付きの postRunActions を読み込む', async () => {
      const jsonConfig = JSON.stringify({
        destination: './files',
        includes: ['src/'],
        excludes: [],
        backup: {
          postRunActions: [
            { command: 'npm', args: ['run', 'build'], cwd: '/custom/cwd' },
          ],
        },
      });
      createTestFiles(tempDir, {
        'config.json': jsonConfig,
      });

      const result = await loadConfig(join(tempDir, 'config.json'));
      expect(result.backup?.postRunActions?.[0]?.cwd).toBe('/custom/cwd');
    });

    // JSON バリデーションエラーのテスト
    test('不正な JSON 構文の場合エラーをスローする', async () => {
      createTestFiles(tempDir, {
        'invalid.json': '{ destination: "no quotes" }',
      });

      await expect(loadConfig(join(tempDir, 'invalid.json'))).rejects.toThrow(
        /設定ファイルの JSON が不正です/,
      );
    });

    test('destination が未定義の場合エラーをスローする', async () => {
      const jsonConfig = JSON.stringify({
        includes: ['src/'],
        excludes: [],
      });
      createTestFiles(tempDir, {
        'no-dest.json': jsonConfig,
      });

      await expect(loadConfig(join(tempDir, 'no-dest.json'))).rejects.toThrow(
        'destination は必須の文字列フィールドです',
      );
    });

    test('destination が文字列でない場合エラーをスローする', async () => {
      const jsonConfig = JSON.stringify({
        destination: 123,
        includes: ['src/'],
        excludes: [],
      });
      createTestFiles(tempDir, {
        'invalid-dest.json': jsonConfig,
      });

      await expect(loadConfig(join(tempDir, 'invalid-dest.json'))).rejects.toThrow(
        'destination は必須の文字列フィールドです',
      );
    });

    test('includes が未定義の場合エラーをスローする', async () => {
      const jsonConfig = JSON.stringify({
        destination: './files',
        excludes: [],
      });
      createTestFiles(tempDir, {
        'no-includes.json': jsonConfig,
      });

      await expect(loadConfig(join(tempDir, 'no-includes.json'))).rejects.toThrow(
        'includes は必須の文字列配列です',
      );
    });

    test('includes が配列でない場合エラーをスローする', async () => {
      const jsonConfig = JSON.stringify({
        destination: './files',
        includes: 'src/',
        excludes: [],
      });
      createTestFiles(tempDir, {
        'invalid-includes.json': jsonConfig,
      });

      await expect(loadConfig(join(tempDir, 'invalid-includes.json'))).rejects.toThrow(
        'includes は必須の文字列配列です',
      );
    });

    test('includes に文字列以外が含まれる場合エラーをスローする', async () => {
      const jsonConfig = JSON.stringify({
        destination: './files',
        includes: ['src/', 123],
        excludes: [],
      });
      createTestFiles(tempDir, {
        'invalid-includes-item.json': jsonConfig,
      });

      await expect(loadConfig(join(tempDir, 'invalid-includes-item.json'))).rejects.toThrow(
        'includes は必須の文字列配列です',
      );
    });

    test('excludes が未定義の場合エラーをスローする', async () => {
      const jsonConfig = JSON.stringify({
        destination: './files',
        includes: ['src/'],
      });
      createTestFiles(tempDir, {
        'no-excludes.json': jsonConfig,
      });

      await expect(loadConfig(join(tempDir, 'no-excludes.json'))).rejects.toThrow(
        'excludes は必須の文字列配列です',
      );
    });

    test('source が文字列でない場合エラーをスローする', async () => {
      const jsonConfig = JSON.stringify({
        source: 123,
        destination: './files',
        includes: ['src/'],
        excludes: [],
      });
      createTestFiles(tempDir, {
        'invalid-source.json': jsonConfig,
      });

      await expect(loadConfig(join(tempDir, 'invalid-source.json'))).rejects.toThrow(
        'source は文字列である必要があります',
      );
    });

    test('backup がオブジェクトでない場合エラーをスローする', async () => {
      const jsonConfig = JSON.stringify({
        destination: './files',
        includes: ['src/'],
        excludes: [],
        backup: 'invalid',
      });
      createTestFiles(tempDir, {
        'invalid-backup.json': jsonConfig,
      });

      await expect(loadConfig(join(tempDir, 'invalid-backup.json'))).rejects.toThrow(
        'backup はオブジェクトである必要があります',
      );
    });

    test('backup.sync が boolean でない場合エラーをスローする', async () => {
      const jsonConfig = JSON.stringify({
        destination: './files',
        includes: ['src/'],
        excludes: [],
        backup: {
          sync: 'yes',
        },
      });
      createTestFiles(tempDir, {
        'invalid-sync.json': jsonConfig,
      });

      await expect(loadConfig(join(tempDir, 'invalid-sync.json'))).rejects.toThrow(
        'backup.sync は boolean である必要があります',
      );
    });

    test('restore がオブジェクトでない場合エラーをスローする', async () => {
      const jsonConfig = JSON.stringify({
        destination: './files',
        includes: ['src/'],
        excludes: [],
        restore: [],
      });
      createTestFiles(tempDir, {
        'invalid-restore.json': jsonConfig,
      });

      await expect(loadConfig(join(tempDir, 'invalid-restore.json'))).rejects.toThrow(
        'restore はオブジェクトである必要があります',
      );
    });

    test('restore.preserveOriginal が boolean でない場合エラーをスローする', async () => {
      const jsonConfig = JSON.stringify({
        destination: './files',
        includes: ['src/'],
        excludes: [],
        restore: {
          preserveOriginal: 1,
        },
      });
      createTestFiles(tempDir, {
        'invalid-preserve.json': jsonConfig,
      });

      await expect(loadConfig(join(tempDir, 'invalid-preserve.json'))).rejects.toThrow(
        'restore.preserveOriginal は boolean である必要があります',
      );
    });

    test('postRunActions が配列でない場合エラーをスローする', async () => {
      const jsonConfig = JSON.stringify({
        destination: './files',
        includes: ['src/'],
        excludes: [],
        backup: {
          postRunActions: {},
        },
      });
      createTestFiles(tempDir, {
        'invalid-actions.json': jsonConfig,
      });

      await expect(loadConfig(join(tempDir, 'invalid-actions.json'))).rejects.toThrow(
        'backup.postRunActions は配列である必要があります',
      );
    });

    test('postRunActions の要素がオブジェクトでない場合エラーをスローする', async () => {
      const jsonConfig = JSON.stringify({
        destination: './files',
        includes: ['src/'],
        excludes: [],
        backup: {
          postRunActions: ['git add -A'],
        },
      });
      createTestFiles(tempDir, {
        'invalid-action-type.json': jsonConfig,
      });

      await expect(loadConfig(join(tempDir, 'invalid-action-type.json'))).rejects.toThrow(
        'backup.postRunActions[0] はオブジェクトである必要があります',
      );
    });

    test('postRunActions.command が文字列でない場合エラーをスローする', async () => {
      const jsonConfig = JSON.stringify({
        destination: './files',
        includes: ['src/'],
        excludes: [],
        backup: {
          postRunActions: [
            { command: 123, args: ['add'] },
          ],
        },
      });
      createTestFiles(tempDir, {
        'invalid-action-cmd.json': jsonConfig,
      });

      await expect(loadConfig(join(tempDir, 'invalid-action-cmd.json'))).rejects.toThrow(
        'backup.postRunActions[0].command は文字列である必要があります',
      );
    });

    test('postRunActions.args が文字列配列でない場合エラーをスローする', async () => {
      const jsonConfig = JSON.stringify({
        destination: './files',
        includes: ['src/'],
        excludes: [],
        backup: {
          postRunActions: [
            { command: 'git', args: 'add -A' },
          ],
        },
      });
      createTestFiles(tempDir, {
        'invalid-action-args.json': jsonConfig,
      });

      await expect(loadConfig(join(tempDir, 'invalid-action-args.json'))).rejects.toThrow(
        'backup.postRunActions[0].args は文字列配列である必要があります',
      );
    });

    test('postRunActions.env が文字列オブジェクトでない場合エラーをスローする', async () => {
      const jsonConfig = JSON.stringify({
        destination: './files',
        includes: ['src/'],
        excludes: [],
        backup: {
          postRunActions: [
            { command: 'git', args: ['add'], env: { KEY: 123 } },
          ],
        },
      });
      createTestFiles(tempDir, {
        'invalid-action-env.json': jsonConfig,
      });

      await expect(loadConfig(join(tempDir, 'invalid-action-env.json'))).rejects.toThrow(
        'backup.postRunActions[0].env は文字列のオブジェクトである必要があります',
      );
    });

    test('postRunActions.cwd が文字列でない場合エラーをスローする', async () => {
      const jsonConfig = JSON.stringify({
        destination: './files',
        includes: ['src/'],
        excludes: [],
        backup: {
          postRunActions: [
            { command: 'git', args: ['add'], cwd: 123 },
          ],
        },
      });
      createTestFiles(tempDir, {
        'invalid-action-cwd.json': jsonConfig,
      });

      await expect(loadConfig(join(tempDir, 'invalid-action-cwd.json'))).rejects.toThrow(
        'backup.postRunActions[0].cwd は文字列である必要があります',
      );
    });

    test('設定がオブジェクトでない場合エラーをスローする', async () => {
      createTestFiles(tempDir, {
        'array.json': '[]',
      });

      await expect(loadConfig(join(tempDir, 'array.json'))).rejects.toThrow(
        '設定は JSON オブジェクトである必要があります',
      );
    });

    test('設定が null の場合エラーをスローする', async () => {
      createTestFiles(tempDir, {
        'null.json': 'null',
      });

      await expect(loadConfig(join(tempDir, 'null.json'))).rejects.toThrow(
        '設定は JSON オブジェクトである必要があります',
      );
    });
  });

  // =====================
  // validateBackupConfig
  // =====================
  describe('validateBackupConfig', () => {
    let tempDir: string;

    beforeEach(() => {
      tempDir = createTempDir('validate-config-test-');
    });

    afterEach(() => {
      cleanupTempDir(tempDir);
    });

    test('有効な設定の場合、エラーをスローしない', () => {
      const validConfig: ResolvedConfig = {
        source: tempDir, // 存在するディレクトリ
        destination: './files',
        includes: ['src/'],
        excludes: [],
      };

      expect(() => validateBackupConfig(validConfig)).not.toThrow();
    });

    test('base が存在しない場合、エラーをスローする', () => {
      const invalidConfig: ResolvedConfig = {
        source: '/nonexistent/path/to/base',
        destination: './files',
        includes: ['src/'],
        excludes: [],
      };

      expect(() => validateBackupConfig(invalidConfig)).toThrow(
        'ベースパスが存在しません: /nonexistent/path/to/base',
      );
    });

    test('outputDir が空文字の場合、エラーをスローする', () => {
      const invalidConfig: ResolvedConfig = {
        source: tempDir,
        destination: '',
        includes: ['src/'],
        excludes: [],
      };

      expect(() => validateBackupConfig(invalidConfig)).toThrow(
        'outputDir が指定されていません',
      );
    });

    test('outputDir が空白のみの場合、エラーをスローする', () => {
      const invalidConfig: ResolvedConfig = {
        source: tempDir,
        destination: '   ',
        includes: ['src/'],
        excludes: [],
      };

      expect(() => validateBackupConfig(invalidConfig)).toThrow(
        'outputDir が指定されていません',
      );
    });
  });

  // =====================
  // validateRestoreConfig
  // =====================
  describe('validateRestoreConfig', () => {
    let tempDir: string;

    beforeEach(() => {
      tempDir = createTempDir('validate-restore-test-');
    });

    afterEach(() => {
      cleanupTempDir(tempDir);
    });

    test('有効な設定の場合、エラーをスローしない', () => {
      // base と outputDir の両方が存在する
      createTestFiles(tempDir, {
        'base/.gitkeep': '',
        'files/.gitkeep': '',
      });

      const validConfig: ResolvedConfig = {
        source: join(tempDir, 'base'),
        destination: join(tempDir, 'files'),
        includes: ['src/'],
        excludes: [],
      };

      expect(() => validateRestoreConfig(validConfig)).not.toThrow();
    });

    test('base が存在しない場合、エラーをスローする', () => {
      createTestFiles(tempDir, {
        'files/.gitkeep': '',
      });

      const invalidConfig: ResolvedConfig = {
        source: '/nonexistent/base/path',
        destination: join(tempDir, 'files'),
        includes: ['src/'],
        excludes: [],
      };

      expect(() => validateRestoreConfig(invalidConfig)).toThrow(
        'ベースパスが存在しません: /nonexistent/base/path',
      );
    });

    test('outputDir が空文字の場合、エラーをスローする', () => {
      createTestFiles(tempDir, {
        'base/.gitkeep': '',
      });

      const invalidConfig: ResolvedConfig = {
        source: join(tempDir, 'base'),
        destination: '',
        includes: ['src/'],
        excludes: [],
      };

      expect(() => validateRestoreConfig(invalidConfig)).toThrow(
        'outputDir が指定されていません',
      );
    });

    test('outputDir が存在しない場合、エラーをスローする', () => {
      createTestFiles(tempDir, {
        'base/.gitkeep': '',
      });

      const invalidConfig: ResolvedConfig = {
        source: join(tempDir, 'base'),
        destination: join(tempDir, 'nonexistent-output'),
        includes: ['src/'],
        excludes: [],
      };

      expect(() => validateRestoreConfig(invalidConfig)).toThrow(
        `出力ディレクトリが存在しません: ${join(tempDir, 'nonexistent-output')}`,
      );
    });

    test('outputDir が空白のみの場合、エラーをスローする', () => {
      createTestFiles(tempDir, {
        'base/.gitkeep': '',
      });

      const invalidConfig: ResolvedConfig = {
        source: join(tempDir, 'base'),
        destination: '   ',
        includes: ['src/'],
        excludes: [],
      };

      expect(() => validateRestoreConfig(invalidConfig)).toThrow(
        'outputDir が指定されていません',
      );
    });
  });
});
