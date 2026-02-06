import React, { useState, useEffect } from 'react';
import {
  Modal,
  Stack,
  Group,
  Button,
  Text,
  Tabs,
  TextInput,
  Textarea,
  FileInput,
  Grid,
  Card,
  Image,
  Alert,
  Loader,
  Badge,
  ScrollArea,
  Checkbox
} from '@mantine/core';
import { Script } from '../types/script';
import { 
  generateScriptCover, 
  uploadScriptCover, 
  fileToBase64, 
  deleteCoverImages,
  CoverImageInfo 
} from '../api/coverGenerator';

interface CoverSelectionModalProps {
  opened: boolean;
  onClose: () => void;
  script: Script;
  onCoverSelected: (coverData: string) => void;
}

const CoverSelectionModal: React.FC<CoverSelectionModalProps> = ({
  opened,
  onClose,
  script,
  onCoverSelected
}) => {
  const [activeTab, setActiveTab] = useState<string>('ai');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // AI生成相关状态
  const [aiTitle, setAiTitle] = useState(script.title);
  const [aiDescription, setAiDescription] = useState(script.description);
  
  // 本地上传相关状态
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  
  // 系统库相关状态
  const [libraryImages, setLibraryImages] = useState<CoverImageInfo[]>([]);
  const [selectedLibraryImage, setSelectedLibraryImage] = useState<string | null>(null);
  const [libraryLoading, setLibraryLoading] = useState(false);
  
  // 批量删除相关状态
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set());
  const [batchMode, setBatchMode] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // 加载系统库图片（使用与证物系统一致的API设计）
  const loadLibraryImages = async (forceReload = false) => {
    setLibraryLoading(true);
    setError(null); // 清除之前的错误
    try {
      // 使用新的统一API端点获取剧本封面列表
      const response = await fetch('http://localhost:10000/script-covers');
      
      if (response.ok) {
        const data = await response.json();
        const images = (data.images || []).map((filename: string) => ({
          filename,
          path: `/script_covers/${filename}`,
          size: 0 // 静态文件服务不提供文件大小信息
        }));
        setLibraryImages(images);
        console.log(`📚 ${forceReload ? '刷新' : '加载'}封面图库成功: ${images.length} 个图片`);
      } else {
        setError('加载封面图库失败');
        console.error('❌ 封面图库加载失败:', response.status);
      }
    } catch (err) {
      setError('加载封面图库异常');
      console.error('❌ 封面图库加载异常:', err);
    } finally {
      setLibraryLoading(false);
    }
  };

  // 当切换到系统库标签时加载图片
  useEffect(() => {
    if (activeTab === 'library' && libraryImages.length === 0) {
      loadLibraryImages();
    }
  }, [activeTab, libraryImages.length]);

  // AI生成封面
  const handleAIGenerate = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await generateScriptCover(aiTitle, aiDescription);
      
      if (result.success && result.base64_image) {
        const coverData = `data:image/png;base64,${result.base64_image}`;
        onCoverSelected(coverData);
        onClose();
      } else {
        setError(result.message || '封面生成失败');
      }
    } catch (err) {
      setError('封面生成异常，请重试');
    } finally {
      setLoading(false);
    }
  };

  // 本地上传封面
  const handleLocalUpload = async () => {
    if (!uploadFile) {
      setError('请选择要上传的图片文件');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const base64 = await fileToBase64(uploadFile);
      const result = await uploadScriptCover(script.id, base64, uploadFile.name);
      
      if (result.success && result.base64_image) {
        const coverData = `data:image/png;base64,${result.base64_image}`;
        onCoverSelected(coverData);
        onClose();
      } else {
        setError(result.message || '封面上传失败');
      }
    } catch (err) {
      setError('封面上传异常，请重试');
    } finally {
      setLoading(false);
    }
  };

  // 从系统库选择封面
  const handleLibrarySelect = async () => {
    if (!selectedLibraryImage) {
      setError('请选择一个封面图片');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      // 直接使用静态文件路径，无需API调用（与证物系统保持一致）
      const staticPath = `/script_covers/${selectedLibraryImage}`;
      console.log('📸 使用静态文件路径:', staticPath);
      
      onCoverSelected(staticPath);
      onClose();
    } catch (err) {
      console.error('❌ 系统库选择封面异常:', err);
      setError(`选择封面异常: ${err instanceof Error ? err.message : '未知错误'}`);
    } finally {
      setLoading(false);
    }
  };

  // 批量删除封面图片
  const handleBatchDelete = async () => {
    if (selectedImages.size === 0) {
      setError('请选择要删除的图片');
      return;
    }

    const filenames = Array.from(selectedImages);
    setDeleteLoading(true);
    setError(null);
    
    try {
      
      const result = await deleteCoverImages(filenames);
      
      if (result.success) {
        
        // 从本地状态中移除已删除的图片
        setLibraryImages(prev => prev.filter(img => !filenames.includes(img.filename)));
        
        // 清空选择状态
        setSelectedImages(new Set());
        setBatchMode(false);
        
        // 如果当前选中的图片被删除了，清空选中状态
        if (selectedLibraryImage && filenames.includes(selectedLibraryImage)) {
          setSelectedLibraryImage(null);
        }
        
        setError(null);
      } else {
        setError(`批量删除失败: ${result.message}`);
      }
    } catch (err) {
      console.error('❌ 批量删除异常:', err);
      setError(`批量删除异常: ${err instanceof Error ? err.message : '未知错误'}`);
    } finally {
      setDeleteLoading(false);
    }
  };

  // 切换批量模式
  const toggleBatchMode = () => {
    setBatchMode(!batchMode);
    setSelectedImages(new Set());
    setSelectedLibraryImage(null);
  };

  // 切换单个图片的选择状态
  const toggleImageSelection = (filename: string) => {
    const newSelected = new Set(selectedImages);
    if (newSelected.has(filename)) {
      newSelected.delete(filename);
    } else {
      newSelected.add(filename);
    }
    setSelectedImages(newSelected);
  };

  // 全选/取消全选
  const toggleSelectAll = () => {
    if (selectedImages.size === libraryImages.length) {
      setSelectedImages(new Set());
    } else {
      setSelectedImages(new Set(libraryImages.map(img => img.filename)));
    }
  };

  // 重置状态
  const handleClose = () => {
    setError(null);
    setLoading(false);
    setDeleteLoading(false);
    setUploadFile(null);
    setSelectedLibraryImage(null);
    setSelectedImages(new Set());
    setBatchMode(false);
    setActiveTab('ai');
    // 不清空libraryImages，这样下次打开时还能看到之前加载的图片
    onClose();
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title="选择剧本封面"
      size="xl"
      centered
      styles={{
        content: {
          background: 'linear-gradient(135deg, rgba(10, 10, 35, 0.95) 0%, rgba(26, 26, 62, 0.95) 100%)',
          border: '2px solid rgba(0, 194, 255, 0.8)',
          borderRadius: '16px',
          boxShadow: '0 8px 32px rgba(0, 194, 255, 0.3)'
        },
        header: {
          background: 'linear-gradient(135deg, rgba(0, 194, 255, 0.1) 0%, rgba(135, 206, 235, 0.1) 100%)',
          borderBottom: '2px solid rgba(0, 194, 255, 0.8)'
        },
        title: {
          color: '#87CEEB',
          fontWeight: '700',
          textShadow: '0 0 20px rgba(0, 194, 255, 0.8)'
        }
      }}
    >
      <Stack gap="md">
        {error && (
          <Alert 
            color="red" 
            variant="outline"
            styles={{
              root: {
                backgroundColor: 'rgba(255, 0, 0, 0.1)',
                borderColor: '#FF6B6B',
                color: '#FFB3B3'
              },
              message: {
                color: '#FFB3B3'
              }
            }}
          >
            ❌ {error}
          </Alert>
        )}

        <Tabs value={activeTab} onChange={(value) => setActiveTab(value || 'ai')}>
          <Tabs.List>
            <Tabs.Tab 
              value="ai" 
              leftSection="🤖"
              c={activeTab === 'ai' ? '#00FFFF' : '#E0E0E0'}
              style={{
                borderColor: activeTab === 'ai' ? '#00FFFF' : 'transparent'
              }}
            >
              AI生成
            </Tabs.Tab>
            <Tabs.Tab 
              value="upload" 
              leftSection="📤"
              c={activeTab === 'upload' ? '#00FFFF' : '#E0E0E0'}
              style={{
                borderColor: activeTab === 'upload' ? '#00FFFF' : 'transparent'
              }}
            >
              本地上传
            </Tabs.Tab>
            <Tabs.Tab 
              value="library" 
              leftSection="📚"
              c={activeTab === 'library' ? '#00FFFF' : '#E0E0E0'}
              style={{
                borderColor: activeTab === 'library' ? '#00FFFF' : 'transparent'
              }}
            >
              系统库选择
            </Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="ai" pt="md">
            <Stack gap="md">
              <Text size="sm" c="#E0E0E0">
                基于剧本信息生成电影海报风格的封面图片
              </Text>
              
              <TextInput
                label="剧本标题"
                value={aiTitle}
                onChange={(e) => setAiTitle(e.currentTarget.value)}
                placeholder="输入剧本标题"
                styles={{
                  label: {
                    color: '#E0E0E0',
                    fontWeight: '500'
                  },
                  input: {
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid #00FFFF',
                    color: '#FFFFFF',
                    '&::placeholder': {
                      color: '#B0B0B0'
                    }
                  }
                }}
              />
              
              <Textarea
                label="剧本描述"
                value={aiDescription}
                onChange={(e) => setAiDescription(e.currentTarget.value)}
                placeholder="输入剧本描述，用于生成更准确的封面"
                rows={4}
                styles={{
                  label: {
                    color: '#E0E0E0',
                    fontWeight: '500'
                  },
                  input: {
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid #00FFFF',
                    color: '#FFFFFF',
                    '&::placeholder': {
                      color: '#B0B0B0'
                    }
                  }
                }}
              />
              
              <Group justify="flex-end">
                <Button
                  onClick={handleAIGenerate}
                  loading={loading}
                  disabled={!aiTitle.trim() || !aiDescription.trim()}
                  styles={{
                    root: {
                      background: 'linear-gradient(135deg, #00C2FF 0%, #87CEEB 100%)',
                      border: 'none',
                      color: '#000',
                      fontWeight: '600'
                    }
                  }}
                >
                  🎬 生成封面
                </Button>
              </Group>
            </Stack>
          </Tabs.Panel>

          <Tabs.Panel value="upload" pt="md">
            <Stack gap="md">
              <Text size="sm" c="#E0E0E0">
                上传本地图片作为剧本封面（支持 PNG, JPG, GIF 等格式）
              </Text>
              
              <FileInput
                label="选择图片文件"
                placeholder="点击选择图片文件"
                value={uploadFile}
                onChange={setUploadFile}
                accept="image/*"
                styles={{
                  label: {
                    color: '#E0E0E0',
                    fontWeight: '500'
                  },
                  input: {
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid #00FFFF',
                    color: '#FFFFFF',
                    '&::placeholder': {
                      color: '#B0B0B0'
                    }
                  }
                }}
              />
              
              {uploadFile && (
                <Text size="xs" c="#B0C4DE">
                  文件: {uploadFile.name} ({formatFileSize(uploadFile.size)})
                </Text>
              )}
              
              <Group justify="flex-end">
                <Button
                  onClick={handleLocalUpload}
                  loading={loading}
                  disabled={!uploadFile}
                  styles={{
                    root: {
                      background: 'linear-gradient(135deg, #00C2FF 0%, #87CEEB 100%)',
                      border: 'none',
                      color: '#000',
                      fontWeight: '600'
                    }
                  }}
                >
                  📤 上传封面
                </Button>
              </Group>
            </Stack>
          </Tabs.Panel>

          <Tabs.Panel value="library" pt="md">
            <Stack gap="md">
              <Group justify="space-between">
                <Text size="sm" c="#E0E0E0">
                  从系统封面库中选择一个图片作为剧本封面
                </Text>
                <Group gap="xs">
                  <Button
                    variant={batchMode ? "filled" : "subtle"}
                    size="xs"
                    onClick={toggleBatchMode}
                    styles={{
                      root: {
                        color: batchMode ? '#FFFFFF' : '#87CEEB',
                        backgroundColor: batchMode ? '#FF6B6B' : 'transparent',
                        '&:hover': {
                          backgroundColor: batchMode ? '#FF5252' : 'rgba(135, 206, 235, 0.1)'
                        }
                      }
                    }}
                  >
                    {batchMode ? '❌ 取消批量' : '📋 批量删除'}
                  </Button>
                  <Button
                    variant="subtle"
                    size="xs"
                    onClick={() => loadLibraryImages(true)}
                    loading={libraryLoading}
                    styles={{
                      root: {
                        color: '#87CEEB',
                        '&:hover': {
                          backgroundColor: 'rgba(135, 206, 235, 0.1)'
                        }
                      }
                    }}
                  >
                    🔄 刷新
                  </Button>
                </Group>
              </Group>
              
              {batchMode && (
                <Group justify="space-between" p="sm" style={{
                  backgroundColor: 'rgba(255, 107, 107, 0.1)',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 107, 107, 0.3)'
                }}>
                  <Group gap="md">
                    <Checkbox
                      checked={selectedImages.size === libraryImages.length && libraryImages.length > 0}
                      indeterminate={selectedImages.size > 0 && selectedImages.size < libraryImages.length}
                      onChange={toggleSelectAll}
                      label={`全选 (${selectedImages.size}/${libraryImages.length})`}
                      styles={{
                        label: { color: '#FFB3B3' },
                        input: {
                          backgroundColor: 'rgba(255, 255, 255, 0.1)',
                          borderColor: '#FF6B6B'
                        }
                      }}
                    />
                  </Group>
                  <Group gap="xs">
                    <Badge color="red" variant="filled" size="lg">
                      已选择: {selectedImages.size} 个
                    </Badge>
                    <Button
                      color="red"
                      size="sm"
                      onClick={handleBatchDelete}
                      loading={deleteLoading}
                      disabled={selectedImages.size === 0}
                      styles={{
                        root: {
                          backgroundColor: '#FF6B6B',
                          '&:hover': {
                            backgroundColor: '#FF5252'
                          },
                          '&:disabled': {
                            backgroundColor: 'rgba(255, 107, 107, 0.3)'
                          }
                        }
                      }}
                    >
                      🗑️ 删除选中 ({selectedImages.size})
                    </Button>
                  </Group>
                </Group>
              )}
              
              <ScrollArea h={400}>
                {libraryLoading ? (
                  <Group justify="center" py="xl">
                    <Loader size="md" />
                    <Text size="sm" c="#E0E0E0">加载封面库...</Text>
                  </Group>
                ) : libraryImages.length === 0 ? (
                  <Text size="sm" c="#E0E0E0" ta="center" py="xl">
                    封面库为空，请先上传一些图片
                  </Text>
                ) : (
                  <Grid>
                    {libraryImages.map((image) => {
                      const isSelected = batchMode ? selectedImages.has(image.filename) : selectedLibraryImage === image.filename;
                      const isInBatchSelection = selectedImages.has(image.filename);
                      
                      return (
                        <Grid.Col key={image.filename} span={4}>
                          <Card
                            shadow="sm"
                            padding="xs"
                            radius="md"
                            withBorder
                            style={{
                              cursor: 'pointer',
                              border: isSelected ? '2px solid #00FFFF' : 
                                      isInBatchSelection ? '2px solid #FF6B6B' : '1px solid #333',
                              backgroundColor: isSelected ? 'rgba(0, 255, 255, 0.1)' : 
                                             isInBatchSelection ? 'rgba(255, 107, 107, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                              position: 'relative'
                            }}
                            onClick={() => {
                              if (batchMode) {
                                toggleImageSelection(image.filename);
                              } else {
                                setSelectedLibraryImage(image.filename);
                              }
                            }}
                          >
                            {batchMode && (
                              <Checkbox
                                checked={selectedImages.has(image.filename)}
                                onChange={() => toggleImageSelection(image.filename)}
                                style={{
                                  position: 'absolute',
                                  top: '8px',
                                  left: '8px',
                                  zIndex: 10,
                                  backgroundColor: 'rgba(0, 0, 0, 0.7)',
                                  borderRadius: '4px',
                                  padding: '2px'
                                }}
                                styles={{
                                  input: {
                                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                    borderColor: '#FF6B6B'
                                  }
                                }}
                              />
                            )}
                            <Card.Section>
                              <Image
                                src={`/script_covers/${image.filename}`}
                                alt={image.filename}
                                height={120}
                                fit="cover"
                                fallbackSrc="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwIiBoZWlnaHQ9IjEyMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjY2NjIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtc2l6ZT0iMTgiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj7ml6DmrZXpooTop4E8L3RleHQ+PC9zdmc+"
                              />
                            </Card.Section>
                            <Stack gap="xs" mt="xs">
                              <Text size="xs" lineClamp={1} title={image.filename} c="#E0E0E0">
                                {image.filename}
                              </Text>
                              <Badge size="xs" variant="outline" color="cyan">
                                {formatFileSize(image.size)}
                              </Badge>
                            </Stack>
                          </Card>
                        </Grid.Col>
                      );
                    })}
                  </Grid>
                )}
              </ScrollArea>
              
              {!batchMode && (
                <Group justify="flex-end">
                  <Button
                    onClick={handleLibrarySelect}
                    loading={loading}
                    disabled={!selectedLibraryImage}
                    styles={{
                      root: {
                        background: 'linear-gradient(135deg, #00C2FF 0%, #87CEEB 100%)',
                        border: 'none',
                        color: '#000',
                        fontWeight: '600'
                      }
                    }}
                  >
                    📚 选择封面
                  </Button>
                </Group>
              )}
            </Stack>
          </Tabs.Panel>
        </Tabs>
      </Stack>
    </Modal>
  );
};

export default CoverSelectionModal;
