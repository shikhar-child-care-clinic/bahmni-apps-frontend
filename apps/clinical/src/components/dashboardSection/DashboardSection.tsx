import { Tile, IconButton, Edit } from '@bahmni/design-system';
import { useTranslation } from '@bahmni/services';
import { getWidget } from '@bahmni/widgets';
import React, { Suspense, useCallback } from 'react';
import { dispatchConsultationStart } from '../../events/startConsultation';
import { ControlConfig, DashboardSectionConfig } from '../../pages/models';
import { useEncounterDetailsStore } from '../../stores/encounterDetailsStore';
import styles from './styles/DashboardSection.module.scss';

/** Widget types that support the Edit button (encounter resume flow). */
const EDIT_SUPPORTED_WIDGET_TYPES = new Set([
  'allergies',
  'diagnoses',
  'treatment',
]);

export interface DashboardSectionProps {
  section: DashboardSectionConfig;
  ref: React.RefObject<HTMLDivElement | null>;
  episodeOfCareUuids: string[];
  encounterUuids: string[];
  visitUuids: string[];
  /** Whether the current encounter can be resumed (resolved at ConsultationPage level). */
  canResume?: boolean;
  /** Whether the Edit button should be shown at all (true for match_found or no_match). */
  showEditButton?: boolean;
}

/**
 * DashboardSection component that renders a single dashboard section as a Carbon Tile
 *
 * @param {DashboardSectionProps} props - Component props
 * @returns {React.ReactElement} The rendered component
 */
const DashboardSection: React.FC<DashboardSectionProps> = ({
  section,
  ref,
  episodeOfCareUuids,
  encounterUuids,
  visitUuids,
  canResume: propsCanResume,
  showEditButton: propsShowEditButton,
}) => {
  const { t } = useTranslation();

  const selectedEncounterType = useEncounterDetailsStore(
    (state) => state.selectedEncounterType,
  );

  // Fallback to store values if props are not provided
  const storeCanResume = useEncounterDetailsStore((state) => state.canResume);
  const storeShowEditButton = useEncounterDetailsStore(
    (state) => state.showEditButton,
  );

  const canResume = propsCanResume ?? storeCanResume;
  const showEditButton = propsShowEditButton ?? storeShowEditButton;

  /**
   * Handler passed to edit-capable widgets. Only rendered when the backend
   * match-decision API returns match_found or no_match (showEditButton=true).
   * Dispatches consultation-start; mode is determined by canResume prop.
   */
  const handleWidgetEdit = useCallback(() => {
    dispatchConsultationStart({
      encounterType: selectedEncounterType?.name,
      mode: canResume ? 'edit' : 'new',
    });
  }, [canResume, selectedEncounterType]);

  const renderControl = (
    control: ControlConfig,
    index: number,
    totalControls: number,
  ) => {
    const WidgetComponent = getWidget(control.type);

    if (!WidgetComponent) {
      return (
        <div key={`${control.type}-${index}`} className={styles.widgetError}>
          <p>{t('CONTROL_NOT_FOUND', { type: control.type })}</p>
        </div>
      );
    }

    const showDivider = index < totalControls - 1;

    // Provide onEdit and canResume to widgets that support the encounter resume flow.
    // The Edit button is only shown when the backend API indicates match_found or no_match.
    const supportsEdit = EDIT_SUPPORTED_WIDGET_TYPES.has(control.type);
    const onEdit = supportsEdit && showEditButton ? handleWidgetEdit : undefined;

    return (
      <React.Fragment key={`${control.type}-${index}`}>
        <Suspense
          fallback={
            <div className={styles.widgetLoading}>
              {t('INITIALIZING_CONTROL')}
            </div>
          }
        >
          <WidgetComponent
            config={control.config}
            episodeOfCareUuids={episodeOfCareUuids}
            encounterUuids={encounterUuids}
            visitUuids={visitUuids}
            onEdit={onEdit}
            canResume={canResume}
          />
        </Suspense>
        {showDivider && <div className={styles.divider} />}
      </React.Fragment>
    );
  };

  const renderSectionContent = (section: DashboardSectionConfig) => {
    if (!section.controls || section.controls.length === 0) {
      return (
        <div className={styles.noContent}>{t('NO_CONFIGURED_CONTROLS')}</div>
      );
    }

    return (
      <>
        {section.controls.map((control, index) =>
          renderControl(control, index, section.controls.length),
        )}
      </>
    );
  };

  // Check if any control in this section supports Edit
  const sectionHasEditableControls = section.controls?.some((control) =>
    EDIT_SUPPORTED_WIDGET_TYPES.has(control.type),
  );
  const showSectionEditButton =
    sectionHasEditableControls && showEditButton;

  return (
    <div
      id={`section-${section.id}`}
      ref={ref}
      className={styles.sectionWrapper}
      data-testid={`dashboard-section-wrapper-${section.name}`}
    >
      <Tile
        id={`section-${section.id}`}
        className={`${styles.sectionName}${showSectionEditButton ? ` ${styles.sectionNameWithButton}` : ''}`}
        data-testid={`dashboard-section-tile-${section.name}`}
      >
        <p>{t(section.translationKey ?? section.name)}</p>
        {showSectionEditButton && (
          <IconButton
            testId="edit-section-widget"
            autoAlign
            size="md"
            kind="ghost"
            label={t('EDIT_SECTION_LABEL')}
            onClick={handleWidgetEdit}
            className={styles.sectionEditButton}
          >
            <Edit />
          </IconButton>
        )}
      </Tile>
      {renderSectionContent(section)}
    </div>
  );
};

export default DashboardSection;
