import { describe, test, expect, beforeEach, afterEach, spyOn, type Mock } from 'bun:test';

import type { CopyResult, RestoreFileInfo } from '../../types/result.ts';
import {
  logResult,
  logSummary,
  logRestoreFileList,
  logDryRunFileList,
} from '../Logger.ts';

describe('Logger', () => {
  let logSpy: Mock<typeof console.log>;
  let errorSpy: Mock<typeof console.error>;

  beforeEach(() => {
    logSpy = spyOn(console, 'log').mockImplementation(() => {});
    errorSpy = spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    logSpy.mockRestore();
    errorSpy.mockRestore();
  });

  describe('logResult', () => {
    test('成功時に ✓ を含むメッセージを console.log で出力', () => {
      const result: CopyResult = {
        success: true,
        source: 'src/index.ts',
        destination: 'files/src/index.ts',
      };

      logResult(result);

      expect(logSpy).toHaveBeenCalledTimes(1);
      expect(logSpy).toHaveBeenCalledWith('✓ src/index.ts → files/src/index.ts');
      expect(errorSpy).not.toHaveBeenCalled();
    });

    test('失敗時に ✗ を含むエラーを console.error で出力', () => {
      const result: CopyResult = {
        success: false,
        source: 'src/missing.ts',
        destination: 'files/src/missing.ts',
        error: 'ファイルが見つかりません',
      };

      logResult(result);

      expect(errorSpy).toHaveBeenCalledTimes(1);
      expect(errorSpy).toHaveBeenCalledWith(
        '✗ src/missing.ts - ファイルが見つかりません',
      );
      expect(logSpy).not.toHaveBeenCalled();
    });

    test('バックアップパス指定時に追加出力', () => {
      const result: CopyResult = {
        success: true,
        source: 'files/src/index.ts',
        destination: 'src/index.ts',
      };
      const backupPath = 'src/index.ts.backup.20240101';

      logResult(result, backupPath);

      expect(logSpy).toHaveBeenCalledTimes(2);
      expect(logSpy).toHaveBeenNthCalledWith(
        1,
        '✓ files/src/index.ts → src/index.ts',
      );
      expect(logSpy).toHaveBeenNthCalledWith(
        2,
        `  (バックアップ: ${backupPath})`,
      );
    });

    test('バックアップパスなしの場合は1回のみ出力', () => {
      const result: CopyResult = {
        success: true,
        source: 'src/app.ts',
        destination: 'files/src/app.ts',
      };

      logResult(result, undefined);

      expect(logSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('logSummary', () => {
    test('成功件数と失敗件数を正しく表示', () => {
      const results: CopyResult[] = [
        { success: true, source: 'a.ts', destination: 'files/a.ts' },
        { success: true, source: 'b.ts', destination: 'files/b.ts' },
        { success: false, source: 'c.ts', destination: 'files/c.ts', error: 'エラー' },
      ];

      logSummary(results, 'コピー');

      expect(logSpy).toHaveBeenCalledWith('コピー完了: 成功 2 件, 失敗 1 件');
    });

    test('区切り線（= x 50）を表示', () => {
      const results: CopyResult[] = [];
      const separator = '='.repeat(50);

      logSummary(results, 'コピー');

      // 2回呼ばれる（前後の区切り線）
      const separatorCalls = logSpy.mock.calls.filter(
        (call) => call[0] === separator,
      );
      expect(separatorCalls.length).toBe(2);
    });

    test('操作タイプ「コピー」を表示', () => {
      const results: CopyResult[] = [
        { success: true, source: 'a.ts', destination: 'files/a.ts' },
      ];

      logSummary(results, 'コピー');

      expect(logSpy).toHaveBeenCalledWith('コピー完了: 成功 1 件, 失敗 0 件');
    });

    test('操作タイプ「リストア」を表示', () => {
      const results: CopyResult[] = [
        { success: true, source: 'files/a.ts', destination: 'a.ts' },
      ];

      logSummary(results, 'リストア');

      expect(logSpy).toHaveBeenCalledWith('リストア完了: 成功 1 件, 失敗 0 件');
    });

    test('空の結果配列でも正しく動作', () => {
      const results: CopyResult[] = [];

      logSummary(results, 'コピー');

      expect(logSpy).toHaveBeenCalledWith('コピー完了: 成功 0 件, 失敗 0 件');
    });

    test('出力順序が正しい（空行 → 区切り線 → 完了メッセージ → 区切り線）', () => {
      const results: CopyResult[] = [
        { success: true, source: 'a.ts', destination: 'files/a.ts' },
      ];

      logSummary(results, 'コピー');

      expect(logSpy).toHaveBeenCalledTimes(4);
      const calls = logSpy.mock.calls;
      // toHaveBeenCalledTimes(4) で呼び出し回数を検証済みのため、インデックスアクセスは安全
      expect(calls[0]?.[0]).toBe('');
      expect(calls[1]?.[0]).toBe('='.repeat(50));
      expect(calls[2]?.[0]).toBe('コピー完了: 成功 1 件, 失敗 0 件');
      expect(calls[3]?.[0]).toBe('='.repeat(50));
    });
  });

  describe('logRestoreFileList', () => {
    test('「リストア対象:」ヘッダを出力', () => {
      const files: RestoreFileInfo[] = [];

      logRestoreFileList(files);

      expect(logSpy).toHaveBeenCalledWith('リストア対象:');
    });

    test('上書きファイルに [上書き] を表示', () => {
      const files: RestoreFileInfo[] = [
        {
          backupPath: 'files/src/index.ts',
          originalPath: 'src/index.ts',
          isOverwrite: true,
        },
      ];

      logRestoreFileList(files);

      expect(logSpy).toHaveBeenCalledWith('  [上書き] src/index.ts');
    });

    test('新規ファイルに [新規]   を表示（末尾空白2つ）', () => {
      const files: RestoreFileInfo[] = [
        {
          backupPath: 'files/src/new.ts',
          originalPath: 'src/new.ts',
          isOverwrite: false,
        },
      ];

      logRestoreFileList(files);

      expect(logSpy).toHaveBeenCalledWith('  [新規]   src/new.ts');
    });

    test('複数ファイルの一覧を正しく表示', () => {
      const files: RestoreFileInfo[] = [
        {
          backupPath: 'files/src/a.ts',
          originalPath: 'src/a.ts',
          isOverwrite: true,
        },
        {
          backupPath: 'files/src/b.ts',
          originalPath: 'src/b.ts',
          isOverwrite: false,
        },
        {
          backupPath: 'files/src/c.ts',
          originalPath: 'src/c.ts',
          isOverwrite: true,
        },
      ];

      logRestoreFileList(files);

      expect(logSpy).toHaveBeenCalledTimes(4); // ヘッダ + 3ファイル
      expect(logSpy).toHaveBeenNthCalledWith(1, 'リストア対象:');
      expect(logSpy).toHaveBeenNthCalledWith(2, '  [上書き] src/a.ts');
      expect(logSpy).toHaveBeenNthCalledWith(3, '  [新規]   src/b.ts');
      expect(logSpy).toHaveBeenNthCalledWith(4, '  [上書き] src/c.ts');
    });
  });

  describe('logDryRunFileList', () => {
    test('DRY-RUN ヘッダを出力', () => {
      const files: RestoreFileInfo[] = [];

      logDryRunFileList(files);

      expect(logSpy).toHaveBeenCalledWith(
        '[DRY-RUN] 以下のファイルがリストアされます:',
      );
    });

    test('ファイル一覧を表示', () => {
      const files: RestoreFileInfo[] = [
        {
          backupPath: 'files/src/index.ts',
          originalPath: 'src/index.ts',
          isOverwrite: true,
        },
      ];

      logDryRunFileList(files);

      expect(logSpy).toHaveBeenCalledWith('  [上書き] src/index.ts');
    });

    test('最後に操作未実行メッセージを出力', () => {
      const files: RestoreFileInfo[] = [];

      logDryRunFileList(files);

      expect(logSpy).toHaveBeenCalledWith(
        '実際のファイル操作は行われませんでした。',
      );
    });

    test('出力順序が正しい（ヘッダ → 一覧 → 空行 → メッセージ）', () => {
      const files: RestoreFileInfo[] = [
        {
          backupPath: 'files/src/app.ts',
          originalPath: 'src/app.ts',
          isOverwrite: false,
        },
      ];

      logDryRunFileList(files);

      expect(logSpy).toHaveBeenCalledTimes(4);
      const calls = logSpy.mock.calls;
      // toHaveBeenCalledTimes(4) で呼び出し回数を検証済みのため、インデックスアクセスは安全
      expect(calls[0]?.[0]).toBe('[DRY-RUN] 以下のファイルがリストアされます:');
      expect(calls[1]?.[0]).toBe('  [新規]   src/app.ts');
      expect(calls[2]?.[0]).toBe('');
      expect(calls[3]?.[0]).toBe('実際のファイル操作は行われませんでした。');
    });
  });
});
