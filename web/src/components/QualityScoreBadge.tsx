import React from 'react';
import { Badge, Group, Text, Tooltip, Stack, Progress } from '@mantine/core';
import { parseQualityReport, getScoreColor } from '../utils/qualityReportParser';

interface QualityScoreBadgeProps {
  qualityReport?: string;
  compact?: boolean; // 是否使用紧凑模式
}

const QualityScoreBadge: React.FC<QualityScoreBadgeProps> = ({ 
  qualityReport, 
  compact = false 
}) => {
  if (!qualityReport) return null;

  const scoreData = parseQualityReport(qualityReport);
  if (!scoreData) return null;

  const scoreColor = getScoreColor(scoreData);
  
  // 计算分项颜色的函数
  const getItemScoreColor = (score: number, maxScore: number) => {
    const percentage = (score / maxScore) * 100;
    if (percentage >= 90) return '#00FF00';      // 优秀 - 绿色
    if (percentage >= 80) return '#00FFFF';      // 良好 - 青色  
    if (percentage >= 70) return '#FFD700';      // 合格 - 黄色
    return '#FF0000';                            // 不合格(<70%) - 红色
  };

  // 紧凑模式 - 只显示总分和等级
  if (compact) {
    return (
      <Tooltip
        label={
          <Stack gap="xs" style={{ minWidth: 200 }}>
            <Text size="sm" fw={600}>质检评分详情</Text>
            <Group justify="space-between">
              <Text size="xs">总分:</Text>
              <Text size="xs" fw={600}>{scoreData.totalScore}/{scoreData.totalPossible}</Text>
            </Group>
            <Group justify="space-between">
              <Text size="xs">内容逻辑:</Text>
              <Text size="xs" fw={600} c={getItemScoreColor(scoreData.breakdown.contentLogic, 70)}>
                {scoreData.breakdown.contentLogic}/70
              </Text>
            </Group>
            <Group justify="space-between">
              <Text size="xs">AI执行:</Text>
              <Text size="xs" fw={600} c={getItemScoreColor(scoreData.breakdown.aiExecution, 30)}>
                {scoreData.breakdown.aiExecution}/30
              </Text>
            </Group>
            <Group justify="space-between">
              <Text size="xs">玩家体验:</Text>
              <Text size="xs" fw={600} c={getItemScoreColor(scoreData.breakdown.playerExperience, 20)}>
                {scoreData.breakdown.playerExperience}/20
              </Text>
            </Group>
            <Progress 
              value={(scoreData.totalScore / scoreData.totalPossible) * 100} 
              color={scoreColor}
              size="xs"
              style={{ marginTop: 4, marginBottom: 4 }}
            />
            <Text size="xs" c="dimmed" style={{ textAlign: 'center' }}>
              {scoreData.summary || `质量评级: ${scoreData.gradeText}`}
            </Text>
          </Stack>
        }
        position="top"
        withArrow
        multiline
        styles={{
          tooltip: {
            backgroundColor: 'rgba(26, 26, 46, 0.95)',
            border: `1px solid ${scoreColor}`,
            color: '#FFFFFF',
            maxWidth: '220px'
          }
        }}
      >
        <Badge
          size="sm"
          style={{
            backgroundColor: `${scoreColor}20`,
            border: `1px solid ${scoreColor}`,
            color: scoreColor,
            cursor: 'pointer'
          }}
        >
          {scoreData.totalScore}分 {scoreData.gradeText}
        </Badge>
      </Tooltip>
    );
  }

  // 完整模式 - 显示详细信息
  return (
    <Group gap="xs" align="center">
      <Badge
        size="sm"
        style={{
          backgroundColor: `${scoreColor}20`,
          border: `1px solid ${scoreColor}`,
          color: scoreColor
        }}
      >
        {scoreData.totalScore}/{scoreData.totalPossible}分
      </Badge>
      
      <Badge
        size="sm"
        style={{
          backgroundColor: `${scoreColor}15`,
          border: `1px solid ${scoreColor}`,
          color: scoreColor,
          fontWeight: 'bold'
        }}
      >
        {scoreData.gradeText}
      </Badge>

    </Group>
  );
};

export default QualityScoreBadge;
