import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Paper,
  Title,
  Button,
  Group,
  Text,
  Stack,
  TextInput,
  Textarea,
  Grid,
  Card,
  ActionIcon,
  Modal,
  Avatar,
  FileInput,
  Alert,
  Badge,
  SimpleGrid,
  ScrollArea,
  Tooltip
} from '@mantine/core';
// 使用 emoji 图标
import { Character, createCharacterTemplate } from '../../types/script';
import { getAvatarChineseName, getAllAvatarNames, resolveAvatarSrc } from '../../utils/avatarUtils';
import { generateCharacterAvatar } from '../../api/avatarGenerator';
import { generateBackgroundFromActor } from '../../api/backgroundGenerator';
import { getAllBackgroundOptions, getBackgroundsByCategory, getBackgroundCategories, loadDynamicBackgrounds } from '../../utils/backgroundNames';
import PolishButton from '../PolishButton';

interface CharacterEditorProps {
  characters: Character[];
  onUpdate: (characters: Character[]) => void;
  onOpenPolish?: (fieldPath: string) => void;
}

const CharacterEditor: React.FC<CharacterEditorProps> = ({ characters, onUpdate, onOpenPolish }) => {
  const [editingCharacter, setEditingCharacter] = useState<Character | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [modalOpened, setModalOpened] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>('');
  const [avatarSelectModalOpened, setAvatarSelectModalOpened] = useState(false);
  const [availableAvatars, setAvailableAvatars] = useState<string[]>([]);
  const [avatarSearchQuery, setAvatarSearchQuery] = useState('');
  const [validationModalOpened, setValidationModalOpened] = useState(false);
  const [isGeneratingAvatar, setIsGeneratingAvatar] = useState(false);
  const [isGeneratingBackground, setIsGeneratingBackground] = useState(false);
  const [backgroundPreview, setBackgroundPreview] = useState<string>('');
  const [backgroundSelectModalOpened, setBackgroundSelectModalOpened] = useState(false);
  const [backgroundFile, setBackgroundFile] = useState<File | null>(null);

  // 可用的头像选项（从映射表获取）
  const defaultAvatarOptions = getAllAvatarNames();

  // 当characters prop更新时，同步更新editingCharacter状态
  useEffect(() => {
    // 使用函数式更新来避免依赖editingCharacter
    setEditingCharacter(prevEditingCharacter => {
      if (prevEditingCharacter && editingIndex !== null && characters[editingIndex]) {
        const updatedCharacter = characters[editingIndex];
        console.log(`🔄 [DEBUG] CharacterEditor同步检查: 当前编辑=${prevEditingCharacter.name}, 数组中=${updatedCharacter.name}`);
        
        // 检查是否需要更新：比较关键字段是否发生变化
        const needsUpdate = (
          updatedCharacter.bio !== prevEditingCharacter.bio ||
          updatedCharacter.personality !== prevEditingCharacter.personality ||
          updatedCharacter.context !== prevEditingCharacter.context ||
          updatedCharacter.secret !== prevEditingCharacter.secret ||
          updatedCharacter.violation !== prevEditingCharacter.violation
        );
        
        if (needsUpdate && updatedCharacter.name === prevEditingCharacter.name) {
          console.log(`🔄 [DEBUG] CharacterEditor检测到字段变化，同步更新editingCharacter`);
          return { ...updatedCharacter };
        }
      }
      return prevEditingCharacter; // 不需要更新时返回原值
    });
  }, [characters, editingIndex]); // 只依赖characters和editingIndex

  // 获取可用的头像和背景图列表
  useEffect(() => {
    const fetchAssets = async () => {
      try {
        // 并行加载头像和背景图
        const [avatarsResponse] = await Promise.allSettled([
          fetch('http://localhost:10000/character-avatars'),
          loadDynamicBackgrounds()
        ]);

        // 处理头像加载结果
        if (avatarsResponse.status === 'fulfilled' && avatarsResponse.value.ok) {
          const data = await avatarsResponse.value.json();
          setAvailableAvatars(data.avatars || []);
        } else {
          // 如果API不可用，使用默认头像列表
          setAvailableAvatars(defaultAvatarOptions.map(opt => opt.value));
        }

        // 背景图加载结果已在 loadDynamicBackgrounds 中处理
        // console.log('🎨 角色编辑器 - 资源加载完成');
      } catch (error) {
        console.error('❌ 角色编辑器 - 资源加载失败:', error);
        setAvailableAvatars(defaultAvatarOptions.map(opt => opt.value));
      }
    };

    fetchAssets();
  }, []); // 只在组件挂载时加载一次

  // 添加新角色
  const handleAddCharacter = () => {
    const newCharacter = createCharacterTemplate();
    setEditingCharacter(newCharacter);
    setEditingIndex(characters.length);
    setAvatarFile(null);
    setAvatarPreview('');
    setModalOpened(true);
  };

  // 编辑角色
  const handleEditCharacter = (character: Character) => {
    setEditingCharacter({ ...character });
    const idx = characters.findIndex(c => c === character || c.name === character.name);
    setEditingIndex(idx >= 0 ? idx : null);
    // 如果角色有自定义头像，设置预览
    if (character.image && character.image.startsWith('data:image/')) {
      setAvatarPreview(character.image);
    } else {
      setAvatarPreview('');
    }
    setAvatarFile(null);
    setModalOpened(true);
  };

  // 删除角色
  const handleDeleteCharacter = (index: number) => {
    const newCharacters = characters.filter((_, i) => i !== index);
    onUpdate(newCharacters);
  };

  // 保存角色
  const handleSaveCharacter = async () => {
    if (!editingCharacter) return;

    // 验证必填字段
    const requiredFields = [
      { field: 'name', label: '角色姓名' },
      { field: 'bio', label: '角色背景' },
      { field: 'context', label: '上下文信息' }
    ];

    const missingFields = requiredFields.filter(({ field }) => {
      const value = editingCharacter[field as keyof Character];
      return !value || (typeof value === 'string' && value.trim() === '');
    });

    if (missingFields.length > 0) {
      alert(`请填写以下必填字段：\n${missingFields.map(f => f.label).join('\n')}`);
      return;
    }

    // 处理头像数据 - 保持现有头像不变
    let finalImage = editingCharacter.image || 'officer.png';
    
    console.log(`🖼️ [DEBUG] 保存头像处理 - avatarPreview: ${avatarPreview ? avatarPreview.substring(0, 50) + '...' : 'null'}`);
    console.log(`🖼️ [DEBUG] 保存头像处理 - editingCharacter.image: ${editingCharacter.image ? editingCharacter.image.substring(0, 50) + '...' : 'null'}`);
    
    // 只有在用户上传了新头像时才处理IndexedDB保存
    if (avatarPreview && avatarPreview.startsWith('data:image/')) {
      // 用户上传了新头像，直接使用base64数据，不使用IndexedDB缓存
      // 避免缓存引用导致显示问题
      finalImage = avatarPreview;
      console.log(`🖼️ [DEBUG] 使用新上传头像: ${finalImage.substring(0, 50)}...`);
    } else {
      // 没有新头像上传，保持现有头像不变
      console.log(`🖼️ [DEBUG] 保持现有头像: ${finalImage ? finalImage.substring(0, 50) + '...' : 'null'}`);
    }

    // 处理背景图片保存
    let finalBackgroundImage = editingCharacter.backgroundImage;
    if (backgroundPreview && backgroundFile) {
      // 如果有上传的背景文件，使用base64数据
      finalBackgroundImage = backgroundPreview;
    }

    const characterToSave = {
      ...editingCharacter,
      image: finalImage,
      backgroundImage: finalBackgroundImage
    };


    // 使用 editingIndex 来确定是更新还是新增
    if (editingIndex !== null && editingIndex >= 0 && editingIndex < characters.length) {
      // 更新现有角色
      const newCharacters = [...characters];
      newCharacters[editingIndex] = characterToSave;
      onUpdate(newCharacters);
      
      // 验证保存结果
      setTimeout(() => {
        // const savedScripts = JSON.parse(localStorage.getItem('murder_mystery_scripts') || '[]');
      }, 100);
    } else {
      // 添加新角色
      onUpdate([...characters, characterToSave]);
      
      // 验证保存结果
      setTimeout(() => {
        // const savedScripts = JSON.parse(localStorage.getItem('murder_mystery_scripts') || '[]');
      }, 100);
    }

    setModalOpened(false);
    setEditingCharacter(null);
    setAvatarFile(null);
    setAvatarPreview('');
    setBackgroundFile(null);
    setBackgroundPreview('');
  };

  // 处理头像文件上传
  const handleAvatarUpload = (file: File | null) => {
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setAvatarPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
      setAvatarFile(file);
    }
  };

  // 选择预设头像
  // const handleAvatarSelect = (value: string) => {
  //   setAvatarPreview('');
  //   setAvatarFile(null);
  //   if (editingCharacter) {
  //     setEditingCharacter({ ...editingCharacter, image: value });
  //   }
  // };

  // 打开头像选择弹窗
  const handleOpenAvatarSelect = () => {
    setAvatarSearchQuery(''); // 重置搜索查询
    setAvatarSelectModalOpened(true);
  };

  // AI生成头像
  const handleGenerateAvatar = async () => {
    if (!editingCharacter) return;
    
    if (!editingCharacter.name.trim()) {
      alert('请先输入角色名称');
      return;
    }
    
    if (!editingCharacter.bio.trim()) {
      alert('请先输入角色背景信息，AI需要这些信息来生成合适的头像');
      return;
    }

    setIsGeneratingAvatar(true);
    
    try {
      // 生成唯一的角色标识符，避免重名冲突
      const timestamp = Date.now();
      const randomSuffix = Math.random().toString(36).substring(2, 8);
      const uniqueCharacterName = `${editingCharacter.name}_${timestamp}_${randomSuffix}`;
      
      
      // 只使用名称和背景生成头像，不使用性格（性格描述会降低图像质量）
      const result = await generateCharacterAvatar(
        uniqueCharacterName,
        editingCharacter.bio
      );

      if (result.success && result.base64_image) {
        // 设置预览图片
        const dataUrl = `data:image/png;base64,${result.base64_image}`;
        setAvatarPreview(dataUrl);
        
        // 更新角色的image字段为data URL
        setEditingCharacter({ ...editingCharacter, image: dataUrl });
        
      } else {
        alert(`AI头像生成失败: ${result.message}`);
      }
    } catch (error) {
      console.error('❌ AI头像生成异常:', error);
      alert('AI头像生成失败，请重试');
    } finally {
      setIsGeneratingAvatar(false);
    }
  };

  // 从弹窗中选择头像
  const handleSelectAvatarFromModal = (avatarName: string) => {
    setAvatarPreview('');
    setAvatarFile(null);
    if (editingCharacter) {
      const updatedCharacter = { ...editingCharacter, image: avatarName };
      setEditingCharacter(updatedCharacter);
    }
    setAvatarSelectModalOpened(false);
  };

  // 处理背景文件上传
  const handleBackgroundUpload = (file: File | null) => {
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setBackgroundPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
      setBackgroundFile(file);
    }
  };

  // 选择预设背景
  // const handleBackgroundSelect = (value: string) => {
  //   setBackgroundPreview('');
  //   setBackgroundFile(null);
  //   if (editingCharacter) {
  //     setEditingCharacter({ ...editingCharacter, backgroundImage: value });
  //   }
  // };

  // 打开背景选择弹窗
  const handleOpenBackgroundSelect = () => {
    setBackgroundSelectModalOpened(true);
  };

  // 从弹窗中选择背景
  const handleSelectBackgroundFromModal = (backgroundName: string) => {
    // 清空预览和文件状态，因为选择了预设背景
    setBackgroundPreview('');
    setBackgroundFile(null);
    if (editingCharacter) {
      const updatedCharacter = { ...editingCharacter, backgroundImage: backgroundName };
      setEditingCharacter(updatedCharacter);
    }
    setBackgroundSelectModalOpened(false);
  };

  // AI生成背景
  const handleGenerateBackground = async () => {
    if (!editingCharacter) return;
    
    if (!editingCharacter.name.trim()) {
      alert('请先输入角色名称');
      return;
    }
    
    if (!editingCharacter.bio.trim()) {
      alert('请先输入角色背景信息，AI需要这些信息来生成合适的聊天背景');
      return;
    }

    setIsGeneratingBackground(true);
    
    try {
      
      const result = await generateBackgroundFromActor({
        name: editingCharacter.name,
        bio: editingCharacter.bio,
        personality: editingCharacter.personality || '',
        context: editingCharacter.context || ''
      });

      if (result.success && result.base64_image) {
        // 设置预览图片
        const dataUrl = `data:image/png;base64,${result.base64_image}`;
        setBackgroundPreview(dataUrl);
        
        // 可以选择将背景路径保存到角色数据中
        if (result.background_path) {
          setEditingCharacter({ 
            ...editingCharacter, 
            backgroundImage: result.background_path 
          });
        }
        
      } else {
        alert(`AI背景生成失败: ${result.message}`);
      }
    } catch (error) {
      console.error('❌ AI背景生成异常:', error);
      alert('AI背景生成失败，请重试');
    } finally {
      setIsGeneratingBackground(false);
    }
  };

  // 获取头像显示名称
  const getAvatarDisplayName = (avatarName: string) => {
    return getAvatarChineseName(avatarName);
  };

  // 过滤头像列表（根据搜索关键词）
  const filteredAvatars = useMemo(() => {
    if (!avatarSearchQuery.trim()) {
      return availableAvatars;
    }
    
    const query = avatarSearchQuery.toLowerCase().trim();
    return availableAvatars.filter(avatarName => {
      // 搜索文件名（移除.png后缀）
      const fileName = avatarName.toLowerCase().replace('.png', '');
      // 搜索显示名称
      const displayName = getAvatarDisplayName(avatarName).toLowerCase();
      
      // 支持多种搜索模式
      return fileName.includes(query) || 
             displayName.includes(query) ||
             // 支持搜索关键词（如搜索"公主"可以找到所有公主）
             (query.length >= 2 && (fileName.includes(query) || displayName.includes(query)));
    });
  }, [availableAvatars, avatarSearchQuery]);

  // 验证角色配置
  const validateCharacters = useCallback(() => {
    const hasPlayer = characters.some(char => char.isPlayer);
    const hasPartner = characters.some(char => char.isPartner);
    const hasKiller = characters.some(char => char.isKiller);
    
    if (!hasPlayer || !hasPartner || !hasKiller) {
      setValidationModalOpened(true);
      return false;
    }
    return true;
  }, [characters]);

  // 检查角色配置并显示提示（延迟执行，避免编辑过程中频繁弹出）
  useEffect(() => {
    if (characters.length > 0) {
      const timer = setTimeout(() => {
        validateCharacters();
      }, 1000); // 延迟1秒执行，避免编辑过程中频繁弹出
      
      return () => clearTimeout(timer);
    }
  }, [characters, validateCharacters]);

  return (
    <Paper p="md" style={{ background: 'rgba(255, 255, 255, 0.05)' }}>
      <Group justify="space-between" mb="md">
        <Title order={3} c="#87CEEB">
          角色管理 ({characters.length} 个角色)
        </Title>
        <Button
          onClick={handleAddCharacter}
          styles={{
            root: { 
              background: 'linear-gradient(135deg, #00C2FF, #87CEEB)',
              color: '#000',
              fontWeight: '700',
              border: '1px solid #00C2FF',
              boxShadow: '0 0 15px rgba(0, 194, 255, 0.4)',
              '&:hover': {
                background: 'linear-gradient(135deg, #00A8CC, #6BB6FF)',
                boxShadow: '0 0 20px rgba(0, 194, 255, 0.6)',
                transform: 'translateY(-1px)'
              }
            }
          }}
        >
          ➕ 添加角色
        </Button>
      </Group>

      {characters.length === 0 ? (
        <Alert
          title="还没有角色"
          color="cyan"
          styles={{
            title: { color: '#87CEEB' }
          }}
        >
          <Text c="#90EE90">⚠️ 点击"添加角色"按钮开始创建第一个角色</Text>
        </Alert>
      ) : (
        <Grid>
          {characters.map((character, index) => (
            <Grid.Col key={index} span={{ base: 12, sm: 6, md: 4 }}>
              <Card
                shadow="sm"
                padding="md"
                radius="md"
                withBorder
                style={{ 
                  background: 'linear-gradient(135deg, #1A1A2E 0%, #1E1E1E 100%)',
                  borderColor: '#00C2FF'
                }}
              >
                <Group mb="sm">
                  <Avatar
                    src={character.image && character.image.startsWith('data:image/') 
                      ? character.image 
                      : resolveAvatarSrc(character.image)}
                    size="lg"
                    radius="md"
                    style={{
                      objectFit: 'cover'
                    } as React.CSSProperties}
                  />
                  <div style={{ flex: 1 }}>
                    <Text fw={500} c="white" size="lg">
                      {character.name}
                    </Text>
                    <Tooltip
                      label={character.bio}
                      multiline
                      w={300}
                      position="top"
                      withArrow
                      styles={{
                        tooltip: {
                          backgroundColor: 'rgba(0, 0, 0, 0.9)',
                          color: '#FFFFFF',
                          border: '1px solid #00C2FF',
                          borderRadius: '8px',
                          fontSize: '12px',
                          lineHeight: '1.4',
                          maxWidth: '300px',
                          whiteSpace: 'pre-wrap',
                          wordBreak: 'break-word'
                        },
                        arrow: {
                          borderColor: '#00C2FF'
                        }
                      }}
                    >
                      <Text 
                        size="sm" 
                        c="dimmed" 
                        lineClamp={2}
                        style={{ 
                          cursor: 'help',
                          lineHeight: '1.4'
                        }}
                      >
                        {character.bio}
                      </Text>
                    </Tooltip>
                  </div>
                </Group>

                <Group justify="space-between">
                  <Group gap="xs">
                    {character.isPlayer && (
                      <Badge size="xs" color="blue">🕵️ 玩家</Badge>
                    )}
                    {character.isPartner && (
                      <Badge size="xs" color="green">👮 搭档</Badge>
                    )}
                    {character.isKiller && (
                      <Badge size="xs" color="red">🔪 凶手</Badge>
                    )}
                    {character.roleType === '嫌疑人' && (
                      <Badge size="xs" color="orange">👤 嫌疑人</Badge>
                    )}
                          {/* 侦探徽标已移除，统一用“玩家/搭档/凶手/嫌疑人” */}
                    {character.isVictim && (
                      <Badge size="xs" color="gray">💀 受害者</Badge>
                    )}
                  </Group>
                  <Group gap="xs">
                    <ActionIcon
                      variant="subtle"
                      color="blue"
                      onClick={() => handleEditCharacter(character)}
                    >
                      ✏️
                    </ActionIcon>
                    <ActionIcon
                      variant="subtle"
                      color="red"
                      onClick={() => handleDeleteCharacter(index)}
                    >
                      🗑️
                    </ActionIcon>
                  </Group>
                </Group>
              </Card>
            </Grid.Col>
          ))}
        </Grid>
      )}

      {/* 角色编辑模态框 */}
      <Modal
        opened={modalOpened}
        onClose={() => {
          setModalOpened(false);
          setEditingCharacter(null);
          setAvatarFile(null);
          setAvatarPreview('');
        }}
        title={editingCharacter?.name ? `编辑角色: ${editingCharacter.name}` : '添加新角色'}
        size="90%"
        centered
        styles={{
          content: {
            background: 'linear-gradient(135deg, rgba(10, 10, 35, 0.95) 0%, rgba(26, 26, 62, 0.95) 50%, rgba(15, 32, 39, 0.95) 100%)',
            border: '2px solid rgba(0, 194, 255, 0.8)',
            borderRadius: '16px',
            maxWidth: '1200px',
            minHeight: '600px',
            boxShadow: '0 8px 32px rgba(0, 194, 255, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(10px)'
          },
          header: {
            background: 'linear-gradient(135deg, rgba(0, 194, 255, 0.1) 0%, rgba(135, 206, 235, 0.1) 100%)',
            borderBottom: '2px solid rgba(0, 194, 255, 0.8)',
            backdropFilter: 'blur(10px)'
          },
          title: {
            color: '#87CEEB',
            fontWeight: '700',
            textShadow: '0 0 20px rgba(0, 194, 255, 0.8), 0 0 40px rgba(0, 194, 255, 0.4)',
            fontSize: '18px'
          },
          close: {
            color: '#FFFFFF',
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              color: '#00C2FF'
            }
          }
        }}
      >
        {editingCharacter && (
          <div className="aurora-card" style={{ 
            padding: '24px'
          }}>
            <Grid>
              {/* 左侧：头像区域 */}
              <Grid.Col span={3}>
                <Stack gap="lg" align="center">
                  <Text size="lg" fw={600} c="#87CEEB" style={{ 
                    fontFamily: '"PingFang SC", "Microsoft YaHei", sans-serif',
                    letterSpacing: '0.5px'
                  }}>
                    角色头像
                  </Text>
                  
                  {/* 大尺寸头像预览 */}
                  <div style={{ position: 'relative' }}>
                    <Avatar
                      src={resolveAvatarSrc(editingCharacter.image)}
                      size={140}
                      radius="xl"
                      style={{
                        border: '4px solid #00C2FF',
                        boxShadow: '0 0 20px rgba(0, 194, 255, 0.4), inset 0 0 20px rgba(0, 194, 255, 0.1)',
                        objectFit: 'cover',
                        transition: 'all 0.3s ease'
                      } as React.CSSProperties}
                    />
                    {isGeneratingAvatar && (
                      <div style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        background: 'rgba(0, 0, 0, 0.8)',
                        borderRadius: '8px',
                        padding: '8px 12px',
                        border: '1px solid #8B5CF6'
                      }}>
                        <Text size="xs" c="#8B5CF6" style={{ fontStyle: 'italic' }}>
                          🤖 生成中...
                        </Text>
                      </div>
                    )}
                  </div>
                  
                  {/* 头像信息 */}
                  <Stack gap="xs" align="center">
                    <Text size="xs" c="dimmed" style={{ fontSize: '11px', textAlign: 'center' }}>
                      {editingCharacter.image ? getAvatarDisplayName(editingCharacter.image) : '未选择头像'}
                    </Text>
                  </Stack>

                  {/* 更换头像按钮 */}
                  <Button
                    size="sm"
                    variant="light"
                    onClick={handleOpenAvatarSelect}
                    styles={{
                      root: {
                        backgroundColor: 'rgba(0, 194, 255, 0.1)',
                        border: '1px solid #00C2FF',
                        color: '#00C2FF',
                        fontSize: '12px',
                        fontWeight: '500',
                        '&:hover': {
                          backgroundColor: 'rgba(0, 194, 255, 0.2)',
                          borderColor: '#00FFFF',
                          transform: 'translateY(-1px)',
                          boxShadow: '0 4px 12px rgba(0, 194, 255, 0.3)'
                        }
                      }
                    }}
                  >
                    🖼️ 更换头像
                  </Button>

                  {/* 其他头像选项 */}
                  <Stack gap="xs" w="100%">
                    <Button
                      size="xs"
                      variant="outline"
                      onClick={handleGenerateAvatar}
                      loading={isGeneratingAvatar}
                      disabled={isGeneratingAvatar}
                      fullWidth
                      styles={{
                        root: {
                          borderColor: '#8B5CF6',
                          color: '#8B5CF6',
                          fontSize: '11px',
                          '&:hover': {
                            backgroundColor: 'rgba(139, 92, 246, 0.1)',
                            borderColor: '#A78BFA'
                          }
                        }
                      }}
                    >
                      🤖 AI生成
                    </Button>
                    <FileInput
                      placeholder="📁 本地上传"
                      accept="image/*"
                      value={avatarFile}
                      onChange={handleAvatarUpload}
                      size="xs"
                      styles={{
                        input: {
                          backgroundColor: 'rgba(0, 194, 255, 0.1)',
                          border: '1px dashed #00C2FF',
                          color: '#00C2FF',
                          fontSize: '11px',
                          '&:hover': {
                            backgroundColor: 'rgba(0, 194, 255, 0.2)',
                            borderColor: '#87CEEB'
                          }
                        }
                      }}
                    />
                  </Stack>
                  
                  {/* 聊天背景区域 */}
                  <div style={{ marginTop: '20px' }}>
                    <Text size="lg" fw={600} c="#FFB74D" style={{ 
                      fontFamily: '"PingFang SC", "Microsoft YaHei", sans-serif',
                      letterSpacing: '0.5px',
                      textAlign: 'center',
                      marginBottom: '16px'
                    }}>
                      聊天背景
                    </Text>
                    
                    {/* 背景预览 */}
                    <div style={{ 
                      position: 'relative',
                      width: '200px',
                      height: '160px',
                      borderRadius: '12px',
                      overflow: 'hidden',
                      border: '2px solid #FFB74D',
                      background: backgroundPreview 
                        ? `url(${backgroundPreview})` 
                        : editingCharacter.backgroundImage 
                          ? `url(/${editingCharacter.backgroundImage})`
                          : 'linear-gradient(135deg, rgba(255, 183, 77, 0.1) 0%, rgba(255, 183, 77, 0.05) 100%)',
                      backgroundSize: '100% 100%', // 🔧 完全填满容器，显示完整图像
                      backgroundPosition: 'center',
                      boxShadow: '0 4px 12px rgba(255, 183, 77, 0.2)'
                    }}>
                      {!backgroundPreview && !editingCharacter.backgroundImage && (
                        <div style={{
                          position: 'absolute',
                          top: '50%',
                          left: '50%',
                          transform: 'translate(-50%, -50%)',
                          color: '#FFB74D',
                          fontSize: '12px',
                          textAlign: 'center'
                        }}>
                          🏠 暂无背景
                        </div>
                      )}
                      
                      {isGeneratingBackground && (
                        <div style={{
                          position: 'absolute',
                          top: '50%',
                          left: '50%',
                          transform: 'translate(-50%, -50%)',
                          background: 'rgba(0, 0, 0, 0.8)',
                          borderRadius: '8px',
                          padding: '8px 12px',
                          border: '1px solid #FFB74D'
                        }}>
                          <Text size="xs" c="#FFB74D" style={{ fontStyle: 'italic' }}>
                            🎨 生成中...
                          </Text>
                        </div>
                      )}
                    </div>
                    
                    {/* 背景操作按钮组 */}
                    <Stack gap="xs" style={{ marginTop: '12px' }}>
                      <Button
                        size="xs"
                        variant="outline"
                        onClick={handleOpenBackgroundSelect}
                        fullWidth
                        styles={{
                          root: {
                            borderColor: '#FFB74D',
                            color: '#FFB74D',
                            fontSize: '11px',
                            '&:hover': {
                              backgroundColor: 'rgba(255, 183, 77, 0.1)',
                              borderColor: '#FFCC02'
                            }
                          }
                        }}
                      >
                        🖼️ 更换背景
                      </Button>
                      
                      <Button
                        size="xs"
                        variant="outline"
                        onClick={handleGenerateBackground}
                        loading={isGeneratingBackground}
                        disabled={isGeneratingBackground}
                        fullWidth
                        styles={{
                          root: {
                            borderColor: '#8B5CF6',
                            color: '#8B5CF6',
                            fontSize: '11px',
                            '&:hover': {
                              backgroundColor: 'rgba(139, 92, 246, 0.1)',
                              borderColor: '#A78BFA'
                            }
                          }
                        }}
                      >
                        🏠 AI生成
                      </Button>
                      
                      <FileInput
                        placeholder="本地上传"
                        accept="image/*"
                        value={backgroundFile}
                        onChange={handleBackgroundUpload}
                        size="xs"
                        styles={{
                          input: {
                            backgroundColor: 'rgba(0, 194, 255, 0.1)',
                            border: '1px dashed #00C2FF',
                            color: '#00C2FF',
                            fontSize: '11px',
                            textAlign: 'center',
                            '&:hover': {
                              backgroundColor: 'rgba(0, 194, 255, 0.2)',
                              borderColor: '#87CEEB'
                            }
                          }
                        }}
                      />
                    </Stack>
                  </div>
                </Stack>
              </Grid.Col>

              {/* 右侧：信息区域 */}
              <Grid.Col span={9}>
                <Stack gap="lg">
                  {/* 基本信息区域 */}
                  <div className="aurora-card" style={{
                    background: 'linear-gradient(135deg, rgba(10, 10, 35, 0.8) 0%, rgba(26, 26, 62, 0.8) 100%)',
                    borderRadius: '12px',
                    padding: '20px',
                    border: '1px solid rgba(135, 206, 235, 0.3)',
                    backdropFilter: 'blur(5px)'
                  }}>
                    <Text size="lg" fw={600} c="#87CEEB" mb="md" style={{ 
                      fontFamily: '"PingFang SC", "Microsoft YaHei", sans-serif',
                      letterSpacing: '0.5px'
                    }}>
                      📝 基本信息
                    </Text>
                    
                    <Grid>
                      <Grid.Col span={5}>
                <TextInput
                  label="角色姓名"
                          placeholder="输入角色姓名"
                  value={editingCharacter.name}
                  onChange={(e) => setEditingCharacter({ ...editingCharacter, name: e.target.value })}
                  required
                          styles={{
                            label: {
                              color: '#87CEEB',
                              fontWeight: '600',
                              marginBottom: '8px',
                              fontSize: '14px'
                            },
                            input: {
                              backgroundColor: 'rgba(255, 255, 255, 0.1)',
                              border: '2px solid #00C2FF',
                              color: '#FFFFFF',
                              fontSize: '16px',
                              fontWeight: '500',
                              '&::placeholder': {
                                color: '#B8B8B8'
                              },
                              '&:focus': {
                                borderColor: '#FFFF00',
                                boxShadow: '0 0 10px rgba(255, 255, 0, 0.3)'
                              }
                            }
                          }}
                />
              </Grid.Col>
                      <Grid.Col span={7}>
                        <Stack gap="sm">
                          <Text size="sm" fw={600} c="#87CEEB">角色类型</Text>
                          <Group gap="sm" wrap="wrap">
                            {[
                              { key: 'player', label: '🕵️ 玩家', checked: editingCharacter.isPlayer, onChange: (checked: boolean) => setEditingCharacter({ 
                                ...editingCharacter, 
                                isPlayer: checked,
                                isPartner: checked ? false : editingCharacter.isPartner,
                                isKiller: checked ? false : editingCharacter.isKiller,
                                isVictim: checked ? false : editingCharacter.isVictim,
                                roleType: checked ? '玩家' : editingCharacter.roleType
                              })},
                              { key: 'partner', label: '👮 搭档', checked: editingCharacter.isPartner, onChange: (checked: boolean) => setEditingCharacter({ 
                                ...editingCharacter, 
                                isPartner: checked,
                                isPlayer: checked ? false : editingCharacter.isPlayer,
                                isKiller: checked ? false : editingCharacter.isKiller,
                                isVictim: checked ? false : editingCharacter.isVictim,
                                isAssistant: checked,
                                roleType: checked ? '搭档' : editingCharacter.roleType
                              })},
                              { key: 'killer', label: '🔪 凶手', checked: editingCharacter.isKiller, onChange: (checked: boolean) => setEditingCharacter({ 
                                ...editingCharacter, 
                                isKiller: checked,
                                isPlayer: checked ? false : editingCharacter.isPlayer,
                                isPartner: checked ? false : editingCharacter.isPartner,
                                isVictim: checked ? false : editingCharacter.isVictim,
                                roleType: checked ? '凶手' : editingCharacter.roleType
                              })},
                              { key: 'suspect', label: '👤 嫌疑人', checked: editingCharacter.roleType === '嫌疑人', onChange: (checked: boolean) => setEditingCharacter({ 
                                ...editingCharacter, 
                                roleType: checked ? '嫌疑人' : undefined,
                                isPlayer: checked ? false : editingCharacter.isPlayer,
                                isPartner: checked ? false : editingCharacter.isPartner,
                                isKiller: checked ? false : editingCharacter.isKiller,
                                isVictim: checked ? false : editingCharacter.isVictim
                              })},
                              { key: 'victim', label: '💀 受害人', checked: editingCharacter.isVictim, onChange: (checked: boolean) => setEditingCharacter({ 
                                ...editingCharacter, 
                                isVictim: checked,
                                roleType: checked ? '受害人' : undefined,
                                isPlayer: checked ? false : editingCharacter.isPlayer,
                                isPartner: checked ? false : editingCharacter.isPartner,
                                isKiller: checked ? false : editingCharacter.isKiller
                              })}
                            ].map(({ key, label, checked, onChange }) => (
                    <Button
                                key={key}
                      size="sm"
                                variant={checked ? "filled" : "outline"}
                                onClick={() => onChange(!checked)}
                      styles={{
                        root: {
                                    backgroundColor: checked ? '#00C2FF' : 'transparent',
                          borderColor: '#00C2FF',
                                    color: checked ? '#000' : '#00C2FF',
                                    fontSize: '12px',
                                    fontWeight: '500',
                                    padding: '8px 12px',
                          '&:hover': {
                                      backgroundColor: checked ? '#00FFFF' : 'rgba(0, 194, 255, 0.1)',
                                      borderColor: '#00FFFF',
                                      transform: 'translateY(-1px)'
                          }
                        }
                      }}
                    >
                                {label}
                    </Button>
                            ))}
                  </Group>
                </Stack>
              </Grid.Col>
            </Grid>
                  </div>

                  {/* 角色描述区域 */}
                  <div className="aurora-card" style={{
                    background: 'linear-gradient(135deg, rgba(10, 10, 35, 0.8) 0%, rgba(26, 26, 62, 0.8) 100%)',
                    borderRadius: '12px',
                    padding: '20px',
                    border: '1px solid rgba(135, 206, 235, 0.3)',
                    backdropFilter: 'blur(5px)'
                  }}>
                    <Group justify="space-between" mb="md">
                      <Text size="lg" fw={600} c="#87CEEB" style={{ 
                      fontFamily: '"PingFang SC", "Microsoft YaHei", sans-serif',
                      letterSpacing: '0.5px'
                    }}>
                        📖 角色描述
                      </Text>
                      {/* 空占位，右上角不放统一按钮 */}
                    </Group>
                    
                    <Grid>
                      <Grid.Col span={6}>
            <Group justify="space-between" align="flex-end" mb="xs">
              <Text size="sm" fw={600} c="#87CEEB">角色背景</Text>
              {onOpenPolish && editingIndex !== null && (
                <PolishButton onClick={() => onOpenPolish(`characters[${editingIndex}].bio`)} />
              )}
            </Group>
            <Textarea
              placeholder="描述角色的背景信息，例如：45岁的退休警察，曾在刑侦队工作20年，擅长分析犯罪现场，性格严谨但有些固执，有一个已成年的女儿"
              value={editingCharacter.bio}
              onChange={(e) => setEditingCharacter({ ...editingCharacter, bio: e.target.value })}
                          minRows={4}
              required
                          styles={{
                            input: {
                              backgroundColor: 'rgba(255, 255, 255, 0.1)',
                              border: '2px solid #00C2FF',
                              color: '#FFFFFF',
                              fontSize: '14px',
                              '&::placeholder': {
                                color: '#B8B8B8'
                              },
                              '&:focus': {
                                borderColor: '#FFFF00',
                                boxShadow: '0 0 10px rgba(255, 255, 0, 0.3)'
                              }
                            }
                          }}
                        />
                      </Grid.Col>
                      <Grid.Col span={6}>
            <Group justify="space-between" align="flex-end" mb="xs">
              <Text size="sm" fw={600} c="#87CEEB">性格特点</Text>
              {onOpenPolish && editingIndex !== null && (
                <PolishButton onClick={() => onOpenPolish(`characters[${editingIndex}].personality`)} />
              )}
            </Group>
            <Textarea
              placeholder="描述角色的性格特点，例如：内向、多疑、善于观察细节、说话简洁有力、对陌生人保持警惕、喜欢独处思考"
              value={editingCharacter.personality}
              onChange={(e) => setEditingCharacter({ ...editingCharacter, personality: e.target.value })}
                          minRows={4}
                          styles={{
                            input: {
                              backgroundColor: 'rgba(255, 255, 255, 0.1)',
                              border: '2px solid #00C2FF',
                              color: '#FFFFFF',
                              fontSize: '14px',
                              '&::placeholder': {
                                color: '#B8B8B8'
                              },
                              '&:focus': {
                                borderColor: '#FFFF00',
                                boxShadow: '0 0 10px rgba(255, 255, 0, 0.3)'
                              }
                            }
                          }}
                        />
                      </Grid.Col>
                    </Grid>
                  </div>

                  {/* 游戏内信息区域 */}
                  <div className="aurora-card" style={{
                    background: 'linear-gradient(135deg, rgba(10, 10, 35, 0.8) 0%, rgba(26, 26, 62, 0.8) 100%)',
                    borderRadius: '12px',
                    padding: '20px',
                    border: '1px solid rgba(135, 206, 235, 0.3)',
                    backdropFilter: 'blur(5px)'
                  }}>
                    <Text size="lg" fw={600} c="#87CEEB" mb="md" style={{ 
                      fontFamily: '"PingFang SC", "Microsoft YaHei", sans-serif',
                      letterSpacing: '0.5px'
                    }}>
                      🎭 游戏内信息
                    </Text>
                    
                    <Grid>
                      <Grid.Col span={12}>
            <Group justify="space-between" align="flex-end" mb="xs">
              <Text size="sm" fw={600} c="#87CEEB">上下文信息</Text>
              {onOpenPolish && editingIndex !== null && (
                <PolishButton onClick={() => onOpenPolish(`characters[${editingIndex}].context`)} />
              )}
            </Group>
            <Textarea
                          placeholder="描述角色在游戏中的当前状态和已知信息，例如：你昨晚在书房工作到很晚，听到楼下有脚步声，但没有出去查看。你知道死者最近与某人有财务纠纷"
              value={editingCharacter.context}
              onChange={(e) => setEditingCharacter({ ...editingCharacter, context: e.target.value })}
              minRows={4}
              required
                          styles={{
                            input: {
                              backgroundColor: 'rgba(255, 255, 255, 0.1)',
                              border: '2px solid #00C2FF',
                              color: '#FFFFFF',
                              fontSize: '14px',
                              '&::placeholder': {
                                color: '#B8B8B8'
                              },
                              '&:focus': {
                                borderColor: '#FFFF00',
                                boxShadow: '0 0 10px rgba(255, 255, 0, 0.3)'
                              }
                            }
                          }}
                        />
                      </Grid.Col>
                    </Grid>
                  </div>

                  {/* 秘密和违规原则区域 - 并排显示 */}
                  <Grid>
                    <Grid.Col span={6}>
                      <div className="aurora-card" style={{
                        background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(120, 119, 198, 0.1) 100%)',
                        borderRadius: '12px',
                        padding: '20px',
                        border: '2px solid rgba(139, 92, 246, 0.5)',
                        position: 'relative',
                        height: '100%',
                        backdropFilter: 'blur(5px)',
                        boxShadow: '0 4px 20px rgba(139, 92, 246, 0.2)'
                      }}>
                        <Group justify="space-between" mb="md">
                          <Text size="lg" fw={600} c="#8B5CF6" style={{ 
                          fontFamily: '"PingFang SC", "Microsoft YaHei", sans-serif',
                          letterSpacing: '0.5px'
                        }}>
                            🔒 角色秘密
                          </Text>
                          {onOpenPolish && editingIndex !== null && (
                            <PolishButton onClick={() => onOpenPolish(`characters[${editingIndex}].secret`)} />
                          )}
                        </Group>

            <Textarea
              placeholder="角色要隐藏的秘密，例如：你其实知道王教授是被李医生杀害的，因为你在案发当晚看到李医生离开医院，但你因为个人恩怨不想揭发他"
              value={editingCharacter.secret}
              onChange={(e) => setEditingCharacter({ ...editingCharacter, secret: e.target.value })}
                          minRows={4}
                          styles={{
                            input: {
                              backgroundColor: 'rgba(255, 255, 255, 0.1)',
                              border: '2px solid #8B5CF6',
                              color: '#FFFFFF',
                              fontSize: '14px',
                              '&::placeholder': {
                                color: '#B8B8B8'
                              },
                              '&:focus': {
                                borderColor: '#FFFF00',
                                boxShadow: '0 0 10px rgba(255, 255, 0, 0.3)'
                              }
                            }
                          }}
                        />
                      </div>
                    </Grid.Col>
                    <Grid.Col span={6}>
                      <div className="aurora-card" style={{
                        background: 'linear-gradient(135deg, rgba(220, 38, 38, 0.15) 0%, rgba(185, 28, 28, 0.1) 100%)',
                        borderRadius: '12px',
                        padding: '20px',
                        border: '2px solid #DC2626',
                        boxShadow: '0 0 20px rgba(220, 38, 38, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
                        position: 'relative',
                        height: '100%',
                        backdropFilter: 'blur(5px)'
                      }}>
                        <div style={{
                          position: 'absolute',
                          top: '-8px',
                          left: '20px',
                          background: '#DC2626',
                          color: '#FFFFFF',
                          padding: '4px 12px',
                          borderRadius: '20px',
                          fontSize: '12px',
                          fontWeight: '600',
                          boxShadow: '0 2px 8px rgba(220, 38, 38, 0.4)',
                          zIndex: 1
                        }}>
                          ⚠️ 绝对禁止
                        </div>
                        
                        <Group justify="space-between" mb="md" mt="lg">
                          <Text size="lg" fw={600} c="#DC2626" style={{ 
                          fontFamily: '"PingFang SC", "Microsoft YaHei", sans-serif',
                          letterSpacing: '0.5px',
                          paddingTop: '8px'
                        }}>
                            🚫 违规原则
                          </Text>
                          {onOpenPolish && editingIndex !== null && (
                            <PolishButton onClick={() => onOpenPolish(`characters[${editingIndex}].violation`)} />
                          )}
                        </Group>

            <Textarea
                          placeholder="角色绝对不能违反的原则，例如：不能直接承认自己是凶手、不能透露其他角色的秘密、不能说出自己不在场证明的漏洞、不能承认与死者的真实关系"
              value={editingCharacter.violation}
              onChange={(e) => setEditingCharacter({ ...editingCharacter, violation: e.target.value })}
                          minRows={4}
              styles={{
                input: {
                              backgroundColor: 'rgba(255, 255, 255, 0.1)',
                              border: '2px solid #DC2626',
                              color: '#FFFFFF',
                              fontSize: '14px',
                              '&::placeholder': {
                                color: '#B8B8B8'
                  },
                  '&:focus': {
                                borderColor: '#FEF2F2',
                                boxShadow: '0 0 15px rgba(220, 38, 38, 0.5)'
                  }
                }
              }}
            />
                      </div>
                    </Grid.Col>
                  </Grid>
                </Stack>
              </Grid.Col>
            </Grid>
              </div>
            )}

        {/* 底部按钮区域 */}
        {editingCharacter && (
          <div className="aurora-card" style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '12px',
            marginTop: '24px',
            padding: '16px 24px',
            background: 'linear-gradient(135deg, rgba(10, 10, 35, 0.8) 0%, rgba(26, 26, 62, 0.8) 100%)',
            borderRadius: '12px',
            border: '1px solid rgba(135, 206, 235, 0.3)',
            backdropFilter: 'blur(5px)'
          }}>
              <Button
                variant="outline"
                onClick={() => {
                  setModalOpened(false);
                  setEditingCharacter(null);
                  setAvatarFile(null);
                  setAvatarPreview('');
                }}
              styles={{
                root: {
                  borderColor: '#6B7280',
                  color: '#9CA3AF',
                  fontSize: '14px',
                  fontWeight: '500',
                  padding: '10px 20px',
                  '&:hover': {
                    backgroundColor: 'rgba(107, 114, 128, 0.1)',
                    borderColor: '#9CA3AF'
                  }
                }
                }}
              >
                取消
              </Button>
              <Button 
                onClick={handleSaveCharacter}
                styles={{
                  root: {
                    background: 'linear-gradient(135deg, #00C2FF 0%, #87CEEB 100%)',
                    color: '#000',
                    fontSize: '14px',
                    fontWeight: '700',
                    padding: '10px 24px',
                    border: '1px solid #00C2FF',
                    boxShadow: '0 0 15px rgba(0, 194, 255, 0.4)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #00A8CC, #6BB6FF)',
                      boxShadow: '0 0 20px rgba(0, 194, 255, 0.6)',
                      transform: 'translateY(-1px)'
                    }
                  }
                }}
              >
              💾 保存角色
              </Button>
          </div>
        )}
      </Modal>

      {/* 头像选择弹窗 */}
      <Modal
        opened={avatarSelectModalOpened}
        onClose={() => setAvatarSelectModalOpened(false)}
        title="选择头像"
        size="xl"
        centered
        styles={{
          content: {
            backgroundColor: 'rgba(26, 26, 46, 0.95)',
            border: '2px solid #00C2FF',
            borderRadius: '12px'
          },
          header: {
            backgroundColor: 'rgba(0, 194, 255, 0.1)',
            borderBottom: '2px solid #00C2FF'
          },
          title: {
            color: '#00C2FF',
            fontWeight: '700',
            textShadow: '0 0 10px rgba(0, 194, 255, 0.5)'
          }
        }}
      >
        <Stack gap="md">
          <Text size="sm" c="#87CEEB" ta="center">
            点击头像进行选择，当前有 {availableAvatars.length} 个头像可选
          </Text>
          
          {/* 搜索框 */}
          <Group gap="sm">
            <TextInput
              placeholder="🔍 搜索头像关键词... (如: 公主、官员、gaolishi)"
              value={avatarSearchQuery}
              onChange={(event) => setAvatarSearchQuery(event.currentTarget.value)}
              style={{ flex: 1 }}
              styles={{
                input: {
                  backgroundColor: 'rgba(0, 0, 0, 0.6)',
                  border: '1px solid #00FFFF',
                  color: '#FFFFFF',
                  '&::placeholder': {
                    color: '#B0B0B0'
                  },
                  '&:focus': {
                    borderColor: '#00FFFF',
                    boxShadow: '0 0 10px rgba(0, 255, 255, 0.3)'
                  }
                }
              }}
            />
            {avatarSearchQuery && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setAvatarSearchQuery('')}
                style={{
                  borderColor: '#00FFFF',
                  color: '#00FFFF',
                  '&:hover': {
                    backgroundColor: 'rgba(0, 255, 255, 0.1)'
                  }
                }}
              >
                清空
              </Button>
            )}
          </Group>
          
          {/* 快速搜索标签 */}
          {!avatarSearchQuery && (
            <Group justify="center" gap="xs">
              <Text size="xs" c="#B0B0B0">快速搜索:</Text>
              {['公主', '官员', '妃子', '警官', '新手'].map((tag) => (
                <Button
                  key={tag}
                  size="xs"
                  variant="light"
                  onClick={() => setAvatarSearchQuery(tag)}
                  style={{
                    fontSize: '10px',
                    height: '24px',
                    backgroundColor: 'rgba(0, 255, 255, 0.1)',
                    color: '#00FFFF',
                    border: '1px solid rgba(0, 255, 255, 0.3)',
                    '&:hover': {
                      backgroundColor: 'rgba(0, 255, 255, 0.2)'
                    }
                  }}
                >
                  {tag}
                </Button>
              ))}
            </Group>
          )}
          
          {avatarSearchQuery && (
            <Text size="xs" c="#87CEEB" ta="center">
              找到 {filteredAvatars.length} 个匹配的头像
            </Text>
          )}
          <ScrollArea h={600} type="auto">
            {filteredAvatars.length === 0 ? (
              <Stack align="center" py="xl">
                <Text size="md" c="#87CEEB" ta="center">
                  😅 没有找到匹配的头像
                </Text>
                <Text size="sm" c="#B0B0B0" ta="center">
                  尝试更换关键词或清空搜索查看所有头像
                </Text>
              </Stack>
            ) : (
              <SimpleGrid cols={{ base: 2, sm: 3, md: 4, lg: 5 }} spacing="xl">
                {filteredAvatars.map((avatarName) => (
                <Card
                  key={avatarName}
                  shadow="sm"
                  padding="lg"
                  radius="md"
                  withBorder
                  style={{ 
                    cursor: 'pointer',
                    background: 'linear-gradient(135deg, #1A1A2E 0%, #1E1E1E 100%)',
                    borderColor: editingCharacter?.image === avatarName ? '#00C2FF' : '#333',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      borderColor: '#00C2FF',
                      transform: 'scale(1.05)',
                      boxShadow: '0 4px 15px rgba(0, 194, 255, 0.3)'
                    }
                  }}
                  onClick={() => handleSelectAvatarFromModal(avatarName)}
                >
                  <Stack align="center" gap="xs">
                    <Avatar
                      src={resolveAvatarSrc(avatarName)}
                      size={140}
                      radius="md"
                      style={{
                        border: editingCharacter?.image === avatarName ? '3px solid #00C2FF' : '2px solid #333',
                        boxShadow: editingCharacter?.image === avatarName ? '0 0 15px rgba(0, 194, 255, 0.5)' : 'none',
                        objectFit: 'cover'
                      } as React.CSSProperties}
                    />
                    <Text size="xs" c="white" ta="center" fw={400} style={{ fontSize: '11px', lineHeight: '1.2' }}>
                      {getAvatarDisplayName(avatarName)}
                    </Text>
                    {editingCharacter?.image === avatarName && (
                      <Text size="xs" c="#00C2FF" fw={600} style={{ fontSize: '10px' }}>
                        ✓ 已选择
                      </Text>
                    )}
                  </Stack>
                </Card>
                ))}
              </SimpleGrid>
            )}
          </ScrollArea>
        </Stack>
        
        <Group justify="flex-end" mt="md">
          <Button
            variant="outline"
            onClick={() => setAvatarSelectModalOpened(false)}
          >
            取消
          </Button>
        </Group>
      </Modal>

      {/* 背景选择弹窗 */}
      <Modal
        opened={backgroundSelectModalOpened}
        onClose={() => setBackgroundSelectModalOpened(false)}
        title="选择聊天背景"
        size="90%"
        centered
        styles={{
          content: {
            background: 'linear-gradient(135deg, rgba(10, 10, 35, 0.95) 0%, rgba(26, 26, 62, 0.95) 50%, rgba(15, 32, 39, 0.95) 100%)',
            border: '2px solid rgba(255, 183, 77, 0.8)',
            borderRadius: '16px',
            maxWidth: '1200px',
            minHeight: '600px',
            boxShadow: '0 8px 32px rgba(255, 183, 77, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(10px)'
          },
          header: {
            background: 'linear-gradient(135deg, rgba(255, 183, 77, 0.1) 0%, rgba(255, 183, 77, 0.05) 100%)',
            borderBottom: '2px solid rgba(255, 183, 77, 0.8)',
            backdropFilter: 'blur(10px)'
          },
          title: {
            color: '#FFB74D',
            fontFamily: '"PingFang SC", "Microsoft YaHei", sans-serif',
            fontWeight: '700',
            fontSize: '18px'
          },
          close: {
            color: '#FFFFFF',
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              color: '#FFB74D'
            }
          }
        }}
      >
        <Stack gap="md">
          <Text size="sm" c="#FFB74D" ta="center">
            选择适合角色的聊天背景，当前有 {getAllBackgroundOptions().length} 个背景可选
          </Text>
          <ScrollArea h={700} type="auto">
            {getBackgroundCategories().map((category) => (
              <div key={category} style={{ marginBottom: '30px' }}>
                <Text size="md" c="#FFB74D" fw={600} mb="md" style={{ 
                  borderBottom: '1px solid rgba(255, 183, 77, 0.3)',
                  paddingBottom: '8px'
                }}>
                  {category}
                </Text>
                <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="xl">
                  {getBackgroundsByCategory(category).map((background) => (
                    <Card
                      key={background.value}
                      shadow="sm"
                      padding="md"
                      radius="md"
                      withBorder
                      style={{ 
                        cursor: 'pointer',
                        background: 'linear-gradient(135deg, #1A1A2E 0%, #1E1E1E 100%)',
                        borderColor: editingCharacter?.backgroundImage === background.value ? '#FFB74D' : '#333',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          borderColor: '#FFB74D',
                          transform: 'scale(1.02)',
                          boxShadow: '0 4px 15px rgba(255, 183, 77, 0.3)'
                        }
                      }}
                      onClick={() => handleSelectBackgroundFromModal(background.value)}
                    >
                      <Stack align="center" gap="xs">
                        <div
                          style={{
                            width: '320px',
                            height: '180px',
                            borderRadius: '12px',
                            backgroundImage: `url(/${background.value})`,
                            backgroundSize: '100% 100%', // 🔧 完全填满容器，显示完整图像
                            backgroundPosition: 'center',
                            border: editingCharacter?.backgroundImage === background.value ? '3px solid #FFB74D' : '2px solid #333',
                            boxShadow: editingCharacter?.backgroundImage === background.value ? '0 0 20px rgba(255, 183, 77, 0.6)' : '0 2px 8px rgba(0, 0, 0, 0.3)',
                            transition: 'all 0.3s ease'
                          }}
                        />
                        <Text size="xs" c="white" ta="center" fw={400} style={{ fontSize: '12px', lineHeight: '1.2' }}>
                          {background.label}
                        </Text>
                        {editingCharacter?.backgroundImage === background.value && (
                          <Text size="xs" c="#FFB74D" fw={600} style={{ fontSize: '10px' }}>
                            ✓ 已选择
                          </Text>
                        )}
                      </Stack>
                    </Card>
                  ))}
                </SimpleGrid>
              </div>
            ))}
          </ScrollArea>
        </Stack>
        
        <Group justify="flex-end" mt="md">
          <Button
            variant="outline"
            onClick={() => setBackgroundSelectModalOpened(false)}
            styles={{
              root: {
                borderColor: '#FFB74D',
                color: '#FFB74D',
                '&:hover': {
                  backgroundColor: 'rgba(255, 183, 77, 0.1)'
                }
              }
            }}
          >
            取消
          </Button>
        </Group>
      </Modal>

      {/* 角色配置验证提示模态框 */}
      <Modal
        opened={validationModalOpened}
        onClose={() => setValidationModalOpened(false)}
        title="角色配置提醒"
        size="lg"
        centered
        styles={{
          content: {
            background: 'linear-gradient(135deg, #2A2A3E 0%, #1E1E2E 100%)',
            border: '2px solid #FFB74D'
          },
          header: {
            background: 'rgba(255, 183, 77, 0.1)',
            borderBottom: '1px solid #FFB74D'
          },
          title: {
            color: '#FFB74D',
            fontWeight: '700',
            fontSize: '20px'
          }
        }}
      >
        <Stack gap="md">
          <Alert
            color="orange"
            title="⚠️ 角色配置不完整"
            styles={{
              root: {
                backgroundColor: 'rgba(255, 183, 77, 0.1)',
                border: '1px solid #FFB74D'
              }
            }}
          >
            <Text c="white" size="sm">
              每个剧本都必须包含以下角色类型：
            </Text>
            <ul style={{ color: '#E8E8E8', marginTop: '8px' }}>
              <li><strong>玩家角色</strong> - 由用户控制的主角</li>
              <li><strong>搭档角色</strong> - 协助调查的伙伴</li>
              <li><strong>凶手角色</strong> - 隐藏真相的关键角色</li>
              <li><strong>受害人角色</strong> - 案件的受害者（可关联尸检报告、遗物等证物）</li>
            </ul>
          </Alert>

          <Text c="white" size="sm">
            请确保在角色管理中设置一个"玩家"、一个"搭档"和一个"凶手"角色。
          </Text>

          <Text c="#B8B8B8" size="xs">
            💡 提示：点击角色卡片上的"编辑"按钮，在角色设置中勾选相应的身份选项。
          </Text>

          <Group justify="flex-end" mt="md">
            <Button
              onClick={() => setValidationModalOpened(false)}
              styles={{
                root: {
                  backgroundColor: '#FFB74D',
                  color: '#000',
                  fontWeight: '600'
                }
              }}
            >
              我知道了
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Paper>
  );
};

export default CharacterEditor;
