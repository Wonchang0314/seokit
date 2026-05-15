/**
 * Sample ESLint flat config for CODE_RULES.md
 *
 * - Flat config (ESLint v9+)
 * - 본 파일은 `docs/CODE_RULES.md` 의 `[lint: ...]` 마커에 대응한다.
 * - 새 프로젝트로 복사 시: 파일명을 `eslint.config.mjs` 로 바꾸고 루트에 배치,
 *   필요한 plugin/parser 를 devDependencies 에 추가한다.
 *
 *   pnpm add -D \
 *     eslint typescript-eslint \
 *     eslint-plugin-react eslint-plugin-react-hooks \
 *     eslint-plugin-jsx-a11y eslint-plugin-import
 */

import tseslint from 'typescript-eslint'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import jsxA11y from 'eslint-plugin-jsx-a11y'
import importPlugin from 'eslint-plugin-import'

/* ────────────────────────────────────────────────────────────
 * Custom local plugin
 *   §3.1.2 useEffect 콜백은 named function
 *   표준 룰에 없어 직접 작성 (~25 lines AST)
 * ──────────────────────────────────────────────────────────── */
const localPlugin = {
  rules: {
    'useeffect-named-function': {
      meta: {
        type: 'suggestion',
        docs: { description: 'useEffect 콜백은 named function 표현식으로 작성한다' },
        schema: [],
        messages: {
          arrow: 'useEffect 콜백은 익명 화살표 대신 named function 표현식으로 작성하세요',
          anonFn: 'useEffect 콜백 function 에 이름을 붙여주세요 (예: function fetchUserOnIdChange() {})',
        },
      },
      create(context) {
        return {
          'CallExpression[callee.name="useEffect"]'(node) {
            const cb = node.arguments[0]
            if (!cb) return
            if (cb.type === 'ArrowFunctionExpression') {
              context.report({ node: cb, messageId: 'arrow' })
            } else if (cb.type === 'FunctionExpression' && !cb.id) {
              context.report({ node: cb, messageId: 'anonFn' })
            }
          },
        }
      },
    },
  },
}

export default [
  /* 표준 권장 set */
  ...tseslint.configs.recommended,

  {
    plugins: {
      react,
      'react-hooks': reactHooks,
      'jsx-a11y': jsxA11y,
      import: importPlugin,
      local: localPlugin,
    },

    languageOptions: {
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: { jsx: true },
      },
    },

    settings: {
      react: { version: 'detect' },
    },

    rules: {
      /* ─── §3.1.2 useEffect named function ─── */
      'local/useeffect-named-function': 'error',

      /* ─── §3.1.4 Props 는 interface ─── */
      '@typescript-eslint/consistent-type-definitions': ['error', 'interface'],

      /* ─── §3.2.1 use 접두사 + 훅 규칙 ─── */
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',

      /* ─── §3.4.1 any 금지 ─── */
      '@typescript-eslint/no-explicit-any': 'error',

      /* ─── §3.4.2 매직 넘버 ─── */
      'no-magic-numbers': [
        'warn',
        {
          ignore: [-1, 0, 1, 2, 100],
          ignoreArrayIndexes: true,
          ignoreDefaultValues: true,
          enforceConst: true,
        },
      ],

      /* ─── §3.4.4 Non-null assertion 금지 ─── */
      '@typescript-eslint/no-non-null-assertion': 'error',

      /* ─── §3.5.2 named export only ─── */
      'import/no-default-export': 'error',

      /* ─── §3.5.3 임포트 정렬 ─── */
      'import/order': [
        'error',
        {
          groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
          'newlines-between': 'always',
          alphabetize: { order: 'asc', caseInsensitive: true },
        },
      ],

      /* ─── §4.1 접근성 ─── */
      'jsx-a11y/alt-text': 'error',
      'jsx-a11y/no-static-element-interactions': 'error',
      'jsx-a11y/click-events-have-key-events': 'error',

      /* ─── React general ─── */
      'react/jsx-key': 'error',
      'react/no-array-index-key': 'warn',
    },
  },

  /* default export 가 필요한 entry / config 파일 예외 */
  {
    files: [
      '**/*.config.{js,ts,mjs,cjs}',
      'vite.config.*',
      'tailwind.config.*',
      'eslint.config.*',
      'src/main.tsx',
      'src/router.tsx',
    ],
    rules: {
      'import/no-default-export': 'off',
    },
  },
]
