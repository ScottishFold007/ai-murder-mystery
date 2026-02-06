import React from 'react';
import { ActionIcon, Tooltip } from '@mantine/core';

interface HelpIconProps {
  onClick: () => void;
  tooltip?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
}

const HelpIcon: React.FC<HelpIconProps> = ({ 
  onClick, 
  tooltip = "点击查看详细说明",
  size = 'xs'
}) => {
  return (
    <Tooltip
      label={tooltip}
      position="top"
      withArrow
      styles={{
        tooltip: {
          backgroundColor: 'rgba(26, 26, 46, 0.95)',
          border: '1px solid #7DF9FF',
          color: '#FFFFFF',
          fontSize: '12px'
        }
      }}
    >
      <ActionIcon
        variant="transparent"
        size={size}
        onClick={onClick}
        style={{
          color: '#7DF9FF',
          opacity: 0.7,
          transition: 'all 0.2s ease',
          '&:hover': {
            opacity: 1,
            backgroundColor: 'rgba(125, 249, 255, 0.1)',
            transform: 'scale(1.1)'
          }
        }}
        styles={{
          root: {
            '&:hover': {
              backgroundColor: 'rgba(125, 249, 255, 0.1)',
              transform: 'scale(1.1)',
              opacity: 1
            }
          }
        }}
      >
        <span style={{ 
          fontSize: size === 'xs' ? '12px' : size === 'sm' ? '14px' : '16px',
          fontWeight: 600,
          lineHeight: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          height: '100%',
          borderRadius: '50%',
          border: '1px solid currentColor'
        }}>
          ?
        </span>
      </ActionIcon>
    </Tooltip>
  );
};

export default HelpIcon;
