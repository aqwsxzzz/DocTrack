import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import reactYouMightNotNeedAnEffect from "eslint-plugin-react-you-might-not-need-an-effect";

// Design-system guardrails — see CLAUDE.md §2 (Shadcn-First) and §3 (UI Consistency).
const PALETTE =
  '(?:text|bg|border|ring|fill|stroke|from|to|via|divide|outline|decoration|shadow|accent|caret)-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\\d'
const COLOR_UTIL = '(?:text|bg|border|ring|fill|stroke|from|to|via|divide|outline|decoration|accent|caret)'
const ARBITRARY_COLOR = `${COLOR_UTIL}-\\[(?:#|(?:rgba?|hsla?|oklch|oklab|hwb|lab|lch|color)\\()`
const ARBITRARY_GRADIENT = 'bg-\\[(?:linear|radial|conic)-gradient'

const paletteMessage =
  'Hardcoded Tailwind palette color. Use a semantic token or a --v2-* token instead. See CLAUDE.md §3.'
const arbitraryColorMessage =
  'Arbitrary color value in a utility class. Define a semantic token instead. See CLAUDE.md §3.'

const noPaletteColors = [
  { selector: `Literal[value=/${PALETTE}/]`, message: paletteMessage },
  { selector: `Literal[value=/${ARBITRARY_COLOR}/]`, message: arbitraryColorMessage },
  { selector: `Literal[value=/${ARBITRARY_GRADIENT}/]`, message: arbitraryColorMessage },
  { selector: `TemplateElement[value.raw=/${PALETTE}/]`, message: paletteMessage },
  { selector: `TemplateElement[value.raw=/${ARBITRARY_COLOR}/]`, message: arbitraryColorMessage },
  { selector: `TemplateElement[value.raw=/${ARBITRARY_GRADIENT}/]`, message: arbitraryColorMessage },
]

const noNativeControls = ['input', 'select', 'textarea', 'button', 'label'].map((tag) => ({
  selector: `JSXOpeningElement[name.name='${tag}']`,
  message: `Native <${tag}> bypasses shadcn/ui. Use the matching component from @/components/ui instead. See CLAUDE.md §2.`,
}))

export default tseslint.config(
  { ignores: ['dist'] },
  {
    extends: [
      js.configs.recommended,
      ...tseslint.configs.recommended,
      reactYouMightNotNeedAnEffect.configs.recommended,
    ],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    },
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    ignores: ['src/components/ui/**'],
    rules: {
      'no-restricted-syntax': ['error', ...noPaletteColors, ...noNativeControls],
    },
  },
)
