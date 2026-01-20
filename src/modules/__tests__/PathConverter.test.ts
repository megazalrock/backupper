import { describe, test, expect } from 'bun:test';

import { convertDotPath, revertDotPath } from '../PathConverter.ts';

describe('PathConverter', () => {
  describe('convertDotPath', () => {
    test('ドットで始まるファイル名を dot__ 形式に変換する', () => {
      expect(convertDotPath('.gitignore')).toBe('dot__gitignore');
    });

    test('ドットで始まるディレクトリ名を変換する', () => {
      expect(convertDotPath('.claude/settings.json')).toBe(
        'dot__claude/settings.json',
      );
    });

    test('複数のドットパスを含むパスを変換する', () => {
      expect(convertDotPath('.claude/.env')).toBe('dot__claude/dot__env');
    });

    test('変換不要なパスはそのまま返す', () => {
      expect(convertDotPath('src/index.ts')).toBe('src/index.ts');
    });

    test('空文字列を処理できる', () => {
      expect(convertDotPath('')).toBe('');
    });

    test('単一の . は変換しない', () => {
      expect(convertDotPath('.')).toBe('.');
    });
  });

  describe('revertDotPath', () => {
    test('dot__ プレフィックスを . に戻す', () => {
      expect(revertDotPath('dot__gitignore')).toBe('.gitignore');
    });

    test('ネストしたパスを復元する', () => {
      expect(revertDotPath('dot__claude/dot__env')).toBe('.claude/.env');
    });

    test('dot__ を含まないパスはそのまま返す', () => {
      expect(revertDotPath('src/index.ts')).toBe('src/index.ts');
    });

    test('convertDotPath との往復変換で元に戻る', () => {
      const testPaths = [
        '.gitignore',
        '.claude/settings.json',
        '.claude/.env',
        'src/index.ts',
        '',
        '.',
      ];

      for (const path of testPaths) {
        expect(revertDotPath(convertDotPath(path))).toBe(path);
      }
    });
  });
});
