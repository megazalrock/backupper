import { describe, test, expect, beforeEach, afterEach, spyOn, type Mock } from 'bun:test';

import type { Action } from '../../types/config';
import { runAction, runPostActions } from '../ActionRunner';

describe('ActionRunner', () => {
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

  describe('runAction', () => {
    test('成功するコマンドで success: true を返す', async () => {
      const action: Action = {
        command: 'echo',
        args: ['hello'],
      };

      const result = await runAction(action, '/tmp');

      expect(result.success).toBe(true);
      expect(result.command).toBe('echo hello');
      expect(result.exitCode).toBe(0);
    });

    test('失敗するコマンドで success: false を返す', async () => {
      const action: Action = {
        command: 'false',
        args: [],
      };

      const result = await runAction(action, '/tmp');

      expect(result.success).toBe(false);
      expect(result.command).toBe('false');
      expect(result.exitCode).toBe(1);
    });

    test('実行中のコマンドをログ出力', async () => {
      const action: Action = {
        command: 'echo',
        args: ['test'],
      };

      await runAction(action, '/tmp');

      expect(logSpy).toHaveBeenCalledWith('実行中: echo test');
    });

    test('成功時に ✓ 完了メッセージをログ出力', async () => {
      const action: Action = {
        command: 'echo',
        args: ['done'],
      };

      await runAction(action, '/tmp');

      expect(logSpy).toHaveBeenCalledWith('✓ 完了: echo done');
    });

    test('失敗時に ✗ 失敗メッセージをログ出力', async () => {
      const action: Action = {
        command: 'false',
        args: [],
      };

      await runAction(action, '/tmp');

      expect(errorSpy).toHaveBeenCalledWith('✗ 失敗: false (終了コード: 1)');
    });

    test('cwd 指定時にそのディレクトリで実行', async () => {
      const action: Action = {
        command: 'pwd',
        args: [],
        cwd: '/tmp',
      };

      const result = await runAction(action, '/home');

      expect(result.success).toBe(true);
    });

    test('cwd 未指定時に defaultCwd で実行される', async () => {
      const { realpathSync } = await import('node:fs');
      const defaultCwd = '/tmp';
      const expectedCwd = realpathSync(defaultCwd); // macOS では /private/tmp
      const testFile = `${expectedCwd}/test_defaultcwd_${Date.now()}.txt`;

      const action: Action = {
        command: 'sh',
        args: ['-c', `pwd > ${testFile}`],
        // cwd を指定しない
      };

      const result = await runAction(action, defaultCwd);

      expect(result.success).toBe(true);

      const output = await Bun.file(testFile).text();
      expect(output.trim()).toBe(expectedCwd);

      // クリーンアップ
      await Bun.spawn(['rm', testFile]).exited;
    });

    test('env 指定時に環境変数がマージされる', async () => {
      const action: Action = {
        command: 'sh',
        args: ['-c', 'echo $TEST_VAR'],
        env: { TEST_VAR: 'test_value' },
      };

      const result = await runAction(action, '/tmp');

      expect(result.success).toBe(true);
    });

    test('存在しないコマンドでエラーを返す', async () => {
      const action: Action = {
        command: 'nonexistent_command_12345',
        args: [],
      };

      const result = await runAction(action, '/tmp');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('runPostActions', () => {
    test('undefined の場合は何もしない', async () => {
      await runPostActions(undefined, '/tmp');

      expect(logSpy).not.toHaveBeenCalled();
    });

    test('空配列の場合は何もしない', async () => {
      await runPostActions([], '/tmp');

      expect(logSpy).not.toHaveBeenCalled();
    });

    test('後処理開始メッセージを出力', async () => {
      const actions: Action[] = [
        { command: 'echo', args: ['test'] },
      ];

      await runPostActions(actions, '/tmp');

      expect(logSpy).toHaveBeenCalledWith('後処理を実行します...');
    });

    test('複数アクションを順次実行', async () => {
      const actions: Action[] = [
        { command: 'echo', args: ['first'] },
        { command: 'echo', args: ['second'] },
      ];

      await runPostActions(actions, '/tmp');

      expect(logSpy).toHaveBeenCalledWith('実行中: echo first');
      expect(logSpy).toHaveBeenCalledWith('✓ 完了: echo first');
      expect(logSpy).toHaveBeenCalledWith('実行中: echo second');
      expect(logSpy).toHaveBeenCalledWith('✓ 完了: echo second');
    });
  });
});
