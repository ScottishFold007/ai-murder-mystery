import React from 'react';
import { Modal, ModalProps } from '@mantine/core';

/**
 * 统一的 Modal 基础组件，封装项目中所有 Modal 共用的极光主题样式。
 * 
 * 支持两种预设风格：
 * - 'aurora'（默认）：半透明深色背景 + 青色边框 + 模糊效果
 * - 'solid'：实色深色背景 + 青色边框（EndModal / IntroModal 风格）
 * 
 * 也可以通过 styles prop 覆盖任何预设样式。
 */

export type ModalVariant = 'aurora' | 'solid';

interface BaseModalProps extends Omit<ModalProps, 'styles'> {
  variant?: ModalVariant;
  styles?: ModalProps['styles'];
}

const variantStyles: Record<ModalVariant, ModalProps['styles']> = {
  aurora: {
    content: {
      background: 'linear-gradient(135deg, rgba(26, 26, 46, 0.98) 0%, rgba(30, 30, 30, 0.98) 100%)',
      border: '2px solid rgba(0, 194, 255, 0.3)',
      borderRadius: '16px',
      backdropFilter: 'blur(20px)',
      boxShadow: '0 20px 40px rgba(0, 0, 0, 0.6), 0 0 30px rgba(0, 194, 255, 0.2)',
      color: '#FFFFFF'
    },
    header: {
      background: 'transparent',
      borderBottom: '1px solid rgba(0, 194, 255, 0.2)',
      paddingBottom: '16px'
    },
    title: {
      color: '#FFFFFF',
      fontSize: '24px',
      fontWeight: '700',
      textShadow: '0 2px 4px rgba(0, 0, 0, 0.8)'
    },
    body: {
      padding: '24px'
    },
    close: {
      color: '#FFFFFF',
      '&:hover': {
        backgroundColor: 'rgba(0, 194, 255, 0.1)'
      }
    }
  },
  solid: {
    content: {
      background: 'linear-gradient(135deg, #2A2A3E 0%, #1E1E2E 100%)',
      border: '2px solid #00C2FF',
      borderRadius: '16px',
      boxShadow: '0 0 30px rgba(0, 194, 255, 0.5)',
      color: '#FFFFFF'
    },
    header: {
      background: 'rgba(0, 194, 255, 0.1)',
      borderBottom: '1px solid #00C2FF',
      padding: '20px'
    },
    body: {
      padding: '24px',
      background: 'rgba(255, 255, 255, 0.02)'
    }
  }
};

const BaseModal: React.FC<BaseModalProps> = ({
  variant = 'aurora',
  styles,
  children,
  ...rest
}) => {
  // 合并预设样式和自定义样式
  const baseStyles = variantStyles[variant];
  const mergedStyles: ModalProps['styles'] = styles
    ? (theme) => {
        const base = typeof baseStyles === 'function' ? baseStyles(theme) : baseStyles;
        const custom = typeof styles === 'function' ? styles(theme) : styles;
        return {
          ...base,
          ...custom,
          content: { ...(base as any)?.content, ...(custom as any)?.content },
          header: { ...(base as any)?.header, ...(custom as any)?.header },
          title: { ...(base as any)?.title, ...(custom as any)?.title },
          body: { ...(base as any)?.body, ...(custom as any)?.body },
          close: { ...(base as any)?.close, ...(custom as any)?.close },
        };
      }
    : baseStyles;

  return (
    <Modal styles={mergedStyles} {...rest}>
      {children}
    </Modal>
  );
};

export default BaseModal;
