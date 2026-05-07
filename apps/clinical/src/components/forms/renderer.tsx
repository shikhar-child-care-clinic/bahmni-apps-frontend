import { MenuItemDivider } from '@bahmni/design-system';
import { useHasPrivilege } from '@bahmni/widgets';
import React from 'react';
import type { ConsultationStartEventPayload } from '../../../events/startConsultation';
import type { InputControl } from './models';

interface InputControlRendererProps {
  entry: InputControl;
  encounterType: string;
  consultationStartEventPayload: ConsultationStartEventPayload;
}

const InputControlRenderer: React.FC<InputControlRendererProps> = ({
  entry,
  encounterType,
  consultationStartEventPayload,
}) => {
  const hasPrivilege = useHasPrivilege(entry.privilege);

  if (
    (entry.encounterTypes && !entry.encounterTypes.includes(encounterType)) ||
    !hasPrivilege
  )
    return null;

  const Component = entry.component;
  return (
    <div>
      <Component
        consultationStartEventPayload={consultationStartEventPayload}
        formConfig={entry.formConfig}
      />
      <MenuItemDivider data-testid={`${entry.key}-divider`} />
    </div>
  );
};

export default InputControlRenderer;
