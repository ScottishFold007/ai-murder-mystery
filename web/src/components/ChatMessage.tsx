import React from 'react';
import { Actor, LLMMessage } from '../providers/mysteryContext';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import ActorImage from './ActorImage';
import EvidenceInlineBubble from './evidence/EvidenceInlineBubble';
import { useSessionContext } from '../providers/sessionContext';
import { getEvidenceOverview } from '../utils/evidenceManager';

// 注释：动作描述的第三人称转换现在由AI提示词约束处理，前端只负责样式渲染

// 解析证物消息的函数
const parseEvidenceMessage = (content: string) => {
  // 匹配 [出示证物] 或 [发送证物] 格式的消息
  // 使用 [\s\S] 来匹配包括换行符在内的所有字符
  const evidencePattern = /^\[(?:出示证物|发送证物)\]\s*(.+?):\s*([\s\S]*?)(?:\n\n([\s\S]*))?$/;
  const match = content.match(evidencePattern);
  
  if (match) {
    const evidenceName = match[1].trim();
    let evidenceDescription = match[2].trim();
    const additionalText = match[3] ? match[3].trim() : '';
    
    // 过滤证物描述，只保留证物概况信息，移除证物线索
    // 使用工具函数正确分离概况和线索
    evidenceDescription = getEvidenceOverview({ basicDescription: evidenceDescription } as any);
    
    // 尝试从描述中提取类型信息（简单的启发式方法）
    let evidenceCategory = 'physical'; // 默认类型
    
    if (evidenceDescription.includes('文件') || evidenceDescription.includes('文档') || evidenceDescription.includes('合同')) {
      evidenceCategory = 'document';
    } else if (evidenceDescription.includes('手机') || evidenceDescription.includes('电脑') || evidenceDescription.includes('数字')) {
      evidenceCategory = 'digital';
    } else if (evidenceDescription.includes('证词') || evidenceDescription.includes('口述') || evidenceDescription.includes('说法')) {
      evidenceCategory = 'testimony';
    }
    
    return {
      isEvidence: true as const,
      evidenceName,
      evidenceDescription, // 只包含证物概况，不包含证物线索
      evidenceCategory,
      remainingText: additionalText // 用户添加的额外文字内容
    };
  }
  
  return { isEvidence: false as const, remainingText: content };
};

// 处理动作文本的函数 - 简化版本，只负责识别和样式处理
const processActionText = (text: string) => {
  // 匹配括号内的动作描述（包括中文括号和英文括号）
  const actionPattern = /([（(][^）)]*[）)])/g;
  
  const parts = [];
  let lastIndex = 0;
  let match;
  
  while ((match = actionPattern.exec(text)) !== null) {
    // 添加动作前的普通文本
    if (match.index > lastIndex) {
      parts.push({
        type: 'normal',
        content: text.slice(lastIndex, match.index)
      });
    }
    
    // 直接添加动作文本（AI已经生成为第三人称）
    parts.push({
      type: 'action',
      content: match[1]
    });
    
    lastIndex = match.index + match[1].length;
  }
  
  // 添加剩余的普通文本
  if (lastIndex < text.length) {
    parts.push({
      type: 'normal',
      content: text.slice(lastIndex)
    });
  }
  
  return parts;
};

// 渲染带动作样式的文本组件
const StyledText: React.FC<{ content: string; isUser: boolean }> = ({ content, isUser }) => {
  const parts = processActionText(content);
  
  return (
    <span>
      {parts.map((part, index) => (
        <span
          key={index}
          style={part.type === 'action' ? {
            fontStyle: 'italic',
            opacity: 0.75,
            color: isUser ? '#FFB74D' : '#87CEEB',
            fontSize: '14px',
            fontWeight: '400',
            background: isUser 
              ? 'rgba(255, 183, 77, 0.1)' 
              : 'rgba(135, 206, 235, 0.1)',
            padding: '2px 6px',
            borderRadius: '4px',
            border: isUser
              ? '1px solid rgba(255, 183, 77, 0.2)'
              : '1px solid rgba(135, 206, 235, 0.2)',
            margin: '0 2px',
            textShadow: 'none'
          } : {}}
        >
          {part.content}
        </span>
      ))}
    </span>
  );
};

// 递归处理ReactMarkdown的children，提取纯文本
const extractTextFromChildren = (children: any): string => {
  if (typeof children === 'string') {
    return children;
  }
  if (Array.isArray(children)) {
    return children.map(extractTextFromChildren).join('');
  }
  if (children && typeof children === 'object' && children.props && children.props.children) {
    return extractTextFromChildren(children.props.children);
  }
  return '';
};

// 自定义文本渲染组件，用于ReactMarkdown
const CustomTextRenderer: React.FC<{ children: any; isUser: boolean }> = ({ children, isUser }) => {
  const textContent = extractTextFromChildren(children);
  return <StyledText content={textContent} isUser={isUser} />;
};

interface ChatMessageProps {
  message: LLMMessage;
  actor: Actor;
  currentPlayerActor?: Actor;
  isUser: boolean;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ 
  message, 
  actor, 
  currentPlayerActor, 
  isUser 
}) => {
  const sessionId = useSessionContext();
  const messageStyle: React.CSSProperties = {
    display: 'flex',
    marginBottom: '16px',
    justifyContent: isUser ? 'flex-end' : 'flex-start',
    alignItems: 'flex-start',
    gap: '12px',
    flexDirection: isUser ? 'row-reverse' : 'row'
  };

  const avatarStyle = {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    flexShrink: 0,
    overflow: 'hidden',
    border: isUser ? '2px solid #FFB74D' : '2px solid #00C2FF',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)'
  };

  const messageContentStyle = {
    maxWidth: '70%',
    padding: '12px 16px',
    borderRadius: isUser ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
    background: isUser 
      ? 'linear-gradient(135deg, rgba(255, 183, 77, 0.2) 0%, rgba(255, 183, 77, 0.1) 100%)' 
      : 'linear-gradient(135deg, rgba(0, 194, 255, 0.2) 0%, rgba(0, 194, 255, 0.1) 100%)',
    border: isUser 
      ? '1px solid rgba(255, 183, 77, 0.4)' 
      : '1px solid rgba(0, 194, 255, 0.4)',
    color: '#FFFFFF',
    fontSize: '15px',
    lineHeight: '1.6',
    textShadow: '0 1px 2px rgba(0, 0, 0, 0.8)',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)'
  };

  const nameStyle = {
    color: isUser ? '#FFB74D' : '#00C2FF',
    fontWeight: '700',
    marginBottom: '6px',
    fontSize: '13px',
    textShadow: '0 1px 2px rgba(0, 0, 0, 0.8)'
  };

  const contentStyle = {
    color: '#FFFFFF',
    fontSize: '15px',
    lineHeight: '1.7'
  };

  // 获取头像信息
  // const displayActor = isUser ? currentPlayerActor : actor;
  const displayName = isUser 
    ? (currentPlayerActor ? `${currentPlayerActor.name}（玩家）` : "玩家")
    : actor.name;

  // 解析消息内容，检查是否为证物消息
  const evidenceInfo = parseEvidenceMessage(message.content);

  return (
    <div style={messageStyle}>
      {/* 左侧头像 - 只在非用户消息时显示 */}
      {!isUser && (
        <div style={avatarStyle}>
          <ActorImage actor={actor} />
        </div>
      )}
      
      {/* 消息内容 */}
      <div style={messageContentStyle}>
        <div style={nameStyle}>
          {displayName}
        </div>
        <div style={contentStyle}>
          {evidenceInfo.isEvidence ? (
            /* 证物消息：显示简洁方形卡片 */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start' }}>
                <EvidenceInlineBubble
                  evidenceName={evidenceInfo.evidenceName!}
                  evidenceCategory={evidenceInfo.evidenceCategory!}
                  evidenceDescription={evidenceInfo.evidenceDescription}
                  isFromUser={isUser}
                  sessionId={sessionId}
                />
              </div>
              {evidenceInfo.remainingText && (
                <StyledText content={evidenceInfo.remainingText} isUser={isUser} />
              )}
            </div>
          ) : !isUser ? (
            <ReactMarkdown 
              remarkPlugins={[remarkGfm]}
              components={{
                h1: ({children}) => <h1 style={{color: '#00C2FF', fontSize: '18px', marginBottom: '10px', marginTop: '16px', borderBottom: '2px solid #00C2FF', paddingBottom: '4px', fontWeight: '700'}}>{children}</h1>,
                h2: ({children}) => <h2 style={{color: '#00C2FF', fontSize: '17px', marginBottom: '8px', marginTop: '14px', borderBottom: '1px solid rgba(0, 194, 255, 0.3)', paddingBottom: '2px', fontWeight: '600'}}>{children}</h2>,
                h3: ({children}) => <h3 style={{color: '#FFB74D', fontSize: '16px', marginBottom: '6px', marginTop: '12px', fontWeight: '600', textShadow: '0 1px 2px rgba(0, 0, 0, 0.8)'}}>{children}</h3>,
                strong: ({children}) => <strong style={{color: '#FFB74D', fontWeight: '700', textShadow: '0 1px 2px rgba(0, 0, 0, 0.6)'}}>{children}</strong>,
                ul: ({children}) => <ul style={{marginLeft: '20px', marginBottom: '10px'}}>{children}</ul>,
                ol: ({children}) => <ol style={{marginLeft: '20px', marginBottom: '10px'}}>{children}</ol>,
                li: ({children}) => <li style={{marginBottom: '6px', color: '#FFFFFF', lineHeight: '1.6', position: 'relative', listStylePosition: 'outside'}}>{children}</li>,
                p: ({children}) => (
                  <p style={{marginBottom: '10px', color: '#FFFFFF', lineHeight: '1.7'}}>
                    <CustomTextRenderer children={children} isUser={isUser} />
                  </p>
                ),
                // 处理纯文本节点
                text: ({children}) => <CustomTextRenderer children={children} isUser={isUser} />,
                blockquote: ({children}) => <blockquote style={{borderLeft: '4px solid #00C2FF', paddingLeft: '16px', marginLeft: '8px', marginBottom: '12px', fontStyle: 'italic', color: '#B8B8B8', backgroundColor: 'rgba(0, 194, 255, 0.05)', padding: '8px 16px', borderRadius: '4px'}}>{children}</blockquote>,
                code: ({children}) => <code style={{backgroundColor: 'rgba(0, 194, 255, 0.15)', padding: '3px 6px', borderRadius: '4px', fontSize: '14px', fontFamily: 'Monaco, Consolas, monospace', border: '1px solid rgba(0, 194, 255, 0.3)'}}>{children}</code>,
              }}
            >
              {message.content}
            </ReactMarkdown>
          ) : (
            <StyledText content={message.content} isUser={isUser} />
          )}
        </div>
      </div>

      {/* 右侧头像 - 只在用户消息时显示 */}
      {isUser && (
        <div style={avatarStyle}>
          {currentPlayerActor ? (
            <ActorImage actor={currentPlayerActor} />
          ) : (
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #FFB74D 0%, #FF8A50 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              fontWeight: '700',
              fontSize: '14px',
              textShadow: '0 1px 2px rgba(0, 0, 0, 0.8)'
            }}>
              玩
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ChatMessage;
