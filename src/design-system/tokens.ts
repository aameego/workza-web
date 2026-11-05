/**
 * Workza Design System tokens — source of truth mirrored from Figma
 * file `14O92bCa5gfXDTCsf2RXbp` → "Tokens & Typography".
 *
 * Prefer CSS variables (`var(--wz-*)`) in stylesheets.
 * Use this module for JS/TS (tests, inline styles, charts).
 */

export const brand = {
  kpBlue: "#245EE4",
  kpGreen: "#08926F",
  workzaBlue: "#1950A3",
  workzaTeal: "#1FA3A5",
} as const;

export const neutral = {
  50: "#F8F9FA",
  100: "#F1F3F5",
  200: "#E9ECEF",
  300: "#DEE2E6",
  400: "#ADB5BD",
  500: "#868E96",
  600: "#495057",
  700: "#343A40",
  800: "#212529",
  900: "#181818",
} as const;

export const semantic = {
  primary: brand.workzaBlue,
  accent: brand.workzaTeal,
  surface: neutral[50],
  border: neutral[300],
  textPrimary: neutral[900],
  textSecondary: neutral[600],
  stateHover: "#E8EEFB",
  stateSelected: "#D1DFFA",
  stateDisabled: neutral[200],
  success: "#12B76A",
  warning: "#F79009",
  error: "#F04438",
} as const;

/** App shell (Navigation/Sidenav + Top Bar) */
export const shell = {
  sidebarBg: "#001529",
  sidebarWidth: 232,
  sidebarCollapsedWidth: 72,
  topbarHeight: 60,
  navItemHeight: 40,
  navItemGap: 12,
} as const;

export const radius = {
  sm: 6,
  md: 8,
  lg: 10,
  xl: 12,
  full: 9999,
} as const;

export const space = {
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
} as const;

/** Sora type scale — Figma "Typography Scale" */
export const typography = {
  fontFamily: '"Sora", system-ui, sans-serif',
  display: { size: 48, lineHeight: 56, weight: 700 },
  h1: { size: 36, lineHeight: 44, weight: 700 },
  h2: { size: 28, lineHeight: 36, weight: 600 },
  h3: { size: 22, lineHeight: 28, weight: 600 },
  h4: { size: 18, lineHeight: 24, weight: 600 },
  bodyLarge: { size: 16, lineHeight: 24, weight: 400 },
  body: { size: 14, lineHeight: 20, weight: 400 },
  bodyMedium: { size: 14, lineHeight: 20, weight: 600 },
  caption: { size: 12, lineHeight: 16, weight: 400 },
  overline: { size: 12, lineHeight: 16, weight: 600 },
  button: { size: 14, lineHeight: 20, weight: 600 },
} as const;

export const figma = {
  fileKey: "14O92bCa5gfXDTCsf2RXbp",
  tokensNodeId: "1:13816",
  sidenavNodeId: "1:13707",
  topBarNodeId: "1:16425",
  buttonNodeId: "1:13573",
  badgeNodeId: "1:13510",
} as const;

export const tokens = {
  brand,
  neutral,
  semantic,
  shell,
  radius,
  space,
  typography,
  figma,
} as const;

export type BrandToken = keyof typeof brand;
export type NeutralToken = keyof typeof neutral;
export type SemanticToken = keyof typeof semantic;
