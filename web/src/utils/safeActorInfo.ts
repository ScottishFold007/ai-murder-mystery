// 安全的角色信息处理工具

import { Actor } from "../providers/mysteryContext";

/**
 * 创建安全的角色信息副本，移除敏感信息
 * 用于传递给搭档角色，防止泄露秘密和违规原则
 */
export interface SafeActor {
  name: string;
  bio: string;
  personality: string;
  context: string;
  messages: any[];
  isAssistant?: boolean;
  isPartner?: boolean;
  roleType?: string; // 角色类型：'玩家'、'搭档'、'凶手'、'嫌疑人'
  // 故意不包含 secret 和 violation 字段
}

/**
 * 将完整的Actor对象转换为安全的版本
 */
export const createSafeActor = (actor: Actor): SafeActor => {
  return {
    name: actor.name,
    bio: actor.bio,
    personality: actor.personality,
    context: actor.context,
    messages: actor.messages,
    isAssistant: actor.isAssistant,
    isPartner: actor.isPartner,
    roleType: actor.roleType, // 包含角色类型信息
    // secret 和 violation 字段被故意省略
  };
};

/**
 * 批量转换角色为安全版本
 */
export const createSafeActorList = (actors: Record<number, Actor>): SafeActor[] => {
  return Object.values(actors)
    .filter(actor => !actor.isPlayer && !actor.isVictim) // 排除玩家和受害人角色
    .map(createSafeActor);
};

/**
 * 验证角色信息是否安全（调试用）
 */
export const validateSafeActor = (actor: any): boolean => {
  const hasSecret = 'secret' in actor;
  const hasViolation = 'violation' in actor;
  
  if (hasSecret || hasViolation) {
    console.error('❌ 安全检查失败：角色信息包含敏感字段', {
      hasSecret,
      hasViolation,
      actorName: actor.name
    });
    return false;
  }
  
  return true;
};

/**
 * 批量验证角色列表安全性
 */
export const validateSafeActorList = (actors: any[]): boolean => {
  return actors.every(validateSafeActor);
};
