// AI剧本润色API
import invokeAI, { invokeAIStream } from './invoke';
import { Script } from '../types/script';

export interface PolishRequest {
  script: Script;           // 完整剧本数据
  fieldPath: string;       // 字段路径，如 'title', 'globalStory', 'characters[0].bio'
  fieldName: string;       // 字段中文名，如 '剧本标题', '故事背景', '角色背景'
  currentValue: string;    // 当前字段值
  instruction: string;     // 润色指令
  useQualityReport?: boolean; // 是否结合质检结果进行润色
}

export interface PolishResponse {
  success: boolean;
  polishedContent?: string;
  analysis?: string;
  suggestions?: string;
  error?: string;
}

// 剧本字段释义和约束定义
interface FieldDefinition {
  name: string;
  definition: string;
  constraints: string[];
  examples?: string[];
}

const FIELD_DEFINITIONS: Record<string, FieldDefinition> = {
  // 剧本基础字段
  title: {
    name: "剧本标题",
    definition: "剧本的核心标题，需要具有悬疑感和吸引力",
    constraints: [
      "长度控制在10-30字之间",
      "体现剧本的核心主题和悬疑氛围",
      "避免使用过于直白或剧透的词汇",
      "符合剧本的时代背景和文化特色"
    ],
    examples: ["午夜凶杀案", "深宫血色宫闱秘录", "安达山谋杀悬案"]
  },
  
  description: {
    name: "剧本简介",
    definition: "吸引玩家的剧本简介，100字左右",
    constraints: [
      "长度控制在80-120字",
      "概括剧本核心情节但不剧透",
      "营造悬疑和神秘氛围",
      "引起玩家的推理兴趣"
    ]
  },
  
  globalStory: {
    name: "全局故事背景",
    definition: "详细的故事背景、案件描述、时间线和核心谜题，作为所有AI角色的共同知识基础",
    constraints: [
      "长度约300字左右",
      "包含完整的案件背景和时间线",
      "不能透露凶手身份和关键证据",
      "为所有角色提供共同的世界观基础",
      "描述案发现场、受害者情况、初步线索"
    ]
  },
  
  // 角色字段
  "characters.bio": {
    name: "角色背景介绍",
    definition: "角色的背景介绍，包括籍贯、朝代、民族、性别、年龄、发型、日常穿着等，第三人称描述",
    constraints: [
      "使用第三人称描述",
      "描述角色的外貌特征，便于生成头像",
      "只写大家众所周知的表面身份",
      "不要透露角色的真实身份或隐秘身份",
      "尽量在形象上有区分度",
      "符合剧本的时代背景"
    ]
  },
  
  "characters.personality": {
    name: "角色性格特点",
    definition: "角色的性格、口吻和行为特点",
    constraints: [
      "描述角色的核心性格特征",
      "体现角色的说话风格和行为模式",
      "与角色的背景和身份相匹配",
      "为AI角色扮演提供明确指导",
      "避免过于极端或刻板的性格描述"
    ]
  },
  
  "characters.context": {
    name: "角色情境知识",
    definition: "角色的情境知识，必须使用第二人称'你...'来描述，告知AI它知道什么、经历了什么",
    constraints: [
      "必须使用第二人称'你'来描述",
      "描述角色知道的信息和经历的事件",
      "为AI角色扮演提供知识基础",
      "不能包含角色不应该知道的信息",
      "与globalStory保持一致性"
    ]
  },
  
  "characters.secret": {
    name: "角色核心秘密",
    definition: "角色内心深处的核心秘密，包括真实身份/隐秘身份，是玩家需要挖掘的关键",
    constraints: [
      "描述角色最核心的秘密",
      "包括真实身份或隐秘身份",
      "是推理游戏的关键信息",
      "与角色的行为动机相关",
      "不能与violation产生冲突"
    ]
  },
  
  "characters.violation": {
    name: "AI行为禁令",
    definition: "对AI的绝对行为禁令，防止AI意外泄露关键信息",
    constraints: [
      "使用具体、可执行的禁令语句",
      "防止AI泄露角色的核心秘密",
      "如'绝不能承认你杀死了XX'",
      "如'不能透露XX的真实身份'",
      "确保游戏的公平性和悬疑感"
    ]
  },

  // 剧本设置字段
  "settings.theme": {
    name: "剧本主题",
    definition: "剧本的主题风格分类",
    constraints: [
      "选择合适的主题分类",
      "如：中式民俗·阴婚、科幻废土·末日逃生、本格推理·暴风雪山庄",
      "或根据剧本特色创新选择",
      "体现剧本的核心氛围和背景"
    ]
  },

  "settings.difficulty": {
    name: "难度等级",
    definition: "根据剧本复杂度智能评估的难度等级",
    constraints: [
      "只能选择：'easy'(简单)、'medium'(中等)、'hard'(困难)",
      "基于剧情复杂度、推理难度、角色关系复杂程度评估",
      "考虑玩家推理所需的时间和精力"
    ]
  },

  "settings.estimatedDuration": {
    name: "预计游戏时长",
    definition: "根据剧本内容量和复杂度智能估算的游戏时长",
    constraints: [
      "单位：分钟",
      "通常范围：30-180分钟",
      "综合考虑角色数量、剧情深度、推理复杂度",
      "为整数值"
    ]
  }
};

// 获取字段的释义和约束信息
const getFieldDefinition = (fieldPath: string): FieldDefinition | undefined => {
  // 处理角色字段路径，如 'characters[0].bio' -> 'characters.bio'
  let normalizedPath = fieldPath.replace(/\[\d+\]/, '');
  
  // 处理嵌套字段路径，如 'settings.theme' -> 'settings.theme'
  if (normalizedPath.includes('.')) {
    // 如果是嵌套字段，保持原样
  } else {
    // 如果是顶级字段，直接使用
  }
  
  return FIELD_DEFINITIONS[normalizedPath];
};

// AI剧本杀润色核心原则
const POLISH_PRINCIPLES = `
## 优质剧本杀的五大核心原则

### 原则一：故事为魂，世界为骨 (Story as the Soul, World as the Skeleton)
一个剧本首先必须是一个好故事。它需要一个坚实的世界观作为骨架，并以引人入胜的情节作为灵魂。

**引人入胜的主题与背景**: 故事需要一个能激发玩家好奇心的钩子。无论是深宫权斗、赛博朋克、还是乡野怪谈，一个独特且细节丰富的背景是沉浸感的基石。

**自洽且独特的世界观**: 剧本中的所有设定——无论是物理法则、社会规则还是人际关系——都必须前后一致，不能出现逻辑矛盾。这个世界观是所有推理和行为的基础。

**张弛有度的叙事节奏**: 故事的展开需要有节奏感。开篇要能迅速制造悬念，将玩家代入情境；中段通过不断的信息释放和情节反转保持紧张感；结尾的真相大白则要能带来恍然大悟的满足感或情感上的震撼。

### 原则二：人物为核，动机驱动 (Characters as the Core, Driven by Motive)
剧本杀的本质是扮演。玩家体验的好坏，直接取决于角色的塑造。人物不应是推动剧情的工具，而应是驱动剧情的核心。

**鲜明且独特的立体人设**: 每个角色都必须有自己独特的性格（personality）、过往（bio）和秘密（secret）。要避免出现性格雷同、功能单一的"工具人"。

**真实且强烈的行为动机**: 所有角色的每一个关键行为，尤其是凶手的作案行为，都必须有强大且合乎其人设的动机支撑。玩家需要能理解"他/她为什么会这么做"。

**均衡且必要的参与感**: 剧本必须确保没有"边缘角色"。每个角色都应掌握独家的、对主线有影响的信息，并拥有清晰的个人目标，确保所有玩家在整个流程中都有事可做、有话可说。

### 原则三：逻辑为王，推理至上 (Logic as the King, Reasoning is Supreme)
这是剧本杀，尤其是推理本的硬性标准。逻辑的严谨性决定了剧本的成败。其核心，就是构建一条完美无瑕的证据链。

**证据链的完整性**: 从线索到结论的推理路径上，不能有任何缺失的环节。玩家必须能仅依靠游戏中获得的信息，通过纯逻辑推导出真相，而无需"灵光一闪"或猜测。

**证据链的唯一性**: 所有线索最终指向的真凶必须是唯一的。同时，这条证据链必须能完美排除所有其他嫌疑人。对任何一个非凶手，都应存在一个无法被推翻的"铁证"（如完美的不在场证明）来为他脱罪。

**证据链的可得性**: 构成证据链的所有关键线索，必须被设计在游戏流程中，是玩家必然可以获取的。不能存在任何需要上帝视角才能知道的"隐藏设定"。

**证据链的层次性**: 优秀的证据链不是单线条的，而是由核心证据、辅助证据和误导性信息交织而成的网络，这为玩家提供了抽丝剥茧的乐趣和挑战。

### 原则四：体验为本，互动为王 (Experience as the Foundation, Interaction is Key)
剧本杀是一种社交游戏，其最终目的是为玩家提供一段沉浸、有趣、富有挑战的共同体验。

**公平的信息分布**: 指向不同嫌疑人的线索和嫌疑程度应相对均衡，避免开局就"天胡"或"天崩"的局面，保证游戏的悬念可以维持到最后。

**明确的游戏目标与流程**: 玩家需要清楚地知道在每个阶段该做什么（自我介绍、搜证、讨论、投票）。游戏流程的设计应能自然地引导玩家互动和信息交换。

**丰富的互动机制**: 剧本应鼓励玩家之间的互动，无论是通过公开讨论、私下密谈，还是通过阵营对抗、特殊技能等机制，来创造更多的博弈和戏剧冲突。

### 原则五：执行为纲，清晰无歧 (Execution as the Framework, Clarity is Paramount)
这一原则对于所有剧本都很重要，但对于AI驱动的剧本来说，它是**生死线**。它要求剧本的设计必须像计算机程序一样，清晰、明确、没有歧义。

**结构化的信息**: 关键信息（如线索、死因、时间线）需要被"原子化"和"标签化"，而不是仅仅作为故事文本的一部分。这便于AI精确地调用和呈现。

**无歧义的规则**: 所有的游戏规则，特别是角色的行为限制（violation），必须是具体、可被程序判断的。避免使用"不能说谎"这类模糊的指令。

**清晰的角色职责**: 每个AI角色的功能必须是唯一的、互斥的。例如，承担引导职责的"助手"角色，绝对不能是案件的嫌疑人，必须保持绝对中立。

---

## 剧本杀润色专业原则

1. **文体要求**：
   - 使用叙事散文，如小说般流畅自然
   - 严禁电影术语：(镜头)、(特写)、(切换)、(淡出)等
   - 适合阅读理解，不是视觉呈现

2. **悬疑保护原则**：
   - 绝不在故事背景/描述中透露凶手身份
   - 不暴露关键证据或作案手法细节
   - 保持推理的公平性和悬疑感
   - 只描述表面现象，不揭示深层真相

3. **信息层次控制**：
   - 公开信息：时间、地点、受害者、表面情况
   - 隐秘信息：动机、真相、关键证据（不可在背景中透露）
   - 维持"已知"与"待查"的边界

4. **文学品质提升**：
   - 增强氛围营造和细节描写
   - 提升语言的感染力和沉浸感
   - 保持逻辑严密性和时间线一致性
   - 符合时代背景和文化特色

5. **游戏体验优化**：
   - 激发玩家的推理兴趣
   - 提供足够但不过量的线索
   - 保持角色关系的复杂性和真实感
`;

// 调用AI润色接口
export const polishScriptField = async (request: PolishRequest): Promise<PolishResponse> => {
  try {
    
    // 构建安全的上下文信息（不暴露敏感剧情）
    const contextInfo = {
      title: request.script.title,
      description: request.script.description,
      theme: request.script.settings.theme,
      difficulty: request.script.settings.difficulty,
      estimatedDuration: request.script.settings.estimatedDuration,
      characterCount: request.script.characters.length,
      
      // 角色信息（仅公开部分，不包含秘密）
      characters: request.script.characters.map(char => ({
        name: char.name,
        roleType: char.roleType || '角色',
        // 只包含公开的角色背景，不包含秘密和违规信息
        publicBio: char.bio?.split('。')[0] + '。' // 只取第一句作为公开信息
      })),
      
      // 公开的故事要素（不包含解答）
      publicStoryElements: {
        setting: '案件发生的时间地点环境',
        victim: '受害者的基本情况', 
        suspects: '嫌疑人的表面关系',
        mystery: '案件的表面疑点'
      }
    };

    // 特殊处理：为故事背景和描述字段添加额外的保护提醒
    const isSensitiveField = request.fieldPath === 'globalStory' || request.fieldPath === 'description';
    const sensitiveWarning = isSensitiveField ? `
【重要警告】
你正在润色的是玩家可见的公开信息，绝对不能透露：
- 凶手的真实身份
- 具体的作案动机和手法
- 关键证据的位置和内容
- 角色的隐秘关系和秘密
只能描述表面现象，营造悬疑氛围，不可剧透！
` : '';

    // 根据字段类型拼接角色关系设计约束
    const fieldIsCharacter = /characters\[\d+\]\./.test(request.fieldPath);
    const relationshipDesignGuidance = fieldIsCharacter ? `
【角色关系设计约束（务必遵守）】
剧本杀的角色关系是沉浸感与推理性的核心，每个角色都应与他人形成网状关联，避免边缘化：
- 剧本类型差异：
  - 硬核推理本：强调利益冲突与时间线交织，关系服务于动机与诡计。
  - 情感沉浸本：突出情感羁绊与内心世界，保持共鸣与真实感。
  - 阵营机制本：确保阵营划分清晰、盟友-敌对关系鲜明，便于策略博弈。
  - 欢乐本：允许戏剧化与误会反转，但仍需自洽。
- 角色维度：显性身份（职业/地位）、隐性身份（秘密经历）、核心秘密（2-3条）、行为动机（表层/深层）。
- 关系线：情感线、利益线、时间线至少其一将其与他人相连；任何两名角色之间至少存在一种潜在联系或矛盾点。
- 误区回避：动机单薄、全员恶人、关系与凶案脱节、线索不平衡均需避免。
` : '';

    // 角色内部一致性（仅在角色字段时附加）
    let characterConsistencyGuidance = '';
    let characterProfileText = '';
    if (fieldIsCharacter) {
      const match = request.fieldPath.match(/characters\[(\d+)\]\.([\w]+)/);
      const index = match ? parseInt(match[1]) : -1;
      const targetField = match ? match[2] : '';
      const ch = request.script.characters[index];
      if (ch) {
        characterProfileText = `
【该角色已知设定（供一致性参考）】
姓名：${ch.name}
类型：${ch.roleType || '角色'}
背景（bio）：${ch.bio || ''}
性格（personality）：${ch.personality || ''}
上下文（context）：${ch.context || ''}
秘密（secret）：${ch.secret || ''}
违规（violation）：${ch.violation || ''}
`;
      }
      characterConsistencyGuidance = `
【角色内部一致性要求（必须满足）】
- 不得改变该角色的基本身份与已知事实（姓名/时代/社会地位）。
- 润色后的「${targetField}」需与该角色其他字段保持不冲突：
  - bio 与 personality/口吻互相印证（人设与语气一致）。
  - context 不得新增与 globalStory 或该角色既有事实相悖的事件。
  - secret 不能与 violation 相矛盾；secret 不得剧透真相或破坏公平性。
  - violation 必须可操作、可执行，且与该角色人设相符。
- 不随意引入新固有名词（地点/组织/关系）破坏既有设定；如需补充，仅做温和细化。
- 禁止修改或暗改其他角色的设定与关键线索。
`;
    }

    // 构建质检结果内容（如果需要且存在）
    let qualityReportSection = '';
    if (request.useQualityReport && request.script.settings.qualityReport) {
      qualityReportSection = `

【质检结果参考】
以下是该剧本最新的质检报告，请在润色时考虑相关建议和问题：
"""
${request.script.settings.qualityReport}
"""

**润色时请特别注意**：
- 如质检报告中指出了当前字段的具体问题，请重点解决
- 改进建议应与润色目标相结合
- 保持剧本整体质量的提升方向一致
`;
    }

    // 构建完整的润色请求
    const polishPrompt = `你是专业的剧本杀游戏内容编辑。

【文体要求】
这是桌游剧本杀的叙事文本，不是电影剧本！
- 使用小说式叙事文字，流畅自然
- 严禁电影术语：(镜头)、(特写)、(切换)等
- 适合阅读理解，营造沉浸感

${POLISH_PRINCIPLES}
${sensitiveWarning}
${relationshipDesignGuidance}
${characterConsistencyGuidance}
${characterProfileText}
${relationshipDesignGuidance}

【剧本上下文】
剧本标题：${contextInfo.title}
主题风格：${contextInfo.theme}
难度等级：${contextInfo.difficulty}
预计时长：${contextInfo.estimatedDuration}分钟
角色数量：${contextInfo.characterCount}个

角色构成：
${contextInfo.characters.map(char => `- ${char.name}（${char.roleType}）：${char.publicBio}`).join('\n')}
${qualityReportSection}
【润色任务】
字段类型：${request.fieldName}
润色要求：${request.instruction}

【字段定义与约束】
${(() => {
  const fieldDef = getFieldDefinition(request.fieldPath);
  console.log(`🔧 润色字段路径: ${request.fieldPath}, 字段名: ${request.fieldName}`);
  console.log(`🔧 找到字段定义:`, fieldDef ? 'Yes' : 'No');
  
  if (fieldDef) {
    return `字段名称：${fieldDef.name}
字段定义：${fieldDef.definition}

必须遵循的约束条件：
${fieldDef.constraints.map(c => `- ${c}`).join('\n')}
${fieldDef.examples ? `\n参考示例：${fieldDef.examples.join('、')}` : ''}

⚠️ 重要提醒：润色时必须严格遵循上述字段定义和约束条件，确保润色结果符合该字段的规范要求。`;
  }
  return `正在润色「${request.fieldName}」字段，请确保润色结果符合该字段的用途和规范。`;
})()}

当前内容：
"""
${request.currentValue}
"""

【严格输出格式】
只输出润色后的最终文本本身：
- 禁止输出任何解释、分析、标题、分节、小结、前后缀提示
- 禁止输出“润色后内容：”“说明：”“建议：”等提示性文字
- 禁止使用Markdown、代码块、引号或括号包装
- 文本直接起笔，保持自然分段

【输出要求】
请提供优化后的叙事文字版本，确保：
1. 文字流畅，氛围浓厚
2. 不使用任何电影术语
3. 不透露隐秘剧情信息
4. 保持推理游戏的公平性
5. 严格遵循上述字段定义和约束条件
6. 保持原有的核心信息和逻辑结构
7. 提升表达质量但不改变字段的基本用途`;

    const response = await invokeAI({
      globalStory: polishPrompt,
      sessionId: `polish_${Date.now()}`,
      characterFileVersion: 'script_polisher',
      actor: {
        id: -1,
        name: 'ScriptPolisher',
        bio: 'AI剧本编辑专家',
        personality: '专业、简洁、高效',
        context: '你是专业的剧本编辑，负责优化剧本内容质量',
        secret: '',
        violation: '保持简洁，直接提供优化结果',
        image: '',
        messages: [{ 
          role: 'user', 
          content: `润色${request.fieldName}：${request.instruction}` 
        }]
      },
      detectiveName: "编辑者",
      victimName: "内容"
    });

    console.log('🤖 AI润色响应:', response.final_response);

    // 简化响应解析
    const content = response.final_response;
    
    // 尝试提取润色后的内容
    let polishedContent = '';
    let analysis = '';
    let suggestions = '';
    
    // 尝试解析结构化输出
    const analysisMatch = content.match(/### 问题诊断[\s\S]*?(?=###|$)/);
    if (analysisMatch) {
      analysis = analysisMatch[0].replace('### 问题诊断', '').trim();
    }
    
    const contentMatch = content.match(/### 润色后内容[\s\S]*?(?=###|$)/);
    if (contentMatch) {
      polishedContent = contentMatch[0].replace('### 润色后内容', '').trim();
    }
    
    const suggestionsMatch = content.match(/### 修改说明[\s\S]*?(?=###|$)/);
    if (suggestionsMatch) {
      suggestions = suggestionsMatch[0].replace('### 修改说明', '').trim();
    }
    
    // 如果没有找到结构化内容，直接使用响应内容
    if (!polishedContent) {
      polishedContent = content.trim();
      analysis = '内容已优化';
      suggestions = '请查看润色结果';
    }

    return {
      success: true,
      polishedContent,
      analysis,
      suggestions
    };

  } catch (error) {
    console.error('❌ AI润色失败:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '润色失败，请重试'
    };
  }
};

// 流式润色：将结果通过回调实时返回
export const polishScriptFieldStream = (
  request: PolishRequest,
  handlers: {
    onChunk: (text: string) => void;
    onEnd: () => void;
    onError: (message: string) => void;
  }
) => {
  try {
    const contextInfo = {
      title: request.script.title,
      description: request.script.description,
      theme: request.script.settings.theme,
      difficulty: request.script.settings.difficulty,
      estimatedDuration: request.script.settings.estimatedDuration,
      characterCount: request.script.characters.length,
      characters: request.script.characters.map(char => ({
        name: char.name,
        roleType: char.roleType || '角色',
        publicBio: char.bio?.split('。')[0] + '。'
      })),
      publicStoryElements: {
        setting: '案件发生的时间地点环境',
        victim: '受害者的基本情况',
        suspects: '嫌疑人的表面关系',
        mystery: '案件的表面疑点'
      }
    };

    const isSensitiveField = request.fieldPath === 'globalStory' || request.fieldPath === 'description';
    const sensitiveWarning = isSensitiveField ? `
【重要警告】
你正在润色的是玩家可见的公开信息，绝对不能透露：
- 凶手的真实身份
- 具体的作案动机和手法
- 关键证据的位置和内容
- 角色的隐秘关系和秘密
只能描述表面现象，营造悬疑氛围，不可剧透！
` : '';

    const fieldIsCharacter2 = /characters\[\d+\]\./.test(request.fieldPath);
    const relationshipDesignGuidance2 = fieldIsCharacter2 ? `
【角色关系设计约束（务必遵守）】
剧本杀的角色关系是沉浸感与推理性的核心，每个角色都应与他人形成网状关联，避免边缘化：
- 剧本类型差异：
  - 硬核推理本：强调利益冲突与时间线交织，关系服务于动机与诡计。
  - 情感沉浸本：突出情感羁绊与内心世界，保持共鸣与真实感。
  - 阵营机制本：确保阵营划分清晰、盟友-敌对关系鲜明，便于策略博弈。
  - 欢乐本：允许戏剧化与误会反转，但仍需自洽。
- 角色维度：显性身份、隐性身份、核心秘密（2-3条）、行为动机（表层/深层）。
- 关系线：情感线、利益线、时间线至少其一将其与他人相连；任何两名角色之间至少存在一种潜在联系或矛盾点。
- 误区回避：动机单薄、全员恶人、关系与凶案脱节、线索不平衡均需避免。
` : '';

    // 角色内部一致性（流式版本）
    let characterConsistencyGuidance2 = '';
    let characterProfileText2 = '';
    if (fieldIsCharacter2) {
      const match = request.fieldPath.match(/characters\[(\d+)\]\.([\w]+)/);
      const index = match ? parseInt(match[1]) : -1;
      const targetField = match ? match[2] : '';
      const ch = request.script.characters[index];
      if (ch) {
        characterProfileText2 = `
【该角色已知设定（供一致性参考）】
姓名：${ch.name}
类型：${ch.roleType || '角色'}
背景（bio）：${ch.bio || ''}
性格（personality）：${ch.personality || ''}
上下文（context）：${ch.context || ''}
秘密（secret）：${ch.secret || ''}
违规（violation）：${ch.violation || ''}
`;
      }
      characterConsistencyGuidance2 = `
【角色内部一致性要求（必须满足）】
- 不得改变该角色的基本身份与已知事实（姓名/时代/社会地位）。
- 润色后的「${targetField}」需与该角色其他字段保持不冲突：
  - bio 与 personality/口吻互相印证（人设与语气一致）。
  - context 不得新增与 globalStory 或该角色既有事实相悖的事件。
  - secret 不能与 violation 相矛盾；secret 不得剧透真相或破坏公平性。
  - violation 必须可操作、可执行，且与该角色人设相符。
- 不随意引入新固有名词（地点/组织/关系）破坏既有设定；如需补充，仅做温和细化。
- 禁止修改或暗改其他角色的设定与关键线索。
`;
    }

    // 构建质检结果内容（如果需要且存在）
    let qualityReportSection2 = '';
    if (request.useQualityReport && request.script.settings.qualityReport) {
      qualityReportSection2 = `

【质检结果参考】
以下是该剧本最新的质检报告，请在润色时考虑相关建议和问题：
"""
${request.script.settings.qualityReport}
"""

**润色时请特别注意**：
- 如质检报告中指出了当前字段的具体问题，请重点解决
- 改进建议应与润色目标相结合
- 保持剧本整体质量的提升方向一致
`;
    }

    const polishPrompt = `你是专业的剧本杀游戏内容编辑。

【文体要求】
这是桌游剧本杀的叙事文本，不是电影剧本！
- 使用小说式叙事文字，流畅自然
- 严禁电影术语：(镜头)、(特写)、(切换)等
- 适合阅读理解，营造沉浸感

${POLISH_PRINCIPLES}
${sensitiveWarning}
${relationshipDesignGuidance2}
${characterConsistencyGuidance2}
${characterProfileText2}

【剧本上下文】
剧本标题：${contextInfo.title}
主题风格：${contextInfo.theme}
难度等级：${contextInfo.difficulty}
预计时长：${contextInfo.estimatedDuration}分钟
角色数量：${contextInfo.characterCount}个

角色构成：
${contextInfo.characters.map(char => `- ${char.name}（${char.roleType}）：${char.publicBio}`).join('\n')}
${qualityReportSection2}
【润色任务】
字段类型：${request.fieldName}
润色要求：${request.instruction}

【字段定义与约束】
${(() => {
  const fieldDef = getFieldDefinition(request.fieldPath);
  console.log(`🔧 润色字段路径: ${request.fieldPath}, 字段名: ${request.fieldName}`);
  console.log(`🔧 找到字段定义:`, fieldDef ? 'Yes' : 'No');
  
  if (fieldDef) {
    return `字段名称：${fieldDef.name}
字段定义：${fieldDef.definition}

必须遵循的约束条件：
${fieldDef.constraints.map(c => `- ${c}`).join('\n')}
${fieldDef.examples ? `\n参考示例：${fieldDef.examples.join('、')}` : ''}

⚠️ 重要提醒：润色时必须严格遵循上述字段定义和约束条件，确保润色结果符合该字段的规范要求。`;
  }
  return `正在润色「${request.fieldName}」字段，请确保润色结果符合该字段的用途和规范。`;
})()}

当前内容：
"""
${request.currentValue}
"""

【严格输出格式】
只输出润色后的最终文本本身：
- 禁止输出任何解释、分析、标题、分节、小结、前后缀提示
- 禁止输出“润色后内容：”“说明：”“建议：”等提示性文字
- 禁止使用Markdown、代码块、引号或括号包装
- 文本直接起笔，保持自然分段

【输出要求】
请提供优化后的叙事文字版本，确保：
1. 文字流畅，氛围浓厚
2. 不使用任何电影术语
3. 不透露隐秘剧情信息
4. 保持推理游戏的公平性
5. 严格遵循上述字段定义和约束条件
6. 保持原有的核心信息和逻辑结构
7. 提升表达质量但不改变字段的基本用途`;

    const cancel = invokeAIStream({
      globalStory: polishPrompt,
      sessionId: `polish_${Date.now()}`,
      characterFileVersion: 'script_polisher',
      temperature: 0.3, // 润色需要一定创造性但也要保持稳定性
      actor: {
        id: -1,
        name: 'ScriptPolisher',
        bio: 'AI剧本编辑专家',
        personality: '专业、简洁、高效',
        context: '你是专业的剧本编辑，负责优化剧本内容质量',
        secret: '',
        violation: '保持简洁，直接提供优化结果',
        image: '',
        messages: [{ role: 'user', content: `润色${request.fieldName}：${request.instruction}` }]
      } as any,
      detectiveName: '编辑者',
      victimName: '内容',
      onChunk: handlers.onChunk,
      onEnd: handlers.onEnd,
      onError: handlers.onError,
    });

    return cancel;
  } catch (e) {
    handlers.onError(e instanceof Error ? e.message : '流式润色失败');
    return () => {};
  }
};

// 获取字段的中文名称
export const getFieldDisplayName = (fieldPath: string): string => {
  const fieldMap: Record<string, string> = {
    'title': '剧本标题',
    'description': '剧本描述', 
    'globalStory': '故事背景',
    'bio': '角色背景',
    'personality': '性格特点',
    'context': '上下文信息',
    'secret': '角色秘密',
    'violation': '违规原则',
    'overview': '证物概况',
    'clues': '证物线索'
  };
  
  // 处理数组字段路径，如 characters[0].bio 或 evidences[0].overview
  for (const [key, name] of Object.entries(fieldMap)) {
    if (fieldPath.includes(key)) {
      return name;
    }
  }
  
  return fieldPath;
};

// 根据字段路径获取字段值
export const getFieldValue = (script: Script, fieldPath: string): string => {
  try {
    // 处理简单字段
    if (fieldPath === 'title') return script.title;
    if (fieldPath === 'description') return script.description;
    if (fieldPath === 'globalStory') return script.globalStory;
    
    // 处理角色字段 characters[index].field
    const characterMatch = fieldPath.match(/characters\[(\d+)\]\.(\w+)/);
    if (characterMatch) {
      const index = parseInt(characterMatch[1]);
      const field = characterMatch[2];
      const character = script.characters[index];
      if (character) {
        return (character as any)[field] || '';
      }
    }
    
    // 处理证物字段 evidences[index].field
    const evidenceMatch = fieldPath.match(/evidences\[(\d+)\]\.(\w+)/);
    if (evidenceMatch) {
      const index = parseInt(evidenceMatch[1]);
      const field = evidenceMatch[2];
      const evidence = script.evidences?.[index];
      if (evidence) {
        console.log(`🔍 [DEBUG] 获取证物字段: evidences[${index}].${field}`);
        return (evidence as any)[field] || '';
      }
    }
    
    return '';
  } catch (error) {
    console.error('获取字段值失败:', error);
    return '';
  }
};

// 根据字段路径设置字段值
export const setFieldValue = (script: Script, fieldPath: string, value: string): Script => {
  try {
    console.log(`🔧 [DEBUG] setFieldValue: 字段路径=${fieldPath}, 新值长度=${value.length}`);
    const newScript = { ...script };
    
    // 处理简单字段
    if (fieldPath === 'title') {
      newScript.title = value;
      return newScript;
    }
    if (fieldPath === 'description') {
      newScript.description = value;
      return newScript;
    }
    if (fieldPath === 'globalStory') {
      newScript.globalStory = value;
      return newScript;
    }
    
    // 处理角色字段
    const characterMatch = fieldPath.match(/characters\[(\d+)\]\.(\w+)/);
    if (characterMatch) {
      const index = parseInt(characterMatch[1]);
      const field = characterMatch[2];
      
      newScript.characters = [...script.characters];
      if (newScript.characters[index]) {
        newScript.characters[index] = {
          ...newScript.characters[index],
          [field]: value
        };
      }
      return newScript;
    }
    
    // 处理证物字段
    const evidenceMatch = fieldPath.match(/evidences\[(\d+)\]\.(\w+)/);
    if (evidenceMatch) {
      const index = parseInt(evidenceMatch[1]);
      const field = evidenceMatch[2];
      
      console.log(`🔧 [DEBUG] 更新证物字段: index=${index}, field=${field}`);
      
      newScript.evidences = [...(script.evidences || [])];
      if (newScript.evidences[index]) {
        newScript.evidences[index] = {
          ...newScript.evidences[index],
          [field]: value
        };
        console.log(`✅ [DEBUG] 证物字段更新成功: evidences[${index}].${field}`);
      } else {
        console.error(`❌ [DEBUG] 证物索引不存在: ${index}`);
      }
      return newScript;
    }
    
    // 处理设置字段
    const settingsMatch = fieldPath.match(/settings\.(\w+)/);
    if (settingsMatch) {
      const field = settingsMatch[1];
      newScript.settings = {
        ...script.settings,
        [field]: value
      };
      return newScript;
    }
    
    return newScript;
  } catch (error) {
    console.error('设置字段值失败:', error);
    return script;
  }
};
