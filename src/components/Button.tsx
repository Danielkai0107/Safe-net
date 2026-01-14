import React from 'react';
import MuiButton from '@mui/material/Button';
import type { ButtonProps as MuiButtonProps } from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'success';

interface ButtonProps extends Omit<MuiButtonProps, 'variant' | 'color'> {
  variant?: ButtonVariant;
  isLoading?: boolean;
  children: React.ReactNode;
}

const variantMap: Record<ButtonVariant, { variant: 'contained' | 'outlined'; color: any }> = {
  primary: { variant: 'contained', color: 'primary' },
  secondary: { variant: 'outlined', color: 'primary' },
  danger: { variant: 'contained', color: 'error' },
  success: { variant: 'contained', color: 'success' },
};

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  isLoading = false,
  disabled,
  children,
  ...props
}) => {
  const { variant: muiVariant, color } = variantMap[variant];

  return (
    <MuiButton
      variant={muiVariant}
      color={color}
      disabled={disabled || isLoading}
      startIcon={isLoading ? <CircularProgress size={16} color="inherit" /> : undefined}
      {...props}
    >
      {isLoading ? '處理中...' : children}
    </MuiButton>
  );
};
