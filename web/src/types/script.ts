// 剧本相关的类型定义

export interface Character {
  name: string;
  bio: string;
  personality: string;
  context: string;
  secret: string;
  violation: string;
  image: string; // 头像文件名或URL
  backgroundImage?: string; // 聊天背景图片路径
  isVictim?: boolean; // 是否为受害者
  isDetective?: boolean; // 是否为侦探（玩家角色）
  isKiller?: boolean; // 是否为凶手（必须有一个）
  isAssistant?: boolean; // 是否为助手（必须有一个）
  isPlayer?: boolean; // 是否为玩家角色
  isPartner?: boolean; // 是否为搭档角色
  roleType?: '玩家' | '搭档' | '凶手' | '嫌疑人' | '受害人'; // 角色类型标签
}

export interface ScriptSettings {
  theme: string; // AI可以根据剧本内容自由选择或创新主题风格
  difficulty: 'easy' | 'medium' | 'hard';
  estimatedDuration: number; // 分钟
  hiddenKiller?: string; // 隐藏的凶手设定，仅供剧本作者参考
  playerName?: string; // 玩家角色名字（可选，默认为"调查者"）
  playerRole?: string; // 玩家角色
  partnerRole?: string; // 搭档角色
  killerRole?: string; // 凶手角色
  qualityReport?: string; // 最近一次质检报告（Markdown）
}

// 可选：由剧本提供的结算选择题
export interface QuizQuestion {
  question: string;
  choices: string[];
  correctAnswer?: string; // 可选：用于校验或展示
}

// 剧本证物定义
export interface ScriptEvidence {
  id: string; // 证物ID
  name: string; // 物品名称
  description: string; // 物品完整描述（向后兼容）
  overview?: string; // 证物概况：物理特征描述（用户可见，适合文生图）
  clues?: string; // 证物线索：关联信息（AI上下文使用）
  category: 'physical' | 'document' | 'digital' | 'testimony' | 'combination'; // 证物类型
  importance: 'low' | 'medium' | 'high' | 'critical'; // 重要程度
  relatedCharacters: string[]; // 相关角色名称列表
  initialState: 'hidden' | 'surface' | 'investigated'; // 初始发现状态
  image?: string; // 证物图片文件名
}

export interface Script {
  id: string;
  title: string;
  description: string;
  author: string;
  version: string;
  createdAt: string;
  updatedAt: string;
  globalStory: string;
  characters: Character[];
  settings: ScriptSettings;
  evidences?: ScriptEvidence[]; // 可选：剧本定义的证物库
  quiz?: QuizQuestion[]; // 可选：由剧本定义的结算题面
  sourceType?: 'manual' | 'ai'; // 剧本来源类型：手动创建或AI生成
  coverImage?: string; // 剧本封面图片路径或base64数据
}

export interface ScriptContextType {
  currentScript: Script | null;
  scripts: Script[];
  loadScript: (id: string) => void;
  saveScript: (script: Script) => Promise<void>;
  deleteScript: (id: string) => Promise<void>;
  createNewScript: () => Promise<Script>;
  updateScript: (script: Script) => Promise<void>;
}

// 默认剧本设置
export const DEFAULT_SCRIPT_SETTINGS: ScriptSettings = {
  theme: '现代推理',
  difficulty: 'medium',
  estimatedDuration: 60,
  playerName: '调查者'
};

// 创建新剧本的模板
export const createNewScriptTemplate = (): Script => ({
  id: `script_${Date.now()}`,
  title: '新剧本',
  description: '请输入剧本描述',
  author: '未知作者',
  version: '1.0.0',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  globalStory: '请输入全局故事背景...',
  characters: [],
  settings: { ...DEFAULT_SCRIPT_SETTINGS },
  evidences: [],
  sourceType: 'manual'
});

// 创建角色模板
export const createCharacterTemplate = (): Character => ({
  name: '',
  bio: '',
  personality: '',
  context: '',
  secret: '',
  violation: '',
  image: 'officer.png', // 默认头像
  isVictim: false,
  isDetective: false,
  isKiller: false,
  isAssistant: false,
  isPlayer: false,
  isPartner: false,
  roleType: '嫌疑人' // 默认为嫌疑人
});

// 创建证物模板
export const createEvidenceTemplate = (): ScriptEvidence => ({
  id: `evidence_${Date.now()}`,
  name: '',
  description: '',
  overview: '',       // 证物概况（物理描述）
  clues: '',          // 证物线索（关联信息）
  category: 'physical',
  importance: 'medium',
  relatedCharacters: [],
  initialState: 'surface'
});

// 剧本验证函数
export const validateScript = (script: Script): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  // 检查是否有玩家角色
  const hasPlayer = script.characters.some(char => char.isPlayer);
  if (!hasPlayer) {
    errors.push('剧本必须包含一个玩家角色 (isPlayer: true)');
  }
  
  // 检查是否有搭档角色
  const hasPartner = script.characters.some(char => char.isPartner);
  if (!hasPartner) {
    errors.push('剧本必须包含一个搭档角色 (isPartner: true)');
  }
  
  // 检查是否有凶手角色
  const hasKiller = script.characters.some(char => char.isKiller);
  if (!hasKiller) {
    errors.push('剧本必须包含一个凶手角色 (isKiller: true)');
  }
  
  // 检查玩家数量（应该只有一个）
  const playerCount = script.characters.filter(char => char.isPlayer).length;
  if (playerCount > 1) {
    errors.push('剧本只能有一个玩家角色');
  }
  
  // 检查搭档数量（应该只有一个）
  const partnerCount = script.characters.filter(char => char.isPartner).length;
  if (partnerCount > 1) {
    errors.push('剧本只能有一个搭档角色');
  }
  
  // 检查凶手数量（应该只有一个）
  const killerCount = script.characters.filter(char => char.isKiller).length;
  if (killerCount > 1) {
    errors.push('剧本只能有一个凶手角色');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// 示例剧本数据
export const getExampleScripts = (): Script[] => [
  {
    id: 'example_1',
    title: '午夜凶杀案',
    description: '一个发生在豪华别墅的谋杀案，死者是富商，嫌疑人包括他的妻子、儿子、管家和商业伙伴。现场门窗完好，但死者倒在书房的血泊中。',
    author: '示例作者',
    version: '1.0.0',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    sourceType: 'manual',
    globalStory: '2024年3月15日晚上11点，知名富商李明被发现死在自己别墅的书房里。现场门窗完好，没有打斗痕迹，但李明倒在血泊中，胸口插着一把水果刀。经法医鉴定，死亡时间约为晚上10-11点之间。\n\n李明生前正在处理一桩重要的商业收购案，与几位商业伙伴关系紧张。嫌疑人包括：\n- 王丽（李明的妻子，最近因感情问题产生矛盾）\n- 李强（李明的儿子，因继承权问题与父亲不和）\n- 张管家（别墅管家，最近被发现挪用公款）\n- 陈总（商业伙伴，因收购案与李明产生分歧）\n\n案发当晚，王丽声称在卧室休息，李强说在健身房锻炼，张管家说在厨房准备夜宵，陈总说在公司加班。现场发现了一张被撕碎的合同，上面写着"收购协议"。',
    characters: [
      {
        name: '夏洛克侦探',
        bio: '世界著名的咨询侦探，受邀调查李明别墅的谋杀案。以卓越的观察力、推理能力和逻辑思维著称。',
        personality: '聪明睿智，观察入微，逻辑清晰，善于从细微之处发现线索，对真相有着强烈的追求。',
        context: '你是夏洛克侦探，受邀来到李明别墅调查他的谋杀案。你需要通过仔细观察现场、询问嫌疑人，运用你的推理能力找出真凶。每个人都有自己的秘密和动机。',
        secret: '你拥有敏锐的观察力和推理能力，能够从细节中发现他人忽略的线索，但需要通过调查来逐步揭开真相。',
        violation: '不能直接指控任何人，必须通过逻辑推理和证据来证明你的结论。',
        image: 'officer.png',
        isVictim: false,
        isDetective: false,
        isPlayer: true,
        roleType: '玩家'
      },
      {
        name: '张警官',
        bio: '45岁，经验丰富的刑警队长，夏洛克的搭档，负责协助调查这起谋杀案。可以提供案件信息和线索分析。',
        personality: '严谨、冷静、善于分析，说话简洁有力，对案件细节非常敏感。',
        context: '你是张警官，夏洛克侦探的搭档。你可以提供案件概览、现场信息和调查建议。如果夏洛克需要了解特定线索或地点，你可以详细说明。你需要引导夏洛克进行有效的调查。',
        secret: '你已经掌握了一些重要线索，但需要夏洛克通过调查来验证和发现真相。',
        violation: '不能直接告诉夏洛克凶手是谁，不能过早透露关键证据，必须让夏洛克自己推理。',
        image: 'officer.png',
        isVictim: false,
        isDetective: false,
        isAssistant: true,
        isPartner: true,
        roleType: '搭档'
      },
      {
        name: '王丽',
        bio: '35岁，李明的妻子，曾经是知名模特，结婚后成为全职太太。最近因为丈夫的冷漠和疑似出轨而情绪低落。',
        personality: '优雅但内心脆弱，善于伪装，说话时经常避开对方的目光，喜欢用香水掩盖情绪。',
        context: '你是王丽，李明的妻子。你正在接受警方的询问。你知道李明最近对你很冷漠，而且你怀疑他有外遇。案发当晚你在卧室休息，但你没有不在场证明。',
        secret: '你其实知道李明有外遇，而且你曾经威胁过要离婚分财产。案发当晚你确实在卧室，但你听到了书房传来的争吵声。更重要的是，你就是杀死李明的凶手，因为发现他准备转移财产而愤怒杀害了他。',
        violation: '不能承认听到争吵声，不能透露知道李明有外遇，不能说出你们最近的财产纠纷，绝对不能承认你杀了李明。',
        image: 'pretty.png',
        isVictim: false,
        isDetective: false,
        isKiller: true,
        roleType: '凶手'
      },
      {
        name: '李强',
        bio: '28岁，李明的独子，大学毕业后在父亲的公司工作。最近因为父亲不同意他的创业计划而关系紧张。',
        personality: '聪明但冲动，说话直接，有时会显得不耐烦。对父亲既敬畏又怨恨。',
        context: '你是李强，李明的儿子。你正在接受警方的询问。你知道父亲最近不同意你的创业计划，你们为此大吵了一架。案发当晚你在健身房锻炼。',
        secret: '你其实知道父亲不同意你的创业是因为担心你被骗，而且他准备给你一笔钱让你自己创业。案发当晚你确实在健身房，但你提前离开了。',
        violation: '不能承认提前离开健身房，不能透露父亲准备给你钱的事，不能说出你们最近的和解谈话。',
        image: 'amateur.png',
        isVictim: false,
        isDetective: false,
        roleType: '嫌疑人'
      }
    ],
    settings: {
      theme: '现代都市·职场仇杀',
      difficulty: 'medium',
      estimatedDuration: 90,
      hiddenKiller: '王丽', // 隐藏的凶手设定，仅供剧本作者参考
      playerName: '夏洛克侦探',
      playerRole: '夏洛克侦探',
      partnerRole: '张警官',
      killerRole: '王丽'
    }
  },
  {
    id: 'example_2',
    title: '校园谜案',
    description: '大学校园里发生的神秘死亡事件，死者是心理学教授，嫌疑人包括他的学生、同事和前妻。现场没有明显的外伤，但教授倒在实验室里。',
    author: '示例作者',
    version: '1.0.0',
    createdAt: '2024-01-02T00:00:00.000Z',
    updatedAt: '2024-01-02T00:00:00.000Z',
    sourceType: 'manual',
    globalStory: '2024年4月20日下午3点，知名心理学教授张明被发现死在自己的实验室里。现场没有打斗痕迹，张教授平静地倒在实验台旁，经法医鉴定为中毒身亡。\n\n张教授生前正在研究一个关于心理创伤的课题，与几位同事和学生关系复杂。嫌疑人包括：\n- 李医生（张教授的前合作伙伴，因学术分歧而决裂）\n- 王护士（张教授的前女友，最近因感情问题产生矛盾）\n- 陈学生（张教授的研究生，因论文被拒而怀恨在心）\n- 刘同事（同系教授，因职称竞争而产生敌意）\n\n案发当天，李医生声称在医院值班，王护士说在图书馆看书，陈学生说在宿舍写论文，刘同事说在办公室备课。现场发现了一瓶被调换的试剂。',
    characters: [
      {
        name: '夏洛克侦探',
        bio: '世界著名的咨询侦探，受邀调查大学校园的张教授中毒案。以卓越的观察力、推理能力和逻辑思维著称。',
        personality: '聪明睿智，观察入微，逻辑清晰，善于从细微之处发现线索，对真相有着强烈的追求。',
        context: '你是夏洛克侦探，受邀来到大学调查张教授的中毒案。你需要通过仔细观察现场、询问嫌疑人，运用你的推理能力找出真凶。学术环境复杂，每个人都有自己的秘密和动机。',
        secret: '你拥有敏锐的观察力和推理能力，能够从细节中发现他人忽略的线索，但需要通过调查来逐步揭开真相。',
        violation: '不能直接指控任何人，必须通过逻辑推理和证据来证明你的结论。',
        image: 'officer.png',
        isVictim: false,
        isDetective: false,
        isPlayer: true,
        roleType: '玩家'
      },
      {
        name: '王警官',
        bio: '40岁，夏洛克的搭档，负责调查校园案件的资深警官，办案经验丰富，善于与学生和教师沟通。',
        personality: '温和但坚定，说话有条理，善于倾听，对案件细节非常敏感。',
        context: '你是王警官，夏洛克侦探的搭档，负责协助调查张教授中毒案。你可以提供校园背景信息和现场细节。你已经掌握了基本的现场信息，现在需要配合夏洛克的推理。',
        secret: '你其实已经发现了一些关键线索，但需要确认嫌疑人的不在场证明。',
        violation: '不能透露已经掌握的关键线索，不能告诉嫌疑人你的怀疑对象。',
        image: 'officer.png',
        isVictim: false,
        isDetective: false,
        isAssistant: true,
        isPartner: true,
        roleType: '搭档'
      },
      {
        name: '李医生',
        bio: '45岁，医院心理科主任，曾经与张教授合作研究心理创伤治疗。因为学术观点分歧而分道扬镳。',
        personality: '严谨但固执，说话有条理，对学术问题非常认真。有时会显得过于自信。',
        context: '你是李医生，张教授的前合作伙伴。你正在接受警方的询问。你知道张教授最近的研究方向与你的观点相左，你们为此争论过。案发当天你在医院值班。',
        secret: '你其实知道张教授的研究可能会颠覆你的理论，而且你曾经威胁过要公开质疑他的研究。案发当天你确实在医院，但你中途离开过。',
        violation: '不能承认中途离开医院，不能透露威胁过张教授的事，不能说出你们最近的学术争论。',
        image: 'violent.png',
        isVictim: false,
        isDetective: false,
        isKiller: true,
        roleType: '凶手'
      },
      {
        name: '陈学生',
        bio: '24岁，张教授的研究生，最近因为论文被拒而情绪低落。性格内向，但学习很努力。',
        personality: '内向但聪明，说话时经常低头，对老师既尊敬又害怕。有时会显得紧张。',
        context: '你是陈学生，张教授的研究生。你正在接受警方的询问。你知道张教授最近对你的论文很不满意，你们为此讨论过。案发当天你在宿舍写论文。',
        secret: '你其实知道张教授拒绝你的论文是因为发现了其中的错误，而且他准备给你机会重新修改。案发当天你确实在宿舍，但你去了实验室。',
        violation: '不能承认去了实验室，不能透露张教授准备给你机会的事，不能说出你们最近的学习讨论。',
        image: 'innocent.png',
        isVictim: false,
        isDetective: false,
        roleType: '嫌疑人'
      }
    ],
    settings: {
      theme: '校园惊魂·禁忌游戏',
      difficulty: 'easy',
      estimatedDuration: 60,
      hiddenKiller: '李医生', // 隐藏的凶手设定，仅供剧本作者参考
      playerName: '夏洛克侦探',
      playerRole: '夏洛克侦探',
      partnerRole: '王警官',
      killerRole: '李医生'
    }
  },
  {
    id: 'example_3',
    title: '密室杀人事件',
    description: '一个经典的密室杀人案，死者是古董商，现场门窗从内部锁死，但死者倒在血泊中。嫌疑人包括他的家人和员工。',
    author: '示例作者',
    version: '1.0.0',
    createdAt: '2024-01-03T00:00:00.000Z',
    updatedAt: '2024-01-03T00:00:00.000Z',
    sourceType: 'manual',
    globalStory: '2024年5月10日晚上8点，知名古董商赵明被发现死在自己的古董店里。现场门窗从内部锁死，没有其他出入口，但赵明倒在血泊中，胸口插着一把古董匕首。\n\n赵明生前正在处理一批珍贵的古董，与几位买家和员工关系复杂。嫌疑人包括：\n- 赵夫人（赵明的妻子，最近因丈夫的冷漠而情绪低落）\n- 赵儿子（赵明的儿子，因不同意父亲的事业规划而关系紧张）\n- 李员工（古董店员工，最近被发现偷拿店里的古董）\n- 王买家（古董收藏家，因价格问题与赵明产生争执）\n\n案发当晚，赵夫人声称在家看电视，赵儿子说在朋友家聚会，李员工说在仓库整理货物，王买家说在家研究古董。现场发现了一串被破坏的钥匙。',
    characters: [
      {
        name: '夏洛克侦探',
        bio: '世界著名的咨询侦探，受邀调查古董店的密室杀人案。以卓越的观察力、推理能力和逻辑思维著称。',
        personality: '聪明睿智，观察入微，逻辑清晰，善于从细微之处发现线索，对真相有着强烈的追求。',
        context: '你是夏洛克侦探，受邀调查赵明在古董店的密室杀人案。现场门窗从内部锁死，你需要通过仔细观察现场、询问嫌疑人，运用你的推理能力找出真凶和作案手法。',
        secret: '你拥有敏锐的观察力和推理能力，能够从细节中发现他人忽略的线索，但需要通过调查来逐步揭开真相。',
        violation: '不能直接指控任何人，必须通过逻辑推理和证据来证明你的结论。',
        image: 'officer.png',
        isVictim: false,
        isDetective: false,
        isPlayer: true,
        roleType: '玩家'
      },
      {
        name: '刘警官',
        bio: '50岁，夏洛克的搭档，专门负责复杂案件的资深警官，对密室杀人案有丰富经验。办案细致，善于分析细节。',
        personality: '沉稳、细心、善于观察，说话谨慎，对案件细节非常敏感。',
        context: '你是刘警官，夏洛克侦探的搭档，负责协助调查赵明被杀案。这是一个密室杀人案，现场门窗从内部锁死。你可以为夏洛克提供现场信息和技术支持。',
        secret: '你其实已经发现了一些关键线索，但需要确认嫌疑人的不在场证明和动机。',
        violation: '不能透露已经掌握的关键线索，不能告诉嫌疑人你的怀疑对象。',
        image: 'officer.png',
        isVictim: false,
        isDetective: false,
        isAssistant: true,
        isPartner: true,
        roleType: '搭档'
      },
      {
        name: '赵夫人',
        bio: '50岁，赵明的妻子，曾经是古董鉴定师，结婚后成为全职太太。最近因为丈夫的冷漠和疑似出轨而情绪低落。',
        personality: '优雅但内心痛苦，说话时经常叹气，对丈夫既爱又恨。有时会显得神经质。',
        context: '你是赵夫人，赵明的妻子。你正在接受警方的询问。你知道赵明最近对你很冷漠，而且你怀疑他有外遇。案发当晚你在家看电视。',
        secret: '你其实知道赵明有外遇，而且你曾经威胁过要离婚分财产。案发当晚你确实在家，但你听到了店里的争吵声。',
        violation: '不能承认听到争吵声，不能透露知道赵明有外遇，不能说出你们最近的财产纠纷。',
        image: 'pretty.png',
        isVictim: false,
        isDetective: false,
        roleType: '嫌疑人'
      },
      {
        name: '李员工',
        bio: '35岁，古董店员工，已经工作了5年。最近因为家庭经济困难而偷拿店里的古董变卖。',
        personality: '老实但胆小，说话时经常结巴，对老板既感激又害怕。有时会显得紧张。',
        context: '你是李员工，古董店的员工。你正在接受警方的询问。你知道赵明最近发现你偷拿古董的事，你们为此谈过。案发当晚你在仓库整理货物。',
        secret: '你其实知道赵明发现你偷拿古董后准备给你机会改正，而且他准备借钱给你解决家庭困难。案发当晚你确实在仓库，但你去了店里。',
        violation: '不能承认去了店里，不能透露赵明准备借钱给你的事，不能说出你们最近的和解谈话。',
        image: 'solitary.png',
        isVictim: false,
        isDetective: false,
        isKiller: true,
        roleType: '凶手'
      }
    ],
    settings: {
      theme: '本格推理·暴风雪山庄',
      difficulty: 'hard',
      estimatedDuration: 120,
      hiddenKiller: '李员工', // 隐藏的凶手设定，仅供剧本作者参考
      playerName: '夏洛克侦探',
      playerRole: '夏洛克侦探',
      partnerRole: '刘警官',
      killerRole: '李员工'
    }
  },
  {
    id: 'example_4',
    title: '深宫血色：玉玺谜云',
    description: '大唐开元盛世，武则天晚年，宫廷暗流涌动。一个风雨交加的夜晚，深受武皇信任、执掌宫内监察之职的上官婉儿被发现死于自己的书房"绮墨斋"内，现场呈密室状态。而她正在秘密编纂的、可能涉及多位皇室成员隐秘的《宫闱秘录》也不翼而飞。',
    author: 'AI剧本生成器',
    version: '1.0.0',
    createdAt: '2024-01-04T00:00:00.000Z',
    updatedAt: '2024-01-04T00:00:00.000Z',
    sourceType: 'ai',
    globalStory: '大唐开元盛世，武则天晚年，宫廷暗流涌动。一个风雨交加的夜晚，深受武皇信任、执掌宫内监察之职的上官婉儿被发现死于自己的书房"绮墨斋"内，现场呈密室状态。而她正在秘密编纂的、可能涉及多位皇室成员隐秘的《宫闱秘录》也不翼而飞。\n\n陛下震怒，限令在场的所有嫌疑人于子时之前查明真凶。在场的每一个人都与死者有着千丝万缕的联系和不可告人的秘密。是真凶为了掩盖真相？还是有人想借机铲除异己？一场围绕权力、爱与背叛的宫廷大戏就此拉开帷幕。\n\n案发现场：上官婉儿伏案而死，面色青紫，口鼻有血迹，右手紧握一支折断的毛笔。书桌上有半杯未饮尽的茶。致命伤：后脑有钝器击打伤，但真正死因是中毒。密室：门窗从内紧闭，但窗户纸有一个不易察觉的小洞。关键物品：地上掉落一个张昌宗的香囊，书桌角落有一片被撕下的衣角，废纸篓里有一张被揉皱的诗稿，上官婉儿的指甲缝中有少许暗红色的丝线，《宫闱秘录》消失不见。',
    characters: [
      {
        name: '狄仁杰',
        bio: '大唐著名名臣，断案如神，受武则天之命入宫调查上官婉儿之死。以严谨的逻辑、冷静的判断与细致的洞察力著称。',
        personality: '沉稳冷静，推理严密，善于从微末处抽丝剥茧，直指要害。',
        context: '你是狄仁杰，受武则天之命调查上官婉儿在“绮墨斋”的离奇身亡。宫廷权谋波诡云谲，你需要从细枝末节中寻找真相，审视每个人的动机与不在场证明，揭露隐藏在权力帷幕后的人心。',
        secret: '你已察觉此案绝非单纯情杀，背后牵连权势与秘辛。你会刻意试探各人言行，以证伪其供述。',
        violation: '不得无凭妄指，更不可透露尚未查证的内情；一切以证据与逻辑为准。',
        image: 'officer.png',
        isVictim: false,
        isDetective: false,
        isPlayer: true,
        roleType: '玩家'
      },
      {
        name: '御史大夫',
        bio: '朝廷御史大夫，负责协助夏洛克侦探调查此案。熟悉宫廷规矩和朝政内情，是夏洛克在宫中的得力助手。',
        personality: '严谨公正，熟悉朝廷礼法，说话谨慎但条理清晰，对夏洛克的推理给予专业支持。',
        context: '你是御史大夫，受命协助夏洛克侦探调查上官婉儿之死。你熟悉宫廷内情和各方势力关系，可以为夏洛克提供背景信息和现场细节。',
        secret: '你掌握宫廷内部的权力关系和政治动向，但需要配合夏洛克的推理来找出真凶。',
        violation: '不能过早透露关键证据，要让夏洛克通过推理发现真相。',
        image: 'officer.png',
        isVictim: false,
        isDetective: false,
        isAssistant: true,
        isPartner: true,
        roleType: '搭档'
      },
      {
        name: '太平公主',
        bio: '大唐最尊贵的公主，武则天最宠爱的女儿。权倾朝野，但内心深知母亲的权势如烈火烹油，既让你显赫，也让你不安。上官婉儿是你多年的挚友，也是你在宫廷中最重要的政治盟友和竞争对手。',
        personality: '权倾朝野，性格强势，善于权谋，说话时带有皇家威严，对威胁到自己地位的人毫不留情。',
        context: '你是太平公主，武则天最宠爱的女儿。你怀疑上官婉儿正在编纂的《宫闱秘录》中，记录了你与某些藩王密谋、意图在母亲百年后抢先掌控局面的计划。案发前一个时辰，你曾前往"绮墨斋"与她当面对质，发生了激烈的争吵。你离开时，怒气冲冲，不慎被你最爱的金丝披风勾住了门闩，留下了一小缕暗红色的丝线。',
        secret: '你与上官婉儿的争吵很可能已被他人听见。你怀疑《宫闱秘录》中记录了你与藩王密谋的计划，这是足以让你万劫不复的铁证。',
        violation: '不能承认与上官婉儿的争吵，不能透露《宫闱秘录》中可能涉及你的内容，不能说出你与藩王的密谋计划。',
        image: 'pretty.png',
        isVictim: false,
        isDetective: false,
        isKiller: false,
        roleType: '嫌疑人'
      },
      {
        name: '张昌宗',
        bio: '女皇武则天最宠爱的男宠，容貌俊美，冠绝宫廷。但你知道，所有人都看不起你，称你为"面首"。只有上官婉儿曾真心欣赏你的才华，与你产生了私情。但你最近感到她对你日益冷淡，这让你因自卑而变得极度愤怒。',
        personality: '容貌俊美但内心自卑，说话时带有怨愤情绪，对看不起自己的人怀恨在心，善于伪装自己的真实情感。',
        context: '你是张昌宗，武则天的男宠。上官婉儿近日欲与你断绝关系，并嘲讽你"虚有其表，只会倚仗陛下恩宠"，甚至暗示要将你某些"难言之隐"公之于众。你赠予她的定情信物——一个装有特制香料的香囊，她竟随意丢弃。你无法忍受这种羞辱，曾放出狠话要"给她点颜色瞧瞧"。',
        secret: '你与上官婉儿有私情，但你有身体隐疾（替女皇试药后导致的），你害怕这些秘密被公开。你躲藏时，香囊不慎掉落，你必须解释它为何会在现场。',
        violation: '不能承认与上官婉儿的私情，不能透露你的身体隐疾，不能说出你曾威胁过上官婉儿。',
        image: 'innocent.png',
        isVictim: false,
        isDetective: false,
        isKiller: false,
        roleType: '嫌疑人'
      },
      {
        name: '李隆基',
        bio: '临淄王，英武果敢，胸怀大志。你目睹祖母武氏一族把持朝政，心中早已立下光复李唐的宏愿。上官婉儿才华横溢，但你深知她是祖母的心腹，是你必须警惕甚至铲除的对象。',
        personality: '英武果敢，胸怀大志，说话时带有王者风范，对武氏势力深恶痛绝，善于隐藏自己的真实意图。',
        context: '你是临淄王李隆基，英武果敢，胸怀大志。你正在暗中结交朝中忠臣，图谋大事。你怀疑上官婉儿编纂的《宫闱秘录》就是在为祖母搜集情报，其中必然有关于你的不利证据。你命令你的心腹太监高力士严密监视婉儿，并设法盗取《宫闱秘录》。',
        secret: '你正在暗中结交朝臣，图谋恢复李唐江山。你怀疑上官婉儿是祖母安插在你身边的眼线，《宫闱秘录》可能就是你结党私的证据。',
        violation: '不能承认你的复国计划，不能透露你与朝臣的暗中联系，不能说出你命令高力士监视上官婉儿的事。',
        image: 'amateur.png',
        isVictim: false,
        isDetective: false,
        isKiller: false,
        roleType: '嫌疑人'
      },
      {
        name: '武惠妃',
        bio: '武氏家族的成员，被送入宫中，本指望你能获得圣宠，巩固家族势力。然而，你并不得宠。上官婉儿曾答应助你，却屡屡阻挠你见陛下，你怀疑她是怕你分走陛下的关注。你对她由妒生恨。',
        personality: '性格隐忍，善于伪装，说话时带有委屈和怨恨的情绪，对阻碍自己获得宠爱的人怀恨在心，心思缜密。',
        context: '你是武惠妃，武氏家族成员。你家族曾参与过一桩贪墨军饷的丑闻，此事若被揭发，全族都将覆灭。你得知上官婉儿已将此事查清，并记录在《宫闱秘录》中。你不是为了争宠，而是为了拯救家族，必须杀了她，夺回那本书！你的寝宫有一条秘密通道直通"绮墨斋"，这是家族为你留下的后路。',
        secret: '你是真凶！你利用密道进入"绮墨斋"，用砚台击打上官婉儿后脑，将毒茶灌入其口中。你找到《宫闱秘录》并销毁，布置现场嫁祸给他人。',
        violation: '不能承认你是真凶，不能透露家族贪墨军饷的丑闻，不能说出密道的存在，不能承认你杀害了上官婉儿。',
        image: 'solitary.png',
        isVictim: false,
        isDetective: false,
        isKiller: true,
        roleType: '凶手'
      },
      {
        name: '高力士',
        bio: '太监总管，更是临淄王李隆基的忠心奴仆。你心思缜密，办事得力，深得殿下信任。',
        personality: '心思缜密，办事得力，说话时带有太监特有的谦卑，对主子忠心耿耿，善于察言观色。',
        context: '你是高力士，太监总管，更是临淄王李隆基的忠心奴仆。你奉殿下之命，一直在暗中监视上官婉儿，并寻找机会窃取《宫闱秘录》。案发当晚，你正是去执行这项任务的。你趁四下无人，偷偷潜入"绮墨斋"，却发现上官婉儿已经倒在地上，似乎还有气息。你大惊失色，第一反应是立刻搜查《宫闱秘录》，但没有找到。',
        secret: '你奉李隆基之命监视上官婉儿，你进入过现场但没有找到《宫闱秘录》，你害怕被人发现，匆忙离开。',
        violation: '不能承认你奉李隆基之命监视上官婉儿，不能透露你进入过现场，不能说出你们在窥探《宫闱秘录》的事。',
        image: 'officer.png',
        isVictim: false,
        isDetective: false,
        isKiller: false,
        roleType: '嫌疑人'
      },
      {
        name: '上官婉儿',
        bio: '大唐女官，才华横溢，深受武则天信任。执掌宫内监察之职，正在秘密编纂《宫闱秘录》。',
        personality: '才华横溢，心思缜密，对权力游戏了如指掌。',
        context: '你是上官婉儿，案件的受害人。',
        secret: '你已经死亡，无法参与对话。',
        violation: '作为受害人，你无法参与游戏对话。',
        image: 'xiaoyahuan.png', // 使用现有的女性角色头像
        isVictim: true,
        isDetective: false,
        isKiller: false,
        roleType: '受害人'
      }
    ],
    settings: {
      theme: '欧式宫廷·权谋暗杀',
      difficulty: 'hard',
      estimatedDuration: 150,
      hiddenKiller: '武惠妃', // 隐藏的凶手设定，仅供剧本作者参考
      playerName: '狄仁杰',
      playerRole: '狄仁杰',
      partnerRole: '御史大夫',
      killerRole: '武惠妃'
    }
  },
  {
    id: 'andamountain_mystery',
    title: '安达山谋杀悬案',
    description: '波洛蒂亚国安达山脉山间小屋发生的复杂谋杀案。年度狩猎比赛的获胜者文斯被发现死在隐藏隔间，现场还牵扯出15年前失踪的时装设计师马塞尔的尸体，涉及宝藏、复仇、爱情和欺骗的多重谜团。',
    author: 'AI Murder Mystery',
    version: '2.0.0',
    createdAt: '2024-01-05T00:00:00.000Z',
    updatedAt: '2024-01-05T00:00:00.000Z',
    sourceType: 'manual',
    globalStory: '这起谋杀悬疑案发生在虚构的波洛蒂亚国，围绕安达山脉山间小屋的事件展开。日期是221年3月4日。安达山狩猎比赛，一个为期2晚3天、奖金1万美元的比赛，昨天刚刚结束，这已经是过去3年来的年度赛事。比赛于3月1日中午开始，3月3日下午3点宣布获胜者结束。今年的获胜者是受害者文斯，他获得了1万美元现金并放进了钱包。这是受害者文斯第三次赢得比赛，也是暴力杰瑞第三次获得第二名。\n\n受害者文斯在3月3日晚上失踪，他的尸体今天早上被警方在一楼地毯下的隐藏隔间中发现。在这个隔间里是受害者文斯毫无生气的尸体，他的背部被一根断角刺穿，躯干浸满鲜血。尸体旁边有一个背包，里面装着斧头、衣服和一个破旧的蓝色小袋，看起来像是项链的珠宝盒。受害者文斯的空钱包和管理员帕特里夏的结婚戒指也在尸体上被发现。\n\n案件背景复杂，涉及多重动机：暴力杰瑞因连续三年败给文斯而怀恨在心；管理员帕特里夏与文斯有秘密关系并密谋杀死丈夫；孤独汉娜隐藏着15年前意外杀死失踪马塞尔的秘密；业余拉里实际上是黑市承包商，寻找父亲盗贼大师吉姆留下的太阳之冠宝石；无辜肯发现自己被文斯以"可爱公主"的身份欺骗了大量金钱。\n\n小屋内外隐藏着众多线索：密室般的房间布局、藏宝图碎片、失踪的步枪、伪造的便条、15年前的旧案线索，以及价值2000万美元的太阳之冠宝石的下落。每个嫌疑人都有秘密，每个秘密都可能成为杀人动机。',
    characters: [
      {
        name: '夏洛克侦探',
        bio: '世界著名的咨询侦探，受邀调查安达山谋杀案。以卓越的观察力、推理能力和逻辑思维著称。',
        personality: '聪明睿智，观察入微，逻辑清晰，善于从细微之处发现线索，对真相有着强烈的追求。',
        context: '你是夏洛克侦探，受邀前往安达山小屋调查文斯被害与尘封旧案。你需要综合线索、询问嫌疑人，揭开两起案件背后的真相。',
        secret: '你会反复核对证词、时序与物证，善于通过细节拆穿谎言。',
        violation: '不得直接宣称破案，需以证据链与逻辑推理为依据。',
        image: 'officer.png',
        isVictim: false,
        isDetective: false,
        isPlayer: true,
        roleType: '玩家'
      },
      {
        name: '警官克洛伊',
        bio: '经验丰富的女刑警，作为协助者与联络人，熟悉现场与嫌疑人信息。',
        personality: '专业、直接，偶有黑色幽默。',
        context: '你是警官克洛伊，作为夏洛克的搭档协助推进调查，按需提供现场信息、时间线和证据说明。',
        secret: '你掌握大量案件细节，但需要等侦探提问时再逐步提供。',
        violation: '避免一次性泄露核心证据，不能直接点名凶手。',
        image: 'officer.png',
        isVictim: false,
        isDetective: false,
        isAssistant: true,
        isPartner: true,
        roleType: '搭档'
      },
      {
        name: '暴力杰瑞',
        bio: '安达山小屋的暴躁老板，年度狩猎比赛的组织者。曾是军人，性格粗暴易怒。与27岁的管理员帕特里夏结婚3个月，对妻子有强烈的控制欲，甚至用GPS追踪她的行踪。',
        personality: '粗鲁愤怒，无缘无故地发脾气。说话粗暴，对失败极其不满，容易暴怒。',
        context: '你是安达山小屋的老板暴力杰瑞。你连续三年在自己组织的狩猎比赛中败给文斯，这让你极度愤怒和怨恨。你怀疑业余拉里在装傻，因为他说话像本地人却声称是第一次来。你知道文斯假装成"可爱公主"欺骗无辜肯的钱财。你对妻子帕特里夏很控制，用GPS追踪她。昨晚你收到文斯的便条要求见面，但他没有出现，这让你更加愤怒。',
        secret: '你在比赛第一天为了让文斯失去比赛资格，在他常用的狩猎点附近挖了一个人形大小的致命陷阱，但文斯没有掉进去。你绝不能承认这个企图伤害文斯的行为。',
        violation: '不能承认挖掘致命陷阱的行为。不能暗示自己杀了文斯。',
        image: 'violent.png',
        isVictim: false,
        isDetective: false
      },
      {
        name: '管理员帕特里夏',
        bio: '27岁的小屋管理员，暴力杰瑞的新婚妻子。外表优雅但内心复杂，表面上过着奢侈的生活，实际上对控制欲极强的丈夫深感厌恶。',
        personality: '爱抱怨，喜欢炫耀财富和奢侈生活方式。说话时经常叹气，表现出对现状的不满。',
        context: '你是管理员帕特里夏，暴力杰瑞的妻子。你深深厌恶丈夫对你的控制和GPS追踪。你秘密与文斯有婚外情，并承诺支付他15万美元谋杀暴力杰瑞，还把结婚戒指给他作为抵押。你知道井里藏着马塞尔的尸体很多年了。昨晚看到文斯给暴力杰瑞留便条要见面，你担心秘密暴露而逃离小屋，但因暴雨无法走远。',
        secret: '你与文斯的婚外情和雇佣他杀死丈夫的计划绝对不能暴露。你的结婚戒指在文斯那里是因为作为谋杀合同的抵押品。',
        violation: '不能承认与文斯的婚外情。不能透露雇佣文斯杀死暴力杰瑞的计划。不能说出结婚戒指的真实用途。',
        image: 'pretty.png',
        isVictim: false,
        isDetective: false
      },
      {
        name: '孤独汉娜',
        bio: '安达山脉本地人，专业猎人。性格孤僻强悍，很少说话，只有在讨论狩猎或暴力话题时才会露出笑容。在当地以强烈的气质和厌恶社交而闻名。',
        personality: '非常强烈，很少说话，只有在讨论狩猎或暴力时才笑。会直接评论别人问题的愚蠢，不客气。',
        context: '你是孤独汉娜，安达山脉的本地专业猎人。你每年参加比赛实际上是为了监视小屋后面井中马塞尔尸体的情况。15年前你意外射杀了你的狩猎伙伴马塞尔，并将尸体藏在井中。现在尸体被发现了，你的谋杀诉讼时效还有两天就要过期。你看到过帕特里夏和文斯的婚外情，也注意到便条的笔迹像是无辜肯写的。',
        secret: '你15年前意外杀死了失踪马塞尔，每年参加比赛都是为了监视井中的尸体。诉讼时效马上到期，你必须保持清白。',
        violation: '不能承认认识马塞尔。不能提及诉讼时效。不能说出你参加比赛是为了监视马塞尔尸体。不能承认15年前的意外杀人。',
        image: 'solitary.png',
        isVictim: false,
        isDetective: false
      },
      {
        name: '业余拉里',
        bio: '35岁的商人，表面上是想学习狩猎的业余爱好者，看起来笨拙无能。实际上是黑市承包商"特工拉里"，经营专家侦探博客，接受各种危险任务。',
        personality: '表面天真愚蠢，装作比实际能力更差的猎人。说话时故意显得无知，但偶尔会露出专业知识。',
        context: '你是业余拉里，实际身份是特工拉里。你的父亲是已故的盗贼大师吉姆，曾经拥有这个小屋。你来这里是为了寻找父亲留下的太阳之冠宝石的藏宝图。文斯在行李混乱时拿走了你的部分藏宝图，后来又偷走了剩余部分并找到了宝石。你在晚上11点前闯入文斯房间，用角奖杯杀死了他，然后将尸体藏在走廊的秘密隔间。',
        secret: '你是真凶！你杀死了文斯并隐藏了尸体。你的真实身份是特工拉里，父亲是盗贼大师吉姆。你在寻找价值2000万的太阳之冠宝石。',
        violation: '绝不能承认杀死文斯。不能透露父亲是盗贼大师吉姆。不能说出太阳之冠和藏宝图的事。不能承认真实身份是特工拉里。',
        image: 'amateur.png',
        isVictim: false,
        isDetective: false,
        isKiller: true
      },
      {
        name: '无辜肯',
        bio: '29岁的造纸公司员工，典型的动漫宅男。总是带着樱花酱抱枕，说话时喜欢用奇怪的表情符号。自称与网恋对象"可爱公主"订婚，为此花费了大量金钱。',
        personality: '尴尬的宅男，总是用奇怪的表情符号，痴迷动漫。说话时会将一切都联系到动漫情节。对"可爱公主"非常痴迷。',
        context: '你是无辜肯，为了见网恋女友"可爱公主"而参加比赛，但她没有出现。你偷听到文斯向暴力杰瑞坦白他就是"可爱公主"，骗取了你大量金钱。心碎愤怒的你伪造了两张便条让文斯和暴力杰瑞约在小屋后见面，然后趁机闯入文斯房间偷走了1万美元奖金。你还偷了大厅的步枪隐藏在房间里。',
        secret: '你被文斯以"可爱公主"身份欺骗了大量金钱。你伪造了便条，偷了步枪和文斯的奖金。你不能让人知道"可爱公主"的真实身份。',
        violation: '不能承认文斯就是可爱公主。不能说出偷听到的坦白内容。不能承认伪造便条和偷窃行为。不能透露自己被骗的真相。',
        image: 'innocent.png',
        isVictim: false,
        isDetective: false
      }
    ],
    settings: {
      theme: '科幻废土·末日逃生',
      difficulty: 'hard',
      estimatedDuration: 180,
      hiddenKiller: '业余拉里', // 隐藏的凶手设定，仅供剧本作者参考
      playerName: '夏洛克侦探',
      playerRole: '夏洛克侦探',
      partnerRole: '警官克洛伊',
      killerRole: '业余拉里'
    }
  }
];
