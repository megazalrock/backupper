/**
 * シェルコマンド実行モジュール
 * backup/restore 実行後の後処理を担当
 */

import type { Action } from '../types/config.ts';

import {
  logActionError,
  logActionFailure,
  logActionStart,
  logActionSuccess,
  logPostActionsStart,
} from './Logger.ts';

/**
 * アクション実行結果
 */
export interface ActionResult {
  success: boolean
  command: string
  exitCode?: number
  error?: string
}

/**
 * コマンドを文字列形式で表示用に整形する
 */
function formatCommand(action: Action): string {
  const parts = [action.command, ...action.args];
  return parts.join(' ');
}

/**
 * 単一のアクションを実行する
 * @param action 実行するアクション
 * @param defaultCwd デフォルトの作業ディレクトリ
 * @returns 実行結果
 */
export async function runAction(
  action: Action,
  defaultCwd: string,
): Promise<ActionResult> {
  const commandStr = formatCommand(action);
  logActionStart(commandStr);

  try {
    const proc = Bun.spawn([action.command, ...action.args], {
      cwd: action.cwd ?? defaultCwd,
      env: action.env ? { ...process.env, ...action.env } : process.env,
      stdout: 'inherit',
      stderr: 'inherit',
    });

    const exitCode = await proc.exited;

    if (exitCode === 0) {
      logActionSuccess(commandStr);
      return {
        success: true,
        command: commandStr,
        exitCode,
      };
    } else {
      logActionFailure(commandStr, exitCode);
      return {
        success: false,
        command: commandStr,
        exitCode,
      };
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logActionFailure(commandStr);
    logActionError(errorMessage);
    return {
      success: false,
      command: commandStr,
      error: errorMessage,
    };
  }
}

/**
 * 複数のアクションを順次実行する
 * @param actions 実行するアクション配列
 * @param defaultCwd デフォルトの作業ディレクトリ
 */
export async function runPostActions(
  actions: Action[] | undefined,
  defaultCwd: string,
): Promise<void> {
  if (!actions || actions.length === 0) {
    return;
  }

  logPostActionsStart();

  for (const action of actions) {
    const result = await runAction(action, defaultCwd);

    if (!result.success) {
      process.exit(1);
    }
  }
}
