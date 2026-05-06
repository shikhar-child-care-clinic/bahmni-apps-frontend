# Implementation Summary: BAH-4635

**JIRA**: BAH-4635
**Completed**: 2026-05-05

---

## Files Modified

| File | Change Type | Description |
|------|-------------|-------------|
| `packages/bahmni-design-system/src/utils/applyTheme.ts` | Modified | Added `isValidHexColour()`, updated `applyBahmniTheme()` to filter invalid hex values with warnings |
| `packages/bahmni-design-system/src/index.ts` | Modified | Exported `isValidHexColour` from package public API |
| `packages/bahmni-design-system/src/utils/__tests__/applyTheme.test.ts` | Modified | Added 7 `isValidHexColour` tests + 3 validation-in-`applyBahmniTheme` tests |
| `distro/src/main.tsx` | Modified | Changed `.then(applyBahmniTheme)` to `.then((overrides) => applyBahmniTheme({ ...BAHMNI_DEFAULT_THEME, ...overrides }))` |
| `/Users/hamsavarthinir/Desktop/Bahmni/standard-config/openmrs/apps/home/bahmni-theme.json` | Created | Reference theme file with all Bahmni default teal token values |

**Total files modified**: 5 (4 in bahmni-apps-frontend, 1 created in standard-config)

---

## Implementation Summary

### What Was Done
1. Added `isValidHexColour(value: string): boolean` — validates `#` + exactly 3 or 6 hex chars using regex `/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/`
2. Updated `applyBahmniTheme()` to filter out invalid hex values before writing CSS rules, emitting a `console.warn` per invalid token and returning early if no valid entries remain
3. Exported `isValidHexColour` from both `applyTheme.ts` and the design-system `index.ts` public API
4. Fixed merge logic in `main.tsx` so partial overrides spread on top of Bahmni defaults — unspecified tokens retain teal, not Carbon blue
5. Created `bahmni-theme.json` in standard-config as the reference/override template for implementers

### Approach Followed
Approach A from discovery: Validation in applyBahmniTheme() + Merge in main.tsx

### Deviations from Plan
None — followed plan exactly.

---

## Refactoring Performed
No refactoring performed

---

## Work Breakdown Completion

| Sub-task | Status | Notes |
|----------|--------|-------|
| Sub-task 1: Add `isValidHexColour` + filter in `applyBahmniTheme` | ✅ | Validation regex, warn logging, early return on all-invalid |
| Sub-task 2: Update `main.tsx` merge logic | ✅ | Spread defaults then overrides before calling applyBahmniTheme |
| Sub-task 3: Create `bahmni-theme.json` in standard-config | ✅ | All 18 default teal tokens present |
| Sub-task 4: Add tests (`isValidHexColour` + validation in `applyBahmniTheme`) | ✅ | 10 new tests, all passing |

**Completion**: 4/4 sub-tasks complete

---

## Test Results

**Status**: All passing (15/15)

### Tests Added/Modified
**New `isValidHexColour` describe block (7 tests):**
- accepts valid 6-character hex colours
- accepts valid 3-character hex colours
- rejects hex strings missing the hash prefix
- rejects named colours
- rejects hex strings of wrong length
- rejects hex strings with non-hex characters
- rejects empty string

**New tests in `applyBahmniTheme` describe block (3 tests):**
- skips invalid hex values and applies only valid ones
- logs warning for invalid colour values
- does nothing when all values are invalid

**Existing tests preserved (5 tests):**
- does nothing when config is empty
- creates a style tag with id bahmni-theme on first call
- sets correct CSS custom properties on :root, .cds--white and .cds--g10
- reuses the existing style tag on subsequent calls
- applies all tokens from BAHMNI_DEFAULT_THEME

### Test Output
```
PASS @bahmni/design-system src/utils/__tests__/applyTheme.test.ts
  isValidHexColour
    ✓ accepts valid 6-character hex colours (1 ms)
    ✓ accepts valid 3-character hex colours
    ✓ rejects hex strings missing the hash prefix
    ✓ rejects named colours
    ✓ rejects hex strings of wrong length
    ✓ rejects hex strings with non-hex characters
    ✓ rejects empty string
  applyBahmniTheme
    ✓ does nothing when config is empty (1 ms)
    ✓ creates a style tag with id bahmni-theme on first call (2 ms)
    ✓ sets correct CSS custom properties on :root, .cds--white and .cds--g10 (1 ms)
    ✓ reuses the existing style tag on subsequent calls (1 ms)
    ✓ applies all tokens from BAHMNI_DEFAULT_THEME
    ✓ skips invalid hex values and applies only valid ones (11 ms)
    ✓ logs warning for invalid colour values (1 ms)
    ✓ does nothing when all values are invalid (2 ms)

Test Suites: 1 passed, 1 total
Tests:       15 passed, 15 total
Time:        0.657 s
```

---

## Acceptance Criteria Checklist

| Criterion | Status | Notes |
|-----------|--------|-------|
| AC1: Full override — all 18 tokens in config replace defaults | ✅ | Merge spreads full defaults then config; all 18 tokens from config win |
| AC2: Partial override — unspecified tokens retain teal defaults | ✅ | `{ ...BAHMNI_DEFAULT_THEME, ...overrides }` in main.tsx ensures teal fallback for unspecified tokens |
| AC3: Invalid hex fallback — bad values ignored, warning logged | ✅ | `isValidHexColour` filters + `console.warn(\`Invalid colour value for \`$${token}\` — using Bahmni default\`)` |
| AC4: DevTools visibility — tokens visible in browser DevTools | ✅ | `<style id="bahmni-theme">` tag with `:root, .cds--white, .cds--g10` rules remains inspectable |
| AC5: No config = defaults unchanged | ✅ | `fetchThemeConfig` failure path (`.catch(() => {})`) leaves the initial `applyBahmniTheme(BAHMNI_DEFAULT_THEME)` call intact |

**AC Status**: 5/5 met

---

## Follow-up Items
None identified

---

## PR Description (Ready to Copy)

**JIRA**: BAH-4635

### What Changed
- `applyTheme.ts`: Added exported `isValidHexColour()` validator (regex: `#` + 3 or 6 hex chars); `applyBahmniTheme()` now filters invalid hex values with a `console.warn` per bad token and returns early if no valid entries remain
- `index.ts`: Exported `isValidHexColour` from `@bahmni/design-system` public API
- `main.tsx`: Changed override application from `applyBahmniTheme(overrides)` to `applyBahmniTheme({ ...BAHMNI_DEFAULT_THEME, ...overrides })` so partial configs retain teal defaults
- `standard-config/openmrs/apps/home/bahmni-theme.json`: Created reference config file with all 18 Bahmni default teal tokens
- `applyTheme.test.ts`: Added 10 new tests (7 for `isValidHexColour`, 3 for validation behaviour in `applyBahmniTheme`)

### Why
BAH-4634 introduced theme overrides but `applyBahmniTheme` accepted any string value (allowing CSS injection via invalid values) and partial overrides lost teal defaults (fell back to Carbon blue). This PR adds input validation and correct merge semantics.

### How Tested
- [x] Unit tests added/updated
- [x] All tests passing (15/15)

### Acceptance Criteria Met
- [x] Full override applied — all 18 config tokens replace defaults
- [x] Partial override with defaults fallback — unspecified tokens stay teal
- [x] Invalid hex graceful fallback with warning — bad values skipped, console.warn fired
- [x] Config tokens visible in DevTools — style tag preserved
- [x] No config = defaults unchanged — catch block leaves initial apply untouched
