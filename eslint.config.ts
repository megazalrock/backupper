import eslint from '@eslint/js';
import stylistic from '@stylistic/eslint-plugin';
import importX from 'eslint-plugin-import-x';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  // グローバル無視設定
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      '*.config.js',
      '*.config.mjs',
    ],
  },

  // ESLint推奨ルール
  eslint.configs.recommended,

  // TypeScript推奨ルール
  ...tseslint.configs.recommended,

  // import-x プラグイン設定
  {
    plugins: {
      'import-x': importX,
    },
    settings: {
      'import-x/resolver': {
        typescript: true,
      },
    },
    rules: {
      // import文の順序
      'import-x/order': [
        'error',
        {
          groups: [
            'builtin',
            'external',
            'internal',
            'parent',
            'sibling',
            'index',
          ],
          pathGroups: [
            {
              // bun:* を builtin として扱う
              pattern: 'bun:*',
              group: 'builtin',
              position: 'after',
            },
          ],
          pathGroupsExcludedImportTypes: [],
          'newlines-between': 'always',
          alphabetize: {
            order: 'asc',
            caseInsensitive: true,
          },
        },
      ],
      // 重複importの禁止
      'import-x/no-duplicates': 'error',
    },
  },

  // @stylistic スタイルルール
  {
    plugins: {
      '@stylistic': stylistic,
    },
    rules: {
      // インデント: スペース2つ
      '@stylistic/indent': ['error', 2],
      // クォート: シングルクォート
      '@stylistic/quotes': ['error', 'single', { avoidEscape: true }],
      // セミコロン: あり
      '@stylistic/semi': ['error', 'always'],
      // トレーリングカンマ: あり
      '@stylistic/comma-dangle': ['error', 'always-multiline'],
      // オブジェクトのスペーシング
      '@stylistic/object-curly-spacing': ['error', 'always'],
      // 配列のスペーシング
      '@stylistic/array-bracket-spacing': ['error', 'never'],
      // アロー関数のスペーシング
      '@stylistic/arrow-spacing': 'error',
      // ブロックのスペーシング
      '@stylistic/block-spacing': 'error',
      // カンマのスペーシング
      '@stylistic/comma-spacing': ['error', { before: false, after: true }],
      // キーワードのスペーシング
      '@stylistic/keyword-spacing': ['error', { before: true, after: true }],
      // セミコロンのスペーシング
      '@stylistic/semi-spacing': ['error', { before: false, after: true }],
      // スペースのスタイル
      '@stylistic/space-before-blocks': 'error',
      '@stylistic/space-before-function-paren': ['error', {
        anonymous: 'always',
        named: 'never',
        asyncArrow: 'always',
      }],
      '@stylistic/space-in-parens': ['error', 'never'],
      '@stylistic/space-infix-ops': 'error',
      // 行末のスペースを禁止
      '@stylistic/no-trailing-spaces': 'error',
      // 複数の空行を禁止
      '@stylistic/no-multiple-empty-lines': ['error', { max: 1, maxEOF: 0 }],
      // ファイル末尾の改行
      '@stylistic/eol-last': ['error', 'always'],
    },
  },

  // TypeScript固有のルール調整
  {
    rules: {
      // 使用していない変数（_で始まる変数は許可）
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
      // 明示的な戻り値の型は必須としない（型推論を活用）
      '@typescript-eslint/explicit-function-return-type': 'off',
      // モジュール境界での明示的な型は必須としない
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      // any型の使用は警告（CLAUDE.mdの方針に従い極力避ける）
      '@typescript-eslint/no-explicit-any': 'warn',
      // 非nullアサーション（!）は警告（CLAUDE.mdの方針に従い極力避ける）
      '@typescript-eslint/no-non-null-assertion': 'warn',
    },
  },

  // テストファイル用の緩和設定
  {
    files: ['**/*.test.ts', '**/*.spec.ts', '**/__tests__/**/*.ts'],
    rules: {
      // テストファイルではany型を許可
      '@typescript-eslint/no-explicit-any': 'off',
      // テストファイルでは非nullアサーションを許可
      '@typescript-eslint/no-non-null-assertion': 'off',
    },
  },
);
