import React from 'react';
import {
  Stack,
  Title,
  Text,
  Card,
  Group,
  Badge,
  Avatar,
  Grid,
  Alert,
  Paper,
  ScrollArea
} from '@mantine/core';
import { Script, Character } from '../types/script';
import { resolveAvatarSrc } from '../utils/avatarUtils';
import { getSpoilerRoleColor, getSpoilerRoleLabel } from '../utils/roleUtils';

interface SpoilerContentProps {
  script: Script;
  isRevealed: boolean; // true=游戏后显示完整内容，false=游戏中显示模糊内容
}

const SpoilerContent: React.FC<SpoilerContentProps> = ({ script, isRevealed }) => {
  // 获取凶手角色
  const killer = script.characters.find(char => char.isKiller);
  const killerName = killer?.name || script.settings.hiddenKiller || '未知';
  
  // 按角色类型分组
  const playerCharacter = script.characters.find(char => char.isPlayer);
  const partnerCharacter = script.characters.find(char => char.isAssistant || char.isPartner);
  const suspectCharacters = script.characters.filter(char => 
    !char.isPlayer && !char.isAssistant && !char.isPartner
  );

  // 渲染秘密内容
  const renderSecret = (secret: string) => {
    if (isRevealed) {
      return (
        <ScrollArea h={120} style={{ 
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          borderRadius: '8px',
          border: '1px solid rgba(0, 255, 255, 0.3)',
        }}>
          <Text size="sm" style={{ 
            color: '#FFFFFF', 
            lineHeight: '1.6',
            padding: '12px',
            whiteSpace: 'pre-wrap'
          }}>
            {secret}
          </Text>
        </ScrollArea>
      );
    } else {
      return (
        <div style={{
          position: 'relative',
          overflow: 'hidden',
          height: '120px',
          borderRadius: '8px'
        }}>
          <div style={{
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            padding: '12px',
            borderRadius: '8px',
            border: '1px solid rgba(0, 255, 255, 0.3)',
            filter: 'blur(4px)',
            userSelect: 'none',
            height: '100%',
            overflow: 'hidden'
          }}>
            <Text size="sm" style={{ 
              color: '#FFFFFF', 
              lineHeight: '1.6',
              whiteSpace: 'pre-wrap'
            }}>
              {secret}
            </Text>
          </div>
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '8px',
            border: '1px solid #A78BFA'
          }}>
            <Text size="md" fw={700} style={{ 
              color: '#A78BFA',
              textAlign: 'center'
            }}>
              🔒 游戏结束后可查看
            </Text>
          </div>
        </div>
      );
    }
  };

  // 渲染角色卡片
  const renderCharacterCard = (character: Character) => (
    <Card
      key={character.name}
      style={{
        background: 'rgba(0, 0, 0, 0.8)',
        border: `2px solid ${getSpoilerRoleColor(character)}`,
        borderRadius: '12px',
        height: '320px',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: `0 0 15px ${getSpoilerRoleColor(character)}40`
      }}
    >
      <Stack gap="md" style={{ height: '100%', padding: '16px' }}>
        {/* 角色头部信息 */}
        <Group>
          <Avatar
            src={resolveAvatarSrc(character.image)}
            size="lg"
            radius="md"
            style={{
              border: `2px solid ${getSpoilerRoleColor(character)}`,
              objectFit: 'cover'
            } as React.CSSProperties}
          />
          <div style={{ flex: 1 }}>
            <Group justify="space-between" align="flex-start">
              <Title order={4} style={{ 
                color: '#FFFFFF'
              }}>
                {character.name}
              </Title>
              <Badge
                variant="filled"
                style={{
                  backgroundColor: getSpoilerRoleColor(character),
                  color: '#000000',
                  fontWeight: '700',
                  fontSize: '11px'
                }}
              >
                {getSpoilerRoleLabel(character)}
              </Badge>
            </Group>
            <Text size="xs" style={{ 
              color: '#FFFFFF', 
              marginTop: '4px',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden'
            }}>
              {character.bio}
            </Text>
          </div>
        </Group>

        {/* 角色秘密 */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <Text size="sm" fw={600} style={{ 
            color: getSpoilerRoleColor(character), 
            marginBottom: '8px'
          }}>
            🔐 角色秘密
          </Text>
          <div style={{ flex: 1 }}>
            {renderSecret(character.secret)}
          </div>
        </div>
      </Stack>
    </Card>
  );

  return (
    <div style={{
      background: `
        linear-gradient(135deg, 
          #0a0a23 0%, 
          #1a1a3e 15%, 
          #2d1b69 30%, 
          #1e3a5f 45%, 
          #0f2027 60%, 
          #203a43 75%, 
          #2c5364 90%, 
          #0f3460 100%
        )
      `,
      minHeight: '100vh',
      padding: '20px'
    }}>
      <Stack gap="xl" style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* 页面标题 */}
        <Paper p="xl" style={{
          background: 'rgba(0, 0, 0, 0.8)',
          border: '2px solid #00FFFF',
          borderRadius: '16px',
          textAlign: 'center',
          boxShadow: '0 0 25px rgba(0, 255, 255, 0.4)'
        }}>
          <Title order={1} style={{
            color: '#FFFFFF',
            fontSize: '32px',
            fontWeight: '800',
            marginBottom: '12px'
          }}>
            🔍 剧透 - 《{script.title}》
          </Title>
          <Alert
            variant="light"
            styles={{
              root: {
                backgroundColor: isRevealed 
                  ? 'rgba(76, 236, 163, 0.15)' 
                  : 'rgba(167, 139, 250, 0.15)',
                border: `2px solid ${isRevealed ? '#4ECCA3' : '#A78BFA'}`,
                borderRadius: '8px'
              }
            }}
          >
            <Text size="md" fw={700} style={{ 
              color: isRevealed ? '#4ECCA3' : '#A78BFA',
              textAlign: 'center'
            }}>
              {isRevealed 
                ? '✅ 游戏已结束，所有秘密已公开' 
                : '⚠️ 游戏进行中，秘密内容已模糊处理'}
            </Text>
          </Alert>
        </Paper>

        {/* 真凶揭示区域 */}
        <Paper p="lg" style={{
          background: 'rgba(0, 0, 0, 0.8)',
          border: '2px solid #E63946',
          borderRadius: '12px',
          textAlign: 'center',
          boxShadow: '0 0 20px rgba(230, 57, 70, 0.3)'
        }}>
          <Title order={2} style={{
            color: '#FFFFFF',
            fontSize: '24px',
            fontWeight: '700',
            marginBottom: '8px'
          }}>
            🎯 案件真相
          </Title>
          <Text size="xl" fw={700} style={{
            color: isRevealed ? '#FFFFFF' : '#666',
            fontSize: '20px',
            filter: isRevealed ? 'none' : 'blur(8px)',
            userSelect: isRevealed ? 'text' : 'none'
          }}>
            真凶：{isRevealed ? killerName : '████████'}
          </Text>
          {!isRevealed && (
            <Text size="sm" style={{ 
              color: '#FFD700', 
              marginTop: '8px'
            }}>
              🔒 完成游戏后可查看真凶身份
            </Text>
          )}
        </Paper>

        {/* 角色秘密列表 */}
        <div>
          <Title order={2} style={{
            color: '#FFFFFF',
            fontSize: '24px',
            fontWeight: '700',
            marginBottom: '20px',
            textAlign: 'center'
          }}>
            👥 角色秘密档案
          </Title>
          
          <Grid>
            {/* 玩家角色 */}
            {playerCharacter && (
              <Grid.Col span={{ base: 12, md: 6, lg: 4 }}>
                {renderCharacterCard(playerCharacter)}
              </Grid.Col>
            )}
            
            {/* 搭档角色 */}
            {partnerCharacter && (
              <Grid.Col span={{ base: 12, md: 6, lg: 4 }}>
                {renderCharacterCard(partnerCharacter)}
              </Grid.Col>
            )}
            
            {/* 嫌疑人角色 */}
            {suspectCharacters.map(character => (
              <Grid.Col key={character.name} span={{ base: 12, md: 6, lg: 4 }}>
                {renderCharacterCard(character)}
              </Grid.Col>
            ))}
          </Grid>
        </div>

        {/* 案件背景（可选） */}
        {isRevealed && (
          <Paper p="lg" style={{
            background: 'rgba(0, 0, 0, 0.8)',
            border: '2px solid #4ECCA3',
            borderRadius: '12px',
            boxShadow: '0 0 20px rgba(76, 236, 163, 0.3)'
          }}>
            <Title order={3} style={{
              color: '#FFFFFF',
              marginBottom: '12px'
            }}>
              📖 完整案件背景
            </Title>
            <Text size="sm" style={{ 
              color: '#FFFFFF', 
              lineHeight: '1.6'
            }}>
              {script.globalStory}
            </Text>
          </Paper>
        )}

        {/* 游戏提示 */}
        {!isRevealed && (
          <Paper p="md" style={{
            background: 'rgba(0, 0, 0, 0.8)',
            border: '2px solid #A78BFA',
            borderRadius: '8px',
            textAlign: 'center',
            boxShadow: '0 0 15px rgba(167, 139, 250, 0.3)'
          }}>
            <Text size="sm" style={{ 
              color: '#FFFFFF'
            }}>
              💡 提示：完成游戏后，所有秘密内容将完整显示，帮助您了解完整的故事脉络
            </Text>
          </Paper>
        )}
      </Stack>
    </div>
  );
};

export default SpoilerContent;
