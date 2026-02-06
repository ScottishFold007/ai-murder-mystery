import React, { useState, useEffect } from 'react';
import { 
  Title, 
  Paper, 
  Text, 
  Group, 
  Stack, 
  ScrollArea, 
  Divider,
  Card,
  Badge,
  ActionIcon,
  TextInput,
  Box
} from '@mantine/core';
import { IconBook, IconSearch, IconExternalLink, IconFile } from '@tabler/icons-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import './DocsViewer.css';

interface DocumentMeta {
  name: string;
  title: string;
  category: string;
  description: string;
  lastModified?: string;
}

// 文档元数据配置
const DOCS_METADATA: DocumentMeta[] = [
  {
    name: 'README.md',
    title: '文档目录',
    category: '📋 总览',
    description: '项目文档索引和分类导航'
  },
  {
    name: 'USAGE_GUIDE.md',
    title: '使用指南',
    category: '🎮 核心功能',
    description: '项目基本使用方法和操作说明'
  },
  {
    name: 'GAMEPLAY_MECHANICS_README.md',
    title: '游戏机制',
    category: '🎮 核心功能',
    description: '详细的游戏机制和玩法说明'
  },
  {
    name: 'EVIDENCE_SYSTEM_GUIDE.md',
    title: '证物系统',
    category: '🎮 核心功能',
    description: '证物系统的完整架构和使用指南'
  },
  {
    name: 'CODE_CLEANUP_REPORT.md',
    title: '代码清理报告',
    category: '🛠️ 开发维护',
    description: '最新的代码清理和重构报告'
  },
  {
    name: 'STATIC_FILES_SETUP.md',
    title: '静态文件配置',
    category: '🛠️ 开发维护',
    description: '静态文件系统的配置和管理'
  },
  {
    name: 'STORAGE_SYSTEM_README.md',
    title: '存储系统',
    category: '🛠️ 开发维护',
    description: '数据存储架构和管理系统'
  },
  {
    name: 'CONTEXT_MECHANISM.md',
    title: '上下文机制',
    category: '🛠️ 开发维护',
    description: '游戏上下文处理机制详解'
  },
  {
    name: 'AI_POLISH_FEATURE.md',
    title: 'AI优化功能',
    category: '✨ 功能特性',
    description: 'AI智能优化功能的实现和使用'
  },
  {
    name: 'SPOILER_FEATURE.md',
    title: '剧透功能',
    category: '✨ 功能特性',
    description: '剧透查看功能的设计和实现'
  },
  {
    name: 'QUALITY_CHECK_FEATURE_README.md',
    title: '质量检查',
    category: '✨ 功能特性',
    description: '剧本质量检查和评分系统'
  },
  {
    name: 'COVER_FEATURE_README.md',
    title: '封面生成',
    category: '✨ 功能特性',
    description: '自动封面生成功能说明'
  },
  {
    name: 'NOTES_FEATURE_README.md',
    title: '笔记功能',
    category: '✨ 功能特性',
    description: '游戏内笔记系统使用指南'
  },
  {
    name: 'SCRIPT_EDITOR_README.md',
    title: '剧本编辑器',
    category: '✨ 功能特性',
    description: '剧本编辑器的功能和使用方法'
  },
  {
    name: 'CHAT_EVIDENCE_CARDS_AURORA_OPTIMIZATION.md',
    title: '聊天证物卡片优化',
    category: '🎯 专项优化',
    description: '聊天界面证物卡片的优化记录'
  },
  {
    name: 'VICTIM_EVIDENCE_FIX_README.md',
    title: '受害人证物修复',
    category: '🎯 专项优化',
    description: '受害人证物显示问题的修复方案'
  },
  {
    name: 'DELETE_STATE_FIX_README.md',
    title: '删除状态修复',
    category: '🎯 专项优化',
    description: '剧本删除状态管理的修复'
  },
  {
    name: 'PARTNER_CHARACTER_INFO_GUIDE.md',
    title: '合作角色指南',
    category: '🤝 协作集成',
    description: '多人协作角色信息管理指南'
  },
  {
    name: 'INTEGRATION_FEATURES.md',
    title: '集成功能',
    category: '🤝 协作集成',
    description: '系统集成和第三方功能说明'
  }
];

const DocsViewer: React.FC = () => {
  const [selectedDoc, setSelectedDoc] = useState<string>('README.md');
  const [docContent, setDocContent] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filteredDocs, setFilteredDocs] = useState<DocumentMeta[]>(DOCS_METADATA);

  // 搜索过滤
  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = DOCS_METADATA.filter(doc => 
        doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredDocs(filtered);
    } else {
      setFilteredDocs(DOCS_METADATA);
    }
  }, [searchQuery]);

  // 加载文档内容
  const loadDocument = async (docName: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/docs/${docName}`);
      if (response.ok) {
        const content = await response.text();
        setDocContent(content);
      } else {
        setDocContent(`# 文档加载失败\n\n无法加载文档 ${docName}，请检查文件是否存在。`);
      }
    } catch (error) {
      console.error('加载文档失败:', error);
      setDocContent(`# 文档加载失败\n\n加载文档时发生错误: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  // 初始加载
  useEffect(() => {
    loadDocument(selectedDoc);
  }, [selectedDoc]);

  // 按类别分组文档
  const groupedDocs = filteredDocs.reduce((acc, doc) => {
    const category = doc.category;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(doc);
    return acc;
  }, {} as Record<string, DocumentMeta[]>);

  return (
    <div style={{ 
      height: 'calc(100vh - 80px)', 
      background: 'linear-gradient(135deg, #0F0F23 0%, #1A1A2E 50%, #16213E 100%)',
      padding: '20px',
      display: 'flex',
      gap: '20px'
    }}>
      {/* 左侧文档列表 */}
      <div style={{ 
        width: '350px',
        height: '100%',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <Paper
          p="lg"
          style={{ 
            height: '100%', 
            background: 'rgba(0, 0, 0, 0.4)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(0, 255, 255, 0.3)',
            borderRadius: '12px',
            boxShadow: '0 8px 32px rgba(0, 255, 255, 0.1)',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          <Group mb="md">
            <IconBook size={24} color="#00FFFF" />
            <Title order={3} style={{ color: '#00FFFF' }}>
              项目文档
            </Title>
          </Group>

          <TextInput
            placeholder="搜索文档..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.currentTarget.value)}
            leftSection={<IconSearch size={16} />}
            mb="md"
            styles={{
              input: {
                background: 'rgba(0, 255, 255, 0.1)',
                border: '1px solid rgba(0, 255, 255, 0.3)',
                color: '#E0E0E0',
                '&::placeholder': { color: '#00FFFF', opacity: 0.7 }
              }
            }}
          />

          <ScrollArea style={{ flex: 1 }}>
            <Stack gap="md">
              {Object.entries(groupedDocs).map(([category, docs]) => (
                <Box key={category}>
                  <Text
                    size="sm"
                    fw={600}
                    c="#4ECCA3"
                    mb="xs"
                    style={{
                      borderBottom: '1px solid rgba(78, 204, 163, 0.3)',
                      paddingBottom: '4px'
                    }}
                  >
                    {category}
                  </Text>
                  <Stack gap="xs">
                    {docs.map((doc) => (
                      <Card
                        key={doc.name}
                        p="xs"
                        onClick={() => setSelectedDoc(doc.name)}
                        style={{
                          cursor: 'pointer',
                          background: selectedDoc === doc.name 
                            ? 'rgba(0, 255, 255, 0.15)' 
                            : 'rgba(0, 0, 0, 0.3)',
                          border: selectedDoc === doc.name 
                            ? '1px solid #00FFFF' 
                            : '1px solid rgba(78, 204, 163, 0.2)',
                          borderRadius: '8px',
                          transition: 'all 0.3s ease'
                        }}
                      >
                        <Group justify="space-between" align="flex-start">
                          <Box style={{ flex: 1 }}>
                            <Text
                              size="xs"
                              fw={selectedDoc === doc.name ? 600 : 500}
                              c={selectedDoc === doc.name ? '#00FFFF' : '#E0E0E0'}
                              mb={1}
                              style={{
                                textShadow: selectedDoc === doc.name ? '0 0 5px rgba(0, 255, 255, 0.3)' : 'none'
                              }}
                            >
                              {doc.title}
                            </Text>
                            <Text size="xs" c="dimmed" lineClamp={1} style={{ fontSize: '11px' }}>
                              {doc.description}
                            </Text>
                          </Box>
                          <ActionIcon
                            size="sm"
                            variant="subtle"
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(`/docs/${doc.name}`, '_blank');
                            }}
                          >
                            <IconExternalLink size={12} />
                          </ActionIcon>
                        </Group>
                      </Card>
                    ))}
                  </Stack>
                </Box>
              ))}
            </Stack>
          </ScrollArea>
        </Paper>
      </div>

      {/* 右侧文档内容 */}
      <div style={{ flex: 1, height: '100%' }}>
        <Paper
          p="lg"
          style={{ 
            height: '100%', 
            background: 'rgba(0, 0, 0, 0.3)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(78, 204, 163, 0.3)',
            borderRadius: '12px',
            boxShadow: '0 8px 32px rgba(78, 204, 163, 0.1)',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          <Group mb="md" justify="space-between">
            <Group>
              <IconFile size={20} color="#4ECCA3" />
              <Text fw={600} c="#E0E0E0">
                {DOCS_METADATA.find(doc => doc.name === selectedDoc)?.title || selectedDoc}
              </Text>
            </Group>
            <Badge variant="light" color="cyan" size="sm">
              Markdown
            </Badge>
          </Group>

          <Divider mb="md" color="rgba(255, 255, 255, 0.1)" />

          <ScrollArea style={{ flex: 1 }}>
            {loading ? (
              <Box ta="center" py="xl">
                <Text c="dimmed">加载中...</Text>
              </Box>
            ) : (
              <div className="docs-content">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {docContent}
                </ReactMarkdown>
              </div>
            )}
          </ScrollArea>
        </Paper>
      </div>
    </div>
  );
};

export default DocsViewer;