import { get } from '../api';
import { GLOBAL_PROPERTY_ENDPOINT } from '../constants/app';
import { LOCALE_LANGUAGES_URL } from './constants';
import { GlobalPropertyResponse, LocaleInfo } from './models';

export const getAllowedLocalesList = async (): Promise<string[]> => {
  const response = await get<GlobalPropertyResponse[]>(
    `${GLOBAL_PROPERTY_ENDPOINT}?property=locale.allowed.list`,
  );

  if (response?.[0]?.value) {
    return response[0].value.split(',').map((locale) => locale.trim());
  }

  return ['en'];
};

export const getLocaleLanguages = async (): Promise<Record<string, string>> => {
  return await get<Record<string, string>>(LOCALE_LANGUAGES_URL);
};

export const getAvailableLocales = async (): Promise<LocaleInfo[]> => {
  const [allowedLocales, localeLanguages] = await Promise.all([
    getAllowedLocalesList(),
    getLocaleLanguages(),
  ]);

  return allowedLocales.map((code) => ({
    code,
    nativeName: localeLanguages[code] ?? code,
  }));
};
