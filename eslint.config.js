import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
    },
    rules: {
      // Reset-on-change (sincronizar estado local de UI cuando cambia projectId o el `open` de un modal) es
      // un patrón usado deliberadamente en las pantallas y modales del mockup. Los efectos son resets de una
      // sola pasada, benignos — no bugs de render en cascada. Esta regla es demasiado agresiva para ese uso.
      'react-hooks/set-state-in-effect': 'off',
    },
  },
])
