// 角色类型判断和显示信息的统一工具函数

interface RoleLike {
  isPlayer?: boolean;
  isPartner?: boolean;
  isAssistant?: boolean;
  isKiller?: boolean;
  isDetective?: boolean;
  isVictim?: boolean;
  roleType?: string;
}

export interface RoleInfo {
  label: string;
  color: string;
}

/**
 * 获取角色在侧边栏的显示信息（不暴露凶手身份）
 * 玩家不在侧边栏展示，所以这里不处理 isPlayer
 */
export const getSidebarRoleInfo = (actor: RoleLike): RoleInfo => {
  if (actor.isPartner || actor.isAssistant) return { label: '👮 搭档', color: '#00D084' };
  return { label: '👤 嫌疑人', color: '#FFB74D' };
};

/**
 * 获取角色在剧透页面的显示颜色（极光主题，不暴露凶手身份）
 */
export const getSpoilerRoleColor = (actor: RoleLike): string => {
  if (actor.isPlayer) return '#00FFFF';
  if (actor.isAssistant || actor.isPartner) return '#4ECCA3';
  return '#A78BFA';
};

/**
 * 获取角色在剧透页面的标签（不暴露凶手身份）
 */
export const getSpoilerRoleLabel = (actor: RoleLike): string => {
  if (actor.isPlayer) return '🕵️ 玩家';
  if (actor.isAssistant || actor.isPartner) return '👮 搭档';
  return '👤 嫌疑人';
};
