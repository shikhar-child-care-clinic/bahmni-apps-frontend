import {
  Loading,
  Icon,
  Header,
  ICON_SIZE,
  useSidebarNavigation,
  ActionAreaLayout,
} from '@bahmni/design-system';
import {
  useTranslation,
  BAHMNI_HOME_PATH,
  getConfig,
  generateId,
  post,
} from '@bahmni/services';
import {
  ProgramDetails,
  useNotification,
  useUserPrivilege,
  useActivePractitioner,
  usePatientUUID,
} from '@bahmni/widgets';
import { useQuery } from '@tanstack/react-query';
import React, {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useSearchParams } from 'react-router-dom';
import { useEncounterDetailsStore } from '../stores/encounterDetailsStore';
import ConsultationPad from '../components/consultationPad/';
import DashboardContainer from '../components/dashboardContainer/DashboardContainer';
import PatientHeader from '../components/patientHeader/PatientHeader';
import PatientSearch from '../components/patientSearch/PatientSearch';
import { BAHMNI_CLINICAL_PATH } from '../constants/app';
import { useSubscribeConsultationStart } from '../events/startConsultation';
import { useActiveVisit } from '../hooks/useActiveVisit';
import { useLocations } from '../hooks/useLocations';
import { ClinicalAppProvider } from '../providers/ClinicalAppProvider';
import { useClinicalConfig } from '../providers/clinicalConfig';
import { useObservationFormsStore } from '../stores/observationFormsStore';
import {
  DASHBOARD_CONFIG_URL,
  CURRENT_DASHBOARD_SEARCH_PARAMS_KEY,
  EPISODE_UUID_SEARCH_PARAMS_KEY,
  PROGRAM_UUID_SEARCH_PARAMS_KEY,
} from './constant';
import { DashboardConfig } from './models';
import dashboardConfigSchema from './schema.json';
import styles from './styles/ConsultationPage.module.scss';
import {
  getDefaultDashboard,
  getSidebarItems,
  filterSectionsByPrivileges,
} from './util';

const addSectionIds = (config: DashboardConfig): DashboardConfig => {
  if (!config?.sections?.length) return config;
  return {
    ...config,
    sections: config.sections.map((section) =>
      section.id ? section : { ...section, id: generateId() },
    ),
  };
};

/**
 * ConsultationPage
 *
 * Main clinical consultation interface that displays patient information and clinical dashboard.
 * Integrates clinical layout with patient details, sidebar navigation, and dashboard content.
 * Dynamically loads dashboard configuration and handles navigation between different sections.
 *
 * @returns React component with clinical consultation interface
 */
const ConsultationPage: React.FC = () => {
  const { t } = useTranslation();
  const { clinicalConfig, isLoading: clinicalConfigLoading } =
    useClinicalConfig();
  const { userPrivileges } = useUserPrivilege();
  const { addNotification } = useNotification();
  const [isActionAreaVisible, setIsActionAreaVisible] = useState(false);
  const [encounterType, setEncounterType] = useState('');
  const [consultationMode, setConsultationMode] = useState<'edit' | 'new'>(
    'new',
  );

  useSubscribeConsultationStart(
    useCallback(({ encounterType: type, mode }) => {
      setEncounterType(type);
      setConsultationMode(mode ?? 'new');
      setIsActionAreaVisible(true);
    }, []),
  );

  // --- Encounter match decision (resolved at page level via backend API, passed down to widgets) ---
  const patientUUID = usePatientUUID();
  const { practitioner } = useActivePractitioner();
  const selectedLocation = useEncounterDetailsStore(
    (state) => state.selectedLocation,
  );
  const setActiveVisit = useEncounterDetailsStore(
    (state) => state.setActiveVisit,
  );
  const setSelectedLocation = useEncounterDetailsStore(
    (state) => state.setSelectedLocation,
  );
  const setCanResume = useEncounterDetailsStore((state) => state.setCanResume);
  const setShowEditButton = useEncounterDetailsStore(
    (state) => state.setShowEditButton,
  );

  // Fetch locations on page load
  const { locations } = useLocations();

  // Set default location if not already set
  useEffect(() => {
    if (locations.length > 0 && !selectedLocation) {
      setSelectedLocation(locations[0]);
    }
  }, [locations, selectedLocation, setSelectedLocation]);

  // Fetch active visit on page load
  const { activeVisit: fetchedActiveVisit } = useActiveVisit(patientUUID);

  // Store active visit in global store
  useEffect(() => {
    setActiveVisit(fetchedActiveVisit ?? null);
  }, [fetchedActiveVisit, setActiveVisit]);

  const activeVisit = useEncounterDetailsStore((state) => state.activeVisit);

  // Call match-decision API on page load - only once per session
  interface EncounterMatchResponse {
    status: string;
    encounterUuid?: string;
    reason?: string;
  }

  const [matchDecisionResponse, setMatchDecisionResponse] =
    useState<EncounterMatchResponse | null>(null);
  const matchDecisionFetchedRef = useRef(false);

  useEffect(() => {
    if (
      !matchDecisionFetchedRef.current &&
      patientUUID &&
      activeVisit?.id &&
      practitioner?.uuid &&
      selectedLocation?.uuid
    ) {
      matchDecisionFetchedRef.current = true;
      post<EncounterMatchResponse, object>(
        '/openmrs/ws/rest/v1/bahmnicore/bahmniencounter/match-decision',
        {
          patientUuid: patientUUID,
          visitUuid: activeVisit.id,
          providerUuid: practitioner.uuid,
          locationUuid: selectedLocation.uuid,
        },
      )
        .then((response) => {
          setMatchDecisionResponse(response);
        })
        .catch((error) => {
          console.error('Error fetching match decision:', error);
        });
    }
  }, [patientUUID, activeVisit?.id, practitioner?.uuid, selectedLocation?.uuid]);

  const canResume = matchDecisionResponse?.status === 'match_found';
  const showEditButton =
    matchDecisionResponse?.status === 'match_found' ||
    matchDecisionResponse?.status === 'no_match';

  // Store match-decision results in the store to persist across modal open/close
  useEffect(() => {
    setCanResume(canResume);
    setShowEditButton(showEditButton);
  }, [canResume, showEditButton, setCanResume, setShowEditButton]);

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchParams] = useSearchParams();

  const handleSearchOpen = useCallback(() => setIsSearchOpen(true), []);
  const handleSearchClose = useCallback(() => setIsSearchOpen(false), []);

  const globalActions = useMemo(
    () => [
      {
        id: 'search',
        label: t('GLOBAL_ACTION_SEARCH'),
        renderIcon: (
          <Icon id="search-icon" name="fa-search" size={ICON_SIZE.LG} />
        ),
        onClick: handleSearchOpen,
      },
      {
        id: 'notifications',
        label: t('GLOBAL_ACTION_NOTIFICATIONS'),
        renderIcon: (
          <Icon id="notifications-icon" name="fa-bell" size={ICON_SIZE.LG} />
        ),
        onClick: () => {},
      },
      {
        id: 'user',
        label: t('GLOBAL_ACTION_USER'),
        renderIcon: <Icon id="user-icon" name="fa-user" size={ICON_SIZE.LG} />,
        onClick: () => {},
      },
    ],
    [handleSearchOpen, t],
  );
  const viewingForm = useObservationFormsStore((state) => state.viewingForm);

  const breadcrumbItems = [
    { id: 'home', label: 'Home', href: BAHMNI_HOME_PATH },
    {
      id: 'clinical',
      label: 'Clinical',
      href: BAHMNI_CLINICAL_PATH,
    },
    { id: 'current', label: t('CURRENT_PATIENT'), isCurrentPage: true },
  ];

  const episodeUuids = useMemo(() => {
    const episodeUuid = searchParams.get(EPISODE_UUID_SEARCH_PARAMS_KEY);
    if (!episodeUuid) return [];
    return episodeUuid
      .split(',')
      .map((id) => id.trim())
      .filter(Boolean);
  }, [searchParams]);

  const currentDashboardParam = searchParams.get(
    CURRENT_DASHBOARD_SEARCH_PARAMS_KEY,
  );

  const currentDashboard = useMemo(() => {
    if (!clinicalConfig) return null;

    if (!currentDashboardParam) {
      return getDefaultDashboard(clinicalConfig.dashboards || []);
    }

    return clinicalConfig.dashboards?.find(
      (dashboard) => dashboard.name === currentDashboardParam,
    );
  }, [clinicalConfig, currentDashboardParam]);

  const dashboardURL = currentDashboard?.url ?? null;

  const {
    data: dashboardConfig,
    isLoading: isDashboardConfigLoading,
    error: dashboardConfigError,
  } = useQuery({
    queryKey: ['dashboardConfig', dashboardURL],
    queryFn: () =>
      getConfig<DashboardConfig>(
        DASHBOARD_CONFIG_URL(dashboardURL),
        dashboardConfigSchema,
      ),
    select: addSectionIds,
    enabled: !!dashboardURL,
  });

  useEffect(() => {
    if (dashboardConfigError) {
      addNotification({
        title: t('ERROR_LOADING_DASHBOARD_CONFIG'),
        message: dashboardConfigError.message,
        type: 'error',
      });
    }
  }, [dashboardConfigError]);

  const filteredDashboardConfig = useMemo(() => {
    if (!dashboardConfig || !userPrivileges) return null;
    return {
      ...dashboardConfig,
      sections: filterSectionsByPrivileges(dashboardConfig.sections),
    };
  }, [dashboardConfig, userPrivileges]);

  const sidebarItems = useMemo(() => {
    if (!filteredDashboardConfig) return [];
    return getSidebarItems(filteredDashboardConfig, t);
  }, [filteredDashboardConfig, t]);

  const { activeItemId, handleItemClick } = useSidebarNavigation(sidebarItems);

  if (clinicalConfigLoading) {
    return (
      <Loading
        id="loading-clinical-config"
        description={t('LOADING_CLINICAL_CONFIG')}
        role="status"
      />
    );
  }
  if (!userPrivileges) {
    return <Loading description={t('LOADING_USER_PRIVILEGES')} role="status" />;
  }
  if (!currentDashboard) {
    const errorMessage = currentDashboardParam
      ? t('ERROR_DASHBOARD_NOT_CONFIGURED', {
          dashboardName: currentDashboardParam,
        })
      : t('ERROR_NO_DEFAULT_DASHBOARD');

    addNotification({
      title: t('ERROR_DEFAULT_TITLE'),
      message: errorMessage,
      type: 'error',
    });
    return (
      <div
        id="error-no-default-dashboard"
        data-testid="error-no-default-dashboard-test-id"
      />
    );
  }

  if (isDashboardConfigLoading) {
    return (
      <Loading
        id="loading-dashboard-config"
        data-testid="loading-dashboard-config-test-id"
        description={t('LOADING_DASHBOARD_CONFIG')}
        role="status"
      />
    );
  }

  const renderContextInformation = () => {
    const programUUID = searchParams.get(PROGRAM_UUID_SEARCH_PARAMS_KEY);
    if (programUUID && clinicalConfig.contextInformation?.program)
      return (
        <ProgramDetails
          programUUID={programUUID}
          config={{
            fields: clinicalConfig.contextInformation?.program?.fields ?? [],
          }}
        />
      );
    return null;
  };

  return (
    <ClinicalAppProvider episodeUuids={episodeUuids}>
      {/* Rendered outside ActionAreaLayout: uses position:fixed to overlay the header area.
          Placed here (inside ClinicalAppProvider) so it has access to clinical context. */}
      <PatientSearch isOpen={isSearchOpen} onClose={handleSearchClose} />
      <ActionAreaLayout
        headerWSideNav={
          <Header
            breadcrumbItems={breadcrumbItems}
            globalActions={globalActions}
            sideNavItems={sidebarItems}
            activeSideNavItemId={activeItemId}
            onSideNavItemClick={handleItemClick}
            isRail={isActionAreaVisible}
          />
        }
        mainDisplay={
          <Suspense
            data-testid="suspense-dashboard-container-test-id"
            fallback={
              <Loading
                id="loading-dashboard-content"
                data-testid="loading-dashboard-content-test-id"
                description={t('LOADING_DASHBOARD_CONTENT')}
                role="status"
              />
            }
          >
            <div
              id="section-sticky-header"
              data-testid="section-sticky-header-test-id"
              role="region"
              aria-label={t('PATIENT_HEADER_SECTION')}
              className={styles.stickySection}
            >
              <PatientHeader isActionAreaVisible={isActionAreaVisible} />
              {renderContextInformation()}
            </div>
            <DashboardContainer
              sections={filteredDashboardConfig!.sections}
              activeItemId={activeItemId}
              canResume={canResume}
              showEditButton={showEditButton}
            />
          </Suspense>
        }
        isActionAreaVisible={isActionAreaVisible}
        layoutVariant={viewingForm ? 'extended' : 'default'}
        actionArea={
          <ConsultationPad
            encounterType={encounterType}
            mode={consultationMode}
            onClose={() => setIsActionAreaVisible((prev) => !prev)}
          />
        }
      />
    </ClinicalAppProvider>
  );
};

export default ConsultationPage;
