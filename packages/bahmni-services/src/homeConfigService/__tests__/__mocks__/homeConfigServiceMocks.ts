import { HomeConfig, Module } from '../../models';

export const mockModule: Module = {
  id: 'registration',
  label: 'HOME_REGISTRATION_TILE',
  icon: 'registration',
  order: 1,
  url: '/registration',
  privileges: ['Add Patients'],
};

export const mockModuleUnsorted: Module = {
  id: 'clinical',
  label: 'HOME_CLINICAL_TILE',
  icon: 'clinical',
  order: 3,
  url: '/clinical',
};

export const mockModuleNoOrder: Module = {
  id: 'admin',
  label: 'HOME_ADMIN_TILE',
  icon: 'admin',
  url: '/admin',
};

export const mockHomeConfig: HomeConfig = {
  modules: [mockModule, mockModuleUnsorted, mockModuleNoOrder],
};

export const mockEmptyHomeConfig: HomeConfig = {
  modules: [],
};

export const mockSortedHomeConfig: HomeConfig = {
  modules: [mockModule, mockModuleUnsorted, mockModuleNoOrder],
};
