// 智能角色交互系统

import { Actor } from '../providers/mysteryContext';
import { Evidence } from '../types/evidence';

// 交互模式类型
export type InteractionMode = 'player_self' | 'player_other' | 'normal';

// 判断是否为玩家自我对话
export const isPlayerSelfChat = (currentActor: Actor, targetActor: Actor): boolean => {
  return Boolean(currentActor.isPlayer) && currentActor.id === targetActor.id;
};

// 获取交互模式
export const getInteractionMode = (currentActor: Actor, targetActor: Actor): InteractionMode => {
  if (isPlayerSelfChat(currentActor, targetActor)) {
    return 'player_self';
  } else if (currentActor.isPlayer && !targetActor.isPlayer) {
    return 'player_other';
  } else {
    return 'normal';
  }
};

// 生成玩家自我对话提示词
export const generatePlayerSelfPrompt = (actor: Actor, userMessage: string): string => {
  return `
【侦探思考模式】
你是${actor.name}，正在进行案件分析和思考。

【当前思考】
${userMessage}

【回应要求】
请以侦探的专业角度进行深入分析，包括：
1. 对当前线索的整理和分析
2. 对嫌疑人行为的推理
3. 发现的矛盾点和疑问
4. 下一步调查方向
5. 保持逻辑性和专业性
`;
};

// 证物反应级别
export type EvidenceReactionLevel = 'basic' | 'contradiction' | 'breakthrough';

// 分析角色对证物的反应级别
export const analyzeEvidenceReaction = (actor: Actor, evidence: Evidence): EvidenceReactionLevel => {
  // 检查证物是否与角色相关
  const isRelated = evidence.relatedActors.includes(actor.name);
  
  // 检查重要程度
  const isCritical = evidence.importance === 'critical';
  const isHigh = evidence.importance === 'high';
  
  // 检查角色是否是凶手
  const isKiller = actor.isKiller;
  
  if (isCritical && isRelated && isKiller) {
    return 'breakthrough'; // 关键证物 + 相关角色 + 是凶手 → 突破
  } else if ((isHigh || isCritical) && isRelated) {
    return 'contradiction'; // 重要证物 + 相关角色 → 矛盾
  } else {
    return 'basic'; // 其他情况 → 基础反应
  }
};

// 生成证物出示的AI提示词
export const generateEvidenceReactionPrompt = (
  presentingActor: Actor,
  targetActor: Actor,
  evidence: Evidence,
  userMessage: string
): string => {
  const reactionLevel = analyzeEvidenceReaction(targetActor, evidence);
  const isRelated = evidence.relatedActors.includes(targetActor.name);
  
  let reactionGuidance = '';
  
  switch (reactionLevel) {
    case 'basic':
      reactionGuidance = `
【基础反应】
- 对证物表现出正常的关注或好奇
- 可以提供一些基本的观察或评论
- 不要表现出过度的紧张或异常
- 如果与你无关，可以诚实地表达不了解`;
      break;
    
    case 'contradiction':
      reactionGuidance = `
【矛盾反应】
- 这个证物与你有一定关联，需要谨慎应对
- 可能会表现出轻微的紧张或试图转移话题
- 避免承认关键信息，但不要过于明显
- 可以提供部分真实信息来降低怀疑
- 注意不要违反你的violation约束`;
      break;
    
    case 'breakthrough':
      reactionGuidance = `
【突破反应】
- 这是非常关键的证物，对你构成重大威胁
- 表现出明显的情绪波动（震惊、恐慌、愤怒等）
- 可能会强烈否认、反驳或试图解释
- 仍需严格遵守violation约束，不能直接承认罪行
- 可以考虑部分承认次要事实来减少压力
- 情绪反应要符合你的personality设定`;
      break;
  }

  return `
【证物出示情境】
${presentingActor.name}向你出示了证物：${evidence.name}

【证物信息】
- 名称：${evidence.name}
- 描述：${evidence.basicDescription}
- 重要程度：${evidence.importance}
- 与你的关联：${isRelated ? '有关联' : '无直接关联'}

【你的身份和约束】
- 角色名：${targetActor.name}
- 性格特征：${targetActor.personality}
- 行为约束：${targetActor.violation}
- 内心秘密：${targetActor.secret}

${reactionGuidance}

【当前对话】
${presentingActor.name}：${userMessage}

【回应要求】
1. 根据证物的重要性和与你的关联程度给出合理反应
2. 严格遵守你的violation约束，不能泄露不该说的信息
3. 反应要符合你的personality和当前情境
4. 可以要求查看证物的更多细节或询问来源
5. 保持角色的真实性和一致性
`;
};

// 检测消息是否包含证物出示
export const detectEvidencePresentation = (message: string): { isEvidenceMessage: boolean; evidenceName?: string } => {
  const evidencePattern = /\[发送证物\]\s*([^:：]+)/;
  const match = message.match(evidencePattern);
  
  if (match) {
    return {
      isEvidenceMessage: true,
      evidenceName: match[1].trim()
    };
  }
  
  return { isEvidenceMessage: false };
};

// 检测消息是否包含笔记分享
export const detectNoteSharing = (message: string): { isNoteMessage: boolean; noteTitle?: string; noteContent?: string } => {
  const notePattern = /\[分享笔记\]\s*([^:：]+):\s*([\s\S]*)/;
  const match = message.match(notePattern);
  
  if (match) {
    return {
      isNoteMessage: true,
      noteTitle: match[1].trim(),
      noteContent: match[2].trim()
    };
  }
  
  return { isNoteMessage: false };
};

// 生成笔记分享的AI提示词
export const generateNoteReactionPrompt = (
  presentingActor: Actor,
  targetActor: Actor,
  noteTitle: string,
  noteContent: string,
  userMessage: string
): string => {
  return `
【笔记分享情境】
${presentingActor.name}向你分享了一条推理笔记：${noteTitle}

【笔记内容】
${noteContent}

【你的身份和约束】
- 角色名：${targetActor.name}
- 性格特征：${targetActor.personality}
- 行为约束：${targetActor.violation}
- 内心秘密：${targetActor.secret}

【搭档反应要求】
作为调查搭档，你需要：
1. 认真分析玩家分享的推理笔记内容
2. 基于笔记中的线索和观察，提供专业的案件分析
3. 指出笔记中的关键发现和可能的遗漏
4. 结合你的办案经验，补充相关信息
5. 建议下一步调查方向
6. 帮助玩家梳理案件脉络，找出矛盾点和疑点
7. 严格遵守你的violation约束，不能泄露不该说的信息

【当前对话】
${presentingActor.name}：${userMessage}

【回应要求】
1. 基于分享的笔记内容进行专业分析
2. 保持搭档的协助态度和专业性
3. 严格遵守你的violation约束
4. 可以询问更多细节或提出新的调查思路
5. 保持角色的真实性和一致性
`;
};

// 生成角色反应提示词
export const generateRoleReactionPrompt = (
  currentActor: Actor, 
  targetActor: Actor, 
  userMessage: string, 
  allActors?: Record<number, Actor>,
  notesContext?: string
): string => {
  const actorTypeDesc = getActorDescription(targetActor);
  const dialogueTone = getDialogueTone(targetActor);
  
  // 为搭档角色添加特殊指导和角色信息
  let partnerGuidance = '';
  if (targetActor.isPartner || targetActor.isAssistant) {
    // 获取所有角色的姓名列表
    const characterNames: string[] = [];
    if (allActors) {
      Object.values(allActors).forEach(actor => {
        if (actor.name && !characterNames.includes(actor.name)) {
          characterNames.push(actor.name);
        }
      });
    }
    
    const characterList = characterNames.length > 0 ? characterNames.join('、') : '太平公主、张昌宗、李隆基、武惠妃、高力士、姚崇、狄仁杰';
    
    // 获取角色详细信息（仅公开信息，不包含秘密和违规原则）
    let characterDetails = '';
    if (allActors) {
      const characterInfoList: string[] = [];
      Object.values(allActors).forEach(actor => {
        if (actor.name && !actor.isPlayer) {
          // 只提供公开信息：姓名、身份、性格，不提供secret和violation
          const info = `${actor.name}（${actor.bio || '身份不详'}，性格：${actor.personality || '未知'}）`;
          characterInfoList.push(info);
        }
      });
      characterDetails = characterInfoList.join('、');
    }
    
    partnerGuidance = `
【搭档角色特殊要求】
作为调查搭档，当被问及案件涉及的具体人员时，你必须：
- 提供具体的姓名和身份，不能只给出模糊分类
- 基于全局故事背景中明确提到的角色进行回应
- 如果故事背景中列出了具体嫌疑人，必须明确提及他们的姓名
- 避免使用"其一、其二、其三"这样的模糊分类，而要直接说出具体姓名
- 能够分析每个角色的背景、性格特点和可能的动机

【案件涉及的具体人员】
案件涉及的具体人员包括：${characterList}
当被问及案件涉及哪些人时，必须明确列出这些具体姓名，不能只给出模糊分类。

【角色详细信息】
${characterDetails ? `以下是各角色的详细信息：${characterDetails}` : ''}
基于这些角色信息，你可以分析他们的动机、性格特点、行为模式和可能的作案手法。

【重要安全限制】
- 你只知道角色的公开信息（姓名、身份、性格），不知道任何角色的秘密信息
- 严禁直接指出凶手身份，只能基于证据进行推理分析
- 不能泄露任何角色的隐藏动机或秘密行为
- 只能根据玩家提供的证据和推理笔记进行分析，不能凭空断定结论`;
  }

  // 添加笔记上下文（仅对搭档角色且有笔记内容时）
  let notesGuidance = '';
  if ((targetActor.isPartner || targetActor.isAssistant) && notesContext && notesContext.trim()) {
    notesGuidance = `
【玩家推理笔记】
以下是玩家在调查过程中记录的推理笔记，请基于这些信息协助分析案件：
${notesContext}

【基于笔记的分析要求】
- 仔细阅读玩家的笔记内容，理解其推理思路
- 结合笔记中的线索和观察，提供专业的案件分析
- 指出笔记中的关键发现和可能的遗漏
- 基于笔记信息，建议下一步调查方向
- 帮助玩家梳理案件脉络，找出矛盾点和疑点`;
  }
  
  const enhancedPrompt = `
【角色身份感知】
你是 ${targetActor.name}，${actorTypeDesc}。

【对话对象（玩家）】
来者：${currentActor.name}（玩家）
来者个性：${currentActor.personality || '理性谨慎'}
来者背景：${currentActor.bio || '暂无背景信息'}
来者上下文：${currentActor.context || '正在调查本案'}

【用户消息】
${userMessage}

【回应要求】
请基于你的角色设定，${dialogueTone}回应。注意：
1. 保持角色的一致性和个性
2. 严格遵守你的秘密和违规限制
3. 保持对话的自然流畅
4. 不要暴露不应该知道的信息
5. 根据角色类型调整回应策略
6. 正确称呼对话对象为"${currentActor.name}"，不要使用其他姓名（如与之不符的历史称谓）
7. 严禁创造剧本中没有的角色、地点、事件或人物关系
8. 只能基于剧本设定和全局故事背景中已有的信息进行回应
9. 不要编造额外的历史背景、人物关系或事件细节${partnerGuidance}${notesGuidance}
`;

  return enhancedPrompt;
};

// 计算对话语气（基于角色类型）
const getDialogueTone = (targetActor: Actor): string => {
  if (targetActor.isPartner) {
    return '以专业、协助的语气';
  } else if (targetActor.isAssistant) {
    return '以专业、协助的语气';
  } else if (targetActor.isKiller) {
    return '以谨慎、隐瞒的语气';
  } else if (targetActor.roleType === '嫌疑人') {
    return '以符合角色性格但略显紧张的语气';
  } else {
    return '以符合角色性格的自然语气';
  }
};

// 获取角色描述
const getActorDescription = (actor: Actor): string => {
  const roles = [];
  if (actor.isPlayer) roles.push('玩家侦探');
  if (actor.isPartner) roles.push('搭档');
  if (actor.isAssistant) roles.push('调查助手');
  if (actor.isKiller) roles.push('凶手');
  if (actor.roleType === '嫌疑人') roles.push('嫌疑人');
  
  return roles.length > 0 ? roles.join('、') : '普通角色';
};

// 获取角色身份描述（用于其他地方调用）
export const getIdentityDescription = (actor: Actor): string => {
  return getActorDescription(actor);
};