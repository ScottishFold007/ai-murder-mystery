import React, { useState, useEffect } from 'react';
import { Button, Text } from '@mantine/core';
import { Script } from '../types/script';
import BaseModal from './BaseModal';

interface IntroModalProps {
  opened: boolean;
  onClose: () => void;
  detectiveName?: string;
  script?: Script | null;
}

const IntroModal: React.FC<IntroModalProps> = ({ opened, onClose, detectiveName, script }) => {
  const [displayedText, setDisplayedText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  // 逐字显示不需要触发重渲染，索引使用局部变量即可

  // 生成基于剧本的动态内容
  const generateDynamicContent = (script: Script | null, detectiveName?: string): string => {
    // 获取玩家角色名字
    const getPlayerName = (): string => {
      if (script) {
        const playerCharacter = script.characters.find(c => c.isPlayer);
        if (playerCharacter) {
          return playerCharacter.name;
        }
        // 兼容旧数据
        if (script.settings?.playerName) {
          return script.settings.playerName;
        }
      }
      return detectiveName || '调查者';
    };

    if (!script) {
      const playerName = getPlayerName();
      return `你是${playerName}，正在调查这起谋杀案。\n\n故事情节、线索和嫌疑人的不在场证明都是固定的，每个嫌疑人都向调查人员隐瞒了案件的一些信息。每个嫌疑人都知道其他嫌疑人的重要信息，让你能够通过聊天拼凑出真相。\n\n你的助手可以根据你的要求调查地点，并为你提供观察证据。你可以要求助手给你案件概览或搜索特定地点寻找线索。\n\n从你的对话中做笔记，拼凑出真相。当你准备好时，点击“提交推理”按钮做出你的推理。`;
    }

    const assistant = script.characters.find(char => char.isAssistant);
    const victim = script.characters.find(char => char.isVictim);
    const playerName = getPlayerName();
    
    let content = `欢迎来到《${script.title}》\n\n`;
    
    // 玩家身份介绍
    content += `你是${playerName}，正在调查这起谋杀案。\n\n`;
    
    content += `${script.description}\n\n`;
    
    if (victim) {
      content += `受害者是${victim.name}，${victim.bio}。\n\n`;
    }
    
    content += `在这个剧本中，每个角色都有自己的秘密和动机。通过与他们对话，收集线索，拼凑出完整的真相。\n\n`;
    
    // 使用通用的"调查方"而不是具体的"警方"
    content += `故事情节、线索和嫌疑人的不在场证明都是固定的，每个嫌疑人都向调查方隐瞒了案件的一些信息。每个嫌疑人都知道其他嫌疑人的重要信息，让你能够通过聊天拼凑出真相。\n\n`;
    
    if (assistant) {
      content += `你的助手${assistant.name}可以根据你的要求提供案件信息和调查建议。建议先与${assistant.name}对话，了解案件概况。\n\n`;
    }
    
    content += `从你的对话中做笔记，拼凑出谁是真凶、为什么以及如何作案的。当你准备好时，点击“提交推理”按钮做出你的推理。`;
    
    return content;
  };

  // 流式显示文本
  useEffect(() => {
    if (!opened) return;

    setIsGenerating(true);
    setDisplayedText('');

    const fullText = generateDynamicContent(script || null, detectiveName);
    const words: string[] = fullText.split('');

    let index = 0;
    const interval = setInterval(() => {
      if (index >= words.length) {
        clearInterval(interval);
        setIsGenerating(false);
        return;
      }
      const currentChar = words[index];
      if (currentChar !== undefined) {
        setDisplayedText(prev => prev + currentChar);
      }
      index += 1;
    }, 30); // 每30ms显示一个字符

    return () => clearInterval(interval);
  }, [opened, script, detectiveName]);

  // 重置状态当模态框关闭时
  useEffect(() => {
    if (!opened) {
      setDisplayedText('');
      setIsGenerating(false);
    }
  }, [opened]);

  return (
    <BaseModal
      opened={opened}
      onClose={onClose}
      size="lg"
      className="mystery-modal"
      variant="solid"
      title={
        <Text 
          size="lg" 
          fw={700} 
          style={{
            color: '#FFFFFF',
            fontSize: '24px',
            fontWeight: '700',
            letterSpacing: '1px'
          }}
        >
          {script ? `欢迎来到《${script.title}》` : '欢迎来到AI不在场证明'}
        </Text>
      }
    >
      <div style={{ minHeight: '300px' }}>
        <Text 
          style={{ 
            color: '#FFFFFF', 
            fontSize: '16px', 
            lineHeight: '1.8',
            fontWeight: '500',
            whiteSpace: 'pre-line'
          }}
        >
          {displayedText}
          {isGenerating && (
            <span 
              style={{
                color: '#00C2FF',
                opacity: 0.7
              }}
            >
              |
            </span>
          )}
        </Text>
        
        {!isGenerating && displayedText && (
          <Button 
            onClick={onClose}
            size="md"
            style={{
              background: '#00C2FF',
              color: '#FFFFFF',
              marginTop: '20px',
              fontWeight: 800,
              letterSpacing: '0.2px'
            }}
          >
            明白了，开始游戏！
          </Button>
        )}
      </div>
      
    </BaseModal>
  );
};

export default IntroModal;