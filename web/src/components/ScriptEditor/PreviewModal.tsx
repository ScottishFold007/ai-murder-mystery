import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Modal,
  Title,
  Text,
  Stack,
  Group,
  Badge,
  Card,
  Avatar,
  ScrollArea,
  Divider,
  Button,
  Grid,
  Tooltip
} from '@mantine/core';

import { Script } from '../../types/script';
import { getScriptStats } from '../../utils/scriptManager';
import { resolveAvatarSrc } from '../../utils/avatarUtils';

interface PreviewModalProps {
  script: Script;
  opened: boolean;
  onClose: () => void;
  onStartGame?: (script: Script) => void;
}

const PreviewModal: React.FC<PreviewModalProps> = ({ script, opened, onClose, onStartGame }) => {
  const navigate = useNavigate();
  const stats = getScriptStats(script);

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="剧本预览"
      size="xl"
      centered
      styles={{
        content: {
          background: `linear-gradient(135deg, 
            #0a0a23 0%, 
            #1a1a3e 25%, 
            #2d1b69 50%, 
            #1e3a5f 75%, 
            #0f2027 100%
          )`,
          border: '2px solid #00FFFF'
        },
        header: {
          background: 'rgba(0, 255, 255, 0.1)',
          borderBottom: '2px solid #00FFFF'
        },
        title: {
          color: '#FFFFFF',
          fontWeight: '700',
          fontSize: '20px'
        }
      }}
    >
      <Stack>
        {/* 剧本基本信息 */}
        <Card
          padding="md"
          radius="md"
          style={{ 
            background: 'rgba(0, 255, 255, 0.05)',
            border: '2px solid #00FFFF'
          }}
        >
          <Group justify="space-between" mb="md">
            <Title order={2} style={{ color: '#FFFFFF' }}>
              {script.title}
            </Title>
            <Button
              variant="outline"
              onClick={onClose}
              styles={{
                root: {
                  borderColor: '#00FFFF',
                  color: '#00FFFF',
                  '&:hover': {
                    backgroundColor: 'rgba(0, 255, 255, 0.1)'
                  }
                }
              }}
            >
              ✕ 关闭
            </Button>
          </Group>

          <Text style={{ color: '#FFFFFF' }} mb="md">
            {script.description}
          </Text>

          <Group gap="md">
            <Badge style={{ 
              backgroundColor: '#00FFFF', 
              color: '#000000',
              fontWeight: '600'
            }}>
              👥 {stats.characterCount} 个角色
            </Badge>
            <Badge style={{ 
              backgroundColor: '#00C2FF', 
              color: '#000000',
              fontWeight: '600'
            }}>
              📖 {stats.estimatedWords} 字
            </Badge>
            <Badge style={{ 
              backgroundColor: '#FFD700', 
              color: '#000000',
              fontWeight: '600'
            }}>
              ⏰ {script.settings.estimatedDuration} 分钟
            </Badge>
            <Badge style={{ 
              backgroundColor: script.settings.difficulty === 'easy' ? '#87CEEB' : 
                             script.settings.difficulty === 'medium' ? '#FFD700' : '#FF6B6B',
              color: '#000000',
              fontWeight: '600'
            }}>
              {script.settings.difficulty === 'easy' ? '简单' : 
               script.settings.difficulty === 'medium' ? '中等' : '困难'}
            </Badge>
          </Group>
        </Card>

        {/* 角色列表 */}
        <Card
          padding="md"
          radius="md"
          style={{ 
            background: 'rgba(0, 194, 255, 0.05)',
            border: '2px solid #00C2FF'
          }}
        >
          <Title order={3} style={{ color: '#FFFFFF' }} mb="md">
            角色列表
          </Title>
          <Grid>
            {script.characters.map((character, index) => (
              <Grid.Col key={index} span={{ base: 12, sm: 6 }}>
                <Card
                  padding="sm"
                  radius="md"
                  style={{ 
                    background: 'rgba(0, 0, 0, 0.4)',
                    border: '1px solid #00FFFF'
                  }}
                >
                  <Group>
                    <Avatar
                      src={resolveAvatarSrc(character.image)}
                      size="md"
                      radius="md"
                      style={{
                        objectFit: 'cover',
                        border: '1px solid #00FFFF'
                      } as React.CSSProperties}
                    />
                    <div style={{ flex: 1 }}>
                      <Group justify="space-between">
                        <Text fw={500} style={{ color: '#FFFFFF' }}>
                          {character.name}
                        </Text>
                        <Group gap="xs">
                          {character.isPlayer && (
                            <Badge size="xs" style={{ 
                              backgroundColor: '#00FFFF', 
                              color: '#000000',
                              fontWeight: '600'
                            }}>🕵️ 玩家</Badge>
                          )}
                          {character.isPartner && (
                            <Badge size="xs" style={{ 
                              backgroundColor: '#A78BFA', 
                              color: '#FFFFFF',
                              fontWeight: '600'
                            }}>👮 搭档</Badge>
                          )}
                          {character.isKiller && (
                            <Badge size="xs" style={{ 
                              backgroundColor: '#FF6B6B', 
                              color: '#000000',
                              fontWeight: '600'
                            }}>🔪 凶手</Badge>
                          )}
                          {character.roleType === '嫌疑人' && (
                            <Badge size="xs" style={{ 
                              backgroundColor: '#FFD700', 
                              color: '#000000',
                              fontWeight: '600'
                            }}>👤 嫌疑人</Badge>
                          )}
                        </Group>
                      </Group>
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
                          style={{ 
                            color: '#E0E0E0',
                            cursor: 'help',
                            lineHeight: '1.4'
                          }} 
                          lineClamp={2}
                        >
                          {character.bio}
                        </Text>
                      </Tooltip>
                    </div>
                  </Group>
                </Card>
              </Grid.Col>
            ))}
          </Grid>
        </Card>

        {/* 故事背景预览 */}
        <Card
          padding="md"
          radius="md"
          style={{ 
            background: 'rgba(255, 215, 0, 0.05)',
            border: '2px solid #FFD700'
          }}
        >
          <Title order={3} style={{ color: '#FFFFFF' }} mb="md">
            故事背景
          </Title>
          <ScrollArea h={300}>
            <Text size="sm" style={{ 
              color: '#FFFFFF', 
              lineHeight: 1.6,
              backgroundColor: 'rgba(0, 0, 0, 0.3)',
              padding: '12px',
              borderRadius: '6px'
            }}>
              {script.globalStory}
            </Text>
          </ScrollArea>
        </Card>

        <Divider />

        <Group justify="flex-end">
          <Button 
            variant="outline" 
            onClick={onClose}
            styles={{
              root: {
                borderColor: '#00FFFF',
                color: '#FFFFFF',
                '&:hover': {
                  backgroundColor: 'rgba(0, 255, 255, 0.1)',
                  borderColor: '#00FFFF'
                }
              }
            }}
          >
            关闭预览
          </Button>
          <Button
            onClick={() => {
              console.log('🎮 开始游戏按钮被点击，剧本ID:', script.id);
              if (onStartGame) {
                console.log('🎮 使用自定义开始游戏处理函数');
                onStartGame(script);
              } else {
                console.log('🎮 使用默认行为：跳转到游戏页面');
                navigate(`/play/${script.id}`);
              }
            }}
            styles={{
              root: {
                background: 'linear-gradient(135deg, #00C2FF, #87CEEB)',
                color: '#000000',
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
            ▶️ 开始游戏
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
};

export default PreviewModal;
