import React, { useState, useEffect } from 'react';
import {
  TextInput,
  Textarea,
  Button,
  Group,
  Stack,
  Text,
  ScrollArea,
  Badge,
  ActionIcon,
  Alert,
  Box,
  Tabs,
  Card
} from '@mantine/core';
import { 
  IconPlus, 
  IconTrash, 
  IconClock, 
  IconUser, 
  IconNotes,
  IconList,
  IconEditCircle
} from '@tabler/icons-react';
import { Note } from '../types/notes';
import {
  loadNotesFromStorage,
  saveNotesToStorage,
  createNote,
  updateNote,
  deleteNote,
  // getNotesByActor
} from '../utils/noteManager';

interface EnhancedNotesPanelProps {
  sessionId: string;
  currentActor?: string;
  currentActorId?: number;
}

const EnhancedNotesPanel: React.FC<EnhancedNotesPanelProps> = ({
  sessionId,
  currentActor,
  currentActorId
}) => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedActor, setSelectedActor] = useState<string>(currentActor || '');
  const [activeTab, setActiveTab] = useState<string>('list');

  // 加载笔记
  useEffect(() => {
    console.log('🔍 EnhancedNotesPanel - 加载笔记, sessionId:', sessionId, 'currentActor:', currentActor);
    // 加载全局笔记，按时间降序排列
    const loadedNotes = loadNotesFromStorage(sessionId)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    console.log('🔍 EnhancedNotesPanel - 加载的笔记:', loadedNotes);
    setNotes(loadedNotes);
    
    if (currentActor) {
      setSelectedActor(currentActor);
    }
  }, [sessionId, currentActor]);

  // 重置表单
  const resetForm = () => {
    setTitle('');
    setContent('');
    setEditingNote(null);
    setIsEditing(false);
    setSelectedActor(currentActor || '');
    setActiveTab('list');
  };

  // 保存笔记
  const handleSaveNote = () => {
    if (!content.trim() || !selectedActor.trim()) {
      return;
    }

    const updatedNotes = [...notes];

    if (isEditing && editingNote) {
      // 更新现有笔记
      const updatedNote = updateNote(editingNote.id, {
        title: title.trim() || `关于${selectedActor}的笔记`,
        content: content.trim()
      }, sessionId);
      
      if (updatedNote) {
        const index = updatedNotes.findIndex(n => n.id === editingNote.id);
        updatedNotes[index] = updatedNote;
        // 重新排序（按时间降序）
        const sortedNotes = updatedNotes
          .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
        setNotes(sortedNotes);
      }
    } else {
      // 创建新笔记
      const newNote = createNote(
        title.trim() || `关于${selectedActor}的笔记`,
        content.trim(),
        selectedActor,
        currentActorId || 0,
        sessionId
      );
      
      // 添加到笔记列表并重新排序（按时间降序）
      const sortedNotes = [...updatedNotes, newNote]
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      setNotes(sortedNotes);
      
      // 保存到localStorage
      saveNotesToStorage(sessionId, sortedNotes);
    }

    resetForm();
  };

  // 编辑笔记
  const handleEditNote = (note: Note) => {
    setEditingNote(note);
    setTitle(note.title);
    setContent(note.content);
    setSelectedActor(note.targetActor);
    setIsEditing(true);
    setActiveTab('edit');
  };

  // 删除笔记
  const handleDeleteNote = (noteId: string) => {
    if (deleteNote(noteId, sessionId)) {
      const filteredNotes = notes.filter(note => note.id !== noteId);
      setNotes(filteredNotes);
    }
  };

  // 取消编辑
  const handleCancel = () => {
    resetForm();
  };

  // 新建笔记
  const handleNewNote = () => {
    resetForm();
    setActiveTab('edit');
  };

  // 格式化时间
  const formatTime = (dateString: string): string => {
    return new Date(dateString).toLocaleString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // 获取角色列表
  const getActorList = (): string[] => {
    const actors = new Set(notes.map(note => note.targetActor));
    return Array.from(actors).sort();
  };

  // 受害人信息已移至证物库展示

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* 标题和新建按钮 */}
      <Group justify="space-between" align="center" mb="md">
        <Group gap="xs">
          <IconNotes size={20} color="#87CEEB" />
        <Text
          style={{
            fontSize: '18px',
            color: '#87CEEB',
            fontWeight: '700',
            textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)'
          }}
        >
          推理笔记
        </Text>
        </Group>
        <ActionIcon
          size="sm"
          variant="subtle"
          color="green"
          onClick={handleNewNote}
          title="新建笔记"
          styles={{
            root: {
              '&:hover': {
                background: 'rgba(40, 167, 69, 0.2)',
                transform: 'scale(1.05)'
              }
            }
          }}
        >
          <IconPlus size={16} />
        </ActionIcon>
      </Group>

      {/* 受害人信息已移至证物库展示 */}

      {/* 标签页 */}
      <Tabs 
        value={activeTab} 
        onChange={(value) => setActiveTab(value || 'list')} 
        mb="md"
        styles={{
          list: {
            borderBottom: '1px solid rgba(135, 206, 235, 0.3)'
          },
          panel: {
            color: '#F0F8FF'
          }
        }}
      >
        <Tabs.List>
          <Tabs.Tab 
            value="list" 
            leftSection={<IconList size={16} />}
            style={{
              color: '#F0F8FF'
            }}
          >
            笔记列表
          </Tabs.Tab>
          <Tabs.Tab 
            value="edit" 
            leftSection={<IconEditCircle size={16} />}
            style={{
              color: '#F0F8FF'
            }}
          >
            {isEditing ? '编辑笔记' : '新建笔记'}
          </Tabs.Tab>
        </Tabs.List>

        {/* 笔记列表标签页 */}
        <Tabs.Panel value="list" pt="md">
          <ScrollArea.Autosize mah={400}>
            {notes.length === 0 ? (
              <Alert 
                color="blue" 
                variant="light"
                styles={{
                  root: {
                    background: 'rgba(135, 206, 235, 0.2)',
                    border: '1px solid rgba(135, 206, 235, 0.4)'
                  }
                }}
              >
                <Text size="sm" c="#F0F8FF" fw={500}>
                  还没有任何笔记，开始记录你的推理过程吧！
                </Text>
              </Alert>
            ) : (
              <Stack gap="xs">
                {notes.map((note) => (
                  <Card
                    key={note.id}
                    p="sm"
                    style={{
                      background: 'rgba(245, 245, 245, 0.9)',
                      border: '1px solid rgba(135, 206, 235, 0.5)',
                      borderRadius: '6px',
                      cursor: 'pointer'
                    }}
                    onClick={() => handleEditNote(note)}
                  >
                    <Group justify="space-between" mb="xs">
                      <Group gap="xs">
                        <Badge 
                          size="sm" 
                          color="green" 
                          variant="light"
                          styles={{
                            root: {
                              background: 'rgba(46, 139, 87, 0.2)',
                              color: '#2E8B57',
                              border: '1px solid rgba(46, 139, 87, 0.3)'
                            }
                          }}
                        >
                          {note.targetActor}
                        </Badge>
                        <Text fw={600} size="sm" c="#333333">
                          {note.title}
                        </Text>
                      </Group>
                      <Group gap="xs">
                        <Group gap={4}>
                          <IconClock size={12} color="#2E8B57" />
                          <Text size="xs" c="#2E8B57">
                            {formatTime(note.updatedAt)}
                          </Text>
                        </Group>
                        <ActionIcon
                          size="sm"
                          color="red"
                          variant="filled"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteNote(note.id);
                          }}
                          styles={{
                            root: {
                              '&:hover': {
                                background: '#DC3545',
                                transform: 'scale(1.1)'
                              }
                            }
                          }}
                        >
                          <IconTrash size={14} />
                        </ActionIcon>
                      </Group>
                    </Group>
                    
                    <Text
                      size="sm"
                      c="#555555"
                      style={{
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        lineHeight: 1.4
                      }}
                    >
                      {note.content}
                    </Text>
                  </Card>
                ))}
              </Stack>
            )}
          </ScrollArea.Autosize>
        </Tabs.Panel>

        {/* 编辑标签页 */}
        <Tabs.Panel value="edit" pt="md">
          <Stack gap="sm">
            <TextInput
              label="针对角色"
              value={selectedActor}
              onChange={(event) => setSelectedActor(event.currentTarget.value)}
              placeholder="输入角色名称"
              leftSection={<IconUser size={16} />}
              styles={{
                input: {
                  background: '#F5F5F5',
                  border: '1px solid #87CEEB',
                  color: '#333333'
                },
                label: { color: '#2E8B57', fontWeight: '600' }
              }}
            />
            
            <TextInput
              label="笔记标题"
              value={title}
              onChange={(event) => setTitle(event.currentTarget.value)}
              placeholder="输入笔记标题（可选）"
              styles={{
                input: {
                  background: '#F5F5F5',
                  border: '1px solid #87CEEB',
                  color: '#333333'
                },
                label: { color: '#2E8B57', fontWeight: '600' }
              }}
            />
            
            <Textarea
              label="笔记内容"
              value={content}
              onChange={(event) => setContent(event.currentTarget.value)}
              placeholder="记录你的推理过程和发现的线索..."
              minRows={8}
              maxRows={12}
              styles={{
                input: {
                  background: '#F5F5F5',
                  border: '1px solid #87CEEB',
                  color: '#333333'
                },
                label: { color: '#2E8B57', fontWeight: '600' }
              }}
            />
            
            <Group justify="flex-end" mt="sm">
              <Button
                variant="outline"
                onClick={handleCancel}
                styles={{
                  root: {
                    borderColor: '#DC3545',
                    color: '#DC3545',
                    '&:hover': {
                      background: 'rgba(220, 53, 69, 0.1)'
                    }
                  }
                }}
              >
                取消
              </Button>
              <Button
                onClick={handleSaveNote}
                disabled={!content.trim() || !selectedActor.trim()}
                styles={{
                  root: {
                    background: 'linear-gradient(135deg, #28A745 0%, #20C997 100%)',
                    border: 'none',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #218838 0%, #1EA085 100%)'
                    },
                    '&:disabled': {
                      background: '#6C757D',
                      color: '#FFFFFF'
                    }
                  }
                }}
              >
                保存笔记
              </Button>
            </Group>
          </Stack>
        </Tabs.Panel>
      </Tabs>

      {/* 统计信息 */}
      {notes.length > 0 && (
        <Box mt="md" p="sm" style={{
          background: 'rgba(135, 206, 235, 0.2)',
          borderRadius: '6px',
          border: '1px solid rgba(135, 206, 235, 0.4)'
        }}>
          <Text size="xs" c="#2E8B57">
            共 {notes.length} 条笔记 • 涉及 {getActorList().length} 个角色
          </Text>
        </Box>
      )}
    </div>
  );
};

export default EnhancedNotesPanel;
