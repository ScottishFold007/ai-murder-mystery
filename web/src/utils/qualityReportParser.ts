// 质检报告解析工具
export interface QualityScore {
  totalScore: number;
  totalPossible: number;
  percentage: number;
  grade: 'excellent' | 'good' | 'fair' | 'poor';
  gradeText: string;
  breakdown: {
    contentLogic: number;
    aiExecution: number;
    playerExperience: number;
  };
  hasIssues: boolean;
  issueLevel: 'none' | 'minor' | 'major' | 'critical';
  summary: string;
}

// JSON格式的质检报告结构
interface QualityReportJSON {
  scriptTitle: string;
  timestamp: string;
  version: string;
  scores: {
    contentLogic: {
      score: number;
      maxScore: number;
      details: Record<string, string>;
    };
    aiExecution: {
      score: number;
      maxScore: number;
      details: Record<string, string>;
    };
    playerExperience: {
      score: number;
      maxScore: number;
      details: Record<string, string>;
    };
  };
  totalScore: number;
  totalMaxScore: number;
  percentage: number;
  grade: 'excellent' | 'good' | 'fair' | 'poor';
  gradeText: string;
  issues: {
    critical: string[];
    major: string[];
    minor: string[];
  };
  recommendations: Array<{
    priority: 'high' | 'medium' | 'low';
    category: string;
    description: string;
    solution: string;
  }>;
  summary: string;
  recommendationLevel: string;
}

/**
 * 增强的JSON修复函数 - 处理更多边缘情况
 */
function repairJSON(jsonString: string): string {
  try {
    // 先尝试直接解析
    JSON.parse(jsonString);
    return jsonString;
  } catch (e) {
    // 静默处理JSON解析失败，避免控制台噪音
    console.debug('JSON解析失败，尝试修复:', e);
    
    let repaired = jsonString.trim();
    
    // 1. 移除代码块标记
    repaired = repaired.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '');
    
    // 2. 处理多余的逗号问题
    repaired = repaired.replace(/,(\s*[}\]])/g, '$1'); // 移除对象和数组末尾的逗号
    
    // 3. 给未加引号的属性名加引号
    repaired = repaired.replace(/([{,]\s*)(\w+):/g, '$1"$2":');
    
    // 4. 单引号转双引号
    repaired = repaired.replace(/:\s*'([^']*)'/g, ': "$1"');
    
    // 5. 转义字符串中的特殊字符
    repaired = repaired.replace(/\n/g, '\\n').replace(/\r/g, '\\r').replace(/\t/g, '\\t');
    
    // 6. 处理不完整的对象结构 - 计算缺失的大括号
    const openBraces = (repaired.match(/\{/g) || []).length;
    const closeBraces = (repaired.match(/\}/g) || []).length;
    const missingCloseBraces = openBraces - closeBraces;
    
    if (missingCloseBraces > 0) {
      console.debug(`补充 ${missingCloseBraces} 个闭合大括号`);
      // 如果最后一个字符是逗号，先移除它
      if (repaired.trim().endsWith(',')) {
        repaired = repaired.trim().slice(0, -1);
      }
      repaired += '}' + '}'.repeat(missingCloseBraces - 1);
    }
    
    // 7. 处理不完整的数组结构
    const openBrackets = (repaired.match(/\[/g) || []).length;
    const closeBrackets = (repaired.match(/\]/g) || []).length;
    const missingCloseBrackets = openBrackets - closeBrackets;
    
    if (missingCloseBrackets > 0) {
      console.debug(`补充 ${missingCloseBrackets} 个闭合方括号`);
      repaired += ']'.repeat(missingCloseBrackets);
    }
    
    // 8. 处理特殊情况：playerExperience后面直接跟了其他字段
    // 检测是否存在这种模式: },"totalScore"
    repaired = repaired.replace(/(\}),(\s*"(?:totalScore|totalMaxScore|percentage|grade|gradeText|issues|recommendations|summary|recommendationLevel)":)/g, '$1\n  },$2');
    
    try {
      JSON.parse(repaired);
      console.debug('JSON修复成功');
      return repaired;
    } catch (e2) {
      console.debug('第一次修复失败，尝试更激进的修复:', e2);
      
      // 9. 更激进的修复：尝试修复scores对象结构
      repaired = repaired.replace(
        /("playerExperience"\s*:\s*\{[^}]*\}),(\s*"totalScore")/g, 
        '$1\n  },$2'
      );
      
      try {
        JSON.parse(repaired);
        console.debug('激进修复成功');
        return repaired;
      } catch (e3) {
        console.debug('JSON修复失败，返回原始字符串');
        return jsonString;
      }
    }
  }
}

/**
 * 解析JSON格式的质检报告 - 增强版本
 */
function parseJSONReport(reportText: string): QualityScore | null {
  if (!reportText?.trim()) {
    console.debug('报告文本为空');
    return null;
  }

  try {
    // 提取JSON内容（去除可能的前后缀）
    let jsonContent = reportText.trim();
    
    // 如果包含代码块标记，提取其中的内容
    const codeBlockMatch = jsonContent.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
    if (codeBlockMatch) {
      jsonContent = codeBlockMatch[1];
    }
    
    // 查找JSON对象的开始和结束
    const startIndex = jsonContent.indexOf('{');
    let lastIndex = jsonContent.lastIndexOf('}');
    
    if (startIndex !== -1 && lastIndex !== -1 && lastIndex > startIndex) {
      jsonContent = jsonContent.substring(startIndex, lastIndex + 1);
    } else if (startIndex !== -1) {
      // 如果只找到开始括号，取从开始到末尾
      jsonContent = jsonContent.substring(startIndex);
    }

    // 尝试修复和解析JSON
    const repairedJSON = repairJSON(jsonContent);
    
    let report: Partial<QualityReportJSON>;
    try {
      report = JSON.parse(repairedJSON);
    } catch (parseError) {
      console.debug('JSON解析失败，尝试部分解析:', parseError);
      // 如果解析失败，尝试使用部分解析
      report = parsePartialJSONReport(jsonContent);
    }

    // 安全地提取数据
    const totalScore = typeof report.totalScore === 'number' ? report.totalScore : 0;
    const totalPossible = typeof report.totalMaxScore === 'number' ? report.totalMaxScore : 100;
    const percentage = typeof report.percentage === 'number' ? report.percentage : 
      (totalPossible > 0 ? Math.round((totalScore / totalPossible) * 100) : 0);

    // 确定等级
    let grade: QualityScore['grade'] = 'poor';
    let gradeText = '不合格';
    
    if (report.grade && typeof report.grade === 'string') {
      grade = report.grade as QualityScore['grade'];
      gradeText = report.gradeText || getGradeText(grade);
    } else {
      // 根据百分比确定等级 - 基于120分总分的精细化评分标准
      if (percentage >= 90) {
        grade = 'excellent';
        gradeText = '优秀';
      } else if (percentage >= 80) {
        grade = 'good';
        gradeText = '良好';
      } else if (percentage >= 70) {
        grade = 'fair';
        gradeText = '合格';
      } else {
        grade = 'poor';
        gradeText = '不合格';
      }
    }

    // 确定问题等级 - 兼容新旧格式
    let issueLevel: QualityScore['issueLevel'] = 'none';
    let hasIssues = false;
    
    if (report.issues) {
      if (Array.isArray(report.issues)) {
        // 新格式：issues是数组
        const criticalIssues = report.issues.filter((issue: any) => issue.type === 'critical');
        const majorIssues = report.issues.filter((issue: any) => issue.type === 'major');
        const minorIssues = report.issues.filter((issue: any) => issue.type === 'minor');
        
        if (criticalIssues.length > 0) {
          issueLevel = 'critical';
          hasIssues = true;
        } else if (majorIssues.length > 0) {
          issueLevel = 'major';
          hasIssues = true;
        } else if (minorIssues.length > 0) {
          issueLevel = 'minor';
          hasIssues = true;
        }
      } else if (typeof report.issues === 'object') {
        // 旧格式：issues是对象
        const issues = report.issues as any;
        if (issues.critical?.length > 0) {
          issueLevel = 'critical';
          hasIssues = true;
        } else if (issues.major?.length > 0) {
          issueLevel = 'major';
          hasIssues = true;
        } else if (issues.minor?.length > 0) {
          issueLevel = 'minor';
          hasIssues = true;
        }
      }
    }

    return {
      totalScore,
      totalPossible,
      percentage,
      grade,
      gradeText,
      breakdown: {
        contentLogic: report.scores?.contentLogic?.score || 0,
        aiExecution: report.scores?.aiExecution?.score || 0,
        playerExperience: report.scores?.playerExperience?.score || 0
      },
      hasIssues,
      issueLevel,
      summary: report.summary || report.recommendationLevel || `${gradeText}剧本`
    };
  } catch (error) {
    console.error('解析JSON格式质检报告失败:', error);
    // 最后的回退：尝试从文本中提取基本信息
    return extractBasicInfoFromText(reportText);
  }
}

/**
 * 部分解析JSON报告 - 当完整解析失败时使用
 */
function parsePartialJSONReport(jsonText: string): Partial<QualityReportJSON> {
  const result: Partial<QualityReportJSON> = {};
  
  try {
    // 提取基础字段
    const titleMatch = jsonText.match(/"scriptTitle"\s*:\s*"([^"]+)"/);
    if (titleMatch) result.scriptTitle = titleMatch[1];
    
    const timestampMatch = jsonText.match(/"timestamp"\s*:\s*"([^"]+)"/);
    if (timestampMatch) result.timestamp = timestampMatch[1];
    
    const versionMatch = jsonText.match(/"version"\s*:\s*"([^"]+)"/);
    if (versionMatch) result.version = versionMatch[1];
    
    const totalScoreMatch = jsonText.match(/"totalScore"\s*:\s*(\d+)/);
    if (totalScoreMatch) result.totalScore = parseInt(totalScoreMatch[1]);
    
    const totalMaxScoreMatch = jsonText.match(/"totalMaxScore"\s*:\s*(\d+)/);
    if (totalMaxScoreMatch) result.totalMaxScore = parseInt(totalMaxScoreMatch[1]);
    
    const percentageMatch = jsonText.match(/"percentage"\s*:\s*(\d+)/);
    if (percentageMatch) result.percentage = parseInt(percentageMatch[1]);
    
    const gradeMatch = jsonText.match(/"grade"\s*:\s*"([^"]+)"/);
    if (gradeMatch) {
      const grade = gradeMatch[1] as 'excellent' | 'good' | 'fair' | 'poor';
      if (['excellent', 'good', 'fair', 'poor'].includes(grade)) {
        result.grade = grade;
      }
    }
    
    const gradeTextMatch = jsonText.match(/"gradeText"\s*:\s*"([^"]+)"/);
    if (gradeTextMatch) result.gradeText = gradeTextMatch[1];
    
    const summaryMatch = jsonText.match(/"summary"\s*:\s*"([^"]+)"/);
    if (summaryMatch) result.summary = summaryMatch[1];
    
    const recLevelMatch = jsonText.match(/"recommendationLevel"\s*:\s*"([^"]+)"/);
    if (recLevelMatch) result.recommendationLevel = recLevelMatch[1];
    
    // 尝试提取scores
    const scoresMatch = jsonText.match(/"scores"\s*:\s*\{([^}]+(?:\{[^}]*\}[^}]*)*)\}/);
    if (scoresMatch) {
      result.scores = {
        contentLogic: { score: 0, maxScore: 100, details: {} },
        aiExecution: { score: 0, maxScore: 100, details: {} },
        playerExperience: { score: 0, maxScore: 100, details: {} }
      };
      
      const contentLogicMatch = scoresMatch[1].match(/"contentLogic"\s*:\s*\{\s*"score"\s*:\s*(\d+)/);
      if (contentLogicMatch) {
        result.scores.contentLogic = { 
          score: parseInt(contentLogicMatch[1]), 
          maxScore: 100, 
          details: {} 
        };
      }
      
      const aiExecutionMatch = scoresMatch[1].match(/"aiExecution"\s*:\s*\{\s*"score"\s*:\s*(\d+)/);
      if (aiExecutionMatch) {
        result.scores.aiExecution = { 
          score: parseInt(aiExecutionMatch[1]), 
          maxScore: 100, 
          details: {} 
        };
      }
      
      const playerExpMatch = scoresMatch[1].match(/"playerExperience"\s*:\s*\{\s*"score"\s*:\s*(\d+)/);
      if (playerExpMatch) {
        result.scores.playerExperience = { 
          score: parseInt(playerExpMatch[1]), 
          maxScore: 100, 
          details: {} 
        };
      }
    }
    
  } catch (e) {
    console.debug('部分解析也失败:', e);
  }
  
  return result;
}

/**
 * 从纯文本中提取基本信息 - 最后的回退方案
 */
function extractBasicInfoFromText(text: string): QualityScore | null {
  try {
    // 尝试从文本中提取分数信息
    const scoreMatch = text.match(/(\d+)\/(\d+)/);
    const totalScore = scoreMatch ? parseInt(scoreMatch[1]) : 0;
    const totalPossible = scoreMatch ? parseInt(scoreMatch[2]) : 100;
    const percentage = totalPossible > 0 ? Math.round((totalScore / totalPossible) * 100) : 0;
    
    let grade: QualityScore['grade'] = 'poor';
    let gradeText = '不合格';
    
    if (percentage >= 90) {
      grade = 'excellent';
      gradeText = '优秀';
    } else if (percentage >= 80) {
      grade = 'good';
      gradeText = '良好';
    } else if (percentage >= 70) {
      grade = 'fair';
      gradeText = '合格';
    }
    
    return {
      totalScore,
      totalPossible,
      percentage,
      grade,
      gradeText,
      breakdown: {
        contentLogic: 0,
        aiExecution: 0,
        playerExperience: 0
      },
      hasIssues: text.includes('问题') || text.includes('缺陷'),
      issueLevel: text.includes('严重') ? 'critical' : text.includes('问题') ? 'major' : 'none',
      summary: '解析失败，显示基本信息'
    };
  } catch (e) {
    console.error('文本提取也失败:', e);
    return null;
  }
}

/**
 * 解析传统Markdown格式的质检报告（向后兼容）
 */
function parseMarkdownReport(reportText: string): QualityScore | null {
  if (!reportText) return null;

  try {
    // 提取总分 - 匹配 "总分: XX/100分" 或类似格式
    const totalScoreMatch = reportText.match(/总分[：:]\s*(\d+)\/(\d+)分/);
    const totalScore = totalScoreMatch ? parseInt(totalScoreMatch[1]) : 0;
    const totalPossible = totalScoreMatch ? parseInt(totalScoreMatch[2]) : 100;
    const percentage = totalPossible > 0 ? Math.round((totalScore / totalPossible) * 100) : 0;

    // 提取分项得分
    const contentLogicMatch = reportText.match(/内容逻辑层[：:]\s*(\d+)\/(\d+)分/);
    const aiExecutionMatch = reportText.match(/AI执行层[：:]\s*(\d+)\/(\d+)分/);
    const playerExperienceMatch = reportText.match(/玩家体验层[：:]\s*(\d+)\/(\d+)分/);

    const breakdown = {
      contentLogic: contentLogicMatch ? parseInt(contentLogicMatch[1]) : 0,
      aiExecution: aiExecutionMatch ? parseInt(aiExecutionMatch[1]) : 0,
      playerExperience: playerExperienceMatch ? parseInt(playerExperienceMatch[1]) : 0
    };

    // 确定等级
    let grade: QualityScore['grade'];
    let gradeText: string;
    
    if (percentage >= 90) {
      grade = 'excellent';
      gradeText = '优秀';
    } else if (percentage >= 80) {
      grade = 'good';
      gradeText = '良好';
    } else if (percentage >= 70) {
      grade = 'fair';
      gradeText = '合格';
    } else {
      grade = 'poor';
      gradeText = '不合格';
    }

    // 检查是否有严重问题
    let issueLevel: QualityScore['issueLevel'] = 'none';
    if (reportText.includes('严重缺陷')) {
      issueLevel = 'critical';
    } else if (reportText.includes('逻辑漏洞') && percentage >= 50) {
      issueLevel = 'major';
    } else if (reportText.includes('执行障碍') || (percentage < 70 && percentage >= 50)) {
      issueLevel = 'minor';
    } else if (percentage < 50) {
      issueLevel = 'major';
    }

    const hasIssues = issueLevel !== 'none';

    // 提取推荐等级作为摘要
    const recommendMatch = reportText.match(/推荐等级[：:]\s*([^。\n]+)/);
    const summary = recommendMatch ? recommendMatch[1].trim() : `${gradeText}剧本`;

    return {
      totalScore,
      totalPossible,
      percentage,
      grade,
      gradeText,
      breakdown,
      hasIssues,
      issueLevel,
      summary
    };
  } catch (error) {
    console.error('解析Markdown格式质检报告失败:', error);
    return null;
  }
}

/**
 * 解析质检报告文本，自动检测格式并提取评分信息
 */
export function parseQualityReport(reportText: string): QualityScore | null {
  if (!reportText) return null;

  // 先尝试解析JSON格式
  if (reportText.includes('{') && reportText.includes('}')) {
    const jsonResult = parseJSONReport(reportText);
    if (jsonResult) {
      return jsonResult;
    }
  }

  // 如果JSON解析失败，回退到Markdown格式解析
  return parseMarkdownReport(reportText);
}

/**
 * 根据等级获取中文描述 - 基于120分总分的精细化等级标准
 */
function getGradeText(grade: string): string {
  switch (grade) {
    case 'excellent': return '优秀';
    case 'good': return '良好';
    case 'fair': return '合格';
    case 'poor': return '不合格';
    default: return '未知';
  }
}

/**
 * 获取评分对应的颜色
 */
export function getScoreColor(score: QualityScore): string {
  switch (score.grade) {
    case 'excellent':
      return '#00C2FF'; // 极光蓝
    case 'good':
      return '#2196F3'; // 蓝色
    case 'fair':
      return '#FF9800'; // 橙色
    case 'poor':
      return '#F44336'; // 红色
    default:
      return '#9E9E9E'; // 灰色
  }
}

/**
 * 获取问题等级对应的颜色
 */
export function getIssueColor(issueLevel: QualityScore['issueLevel']): string {
  switch (issueLevel) {
    case 'critical':
      return '#F44336'; // 红色
    case 'major':
      return '#FF5722'; // 深橙色
    case 'minor':
      return '#FF9800'; // 橙色
    case 'none':
      return '#87CEEB'; // 天空蓝
    default:
      return '#9E9E9E'; // 灰色
  }
}

/**
 * 获取问题等级的文本描述
 */
export function getIssueLevelText(issueLevel: QualityScore['issueLevel']): string {
  switch (issueLevel) {
    case 'critical':
      return '严重问题';
    case 'major':
      return '主要问题';
    case 'minor':
      return '轻微问题';
    case 'none':
      return '无问题';
    default:
      return '未知';
  }
}