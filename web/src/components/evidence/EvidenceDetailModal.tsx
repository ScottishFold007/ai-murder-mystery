import React, { useState } from 'react';
import {
  Modal,
  Text,
  Group,
  Stack,
  Badge,
  Button,
  Divider,
  ScrollArea,
  Box,
  Timeline,
  ActionIcon,
  Image
} from '@mantine/core';
import {
  IconX,
  IconMessage,
  IconNotes,
  IconCalendar,
  IconEye
} from '@tabler/icons-react';
import { Evidence } from '../../types/evidence';
import { getEvidencePresentationHistory } from '../../utils/evidenceManager';

interface EvidenceDetailModalProps {
  evidence: Evidence;
  opened: boolean;
  onClose: () => void;
  onPresent: (evidence: Evidence) => void;
  sessionId: string;
}

const EvidenceDetailModal: React.FC<EvidenceDetailModalProps> = ({
  evidence,
  opened,
  onClose,
  onPresent,
  sessionId
}) => {
  const [showHistory, setShowHistory] = useState(false);

  // 获取证物类别中文标签
  const getCategoryLabel = (category: string): string => {
    const categoryLabels: Record<string, string> = {
      physical: '物理证物',
      document: '文档资料',
      digital: '数字证据',
      testimony: '证词记录',
      combination: '组合证物'
    };
    return categoryLabels[category] || category;
  };

  // 获取证物图标
  const getEvidenceIcon = (category: string, name: string): string => {
    const categoryIcons: Record<string, string> = {
      physical: '🔍',
      document: '📄',
      digital: '💾',
      testimony: '🗣️',
      combination: '🧩'
    };
    
    const nameIcons: Record<string, string> = {
      '刀': '🔪', '刀具': '🔪', '水果刀': '🔪',
      '手机': '📱', '电话': '📞',
      '钱包': '💰', '戒指': '💍', '项链': '📿',
      '钥匙': '🔑', '酒杯': '🍷', '杯子': '🥃',
      '衣服': '👔', '衣物': '👔',
      '照片': '📷', '相片': '📸',
      '文件': '📄', '合同': '📋', '信件': '💌',
      '车': '🚗', '汽车': '🚙',
      '药': '💊', '药物': '💉',
      '血': '🩸', '血迹': '🩸',
      '指纹': '👆', '脚印': '👣',
      '笔': '🖊️', '笔记': '📝', '日记': '📔'
    };
    
    for (const [keyword, icon] of Object.entries(nameIcons)) {
      if (name.includes(keyword)) return icon;
    }
    
    return categoryIcons[category] || '📋';
  };

  // 获取重要度配置
  const getImportanceConfig = (importance: string) => {
    const configs = {
      critical: { color: '#E63946', label: '决定性', icon: '🔥' },
      high: { color: '#FFB74D', label: '关键', icon: '⭐' },
      medium: { color: '#00C2FF', label: '重要', icon: '🔍' },
      low: { color: '#757575', label: '一般', icon: '📋' }
    };
    return configs[importance as keyof typeof configs] || configs.medium;
  };

  // 获取状态配置
  const getStateConfig = (state: string) => {
    const configs = {
      analyzed: { color: '#4ECCA3', label: '已深度分析', icon: '🔬' },
      investigated: { color: '#FFB74D', label: '已调查', icon: '🔍' },
      surface: { color: '#00C2FF', label: '基础发现', icon: '👁️' },
      hidden: { color: '#757575', label: '隐藏', icon: '❓' }
    };
    return configs[state as keyof typeof configs] || configs.surface;
  };


  // 获取出示历史
  const presentationHistory = getEvidencePresentationHistory(sessionId, evidence.id);

  const importanceConfig = getImportanceConfig(evidence.importance);
  const stateConfig = getStateConfig(evidence.discoveryState);
  const evidenceIcon = getEvidenceIcon(evidence.category, evidence.name);

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group gap="sm">
          <Text size="xl">{evidenceIcon}</Text>
          <Text fw={600} size="lg">
            {evidence.name}
          </Text>
        </Group>
      }
      size="lg"
      styles={{
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
      }}
    >
      <ScrollArea.Autosize mah={600}>
        <Stack gap="lg">
          {/* 状态和重要度 */}
          <Group justify="space-between">
            <Group gap="sm">
              <Badge
                styles={{
                  root: {
                    backgroundColor: `${stateConfig.color}20`,
                    color: stateConfig.color,
                    border: `1px solid ${stateConfig.color}60`
                  }
                }}
                leftSection={<Text>{stateConfig.icon}</Text>}
              >
                {stateConfig.label}
              </Badge>
              <Badge
                styles={{
                  root: {
                    backgroundColor: importanceConfig.color,
                    color: '#FFFFFF',
                    border: `1px solid ${importanceConfig.color}`
                  }
                }}
                leftSection={<Text>{importanceConfig.icon}</Text>}
              >
                {importanceConfig.label}
              </Badge>
            </Group>
            
            {/* 解锁等级显示 */}
            <Group gap="xs">
              <Text size="sm" c="#BDBDBD">等级:</Text>
              {[1, 2, 3].map(level => (
                <Box
                  key={level}
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    backgroundColor: level <= evidence.unlockLevel ? '#4ECCA3' : 'rgba(189, 189, 189, 0.3)',
                    border: level <= evidence.unlockLevel ? '2px solid #4ECCA3' : '2px solid rgba(189, 189, 189, 0.5)',
                    boxShadow: level <= evidence.unlockLevel ? '0 0 8px rgba(78, 204, 163, 0.4)' : 'none'
                  }}
                />
              ))}
            </Group>
          </Group>

          <Divider color="rgba(0, 255, 255, 0.2)" />

          {/* 基础信息 */}
          <Box
            p="md"
            style={{
              backgroundColor: 'rgba(0, 255, 255, 0.03)',
              border: '1px solid rgba(0, 255, 255, 0.2)',
              borderRadius: '12px'
            }}
          >
            <Group gap="xs" mb="md">
              <IconEye size={18} color="#00FFFF" />
              <Text fw={600} size="md" c="#00FFFF">基础信息</Text>
            </Group>
            
            {/* 证物图像 */}
            {evidence.image && (
              <Box 
                mb="md" 
                style={{ 
                  textAlign: 'center',
                  padding: '8px',
                  backgroundColor: 'rgba(0, 0, 0, 0.3)',
                  borderRadius: '8px',
                  border: '1px solid rgba(0, 255, 255, 0.2)'
                }}
              >
                <Text size="sm" c="#00FFFF" fw={600} mb="xs">
                  证物图像
                </Text>
                <Image
                  src={evidence.image.startsWith('data:') || evidence.image.startsWith('/') 
                    ? evidence.image 
                    : evidence.name.startsWith('受害人：')
                      ? `/character_avatars/${evidence.image}`
                      : `/evidence_images/${evidence.image}`}
                  alt={evidence.name}
                  width="100%"
                  height={250}
                  fit="contain"
                  radius="sm"
                  fallbackSrc="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjI1MCIgdmlld0JveD0iMCAwIDMwMCAyNTAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMjUwIiBmaWxsPSIjMTgxODE4Ii8+CjxyZWN0IHg9IjEwIiB5PSIxMCIgd2lkdGg9IjI4MCIgaGVpZ2h0PSIyMzAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzMzMzMzMyIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtZGFzaGFycmF5PSI1LDUiLz4KPHN2ZyB4PSIxMjUiIHk9IjEwMCIgd2lkdGg9IjUwIiBoZWlnaHQ9IjUwIiB2aWV3Qm94PSIwIDAgMjQgMjQiIGZpbGw9IiM2NjY2NjYiPgo8cGF0aCBkPSJtOC41IDEzLjUgMi41LTMgMy41IDQuNSA0LjUtNkwxOSAxNUg1bDMuNS0xLjV6Ii8+CjxwYXRoIGQ9Ik0yMSA5VjdIMTlWNWMwLTEuMS0uOS0yLTItMkg3Yy0xLjEgMC0yIC45LTIgMnYySDNWOWMwLTEuMSAuOS0yIDItMmgxNGMxLjEgMCAyIC45IDIgMnoiLz4KPHN2ZyB4PSIyIiB5PSIyIiB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iIzAwRkZGRiI+CjxwYXRoIGQ9Ik0xMiAyQzYuNDggMiAyIDYuNDggMiAxMnM0LjQ4IDEwIDEwIDEwIDEwLTQuNDggMTAtMTBTMTcuNTIgMiAxMiAyem0tMiAxNWwtNS01IDEuNDEtMS40MUwxMCAxNC4xN2w3LjU5LTcuNTlMMTkgOGwtOSA5eiIvPgo8L3N2Zz4KPHN2Zz4KPHR4dCB4PSIxNTAiIHk9IjE4MCIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjE0IiBmaWxsPSIjODg4IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj7pu4Pkrqvopobnibk8L3R4dD4KPHR4dCB4PSIxNTAiIHk9IjIwMCIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjEyIiBmaWxsPSIjNjY2IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj7miJbogIXnvZHnu5zplJnor688L3R4dD4KPC9zdmc+Cg=="
                  style={{
                    border: '2px solid rgba(0, 255, 255, 0.4)',
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    maxHeight: '250px',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
                  }}
                  onClick={() => {
                    // 可以在这里添加图像放大功能
                    const imageUrl = evidence.image?.startsWith('data:') || evidence.image?.startsWith('/') 
                      ? evidence.image 
                      : evidence.name.startsWith('受害人：')
                        ? `/character_avatars/${evidence.image}`
                        : `/evidence_images/${evidence.image}`;
                    window.open(imageUrl, '_blank');
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.02)';
                    e.currentTarget.style.boxShadow = '0 6px 20px rgba(0, 255, 255, 0.2)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.3)';
                  }}
                />
                <Text size="xs" c="#888" mt="xs">
                  点击图像可放大查看
                </Text>
              </Box>
            )}
            
            <Text size="sm" c="#E0E0E0" style={{ lineHeight: 1.7, marginBottom: '12px' }}>
              {evidence.basicDescription}
            </Text>
            
            <Group gap="md" justify="space-between" align="center">
              <Badge 
                size="lg" 
                styles={{
                  root: {
                    backgroundColor: 'rgba(0, 255, 255, 0.15)',
                    color: '#00FFFF',
                    border: '1px solid rgba(0, 255, 255, 0.4)',
                    fontSize: '13px',
                    fontWeight: 600,
                    padding: '8px 12px'
                  }
                }}
              >
                {getCategoryLabel(evidence.category)}
              </Badge>
            </Group>
          </Box>

          {/* 证物线索信息（detailedDescription, deepDescription）对用户不可见 */}
          {/* 这些信息只在AI聊天上下文中使用，用户无法在前端界面中查看 */}

          {/* 相关角色信息隐藏 - 需要通过游戏探索发现 */}
          {/* relatedActors 字段只用于AI上下文分析，不在用户界面显示 */}

          {/* 关联证物 */}
          {evidence.relatedEvidences.length > 0 && (
            <>
              <Divider color="rgba(0, 255, 255, 0.2)" />
              <Box
                p="md"
                style={{
                  backgroundColor: 'rgba(255, 183, 77, 0.03)',
                  border: '1px solid rgba(255, 183, 77, 0.2)',
                  borderRadius: '12px'
                }}
              >
                <Group gap="xs" mb="md">
                  <IconNotes size={18} color="#FFB74D" />
                  <Text fw={600} size="md" c="#FFB74D">关联证物</Text>
                </Group>
                <Text size="sm" c="#E0E0E0" fw={500}>
                  与 <strong style={{ color: '#FFB74D' }}>{evidence.relatedEvidences.length}</strong> 个其他证物相关
                </Text>
              </Box>
            </>
          )}

          {/* 出示历史 */}
          {presentationHistory.length > 0 && (
            <>
              <Divider color="rgba(0, 255, 255, 0.2)" />
              <Box
                p="md"
                style={{
                  backgroundColor: 'rgba(78, 204, 163, 0.03)',
                  border: '1px solid rgba(78, 204, 163, 0.2)',
                  borderRadius: '12px'
                }}
              >
                <Group gap="xs" mb={showHistory ? "md" : "0"} justify="space-between">
                  <Group gap="xs">
                    <IconMessage size={18} color="#4ECCA3" />
                    <Text fw={600} size="md" c="#4ECCA3">出示记录</Text>
                  </Group>
                  <ActionIcon
                    size="md"
                    variant="subtle"
                    onClick={() => setShowHistory(!showHistory)}
                    styles={{
                      root: {
                        color: '#00FFFF',
                        borderRadius: '8px',
                        '&:hover': {
                          backgroundColor: 'rgba(0, 255, 255, 0.1)',
                          color: '#00FFFF',
                          transform: 'scale(1.05)'
                        }
                      }
                    }}
                  >
                    {showHistory ? <IconX size={16} /> : <IconCalendar size={16} />}
                  </ActionIcon>
                </Group>
                
                {showHistory && (
                  <Timeline 
                    active={presentationHistory.length - 1} 
                    bulletSize={20}
                    styles={{
                      itemBullet: {
                        backgroundColor: '#4ECCA3',
                        border: '2px solid #4ECCA3'
                      },
                      itemBody: {
                        color: '#E0E0E0'
                      }
                    }}
                  >
                    {presentationHistory.slice(-3).map((record, index) => (
                      <Timeline.Item
                        key={record.id}
                        bullet={<IconMessage size={12} />}
                      >
                        <Text size="sm" c="#E0E0E0">
                          向 <strong style={{ color: '#00FFFF' }}>{record.presentedTo}</strong> 出示
                        </Text>
                        {record.newEvidencesUnlocked.length > 0 && (
                          <Text size="xs" c="#4ECCA3">
                            解锁了新信息
                          </Text>
                        )}
                      </Timeline.Item>
                    ))}
                  </Timeline>
                )}
              </Box>
            </>
          )}
        </Stack>
      </ScrollArea.Autosize>

      {/* 底部操作按钮 */}
      <Group justify="flex-end" mt="lg" pt="md" style={{ borderTop: '2px solid rgba(0, 255, 255, 0.3)' }}>
        <Button 
          variant="outline" 
          onClick={onClose}
          styles={{
            root: {
              borderColor: 'rgba(0, 255, 255, 0.5)',
              color: '#00FFFF',
              '&:hover': {
                backgroundColor: 'rgba(0, 255, 255, 0.1)',
                borderColor: '#00FFFF'
              }
            }
          }}
        >
          关闭
        </Button>
        <Button
          leftSection={<IconMessage size={16} />}
          onClick={() => onPresent(evidence)}
          styles={{
            root: {
              background: 'linear-gradient(135deg, #4ECCA3 0%, #00C2FF 100%)',
              border: 'none',
              color: '#FFFFFF',
              '&:hover': {
                background: 'linear-gradient(135deg, #45B993 0%, #0099CC 100%)',
                transform: 'translateY(-1px)',
                boxShadow: '0 4px 15px rgba(78, 204, 163, 0.3)'
              }
            }
          }}
        >
          出示证物
        </Button>
      </Group>
    </Modal>
  );
};

export default EvidenceDetailModal;
