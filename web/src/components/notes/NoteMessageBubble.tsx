import React, { useState } from 'react';
import {
  Card,
  Text,
  Group,
  Stack,
  Badge,
  Box,
  Collapse,
  ActionIcon,
  Tooltip
} from '@mantine/core';
import {
  IconChevronDown,
  IconChevronUp,
  IconNotes,
  IconEye
} from '@tabler/icons-react';
import { Note } from '../../types/notes';
import { formatTime } from '../../utils/formatTime';

interface NoteMessageBubbleProps {
  note: Note;
  textContent?: string;
  isFromUser: boolean;
  timestamp?: string;
  onViewDetails?: (note: Note) => void;
}

const NoteMessageBubble: React.FC<NoteMessageBubbleProps> = ({
  note,
  textContent,
  isFromUser,
  timestamp,
  onViewDetails
}) => {
  const [showDetails, setShowDetails] = useState(false);

  // 获取类别颜色
  const getCategoryColor = (category?: string) => {
    const colors: Record<string, string> = {
      '线索': 'blue',
      '推理': 'purple',
      '怀疑': 'orange',
      '证据': 'green',
      '疑问': 'yellow',
      '结论': 'red'
    };
    return colors[category || ''] || 'gray';
  };

  return (
    <Box
      style={{
        maxWidth: '80%',
        marginLeft: isFromUser ? 'auto' : 0,
        marginRight: isFromUser ? 0 : 'auto'
      }}
    >
      {/* 可选的文字内容 */}
      {textContent && (
        <Card
          p="sm"
          mb="xs"
          style={{
            background: isFromUser 
              ? 'linear-gradient(135deg, #007bff 0%, #0056b3 100%)'
              : '#f8f9fa',
            color: isFromUser ? 'white' : '#333333',
            borderRadius: '12px',
            maxWidth: '100%'
          }}
        >
          <Text size="sm">{textContent}</Text>
        </Card>
      )}

      {/* 笔记卡片 */}
      <Card
        p="sm"
        style={{
          background: isFromUser 
            ? 'linear-gradient(135deg, #6f42c1 0%, #5a2c91 100%)'
            : 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
          border: isFromUser 
            ? '1px solid rgba(255, 255, 255, 0.3)'
            : '1px solid rgba(135, 206, 235, 0.5)',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
        }}
      >
        <Stack gap="sm">
          {/* 笔记头部信息 */}
          <Group justify="space-between" align="flex-start">
            <Group gap="sm" align="center">
              <IconNotes 
                size={20} 
                color={isFromUser ? 'white' : '#6f42c1'} 
              />
              <Stack gap={2}>
                <Text
                  fw={600}
                  size="sm"
                  c={isFromUser ? 'white' : '#333333'}
                  style={{
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    maxWidth: '200px'
                  }}
                >
                  {note.title}
                </Text>
                <Group gap="xs">
                  <Badge
                    size="xs"
                    color="purple"
                    variant={isFromUser ? 'white' : 'light'}
                  >
                    {note.targetActor}
                  </Badge>
                  {note.category && (
                    <Badge
                      size="xs"
                      color={getCategoryColor(note.category)}
                      variant={isFromUser ? 'white' : 'light'}
                    >
                      {note.category}
                    </Badge>
                  )}
                </Group>
              </Stack>
            </Group>

            {/* 展开按钮 */}
            <ActionIcon
              size="sm"
              variant="subtle"
              color={isFromUser ? 'white' : 'gray'}
              onClick={() => setShowDetails(!showDetails)}
            >
              {showDetails ? <IconChevronUp size={16} /> : <IconChevronDown size={16} />}
            </ActionIcon>
          </Group>

          {/* 笔记内容预览 */}
          <Text
            size="sm"
            c={isFromUser ? 'rgba(255, 255, 255, 0.9)' : '#555555'}
            style={{
              display: '-webkit-box',
              WebkitLineClamp: showDetails ? 'none' : 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              lineHeight: 1.4
            }}
          >
            {note.content}
          </Text>

          {/* 展开的详细信息 */}
          <Collapse in={showDetails}>
            <Stack gap="sm" pt="sm" style={{
              borderTop: `1px solid ${isFromUser ? 'rgba(255, 255, 255, 0.2)' : 'rgba(135, 206, 235, 0.3)'}`
            }}>
              {/* 笔记元数据 */}
              <Group gap="md">
                <Group gap="xs">
                  <Text
                    fw={600}
                    size="xs"
                    c={isFromUser ? 'rgba(255, 255, 255, 0.8)' : '#666'}
                  >
                    创建时间:
                  </Text>
                  <Text
                    size="xs"
                    c={isFromUser ? 'rgba(255, 255, 255, 0.85)' : '#777'}
                  >
                    {formatTime(note.createdAt)}
                  </Text>
                </Group>
                
                {note.updatedAt !== note.createdAt && (
                  <Group gap="xs">
                    <Text
                      fw={600}
                      size="xs"
                      c={isFromUser ? 'rgba(255, 255, 255, 0.8)' : '#666'}
                    >
                      更新时间:
                    </Text>
                    <Text
                      size="xs"
                      c={isFromUser ? 'rgba(255, 255, 255, 0.85)' : '#777'}
                    >
                      {formatTime(note.updatedAt)}
                    </Text>
                  </Group>
                )}
              </Group>

              {/* 笔记标签（如果有） */}
              {note.tags && note.tags.length > 0 && (
                <Box>
                  <Text
                    fw={600}
                    size="xs"
                    c={isFromUser ? 'rgba(255, 255, 255, 0.8)' : '#666'}
                    mb="xs"
                  >
                    标签:
                  </Text>
                  <Group gap="xs">
                    {note.tags.map((tag, index) => (
                      <Badge
                        key={index}
                        size="xs"
                        color="gray"
                        variant={isFromUser ? 'white' : 'outline'}
                      >
                        {tag}
                      </Badge>
                    ))}
                  </Group>
                </Box>
              )}
            </Stack>
          </Collapse>

          {/* 底部操作 */}
          <Group justify="space-between" align="center" mt="xs">
            {timestamp && (
              <Text
                size="xs"
                c={isFromUser ? 'rgba(255, 255, 255, 0.7)' : 'dimmed'}
              >
                {timestamp}
              </Text>
            )}
            
            {onViewDetails && (
              <Tooltip label="查看详情">
                <ActionIcon
                  size="sm"
                  variant="subtle"
                  color={isFromUser ? 'white' : 'purple'}
                  onClick={() => onViewDetails(note)}
                >
                  <IconEye size={14} />
                </ActionIcon>
              </Tooltip>
            )}
          </Group>
        </Stack>
      </Card>
    </Box>
  );
};

export default NoteMessageBubble;
