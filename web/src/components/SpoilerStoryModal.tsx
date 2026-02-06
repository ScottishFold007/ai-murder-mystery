import React, { useState, useEffect } from 'react';
import { Modal, Button, Text, ScrollArea, Paper, Stack, Loader, Progress, TypographyStylesProvider, Group, Tooltip, ActionIcon } from '@mantine/core';
import { IconHistory, IconDeviceFloppy } from '@tabler/icons-react';
import { Script } from '../types/script';
import { invokeAIStream } from '../api/invoke';
import { useSessionContext } from '../providers/sessionContext';
import SpoilerHistoryModal from './SpoilerHistoryModal';
import { API_URL } from '../constants';

// 增强的Markdown转HTML函数
const convertMarkdownToHtml = (markdown: string): string => {
  if (!markdown.trim()) return '';
  
  let html = markdown
    // 先处理标题（避免被段落标签包围）
    .replace(/^## (.*$)/gim, '</p><h2 style="color: #FFD700; font-size: 24px; font-weight: bold; margin: 32px 0 20px 0; border-bottom: 2px solid #FFD700; padding-bottom: 10px; text-shadow: 0 0 10px rgba(255, 215, 0, 0.5);">$1</h2><p style="margin: 16px 0; text-indent: 2em; line-height: 1.8;">')
    .replace(/^### (.*$)/gim, '</p><h3 style="color: #00FFFF; font-size: 20px; font-weight: bold; margin: 24px 0 16px 0; text-shadow: 0 0 8px rgba(0, 255, 255, 0.4);">$1</h3><p style="margin: 16px 0; text-indent: 2em; line-height: 1.8;">')
    // 粗体和斜体
    .replace(/\*\*(.*?)\*\*/g, '<strong style="color: #FFD700; font-weight: bold; text-shadow: 0 0 5px rgba(255, 215, 0, 0.3);">$1</strong>')
    .replace(/\*(.*?)\*/g, '<em style="color: #B8B8B8; font-style: italic; opacity: 0.9;">$1</em>')
    // 段落分隔
    .replace(/\n\n+/g, '</p><p style="margin: 20px 0; text-indent: 2em; line-height: 1.8;">')
    // 单个换行
    .replace(/\n/g, '<br/>');
  
  // 包装在段落标签中，并清理多余的标签
  html = '<p style="margin: 16px 0; text-indent: 2em; line-height: 1.8;">' + html + '</p>';
  
  // 清理多余的空段落
  html = html
    .replace(/<p[^>]*><\/p>/g, '')
    .replace(/<p[^>]*>\s*<\/p>/g, '')
    .replace(/(<\/h[23]>)<p[^>]*>(<h[23])/g, '$1$2');
  
  return html;
};

interface SpoilerStoryModalProps {
  opened: boolean;
  onClose: () => void;
  script?: Script;
  isRevealed: boolean; // 是否已完成游戏
}

const SpoilerStoryModal: React.FC<SpoilerStoryModalProps> = ({ 
  opened, 
  onClose, 
  script, 
  isRevealed 
}) => {
  const [storyContent, setStoryContent] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [generationStartTime, setGenerationStartTime] = useState<number>(0);
  const [historyModalOpened, setHistoryModalOpened] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const sessionId = useSessionContext();

  // 重置状态当模态框关闭时
  useEffect(() => {
    if (!opened) {
      setStoryContent('');
      setIsGenerating(false);
      setGenerationProgress(0);
      setHasGenerated(false);
      setGenerationStartTime(0);
      setIsSaving(false);
    }
  }, [opened]);

  // 生成完整故事
  const generateStory = async () => {
    if (!script || !isRevealed) return;
    
    setIsGenerating(true);
    setStoryContent('');
    setGenerationProgress(0);
    setGenerationStartTime(Date.now());
    
    try {
      // 获取关键角色信息
      const victim = script.characters.find(c => c.isVictim);
      const player = script.characters.find(c => c.isPlayer);
      
      // 构建详细的故事生成提示词
      const storyPrompt = `基于以下剧本信息，创作一个完整的谋杀悬疑故事。

剧本：《${script.title}》
${script.description}
${script.globalStory}

角色：
${script.characters.map(char => `${char.name}：${char.bio}，性格${char.personality}。秘密：${char.secret}${char.isKiller ? '【真凶】' : ''}${char.isVictim ? '【受害者】' : ''}${char.isPlayer ? '【侦探】' : ''}`).join('\n')}

要求：
- 直接开始故事，禁止任何开场白、问候、解释
- 小说手法：场景描写、心理刻画、对话
- 故事结构：案发前伏笔→案发过程→调查线索→真相揭示
- Markdown格式：## 标题，**粗体**，*斜体*
- 文学表达：氛围营造、细节描写、节奏控制
- 逻辑自洽：时间线、证据链完整
- 2500-3500字

禁止：开场白、称呼、前言、解释性文字。立即开始故事情节。`;

      // 使用流式API生成故事
      const cancelStream = invokeAIStream({
        globalStory: script.globalStory,
        sessionId: sessionId,
        characterFileVersion: 'story_narrator',
        actor: {
          id: -1,
          name: 'StoryNarrator',
          bio: '专业的故事叙述者，擅长将复杂的案件以引人入胜的故事形式呈现',
          personality: '文笔优美，逻辑清晰，善于营造氛围',
          context: storyPrompt,
          secret: '',
          violation: '',
          image: '',
          messages: [{ role: 'user', content: storyPrompt }]
        },
        detectiveName: player?.name || '侦探',
        victimName: victim?.name || '受害者',
        onChunk: (content: string) => {
          setStoryContent(prev => {
            let newContent = prev + content;
            
            // 过滤掉开场白和多余内容
            if (newContent.length < 200) {
              // 如果检测到常见的开场白模式，跳过这些内容
              const skipPatterns = [
                /^(好的|是的|明白|收到|了解)[，。！]/,
                /^[^。！？]*[大人|您|阁下|先生|女士][，。]/,
                /^这.*[案件|故事|事件].*如同/,
                /^请容.*[在下|我|小生].*为您/,
                /^让.*[我|在下].*来.*[讲述|叙述|说明]/
              ];
              
              for (const pattern of skipPatterns) {
                if (pattern.test(newContent)) {
                  // 找到第一个标题或段落开始的位置
                  const storyStart = newContent.search(/^##|^[^，。！？]*[。！？]\s*\n/m);
                  if (storyStart > 0) {
                    newContent = newContent.substring(storyStart);
                  }
                  break;
                }
              }
            }
            
            // 根据内容长度更新进度
            const estimatedTotalLength = 3500; // 预估总长度
            const progress = Math.min((newContent.length / estimatedTotalLength) * 100, 95);
            setGenerationProgress(progress);
            return newContent;
          });
        },
        onEnd: () => {
          setIsGenerating(false);
          setGenerationProgress(100);
          setHasGenerated(true);
        },
        onError: (error: string) => {
          console.error('故事生成失败:', error);
          setIsGenerating(false);
          setStoryContent('故事生成失败，请重试。');
        }
      });

      // 存储取消函数以备需要时使用
      return cancelStream;
    } catch (error) {
      console.error('故事生成出错:', error);
      setIsGenerating(false);
      setStoryContent('故事生成出错，请重试。');
    }
  };

  // 保存故事到数据库
  const saveStoryToDatabase = async () => {
    if (!script || !storyContent.trim()) return;
    
    setIsSaving(true);
    try {
      const generationDuration = generationStartTime > 0 ? (Date.now() - generationStartTime) / 1000 : 0;
      
      const storyData = {
        scriptId: script.id,
        title: `《${script.title}》剧透故事`,
        content: storyContent,
        generationDuration,
        // aiModel和promptVersion由后端自动填充
        sessionId: sessionId
      };
      
      const response = await fetch(`${API_URL}/db/spoiler-stories/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(storyData),
      });
      
      const data = await response.json();
      
      if (data.success) {
        console.log('✅ 剧透故事已保存到数据库');
      } else {
        console.error('❌ 保存剧透故事失败:', data.message);
      }
    } catch (error) {
      console.error('❌ 保存剧透故事出错:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // 手动保存当前故事
  const handleManualSave = () => {
    if (storyContent.trim()) {
      saveStoryToDatabase();
    }
  };

  // 查看历史故事的回调
  const handleViewHistoryStory = (story: any) => {
    setStoryContent(story.content);
    setHasGenerated(true);
    setHistoryModalOpened(false);
  };

  // 当模态框打开且满足条件时自动生成故事
  useEffect(() => {
    if (opened && script && isRevealed && !hasGenerated && !isGenerating) {
      generateStory();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opened, script, isRevealed, hasGenerated, isGenerating]);

  // 当故事生成完成后自动保存
  useEffect(() => {
    if (hasGenerated && storyContent.trim() && !isGenerating && !isSaving) {
      saveStoryToDatabase();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasGenerated, storyContent]);

  if (!script) {
    return (
      <Modal 
        opened={opened} 
        onClose={onClose} 
        size="md"
        title={<Text size="lg" fw={700} style={{ color: '#E63946' }}>剧透故事</Text>}
        styles={{
          content: { backgroundColor: '#1A1A2E' },
          header: { backgroundColor: '#1A1A2E', borderBottom: '1px solid #333' }
        }}
      >
        <Text style={{ color: '#E0E0E0', textAlign: 'center', padding: '20px' }}>
          暂无剧本数据，无法生成故事
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
        <Group justify="space-between" style={{ width: '100%' }}>
          <Text size="xl" fw={700} style={{ 
            color: '#FFFFFF',
            textShadow: '0 0 15px rgba(167, 139, 250, 0.8), 0 2px 4px rgba(0, 0, 0, 1)'
          }}>
            📚 剧透故事 - 《{script.title}》
          </Text>
          
          <Group gap="xs">
            {isRevealed && (
              <Tooltip label="查看历史剧透故事">
                <ActionIcon
                  variant="filled"
                  color="cyan"
                  size="lg"
                  onClick={() => setHistoryModalOpened(true)}
                  styles={{
                    root: {
                      boxShadow: '0 0 10px rgba(0, 255, 255, 0.5)',
                      '&:hover': {
                        boxShadow: '0 0 15px rgba(0, 255, 255, 0.7)',
                        transform: 'translateY(-1px)'
                      }
                    }
                  }}
                >
                  <IconHistory size={18} />
                </ActionIcon>
              </Tooltip>
            )}
            
            {hasGenerated && storyContent.trim() && (
              <Tooltip label="保存当前故事">
                <ActionIcon
                  variant="filled"
                  color="green"
                  size="lg"
                  onClick={handleManualSave}
                  disabled={isSaving}
                  loading={isSaving}
                  styles={{
                    root: {
                      boxShadow: '0 0 10px rgba(76, 236, 163, 0.5)',
                      '&:hover': {
                        boxShadow: '0 0 15px rgba(76, 236, 163, 0.7)',
                        transform: 'translateY(-1px)'
                      }
                    }
                  }}
                >
                  <IconDeviceFloppy size={18} />
                </ActionIcon>
              </Tooltip>
            )}
          </Group>
        </Group>
      }
      styles={{
        content: { 
          backgroundColor: 'transparent',
          border: 'none',
          boxShadow: 'none'
        },
        header: { 
          backgroundColor: 'rgba(26, 26, 46, 0.95)',
          borderBottom: '2px solid #A78BFA',
          backdropFilter: 'blur(10px)'
        },
        body: {
          padding: 0
        }
      }}
    >
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
        minHeight: '80vh',
        padding: '20px'
      }}>
        <Stack gap="md" style={{ maxWidth: '1000px', margin: '0 auto' }}>
          {/* 状态提示 */}
          <Paper p="md" style={{
            background: 'rgba(0, 0, 0, 0.8)',
            border: `2px solid ${isRevealed ? '#A78BFA' : '#E63946'}`,
            borderRadius: '12px',
            textAlign: 'center'
          }}>
            {!isRevealed ? (
              <Text size="md" fw={700} style={{ color: '#E63946' }}>
                ⚠️ 请先完成游戏才能查看完整故事
              </Text>
            ) : isGenerating ? (
              <Stack gap="sm">
                <Text size="md" fw={700} style={{ color: '#A78BFA' }}>
                  🤖 AI正在为您创作完整的案件故事...
                </Text>
                <Progress 
                  value={generationProgress} 
                  color="#A78BFA"
                  size="md"
                  striped
                  animated
                />
                <Text size="sm" style={{ color: '#B8B8B8' }}>
                  正在生成中... {Math.round(generationProgress)}%
                </Text>
              </Stack>
            ) : (
              <Text size="md" fw={700} style={{ color: '#4ECCA3' }}>
                ✅ 故事生成完成，请慢慢享受这个精彩的案件故事
              </Text>
            )}
          </Paper>

          {/* 故事内容区域 */}
          {isRevealed && (
            <Paper p="xl" style={{
              background: 'rgba(0, 0, 0, 0.9)',
              border: '2px solid #A78BFA',
              borderRadius: '16px',
              minHeight: '60vh',
              boxShadow: '0 0 20px rgba(167, 139, 250, 0.3)'
            }}>
              <ScrollArea h="60vh">
                {isGenerating && !storyContent ? (
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'center', 
                    alignItems: 'center', 
                    height: '200px' 
                  }}>
                    <Stack align="center" gap="md">
                      <Loader size="lg" color="#A78BFA" />
                      <Text style={{ color: '#A78BFA' }}>
                        正在构思故事开头...
                      </Text>
                    </Stack>
                  </div>
                ) : (
                  <TypographyStylesProvider>
                    <div 
                      style={{
                        color: '#FFFFFF',
                        fontSize: '16px',
                        lineHeight: '1.8',
                        fontFamily: '"Noto Serif SC", "Georgia", serif',
                      }}
                      dangerouslySetInnerHTML={{
                        __html: convertMarkdownToHtml(storyContent || '等待故事生成...')
                      }}
                    />
                    {isGenerating && (
                      <span style={{
                        display: 'inline-block',
                        width: '2px',
                        height: '20px',
                        backgroundColor: '#A78BFA',
                        animation: 'blink 1s infinite',
                        marginLeft: '2px'
                      }}>|</span>
                    )}
                  </TypographyStylesProvider>
                )}
              </ScrollArea>
            </Paper>
          )}

          {/* 操作按钮 */}
          <div style={{
            display: 'flex',
            gap: '12px',
            justifyContent: 'center'
          }}>
            {isRevealed && hasGenerated && (
              <Button
                onClick={generateStory}
                disabled={isGenerating}
                styles={{
                  root: {
                    backgroundColor: isGenerating ? '#666666' : '#A78BFA',
                    color: '#FFFFFF',
                    fontWeight: '700',
                    border: `1px solid ${isGenerating ? '#666666' : '#A78BFA'}`,
                    boxShadow: isGenerating ? 'none' : '0 0 15px rgba(167, 139, 250, 0.5)',
                    '&:hover': isGenerating ? {} : {
                      backgroundColor: '#9F7AEA',
                      boxShadow: '0 0 20px rgba(167, 139, 250, 0.7)',
                      transform: 'translateY(-1px)'
                    }
                  }
                }}
              >
                🔄 重新生成故事
              </Button>
            )}
            <Button 
              onClick={onClose}
              styles={{
                root: {
                  backgroundColor: '#4ECCA3',
                  color: '#FFFFFF',
                  fontWeight: '700',
                  border: '1px solid #4ECCA3',
                  boxShadow: '0 0 15px rgba(76, 236, 163, 0.5)',
                  '&:hover': {
                    backgroundColor: '#45B7AA',
                    boxShadow: '0 0 20px rgba(76, 236, 163, 0.7)',
                    transform: 'translateY(-1px)'
                  }
                }
              }}
            >
              关闭
            </Button>
          </div>
        </Stack>
      </div>

      {/* 添加光标闪烁动画 */}
      <style>{`
        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }
      `}</style>

      {/* 历史剧透故事模态框 */}
      <SpoilerHistoryModal
        opened={historyModalOpened}
        onClose={() => setHistoryModalOpened(false)}
        script={script}
        onViewStory={handleViewHistoryStory}
      />
    </Modal>
  );
};

export default SpoilerStoryModal;
