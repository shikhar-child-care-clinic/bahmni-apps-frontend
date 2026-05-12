import { Loading } from '@bahmni/design-system';
import { AppContextProvider } from '@bahmni/widgets';
import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';

const IndexPage = lazy(() =>
  import('./IndexPage').then((module) => ({ default: module.IndexPage })),
);
const NotFoundPage = lazy(() =>
  import('./NotFoundPage').then((module) => ({ default: module.NotFoundPage })),
);
const ClinicalApp = lazy(() =>
  import('@bahmni/clinical-app').then((module) => ({
    default: module.ClinicalApp,
  })),
);
const RegistrationApp = lazy(() =>
  import('@bahmni/registration-app').then((module) => ({
    default: module.RegistrationApp,
  })),
);
const AppointmentsApp = lazy(() =>
  import('@bahmni/appointments-app').then((module) => ({
    default: module.AppointmentsApp,
  })),
);
const LoginPage = lazy(() =>
  import('./pages/LoginPage').then((module) => ({ default: module.LoginPage })),
);

export function App() {
  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        {/* /login renders OUTSIDE AppContextProvider on purpose. The
            provider's useEffect calls getDefaultDateFormat(), which hits a
            privileged OpenMRS endpoint. For an unauthenticated visitor that
            returns 401, and the global axios 401 interceptor force-redirects
            the browser to the legacy AngularJS login at
            /bahmni/home/index.html#/login — which defeats the whole point
            of having a v2 login page. Keep this nesting until the global
            interceptor itself is replaced as part of v2-replace-old-ui-routes. */}
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="*"
          element={
            <AppContextProvider>
              <Routes>
                <Route index element={<IndexPage />} />
                <Route path="/clinical/*" element={<ClinicalApp />} />
                <Route path="/registration/*" element={<RegistrationApp />} />
                <Route
                  path="/appointments/*"
                  element={<AppointmentsApp />}
                />
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </AppContextProvider>
          }
        />
      </Routes>
    </Suspense>
  );
}

export default App;
