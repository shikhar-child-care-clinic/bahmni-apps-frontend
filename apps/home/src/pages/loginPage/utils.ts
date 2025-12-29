import { SUPPORTED_BROWSERS } from '../../constants/login';

export const detectBrowser = () => {
  const userAgent = navigator.userAgent;

  if (userAgent.includes('Edg')) {
    return { isSupported: false, browserName: 'Edge' };
  }

  if (userAgent.includes('Chrome')) {
    return { isSupported: true, browserName: SUPPORTED_BROWSERS.CHROME };
  }

  if (userAgent.includes('Firefox')) {
    return { isSupported: true, browserName: SUPPORTED_BROWSERS.FIREFOX };
  }

  if (userAgent.includes('Safari')) {
    return { isSupported: false, browserName: 'Safari' };
  }

  return { isSupported: false, browserName: 'Unknown' };
};
