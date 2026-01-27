export { executeBackup, executeRestore } from './api/index.ts';
export type { BackupOptions, BackupResult, RestoreOptions, RestoreResult } from './api/types.ts';
export { loadConfig, validateBackupConfig, validateRestoreConfig } from './modules/ConfigLoader.ts';
export { defineConfig } from './types/config.ts';
export type { Config, ResolvedConfig } from './types/config.ts';
export type { CopyResult, DeleteResult, RestoreFileInfo } from './types/result.ts';
