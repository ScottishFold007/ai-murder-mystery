from pydantic import BaseModel
from typing import Optional, List

class LLMMessage(BaseModel):
    role: str
    content: str


class Actor(BaseModel):
    name: str
    bio: str
    personality: str
    context: str
    secret: str
    violation: str
    messages: List[LLMMessage]
    isAssistant: Optional[bool] = False
    isPartner: Optional[bool] = False
    roleType: Optional[str] = None  # 角色类型：'玩家'、'搭档'、'凶手'、'嫌疑人'

class SafeActor(BaseModel):
    """安全的角色信息，不包含敏感信息"""
    name: str
    bio: str
    personality: str
    context: str
    messages: List[LLMMessage]
    isAssistant: Optional[bool] = False
    isPartner: Optional[bool] = False
    roleType: Optional[str] = None  # 角色类型：'玩家'、'搭档'、'凶手'、'嫌疑人'
    # 故意不包含 secret 和 violation 字段


class InvocationRequest(BaseModel):
    global_story: str
    actor: Actor
    session_id: str
    character_file_version: str
    detective_name: Optional[str] = "调查者"  # 侦探角色名称，默认值保持向后兼容
    victim_name: Optional[str] = "受害者"  # 受害者名称，默认值保持向后兼容
    all_actors: Optional[List[SafeActor]] = []  # 所有角色信息（安全版本），用于搭档角色分析
    temperature: Optional[float] = 0.7  # 温度参数，默认0.7适合对话，质检等结构化输出建议0.1


class InvocationResponse(BaseModel):
    original_response: str
    critique_response: str
    problems_detected: bool
    final_response: str
    refined_response: Optional[str]

