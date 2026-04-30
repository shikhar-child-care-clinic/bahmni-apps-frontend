// BahmniThemeConfig is defined here independently to avoid a circular dependency:
// bahmni-design-system already depends on @bahmni/services, so importing
// BahmniThemeConfig from @bahmni/design-system would create a cycle.
// TypeScript structural typing ensures this type is compatible with the one
// exported from @bahmni/design-system — same shape, same keys.
export interface BahmniThemeConfig {
  'background-brand'?: string;
  'button-primary'?: string;
  'button-primary-hover'?: string;
  'button-primary-active'?: string;
  'button-tertiary'?: string;
  'button-tertiary-hover'?: string;
  'button-tertiary-active'?: string;
  interactive?: string;
  focus?: string;
  'border-interactive'?: string;
  'layer-01'?: string;
}

// Follows standard-config convention — files under
// standard-config/openmrs/apps/home/ are served at /bahmni_config/openmrs/apps/home/
// Same pattern as whiteLabel.json. An operator creates this file in standard-config
// to change the entire UI theme without any code change or redeploy.
const THEME_CONFIG_URL = '/bahmni_config/openmrs/apps/home/bahmni-theme.json';

export async function fetchThemeConfig(): Promise<Partial<BahmniThemeConfig>> {
  try {
    const res = await fetch(THEME_CONFIG_URL);
    if (!res.ok) return {};
    return res.json() as Promise<Partial<BahmniThemeConfig>>;
  } catch {
    return {};
  }
}
