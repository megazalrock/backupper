import { existsSync, readFileSync } from 'node:fs';
import { extname, resolve } from 'node:path';

import type { Action, BackupOptions, Config, ResolvedConfig, RestoreOptions } from '../types/config.ts';

// ============================================
// 定数
// ============================================

export const DEFAULT_CONFIG_PATHS = [
  'backupper.config.ts', // TypeScript 優先
  'backupper.config.json',
] as const;

/** 後方互換性のためのエイリアス */
export const DEFAULT_CONFIG_PATH = DEFAULT_CONFIG_PATHS[0];

// ============================================
// 拡張子判定
// ============================================

/** 対応する設定ファイルの拡張子 */
export type ConfigFileExtension = '.ts' | '.json';

/**
 * 設定ファイルの拡張子を判定する
 * @returns 対応している拡張子の場合はその拡張子、そうでなければ null
 */
export function getConfigFileExtension(filePath: string): ConfigFileExtension | null {
  const ext = extname(filePath);
  if (ext === '.ts' || ext === '.json') {
    return ext;
  }
  return null;
}

// ============================================
// デフォルトパス検索
// ============================================

/**
 * デフォルトの設定ファイルパスを検索する
 * DEFAULT_CONFIG_PATHS の順序で存在するファイルを探す（.ts 優先）
 * @returns 見つかったファイルパス、見つからなければ null
 */
export function findDefaultConfigPath(): string | null {
  for (const configPath of DEFAULT_CONFIG_PATHS) {
    const absolutePath = resolve(configPath);
    if (existsSync(absolutePath)) {
      return configPath;
    }
  }
  return null;
}

// ============================================
// JSON バリデーション
// ============================================

/**
 * 値が文字列かどうかを判定する
 */
function isString(value: unknown): value is string {
  return typeof value === 'string';
}

/**
 * 値が文字列配列かどうかを判定する
 */
function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(isString);
}

/**
 * 値が boolean かどうかを判定する
 */
function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean';
}

/**
 * 値がオブジェクトかどうかを判定する
 */
function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Action オブジェクトのバリデーション
 */
function validateAction(action: unknown, index: number, context: string): Action {
  if (!isObject(action)) {
    throw new Error(`${context}[${index}] はオブジェクトである必要があります`);
  }

  if (!isString(action.command)) {
    throw new Error(`${context}[${index}].command は文字列である必要があります`);
  }

  if (!isStringArray(action.args)) {
    throw new Error(`${context}[${index}].args は文字列配列である必要があります`);
  }

  const result: Action = {
    command: action.command,
    args: action.args,
  };

  if (action.env !== undefined) {
    if (!isObject(action.env) || !Object.values(action.env).every(isString)) {
      throw new Error(`${context}[${index}].env は文字列のオブジェクトである必要があります`);
    }
    result.env = action.env as Record<string, string>;
  }

  if (action.cwd !== undefined) {
    if (!isString(action.cwd)) {
      throw new Error(`${context}[${index}].cwd は文字列である必要があります`);
    }
    result.cwd = action.cwd;
  }

  return result;
}

/**
 * Action 配列のバリデーション
 */
function validateActions(actions: unknown, context: string): Action[] {
  if (!Array.isArray(actions)) {
    throw new Error(`${context} は配列である必要があります`);
  }
  return actions.map((action, index) => validateAction(action, index, context));
}

/**
 * BackupOptions のバリデーション
 */
function validateBackupOptions(backup: unknown): BackupOptions | undefined {
  if (backup === undefined) {
    return undefined;
  }

  if (!isObject(backup)) {
    throw new Error('backup はオブジェクトである必要があります');
  }

  const result: BackupOptions = {};

  if (backup.sync !== undefined) {
    if (!isBoolean(backup.sync)) {
      throw new Error('backup.sync は boolean である必要があります');
    }
    result.sync = backup.sync;
  }

  if (backup.postRunActions !== undefined) {
    result.postRunActions = validateActions(backup.postRunActions, 'backup.postRunActions');
  }

  return result;
}

/**
 * RestoreOptions のバリデーション
 */
function validateRestoreOptions(restore: unknown): RestoreOptions | undefined {
  if (restore === undefined) {
    return undefined;
  }

  if (!isObject(restore)) {
    throw new Error('restore はオブジェクトである必要があります');
  }

  const result: RestoreOptions = {};

  if (restore.preserveOriginal !== undefined) {
    if (!isBoolean(restore.preserveOriginal)) {
      throw new Error('restore.preserveOriginal は boolean である必要があります');
    }
    result.preserveOriginal = restore.preserveOriginal;
  }

  if (restore.postRunActions !== undefined) {
    result.postRunActions = validateActions(restore.postRunActions, 'restore.postRunActions');
  }

  return result;
}

/**
 * JSON から読み込んだ設定のバリデーション
 */
function validateConfigStructure(raw: unknown): Config {
  if (!isObject(raw)) {
    throw new Error('設定は JSON オブジェクトである必要があります');
  }

  // 必須フィールド
  if (!isString(raw.destination)) {
    throw new Error('destination は必須の文字列フィールドです');
  }

  if (!isStringArray(raw.includes)) {
    throw new Error('includes は必須の文字列配列です');
  }

  if (!isStringArray(raw.excludes)) {
    throw new Error('excludes は必須の文字列配列です');
  }

  // オプショナルフィールド
  const config: Config = {
    destination: raw.destination,
    includes: raw.includes,
    excludes: raw.excludes,
  };

  if (raw.source !== undefined) {
    if (!isString(raw.source)) {
      throw new Error('source は文字列である必要があります');
    }
    config.source = raw.source;
  }

  const backupOptions = validateBackupOptions(raw.backup);
  if (backupOptions) {
    config.backup = backupOptions;
  }

  const restoreOptions = validateRestoreOptions(raw.restore);
  if (restoreOptions) {
    config.restore = restoreOptions;
  }

  return config;
}

// ============================================
// 設定読み込み
// ============================================

/**
 * TypeScript 設定ファイルを読み込む
 */
async function loadTsConfig(absolutePath: string): Promise<Config> {
  const module = await import(absolutePath);

  // 優先順位: default > config（名前付き）
  const config = (module.default as Config | undefined) ?? (module.config as Config | undefined);

  if (!config) {
    throw new Error(
      `設定ファイルに config がエクスポートされていません: ${absolutePath}\n` +
      'ヒント: \'export default defineConfig({ ... })\' または \'export const config = { ... }\' の形式でエクスポートしてください。',
    );
  }

  return config;
}

/**
 * JSON 設定ファイルを読み込む
 */
function loadJsonConfig(absolutePath: string): Config {
  const content = readFileSync(absolutePath, 'utf-8');

  let raw: unknown;
  try {
    raw = JSON.parse(content);
  } catch {
    throw new Error(`設定ファイルの JSON が不正です: ${absolutePath}`);
  }

  return validateConfigStructure(raw);
}

/**
 * 設定ファイルを読み込む
 *
 * 対応形式:
 * - .ts: 動的 import（defineConfig パターン推奨）
 * - .json: JSON.parse + バリデーション
 *
 * source が未指定の場合は process.cwd() がデフォルト値として使用される
 */
export async function loadConfig(configPath: string): Promise<ResolvedConfig> {
  const absolutePath = resolve(configPath);

  if (!existsSync(absolutePath)) {
    throw new Error(`設定ファイルが見つかりません: ${absolutePath}`);
  }

  const ext = getConfigFileExtension(configPath);
  if (!ext) {
    throw new Error(`対応していない設定ファイル形式です: ${configPath}\n対応形式: .ts, .json`);
  }

  const config = ext === '.ts'
    ? await loadTsConfig(absolutePath)
    : loadJsonConfig(absolutePath);

  // デフォルト値を適用
  return {
    ...config,
    source: config.source ?? process.cwd(),
  };
}

/**
 * 共通の設定バリデーション
 */
function validateCommonConfig(cfg: ResolvedConfig): void {
  if (!existsSync(cfg.source)) {
    throw new Error(`ベースパスが存在しません: ${cfg.source}`);
  }

  if (!cfg.destination || cfg.destination.trim() === '') {
    throw new Error('outputDir が指定されていません');
  }
}

/**
 * バックアップ用の設定バリデーション
 */
export function validateBackupConfig(cfg: ResolvedConfig): void {
  validateCommonConfig(cfg);
}

/**
 * リストア用の設定バリデーション
 * - 共通バリデーション
 * - outputDir（files/）の存在確認
 */
export function validateRestoreConfig(cfg: ResolvedConfig): void {
  validateCommonConfig(cfg);

  if (!existsSync(cfg.destination)) {
    throw new Error(`出力ディレクトリが存在しません: ${cfg.destination}`);
  }
}
