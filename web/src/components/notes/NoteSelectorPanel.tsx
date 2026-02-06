import React, { useState, useEffect } from 'react';
import {
  Modal, Text, Group, Stack, TextInput, ScrollArea,
  Button, Card, Badge, ActionIcon, Box, Divider
} from '@mantine/core';
import { IconSearch, IconX, IconSend, IconNotes, IconCalendar } from '@tabler/icons-react';
import { Note } from '../../types/notes';
import { loadNotesFromStorage } from '../../utils/noteManager';
import { formatTime } from '../../utils/formatTime';
import {
  selectorModalStyles, selectorSearchInputStyles, selectorTextInputStyles,
  recommendBadgeStyles, getItemCardStyle, getItemHoverHandlers,
  selectedPreviewBoxStyle, cancelButtonStyles, getSendButtonStyles
} from '../shared/selectorPanelStyles';

interface NoteSelectorPanelProps {
  opened: boolean;
  onClose: () => void;
  onSelect: (note: Note) => void;
  onSend: (note: Note, textContent?: string) => void;
  sessionId: string;
  currentActor?: string;
}

const NoteSelectorPanel: React.FC<NoteSelectorPanelProps> = ({
  opened, onClose, onSelect, onSend, sessionId, currentActor
}) => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [textContent, setTextContent] = useState('');

  useEffect(() => {
    if (opened) {
      const timeoutId = setTimeout(() => { loadNotes(); }, searchQuery ? 300 : 0);
      return () => clearTimeout(timeoutId);
    }
  }, [opened, sessionId, searchQuery]);

  const loadNotes = () => {
    try {
      const allNotes = loadNotesFromStorage(sessionId);
      let filteredNotes = allNotes;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        filteredNotes = filteredNotes.filter(note =>
          note.title.toLowerCase().includes(query) ||
          note.content.toLowerCase().includes(query) ||
          note.targetActor.toLowerCase().includes(query)
        );
      }
      const sortedNotes = filteredNotes.sort((a, b) => {
        if (!currentActor) return 0;
        const aRelevant = a.targetActor === currentActor;
        const bRelevant = b.targetActor === currentActor;
        if (aRelevant && !bRelevant) return -1;
        if (!aRelevant && bRelevant) return 1;
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      });
      setNotes(sortedNotes);
    } catch (error) {
      console.error('❌ 加载笔记失败:', error);
    }
  };

  const handleNoteSelect = (note: Note) => {
    setSelectedNote(note);
    onSelect(note);
  };

  const handleSend = () => {
    if (selectedNote) {
      onSend(selectedNote, textContent.trim() || undefined);
      handleClose();
    }
  };

  const handleQuickSend = (note: Note) => {
    onSend(note);
    handleClose();
  };

  const handleClose = () => {
    setSelectedNote(null);
    setTextContent('');
    setSearchQuery('');
    onClose();
  };

  const getRecommendedNotes = () => {
    if (!currentActor) return [];
    return notes.filter(note => note.targetActor === currentActor).slice(0, 3);
  };

  const recommendedNotes = getRecommendedNotes();

  const actorBadgeStyles = {
    root: {
      backgroundColor: 'rgba(138, 43, 226, 0.2)',
      color: '#BA68C8',
      border: '1px solid rgba(138, 43, 226, 0.4)'
    }
  } as const;

  const categoryBadgeStyles = {
    root: {
      backgroundColor: 'rgba(117, 117, 117, 0.2)',
      color: '#BDBDBD',
      border: '1px solid rgba(117, 117, 117, 0.4)'
    }
  } as const;

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={
        <Group gap="sm">
          <IconSend size={20} />
          <Text fw={600}>选择推理笔记</Text>
          {currentActor && (
            <Badge size="sm" color="blue" variant="light">发送给: {currentActor}</Badge>
          )}
        </Group>
      }
      size="lg"
      styles={selectorModalStyles}
    >
      <Stack gap="md">
        <TextInput
          placeholder="搜索笔记..."
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.currentTarget.value)}
          leftSection={<IconSearch size={16} />}
          rightSection={searchQuery && (
            <ActionIcon size="sm" variant="subtle" onClick={() => setSearchQuery('')}>
              <IconX size={14} />
            </ActionIcon>
          )}
          styles={selectorSearchInputStyles}
        />

        {recommendedNotes.length > 0 && !searchQuery && (
          <Box>
            <Group gap="xs" mb="sm">
              <IconNotes size={16} color="#4ECCA3" />
              <Text fw={600} size="sm" c="#4ECCA3">推荐笔记</Text>
              <Badge size="xs" styles={recommendBadgeStyles}>与{currentActor}相关</Badge>
            </Group>
            <Stack gap="xs">
              {recommendedNotes.map((note) => (
                <Card
                  key={note.id}
                  p="sm"
                  withBorder
                  onClick={() => handleNoteSelect(note)}
                  onDoubleClick={() => handleQuickSend(note)}
                  style={getItemCardStyle(selectedNote?.id === note.id)}
                  {...getItemHoverHandlers(selectedNote?.id === note.id)}
                >
                  <Group justify="space-between" align="flex-start">
                    <Stack gap="xs" style={{ flex: 1 }}>
                      <Text fw={600} size="sm" c="#00FFFF">{note.title}</Text>
                      <Text size="xs" c="#E0E0E0" style={{
                        display: '-webkit-box', WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical', overflow: 'hidden'
                      }}>
                        {note.content}
                      </Text>
                      <Group gap="xs">
                        <Badge size="xs" styles={actorBadgeStyles}>{note.targetActor}</Badge>
                        <Text size="xs" c="#BDBDBD">{formatTime(note.updatedAt)}</Text>
                      </Group>
                    </Stack>
                  </Group>
                </Card>
              ))}
            </Stack>
            <Divider my="md" color="rgba(0, 255, 255, 0.2)" />
          </Box>
        )}

        <Box>
          <Text fw={600} size="sm" c="#00FFFF" mb="sm">所有笔记 ({notes.length})</Text>
          {notes.length === 0 ? (
            <Text size="sm" c="#BDBDBD" ta="center" py="xl">
              {searchQuery ? '没有找到匹配的笔记' : '还没有创建任何推理笔记'}
            </Text>
          ) : (
            <ScrollArea.Autosize mah={300}>
              <Stack gap="sm">
                {notes.map((note) => (
                  <Card
                    key={note.id}
                    p="sm"
                    withBorder
                    onClick={() => handleNoteSelect(note)}
                    onDoubleClick={() => handleQuickSend(note)}
                    style={getItemCardStyle(selectedNote?.id === note.id)}
                    {...getItemHoverHandlers(selectedNote?.id === note.id)}
                  >
                    <Group justify="space-between" align="flex-start">
                      <Stack gap="xs" style={{ flex: 1 }}>
                        <Group justify="space-between" align="flex-start">
                          <Text fw={600} size="sm" c="#00FFFF" style={{ flex: 1 }}>{note.title}</Text>
                          <Text size="xs" c="#BDBDBD">
                            <IconCalendar size={12} style={{ marginRight: 4 }} />
                            {formatTime(note.updatedAt)}
                          </Text>
                        </Group>
                        <Text size="xs" c="#E0E0E0" style={{
                          display: '-webkit-box', WebkitLineClamp: 3,
                          WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: 1.4
                        }}>
                          {note.content}
                        </Text>
                        <Group gap="xs">
                          <Badge size="xs" styles={actorBadgeStyles}>{note.targetActor}</Badge>
                          {note.category && (
                            <Badge size="xs" styles={categoryBadgeStyles}>{note.category}</Badge>
                          )}
                        </Group>
                      </Stack>
                    </Group>
                  </Card>
                ))}
              </Stack>
            </ScrollArea.Autosize>
          )}
        </Box>

        {selectedNote && (
          <>
            <Divider color="rgba(0, 255, 255, 0.2)" />
            <Box p="md" style={selectedPreviewBoxStyle}>
              <Group gap="sm" mb="sm">
                <IconNotes size={16} color="#4ECCA3" />
                <Text fw={600} c="#00FFFF">{selectedNote.title}</Text>
              </Group>
              <Text size="sm" c="#E0E0E0" mb="sm">{selectedNote.content}</Text>
              <Group gap="xs">
                <Badge size="xs" styles={actorBadgeStyles}>{selectedNote.targetActor}</Badge>
                <Text size="xs" c="#BDBDBD">更新于: {formatTime(selectedNote.updatedAt)}</Text>
              </Group>
              <Text size="xs" c="#BDBDBD" mt="sm">💡 提示：双击笔记可快速发送</Text>
            </Box>
          </>
        )}

        <TextInput
          placeholder="添加说明文字（可选）..."
          value={textContent}
          onChange={(event) => setTextContent(event.currentTarget.value)}
          styles={selectorTextInputStyles}
        />

        <Group justify="flex-end" mt="lg" pt="md" style={{ borderTop: '2px solid rgba(0, 255, 255, 0.3)' }}>
          <Button variant="outline" onClick={handleClose} styles={cancelButtonStyles}>取消</Button>
          <Button
            leftSection={<IconSend size={16} />}
            onClick={handleSend}
            disabled={!selectedNote}
            styles={getSendButtonStyles(!!selectedNote)}
          >
            发送笔记
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
};

export default NoteSelectorPanel;
