// 共享的选择面板样式（EvidenceSelectorPanel 和 NoteSelectorPanel 共用）

import { MantineStyleProp } from '@mantine/core';

export const selectorModalStyles = {
  content: {
    backgroundColor: 'rgba(18, 18, 18, 0.95)',
    border: '2px solid #00FFFF',
    borderRadius: '16px',
    boxShadow: '0 0 30px rgba(0, 255, 255, 0.3)'
  },
  header: {
    borderBottom: '2px solid rgba(0, 255, 255, 0.3)',
    paddingBottom: '16px',
    backgroundColor: 'transparent'
  },
  title: {
    color: '#00FFFF',
    fontWeight: 700
  },
  close: {
    color: '#00FFFF',
    '&:hover': {
      backgroundColor: 'rgba(0, 255, 255, 0.1)',
      color: '#00FFFF'
    }
  },
  body: {
    backgroundColor: 'transparent'
  }
} as const;

export const selectorSearchInputStyles = {
  input: {
    backgroundColor: 'rgba(0, 255, 255, 0.05)',
    border: '1px solid rgba(0, 255, 255, 0.3)',
    color: '#E0E0E0',
    '&::placeholder': { color: '#00FFFF', opacity: 0.7 },
    '&:focus': { 
      borderColor: '#00FFFF',
      boxShadow: '0 0 10px rgba(0, 255, 255, 0.3)'
    }
  }
} as const;

export const selectorTextInputStyles = selectorSearchInputStyles;

export const recommendBadgeStyles = {
  root: {
    backgroundColor: 'rgba(78, 204, 163, 0.2)',
    color: '#4ECCA3',
    border: '1px solid rgba(78, 204, 163, 0.4)'
  }
} as const;

export const getItemCardStyle = (isSelected: boolean): React.CSSProperties => ({
  cursor: 'pointer',
  border: isSelected 
    ? '2px solid #00FFFF' 
    : '1px solid rgba(0, 255, 255, 0.3)',
  background: isSelected 
    ? 'rgba(0, 255, 255, 0.2)' 
    : 'rgba(18, 18, 18, 0.6)',
  transition: 'all 0.3s ease',
  borderRadius: '12px',
  boxShadow: isSelected 
    ? '0 0 15px rgba(0, 255, 255, 0.3)' 
    : '0 2px 8px rgba(0, 0, 0, 0.2)'
});

export const getItemHoverHandlers = (isSelected: boolean) => ({
  onMouseEnter: (e: React.MouseEvent<HTMLElement>) => {
    if (!isSelected) {
      e.currentTarget.style.border = '2px solid rgba(0, 255, 255, 0.6)';
      e.currentTarget.style.boxShadow = '0 0 10px rgba(0, 255, 255, 0.2)';
    }
  },
  onMouseLeave: (e: React.MouseEvent<HTMLElement>) => {
    if (!isSelected) {
      e.currentTarget.style.border = '1px solid rgba(0, 255, 255, 0.3)';
      e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.2)';
    }
  }
});

export const selectedPreviewBoxStyle: React.CSSProperties = {
  background: 'rgba(0, 255, 255, 0.05)',
  borderRadius: '12px',
  border: '2px solid rgba(0, 255, 255, 0.3)',
  boxShadow: '0 0 15px rgba(0, 255, 255, 0.2)'
};

export const cancelButtonStyles = {
  root: {
    borderColor: 'rgba(0, 255, 255, 0.5)',
    color: '#00FFFF',
    '&:hover': {
      backgroundColor: 'rgba(0, 255, 255, 0.1)',
      borderColor: '#00FFFF'
    }
  }
} as const;

export const getSendButtonStyles = (hasSelection: boolean) => ({
  root: {
    background: hasSelection 
      ? 'linear-gradient(135deg, #4ECCA3 0%, #00C2FF 100%)' 
      : 'rgba(78, 204, 163, 0.3)',
    border: 'none',
    color: '#FFFFFF',
    '&:hover': hasSelection ? {
      background: 'linear-gradient(135deg, #45B993 0%, #0099CC 100%)',
      transform: 'translateY(-1px)',
      boxShadow: '0 4px 15px rgba(78, 204, 163, 0.3)'
    } : undefined,
    '&:disabled': {
      color: '#BDBDBD',
      background: 'rgba(189, 189, 189, 0.2)'
    }
  }
}) as const;
