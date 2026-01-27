import { afterEach, beforeEach, describe, expect, it, spyOn, type Mock } from 'bun:test';

import {
  logHelp,
  logError,
  logScriptStart,
  logTargetFileCount,
  logDeleteTargetCount,
  logInfo,
  logCancelled,
  logEmptyLine,
  logSeparator,
  logActionStart,
  logActionSuccess,
  logActionFailure,
  logActionError,
  logPostActionsStart,
  logResult,
  logSummary,
  logRestoreFileList,
  logDryRunFileList,
  logDeleteResult,
  logSyncSummary,
} from './Logger.ts';

describe('Logger', () => {
  let consoleLogSpy: Mock<typeof console.log>;
  let consoleErrorSpy: Mock<typeof console.error>;

  beforeEach(() => {
    consoleLogSpy = spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  // ============================================
  // 汎用ログ関数のテスト
  // ============================================

  describe('logHelp', () => {
    it('使用方法のみを出力する', () => {
      logHelp({ usage: 'bun run cli' });

      expect(consoleLogSpy).toHaveBeenCalledWith('使用方法: bun run cli');
    });

    it('説明文付きでヘルプを出力する', () => {
      logHelp({
        usage: 'bun run cli',
        description: 'テストツール',
      });

      expect(consoleLogSpy).toHaveBeenCalledWith(
        'テストツール\n\n使用方法: bun run cli',
      );
    });

    it('コマンド一覧を出力する', () => {
      logHelp({
        usage: 'bun run cli <コマンド>',
        commands: [
          { name: 'backup', description: 'バックアップを実行' },
          { name: 'restore', description: 'リストアを実行' },
        ],
      });

      expect(consoleLogSpy).toHaveBeenCalledWith(
        '使用方法: bun run cli <コマンド>\n\n'
        + 'コマンド:\n'
        + '  backup   バックアップを実行\n'
        + '  restore  リストアを実行',
      );
    });

    it('オプション一覧を出力する', () => {
      logHelp({
        usage: 'bun run cli [オプション]',
        options: [
          { name: '--config, -c <path>', description: '設定ファイルのパス' },
          { name: '--help, -h', description: 'ヘルプを表示' },
        ],
      });

      expect(consoleLogSpy).toHaveBeenCalledWith(
        '使用方法: bun run cli [オプション]\n\n'
        + 'オプション:\n'
        + '  --config, -c <path>  設定ファイルのパス\n'
        + '  --help, -h           ヘルプを表示',
      );
    });

    it('フッターを出力する', () => {
      logHelp({
        usage: 'bun run cli',
        footer: '詳細は --help を参照',
      });

      expect(consoleLogSpy).toHaveBeenCalledWith(
        '使用方法: bun run cli\n\n詳細は --help を参照',
      );
    });

    it('全ての項目を含むヘルプを出力する', () => {
      logHelp({
        usage: 'bun run cli <コマンド> [オプション]',
        description: 'ファイルバックアップツール',
        commands: [
          { name: 'backup', description: 'バックアップを実行' },
        ],
        options: [
          { name: '--help, -h', description: 'ヘルプを表示' },
        ],
        footer: '各コマンドの詳細:\n  bun run cli backup --help',
      });

      expect(consoleLogSpy).toHaveBeenCalledWith(
        'ファイルバックアップツール\n\n'
        + '使用方法: bun run cli <コマンド> [オプション]\n\n'
        + 'コマンド:\n'
        + '  backup  バックアップを実行\n\n'
        + 'オプション:\n'
        + '  --help, -h  ヘルプを表示\n\n'
        + '各コマンドの詳細:\n  bun run cli backup --help',
      );
    });
  });

  describe('logError', () => {
    it('エラーメッセージを出力する', () => {
      logError('ファイルが見つかりません');

      expect(consoleErrorSpy).toHaveBeenCalledWith('エラー: ファイルが見つかりません');
    });
  });

  describe('logScriptStart', () => {
    it('コピースクリプト開始メッセージを出力する', () => {
      logScriptStart('コピー', 'backupper.config.ts');

      expect(consoleLogSpy).toHaveBeenCalledWith('コピースクリプトを開始します...');
      expect(consoleLogSpy).toHaveBeenCalledWith('設定ファイル: backupper.config.ts');
      expect(consoleLogSpy).toHaveBeenCalledWith('');
    });

    it('リストアスクリプト開始メッセージを出力する', () => {
      logScriptStart('リストア', 'custom.config.ts');

      expect(consoleLogSpy).toHaveBeenCalledWith('リストアスクリプトを開始します...');
      expect(consoleLogSpy).toHaveBeenCalledWith('設定ファイル: custom.config.ts');
      expect(consoleLogSpy).toHaveBeenCalledWith('');
    });
  });

  describe('logTargetFileCount', () => {
    it('対象ファイル数を出力する', () => {
      logTargetFileCount(5);

      expect(consoleLogSpy).toHaveBeenCalledWith('対象ファイル数: 5');
      expect(consoleLogSpy).toHaveBeenCalledWith('');
    });
  });

  describe('logDeleteTargetCount', () => {
    it('削除対象ファイル数を出力する', () => {
      logDeleteTargetCount(3);

      expect(consoleLogSpy).toHaveBeenCalledWith('');
      expect(consoleLogSpy).toHaveBeenCalledWith('削除対象ファイル数: 3');
    });
  });

  describe('logInfo', () => {
    it('情報メッセージを出力する', () => {
      logInfo('リストア対象のファイルがありません。');

      expect(consoleLogSpy).toHaveBeenCalledWith('リストア対象のファイルがありません。');
    });
  });

  describe('logCancelled', () => {
    it('キャンセル通知を出力する', () => {
      logCancelled();

      expect(consoleLogSpy).toHaveBeenCalledWith('キャンセルされました。');
    });
  });

  describe('logEmptyLine', () => {
    it('空行を出力する', () => {
      logEmptyLine();

      expect(consoleLogSpy).toHaveBeenCalledWith('');
    });
  });

  describe('logSeparator', () => {
    it('セパレータ線を出力する', () => {
      logSeparator();

      expect(consoleLogSpy).toHaveBeenCalledWith('='.repeat(50));
    });
  });

  // ============================================
  // アクション実行ログ関数のテスト
  // ============================================

  describe('logActionStart', () => {
    it('アクション実行開始を出力する', () => {
      logActionStart('git add .');

      expect(consoleLogSpy).toHaveBeenCalledWith('実行中: git add .');
    });
  });

  describe('logActionSuccess', () => {
    it('アクション成功を出力する', () => {
      logActionSuccess('git commit -m "test"');

      expect(consoleLogSpy).toHaveBeenCalledWith('✓ 完了: git commit -m "test"');
    });
  });

  describe('logActionFailure', () => {
    it('終了コード付きでアクション失敗を出力する', () => {
      logActionFailure('git push', 1);

      expect(consoleErrorSpy).toHaveBeenCalledWith('✗ 失敗: git push (終了コード: 1)');
    });

    it('終了コードなしでアクション失敗を出力する', () => {
      logActionFailure('git push');

      expect(consoleErrorSpy).toHaveBeenCalledWith('✗ 失敗: git push');
    });
  });

  describe('logActionError', () => {
    it('アクションエラー詳細を出力する', () => {
      logActionError('コマンドが見つかりません');

      expect(consoleErrorSpy).toHaveBeenCalledWith('  コマンドが見つかりません');
    });
  });

  describe('logPostActionsStart', () => {
    it('後処理開始メッセージを出力する', () => {
      logPostActionsStart();

      expect(consoleLogSpy).toHaveBeenCalledWith('');
      expect(consoleLogSpy).toHaveBeenCalledWith('後処理を実行します...');
    });
  });

  // ============================================
  // コピー/リストア結果ログ関数のテスト
  // ============================================

  describe('logResult', () => {
    it('成功時のコピー結果を出力する', () => {
      logResult({
        success: true,
        source: 'src/index.ts',
        destination: 'files/src/index.ts',
      });

      expect(consoleLogSpy).toHaveBeenCalledWith('✓ src/index.ts → files/src/index.ts');
    });

    it('成功時にバックアップパスを表示する', () => {
      logResult(
        {
          success: true,
          source: 'config.ts',
          destination: '/home/user/config.ts',
        },
        '/home/user/config.ts.bak',
      );

      expect(consoleLogSpy).toHaveBeenCalledWith('✓ config.ts → /home/user/config.ts');
      expect(consoleLogSpy).toHaveBeenCalledWith('  (バックアップ: /home/user/config.ts.bak)');
    });

    it('失敗時のコピー結果を出力する', () => {
      logResult({
        success: false,
        source: 'src/index.ts',
        destination: 'files/src/index.ts',
        error: 'Permission denied',
      });

      expect(consoleErrorSpy).toHaveBeenCalledWith('✗ src/index.ts - Permission denied');
    });
  });

  describe('logSummary', () => {
    it('サマリーを出力する', () => {
      const results = [
        { success: true, source: 'a.ts', destination: 'b.ts' },
        { success: true, source: 'c.ts', destination: 'd.ts' },
        { success: false, source: 'e.ts', destination: 'f.ts', error: 'error' },
      ];

      logSummary(results, 'コピー');

      expect(consoleLogSpy).toHaveBeenCalledWith('');
      expect(consoleLogSpy).toHaveBeenCalledWith('='.repeat(50));
      expect(consoleLogSpy).toHaveBeenCalledWith('コピー完了: 成功 2 件, 失敗 1 件');
    });
  });

  describe('logRestoreFileList', () => {
    it('リストア対象ファイル一覧を表示する', () => {
      const files = [
        { backupPath: 'a.ts', originalPath: '.config/a.ts', isOverwrite: true },
        { backupPath: 'b.ts', originalPath: '.config/b.ts', isOverwrite: false },
      ];

      logRestoreFileList(files);

      expect(consoleLogSpy).toHaveBeenCalledWith('リストア対象:');
      expect(consoleLogSpy).toHaveBeenCalledWith('  [上書き] .config/a.ts');
      expect(consoleLogSpy).toHaveBeenCalledWith('  [新規]   .config/b.ts');
    });
  });

  describe('logDryRunFileList', () => {
    it('ドライラン時のファイル一覧を表示する', () => {
      const files = [
        { backupPath: 'a.ts', originalPath: '.config/a.ts', isOverwrite: true },
        { backupPath: 'b.ts', originalPath: '.config/b.ts', isOverwrite: false },
      ];

      logDryRunFileList(files);

      expect(consoleLogSpy).toHaveBeenCalledWith('[DRY-RUN] 以下のファイルがリストアされます:');
      expect(consoleLogSpy).toHaveBeenCalledWith('  [上書き] .config/a.ts');
      expect(consoleLogSpy).toHaveBeenCalledWith('  [新規]   .config/b.ts');
      expect(consoleLogSpy).toHaveBeenCalledWith('');
      expect(consoleLogSpy).toHaveBeenCalledWith('実際のファイル操作は行われませんでした。');
    });
  });

  describe('logDeleteResult', () => {
    it('削除成功を出力する', () => {
      logDeleteResult({ success: true, path: 'files/old.ts' });

      expect(consoleLogSpy).toHaveBeenCalledWith('✓ 削除: files/old.ts');
    });

    it('削除失敗を出力する', () => {
      logDeleteResult({ success: false, path: 'files/old.ts', error: 'Permission denied' });

      expect(consoleErrorSpy).toHaveBeenCalledWith('✗ 削除失敗: files/old.ts - Permission denied');
    });
  });

  describe('logSyncSummary', () => {
    it('同期サマリーを出力する', () => {
      const copyResults = [
        { success: true, source: 'a.ts', destination: 'b.ts' },
        { success: false, source: 'c.ts', destination: 'd.ts', error: 'error' },
      ];
      const deleteResults = [
        { success: true, path: 'old.ts' },
        { success: true, path: 'old2.ts' },
        { success: false, path: 'old3.ts', error: 'error' },
      ];

      logSyncSummary(copyResults, deleteResults);

      expect(consoleLogSpy).toHaveBeenCalledWith('');
      expect(consoleLogSpy).toHaveBeenCalledWith('='.repeat(50));
      expect(consoleLogSpy).toHaveBeenCalledWith('コピー完了: 成功 1 件, 失敗 1 件');
      expect(consoleLogSpy).toHaveBeenCalledWith('削除完了: 成功 2 件, 失敗 1 件');
    });
  });
});
