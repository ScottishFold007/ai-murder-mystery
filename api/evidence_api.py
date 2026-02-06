from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from datetime import datetime
import json
import uuid

from evidence_models import (
    EvidenceRecord,
    EvidenceReactionRecord,
    EvidenceDiscoveryRecord,
    EvidencePresentationRecord,
    EvidenceCombinationRecord,
    GameProgressRecord,
    evidence_record_to_dict,
    dict_to_evidence_record,
    presentation_record_to_dict,
    dict_to_presentation_record
)
from models import get_db
from evidence_llm_service import invoke_ai_for_evidence_presentation
from pydantic import BaseModel

router = APIRouter(prefix="/evidence", tags=["evidence"])

# 请求和响应模型
class EvidenceCreateRequest(BaseModel):
    scriptId: str
    sessionId: str
    name: str
    basicDescription: str
    category: str = 'physical'
    importance: str = 'medium'
    relatedActors: List[str] = []
    discoveredBy: str = 'system'

class EvidenceUpdateRequest(BaseModel):
    detailedDescription: Optional[str] = None
    deepDescription: Optional[str] = None
    unlockLevel: Optional[int] = None
    discoveryState: Optional[str] = None
    relatedActors: Optional[List[str]] = None
    relatedEvidences: Optional[List[str]] = None
    importance: Optional[str] = None

class EvidencePresentationRequest(BaseModel):
    evidenceId: str
    presentedTo: str
    presentedBy: str
    textContent: Optional[str] = None
    presentationContext: Optional[str] = None

class EvidenceCombinationRequest(BaseModel):
    primaryEvidenceId: str
    secondaryEvidenceId: str
    attemptedBy: str

class EvidenceResponse(BaseModel):
    success: bool
    evidence: Optional[Dict[str, Any]] = None
    message: Optional[str] = None
    newEvidences: Optional[List[Dict[str, Any]]] = None
    updatedEvidences: Optional[List[Dict[str, Any]]] = None

class EvidenceListResponse(BaseModel):
    success: bool
    evidences: List[Dict[str, Any]]
    stats: Dict[str, Any]
    message: Optional[str] = None

class EvidencePresentationResponse(BaseModel):
    success: bool
    aiResponse: str
    reactionType: str
    newEvidencesUnlocked: List[str] = []
    informationUpdated: List[str] = []
    message: Optional[str] = None

# API端点实现

@router.get("/script/{script_id}/session/{session_id}")
async def get_evidences(
    script_id: str,
    session_id: str,
    category: Optional[str] = None,
    discovery_state: Optional[str] = None,
    importance: Optional[str] = None,
    db: Session = Depends(get_db)
) -> EvidenceListResponse:
    """获取指定剧本会话的所有证物"""
    try:
        query = db.query(EvidenceRecord).filter(
            EvidenceRecord.script_id == script_id,
            EvidenceRecord.session_id == session_id
        )
        
        # 应用过滤条件
        if category:
            query = query.filter(EvidenceRecord.category == category)
        if discovery_state:
            query = query.filter(EvidenceRecord.discovery_state == discovery_state)
        if importance:
            query = query.filter(EvidenceRecord.importance == importance)
        
        evidences = query.order_by(EvidenceRecord.updated_at.desc()).all()
        
        # 转换为前端格式
        evidence_list = [evidence_record_to_dict(evidence) for evidence in evidences]
        
        # 计算统计信息
        stats = calculate_evidence_stats(evidences)
        
        return EvidenceListResponse(
            success=True,
            evidences=evidence_list,
            stats=stats
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取证物失败: {str(e)}")

@router.post("/create")
async def create_evidence(
    request: EvidenceCreateRequest,
    db: Session = Depends(get_db)
) -> EvidenceResponse:
    """创建新证物"""
    try:
        evidence_id = f"evidence_{uuid.uuid4().hex[:8]}"
        
        evidence = EvidenceRecord(
            id=evidence_id,
            script_id=request.scriptId,
            session_id=request.sessionId,
            name=request.name,
            basic_description=request.basicDescription,
            category=request.category,
            importance=request.importance,
            related_actors=request.relatedActors,
            discovery_state='surface',
            unlock_level=1,
            is_new=True,
            discovered_at=datetime.utcnow()
        )
        
        db.add(evidence)
        
        # 记录发现历史
        discovery = EvidenceDiscoveryRecord(
            evidence_id=evidence_id,
            session_id=request.sessionId,
            actor_name=request.discoveredBy,
            discovery_method='system',
            previous_state='hidden',
            new_state='surface'
        )
        
        db.add(discovery)
        db.commit()
        db.refresh(evidence)
        
        return EvidenceResponse(
            success=True,
            evidence=evidence_record_to_dict(evidence),
            message="证物创建成功"
        )
    
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"创建证物失败: {str(e)}")

@router.put("/{evidence_id}")
async def update_evidence(
    evidence_id: str,
    request: EvidenceUpdateRequest,
    db: Session = Depends(get_db)
) -> EvidenceResponse:
    """更新证物信息"""
    try:
        evidence = db.query(EvidenceRecord).filter(EvidenceRecord.id == evidence_id).first()
        
        if not evidence:
            raise HTTPException(status_code=404, detail="证物不存在")
        
        # 记录状态变更
        previous_state = evidence.discovery_state
        previous_level = evidence.unlock_level
        
        # 更新字段
        if request.detailedDescription is not None:
            evidence.detailed_description = request.detailedDescription
            evidence.has_update = True
        if request.deepDescription is not None:
            evidence.deep_description = request.deepDescription
            evidence.has_update = True
        if request.unlockLevel is not None:
            evidence.unlock_level = request.unlockLevel
        if request.discoveryState is not None:
            evidence.discovery_state = request.discoveryState
        if request.relatedActors is not None:
            evidence.related_actors = request.relatedActors
        if request.relatedEvidences is not None:
            evidence.related_evidences = request.relatedEvidences
        if request.importance is not None:
            evidence.importance = request.importance
        
        evidence.updated_at = datetime.utcnow()
        
        # 如果状态或等级发生变化，记录发现历史
        if (request.discoveryState and request.discoveryState != previous_state) or \
           (request.unlockLevel and request.unlockLevel != previous_level):
            discovery = EvidenceDiscoveryRecord(
                evidence_id=evidence_id,
                session_id=evidence.session_id,
                actor_name='system',
                discovery_method='investigation',
                previous_state=previous_state,
                new_state=evidence.discovery_state
            )
            db.add(discovery)
        
        db.commit()
        db.refresh(evidence)
        
        return EvidenceResponse(
            success=True,
            evidence=evidence_record_to_dict(evidence),
            message="证物更新成功"
        )
    
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"更新证物失败: {str(e)}")

@router.post("/present")
async def present_evidence_to_actor(
    request: EvidencePresentationRequest,
    db: Session = Depends(get_db)
) -> EvidencePresentationResponse:
    """向角色展示证物并获取反应"""
    try:
        # 获取证物信息
        evidence = db.query(EvidenceRecord).filter(EvidenceRecord.id == request.evidenceId).first()
        
        if not evidence:
            raise HTTPException(status_code=404, detail="证物不存在")
        
        # 调用AI生成反应
        ai_response, reaction_type, new_evidences, updated_info = await invoke_ai_for_evidence_presentation(
            evidence_record_to_dict(evidence),
            request.presentedTo,
            request.presentedBy,
            request.textContent,
            request.presentationContext
        )
        
        # 记录出示历史
        presentation = EvidencePresentationRecord(
            evidence_id=request.evidenceId,
            session_id=evidence.session_id,
            presented_to=request.presentedTo,
            presented_by=request.presentedBy,
            text_content=request.textContent,
            reaction_type=reaction_type,
            ai_response=ai_response,
            new_evidences_unlocked=new_evidences,
            information_updated=updated_info,
            presentation_context=request.presentationContext
        )
        
        db.add(presentation)
        
        # 如果有新证物或信息更新，处理相关逻辑
        if new_evidences or updated_info:
            await process_evidence_updates(db, evidence.session_id, new_evidences, updated_info)
        
        db.commit()
        
        return EvidencePresentationResponse(
            success=True,
            aiResponse=ai_response,
            reactionType=reaction_type,
            newEvidencesUnlocked=new_evidences,
            informationUpdated=updated_info,
            message="证物出示成功"
        )
    
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"证物出示失败: {str(e)}")

@router.post("/combine")
async def combine_evidences(
    request: EvidenceCombinationRequest,
    db: Session = Depends(get_db)
) -> EvidenceResponse:
    """组合两个证物产生新证物"""
    try:
        # 获取两个证物
        evidence1 = db.query(EvidenceRecord).filter(EvidenceRecord.id == request.primaryEvidenceId).first()
        evidence2 = db.query(EvidenceRecord).filter(EvidenceRecord.id == request.secondaryEvidenceId).first()
        
        if not evidence1 or not evidence2:
            raise HTTPException(status_code=404, detail="证物不存在")
        
        # 检查是否可以组合
        if request.secondaryEvidenceId not in (evidence1.combinable_with or []):
            combination = EvidenceCombinationRecord(
                session_id=evidence1.session_id,
                primary_evidence_id=request.primaryEvidenceId,
                secondary_evidence_id=request.secondaryEvidenceId,
                combination_success=False,
                combination_result="这两个证物无法组合",
                attempted_by=request.attemptedBy
            )
            db.add(combination)
            db.commit()
            
            return EvidenceResponse(
                success=False,
                message="这两个证物无法组合"
            )
        
        # 生成组合证物
        combined_evidence = await generate_combined_evidence(evidence1, evidence2)
        
        db.add(combined_evidence)
        
        # 记录组合历史
        combination = EvidenceCombinationRecord(
            session_id=evidence1.session_id,
            primary_evidence_id=request.primaryEvidenceId,
            secondary_evidence_id=request.secondaryEvidenceId,
            result_evidence_id=combined_evidence.id,
            combination_success=True,
            combination_result=f"成功组合生成: {combined_evidence.name}",
            attempted_by=request.attemptedBy
        )
        
        db.add(combination)
        db.commit()
        db.refresh(combined_evidence)
        
        return EvidenceResponse(
            success=True,
            evidence=evidence_record_to_dict(combined_evidence),
            message="证物组合成功"
        )
    
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"证物组合失败: {str(e)}")

@router.get("/{evidence_id}/presentations")
async def get_evidence_presentations(
    evidence_id: str,
    db: Session = Depends(get_db)
) -> List[Dict[str, Any]]:
    """获取证物的出示历史"""
    try:
        presentations = db.query(EvidencePresentationRecord).filter(
            EvidencePresentationRecord.evidence_id == evidence_id
        ).order_by(EvidencePresentationRecord.presented_at.desc()).all()
        
        return [presentation_record_to_dict(presentation) for presentation in presentations]
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取出示历史失败: {str(e)}")

@router.delete("/{evidence_id}")
async def delete_evidence(
    evidence_id: str,
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """删除证物（级联删除相关记录）"""
    try:
        evidence = db.query(EvidenceRecord).filter(EvidenceRecord.id == evidence_id).first()
        
        if not evidence:
            raise HTTPException(status_code=404, detail="证物不存在")
        
        db.delete(evidence)
        db.commit()
        
        return {"success": True, "message": "证物删除成功"}
    
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"删除证物失败: {str(e)}")

# 辅助函数

def calculate_evidence_stats(evidences: List[EvidenceRecord]) -> Dict[str, Any]:
    """计算证物统计信息"""
    total_evidences = len(evidences)
    new_evidences = sum(1 for e in evidences if e.is_new)
    
    category_breakdown = {}
    state_breakdown = {}
    importance_breakdown = {}
    
    for evidence in evidences:
        # 类别统计
        category_breakdown[evidence.category] = category_breakdown.get(evidence.category, 0) + 1
        # 状态统计
        state_breakdown[evidence.discovery_state] = state_breakdown.get(evidence.discovery_state, 0) + 1
        # 重要度统计
        importance_breakdown[evidence.importance] = importance_breakdown.get(evidence.importance, 0) + 1
    
    # 计算完成度
    total_possible_levels = total_evidences * 3
    current_levels = sum(evidence.unlock_level for evidence in evidences)
    completion_rate = int((current_levels / total_possible_levels) * 100) if total_possible_levels > 0 else 0
    
    # 最后发现时间
    last_discovery_time = None
    if evidences:
        last_evidence = max(evidences, key=lambda e: e.discovered_at or datetime.min)
        if last_evidence.discovered_at:
            last_discovery_time = last_evidence.discovered_at.isoformat()
    
    return {
        'totalEvidences': total_evidences,
        'newEvidences': new_evidences,
        'categoryBreakdown': category_breakdown,
        'stateBreakdown': state_breakdown,
        'importanceBreakdown': importance_breakdown,
        'lastDiscoveryTime': last_discovery_time,
        'completionRate': completion_rate
    }

async def process_evidence_updates(
    db: Session,
    session_id: str,
    new_evidences: List[str],
    updated_info: List[str]
):
    """处理证物更新逻辑"""
    # 这里可以添加复杂的证物更新逻辑
    # 比如自动创建新证物、更新现有证物信息等
    pass

async def generate_combined_evidence(
    evidence1: EvidenceRecord,
    evidence2: EvidenceRecord
) -> EvidenceRecord:
    """生成组合证物"""
    combined_id = f"combined_{evidence1.id}_{evidence2.id}_{uuid.uuid4().hex[:4]}"
    
    # 这里可以使用AI来生成组合证物的描述
    combined_name = f"{evidence1.name} + {evidence2.name}"
    combined_description = f"通过分析{evidence1.name}和{evidence2.name}的关联，发现了新的线索。"
    
    combined_evidence = EvidenceRecord(
        id=combined_id,
        script_id=evidence1.script_id,
        session_id=evidence1.session_id,
        name=combined_name,
        basic_description=combined_description,
        category='combination',
        discovery_state='surface',
        unlock_level=1,
        related_evidences=[evidence1.id, evidence2.id],
        importance='high',
        is_new=True,
        discovered_at=datetime.utcnow()
    )
    
    return combined_evidence
