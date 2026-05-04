// BahmniThemeConfig is defined here independently to avoid a circular dependency:
// bahmni-design-system already depends on @bahmni/services, so importing
// BahmniThemeConfig from @bahmni/design-system would create a cycle.
// TypeScript structural typing ensures this type is compatible with the one
// exported from @bahmni/design-system — same shape, same keys.
export interface BahmniThemeConfig {
  'background-brand'?: string;
  'text-inverse'?: string;
  'icon-inverse'?: string;
  'button-primary'?: string;
  'button-primary-hover'?: string;
  'button-primary-active'?: string;
  'button-tertiary'?: string;
  'button-tertiary-hover'?: string;
  'button-tertiary-active'?: string;
  interactive?: string;
  focus?: string;
  'border-interactive'?: string;
  'link-primary'?: string;
  'link-primary-hover'?: string;
  'link-secondary'?: string;
  'link-visited'?: string;
  'link-inverse-visited'?: string;
  'layer-01'?: string;
}

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
