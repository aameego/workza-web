# Workza Web

Vite + React 19 + TypeScript HRMS frontend.

## Quick start

```bash
npm install
npm run dev
npm test
```

## Design system & agent context

| Doc | Purpose |
|-----|---------|
| [`AGENTS.md`](./AGENTS.md) | Shared briefing for AI agents |
| [`docs/design-system.md`](./docs/design-system.md) | Tokens + component usage |
| [`src/design-system/`](./src/design-system/) | Code: tokens, CSS vars, primitives |
| [`.cursor/rules/`](./.cursor/rules/) | Cursor rules (always-on design system) |

Import UI from `src/design-system` — do not invent one-off colors/fonts.

## Figma

Design file: [14O92bCa5gfXDTCsf2RXbp](https://www.figma.com/design/14O92bCa5gfXDTCsf2RXbp/). Prefer Figma **desktop MCP** when Dev Mode local server is enabled.
