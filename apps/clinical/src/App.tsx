import { Content, initFontAwesome } from '@bahmni/design-system';
import { initAppI18n, initializeAuditListener } from '@bahmni/services';
import {
  NotificationProvider,
  NotificationServiceComponent,
  UserPrivilegeProvider,
  ActivePractitionerProvider,
} from '@bahmni/widgets';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import React, { useEffect, useState, useRef } from 'react';
import { Route, Routes } from 'react-router-dom';
import { queryClientConfig } from './config/tanstackQuery';
import { CLINICAL_NAMESPACE } from './constants/app';
import ConsultationPage from './pages/ConsultationPage';
import { ClinicalConfigProvider } from './providers/ClinicalConfigProvider';

const queryClient = new QueryClient(queryClientConfig);

const ClinicalApp: React.FC = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const helpersLoadedRef = useRef(false);

  useEffect(() => {
    const loadFormHelpers = async () => {
      // Load form2-controls helpers.js for form event script execution
      // Only load once per app lifecycle
      if (helpersLoadedRef.current || window.runEventScript) {
        return;
      }

      helpersLoadedRef.current = true;

      // Load helpers.js (React and ReactDOM globals are already set by distro/main.tsx)
      // Note: Direct DOM manipulation is needed here as this is a third-party UMD script
      // that must be loaded globally and isn't managed by React
      return new Promise<void>((resolve, reject) => {
        const helpersScript = document.createElement('script');
        helpersScript.src = `${process.env.PUBLIC_URL ?? '/'}vendor/helpers.js`;
        helpersScript.async = true;
        helpersScript.onload = () => resolve();
        helpersScript.onerror = () => {
          // eslint-disable-next-line no-console
          console.error('Failed to load helpers.js');
          helpersLoadedRef.current = false;
          reject(new Error('Failed to load helpers.js'));
        };
        document.head.appendChild(helpersScript);
      });
    };

    const initializeApp = async () => {
      try {
        await initAppI18n(CLINICAL_NAMESPACE);
        initFontAwesome();
        initializeAuditListener();
        await loadFormHelpers();
        setIsInitialized(true);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Failed to initialize app:', error);
        setIsInitialized(true);
      }
    };

    initializeApp();
  }, []);

  if (!isInitialized) {
    return <div>Loading...</div>;
  }

  return (
    <Content>
      <NotificationProvider>
        <NotificationServiceComponent />
        <QueryClientProvider client={queryClient}>
          <ClinicalConfigProvider>
            <UserPrivilegeProvider>
              <ActivePractitionerProvider>
                <Routes>
                  <Route path=":patientUuid" element={<ConsultationPage />} />
                </Routes>
                <ReactQueryDevtools initialIsOpen={false} />
              </ActivePractitionerProvider>
            </UserPrivilegeProvider>
          </ClinicalConfigProvider>
        </QueryClientProvider>
      </NotificationProvider>
    </Content>
  );
};

export { ClinicalApp };
