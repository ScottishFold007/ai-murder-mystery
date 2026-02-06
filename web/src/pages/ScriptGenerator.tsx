import React, { useState } from 'react';
import { AppShell, Container, Title, Tabs, Text, Button, Group } from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import ScriptWizard from '../components/ScriptGenerator/ScriptWizard';
import ScriptEditor from '../components/ScriptGenerator/ScriptEditor';
import { Script } from '../types/script';

const ScriptGenerator: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('wizard');
  const [editingScript, setEditingScript] = useState<Script | null>(null);
  const navigate = useNavigate();

  const handleScriptGenerated = (script: Script) => {
    setEditingScript(script);
    setActiveTab('editor');
  };

  // const handleEditScript = (script: Script) => {
  //   setEditingScript(script);
  //   setActiveTab('editor');
  // };

  return (
    <AppShell header={{ height: "100px" }}>
      <AppShell.Header>
        <Header />
      </AppShell.Header>
      <AppShell.Main 
        style={{
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
            ),
            radial-gradient(ellipse at top left, rgba(120, 119, 198, 0.3) 0%, transparent 50%),
            radial-gradient(ellipse at top right, rgba(255, 3, 112, 0.2) 0%, transparent 50%),
            radial-gradient(ellipse at bottom left, rgba(0, 194, 255, 0.2) 0%, transparent 50%),
            radial-gradient(ellipse at bottom right, rgba(142, 45, 226, 0.3) 0%, transparent 50%)
          `,
          minHeight: '100vh',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* 极光动态效果层 */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: `
              linear-gradient(45deg, 
                transparent 30%, 
                rgba(0, 255, 150, 0.1) 50%, 
                transparent 70%
              )
            `,
            animation: 'aurora 8s ease-in-out infinite alternate',
            pointerEvents: 'none'
          }}
        />
        
        {/* 星光效果 */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: `
              radial-gradient(2px 2px at 20% 30%, rgba(255, 255, 255, 0.8), transparent),
              radial-gradient(1px 1px at 40% 70%, rgba(255, 255, 255, 0.6), transparent),
              radial-gradient(1px 1px at 90% 40%, rgba(255, 255, 255, 0.5), transparent),
              radial-gradient(2px 2px at 60% 10%, rgba(0, 194, 255, 0.7), transparent)
            `,
            backgroundSize: '300px 300px, 200px 200px, 400px 400px, 250px 250px',
            animation: 'twinkle 4s ease-in-out infinite alternate',
            pointerEvents: 'none'
          }}
        />

        <Container size="xl" style={{ paddingTop: '20px', position: 'relative', zIndex: 1 }}>
          <Title 
            order={1} 
            style={{ 
              textAlign: 'center', 
              marginBottom: '30px',
              color: '#FFFFFF',
              fontSize: '42px',
              fontWeight: '800',
              textShadow: `
                0 0 20px rgba(0, 194, 255, 0.8),
                0 0 40px rgba(0, 194, 255, 0.4),
                2px 2px 4px rgba(0, 0, 0, 0.8)
              `,
              letterSpacing: '2px'
            }}
          >
            🎭 AI剧本生成器
          </Title>

          <Group justify="center" mb="40px">
            <Text 
              style={{ 
                textAlign: 'center', 
                color: '#F0F0F0',
                fontSize: '18px',
                fontWeight: '500',
                textShadow: '1px 1px 3px rgba(0, 0, 0, 0.8)',
                letterSpacing: '1px'
              }}
            >
              ✨ 利用AI的创意力量，快速生成高质量的谋杀案剧本 ✨
            </Text>
            <Button
              onClick={() => navigate('/library')}
              variant="outline"
              size="sm"
              styles={{
                root: {
                  borderColor: '#00C2FF',
                  color: '#00C2FF',
                  '&:hover': {
                    backgroundColor: 'rgba(0, 194, 255, 0.1)',
                    borderColor: '#FFFF00',
                    color: '#FFFF00'
                  }
                }
              }}
            >
              📚 查看剧本库
            </Button>
          </Group>

          <Tabs 
            value={activeTab} 
            onChange={(value) => setActiveTab(value || 'wizard')}
            styles={{
              tab: {
                color: '#E0E0E0'
              }
            }}
          >
            <Tabs.List>
              <Tabs.Tab 
                value="wizard"
                style={{
                  color: activeTab === 'wizard' ? '#00C2FF' : '#E0E0E0'
                }}
              >
                🧙‍♂️ AI生成向导
              </Tabs.Tab>
              <Tabs.Tab 
                value="editor" 
                disabled={!editingScript}
                style={{
                  color: activeTab === 'editor' ? '#00C2FF' : '#E0E0E0'
                }}
              >
                ✏️ 剧本编辑器
              </Tabs.Tab>
            </Tabs.List>

            <Tabs.Panel value="wizard" style={{ paddingTop: '20px' }}>
              <ScriptWizard onScriptGenerated={handleScriptGenerated} />
            </Tabs.Panel>

            <Tabs.Panel value="editor" style={{ paddingTop: '20px' }}>
              {editingScript && (
                <ScriptEditor 
                  script={editingScript} 
                  onScriptChange={setEditingScript}
                />
              )}
            </Tabs.Panel>
          </Tabs>
        </Container>
        
        {/* CSS动画样式 */}
        <style>{`
          @keyframes aurora {
            0% {
              transform: translateX(-100px) rotate(0deg);
              opacity: 0.3;
            }
            50% {
              opacity: 0.6;
            }
            100% {
              transform: translateX(100px) rotate(5deg);
              opacity: 0.3;
            }
          }
          
          @keyframes twinkle {
            0% {
              opacity: 0.3;
              transform: scale(1);
            }
            50% {
              opacity: 0.8;
              transform: scale(1.1);
            }
            100% {
              opacity: 0.4;
              transform: scale(1);
            }
          }
        `}</style>
      </AppShell.Main>
    </AppShell>
  );
};

export default ScriptGenerator;
