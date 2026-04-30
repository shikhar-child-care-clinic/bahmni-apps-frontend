/**
 * Bahmni runtime theme configuration
 *
 * Tokens map 1-to-1 with Carbon CSS custom properties — strip "Category/"
 * from the Figma variable name and prepend "--cds-" to get the property name.
 * e.g. Figma "Button/button-primary" → "--cds-button-primary"
 */
export interface BahmniThemeConfig {
  'background-brand'?:       string;
  'button-primary'?:         string;
  'button-primary-hover'?:   string;
  'button-primary-active'?:  string;
  'button-tertiary'?:        string;
  'button-tertiary-hover'?:  string;
  'button-tertiary-active'?: string;
  'interactive'?:            string;
  'focus'?:                  string;
  'border-interactive'?:     string;
  'link-primary'?:           string;
  'link-primary-hover'?:     string;
  'layer-01'?:               string;
}

/**
 * Bahmni brand defaults — same values as bahmni-tokens.scss.
 * Passed to applyBahmniTheme() on app startup so the style-tag injection
 * covers Carbon's .cds--white theme class (which overrides :root via
 * CSS custom property inheritance). Without this call, components inside
 * a .cds--white ancestor would revert to Carbon blue (#0f62fe).
 */
export const BAHMNI_DEFAULT_THEME: Required<BahmniThemeConfig> = {
  'background-brand':       '#007d79',
  'button-primary':         '#007d79',
  'button-primary-hover':   '#006b68',
  'button-primary-active':  '#004144',
  'button-tertiary':        '#007d79',
  'button-tertiary-hover':  '#006b68',
  'button-tertiary-active': '#007d79',
  'interactive':            '#007d79',
  'focus':                  '#007d79',
  'border-interactive':     '#007d79',
  'link-primary':           '#007d79',
  'link-primary-hover':     '#005d5d',
  'layer-01':               '#f4f4f4',
};

/**
 * Applies Bahmni theme tokens at runtime by injecting a <style> tag.
 *
 * WHY a <style> tag instead of document.documentElement.style.setProperty:
 *   Carbon v11 defines tokens on .cds--white / .cds--g10 class elements,
 *   not just :root. CSS custom properties follow inheritance — a value set
 *   on .cds--white is inherited by descendants, overriding the :root value.
 *   Inline styles on :root cannot override class-level values lower in the tree.
 *
 *   Injecting a <style> tag appended to <head> targets both :root AND Carbon's
 *   theme classes. Because it's appended after Carbon's CSS, same-specificity
 *   selectors here win (last definition wins in the cascade).
 *
 * CALL TWICE pattern in main.tsx:
 *   1. applyBahmniTheme(BAHMNI_DEFAULT_THEME) — immediate, before render
 *   2. fetchThemeConfig().then(applyBahmniTheme) — operator overrides on top
 *   Each call replaces the previous tag content, so only one tag exists.
 *
 * @param config - Partial theme config. Only supplied keys are overridden;
 *   keys absent from config are NOT reset to defaults.
 */
export function applyBahmniTheme(config: Partial<BahmniThemeConfig>): void {
  if (Object.keys(config).length === 0) return;

  const rules = Object.entries(config)
    .map(([token, value]) => `  --cds-${token}: ${value};`)
    .join('\n');

  let tag = document.getElementById('bahmni-theme') as HTMLStyleElement | null;
  if (!tag) {
    tag = document.createElement('style');
    tag.id = 'bahmni-theme';
    document.head.appendChild(tag);
  }

  // :root            — covers components not inside a Carbon theme class
  // .cds--white      — Carbon's default light theme class
  // .cds--g10        — Carbon's gray-10 light theme class
  tag.textContent = `:root,\n.cds--white,\n.cds--g10 {\n${rules}\n}`;
}
