import { detectBrowser } from '../utils';

describe('detectBrowser', () => {
  const originalUserAgent = navigator.userAgent;

  afterEach(() => {
    Object.defineProperty(navigator, 'userAgent', {
      value: originalUserAgent,
      writable: true,
    });
  });

  it('should detect Chrome browser as supported', () => {
    Object.defineProperty(navigator, 'userAgent', {
      value:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      writable: true,
    });

    const result = detectBrowser();

    expect(result.isSupported).toBe(true);
    expect(result.browserName).toBe('Chrome');
  });

  it('should detect Firefox browser as supported', () => {
    Object.defineProperty(navigator, 'userAgent', {
      value:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0',
      writable: true,
    });

    const result = detectBrowser();

    expect(result.isSupported).toBe(true);
    expect(result.browserName).toBe('Firefox');
  });

  it('should detect Edge browser as unsupported', () => {
    Object.defineProperty(navigator, 'userAgent', {
      value:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0',
      writable: true,
    });

    const result = detectBrowser();

    expect(result.isSupported).toBe(false);
    expect(result.browserName).toBe('Edge');
  });

  it('should detect Safari browser as unsupported', () => {
    Object.defineProperty(navigator, 'userAgent', {
      value:
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
      writable: true,
    });

    const result = detectBrowser();

    expect(result.isSupported).toBe(false);
    expect(result.browserName).toBe('Safari');
  });

  it('should detect unknown browser as unsupported', () => {
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Unknown Browser',
      writable: true,
    });

    const result = detectBrowser();

    expect(result.isSupported).toBe(false);
    expect(result.browserName).toBe('Unknown');
  });
});
