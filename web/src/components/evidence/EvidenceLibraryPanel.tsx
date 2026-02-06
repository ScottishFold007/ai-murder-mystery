import React, { useState, useEffect } from 'react';
import {
  TextInput,
  Select,
  Group,
  Stack,
  Text,
  ScrollArea,
  Badge,
  ActionIcon,
  Box,
  SimpleGrid,
  Alert
} from '@mantine/core';
import {
  IconSearch,
  IconSettings,
  IconInfoCircle,
  IconEye,
  IconRefresh
} from '@tabler/icons-react';
import { Evidence, EvidenceFilter, EvidenceStats } from '../../types/evidence';
import {
  loadEvidenceContext,
  getFilteredEvidences,
  getEvidenceStats,
  clearEvidenceNewFlags,
  addEvidenceToContext,
  getEvidenceById,
  saveEvidenceContext,
  refreshVictimEvidenceImages
} from '../../utils/evidenceManager';
import EvidenceCard from './EvidenceCard';
import EvidenceDetailModal from './EvidenceDetailModal';
import { useScriptContext } from '../../providers/scriptContext';

interface EvidenceLibraryPanelProps {
  sessionId: string;
  scriptId: string;
  onEvidenceSelect?: (evidence: Evidence) => void;
  onEvidencePresent?: (evidence: Evidence) => void;
}

const EvidenceLibraryPanel: React.FC<EvidenceLibraryPanelProps> = ({
  sessionId,
  scriptId,
  onEvidenceSelect,
  onEvidencePresent
}) => {
  const { currentScript } = useScriptContext();
  const [evidences, setEvidences] = useState<Evidence[]>([]);
  const [stats, setStats] = useState<EvidenceStats | null>(null);
  const [selectedEvidence, setSelectedEvidence] = useState<Evidence | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [filter, setFilter] = useState<EvidenceFilter>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [victimAvatarFilename, setVictimAvatarFilename] = useState<string | null>(null);

  // 获取受害人角色信息
  const getVictimCharacter = () => {
    if (!currentScript?.characters) {
      console.log('🔍 getVictimCharacter - 当前脚本或角色列表为空');
      return null;
    }
    
    console.log('🔍 getVictimCharacter - 当前脚本角色数量:', currentScript.characters.length);
    console.log('🔍 getVictimCharacter - 角色列表:', currentScript.characters.map(c => ({ name: c.name, isVictim: c.isVictim, roleType: c.roleType })));
    
    // 首先尝试通过 isVictim 标志查找
    let victim = currentScript.characters.find(char => char.isVictim);
    
    // 如果没有找到 isVictim 标志的角色，尝试根据 roleType 查找
    if (!victim) {
      victim = currentScript.characters.find(char => char.roleType === '受害人');
      console.log('🔍 getVictimCharacter - 通过roleType找到受害人:', victim ? victim.name : '未找到');
    }
    
    // 如果还是没有找到，可能是剧本设计中没有明确标记受害人
    // 这种情况下返回null，让证物库显示通用信息
    if (!victim) {
      console.log('🔍 getVictimCharacter - 当前剧本中没有找到受害人角色');
    } else {
      console.log('🔍 getVictimCharacter - 最终找到的受害人:', victim.name);
    }
    
    return victim;
  };

  // 动态查找角色头像文件名的异步函数
  const findCharacterAvatarFilename = async (characterName: string): Promise<string | null> => {
    try {
      console.log('🔍 findCharacterAvatarFilename - 开始查找角色头像:', characterName);
      
      // 调用角色头像API获取所有可用的头像文件
      const response = await fetch('http://localhost:10000/character-avatars');
      if (!response.ok) {
        console.warn('🔍 findCharacterAvatarFilename - API调用失败:', response.status);
        return null;
      }
      
      const data = await response.json();
      const avatars = data.avatars || [];
      console.log('🔍 findCharacterAvatarFilename - 获取到头像列表数量:', avatars.length);
      
      // 查找匹配的头像文件（按优先级搜索）
      const searchPatterns = [
        // 精确匹配：角色名_时间戳_随机标识.png
        (filename: string) => filename.startsWith(`${characterName}_`) && filename.endsWith('.png'),
        // 简单匹配：角色名.png
        (filename: string) => filename === `${characterName}.png`,
        // 包含匹配：文件名包含角色名
        (filename: string) => filename.includes(characterName) && filename.endsWith('.png')
      ];
      
      for (const pattern of searchPatterns) {
        const matchedFile = avatars.find(pattern);
        if (matchedFile) {
          console.log('🔍 findCharacterAvatarFilename - 找到匹配的头像文件:', matchedFile);
          return matchedFile;
        }
      }
      
      console.log('🔍 findCharacterAvatarFilename - 未找到匹配的头像文件');
      return null;
    } catch (error) {
      console.error('🔍 findCharacterAvatarFilename - 查找头像文件时出错:', error);
      return null;
    }
  };

  // 将受害人信息转换为证物数据结构
  const getVictimAsEvidence = (): Evidence | null => {
    const victim = getVictimCharacter();
    if (!victim) {
      console.log('🔍 getVictimAsEvidence - 未找到受害人角色');
      return null;
    }
    
    console.log('🔍 getVictimAsEvidence - 受害人角色信息:', {
      name: victim.name,
      image: victim.image,
      bio: victim.bio,
      dynamicFilename: victimAvatarFilename
    });

    // 完全采用与其他证物相同的图像处理策略：只存储文件名，严格按照STATIC_FILES_SETUP.md设计原则
    let imagePath: string | undefined;
    if (victim.image) {
      if (victim.image.startsWith('data:')) {
        // base64数据不存储，使用动态查找到的文件名
        // 这与其他证物的策略一致：不存储base64，只存储文件名
        console.log('🔍 getVictimAsEvidence - base64数据使用动态查找的文件名:', victimAvatarFilename);
        imagePath = victimAvatarFilename || undefined; // 使用动态查找的文件名
      } else if (victim.image.startsWith('/character_avatars/')) {
        // 完整路径，提取文件名（与其他证物处理方式完全一致）
        imagePath = victim.image.split('/').pop();
        console.log('🔍 getVictimAsEvidence - 从完整路径提取文件名:', imagePath);
      } else if (victim.image.includes('/')) {
        // 其他路径格式，提取文件名
        imagePath = victim.image.split('/').pop();
        console.log('🔍 getVictimAsEvidence - 从路径提取文件名:', imagePath);
      } else {
        // 已经是文件名，直接使用（与其他证物处理方式完全一致）
        imagePath = victim.image;
        console.log('🔍 getVictimAsEvidence - 直接使用文件名:', imagePath);
      }
    } else {
      // 无图像，设为undefined，将显示emoji图标
      imagePath = undefined;
      console.log('🔍 getVictimAsEvidence - 无图像数据，使用emoji显示');
    }

    return {
      id: `victim_${victim.name}`,
      name: `受害人：${victim.name}`,
      basicDescription: `${victim.name}，本案受害人。身份已确认，相关背景和人际关系是案件调查的重要线索。`,
      detailedDescription: `受害人${victim.name}的基本信息已经确认。通过与搭档的对话可以了解更多关于受害人的详细背景、人际关系和可能的作案动机线索。`,
      category: 'testimony', // 改为证词记录类型，更符合受害人信息的性质
      discoveryState: 'surface',
      unlockLevel: 1,
      relatedActors: [],
      relatedEvidences: [],
      triggerEvents: [],
      reactions: [],
      combinableWith: [],
      importance: 'critical',
      sessionId: sessionId,
      scriptId: scriptId,
      lastUpdated: new Date().toISOString(),
      image: imagePath,
      isNew: false
    };
  };

  // 动态查找受害人头像文件名
  useEffect(() => {
    const loadVictimAvatarFilename = async () => {
      const victim = getVictimCharacter();
      if (victim && victim.image && victim.image.startsWith('data:')) {
        console.log('🔍 EvidenceLibraryPanel - 开始动态查找受害人头像文件名:', victim.name);
        const filename = await findCharacterAvatarFilename(victim.name);
        if (filename) {
          console.log('🔍 EvidenceLibraryPanel - 找到受害人头像文件名:', filename);
          setVictimAvatarFilename(filename);
          
          // 更新已存在的受害人证物对象
          const context = loadEvidenceContext(sessionId);
          const victimEvidenceIndex = context.evidences.findIndex(e => 
            e.id.startsWith('victim_') && e.name.startsWith('受害人：')
          );
          
          if (victimEvidenceIndex !== -1) {
            // 更新现有受害人证物的图像文件名
            console.log('🔍 EvidenceLibraryPanel - 更新现有受害人证物的图像文件名:', filename);
            context.evidences[victimEvidenceIndex].image = filename;
            context.evidences[victimEvidenceIndex].lastUpdated = new Date().toISOString();
            saveEvidenceContext(context);
          } else {
            console.log('🔍 EvidenceLibraryPanel - 未找到现有受害人证物，将在下次加载时创建');
          }
        } else {
          console.log('🔍 EvidenceLibraryPanel - 未找到受害人头像文件名，将使用emoji显示');
          setVictimAvatarFilename(null);
        }
      }
    };
    
    loadVictimAvatarFilename();
  }, [currentScript]);

  // 加载证物数据
  const loadEvidences = () => {
    try {
      // 确保受害人证物被添加到证物库中
      const victimEvidence = getVictimAsEvidence();
      if (victimEvidence) {
        const existingEvidence = getEvidenceById(sessionId, victimEvidence.id);
        if (!existingEvidence) {
          // 受害人证物不存在，添加到证物库
          console.log('🔍 添加受害人证物到证物库:', victimEvidence.name);
          addEvidenceToContext(sessionId, victimEvidence);
        }
      }
      
      const context = loadEvidenceContext(sessionId);
      const filteredEvidences = getFilteredEvidences(sessionId, {
        ...filter,
        searchQuery: searchQuery.trim() || undefined
      });
      const evidenceStats = getEvidenceStats(sessionId);
      
      setEvidences(filteredEvidences);
      setStats(evidenceStats);
      
      console.log('🔍 EvidenceLibraryPanel - 加载证物数量:', filteredEvidences.length);
    } catch (error) {
      console.error('❌ 加载证物失败:', error);
    }
  };

  // 手动刷新证物数据
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      // 短暂延迟以提供视觉反馈
      await new Promise(resolve => setTimeout(resolve, 500));
      loadEvidences();
      console.log('🔄 证物库数据已刷新');
    } finally {
      setIsRefreshing(false);
    }
  };

  // 初始加载和依赖更新
  useEffect(() => {
    // 使用防抖延迟，避免频繁的搜索查询
    const timeoutId = setTimeout(async () => {
      // 先刷新受害人证物图像，然后加载证物
      await refreshVictimEvidenceImages(sessionId);
      loadEvidences();
    }, searchQuery ? 300 : 0); // 搜索时延迟300ms，其他情况立即执行

    return () => clearTimeout(timeoutId);
  }, [sessionId, filter, searchQuery, victimAvatarFilename]);

  // 清除过期的新标记
  useEffect(() => {
    const timer = setTimeout(() => {
      clearEvidenceNewFlags(sessionId);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [sessionId]);

  // 过滤选项
  const categoryOptions = [
    { value: '', label: '全部类别' },
    { value: 'physical', label: '物理证物' },
    { value: 'document', label: '文档资料' },
    { value: 'digital', label: '数字证据' },
    { value: 'testimony', label: '证词记录' },
    { value: 'combination', label: '组合证物' }
  ];

  const stateOptions = [
    { value: '', label: '全部状态' },
    { value: 'surface', label: '基础发现' },
    { value: 'investigated', label: '已调查' },
    { value: 'analyzed', label: '已分析' }
  ];


  // 处理证物点击
  const handleEvidenceClick = (evidence: Evidence) => {
    setSelectedEvidence(evidence);
    setShowDetailModal(true);
    onEvidenceSelect?.(evidence);
  };

  // 处理证物出示
  const handleEvidencePresent = (evidence: Evidence) => {
    onEvidencePresent?.(evidence);
    setShowDetailModal(false);
  };


  // 获取状态颜色
  const getStateColor = (state: string) => {
    switch (state) {
      case 'analyzed': return 'green';
      case 'investigated': return 'yellow';
      case 'surface': return 'blue';
      default: return 'gray';
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* 头部区域 */}
      <Group justify="space-between" align="center" mb="md">
        <Group gap="xs">
          <IconEye size={20} color="#00FFFF" />
          <Text
            style={{
              fontSize: '18px',
              color: '#00FFFF',
              fontWeight: '700',
              textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)'
            }}
          >
            证物库
          </Text>
          {stats && stats.newEvidences > 0 && (
            <Badge size="sm" color="red" variant="filled">
              {stats.newEvidences} 新
            </Badge>
          )}
        </Group>
        <Group gap="xs">
          <ActionIcon
            size="sm"
            variant="subtle"
            color="cyan"
            title="刷新证物库"
            onClick={handleRefresh}
            loading={isRefreshing}
          >
            <IconRefresh size={16} />
          </ActionIcon>
          <ActionIcon
            size="sm"
            variant="subtle"
            color="gray"
            title="设置"
          >
            <IconSettings size={16} />
          </ActionIcon>
        </Group>
      </Group>

      {/* 受害人信息作为可交互证物卡片 */}
      {getVictimAsEvidence() && (
        <Box mb="md">
          <Text size="xs" c="#00FFFF" mb="xs" fw={600}>
            📋 案件基础信息
          </Text>
          <EvidenceCard
            evidence={getVictimAsEvidence()!}
            onClick={() => {
              const victimEvidence = getVictimAsEvidence();
              if (victimEvidence) {
                setSelectedEvidence(victimEvidence);
                setShowDetailModal(true);
              }
            }}
            onDoubleClick={() => {
              const victimEvidence = getVictimAsEvidence();
              if (victimEvidence && onEvidencePresent) {
                onEvidencePresent(victimEvidence);
              }
            }}
          />
        </Box>
      )}

      {/* 搜索和过滤区域 */}
      <Stack gap="sm" mb="md">
        <TextInput
          placeholder="搜索证物..."
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.currentTarget.value)}
          leftSection={<IconSearch size={16} />}
          styles={{
            input: {
              background: 'rgba(0, 255, 255, 0.05)',
              border: '1px solid rgba(0, 255, 255, 0.3)',
              color: '#E0E0E0',
              '&::placeholder': { color: '#00FFFF', opacity: 0.7 },
              '&:focus': { 
                borderColor: '#00FFFF',
                boxShadow: '0 0 10px rgba(0, 255, 255, 0.3)'
              }
            }
          }}
        />
        
        <Group grow>
          <Select
            placeholder="类别"
            data={categoryOptions}
            value={filter.category || ''}
            onChange={(value) => setFilter(prev => ({ ...prev, category: value as any }))}
            styles={{
              input: {
                background: 'rgba(0, 255, 255, 0.05)',
                border: '1px solid rgba(0, 255, 255, 0.3)',
                color: '#E0E0E0',
                '&:focus': { 
                  borderColor: '#00FFFF',
                  boxShadow: '0 0 10px rgba(0, 255, 255, 0.3)'
                }
              },
              dropdown: {
                backgroundColor: 'rgba(18, 18, 18, 0.95)',
                border: '1px solid #00FFFF',
                boxShadow: '0 0 15px rgba(0, 255, 255, 0.3)'
              },
              option: {
                color: '#E0E0E0',
                '&:hover': {
                  backgroundColor: 'rgba(0, 255, 255, 0.1)',
                  color: '#00FFFF'
                }
              }
            }}
          />
          <Select
            placeholder="状态"
            data={stateOptions}
            value={filter.discoveryState || ''}
            onChange={(value) => setFilter(prev => ({ ...prev, discoveryState: value as any }))}
            styles={{
              input: {
                background: 'rgba(0, 255, 255, 0.05)',
                border: '1px solid rgba(0, 255, 255, 0.3)',
                color: '#E0E0E0',
                '&:focus': { 
                  borderColor: '#00FFFF',
                  boxShadow: '0 0 10px rgba(0, 255, 255, 0.3)'
                }
              },
              dropdown: {
                backgroundColor: 'rgba(18, 18, 18, 0.95)',
                border: '1px solid #00FFFF',
                boxShadow: '0 0 15px rgba(0, 255, 255, 0.3)'
              },
              option: {
                color: '#E0E0E0',
                '&:hover': {
                  backgroundColor: 'rgba(0, 255, 255, 0.1)',
                  color: '#00FFFF'
                }
              }
            }}
          />
        </Group>
      </Stack>

      {/* 统计信息 */}
      {stats && (
        <Box mb="md" p="sm" style={{
          background: 'rgba(0, 255, 255, 0.1)',
          borderRadius: '8px',
          border: '1px solid rgba(0, 255, 255, 0.3)'
        }}>
          <Group justify="space-between">
            <Text size="xs" c="#4ECCA3">
              共 {stats.totalEvidences} 个证物
            </Text>
            <Text size="xs" c="#4ECCA3">
              完成度 {stats.completionRate}%
            </Text>
          </Group>
        </Box>
      )}

      {/* 证物网格 */}
      <ScrollArea.Autosize mah={400} style={{ flex: 1 }}>
        {evidences.length === 0 ? (
          <Alert
            color="blue"
            variant="light"
            icon={<IconInfoCircle size={16} />}
            styles={{
              root: {
                background: 'rgba(0, 255, 255, 0.1)',
                border: '1px solid rgba(0, 255, 255, 0.3)'
              }
            }}
          >
            <Text size="sm" c="#E0E0E0" fw={500}>
              {searchQuery ? '没有找到匹配的证物' : '还没有发现任何证物，开始你的调查之旅吧！'}
            </Text>
          </Alert>
        ) : (
          <SimpleGrid cols={2} spacing="sm">
            {evidences.map((evidence) => (
              <EvidenceCard
                key={evidence.id}
                evidence={evidence}
                onClick={() => handleEvidenceClick(evidence)}
                style={{
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              />
            ))}
          </SimpleGrid>
        )}
      </ScrollArea.Autosize>

      {/* 证物详情模态框 */}
      {selectedEvidence && (
        <EvidenceDetailModal
          evidence={selectedEvidence}
          opened={showDetailModal}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedEvidence(null);
          }}
          onPresent={handleEvidencePresent}
          sessionId={sessionId}
        />
      )}
    </div>
  );
};

export default EvidenceLibraryPanel;
