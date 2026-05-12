import { Button, IconButton, TrashCan } from '@bahmni/design-system';
import { Add } from '@carbon/icons-react';
import React from 'react';
import styles from './styles/AddMore.module.scss';

export interface AddMoreProps {
  /** Called when the "Add More" button is clicked */
  onAdd?: () => void;
  /** Called when the remove/delete button is clicked */
  onRemove?: () => void;
  /**
   * Called when the "Add Note" button is clicked.
   * Only applicable in the 'control' variant (single ObsControl).
   */
  onAddNote?: () => void;
  /**
   * Whether to show the remove (delete) button.
   * Typically set to true when there is more than one instance of the control.
   */
  showRemove?: boolean;
  /**
   * Whether to show the "Add Note" button.
   * Only rendered in the 'control' variant.
   */
  showAddNote?: boolean;
  /**
   * Layout variant:
   * - 'control' (default): inline row next to a single ObsControl field.
   *   Renders [+ Add More] [Add Note?] [🗑️ Remove?]
   * - 'group': column-stacked below an ObsControlGroup.
   *   Renders only [+ Add More] below the group container.
   */
  variant?: 'control' | 'group';
}

/**
 * AddMore — composite form control component.
 *
 * Built using @bahmni/design-system Button, IconButton, and TrashCan.
 * Replaces the legacy CSS + FontAwesome implementation.
 *
 * For a single ObsControl use variant="control" (default).
 * For an ObsControlGroup use variant="group".
 */
const AddMore: React.FC<AddMoreProps> = ({
  onAdd,
  onRemove,
  onAddNote,
  showRemove = false,
  showAddNote = false,
  variant = 'control',
}) => {
  const addMoreButton = (
    <Button
      kind="ghost"
      size="sm"
      renderIcon={Add}
      onClick={onAdd}
      data-testid="add-more-button"
    >
      Add More
    </Button>
  );

  if (variant === 'group') {
    return (
      <div
        className={styles.addMoreGroupContainer}
        data-testid="add-more-group"
      >
        {addMoreButton}
      </div>
    );
  }

  return (
    <div
      className={styles.addMoreControlContainer}
      data-testid="add-more-control"
    >
      {addMoreButton}
      {showAddNote && (
        <Button
          kind="ghost"
          size="sm"
          onClick={onAddNote}
          data-testid="add-note-button"
        >
          Add Note
        </Button>
      )}
      {showRemove && (
        <IconButton
          kind="ghost"
          size="sm"
          label="Remove"
          onClick={onRemove}
          testId="remove-button"
        >
          <TrashCan />
        </IconButton>
      )}
    </div>
  );
};

export default AddMore;
