import React, { useState } from 'react';
import {
  Card,
  Text,
  Group,
  Stack,
  Badge,
  Box,
  Collapse,
  ActionIcon,
  Tooltip,
  Image
} from '@mantine/core';
import {
  IconChevronDown,
  IconChevronUp,
  IconEye
} from '@tabler/icons-react';
import { Evidence } from '../../types/evidence';
import { getEvidenceIcon } from '../../utils/evidenceIconUtils';

interface EvidenceMessageBubbleProps {
  evidence: Evidence;
  textContent?: string;
  isFromUser: boolean;
  timestamp?: string;
  onViewDetails?: (evidence: Evidence) => void;
}

const EvidenceMessageBubble: React.FC<EvidenceMessageBubbleProps> = ({
  evidence,
  textContent,
  isFromUser,
  timestamp,
  onViewDetails
}) => {
  const [showDetails, setShowDetails] = useState(false);

  // 获取重要度颜色
  const getImportanceColor = (importance: string) => {
    const colors = {
      critical: 'red',
      high: 'orange',
      medium: 'blue',
      low: 'gray'
    };
    return colors[importance as keyof typeof colors] || 'blue';
  };

  // 获取解锁等级显示
  const getUnlockLevelDisplay = (level: number) => {
    const dots = [];
    for (let i = 0; i < 3; i++) {
      dots.push(
        <Box
          key={i}
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            backgroundColor: i < level ? '#28a745' : '#e9ecef'
          }}
        />
      );
    }
    return dots;
  };

  const evidenceIcon = getEvidenceIcon(evidence.category, evidence.name);

  return (
    <Box
      style={{
        maxWidth: '80%',
        marginLeft: isFromUser ? 'auto' : 0,
        marginRight: isFromUser ? 0 : 'auto'
      }}
    >
      {/* 可选的文字内容 */}
      {textContent && (
        <Card
          p="sm"
          mb="xs"
          style={{
            background: isFromUser 
              ? 'linear-gradient(135deg, #007bff 0%, #0056b3 100%)'
              : '#f8f9fa',
            color: isFromUser ? 'white' : '#333333',
            borderRadius: '12px',
            maxWidth: '100%'
          }}
        >
          <Text size="sm">{textContent}</Text>
        </Card>
      )}

      {/* 证物卡片 */}
      <Card
        p="sm"
        style={{
          background: isFromUser 
            ? 'linear-gradient(135deg, #28a745 0%, #1e7e34 100%)'
            : 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
          border: isFromUser 
            ? '1px solid rgba(255, 255, 255, 0.3)'
            : '1px solid rgba(135, 206, 235, 0.5)',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
        }}
      >
        <Stack gap="sm">
          {/* 证物头部信息 */}
          <Group justify="space-between" align="flex-start">
            <Group gap="sm" align="center">
              {/* 显示证物图像或emoji图标 */}
              {evidence.image ? (
                <Image
                  src={evidence.image.startsWith('data:') || evidence.image.startsWith('/') 
                    ? evidence.image 
                    : evidence.name.startsWith('受害人：')
                      ? `/character_avatars/${evidence.image}`
                      : `/evidence_images/${evidence.image}`}
                  alt={evidence.name}
                  width={40}
                  height={40}
                  fit="cover"
                  radius="sm"
                  fallbackSrc="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjMjQyNDI0Ii8+Cjx0ZXh0IHg9IjIwIiB5PSIyNSIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjI0IiBmaWxsPSIjNjY2IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj7wn5aNPC90ZXh0Pgo8L3N2Zz4K"
                  style={{
                    border: isFromUser 
                      ? '1px solid rgba(255, 255, 255, 0.3)'
                      : '1px solid rgba(135, 206, 235, 0.3)',
                    minWidth: 40,
                    minHeight: 40
                  }}
                />
              ) : (
                <Text size="xl" style={{ lineHeight: 1, minWidth: 40, textAlign: 'center' }}>
                  {evidenceIcon}
                </Text>
              )}
              <Stack gap={2}>
                <Text
                  fw={600}
                  size="sm"
                  c={isFromUser ? 'white' : '#333333'}
                >
                  {evidence.name}
                </Text>
                <Group gap="xs">
                  <Badge
                    size="xs"
                    color={getImportanceColor(evidence.importance)}
                    variant={isFromUser ? 'white' : 'light'}
                  >
                    {evidence.importance === 'critical' ? '决定性' :
                     evidence.importance === 'high' ? '关键' :
                     evidence.importance === 'medium' ? '重要' : '一般'}
                  </Badge>
                  <Group gap={2}>
                    {getUnlockLevelDisplay(evidence.unlockLevel)}
                  </Group>
                </Group>
              </Stack>
            </Group>

            {/* 展开按钮 */}
            <ActionIcon
              size="sm"
              variant="subtle"
              color={isFromUser ? 'white' : 'gray'}
              onClick={() => setShowDetails(!showDetails)}
            >
              {showDetails ? <IconChevronUp size={16} /> : <IconChevronDown size={16} />}
            </ActionIcon>
          </Group>

          {/* 基础描述 */}
          <Text
            size="sm"
            c={isFromUser ? 'rgba(255, 255, 255, 0.9)' : '#555555'}
            style={{ lineHeight: 1.4 }}
          >
            {evidence.basicDescription}
          </Text>

          {/* 展开的详细信息 */}
          <Collapse in={showDetails}>
            <Stack gap="sm" pt="sm" style={{
              borderTop: `1px solid ${isFromUser ? 'rgba(255, 255, 255, 0.2)' : 'rgba(135, 206, 235, 0.3)'}`
            }}>
              {/* 证物线索信息（detailedDescription, deepDescription）对用户不可见 */}
              {/* 相关角色信息隐藏 - 需要通过游戏探索发现 */}
              {/* relatedActors 字段只用于AI上下文分析，不在聊天界面显示给用户 */}
            </Stack>
          </Collapse>

          {/* 底部操作 */}
          <Group justify="space-between" align="center" mt="xs">
            
            {onViewDetails && (
              <Tooltip label="查看详情">
                <ActionIcon
                  size="sm"
                  variant="subtle"
                  color={isFromUser ? 'white' : 'blue'}
                  onClick={() => onViewDetails(evidence)}
                >
                  <IconEye size={14} />
                </ActionIcon>
              </Tooltip>
            )}
          </Group>
        </Stack>
      </Card>
    </Box>
  );
};

export default EvidenceMessageBubble;
