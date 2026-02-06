import React, { useState, useEffect } from 'react';
import { 
  Stack, 
  Title, 
  Text, 
  Button, 
  Group, 
  Card,
  Badge,
  ActionIcon,
  Modal,
  FileButton,
  Alert,
  TextInput,
  Menu
} from '@mantine/core';
import { IconEdit, IconTrash, IconDownload, IconUpload, IconEye, IconSearch, IconPlus, IconRobot, IconTrashX } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { Script } from '../../types/script';
import { clearAIGeneratedScripts } from '../../utils/storageManager';

interface ScriptLibraryProps {
  onEditScript: (script: Script) => void;
}

const ScriptLibrary: React.FC<ScriptLibraryProps> = ({ onEditScript }) => {
  const [scripts, setScripts] = useState<Script[]>([]);
  const [previewScript, setPreviewScript] = useState<Script | null>(null);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [error, setError] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const navigate = useNavigate();

  // 从localStorage加载剧本
  useEffect(() => {
    const savedScripts = localStorage.getItem('ai_generated_scripts');
    if (savedScripts) {
      try {
        setScripts(JSON.parse(savedScripts));
      } catch (error) {
        console.error('加载剧本失败:', error);
      }
    }
  }, []);

  // 保存剧本到localStorage（带配额检查）
  const saveScript = async (script: Script) => {
    const existingIndex = scripts.findIndex(s => s.id === script.id);
    let newScripts;
    
    if (existingIndex >= 0) {
      newScripts = [...scripts];
      newScripts[existingIndex] = { ...script, updatedAt: new Date().toISOString() };
    } else {
      newScripts = [...scripts, { ...script, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }];
    }
    
    try {
      const { optimizeScriptStorage } = await import('../../utils/storageManager');
      const optimizedScripts = optimizeScriptStorage(newScripts);
      setScripts(newScripts);
      localStorage.setItem('ai_generated_scripts', JSON.stringify(optimizedScripts));
    } catch (quotaError) {
      if (quotaError instanceof DOMException && quotaError.name === 'QuotaExceededError') {
        console.warn('⚠️ localStorage配额超出，开始清理旧数据...');
        
        // 只保留最近的20个剧本
        const recentScripts = newScripts
          .sort((a, b) => new Date(b.updatedAt || b.createdAt || 0).getTime() - new Date(a.updatedAt || a.createdAt || 0).getTime())
          .slice(0, 20);
        
        const { optimizeScriptStorage } = await import('../../utils/storageManager');
        const optimizedRecentScripts = optimizeScriptStorage(recentScripts);
        setScripts(recentScripts);
        localStorage.setItem('ai_generated_scripts', JSON.stringify(optimizedRecentScripts));
        
        console.log(`✅ 清理完成，保留了 ${recentScripts.length} 个最近的剧本`);
        alert('存储空间不足，已自动清理旧的剧本数据，保留最近20个剧本。');
      } else {
        console.error('❌ 保存剧本失败:', quotaError);
        alert('保存剧本失败，请清理浏览器存储空间后重试。');
      }
    }
  };

  // 删除剧本
  const deleteScript = async (scriptId: string) => {
    const newScripts = scripts.filter(s => s.id !== scriptId);
    try {
      const { optimizeScriptStorage } = await import('../../utils/storageManager');
      const optimizedScripts = optimizeScriptStorage(newScripts);
      setScripts(newScripts);
      localStorage.setItem('ai_generated_scripts', JSON.stringify(optimizedScripts));
    } catch (error) {
      console.error('❌ 删除剧本时保存失败:', error);
      setScripts(newScripts); // 至少更新UI状态
    }
  };

  // 导出剧本
  const exportScript = (script: Script) => {
    const dataStr = JSON.stringify(script, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${script.id}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // 导入剧本
  const importScript = (file: File | null) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const script = JSON.parse(e.target?.result as string);
        
        // 验证剧本格式
        if (!script.title || !script.characters || !script.settings) {
          throw new Error('无效的剧本格式');
        }
        
        saveScript(script);
        setError('');
      } catch (error) {
        setError('导入失败：文件格式不正确');
      }
    };
    reader.readAsText(file);
  };

  // 预览剧本
  const previewScriptContent = (script: Script) => {
    setPreviewScript(script);
    setPreviewModalOpen(true);
  };

  // 搜索过滤剧本
  const filteredScripts = scripts.filter(script => 
    script.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    script.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    script.settings.theme.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // 清理存储空间
  const handleClearStorage = () => {
    if (window.confirm('⚠️ 确定要清理所有AI生成的剧本数据吗？此操作不可撤销！')) {
      if (clearAIGeneratedScripts()) {
        setScripts([]);
        setError('');
        alert('✅ 存储空间已清理');
      } else {
        setError('清理存储空间失败');
      }
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'green';
      case 'medium': return 'yellow';
      case 'hard': return 'red';
      default: return 'gray';
    }
  };

  const getThemeLabel = (theme: string) => {
    switch (theme) {
      case 'dark': return '🌑 黑暗悬疑';
      case 'modern': return '🏙️ 现代都市';
      case 'historical': return '🏛️ 历史古装';
      case 'fantasy': return '🧙 奇幻架空';
      case 'cyberpunk': return '🤖 赛博朋克';
      case 'steampunk': return '⚙️ 蒸汽朋克';
      case 'detective': return '🔍 经典侦探';
      case 'horror': return '👻 恐怖惊悚';
      case 'mystery': return '🕵️ 悬疑推理';
      case 'noir': return '🎬 黑色电影';
      case 'gothic': return '🦇 哥特风格';
      case 'victorian': return '🎩 维多利亚';
      case 'futuristic': return '🚀 未来科幻';
      case 'medieval': return '⚔️ 中世纪';
      default: return theme;
    }
  };

  return (
    <Stack gap="lg">
      <Title order={2} style={{ color: '#00C2FF' }}>
        我的剧本库 ({scripts.length})
      </Title>

      {/* 搜索框和操作按钮区域 */}
      <Card style={{ 
        background: 'rgba(0, 194, 255, 0.05)', 
        border: '1px solid rgba(0, 194, 255, 0.3)',
        borderRadius: '12px'
      }}>
        <Stack gap="md">
          {/* 搜索框 */}
          <TextInput
            placeholder="搜索剧本标题、描述或主题..."
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.currentTarget.value)}
            leftSection={<IconSearch size={16} />}
            styles={{
              input: {
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                borderColor: '#555',
                color: '#FFFFFF',
                fontSize: '14px',
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

          {/* 操作按钮组 */}
          <Group justify="space-between">
            <Group gap="md">
              <FileButton onChange={importScript} accept=".json">
                {(props) => (
                  <Button 
                    {...props}
                    leftSection={<IconUpload size={16} />}
                    variant="outline"
                    styles={{
                      root: {
                        borderColor: '#4ECCA3',
                        color: '#4ECCA3',
                        '&:hover': {
                          backgroundColor: 'rgba(78, 204, 163, 0.1)'
                        }
                      }
                    }}
                  >
                    导入剧本
                  </Button>
                )}
              </FileButton>

              <Menu shadow="md" width={200}>
                <Menu.Target>
                  <Button
                    leftSection={<IconPlus size={16} />}
                    styles={{
                      root: {
                        background: 'linear-gradient(135deg, #00C2FF 0%, #0099CC 100%)',
                        border: '2px solid #00C2FF',
                        color: '#FFFFFF',
                        fontWeight: 'bold',
                        '&:hover': {
                          background: 'linear-gradient(135deg, #0099CC 0%, #0077AA 100%)'
                        }
                      }
                    }}
                  >
                    创建新剧本
                  </Button>
                </Menu.Target>

                <Menu.Dropdown style={{ backgroundColor: '#1A1A2E', border: '1px solid #00C2FF' }}>
                  <Menu.Item
                    leftSection={<IconEdit size={16} />}
                    onClick={() => navigate('/editor')}
                    style={{ color: '#FFFFFF' }}
                  >
                    ✏️ 手动创建剧本
                  </Menu.Item>
                  <Menu.Item
                    leftSection={<IconRobot size={16} />}
                    onClick={() => navigate('/ai-generator')}
                    style={{ color: '#FFFFFF' }}
                  >
                    🤖 AI生成剧本
                  </Menu.Item>
                </Menu.Dropdown>
              </Menu>
            </Group>

            <Group gap="md">
              <Text size="sm" style={{ color: '#B8B8B8' }}>
                {searchQuery ? `找到 ${filteredScripts.length} 个匹配的剧本` : `共 ${scripts.length} 个剧本`}
              </Text>
              
              {scripts.length > 0 && (
                <Button
                  size="xs"
                  variant="outline"
                  color="red"
                  leftSection={<IconTrashX size={14} />}
                  onClick={handleClearStorage}
                  styles={{
                    root: {
                      borderColor: '#E63946',
                      color: '#E63946',
                      fontSize: '12px',
                      '&:hover': {
                        backgroundColor: 'rgba(230, 57, 70, 0.1)'
                      }
                    }
                  }}
                >
                  清理存储
                </Button>
              )}
            </Group>
          </Group>
        </Stack>
      </Card>

      {error && (
        <Alert color="red" onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {filteredScripts.length === 0 ? (
        searchQuery ? (
          <Card style={{ 
            background: 'rgba(255, 255, 255, 0.05)', 
            border: '1px dashed #333',
            textAlign: 'center',
            padding: '40px'
          }}>
            <Text style={{ color: '#B8B8B8', fontSize: '18px', marginBottom: '16px' }}>
              🔍 未找到匹配的剧本
            </Text>
            <Text style={{ color: '#888' }}>
              尝试使用不同的关键词搜索，或者创建一个新的剧本
            </Text>
          </Card>
        ) : scripts.length === 0 ? (
        <Card style={{ 
          background: 'rgba(255, 255, 255, 0.05)', 
          border: '1px dashed #333',
          textAlign: 'center',
          padding: '40px'
        }}>
          <Text style={{ color: '#B8B8B8', fontSize: '18px', marginBottom: '16px' }}>
            🎭 还没有创作任何剧本
          </Text>
          <Text style={{ color: '#888' }}>
            使用AI生成向导创作您的第一个剧本，或导入现有剧本文件
          </Text>
        </Card>
        ) : null
      ) : (
        <Stack gap="md">
          {filteredScripts.map((script) => (
            <Card 
              key={script.id}
              style={{ 
                background: 'rgba(255, 255, 255, 0.05)', 
                border: '1px solid #333',
                transition: 'all 0.3s ease',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 4px 20px rgba(0, 194, 255, 0.2)';
                e.currentTarget.style.borderColor = '#00C2FF';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.borderColor = '#333';
              }}
            >
              <Group justify="space-between" align="flex-start">
                <Stack gap="xs" style={{ flex: 1 }}>
                  <Group>
                    <Title order={4} style={{ color: '#E0E0E0' }}>
                      {script.title}
                    </Title>
                    <Badge color={getDifficultyColor(script.settings.difficulty)}>
                      {script.settings.difficulty}
                    </Badge>
                    <Badge variant="outline" color="blue">
                      {getThemeLabel(script.settings.theme)}
                    </Badge>
                    <Badge variant="outline" color="gray">
                      {script.characters.length}人
                    </Badge>
                  </Group>
                  
                  <Text size="sm" style={{ color: '#B8B8B8' }}>
                    {script.description}
                  </Text>
                  
                  <Group gap="lg">
                    <Text size="xs" style={{ color: '#888' }}>
                      玩家: {script.settings.playerName}
                    </Text>
                    <Text size="xs" style={{ color: '#888' }}>
                      搭档: {script.settings.partnerRole}
                    </Text>
                    <Text size="xs" style={{ color: '#888' }}>
                      凶手: {script.settings.hiddenKiller}
                    </Text>
                  </Group>
                  
                  {script.updatedAt && (
                    <Text size="xs" style={{ color: '#666' }}>
                      更新时间: {new Date(script.updatedAt).toLocaleString()}
                    </Text>
                  )}
                </Stack>

                <Group gap="xs">
                  <ActionIcon 
                    variant="outline" 
                    onClick={() => previewScriptContent(script)}
                    title="预览"
                  >
                    <IconEye size={16} />
                  </ActionIcon>
                  <ActionIcon 
                    variant="outline" 
                    onClick={() => onEditScript(script)}
                    title="编辑"
                  >
                    <IconEdit size={16} />
                  </ActionIcon>
                  <ActionIcon 
                    variant="outline" 
                    onClick={() => exportScript(script)}
                    title="导出"
                  >
                    <IconDownload size={16} />
                  </ActionIcon>
                  <ActionIcon 
                    variant="outline" 
                    color="red"
                    onClick={() => deleteScript(script.id)}
                    title="删除"
                  >
                    <IconTrash size={16} />
                  </ActionIcon>
                </Group>
              </Group>
            </Card>
          ))}
        </Stack>
      )}

      {/* 预览模态框 */}
      <Modal
        opened={previewModalOpen}
        onClose={() => setPreviewModalOpen(false)}
        title="剧本预览"
        size="xl"
        styles={{
          content: { backgroundColor: '#1A1A2E' },
          header: { backgroundColor: '#1A1A2E', borderBottom: '1px solid #333' },
          title: { color: '#00C2FF', fontWeight: 'bold' }
        }}
      >
        {previewScript && (
          <Stack gap="md">
            <Group>
              <Title order={3} style={{ color: '#E0E0E0' }}>
                {previewScript.title}
              </Title>
              <Badge color={getDifficultyColor(previewScript.settings.difficulty)}>
                {previewScript.settings.difficulty}
              </Badge>
              <Badge variant="outline" color="blue">
                {getThemeLabel(previewScript.settings.theme)}
              </Badge>
            </Group>

            <Text style={{ color: '#B8B8B8' }}>
              {previewScript.description}
            </Text>

            <Card style={{ background: 'rgba(0, 194, 255, 0.1)', border: '1px solid #00C2FF' }}>
              <Title order={5} style={{ color: '#00C2FF', marginBottom: '10px' }}>
                故事背景
              </Title>
              <Text size="sm" style={{ color: '#E0E0E0', lineHeight: '1.6' }}>
                {previewScript.globalStory}
              </Text>
            </Card>

            <Card style={{ background: 'rgba(255, 183, 77, 0.1)', border: '1px solid #FFB74D' }}>
              <Title order={5} style={{ color: '#FFB74D', marginBottom: '10px' }}>
                角色列表 ({previewScript.characters.length}人)
              </Title>
              <Stack gap="xs">
                {previewScript.characters.map((character, index) => (
                  <Group key={index} justify="space-between">
                    <Group>
                      <Text style={{ color: '#E0E0E0', fontWeight: 'bold' }}>
                        {character.name}
                      </Text>
                      <Badge 
                        size="sm"
                        color={character.isKiller ? 'red' : character.isPlayer ? 'blue' : character.isAssistant ? 'green' : 'gray'}
                      >
                        {character.roleType}
                      </Badge>
                    </Group>
                    <Text size="sm" style={{ color: '#B8B8B8', flex: 1, textAlign: 'right' }}>
                      {character.bio.substring(0, 50)}...
                    </Text>
                  </Group>
                ))}
              </Stack>
            </Card>

            <Group justify="flex-end">
              <Button 
                onClick={() => {
                  onEditScript(previewScript);
                  setPreviewModalOpen(false);
                }}
                style={{ background: '#00C2FF' }}
              >
                编辑剧本
              </Button>
            </Group>
          </Stack>
        )}
      </Modal>

{/* 悬停效果通过inline styles实现 */}
    </Stack>
  );
};

export default ScriptLibrary;
