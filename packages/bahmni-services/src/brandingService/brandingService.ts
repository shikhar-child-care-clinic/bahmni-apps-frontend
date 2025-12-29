import { get } from '../api';
import { LOGIN_BRANDING_URL } from './constants';
import { LoginBranding, WhiteLabelResponse } from './models';

export const getLoginBranding = async (): Promise<LoginBranding> => {
  const response = await get<WhiteLabelResponse>(LOGIN_BRANDING_URL);
  return response?.loginPage ?? {};
};
