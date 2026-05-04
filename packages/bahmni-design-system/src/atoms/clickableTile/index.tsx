import {
  ClickableTile as CarbonClickableTile,
  ClickableTileProps as CarbonClickableTileProps,
} from '@carbon/react';
import React from 'react';

export type ClickableTileProps = CarbonClickableTileProps & {
  testId?: string;
  'data-testid'?: string;
};

export const ClickableTile: React.FC<ClickableTileProps> = ({
  testId,
  'data-testid': dataTestId,
  children,
  ...carbonProps
}) => {
  return (
    <CarbonClickableTile {...carbonProps} data-testid={testId ?? dataTestId}>
      {children}
    </CarbonClickableTile>
  );
};
