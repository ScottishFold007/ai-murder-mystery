import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Text, Container, Alert } from '@mantine/core';

import { useScriptContext } from '../providers/scriptContext';
import { useMysteryContext } from '../providers/mysteryContext';
import Home from './Home';

const PlayScript: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentScript, loadScript } = useScriptContext();
  const { setActors, setGlobalStory } = useMysteryContext();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      loadScript(id);
    }
  }, [id, loadScript]);

  useEffect(() => {
    if (currentScript) {
      try {
        // 将剧本数据转换为游戏格式
        const actors = currentScript.characters.reduce((acc, character, index) => {
          acc[index] = {
            id: index,
            name: character.name,
            bio: character.bio,
            personality: character.personality,
            context: character.context,
            secret: character.secret,
            violation: character.violation,
            image: character.image,
            backgroundImage: character.backgroundImage, // 🔧 修复：添加背景图片字段
            messages: [], // 初始化为空消息数组
            isDetective: character.isDetective || false,
            isKiller: character.isKiller || false,
            isVictim: character.isVictim || false,
            isAssistant: character.isAssistant || false,
            isPlayer: character.isPlayer || false,
            isPartner: character.isPartner || false,
            roleType: character.roleType
          };
          
          // 🔍 调试：输出角色背景图片信息
          // console.log(`🎭 角色 ${character.name} 背景图片:`, character.backgroundImage);
          
          return acc;
        }, {} as { [id: number]: any });

        setActors(actors);
        setGlobalStory(currentScript.globalStory);
        setLoading(false);
        
        // 🔍 调试：输出所有角色信息
        console.log('📚 剧本加载完成，角色数量:', Object.keys(actors).length);
        console.log('🎭 所有角色信息:', actors);
        // console.log('🎨 角色背景图片汇总:', Object.values(actors).map(actor => ({
        //   name: actor.name,
        //   backgroundImage: actor.backgroundImage
        // })));
        
        // 确保有角色时，currActor 指向有效的角色
        if (Object.keys(actors).length > 0) {
          // 这里可以添加逻辑来设置当前角色
          console.log('✅ 角色数据设置完成');
        }
      } catch (err) {
        setError('加载剧本失败');
        setLoading(false);
      }
    }
  }, [currentScript, setActors, setGlobalStory]);

  const handleBack = () => {
    navigate('/library');
  };

  if (loading) {
    return (
      <Container size="lg" py="xl" style={{ textAlign: 'center' }}>
        <Text>加载剧本中...</Text>
      </Container>
    );
  }

  if (error) {
    return (
      <Container size="lg" py="xl">
        <Alert
          title="加载失败"
          color="red"
          mb="md"
        >
          ⚠️ {error}
        </Alert>
        <Button onClick={handleBack}>
          返回剧本库
        </Button>
      </Container>
    );
  }

  if (!currentScript) {
    return (
      <Container size="lg" py="xl">
        <Alert
          title="剧本不存在"
          color="red"
          mb="md"
        >
          ⚠️ 找不到指定的剧本
        </Alert>
        <Button onClick={handleBack}>
          返回剧本库
        </Button>
      </Container>
    );
  }

  return (
    <div style={{ position: 'relative' }}>

      {/* 剧本信息 */}
      <div style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: 1000,
        background: 'rgba(0, 0, 0, 0.8)',
        padding: '8px 16px',
        borderRadius: '8px',
        border: '1px solid #00C2FF'
      }}>
        <Text size="sm" c="white">
          {currentScript.title} - {currentScript.author}
        </Text>
      </div>

      {/* 使用现有的游戏界面 */}
      <Home />
    </div>
  );
};

export default PlayScript;
