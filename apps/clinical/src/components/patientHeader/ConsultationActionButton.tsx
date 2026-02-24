import { Button } from '@bahmni/design-system';
import { hasPrivilege, useTranslation } from '@bahmni/services';
import { useActivePractitioner, useUserPrivilege } from '@bahmni/widgets';
import React from 'react';
import { CONSULTATION_PAD_PRIVILEGES } from '../../constants/consultationPadPrivileges';
import { useEncounterSession } from '../../hooks/useEncounterSession';
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
 * @returns {React.ReactElement} The ConsultationActionButton component
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

  // Check if user has any edit privilege
  const hasEditPrivilege =
    hasPrivilege(userPrivileges, CONSULTATION_PAD_PRIVILEGES.ALLERGIES) ||
    hasPrivilege(userPrivileges, CONSULTATION_PAD_PRIVILEGES.INVESTIGATIONS) ||
    hasPrivilege(userPrivileges, CONSULTATION_PAD_PRIVILEGES.CONDITIONS_AND_DIAGNOSES) ||
    hasPrivilege(userPrivileges, CONSULTATION_PAD_PRIVILEGES.MEDICATIONS) ||
    hasPrivilege(userPrivileges, CONSULTATION_PAD_PRIVILEGES.VACCINATIONS);

  // Button only visible if user has at least one edit privilege
  if (!hasEditPrivilege) {
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
