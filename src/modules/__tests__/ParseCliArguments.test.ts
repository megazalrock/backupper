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
  parseBackupArgs,
  parseRestoreArgs,
  parseMainArgs,
} from '../ParseCliArguments.ts';

describe('ParseCliArguments', () => {
  let consoleSpy: Mock<typeof console.log>;

  beforeEach(() => {
    consoleSpy = spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  describe('parseBackupArgs', () => {
    test("引数なしでデフォルト値 configPath: 'backupper.config.ts' を返す", () => {
      const result = parseBackupArgs([]);

      expect(result).toEqual({ configPath: 'backupper.config.ts' });
    });

    test('--config オプションで指定したパスを返す', () => {
      const result = parseBackupArgs(['--config', 'custom.ts']);

      expect(result).toEqual({ configPath: 'custom.ts' });
    });

    test('-c 短縮オプションで指定したパスを返す', () => {
      const result = parseBackupArgs(['-c', 'custom.ts']);

      expect(result).toEqual({ configPath: 'custom.ts' });
    });

    test('--help オプションでヘルプを表示し null を返す', () => {
      const result = parseBackupArgs(['--help']);

      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalled();
    });

    test('-h オプションでヘルプを表示し null を返す', () => {
      const result = parseBackupArgs(['-h']);

      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalled();
    });

    test('--config に値がない場合 Error をスローする', () => {
      expect(() => parseBackupArgs(['--config'])).toThrow(
        '--config オプションには設定ファイルのパスが必要です',
      );
    });

    test('--config の次の引数が - で始まる場合 Error をスローする', () => {
      expect(() => parseBackupArgs(['--config', '-c'])).toThrow(
        '--config オプションには設定ファイルのパスが必要です',
      );
    });
  });

  describe('parseRestoreArgs', () => {
    test('引数なしで全デフォルト値を返す', () => {
      const result = parseRestoreArgs([]);

      expect(result).toEqual({
        configPath: 'backupper.config.ts',
        dryRun: false,
        force: false,
      });
    });

    test('--config オプションで指定したパスを返す', () => {
      const result = parseRestoreArgs(['--config', 'custom.ts']);

      expect(result).toEqual({
        configPath: 'custom.ts',
        dryRun: false,
        force: false,
      });
    });

    test('-c 短縮オプションで指定したパスを返す', () => {
      const result = parseRestoreArgs(['-c', 'custom.ts']);

      expect(result).toEqual({
        configPath: 'custom.ts',
        dryRun: false,
        force: false,
      });
    });

    test('--dry-run フラグで dryRun: true を返す', () => {
      const result = parseRestoreArgs(['--dry-run']);

      expect(result).toEqual({
        configPath: 'backupper.config.ts',
        dryRun: true,
        force: false,
      });
    });

    test('--force フラグで force: true を返す', () => {
      const result = parseRestoreArgs(['--force']);

      expect(result).toEqual({
        configPath: 'backupper.config.ts',
        dryRun: false,
        force: true,
      });
    });

    test('-f 短縮フラグで force: true を返す', () => {
      const result = parseRestoreArgs(['-f']);

      expect(result).toEqual({
        configPath: 'backupper.config.ts',
        dryRun: false,
        force: true,
      });
    });

    test('複数オプションの組み合わせで全て正しく設定される', () => {
      const result = parseRestoreArgs([
        '--config',
        'my-config.ts',
        '--dry-run',
        '--force',
      ]);

      expect(result).toEqual({
        configPath: 'my-config.ts',
        dryRun: true,
        force: true,
      });
    });

    test('--help オプションでヘルプを表示し null を返す', () => {
      const result = parseRestoreArgs(['--help']);

      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalled();
    });

    test('-h オプションでヘルプを表示し null を返す', () => {
      const result = parseRestoreArgs(['-h']);

      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalled();
    });

    test('--config に値がない場合 Error をスローする', () => {
      expect(() => parseRestoreArgs(['--config'])).toThrow(
        '--config オプションには設定ファイルのパスが必要です',
      );
    });

    test('--config の次の引数が - で始まる場合 Error をスローする', () => {
      expect(() => parseRestoreArgs(['--config', '--dry-run'])).toThrow(
        '--config オプションには設定ファイルのパスが必要です',
      );
    });
  });

  describe('parseMainArgs', () => {
    test('引数なしでエラーを返す', () => {
      const result = parseMainArgs([]);

      expect(result).toEqual({
        type: 'error',
        message: 'コマンドが指定されていません',
      });
    });

    test('--help オプションで help タイプを返す', () => {
      const result = parseMainArgs(['--help']);

      expect(result).toEqual({ type: 'help' });
    });

    test('-h オプションで help タイプを返す', () => {
      const result = parseMainArgs(['-h']);

      expect(result).toEqual({ type: 'help' });
    });

    test('backup コマンドで subcommand タイプを返す', () => {
      const result = parseMainArgs(['backup']);

      expect(result).toEqual({
        type: 'subcommand',
        command: 'backup',
        args: [],
      });
    });

    test('backup コマンドに続くオプションを args に含める', () => {
      const result = parseMainArgs(['backup', '--config', 'custom.ts']);

      expect(result).toEqual({
        type: 'subcommand',
        command: 'backup',
        args: ['--config', 'custom.ts'],
      });
    });

    test('restore コマンドで subcommand タイプを返す', () => {
      const result = parseMainArgs(['restore']);

      expect(result).toEqual({
        type: 'subcommand',
        command: 'restore',
        args: [],
      });
    });

    test('restore コマンドに続くオプションを args に含める', () => {
      const result = parseMainArgs(['restore', '--dry-run', '--force']);

      expect(result).toEqual({
        type: 'subcommand',
        command: 'restore',
        args: ['--dry-run', '--force'],
      });
    });

    test('不明なコマンドでエラーを返す', () => {
      const result = parseMainArgs(['unknown']);

      expect(result).toEqual({
        type: 'error',
        message: '不明なコマンド: unknown',
      });
    });

    test('不明なコマンド（数字）でエラーを返す', () => {
      const result = parseMainArgs(['123']);

      expect(result).toEqual({
        type: 'error',
        message: '不明なコマンド: 123',
      });
    });
  });
});
