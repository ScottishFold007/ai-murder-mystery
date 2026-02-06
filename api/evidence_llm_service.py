"""
证物相关的AI服务模块
处理证物展示、分析和生成相关的AI调用
"""

from typing import Dict, Any, List, Tuple, Optional
import json
import re
from invoke_types import Actor, LLMMessage
# from llm_service import get_llm_service  # TODO: 实现这个函数

async def invoke_ai_for_evidence_presentation(
    evidence: Dict[str, Any],
    presented_to: str,
    presented_by: str,
    text_content: Optional[str] = None,
    presentation_context: Optional[str] = None,
    target_actor: Optional[Actor] = None,
    current_actor: Optional[Actor] = None
) -> Tuple[str, str, List[str], List[str]]:
    """
    向角色展示证物时的AI处理
    
    Args:
        evidence: 证物信息
        presented_to: 展示给谁
        presented_by: 谁展示的
        text_content: 可选的文字说明
        presentation_context: 展示上下文
        target_actor: 目标角色信息
        current_actor: 当前角色信息
    
    Returns:
        Tuple[ai_response, reaction_type, new_evidences, updated_info]
    """
    try:
        # 构建AI提示词
        prompt = build_evidence_presentation_prompt(
            evidence, presented_to, presented_by, text_content, presentation_context, target_actor
        )
        
        # 调用AI服务
        from llm_service import invoke_ai
        from db import pool
        
        # 获取数据库连接
        conn = pool.getconn()
        try:
            # 构建消息列表
            messages = [LLMMessage(role="user", content=prompt)]
            
            # 调用AI
            ai_response = invoke_ai(conn, 0, "用户", "助手", "", messages, temperature=0.7)
        finally:
            if conn:
                pool.putconn(conn)
        
        # 解析AI响应，确定反应类型和后续动作
        reaction_type, new_evidences, updated_info = parse_evidence_response(ai_response, evidence, presented_to)
        
        return ai_response, reaction_type, new_evidences, updated_info
        
    except Exception as e:
        print(f"❌ 证物展示AI调用失败: {str(e)}")
        # 返回默认响应
        return f"对于{evidence.get('name', '这个证物')}，我没有什么特别的想法。", "basic", [], []

def build_evidence_presentation_prompt(
    evidence: Dict[str, Any],
    presented_to: str,
    presented_by: str,
    text_content: Optional[str] = None,
    presentation_context: Optional[str] = None,
    target_actor: Optional[Actor] = None
) -> str:
    """构建证物展示的AI提示词"""
    
    # 基础证物信息
    evidence_info = f"""
【展示的证物】
名称：{evidence.get('name', '未知证物')}
类别：{evidence.get('category', 'physical')}
基础描述：{evidence.get('basicDescription', '')}
"""
    
    # 添加详细信息（如果已解锁）
    if evidence.get('detailedDescription') and evidence.get('unlockLevel', 1) >= 2:
        evidence_info += f"专业分析：{evidence['detailedDescription']}\n"
    
    if evidence.get('deepDescription') and evidence.get('unlockLevel', 1) >= 3:
        evidence_info += f"深度发现：{evidence['deepDescription']}\n"
    
    # 重要程度
    importance_map = {
        'low': '一般',
        'medium': '重要', 
        'high': '关键',
        'critical': '决定性'
    }
    evidence_info += f"重要程度：{importance_map.get(evidence.get('importance', 'medium'), '重要')}\n"
    
    # 相关角色
    if evidence.get('relatedActors'):
        evidence_info += f"相关角色：{', '.join(evidence['relatedActors'])}\n"
    
    # 构建对话情境
    dialogue_context = f"""
【对话情境】
{presented_by}正在向{presented_to}展示证物。
"""
    
    if text_content:
        dialogue_context += f"展示时说：{text_content}\n"
    
    if presentation_context:
        dialogue_context += f"对话背景：{presentation_context}\n"
    
    # 角色指导（如果有目标角色信息）
    role_guidance = ""
    if target_actor:
        role_guidance = f"""
【你的角色设定】
你是{target_actor.name}。
背景：{target_actor.bio}
性格：{target_actor.personality}
当前状态：{target_actor.context}
秘密信息：{target_actor.secret}
行为限制：{target_actor.violation}
"""
    
    # 根据角色类型调整反应指导
    reaction_guidance = """
【反应指导】
请根据你的角色设定和这个证物的相关性做出合理反应：

1. 如果这个证物与你无关或者你确实不了解：
   - 给出诚实的回应，如"我没见过这个"、"这跟我没关系"
   - 保持角色一致性

2. 如果这个证物与你有关但不构成威胁：
   - 可以提供一些你知道的信息
   - 保持合作态度，但不要透露敏感信息

3. 如果这个证物对你的秘密构成威胁：
   - 表现出紧张、回避或防御的情绪
   - 尝试转移话题或给出模糊的回答
   - 严格遵守你的违规限制，不能直接承认敏感信息

4. 如果这是决定性证据且你无法再隐瞒：
   - 表现出情绪崩溃或愤怒
   - 可能被迫透露一些重要信息
   - 仍然要符合角色性格特点

【回应要求】
- 保持角色的性格特征和说话方式
- 不要直接违反你的违规限制
- 根据证物的重要程度调整反应强度
- 如果证物确实相关，可以在合理范围内提供新信息
- 避免过于配合或过于防御，保持真实感
"""
    
    # 特殊角色类型的额外指导
    if target_actor:
        if target_actor.isKiller:
            reaction_guidance += """
【凶手特殊指导】
- 绝对不能直接承认犯罪行为
- 对威胁性证物要表现出更强的防御性
- 可以表现出愤怒或试图反驳
- 在极端压力下可能泄露部分信息，但要保持最后的底线
"""
        elif target_actor.isPartner or target_actor.isAssistant:
            reaction_guidance += """
【搭档特殊指导】
- 以专业、客观的态度分析证物
- 可以提供技术性的见解和建议
- 帮助发现证物的重要性和线索价值
- 建议下一步的调查方向
"""
    
    # 组合完整提示词
    full_prompt = f"""
{evidence_info}

{dialogue_context}

{role_guidance}

{reaction_guidance}

请现在做出你的回应。记住要符合角色设定，不要泄露不应该知道的信息。
"""
    
    return full_prompt

def parse_evidence_response(
    ai_response: str,
    evidence: Dict[str, Any],
    presented_to: str
) -> Tuple[str, List[str], List[str]]:
    """
    解析AI响应，确定反应类型和后续动作
    
    Returns:
        Tuple[reaction_type, new_evidences, updated_info]
    """
    
    # 分析响应的情绪强度和内容，确定反应类型
    reaction_type = "basic"
    new_evidences = []
    updated_info = []
    
    # 检查响应中的情绪词汇和强度
    nervous_words = ["紧张", "不安", "心慌", "害怕", "担心", "焦虑"]
    angry_words = ["愤怒", "生气", "恼火", "气愤", "暴怒", "愤恨"]
    defensive_words = ["否认", "不是", "绝对没有", "怎么可能", "不关我事", "冤枉"]
    breakdown_words = ["崩溃", "受不了", "我承认", "好吧", "是的", "没错"]
    
    response_lower = ai_response.lower()
    
    # 统计情绪词汇出现次数
    nervous_count = sum(1 for word in nervous_words if word in ai_response)
    angry_count = sum(1 for word in angry_words if word in ai_response)
    defensive_count = sum(1 for word in defensive_words if word in ai_response)
    breakdown_count = sum(1 for word in breakdown_words if word in ai_response)
    
    # 根据词汇统计和响应长度判断反应类型
    if breakdown_count >= 2 or ("承认" in ai_response and "是的" in ai_response):
        reaction_type = "breakthrough"
        # 突破性反应可能解锁新信息
        if evidence.get('importance') in ['high', 'critical']:
            updated_info.append(f"{presented_to}的重要供词")
    elif (nervous_count + angry_count + defensive_count) >= 2 or len(ai_response) > 100:
        reaction_type = "contradiction"
        # 矛盾反应可能升级证物信息
        if evidence.get('unlockLevel', 1) < 2:
            updated_info.append(f"从{presented_to}的反应中获得新线索")
    else:
        reaction_type = "basic"
    
    # 检查是否提到了新的人名、地点或物品（可能的新证物）
    potential_evidences = extract_potential_evidences(ai_response)
    new_evidences.extend(potential_evidences)
    
    return reaction_type, new_evidences, updated_info

def extract_potential_evidences(text: str) -> List[str]:
    """从AI响应中提取可能的新证物"""
    potential_evidences = []
    
    # 寻找提到的物品
    item_patterns = [
        r"那个([^，。！？\s]+)",
        r"一个([^，。！？\s]+)",
        r"这个([^，。！？\s]+)",
        r"([^，。！？\s]*刀[^，。！？\s]*)",
        r"([^，。！？\s]*枪[^，。！？\s]*)",
        r"([^，。！？\s]*信[^，。！？\s]*)",
        r"([^，。！？\s]*照片[^，。！？\s]*)",
        r"([^，。！？\s]*文件[^，。！？\s]*)",
        r"([^，。！？\s]*钥匙[^，。！？\s]*)",
        r"([^，。！？\s]*手机[^，。！？\s]*)",
    ]
    
    for pattern in item_patterns:
        matches = re.findall(pattern, text)
        for match in matches:
            if len(match) >= 2 and len(match) <= 10:  # 过滤掉过短或过长的匹配
                potential_evidences.append(match)
    
    # 去重并限制数量
    potential_evidences = list(set(potential_evidences))[:3]
    
    return potential_evidences

async def generate_evidence_analysis(
    evidence: Dict[str, Any],
    analyzer: str = "搭档",
    additional_context: Optional[str] = None
) -> str:
    """
    为证物生成专业分析
    
    Args:
        evidence: 证物信息
        analyzer: 分析者（搭档角色名称）
        additional_context: 额外上下文信息
    
    Returns:
        专业分析内容
    """
    try:
        prompt = f"""
【证物分析任务】
你是{analyzer}，一位经验丰富的调查专家。请对以下证物进行专业分析。

【证物信息】
名称：{evidence.get('name', '未知证物')}
类别：{evidence.get('category', 'physical')}
基础描述：{evidence.get('basicDescription', '')}
重要程度：{evidence.get('importance', 'medium')}

{f"额外信息：{additional_context}" if additional_context else ""}

【分析要求】
请从以下角度进行专业分析：
1. 技术细节分析（如材质、工艺、时间等）
2. 与案件的关联性
3. 可能的来源和用途
4. 需要进一步调查的方向
5. 与其他证物的潜在关联

【输出格式】
请提供简洁但专业的分析，长度控制在100-200字之间。
重点突出对案件调查有价值的信息。
"""
        
        llm_service = get_llm_service()
        messages = [LLMMessage(role="user", content=prompt)]
        
        analysis = await llm_service.invoke(messages)
        return analysis.strip()
        
    except Exception as e:
        print(f"❌ 证物分析生成失败: {str(e)}")
        return f"根据初步观察，{evidence.get('name', '这个证物')}需要进一步的专业检验和分析。"

async def generate_evidence_combination_result(
    evidence1: Dict[str, Any],
    evidence2: Dict[str, Any]
) -> Dict[str, Any]:
    """
    生成证物组合的结果
    
    Args:
        evidence1: 第一个证物
        evidence2: 第二个证物
    
    Returns:
        组合结果字典，包含名称、描述等
    """
    try:
        prompt = f"""
【证物组合分析】
请分析以下两个证物的组合可能性和结果：

【证物1】
名称：{evidence1.get('name', '未知证物')}
描述：{evidence1.get('basicDescription', '')}
类别：{evidence1.get('category', 'physical')}

【证物2】
名称：{evidence2.get('name', '未知证物')}
描述：{evidence2.get('basicDescription', '')}
类别：{evidence2.get('category', 'physical')}

【分析要求】
1. 这两个证物是否存在逻辑关联？
2. 组合后能发现什么新线索？
3. 给组合证物起一个合适的名称
4. 描述组合后的发现（50-100字）

【输出格式】
请以JSON格式返回：
{
  "canCombine": true/false,
  "combinedName": "组合证物名称",
  "combinedDescription": "组合发现的描述",
  "importance": "low/medium/high/critical",
  "newInsights": ["新发现1", "新发现2"]
}
"""
        
        llm_service = get_llm_service()
        messages = [LLMMessage(role="user", content=prompt)]
        
        response = await llm_service.invoke(messages)
        
        # 尝试解析JSON响应
        try:
            result = json.loads(response)
            return result
        except json.JSONDecodeError:
            # 如果解析失败，返回默认结果
            return {
                "canCombine": False,
                "combinedName": f"{evidence1.get('name', '')} + {evidence2.get('name', '')}",
                "combinedDescription": "通过对比分析，发现了这两个证物之间的关联。",
                "importance": "medium",
                "newInsights": ["需要进一步分析证物间的关联性"]
            }
            
    except Exception as e:
        print(f"❌ 证物组合分析失败: {str(e)}")
        return {
            "canCombine": False,
            "combinedName": "组合分析",
            "combinedDescription": "证物组合分析出现问题，需要重新检查。",
            "importance": "low",
            "newInsights": []
        }

async def generate_evidence_hint(
    session_context: Dict[str, Any],
    stuck_duration: int,
    current_phase: str = "investigation"
) -> Optional[Dict[str, Any]]:
    """
    生成证物相关的提示
    
    Args:
        session_context: 会话上下文，包含已发现证物、进度等
        stuck_duration: 卡关时间（分钟）
        current_phase: 当前游戏阶段
    
    Returns:
        提示信息字典或None
    """
    if stuck_duration < 10:  # 10分钟内不提示
        return None
    
    try:
        # 分析当前进度和可能的问题
        evidences = session_context.get('evidences', [])
        presented_evidences = session_context.get('presentedEvidences', {})
        
        prompt = f"""
【提示生成任务】
玩家已经卡关{stuck_duration}分钟，请分析当前情况并生成合适的提示。

【当前情况】
游戏阶段：{current_phase}
已发现证物数量：{len(evidences)}
已出示证物记录：{len(presented_evidences)}

【证物信息】
{json.dumps([e.get('name', '') for e in evidences], ensure_ascii=False)}

【提示要求】
根据卡关时间提供不同强度的提示：
- 10-15分钟：模糊提示，引导方向
- 15-25分钟：具体提示，指出可能遗漏的证物或组合
- 25分钟以上：明确提示，指出下一步行动

请生成一个有用但不直接暴露答案的提示。

【输出格式】
请以JSON格式返回：
{
  "type": "evidence/presentation/combination/investigation",
  "urgency": "low/medium/high",
  "message": "提示内容",
  "suggestedActions": ["建议行动1", "建议行动2"],
  "relatedEvidences": ["相关证物1", "相关证物2"]
}
"""
        
        llm_service = get_llm_service()
        messages = [LLMMessage(role="user", content=prompt)]
        
        response = await llm_service.invoke(messages)
        
        try:
            hint = json.loads(response)
            return hint
        except json.JSONDecodeError:
            return None
            
    except Exception as e:
        print(f"❌ 证物提示生成失败: {str(e)}")
        return None
