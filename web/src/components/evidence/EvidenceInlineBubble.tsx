import React, { useMemo } from 'react';
import { Box, Text, Tooltip } from '@mantine/core';
import { getSmartEvidenceIcon, getEvidenceIconInfo } from '../../utils/evidenceIcons';
import { getEvidenceImageUrl } from '../../api/evidenceImageGenerator';
import { getFilteredEvidences } from '../../utils/evidenceManager';
import { useSessionContext } from '../../providers/sessionContext';
import { buildEvidenceTooltip, getEvidenceOverview } from '../../utils/evidenceManager';
// 移除特殊处理，完全按照STATIC_FILES_SETUP.md的设计原则

interface EvidenceInlineBubbleProps {
  evidenceName: string;
  evidenceCategory: string;
  evidenceImage?: string;
  evidenceDescription?: string; // 基础描述（向后兼容）
  isFromUser: boolean;
  sessionId?: string; // 可选的会话ID，用于获取完整证物信息
}

const EvidenceInlineBubble: React.FC<EvidenceInlineBubbleProps> = ({
  evidenceName,
  evidenceCategory,
  evidenceImage,
  evidenceDescription,
  isFromUser,
  sessionId: propSessionId
}) => {
  const contextSessionId = useSessionContext();
  const sessionId = propSessionId || contextSessionId;

  // 获取完整的证物信息
  const fullEvidenceInfo = useMemo(() => {
    if (!sessionId) return null;
    
    try {
      const evidences = getFilteredEvidences(sessionId);
      const evidence = evidences.find(e => e.name === evidenceName);
      return evidence || null;
    } catch (error) {
      console.warn('获取证物信息失败:', error);
      return null;
    }
  }, [sessionId, evidenceName]);

  // 构建用户可见的悬浮描述（只显示证物概况，不包含线索）
  const tooltipContent = useMemo(() => {
    if (fullEvidenceInfo) {
      // 使用工具函数分离概况和线索，只显示概况部分
      return buildEvidenceTooltip(fullEvidenceInfo);
    }
    
    // 回退到基础描述（如果有的话，也需要过滤线索）
    if (evidenceDescription) {
      const overview = getEvidenceOverview({ basicDescription: evidenceDescription } as any);
      return overview ? `📋 证物概况: ${overview}` : evidenceName;
    }
    
    return evidenceName;
  }, [fullEvidenceInfo, evidenceDescription, evidenceName]);

  // 获取证物图标或图片
  const getEvidenceDisplay = () => {
    // 完全统一的证物图像处理逻辑，严格按照STATIC_FILES_SETUP.md设计原则
    const imageToUse = fullEvidenceInfo?.image || evidenceImage;
    
    if (imageToUse) {
      // 根据证物类型选择正确的静态文件目录
      let imageUrl: string;
      
      if (evidenceName.startsWith('受害人：')) {
        // 受害人证物使用角色头像目录
        imageUrl = `/character_avatars/${imageToUse}`;
      } else {
        // 其他证物使用证物图像目录
        imageUrl = getEvidenceImageUrl(imageToUse);
      }
      
      return (
        <img
          src={imageUrl}
          alt={evidenceName}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            borderRadius: '8px'
          }}
        />
      );
    } else {
      // 使用智能图标匹配
      const iconName = getSmartEvidenceIcon(evidenceName);
      const iconInfo = getEvidenceIconInfo(iconName);
      return (
        <Text
          size="xl"
          style={{
            lineHeight: 1,
            fontSize: '24px'
          }}
        >
          {iconInfo.emoji}
        </Text>
      );
    }
  };

  return (
    <Tooltip
      label={tooltipContent}
      position="top"
      withArrow
      multiline
      w={350}
      styles={{
        tooltip: {
          backgroundColor: 'rgba(20, 20, 20, 0.95)',
          color: '#FFFFFF',
          border: '2px solid rgba(0, 194, 255, 0.5)',
          borderRadius: '12px',
          fontSize: '13px',
          lineHeight: '1.5',
          maxWidth: '350px',
          whiteSpace: 'pre-wrap',
          padding: '16px',
          boxShadow: '0 8px 24px rgba(0, 194, 255, 0.2)'
        }
      }}
      disabled={!tooltipContent || tooltipContent === evidenceName} // 只有有详细信息时才显示tooltip
    >
      <Box
        style={{
          width: '100px',
          height: '100px',
          borderRadius: '8px',
          background: isFromUser 
            ? 'linear-gradient(135deg, rgba(0, 194, 255, 0.2) 0%, rgba(78, 204, 163, 0.15) 100%)'
            : 'linear-gradient(135deg, rgba(78, 204, 163, 0.2) 0%, rgba(0, 194, 255, 0.15) 100%)',
          border: isFromUser 
            ? '2px solid rgba(0, 194, 255, 0.6)'
            : '2px solid rgba(78, 204, 163, 0.6)',
          padding: '8px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
          transition: 'all 0.2s ease',
          cursor: evidenceDescription ? 'help' : 'default',
          position: 'relative'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 8px 20px rgba(0, 194, 255, 0.3)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0px)';
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.3)';
        }}
      >
      {/* 证物图像/图标 */}
      <Box
        style={{
          width: '40px',
          height: '40px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '6px',
          background: 'rgba(0, 0, 0, 0.2)'
        }}
      >
        {getEvidenceDisplay()}
      </Box>

      {/* 证物名称 */}
      <Text
        size="xs"
        fw={700}
        c="#FFFFFF"
        ta="center"
        style={{
          lineHeight: 1.2,
          maxWidth: '100%',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          textShadow: '0 1px 3px rgba(0, 0, 0, 0.8)',
          fontSize: '12px'
        }}
      >
        {evidenceName}
      </Text>
    </Box>
    </Tooltip>
  );
};

export default EvidenceInlineBubble;
