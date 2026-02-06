import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  AppShell, 
  Container, 
  Title, 
  Button, 
  Group, 
  Text, 
  Paper,
  Tabs,
  Stack,
  Alert,
  TextInput,
  Textarea
} from '@mantine/core';

import { useScriptContext } from '../providers/scriptContext';
import { Script } from '../types/script';
import { validateScript } from '../utils/scriptManager';
import CharacterEditor from '../components/ScriptEditor/CharacterEditor';
import StoryEditor from '../components/ScriptEditor/StoryEditor';
import ScriptSettings from '../components/ScriptEditor/ScriptSettings';
import PreviewModal from '../components/ScriptEditor/PreviewModal';
import EvidenceManagementPanel from '../components/ScriptEditor/EvidenceManagementPanel';
import ScriptPolishModal from '../components/ScriptPolishModal';
import PolishButton from '../components/PolishButton';
import { setFieldValue } from '../api/scriptPolisher';

const ScriptEditor: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const { currentScript, loadScript, saveScript, createNewScript, updateScript } = useScriptContext();
  
  const [script, setScript] = useState<Script | null>(null);
  const [activeTab, setActiveTab] = useState<string>('info');
  const [showPreview, setShowPreview] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  // AI润色相关状态
  const [polishModalOpened, setPolishModalOpened] = useState(false);
  const [polishFieldPath, setPolishFieldPath] = useState<string>('');

  // 初始化剧本：
  // - 路由带 id: 加载指定剧本
  // - 路由无 id: 始终创建全新剧本（不复用 currentScript）
  const createdOnceRef = useRef(false);
  useEffect(() => {
    console.log('🔍 ScriptEditor初始化 - id:', id);
    if (id) {
      loadScript(id);
    } else if (!createdOnceRef.current) {
      createdOnceRef.current = true;
      console.log('✨ 创建全新剧本 (不复用 currentScript)');
      createNewScript().then(newScript => {
        setScript(newScript);
      });
    }
  }, [id, loadScript, createNewScript]);

  // 当 currentScript 变化时更新本地状态
  useEffect(() => {
    if (currentScript) {
      setScript(currentScript);
    }
  }, [currentScript]);

  // 更新剧本（只更新本地状态，不立即更新Context）
  const updateScriptData = async (updates: Partial<Script>) => {
    console.log(`📝 [DEBUG] updateScriptData: 更新字段:`, Object.keys(updates));
    if (script) {
      const updatedScript = { ...script, ...updates };
      setScript(updatedScript);
      // 立即更新Context，确保数据同步
      await updateScript(updatedScript);
    }
  };

  // 保存到Context的函数
  const saveToContext = useCallback(async () => {
    if (script) {
      await updateScript(script);
    }
  }, [script, updateScript]);

  // 打开润色模态框
  const handleOpenPolish = (fieldPath: string) => {
    setPolishFieldPath(fieldPath);
    setPolishModalOpened(true);
  };

  // 应用润色结果
  const handleApplyPolish = async (fieldPath: string, polishedContent: string) => {
    console.log(`🎨 [DEBUG] handleApplyPolish: 字段路径=${fieldPath}, 内容长度=${polishedContent.length}`);
    if (script) {
      const updatedScript = setFieldValue(script, fieldPath, polishedContent);
      console.log(`🎨 [DEBUG] handleApplyPolish: 更新完成`);
      setScript(updatedScript);
      // 同步更新到Context，确保数据持久化
      await updateScript(updatedScript);
      console.log(`🎨 [DEBUG] handleApplyPolish: Context同步完成`);
    }
  };

  // 保存剧本
  const handleSave = async () => {
    if (!script) {
      console.log('❌ 剧本为空，无法保存');
      return;
    }

    setIsSaving(true);
    setSaveSuccess(false);

    try {
      // 先更新Context
      saveToContext();

      const validation = validateScript(script);
      console.log('🔍 剧本验证结果:', validation);
      
      if (validation.isValid) {
        saveScript(script);
        setValidationErrors([]);
        setSaveSuccess(true);
        
        // 3秒后隐藏成功提示
        setTimeout(() => {
          setSaveSuccess(false);
        }, 3000);
      } else {
        console.log('❌ 剧本验证失败:', validation.errors);
        setValidationErrors(validation.errors);
        
        // 自动跳转到有问题的tab
        const firstError = validation.errors[0];
        if (firstError.includes('基本信息')) {
          setActiveTab('info');
        } else if (firstError.includes('故事编辑')) {
          setActiveTab('story');
        } else if (firstError.includes('角色管理')) {
          setActiveTab('characters');
        } else if (firstError.includes('剧本设置')) {
          setActiveTab('settings');
        }
      }
    } catch (error) {
      console.error('❌ 保存剧本时出错:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // 预览剧本
  const handlePreview = () => {
    if (!script) return;

    // 先更新Context
    saveToContext();

    const validation = validateScript(script);
    if (validation.isValid) {
      setShowPreview(true);
      setValidationErrors([]);
    } else {
      setValidationErrors(validation.errors);
    }
  };

  // 返回
  const handleBack = () => {
    navigate('/library');
  };

  
  if (!script || !script.id) {
    console.log('❌ script为null或无ID，显示加载中...');
    return (
      <Container size="lg" py="xl">
        <Text>加载中...</Text>
      </Container>
    );
  }

  return (
    <AppShell
      header={{ height: 60 }}
      padding="md"
      className="aurora-background"
      styles={{
        main: {
          minHeight: '100vh'
        }
      }}
    >
      <AppShell.Header className="aurora-header">
        <Group h="100%" px="md" justify="space-between">
          <Group>
            <Button
              variant="subtle"
              onClick={handleBack}
              styles={{
                root: {
                  color: '#87CEEB',
                  '&:hover': {
                    backgroundColor: 'rgba(135, 206, 235, 0.1)',
                    transform: 'translateY(-1px)'
                  }
                }
              }}
            >
              ← 返回剧本库
            </Button>
            <Title order={2} className="aurora-title" style={{ fontSize: '20px' }}>
              {script.title || '编辑剧本'}
            </Title>
          </Group>
          <Group>
            <Button
              variant="outline"
              onClick={handlePreview}
              styles={{
                root: {
                  borderColor: '#00C2FF',
                  color: '#00C2FF',
                  '&:hover': {
                    backgroundColor: 'rgba(0, 194, 255, 0.1)',
                    borderColor: '#00FFFF',
                    transform: 'translateY(-1px)'
                  }
                }
              }}
            >
              👁️ 预览
            </Button>
            <Button
              onClick={handleSave}
              loading={isSaving}
              disabled={isSaving}
              styles={{
                root: {
                  background: saveSuccess ? 
                    'linear-gradient(135deg, #A78BFA, #8B5CF6)' : 
                    'linear-gradient(135deg, #00C2FF, #87CEEB)',
                  color: '#FFFFFF',
                  fontWeight: '700',
                  border: saveSuccess ? '1px solid #A78BFA' : '1px solid #00C2FF',
                  boxShadow: saveSuccess ? 
                    '0 0 15px rgba(167, 139, 250, 0.4)' : 
                    '0 0 15px rgba(0, 194, 255, 0.4)',
                  '&:hover': {
                    background: saveSuccess ? 
                      'linear-gradient(135deg, #9F7AEA, #7C3AED)' : 
                      'linear-gradient(135deg, #00A8CC, #6BB6FF)',
                    boxShadow: saveSuccess ? 
                      '0 0 20px rgba(167, 139, 250, 0.6)' : 
                      '0 0 20px rgba(0, 194, 255, 0.6)',
                    transform: 'translateY(-1px)'
                  }
                }
              }}
            >
              {saveSuccess ? '✅ 保存成功' : isSaving ? '💾 保存中...' : '💾 保存'}
            </Button>
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Main className="aurora-content">
        <Container size="xl">
          {validationErrors.length > 0 && (
            <Alert
              title="保存失败 - 请完善所有必要信息"
              color="red"
              mb="md"
              styles={{
                title: { color: '#FF6B6B', fontSize: '16px', fontWeight: '700' },
                root: {
                  backgroundColor: 'rgba(255, 107, 107, 0.1)',
                  border: '2px solid #FF6B6B'
                }
              }}
            >
              <Text c="#FFB6C1" size="sm" mb="md">
                剧本需要4个tab的信息都完整才能保存到剧本库：
              </Text>
              <Stack gap="xs">
                {validationErrors.map((error, index) => (
                  <div key={index} style={{ 
                    display: 'flex', 
                    alignItems: 'center',
                    padding: '8px 12px',
                    backgroundColor: 'rgba(255, 107, 107, 0.1)',
                    borderRadius: '6px',
                    border: '1px solid rgba(255, 107, 107, 0.3)'
                  }}>
                    <Text size="sm" c="#FFB6C1" style={{ flex: 1 }}>
                      {error}
                    </Text>
                    <Button
                      size="xs"
                      variant="outline"
                      color="red"
                      onClick={() => {
                        if (error.includes('基本信息')) {
                          setActiveTab('info');
                        } else if (error.includes('故事编辑')) {
                          setActiveTab('story');
                        } else if (error.includes('角色管理')) {
                          setActiveTab('characters');
                        } else if (error.includes('剧本设置')) {
                          setActiveTab('settings');
                        }
                      }}
                      styles={{
                        root: {
                          borderColor: '#FF6B6B',
                          color: '#FF6B6B',
                          '&:hover': {
                            backgroundColor: 'rgba(255, 107, 107, 0.1)'
                          }
                        }
                      }}
                    >
                      去完善
                    </Button>
                  </div>
                ))}
              </Stack>
              <Text size="xs" c="#FFB6C1" mt="md" style={{ fontStyle: 'italic' }}>
                💡 提示：点击"去完善"按钮可以快速跳转到对应的tab进行编辑
              </Text>
            </Alert>
          )}

          <Tabs 
            value={activeTab} 
            onChange={(value) => setActiveTab(value || 'story')}
            styles={{
              list: {
                borderBottom: '2px solid rgba(0, 194, 255, 0.8)',
                marginBottom: '20px',
                backgroundColor: 'rgba(0, 194, 255, 0.05)',
                backdropFilter: 'blur(10px)'
              },
              tab: {
                color: '#87CEEB !important',
                fontSize: '16px',
                fontWeight: '600',
                padding: '16px 24px',
                borderBottom: '3px solid transparent',
                backgroundColor: 'rgba(0, 194, 255, 0.05)',
                textShadow: '0 0 8px rgba(135, 206, 235, 0.5)',
                '&:hover': {
                  color: '#00FFFF !important',
                  backgroundColor: 'rgba(0, 255, 255, 0.1)',
                  borderBottomColor: '#00FFFF',
                  textShadow: '0 0 12px rgba(0, 255, 255, 0.8)',
                  transform: 'translateY(-1px)'
                },
                '&[dataActive]': {
                  color: '#00FFFF !important',
                  borderBottomColor: '#00FFFF',
                  backgroundColor: 'rgba(0, 255, 255, 0.15)',
                  textShadow: '0 0 15px rgba(0, 255, 255, 0.8)'
                }
              },
              tabLabel: {
                color: 'inherit !important',
                fontWeight: '600'
              }
            }}
          >
            <Tabs.List>
              <Tabs.Tab 
                value="info"
                style={{
                  color: activeTab === 'info' ? '#E6F3FF' : '#87CEEB',
                  backgroundColor: activeTab === 'info' ? 'rgba(135, 206, 235, 0.3)' : 'rgba(135, 206, 235, 0.1)',
                  borderBottomColor: activeTab === 'info' ? '#87CEEB' : 'transparent',
                  fontWeight: activeTab === 'info' ? '800' : '700',
                  textShadow: activeTab === 'info' ? '0 0 15px rgba(135, 206, 235, 0.8)' : '0 0 10px rgba(135, 206, 235, 0.5)',
                  transform: activeTab === 'info' ? 'translateY(-2px)' : 'none',
                  boxShadow: activeTab === 'info' ? '0 4px 15px rgba(135, 206, 235, 0.3)' : 'none',
                  borderBottom: validationErrors.some(e => e.includes('基本信息')) ? '3px solid #FF6B6B' : 'none'
                }}
              >
                基本信息
                {validationErrors.some(e => e.includes('基本信息')) && (
                  <span style={{ color: '#FF6B6B', marginLeft: '8px', fontSize: '14px' }}>⚠️</span>
                )}
              </Tabs.Tab>
              <Tabs.Tab 
                value="story"
                style={{
                  color: activeTab === 'story' ? '#E6F3FF' : '#87CEEB',
                  backgroundColor: activeTab === 'story' ? 'rgba(135, 206, 235, 0.3)' : 'rgba(135, 206, 235, 0.1)',
                  borderBottomColor: activeTab === 'story' ? '#87CEEB' : 'transparent',
                  fontWeight: activeTab === 'story' ? '800' : '700',
                  textShadow: activeTab === 'story' ? '0 0 15px rgba(135, 206, 235, 0.8)' : '0 0 10px rgba(135, 206, 235, 0.5)',
                  transform: activeTab === 'story' ? 'translateY(-2px)' : 'none',
                  boxShadow: activeTab === 'story' ? '0 4px 15px rgba(135, 206, 235, 0.3)' : 'none',
                  borderBottom: validationErrors.some(e => e.includes('故事编辑')) ? '3px solid #FF6B6B' : 'none'
                }}
              >
                故事编辑
                {validationErrors.some(e => e.includes('故事编辑')) && (
                  <span style={{ color: '#FF6B6B', marginLeft: '8px', fontSize: '14px' }}>⚠️</span>
                )}
              </Tabs.Tab>
              <Tabs.Tab 
                value="characters"
                style={{
                  color: activeTab === 'characters' ? '#E6F3FF' : '#87CEEB',
                  backgroundColor: activeTab === 'characters' ? 'rgba(135, 206, 235, 0.3)' : 'rgba(135, 206, 235, 0.1)',
                  borderBottomColor: activeTab === 'characters' ? '#87CEEB' : 'transparent',
                  fontWeight: activeTab === 'characters' ? '800' : '700',
                  textShadow: activeTab === 'characters' ? '0 0 15px rgba(135, 206, 235, 0.8)' : '0 0 10px rgba(135, 206, 235, 0.5)',
                  transform: activeTab === 'characters' ? 'translateY(-2px)' : 'none',
                  boxShadow: activeTab === 'characters' ? '0 4px 15px rgba(135, 206, 235, 0.3)' : 'none',
                  borderBottom: validationErrors.some(e => e.includes('角色管理')) ? '3px solid #FF6B6B' : 'none'
                }}
              >
                角色管理
                {validationErrors.some(e => e.includes('角色管理')) && (
                  <span style={{ color: '#FF6B6B', marginLeft: '8px', fontSize: '14px' }}>⚠️</span>
                )}
              </Tabs.Tab>
              <Tabs.Tab 
                value="evidences"
                style={{
                  color: activeTab === 'evidences' ? '#E6F3FF' : '#87CEEB',
                  backgroundColor: activeTab === 'evidences' ? 'rgba(135, 206, 235, 0.3)' : 'rgba(135, 206, 235, 0.1)',
                  borderBottomColor: activeTab === 'evidences' ? '#87CEEB' : 'transparent',
                  fontWeight: activeTab === 'evidences' ? '800' : '700',
                  textShadow: activeTab === 'evidences' ? '0 0 15px rgba(135, 206, 235, 0.8)' : '0 0 10px rgba(135, 206, 235, 0.5)',
                  transform: activeTab === 'evidences' ? 'translateY(-2px)' : 'none',
                  boxShadow: activeTab === 'evidences' ? '0 4px 15px rgba(135, 206, 235, 0.3)' : 'none',
                  borderBottom: validationErrors.some(e => e.includes('证物管理')) ? '3px solid #FF6B6B' : 'none'
                }}
              >
                证物管理
                {validationErrors.some(e => e.includes('证物管理')) && (
                  <span style={{ color: '#FF6B6B', marginLeft: '8px', fontSize: '14px' }}>⚠️</span>
                )}
              </Tabs.Tab>
              <Tabs.Tab 
                value="settings"
                style={{
                  color: activeTab === 'settings' ? '#E6F3FF' : '#87CEEB',
                  backgroundColor: activeTab === 'settings' ? 'rgba(135, 206, 235, 0.3)' : 'rgba(135, 206, 235, 0.1)',
                  borderBottomColor: activeTab === 'settings' ? '#87CEEB' : 'transparent',
                  fontWeight: activeTab === 'settings' ? '800' : '700',
                  textShadow: activeTab === 'settings' ? '0 0 15px rgba(135, 206, 235, 0.8)' : '0 0 10px rgba(135, 206, 235, 0.5)',
                  transform: activeTab === 'settings' ? 'translateY(-2px)' : 'none',
                  boxShadow: activeTab === 'settings' ? '0 4px 15px rgba(135, 206, 235, 0.3)' : 'none',
                  borderBottom: validationErrors.some(e => e.includes('剧本设置')) ? '3px solid #FF6B6B' : 'none'
                }}
              >
                剧本设置
                {validationErrors.some(e => e.includes('剧本设置')) && (
                  <span style={{ color: '#FF6B6B', marginLeft: '8px', fontSize: '14px' }}>⚠️</span>
                )}
              </Tabs.Tab>
            </Tabs.List>

            <Tabs.Panel value="info" pt="md">
              {script && (
                <Paper p="md" style={{ background: 'rgba(255, 255, 255, 0.05)' }}>
                  <Stack>
                    <Title order={3} c="#87CEEB">
                      剧本基本信息
                    </Title>
                    
                    <div>
                      <Group justify="space-between" align="flex-end" mb="xs">
                        <Text size="sm" fw={600} style={{ color: '#87CEEB' }}>
                          剧本标题
                        </Text>
                        <PolishButton onClick={() => handleOpenPolish('title')} />
                      </Group>
                      <TextInput
                        placeholder="输入剧本标题，例如：午夜凶杀案、校园谜案、密室杀人事件"
                        value={script.title}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateScriptData({ title: e.target.value })}
                        required
                        styles={{
                          input: {
                            backgroundColor: 'rgba(255, 255, 255, 0.1)',
                            border: '2px solid #00FFFF',
                            color: '#FFFFFF',
                            '&::placeholder': {
                              color: '#B8B8B8',
                              opacity: 1
                            },
                            '&:focus': {
                              borderColor: '#FFFF00',
                              boxShadow: '0 0 10px rgba(255, 255, 0, 0.3)',
                              '&::placeholder': {
                                color: '#90EE90',
                                opacity: 0.7
                              }
                            }
                          }
                        }}
                      />
                    </div>

                    <div>
                      <Group justify="space-between" align="flex-end" mb="xs">
                        <Text size="sm" fw={600} style={{ color: '#87CEEB' }}>
                          剧本描述
                        </Text>
                        <PolishButton onClick={() => handleOpenPolish('description')} />
                      </Group>
                      <Textarea
                        placeholder="简要描述剧本内容，例如：一个发生在大学校园的谋杀案，死者是心理学教授，嫌疑人包括他的学生、同事和前妻。玩家需要通过询问和推理找出真凶。"
                        value={script.description}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => updateScriptData({ description: e.target.value })}
                        minRows={3}
                        required
                        styles={{
                          input: {
                            backgroundColor: 'rgba(255, 255, 255, 0.1)',
                            border: '2px solid #00FFFF',
                            color: '#FFFFFF',
                            '&::placeholder': {
                              color: '#B8B8B8',
                              opacity: 1
                            },
                            '&:focus': {
                              borderColor: '#FFFF00',
                              boxShadow: '0 0 10px rgba(255, 255, 0, 0.3)',
                              '&::placeholder': {
                                color: '#90EE90',
                                opacity: 0.7
                              }
                            }
                          }
                        }}
                      />
                    </div>

                    <TextInput
                      label="作者"
                      placeholder="输入作者姓名，例如：张三、李四、创作团队"
                      value={script.author}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateScriptData({ author: e.target.value })}
                      required
                      styles={{
                        label: { color: '#87CEEB', fontWeight: '600' },
                        input: {
                          backgroundColor: 'rgba(255, 255, 255, 0.1)',
                          border: '2px solid #00FFFF',
                          color: '#FFFFFF',
                          '&::placeholder': {
                            color: '#B8B8B8',
                            opacity: 1
                          },
                          '&:focus': {
                            borderColor: '#FFFF00',
                            boxShadow: '0 0 10px rgba(255, 255, 0, 0.3)',
                            '&::placeholder': {
                              color: '#90EE90',
                              opacity: 0.7
                            }
                          }
                        }
                      }}
                    />

                    <TextInput
                      label="版本号"
                      placeholder="输入版本号，例如：1.0.0、2.1.0"
                      value={script.version}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateScriptData({ version: e.target.value })}
                      styles={{
                        label: { color: '#87CEEB', fontWeight: '600' },
                        input: {
                          backgroundColor: 'rgba(255, 255, 255, 0.1)',
                          border: '2px solid #00FFFF',
                          color: '#FFFFFF',
                          '&::placeholder': {
                            color: '#B8B8B8',
                            opacity: 1
                          },
                          '&:focus': {
                            borderColor: '#FFFF00',
                            boxShadow: '0 0 10px rgba(255, 255, 0, 0.3)',
                            '&::placeholder': {
                              color: '#90EE90',
                              opacity: 0.7
                            }
                          }
                        }
                      }}
                    />

                    <Alert
                      title="提示"
                      color="cyan"
                      variant="light"
                      styles={{
                        title: { color: '#87CEEB' }
                      }}
                    >
                      <Text size="sm" c="#90EE90">
                        这些信息将显示在剧本库的卡片中，帮助其他用户了解您的剧本。请填写清晰、有吸引力的标题和描述。
                      </Text>
                    </Alert>
                  </Stack>
                </Paper>
              )}
            </Tabs.Panel>

            <Tabs.Panel value="story" pt="md">
              {script && (
                <StoryEditor
                  globalStory={script.globalStory || ''}
                  onUpdate={(globalStory) => updateScriptData({ globalStory })}
                  onOpenPolish={() => handleOpenPolish('globalStory')}
                />
              )}
            </Tabs.Panel>

            <Tabs.Panel value="characters" pt="md">
              {script && (
                <CharacterEditor
                  characters={script.characters || []}
                  onUpdate={(characters) => updateScriptData({ characters })}
                  onOpenPolish={(fieldPath) => handleOpenPolish(fieldPath)}
                />
              )}
            </Tabs.Panel>

            <Tabs.Panel value="evidences" pt="md">
              {script && (
                <EvidenceManagementPanel
                  evidences={script.evidences || []}
                  characters={script.characters.map(c => c.name)}
                  onEvidencesChange={(evidences) => updateScriptData({ evidences })}
                  script={script}
                  onOpenPolish={handleOpenPolish}
                />
              )}
            </Tabs.Panel>

            <Tabs.Panel value="settings" pt="md">
              {script && (
                <ScriptSettings
                  settings={script.settings || { theme: 'dark', difficulty: 'medium', estimatedDuration: 60 }}
                  onUpdate={(settings) => updateScriptData({ settings })}
                />
              )}
            </Tabs.Panel>
          </Tabs>
        </Container>
      </AppShell.Main>

      {showPreview && script && (
        <PreviewModal
          script={script}
          opened={showPreview}
          onClose={() => setShowPreview(false)}
        />
      )}

      {/* AI润色模态框 */}
      {script && (
        <ScriptPolishModal
          opened={polishModalOpened}
          onClose={() => setPolishModalOpened(false)}
          script={script}
          fieldPath={polishFieldPath}
          onApplyPolish={handleApplyPolish}
        />
      )}

    </AppShell>
  );
};

export default ScriptEditor;
