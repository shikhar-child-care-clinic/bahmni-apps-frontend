export interface ConsultationStartEvent {
  encounterType?: string;
  /**
   * Controls whether the consultation pad opens in edit (resume) or new mode.
   * Defaults to 'new' when omitted for backward compatibility.
   */
  mode?: 'edit' | 'new';
  /**
   * The UUID of the existing encounter to resume when mode === 'edit'.
   * Ignored when mode === 'new'.
   */
  existingEncounterId?: string;
}
