/**
 * パス変換モジュール
 * ドット（.）で始まるファイル・ディレクトリ名と dot__ プレフィックスの相互変換
 */

/**
 * ドットで始まるファイル・ディレクトリ名を dot__ 形式に変換する
 * 例: .claude/settings.json → dot__claude/settings.json
 */
export function convertDotPath(relativePath: string): string {
  const parts = relativePath.split('/');
  const convertedParts = parts.map((part) => {
    if (part.startsWith('.') && part.length > 1) {
      return `dot__${part.slice(1)}`;
    }
    return part;
  });
  return convertedParts.join('/');
}

/**
 * dot__ 形式を元のドット形式に戻す
 * 例: dot__claude/settings.json → .claude/settings.json
 */
export function revertDotPath(convertedPath: string): string {
  const parts = convertedPath.split('/');
  const revertedParts = parts.map((part) => {
    if (part.startsWith('dot__')) {
      return `.${part.slice(5)}`;
    }
    return part;
  });
  return revertedParts.join('/');
}
