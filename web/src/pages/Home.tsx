import React, { useState, useEffect, useCallback } from 'react';
import { AppShell, Burger, Button, Text } from '@mantine/core';
import Header from '../components/Header';
import ActorSidebar from '../components/ActorSidebar';
import ActorChat, { sendChatStream } from '../components/Actor';
import IntroModal from '../components/IntroModal';
import EndModal from '../components/EndModal';
import ExplanationModal from '../components/ExplanationModal';
import SecretsModal from '../components/SecretsModal';
import { useDisclosure } from '@mantine/hooks';
import { Actor, LLMMessage, useMysteryContext } from '../providers/mysteryContext';
import { useSessionContext } from '../providers/sessionContext';
import { useScriptContext } from '../providers/scriptContext';
import MultipleChoiceGame from '../components/MultipleChoiceGame';
import { QuizQuestion } from '../types/script';
import TabbedRightPanel from '../components/TabbedRightPanel';
import { ensureEvidencesInitialized } from '../utils/evidenceManager';
import { Evidence } from '../types/evidence';

export default function Home() {
  const { actors, setActors, globalStory } = useMysteryContext(); 
  const { currentScript } = useScriptContext();
  const [currActor, setCurrActor] = useState<number>(0);
  
  // 添加调试信息
  useEffect(() => {
  }, [currActor, actors]);
  
  // 添加actors变化的调试信息
  useEffect(() => {
  }, [actors]);
  const [opened, { toggle }] = useDisclosure();
  const [introModalOpened, setIntroModalOpened] = useState(true);
  const [endModalOpened, setEndModalOpened] = useState(false);
  const [explanationModalOpened, setExplanationModalOpened] = useState(false);
  const [secretsModalOpened, setSecretsModalOpened] = useState(false);
  const [endGame, setEndGame] = useState(false);
  const [postGame, setPostGame] = useState(false);
  const [hasEffectRun, setHasEffectRun] = useState(false);
  const [filteredActors, setFilteredActors] = useState(Object.values(actors));
  const [, setLoading] = useState(false);
  const [forcedMessageSent, setForcedMessageSent] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState<string[]>([]);
  const [cancelStream, setCancelStream] = useState<(() => void) | null>(null);
  const sessionId = useSessionContext();

  // 初始化证物数据
  useEffect(() => {
    if (currentScript && sessionId) {
      try {
        const evidences = ensureEvidencesInitialized(currentScript, sessionId);
        console.log(`🔍 证物初始化完成，共 ${evidences.length} 个证物`);
      } catch (error) {
        console.error('❌ 证物初始化失败:', error);
      }
    }
  }, [currentScript, sessionId]);

  // 获取玩家角色：优先使用剧本中标记 isPlayer 的角色；
  // 若没有，回退到 settings.playerRole / settings.playerName 或 roleType === '玩家'
  const getPlayerActor = useCallback((): Actor | undefined => {
    const allActors = Object.values(actors);
    let player = allActors.find(a => a.isPlayer);
    if (!player && currentScript) {
      const preferName = currentScript.settings.playerRole || currentScript.settings.playerName;
      player = allActors.find(a => a.name === preferName) ||
               allActors.find(a => a.roleType === '玩家');
    }
    return player;
  }, [actors, currentScript]);

  const forceTextResponseToKiller = useCallback((actor: Actor, forcedMessage: string) => {
    console.log('📝 强制消息内容:', forcedMessage);
    console.log('🔧 凶手上下文:', actor.context);
    
    const newMessage: LLMMessage = { role: "user", content: forcedMessage };
    
    // 使用流式调用，确保在后剧情模式下正确处理
    sendChatStream([...actor.messages, newMessage], setActors, globalStory, sessionId, actor, setLoading, getPlayerActor(), true);
  }, [globalStory, sessionId, setActors, setLoading, getPlayerActor]);

  // const generateQuizFromScript = (script?: Script | null): QuizQuestion[] | undefined => {
  //   if (!script) return undefined;
  //   const names = script.characters.map(c => c.name);
  //   const qs: QuizQuestion[] = [];

  //   // Q1: 谁是凶手？（若存在）
  //   const killer = script.characters.find(c => c.isKiller);
  //   if (killer) {
  //     qs.push({
  //       question: '谁是本案的凶手？',
  //       choices: names,
  //       correctAnswer: killer.name,
  //     });
  //   }

  //   // Q2: 谁是受害者？（若存在）
  //   const victim = script.characters.find(c => c.isVictim);
  //   if (victim) {
  //     qs.push({
  //       question: '谁是受害者？',
  //       choices: names,
  //       correctAnswer: victim.name,
  //     });
  //   }

  //   // Q3: 谁是你的搭档/助手？（若存在）
  //   const partner = script.characters.find(c => c.isPartner || c.isAssistant);
  //   if (partner) {
  //     qs.push({
  //       question: '谁是你的搭档/助手？',
  //       choices: names,
  //       correctAnswer: partner.name,
  //     });
  //   }

  //   return qs.length > 0 ? qs : undefined;
  // };

  useEffect(() => {
    if (!postGame) {
      setFilteredActors(Object.values(actors));
      // 只在actors从空变为有数据时初始化角色选择
      const actorIds = Object.keys(actors).map(Number);
      if (actorIds.length > 0 && currActor === 0) {
        // 查找助手角色作为默认对话对象
        const assistantActor = actorIds.find(id => actors[id]?.isAssistant);
        if (assistantActor !== undefined) {
          // 如果找到助手角色，设置为当前角色
          console.log('🤝 找到助手角色，设置为当前角色:', actors[assistantActor]?.name);
          setCurrActor(assistantActor);
        } else {
          // 如果没有助手角色，选择第一个可用角色
          setCurrActor(actorIds[0]);
        }
      }
    } else if (!hasEffectRun) {      
      setEndModalOpened(true);
      setHasEffectRun(true);
    }
  }, [actors, postGame, currActor, hasEffectRun]); // 添加缺失的依赖

  // 处理后剧情强制消息的发送
  useEffect(() => {
    if (postGame && !forcedMessageSent && actors[currActor] && currentScript) {
      const killerActor = actors[currActor];
      if (killerActor.isKiller || killerActor.name === currentScript.settings?.killerRole) {
        // 检查是否还有我们的强制推理消息需要发送
        const hasInitialMessage = killerActor.messages.length > 0;
        if (!hasInitialMessage) {
          const playerName = getPlayerActor()?.name || '调查者';
          let forcedMessage = `${playerName}：这是我的最终推理。 我认定本案的凶手是【${killerActor.name}】。`;
          if (quizAnswers && quizAnswers.length > 0) {
            forcedMessage += ` 我的答案：${quizAnswers.join(' / ')}。`;
          }
          forcedMessage += ' 现在请你停止隐瞒，并以系统、可核验的方式说明：动机、详细时间线与手法、关键证据与获取路径，以及为何其他嫌疑人不是凶手。';
          
          forceTextResponseToKiller(killerActor, forcedMessage);
          setForcedMessageSent(true);
        }
      }
    }
  }, [postGame, currActor, actors, forcedMessageSent, currentScript, quizAnswers, forceTextResponseToKiller, getPlayerActor]);

  const handleEndGame = () => {
    setEndGame(true);
  };


  const handleResumeGame = () => {
    setEndGame(false);
  };

  const handleBackToGame = (answers: string[]) => {
    console.log(answers)
    setQuizAnswers(answers); // 保存答题结果
    const updatedActors: Record<number, Actor> = { ...actors };
    // 基于当前剧本自动定位凶手（优先 settings.killerRole，其次 isKiller 标记）
    const killerNameFromSettings = currentScript?.settings?.killerRole;
    const killerNameFromFlag = currentScript?.characters.find(c => c.isKiller)?.name;
    const killerEntry = (killerNameFromSettings || killerNameFromFlag)
      ? Object.values(updatedActors).find(a => a.name === (killerNameFromSettings || killerNameFromFlag))
      : undefined;

    if (killerEntry) {
      const killerId = killerEntry.id;
      
      const postGameContext = `你已被识破是真凶。接下来请**以符合角色身份的口吻、说辞**来坦诚、结构化地回答破案人员：
— 明确动机、时间线、作案方法与工具；
— 给出证据与其获取路径；
— 逐一排除他人嫌疑并给出论据；
— 使用清晰小标题与有序要点；
— 发现误解请直接更正并给出可验证依据。

【格式要求】请使用Markdown格式回复，包括：
- 先总览讲下情况，符合人物身份的说辞，使用 ### 作为主要章节标题（如 ### 动机、### 时间线等）
- 使用 **粗体** 强调关键信息（如关键证据、时间点）
- 自然流畅的表述，不必用1、2、3这种逻辑过于缜密的方式来组织要点
- 时间线用 **时间** - 事件描述 的格式
- 证据用 **证据名称**：详细描述 的格式`;

      // Clear the chat history for all actors and update killer info in one operation
    Object.keys(updatedActors).forEach(actorId => {
      updatedActors[Number(actorId)].messages = [];
    });

      // Update killer with post-game context
      updatedActors[killerId] = {
        ...killerEntry,
        messages: [], // 确保凶手消息也被清空
        context: postGameContext,
        secret: '.',
        violation: '后剧情模式：不得隐瞒或误导，需完整披露真相与证据链。'
      };

      // 一次性更新所有状态
      setActors(updatedActors);
      setFilteredActors([updatedActors[killerId]]);
      setCurrActor(killerId);
    }
    setEndGame(false);
    setPostGame(true);
    setForcedMessageSent(false); // 重置强制消息发送状态
  };

  // 处理证物出示到聊天
  const handleEvidencePresent = (evidence: Evidence) => {
    // 检查是否有当前对话的Actor
    if (!actors[currActor] || actors[currActor].isPlayer) {
      console.warn('无法发送证物：当前没有有效的对话对象');
      return;
    }

    const currentActor = actors[currActor];
    const playerActor = getPlayerActor();

    // 构建证物消息
    const evidenceMessage: LLMMessage = {
      role: "user",
      content: `[出示证物] ${evidence.name}: ${evidence.basicDescription}`
    };

    console.log('🔍 向', currentActor.name, '出示证物:', evidence.name);

    // 发送证物消息到聊天流
    const cancel = sendChatStream(
      [...currentActor.messages, evidenceMessage], 
      setActors, 
      globalStory, 
      sessionId, 
      currentActor, 
      setLoading, 
      playerActor, 
      postGame,
      getDetectiveName(), 
      getVictimName(), 
      actors
    );
    
    setCancelStream(() => cancel);
  };

  // 获取侦探名称
  const getDetectiveName = () => {
    return currentScript?.characters.find(c => c.isDetective)?.name || '侦探';
  };

  // 获取受害者名称  
  const getVictimName = () => {
    return currentScript?.characters.find(c => c.isVictim)?.name || '受害者';
  };

  return (
    <AppShell
      header={{ height: "100px" }} // Adjust height to match Header component
      navbar={{
        width: 280,
        breakpoint: 'sm',
        collapsed: { mobile: !opened },
      }}
      padding="md"
      className="aurora-background"
      styles={{
        navbar: {
          backgroundColor: 'transparent'
        }
      }}
    >
      <AppShell.Header>
        <Burger style={{
          position: 'fixed',
          top: '20px',
          left: '10px',
          zIndex: 1000,
        }} opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
        <Header />
      </AppShell.Header>
      <AppShell.Navbar className="aurora-sidebar">
        <ActorSidebar currentActor={currActor} setCurrentActor={setCurrActor} actors={filteredActors} postGame={postGame} />
      </AppShell.Navbar>
      <AppShell.Main className="aurora-content">
        {endGame ? (
          <MultipleChoiceGame 
            onBackToGame={handleBackToGame} 
            onResumeGame={handleResumeGame}
            questions={currentScript?.quiz as QuizQuestion[] | undefined}
            script={currentScript}
          />
        ) : (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '2.5fr 1fr', gap: '10px', height: '100%', marginTop: '20px' }}>
              <div style={{ overflow: 'auto' }}>
                {actors[currActor] ? (
                  <ActorChat 
                    actor={actors[currActor]} 
                    currentPlayerActor={getPlayerActor()}
                    postGame={postGame}
                  />
                ) : (
                  <div style={{ 
                    padding: '20px', 
                    textAlign: 'center', 
                    color: '#FFFFFF',
                    background: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: '8px',
                    margin: '20px'
                  }}>
                    <Text size="lg" mb="md">没有可用的角色</Text>
                    <Text size="sm" c="dimmed">请检查剧本配置或重新加载页面</Text>
                  </div>
                )}
              </div>
              <div style={{ overflow: 'auto', height: '100%'}}>
                <TabbedRightPanel
                  sessionId={sessionId}
                  scriptId={currentScript?.id || ''}
                  currentActor={currActor && !actors[currActor]?.isPlayer ? actors[currActor]?.name : undefined}
                  currentActorId={currActor && !actors[currActor]?.isPlayer ? currActor : undefined}
                  onEvidenceSelect={(evidence) => {
                    console.log('证物选择:', evidence);
                  }}
                  onEvidencePresent={handleEvidencePresent}
                />
              </div>
            </div>
            <br></br>
            {(
              <Button 
                onClick={() => setExplanationModalOpened(true)} 
                style={{
                  background: '#00C2FF',
                  border: '2px solid #00C2FF',
                  color: '#FFFFFF',
                  fontWeight: '700',
                  margin: '5px',
                  textShadow: '0 1px 2px rgba(0, 0, 0, 0.8)',
                  filter: 'contrast(1.1)'
                }}
              >
                了解更多
              </Button>
            )}
            {(
              <Button 
                onClick={() => setSecretsModalOpened(true)} 
                style={{
                  background: '#FFB74D',
                  border: '2px solid #FFB74D',
                  color: '#121212',
                  fontWeight: '700',
                  margin: '5px',
                  textShadow: '0 1px 2px rgba(255, 255, 255, 0.3)',
                  filter: 'contrast(1.1)'
                }}
              >
                剧透
              </Button>
            )}
            {!postGame && (
              <Button 
                onClick={handleEndGame} 
                style={{
                  background: '#E63946',
                  border: '2px solid #E63946',
                  color: '#FFFFFF',
                  fontWeight: '700',
                  margin: '5px',
                  animation: 'pulse-crimson 2s infinite',
                  textShadow: '0 1px 2px rgba(0, 0, 0, 0.8)',
                  filter: 'contrast(1.1)'
                }}
              >
                提交推理
              </Button>
            )}
          </div>
        )}
      </AppShell.Main>

      <IntroModal
        opened={introModalOpened}
        onClose={() => setIntroModalOpened(false)}
        detectiveName={actors[currActor]?.isDetective ? actors[currActor]?.name : undefined}
        script={currentScript}
      />

      <EndModal
        opened={endModalOpened}
        onClose={() => setEndModalOpened(false)}
        script={currentScript}
        playerName={getPlayerActor()?.name}
      />

      <ExplanationModal
        opened={explanationModalOpened}
        onClose={() => setExplanationModalOpened(false)}
      />   

      <SecretsModal
        opened={secretsModalOpened}
        onClose={() => setSecretsModalOpened(false)}
        postGame={postGame}  // 修复逻辑：直接传递postGame状态
        script={currentScript || undefined}  // 修复类型：null转换为undefined
      />  

    </AppShell>
  );
}
