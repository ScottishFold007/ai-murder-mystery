import React, { useState } from 'react';
import { 
  Stack, 
  Title, 
  Text, 
  Button, 
  Group, 
  Tabs,
  Card,
  TextInput,
  Textarea,
  Select,
  NumberInput,
  Switch,
  Badge,
  Alert,
  ActionIcon,
  Modal,
  Image,
  Loader
} from '@mantine/core';
import { IconEdit, IconTrash, IconPlus, IconCheck, IconX, IconPhoto } from '@tabler/icons-react';
import { Script, Character, ScriptEvidence } from '../../types/script';
import { generateCharacterAvatar } from '../../api/avatarGenerator';
import { useScriptContext } from '../../providers/scriptContext';
import ScriptPolishModal from '../ScriptPolishModal';
import PolishButton from '../PolishButton';
import { setFieldValue } from '../../api/scriptPolisher';
import EvidenceManagementPanel from '../ScriptEditor/EvidenceManagementPanel';

interface ScriptEditorProps {
  script: Script;
  onScriptChange: (script: Script) => void;
}

const ScriptEditor: React.FC<ScriptEditorProps> = ({ script, onScriptChange }) => {
  const [activeTab, setActiveTab] = useState<string>('basic');
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [editingCharacter, setEditingCharacter] = useState<Character | null>(null);
  const [characterModalOpen, setCharacterModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { saveScript } = useScriptContext();
  
  // AI润色相关状态
  const [polishModalOpened, setPolishModalOpened] = useState(false);
  const [polishFieldPath, setPolishFieldPath] = useState<string>('');

  const updateScript = (updates: Partial<Script>) => {
    onScriptChange({ ...script, ...updates });
  };

  // 证物更新函数
  const handleEvidencesChange = (evidences: ScriptEvidence[]) => {
    updateScript({ evidences });
  };

  // 打开润色模态框
  const handleOpenPolish = (fieldPath: string) => {
    setPolishFieldPath(fieldPath);
    setPolishModalOpened(true);
  };

  // 应用润色结果
  const handleApplyPolish = (fieldPath: string, polishedContent: string) => {
    console.log(`🎨 [DEBUG] ScriptGenerator handleApplyPolish: 字段路径=${fieldPath}, 内容长度=${polishedContent.length}`);
    const updatedScript = setFieldValue(script, fieldPath, polishedContent);
    onScriptChange(updatedScript);
  };

  const updateCharacter = (index: number, character: Character) => {
    const newCharacters = [...script.characters];
    newCharacters[index] = character;
    updateScript({ characters: newCharacters });
  };

  const addCharacter = () => {
    const newCharacter: Character = {
      name: '新角色',
      bio: '',
      personality: '',
      context: '',
      secret: '',
      violation: '',
      image: 'default.png',
      isPlayer: false,
      isAssistant: false,
      isPartner: false,
      isKiller: false,
      isVictim: false,
      roleType: '嫌疑人'
    };
    setEditingCharacter(newCharacter);
    setCharacterModalOpen(true);
  };

  const deleteCharacter = (index: number) => {
    const newCharacters = script.characters.filter((_, i) => i !== index);
    updateScript({ characters: newCharacters });
  };

  const validateScript = () => {
    const errors: string[] = [];
    
    // 验证角色唯一性
    const playerCount = script.characters.filter(c => c.isPlayer).length;
    const killerCount = script.characters.filter(c => c.isKiller).length;
    const assistantCount = script.characters.filter(c => c.isAssistant).length;

    if (playerCount !== 1) errors.push('必须有且仅有一个玩家角色');
    if (killerCount !== 1) errors.push('必须有且仅有一个凶手角色');
    if (assistantCount !== 1) errors.push('必须有且仅有一个助手角色');

    // 验证设置一致性
    const killerName = script.characters.find(c => c.isKiller)?.name;
    const playerName = script.characters.find(c => c.isPlayer)?.name;
    const assistantName = script.characters.find(c => c.isAssistant)?.name;

    if (killerName && killerName !== script.settings.killerRole) {
      errors.push('设置中的凶手角色名与角色数据不一致');
    }
    if (playerName && playerName !== script.settings.playerName) {
      errors.push('设置中的玩家角色名与角色数据不一致');
    }
    if (assistantName && assistantName !== script.settings.partnerRole) {
      errors.push('设置中的搭档角色名与角色数据不一致');
    }

    // 验证必要字段
    if (!script.title?.trim()) errors.push('剧本标题不能为空');
    if (!script.globalStory?.trim()) errors.push('全局故事背景不能为空');
    
    script.characters.forEach((char, index) => {
      if (!char.name?.trim()) errors.push(`第${index + 1}个角色的名字不能为空`);
      if (!char.context?.trim()) errors.push(`角色"${char.name}"的情境知识不能为空`);
    });

    setValidationErrors(errors);
    return errors.length === 0;
  };

  const exportScript = () => {
    if (!validateScript()) {
      return;
    }

    const dataStr = JSON.stringify(script, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${script.id || 'script'}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const saveToLibrary = async () => {
    if (!validateScript()) {
      return;
    }

    setIsSaving(true);
    
    try {
      // 确保剧本有正确的时间戳和sourceType
      const scriptToSave = {
        ...script,
        createdAt: script.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        sourceType: 'ai' as const
      };

      
      // 使用统一的保存方法（优先数据库，降级到localStorage）
      await saveScript(scriptToSave);
      
      alert('✅ 剧本已成功保存到剧本库！\n\n现在可以在剧本库页面看到您的剧本了。');
      
    } catch (error) {
      console.error('❌ 保存剧本失败:', error);
      alert('❌ 保存失败，请重试');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Stack gap="lg">
      <Group justify="space-between">
        <Title order={2} style={{ color: '#00C2FF' }}>
          剧本编辑器
        </Title>
        <Group>
          <Button 
            variant="outline" 
            onClick={validateScript}
            color={validationErrors.length === 0 ? 'green' : 'red'}
            leftSection={validationErrors.length === 0 ? <IconCheck size={16} /> : <IconX size={16} />}
          >
            验证剧本
          </Button>
          <Button 
            onClick={saveToLibrary}
            loading={isSaving}
            disabled={isSaving}
            styles={{
              root: {
                background: isSaving 
                  ? 'linear-gradient(135deg, #888 0%, #666 100%)'
                  : 'linear-gradient(135deg, #4ECCA3 0%, #3BB89A 100%)',
                border: `2px solid ${isSaving ? '#888' : '#4ECCA3'}`,
                color: isSaving ? '#FFFFFF' : '#000000',
                fontWeight: 'bold',
                '&:hover': {
                  background: isSaving
                    ? 'linear-gradient(135deg, #888 0%, #666 100%)'
                    : 'linear-gradient(135deg, #3BB89A 0%, #2A9B7A 100%)',
                  transform: isSaving ? 'none' : 'translateY(-1px)'
                }
              }
            }}
          >
            {isSaving ? '💾 保存中...' : '📚 保存到剧本库'}
          </Button>
          <Button 
            onClick={exportScript}
            styles={{
              root: {
                background: 'linear-gradient(135deg, #00C2FF 0%, #0099CC 100%)',
                border: '2px solid #00C2FF',
                color: '#FFFFFF',
                fontWeight: 'bold',
                '&:hover': {
                  background: 'linear-gradient(135deg, #0099CC 0%, #0077AA 100%)',
                  transform: 'translateY(-1px)'
                }
              }
            }}
          >
            📤 导出JSON
          </Button>
        </Group>
      </Group>

      {validationErrors.length > 0 && (
        <Alert color="red" title="验证失败">
          <ul style={{ margin: 0, paddingLeft: '20px' }}>
            {validationErrors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </Alert>
      )}

      <Tabs 
        value={activeTab} 
        onChange={(value) => setActiveTab(value || 'basic')}
        styles={{
          tab: {
            color: '#E0E0E0'
          }
        }}
      >
        <Tabs.List>
          <Tabs.Tab 
            value="basic"
            style={{
              color: activeTab === 'basic' ? '#00C2FF' : '#E0E0E0'
            }}
          >
            📋 基础信息
          </Tabs.Tab>
          <Tabs.Tab 
            value="story"
            style={{
              color: activeTab === 'story' ? '#00C2FF' : '#E0E0E0'
            }}
          >
            📖 故事背景
          </Tabs.Tab>
          <Tabs.Tab 
            value="characters"
            style={{
              color: activeTab === 'characters' ? '#00C2FF' : '#E0E0E0'
            }}
          >
            👥 角色设定
          </Tabs.Tab>
          <Tabs.Tab 
            value="evidences"
            style={{
              color: activeTab === 'evidences' ? '#00C2FF' : '#E0E0E0'
            }}
          >
            🔍 证物管理
          </Tabs.Tab>
          <Tabs.Tab 
            value="settings"
            style={{
              color: activeTab === 'settings' ? '#00C2FF' : '#E0E0E0'
            }}
          >
            ⚙️ 游戏设置
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="basic" style={{ paddingTop: '20px' }}>
          <Card style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid #333' }}>
            <Stack gap="md">
              <div>
                <Group justify="space-between" align="flex-end" mb="xs">
                  <Text size="sm" fw="bold" style={{ color: '#FFB74D' }}>
                    剧本标题
                  </Text>
                  <PolishButton onClick={() => handleOpenPolish('title')} />
                </Group>
                <TextInput
                  value={script.title || ''}
                  onChange={(event) => updateScript({ title: event.currentTarget.value })}
                  styles={{
                    input: { backgroundColor: 'rgba(255, 255, 255, 0.05)', color: '#E0E0E0' }
                  }}
                />
              </div>
              
              <TextInput
                label="剧本ID"
                value={script.id || ''}
                onChange={(event) => updateScript({ id: event.currentTarget.value })}
                description="英文小写，下划线分隔"
                styles={{
                  label: { color: '#FFB74D', fontWeight: 'bold' },
                  description: { color: '#B8B8B8' },
                  input: { backgroundColor: 'rgba(255, 255, 255, 0.05)', color: '#E0E0E0' }
                }}
              />

              <div>
                <Group justify="space-between" align="flex-end" mb="xs">
                  <Text size="sm" fw="bold" style={{ color: '#FFB74D' }}>
                    剧本简介
                  </Text>
                  <PolishButton onClick={() => handleOpenPolish('description')} />
                </Group>
                <Textarea
                  value={script.description || ''}
                  onChange={(event) => updateScript({ description: event.currentTarget.value })}
                  minRows={3}
                  styles={{
                    input: { backgroundColor: 'rgba(255, 255, 255, 0.05)', color: '#E0E0E0' }
                  }}
                />
              </div>
            </Stack>
          </Card>
        </Tabs.Panel>

        <Tabs.Panel value="story" style={{ paddingTop: '20px' }}>
          <Card style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid #333' }}>
            <Stack gap="md">
              <Group justify="space-between" align="flex-end">
                <div>
                  <Text size="lg" fw="bold" style={{ color: '#FFFFFF' }}>
                    全局故事背景
                  </Text>
                  <Text size="sm" style={{ color: '#E0E0E0' }}>
                    所有AI角色的共同知识基础，包含案件描述、时间线和核心谜题
                  </Text>
                </div>
                <PolishButton onClick={() => handleOpenPolish('globalStory')} />
              </Group>
              <Textarea
                value={script.globalStory || ''}
                onChange={(event) => updateScript({ globalStory: event.currentTarget.value })}
                minRows={20}
                maxRows={30}
                autosize
                styles={{
                  input: { 
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    borderColor: '#555',
                    color: '#FFFFFF',
                    fontSize: '15px',
                    lineHeight: '1.6',
                    padding: '16px',
                    borderWidth: '2px',
                    borderRadius: '8px',
                    '&:focus': {
                      borderColor: '#00C2FF',
                      backgroundColor: 'rgba(255, 255, 255, 0.15)',
                      boxShadow: '0 0 10px rgba(0, 194, 255, 0.3)'
                    }
                  }
                }}
              />
            </Stack>
          </Card>
        </Tabs.Panel>

        <Tabs.Panel value="characters" style={{ paddingTop: '20px' }}>
          <Stack gap="md">
            <Group justify="space-between">
              <Title order={3} style={{ color: '#00C2FF' }}>
                角色列表 ({script.characters.length}人)
              </Title>
              <Button 
                leftSection={<IconPlus size={16} />}
                onClick={addCharacter}
                style={{ background: '#4ECCA3', color: '#000' }}
              >
                添加角色
              </Button>
            </Group>

            {script.characters.map((character, index) => (
              <Card 
                key={index}
                style={{ 
                  background: 'rgba(255, 255, 255, 0.05)', 
                  border: `2px solid ${character.isKiller ? '#E63946' : character.isPlayer ? '#00C2FF' : character.isAssistant ? '#4ECCA3' : '#333'}` 
                }}
              >
                <Group justify="space-between" align="flex-start">
                  <Stack gap="xs" style={{ flex: 1 }}>
                    <Group>
                      <Text size="lg" style={{ color: '#E0E0E0', fontWeight: 'bold' }}>
                        {character.name}
                      </Text>
                      <Badge 
                        color={character.isKiller ? 'red' : character.isPlayer ? 'blue' : character.isAssistant ? 'green' : 'gray'}
                        variant="filled"
                      >
                        {character.roleType}
                      </Badge>
                    </Group>
                    
                    <Text size="sm" style={{ color: '#B8B8B8' }}>
                      {character.bio}
                    </Text>
                    
                    <Text size="xs" style={{ color: '#888' }}>
                      秘密: {character.secret}
                    </Text>
                  </Stack>

                  <Group gap="xs">
                    <ActionIcon 
                      variant="outline" 
                      onClick={() => {
                        setEditingCharacter(character);
                        setCharacterModalOpen(true);
                      }}
                    >
                      <IconEdit size={16} />
                    </ActionIcon>
                    <ActionIcon 
                      variant="outline" 
                      color="red"
                      onClick={() => deleteCharacter(index)}
                    >
                      <IconTrash size={16} />
                    </ActionIcon>
                  </Group>
                </Group>
              </Card>
            ))}
          </Stack>
        </Tabs.Panel>

        <Tabs.Panel value="evidences" style={{ paddingTop: '20px' }}>
          <EvidenceManagementPanel
            evidences={script.evidences || []}
            characters={script.characters.map(c => c.name)}
            onEvidencesChange={handleEvidencesChange}
            script={script}
            onOpenPolish={handleOpenPolish}
          />
        </Tabs.Panel>

        <Tabs.Panel value="settings" style={{ paddingTop: '20px' }}>
          <Card style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid #333' }}>
            <Stack gap="md">
              <Group grow>
                <TextInput
                  label="主题风格"
                  description="由AI根据剧本内容智能生成"
                  value={script.settings.theme || '未设置'}
                  readOnly
                  styles={{
                    label: { 
                      color: '#FFFFFF', 
                      fontWeight: 'bold',
                      fontSize: '16px',
                      textShadow: '1px 1px 3px rgba(0, 0, 0, 0.8)'
                    },
                    description: { 
                      color: '#B8B8B8',
                      fontSize: '14px',
                      fontStyle: 'italic'
                    },
                    input: { 
                      backgroundColor: 'rgba(255, 255, 255, 0.05)', 
                      borderColor: '#444',
                      color: '#E0E0E0',
                      cursor: 'not-allowed'
                    }
                  }}
                />

                <Select
                  label="难度等级"
                  data={[
                    { value: 'easy', label: '简单' },
                    { value: 'medium', label: '中等' },
                    { value: 'hard', label: '困难' }
                  ]}
                  value={script.settings.difficulty}
                  onChange={(value) => updateScript({ 
                    settings: { ...script.settings, difficulty: (value as 'easy' | 'medium' | 'hard') || 'medium' } 
                  })}
                  styles={{
                    label: { color: '#FFB74D', fontWeight: 'bold' },
                    input: { backgroundColor: 'rgba(255, 255, 255, 0.05)', color: '#E0E0E0' }
                  }}
                />
              </Group>

              <NumberInput
                label="预估游戏时长（分钟）"
                value={script.settings.estimatedDuration || 60}
                onChange={(value) => updateScript({ 
                  settings: { ...script.settings, estimatedDuration: Number(value) || 60 } 
                })}
                min={30}
                max={180}
                styles={{
                  label: { color: '#FFB74D', fontWeight: 'bold' },
                  input: { backgroundColor: 'rgba(255, 255, 255, 0.05)', color: '#E0E0E0' }
                }}
              />

              <Group grow>
                <Select
                  label="玩家角色"
                  data={script.characters.map(c => ({ value: c.name, label: c.name }))}
                  value={script.settings.playerName}
                  onChange={(value) => updateScript({ 
                    settings: { 
                      ...script.settings, 
                      playerName: value || '',
                      playerRole: value || ''
                    } 
                  })}
                  styles={{
                    label: { color: '#00C2FF', fontWeight: 'bold' },
                    input: { backgroundColor: 'rgba(255, 255, 255, 0.05)', color: '#E0E0E0' }
                  }}
                />

                <Select
                  label="搭档角色"
                  data={script.characters.map(c => ({ value: c.name, label: c.name }))}
                  value={script.settings.partnerRole}
                  onChange={(value) => updateScript({ 
                    settings: { ...script.settings, partnerRole: value || '' } 
                  })}
                  styles={{
                    label: { color: '#4ECCA3', fontWeight: 'bold' },
                    input: { backgroundColor: 'rgba(255, 255, 255, 0.05)', color: '#E0E0E0' }
                  }}
                />

                <Select
                  label="凶手角色"
                  data={script.characters.map(c => ({ value: c.name, label: c.name }))}
                  value={script.settings.killerRole}
                  onChange={(value) => updateScript({ 
                    settings: { 
                      ...script.settings, 
                      killerRole: value || '',
                      hiddenKiller: value || ''
                    } 
                  })}
                  styles={{
                    label: { color: '#E63946', fontWeight: 'bold' },
                    input: { backgroundColor: 'rgba(255, 255, 255, 0.05)', color: '#E0E0E0' }
                  }}
                />
              </Group>
            </Stack>
          </Card>
        </Tabs.Panel>
      </Tabs>

      {/* 角色编辑模态框 */}
      <Modal
        opened={characterModalOpen}
        onClose={() => setCharacterModalOpen(false)}
        title="编辑角色"
        size="lg"
        styles={{
          content: { backgroundColor: '#1A1A2E' },
          header: { backgroundColor: '#1A1A2E', borderBottom: '1px solid #333' },
          title: { color: '#00C2FF', fontWeight: 'bold' }
        }}
      >
        {editingCharacter && (
          <CharacterEditForm 
            character={editingCharacter}
            onSave={(character) => {
              const existingIndex = script.characters.findIndex(c => c.name === editingCharacter.name);
              if (existingIndex >= 0) {
                updateCharacter(existingIndex, character);
              } else {
                updateScript({ characters: [...script.characters, character] });
              }
              setCharacterModalOpen(false);
            }}
            onCancel={() => setCharacterModalOpen(false)}
          />
        )}
      </Modal>

      {/* AI润色模态框 */}
      <ScriptPolishModal
        opened={polishModalOpened}
        onClose={() => setPolishModalOpened(false)}
        script={script}
        fieldPath={polishFieldPath}
        onApplyPolish={handleApplyPolish}
      />
    </Stack>
  );
};

// 角色编辑表单组件
const CharacterEditForm: React.FC<{
  character: Character;
  onSave: (character: Character) => void;
  onCancel: () => void;
}> = ({ character, onSave, onCancel }) => {
  const [editedCharacter, setEditedCharacter] = useState<Character>({ ...character });
  const [isGeneratingAvatar, setIsGeneratingAvatar] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(
    character.image && character.image.startsWith('data:image/') ? character.image : null
  );

  const updateField = (field: keyof Character, value: any) => {
    setEditedCharacter({ ...editedCharacter, [field]: value });
  };

  const handleGenerateAvatar = async () => {
    if (!editedCharacter.name || !editedCharacter.bio) {
      alert('请先填写角色名字和背景信息');
      return;
    }

    setIsGeneratingAvatar(true);
    
    try {
      // 生成唯一的角色标识符，避免重名冲突
      const timestamp = Date.now();
      const randomSuffix = Math.random().toString(36).substring(2, 8); // 6位随机字符
      const uniqueCharacterName = `${editedCharacter.name}_${timestamp}_${randomSuffix}`;
      
      // 只使用名称和背景生成头像，不使用性格（性格描述会降低图像质量）
      const result = await generateCharacterAvatar(
        uniqueCharacterName, // 使用唯一标识符作为文件名
        editedCharacter.bio
      );

      if (result.success && result.base64_image) {
        // 设置预览图片
        const dataUrl = `data:image/png;base64,${result.base64_image}`;
        setAvatarPreview(dataUrl);
        
        // 更新角色的image字段为data URL，这样在所有地方都能正确显示
        updateField('image', dataUrl);
        
      } else {
        alert(`头像生成失败: ${result.message}`);
      }
    } catch (error) {
      console.error('❌ 头像生成异常:', error);
      alert('头像生成失败，请重试');
    } finally {
      setIsGeneratingAvatar(false);
    }
  };

  return (
    <Stack gap="md">
      <TextInput
        label="角色名"
        value={editedCharacter.name}
        onChange={(e) => updateField('name', e.currentTarget.value)}
        styles={{
          label: { 
            color: '#FFFFFF', 
            fontWeight: 'bold',
            fontSize: '16px',
            textShadow: '1px 1px 3px rgba(0, 0, 0, 0.8)'
          },
          input: { 
            backgroundColor: 'rgba(255, 255, 255, 0.1)', 
            borderColor: '#555',
            color: '#FFFFFF',
            '&:focus': {
              borderColor: '#00C2FF',
              backgroundColor: 'rgba(255, 255, 255, 0.15)'
            }
          }
        }}
      />

      {/* 头像生成区域 */}
      <Card style={{ 
        background: 'rgba(0, 194, 255, 0.05)', 
        border: '1px solid rgba(0, 194, 255, 0.3)',
        borderRadius: '12px'
      }}>
        <Stack gap="md">
          <Text style={{ 
            color: '#FFFFFF', 
            fontWeight: 'bold',
            fontSize: '16px',
            textShadow: '1px 1px 3px rgba(0, 0, 0, 0.8)'
          }}>
            🎭 角色头像
          </Text>
          
          <Group align="flex-start">
            {/* 头像预览区域 */}
            <Card style={{ 
              width: 120, 
              height: 120, 
              background: 'rgba(255, 255, 255, 0.1)',
              border: '2px dashed #555',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {avatarPreview ? (
                <Image
                  src={avatarPreview}
                  alt={`${editedCharacter.name}的头像`}
                  width={110}
                  height={110}
                  style={{ borderRadius: '8px' }}
                />
              ) : (
                <Stack align="center" gap="xs">
                  <IconPhoto size={32} style={{ color: '#666' }} />
                  <Text size="xs" style={{ color: '#999', textAlign: 'center' }}>
                    头像预览
                  </Text>
                </Stack>
              )}
            </Card>

            {/* 生成按钮区域 */}
            <Stack gap="sm" style={{ flex: 1 }}>
              <Button
                onClick={handleGenerateAvatar}
                disabled={isGeneratingAvatar || !editedCharacter.name || !editedCharacter.bio || !editedCharacter.personality}
                loading={isGeneratingAvatar}
                leftSection={isGeneratingAvatar ? <Loader size="xs" /> : <IconPhoto size={16} />}
                styles={{
                  root: {
                    background: isGeneratingAvatar 
                      ? 'linear-gradient(135deg, #666 0%, #555 100%)'
                      : 'linear-gradient(135deg, #E63946 0%, #CC2936 100%)',
                    border: `2px solid ${isGeneratingAvatar ? '#666' : '#E63946'}`,
                    color: '#FFFFFF',
                    fontWeight: 'bold',
                    '&:hover': {
                      background: isGeneratingAvatar 
                        ? 'linear-gradient(135deg, #666 0%, #555 100%)'
                        : 'linear-gradient(135deg, #CC2936 0%, #B8252F 100%)',
                      transform: isGeneratingAvatar ? 'none' : 'translateY(-1px)'
                    },
                    '&:disabled': {
                      background: 'linear-gradient(135deg, #666 0%, #555 100%)',
                      border: '2px solid #666'
                    }
                  }
                }}
              >
                {isGeneratingAvatar ? '🎨 生成中...' : '🎨 生成头像'}
              </Button>
              
              <Text size="xs" style={{ 
                color: '#B8B8B8',
                lineHeight: '1.4'
              }}>
                💡 基于角色描述生成电影写真风格头像
              </Text>
              
              {!editedCharacter.name && (
                <Text size="xs" style={{ color: '#E63946' }}>
                  ⚠️ 请先填写角色名字
                </Text>
              )}
            </Stack>
          </Group>
        </Stack>
      </Card>

      <Group grow>
        <Switch
          label="玩家角色"
          checked={editedCharacter.isPlayer}
          onChange={(e) => updateField('isPlayer', e.currentTarget.checked)}
          color="blue"
          styles={{
            label: { 
              color: '#FFFFFF', 
              fontSize: '16px', 
              fontWeight: 'bold',
              textShadow: '1px 1px 3px rgba(0, 0, 0, 0.8)'
            }
          }}
        />
        <Switch
          label="助手角色"
          checked={editedCharacter.isAssistant}
          onChange={(e) => {
            updateField('isAssistant', e.currentTarget.checked);
            updateField('isPartner', e.currentTarget.checked);
          }}
          color="green"
          styles={{
            label: { 
              color: '#FFFFFF', 
              fontSize: '16px', 
              fontWeight: 'bold',
              textShadow: '1px 1px 3px rgba(0, 0, 0, 0.8)'
            }
          }}
        />
        <Switch
          label="凶手角色"
          checked={editedCharacter.isKiller}
          onChange={(e) => updateField('isKiller', e.currentTarget.checked)}
          color="red"
          styles={{
            label: { 
              color: '#FFFFFF', 
              fontSize: '16px', 
              fontWeight: 'bold',
              textShadow: '1px 1px 3px rgba(0, 0, 0, 0.8)'
            }
          }}
        />
      </Group>

      <Textarea
        label="角色背景 (bio)"
        value={editedCharacter.bio}
        onChange={(e) => updateField('bio', e.currentTarget.value)}
        minRows={3}
        styles={{
          label: { 
            color: '#FFFFFF', 
            fontWeight: 'bold',
            fontSize: '16px',
            textShadow: '1px 1px 3px rgba(0, 0, 0, 0.8)'
          },
          input: { 
            backgroundColor: 'rgba(255, 255, 255, 0.1)', 
            borderColor: '#555',
            color: '#FFFFFF',
            '&:focus': {
              borderColor: '#FFB74D',
              backgroundColor: 'rgba(255, 255, 255, 0.15)'
            }
          }
        }}
      />

      <Textarea
        label="角色性格 (personality)"
        value={editedCharacter.personality}
        onChange={(e) => updateField('personality', e.currentTarget.value)}
        minRows={2}
        styles={{
          label: { 
            color: '#FFFFFF', 
            fontWeight: 'bold',
            fontSize: '16px',
            textShadow: '1px 1px 3px rgba(0, 0, 0, 0.8)'
          },
          input: { 
            backgroundColor: 'rgba(255, 255, 255, 0.1)', 
            borderColor: '#555',
            color: '#FFFFFF',
            '&:focus': {
              borderColor: '#FFB74D',
              backgroundColor: 'rgba(255, 255, 255, 0.15)'
            }
          }
        }}
      />

      <Textarea
        label="情境知识 (context)"
        description="使用第二人称'你...'描述AI角色知道什么、经历了什么"
        value={editedCharacter.context}
        onChange={(e) => updateField('context', e.currentTarget.value)}
        minRows={4}
        styles={{
          label: { 
            color: '#FFFFFF', 
            fontWeight: 'bold',
            fontSize: '16px',
            textShadow: '1px 1px 3px rgba(0, 0, 0, 0.8)'
          },
          description: { 
            color: '#E0E0E0',
            fontSize: '14px',
            textShadow: '1px 1px 2px rgba(0, 0, 0, 0.6)'
          },
          input: { 
            backgroundColor: 'rgba(255, 255, 255, 0.1)', 
            borderColor: '#555',
            color: '#FFFFFF',
            '&:focus': {
              borderColor: '#00C2FF',
              backgroundColor: 'rgba(255, 255, 255, 0.15)'
            }
          }
        }}
      />

      <Textarea
        label="角色秘密 (secret)"
        description="玩家需要挖掘的关键信息"
        value={editedCharacter.secret}
        onChange={(e) => updateField('secret', e.currentTarget.value)}
        minRows={2}
        styles={{
          label: { 
            color: '#FFFFFF', 
            fontWeight: 'bold',
            fontSize: '16px',
            textShadow: '1px 1px 3px rgba(0, 0, 0, 0.8)'
          },
          description: { 
            color: '#E0E0E0',
            fontSize: '14px',
            textShadow: '1px 1px 2px rgba(0, 0, 0, 0.6)'
          },
          input: { 
            backgroundColor: 'rgba(255, 255, 255, 0.1)', 
            borderColor: '#555',
            color: '#FFFFFF',
            '&:focus': {
              borderColor: '#E63946',
              backgroundColor: 'rgba(255, 255, 255, 0.15)'
            }
          }
        }}
      />

      <Textarea
        label="行为禁令 (violation)"
        description="AI的绝对行为底线"
        value={editedCharacter.violation}
        onChange={(e) => updateField('violation', e.currentTarget.value)}
        minRows={2}
        styles={{
          label: { 
            color: '#FFFFFF', 
            fontWeight: 'bold',
            fontSize: '16px',
            textShadow: '1px 1px 3px rgba(0, 0, 0, 0.8)'
          },
          description: { 
            color: '#E0E0E0',
            fontSize: '14px',
            textShadow: '1px 1px 2px rgba(0, 0, 0, 0.6)'
          },
          input: { 
            backgroundColor: 'rgba(255, 255, 255, 0.1)', 
            borderColor: '#555',
            color: '#FFFFFF',
            '&:focus': {
              borderColor: '#FFB74D',
              backgroundColor: 'rgba(255, 255, 255, 0.15)'
            }
          }
        }}
      />

      <Group justify="flex-end">
        <Button variant="outline" onClick={onCancel}>
          取消
        </Button>
        <Button onClick={() => onSave(editedCharacter)} style={{ background: '#00C2FF' }}>
          保存
        </Button>
      </Group>
    </Stack>
  );
};

export default ScriptEditor;
