import {
  getDefaultDateFormat,
  DEFAULT_DATE_FORMAT_STORAGE_KEY,
} from '@bahmni/services';
import React, { ReactNode, useEffect } from 'react';

interface AppContextProviderProps {
  children: ReactNode;
}

export const AppContextProvider: React.FC<AppContextProviderProps> = ({
  children,
}) => {
  useEffect(() => {
    getDefaultDateFormat().then((fmt) => {
      fmt && localStorage.setItem(DEFAULT_DATE_FORMAT_STORAGE_KEY, fmt);
    });
  }, []);

  return <>{children}</>;
};

AppContextProvider.displayName = 'AppContextProvider';
