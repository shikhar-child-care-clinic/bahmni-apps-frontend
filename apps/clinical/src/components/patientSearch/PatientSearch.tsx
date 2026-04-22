import { ComboBox } from '@bahmni/design-system';
import { type PatientSearchResult, useTranslation } from '@bahmni/services';
import { useNotification } from '@bahmni/widgets';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import usePatientSearch from '../../hooks/usePatientSearch';
import { useClinicalConfig } from '../../providers/clinicalConfig';
import type { PatientSearchDisplayField } from '../../providers/clinicalConfig/models';
import styles from './styles/PatientSearch.module.scss';

interface PatientSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

const DEFAULT_DISPLAY_FIELDS: PatientSearchDisplayField[] = [
  { field: 'name', bold: true },
  { field: 'identifier' },
];

const formatPatientName = (patient: PatientSearchResult): string =>
  [patient.givenName, patient.middleName, patient.familyName]
    .filter(Boolean)
    .join(' ');

const getFieldValue = (
  patient: PatientSearchResult,
  field: string,
): string | null => {
  switch (field) {
    case 'name':
      return formatPatientName(patient);
    case 'identifier':
      return patient.identifier;
    case 'gender':
      return patient.gender;
    case 'age':
      return patient.age;
    default:
      return null;
  }
};

const PatientSearch: React.FC<PatientSearchProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { addNotification } = useNotification();
  const { clinicalConfig } = useClinicalConfig();
  const containerRef = useRef<HTMLDivElement>(null);
  const [inputValue, setInputValue] = useState('');
  const [submittedTerm, setSubmittedTerm] = useState('');
  const [selectedPatient, setSelectedPatient] =
    useState<PatientSearchResult | null>(null);

  const displayFields =
    clinicalConfig?.patientSearch?.displayFields ?? DEFAULT_DISPLAY_FIELDS;

  const { results, isLoading, isError, error } =
    usePatientSearch(submittedTerm);

  const showResults =
    submittedTerm.trim().length > 0 &&
    inputValue === submittedTerm &&
    !isLoading &&
    !isError;

  const renderDropdownItem = useMemo(
    () =>
      function PatientSearchItem(item: PatientSearchResult) {
        return (
          <div className={styles.resultItem}>
            {displayFields.map(({ field, bold }) => {
              const value = getFieldValue(item, field);
              if (!value) return null;
              return (
                <span
                  key={field}
                  className={bold ? styles.resultFieldBold : styles.resultField}
                >
                  {value}
                </span>
              );
            })}
          </div>
        );
      },
    [displayFields],
  );

  // Reset state when the search panel is closed
  useEffect(() => {
    if (!isOpen) {
      setInputValue('');
      setSubmittedTerm('');
      setSelectedPatient(null);
    }
  }, [isOpen]);

  // Click-outside handler to close the search panel
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Keyboard handler: Escape closes the panel, Enter submits search
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
        return;
      }
      if (event.key === 'Enter' && inputValue.trim() && !submittedTerm) {
        setSubmittedTerm(inputValue.trim());
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose, inputValue, submittedTerm]);

  useEffect(() => {
    if (isError && submittedTerm) {
      addNotification({
        title: t('ERROR_DEFAULT_TITLE'),
        message: error?.message ?? '',
        type: 'error',
      });
    }
  }, [isError, submittedTerm, addNotification, t, error]);

  if (!isOpen) return null;

  const handleChange = (
    selectedItem: PatientSearchResult | null | undefined,
  ) => {
    if (!selectedItem?.uuid) return;
    navigate(`../${selectedItem.uuid}`);
    setSelectedPatient(selectedItem);
    onClose();
  };

  return (
    <div
      ref={containerRef}
      className={styles.patientSearchContainer}
      data-testid="patient-search-container"
    >
      <ComboBox
        id="patient-search-combobox"
        data-testid="patient-search-combobox"
        placeholder={t('SEARCH_PATIENT_ID_PLACEHOLDER')}
        items={showResults ? results : []}
        itemToString={(item) =>
          item ? `${formatPatientName(item)} (${item.identifier})` : ''
        }
        itemToElement={renderDropdownItem}
        onChange={({ selectedItem }) => handleChange(selectedItem)}
        onInputChange={(input) => {
          setInputValue(input);
          if (!input.trim()) {
            setSubmittedTerm('');
          }
        }}
        selectedItem={selectedPatient}
        clearSelectedOnChange
        shouldFilterItem={() => true}
        autoAlign
        aria-label={t('SEARCH_PATIENT_ID_PLACEHOLDER')}
        size="md"
        className={styles.searchInput}
      />
    </div>
  );
};

export default PatientSearch;
