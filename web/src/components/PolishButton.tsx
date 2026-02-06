import React from 'react';
import { ActionIcon, Tooltip } from '@mantine/core';

interface PolishButtonProps {
  onClick: () => void;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  disabled?: boolean;
}

const PolishButton: React.FC<PolishButtonProps> = ({ 
  onClick, 
  size = 'sm', 
  disabled = false 
}) => {
  return (
    <Tooltip 
      label="AI润色优化" 
      position="top"
      styles={{
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.9)',
          color: '#FFFFFF',
          border: '1px solid #00FFFF'
        }
      }}
    >
      <ActionIcon
        onClick={onClick}
        disabled={disabled}
        size={size}
        variant="light"
        styles={{
          root: {
            backgroundColor: 'rgba(0, 255, 255, 0.1)',
            border: '1px solid #00FFFF',
            color: '#00FFFF',
            '&:hover': {
              backgroundColor: 'rgba(0, 255, 255, 0.2)',
              borderColor: '#00FFFF'
            },
            '&:disabled': {
              backgroundColor: 'rgba(100, 100, 100, 0.2)',
              borderColor: '#666',
              color: '#666'
            }
          }
        }}
      >
        🎨
      </ActionIcon>
    </Tooltip>
  );
};

export default PolishButton;
