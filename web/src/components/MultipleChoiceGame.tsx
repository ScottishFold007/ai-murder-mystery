import React, { useMemo, useState } from 'react';
import { Button, Radio, Stack, Title, Text, Loader } from '@mantine/core';
import { QuizQuestion, Script } from '../types/script';
import invokeAI from '../api/invoke';
import { useSessionContext } from '../providers/sessionContext';

interface MultipleChoiceGameProps {
  onBackToGame: (answers: string[]) => void;
  onResumeGame: () => void;
  questions?: QuizQuestion[]; // 若不传则回退到旧的默认题面（向后兼容）
  script?: Script | null; // 当前剧本信息，用于获取凶手和动机
}

// 旧的内置题面（安达山案），用于兼容历史逻辑
const legacyQuestions: QuizQuestion[] = [
  {
    question: '谁杀了受害者文斯？(问题1/3)',
    choices: ['暴力杰瑞', '管理员帕特里夏', '孤独汉娜', '业余拉里', '无辜肯']
  },
  {
    question: '杀害受害者文斯的动机是什么？(问题2/3)',
    choices: ['被水桶黑手党雇佣杀人', '被管理员帕特里夏雇佣杀人', '夺回被盗的宝藏', '为失踪马塞尔的谋杀复仇', '为可爱公主复仇']
  },
  {
    question: '谁杀了失踪马塞尔？(最终问题)',
    choices: ['暴力杰瑞', '管理员帕特里夏', '孤独汉娜', '业余拉里', '无辜肯']
  }
];

const MultipleChoiceGame: React.FC<MultipleChoiceGameProps> = ({ onBackToGame, onResumeGame, questions, script }) => {
  const [stage, setStage] = useState<'killer' | 'motive' | 'failed' | 'generating'>('killer');
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
  const [killerAnswer, setKillerAnswer] = useState<string>('');
  const [motiveOptions, setMotiveOptions] = useState<string[]>([]);
  const sessionId = useSessionContext();

  // 只有明确传入了questions且script为空时，才使用旧逻辑
  // 如果同时有script和questions，优先使用新的两阶段系统
  const isLegacyMode = questions && questions.length > 0 && !script;
  
  // 旧逻辑状态（向后兼容）
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const qList = useMemo(() => (isLegacyMode ? questions : legacyQuestions), [questions, isLegacyMode]);

  // 获取当前剧本的凶手和角色列表
  const killer = script?.characters.find(c => c.isKiller);
  const allCharacters = script?.characters || [];
  const characterNames = allCharacters.map(c => c.name);

  // 生成动机选项的函数
  const generateMotiveOptions = async (killerName: string) => {
    if (!script || !killer) return;
    
    setStage('generating');
    
    try {
      const prompt = `请为谋杀案剧本《${script.title}》生成4个作案动机选项。
凶手是：${killerName}
真实动机：${killer.secret}
剧本背景：${script.globalStory}

请生成6个选项，其中某个是真实动机（基于凶手的secret），其余5个是合理但错误的动机。**正确答案的位置要随机放置，不限于第一个。**
请以JSON格式回复，示例格式如下：
{
  "motives": ["真实动机", "错误动机1", "错误动机2", "错误动机3", "错误动机4", "错误动机5"], // 6个选项，真实动机的位置随机放置
  "correctIndex": 0  // 正确答案在motives中的位置，
}

要求：
1. 所有动机都要符合剧本背景和角色设定
2. 错误动机要有一定迷惑性，但不能是真实答案
3. 动机描述要简洁明了，每个不超过20字
4. 确保正确答案的位置的随机性，也就是不一定非得在第一个，随机摆放`;

      const response = await invokeAI({
        globalStory: script.globalStory,
        sessionId: sessionId,
        characterFileVersion: 'motive_generator',
        actor: {
          id: -1,
          name: 'MotiveGenerator',
          bio: '动机生成器',
          personality: '逻辑严密，善于分析',
          context: prompt,
          secret: '',
          violation: '',
          image: '',
          messages: [{ role: 'user', content: prompt }]
        },
        detectiveName: script.characters?.find(char => char.isPlayer)?.name,
        victimName: script.characters?.find(char => char.isVictim)?.name
      });

      // 解析JSON响应
      const jsonMatch = response.final_response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const motiveData = JSON.parse(jsonMatch[0]);
        setMotiveOptions(motiveData.motives);
        setStage('motive');
      } else {
        throw new Error('无法解析AI生成的动机选项');
      }
    } catch (error) {
      console.error('生成动机选项失败:', error);
      // 回退到默认选项
      setMotiveOptions([
        '报复杀害',
        '财务纠纷', 
        '情感冲突',
        '意外杀害'
      ]);
      setStage('motive');
    } finally {
      // 无需设置 isGenerating，因为 stage 已经改变
    }
  };

  // 新逻辑的事件处理
  const handleKillerSelection = () => {
    if (!selectedChoice || !killer) return;
    
    setKillerAnswer(selectedChoice);
    
    // 检查是否答对凶手
    if (selectedChoice === killer.name) {
      // 答对了，进入动机选择阶段
      generateMotiveOptions(selectedChoice);
    } else {
      // 答错了，显示"冤枉好人"
      setStage('failed');
    }
    
    setSelectedChoice(null);
  };

  const handleMotiveSelection = () => {
    if (!selectedChoice) return;
    
    // 检查动机是否正确（这里我们简化逻辑，任何选择都算对）
    const finalAnswers = [killerAnswer, selectedChoice];
    onBackToGame(finalAnswers);
  };

  const handleCloseGame = () => {
    onResumeGame(); // 回到主界面
  };

  // 旧逻辑的处理函数（向后兼容）
  const handleNextQuestion = () => {
    if (selectedChoice !== null) {
      const newAnswers = [...answers, selectedChoice];
      setAnswers(newAnswers);
      setSelectedChoice(null); // Reset selected choice for next question
      if (currentQuestionIndex < qList.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
      } else {
        onBackToGame(newAnswers); // Pass answers back when game is finished
      }
    }
  };

  const handleChoiceChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedChoice(event.currentTarget.value);
  };

  // 如果是旧逻辑模式，直接渲染旧UI
  if (isLegacyMode) {
    return (
      <div 
        className="mystery-card"
        style={{
          padding: '24px',
          background: 'linear-gradient(135deg, #1A1A2E 0%, #1E1E1E 100%)',
          border: '1px solid #00C2FF',
          borderRadius: '16px',
          boxShadow: '0 0 30px rgba(0, 194, 255, 0.3)',
          maxWidth: '600px',
          margin: '0 auto'
        }}
      >
        <Title 
          order={2} 
          className="mystery-title"
          style={{
            textAlign: 'center',
            marginBottom: '24px',
            color: '#00C2FF',
            textShadow: '0 0 10px rgba(0, 194, 255, 0.5)'
          }}
        >
          {qList[currentQuestionIndex].question}
        </Title>
        <br></br>
        <Stack>
          {qList[currentQuestionIndex].choices.map((choice, index) => (
            <Radio
              key={index}
              value={choice}
              checked={selectedChoice === choice}
              onChange={handleChoiceChange}
              label={choice}
              styles={{
                label: {
                  color: '#E0E0E0',
                  fontSize: '16px',
                  padding: '12px',
                  borderRadius: '8px',
                  background: selectedChoice === choice 
                    ? 'rgba(0, 194, 255, 0.1)' 
                    : 'rgba(255, 255, 255, 0.05)',
                  border: selectedChoice === choice 
                    ? '1px solid #00C2FF' 
                    : '1px solid #333333',
                  transition: 'all 0.3s ease',
                  cursor: 'pointer'
                },
                radio: {
                  '&:checked': {
                    backgroundColor: '#00C2FF',
                    borderColor: '#00C2FF'
                  }
                }
              }}
            />
          ))}
        </Stack>
        <br></br>
        <Button 
          onClick={handleNextQuestion} 
          disabled={!selectedChoice}
          style={{
            width: '100%',
            marginBottom: '16px',
            fontSize: '18px',
            padding: '12px 28px',
            background: currentQuestionIndex < qList.length - 1 ? '#00C2FF' : '#E63946',
            border: `2px solid ${currentQuestionIndex < qList.length - 1 ? '#00C2FF' : '#E63946'}`,
            color: '#FFFFFF',
            fontWeight: '700',
            filter: 'contrast(1.1)'
          }}
        >
          {currentQuestionIndex < qList.length - 1 ? '下一题' : '完成'}
        </Button>
        <Button
          onClick={onResumeGame}
          size="sm"
          style={{ 
            marginTop: '10px', 
            alignSelf: 'center',
            background: '#4ECCA3',
            border: '2px solid #4ECCA3',
            color: '#121212',
            fontWeight: '700',
            filter: 'contrast(1.1)'
          }}
        >
          返回
        </Button>
      </div>
    );
  }

  // 新的两阶段逻辑UI
  return (
    <div 
      className="mystery-card"
      style={{
        padding: '24px',
        background: 'linear-gradient(135deg, #1A1A2E 0%, #1E1E1E 100%)',
        border: '1px solid #00C2FF',
        borderRadius: '16px',
        boxShadow: '0 0 30px rgba(0, 194, 255, 0.3)',
        maxWidth: '600px',
        margin: '0 auto'
      }}
    >
      {/* 第一阶段：识别凶手 */}
      {stage === 'killer' && (
        <>
          <Title 
            order={2} 
            className="mystery-title"
            style={{
              textAlign: 'center',
              marginBottom: '24px',
              color: '#00C2FF',
              textShadow: '0 0 10px rgba(0, 194, 255, 0.5)'
            }}
          >
            🕵️ 第一步：谁是凶手？
          </Title>
          <Text style={{ textAlign: 'center', marginBottom: '20px', color: '#E0E0E0' }}>
            请选择你认为的凶手
          </Text>
          <Stack>
            {characterNames.map((name, index) => (
              <Radio
                key={index}
                value={name}
                checked={selectedChoice === name}
                onChange={handleChoiceChange}
                label={name}
                styles={{
                  label: {
                    color: '#E0E0E0',
                    fontSize: '16px',
                    padding: '12px',
                    borderRadius: '8px',
                    background: selectedChoice === name 
                      ? 'rgba(0, 194, 255, 0.1)' 
                      : 'rgba(255, 255, 255, 0.05)',
                    border: selectedChoice === name 
                      ? '1px solid #00C2FF' 
                      : '1px solid #333333',
                    transition: 'all 0.3s ease',
                    cursor: 'pointer'
                  },
                  radio: {
                    '&:checked': {
                      backgroundColor: '#00C2FF',
                      borderColor: '#00C2FF'
                    }
                  }
                }}
              />
            ))}
          </Stack>
          <br></br>
          <Button
            onClick={handleKillerSelection}
            disabled={!selectedChoice}
            styles={{
              root: {
                width: '100%',
                marginBottom: '16px',
                fontSize: '18px',
                padding: '12px 28px',
                backgroundColor: selectedChoice ? '#1565C0' : '#666666',
                border: 'none',
                color: '#FFFFFF',
                fontWeight: 700,
                cursor: selectedChoice ? 'pointer' : 'not-allowed',
                '&:disabled': {
                  backgroundColor: '#666666',
                  color: '#FFFFFF',
                  opacity: 1
                }
              },
              inner: {
                color: '#FFFFFF',
                fontWeight: 700
              },
              label: {
                color: '#FFFFFF',
                fontWeight: 700
              }
            }}
          >
            确认选择
          </Button>
        </>
      )}

      {/* 生成动机选项阶段 */}
      {stage === 'generating' && (
        <>
          <Title 
            order={2} 
            className="mystery-title"
            style={{
              textAlign: 'center',
              marginBottom: '24px',
              color: '#00C2FF',
              textShadow: '0 0 10px rgba(0, 194, 255, 0.5)'
            }}
          >
            🤖 AI正在生成动机选项...
          </Title>
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <Loader size="lg" color="#00C2FF" />
            <Text style={{ marginTop: '16px', color: '#E0E0E0' }}>
              正在分析剧本背景，生成合理的作案动机选项
            </Text>
          </div>
        </>
      )}

      {/* 第二阶段：选择动机 */}
      {stage === 'motive' && (
        <>
          <Title 
            order={2} 
            className="mystery-title"
            style={{
              textAlign: 'center',
              marginBottom: '24px',
              color: '#00C2FF',
              textShadow: '0 0 10px rgba(0, 194, 255, 0.5)'
            }}
          >
            🎯 第二步：作案动机是什么？
          </Title>
          <Text style={{ textAlign: 'center', marginBottom: '20px', color: '#E0E0E0' }}>
            凶手是：<span style={{ color: '#FFB74D', fontWeight: 'bold' }}>{killerAnswer}</span>
          </Text>
          <Text style={{ textAlign: 'center', marginBottom: '20px', color: '#B8B8B8' }}>
            请选择最符合剧情的作案动机
          </Text>
          <Stack>
            {motiveOptions.map((motive, index) => (
              <Radio
                key={index}
                value={motive}
                checked={selectedChoice === motive}
                onChange={handleChoiceChange}
                label={motive}
                styles={{
                  label: {
                    color: '#E0E0E0',
                    fontSize: '16px',
                    padding: '12px',
                    borderRadius: '8px',
                    background: selectedChoice === motive 
                      ? 'rgba(0, 194, 255, 0.1)' 
                      : 'rgba(255, 255, 255, 0.05)',
                    border: selectedChoice === motive 
                      ? '1px solid #00C2FF' 
                      : '1px solid #333333',
                    transition: 'all 0.3s ease',
                    cursor: 'pointer'
                  },
                  radio: {
                    '&:checked': {
                      backgroundColor: '#00C2FF',
                      borderColor: '#00C2FF'
                    }
                  }
                }}
              />
            ))}
          </Stack>
          <br></br>
          <Button
            onClick={handleMotiveSelection}
            disabled={!selectedChoice}
            styles={{
              root: {
                width: '100%',
                marginBottom: '16px',
                fontSize: '18px',
                padding: '12px 28px',
                backgroundColor: selectedChoice ? '#E63946' : '#B8B8B8',
                border: `2px solid ${selectedChoice ? '#E63946' : '#999999'}`,
                color: '#FFFFFF',
                fontWeight: 700,
                filter: 'contrast(1.1)',
                opacity: selectedChoice ? 1 : 0.7,
                cursor: selectedChoice ? 'pointer' : 'not-allowed',
                '&:disabled': {
                  backgroundColor: '#B8B8B8',
                  borderColor: '#999999',
                  color: '#FFFFFF',
                  opacity: 0.7
                }
              },
              inner: {
                color: '#FFFFFF',
                fontWeight: 700
              },
              label: {
                color: '#FFFFFF',
                fontWeight: 700
              }
            }}
          >
            提交最终推理
          </Button>
        </>
      )}

      {/* 失败阶段：冤枉好人 */}
      {stage === 'failed' && (
        <>
          <Title 
            order={2} 
            className="mystery-title"
            style={{
              textAlign: 'center',
              marginBottom: '24px',
              color: '#E63946',
              textShadow: '0 0 10px rgba(230, 57, 70, 0.5)'
            }}
          >
            ❌ 推理失败！
          </Title>
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <Text size="xl" style={{ color: '#E63946', fontWeight: 'bold', marginBottom: '16px' }}>
              你冤枉好人了！
            </Text>
            <Text style={{ color: '#E0E0E0', marginBottom: '20px' }}>
              你指控的 <span style={{ color: '#FFB74D' }}>{killerAnswer}</span> 并不是真正的凶手。
            </Text>
            <Text style={{ color: '#B8B8B8', marginBottom: '30px' }}>
              真相仍然隐藏在迷雾中...
            </Text>
          </div>
          <Button 
            onClick={handleCloseGame} 
            style={{
              width: '100%',
              fontSize: '18px',
              padding: '12px 28px',
              background: '#4ECCA3',
              border: '2px solid #4ECCA3',
              color: '#121212',
              fontWeight: '700',
              filter: 'contrast(1.1)'
            }}
          >
            回到游戏
          </Button>
        </>
      )}

      {/* 返回按钮（除了失败页面都显示） */}
      {stage !== 'failed' && (
        <Button
          onClick={onResumeGame}
          size="sm"
          style={{ 
            marginTop: '10px', 
            alignSelf: 'center',
            background: '#4ECCA3',
            border: '2px solid #4ECCA3',
            color: '#121212',
            fontWeight: '700',
            filter: 'contrast(1.1)'
          }}
        >
          返回
        </Button>
      )}
    </div>
  );
};

export default MultipleChoiceGame;