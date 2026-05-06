
# Discovery & Plan: BAH-4635

**JIRA**: BAH-4635
**Summary**: [Feature UI] White-Label Override Config Mechanism
**Story Points**: 2 (expected)
**Created**: 2026-05-05

---

## JIRA Details

### Description
As a developer deploying a white-label Bahmni implementation, I want to provide a `bahmni-theme.config.json` file that overrides specific Carbon token values, so that my organisation's brand colours replace Bahmni's defaults -- without modifying source code and with graceful fallback for any missing or invalid values.

### Acceptance Criteria

| # | Scenario | Given | When | Then |
|---|----------|-------|------|------|
| 1 | Happy path: full override | Config file with hex values for all mapped tokens | App starts with config present | Custom values applied; header/buttons/highlights show brand colours; no Bahmni defaults in overridden slots |
| 2 | Partial override | Config overrides `$background-brand` only, others blank | App starts | Header shows custom colour; all other tokens fall back to Bahmni defaults; no `undefined` or broken styling |
| 3 | Invalid hex: graceful fallback | Config has typo e.g. `"interactive": "notacolour"` | App starts with bad config | Warning logged: "Invalid colour value for `$interactive` -- using Bahmni default"; default applied; no crash |
| 4 | Config-driven tokens visible in DevTools | Partner config loaded | Developer inspects `:root` in DevTools | Overridden tokens show partner hex; non-overridden show Bahmni defaults; all `--cds-*` present |
| 5 | No config file: defaults unchanged | No `bahmni-theme.config.json` present | App starts | Identical to Story 1 behaviour; Bahmni defaults apply; no error thrown |

**AC Status**: Clear

### Attachments
No attachments

### Comments & Context
AC #5 references "Story 1" (BAH-4634) which established the default colour token system. This story builds directly on that foundation.

### Linked Issues
| Type | Issue | Status | Impact |
|------|-------|--------|--------|
| Depends on | BAH-4634 | In Review | Story 1: Default token system (branch base) |

---

## Codebase Assessment

### Current State (from BAH-4634)

The predecessor story established:
1. **`applyTheme.ts`** - `BahmniThemeConfig` interface (19 tokens), `BAHMNI_DEFAULT_THEME` constant, `applyBahmniTheme()` function
2. **`themeService.ts`** - `fetchThemeConfig()` fetches from `/bahmni_config/openmrs/apps/home/bahmni-theme.json`
3. **`main.tsx`** - Wires both: defaults applied sync, then config fetched async

### Identified Gaps

| AC | Current Support | Gap |
|----|----------------|-----|
| AC1 (full override) | Works if all 19 tokens provided | None (but see AC3) |
| AC2 (partial override) | **BROKEN** - 2nd `applyBahmniTheme()` call replaces entire style tag content; partial config loses unspecified Bahmni defaults | Needs merge with defaults |
| AC3 (invalid hex) | No validation exists | Needs hex validation + warning logging |
| AC4 (DevTools) | Works for tokens in config | Depends on AC2 fix (all tokens present) |
| AC5 (no config) | Works - `fetchThemeConfig()` returns `{}`, early return preserves first call's defaults | None |

### Affected Files
| File | Change Type | Repo |
|------|-------------|------|
| `packages/bahmni-design-system/src/utils/applyTheme.ts` | Modify - add hex validation | bahmni-apps-frontend |
| `packages/bahmni-design-system/src/utils/__tests__/applyTheme.test.ts` | Modify - add validation tests | bahmni-apps-frontend |
| `distro/src/main.tsx` | Modify - merge overrides with defaults | bahmni-apps-frontend |
| `openmrs/apps/home/bahmni-theme.json` | Create - sample/default config | standard-config |

### Existing Patterns
- `applyBahmniTheme()` uses a `<style>` tag approach (not inline styles) to override Carbon v11 class-level tokens
- `fetchThemeConfig()` fails silently (returns `{}`) on network/parse errors
- Circular dependency avoided by duplicating `BahmniThemeConfig` type in both packages

### CLAUDE.md Guidelines
No CLAUDE.md found

### Test Patterns
- **Unit tests**: Jest + jsdom, direct DOM assertions
- **applyTheme tests**: `beforeEach` clears style tag, asserts on `textContent` of style element
- **themeService tests**: Mock `global.fetch`, test success/failure paths
- **Coverage threshold**: 90% lines/branches/functions/statements

---

## Implementation Approaches

### Approach A: Validation in `applyBahmniTheme()` + Merge in `main.tsx` (Recommended)

**Technical Approach**:
1. Add `isValidHexColour()` helper to `applyTheme.ts` - regex validates `#rgb` or `#rrggbb` format
2. Modify `applyBahmniTheme()` to filter out invalid values with `console.warn` per AC3
3. Update `main.tsx` to merge: `fetchThemeConfig().then(overrides => applyBahmniTheme({ ...BAHMNI_DEFAULT_THEME, ...overrides }))`

**Files to Modify**:
- `applyTheme.ts`: Add validation, export helper for testability
- `applyTheme.test.ts`: Add validation tests (valid hex, invalid values, warning logging)
- `main.tsx`: Merge overrides with defaults

**Pros**:
- Defense in depth: `applyBahmniTheme` never writes invalid CSS regardless of caller
- Clean separation: validation where CSS is written, merge where orchestration happens
- No circular dependency issues
- Minimal code changes (~30 lines production code)

**Cons**:
- Merge logic lives in `main.tsx` (not reusable if called from elsewhere)

**Complexity/Risk**: Low

### Approach B: New `validateAndMergeThemeConfig()` in themeService

**Technical Approach**:
1. Add validation + merge function in `themeService.ts`
2. Service fetches, validates, merges with defaults, returns complete config
3. `main.tsx` simply calls `applyBahmniTheme()` with the result

**Files to Modify**:
- `themeService.ts`: Add validation + merge + defaults copy
- `themeService.test.ts`: Add validation tests
- `main.tsx`: Simplify to single call

**Pros**:
- All override logic encapsulated in service
- `main.tsx` stays simple

**Cons**:
- Requires duplicating `BAHMNI_DEFAULT_THEME` in themeService (circular dep prevents import)
- Mixes concerns: fetching + validating + merging in one service
- More code duplication

**Complexity/Risk**: Medium

### Approach C: Validation in `applyBahmniTheme()` + internal merge with defaults

**Technical Approach**:
1. `applyBahmniTheme()` always merges passed config with `BAHMNI_DEFAULT_THEME` internally
2. Add hex validation

**Pros**:
- Single function handles everything

**Cons**:
- Changes function semantics (currently "apply exactly what's passed")
- Initial call with `BAHMNI_DEFAULT_THEME` would redundantly merge with itself
- Less explicit about what the function does

**Complexity/Risk**: Low-Medium

### Recommended Approach
**Approach A** - cleanest separation of concerns, minimal changes, no circular dependency issues, and each piece has a clear single responsibility.

---

## Work Breakdown

| # | Sub-task | Effort | Files | Tests |
|---|----------|--------|-------|-------|
| 1 | Add `isValidHexColour()` helper + hex validation in `applyBahmniTheme()` with console.warn for invalid values | ~0.6 pts | `applyTheme.ts` | Valid/invalid hex tests, warning logging tests |
| 2 | Update `main.tsx` to merge overrides with defaults | ~0.2 pts | `main.tsx` | N/A (integration-level) |
| 3 | Create `bahmni-theme.json` in standard-config with Bahmni defaults as reference for implementers | ~0.2 pts | `standard-config/openmrs/apps/home/bahmni-theme.json` | N/A |
| 4 | Add comprehensive tests for validation behaviour | ~0.8 pts | `applyTheme.test.ts` | ~6-8 new test cases |
| 5 | Verify all existing tests still pass | ~0.2 pts | - | Run full suite |

**Total estimated**: 2.0 points

---

## Scope Verdict

- [x] ✅ **Confirmed 2-pointer** - moderate complexity, focused scope

Rationale: 3 files modified, ~30 lines production code, ~50 lines test code. Clear acceptance criteria with well-defined validation rules. Builds cleanly on BAH-4634's foundation.

---

## Clarifying Questions

No clarifying questions - requirements are clear. All 5 ACs are well-defined with specific Given/When/Then scenarios.
