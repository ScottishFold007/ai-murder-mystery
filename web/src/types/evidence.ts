// 证物相关的类型定义

export type EvidenceCategory = 'physical' | 'document' | 'digital' | 'testimony' | 'combination';
export type EvidenceDiscoveryState = 'hidden' | 'surface' | 'investigated' | 'analyzed';
export type EvidenceImportance = 'low' | 'medium' | 'high' | 'critical';
export type EvidenceReactionType = 'basic' | 'contradiction' | 'breakthrough';
export type EmotionalState = 'nervous' | 'angry' | 'confused' | 'guilty' | 'calm';

// 证物基础接口
export interface Evidence {
  // 基础信息
  id: string;
  name: string;
  basicDescription: string;          // 表面信息："带口红印的酒杯"
  detailedDescription?: string;      // 搭档分析信息
  deepDescription?: string;          // 深度调查信息："杯底刻着嫌疑人缩写"
  image?: string;                    // 证物图片路径
  category: EvidenceCategory;        // 证物类型
  
  // 状态管理
  discoveryState: EvidenceDiscoveryState; // 发现状态
  unlockLevel: number;               // 解锁等级（0-3，对应不同深度的信息）
  
  // 关联系统
  relatedActors: string[];           // 相关角色名称
  relatedEvidences: string[];        // 关联证物ID
  triggerEvents: string[];           // 触发的剧情事件
  
  // 互动机制
  reactions: EvidenceReaction[];     // 各角色对此证物的反应
  combinableWith: string[];          // 可组合的证物ID
  
  // 元数据
  importance: EvidenceImportance;    // 重要程度
  sessionId: string;                 // 游戏会话ID
  scriptId: string;                  // 剧本ID
  discoveredAt?: string;             // 发现时间
  lastUpdated: string;               // 最后更新时间
  
  // 显示状态
  isNew?: boolean;                   // 是否为新获得的证物
  hasUpdate?: boolean;               // 是否有新的更新信息
}

// 证物反应配置
export interface EvidenceReaction {
  actorName: string;                 // 角色名称
  actorId: number;                   // 角色ID
  reactionType: EvidenceReactionType; // 反应类型
  
  // 基础响应
  basicResponse: string;             // "没见过这个东西"
  
  // 矛盾触发
  contradictionTrigger?: {
    requiredEvidences: string[];     // 需要同时出示的证物
    response: string;                // "你说你在家，但这个监控录像..."
    emotionalState: EmotionalState;  // 情绪状态
    unlocksInfo?: string;            // 解锁的新信息
  };
  
  // 真相揭露
  breakthrough?: {
    finalEvidences: string[];        // 最终突破需要的证物组合
    confessionResponse: string;      // 最终坦白内容
    unlocksNew: string[];           // 解锁的新证物或剧情
    gameStateChange?: string;        // 游戏状态改变
  };
  
  // 特殊标记
  isDecoy?: boolean;                 // 是否为干扰项
  requiresPermission?: boolean;      // 是否需要特殊权限展示
}

// 证物发现记录
export interface EvidenceDiscovery {
  id: string;
  evidenceId: string;
  sessionId: string;
  actorName: string;                 // 发现证物的角色
  discoveryMethod: 'conversation' | 'investigation' | 'combination' | 'deduction'; // 发现方式
  previousState: EvidenceDiscoveryState;
  newState: EvidenceDiscoveryState;
  triggerContext?: any;              // 触发发现的上下文信息
  discoveredAt: string;              // 发现时间
}

// 证物组合记录
export interface EvidenceCombination {
  id: string;
  sessionId: string;
  primaryEvidenceId: string;
  secondaryEvidenceId: string;
  resultEvidenceId?: string;
  combinationSuccess: boolean;
  combinationResult: string;         // 组合结果描述
  createdAt: string;
}

// 证物出示记录
export interface EvidencePresentation {
  id: string;
  sessionId: string;
  evidenceId: string;
  presentedTo: string;               // 出示给谁
  presentedBy: string;               // 谁出示的
  reactionType: EvidenceReactionType;
  aiResponse: string;                // AI的回应
  newEvidencesUnlocked: string[];    // 解锁的新证物
  informationUpdated: string[];      // 更新的信息
  presentedAt: string;
}

// 证物在聊天中的消息格式
export interface EvidenceMessage {
  messageType: 'evidence';
  textContent?: string;              // 可选的文字说明
  evidence: Evidence;                // 证物完整信息
  presentationContext?: string;      // 出示上下文
}

// 证物提示信息
export interface EvidenceHint {
  type: 'location' | 'combination' | 'presentation' | 'investigation';
  urgency: 'low' | 'medium' | 'high';
  message: string;
  suggestedActions: string[];
  relatedEvidences?: string[];
  targetActors?: string[];
  timeoutAt?: string;                // 提示过期时间
}

// 证物库上下文
export interface EvidenceContext {
  evidences: Evidence[];
  sessionId: string;
  scriptId: string;
  lastUpdated: string;
  discoveryHistory: EvidenceDiscovery[];
  presentationHistory: EvidencePresentation[];
}

// 证物搜索过滤器
export interface EvidenceFilter {
  category?: EvidenceCategory;
  discoveryState?: EvidenceDiscoveryState;
  importance?: EvidenceImportance;
  relatedActor?: string;
  searchQuery?: string;
  timeRange?: {
    start: string;
    end: string;
  };
}

// 证物统计信息
export interface EvidenceStats {
  totalEvidences: number;
  newEvidences: number;
  categoryBreakdown: Record<EvidenceCategory, number>;
  stateBreakdown: Record<EvidenceDiscoveryState, number>;
  importanceBreakdown: Record<EvidenceImportance, number>;
  lastDiscoveryTime?: string;
  completionRate: number;             // 完成度百分比
}

// 游戏进度跟踪
export interface GameProgress {
  sessionId: string;
  discoveredEvidences: string[];
  presentedEvidences: Record<string, string[]>; // actorName -> evidenceIds
  combinedEvidences: string[];
  investigatedEvidences: string[];
  contradictionsFound: number;
  timeSpent: number;                  // 游戏时间（分钟）
  currentPhase: 'initial' | 'investigation' | 'confrontation' | 'resolution';
  hintsUsed: number;
  lastActivity: string;
}

// 证物操作请求接口
export interface EvidenceDiscoveryRequest {
  sessionId: string;
  scriptId: string;
  evidenceId: string;
  discoveryMethod: string;
  triggerContext?: any;
  discoveredBy: string;
}

export interface EvidencePresentationRequest {
  sessionId: string;
  evidenceId: string;
  presentedTo: string;
  presentedBy: string;
  textContent?: string;
  presentationContext?: string;
}

export interface EvidenceCombinationRequest {
  sessionId: string;
  primaryEvidenceId: string;
  secondaryEvidenceId: string;
  attemptedBy: string;
}

export interface EvidenceInvestigationRequest {
  sessionId: string;
  evidenceId: string;
  investigatedBy: string;
  investigationMethod: string;
}

// API响应接口
export interface EvidenceResponse {
  success: boolean;
  evidence?: Evidence;
  message?: string;
  newEvidences?: Evidence[];
  updatedEvidences?: Evidence[];
  gameStateChanges?: any;
}

export interface EvidenceListResponse {
  success: boolean;
  evidences: Evidence[];
  stats: EvidenceStats;
  message?: string;
}

// 默认证物模板
export const createDefaultEvidence = (overrides: Partial<Evidence> = {}): Evidence => ({
  id: `evidence_${Date.now()}`,
  name: '',
  basicDescription: '',
  category: 'physical',
  discoveryState: 'surface',
  unlockLevel: 1,
  relatedActors: [],
  relatedEvidences: [],
  triggerEvents: [],
  reactions: [],
  combinableWith: [],
  importance: 'medium',
  sessionId: '',
  scriptId: '',
  lastUpdated: new Date().toISOString(),
  isNew: true,
  ...overrides
});

// 证物验证函数
export const validateEvidence = (evidence: Partial<Evidence>): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!evidence.name?.trim()) {
    errors.push('证物名称不能为空');
  }
  
  if (!evidence.basicDescription?.trim()) {
    errors.push('证物基础描述不能为空');
  }
  
  if (!evidence.sessionId?.trim()) {
    errors.push('会话ID不能为空');
  }
  
  if (!evidence.scriptId?.trim()) {
    errors.push('剧本ID不能为空');
  }
  
  if (evidence.unlockLevel !== undefined && (evidence.unlockLevel < 0 || evidence.unlockLevel > 3)) {
    errors.push('解锁等级必须在0-3之间');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};
