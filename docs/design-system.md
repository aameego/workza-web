# Workza Design System

Mirrored from Figma **Workza Design System — Tokens** (`14O92bCa5gfXDTCsf2RXbp` / node `1:13816`).

## Tokens

### Brand

| Token | Hex |
|-------|-----|
| kp/blue | `#245EE4` |
| kp/green | `#08926F` |
| workza/blue | `#1950A3` |
| workza/teal | `#1FA3A5` |

### Neutrals

`50→900`: `#F8F9FA` … `#181818` (see `tokens.ts`).

### Semantic

| Token | Value |
|-------|-------|
| primary | workza/blue `#1950A3` |
| accent | workza/teal `#1FA3A5` |
| surface | `#F8F9FA` |
| border | `#DEE2E6` |
| text-primary | `#181818` |
| text-secondary | `#495057` |
| success / warning / error | `#12B76A` / `#F79009` / `#F04438` |

### Shell

| Metric | Value |
|--------|-------|
| Sidebar expanded | 232px |
| Sidebar collapsed | 72px |
| Top bar height | 60px |
| Sidebar bg | `#001529` |

### Typography

Font: **Sora**. Scale: Display 48/56 → Overline 12/16 (see `typography` in `tokens.ts`).

## Components

| Component | Figma | Import |
|-----------|-------|--------|
| `Button` | Action/Button | `primary` \| `secondary` \| `ghost` \| `destructive` |
| `Badge` | Feedback/Status Badge | `success` \| `warning` \| `error` \| `info` \| `neutral` \| `extra` \| `blue` |
| `Avatar` | Foundation/Avatar | `sm` \| `md` \| `lg` |
| `IconButton` | Top Bar utilities | optional `showDot` |
| `Card` | Layout/Card | surface container |
| `Text` | Typography scale | `display`…`overline` |

```tsx
import { Button, Badge, Card, Text } from "../design-system";

<Card>
  <Text variant="h4">Employees</Text>
  <Badge status="success">Active</Badge>
  <Button variant="primary">Add employee</Button>
</Card>
```

## Styling (Tailwind first)

Product UI uses **Tailwind CSS v4** utilities bridged to Workza tokens via `@theme` in `tokens.css`:

| Token | Example utilities |
|-------|-------------------|
| primary | `bg-wz-primary`, `text-wz-primary`, `border-wz-primary` |
| text | `text-wz-text`, `text-wz-text-secondary` |
| surface / border | `bg-wz-surface`, `border-wz-border` |
| radius | `rounded-wz-sm` … `rounded-wz-xl` |
| space | `gap-wz-4`, `p-wz-5`, `mt-wz-6` |

CSS custom properties (`--wz-*`) remain the source of truth for the theme. Prefer Tailwind classes + `cn()` over new component `.css` files. Auth landing CSS is legacy and can be migrated separately.

## Extending

1. Add Figma values to `tokens.ts` + `tokens.css` (`:root` and `@theme`).
2. Add component under `src/design-system/components/` using Tailwind utilities.
3. Export from `index.ts`.
4. Add a unit test.
5. Document here + `AGENTS.md`.
