# Implementation Summary: BAH-4634

**JIRA**: BAH-4634 — Bahmni Default Colour Token System Setup with App Shell Styling
**Completed**: 2026-05-06

---

## Files Changed

| File | Change |
|------|--------|
| `packages/bahmni-design-system/src/utils/applyTheme.ts` | New — runtime Carbon token override system |
| `packages/bahmni-design-system/src/index.ts` | Exports `applyBahmniTheme`, `BAHMNI_DEFAULT_THEME`, `BahmniThemeConfig` |
| `distro/src/main.tsx` | Applies `BAHMNI_DEFAULT_THEME` on app load |
| `packages/bahmni-design-system/src/organisms/header/styles/Header.module.scss` | All header color overrides consolidated here |
| `distro/src/app/components/HomePageHeader/styles/HomePageHeader.module.scss` | Header name, icon, hover/active color overrides |
| `apps/registration/src/pages/patientSearchPage/styles/index.module.scss` | Button hover/active via pseudo-classes |
| `packages/bahmni-design-system/src/molecules/formCard/styles/FormCard.module.scss` | Error background via `$red-10` Carbon color token |

---

## Implementation Approach

### Why a Runtime `<style>` Tag

Carbon v11 defines its design tokens on class selectors (`.cds--white`, `.cds--g10`) rather than solely on `:root`. This means `document.documentElement.style.setProperty('--cds-button-primary', '#007d79')` does not work — inline styles on `:root` cannot override class-level declarations.

The solution is to append a `<style>` tag to `<head>` after Carbon's CSS loads. Because CSS applies the last matching rule, the `<style>` tag wins over Carbon's class-level tokens.

```css
/* What applyBahmniTheme() writes */
:root,
.cds--white,
.cds--g10 {
  --cds-background-brand: #007d79;
  --cds-button-primary: #007d79;
  --cds-interactive: #007d79;
  /* ... all 18 tokens */
}
```

### `applyTheme.ts` — Single Source of Truth

`BahmniThemeConfig` defines the 18 Carbon tokens Bahmni overrides:

| Token group | Tokens |
|-------------|--------|
| Brand | `background-brand`, `text-inverse`, `icon-inverse` |
| Primary button | `button-primary`, `button-primary-hover`, `button-primary-active` |
| Tertiary button | `button-tertiary`, `button-tertiary-hover`, `button-tertiary-active` |
| Interactive | `interactive`, `focus`, `border-interactive` |
| Links | `link-primary`, `link-primary-hover`, `link-secondary`, `link-visited`, `link-inverse-visited` |
| Layout | `layer-01` |

`BAHMNI_DEFAULT_THEME` holds Bahmni's teal values for all 18 tokens and is applied synchronously in `main.tsx` before the React tree renders — ensuring correct colours appear on first paint with no flash.

### How `applyBahmniTheme()` Works

```typescript
applyBahmniTheme(config)
  → builds --cds-{key}: {value} rules from config entries
  → finds or creates <style id="bahmni-theme"> in <head>
  → writes rules scoped to :root, .cds--white, .cds--g10
```

The style tag is reused on subsequent calls (e.g. when runtime overrides are fetched from `standard-config`) — no duplicate tags accumulate.

### Header Styling Strategy

Carbon's `<Header>` has no built-in support for brand-coloured backgrounds beyond white. Two header components exist in the app:

- **`HeaderWSideNav`** (app pages) — uses `Header.module.scss` which applies `:global` overrides scoped to `.cds--header` for background, text, icons, breadcrumb, and side-nav icons
- **`HomePageHeader`** (home page) — a standalone component that does not load `Header.module.scss`, so it carries its own `:global` overrides in `HomePageHeader.module.scss` for the same selectors

All header overrides use `$text-inverse`, `$icon-inverse`, and `rgba(0,0,0,0.15)` for hover — values that work on any brand colour, not hardcoded to teal.

### Button Hover/Active Approach

Component-level `--cds-button-primary*` CSS variable overrides were replaced with SCSS pseudo-class selectors:

```scss
.headerButton {
  background-color: $support-success;
  &:hover  { background-color: $green-60; }
  &:active { background-color: $green-70; }
}
```

This keeps button theming in the component's own scope and avoids interfering with the global Carbon token system.
