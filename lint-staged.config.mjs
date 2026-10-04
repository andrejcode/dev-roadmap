import { defineConfig } from 'lint-staged/config'

export default defineConfig({
  '*.{ts,tsx,js,jsx,mjs,cjs}': [
    'eslint --fix --max-warnings=0',
    'prettier --write',
  ],
  '*.{json,jsonc,css,md,mdx,html,yml,yaml}': 'prettier --write',
  '*': () => ['pnpm typecheck', 'pnpm test'],
})
