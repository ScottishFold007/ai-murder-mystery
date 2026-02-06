// src/components/ExplanationModal.tsx

import React from 'react';
import { Button, Text, Image, Stack, Group, Anchor, Card, Divider } from '@mantine/core';
import { IconInfoCircle, IconBulb, IconSparkles } from '@tabler/icons-react';
import pinkelephants from '../assets/pinkelephants.png';
import pinkelephants2 from '../assets/pinkelephants2.png';
import BaseModal from './BaseModal';

interface ExplanationModalProps {
  opened: boolean;
  onClose: () => void;
}

const ExplanationModal: React.FC<ExplanationModalProps> = ({ opened, onClose }) => {
  return (
    <BaseModal 
      opened={opened} 
      onClose={onClose} 
      size="xl"
      centered
      overlayProps={{
        backgroundOpacity: 0.7,
        blur: 8,
      }}
      title={
        <Group gap="sm">
          <IconInfoCircle size={28} color="#00C2FF" />
          <Text size="xl" fw={700} style={{ color: '#00C2FF' }}>关于游戏</Text>
        </Group>
      }
    >
      <Stack gap="xl">
        {/* 游戏介绍卡片 */}
        <Card 
          className="character-info-aurora"
          style={{
            background: 'rgba(0, 0, 0, 0.3)',
            border: '1px solid rgba(0, 194, 255, 0.2)',
            borderRadius: '12px'
          }}
          p="lg"
        >
          <Group gap="sm" mb="md">
            <IconSparkles size={20} color="#FFB74D" />
            <Text size="lg" fw={600} style={{ color: '#FFB74D' }}>剧本来源</Text>
          </Group>
          <Text 
            style={{ 
              color: '#E8E8E8',
              lineHeight: '1.6',
              fontSize: '15px'
            }}
          >
            剧本库中的《安达山谋杀悬案》改编自韩国节目{' '}
            <Anchor 
              href="https://en.wikipedia.org/wiki/Crime_Scene_(South_Korean_TV_series)" 
              target="_blank"
              style={{
                color: '#00C2FF',
                textDecoration: 'none',
                borderBottom: '1px dashed rgba(0, 194, 255, 0.5)',
                '&:hover': {
                  borderBottom: '1px solid #00C2FF'
                }
              }}
            >
              Crime Scene
            </Anchor>
            {' '}第2季第11集《山间别墅谋杀案》。
          </Text>
        </Card>

        <Divider 
          className="character-separator-aurora"
          style={{ height: '2px', border: 'none' }}
        />

        {/* 粉红大象系统卡片 */}
        <Card 
          className="character-info-aurora"
          style={{
            background: 'rgba(0, 0, 0, 0.3)',
            border: '1px solid rgba(138, 43, 226, 0.2)',
            borderRadius: '12px'
          }}
          p="lg"
        >
          <Group gap="sm" mb="md">
            <IconBulb size={20} color="#8A2BE2" />
            <Text size="lg" fw={600} style={{ color: '#8A2BE2' }}>粉红大象改进系统</Text>
          </Group>
          
          <Text 
            style={{ 
              color: '#E8E8E8',
              lineHeight: '1.7',
              fontSize: '15px',
              marginBottom: '16px'
            }}
          >
            教会大语言模型在被指示时避免提及某个话题是一个具有挑战性的行为。人类也存在类似的概念：如果被指示"不要想粉红大象"，我们却忍不住会去想。
          </Text>

          <div style={{
            display: 'flex',
            justifyContent: 'center',
            margin: '20px 0',
            padding: '16px',
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '8px',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <Image 
              src={pinkelephants} 
              alt="大语言模型中粉红大象现象示例" 
              style={{
                maxWidth: '100%',
                height: 'auto',
                borderRadius: '8px',
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)'
              }}
            />
          </div>

          <Text 
            style={{ 
              color: '#E8E8E8',
              lineHeight: '1.7',
              fontSize: '15px',
              marginBottom: '16px'
            }}
          >
            基于这个想法，一个有趣的游戏是让角色扮演聊天机器人知道他们犯罪的所有细节，但被指示撒谎，表现得好像从未参与过。
          </Text>

          <div style={{
            display: 'flex',
            justifyContent: 'center',
            margin: '20px 0',
            padding: '16px',
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '8px',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <Image 
              src={pinkelephants2} 
              alt="批评与改进示例" 
              style={{
                maxWidth: '100%',
                height: 'auto',
                borderRadius: '8px',
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)'
              }}
            />
          </div>

          <Text 
            style={{ 
              color: '#E8E8E8',
              lineHeight: '1.7',
              fontSize: '15px',
              marginBottom: '16px'
            }}
          >
            尽管聊天机器人被指示不要泄露他们的秘密，但我们发现嫌疑人在对话中经常承认他们的行为。我们实现了一个批评与改进系统（灵感来自{' '}
            <Anchor 
              href="https://arxiv.org/abs/2402.07896" 
              target="_blank"
              style={{
                color: '#FF1493',
                textDecoration: 'none',
                borderBottom: '1px dashed rgba(255, 20, 147, 0.5)',
                '&:hover': {
                  borderBottom: '1px solid #FF1493'
                }
              }}
            >
              这篇论文
            </Anchor>
            ），每条消息都会根据潜在违规列表进行检查。如果机器人检测到问题，会将检测说明和原始消息发送给改进机器人来修复对话。
          </Text>

          <Text 
            style={{ 
              color: '#B8B8B8',
              lineHeight: '1.7',
              fontSize: '14px',
              fontStyle: 'italic'
            }}
          >
            包含原始消息、违规说明和后续修订消息的配对数据集可用于微调系统并提高这个谋杀悬疑游戏的整体质量。参见关于{' '}
            <Anchor 
              href="https://arxiv.org/abs/2402.07896" 
              target="_blank"
              style={{
                color: '#00C2FF',
                textDecoration: 'none',
                borderBottom: '1px dashed rgba(0, 194, 255, 0.5)',
                '&:hover': {
                  borderBottom: '1px solid #00C2FF'
                }
              }}
            >
              "直接原则反馈"
            </Anchor>
            {' '}的论文。
          </Text>
        </Card>

        {/* 关闭按钮 */}
        <Button 
          onClick={onClose} 
          size="lg"
          fullWidth
          style={{
            background: 'linear-gradient(135deg, #00C2FF 0%, #8A2BE2 100%)',
            border: 'none',
            borderRadius: '8px',
            color: '#FFFFFF',
            fontWeight: '600',
            fontSize: '16px',
            padding: '12px',
            transition: 'all 0.3s ease',
            boxShadow: '0 4px 16px rgba(0, 194, 255, 0.3)',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: '0 8px 24px rgba(0, 194, 255, 0.4)'
            }
          }}
        >
          关闭
        </Button>
      </Stack>
    </BaseModal>
  );
};

export default ExplanationModal;