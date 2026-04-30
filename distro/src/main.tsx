import {
  initFontAwesome,
  applyBahmniTheme,
  BAHMNI_DEFAULT_THEME,
} from '@bahmni/design-system';
import { initAppI18n, fetchThemeConfig } from '@bahmni/services';
import '@bahmni/widgets/styles';
import React, { StrictMode } from 'react';
import * as ReactDOMModule from 'react-dom';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

import App from './app/app';
import { PUBLIC_PATH } from './constants/app';

// Extend Window interface for global React and ReactDOM
declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    React: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ReactDOM: any;
  }
}

// Expose React and ReactDOM globally (needed by form2-controls helpers.js)
// This must be synchronous to avoid race conditions
window.React = React;
window.ReactDOM = ReactDOMModule;

// ── Theme bootstrap ──────────────────────────────────────────────────────────
//
// Step 1 — Apply Bahmni defaults immediately (synchronous, before render).
//   This injects a <style> tag targeting :root, .cds--white and .cds--g10 so
//   Carbon's class-level token values are overridden before any component mounts.
//   Without this, components inside a .cds--white ancestor would show Carbon
//   blue (#0f62fe) until the async fetch below completes.
applyBahmniTheme(BAHMNI_DEFAULT_THEME);

// Step 2 — Fetch operator overrides from standard-config and apply on top.
//   fetchThemeConfig() reads /bahmni_config/openmrs/apps/bahmni-theme.json.
//   If the file is absent or the fetch fails, the catch returns {} and
//   BAHMNI_DEFAULT_THEME colours remain — no config file is required.
//   applyBahmniTheme replaces the style tag content, so only one tag exists.
fetchThemeConfig()
  .then(applyBahmniTheme)
  .catch(() => {});

// ── App render ───────────────────────────────────────────────────────────────
initFontAwesome();
initAppI18n('home').then(() => {
  const root = createRoot(document.getElementById('root') as HTMLElement);
  root.render(
    <StrictMode>
      <BrowserRouter basename={PUBLIC_PATH ?? '/'}>
        <App />
      </BrowserRouter>
    </StrictMode>,
  );
});
