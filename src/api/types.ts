import type { ResolvedConfig } from '../types/config.ts';
import type { CopyResult, DeleteResult, RestoreFileInfo } from '../types/result.ts';

export interface BackupOptions {
  configPath?: string
  config?: ResolvedConfig
  only?: string
}

export interface RestoreOptions {
  configPath?: string
  config?: ResolvedConfig
  only?: string
  dryRun?: boolean
  force?: boolean
  confirmContinue?: () => Promise<boolean>
}

export interface BackupResult {
  copyResults: CopyResult[]
  deleteResults: DeleteResult[]
  copiedFiles: string[]
}

export interface RestoreResult {
  restoreResults: CopyResult[]
  fileInfos: RestoreFileInfo[]
  cancelled?: boolean
}
