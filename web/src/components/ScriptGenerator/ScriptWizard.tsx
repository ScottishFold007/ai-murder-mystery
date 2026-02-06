import React, { useState } from 'react';
import { 
  Stack, 
  Title, 
  Text, 
  Button, 
  Group, 
  Radio, 
  Textarea, 
  NumberInput,
  Card,
  Stepper,
  Loader,
  Alert,
  Modal
} from '@mantine/core';
import { GenerationRequest, generateScriptPrompt } from '../../utils/aiPrompts';
import { Script } from '../../types/script';
import invokeAI from '../../api/invoke';
// import { useSessionContext } from '../../providers/sessionContext';
import { jsonrepair } from 'jsonrepair';

interface ScriptWizardProps {
  onScriptGenerated: (script: Script) => void;
}

const ScriptWizard: React.FC<ScriptWizardProps> = ({ onScriptGenerated }) => {
  const [step, setStep] = useState(0);
  const [request, setRequest] = useState<GenerationRequest>({
    scriptType: 'mystery',
    theme: '',
    suspectCount: 5,
    coreDevice: ''
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string>('');
  const [generatedScript, setGeneratedScript] = useState<Script | null>(null);
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  // const sessionId = useSessionContext();

  const handleGenerate = async () => {
    if (!request.theme.trim()) {
      setError('请填写故事主题/背景');
      return;
    }

    setIsGenerating(true);
    setError('');

    try {
      
      const prompt = generateScriptPrompt(request);
      const response = await invokeAI({
        globalStory: "AI剧本生成请求",
        sessionId: `script_gen_${Date.now()}`,
        characterFileVersion: 'ai_script_generator',
        actor: {
          id: -1,
          name: 'ScriptArchitect',
          bio: 'AI剧本杀JSON架构师',
          personality: '专业、创意、严谨，擅长创作引人入胜的谋杀案剧本',
          context: prompt,
          secret: '',
          violation: '必须严格按照JSON schema输出，不得偏离格式',
          image: '',
          messages: [{ 
            role: 'user', 
            content: `请根据以下需求生成完整的剧本JSON：\n${JSON.stringify(request, null, 2)}` 
          }]
        },
        // 对于脚本生成，使用默认值
        detectiveName: "侦探",
        victimName: "受害者"
      });

      console.log('🤖 AI原始响应:', response.final_response);

      // 使用jsonrepair库进行鲁棒的JSON解析
      try {
        let jsonString = response.final_response;
        
        // 首先尝试提取JSON部分（如果响应包含其他内容）
        const jsonMatch = jsonString.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          jsonString = jsonMatch[0];
        }
        
        console.log('🔧 使用jsonrepair修复JSON格式...');
        
        // 使用jsonrepair自动修复JSON格式问题
        const repairedJson = jsonrepair(jsonString);
        
        // 解析修复后的JSON
        const scriptData = JSON.parse(repairedJson);
        
        // 验证必要字段
        if (!scriptData.title || !scriptData.characters || !scriptData.settings) {
          throw new Error('生成的剧本缺少必要字段');
        }

        // 确保数组字段存在
        if (!Array.isArray(scriptData.characters)) {
          throw new Error('角色数据格式错误');
        }

        // 确保证物字段存在
        if (!scriptData.evidences) {
          scriptData.evidences = [];
          console.log('⚠️ 生成的剧本缺少evidences字段，已初始化为空数组');
        } else if (!Array.isArray(scriptData.evidences)) {
          console.log('⚠️ evidences字段格式错误，已重置为空数组');
          scriptData.evidences = [];
        }

        // 标记为AI生成的剧本
        scriptData.sourceType = 'ai';
        
        setGeneratedScript(scriptData);
        setSuccessModalOpen(true);
        
      } catch (parseError) {
        console.error('❌ JSON解析失败:', parseError);
        console.log('🔍 原始响应内容:', response.final_response);
        
        // 提供更详细的错误信息
        if (parseError instanceof Error) {
          if (parseError.message.includes('Unexpected token')) {
            setError('AI生成的JSON格式有语法错误，请重试');
          } else if (parseError.message.includes('Unexpected end')) {
            setError('AI生成的JSON不完整，请重试');
          } else {
            setError(`JSON解析失败: ${parseError.message}`);
          }
        } else {
          setError('AI响应格式异常，请重试');
        }
      }

    } catch (error) {
      console.error('❌ 剧本生成失败:', error);
      setError(error instanceof Error ? error.message : '生成失败，请重试');
    } finally {
      setIsGenerating(false);
    }
  };

  const nextStep = () => {
    if (step === 1 && !request.theme.trim()) {
      setError('请填写故事主题/背景');
      return;
    }
    setError('');
    setStep(step + 1);
  };

  const editScript = () => {
    if (!generatedScript) return;
    
    // 进入编辑器查看和编辑剧本
    onScriptGenerated(generatedScript);
    setSuccessModalOpen(false);
    
    // 重置向导状态，准备下次生成
    setGeneratedScript(null);
    setStep(0);
    setRequest({
      scriptType: 'mystery',
      theme: '',
      suspectCount: 5,
      coreDevice: ''
    });
  };

  return (
    <Card 
      style={{
        background: `
          linear-gradient(135deg, 
            rgba(10, 10, 35, 0.95) 0%, 
            rgba(26, 26, 62, 0.95) 25%, 
            rgba(45, 27, 105, 0.95) 50%, 
            rgba(30, 58, 95, 0.95) 75%, 
            rgba(15, 32, 39, 0.95) 100%
          )
        `,
        border: '2px solid rgba(0, 194, 255, 0.8)',
        borderRadius: '20px',
        boxShadow: `
          0 0 40px rgba(0, 194, 255, 0.4),
          inset 0 1px 0 rgba(255, 255, 255, 0.1),
          0 8px 32px rgba(0, 0, 0, 0.3)
        `,
        maxWidth: '900px',
        margin: '0 auto',
        padding: '40px',
        backdropFilter: 'blur(10px)',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      <Stack gap="lg">
        <Stepper 
          active={step} 
          onStepClick={setStep}
          styles={{
            stepIcon: {
              backgroundColor: '#00C2FF',
              borderColor: '#00C2FF',
              color: '#FFFFFF',
              fontWeight: 'bold'
            },
            stepLabel: { 
              color: '#FFFFFF', 
              fontSize: '16px', 
              fontWeight: '600',
              textShadow: '1px 1px 2px rgba(0, 0, 0, 0.8)'
            },
            stepDescription: { 
              color: '#E0E0E0', 
              fontSize: '14px',
              textShadow: '1px 1px 2px rgba(0, 0, 0, 0.6)'
            }
          }}
        >
          <Stepper.Step label="剧本类型" description="选择剧本风格">
            <Stack gap="md" style={{ paddingTop: '20px' }}>
              <Title order={3} style={{ 
                color: '#FFFFFF', 
                fontSize: '24px',
                fontWeight: '700',
                textShadow: '0 0 10px rgba(0, 194, 255, 0.8), 2px 2px 4px rgba(0, 0, 0, 0.8)',
                marginBottom: '20px'
              }}>
                🎭 选择剧本类型
              </Title>
              
              <Radio.Group
                value={request.scriptType}
                onChange={(value) => setRequest({ ...request, scriptType: value as 'mystery' | 'emotion' })}
              >
                <Stack gap="md">
                  <Card
                    style={{
                      padding: '16px',
                      border: `2px solid ${request.scriptType === 'mystery' ? '#00C2FF' : '#333'}`,
                      borderRadius: '8px',
                      backgroundColor: request.scriptType === 'mystery' ? 'rgba(0, 194, 255, 0.1)' : 'rgba(255, 255, 255, 0.03)',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease'
                    }}
                    onClick={() => setRequest({ ...request, scriptType: 'mystery' })}
                  >
                    <Radio 
                      value="mystery" 
                      label="还原本" 
                      description="注重逻辑推理、线索收集和真相还原"
                      styles={{
                        root: { width: '100%', pointerEvents: 'none' },
                        label: { 
                          color: '#FFFFFF', 
                          fontSize: '18px', 
                          fontWeight: '700',
                          marginBottom: '4px'
                        },
                        description: { 
                          color: '#C0C0C0',
                          fontSize: '14px',
                          lineHeight: '1.4'
                        }
                      }}
                    />
                  </Card>
                  
                  <Card
                    style={{
                      padding: '16px',
                      border: `2px solid ${request.scriptType === 'emotion' ? '#00C2FF' : '#333'}`,
                      borderRadius: '8px',
                      backgroundColor: request.scriptType === 'emotion' ? 'rgba(0, 194, 255, 0.1)' : 'rgba(255, 255, 255, 0.03)',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease'
                    }}
                    onClick={() => setRequest({ ...request, scriptType: 'emotion' })}
                  >
                    <Radio 
                      value="emotion" 
                      label="情感本" 
                      description="注重角色情感、人际关系和内心冲突"
                      styles={{
                        root: { width: '100%', pointerEvents: 'none' },
                        label: { 
                          color: '#FFFFFF', 
                          fontSize: '18px', 
                          fontWeight: '700',
                          marginBottom: '4px'
                        },
                        description: { 
                          color: '#C0C0C0',
                          fontSize: '14px',
                          lineHeight: '1.4'
                        }
                      }}
                    />
                  </Card>
                </Stack>
              </Radio.Group>
            </Stack>
          </Stepper.Step>

          <Stepper.Step label="故事设定" description="描述剧本背景">
            <Stack gap="md" style={{ paddingTop: '20px' }}>
              <Title order={3} style={{ 
                color: '#FFFFFF', 
                fontSize: '24px',
                fontWeight: '700',
                textShadow: '0 0 10px rgba(0, 194, 255, 0.8), 2px 2px 4px rgba(0, 0, 0, 0.8)',
                marginBottom: '20px'
              }}>
                📝 故事主题与背景
              </Title>
              
              <Textarea
                label="故事主题/背景"
                placeholder="例如：发生在现代都市的公司内部谋杀案，或是民国上海的黑帮仇杀，或是古代宫廷的权力斗争..."
                value={request.theme}
                onChange={(event) => setRequest({ ...request, theme: event.currentTarget.value })}
                minRows={8}
                maxRows={12}
                autosize
                required
                styles={{
                  label: { 
                    color: '#FFFFFF', 
                    fontWeight: 'bold',
                    fontSize: '18px',
                    marginBottom: '8px',
                    textShadow: '1px 1px 3px rgba(0, 0, 0, 0.8)'
                  },
                  input: { 
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    borderColor: '#555',
                    color: '#FFFFFF',
                    fontSize: '14px',
                    padding: '12px',
                    borderWidth: '2px',
                    '&:focus': {
                      borderColor: '#00C2FF',
                      backgroundColor: 'rgba(255, 255, 255, 0.15)'
                    },
                    '&::placeholder': {
                      color: '#999'
                    }
                  }
                }}
              />

              <NumberInput
                label="嫌疑人数量"
                description="包含玩家、搭档和嫌疑人的总数"
                value={request.suspectCount}
                onChange={(value) => setRequest({ ...request, suspectCount: Number(value) || 5 })}
                min={4}
                max={8}
                styles={{
                  label: { 
                    color: '#FFFFFF', 
                    fontWeight: 'bold',
                    fontSize: '18px',
                    marginBottom: '4px',
                    textShadow: '1px 1px 3px rgba(0, 0, 0, 0.8)'
                  },
                  description: { 
                    color: '#E0E0E0',
                    fontSize: '14px',
                    marginBottom: '8px',
                    textShadow: '1px 1px 2px rgba(0, 0, 0, 0.6)'
                  },
                  input: { 
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    borderColor: '#555',
                    color: '#FFFFFF',
                    fontSize: '14px',
                    padding: '12px',
                    borderWidth: '2px',
                    '&:focus': {
                      borderColor: '#00C2FF',
                      backgroundColor: 'rgba(255, 255, 255, 0.15)'
                    }
                  }
                }}
              />

              <Textarea
                label="核心诡计构想（可选）"
                placeholder="例如：密室杀人、时间诡计、替身诡计、心理暗示..."
                value={request.coreDevice}
                onChange={(event) => setRequest({ ...request, coreDevice: event.currentTarget.value })}
                minRows={2}
                styles={{
                  label: { 
                    color: '#FFFFFF', 
                    fontWeight: 'bold',
                    fontSize: '18px',
                    marginBottom: '8px',
                    textShadow: '1px 1px 3px rgba(0, 0, 0, 0.8)'
                  },
                  input: { 
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    borderColor: '#555',
                    color: '#FFFFFF',
                    fontSize: '14px',
                    padding: '12px',
                    borderWidth: '2px',
                    '&:focus': {
                      borderColor: '#4ECCA3',
                      backgroundColor: 'rgba(255, 255, 255, 0.15)'
                    },
                    '&::placeholder': {
                      color: '#999'
                    }
                  }
                }}
              />
            </Stack>
          </Stepper.Step>

          <Stepper.Step label="生成剧本" description="AI创作中">
            <Stack gap="md" style={{ paddingTop: '20px' }}>
              <Title order={3} style={{ 
                color: '#FFFFFF', 
                fontSize: '24px',
                fontWeight: '700',
                textShadow: '0 0 10px rgba(0, 194, 255, 0.8), 2px 2px 4px rgba(0, 0, 0, 0.8)',
                marginBottom: '20px'
              }}>
                🚀 准备生成剧本
              </Title>
              
              <Card 
                style={{ 
                  background: 'rgba(0, 194, 255, 0.1)', 
                  border: '2px solid #00C2FF',
                  borderRadius: '12px',
                  padding: '20px'
                }}
              >
                <Text style={{ color: '#FFFFFF', marginBottom: '12px', fontSize: '16px' }}>
                  <strong style={{ color: '#FFB74D' }}>剧本类型：</strong> 
                  <span style={{ color: '#00C2FF', fontWeight: 'bold' }}>
                    {request.scriptType === 'mystery' ? '还原本' : '情感本'}
                  </span>
                </Text>
                <Text style={{ color: '#FFFFFF', marginBottom: '12px', fontSize: '16px' }}>
                  <strong style={{ color: '#FFB74D' }}>故事背景：</strong> 
                  <span style={{ color: '#E0E0E0' }}>{request.theme}</span>
                </Text>
                <Text style={{ color: '#FFFFFF', marginBottom: '12px', fontSize: '16px' }}>
                  <strong style={{ color: '#FFB74D' }}>角色数量：</strong> 
                  <span style={{ color: '#4ECCA3', fontWeight: 'bold' }}>{request.suspectCount}人</span>
                </Text>
                {request.coreDevice && (
                  <Text style={{ color: '#FFFFFF', fontSize: '16px' }}>
                    <strong style={{ color: '#FFB74D' }}>核心诡计：</strong> 
                    <span style={{ color: '#E0E0E0' }}>{request.coreDevice}</span>
                  </Text>
                )}
              </Card>

              {isGenerating && (
                <Card
                  style={{
                    background: 'rgba(0, 194, 255, 0.05)',
                    border: '1px solid #00C2FF',
                    borderRadius: '12px',
                    padding: '30px',
                    textAlign: 'center'
                  }}
                >
                  <Stack align="center" gap="lg">
                    <Loader size="xl" color="#00C2FF" />
                    <Text style={{ color: '#FFFFFF', fontSize: '18px', fontWeight: 'bold' }}>
                      🎭 AI正在创作您的专属剧本...
                    </Text>
                    <Text style={{ color: '#C0C0C0', fontSize: '16px' }}>
                      这可能需要30秒到1分钟时间，请耐心等待
                    </Text>
                    <Text size="sm" style={{ color: '#999', fontStyle: 'italic' }}>
                      AI正在精心设计角色关系、构思推理线索和平衡游戏难度
                    </Text>
                  </Stack>
                </Card>
              )}
            </Stack>
          </Stepper.Step>
        </Stepper>

        {error && (
          <Alert 
            color="red" 
            title="生成失败"
            styles={{
              root: {
                backgroundColor: 'rgba(230, 57, 70, 0.15)',
                border: '2px solid #E63946',
                borderRadius: '8px'
              },
              title: {
                color: '#FF6B6B',
                fontSize: '16px',
                fontWeight: 'bold'
              },
              body: {
                color: '#FFFFFF',
                fontSize: '14px'
              }
            }}
          >
            {error}
          </Alert>
        )}

        <Group justify="space-between" style={{ marginTop: '20px' }}>
          <Button 
            variant="outline" 
            onClick={() => setStep(Math.max(0, step - 1))}
            disabled={step === 0 || isGenerating}
            size="md"
            styles={{
              root: {
                borderColor: '#4ECCA3',
                color: '#4ECCA3',
                fontSize: '16px',
                fontWeight: 'bold',
                padding: '12px 24px',
                '&:hover': {
                  backgroundColor: 'rgba(78, 204, 163, 0.1)',
                  borderColor: '#4ECCA3'
                },
                '&:disabled': {
                  borderColor: '#666',
                  color: '#666'
                }
              }
            }}
          >
            上一步
          </Button>

          {step < 2 ? (
            <Button 
              onClick={nextStep}
              size="md"
              styles={{
                root: {
                  background: '#00C2FF',
                  border: '1px solid #00C2FF',
                  color: '#FFFFFF',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  padding: '12px 24px',
                  '&:hover': {
                    background: '#0099CC',
                    borderColor: '#0099CC'
                  }
                }
              }}
            >
              下一步
            </Button>
          ) : (
            <Button 
              onClick={handleGenerate}
              disabled={isGenerating}
              size="md"
              styles={{
                root: {
                  background: isGenerating ? '#666' : '#E63946',
                  border: `2px solid ${isGenerating ? '#666' : '#E63946'}`,
                  color: '#FFFFFF',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  padding: '12px 24px',
                  '&:hover': {
                    background: isGenerating ? '#666' : '#CC2936',
                    borderColor: isGenerating ? '#666' : '#CC2936'
                  },
                  '&:disabled': {
                    background: '#666',
                    borderColor: '#666'
                  }
                }
              }}
            >
              {isGenerating ? '生成中...' : '🎭 生成剧本'}
            </Button>
          )}
        </Group>
      </Stack>

      {/* 生成成功确认模态框 */}
      <Modal
        opened={successModalOpen}
        onClose={() => setSuccessModalOpen(false)}
        title="🎉 剧本生成成功！"
        size="md"
        centered
        styles={{
          content: { backgroundColor: '#1A1A2E' },
          header: { backgroundColor: '#1A1A2E', borderBottom: '1px solid #00C2FF' },
          title: { 
            color: '#00C2FF', 
            fontWeight: 'bold',
            fontSize: '20px',
            textShadow: '0 0 10px rgba(0, 194, 255, 0.8)'
          }
        }}
      >
        {generatedScript && (
          <Stack gap="lg">
            <Card style={{ 
              background: 'rgba(0, 194, 255, 0.1)', 
              border: '2px solid #00C2FF',
              borderRadius: '12px'
            }}>
              <Stack gap="md">
                <Text style={{ 
                  color: '#FFFFFF', 
                  fontSize: '18px', 
                  fontWeight: 'bold',
                  textAlign: 'center'
                }}>
                  📖 {generatedScript.title}
                </Text>
                
                <Text style={{ color: '#E0E0E0', fontSize: '14px' }}>
                  {generatedScript.description}
                </Text>
                
                <Group justify="space-between">
                  <Text size="sm" style={{ color: '#FFB74D' }}>
                    <strong>类型：</strong> {request.scriptType === 'mystery' ? '还原本' : '情感本'}
                  </Text>
                  <Text size="sm" style={{ color: '#4ECCA3' }}>
                    <strong>角色：</strong> {generatedScript.characters.length}人
                  </Text>
                </Group>
              </Stack>
            </Card>

            <Text style={{ 
              color: '#E0E0E0', 
              textAlign: 'center',
              fontSize: '16px'
            }}>
              剧本生成完成！请先查看内容，然后选择下一步操作：
            </Text>

            <Group justify="center" gap="md">
              <Button
                onClick={editScript}
                size="md"
                styles={{
                  root: {
                    background: 'linear-gradient(135deg, #00C2FF 0%, #0099CC 100%)',
                    border: '2px solid #00C2FF',
                    color: '#FFFFFF',
                    fontWeight: 'bold',
                    fontSize: '16px',
                    padding: '12px 24px',
                    textShadow: '1px 1px 2px rgba(0, 0, 0, 0.5)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #0099CC 0%, #0077AA 100%)',
                      transform: 'translateY(-2px)'
                    }
                  }
                }}
              >
                👀 查看并编辑
              </Button>
            </Group>

            <Text size="xs" style={{ 
              color: '#999', 
              textAlign: 'center',
              fontStyle: 'italic'
            }}>
              💡 在编辑器中可以查看完整剧本内容，确认满意后可导出或保存到剧本库
            </Text>
          </Stack>
        )}
      </Modal>
    </Card>
  );
};

export default ScriptWizard;
