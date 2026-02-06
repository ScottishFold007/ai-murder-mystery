// 证物图标映射的统一工具函数（EvidenceSelectorPanel 和 EvidenceMessageBubble 共用）

const categoryIcons: Record<string, string> = {
  physical: '🔍',
  document: '📄',
  digital: '💾',
  testimony: '🗣️',
  combination: '🧩'
};

const nameIcons: Record<string, string> = {
  '刀': '🔪', '刀具': '🔪', '水果刀': '🔪',
  '手机': '📱', '电话': '📞',
  '钱包': '💰', '戒指': '💍', '项链': '📿',
  '钥匙': '🔑', '酒杯': '🍷', '杯子': '🥃',
  '衣服': '👔', '衣物': '👔',
  '照片': '📷', '相片': '📸',
  '文件': '📄', '合同': '📋', '信件': '💌',
  '车': '🚗', '汽车': '🚙',
  '药': '💊', '药物': '💉',
  '血': '🩸', '血迹': '🩸',
  '指纹': '👆', '脚印': '👣'
};

export const getEvidenceIcon = (category: string, name: string): string => {
  for (const [keyword, icon] of Object.entries(nameIcons)) {
    if (name.includes(keyword)) return icon;
  }
  return categoryIcons[category] || '📋';
};
