import { Loading } from '@bahmni/design-system';
import { AppContextProvider } from '@bahmni/widgets';
import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';

// IndexPage is now served from the dedicated @bahmni/home-app module.
// The home page components (HomePageGrid, HomePageHeader, LocationContext, etc.)
// have been moved to apps/home/src/. The copies in distro/src/app/ are now
// dead code and can be removed in a follow-up cleanup commit.
const IndexPage = lazy(() =>
  import('@bahmni/home-app').then((module) => ({ default: module.IndexPage })),
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

export function App() {
  return (
    <AppContextProvider>
      <Suspense fallback={<Loading />}>
        <Routes>
          <Route index element={<IndexPage />} />
          <Route path="/clinical/*" element={<ClinicalApp />} />
          <Route path="/registration/*" element={<RegistrationApp />} />
          <Route path="/appointments/*" element={<AppointmentsApp />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </AppContextProvider>
  );
}

export default App;
