import React, { useEffect, useRef, useState } from 'react';
import { Modal, Stack, Text, Paper, ScrollArea, Group, Button, Loader, Badge, Switch } from '@mantine/core';
import { Script } from '../types/script';
import { qualityCheckStream } from '../api/scriptQualityChecker';
import StreamingQualityReport from './StreamingQualityReport';

interface QualityCheckModalProps {
  opened: boolean;
  onClose: () => void;
  script: Script;
  forceRegenerate?: boolean; // 是否强制重新生成
}

const QualityCheckModal: React.FC<QualityCheckModalProps> = ({ opened, onClose, script, forceRegenerate = false }) => {
  const [isStreaming, setIsStreaming] = useState(false);
  const [output, setOutput] = useState('');
  const [shouldRegenerate, setShouldRegenerate] = useState(forceRegenerate);
  const [useStructuredView, setUseStructuredView] = useState(true);
  const cancelRef = useRef<() => void>(() => {});

  // 渲染质检报告内容（支持JSON和Markdown格式）
  const renderReportContent = (content: string): string => {
    if (!content) return '暂无质检报告';

    // 检查是否为JSON格式
    if (content.trim().startsWith('{') && content.trim().endsWith('}')) {
      try {
        const report = JSON.parse(content);
        return renderJSONReport(report);
      } catch (e) {
        // JSON解析失败，回退到Markdown渲染
        return renderMarkdownContent(content);
      }
    }

    // 使用Markdown渲染
    return renderMarkdownContent(content);
  };

  // 渲染JSON格式的质检报告
  const renderJSONReport = (report: any): string => {
    const {
      scriptTitle,
      scores,
      totalScore,
      totalMaxScore,
      percentage,
      gradeText,
      issues,
      recommendations,
      summary
    } = report;

    let html = `
      <div style="color: #E6FBFF; line-height: 1.7;">
        <h2 style="color: #7DF9FF; margin-bottom: 20px;">🔎 剧本质检报告 - ${scriptTitle || '未知剧本'}</h2>
        
        <div style="background: rgba(0, 194, 255, 0.1); padding: 15px; border-radius: 8px; margin-bottom: 20px;">
          <h3 style="color: #00FFFF; margin-bottom: 10px;">📊 综合评分</h3>
          <p><strong>总分：</strong>${totalScore || 0}/${totalMaxScore || 100}分 (${percentage || 0}%)</p>
          <p><strong>评级：</strong>${gradeText || '未知'}</p>
          ${summary ? `<p><strong>总结：</strong>${summary}</p>` : ''}
        </div>

        <div style="background: rgba(76, 175, 80, 0.1); padding: 15px; border-radius: 8px; margin-bottom: 20px;">
          <h3 style="color: #00C2FF; margin-bottom: 10px;">📈 分项评分</h3>
          <ul style="list-style: none; padding: 0;">
            <li style="margin-bottom: 8px;">
              <strong>内容逻辑层：</strong>${scores?.contentLogic?.score || 0}/${scores?.contentLogic?.maxScore || 50}分
            </li>
            <li style="margin-bottom: 8px;">
              <strong>AI执行层：</strong>${scores?.aiExecution?.score || 0}/${scores?.aiExecution?.maxScore || 30}分
            </li>
            <li style="margin-bottom: 8px;">
              <strong>玩家体验层：</strong>${scores?.playerExperience?.score || 0}/${scores?.playerExperience?.maxScore || 20}分
            </li>
          </ul>
        </div>`;

    // 问题列表
    if (issues && (issues.critical?.length > 0 || issues.major?.length > 0 || issues.minor?.length > 0)) {
      html += `
        <div style="background: rgba(255, 152, 0, 0.1); padding: 15px; border-radius: 8px; margin-bottom: 20px;">
          <h3 style="color: #FF9800; margin-bottom: 10px;">⚠️ 发现的问题</h3>`;
      
      if (issues.critical?.length > 0) {
        html += `
          <div style="margin-bottom: 10px;">
            <strong style="color: #F44336;">严重问题：</strong>
            <ul>${issues.critical.map((issue: string) => `<li>${issue}</li>`).join('')}</ul>
          </div>`;
      }
      
      if (issues.major?.length > 0) {
        html += `
          <div style="margin-bottom: 10px;">
            <strong style="color: #FF5722;">主要问题：</strong>
            <ul>${issues.major.map((issue: string) => `<li>${issue}</li>`).join('')}</ul>
          </div>`;
      }
      
      if (issues.minor?.length > 0) {
        html += `
          <div style="margin-bottom: 10px;">
            <strong style="color: #FF9800;">轻微问题：</strong>
            <ul>${issues.minor.map((issue: string) => `<li>${issue}</li>`).join('')}</ul>
          </div>`;
      }
      
      html += `</div>`;
    }

    // 改进建议
    if (recommendations?.length > 0) {
      html += `
        <div style="background: rgba(33, 150, 243, 0.1); padding: 15px; border-radius: 8px; margin-bottom: 20px;">
          <h3 style="color: #2196F3; margin-bottom: 10px;">💡 改进建议</h3>
          <ul>`;
      
      recommendations.forEach((rec: any) => {
        const priorityColor = rec.priority === 'high' ? '#F44336' : rec.priority === 'medium' ? '#FF9800' : '#00C2FF';
        html += `
          <li style="margin-bottom: 10px;">
            <strong style="color: ${priorityColor};">[${rec.priority?.toUpperCase() || 'UNKNOWN'}]</strong>
            <strong>${rec.category || '未分类'}：</strong>${rec.description || '无描述'}
            ${rec.solution ? `<br><em>解决方案：${rec.solution}</em>` : ''}
          </li>`;
      });
      
      html += `</ul></div>`;
    }

    html += `</div>`;
    return html;
  };

  // 轻量级 Markdown 渲染（标题/加粗/斜体/列表/代码块）
  const renderMarkdownContent = (md: string): string => {
    let html = md
      .replace(/^###\s+(.*)$/gm, '<h3>$1</h3>')
      .replace(/^##\s+(.*)$/gm, '<h2>$1</h2>')
      .replace(/^#\s+(.*)$/gm, '<h1>$1</h1>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>');

    // 代码块 ```...```
    html = html.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');

    // 无序列表 - 开头
    html = html.replace(/^(?:- |\* )(.*)$/gm, '<li>$1</li>');
    // 将连续的 <li> 片段包裹为 <ul>
    html = html.replace(/(<li>[\s\S]*?<\/li>)(?!\n<li>)/g, (m) => `<ul>${m}</ul>`);

    // 段落
    html = html.replace(/^(?!<h\d|<ul>|<li>|<pre>)(.+)$/gm, '<p>$1</p>');

    return html;
  };

  useEffect(() => {
    if (!opened) {
      setIsStreaming(false);
      setOutput('');
      cancelRef.current?.();
      return;
    }
    
    // 如果已有质检报告且不强制重新生成，直接显示
    if (script.settings?.qualityReport && !shouldRegenerate) {
      setOutput(script.settings.qualityReport);
      setIsStreaming(false);
      return;
    }
    
    // 如果没有质检报告或强制重新生成，开始生成
    setIsStreaming(true);
    setOutput(''); // 清空之前的内容
    cancelRef.current = qualityCheckStream(script, {
      onChunk: (t: string) => setOutput(prev => prev + t),
      onEnd: () => setIsStreaming(false),
      onError: () => setIsStreaming(false)
    });
    return () => cancelRef.current?.();
  }, [opened, script, shouldRegenerate]);

  // 重新生成质检报告
  const handleRegenerate = () => {
    setShouldRegenerate(true);
    setIsStreaming(true);
    setOutput('');
    cancelRef.current = qualityCheckStream(script, {
      onChunk: (t: string) => setOutput(prev => prev + t),
      onEnd: () => {
        setIsStreaming(false);
        setShouldRegenerate(false);
      },
      onError: () => {
        setIsStreaming(false);
        setShouldRegenerate(false);
      }
    });
  };

  // 保存为最近一次报告（写入 settings.qualityReport 由页面负责持久化）
  useEffect(() => {
    if (!isStreaming && output && script?.settings) {
      try {
        // 仅更新内存，由 ScriptEditor 调用 updateScript 同步保存
        script.settings.qualityReport = output;
      } catch {}
    }
  }, [isStreaming, output, script]);

  return (
    <Modal opened={opened} onClose={onClose} title={
      <Group>
        <Text
          size="lg"
          fw={900}
          c="#7DF9FF"
          style={{
            textShadow: '0 0 12px rgba(0, 194, 255, 0.9), 0 0 24px rgba(125, 249, 255, 0.6)'
          }}
        >
          🔎 剧本质检报告 - {script.id}
        </Text>
        <Group gap="sm">
          <Switch
            label="结构化显示"
            checked={useStructuredView}
            onChange={(event) => setUseStructuredView(event.currentTarget.checked)}
            color="cyan"
            size="sm"
            styles={{
              label: { color: '#7DF9FF', fontSize: '12px' },
              track: { backgroundColor: 'rgba(0, 0, 0, 0.3)' }
            }}
          />
          {isStreaming && <Badge style={{ background: 'linear-gradient(135deg,#00C2FF,#7DF9FF)', color: '#001018' }}>流式生成中</Badge>}
        </Group>
      </Group>
    } size="90%" styles={{
      content: {
        background: 'linear-gradient(135deg, rgba(10, 10, 35, 0.95) 0%, rgba(26, 26, 62, 0.95) 50%, rgba(15, 32, 39, 0.95) 100%)',
        border: '1px solid rgba(0, 194, 255, 0.9)',
        boxShadow: '0 8px 32px rgba(0, 194, 255, 0.25)',
        backdropFilter: 'blur(10px)'
      },
      header: {
        background: 'linear-gradient(135deg, rgba(0, 194, 255, 0.12) 0%, rgba(125, 249, 255, 0.10) 100%)',
        borderBottom: '1px solid rgba(0, 194, 255, 0.6)'
      }
    }}>
      <Stack>
        {useStructuredView ? (
          // 结构化显示模式
          <ScrollArea h={800}>
            <StreamingQualityReport 
              streamingContent={output} 
              isStreaming={isStreaming}
            />
          </ScrollArea>
        ) : (
          // 原始显示模式
          <Paper
            p="md"
            style={{
              background: 'linear-gradient(135deg, rgba(0, 10, 20, 0.7) 0%, rgba(0, 20, 40, 0.6) 100%)',
              border: '1px solid rgba(0, 194, 255, 0.6)',
              borderRadius: 12,
              boxShadow: '0 4px 18px rgba(0, 194, 255, 0.15)'
            }}
          >
            <ScrollArea h={800}>
              <div
                style={{ color: '#E6FBFF', lineHeight: 1.7 }}
                dangerouslySetInnerHTML={{ __html: renderReportContent(output || (isStreaming ? '正在生成质检报告...' : '')) }}
              />
            </ScrollArea>
          </Paper>
        )}

        <Group justify="space-between">
          <Text size="xs" c="#7DF9FF">报告涵盖：内容逻辑层（证据链、诡计设计、角色一致性）、AI执行层（助手中立性、对话流畅）、玩家体验层（信息分布、推理难度）等20+维度全面评估。</Text>
          <Group>
            {isStreaming && <Loader color="#00FFFF" size="sm" />}
            {!isStreaming && script.settings?.qualityReport && (
              <Button
                variant="outline"
                onClick={handleRegenerate}
                styles={{
                  root: {
                    borderColor: '#FFB74D',
                    color: '#FFB74D',
                    background: 'rgba(255, 183, 77, 0.1)'
                  }
                }}
              >
                🔄 重新质检
              </Button>
            )}
            <Button
              variant="outline"
              onClick={onClose}
              styles={{
                root: {
                  borderColor: '#00C2FF',
                  color: '#7DF9FF',
                  background: 'rgba(0, 194, 255, 0.1)'
                }
              }}
            >
              关闭
            </Button>
          </Group>
        </Group>
      </Stack>
    </Modal>
  );
};

export default QualityCheckModal;


