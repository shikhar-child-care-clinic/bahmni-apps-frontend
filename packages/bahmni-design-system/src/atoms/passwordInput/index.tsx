import {
  PasswordInput as CarbonPasswordInput,
  PasswordInputProps as CarbonPasswordInputProps,
} from '@carbon/react';
import React from 'react';

export type PasswordInputProps = CarbonPasswordInputProps & {
  testId?: string;
};

export const PasswordInput: React.FC<PasswordInputProps> = ({
  testId,
  ...carbonProps
}) => {
  return <CarbonPasswordInput {...carbonProps} data-testid={testId} />;
};
