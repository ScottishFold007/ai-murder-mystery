/**
 * 质检报告字段释义常量
 * 基于 scriptQualityChecker.ts 中的提示词内容
 */

export interface FieldExplanation {
  name: string;
  description: string;
  fullExplanation: string;
  maxScore: number;
  scoringCriteria: Array<{
    range: string;
    description: string;
  }>;
}

export const FIELD_EXPLANATIONS: Record<string, FieldExplanation> = {
  // 内容逻辑层 - 基础与合规类
  schemaIntegrity: {
    name: "JSON字段完整性",
    description: "检查剧本JSON结构是否包含所有必需字段，数据类型是否正确",
    fullExplanation: "检查剧本JSON结构是否包含title、description、globalStory、characters数组，每个character是否有name、bio、personality、context、secret、violation字段，数据类型是否正确（字符串/数组/布尔值）",
    maxScore: 5,
    scoringCriteria: [
      { range: "5分", description: "所有必需字段(title,description,globalStory,characters)齐全，数据类型正确" },
      { range: "0分", description: "缺少关键字段或数据类型错误" }
    ]
  },

  outputNormalization: {
    name: "输出规范性",
    description: "检查剧本内容是否为纯净的故事文本，不包含多余的格式标记",
    fullExplanation: "检查剧本内容是否为纯净的故事文本，不包含【以下是剧本】、代码块标记、【注意事项】等元数据或系统提示，也不含多余的格式标记",
    maxScore: 5,
    scoringCriteria: [
      { range: "5分", description: "内容为纯净正文，无多余格式标记或解释性文本" },
      { range: "0分", description: "包含不当的格式标记或系统提示信息" }
    ]
  },

  contentSafety: {
    name: "内容安全性",
    description: "检查剧本是否包含不当内容，符合剧本杀题材安全标准",
    fullExplanation: "扫描剧本是否包含极端暴力描述、政治敏感内容、色情内容、仇恨言论等，谋杀推理情节应控制在合理范围内",
    maxScore: 5,
    scoringCriteria: [
      { range: "5分", description: "不含违规内容，符合剧本杀题材安全标准" },
      { range: "0分", description: "包含不当暴力、敏感政治或其他违规内容" }
    ]
  },

  // 内容逻辑层 - 故事与主题类
  worldBuilding: {
    name: "世界观清晰度",
    description: "评估故事背景的完整性和独特性，设定是否前后一致",
    fullExplanation: "评估description和globalStory是否构建了清晰的故事背景（时间、地点、社会环境），设定是否前后一致，是否有独特的世界观元素（如虚构国家、特殊设定）",
    maxScore: 5,
    scoringCriteria: [
      { range: "5分", description: "世界背景独特完整，设定前后一致，细节丰富" },
      { range: "4分", description: "世界背景较清晰，设定基本一致" },
      { range: "3分", description: "世界背景模糊但可理解" },
      { range: "0-2分", description: "世界背景混乱或缺失" }
    ]
  },

  narrativeFlow: {
    name: "叙事流畅性",
    description: "检查故事叙事结构的完整性和逻辑连贯性",
    fullExplanation: "检查globalStory的叙事结构是否完整（案件背景→事件发展→现状描述），故事逻辑是否连贯，是否有明确的起承转合，节奏是否适宜",
    maxScore: 5,
    scoringCriteria: [
      { range: "5分", description: "开端悬念、中段发展、结局解释连贯自然，节奏把控优秀" },
      { range: "4分", description: "故事脉络清晰，节奏合理" },
      { range: "3分", description: "故事发展可理解但略显突兀" },
      { range: "0-2分", description: "故事逻辑混乱，情节跳跃" }
    ]
  },

  themeDepth: {
    name: "主题立意深度",
    description: "分析故事是否有深层主题，具有思辨价值",
    fullExplanation: "分析故事是否有深层主题（如人性贪婪、复仇、背叛、救赎等），是否通过角色动机和冲突体现主题，是否具有思辨价值而非仅仅是简单的谋杀案",
    maxScore: 5,
    scoringCriteria: [
      { range: "5分", description: "主题深刻，探讨人性复杂面，具有思考价值" },
      { range: "4分", description: "主题明确，有一定深度" },
      { range: "3分", description: "主题平常但可接受" },
      { range: "0-2分", description: "主题肤浅或缺失" }
    ]
  },

  // 内容逻辑层 - 角色设计类
  characterConsistency: {
    name: "角色内部一致性",
    description: "检查每个角色的背景、性格、情境、秘密之间是否逻辑一致",
    fullExplanation: "逐个检查每个角色的bio（背景）、personality（性格）、context（情境）、secret（秘密）之间是否逻辑一致，性格是否与行为匹配，秘密是否符合角色背景",
    maxScore: 4,
    scoringCriteria: [
      { range: "4分", description: "角色的bio、personality、context、secret高度统一，无内在矛盾" },
      { range: "3分", description: "角色设定基本一致，偶有小矛盾" },
      { range: "2分", description: "角色设定大体合理但存在矛盾" },
      { range: "0-1分", description: "角色设定严重矛盾" }
    ]
  },

  behaviorSecretAlignment: {
    name: "行为与秘密关联",
    description: "分析角色行为动机是否由其秘密驱动",
    fullExplanation: "分析角色在context中的行为动机是否由其secret驱动，秘密是否能解释角色的特殊行为、态度变化或可疑举动，是否存在无动机的行为",
    maxScore: 4,
    scoringCriteria: [
      { range: "4分", description: "角色行为完全由其秘密驱动，逻辑紧密" },
      { range: "3分", description: "行为与秘密关联较强" },
      { range: "2分", description: "关联一般，部分行为缺乏动机" },
      { range: "0-1分", description: "行为与秘密脱节" }
    ]
  },

  truthConsistency: {
    name: "真相一致性",
    description: "检查凶手的作案动机、手法、时间是否能解释所有现场细节",
    fullExplanation: "检查凶手（isKiller=true的角色）的作案动机、手法、时间是否能解释globalStory中描述的所有现场细节、物证、时间线，是否存在无法解释的矛盾",
    maxScore: 4,
    scoringCriteria: [
      { range: "4分", description: "凶手作案手法、动机、时间能完美解释所有现场状况" },
      { range: "3分", description: "真相基本自洽，少数细节可商榷" },
      { range: "2分", description: "真相大体合理但有漏洞" },
      { range: "0-1分", description: "真相存在严重逻辑问题" }
    ]
  },

  characterDifferentiation: {
    name: "角色区分度",
    description: "比较各角色是否具有明显差异，避免同质化",
    fullExplanation: "比较各角色的personality、动机、秘密、背景是否具有明显差异，是否避免了【性格雷同】、【动机相似】、【背景重复】等同质化问题",
    maxScore: 4,
    scoringCriteria: [
      { range: "4分", description: "各角色性格、动机、秘密显著不同，个性鲜明" },
      { range: "3分", description: "角色有明显区别" },
      { range: "2分", description: "角色有差异但不够突出" },
      { range: "0-1分", description: "角色同质化严重" }
    ]
  },

  informationBalance: {
    name: "信息价值均衡",
    description: "分析每个角色是否都包含对破案有价值的信息",
    fullExplanation: "分析每个角色的secret和context是否都包含对破案有价值的信息（线索、证词、关键事实），是否存在【无用角色】或【信息垄断角色】",
    maxScore: 4,
    scoringCriteria: [
      { range: "4分", description: "每个角色都掌握对主线推理至关重要的独家信息" },
      { range: "3分", description: "大部分角色有重要信息" },
      { range: "2分", description: "信息分布不均，部分角色边缘化" },
      { range: "0-1分", description: "信息集中在少数角色身上" }
    ]
  },

  // 内容逻辑层 - 推理公平性与诡计设计类
  evidenceChain: {
    name: "证据链闭环",
    description: "按照作案三要素进行逆向工程验证，检查证据链的完整性",
    fullExplanation: "按照【作案三要素】(动机Motive、手法Means、机会Opportunity)进行逆向工程验证。从凶手的secret出发，检查是否存在完整的逻辑路径让玩家推导出凶手的动机、手法、作案时机。验证五大特性：完整性、唯一性、可得性、层次性、逻辑性",
    maxScore: 6,
    scoringCriteria: [
      { range: "6分", description: "五大特性全部满足，证据链完整可达且唯一指向真凶" },
      { range: "4-5分", description: "证据链基本完整，有1-2个轻微问题" },
      { range: "2-3分", description: "证据链存在跳跃或模糊环节但大体可行" },
      { range: "0-1分", description: "证据链断裂或存在无法获取的关键线索" }
    ]
  },

  trickDesign: {
    name: "诡计闭环",
    description: "检查特殊作案手法是否有线索支撑",
    fullExplanation: "检查特殊作案手法(如密道、易容、毒药、机关等)是否有线索支撑。如果凶手使用了特殊手法，必须在globalStory或其他角色信息中有相应提示，避免【玩家不可能知道的秘密手法】",
    maxScore: 4,
    scoringCriteria: [
      { range: "4分", description: "所有特殊手法都有线索支撑，诡计合理且可推导" },
      { range: "3分", description: "诡计基本合理，线索较充分" },
      { range: "2分", description: "诡计可接受但线索不够充分" },
      { range: "0-1分", description: "使用了无线索支撑的【神仙手法】" }
    ]
  },

  clueAccessibility: {
    name: "关键线索可达性",
    description: "检查锁定真凶的关键线索是否有现实可行的获取路径",
    fullExplanation: "逐一检查锁定真凶的关键线索来源：是否在globalStory中公开？是否通过审问特定角色可获得？是否有【死锁信息】(只有凶手知道且绝不会说出)？确保每条关键线索都有现实可行的获取路径",
    maxScore: 4,
    scoringCriteria: [
      { range: "4分", description: "所有关键线索都有明确可达的获取路径" },
      { range: "3分", description: "大部分关键线索可获取" },
      { range: "2分", description: "部分关键线索获取困难但有替代路径" },
      { range: "0-1分", description: "存在【死锁信息】或无法获取的关键线索" }
    ]
  },

  timelineConsistency: {
    name: "时间线自洽性",
    description: "构建精确的时间线表格，验证所有角色行为是否自洽",
    fullExplanation: "构建精确的时间线表格，验证所有角色在关键时间点的位置和行为是否自洽。检查凶手是否有明确的作案时间窗口，其他角色的不在场证明是否可被验证或推翻",
    maxScore: 3,
    scoringCriteria: [
      { range: "3分", description: "时间线完全自洽，无任何矛盾" },
      { range: "2分", description: "时间线基本自洽，有细微不一致" },
      { range: "1分", description: "时间线大体合理但存在模糊点" },
      { range: "0分", description: "时间线混乱或存在严重矛盾" }
    ]
  },

  alibiVerification: {
    name: "不在场证明验证",
    description: "检查每个非凶手角色的不在场证明是否可被验证或推翻",
    fullExplanation: "检查每个非凶手角色的不在场证明是否有证据支持或可被推翻的线索。确保玩家有方法验证或质疑每个人的陈述，避免【无法验证的完美不在场证明】",
    maxScore: 3,
    scoringCriteria: [
      { range: "3分", description: "所有不在场证明都可验证或有推翻线索" },
      { range: "2分", description: "大部分不在场证明可验证" },
      { range: "1分", description: "部分不在场证明难以验证但不影响推理" },
      { range: "0分", description: "存在无法验证的完美不在场证明" }
    ]
  },

  evidenceSystemIntegrity: {
    name: "证物系统完整性",
    description: "评估证物系统的完整性和推理价值",
    fullExplanation: "证物系统完整性评估，检查证物是否包含不同类型(physical/document/digital/testimony/combination)，每个证物都有完整的overview(物理描述)和clues(关联线索)，重要程度分布合理，证物间形成逻辑链条",
    maxScore: 5,
    scoringCriteria: [
      { range: "5分", description: "证物系统完整，包含≥3个不同类型证物，每个证物都有完整的overview和clues，重要程度分布合理" },
      { range: "4分", description: "证物系统较完整，包含≥2个类型证物，大部分证物有overview和clues双重描述" },
      { range: "3分", description: "证物系统基本完整，但部分证物的overview或clues描述不够充分" },
      { range: "2分", description: "证物系统不够完善，存在缺少overview或clues的证物" },
      { range: "1分", description: "证物系统存在明显缺陷，多数证物缺乏完整描述" },
      { range: "0分", description: "证物系统严重不完整，证物描述混乱或逻辑不清" }
    ]
  },

  // AI执行层
  assistantNeutrality: {
    name: "助手绝对中立",
    description: "检查助手角色是否保持客观中立，不兼任嫌疑人或凶手",
    fullExplanation: "检查isPartner=true的角色是否同时设置了isKiller=true或其他嫌疑人属性，助手的secret和context是否包含偏向性信息，是否能保持客观中立",
    maxScore: 5,
    scoringCriteria: [
      { range: "5分", description: "助手角色绝对中立，不兼任嫌疑人或凶手，职责清晰" },
      { range: "4分", description: "助手基本中立，偶有模糊" },
      { range: "3分", description: "助手中立性有疑问" },
      { range: "0-2分", description: "助手角色设定有严重问题" }
    ]
  },

  roleTypeUniqueness: {
    name: "角色类型唯一性",
    description: "验证每个角色的身份标识是否互斥且明确",
    fullExplanation: "验证每个角色的isPlayer、isPartner、isKiller、isAssistant字段是否互斥，是否有角色同时具备多个身份标识，或者缺少必要的角色类型",
    maxScore: 5,
    scoringCriteria: [
      { range: "5分", description: "isPlayer、isPartner、isKiller字段互斥且明确" },
      { range: "4分", description: "角色类型基本清晰" },
      { range: "3分", description: "角色类型有轻微混淆" },
      { range: "0-2分", description: "角色类型严重混乱" }
    ]
  },

  responsibilityBoundaries: {
    name: "职责边界明确",
    description: "检查每个角色的违规原则是否清晰定义了AI的行为边界",
    fullExplanation: "检查每个角色的violation字段是否清晰定义了AI不能做什么（如【不能承认杀人】、【不能透露某某秘密】），边界是否具体可执行",
    maxScore: 5,
    scoringCriteria: [
      { range: "5分", description: "每个AI角色的violation字段清晰划定行为边界" },
      { range: "4分", description: "职责边界较明确" },
      { range: "3分", description: "职责边界模糊" },
      { range: "0-2分", description: "职责边界不清或缺失" }
    ]
  },

  dialogueFlow: {
    name: "对话流程设计",
    description: "评估基于秘密和违规原则的对话设计是否富有层次",
    fullExplanation: "评估角色的secret与violation设计是否能产生有层次的对话（愿意说什么、不愿意说什么、在什么情况下可能泄露），是否有足够的审问空间",
    maxScore: 5,
    scoringCriteria: [
      { range: "5分", description: "基于秘密和违规原则的对话设计富有层次，交互性强" },
      { range: "4分", description: "对话流程合理" },
      { range: "3分", description: "对话设计平平" },
      { range: "0-2分", description: "对话流程有问题" }
    ]
  },

  informationAccess: {
    name: "信息获取路径",
    description: "分析关键破案信息是否有明确可达的获取路径",
    fullExplanation: "分析关键破案信息是否通过多个角色的secret、context可获得，是否存在只有凶手知道且绝不会说出的【死锁信息】，玩家是否有现实的获取路径",
    maxScore: 5,
    scoringCriteria: [
      { range: "5分", description: "关键信息有明确可达的获取路径" },
      { range: "4分", description: "大部分信息可获取" },
      { range: "3分", description: "部分信息获取困难" },
      { range: "0-2分", description: "关键信息难以获取" }
    ]
  },

  conflictResolution: {
    name: "冲突解决机制",
    description: "检查角色间冲突是否为玩家提供审问策略机会",
    fullExplanation: "检查角色间是否存在利益冲突、情感纠葛或信息矛盾，这些冲突是否为玩家提供了【挑拨离间】、【借力打力】的审问策略机会",
    maxScore: 5,
    scoringCriteria: [
      { range: "5分", description: "角色间矛盾为玩家提供丰富的审问策略空间" },
      { range: "4分", description: "冲突设计合理" },
      { range: "3分", description: "冲突处理一般" },
      { range: "0-2分", description: "冲突设计有问题" }
    ]
  },

  // 玩家体验层
  informationDistribution: {
    name: "信息分布公平性",
    description: "统计每个角色掌握的关键信息数量，检查是否存在信息垄断",
    fullExplanation: "统计每个角色掌握的关键信息数量，检查是否存在【信息垄断】（一个角色掌握过多关键线索）或【无用角色】（角色没有重要信息），评估误导信息的分布是否合理",
    maxScore: 7,
    scoringCriteria: [
      { range: "7分", description: "关键线索和误导信息在各嫌疑人间分布极其均衡" },
      { range: "5-6分", description: "信息分布较均衡" },
      { range: "3-4分", description: "信息分布有偏向" },
      { range: "0-2分", description: "信息分布严重不均" }
    ]
  },

  reasoningDifficulty: {
    name: "推理难度适中",
    description: "评估推理链长度、红鲱鱼数量等，判断难度是否适中",
    fullExplanation: "评估推理链长度（需要几步逻辑推演），红鲱鱼数量（误导线索），关键证据的隐蔽程度，综合判断对新手/老手玩家的难度是否适中",
    maxScore: 7,
    scoringCriteria: [
      { range: "7分", description: "推理难度适中，既有挑战又不过分复杂" },
      { range: "5-6分", description: "难度基本合适" },
      { range: "3-4分", description: "过简单或过复杂" },
      { range: "0-2分", description: "难度设置不当" }
    ]
  },

  participationGuarantee: {
    name: "参与感保证",
    description: "检查每个角色是否都有明确的个人动机和隐藏秘密",
    fullExplanation: "检查每个角色是否都有明确的个人动机、隐藏的秘密、需要防守的信息，是否能在被审问时提供丰富的反应和互动内容，避免【工具人】角色",
    maxScore: 6,
    scoringCriteria: [
      { range: "6分", description: "所有角色都有强烈动机和秘密，保证高参与感" },
      { range: "4-5分", description: "大部分角色参与感强" },
      { range: "2-3分", description: "部分角色参与感弱" },
      { range: "0-1分", description: "参与感设计不足" }
    ]
  }
};

// 根据字段key获取中文标签的映射
export const getDetailLabel = (key: string): string => {
  return FIELD_EXPLANATIONS[key]?.name || key;
};

// 获取字段的最大分数
export const getMaxScore = (key: string): number => {
  return FIELD_EXPLANATIONS[key]?.maxScore || 0;
};
