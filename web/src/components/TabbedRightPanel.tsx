import React, { useState, useEffect } from 'react';
import { Tabs, Badge } from '@mantine/core';
import { IconNotes, IconEye } from '@tabler/icons-react';
import EnhancedNotesPanel from './EnhancedNotesPanel';
import EvidenceLibraryPanel from './evidence/EvidenceLibraryPanel';
import { getEvidenceStats } from '../utils/evidenceManager';
import { Evidence } from '../types/evidence';

interface TabbedRightPanelProps {
  sessionId: string;
  scriptId?: string;
  currentActor?: string;
  currentActorId?: number;
  onEvidenceSelect?: (evidence: Evidence) => void;
  onEvidencePresent?: (evidence: Evidence) => void;
}

const TabbedRightPanel: React.FC<TabbedRightPanelProps> = ({
  sessionId,
  scriptId = '',
  currentActor,
  currentActorId,
  onEvidenceSelect,
  onEvidencePresent
}) => {
  const [activeTab, setActiveTab] = useState<string>('notes');
  const [newEvidenceCount, setNewEvidenceCount] = useState(0);

  // 加载证物统计，检查是否有新证物
  useEffect(() => {
    const loadEvidenceStats = () => {
      try {
        const stats = getEvidenceStats(sessionId);
        // 只有当数量真正变化时才更新状态，避免不必要的重新渲染
        setNewEvidenceCount(prevCount => {
          return prevCount !== stats.newEvidences ? stats.newEvidences : prevCount;
        });
      } catch (error) {
        console.error('❌ 加载证物统计失败:', error);
      }
    };

    loadEvidenceStats();
    
    // 减少轮询频率，从5秒改为10秒
    const interval = setInterval(loadEvidenceStats, 10000);
    return () => clearInterval(interval);
  }, [sessionId]);

  // 从localStorage恢复上次选择的Tab
  useEffect(() => {
    const savedTab = localStorage.getItem(`rightPanel_activeTab_${sessionId}`);
    if (savedTab && ['notes', 'evidence'].includes(savedTab)) {
      setActiveTab(savedTab);
    }
  }, [sessionId]);

  // 保存Tab选择状态
  const handleTabChange = (value: string | null) => {
    if (value && ['notes', 'evidence'].includes(value)) {
      setActiveTab(value);
      localStorage.setItem(`rightPanel_activeTab_${sessionId}`, value);
      
      // 如果切换到证物Tab，清除新证物提示
      if (value === 'evidence' && newEvidenceCount > 0) {
        // 延迟清除，让用户看到红点
        setTimeout(() => {
          setNewEvidenceCount(0);
        }, 2000);
      }
    }
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Tabs
        value={activeTab}
        onChange={handleTabChange}
        style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
        styles={{
          root: {
            display: 'flex',
            flexDirection: 'column',
            height: '100%'
          },
          list: {
            borderBottom: '1px solid rgba(0, 255, 255, 0.3)',
            backgroundColor: 'rgba(0, 255, 255, 0.05)',
            marginBottom: '12px',
            paddingLeft: '8px',
            paddingRight: '8px'
          },
          tab: {
            color: '#E0E0E0',
            fontWeight: '600',
            padding: '8px 16px'
          },
          panel: {
            flex: 1,
            overflow: 'hidden',
            padding: 0
          }
        }}
      >
        <Tabs.List>
          <Tabs.Tab
            value="notes"
            leftSection={<IconNotes size={16} />}
          >
            推理笔记
          </Tabs.Tab>
          <Tabs.Tab
            value="evidence"
            leftSection={<IconEye size={16} />}
            rightSection={
              newEvidenceCount > 0 ? (
                <Badge
                  size="xs"
                  color="red"
                  variant="filled"
                  style={{ marginLeft: '4px' }}
                >
                  {newEvidenceCount}
                </Badge>
              ) : null
            }
          >
            证物库
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="notes" style={{ height: '100%', overflow: 'auto' }}>
          <EnhancedNotesPanel
            sessionId={sessionId}
            currentActor={currentActor}
            currentActorId={currentActorId}
          />
        </Tabs.Panel>

        <Tabs.Panel value="evidence" style={{ height: '100%', overflow: 'hidden' }}>
          <EvidenceLibraryPanel
            sessionId={sessionId}
            scriptId={scriptId}
            onEvidenceSelect={onEvidenceSelect}
            onEvidencePresent={onEvidencePresent}
          />
        </Tabs.Panel>
      </Tabs>
    </div>
  );
};

export default TabbedRightPanel;
