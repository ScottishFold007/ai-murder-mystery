import React, { useState } from 'react';
import { Modal, Button, Text, ScrollArea, Group } from '@mantine/core';
import { Script } from '../types/script';
import SpoilerContent from './SpoilerContent';
import SpoilerStoryModal from './SpoilerStoryModal';

interface SecretsModalProps {
  opened: boolean;
  onClose: () => void;
  postGame: boolean;  // true=游戏后，false=游戏中
  script?: Script;    // 当前剧本数据
}

const SecretsModal: React.FC<SecretsModalProps> = ({ opened, onClose, postGame, script }) => {
  const [storyModalOpened, setStoryModalOpened] = useState(false);

  if (!script) {
    return (
      <Modal 
        opened={opened} 
        onClose={onClose} 
        size="md"
        title={<Text size="lg" fw={700} style={{ color: '#E63946' }}>剧透</Text>}
        styles={{
          content: { backgroundColor: '#1A1A2E' },
          header: { backgroundColor: '#1A1A2E', borderBottom: '1px solid #333' }
        }}
      >
        <Text style={{ color: '#E0E0E0', textAlign: 'center', padding: '20px' }}>
          暂无剧本数据，无法显示剧透内容
        </Text>
        <Button onClick={onClose} fullWidth mt="md" style={{
          backgroundColor: '#00C2FF',
          color: '#FFFFFF'
        }}>
          关闭
        </Button>
      </Modal>
    );
  }

  return (
    <Modal 
      opened={opened} 
      onClose={onClose} 
      size="95vw"
      title={
        <Text size="xl" fw={700} style={{ 
          color: '#FFFFFF',
          textShadow: '0 0 15px rgba(0, 255, 255, 0.8), 0 2px 4px rgba(0, 0, 0, 1)'
        }}>
          🔍 剧透 - 《{script.title}》
        </Text>
      }
      styles={{
        content: { 
          backgroundColor: 'transparent',
          border: 'none',
          boxShadow: 'none'
        },
        header: { 
          backgroundColor: 'rgba(26, 26, 46, 0.95)',
          borderBottom: '2px solid #00FFFF',
          backdropFilter: 'blur(10px)'
        },
        body: {
          padding: 0
        }
      }}
    >
      <ScrollArea h="80vh">
        <SpoilerContent 
          script={script} 
          isRevealed={postGame}  // 游戏后显示完整内容，游戏中显示模糊内容
        />
      </ScrollArea>
      
      <div style={{
        position: 'sticky',
        bottom: 0,
        backgroundColor: 'rgba(26, 26, 46, 0.95)',
        padding: '16px',
        borderTop: '1px solid #333',
        backdropFilter: 'blur(10px)'
      }}>
        <Group grow>
          <Button 
            onClick={() => setStoryModalOpened(true)}
            size="md"
            disabled={!postGame}
            styles={{
              root: {
                backgroundColor: postGame ? '#A78BFA' : '#666666',
                color: postGame ? '#FFFFFF' : '#CCCCCC',
                fontWeight: '700',
                textShadow: 'none',
                boxShadow: postGame ? '0 0 15px rgba(167, 139, 250, 0.5)' : 'none',
                border: postGame ? '1px solid #A78BFA' : '1px solid #666666',
                '&:hover': postGame ? {
                  backgroundColor: '#9F7AEA',
                  boxShadow: '0 0 20px rgba(167, 139, 250, 0.7)',
                  transform: 'translateY(-1px)'
                } : {}
              }
            }}
          >
            📚 剧透故事
          </Button>
          <Button 
            onClick={onClose} 
            size="md"
            styles={{
              root: {
                backgroundColor: '#4ECCA3',
                color: '#FFFFFF',
                fontWeight: '700',
                textShadow: 'none',
                boxShadow: '0 0 15px rgba(76, 236, 163, 0.5)',
                border: '1px solid #4ECCA3',
                '&:hover': {
                  backgroundColor: '#45B7AA',
                  boxShadow: '0 0 20px rgba(76, 236, 163, 0.7)',
                  transform: 'translateY(-1px)'
                }
              }
            }}
          >
            关闭剧透
          </Button>
        </Group>
      </div>
      
      {/* 剧透故事模态框 */}
      <SpoilerStoryModal
        opened={storyModalOpened}
        onClose={() => setStoryModalOpened(false)}
        script={script}
        isRevealed={postGame}
      />
    </Modal>
  );
};

export default SecretsModal;