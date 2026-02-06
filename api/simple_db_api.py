# 简化的数据库API
from fastapi import APIRouter, HTTPException
from typing import Dict, Any
from simple_db import simple_db

router = APIRouter()

@router.post("/db/scripts/save")
async def save_script_simple(script_data: Dict[str, Any]):
    """保存剧本到简化数据库"""
    try:
        success = simple_db.save_script(script_data)
        
        if success:
            return {
                "success": True,
                "message": "剧本保存成功",
                "script_id": script_data.get('id')
            }
        else:
            raise HTTPException(status_code=500, detail="剧本保存失败")
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"保存剧本失败: {str(e)}")

@router.get("/db/scripts/list")
async def list_scripts_simple():
    """获取所有剧本列表"""
    try:
        scripts = simple_db.get_all_scripts()
        
        return {
            "success": True,
            "scripts": scripts
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取剧本列表失败: {str(e)}")

@router.get("/db/scripts/{script_id}")
async def get_script_simple(script_id: str):
    """获取指定剧本"""
    try:
        script = simple_db.get_script(script_id)
        
        if script:
            return {
                "success": True,
                "script": script
            }
        else:
            raise HTTPException(status_code=404, detail="剧本不存在")
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取剧本失败: {str(e)}")

@router.delete("/db/scripts/{script_id}")
async def delete_script_simple(script_id: str):
    """删除剧本"""
    try:
        success = simple_db.delete_script(script_id)
        
        if success:
            return {
                "success": True,
                "message": "剧本删除成功"
            }
        else:
            raise HTTPException(status_code=500, detail="剧本删除失败")
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"删除剧本失败: {str(e)}")

@router.post("/db/migrate")
async def migrate_data_simple(scripts_data: Dict[str, Any]):
    """迁移数据到简化数据库"""
    try:
        scripts = scripts_data.get('scripts', [])
        
        success_count = 0
        failed_count = 0
        
        for script in scripts:
            if simple_db.save_script(script):
                success_count += 1
            else:
                failed_count += 1
        
        return {
            "success": success_count > 0,
            "message": f"迁移完成: 成功 {success_count} 个，失败 {failed_count} 个",
            "success_count": success_count,
            "failed_count": failed_count
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"数据迁移失败: {str(e)}")

# === 证物管理API ===

@router.post("/db/evidences/save")
async def save_evidence_simple(evidence_data: Dict[str, Any]):
    """保存证物到简化数据库"""
    try:
        success = simple_db.save_evidence(evidence_data)
        
        if success:
            # 构建返回的证物数据（与前端格式一致）
            import json
            related_characters = evidence_data.get('relatedCharacters', [])
            
            saved_evidence = {
                'id': evidence_data.get('id'),
                'name': evidence_data.get('name'),
                'description': evidence_data.get('description', ''),
                'overview': evidence_data.get('overview', ''),
                'clues': evidence_data.get('clues', ''),
                'category': evidence_data.get('category', 'physical'),
                'importance': evidence_data.get('importance', 'normal'),
                'initialState': evidence_data.get('initialState', 'surface'),
                'relatedCharacters': related_characters,
                'image': evidence_data.get('image')
            }
            
            return {
                "success": True,
                "message": "证物保存成功",
                "evidence": saved_evidence
            }
        else:
            raise HTTPException(status_code=500, detail="证物保存失败")
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"保存证物失败: {str(e)}")

@router.get("/db/evidences/script/{script_id}")
async def get_evidences_by_script_simple(script_id: str):
    """获取指定剧本的所有证物"""
    try:
        evidences = simple_db.get_evidences_by_script(script_id)
        
        return {
            "success": True,
            "evidences": evidences,
            "count": len(evidences)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取证物列表失败: {str(e)}")

@router.delete("/db/evidences/{evidence_id}")
async def delete_evidence_simple(evidence_id: str):
    """删除证物"""
    try:
        success = simple_db.delete_evidence(evidence_id)
        
        if success:
            return {
                "success": True,
                "message": "证物删除成功"
            }
        else:
            raise HTTPException(status_code=500, detail="证物删除失败")
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"删除证物失败: {str(e)}")
