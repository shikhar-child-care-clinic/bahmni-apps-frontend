export interface Module {
  id: string;
  extensionPointId: string;
  type: string;
  label: string;
  translationKey?: string;
  url: string;
  order: number;
  icon: string;
  requiredPrivilege?: string;
  exclusiveOnlineModule?: boolean;
  exclusiveOfflineModule?: boolean;
}

const BASE_URL = '/bahmni_config/openmrs/apps';
const CUSTOM_URL = '/implementation_config/openmrs/apps';
const EXTENSION_POINT_HOME = 'org.bahmni.home.dashboard';

export const fetchModuleExtensions = async (
  appName: string = 'home',
): Promise<Module[]> => {
  try {
    const baseUrl = `${BASE_URL}/${appName}/extension.json`;
    const baseResponse = await fetch(baseUrl);

    if (!baseResponse.ok) {
      throw new Error(`Failed to load base extensions: ${baseResponse.status}`);
    }

    const baseExtensions: Module[] = await baseResponse.json();
    let customExtensions: Module[] = [];

    try {
      const customUrl = `${CUSTOM_URL}/${appName}/extension.json`;
      const customResponse = await fetch(customUrl);

      if (customResponse.ok) {
        customExtensions = await customResponse.json();
      }
    } catch {
      // Custom config is optional - not an error if missing
      // eslint-disable-next-line no-console
      console.debug(
        `Custom extensions not found at ${CUSTOM_URL}/${appName}/extension.json`,
      );
    }

    const merged = mergeExtensions(baseExtensions, customExtensions);
    return merged;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error fetching module extensions:', error);
    throw error;
  }
};

export const getExtensionsByPoint = (
  extensions: Module[],
  extensionPointId: string = EXTENSION_POINT_HOME,
  type: string = 'link',
): Module[] => {
  return extensions.filter((ext) => {
    const correctPoint = ext.extensionPointId === extensionPointId;
    const correctType = type === 'all' || ext.type === type;
    return correctPoint && correctType;
  });
};

export const filterByPrivilege = (
  extensions: Module[],
  userPrivileges?: string[],
): Module[] => {
  if (!userPrivileges || userPrivileges.length === 0) {
    return extensions;
  }

  return extensions.filter((ext) => {
    if (!ext.requiredPrivilege) {
      return true;
    }
    return userPrivileges.includes(ext.requiredPrivilege);
  });
};

export const filterByOnlineStatus = (modules: Module[]): Module[] => {
  const isOnline = navigator.onLine;

  return modules.filter((module) => {
    if (module.exclusiveOnlineModule && !isOnline) {
      return false;
    }
    if (module.exclusiveOfflineModule && isOnline) {
      return false;
    }
    return true;
  });
};

export const sortByOrder = (modules: Module[]): Module[] => {
  return [...modules].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
};

export const getVisibleModules = async (
  extensionPointId: string = EXTENSION_POINT_HOME,
  userPrivileges?: string[],
): Promise<Module[]> => {
  const allExtensions = await fetchModuleExtensions('home');
  const byPoint = getExtensionsByPoint(allExtensions, extensionPointId);
  const byPrivilege = filterByPrivilege(byPoint, userPrivileges);
  const byStatus = filterByOnlineStatus(byPrivilege);
  return sortByOrder(byStatus);
};

const mergeExtensions = (
  baseExtensions: Module[],
  customExtensions: Module[],
): Module[] => {
  if (!customExtensions || customExtensions.length === 0) {
    return baseExtensions;
  }

  const customMap = new Map(customExtensions.map((ext) => [ext.id, ext]));
  const merged = baseExtensions.map(
    (baseExt) => customMap.get(baseExt.id) ?? baseExt,
  );

  const baseIds = new Set(baseExtensions.map((ext) => ext.id));
  const newExtensions = customExtensions.filter((ext) => !baseIds.has(ext.id));

  return [...merged, ...newExtensions];
};
