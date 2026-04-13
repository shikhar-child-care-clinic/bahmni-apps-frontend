import i18next from 'i18next';
import { get } from '../api';
import { HOME_CONFIG_URL, ERROR_MESSAGES } from './constants';
import { HomeConfig, Module } from './models';

const sortModules = (modules: Module[]): Module[] => {
  return [...modules].sort((a, b) => {
    const orderA = a.order ?? Infinity;
    const orderB = b.order ?? Infinity;

    if (orderA !== orderB) {
      return orderA - orderB;
    }

    return a.id.localeCompare(b.id);
  });
};

/**
 * Fetches home page configuration from the server
 * @returns Promise resolving to HomeConfig with sorted modules
 * @throws Error with i18n key on fetch or parse failure
 */
export const fetchHomeConfig = async (): Promise<HomeConfig> => {
  try {
    const response = await get<HomeConfig>(HOME_CONFIG_URL);

    if (!response?.modules) {
      throw new Error(ERROR_MESSAGES.INVALID_CONFIG);
    }

    return {
      modules: sortModules(response.modules),
    };
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === ERROR_MESSAGES.INVALID_CONFIG
    ) {
      throw new Error(i18next.t(ERROR_MESSAGES.INVALID_CONFIG));
    }

    // eslint-disable-next-line no-console
    console.error('Failed to fetch home config:', error);
    throw new Error(i18next.t(ERROR_MESSAGES.FETCH_FAILED));
  }
};
