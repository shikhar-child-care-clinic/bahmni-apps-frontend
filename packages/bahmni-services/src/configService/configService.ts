import Ajv from 'ajv';
import { get } from '../api';
import { ERROR_MESSAGES } from './constants';

/**
 * Generic configuration fetcher and validator
 *
 * It fetches config from a URL, validates against a schema, and optionally post-processes the result.
 *
 * @param configPath - URL path to fetch the configuration
 * @param configSchema - JSON schema for validation
 * @param options - Optional configuration options
 * @param options.postProcess - Optional function to transform the config after validation
 * @returns Validated (and optionally post-processed) configuration object or null if invalid/error
 *
 * @example
 * const config = await getConfig<MyConfig>(url, schema);
 *
 * @example
 * const config = await getConfig<MyConfig>(url, schema, {
 *   postProcess: (config) => ({ ...config, processedAt: Date.now() })
 * });
 */
export const getConfig = async <T>(
  configPath: string,
  configSchema: Record<string, unknown>,
  options?: {
    postProcess?: (config: T) => T | Promise<T>;
  },
): Promise<T | null> => {
  const config = await fetchConfig<T>(configPath);
  if (!config) {
    throw new Error(ERROR_MESSAGES.CONFIG_NOT_FOUND);
  }

  const isValid = await validateConfig(config, configSchema);
  if (!isValid) {
    throw new Error(ERROR_MESSAGES.VALIDATION_FAILED);
  }

  if (options?.postProcess) {
    return await options.postProcess(config);
  }

  return config;
};

/**
 * Fetches raw configuration data from the server
 *
 * @param configPath - URL path to fetch the configuration
 * @returns Configuration object or null if fetch fails
 */
const fetchConfig = async <T>(configPath: string): Promise<T | null> => {
  return await get<T>(configPath);
};

/**
 * Validates configuration against provided JSON schema
 *
 * @param config - Configuration object to validate
 * @param configSchema - JSON schema to validate against
 * @returns Boolean indicating if configuration is valid
 */
const validateConfig = async (
  config: unknown,
  configSchema: Record<string, unknown>,
): Promise<boolean> => {
  const ajv = new Ajv();
  const validate = ajv.compile(configSchema);
  return validate(config);
};
