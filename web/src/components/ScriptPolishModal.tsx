import React, { useState, useEffect } from 'react';
import {
  Modal,
  Stack,
  Text,
  Textarea,
  Button,
  Group,
  Alert,
  Loader,
  Paper,
  Tabs,
  ScrollArea,
  Badge,
  Switch
} from '@mantine/core';
import { Script } from '../types/script';
import { 
  PolishRequest, 
  getFieldDisplayName,
  getFieldValue,
  polishScriptFieldStream
} from '../api/scriptPolisher';
import QualityCheckModal from './QualityCheckModal';

interface ScriptPolishModalProps {
  opened: boolean;
  onClose: () => void;
  script: Script;
  fieldPath: string;        // 字段路径，如 'title', 'characters[0].bio'
  onApplyPolish: (fieldPath: string, polishedContent: string) => void;
}

const ScriptPolishModal: React.FC<ScriptPolishModalProps> = ({ 
  opened, 
  onClose, 
  script, 
  fieldPath, 
  onApplyPolish 
}) => {
  const [instruction, setInstruction] = useState('');
  const [selectedTemplates, setSelectedTemplates] = useState<string[]>([]);
  const [isPolishing, setIsPolishing] = useState(false);
  const [polishResult, setPolishResult] = useState<{
    polishedContent: string;
    analysis: string;
    suggestions: string;
  } | null>(null);
  const [editedContent, setEditedContent] = useState('');
  const [error, setError] = useState<string>('');
  const [activeTab, setActiveTab] = useState<string>('polish');
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamedText, setStreamedText] = useState('');
  const [useQualityReport, setUseQualityReport] = useState(false);
  const [qualityModalOpened, setQualityModalOpened] = useState(false);
  const cancelRef = React.useRef<() => void>(() => {});

  const fieldDisplayName = getFieldDisplayName(fieldPath);
  const currentValue = getFieldValue(script, fieldPath);

  // 检查是否有质检结果
  const hasQualityReport = Boolean(script.settings.qualityReport);

  // 重置状态当模态框打开时
  useEffect(() => {
    if (opened) {
      setInstruction('');
      setSelectedTemplates([]);
      setPolishResult(null);
      setEditedContent('');
      setError('');
      setActiveTab('polish');
      // 如果有质检结果，默认开启
      setUseQualityReport(hasQualityReport);
    }
  }, [opened, fieldPath, hasQualityReport]);

  // 执行AI润色（优先流式）
  const handlePolish = async () => {
    if (!instruction.trim()) {
      setError('请输入润色指令');
      return;
    }

    setIsPolishing(true);
    setError('');
    setPolishResult(null);
    setEditedContent('');
    setStreamedText('');

    try {
      const request: PolishRequest = {
        script,
        fieldPath,
        fieldName: fieldDisplayName,
        currentValue,
        instruction: instruction.trim(),
        useQualityReport: useQualityReport && hasQualityReport
      };
      // 切到结果页开始流式展示
      setActiveTab('result');
      setIsStreaming(true);
      cancelRef.current = polishScriptFieldStream(request, {
        onChunk: (chunk: string) => {
          setStreamedText(prev => prev + chunk);
        },
        onEnd: () => {
          setIsStreaming(false);
          const finalText = streamedTextRef.current;
          setPolishResult({ polishedContent: finalText, analysis: '', suggestions: '' });
          setEditedContent(finalText);
        },
        onError: (msg: string) => {
          setIsStreaming(false);
          setError(msg);
        }
      });
    } catch (error) {
      console.error('润色请求失败:', error);
      setError('网络错误，请重试');
    } finally {
      setIsPolishing(false);
    }
  };

  // 用于在 onEnd 读取最终文本
  const streamedTextRef = React.useRef(streamedText);
  useEffect(() => { streamedTextRef.current = streamedText; }, [streamedText]);

  // 应用润色结果
  const handleApply = () => {
    console.log(`🎨 [DEBUG] ScriptPolishModal handleApply: 字段路径=${fieldPath}, 内容=${editedContent.trim()}`);
    if (editedContent.trim()) {
      console.log(`🎨 [DEBUG] ScriptPolishModal 调用 onApplyPolish`);
      onApplyPolish(fieldPath, editedContent.trim());
      console.log(`🎨 [DEBUG] ScriptPolishModal 关闭模态框`);
      onClose();
    } else {
      console.log(`🎨 [DEBUG] ScriptPolishModal 内容为空，不执行采纳`);
    }
  };

  // 获取常用的润色指令模板（基于质检标准）
  const getInstructionTemplates = () => {
    const templates: Record<string, string[]> = {
      'title': [
        '增强悬疑感和吸引力，符合剧本主题',
        '提升标题的文学性和感染力',
        '让标题更简洁有力，体现核心冲突',
        '融入时代背景特色，增加辨识度',
        '营造神秘氛围，激发好奇心',
        '避免剧透，保持推理悬念'
      ],
      'description': [
        '增强悬疑氛围，突出剧本独特卖点',
        '完善故事钩子，提升吸引力',
        '平衡信息量，既吸引又不剧透',
        '强化时代背景和文化特色',
        '优化叙事节奏，增强代入感',
        '突出推理要素和游戏体验'
      ],
      'globalStory': [
        '完善证据链支撑，增加物理线索(≥2条)',
        '优化时间线自洽性，消除逻辑矛盾',
        '增强故事氛围和细节描写',
        '确保所有角色有明确的行为动机',
        '强化案发现场描述，便于推理',
        '提升叙事流畅性，保持悬疑感'
      ],
      'bio': [
        '增强角色独特性，避免同质化',
        '强化角色与案件的关联性',
        '丰富社会背景，形成立体人物',
        '补充外貌特征，便于AI生成头像',
        '平衡公开信息，避免过早暴露秘密',
        '确保角色背景前后一致'
      ],
      'personality': [
        '让性格描述更生动具体，避免空泛',
        '突出独特性格特征，增强差异化',
        '确保性格与角色行为逻辑一致',
        '覆盖多种性格类型(≥5种)',
        '强化口吻和说话风格',
        '让性格服务于角色动机'
      ],
      'context': [
        '补充角色知识背景，增强AI扮演准确性',
        '完善角色已知信息，确保与globalStory一致',
        '优化第二人称表达，让AI更好理解',
        '增加情境细节，丰富对话素材',
        '强化角色动机的内在逻辑',
        '确保信息分层合理，避免泄露秘密'
      ],
      'secret': [
        '增强秘密的冲击力和戏剧张力',
        '强化秘密与案件的关联度',
        '确保秘密在其他角色线索中有支撑(≥3处)',
        '让秘密符合角色人设，逻辑合理',
        '平衡秘密的隐藏性和可推导性',
        '避免秘密与violation产生冲突'
      ],
      'violation': [
        '让违规原则更具体、可执行',
        '明确AI不能做的事，防止泄露关键信息',
        '确保限制与角色秘密相匹配',
        '使用具体场景化的禁令表述',
        '完善角色行为边界，保持游戏公平性',
        '让限制符合角色逻辑和人设'
      ]
    };

    // 根据字段路径匹配模板
    for (const [key, templateList] of Object.entries(templates)) {
      if (fieldPath.includes(key)) {
        return templateList;
      }
    }
    
    return [
      '提升内容质量和专业性',
      '增强逻辑严密性和一致性',
      '让表达更生动有感染力',
      '优化信息分布和层次',
      '强化推理公平性',
      '提升玩家沉浸感'
    ];
  };

  const instructionTemplates = getInstructionTemplates();

  // 处理模板选择
  const handleTemplateToggle = (template: string) => {
    setSelectedTemplates(prev => {
      if (prev.includes(template)) {
        return prev.filter(t => t !== template);
      } else {
        return [...prev, template];
      }
    });
  };

  // 应用选中的模板
  const handleApplyTemplates = () => {
    if (selectedTemplates.length > 0) {
      const combinedInstruction = selectedTemplates.join('；');
      setInstruction(combinedInstruction);
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group>
          <Text size="lg" fw={700} style={{ color: '#FFFFFF' }}>
            🎨 AI润色
          </Text>
          <Badge style={{ 
            backgroundColor: '#00FFFF', 
            color: '#000000',
            fontWeight: '600'
          }}>
            {fieldDisplayName}
          </Badge>
        </Group>
      }
      size="xl"
      styles={{
        content: {
          background: `linear-gradient(135deg, 
            #0a0a23 0%, 
            #1a1a3e 25%, 
            #2d1b69 50%, 
            #1e3a5f 75%, 
            #0f2027 100%
          )`,
          border: '2px solid #00FFFF'
        },
        header: {
          background: 'rgba(0, 255, 255, 0.1)',
          borderBottom: '2px solid #00FFFF'
        }
      }}
    >
      <Tabs value={activeTab} onChange={(value) => setActiveTab(value || 'polish')}>
        <Tabs.List>
          <Tabs.Tab value="polish" style={{ color: activeTab === 'polish' ? '#00FFFF' : '#E0E0E0' }}>
            🎨 润色设置
          </Tabs.Tab>
          <Tabs.Tab 
            value="result" 
            disabled={!polishResult}
            style={{ color: activeTab === 'result' ? '#00FFFF' : '#E0E0E0' }}
          >
            📝 润色结果
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="polish" pt="md">
          <Stack gap="md">
            {/* 当前内容显示 */}
            <Paper p="md" style={{
              background: 'rgba(0, 0, 0, 0.6)',
              border: '1px solid #00FFFF',
              borderRadius: '8px'
            }}>
              <Text size="sm" fw={600} style={{ color: '#00FFFF', marginBottom: '8px' }}>
                📋 当前内容
              </Text>
              <ScrollArea h={120}>
                <Text size="sm" style={{ 
                  color: '#FFFFFF',
                  lineHeight: '1.5',
                  whiteSpace: 'pre-wrap'
                }}>
                  {currentValue}
                </Text>
              </ScrollArea>
            </Paper>

            {/* 质检结果开关 */}
            <Paper p="md" style={{ 
              backgroundColor: 'rgba(0, 255, 255, 0.05)', 
              border: '1px solid rgba(0, 255, 255, 0.2)',
              borderRadius: '8px'
            }}>
              <Stack gap="md">
                <Switch
                  label={
                    <Group gap="xs">
                      <Text size="sm" fw={600} style={{ color: '#00FFFF' }}>
                        🔍 结合质检结果进行润色
                      </Text>
                      {hasQualityReport && (
                        <Badge size="xs" color="green" variant="light">
                          有质检报告
                        </Badge>
                      )}
                      {!hasQualityReport && (
                        <Badge size="xs" color="gray" variant="light">
                          无质检报告
                        </Badge>
                      )}
                    </Group>
                  }
                  description={
                    hasQualityReport 
                      ? "润色时将参考该剧本的质检报告，针对性地解决发现的问题"
                      : "当前剧本暂无质检报告，建议先进行质检后再润色"
                  }
                  checked={useQualityReport}
                  onChange={(event) => setUseQualityReport(event.currentTarget.checked)}
                  disabled={!hasQualityReport}
                  styles={{
                    label: { color: '#FFFFFF' },
                    description: { color: hasQualityReport ? '#B0B0B0' : '#808080' }
                  }}
                />
                
                {hasQualityReport && (
                  <Group gap="xs">
                    <Button
                      size="xs"
                      variant="outline"
                      onClick={() => setQualityModalOpened(true)}
                      style={{
                        borderColor: '#00FFFF',
                        color: '#00FFFF',
                        '&:hover': {
                          backgroundColor: 'rgba(0, 255, 255, 0.1)'
                        }
                      }}
                    >
                      📊 查看质检报告
                    </Button>
                    <Text size="xs" style={{ color: '#B0B0B0' }}>
                      查看完整的质检分析和建议
                    </Text>
                  </Group>
                )}
              </Stack>
            </Paper>

            {/* 润色指令输入 */}
            <div>
              <Text size="sm" fw={600} style={{ color: '#FFFFFF', marginBottom: '8px' }}>
                ✨ 润色指令
              </Text>
              <Textarea
                placeholder="请描述您希望如何改进这个字段，例如：让描述更有悬疑感，增加细节，提升文学性..."
                value={instruction}
                onChange={(e) => setInstruction(e.target.value)}
                minRows={4}
                maxRows={8}
                autosize
                styles={{
                  input: {
                    backgroundColor: 'rgba(0, 0, 0, 0.6)',
                    border: '1px solid #00FFFF',
                    color: '#FFFFFF',
                    '&::placeholder': {
                      color: '#B0B0B0'
                    }
                  }
                }}
              />
            </div>

            {/* 快速指令模板（支持多选） */}
            <div>
              <Group justify="space-between" align="center" mb="xs">
                <Text size="sm" fw={600} style={{ color: '#FFD700' }}>
                  💡 快速指令模板（可多选）
                </Text>
                {selectedTemplates.length > 0 && (
                  <Group gap="xs">
                    <Badge color="yellow" variant="light" size="sm">
                      已选 {selectedTemplates.length} 项
                    </Badge>
                    <Button
                      size="xs"
                      variant="light"
                      color="yellow"
                      onClick={handleApplyTemplates}
                    >
                      应用到指令框
                    </Button>
                  </Group>
                )}
              </Group>
              <Group gap="xs">
                {instructionTemplates.map((template, index) => (
                  <Button
                    key={index}
                    size="xs"
                    variant={selectedTemplates.includes(template) ? "filled" : "light"}
                    onClick={() => handleTemplateToggle(template)}
                    styles={{
                      root: {
                        backgroundColor: selectedTemplates.includes(template) 
                          ? 'rgba(255, 215, 0, 0.3)' 
                          : 'rgba(255, 215, 0, 0.1)',
                        border: selectedTemplates.includes(template) 
                          ? '2px solid #FFD700' 
                          : '1px solid rgba(255, 215, 0, 0.5)',
                        color: '#FFFFFF',
                        '&:hover': {
                          backgroundColor: selectedTemplates.includes(template) 
                            ? 'rgba(255, 215, 0, 0.4)' 
                            : 'rgba(255, 215, 0, 0.2)'
                        }
                      }
                    }}
                  >
                    {selectedTemplates.includes(template) && '✓ '}
                    {template}
                  </Button>
                ))}
              </Group>
              <Text size="xs" c="dimmed" mt="xs">
                💡 提示：点击选择多个模板，再点击「应用到指令框」按钮组合使用
              </Text>
            </div>

            {error && (
              <Alert color="red" title="润色失败">
                {error}
              </Alert>
            )}

            {/* 操作按钮 */}
            <Group justify="flex-end">
              <Button variant="outline" onClick={onClose} style={{
                borderColor: '#00FFFF',
                color: '#FFFFFF'
              }}>
                取消
              </Button>
              <Button
                onClick={handlePolish}
                loading={isPolishing}
                disabled={!instruction.trim() || isPolishing}
                styles={{
                  root: {
                    background: 'linear-gradient(135deg, #A78BFA, #8B5CF6)',
                    color: '#FFFFFF',
                    fontWeight: '700',
                    border: '1px solid #A78BFA',
                    boxShadow: '0 0 15px rgba(167, 139, 250, 0.4)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #9F7AEA, #7C3AED)',
                      boxShadow: '0 0 20px rgba(167, 139, 250, 0.6)',
                      transform: 'translateY(-1px)'
                    },
                    '&:disabled': {
                      backgroundColor: '#666',
                      color: '#999',
                      boxShadow: 'none'
                    }
                  }
                }}
              >
                {isPolishing ? '润色中...' : '🎨 开始润色'}
              </Button>
            </Group>
          </Stack>
        </Tabs.Panel>

        <Tabs.Panel value="result" pt="md">
          {(polishResult || isStreaming) && (
            <Stack gap="md">
              {/* 分析结果 */}
              {polishResult && polishResult.analysis && (
                <Paper p="md" style={{
                  background: 'rgba(255, 215, 0, 0.1)',
                  border: '1px solid #FFD700',
                  borderRadius: '8px'
                }}>
                  <Text size="sm" fw={600} style={{ color: '#FFD700', marginBottom: '8px' }}>
                    🔍 问题分析
                  </Text>
                  <Text size="sm" style={{ color: '#FFFFFF', lineHeight: '1.5' }}>
                    {polishResult?.analysis}
                  </Text>
                </Paper>
              )}

              {/* 润色后内容（可编辑/流式预览） */}
              <div>
                <Text size="sm" fw={600} style={{ color: '#A78BFA', marginBottom: '8px' }}>
                  ✨ 润色后内容（可编辑）
                </Text>
                {isStreaming ? (
                  <Paper p="md" style={{
                    background: 'rgba(0, 0, 0, 0.6)',
                    border: '2px solid #A78BFA',
                    borderRadius: '8px',
                    minHeight: '160px'
                  }}>
                    <ScrollArea h={260}>
                      <Text size="sm" style={{ color: '#FFFFFF', whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>
                        {streamedText || '...'}
                      </Text>
                    </ScrollArea>
                  </Paper>
                ) : (
                  <Textarea
                    value={editedContent}
                    onChange={(e) => setEditedContent(e.target.value)}
                    minRows={8}
                    maxRows={15}
                    autosize
                    styles={{
                      input: {
                        backgroundColor: 'rgba(0, 0, 0, 0.6)',
                        border: '2px solid #A78BFA',
                        color: '#FFFFFF',
                        lineHeight: '1.6'
                      }
                    }}
                  />
                )}
              </div>

              {/* 修改建议 */}
              {polishResult && polishResult.suggestions && (
                <Paper p="md" style={{
                  background: 'rgba(167, 139, 250, 0.1)',
                  border: '1px solid #A78BFA',
                  borderRadius: '8px'
                }}>
                  <Text size="sm" fw={600} style={{ color: '#A78BFA', marginBottom: '8px' }}>
                    💡 修改说明
                  </Text>
                  <Text size="sm" style={{ color: '#FFFFFF', lineHeight: '1.5' }}>
                    {polishResult?.suggestions}
                  </Text>
                </Paper>
              )}

              {/* 操作按钮 */}
              <Group justify="space-between">
                <Button 
                  variant="outline" 
                  onClick={() => setActiveTab('polish')}
                  style={{
                    borderColor: '#FFD700',
                    color: '#FFD700'
                  }}
                >
                  ← 重新润色
                </Button>
                <Group>
                  <Button variant="outline" onClick={onClose} style={{
                    borderColor: '#00FFFF',
                    color: '#FFFFFF'
                  }}>
                    取消
                  </Button>
                  <Button
                    onClick={handleApply}
                    disabled={isStreaming || !editedContent.trim()}
                    styles={{
                      root: {
                        background: 'linear-gradient(135deg, #00C2FF, #87CEEB)',
                        color: '#000000',
                        fontWeight: '700',
                        border: '1px solid #00C2FF',
                        boxShadow: '0 0 15px rgba(0, 194, 255, 0.4)',
                        '&:hover': {
                          background: 'linear-gradient(135deg, #00A8CC, #6BB6FF)',
                          boxShadow: '0 0 20px rgba(0, 194, 255, 0.6)',
                          transform: 'translateY(-1px)'
                        },
                        '&:disabled': {
                          backgroundColor: '#666',
                          color: '#999',
                          boxShadow: 'none'
                        }
                      }
                    }}
                  >
                    ✅ 采纳润色
                  </Button>
                </Group>
              </Group>
            </Stack>
          )}

          {isPolishing && (
            <Paper p="xl" style={{
              background: 'rgba(0, 0, 0, 0.4)',
              textAlign: 'center',
              border: '1px solid #00FFFF'
            }}>
              <Stack align="center" gap="md">
                <Loader size="lg" color="#00FFFF" />
                <Text size="lg" fw={600} style={{ color: '#FFFFFF' }}>
                  🎨 AI正在精心润色中...
                </Text>
                <Text size="sm" style={{ color: '#E0E0E0' }}>
                  正在分析内容并生成优化建议，请稍候
                </Text>
              </Stack>
            </Paper>
          )}
        </Tabs.Panel>
      </Tabs>
      
      {/* 质检报告模态框 */}
      <QualityCheckModal
        opened={qualityModalOpened}
        onClose={() => setQualityModalOpened(false)}
        script={script}
        forceRegenerate={false}
      />
    </Modal>
  );
};

export default ScriptPolishModal;
