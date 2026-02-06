import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AppShell,
  Container,
  Title,
  Button,
  Group,
  Grid,
  Card,
  Text,
  Badge,
  TextInput,
  Select,
  Stack,
  Paper,
  Modal,
  Alert,
  Checkbox,
  Menu,
  Pagination,
  Center,
  Tooltip
} from '@mantine/core';
// 使用 emoji 图标
import { useScriptContext } from '../providers/scriptContext';
import { Script } from '../types/script';
import { exportScriptAsJSON, importScriptFromFile, getScriptStats } from '../utils/scriptManager';
import { getCoverFromCache } from '../utils/coverCacheManager';
import { getCoverUrl } from '../utils/imageUtils';
import CoverSelectionModal from '../components/CoverSelectionModal';
import QualityCheckModal from '../components/QualityCheckModal';
import { notifications } from '@mantine/notifications';
import { IconCheck, IconX } from '@tabler/icons-react';
import QualityScoreBadge from '../components/QualityScoreBadge';

const ScriptLibrary: React.FC = () => {
  const navigate = useNavigate();
  const { scripts, deleteScript, updateScript } = useScriptContext();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<string>('updatedAt');
  const [filterDifficulty, setFilterDifficulty] = useState<string>('all');
  const [filterSourceType, setFilterSourceType] = useState<string>('all');
  const [deleteModalOpened, setDeleteModalOpened] = useState(false);
  const [scriptToDelete, setScriptToDelete] = useState<Script | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  
  // 分页相关状态
  const [currentPage, setCurrentPage] = useState(1);
  const SCRIPTS_PER_PAGE = 9; // 每页9个剧本 (3x3)
  
  // 选择功能相关状态
  const [selectedScripts, setSelectedScripts] = useState<Set<string>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [batchDeleteModalOpened, setBatchDeleteModalOpened] = useState(false);
  const [noSelectionModalOpened, setNoSelectionModalOpened] = useState(false);
  const [exportSuccessModalOpened, setExportSuccessModalOpened] = useState(false);
  const [exportedCount, setExportedCount] = useState(0);
  
  // 封面选择相关状态
  const [coverSelectionModalOpened, setCoverSelectionModalOpened] = useState(false);
  const [selectedScriptForCover, setSelectedScriptForCover] = useState<Script | null>(null);
  
  // 质检报告相关状态
  const [qualityCheckModalOpened, setQualityCheckModalOpened] = useState(false);
  const [selectedScriptForQualityCheck, setSelectedScriptForQualityCheck] = useState<Script | null>(null);
  const [forceRegenerate, setForceRegenerate] = useState(false);
  
  // 重新质检确认对话框状态
  const [recheckConfirmModalOpened, setRecheckConfirmModalOpened] = useState(false);
  const [scriptToRecheck, setScriptToRecheck] = useState<Script | null>(null);
  
  // 封面加载状态
  // const [loadingCovers, setLoadingCovers] = useState<Set<string>>(new Set());
  const [loadedCovers, setLoadedCovers] = useState<Map<string, string>>(new Map());

  // 简化的封面预加载逻辑
  useEffect(() => {
    const loadAllCovers = () => {
      const scriptsNeedingCovers = scripts.filter(script => 
        !script.coverImage && !loadedCovers.has(script.id)
      );
      
      if (scriptsNeedingCovers.length === 0) return;
      
      
      scriptsNeedingCovers.forEach(script => {
        // 从localStorage缓存加载
        const cachedCover = getCoverFromCache(script.id);
        if (cachedCover) {
          setLoadedCovers(prev => new Map(prev).set(script.id, cachedCover));
        }
      });
    };
    
    loadAllCovers();
  }, [scripts, loadedCovers]);

  // 当搜索或过滤条件改变时，重置到第一页
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterDifficulty, filterSourceType, sortBy]);

  // 过滤和排序剧本
  const allFilteredScripts = scripts
    .filter(script => {
      const matchesSearch = script.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          script.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          script.author.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesDifficulty = filterDifficulty === 'all' || script.settings.difficulty === filterDifficulty;
      const matchesSourceType = filterSourceType === 'all' || script.sourceType === filterSourceType;
      return matchesSearch && matchesDifficulty && matchesSourceType;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'title':
          return a.title.localeCompare(b.title);
        case 'author':
          return a.author.localeCompare(b.author);
        case 'createdAt':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'updatedAt':
        default:
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      }
    });

  // 分页计算
  const totalPages = Math.ceil(allFilteredScripts.length / SCRIPTS_PER_PAGE);
  const startIndex = (currentPage - 1) * SCRIPTS_PER_PAGE;
  const endIndex = startIndex + SCRIPTS_PER_PAGE;
  const filteredScripts = allFilteredScripts.slice(startIndex, endIndex);

  // 创建新剧本
  const handleCreateNew = () => {
    navigate('/editor');
  };

  // AI生成剧本
  const handleAIGenerate = () => {
    navigate('/ai-generator');
  };


  // 该函数暂时保留，供菜单调用
  // const handleExportScript = (script: Script) => {
  //   exportScriptAsFile(script);
  // };

  // 导出选中的剧本
  const handleExportSelected = async () => {
    if (selectedScripts.size === 0) {
      setNoSelectionModalOpened(true);
      return;
    }

    try {
      const selectedScriptsData = allFilteredScripts.filter(script => 
        selectedScripts.has(script.id)
      );

      const dataStr = JSON.stringify(selectedScriptsData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `selected_scripts_${selectedScripts.size}个_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      console.log('📤 批量导出选中剧本:', selectedScripts.size, '个剧本');
      
      setExportedCount(selectedScripts.size);
      setExportSuccessModalOpened(true);
      
      // 导出后退出选择模式
      setIsSelectionMode(false);
      setSelectedScripts(new Set());
    } catch (error) {
      console.error('❌ 批量导出失败:', error);
      // 简单的错误处理，可以后续改进
      window.alert('导出失败，请重试');
    }
  };

  // 编辑剧本
  const handleEdit = (script: Script) => {
    navigate(`/editor/${script.id}`);
  };

  // 播放剧本
  const handlePlay = (script: Script) => {
    navigate(`/play/${script.id}`);
  };

  // 删除剧本
  const handleDelete = (script: Script) => {
    setScriptToDelete(script);
    setDeleteModalOpened(true);
  };

  const confirmDelete = async () => {
    if (scriptToDelete) {
      try {
        await deleteScript(scriptToDelete.id);
        setDeleteModalOpened(false);
        setScriptToDelete(null);
        // 可以添加成功提示
        notifications.show({
          title: '删除成功',
          message: `剧本 "${scriptToDelete.title}" 已成功删除`,
          color: 'green',
          icon: <IconCheck size={16} />
        });
      } catch (error) {
        console.error('删除剧本失败:', error);
        // 显示错误提示
        notifications.show({
          title: '删除失败',
          message: '删除剧本时发生错误，请重试',
          color: 'red',
          icon: <IconX size={16} />
        });
      }
    }
  };

  // 选择封面
  const handleSelectCover = (script: Script) => {
    setSelectedScriptForCover(script);
    setCoverSelectionModalOpened(true);
  };

  // 封面选择完成
  const handleCoverSelected = async (coverData: string) => {
    try {
      
      if (!selectedScriptForCover) {
        console.error('❌ selectedScriptForCover 为空');
        return;
      }
      
      
      // 更新剧本数据，直接保存封面数据到数据库
      const updatedScript = {
        ...selectedScriptForCover,
        coverImage: coverData
      };
      
      // 将新封面添加到预加载状态
      setLoadedCovers(prev => new Map(prev).set(selectedScriptForCover.id, coverData));
      
      await updateScript(updatedScript);
      
      // 同时保存到数据库
      try {
        const { saveScriptToDB } = await import('../api/database');
        const dbResult = await saveScriptToDB(updatedScript);
        if (dbResult.success) {
        } else {
        }
      } catch (dbError) {
      }
      
    } catch (error) {
      console.error('❌ handleCoverSelected 异常:', error);
      // 不要抛出异常，避免影响UI
    }
  };

  // 导出剧本
  const handleExport = (script: Script) => {
    exportScriptAsJSON(script);
  };

  // 查看/生成质检报告
  const handleViewQualityReport = (script: Script, shouldForceRegenerate: boolean = false) => {
    if (shouldForceRegenerate) {
      // 如果是重新质检，先显示确认对话框
      setScriptToRecheck(script);
      setRecheckConfirmModalOpened(true);
    } else {
      // 直接查看报告或首次生成
      setSelectedScriptForQualityCheck(script);
      setForceRegenerate(shouldForceRegenerate);
      setQualityCheckModalOpened(true);
    }
  };

  // 确认重新质检
  const confirmRecheck = () => {
    if (scriptToRecheck) {
      setSelectedScriptForQualityCheck(scriptToRecheck);
      setForceRegenerate(true);
      setQualityCheckModalOpened(true);
      setRecheckConfirmModalOpened(false);
      setScriptToRecheck(null);
    }
  };

  // 导入剧本
  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      importScriptFromFile(file)
        .then((script: Script) => {
          // 导入成功，刷新页面或重新加载数据
          window.location.reload();
        })
        .catch((error: Error) => {
          setImportError(error.message);
        });
    }
  };

  // 选择功能相关方法
  const toggleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode);
    setSelectedScripts(new Set());
  };

  const toggleScriptSelection = (scriptId: string) => {
    const newSelected = new Set(selectedScripts);
    if (newSelected.has(scriptId)) {
      newSelected.delete(scriptId);
    } else {
      newSelected.add(scriptId);
    }
    setSelectedScripts(newSelected);
  };

  const selectAllScripts = () => {
    if (selectedScripts.size === allFilteredScripts.length) {
      setSelectedScripts(new Set());
    } else {
      setSelectedScripts(new Set(allFilteredScripts.map(script => script.id)));
    }
  };

  // 批量删除选中的剧本
  const handleDeleteSelected = () => {
    if (selectedScripts.size === 0) {
      setNoSelectionModalOpened(true);
      return;
    }
    setBatchDeleteModalOpened(true);
  };

  const confirmBatchDelete = async () => {
    const scriptIds = Array.from(selectedScripts);
    let successCount = 0;
    let failCount = 0;

    try {
      // 逐个删除剧本
      for (const scriptId of scriptIds) {
        try {
          await deleteScript(scriptId);
          successCount++;
        } catch (error) {
          console.error(`删除剧本 ${scriptId} 失败:`, error);
          failCount++;
        }
      }

      // 显示结果通知
      if (failCount === 0) {
        notifications.show({
          title: '批量删除成功',
          message: `成功删除 ${successCount} 个剧本`,
          color: 'green',
          icon: <IconCheck size={16} />
        });
      } else if (successCount === 0) {
        notifications.show({
          title: '批量删除失败',
          message: `删除失败，请重试`,
          color: 'red',
          icon: <IconX size={16} />
        });
      } else {
        notifications.show({
          title: '部分删除成功',
          message: `成功删除 ${successCount} 个，失败 ${failCount} 个`,
          color: 'yellow'
        });
      }

    } finally {
      setIsSelectionMode(false);
      setSelectedScripts(new Set());
      setBatchDeleteModalOpened(false);
    }
  };

  // 获取难度颜色
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'green';
      case 'medium': return 'yellow';
      case 'hard': return 'red';
      default: return 'gray';
    }
  };

  return (
    <AppShell
      header={{ height: 60 }}
      padding="md"
      className="aurora-background"
    >
      <AppShell.Header className="aurora-header">
        <Group h="100%" px="md" justify="space-between">
          {/* 左侧：Logo 和导航 */}
          <Group>
            <Button
              variant="subtle"
              onClick={() => navigate('/')}
              styles={{
                root: {
                  color: '#87CEEB',
                  '&:hover': {
                    backgroundColor: 'rgba(135, 206, 235, 0.1)'
                  }
                }
              }}
            >
              🎮 游戏
            </Button>
            <Title order={2} c="#87CEEB" style={{ textShadow: '0 0 10px rgba(135, 206, 235, 0.5)' }}>
              剧本库
            </Title>
          </Group>

          {/* 中间：搜索栏 */}
          <Group style={{ flex: 1, maxWidth: '500px', margin: '0 40px' }}>
            <TextInput
              placeholder="🔍 搜索剧本..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.currentTarget.value)}
              style={{ flex: 1 }}
              styles={{
                input: {
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  border: '2px solid #00FFFF',
                  color: '#FFFFFF',
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
          </Group>

          {/* 右侧：操作按钮 */}
          <Group>
            <Button
              variant="outline"
              component="label"
              htmlFor="import-file"
              styles={{
                root: {
                  color: '#00FFFF',
                  borderColor: '#00FFFF',
                  '&:hover': {
                    backgroundColor: 'rgba(0, 255, 255, 0.1)',
                    borderColor: '#FFFF00',
                    color: '#FFFF00'
                  }
                }
              }}
            >
              📥 导入剧本
              <input
                id="import-file"
                type="file"
                accept=".json"
                style={{ display: 'none' }}
                onChange={handleImport}
              />
            </Button>
            {!isSelectionMode ? (
              <Button
                onClick={toggleSelectionMode}
                variant="outline"
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
                📦 选择导出
              </Button>
            ) : (
              <Group>
                <Button
                  onClick={handleExportSelected}
                  disabled={selectedScripts.size === 0}
                  styles={{
                    root: {
                      background: selectedScripts.size > 0 ? 
                        'linear-gradient(135deg, #A78BFA, #8B5CF6)' : '#666',
                      color: '#FFF',
                      fontWeight: '600',
                      border: selectedScripts.size > 0 ? '1px solid #A78BFA' : '1px solid #666',
                      boxShadow: selectedScripts.size > 0 ? 
                        '0 0 15px rgba(167, 139, 250, 0.4)' : 'none',
                      '&:hover': {
                        background: selectedScripts.size > 0 ? 
                          'linear-gradient(135deg, #9F7AEA, #7C3AED)' : '#666',
                        boxShadow: selectedScripts.size > 0 ? 
                          '0 0 20px rgba(167, 139, 250, 0.6)' : 'none',
                        transform: selectedScripts.size > 0 ? 'translateY(-1px)' : 'none'
                      }
                    }
                  }}
                >
                  📤 导出选中 ({selectedScripts.size})
                </Button>
                <Button
                  onClick={handleDeleteSelected}
                  disabled={selectedScripts.size === 0}
                  color="red"
                  variant="outline"
                >
                  🗑️ 删除选中
                </Button>
                <Button
                  onClick={toggleSelectionMode}
                  variant="subtle"
                  color="gray"
                >
                  取消选择
                </Button>
              </Group>
            )}
            <Menu shadow="md" width={200}>
              <Menu.Target>
                <Button
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
                  ➕ 创建新剧本
                </Button>
              </Menu.Target>

              <Menu.Dropdown style={{ backgroundColor: '#1A1A2E', border: '1px solid #00C2FF' }}>
                <Menu.Item
                  onClick={handleCreateNew}
                  style={{ color: '#FFFFFF' }}
                >
                  ✏️ 手动创建剧本
                </Menu.Item>
                <Menu.Item
                  onClick={handleAIGenerate}
                  style={{ color: '#FFFFFF' }}
                >
                  🤖 AI生成剧本
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Main className="aurora-content">
        <Container size="xl">
          {importError && (
            <Alert
              title="导入失败"
              color="red"
              mb="md"
              onClose={() => setImportError(null)}
              withCloseButton
            >
              ⚠️ {importError}
            </Alert>
          )}

          {/* 筛选选项 */}
          <Paper p="md" mb="md" style={{ background: 'rgba(255, 255, 255, 0.05)' }}>
            <Group justify="space-between">
              <Group>
                <Select
                placeholder="排序方式"
                data={[
                  { value: 'updatedAt', label: '最近更新' },
                  { value: 'createdAt', label: '创建时间' },
                  { value: 'title', label: '标题' },
                  { value: 'author', label: '作者' }
                ]}
                value={sortBy}
                onChange={(value) => setSortBy(value || 'updatedAt')}
                style={{ width: 120 }}
                styles={{
                  input: {
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    border: '2px solid #00FFFF',
                    color: '#FFFFFF',
                    '&:focus': {
                      borderColor: '#FFFF00',
                      boxShadow: '0 0 10px rgba(255, 255, 0, 0.3)'
                    }
                  }
                }}
              />
              <Select
                placeholder="难度筛选"
                data={[
                  { value: 'all', label: '全部难度' },
                  { value: 'easy', label: '简单' },
                  { value: 'medium', label: '中等' },
                  { value: 'hard', label: '困难' }
                ]}
                value={filterDifficulty}
                onChange={(value) => setFilterDifficulty(value || 'all')}
                style={{ width: 120 }}
                styles={{
                  input: {
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    border: '2px solid #00FFFF',
                    color: '#FFFFFF',
                    '&:focus': {
                      borderColor: '#FFFF00',
                      boxShadow: '0 0 10px rgba(255, 255, 0, 0.3)'
                    }
                  }
                }}
              />
              <Select
                placeholder="来源类型"
                data={[
                  { value: 'all', label: '全部类型' },
                  { value: 'manual', label: '✏️ 手动创建' },
                  { value: 'ai', label: '🤖 AI生成' }
                ]}
                value={filterSourceType}
                onChange={(value) => setFilterSourceType(value || 'all')}
                style={{ width: 140 }}
                styles={{
                  input: {
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    border: '2px solid #00FFFF',
                    color: '#FFFFFF',
                    '&:focus': {
                      borderColor: '#FFFF00',
                      boxShadow: '0 0 10px rgba(255, 255, 0, 0.3)'
                    }
                  }
                }}
              />
              </Group>
              
              {/* 选择模式下的全选功能 */}
              {isSelectionMode && (
                <Group>
                  <Checkbox
                    label={`全选 (${filteredScripts.length})`}
                    checked={selectedScripts.size === filteredScripts.length && filteredScripts.length > 0}
                    indeterminate={selectedScripts.size > 0 && selectedScripts.size < filteredScripts.length}
                    onChange={selectAllScripts}
                    styles={{
                      label: { color: '#FFFFFF' },
                      input: {
                        '&:checked': {
                          backgroundColor: '#00FFFF',
                          borderColor: '#00FFFF'
                        }
                      }
                    }}
                  />
                  <Text size="sm" c="dimmed">
                    已选择 {selectedScripts.size} / {allFilteredScripts.length} 个剧本
                  </Text>
                </Group>
              )}
            </Group>
          </Paper>

          {/* 剧本列表 */}
          {allFilteredScripts.length === 0 ? (
            <Paper p="xl" style={{ textAlign: 'center', background: 'rgba(255, 255, 255, 0.05)' }}>
              <Text size="lg" c="dimmed" mb="md">
                {searchQuery || filterDifficulty !== 'all' || filterSourceType !== 'all' ? '没有找到匹配的剧本' : '还没有创建任何剧本'}
              </Text>
              <Group justify="center" gap="md">
                <Button 
                  onClick={handleCreateNew}
                  styles={{
                    root: {
                      background: 'linear-gradient(135deg, #00C2FF 0%, #0099CC 100%)',
                      color: '#FFFFFF',
                      fontWeight: 'bold'
                    }
                  }}
                >
                  ✏️ 手动创建剧本
                </Button>
                <Button 
                  onClick={handleAIGenerate}
                  styles={{
                    root: {
                      background: 'linear-gradient(135deg, #E63946 0%, #CC2936 100%)',
                      color: '#FFFFFF',
                      fontWeight: 'bold'
                    }
                  }}
                >
                  🤖 AI生成剧本
                </Button>
              </Group>
            </Paper>
          ) : (
            <Grid>
              {filteredScripts.map((script) => {
                const stats = getScriptStats(script);
                
                // 处理封面显示逻辑
                let displayScript = script;
                
                // 如果剧本没有封面，检查是否有预加载的封面数据
                if (!script.coverImage) {
                  const preloadedCover = loadedCovers.get(script.id);
                  if (preloadedCover) {
                    displayScript = {
                      ...script,
                      coverImage: preloadedCover
                    };
                  }
                } else if (script.coverImage.startsWith('file://')) {
                  // 如果是文件引用，使用预加载的数据
                  const preloadedCover = loadedCovers.get(script.id);
                  if (preloadedCover) {
                    displayScript = {
                      ...script,
                      coverImage: preloadedCover
                    };
                  }
                } else if (script.coverImage.startsWith('cache:')) {
                  // 如果是缓存引用，尝试从多级缓存获取
                  const scriptId = script.coverImage.replace('cache:', '');
                  
                  // 首先尝试从预加载数据获取
                  let cachedCover = loadedCovers.get(script.id);
                  
                  if (!cachedCover) {
                    // 尝试从localStorage/sessionStorage获取
                    cachedCover = getCoverFromCache(scriptId) || undefined;
                  }
                  
                  if (cachedCover) {
                    displayScript = {
                      ...script,
                      coverImage: cachedCover
                    };
                  } else {
                    
                    // 异步从IndexedDB获取
                    import('../utils/coverCacheManager').then(async ({ getFromIndexedDB }) => {
                      try {
                        const indexedDBCover = await getFromIndexedDB(scriptId);
                        if (indexedDBCover) {
                          // 更新预加载状态，触发重新渲染
                          setLoadedCovers(prev => new Map(prev).set(script.id, indexedDBCover));
                        }
                      } catch (error) {
                        console.error(`❌ IndexedDB恢复封面失败: ${script.title}`, error);
                      }
                    });
                  }
                }
                
                return (
                  <Grid.Col key={script.id} span={{ base: 12, sm: 6, md: 4 }}>
                    <Card
                      shadow="sm"
                      padding={0}
                      radius="md"
                      withBorder
                      style={{ 
                        background: 'linear-gradient(135deg, #1A1A2E 0%, #1E1E1E 100%)',
                        borderColor: '#00C2FF',
                        height: '100%',
                        overflow: 'hidden'
                      }}
                    >
                      {/* 封面区域 */}
                      <Card.Section 
                        style={{
                          height: '240px', // 增加高度以更好适配4:3比例
                          position: 'relative',
                          backgroundColor: displayScript.coverImage ? 'transparent' : 'transparent',
                          backgroundImage: displayScript.coverImage 
                            ? `url(${getCoverUrl(displayScript.coverImage)})` 
                            : 'linear-gradient(135deg, #2D1B69 0%, #11998E 100%)',
                          backgroundSize: 'contain',
                          backgroundPosition: 'center',
                          backgroundRepeat: 'no-repeat'
                        }}
                      >
                        {/* 透明遮罩层 */}
                        <div style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          background: 'linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.4) 100%)',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          padding: '16px'
                        }}>
                          {/* 顶部：选择框和标签 */}
                          <Group justify="space-between" style={{ width: '100%' }}>
                            <Group style={{ flex: 1 }}>
                              {isSelectionMode && (
                                <Checkbox
                                  checked={selectedScripts.has(script.id)}
                                  onChange={() => toggleScriptSelection(script.id)}
                                  styles={{
                                    input: {
                                      '&:checked': {
                                        backgroundColor: '#00FFFF',
                                        borderColor: '#00FFFF'
                                      }
                                    }
                                  }}
                                />
                              )}
                            </Group>
                            {/* 来源标签 */}
                            <Badge
                              color={script.sourceType === 'ai' ? 'purple' : 'blue'}
                              variant="filled"
                              size="sm"
                              style={{
                                backgroundColor: script.sourceType === 'ai' ? '#8B5CF6' : '#3B82F6',
                                color: '#FFFFFF',
                                fontWeight: '600',
                                backdropFilter: 'blur(2px)',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
                              }}
                            >
                              {script.sourceType === 'ai' ? '🤖 AI' : '✏️ 手动'}
                            </Badge>
                          </Group>

                          {/* 左上角三角形更换封面按钮 */}
                          <div style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: 0,
                            height: 0,
                            borderTop: '60px solid rgba(0, 194, 255, 0.9)',
                            borderRight: '60px solid transparent',
                            cursor: 'pointer',
                            zIndex: 10
                          }} onClick={() => handleSelectCover(script)}>
                            <div style={{
                              position: 'absolute',
                              top: '-50px',
                              left: '8px',
                              color: '#FFFFFF',
                              fontSize: '12px',
                              fontWeight: 'bold',
                              textShadow: '0 1px 2px rgba(0,0,0,0.8)',
                              transform: 'rotate(-45deg)',
                              transformOrigin: 'center'
                            }}>
                              🔄
                            </div>
                          </div>
                          
                          {/* 底部：标题和生成封面按钮 */}
                          <div style={{ width: '100%' }}>
                            <Title order={4} c="white" lineClamp={2} style={{ 
                              textShadow: '0 2px 8px rgba(0,0,0,0.9), 0 0 20px rgba(0,0,0,0.7)',
                              marginBottom: '8px',
                              backgroundColor: 'rgba(0,0,0,0.3)',
                              padding: '4px 8px',
                              borderRadius: '4px',
                              backdropFilter: 'blur(2px)'
                            }}>
                              {script.title}
                            </Title>
                          </div>
                        </div>
                      </Card.Section>

                      {/* 内容区域 */}
                      <div style={{ padding: '16px' }}>
                        <Stack gap="sm">
                          <Tooltip
                            label={script.description}
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
                              {script.description}
                            </Text>
                          </Tooltip>

                          <Group justify="space-between">
                            <Badge color={getDifficultyColor(script.settings.difficulty)}>
                              {script.settings.difficulty === 'easy' ? '简单' : 
                               script.settings.difficulty === 'medium' ? '中等' : '困难'}
                            </Badge>
                            <Text size="xs" c="dimmed">
                              {stats.estimatedWords} 字
                            </Text>
                          </Group>

                          <Group justify="space-between">
                            <Text size="xs" c="dimmed">
                              作者: {script.author}
                            </Text>
                            <Text size="xs" c="dimmed">
                              {stats.characterCount} 个角色
                            </Text>
                          </Group>

                          <Text size="xs" c="dimmed">
                            更新于: {stats.lastUpdated}
                          </Text>

                          {/* 质检报告状态指示 */}
                          <Group gap="xs" mt="xs" wrap="nowrap">
                            <Badge
                              color={script.settings?.qualityReport ? "cyan" : "red"}
                              variant="light"
                              size="sm"
                              style={{
                                backgroundColor: script.settings?.qualityReport 
                                  ? 'rgba(0, 255, 255, 0.1)' 
                                  : 'rgba(255, 0, 0, 0.1)',
                                border: script.settings?.qualityReport 
                                  ? '1px solid #00FFFF' 
                                  : '1px solid #FF4444',
                                color: script.settings?.qualityReport 
                                  ? '#00FFFF' 
                                  : '#FF4444'
                              }}
                            >
                              🔎 {script.settings?.qualityReport ? '已质检' : '未质检'}
                            </Badge>
                            
                            {/* 质检评分显示 */}
                            {script.settings?.qualityReport && (
                              <QualityScoreBadge 
                                qualityReport={script.settings.qualityReport} 
                                compact={true} 
                              />
                            )}
                          </Group>

                        {!isSelectionMode && (
                          <Group mt="md" gap="xs" wrap="nowrap">
                            <Button
                              variant="light"
                              size="xs"
                              onClick={() => handlePlay(script)}
                              leftSection="▶️"
                              styles={{
                                root: { 
                                  flex: 1,
                                  fontSize: '11px',
                                  padding: '4px 8px',
                                  minWidth: 0
                                }
                              }}
                            >
                              开始游戏
                            </Button>
                            <Button
                              variant="light"
                              size="xs"
                              color="orange"
                              onClick={() => handleEdit(script)}
                              leftSection="✏️"
                              styles={{
                                root: { 
                                  flex: 1,
                                  fontSize: '11px',
                                  padding: '4px 8px',
                                  minWidth: 0
                                }
                              }}
                            >
                              编辑
                            </Button>
                            <Button
                              variant="light"
                              size="xs"
                              color="green"
                              onClick={() => handleExport(script)}
                              leftSection="📁"
                              styles={{
                                root: { 
                                  flex: 1,
                                  fontSize: '11px',
                                  padding: '4px 8px',
                                  minWidth: 0
                                }
                              }}
                            >
                              导出
                            </Button>
                            <Button
                              variant="light"
                              size="xs"
                              color="red"
                              onClick={() => handleDelete(script)}
                              leftSection="🗑️"
                              styles={{
                                root: { 
                                  flex: 1,
                                  fontSize: '11px',
                                  padding: '4px 8px',
                                  minWidth: 0
                                }
                              }}
                            >
                              删除
                            </Button>
                          </Group>
                        )}

                        {/* 质检报告按钮区域 */}
                        {!isSelectionMode && (
                          <Group mt="xs" gap="xs">
                            {script.settings?.qualityReport ? (
                              // 已质检：显示两个按钮
                              <>
                                <Button
                                  variant="outline"
                                  size="xs"
                                  color="cyan"
                                  onClick={() => handleViewQualityReport(script, false)}
                                  leftSection="📋"
                                  style={{ 
                                    flex: 1,
                                    borderColor: '#00FFFF',
                                    color: '#00FFFF',
                                    backgroundColor: 'rgba(0, 255, 255, 0.1)'
                                  }}
                                >
                                  查看报告
                                </Button>
                                <Button
                                  variant="outline"
                                  size="xs"
                                  color="orange"
                                  onClick={() => handleViewQualityReport(script, true)}
                                  leftSection="🔄"
                                  style={{ 
                                    flex: 1,
                                    borderColor: '#FFB74D',
                                    color: '#FFB74D',
                                    backgroundColor: 'rgba(255, 183, 77, 0.1)'
                                  }}
                                >
                                  重新质检
                                </Button>
                              </>
                            ) : (
                              // 未质检：显示单个按钮
                              <Button
                                variant="outline"
                                size="xs"
                                color="cyan"
                                onClick={() => handleViewQualityReport(script)}
                                leftSection="🔎"
                                fullWidth
                                style={{
                                  borderColor: '#00FFFF',
                                  color: '#00FFFF',
                                  backgroundColor: 'rgba(0, 255, 255, 0.1)'
                                }}
                              >
                                生成质检报告
                              </Button>
                            )}
                          </Group>
                        )}
                        </Stack>
                      </div>
                    </Card>
                  </Grid.Col>
                );
              })}
            </Grid>
          )}
          
          {/* 分页组件 - 只有在有剧本且需要分页时显示 */}
          {allFilteredScripts.length > 0 && totalPages > 1 && (
            <Center mt="xl">
              <Stack gap="md" align="center">
                <Pagination
                  value={currentPage}
                  onChange={setCurrentPage}
                  total={totalPages}
                  size="md"
                  styles={{
                    control: {
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid #00C2FF',
                      color: '#FFFFFF',
                      '&[dataActive]': {
                        backgroundColor: '#00C2FF',
                        borderColor: '#00C2FF',
                        color: '#000000',
                        fontWeight: 'bold'
                      },
                      '&:hover:not([dataActive])': {
                        backgroundColor: 'rgba(0, 194, 255, 0.1)',
                        borderColor: '#4ECCA3',
                        color: '#4ECCA3'
                      }
                    }
                  }}
                />
                <Text size="sm" c="dimmed" ta="center">
                  第 {currentPage} 页，共 {totalPages} 页 | 显示 {filteredScripts.length} / {allFilteredScripts.length} 个剧本
                </Text>
              </Stack>
            </Center>
          )}
        </Container>
      </AppShell.Main>

      {/* 删除确认模态框 */}
      <Modal
        opened={deleteModalOpened}
        onClose={() => setDeleteModalOpened(false)}
        title={
          <Group gap="sm">
            <div style={{
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #FF6B6B, #FF5252)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 15px rgba(255, 107, 107, 0.4)'
            }}>
              🗑️
            </div>
            <Text size="lg" fw={700} style={{ color: '#FF6B6B' }}>
              确认删除
            </Text>
          </Group>
        }
        centered
        size="md"
        radius="lg"
        styles={{
          content: { 
            background: 'linear-gradient(135deg, rgba(26, 26, 62, 0.98) 0%, rgba(15, 32, 39, 0.98) 100%)',
            border: '1px solid rgba(0, 194, 255, 0.3)',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), 0 0 20px rgba(0, 194, 255, 0.2)'
          },
          header: { 
            background: 'linear-gradient(135deg, rgba(10, 10, 35, 0.95) 0%, rgba(26, 26, 62, 0.95) 100%)',
            borderBottom: '1px solid rgba(0, 194, 255, 0.3)',
            borderRadius: '12px 12px 0 0'
          },
          title: { color: '#FFFFFF' },
          close: { 
            color: '#87CEEB',
            '&:hover': {
              backgroundColor: 'rgba(135, 206, 235, 0.1)',
              color: '#00C2FF'
            }
          }
        }}
      >
        <div style={{ padding: '8px 0' }}>
          <Group gap="md" mb="lg">
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, rgba(255, 107, 107, 0.2), rgba(255, 82, 82, 0.1))',
              border: '2px solid rgba(255, 107, 107, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px'
            }}>
              ⚠️
            </div>
            <div style={{ flex: 1 }}>
              <Text size="md" style={{ color: '#FFFFFF', marginBottom: '4px' }}>
                确定要删除剧本吗？
              </Text>
              <Text size="lg" fw={600} style={{ 
                color: '#00C2FF',
                textShadow: '0 0 10px rgba(0, 194, 255, 0.5)'
              }}>
                "{scriptToDelete?.title}"
              </Text>
              <Text size="sm" style={{ color: '#FF6B6B', marginTop: '8px' }}>
                ⚠️ 此操作无法撤销，请谨慎操作
              </Text>
            </div>
          </Group>
          
          <Group justify="flex-end" gap="md">
            <Button 
              variant="outline" 
              onClick={() => setDeleteModalOpened(false)}
              styles={{
                root: {
                  borderColor: 'rgba(135, 206, 235, 0.5)',
                  color: '#87CEEB',
                  backgroundColor: 'transparent',
                  '&:hover': {
                    backgroundColor: 'rgba(135, 206, 235, 0.1)',
                    borderColor: '#00C2FF',
                    color: '#00C2FF',
                    transform: 'translateY(-1px)',
                    boxShadow: '0 4px 15px rgba(0, 194, 255, 0.2)'
                  }
                }
              }}
            >
              取消
            </Button>
            <Button 
              onClick={confirmDelete}
              styles={{
                root: {
                  background: 'linear-gradient(135deg, #FF6B6B, #FF5252)',
                  border: '1px solid #FF6B6B',
                  color: '#FFFFFF',
                  fontWeight: '700',
                  boxShadow: '0 0 15px rgba(255, 107, 107, 0.4)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #FF5252, #F44336)',
                    boxShadow: '0 0 20px rgba(255, 107, 107, 0.6)',
                    transform: 'translateY(-1px)'
                  }
                }
              }}
            >
              确认删除
            </Button>
          </Group>
        </div>
      </Modal>

      {/* 批量删除确认模态框 */}
      <Modal
        opened={batchDeleteModalOpened}
        onClose={() => setBatchDeleteModalOpened(false)}
        title={
          <Group gap="sm">
            <div style={{
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #FF6B6B, #FF5252)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 15px rgba(255, 107, 107, 0.4)'
            }}>
              🗂️
            </div>
            <Text size="lg" fw={700} style={{ color: '#FF6B6B' }}>
              批量删除确认
            </Text>
          </Group>
        }
        centered
        size="lg"
        radius="lg"
        styles={{
          content: { 
            background: 'linear-gradient(135deg, rgba(26, 26, 62, 0.98) 0%, rgba(15, 32, 39, 0.98) 100%)',
            border: '1px solid rgba(0, 194, 255, 0.3)',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), 0 0 20px rgba(0, 194, 255, 0.2)'
          },
          header: { 
            background: 'linear-gradient(135deg, rgba(10, 10, 35, 0.95) 0%, rgba(26, 26, 62, 0.95) 100%)',
            borderBottom: '1px solid rgba(0, 194, 255, 0.3)',
            borderRadius: '12px 12px 0 0'
          },
          title: { color: '#FFFFFF' },
          close: { 
            color: '#87CEEB',
            '&:hover': {
              backgroundColor: 'rgba(135, 206, 235, 0.1)',
              color: '#00C2FF'
            }
          }
        }}
      >
        <div style={{ padding: '8px 0' }}>
          <Group gap="md" mb="lg" align="flex-start">
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, rgba(255, 107, 107, 0.2), rgba(255, 82, 82, 0.1))',
              border: '2px solid rgba(255, 107, 107, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px',
              flexShrink: 0
            }}>
              ⚠️
            </div>
            <div style={{ flex: 1 }}>
              <Text size="md" style={{ color: '#FFFFFF', marginBottom: '8px' }}>
                确定要删除选中的 
                <span style={{ 
                  color: '#00C2FF', 
                  fontWeight: '700',
                  textShadow: '0 0 10px rgba(0, 194, 255, 0.5)',
                  margin: '0 4px'
                }}>
                  {selectedScripts.size}
                </span> 
                个剧本吗？
              </Text>
              <Text size="sm" style={{ color: '#FF6B6B', marginBottom: '16px' }}>
                ⚠️ 此操作无法撤销，请谨慎操作
              </Text>
              
              <Text size="sm" style={{ color: '#87CEEB', marginBottom: '8px' }}>
                将要删除的剧本：
              </Text>
              <div style={{ 
                maxHeight: '200px', 
                overflowY: 'auto',
                border: '1px solid rgba(0, 194, 255, 0.2)',
                borderRadius: '8px',
                padding: '8px',
                background: 'rgba(0, 0, 0, 0.2)'
              }}>
                <Stack gap="xs">
                  {filteredScripts
                    .filter(script => selectedScripts.has(script.id))
                    .map(script => (
                      <div key={script.id} style={{ 
                        padding: '8px 12px', 
                        background: 'linear-gradient(135deg, rgba(255, 107, 107, 0.15), rgba(255, 82, 82, 0.1))', 
                        border: '1px solid rgba(255, 107, 107, 0.3)',
                        borderRadius: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}>
                        <span style={{ color: '#FF6B6B', fontSize: '14px' }}>🗑️</span>
                        <Text size="sm" style={{ color: '#FFFFFF', flex: 1 }}>
                          {script.title}
                        </Text>
                        <Badge 
                          size="xs" 
                          color={script.sourceType === 'ai' ? 'purple' : 'blue'}
                          variant="filled"
                        >
                          {script.sourceType === 'ai' ? 'AI' : '手动'}
                        </Badge>
                      </div>
                    ))
                  }
                </Stack>
              </div>
            </div>
          </Group>
          
          <Group justify="flex-end" gap="md">
            <Button 
              variant="outline" 
              onClick={() => setBatchDeleteModalOpened(false)}
              styles={{
                root: {
                  borderColor: 'rgba(135, 206, 235, 0.5)',
                  color: '#87CEEB',
                  backgroundColor: 'transparent',
                  '&:hover': {
                    backgroundColor: 'rgba(135, 206, 235, 0.1)',
                    borderColor: '#00C2FF',
                    color: '#00C2FF',
                    transform: 'translateY(-1px)',
                    boxShadow: '0 4px 15px rgba(0, 194, 255, 0.2)'
                  }
                }
              }}
            >
              取消
            </Button>
            <Button 
              onClick={confirmBatchDelete}
              styles={{
                root: {
                  background: 'linear-gradient(135deg, #FF6B6B, #FF5252)',
                  border: '1px solid #FF6B6B',
                  color: '#FFFFFF',
                  fontWeight: '700',
                  boxShadow: '0 0 15px rgba(255, 107, 107, 0.4)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #FF5252, #F44336)',
                    boxShadow: '0 0 20px rgba(255, 107, 107, 0.6)',
                    transform: 'translateY(-1px)'
                  }
                }
              }}
            >
              确认删除 {selectedScripts.size} 个剧本
            </Button>
          </Group>
        </div>
      </Modal>

      {/* 未选择提示模态框 */}
      <Modal
        opened={noSelectionModalOpened}
        onClose={() => setNoSelectionModalOpened(false)}
        title="提示"
        centered
      >
        <Text mb="md">
          请先选择要操作的剧本。
        </Text>
        <Group justify="flex-end">
          <Button onClick={() => setNoSelectionModalOpened(false)}>
            确定
          </Button>
        </Group>
      </Modal>

      {/* 导出成功提示模态框 */}
      <Modal
        opened={exportSuccessModalOpened}
        onClose={() => setExportSuccessModalOpened(false)}
        title="导出成功"
        centered
      >
        <Text mb="md">
          已成功导出 <strong>{exportedCount}</strong> 个剧本！
        </Text>
        <Group justify="flex-end">
          <Button onClick={() => setExportSuccessModalOpened(false)}>
            确定
          </Button>
        </Group>
      </Modal>

      {/* 封面选择Modal */}
      {selectedScriptForCover && (
        <CoverSelectionModal
          opened={coverSelectionModalOpened}
          onClose={() => {
            setCoverSelectionModalOpened(false);
            setSelectedScriptForCover(null);
          }}
          script={selectedScriptForCover}
          onCoverSelected={handleCoverSelected}
        />
      )}

      {/* 质检报告Modal */}
      {selectedScriptForQualityCheck && (
        <QualityCheckModal
          opened={qualityCheckModalOpened}
          onClose={() => {
            setQualityCheckModalOpened(false);
            setForceRegenerate(false);
            setSelectedScriptForQualityCheck(null);
            // 质检完成后若有报告，立即保存
            if (selectedScriptForQualityCheck.settings?.qualityReport) {
              updateScript(selectedScriptForQualityCheck);
            }
          }}
          script={selectedScriptForQualityCheck}
          forceRegenerate={forceRegenerate}
        />
      )}

      {/* 重新质检确认对话框 */}
      <Modal
        opened={recheckConfirmModalOpened}
        onClose={() => {
          setRecheckConfirmModalOpened(false);
          setScriptToRecheck(null);
        }}
        title={
          <Group gap="sm">
            <div style={{
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #FFB74D, #FF9800)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 15px rgba(255, 183, 77, 0.4)'
            }}>
              🔄
            </div>
            <Text size="lg" fw={700} style={{ color: '#FFB74D' }}>
              确认重新质检
            </Text>
          </Group>
        }
        centered
        size="md"
        radius="lg"
        styles={{
          content: { 
            background: 'linear-gradient(135deg, rgba(26, 26, 62, 0.98) 0%, rgba(15, 32, 39, 0.98) 100%)',
            border: '1px solid rgba(0, 194, 255, 0.3)',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), 0 0 20px rgba(0, 194, 255, 0.2)'
          },
          header: { 
            background: 'linear-gradient(135deg, rgba(10, 10, 35, 0.95) 0%, rgba(26, 26, 62, 0.95) 100%)',
            borderBottom: '1px solid rgba(0, 194, 255, 0.3)',
            borderRadius: '12px 12px 0 0'
          },
          title: { color: '#FFFFFF' },
          close: { 
            color: '#87CEEB',
            '&:hover': {
              backgroundColor: 'rgba(135, 206, 235, 0.1)',
              color: '#00C2FF'
            }
          }
        }}
      >
        <div style={{ padding: '8px 0' }}>
          <Group gap="md" mb="lg">
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, rgba(255, 183, 77, 0.2), rgba(255, 152, 0, 0.1))',
              border: '2px solid rgba(255, 183, 77, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px'
            }}>
              ⚠️
            </div>
            <div style={{ flex: 1 }}>
              <Text size="md" style={{ color: '#FFFFFF', marginBottom: '4px' }}>
                确定要重新生成质检报告吗？
              </Text>
              <Text size="lg" fw={600} style={{ 
                color: '#00C2FF',
                textShadow: '0 0 10px rgba(0, 194, 255, 0.5)'
              }}>
                "{scriptToRecheck?.title}"
              </Text>
              <Text size="sm" style={{ color: '#FFB74D', marginTop: '8px' }}>
                ⚠️ 现有的质检报告将被覆盖，此操作无法撤销
              </Text>
              <Text size="xs" style={{ color: '#87CEEB', marginTop: '4px' }}>
                重新质检将花费一定时间，请确认是否继续
              </Text>
            </div>
          </Group>
          
          <Group justify="flex-end" gap="md">
            <Button 
              variant="outline" 
              onClick={() => {
                setRecheckConfirmModalOpened(false);
                setScriptToRecheck(null);
              }}
              styles={{
                root: {
                  borderColor: 'rgba(135, 206, 235, 0.5)',
                  color: '#87CEEB',
                  backgroundColor: 'transparent',
                  '&:hover': {
                    backgroundColor: 'rgba(135, 206, 235, 0.1)',
                    borderColor: '#00C2FF',
                    color: '#00C2FF',
                    transform: 'translateY(-1px)',
                    boxShadow: '0 4px 15px rgba(0, 194, 255, 0.2)'
                  }
                }
              }}
            >
              取消
            </Button>
            <Button 
              onClick={confirmRecheck}
              styles={{
                root: {
                  background: 'linear-gradient(135deg, #FFB74D, #FF9800)',
                  border: '1px solid #FFB74D',
                  color: '#FFFFFF',
                  fontWeight: '700',
                  boxShadow: '0 0 15px rgba(255, 183, 77, 0.4)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #FF9800, #F57C00)',
                    boxShadow: '0 0 20px rgba(255, 183, 77, 0.6)',
                    transform: 'translateY(-1px)'
                  }
                }
              }}
            >
              确认重新质检
            </Button>
          </Group>
        </div>
      </Modal>
    </AppShell>
  );
};

export default ScriptLibrary;
