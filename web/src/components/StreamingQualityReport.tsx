import React, { useState } from 'react';
import { Stack, Paper, Group, Text, Badge, Progress, Grid, Alert, Divider } from '@mantine/core';
import { parseStreamingJson, analyzeProgress, getOverallProgress } from '../utils/streamingJsonParser';
import { getDetailLabel, getMaxScore } from '../constants/fieldExplanations';
import FieldExplanationModal from './FieldExplanationModal';
import HelpIcon from './HelpIcon';

interface StreamingQualityReportProps {
  streamingContent: string;
  isStreaming: boolean;
}

const StreamingQualityReport: React.FC<StreamingQualityReportProps> = ({ 
  streamingContent, 
  isStreaming 
}) => {
  const report = parseStreamingJson(streamingContent);
  const progress = analyzeProgress(report);
  const overallProgress = getOverallProgress(progress);
  
  // 帮助模态框状态
  const [helpModalOpened, setHelpModalOpened] = useState(false);
  const [selectedField, setSelectedField] = useState<string | null>(null);
  
  const handleHelpClick = (fieldKey: string) => {
    setSelectedField(fieldKey);
    setHelpModalOpened(true);
  };
  
  // 调试信息 (可选择性开启)
  // console.log('StreamingContent length:', streamingContent.length);
  // console.log('Parsed Report:', report);
  // console.log('Progress:', progress);
  // console.log('Overall Progress:', overallProgress);

  const getStatusIcon = (status: 'pending' | 'processing' | 'completed') => {
    switch (status) {
      case 'completed': return '✅';
      case 'processing': return '🔄';
      case 'pending': return '⏳';
    }
  };

  const getStatusColor = (status: 'pending' | 'processing' | 'completed') => {
    switch (status) {
      case 'completed': return '#00FFFF';
      case 'processing': return '#FFD700';
      case 'pending': return '#666';
    }
  };

  const getGradeColor = (grade?: string) => {
    switch (grade) {
      case 'excellent': return '#00FF00';
      case 'good': return '#7DF9FF';
      case 'fair': return '#FFD700';
      case 'poor': return '#FF6B6B';
      default: return '#CCCCCC';
    }
  };

  const getGradeText = (grade?: string) => {
    switch (grade) {
      case 'excellent': return '优秀';
      case 'good': return '良好';
      case 'fair': return '合格';
      case 'poor': return '不合格';
      default: return '评估中';
    }
  };


  const getScoreColor = (score: number, maxScore: number) => {
    const percentage = (score / maxScore) * 100;
    if (percentage >= 90) return '#00FF00';      // 绿色 - 优秀
    if (percentage >= 80) return '#7DF9FF';      // 青色 - 良好  
    if (percentage >= 70) return '#FFD700';      // 金色 - 合格
    return '#FF6B6B';                            // 红色 - 不合格
  };

  return (
    <>
    <Stack gap="md">
      {/* 总体进度 */}
      <Paper p="md" style={{
        background: 'linear-gradient(135deg, rgba(0, 10, 20, 0.8) 0%, rgba(0, 20, 40, 0.7) 100%)',
        border: '1px solid rgba(0, 194, 255, 0.6)',
        borderRadius: 12
      }}>
        <Group justify="space-between" mb="sm">
          <Text size="lg" c="#E6FBFF" fw={600}>
            🔎 剧本质检报告 - {report.scriptTitle || '评估中...'}
          </Text>
          <Badge color="cyan" variant="light" size="sm">
            {isStreaming ? '流式生成中' : '生成完成'}
          </Badge>
        </Group>
        
        <Group gap="md" mb="md">
          <Text size="sm" c="#E6FBFF">评估进度: {overallProgress}%</Text>
          {report.totalScore !== undefined && report.totalMaxScore && (
            <Text size="sm" c="#E6FBFF">
              总分: {report.totalScore}/{report.totalMaxScore} ({report.percentage || 0}%)
            </Text>
          )}
          {report.grade && (
            <Badge 
              color={getGradeColor(report.grade)} 
              variant="filled" 
              size="sm"
              style={{ color: '#001018' }}
            >
              {getGradeText(report.grade)}
            </Badge>
          )}
        </Group>
        
        <Progress 
          value={overallProgress} 
          color="cyan" 
          size="sm" 
          style={{ 
            backgroundColor: 'rgba(0, 0, 0, 0.3)',
          }}
        />
      </Paper>

      <Grid>
        {/* 基础信息卡片 */}
        <Grid.Col span={12}>
          <Paper p="md" style={{
            background: progress.basicInfo === 'completed' 
              ? 'linear-gradient(135deg, rgba(0, 255, 255, 0.1) 0%, rgba(0, 194, 255, 0.05) 100%)'
              : 'linear-gradient(135deg, rgba(102, 102, 102, 0.1) 0%, rgba(68, 68, 68, 0.05) 100%)',
            border: `1px solid ${getStatusColor(progress.basicInfo)}`,
            borderRadius: 8,
            opacity: progress.basicInfo === 'pending' ? 0.6 : 1,
            transition: 'all 0.3s ease'
          }}>
            <Group gap="sm" mb="xs">
              <Text size="md" c={getStatusColor(progress.basicInfo)} fw={500}>
                {getStatusIcon(progress.basicInfo)} 📋 基础信息
              </Text>
              <Badge 
                size="xs" 
                color={progress.basicInfo === 'completed' ? 'cyan' : 'gray'}
                variant="light"
              >
                {progress.basicInfo === 'completed' ? '已完成' : 
                 progress.basicInfo === 'processing' ? '评估中' : '待评估'}
              </Badge>
            </Group>
            
            {progress.basicInfo !== 'pending' && (
              <Grid gutter="xs">
                <Grid.Col span={4}>
                  <Text size="sm" c="#CCCCCC">剧本名称</Text>
                  <Text size="sm" c="#E6FBFF">{report.scriptTitle || '获取中...'}</Text>
                </Grid.Col>
                <Grid.Col span={4}>
                  <Text size="sm" c="#CCCCCC">评估时间</Text>
                  <Text size="sm" c="#E6FBFF">
                    {report.timestamp ? new Date(report.timestamp).toLocaleString() : '获取中...'}
                  </Text>
                </Grid.Col>
                <Grid.Col span={4}>
                  <Text size="sm" c="#CCCCCC">版本</Text>
                  <Text size="sm" c="#E6FBFF">{report.version || '获取中...'}</Text>
                </Grid.Col>
              </Grid>
            )}
          </Paper>
        </Grid.Col>

        {/* 内容逻辑评估 */}
        <Grid.Col span={12}>
          <Paper p="md" style={{
            background: progress.contentLogic === 'completed' 
              ? 'linear-gradient(135deg, rgba(0, 255, 255, 0.1) 0%, rgba(0, 194, 255, 0.05) 100%)'
              : 'linear-gradient(135deg, rgba(102, 102, 102, 0.1) 0%, rgba(68, 68, 68, 0.05) 100%)',
            border: `1px solid ${getStatusColor(progress.contentLogic)}`,
            borderRadius: 8,
            opacity: progress.contentLogic === 'pending' ? 0.6 : 1,
            transition: 'all 0.3s ease'
          }}>
            <Group gap="sm" mb="sm">
              <Text size="md" c={getStatusColor(progress.contentLogic)} fw={500}>
                {getStatusIcon(progress.contentLogic)} 🏗️ 内容逻辑层
              </Text>
              <Badge 
                size="xs" 
                color={progress.contentLogic === 'completed' ? 'cyan' : 'gray'}
                variant="light"
              >
                {progress.contentLogic === 'completed' ? '已完成' : 
                 progress.contentLogic === 'processing' ? '评估中' : '待评估'}
              </Badge>
            </Group>
            
            {report.scores?.contentLogic?.score !== undefined && (
              <Stack gap="md">
                <Group justify="center">
                  <Alert color="cyan" variant="light" p="md" style={{ flexGrow: 1, maxWidth: '200px' }}>
                    <Text size="xl" c="#00FFFF" ta="center" fw={700}>
                      {report.scores.contentLogic.score}/70 分
                    </Text>
                    <Text size="xs" c="#7DF9FF" ta="center" mt="xs">
                      内容逻辑层总分
                    </Text>
                  </Alert>
                </Group>
                
                {report.scores.contentLogic.details && (
                  <Stack gap="sm">
                    <Text size="sm" c="#E6FBFF" fw={600} ta="center">📊 详细评分明细</Text>
                    <Grid gutter="sm">
                      {Object.entries(report.scores.contentLogic.details).map(([key, value]) => {
                        const maxScore = getMaxScore(key);
                        const scoreColor = getScoreColor(value as number, maxScore);
                        return (
                          <Grid.Col span={4} key={key}>
                            <Paper p="xs" style={{
                              backgroundColor: 'rgba(0, 255, 255, 0.08)',
                              border: `1px solid ${scoreColor}`,
                              borderRadius: 6
                            }}>
                              <Group justify="space-between" align="center">
                                <Text size="xs" c="#E6FBFF" fw={500}>
                                  {getDetailLabel(key)}
                                </Text>
                                <HelpIcon 
                                  onClick={() => handleHelpClick(key)}
                                  size="xs"
                                />
                              </Group>
                              <Group justify="space-between" align="center">
                                <Text size="sm" c={scoreColor} fw={700}>
                                  {value}/{maxScore}
                                </Text>
                                <Text size="xs" c="#CCCCCC">
                                  {Math.round(((value as number) / maxScore) * 100)}%
                                </Text>
                              </Group>
                            </Paper>
                          </Grid.Col>
                        );
                      })}
                    </Grid>
                  </Stack>
                )}
              </Stack>
            )}
            
            {progress.contentLogic === 'pending' && (
              <Text size="sm" c="#888" ta="center" mt="md">
                ⏳ 等待评估内容逻辑、角色一致性、证据链...
              </Text>
            )}
          </Paper>
        </Grid.Col>

        {/* AI执行层评估 */}
        <Grid.Col span={6}>
          <Paper p="md" style={{
            background: progress.aiExecution === 'completed' 
              ? 'linear-gradient(135deg, rgba(0, 255, 255, 0.1) 0%, rgba(0, 194, 255, 0.05) 100%)'
              : 'linear-gradient(135deg, rgba(102, 102, 102, 0.1) 0%, rgba(68, 68, 68, 0.05) 100%)',
            border: `1px solid ${getStatusColor(progress.aiExecution)}`,
            borderRadius: 8,
            opacity: progress.aiExecution === 'pending' ? 0.6 : 1,
            transition: 'all 0.3s ease',
            minHeight: '300px'
          }}>
            <Group gap="sm" mb="sm">
              <Text size="md" c={getStatusColor(progress.aiExecution)} fw={500}>
                {getStatusIcon(progress.aiExecution)} 🤖 AI执行层
              </Text>
              <Badge 
                size="xs" 
                color={progress.aiExecution === 'completed' ? 'cyan' : 'gray'}
                variant="light"
              >
                {progress.aiExecution === 'completed' ? '已完成' : 
                 progress.aiExecution === 'processing' ? '评估中' : '待评估'}
              </Badge>
            </Group>
            
            {report.scores?.aiExecution?.score !== undefined && (
              <Stack gap="md">
                <Alert color="cyan" variant="light" p="md">
                  <Text size="xl" c="#00FFFF" ta="center" fw={700}>
                    {report.scores.aiExecution.score}/30 分
                  </Text>
                  <Text size="xs" c="#7DF9FF" ta="center" mt="xs">
                    AI执行层总分
                  </Text>
                </Alert>
                
                {report.scores.aiExecution.details && (
                  <Stack gap="xs">
                    <Text size="sm" c="#E6FBFF" fw={600} ta="center">🤖 AI设计评分</Text>
                    {Object.entries(report.scores.aiExecution.details).map(([key, value]) => {
                      const maxScore = getMaxScore(key);
                      const scoreColor = getScoreColor(value as number, maxScore);
                      return (
                        <Group justify="space-between" key={key} p="xs" style={{
                          backgroundColor: 'rgba(0, 255, 255, 0.05)',
                          borderRadius: 4,
                          border: `1px solid ${scoreColor}`
                        }}>
                          <Group gap="xs" align="center">
                            <Text size="xs" c="#E6FBFF">
                              {getDetailLabel(key)}
                            </Text>
                            <HelpIcon 
                              onClick={() => handleHelpClick(key)}
                              size="xs"
                            />
                          </Group>
                          <Group gap="xs">
                            <Text size="xs" c={scoreColor} fw={600}>
                              {value}/{maxScore}
                            </Text>
                            <Badge 
                              color={scoreColor === '#00FF00' ? 'green' : scoreColor === '#7DF9FF' ? 'cyan' : scoreColor === '#FFD700' ? 'yellow' : 'red'} 
                              size="xs" 
                              variant="light"
                            >
                              {Math.round(((value as number) / maxScore) * 100)}%
                            </Badge>
                          </Group>
                        </Group>
                      );
                    })}
                  </Stack>
                )}
              </Stack>
            )}
            
            {progress.aiExecution === 'pending' && (
              <Text size="sm" c="#888" ta="center" mt="md">
                ⏳ 等待评估AI角色设计、交互机制...
              </Text>
            )}
          </Paper>
        </Grid.Col>

        {/* 玩家体验评估 */}
        <Grid.Col span={6}>
          <Paper p="md" style={{
            background: progress.playerExperience === 'completed' 
              ? 'linear-gradient(135deg, rgba(0, 255, 255, 0.1) 0%, rgba(0, 194, 255, 0.05) 100%)'
              : 'linear-gradient(135deg, rgba(102, 102, 102, 0.1) 0%, rgba(68, 68, 68, 0.05) 100%)',
            border: `1px solid ${getStatusColor(progress.playerExperience)}`,
            borderRadius: 8,
            opacity: progress.playerExperience === 'pending' ? 0.6 : 1,
            transition: 'all 0.3s ease',
            minHeight: '300px'
          }}>
            <Group gap="sm" mb="sm">
              <Text size="md" c={getStatusColor(progress.playerExperience)} fw={500}>
                {getStatusIcon(progress.playerExperience)} 🎮 玩家体验层
              </Text>
              <Badge 
                size="xs" 
                color={progress.playerExperience === 'completed' ? 'cyan' : 'gray'}
                variant="light"
              >
                {progress.playerExperience === 'completed' ? '已完成' : 
                 progress.playerExperience === 'processing' ? '评估中' : '待评估'}
              </Badge>
              {report.scores?.playerExperience?.score !== undefined && (
                <Badge color="cyan" variant="filled" size="sm" style={{ color: '#001018' }}>
                  {report.scores.playerExperience.score}/20 分
                </Badge>
              )}
            </Group>
            
            {report.scores?.playerExperience?.score !== undefined && (
              <Stack gap="md">
                <Alert color="cyan" variant="light" p="md">
                  <Text size="xl" c="#00FFFF" ta="center" fw={700}>
                    {report.scores.playerExperience.score}/20 分
                  </Text>
                  <Text size="xs" c="#7DF9FF" ta="center" mt="xs">
                    玩家体验层总分
                  </Text>
                </Alert>
                
                {report.scores?.playerExperience?.details && (
                  <Stack gap="xs">
                    <Text size="sm" c="#E6FBFF" fw={600} ta="center">🎮 体验评分</Text>
                    {Object.entries(report.scores.playerExperience.details).map(([key, value]) => {
                      const maxScore = getMaxScore(key);
                      const scoreColor = getScoreColor(value as number, maxScore);
                      return (
                        <Group justify="space-between" key={key} p="xs" style={{
                          backgroundColor: 'rgba(0, 255, 255, 0.05)',
                          borderRadius: 4,
                          border: `1px solid ${scoreColor}`
                        }}>
                          <Group gap="xs" align="center">
                            <Text size="xs" c="#E6FBFF">
                              {getDetailLabel(key)}
                            </Text>
                            <HelpIcon 
                              onClick={() => handleHelpClick(key)}
                              size="xs"
                            />
                          </Group>
                          <Group gap="xs">
                            <Text size="xs" c={scoreColor} fw={600}>
                              {value}/{maxScore}
                            </Text>
                            <Badge 
                              color={scoreColor === '#00FF00' ? 'green' : scoreColor === '#7DF9FF' ? 'cyan' : scoreColor === '#FFD700' ? 'yellow' : 'red'} 
                              size="xs" 
                              variant="light"
                            >
                              {Math.round(((value as number) / maxScore) * 100)}%
                            </Badge>
                          </Group>
                        </Group>
                      );
                    })}
                  </Stack>
                )}
              </Stack>
            )}
            
            {progress.playerExperience === 'pending' && (
              <Text size="sm" c="#888">
                ⏳ 等待评估信息分布公平性、推理难度、参与感保证...
              </Text>
            )}
          </Paper>
        </Grid.Col>


        {/* 剧本优化项 */}
        {(progress.recommendations !== 'pending' || report.recommendations) && (
          <Grid.Col span={12}>
            <Paper p="md" style={{
              background: progress.recommendations === 'completed' 
                ? 'linear-gradient(135deg, rgba(0, 255, 0, 0.1) 0%, rgba(0, 255, 0, 0.05) 100%)'
                : 'linear-gradient(135deg, rgba(102, 102, 102, 0.1) 0%, rgba(68, 68, 68, 0.05) 100%)',
              border: `1px solid ${progress.recommendations === 'completed' ? '#00FF00' : getStatusColor(progress.recommendations)}`,
              borderRadius: 8,
              opacity: progress.recommendations === 'pending' ? 0.6 : 1,
              transition: 'all 0.3s ease'
            }}>
              <Group gap="sm" mb="sm">
                <Text size="md" c={progress.recommendations === 'completed' ? '#00FF00' : getStatusColor(progress.recommendations)} fw={500}>
                  {getStatusIcon(progress.recommendations)} 🔧 剧本优化项
                </Text>
                <Badge 
                  size="xs" 
                  color={progress.recommendations === 'completed' ? 'green' : 'gray'}
                  variant="light"
                >
                  {progress.recommendations === 'completed' ? '已完成' : '生成中'}
                </Badge>
                {report.recommendations && (
                  <Badge color="green" size="xs">
                    {report.recommendations.length} 条建议
                  </Badge>
                )}
              </Group>
              
              {report.recommendations && (
                <Stack gap="xs" mt="sm">
                  {report.recommendations.length === 0 && (
                    <Text size="sm" c="#90EE90" ta="center">
                      🎯 剧本质量优秀，暂无优化建议！
                    </Text>
                  )}
                  
                  {report.recommendations.length > 0 && report.recommendations.map((rec, idx) => (
                    <Paper key={idx} p="md" style={{
                      backgroundColor: 'rgba(0, 255, 0, 0.08)',
                      border: '1px solid rgba(0, 255, 0, 0.3)',
                      borderRadius: 8
                    }}>
                      <Group gap="sm" mb="sm">
                        <Badge 
                          size="sm" 
                          color={rec.priority === 'high' ? 'red' : rec.priority === 'medium' ? 'orange' : 'blue'}
                          style={{ textTransform: 'none' }}
                        >
                          {rec.priority === 'high' ? '🔥 高优先级' : rec.priority === 'medium' ? '⚡ 中优先级' : '💡 低优先级'}
                        </Badge>
                        <Badge size="sm" variant="light" color="green" style={{ textTransform: 'none' }}>
                          📋 {rec.category}
                        </Badge>
                      </Group>
                      
                      <Stack gap="sm">
                        <div>
                          <Text size="xs" c="#90EE90" fw={600} mb="xs">🔍 问题描述：</Text>
                          <Text size="sm" c="#E6FBFF" style={{ lineHeight: 1.5 }}>
                            {rec.description}
                          </Text>
                        </div>
                        
                        {rec.solution && (
                          <div>
                            <Text size="xs" c="#90EE90" fw={600} mb="xs">💡 解决方案：</Text>
                            <Text size="sm" c="#CCFFCC" style={{ lineHeight: 1.5 }}>
                              {rec.solution}
                            </Text>
                          </div>
                        )}
                      </Stack>
                    </Paper>
                  ))}
                </Stack>
              )}
            </Paper>
          </Grid.Col>
        )}

        {/* 总结 */}
        {(progress.summary !== 'pending' || report.summary) && (
          <Grid.Col span={12}>
            <Paper p="md" style={{
              background: progress.summary === 'completed' 
                ? 'linear-gradient(135deg, rgba(125, 249, 255, 0.1) 0%, rgba(125, 249, 255, 0.05) 100%)'
                : 'linear-gradient(135deg, rgba(102, 102, 102, 0.1) 0%, rgba(68, 68, 68, 0.05) 100%)',
              border: `1px solid ${progress.summary === 'completed' ? '#7DF9FF' : getStatusColor(progress.summary)}`,
              borderRadius: 8,
              opacity: progress.summary === 'pending' ? 0.6 : 1,
              transition: 'all 0.3s ease'
            }}>
              <Group gap="sm" mb="sm">
                <Text size="md" c={progress.summary === 'completed' ? '#7DF9FF' : getStatusColor(progress.summary)} fw={500}>
                  {getStatusIcon(progress.summary)} 📝 评估总结
                </Text>
                <Badge 
                  size="xs" 
                  color={progress.summary === 'completed' ? 'cyan' : 'gray'}
                  variant="light"
                >
                  {progress.summary === 'completed' ? '已完成' : '生成中'}
                </Badge>
              </Group>
              
              {report.summary && (
                <Text size="sm" c="#E6FBFF" style={{ lineHeight: 1.6 }}>
                  {report.summary}
                </Text>
              )}
              
              {report.recommendationLevel && (
                <>
                  <Divider my="sm" color="rgba(125, 249, 255, 0.3)" />
                  <Text size="sm" c="#E6FBFF" style={{ lineHeight: 1.6 }}>
                    <strong style={{ color: '#7DF9FF' }}>推荐建议：</strong> {report.recommendationLevel}
                  </Text>
                </>
              )}
            </Paper>
          </Grid.Col>
        )}
      </Grid>
    </Stack>
    
    {/* 字段释义帮助模态框 */}
    <FieldExplanationModal
      opened={helpModalOpened}
      onClose={() => setHelpModalOpened(false)}
      fieldKey={selectedField}
    />
    </>
  );
};

export default StreamingQualityReport;
