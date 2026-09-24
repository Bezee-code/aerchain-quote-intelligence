# AGENTS.md - aerchain-quote-intelligence

## Project Type
Node.js/TypeScript

## Commands
- **Install**: `npm install` (or `pnpm install` / `yarn install`)
- **Build**: `npm run build`
- **Typecheck**: `npm run typecheck` (or `tsc --noEmit`)
- **Lint**: `npm run lint`
- **Test**: `npm test` / `npm run test:unit` / `npm run test:integration`
- **Format**: `npm run format` (Prettier)

## Recommended Order
`lint -> typecheck -> test -> build`

## Project Structure (typical)
```
src/           # Source code
tests/         # Test files
dist/          # Build output (gitignored)
node_modules/  # Dependencies (gitignored)
```

## Key Files to Watch
- `package.json` - scripts, dependencies, engines
- `tsconfig.json` - TypeScript config
- `.eslintrc.*` / `eslint.config.*` - Lint rules
- `.prettierrc*` - Format rules
- `jest.config.*` / `vitest.config.*` - Test config

## Environment
- Copy `.env.example` to `.env.local` for local dev
- Never commit secrets

## Git Hooks
- Pre-commit: lint + typecheck (via Husky/lint-staged if configured)

## Notes
- This is a fresh repo - update this file as the project evolves
- Add project-specific quirks, test fixtures, codegen steps, etc. as they're introduced