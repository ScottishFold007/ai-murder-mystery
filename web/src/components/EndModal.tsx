import React from 'react';
import { Button, Text } from '@mantine/core';
import { Script } from '../types/script';
import BaseModal from './BaseModal';

interface IntroModalProps {
  opened: boolean;
  onClose: () => void;
  script?: Script | null;
  playerName?: string;
}

const IntroModal: React.FC<IntroModalProps> = ({ opened, onClose, script, playerName }) => {
  return (
    <BaseModal
      variant="solid"
      opened={opened}
      onClose={onClose}
      title={script ? `感谢你游玩《${script.title}》` : '感谢你玩AI不在场证明！'}
    >
      <Text 
        style={{ 
          color: '#FFFFFF', 
          fontSize: '16px', 
          lineHeight: '1.6',
          fontWeight: '500'
        }}
      >
        让我们看看你是否正确... 🕵️ {playerName || '调查者'} 的推理现在在你的聊天界面中。
      </Text>
      <br></br>
      <Text 
        style={{ 
          color: '#E8E8E8', 
          fontSize: '15px', 
          lineHeight: '1.6'
        }}
      >
        你现在可以与凶手聊天，他已被配置为尽可能诚实地回答你的问题。他可以告诉你{script ? `《${script.title}》` : '本案'}真正发生了什么。
      </Text>
      <br></br>
      <Text 
        size="xs"
        style={{ 
          color: '#B8B8B8', 
          fontSize: '13px', 
          lineHeight: '1.5',
          background: 'rgba(0, 194, 255, 0.1)',
          padding: '12px',
          borderRadius: '8px',
          border: '1px solid rgba(0, 194, 255, 0.3)'
        }}
      >
        你可能没有意识到，但这个游戏实际上是为了测试大语言模型如何被提示以避免<a href="https://arxiv.org/abs/2402.07896" style={{color: '#4ECCA3', textDecoration: 'none'}}>粉红大象</a>！每个嫌疑人都有自己的秘密，每次你与他们互动时，这个秘密都会在他们的上下文窗口中详细说明。然而，希望你没有遇到嫌疑人公然泄露他们秘密的聊天（例如，管理员帕特里夏透露她对丈夫暴力杰瑞的隐藏仇恨！）。通过使用违规和原则精炼系统进行提示，我们能够避免嫌疑人泄露他们想要隐瞒的事实（查看我们的<a href="https://github.com/ironman5366/ai-murder-mystery-hackathon" style={{color: '#4ECCA3', textDecoration: 'none'}}>GitHub</a>了解更多信息）。
      </Text>
      <br></br>
      <Text 
        size="xs"
        style={{ 
          color: '#B8B8B8', 
          fontSize: '13px', 
          lineHeight: '1.5'
        }}
      >
        你喜欢这个游戏吗？在社交媒体上告诉我们你的想法！如果你想在这个想法的高级实现上合作，请给Paul Scotti发邮件scottibrain+aialibis[at]gmail.com，邮件标题包含"AI Alibis"。
      </Text>
      <Button 
        onClick={onClose} 
        mt="lg"
        style={{
          background: '#00C2FF',
          border: '2px solid #00C2FF',
          color: '#FFFFFF',
          fontWeight: '800',
          textTransform: 'none',
          letterSpacing: '0.2px',
          fontSize: '18px',
          padding: '10px 28px',
          filter: 'contrast(1.15) brightness(1.05)'
        }}
      >
        明白了！
      </Button>
    </BaseModal>
  );
};

export default IntroModal;