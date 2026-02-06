// 证物智能生成API
import invokeAI from './invoke';
import { Script } from '../types/script';

// 质检报告接口（简化版，用于证物生成）
export interface QualityCheckResult {
  scores: {
    contentLogic: {
      score: number;
      details: {
        evidenceSystemIntegrity?: number;
        informationBalance?: number;
        clueAccessibility?: number;
        [key: string]: number | undefined;
      };
    };
    totalScore: number;
  };
  issues: string[];
  recommendations: string[];
  summary: string;
}

export interface EvidenceGenerationRequest {
  script: Script;                    // 完整剧本数据
  category: string;                  // 证物类别
  importance: string;                // 重要程度
  initialState: string;              // 初始状态
  relatedCharacters: string[];       // 相关角色
  qualityReport?: QualityCheckResult; // 新增：质检报告上下文
}

export interface EvidenceGenerationResponse {
  success: boolean;
  evidence?: {
    name: string;
    description: string;     // 完整描述（向后兼容）
    overview: string;        // 证物概况（用户可见的物理描述）
    clues: string;          // 证物线索（AI上下文的关联信息）
  };
  error?: string;
}

// 根据剧本上下文和设定生成证物
export const generateEvidence = async (request: EvidenceGenerationRequest): Promise<EvidenceGenerationResponse> => {
  try {
    console.log('🎯 开始生成证物:', request);
    
    if (request.qualityReport) {
      console.log('📊 使用质检报告上下文:', {
        totalScore: request.qualityReport.scores.totalScore,
        evidenceScore: request.qualityReport.scores.contentLogic.details.evidenceSystemIntegrity,
        issuesCount: request.qualityReport.issues.length,
        recommendationsCount: request.qualityReport.recommendations.length
      });
    }

    // 构建证物生成提示词（包含质检上下文）
    const generatePrompt = buildEvidenceGenerationPrompt(request);
    
    const response = await invokeAI({
      globalStory: generatePrompt,
      sessionId: `evidence_gen_${Date.now()}`,
      characterFileVersion: 'evidence_generator',
      actor: {
        id: 999,
        name: '证物生成器',
        bio: '专业的推理剧本证物设计师',
        personality: '严谨、细致、富有创意',
        context: '负责根据剧本背景和设定生成合适的证物',
        secret: '',
        violation: '',
        image: '',
        messages: [{
          role: 'user',
          content: `请根据以下设定生成证物：
类别：${getCategoryName(request.category)}
重要程度：${getImportanceName(request.importance)}
初始状态：${getStateName(request.initialState)}
相关角色：${request.relatedCharacters.join('、')}`
        }]
      }
    });

    console.log('🤖 证物生成响应:', response.final_response);

    // 解析AI响应
    const evidenceData = parseEvidenceFromResponse(response.final_response);
    
    if (evidenceData.name && evidenceData.description) {
      // 组合概况和线索信息作为完整描述（向后兼容）
      const fullDescription = evidenceData.clues 
        ? `${evidenceData.description}\n\n【关联线索】\n${evidenceData.clues}`
        : evidenceData.description;
      
      const evidence = {
        name: evidenceData.name,
        description: fullDescription,
        overview: evidenceData.description,    // 新字段：证物概况（用户可见）
        clues: evidenceData.clues || ''        // 新字段：证物线索（AI上下文）
      };
      
      return {
        success: true,
        evidence
      };
    } else {
      return {
        success: false,
        error: '生成的证物信息不完整，请重试'
      };
    }

  } catch (error) {
    console.error('❌ 证物生成失败:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '证物生成失败，请重试'
    };
  }
};

// 构建证物生成提示词
const buildEvidenceGenerationPrompt = (request: EvidenceGenerationRequest): string => {
  const { script, category, importance, initialState, relatedCharacters, qualityReport } = request;
  
  // 获取剧本基本信息
  const scriptInfo = `
【剧本基本信息】
标题：${script.title || '未设定'}
概述：${script.description || '未设定'}
故事背景：${script.globalStory || '未设定'}`;

  // 获取完整角色信息
  const charactersInfo = script.characters && script.characters.length > 0 ? `
【角色信息】
${script.characters.map(char => `
- ${char.name}（${char.roleType || '未知角色'}）：
  身份背景：${char.bio || '暂无背景'}
  性格特征：${char.personality || '暂无性格描述'}
  行为上下文：${char.context || '暂无上下文'}
  隐藏秘密：${char.secret || '暂无秘密'}
  违规原则：${char.violation || '暂无违规信息'}
  特殊标记：${char.isKiller ? '凶手' : ''}${char.isVictim ? '受害者' : ''}${char.isDetective ? '侦探' : ''}
`).join('')}` : '\n【角色信息】\n暂无角色信息';

  // 获取现有证物信息（避免重复）
  const existingEvidences = script.evidences && script.evidences.length > 0 ? `
【已有证物】
${script.evidences.map(evidence => `- ${evidence.name}：${evidence.description}`).join('\n')}` : '\n【已有证物】\n暂无已有证物';

  // 构建质检报告上下文（如果存在）
  const qualityContext = qualityReport ? buildQualityContext(qualityReport) : '';

  return `你是专业的推理剧本证物设计师。请根据以下剧本信息和设定要求，生成一个合适的证物。

${scriptInfo}
${charactersInfo}
${existingEvidences}
${qualityContext}

【证物设定要求】
证物类别：${getCategoryName(category)}
重要程度：${getImportanceName(importance)}
初始状态：${getStateName(initialState)}
相关角色：${relatedCharacters.join('、')}

【生成原则】
1. **符合剧本背景**：证物必须与剧本的时代背景、故事情节高度契合
2. **角色关联性**：证物与指定的相关角色有明确的关联关系
3. **重要程度匹配**：证物的价值和作用要与设定的重要程度相符
4. **状态合理性**：证物的初始发现状态要符合剧情逻辑
5. **避免重复**：不要与已有证物重复或过于相似
6. **推理价值**：证物要对推理过程有实际的帮助作用

【输出格式要求】
请严格按照以下格式输出，不要添加其他内容：

### 证物名称
[证物的具体名称，简洁明了，5-15字]

### 证物概况
[证物的物理性特征描述，包括外观、材质、尺寸、颜色、发现地点等可直接观察到的信息，60-120字。要形象具体，适合作为AI图像生成的提示词]

### 证物线索
[证物的关联线索信息，包括所有权归属、用途推测、与案件的浅层关系、涉及的人物关系等，60-120字。这是通过初步分析得出的线索信息]

【重要提醒】
- 证物名称要简洁有力，体现证物核心特征
- 证物概况专注于物理描述，要有足够的视觉细节用于AI生成图像，避免涉及推理线索
- 证物线索专注于关联信息，包含人物关系、案件线索等推理要素
- 概况信息对玩家可见，线索信息仅作为AI对话上下文使用
- 根据重要程度设计证物的关键程度和复杂性
- 确保证物符合设定的初始状态（隐藏/基础发现/已调查）
- 充分利用角色的秘密、违规原则等信息设计合理的关联线索`;
};

// 解析AI响应中的证物信息
const parseEvidenceFromResponse = (response: string): { name: string; description: string; clues: string } => {
  let name = '';
  let description = '';
  let clues = '';

  try {
    // 提取证物名称
    const nameMatch = response.match(/###\s*证物名称\s*\n(.*?)(?=\n|$)/);
    if (nameMatch) {
      name = nameMatch[1].trim();
    }

    // 提取证物概况（新格式）
    const descMatch = response.match(/###\s*证物概况\s*\n([\s\S]*?)(?=###|$)/);
    if (descMatch) {
      description = descMatch[1].trim();
    }

    // 提取证物线索（新字段）
    const cluesMatch = response.match(/###\s*证物线索\s*\n([\s\S]*?)(?=###|$)/);
    if (cluesMatch) {
      clues = cluesMatch[1].trim();
    }

    // 兼容旧格式：如果没有找到新格式，尝试旧的"证物描述"
    if (!description) {
      const oldDescMatch = response.match(/###\s*证物描述\s*\n([\s\S]*?)(?=###|$)/);
      if (oldDescMatch) {
        description = oldDescMatch[1].trim();
      }
    }

    // 如果格式不标准，尝试其他解析方式
    if (!name || !description) {
      // 尝试按行解析
      const lines = response.split('\n').map(line => line.trim()).filter(line => line);
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        if (line.includes('证物名称') || line.includes('名称')) {
          // 查找名称
          if (i + 1 < lines.length) {
            const nextLine = lines[i + 1];
            if (!nextLine.includes('###') && !nextLine.includes('证物') && nextLine.length < 50) {
              name = nextLine;
            }
          }
        }
        
        if (line.includes('证物概况') || (line.includes('证物描述') && !description)) {
          // 查找概况/描述
          let desc = '';
          for (let j = i + 1; j < lines.length; j++) {
            if (lines[j].includes('###') || lines[j].includes('证物名称')) break;
            desc += lines[j] + '\n';
          }
          if (desc.trim()) {
            description = desc.trim();
          }
        }

        if (line.includes('证物线索')) {
          // 查找线索
          let clueText = '';
          for (let j = i + 1; j < lines.length; j++) {
            if (lines[j].includes('###') || lines[j].includes('证物名称')) break;
            clueText += lines[j] + '\n';
          }
          if (clueText.trim()) {
            clues = clueText.trim();
          }
        }
      }
    }

    // 最后的清理和验证
    if (name) {
      name = name.replace(/^[-*•]\s*/, '').trim();
    }
    if (description) {
      description = description.replace(/^[-*•]\s*/, '').trim();
    }
    if (clues) {
      clues = clues.replace(/^[-*•]\s*/, '').trim();
    }

    console.log('🎯 证物生成解析结果:');
    console.log('  名称:', name);
    console.log('  概况:', description);
    console.log('  线索:', clues);

  } catch (error) {
    console.error('❌ 解析证物信息失败:', error);
  }

  return { name, description, clues };
};

// 获取类别中文名称
const getCategoryName = (category: string): string => {
  const categoryMap: Record<string, string> = {
    'physical': '物理证物',
    'document': '文档资料',
    'digital': '数字证据',
    'testimony': '证词记录',
    'combination': '组合证物'
  };
  return categoryMap[category] || category;
};

// 获取重要程度中文名称
const getImportanceName = (importance: string): string => {
  const importanceMap: Record<string, string> = {
    'low': '一般',
    'medium': '重要',
    'high': '关键',
    'critical': '决定性'
  };
  return importanceMap[importance] || importance;
};

// 获取状态中文名称
const getStateName = (state: string): string => {
  const stateMap: Record<string, string> = {
    'hidden': '隐藏（需要调查发现）',
    'surface': '基础发现',
    'investigated': '已调查'
  };
  return stateMap[state] || state;
};

// 构建质检报告上下文
const buildQualityContext = (qualityReport: QualityCheckResult): string => {
  const { scores } = qualityReport;
  
  // 分析证物相关的质检问题
  const evidenceIssues = analyzeEvidenceIssues(qualityReport);
  
  let context = '\n【质检报告分析】\n';
  
  // 总体得分情况
  context += `当前剧本总分：${scores.totalScore}/125分\n`;
  
  if (scores.contentLogic.details.evidenceSystemIntegrity !== undefined) {
    context += `证物系统完整性得分：${scores.contentLogic.details.evidenceSystemIntegrity}/5分\n`;
  }
  
  if (scores.contentLogic.details.informationBalance !== undefined) {
    context += `信息价值均衡得分：${scores.contentLogic.details.informationBalance}/8分\n`;
  }
  
  if (scores.contentLogic.details.clueAccessibility !== undefined) {
    context += `线索获取路径得分：${scores.contentLogic.details.clueAccessibility}/12分\n`;
  }
  
  // 证物相关问题
  if (evidenceIssues.evidenceProblems.length > 0) {
    context += '\n【发现的证物问题】\n';
    evidenceIssues.evidenceProblems.forEach((problem, index) => {
      context += `${index + 1}. ${problem}\n`;
    });
  }
  
  // 证物相关建议
  if (evidenceIssues.evidenceRecommendations.length > 0) {
    context += '\n【质检建议】\n';
    evidenceIssues.evidenceRecommendations.forEach((recommendation, index) => {
      context += `${index + 1}. ${recommendation}\n`;
    });
  }
  
  // 缺失的证物类型分析
  if (evidenceIssues.missingCategories.length > 0) {
    context += `\n【建议补充的证物类型】\n${evidenceIssues.missingCategories.join('、')}\n`;
  }
  
  // 角色关联分析
  if (evidenceIssues.weakConnections.length > 0) {
    context += `\n【需要加强关联的角色】\n${evidenceIssues.weakConnections.join('、')}\n`;
  }
  
  context += '\n【针对性生成指导】\n';
  context += '请根据以上质检分析，生成能够有效提升剧本质量的证物。特别注意：\n';
  context += '- 优先补充缺失的证物类型\n';
  context += '- 加强与相关角色的逻辑关联\n';
  context += '- 提升证物的推理价值和获取路径的合理性\n';
  context += '- 避免重复现有证物的功能和价值\n';
  
  return context;
};

// 分析质检报告中的证物相关问题
const analyzeEvidenceIssues = (qualityReport: QualityCheckResult) => {
  const { issues, recommendations } = qualityReport;
  
  const result = {
    evidenceProblems: [] as string[],
    evidenceRecommendations: [] as string[],
    missingCategories: [] as string[],
    weakConnections: [] as string[],
    accessibilityProblems: [] as string[]
  };
  
  // 分析问题列表
  issues.forEach(issue => {
    if (issue.includes('证物') || issue.includes('证据') || issue.includes('物证')) {
      result.evidenceProblems.push(issue);
      
      // 分析缺失的证物类型
      if (issue.includes('缺少') || issue.includes('缺乏')) {
        if (issue.includes('物理证物') || issue.includes('实物')) {
          result.missingCategories.push('物理证物');
        }
        if (issue.includes('文档') || issue.includes('资料') || issue.includes('文件')) {
          result.missingCategories.push('文档资料');
        }
        if (issue.includes('数字') || issue.includes('电子') || issue.includes('手机') || issue.includes('监控')) {
          result.missingCategories.push('数字证据');
        }
        if (issue.includes('证词') || issue.includes('口供')) {
          result.missingCategories.push('证词记录');
        }
      }
      
      // 分析角色关联问题
      if (issue.includes('关联') || issue.includes('联系') || issue.includes('关系')) {
        // 尝试提取角色名称（简单匹配）
        const characters = issue.match(/[《「"]([^》」"]+)[》」"]/g);
        if (characters) {
          characters.forEach(char => {
            const name = char.replace(/[《「"》」"]/g, '');
            if (!result.weakConnections.includes(name)) {
              result.weakConnections.push(name);
            }
          });
        }
      }
      
      // 分析获取路径问题
      if (issue.includes('获取') || issue.includes('发现') || issue.includes('路径') || issue.includes('途径')) {
        result.accessibilityProblems.push(issue);
      }
    }
  });
  
  // 分析建议列表
  recommendations.forEach(recommendation => {
    if (recommendation.includes('证物') || recommendation.includes('证据') || recommendation.includes('物证')) {
      result.evidenceRecommendations.push(recommendation);
    }
  });
  
  // 去重
  result.missingCategories = Array.from(new Set(result.missingCategories));
  result.weakConnections = Array.from(new Set(result.weakConnections));
  
  return result;
};

// 智能推荐证物类型（基于现有证物分析）
export const recommendEvidenceTypes = (script: Script): string[] => {
  const existingCategories = new Set<string>();
  const existingImportance = new Set<string>();
  
  if (script.evidences) {
    script.evidences.forEach(evidence => {
      existingCategories.add(evidence.category);
      existingImportance.add(evidence.importance);
    });
  }
  
  const recommendations: string[] = [];
  
  // 基于缺失类型推荐
  const allCategories = ['physical', 'document', 'digital', 'testimony'];
  const missingCategories = allCategories.filter(cat => !existingCategories.has(cat));
  
  if (missingCategories.length > 0) {
    recommendations.push(`建议补充证物类型：${missingCategories.map(getCategoryName).join('、')}`);
  }
  
  // 基于重要程度分布推荐
  if (!existingImportance.has('critical')) {
    recommendations.push('建议添加决定性重要程度的关键证物');
  }
  
  if (!existingImportance.has('high')) {
    recommendations.push('建议添加关键重要程度的核心证物');
  }
  
  // 基于角色关联推荐
  if (script.characters && script.characters.length > 0) {
    const charactersWithEvidence = new Set<string>();
    script.evidences?.forEach(evidence => {
      (evidence.relatedCharacters || []).forEach(char => charactersWithEvidence.add(char));
    });
    
    const charactersWithoutEvidence = script.characters
      .filter(char => !charactersWithEvidence.has(char.name))
      .map(char => char.name);
    
    if (charactersWithoutEvidence.length > 0) {
      recommendations.push(`建议为以下角色添加相关证物：${charactersWithoutEvidence.join('、')}`);
    }
  }
  
  return recommendations;
};
