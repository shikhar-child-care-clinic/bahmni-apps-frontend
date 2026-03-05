import { Button } from '@bahmni/design-system';
import { hasPrivilege, useTranslation, hasPrivilege } from '@bahmni/services';
import { useActivePractitioner, useUserPrivilege, useUserPrivilege } from '@bahmni/widgets';
import React from 'react';
import { CONSULTATION_PAD_PRIVILEGES } from '../../constants/consultationPadPrivileges';
import { useEncounterSession } from '../../hooks/useEncounterSession';
import { CONSULTATION_PAD_PRIVILEGES } from '../../constants/consultationPadPrivileges';
import styles from './styles/PatientHeader.module.scss';

interface ConsultationActionButtonProps {
  isActionAreaVisible: boolean;
  setIsActionAreaVisible: React.Dispatch<React.SetStateAction<boolean>>;
}

/**
 * ConsultationActionButton component that shows "New Consultation" or "Edit Consultation"
 * based on encounter session state
 *
 * @param {ConsultationActionButtonProps} props - Component props
 * @returns {React.ReactElement | null} The ConsultationActionButton component, or null if user lacks privileges
 */
const ConsultationActionButton: React.FC<ConsultationActionButtonProps> = ({
  isActionAreaVisible,
  setIsActionAreaVisible,
}) => {
  const { t } = useTranslation();
  const { practitioner } = useActivePractitioner();
  const { editActiveEncounter, isLoading } = useEncounterSession({
    practitioner,
  });
  const { userPrivileges } = useUserPrivilege();

  // Check if user has permission to add encounters
  const canAddEncounter = hasPrivilege(
    userPrivileges,
    CONSULTATION_PAD_PRIVILEGES.ENCOUNTER,
  );

  // Hide button if user lacks privilege
  if (!canAddEncounter) {
    return null;
  }
  const { userPrivileges } = useUserPrivilege();

  // Button should only appear with EDIT privileges, not view-only
  const editPrivileges = [
    CONSULTATION_PAD_PRIVILEGES.ALLERGIES,
    CONSULTATION_PAD_PRIVILEGES.INVESTIGATIONS,
    CONSULTATION_PAD_PRIVILEGES.CONDITIONS_AND_DIAGNOSES,
    CONSULTATION_PAD_PRIVILEGES.MEDICATIONS,
    CONSULTATION_PAD_PRIVILEGES.VACCINATIONS,
  ];

  const hasAnyEditPrivilege = editPrivileges.some((privilege) =>
    hasPrivilege(userPrivileges, privilege),
  );

  if (!hasAnyEditPrivilege) {
    return null;
  }

  return (
    <Button
      className={styles.newConsultationButton}
      size="md"
      disabled={isActionAreaVisible || isLoading}
      onClick={() => setIsActionAreaVisible(!isActionAreaVisible)}
      data-testid="consultation-action-button"
    >
      {isActionAreaVisible
        ? t('CONSULTATION_ACTION_IN_PROGRESS')
        : editActiveEncounter
          ? t('CONSULTATION_ACTION_EDIT')
          : t('CONSULTATION_ACTION_NEW')}
    </Button>
  );
};

export default ConsultationActionButton;
