import { Button } from '@bahmni/design-system';
import { hasPrivilege, useTranslation } from '@bahmni/services';
import { OverflowMenu, OverflowMenuItem } from '@carbon/react';
import React from 'react';
import { useUserPrivilege } from '../../userPrivileges/useUserPrivilege';
import { MedicationAction } from '../models';
import { handleAction } from './actionHandlers';

type ActionsProps = {
  actions: MedicationAction[];
};

const Actions: React.FC<ActionsProps> = ({ actions }) => {
  const { t } = useTranslation();
  const { userPrivileges } = useUserPrivilege();

  if (actions.length === 1) {
    const action = actions[0];
    return (
      <Button
        id={`medication-action-${action.type}-button`}
        data-testid={`medication-action-${action.type}-button`}
        aria-label={t(action.label)}
        kind="ghost"
        disabled={!hasPrivilege(userPrivileges, action.requiredPrivilege)}
        onClick={() => handleAction(action)}
      >
        {t(action.label)}
      </Button>
    );
  }

  return (
    <OverflowMenu
      id="medication-actions-overflow-menu"
      data-testid="medication-actions-overflow-menu"
      aria-label="medication-actions-overflow-menu-aria-label"
      flipped
    >
      {actions.map((action) => (
        <OverflowMenuItem
          id={`medication-action-${action.type}-item`}
          data-testid={`medication-action-${action.type}-item`}
          aria-label={t(action.label)}
          key={action.type}
          itemText={t(action.label)}
          disabled={!hasPrivilege(userPrivileges, action.requiredPrivilege)}
          onClick={() => handleAction(action)}
        />
      ))}
    </OverflowMenu>
  );
};

export default Actions;
