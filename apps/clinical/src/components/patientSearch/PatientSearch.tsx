import { Search } from '@bahmni/design-system';
import {
  type PatientSearchResult,
  searchPatientByNameOrId,
  useTranslation,
} from '@bahmni/services';
import { useQuery } from '@tanstack/react-query';
import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './PatientSearch.module.scss';

interface PatientSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * PatientSearch component
 *
 * Renders an expandable inline search bar for finding patients by ID.
 * Activated by the search icon in the global header actions.
 * On Enter key press, searches via the Lucene patient search API and
 * shows a results dropdown. Clicking a result navigates to that patient's
 * clinical dashboard.
 *
 * @param {boolean} isOpen - Whether the search bar is expanded/visible
 * @param {function} onClose - Callback to close/collapse the search bar
 * @returns {React.ReactElement | null} The PatientSearch component or null when closed
 */
const PatientSearch: React.FC<PatientSearchProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);

  const [inputValue, setInputValue] = useState('');
  const [submittedTerm, setSubmittedTerm] = useState('');

  const { data: searchResults } = useQuery({
    queryKey: ['patientSearch', submittedTerm],
    queryFn: () => searchPatientByNameOrId(submittedTerm),
    enabled: submittedTerm.trim().length > 0,
  });

  // Reset state when the search panel is closed
  useEffect(() => {
    if (!isOpen) {
      setInputValue('');
      setSubmittedTerm('');
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

  // Keyboard handler: Escape closes the panel
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && inputValue.trim()) {
      setSubmittedTerm(inputValue.trim());
    }
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(event.target.value);
  };

  const handleClear = () => {
    setInputValue('');
    setSubmittedTerm('');
  };

  const handleResultClick = (result: PatientSearchResult) => {
    navigate(`/clinical/${result.uuid}`);
    onClose();
  };

  const showDropdown =
    submittedTerm.trim().length > 0 && searchResults !== undefined;
  const results = (
    (searchResults?.pageOfResults as PatientSearchResult[]) ?? []
  ).filter(
    (patient) =>
      patient.identifier.toLowerCase() === submittedTerm.toLowerCase(),
  );

  return (
    <div
      ref={containerRef}
      className={styles.patientSearchContainer}
      data-testid="patient-search-container"
    >
      <Search
        id="patient-search-input"
        testId="patient-search-input"
        labelText={t('SEARCH_PATIENT_ID_PLACEHOLDER')}
        placeholder={t('SEARCH_PATIENT_ID_PLACEHOLDER')}
        value={inputValue}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onClear={handleClear}
        autoFocus
        size="md"
        className={styles.searchInput}
      />
      {showDropdown && (
        <ul
          className={styles.resultsDropdown}
          data-testid="patient-search-results"
          role="listbox"
          aria-label={t('SEARCH_PATIENT_ID_PLACEHOLDER')}
        >
          {results.length === 0 ? (
            <li
              className={styles.noResults}
              data-testid="patient-search-no-results"
              role="option"
              aria-selected={false}
            >
              {t('NO_MATCHING_RECORDS')}
            </li>
          ) : (
            results.map((result) => (
              <li
                key={result.uuid}
                className={styles.resultItem}
                data-testid={`patient-search-result-${result.uuid}`}
                role="option"
                aria-selected={false}
                onClick={() => handleResultClick(result)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    handleResultClick(result);
                  }
                }}
                tabIndex={0}
              >
                <span
                  className={styles.patientName}
                  data-testid="patient-search-result-name"
                >
                  {[result.givenName, result.middleName, result.familyName]
                    .filter(Boolean)
                    .join(' ')}
                </span>
                <span
                  className={styles.patientIdentifier}
                  data-testid="patient-search-result-identifier"
                >
                  {result.identifier}
                </span>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
};

export default PatientSearch;
