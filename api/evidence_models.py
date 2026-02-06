from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, ForeignKey, Float, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime
import json

Base = declarative_base()

class EvidenceRecord(Base):
    __tablename__ = 'evidences'
    
    id = Column(String, primary_key=True)
    script_id = Column(String, ForeignKey('scripts.id'), nullable=False)
    session_id = Column(String, nullable=False)
    
    # 基础信息
    name = Column(String, nullable=False)
    basic_description = Column(Text, nullable=False)
    detailed_description = Column(Text)  # 搭档分析信息
    deep_description = Column(Text)      # 深度调查信息
    image_path = Column(String)          # 证物图片路径
    category = Column(String, nullable=False)  # 'physical', 'document', 'digital', 'testimony', 'combination'
    
    # 状态管理
    discovery_state = Column(String, nullable=False, default='surface')  # 'hidden', 'surface', 'investigated', 'analyzed'
    unlock_level = Column(Integer, nullable=False, default=1)  # 解锁等级（1-3）
    
    # 关联系统（JSON格式存储）
    related_actors = Column(JSON, default=list)        # 相关角色名称列表
    related_evidences = Column(JSON, default=list)     # 关联证物ID列表
    trigger_events = Column(JSON, default=list)        # 触发的剧情事件
    combinable_with = Column(JSON, default=list)       # 可组合的证物ID列表
    
    # 元数据
    importance = Column(String, nullable=False, default='medium')  # 'low', 'medium', 'high', 'critical'
    discovered_at = Column(DateTime)                    # 发现时间
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # 显示状态
    is_new = Column(Boolean, default=True)
    has_update = Column(Boolean, default=False)
    
    # 关联关系
    reactions = relationship("EvidenceReactionRecord", back_populates="evidence", cascade="all, delete-orphan")
    discoveries = relationship("EvidenceDiscoveryRecord", back_populates="evidence", cascade="all, delete-orphan")
    presentations = relationship("EvidencePresentationRecord", back_populates="evidence", cascade="all, delete-orphan")

class EvidenceReactionRecord(Base):
    __tablename__ = 'evidence_reactions'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    evidence_id = Column(String, ForeignKey('evidences.id'), nullable=False)
    actor_name = Column(String, nullable=False)
    actor_id = Column(Integer, nullable=False)
    reaction_type = Column(String, nullable=False)  # 'basic', 'contradiction', 'breakthrough'
    
    # 反应内容（JSON格式存储）
    basic_response = Column(Text, nullable=False)
    contradiction_trigger = Column(JSON)  # 矛盾触发配置
    breakthrough = Column(JSON)           # 真相揭露配置
    
    # 特殊标记
    is_decoy = Column(Boolean, default=False)
    requires_permission = Column(Boolean, default=False)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # 关联关系
    evidence = relationship("EvidenceRecord", back_populates="reactions")

class EvidenceDiscoveryRecord(Base):
    __tablename__ = 'evidence_discoveries'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    evidence_id = Column(String, ForeignKey('evidences.id'), nullable=False)
    session_id = Column(String, nullable=False)
    actor_name = Column(String, nullable=False)      # 发现证物的角色
    discovery_method = Column(String, nullable=False)  # 'conversation', 'investigation', 'combination', 'deduction'
    previous_state = Column(String, nullable=False)
    new_state = Column(String, nullable=False)
    trigger_context = Column(JSON)                   # 触发发现的上下文信息
    
    discovered_at = Column(DateTime, default=datetime.utcnow)
    
    # 关联关系
    evidence = relationship("EvidenceRecord", back_populates="discoveries")

class EvidencePresentationRecord(Base):
    __tablename__ = 'evidence_presentations'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    evidence_id = Column(String, ForeignKey('evidences.id'), nullable=False)
    session_id = Column(String, nullable=False)
    presented_to = Column(String, nullable=False)       # 出示给谁
    presented_by = Column(String, nullable=False)       # 谁出示的
    text_content = Column(Text)                         # 可选的文字说明
    reaction_type = Column(String, nullable=False)      # 反应类型
    ai_response = Column(Text, nullable=False)          # AI的回应
    new_evidences_unlocked = Column(JSON, default=list) # 解锁的新证物
    information_updated = Column(JSON, default=list)    # 更新的信息
    presentation_context = Column(Text)                 # 出示上下文
    
    presented_at = Column(DateTime, default=datetime.utcnow)
    
    # 关联关系
    evidence = relationship("EvidenceRecord", back_populates="presentations")

class EvidenceCombinationRecord(Base):
    __tablename__ = 'evidence_combinations'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    session_id = Column(String, nullable=False)
    primary_evidence_id = Column(String, ForeignKey('evidences.id'), nullable=False)
    secondary_evidence_id = Column(String, ForeignKey('evidences.id'), nullable=False)
    result_evidence_id = Column(String, ForeignKey('evidences.id'))
    combination_success = Column(Boolean, nullable=False)
    combination_result = Column(Text, nullable=False)   # 组合结果描述
    attempted_by = Column(String, nullable=False)       # 尝试组合的角色
    
    created_at = Column(DateTime, default=datetime.utcnow)

class GameProgressRecord(Base):
    __tablename__ = 'game_progress'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    session_id = Column(String, nullable=False, unique=True)
    script_id = Column(String, ForeignKey('scripts.id'), nullable=False)
    
    # 进度数据（JSON格式存储）
    discovered_evidences = Column(JSON, default=list)      # 已发现证物ID列表
    presented_evidences = Column(JSON, default=dict)       # 已出示证物记录 {actorName: [evidenceIds]}
    combined_evidences = Column(JSON, default=list)        # 已组合证物ID列表
    investigated_evidences = Column(JSON, default=list)    # 已调查证物ID列表
    contradictions_found = Column(Integer, default=0)      # 发现的矛盾数量
    time_spent = Column(Integer, default=0)                # 游戏时间（分钟）
    current_phase = Column(String, default='initial')      # 'initial', 'investigation', 'confrontation', 'resolution'
    hints_used = Column(Integer, default=0)                # 使用的提示数量
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_activity = Column(DateTime, default=datetime.utcnow)

# 数据转换工具函数
def evidence_record_to_dict(evidence: EvidenceRecord) -> dict:
    """将数据库EvidenceRecord对象转换为前端需要的字典格式"""
    reactions_data = []
    for reaction in evidence.reactions:
        reactions_data.append({
            'actorName': reaction.actor_name,
            'actorId': reaction.actor_id,
            'reactionType': reaction.reaction_type,
            'basicResponse': reaction.basic_response,
            'contradictionTrigger': reaction.contradiction_trigger,
            'breakthrough': reaction.breakthrough,
            'isDecoy': reaction.is_decoy,
            'requiresPermission': reaction.requires_permission
        })
    
    return {
        'id': evidence.id,
        'name': evidence.name,
        'basicDescription': evidence.basic_description,
        'detailedDescription': evidence.detailed_description,
        'deepDescription': evidence.deep_description,
        'image': evidence.image_path,
        'category': evidence.category,
        'discoveryState': evidence.discovery_state,
        'unlockLevel': evidence.unlock_level,
        'relatedActors': evidence.related_actors or [],
        'relatedEvidences': evidence.related_evidences or [],
        'triggerEvents': evidence.trigger_events or [],
        'reactions': reactions_data,
        'combinableWith': evidence.combinable_with or [],
        'importance': evidence.importance,
        'sessionId': evidence.session_id,
        'scriptId': evidence.script_id,
        'discoveredAt': evidence.discovered_at.isoformat() if evidence.discovered_at else None,
        'lastUpdated': evidence.updated_at.isoformat() if evidence.updated_at else None,
        'isNew': evidence.is_new,
        'hasUpdate': evidence.has_update
    }

def dict_to_evidence_record(data: dict, evidence: EvidenceRecord = None) -> EvidenceRecord:
    """将前端字典格式转换为数据库EvidenceRecord对象"""
    if evidence is None:
        evidence = EvidenceRecord()
    
    evidence.id = data.get('id')
    evidence.script_id = data.get('scriptId', '')
    evidence.session_id = data.get('sessionId', '')
    evidence.name = data.get('name', '')
    evidence.basic_description = data.get('basicDescription', '')
    evidence.detailed_description = data.get('detailedDescription')
    evidence.deep_description = data.get('deepDescription')
    evidence.image_path = data.get('image')
    evidence.category = data.get('category', 'physical')
    evidence.discovery_state = data.get('discoveryState', 'surface')
    evidence.unlock_level = data.get('unlockLevel', 1)
    evidence.related_actors = data.get('relatedActors', [])
    evidence.related_evidences = data.get('relatedEvidences', [])
    evidence.trigger_events = data.get('triggerEvents', [])
    evidence.combinable_with = data.get('combinableWith', [])
    evidence.importance = data.get('importance', 'medium')
    evidence.is_new = data.get('isNew', True)
    evidence.has_update = data.get('hasUpdate', False)
    
    # 处理时间字段
    if 'discoveredAt' in data and data['discoveredAt']:
        try:
            evidence.discovered_at = datetime.fromisoformat(data['discoveredAt'].replace('Z', '+00:00'))
        except:
            evidence.discovered_at = datetime.utcnow()
    
    return evidence

def presentation_record_to_dict(presentation: EvidencePresentationRecord) -> dict:
    """将数据库EvidencePresentationRecord对象转换为前端字典格式"""
    return {
        'id': str(presentation.id),
        'evidenceId': presentation.evidence_id,
        'sessionId': presentation.session_id,
        'presentedTo': presentation.presented_to,
        'presentedBy': presentation.presented_by,
        'textContent': presentation.text_content,
        'reactionType': presentation.reaction_type,
        'aiResponse': presentation.ai_response,
        'newEvidencesUnlocked': presentation.new_evidences_unlocked or [],
        'informationUpdated': presentation.information_updated or [],
        'presentationContext': presentation.presentation_context,
        'presentedAt': presentation.presented_at.isoformat() if presentation.presented_at else None
    }

def dict_to_presentation_record(data: dict, presentation: EvidencePresentationRecord = None) -> EvidencePresentationRecord:
    """将前端字典格式转换为数据库EvidencePresentationRecord对象"""
    if presentation is None:
        presentation = EvidencePresentationRecord()
    
    presentation.evidence_id = data.get('evidenceId', '')
    presentation.session_id = data.get('sessionId', '')
    presentation.presented_to = data.get('presentedTo', '')
    presentation.presented_by = data.get('presentedBy', '')
    presentation.text_content = data.get('textContent')
    presentation.reaction_type = data.get('reactionType', 'basic')
    presentation.ai_response = data.get('aiResponse', '')
    presentation.new_evidences_unlocked = data.get('newEvidencesUnlocked', [])
    presentation.information_updated = data.get('informationUpdated', [])
    presentation.presentation_context = data.get('presentationContext')
    
    return presentation
