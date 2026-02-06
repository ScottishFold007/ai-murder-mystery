// 证物管理工具函数

import { Evidence, EvidenceContext, EvidenceFilter, EvidenceStats, EvidenceDiscovery, EvidencePresentation, GameProgress } from '../types/evidence';
import { nanoid } from 'nanoid';

// 动态查找角色头像文件名的函数
const findCharacterAvatarFilename = async (characterName: string): Promise<string | null> => {
  try {
    console.log('🔍 evidenceManager.findCharacterAvatarFilename - 开始查找角色头像:', characterName);
    
    // 调用角色头像API获取所有可用的头像文件
    const response = await fetch('http://localhost:10000/character-avatars');
    if (!response.ok) {
      console.warn('🔍 evidenceManager.findCharacterAvatarFilename - API调用失败:', response.status);
      return null;
    }
    
    const data = await response.json();
    const avatars = data.avatars || [];
    console.log('🔍 evidenceManager.findCharacterAvatarFilename - 获取到头像列表数量:', avatars.length);
    
    // 查找匹配的头像文件（按优先级搜索）
    const searchPatterns = [
      // 精确匹配：角色名_时间戳_随机标识.png
      (filename: string) => filename.startsWith(`${characterName}_`) && filename.endsWith('.png'),
      // 简单匹配：角色名.png
      (filename: string) => filename === `${characterName}.png`,
      // 包含匹配：文件名包含角色名
      (filename: string) => filename.includes(characterName) && filename.endsWith('.png')
    ];
    
    for (const pattern of searchPatterns) {
      const matchedFile = avatars.find(pattern);
      if (matchedFile) {
        console.log('🔍 evidenceManager.findCharacterAvatarFilename - 找到匹配的头像文件:', matchedFile);
        return matchedFile;
      }
    }
    
    console.log('🔍 evidenceManager.findCharacterAvatarFilename - 未找到匹配的头像文件');
    return null;
  } catch (error) {
    console.error('🔍 evidenceManager.findCharacterAvatarFilename - 查找头像文件时出错:', error);
    return null;
  }
};

// 存储键前缀
const EVIDENCE_STORAGE_PREFIX = 'evidence_context_';
const PROGRESS_STORAGE_PREFIX = 'game_progress_';

/**
 * 获取证物存储键
 */
export const getEvidenceStorageKey = (sessionId: string): string => {
  return `${EVIDENCE_STORAGE_PREFIX}${sessionId}`;
};

/**
 * 获取游戏进度存储键
 */
export const getProgressStorageKey = (sessionId: string): string => {
  return `${PROGRESS_STORAGE_PREFIX}${sessionId}`;
};

/**
 * 从本地存储加载证物上下文
 */
export const loadEvidenceContext = (sessionId: string): EvidenceContext => {
  try {
    const storageKey = getEvidenceStorageKey(sessionId);
    const stored = localStorage.getItem(storageKey);
    
    if (!stored) {
      return createEmptyEvidenceContext(sessionId);
    }
    
    const context: EvidenceContext = JSON.parse(stored);
    console.log('🔍 loadEvidenceContext - 加载的证物数量:', context.evidences?.length || 0);
    
    // 确保数据结构完整
    if (!context.evidences) context.evidences = [];
    if (!context.discoveryHistory) context.discoveryHistory = [];
    if (!context.presentationHistory) context.presentationHistory = [];
    
    return context;
  } catch (error) {
    console.error('❌ 加载证物上下文失败:', error);
    return createEmptyEvidenceContext(sessionId);
  }
};

/**
 * 保存证物上下文到本地存储
 */
export const saveEvidenceContext = (context: EvidenceContext): boolean => {
  try {
    const storageKey = getEvidenceStorageKey(context.sessionId);
    const updatedContext = {
      ...context,
      lastUpdated: new Date().toISOString()
    };
    
    const dataString = JSON.stringify(updatedContext);
    const dataSizeKB = Math.round(dataString.length / 1024);
    
    console.log('🔍 saveEvidenceContext - 保存证物数量:', context.evidences.length, '数据大小:', dataSizeKB + 'KB');
    
    // 检查是否包含base64图像数据（不应该有）
    if (dataString.includes('data:image/')) {
      console.warn('⚠️ 检测到base64图像数据，这可能导致存储配额超出！');
    }
    
    localStorage.setItem(storageKey, dataString);
    return true;
  } catch (error) {
    if (error instanceof DOMException && error.code === DOMException.QUOTA_EXCEEDED_ERR) {
      console.error('❌ localStorage存储配额已满！请检查是否有base64图像数据被错误存储。');
      console.error('💡 建议：确保只存储文件路径，不存储图像的base64数据。');
    }
    console.error('❌ 保存证物上下文失败:', error);
    return false;
  }
};

/**
 * 创建空的证物上下文
 */
export const createEmptyEvidenceContext = (sessionId: string, scriptId?: string): EvidenceContext => {
  return {
    evidences: [],
    sessionId,
    scriptId: scriptId || '',
    lastUpdated: new Date().toISOString(),
    discoveryHistory: [],
    presentationHistory: []
  };
};

/**
 * 添加证物到上下文（支持受害人证物的动态文件名查找）
 */
export const addEvidenceToContext = (
  sessionId: string,
  evidence: Evidence
): Evidence => {
  const context = loadEvidenceContext(sessionId);
  
  // 确保ID唯一
  if (context.evidences.find(e => e.id === evidence.id)) {
    evidence.id = `${evidence.id}_${nanoid(6)}`;
  }
  
  // 设置为新证物
  evidence.isNew = true;
  evidence.lastUpdated = new Date().toISOString();
  
  // 如果是受害人证物且没有图像，尝试动态查找头像文件名
  if (evidence.name.startsWith('受害人：') && !evidence.image) {
    console.log('🔍 addEvidenceToContext - 检测到受害人证物无图像，启动异步文件名查找');
    
    // 异步查找受害人头像文件名
    const victimName = evidence.name.replace('受害人：', '');
    findCharacterAvatarFilename(victimName).then(filename => {
      if (filename) {
        console.log('🔍 addEvidenceToContext - 找到受害人头像文件名，更新证物:', filename);
        
        // 更新证物图像
        const updatedContext = loadEvidenceContext(sessionId);
        const evidenceIndex = updatedContext.evidences.findIndex(e => e.id === evidence.id);
        if (evidenceIndex !== -1) {
          updatedContext.evidences[evidenceIndex].image = filename;
          updatedContext.evidences[evidenceIndex].lastUpdated = new Date().toISOString();
          saveEvidenceContext(updatedContext);
          console.log('🔍 addEvidenceToContext - 受害人证物图像已更新');
        }
      } else {
        console.log('🔍 addEvidenceToContext - 未找到受害人头像文件，将继续使用emoji显示');
      }
    }).catch(error => {
      console.error('🔍 addEvidenceToContext - 受害人头像查找失败:', error);
    });
  }
  
  context.evidences.push(evidence);
  saveEvidenceContext(context);
  
  return evidence;
};

/**
 * 刷新所有受害人证物的头像文件名（用于修复已存在的无图像受害人证物）
 */
export const refreshVictimEvidenceImages = async (sessionId: string): Promise<void> => {
  try {
    console.log('🔍 refreshVictimEvidenceImages - 开始刷新受害人证物图像');
    
    const context = loadEvidenceContext(sessionId);
    let hasUpdates = false;
    
    for (let i = 0; i < context.evidences.length; i++) {
      const evidence = context.evidences[i];
      
      // 检查是否为无图像的受害人证物
      if (evidence.name.startsWith('受害人：') && !evidence.image) {
        const victimName = evidence.name.replace('受害人：', '');
        console.log('🔍 refreshVictimEvidenceImages - 处理受害人证物:', victimName);
        
        const filename = await findCharacterAvatarFilename(victimName);
        if (filename) {
          console.log('🔍 refreshVictimEvidenceImages - 为受害人证物设置图像:', filename);
          context.evidences[i].image = filename;
          context.evidences[i].lastUpdated = new Date().toISOString();
          hasUpdates = true;
        }
      }
    }
    
    if (hasUpdates) {
      saveEvidenceContext(context);
      console.log('🔍 refreshVictimEvidenceImages - 受害人证物图像刷新完成');
    } else {
      console.log('🔍 refreshVictimEvidenceImages - 没有需要更新的受害人证物');
    }
  } catch (error) {
    console.error('🔍 refreshVictimEvidenceImages - 刷新受害人证物图像时出错:', error);
  }
};

/**
 * 更新证物信息
 */
export const updateEvidence = (
  sessionId: string,
  evidenceId: string,
  updates: Partial<Evidence>
): Evidence | null => {
  const context = loadEvidenceContext(sessionId);
  const evidenceIndex = context.evidences.findIndex(e => e.id === evidenceId);
  
  if (evidenceIndex === -1) {
    console.error('❌ 证物不存在:', evidenceId);
    return null;
  }
  
  const updatedEvidence = {
    ...context.evidences[evidenceIndex],
    ...updates,
    lastUpdated: new Date().toISOString(),
    hasUpdate: true
  };
  
  context.evidences[evidenceIndex] = updatedEvidence;
  saveEvidenceContext(context);
  
  return updatedEvidence;
};

/**
 * 根据ID获取证物
 */
export const getEvidenceById = (sessionId: string, evidenceId: string): Evidence | null => {
  const context = loadEvidenceContext(sessionId);
  return context.evidences.find(e => e.id === evidenceId) || null;
};

/**
 * 获取过滤后的证物列表
 */
export const getFilteredEvidences = (sessionId: string, filter?: EvidenceFilter): Evidence[] => {
  const context = loadEvidenceContext(sessionId);
  let evidences = [...context.evidences];
  
  if (!filter) return evidences;
  
  // 按类别过滤
  if (filter.category) {
    evidences = evidences.filter(e => e.category === filter.category);
  }
  
  // 按发现状态过滤
  if (filter.discoveryState) {
    evidences = evidences.filter(e => e.discoveryState === filter.discoveryState);
  }
  
  // 按重要程度过滤
  if (filter.importance) {
    evidences = evidences.filter(e => e.importance === filter.importance);
  }
  
  // 按相关角色过滤
  if (filter.relatedActor) {
    evidences = evidences.filter(e => e.relatedActors.includes(filter.relatedActor!));
  }
  
  // 按搜索关键词过滤
  if (filter.searchQuery) {
    const query = filter.searchQuery.toLowerCase();
    evidences = evidences.filter(e => 
      e.name.toLowerCase().includes(query) ||
      e.basicDescription.toLowerCase().includes(query) ||
      e.detailedDescription?.toLowerCase().includes(query) ||
      e.deepDescription?.toLowerCase().includes(query)
    );
  }
  
  // 按时间范围过滤
  if (filter.timeRange) {
    evidences = evidences.filter(e => {
      if (!e.discoveredAt) return false;
      const discoveryTime = new Date(e.discoveredAt).getTime();
      const startTime = new Date(filter.timeRange!.start).getTime();
      const endTime = new Date(filter.timeRange!.end).getTime();
      return discoveryTime >= startTime && discoveryTime <= endTime;
    });
  }
  
  // 按发现时间倒序排列
  evidences.sort((a, b) => {
    const timeA = a.discoveredAt ? new Date(a.discoveredAt).getTime() : 0;
    const timeB = b.discoveredAt ? new Date(b.discoveredAt).getTime() : 0;
    return timeB - timeA;
  });
  
  return evidences;
};

/**
 * 获取证物统计信息
 */
export const getEvidenceStats = (sessionId: string): EvidenceStats => {
  const context = loadEvidenceContext(sessionId);
  const evidences = context.evidences;
  
  const categoryBreakdown = evidences.reduce((acc, evidence) => {
    acc[evidence.category] = (acc[evidence.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const stateBreakdown = evidences.reduce((acc, evidence) => {
    acc[evidence.discoveryState] = (acc[evidence.discoveryState] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const importanceBreakdown = evidences.reduce((acc, evidence) => {
    acc[evidence.importance] = (acc[evidence.importance] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const newEvidences = evidences.filter(e => e.isNew).length;
  const lastDiscoveryTime = evidences
    .filter(e => e.discoveredAt)
    .sort((a, b) => new Date(b.discoveredAt!).getTime() - new Date(a.discoveredAt!).getTime())[0]?.discoveredAt;
  
  // 计算完成度（基于解锁等级）
  const totalPossibleLevels = evidences.length * 3; // 假设每个证物最多3级
  const currentLevels = evidences.reduce((sum, e) => sum + e.unlockLevel, 0);
  const completionRate = totalPossibleLevels > 0 ? (currentLevels / totalPossibleLevels) * 100 : 0;
  
  return {
    totalEvidences: evidences.length,
    newEvidences,
    categoryBreakdown: categoryBreakdown as any,
    stateBreakdown: stateBreakdown as any,
    importanceBreakdown: importanceBreakdown as any,
    lastDiscoveryTime,
    completionRate: Math.round(completionRate)
  };
};

/**
 * 记录证物发现历史
 */
export const recordEvidenceDiscovery = (
  sessionId: string,
  discovery: Omit<EvidenceDiscovery, 'id' | 'discoveredAt'>
): EvidenceDiscovery => {
  const context = loadEvidenceContext(sessionId);
  
  const discoveryRecord: EvidenceDiscovery = {
    ...discovery,
    id: nanoid(),
    discoveredAt: new Date().toISOString()
  };
  
  context.discoveryHistory.push(discoveryRecord);
  saveEvidenceContext(context);
  
  return discoveryRecord;
};

/**
 * 记录证物出示历史
 */
export const recordEvidencePresentation = (
  sessionId: string,
  presentation: Omit<EvidencePresentation, 'id' | 'presentedAt'>
): EvidencePresentation => {
  const context = loadEvidenceContext(sessionId);
  
  const presentationRecord: EvidencePresentation = {
    ...presentation,
    id: nanoid(),
    presentedAt: new Date().toISOString()
  };
  
  context.presentationHistory.push(presentationRecord);
  saveEvidenceContext(context);
  
  return presentationRecord;
};

/**
 * 获取证物的出示历史
 */
export const getEvidencePresentationHistory = (
  sessionId: string,
  evidenceId: string
): EvidencePresentation[] => {
  const context = loadEvidenceContext(sessionId);
  return context.presentationHistory.filter(p => p.evidenceId === evidenceId);
};

/**
 * 检查证物是否可以组合
 */
export const canCombineEvidences = (
  sessionId: string,
  evidenceId1: string,
  evidenceId2: string
): boolean => {
  const evidence1 = getEvidenceById(sessionId, evidenceId1);
  const evidence2 = getEvidenceById(sessionId, evidenceId2);
  
  if (!evidence1 || !evidence2) return false;
  
  return evidence1.combinableWith.includes(evidenceId2) ||
         evidence2.combinableWith.includes(evidenceId1);
};

/**
 * 清除证物的"新"标记
 */
export const clearEvidenceNewFlags = (sessionId: string, maxAge: number = 48): number => {
  const context = loadEvidenceContext(sessionId);
  const cutoffTime = new Date();
  cutoffTime.setHours(cutoffTime.getHours() - maxAge);
  
  let clearedCount = 0;
  context.evidences.forEach(evidence => {
    if (evidence.isNew && evidence.lastUpdated) {
      const updateTime = new Date(evidence.lastUpdated);
      if (updateTime < cutoffTime) {
        evidence.isNew = false;
        clearedCount++;
      }
    }
  });
  
  if (clearedCount > 0) {
    saveEvidenceContext(context);
    console.log(`🧹 清除了 ${clearedCount} 个证物的"新"标记`);
  }
  
  return clearedCount;
};

/**
 * 生成证物上下文摘要（用于AI对话）
 */
export const generateEvidenceContext = (sessionId: string, targetActor?: string): string => {
  const context = loadEvidenceContext(sessionId);
  const evidences = context.evidences.filter(e => e.discoveryState !== 'hidden');
  
  if (evidences.length === 0) {
    return '';
  }
  
  const contextParts: string[] = [];
  contextParts.push('【已发现证物】');
  
  evidences.forEach((evidence, index) => {
    contextParts.push(`${index + 1}. ${evidence.name}`);
    contextParts.push(`   基础信息：${evidence.basicDescription}`);
    
    if (evidence.detailedDescription && evidence.unlockLevel >= 2) {
      contextParts.push(`   详细分析：${evidence.detailedDescription}`);
    }
    
    if (evidence.deepDescription && evidence.unlockLevel >= 3) {
      contextParts.push(`   深度发现：${evidence.deepDescription}`);
    }
    
    if (evidence.relatedActors.length > 0) {
      contextParts.push(`   相关角色：${evidence.relatedActors.join(', ')}`);
    }
    
    contextParts.push(''); // 空行分隔
  });
  
  // 如果指定了目标角色，添加该角色相关的证物出示历史
  if (targetActor) {
    const presentations = context.presentationHistory
      .filter(p => p.presentedTo === targetActor)
      .slice(-5); // 最近5次出示记录
    
    if (presentations.length > 0) {
      contextParts.push('【证物出示历史】');
      presentations.forEach(p => {
        const evidence = evidences.find(e => e.id === p.evidenceId);
        if (evidence) {
          contextParts.push(`- 向${p.presentedTo}出示了"${evidence.name}"`);
        }
      });
      contextParts.push('');
    }
  }
  
  return contextParts.join('\n');
};

/**
 * 加载游戏进度
 */
export const loadGameProgress = (sessionId: string): GameProgress => {
  try {
    const storageKey = getProgressStorageKey(sessionId);
    const stored = localStorage.getItem(storageKey);
    
    if (!stored) {
      return createEmptyGameProgress(sessionId);
    }
    
    return JSON.parse(stored);
  } catch (error) {
    console.error('❌ 加载游戏进度失败:', error);
    return createEmptyGameProgress(sessionId);
  }
};

/**
 * 保存游戏进度
 */
export const saveGameProgress = (progress: GameProgress): boolean => {
  try {
    const storageKey = getProgressStorageKey(progress.sessionId);
    const updatedProgress = {
      ...progress,
      lastActivity: new Date().toISOString()
    };
    
    localStorage.setItem(storageKey, JSON.stringify(updatedProgress));
    return true;
  } catch (error) {
    console.error('❌ 保存游戏进度失败:', error);
    return false;
  }
};

/**
 * 创建空的游戏进度
 */
export const createEmptyGameProgress = (sessionId: string): GameProgress => {
  return {
    sessionId,
    discoveredEvidences: [],
    presentedEvidences: {},
    combinedEvidences: [],
    investigatedEvidences: [],
    contradictionsFound: 0,
    timeSpent: 0,
    currentPhase: 'initial',
    hintsUsed: 0,
    lastActivity: new Date().toISOString()
  };
};

/**
 * 更新游戏进度
 */
export const updateGameProgress = (
  sessionId: string,
  updates: Partial<GameProgress>
): GameProgress => {
  const progress = loadGameProgress(sessionId);
  const updatedProgress = {
    ...progress,
    ...updates,
    lastActivity: new Date().toISOString()
  };
  
  saveGameProgress(updatedProgress);
  return updatedProgress;
};

// ==================== 证物显示辅助函数 ====================

/**
 * 从证物描述中分离概况和线索
 * @param description 完整的证物描述
 * @returns { overview: 证物概况, clues: 证物线索 }
 */
export const separateEvidenceContent = (description: string): { overview: string; clues: string } => {
  if (!description) {
    return { overview: '', clues: '' };
  }

  // 查找【关联线索】分隔符
  const cluesMarker = '【关联线索】';
  const cluesIndex = description.indexOf(cluesMarker);
  
  if (cluesIndex === -1) {
    // 如果没有找到分隔符，整个描述作为概况
    return { overview: description.trim(), clues: '' };
  }
  
  // 分离概况和线索
  const overview = description.substring(0, cluesIndex).trim();
  const clues = description.substring(cluesIndex + cluesMarker.length).trim();
  
  return { overview, clues };
};

/**
 * 获取用户可见的证物概况（不包含线索）
 * @param evidence 证物对象
 * @returns 证物概况字符串
 */
export const getEvidenceOverview = (evidence: Evidence): string => {
  const { overview } = separateEvidenceContent(evidence.basicDescription || '');
  return overview;
};

/**
 * 获取证物线索（仅供AI使用，用户不可见）
 * @param evidence 证物对象
 * @returns 证物线索字符串
 */
export const getEvidenceClues = (evidence: Evidence): string => {
  const { clues } = separateEvidenceContent(evidence.basicDescription || '');
  return clues;
};

/**
 * 获取AI使用的完整证物信息
 * @param evidence 证物对象
 * @returns 包含概况和线索的完整信息
 */
export const getFullEvidenceForAI = (evidence: Evidence): string => {
  return evidence.basicDescription || '';
};

/**
 * 构建用户可见的证物悬浮提示内容
 * @param evidence 证物对象
 * @returns 悬浮提示内容
 */
export const buildEvidenceTooltip = (evidence: Evidence): string => {
  const overview = getEvidenceOverview(evidence);
  return overview ? `📋 证物概况: ${overview}` : evidence.name;
};

// ==================== 证物初始化函数 ====================

import { Script, ScriptEvidence } from '../types/script';
import { initializeEvidencesForScript } from '../data/sampleEvidences';

/**
 * 分离证物概况和线索的工具函数
 */
const separateEvidenceContentForInit = (description: string): { overview: string; clues: string } => {
  if (!description) {
    return { overview: '', clues: '' };
  }

  const cluesMarker = '【关联线索】';
  const cluesIndex = description.indexOf(cluesMarker);
  
  if (cluesIndex === -1) {
    return { overview: description.trim(), clues: '' };
  }
  
  const overview = description.substring(0, cluesIndex).trim();
  const clues = description.substring(cluesIndex + cluesMarker.length).trim();
  
  return { overview, clues };
};

/**
 * 将剧本证物转换为游戏证物
 */
export const convertScriptEvidenceToGameEvidence = (
  scriptEvidence: ScriptEvidence,
  sessionId: string
): Evidence => {
  // 从剧本证物中提取概况信息，只给游戏界面显示概况
  const { overview } = separateEvidenceContentForInit(scriptEvidence.description);
  
  return {
    id: scriptEvidence.id,
    name: scriptEvidence.name,
    basicDescription: scriptEvidence.overview || overview || scriptEvidence.description,
    category: scriptEvidence.category,
    discoveryState: scriptEvidence.initialState,
    unlockLevel: scriptEvidence.initialState === 'hidden' ? 0 : 1,
    relatedActors: scriptEvidence.relatedCharacters,
    relatedEvidences: [],
    triggerEvents: [],
    reactions: [],
    combinableWith: [],
    importance: scriptEvidence.importance,
    sessionId,
    scriptId: '',
    image: scriptEvidence.image,
    discoveredAt: scriptEvidence.initialState !== 'hidden' ? new Date().toISOString() : undefined,
    lastUpdated: new Date().toISOString(),
    isNew: scriptEvidence.initialState !== 'hidden',
    hasUpdate: false
  };
};

/**
 * 从剧本证物初始化游戏证物
 */
export const initializeEvidencesFromScript = (
  script: Script,
  sessionId: string
): Evidence[] => {
  if (!script.evidences || script.evidences.length === 0) {
    console.log('🔍 剧本没有定义证物，使用示例证物');
    return initializeEvidencesForScript(script.id, sessionId);
  }

  console.log(`🔍 从剧本初始化 ${script.evidences.length} 个证物`);
  
  const gameEvidences = script.evidences.map(scriptEvidence => 
    convertScriptEvidenceToGameEvidence(scriptEvidence, sessionId)
  );

  return gameEvidences;
};

/**
 * 为指定剧本和会话初始化证物数据（兼容旧版本）
 */
export const initializeEvidencesForSession = (
  scriptId: string, 
  sessionId: string
): Evidence[] => {
  try {
    // 检查是否已经初始化过
    const existingContext = loadEvidenceContext(sessionId);
    if (existingContext.evidences.length > 0) {
      console.log('🔍 证物已初始化，跳过重复初始化');
      return existingContext.evidences;
    }

    // 获取剧本对应的示例证物
    const sampleEvidences = initializeEvidencesForScript(scriptId, sessionId);
    
    if (sampleEvidences.length === 0) {
      console.log('🔍 当前剧本没有预设证物');
      return [];
    }

    // 创建新的证物上下文
    const context = createEmptyEvidenceContext(sessionId, scriptId);
    
    // 添加证物到上下文
    sampleEvidences.forEach(evidence => {
      context.evidences.push({
        ...evidence,
        sessionId,
        discoveryState: evidence.importance === 'critical' ? 'surface' : 
                       Math.random() > 0.6 ? 'surface' : 'hidden',
        unlockLevel: evidence.importance === 'critical' ? 2 : 1,
        detailedDescription: evidence.unlockLevel >= 2 ? evidence.detailedDescription : undefined,
        deepDescription: evidence.unlockLevel >= 3 ? evidence.deepDescription : undefined
      });
    });

    // 保存到本地存储
    saveEvidenceContext(context);
    
    console.log(`🔍 为剧本 ${scriptId} 初始化了 ${sampleEvidences.length} 个证物`);
    return context.evidences;
    
  } catch (error) {
    console.error('❌ 证物初始化失败:', error);
    return [];
  }
};

/**
 * 检查并自动初始化证物
 */
export const ensureEvidencesInitialized = (
  scriptOrId: string | Script,
  sessionId: string
): Evidence[] => {
  const context = loadEvidenceContext(sessionId);
  
  const script = typeof scriptOrId === 'object' ? scriptOrId : null;
  const scriptId = typeof scriptOrId === 'string' ? scriptOrId : scriptOrId.id;
  
  if (context.evidences.length > 0 && context.scriptId === scriptId) {
    if (script && script.evidences && script.evidences.length > 0) {
      const scriptEvidenceIds = new Set(script.evidences.map(e => e.id));
      const contextEvidenceIds = new Set(context.evidences.map(e => e.id));
      
      const hasNewScriptEvidences = script.evidences.some(se => !contextEvidenceIds.has(se.id));
      const hasRemovedScriptEvidences = context.evidences.some(ce => !scriptEvidenceIds.has(ce.id));
      
      if (hasNewScriptEvidences || hasRemovedScriptEvidences) {
        console.log('🔄 检测到剧本证物变更，重新同步');
        const syncedEvidences = initializeEvidencesFromScript(script, sessionId);
        const newContext = createEmptyEvidenceContext(sessionId, scriptId);
        newContext.evidences = syncedEvidences;
        saveEvidenceContext(newContext);
        return syncedEvidences;
      }
    }
    
    return context.evidences;
  }
  
  if (context.scriptId !== scriptId) {
    console.log(`🔍 剧本ID变更 (${context.scriptId} -> ${scriptId})，重新初始化证物`);
    resetEvidencesForSession(sessionId);
  }
  
  let initializedEvidences: Evidence[];
  if (script) {
    initializedEvidences = initializeEvidencesFromScript(script, sessionId);
  } else {
    initializedEvidences = initializeEvidencesForSession(scriptId, sessionId);
  }
  
  const newContext = createEmptyEvidenceContext(sessionId, scriptId);
  newContext.evidences = initializedEvidences;
  saveEvidenceContext(newContext);
  
  return initializedEvidences;
};

/**
 * 强制同步剧本证物到游戏证物
 */
export const forceSyncScriptEvidencesToGame = (
  script: Script,
  sessionId: string
): Evidence[] => {
  console.log('🔄 强制同步剧本证物到游戏数据');
  
  resetEvidencesForSession(sessionId);
  
  return ensureEvidencesInitialized(script, sessionId);
};

/**
 * 重置会话的证物数据
 */
export const resetEvidencesForSession = (sessionId: string): void => {
  try {
    const emptyContext = createEmptyEvidenceContext(sessionId);
    saveEvidenceContext(emptyContext);
    console.log('🔍 已重置会话证物数据');
  } catch (error) {
    console.error('❌ 重置证物数据失败:', error);
  }
};
