import React from 'react';
import { Modal, Text, Stack, Paper, Group, Badge, Divider, List } from '@mantine/core';
import { FIELD_EXPLANATIONS, FieldExplanation } from '../constants/fieldExplanations';

interface FieldExplanationModalProps {
  opened: boolean;
  onClose: () => void;
  fieldKey: string | null;
}

const FieldExplanationModal: React.FC<FieldExplanationModalProps> = ({
  opened,
  onClose,
  fieldKey
}) => {
  if (!fieldKey || !FIELD_EXPLANATIONS[fieldKey]) return null;

  const field: FieldExplanation = FIELD_EXPLANATIONS[fieldKey];

  const getScoreBadgeColor = (range: string) => {
    if (range.includes('5分') || range.includes('7分') || range.includes('6分') || range.includes('4分')) {
      return 'green';
    } else if (range.includes('3分') || range.includes('2分')) {
      return 'yellow';
    } else if (range.includes('1分')) {
      return 'orange';
    } else {
      return 'red';
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      overlayProps={{
        backgroundOpacity: 0.7,
        blur: 8,
        style: { 
          background: 'linear-gradient(135deg, rgba(0, 10, 20, 0.8) 0%, rgba(0, 30, 60, 0.6) 100%)'
        }
      }}
      title={
        <Group gap="sm">
          <Text size="lg" fw={700} c="#7DF9FF">
            📖 字段释义
          </Text>
          <Badge color="cyan" variant="light" size="sm">
            最高 {field.maxScore} 分
          </Badge>
        </Group>
      }
      size="lg"
      styles={{
        body: {
          background: 'linear-gradient(135deg, rgba(0, 10, 20, 0.98) 0%, rgba(0, 20, 40, 0.95) 100%)',
          color: '#E6FBFF',
          padding: 0
        },
        header: {
          background: 'linear-gradient(135deg, rgba(0, 30, 60, 0.9) 0%, rgba(0, 40, 80, 0.8) 100%)',
          borderBottom: '1px solid rgba(125, 249, 255, 0.3)',
          color: '#7DF9FF',
          padding: '16px 20px'
        },
        title: {
          width: '100%',
          color: '#7DF9FF'
        },
        close: {
          color: '#7DF9FF',
          '&:hover': {
            backgroundColor: 'rgba(125, 249, 255, 0.15)',
            color: '#00FFFF'
          }
        },
        content: {
          padding: '20px',
          background: 'transparent'
        }
      }}
    >
      <Stack gap="md">
        {/* 字段名称和简短描述 */}
        <Paper p="md" style={{
          background: 'linear-gradient(135deg, rgba(125, 249, 255, 0.08) 0%, rgba(0, 255, 255, 0.04) 100%)',
          border: '1px solid rgba(125, 249, 255, 0.25)',
          borderRadius: 10,
          boxShadow: '0 4px 12px rgba(125, 249, 255, 0.1)'
        }}>
          <Text size="xl" fw={700} c="#7DF9FF" mb="xs" style={{
            textShadow: '0 0 8px rgba(125, 249, 255, 0.6)'
          }}>
            {field.name}
          </Text>
          <Text size="md" c="#E6FBFF" style={{ lineHeight: 1.6, opacity: 0.9 }}>
            {field.description}
          </Text>
        </Paper>

        <Divider color="rgba(125, 249, 255, 0.2)" />

        {/* 详细说明 */}
        <Paper p="md" style={{
          background: 'linear-gradient(135deg, rgba(0, 30, 60, 0.4) 0%, rgba(0, 20, 40, 0.6) 100%)',
          border: '1px solid rgba(125, 249, 255, 0.15)',
          borderRadius: 10,
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)'
        }}>
          <Text size="sm" fw={600} c="#7DF9FF" mb="sm">
            🔍 详细评估标准
          </Text>
          <Text size="sm" c="#E6FBFF" style={{ lineHeight: 1.7 }}>
            {field.fullExplanation}
          </Text>
        </Paper>

        <Divider color="rgba(125, 249, 255, 0.2)" />

        {/* 评分标准 */}
        <Paper p="md" style={{
          background: 'linear-gradient(135deg, rgba(0, 30, 60, 0.4) 0%, rgba(0, 20, 40, 0.6) 100%)',
          border: '1px solid rgba(125, 249, 255, 0.15)',
          borderRadius: 10,
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)'
        }}>
          <Text size="sm" fw={600} c="#7DF9FF" mb="sm">
            📊 评分标准
          </Text>
          <Stack gap="sm">
            {field.scoringCriteria.map((criteria, index) => (
              <Group key={index} align="flex-start" gap="sm">
                <Badge 
                  color={getScoreBadgeColor(criteria.range)} 
                  variant="light"
                  size="sm"
                  style={{ minWidth: '60px', textAlign: 'center' }}
                >
                  {criteria.range}
                </Badge>
                <Text size="sm" c="#E6FBFF" style={{ flex: 1, lineHeight: 1.5 }}>
                  {criteria.description}
                </Text>
              </Group>
            ))}
          </Stack>
        </Paper>

        {/* 特殊说明（针对重要字段） */}
        {fieldKey === 'evidenceChain' && (
          <Paper p="md" style={{
            background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.08) 0%, rgba(255, 215, 0, 0.04) 100%)',
            border: '1px solid rgba(255, 215, 0, 0.25)',
            borderRadius: 10,
            boxShadow: '0 2px 8px rgba(255, 215, 0, 0.1)'
          }}>
            <Text size="sm" fw={600} c="#FFD700" mb="sm">
              ⭐ 核心维度说明
            </Text>
            <Text size="sm" c="#FFF8DC" style={{ lineHeight: 1.6 }}>
              证据链是剧本杀质量的核心指标，直接决定游戏的可玩性。评估包含五大特性验证：
            </Text>
            <List size="sm" c="#FFF8DC" mt="xs" withPadding>
              <List.Item><strong>完整性</strong>：逻辑路径无跳跃，不需要"灵光一闪"</List.Item>
              <List.Item><strong>唯一性</strong>：能排除所有非凶手嫌疑人</List.Item>
              <List.Item><strong>可得性</strong>：关键线索有明确获取路径</List.Item>
              <List.Item><strong>层次性</strong>：核心证据+辅助证据+红鲱鱼网络</List.Item>
              <List.Item><strong>逻辑性</strong>：基于客观事实而非主观臆断</List.Item>
            </List>
          </Paper>
        )}

        {fieldKey === 'informationDistribution' && (
          <Paper p="md" style={{
            background: 'linear-gradient(135deg, rgba(0, 255, 0, 0.08) 0%, rgba(0, 255, 0, 0.04) 100%)',
            border: '1px solid rgba(0, 255, 0, 0.25)',
            borderRadius: 10,
            boxShadow: '0 2px 8px rgba(0, 255, 0, 0.1)'
          }}>
            <Text size="sm" fw={600} c="#00FF00" mb="sm">
              💡 评估要点
            </Text>
            <Text size="sm" c="#E6FFE6" style={{ lineHeight: 1.6 }}>
              信息分布公平性是保证游戏体验的关键。避免出现"信息垄断"（一个角色掌握过多线索）
              或"无用角色"（角色没有重要信息）的情况。
            </Text>
          </Paper>
        )}
      </Stack>
    </Modal>
  );
};

export default FieldExplanationModal;
