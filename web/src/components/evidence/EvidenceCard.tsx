import React from 'react';
import {
  Card,
  Text,
  Badge,
  Group,
  Stack,
  Box,
  Tooltip,
  Image
} from '@mantine/core';
import {
  IconCircle,
  IconCircleCheck,
  IconStar,
  IconSparkles
} from '@tabler/icons-react';
import { Evidence } from '../../types/evidence';
import { getEvidenceOverview } from '../../utils/evidenceManager';

interface EvidenceCardProps {
  evidence: Evidence;
  isSelected?: boolean;
  onClick?: () => void;
  onDoubleClick?: () => void;
  style?: React.CSSProperties;
}

const EvidenceCard: React.FC<EvidenceCardProps> = ({
  evidence,
  isSelected = false,
  onClick,
  onDoubleClick,
  style
}) => {
  // 获取证物图标
  const getEvidenceIcon = (category: string, name: string): string => {
    // 基于类别的默认图标
    const categoryIcons: Record<string, string> = {
      physical: '🔍',
      document: '📄',
      digital: '💾',
      testimony: '🗣️',
      combination: '🧩'
    };
    
    // 基于名称的特定图标
    const nameIcons: Record<string, string> = {
      '刀': '🔪',
      '刀具': '🔪',
      '水果刀': '🔪',
      '手机': '📱',
      '电话': '📞',
      '钱包': '💰',
      '戒指': '💍',
      '项链': '📿',
      '钥匙': '🔑',
      '酒杯': '🍷',
      '杯子': '🥃',
      '衣服': '👔',
      '衣物': '👔',
      '照片': '📷',
      '相片': '📸',
      '文件': '📄',
      '合同': '📋',
      '信件': '💌',
      '车': '🚗',
      '汽车': '🚙',
      '药': '💊',
      '药物': '💉',
      '血': '🩸',
      '血迹': '🩸',
      '指纹': '👆',
      '脚印': '👣',
      '笔': '🖊️',
      '笔记': '📝',
      '日记': '📔',
      '书': '📖',
      '眼镜': '👓',
      '手表': '⌚',
      '包': '👜',
      '箱子': '📦',
      '保险柜': '🔒',
      '门': '🚪',
      '窗': '🪟'
    };
    
    // 检查名称中是否包含特定关键词
    for (const [keyword, icon] of Object.entries(nameIcons)) {
      if (name.includes(keyword)) {
        return icon;
      }
    }
    
    return categoryIcons[category] || '📋';
  };

  // 获取重要度颜色和标识
  const getImportanceBadge = (importance: string) => {
    const configs = {
      critical: { color: 'red', label: '决定性', icon: <IconStar size={12} /> },
      high: { color: 'orange', label: '关键', icon: <IconSparkles size={12} /> },
      medium: { color: 'blue', label: '重要', icon: <IconCircleCheck size={12} /> },
      low: { color: 'gray', label: '一般', icon: <IconCircle size={12} /> }
    };
    return configs[importance as keyof typeof configs] || configs.medium;
  };

  // 获取状态颜色
  const getStateColor = (state: string) => {
    const colors = {
      analyzed: '#4ECCA3',
      investigated: '#FFB74D',
      surface: '#00C2FF',
      hidden: '#757575'
    };
    return colors[state as keyof typeof colors] || colors.surface;
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
            backgroundColor: i < level ? '#4ECCA3' : 'rgba(189, 189, 189, 0.3)'
          }}
        />
      );
    }
    return dots;
  };

  const importanceBadge = getImportanceBadge(evidence.importance);
  const evidenceIcon = getEvidenceIcon(evidence.category, evidence.name);

  return (
    <Card
      p="sm"
      withBorder
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      style={{
        background: isSelected 
          ? 'rgba(0, 255, 255, 0.2)' 
          : 'rgba(18, 18, 18, 0.8)',
        border: isSelected 
          ? '2px solid #00FFFF' 
          : '1px solid rgba(0, 255, 255, 0.3)',
        borderRadius: '12px',
        cursor: onClick ? 'pointer' : 'default',
        position: 'relative',
        transition: 'all 0.3s ease',
        boxShadow: isSelected 
          ? '0 0 20px rgba(0, 255, 255, 0.3)' 
          : '0 2px 8px rgba(0, 0, 0, 0.2)',
        ...style
      }}
      onMouseEnter={(e) => {
        if (onClick || onDoubleClick) {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 0 20px rgba(0, 255, 255, 0.4)';
          e.currentTarget.style.border = '2px solid #00FFFF';
        }
      }}
      onMouseLeave={(e) => {
        if ((onClick || onDoubleClick) && !isSelected) {
          e.currentTarget.style.transform = 'translateY(0px)';
          e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.2)';
          e.currentTarget.style.border = '1px solid rgba(0, 255, 255, 0.3)';
        }
      }}
    >
      {/* 新证物标识 */}
      {evidence.isNew && (
        <Badge
          size="xs"
          color="red"
          variant="filled"
          style={{
            position: 'absolute',
            top: -8,
            right: -8,
            zIndex: 10
          }}
        >
          NEW
        </Badge>
      )}

      {/* 更新标识 */}
      {evidence.hasUpdate && !evidence.isNew && (
        <Badge
          size="xs"
          color="orange"
          variant="filled"
          style={{
            position: 'absolute',
            top: -8,
            right: -8,
            zIndex: 10
          }}
        >
          ↑
        </Badge>
      )}

      <Stack gap="xs">
        {/* 证物图标和名称 */}
        <Group justify="space-between" align="flex-start">
          <Group gap="xs" align="center">
            {/* 显示证物图像或emoji图标 */}
            {evidence.image ? (
              <Image
                src={evidence.image.startsWith('data:') || evidence.image.startsWith('/') 
                  ? evidence.image 
                  : evidence.name.startsWith('受害人：')
                    ? `/character_avatars/${evidence.image}`
                    : `/evidence_images/${evidence.image}`}
                alt={evidence.name}
                width={32}
                height={32}
                fit="cover"
                radius="sm"
                fallbackSrc="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjMyIiBoZWlnaHQ9IjMyIiBmaWxsPSIjMjQyNDI0Ii8+Cjx0ZXh0IHg9IjE2IiB5PSIyMCIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjE2IiBmaWxsPSIjNjY2IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj7wn5aNPC90ZXh0Pgo8L3N2Zz4K"
                style={{
                  border: '1px solid rgba(0, 255, 255, 0.3)',
                  minWidth: 32,
                  minHeight: 32
                }}
              />
            ) : (
              <Text
                size="24px"
                style={{ lineHeight: 1, minWidth: 32, textAlign: 'center' }}
              >
                {evidenceIcon}
              </Text>
            )}
            <Text
              fw={600}
              size="sm"
              c="#00FFFF"
              style={{
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                maxWidth: '80px'
              }}
            >
              {evidence.name}
            </Text>
          </Group>
          
          {/* 重要度徽章 */}
          <Tooltip label={importanceBadge.label}>
            <Badge
              size="xs"
              color={importanceBadge.color}
              variant="light"
              leftSection={importanceBadge.icon}
            >
              {importanceBadge.label}
            </Badge>
          </Tooltip>
        </Group>

        {/* 描述文本 - 只显示证物概况，不显示线索 */}
        <Text
          size="xs"
          c="#BDBDBD"
          style={{
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            lineHeight: 1.3,
            minHeight: '26px'
          }}
        >
          {getEvidenceOverview(evidence)}
        </Text>

        {/* 底部信息 */}
        <Group justify="space-between" align="center">
          {/* 解锁等级 */}
          <Tooltip label={`解锁等级: ${evidence.unlockLevel}/3`}>
            <Group gap={2}>
              {getUnlockLevelDisplay(evidence.unlockLevel)}
            </Group>
          </Tooltip>

          {/* 状态标识 */}
          <Box
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: getStateColor(evidence.discoveryState)
            }}
          />
        </Group>

        {/* 相关角色信息隐藏 - 需要通过游戏探索发现 */}
        {/* relatedActors 不在证物卡片中显示，保持神秘感和探索性 */}
      </Stack>
    </Card>
  );
};

export default EvidenceCard;
