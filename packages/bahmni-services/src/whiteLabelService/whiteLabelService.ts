/**
 * Reads bahmni-config/openmrs/apps/home/whiteLabel.json so v2 can render
 * clinic-specific branding (header text, subtitle, logo, login text)
 * without hardcoding anything in the bundle.
 *
 * The same JSON has historically been consumed by the v1 AngularJS shell
 * via localeService.getLoginText(). We read it directly over HTTP because
 * the Apache mount makes /bahmni_config/* publicly available.
 */

export interface WhiteLabelHomePage {
  header_text?: string;
  title_text?: string;
  logo?: string;
}

export interface WhiteLabelLoginPage {
  logo?: string;
  showHeaderText?: boolean;
  showTitleText?: boolean;
}

export interface WhiteLabelConfig {
  homePage?: WhiteLabelHomePage;
  loginPage?: WhiteLabelLoginPage;
}

const WHITELABEL_URL = '/bahmni_config/openmrs/apps/home/whiteLabel.json';

let cached: WhiteLabelConfig | null = null;
let inflight: Promise<WhiteLabelConfig> | null = null;

export const fetchWhiteLabelConfig = async (): Promise<WhiteLabelConfig> => {
  if (cached) return cached;
  if (inflight) return inflight;

  inflight = (async () => {
    try {
      const response = await fetch(WHITELABEL_URL);
      if (!response.ok) {
        // eslint-disable-next-line no-console
        console.warn(
          `whiteLabel.json fetch failed (${response.status}); using empty config`,
        );
        cached = {};
        return cached;
      }
      cached = (await response.json()) as WhiteLabelConfig;
      return cached;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn('whiteLabel.json fetch errored; using empty config', error);
      cached = {};
      return cached;
    } finally {
      inflight = null;
    }
  })();

  return inflight;
};

/**
 * Strip HTML tags from the configured header_text so callers can render
 * it as plain text in Carbon components. whiteLabel.json historically
 * embeds <br/> and <b> tags for the old AngularJS shell.
 */
export const stripHeaderHtml = (raw: string | undefined): string => {
  if (!raw) return '';
  return raw
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
};

export const resetWhiteLabelCacheForTest = (): void => {
  cached = null;
  inflight = null;
};
