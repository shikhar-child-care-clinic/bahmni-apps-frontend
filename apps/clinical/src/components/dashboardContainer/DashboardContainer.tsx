import { Section } from '@bahmni/design-system';
import {
  useTranslation,
  AUDIT_LOG_EVENT_DETAILS,
  AuditEventType,
  dispatchAuditEvent,
} from '@bahmni/services';
import { getWidget, usePatientUUID, useUserPrivilege } from '@bahmni/widgets';
import React, { useEffect, useMemo, useRef } from 'react';
import { useClinicalAppData } from '../../hooks/useClinicalAppData';
import { DashboardSectionConfig } from '../../pages/models';
import { canUserAccessSection } from '../dashboardSection/utils/controlPrivilegeUtils';
import DashboardSection from '../dashboardSection/DashboardSection';
import styles from './styles/DashboardContainer.module.scss';

// TODO: The name is confusing for someone without project context, consider renaming
export interface DashboardContainerProps {
  sections: DashboardSectionConfig[];
  activeItemId?: string | null;
}

/**
 * DashboardContainer component that renders dashboard sections as Carbon Tiles
 *
 * @param {DashboardContainerProps} props - Component props
 * @returns {React.ReactElement} The rendered component
 */
const DashboardContainer: React.FC<DashboardContainerProps> = ({
  sections,
  activeItemId,
}) => {
  const { t } = useTranslation();
  const patientUuid = usePatientUUID();
  const { userPrivileges } = useUserPrivilege();
  // Create a ref map for each section - fix the type definition here
  const sectionRefs = useRef<{
    [key: string]: React.RefObject<HTMLDivElement | null>;
  }>({});

  // Filter sections based on user privileges
  const filteredSections = useMemo(
    () =>
      sections.filter((section) => canUserAccessSection(userPrivileges, section)),
    [userPrivileges, sections],
  );

  const { episodeOfCare, visit, encounter } = useClinicalAppData();

  const allEpisodeOfCareIds = Array.from(
    new Set(episodeOfCare.map((eoc) => eoc.uuid)),
  );
  const allEncounterIds = Array.from(
    new Set([
      ...episodeOfCare.flatMap((eoc) => eoc.encounterUuids),
      ...visit.flatMap((v) => v.encounterUuids),
      ...encounter.map((enc) => enc.uuid),
    ]),
  );
  const allVisitIds = Array.from(
    new Set([
      ...episodeOfCare.flatMap((eoc) => eoc.visitUuids),
      ...visit.map((v) => v.uuid),
    ]),
  );

  // Dispatch dashboard view event when component mounts
  useEffect(() => {
    if (patientUuid) {
      dispatchAuditEvent({
        eventType: AUDIT_LOG_EVENT_DETAILS.VIEWED_CLINICAL_DASHBOARD
          .eventType as AuditEventType,
        patientUuid,
      });
    }
  }, [patientUuid]);

  // Initialize refs for each section
  useEffect(() => {
    filteredSections.forEach((section) => {
      if (section.id) {
        sectionRefs.current[section.id] ??= React.createRef<HTMLDivElement>();
      }
    });
  }, [filteredSections]);

  // Scroll to active section when activeItemId changes
  useEffect(() => {
    if (activeItemId) {
      // Find the section that corresponds to the activeItemId
      const activeSection = filteredSections.find(
        (section) => section.id === activeItemId,
      );

      if (activeSection && activeSection.id && sectionRefs.current[activeSection.id]?.current) {
        // Added optional chaining and null check to prevent errors
        sectionRefs.current[activeSection.id].current?.scrollIntoView({
          behavior: 'smooth',
        });
      }
    }
  }, [activeItemId, filteredSections]);

  // If no accessible sections, show a message
  if (!filteredSections.length) {
    return <div>{t('NO_DASHBOARD_SECTIONS')}</div>;
  }

  return (
    <Section
      className={styles.sectionContainer}
      data-testid="dashboard-container"
    >
      {filteredSections.map((section) => (
        <article
          key={section.id}
          className={styles.displayControlSection}
          ref={sectionRefs.current[section.id as string]}
          data-testid={`dashboard-section-article-${section.name}`}
        >
          <DashboardSection
            section={section}
            ref={sectionRefs.current[section.id as string]}
            episodeOfCareUuids={allEpisodeOfCareIds}
            encounterUuids={allEncounterIds}
            visitUuids={allVisitIds}
          />
        </article>
      ))}
    </Section>
  );
};

export default DashboardContainer;
