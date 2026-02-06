/**
 * 流式JSON解析器 - 支持增量解析不完整的JSON
 */

export interface ParsedQualityReport {
  scriptTitle?: string;
  timestamp?: string;
  version?: string;
  totalScore?: number;
  totalMaxScore?: number;
  percentage?: number;
  grade?: string;
  gradeText?: string;
  scores?: {
    contentLogic?: {
      score?: number;
      details?: Record<string, any>;
    };
    aiExecution?: {
      score?: number;
      details?: Record<string, any>;
    };
    playerExperience?: {
      score?: number;
      details?: Record<string, any>;
    };
  };
  issues?: {
    critical?: Array<{
      code?: string;
      description?: string;
    }>;
    major?: Array<{
      code?: string;
      description?: string;
    }>;
    minor?: Array<{
      code?: string;
      description?: string;
    }>;
  };
  recommendations?: Array<{
    priority?: string;
    category?: string;
    description?: string;
    solution?: string;
  }>;
  summary?: string;
  recommendationLevel?: string;
}

export interface EvaluationProgress {
  basicInfo: 'pending' | 'processing' | 'completed';
  contentLogic: 'pending' | 'processing' | 'completed';
  aiExecution: 'pending' | 'processing' | 'completed';
  playerExperience: 'pending' | 'processing' | 'completed';
  recommendations: 'pending' | 'processing' | 'completed';
  summary: 'pending' | 'processing' | 'completed';
}

/**
 * 修复截断的JSON字符串 - 增强版本
 */
const repairTruncatedJson = (jsonText: string): string => {
  let repaired = jsonText.trim();
  
  // 移除代码块标记
  repaired = repaired.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '');
  
  // 处理多余的逗号
  repaired = repaired.replace(/,(\s*[}\]])/g, '$1');
  
  // 如果JSON没有以}结尾，尝试补全
  if (!repaired.endsWith('}')) {
    // 计算需要补全的大括号和方括号数量
    let openBraces = 0;
    let closeBraces = 0;
    let openBrackets = 0;
    let closeBrackets = 0;
    let inString = false;
    let escaped = false;
    
    for (let i = 0; i < repaired.length; i++) {
      const char = repaired[i];
      
      if (escaped) {
        escaped = false;
        continue;
      }
      
      if (char === '\\') {
        escaped = true;
        continue;
      }
      
      if (char === '"') {
        inString = !inString;
        continue;
      }
      
      if (!inString) {
        if (char === '{') openBraces++;
        if (char === '}') closeBraces++;
        if (char === '[') openBrackets++;
        if (char === ']') closeBrackets++;
      }
    }
    
    // 补全缺失的括号
    const missingBraces = openBraces - closeBraces;
    const missingBrackets = openBrackets - closeBrackets;
    
    if (missingBraces > 0 || missingBrackets > 0) {
      // 如果最后一个字符是逗号，先移除它
      if (repaired.trim().endsWith(',')) {
        repaired = repaired.trim().slice(0, -1);
      }
      
      // 先补全方括号，再补全大括号
      if (missingBrackets > 0) {
        repaired += ']'.repeat(missingBrackets);
        console.log(`Added ${missingBrackets} closing brackets to repair JSON`);
      }
      
      if (missingBraces > 0) {
        repaired += '}' + '}'.repeat(missingBraces - 1);
        console.log(`Added ${missingBraces} closing braces to repair JSON`);
      }
    }
  }
  
  // 处理特殊情况：scores对象结构问题
  repaired = repaired.replace(
    /("playerExperience"\s*:\s*\{[^}]*\}),(\s*"(?:totalScore|totalMaxScore|percentage|grade|gradeText|issues|recommendations|summary|recommendationLevel)":)/g,
    '$1\n  },$2'
  );
  
  return repaired;
};

/**
 * 尝试解析不完整的JSON流 - 增强版本
 */
export const parseStreamingJson = (jsonText: string): ParsedQualityReport => {
  if (!jsonText?.trim()) return {};

  // 预处理：移除可能的代码块标记
  let cleanedText = jsonText.trim();
  const codeBlockMatch = cleanedText.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
  if (codeBlockMatch) {
    cleanedText = codeBlockMatch[1];
  }

  // 调试日志 (开发模式)
  if (process.env.NODE_ENV === 'development') {
    console.log('Parsing JSON text length:', cleanedText.length);
    console.log('JSON text preview:', cleanedText.substring(0, 200) + '...');
    console.log('JSON text ending:', cleanedText.substring(Math.max(0, cleanedText.length - 100)));
  }

  // 第一步：尝试直接解析完整JSON
  try {
    const result = JSON.parse(cleanedText);
    if (process.env.NODE_ENV === 'development') {
      console.log('Direct JSON parse successful');
    }
    return result;
  } catch (e) {
    if (process.env.NODE_ENV === 'development') {
      console.log('Direct JSON parse failed:', e);
    }
  }

  // 第二步：尝试修复截断的JSON
  try {
    const repairedJson = repairTruncatedJson(cleanedText);
    if (repairedJson !== cleanedText) {
      console.log('Attempting to parse repaired JSON...');
      const result = JSON.parse(repairedJson);
      console.log('Repaired JSON parse successful!');
      return result;
    }
  } catch (repairError) {
    console.log('JSON repair failed:', repairError);
  }

  // 第三步：尝试使用外部修复库
  try {
    const jsonrepair = (window as any).jsonrepair;
    if (jsonrepair) {
      const repairedJson = jsonrepair(cleanedText);
      if (process.env.NODE_ENV === 'development') {
        console.log('JSON repair library successful');
      }
      return JSON.parse(repairedJson);
    }
  } catch (repairError) {
    console.log('External repair library failed:', repairError);
  }

  // 第四步：部分解析
  if (process.env.NODE_ENV === 'development') {
    console.log('Using partial JSON parsing');
  }
  
  try {
    return parsePartialJson(cleanedText);
  } catch (partialError) {
    console.warn('Partial JSON parsing also failed:', partialError);
    // 返回一个最基本的结构，避免完全失败
    return {
      scriptTitle: extractFieldValue(cleanedText, 'scriptTitle'),
      totalScore: extractNumericValue(cleanedText, 'totalScore'),
      totalMaxScore: extractNumericValue(cleanedText, 'totalMaxScore'),
      percentage: extractNumericValue(cleanedText, 'percentage'),
      grade: extractFieldValue(cleanedText, 'grade'),
      gradeText: extractFieldValue(cleanedText, 'gradeText')
    };
  }
};

/**
 * 从文本中提取字段值的辅助函数
 */
const extractFieldValue = (text: string, fieldName: string): string | undefined => {
  const match = text.match(new RegExp(`"${fieldName}"\\s*:\\s*"([^"]*)"`, 'i'));
  return match ? match[1] : undefined;
};

/**
 * 从文本中提取数字值的辅助函数
 */
const extractNumericValue = (text: string, fieldName: string): number | undefined => {
  const match = text.match(new RegExp(`"${fieldName}"\\s*:\\s*(\\d+(?:\\.\\d+)?)`, 'i'));
  return match ? parseFloat(match[1]) : undefined;
};

/**
 * 部分解析JSON - 提取已完成的字段
 */
const parsePartialJson = (jsonText: string): ParsedQualityReport => {
  const result: ParsedQualityReport = {};
  
  try {
    // 提取基础字段 - 改进正则表达式，处理字符串和数字
    const basicFields = ['scriptTitle', 'timestamp', 'version', 'totalScore', 'totalMaxScore', 'percentage', 'grade', 'gradeText'];
    
    basicFields.forEach(field => {
      // 匹配字符串值
      const stringRegex = new RegExp(`"${field}"\\s*:\\s*"([^"]*)"`, 'i');
      const stringMatch = jsonText.match(stringRegex);
      if (stringMatch) {
        (result as any)[field] = stringMatch[1];
        return;
      }
      
      // 匹配数字值
      const numberRegex = new RegExp(`"${field}"\\s*:\\s*(\\d+(?:\\.\\d+)?)`, 'i');
      const numberMatch = jsonText.match(numberRegex);
      if (numberMatch) {
        (result as any)[field] = parseFloat(numberMatch[1]);
        return;
      }
    });

    // 提取scores对象 - 改进解析逻辑
    result.scores = {};
    
    // 分别解析每个评分层级
    const scoreCategories = ['contentLogic', 'aiExecution', 'playerExperience'];
    
    scoreCategories.forEach(category => {
      const categoryStart = jsonText.indexOf(`"${category}"`);
      if (categoryStart !== -1) {
        try {
          // 找到该类别对象的开始位置
          const colonIndex = jsonText.indexOf(':', categoryStart);
          const openBraceIndex = jsonText.indexOf('{', colonIndex);
          
          if (openBraceIndex !== -1) {
            // 使用括号匹配来找到完整的对象
            let braceCount = 0;
            let endIndex = openBraceIndex;
            let foundComplete = false;
            
            for (let i = openBraceIndex; i < jsonText.length; i++) {
              if (jsonText[i] === '{') braceCount++;
              if (jsonText[i] === '}') braceCount--;
              if (braceCount === 0) {
                endIndex = i;
                foundComplete = true;
                break;
              }
            }
            
            if (foundComplete) {
              const categoryText = jsonText.substring(openBraceIndex, endIndex + 1);
              console.log(`Extracted ${category} text:`, categoryText);
              (result.scores as any)[category] = JSON.parse(categoryText);
            } else {
              // 如果对象不完整，尝试部分解析
              console.log(`${category} object incomplete, attempting partial parse`);
              const partialText = jsonText.substring(openBraceIndex);
              (result.scores as any)[category] = parsePartialCategoryScore(partialText, category);
            }
          }
        } catch (e) {
          console.log(`${category} extraction failed:`, e);
          // 回退到正则匹配
          const categoryRegex = new RegExp(`"${category}"\\s*:\\s*\\{([^}]+(?:\\{[^}]*\\}[^}]*)*)\\}`, 's');
          const categoryMatch = jsonText.match(categoryRegex);
          if (categoryMatch) {
            try {
              const categoryText = `{${categoryMatch[1]}}`;
              (result.scores as any)[category] = JSON.parse(categoryText);
            } catch (e2) {
              console.log(`Regex parse failed for ${category}, using partial parser`);
              (result.scores as any)[category] = parsePartialCategoryScore(categoryMatch[1], category);
            }
          }
        }
      }
    });

    // 提取summary
    const summaryMatch = jsonText.match(/"summary"\s*:\s*"([^"]+)"/);
    if (summaryMatch) {
      result.summary = summaryMatch[1];
    }

    // 提取recommendationLevel
    const recLevelMatch = jsonText.match(/"recommendationLevel"\s*:\s*"([^"]+)"/);
    if (recLevelMatch) {
      result.recommendationLevel = recLevelMatch[1];
    }

    // 提取issues对象
    const issuesStart = jsonText.indexOf('"issues"');
    if (issuesStart !== -1) {
      try {
        const colonIndex = jsonText.indexOf(':', issuesStart);
        const openBraceIndex = jsonText.indexOf('{', colonIndex);
        
        if (openBraceIndex !== -1) {
          let braceCount = 0;
          let endIndex = openBraceIndex;
          
          for (let i = openBraceIndex; i < jsonText.length; i++) {
            if (jsonText[i] === '{') braceCount++;
            if (jsonText[i] === '}') braceCount--;
            if (braceCount === 0) {
              endIndex = i;
              break;
            }
          }
          
          const issuesText = jsonText.substring(openBraceIndex, endIndex + 1);
          console.log('Extracted issues text:', issuesText);
          result.issues = JSON.parse(issuesText);
        }
      } catch (e) {
        console.log('Issues extraction failed:', e);
      }
    }

    // 提取recommendations数组
    const recsStart = jsonText.indexOf('"recommendations"');
    if (recsStart !== -1) {
      try {
        const colonIndex = jsonText.indexOf(':', recsStart);
        const openBracketIndex = jsonText.indexOf('[', colonIndex);
        
        if (openBracketIndex !== -1) {
          let bracketCount = 0;
          let braceCount = 0;
          let endIndex = openBracketIndex;
          
          for (let i = openBracketIndex; i < jsonText.length; i++) {
            if (jsonText[i] === '[') bracketCount++;
            if (jsonText[i] === ']') bracketCount--;
            if (jsonText[i] === '{') braceCount++;
            if (jsonText[i] === '}') braceCount--;
            
            if (bracketCount === 0 && braceCount === 0) {
              endIndex = i;
              break;
            }
          }
          
          const recsText = jsonText.substring(openBracketIndex, endIndex + 1);
          console.log('Extracted recommendations text:', recsText);
          result.recommendations = JSON.parse(recsText);
        }
      } catch (e) {
        console.log('Recommendations extraction failed:', e);
      }
    }

  } catch (e) {
    console.warn('Partial JSON parsing failed:', e);
  }

  return result;
};

/**
 * 解析单个评分类别的不完整JSON
 */
const parsePartialCategoryScore = (categoryText: string, categoryName: string): any => {
  const result: any = {};
  
  try {
    // 提取score字段
    const scoreMatch = categoryText.match(/"score"\s*:\s*(\d+(?:\.\d+)?)/);
    if (scoreMatch) {
      result.score = parseFloat(scoreMatch[1]);
    }
    
    // 提取details对象
    const detailsStart = categoryText.indexOf('"details"');
    if (detailsStart !== -1) {
      try {
        const colonIndex = categoryText.indexOf(':', detailsStart);
        const openBraceIndex = categoryText.indexOf('{', colonIndex);
        
        if (openBraceIndex !== -1) {
          let braceCount = 0;
          let endIndex = openBraceIndex;
          let foundComplete = false;
          
          for (let i = openBraceIndex; i < categoryText.length; i++) {
            if (categoryText[i] === '{') braceCount++;
            if (categoryText[i] === '}') braceCount--;
            if (braceCount === 0) {
              endIndex = i;
              foundComplete = true;
              break;
            }
          }
          
          if (foundComplete) {
            const detailsText = categoryText.substring(openBraceIndex, endIndex + 1);
            result.details = JSON.parse(detailsText);
          } else {
            // 部分解析details
            result.details = parsePartialDetails(categoryText.substring(openBraceIndex));
          }
        }
      } catch (e) {
        console.log(`Details extraction failed for ${categoryName}:`, e);
        // 尝试正则匹配details中的字段
        result.details = parsePartialDetails(categoryText);
      }
    }
  } catch (e) {
    console.log(`Partial category score parsing failed for ${categoryName}:`, e);
  }
  
  return result;
};

/**
 * 解析不完整的details对象
 */
const parsePartialDetails = (detailsText: string): Record<string, any> => {
  const details: Record<string, any> = {};
  
  // 匹配所有的键值对
  const fieldRegex = /"(\w+)"\s*:\s*(\d+(?:\.\d+)?)/g;
  let match;
  
  while ((match = fieldRegex.exec(detailsText)) !== null) {
    const [, key, value] = match;
    details[key] = parseFloat(value);
  }
  
  return details;
};

/**
 * 部分解析scores对象
 */
const parsePartialScores = (scoresText: string): ParsedQualityReport['scores'] => {
  const scores: ParsedQualityReport['scores'] = {};

  // 解析contentLogic
  const contentLogicMatch = scoresText.match(/"contentLogic"\s*:\s*\{([^}]+(?:\{[^}]*\}[^}]*)*)\}/);
  if (contentLogicMatch) {
    try {
      scores.contentLogic = JSON.parse(`{${contentLogicMatch[1]}}`);
    } catch (e) {
      // 提取score字段
      const scoreMatch = contentLogicMatch[1].match(/"score"\s*:\s*(\d+)/);
      if (scoreMatch) {
        scores.contentLogic = { score: parseInt(scoreMatch[1]) };
      }
    }
  }

  // 解析aiExecution
  const aiExecutionMatch = scoresText.match(/"aiExecution"\s*:\s*\{([^}]+(?:\{[^}]*\}[^}]*)*)\}/);
  if (aiExecutionMatch) {
    try {
      scores.aiExecution = JSON.parse(`{${aiExecutionMatch[1]}}`);
    } catch (e) {
      const scoreMatch = aiExecutionMatch[1].match(/"score"\s*:\s*(\d+)/);
      if (scoreMatch) {
        scores.aiExecution = { score: parseInt(scoreMatch[1]) };
      }
    }
  }

  // 解析playerExperience
  const playerExpMatch = scoresText.match(/"playerExperience"\s*:\s*\{([^}]+(?:\{[^}]*\}[^}]*)*)\}/);
  if (playerExpMatch) {
    try {
      scores.playerExperience = JSON.parse(`{${playerExpMatch[1]}}`);
    } catch (e) {
      const scoreMatch = playerExpMatch[1].match(/"score"\s*:\s*(\d+)/);
      if (scoreMatch) {
        scores.playerExperience = { score: parseInt(scoreMatch[1]) };
      }
    }
  }

  return scores;
};

/**
 * 分析评估进度
 */
export const analyzeProgress = (report: ParsedQualityReport): EvaluationProgress => {
  const progress: EvaluationProgress = {
    basicInfo: 'pending',
    contentLogic: 'pending',
    aiExecution: 'pending',
    playerExperience: 'pending',
    recommendations: 'pending',
    summary: 'pending'
  };

  // 基础信息 - 放宽条件，只需要标题即可
  if (report.scriptTitle && (report.timestamp || report.version)) {
    progress.basicInfo = 'completed';
  } else if (report.scriptTitle) {
    progress.basicInfo = 'processing';
  }

  // 内容逻辑评估 - 有分数即可认为完成，details是可选的
  if (report.scores?.contentLogic?.score !== undefined) {
    // 检查是否有足够的details字段（至少5个）
    const detailsCount = report.scores.contentLogic.details ? 
      Object.keys(report.scores.contentLogic.details).length : 0;
    if (detailsCount >= 5) {
      progress.contentLogic = 'completed';
    } else if (detailsCount > 0 || report.scores.contentLogic.score > 0) {
      progress.contentLogic = 'processing';
    } else {
      progress.contentLogic = 'completed'; // 有分数就算完成
    }
  }

  // AI执行评估 - 有分数即可
  if (report.scores?.aiExecution?.score !== undefined) {
    const detailsCount = report.scores.aiExecution.details ? 
      Object.keys(report.scores.aiExecution.details).length : 0;
    if (detailsCount >= 3) {
      progress.aiExecution = 'completed';
    } else if (detailsCount > 0) {
      progress.aiExecution = 'processing';
    } else {
      progress.aiExecution = 'completed'; // 有分数就算完成
    }
  }

  // 玩家体验评估 - 有分数即可
  if (report.scores?.playerExperience?.score !== undefined) {
    const detailsCount = report.scores.playerExperience.details ? 
      Object.keys(report.scores.playerExperience.details).length : 0;
    if (detailsCount >= 2) {
      progress.playerExperience = 'completed';
    } else if (detailsCount > 0) {
      progress.playerExperience = 'processing';
    } else {
      progress.playerExperience = 'completed'; // 有分数就算完成
    }
  }

  // 改进建议 - 有数组即可，允许空数组
  if (report.recommendations !== undefined) {
    progress.recommendations = 'completed';
  }

  // 总结 - 有summary或recommendationLevel任一即可
  if (report.summary || report.recommendationLevel) {
    progress.summary = 'completed';
  }

  return progress;
};

/**
 * 获取总体进度百分比
 */
export const getOverallProgress = (progress: EvaluationProgress): number => {
  const stages = Object.values(progress);
  const completed = stages.filter(stage => stage === 'completed').length;
  const processing = stages.filter(stage => stage === 'processing').length;
  
  return Math.round(((completed + processing * 0.5) / stages.length) * 100);
};
