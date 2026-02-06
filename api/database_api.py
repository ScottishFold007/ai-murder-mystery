# 数据库管理API
from fastapi import APIRouter, HTTPException, Depends, status
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
from datetime import datetime
import json
import os
import base64

from models import (
    Script, Character, QuizQuestion, ScriptEvidence,
    get_db, create_tables,
    script_to_dict, dict_to_script, dict_to_character, dict_to_quiz_question, dict_to_script_evidence
)

router = APIRouter()

# 确保数据库表存在
create_tables()

@router.post("/db/scripts/save")
async def save_script_to_db(script_data: Dict[str, Any], db: Session = Depends(get_db)):
    """保存剧本到数据库"""
    try:
        print(f"💾 保存剧本到数据库: {script_data.get('title')}")
        
        script_id = script_data.get('id')
        if not script_id:
            raise HTTPException(status_code=400, detail="剧本ID不能为空")
        
        # 查找现有剧本或创建新剧本
        existing_script = db.query(Script).filter(Script.id == script_id).first()
        
        if existing_script:
            # 更新现有剧本
            script = dict_to_script(script_data, existing_script)
            print(f"🔄 更新现有剧本: {script.title}")
        else:
            # 创建新剧本
            script = dict_to_script(script_data)
            db.add(script)
            print(f"➕ 创建新剧本: {script.title}")
        
        # 处理封面数据
        cover_image = script_data.get('coverImage')
        if cover_image and cover_image.startswith('data:image/'):
            # 保存base64封面为文件
            try:
                base64_data = cover_image.split(',')[1]
                timestamp = int(datetime.utcnow().timestamp() * 1000)
                cover_filename = f"script_cover_{script_id}_{timestamp}.png"
                
                # 统一保存到web/public目录，符合STATIC_FILES_SETUP.md规范
                web_dir = os.path.join(os.path.dirname(__file__), '..', 'web')
                public_dir = os.path.join(web_dir, 'public')
                cover_dir = os.path.join(public_dir, 'script_covers')
                
                os.makedirs(cover_dir, exist_ok=True)
                
                image_data = base64.b64decode(base64_data)
                
                # 只保存到public目录，符合STATIC_FILES_SETUP.md规范
                cover_path = os.path.join(cover_dir, cover_filename)
                with open(cover_path, 'wb') as f:
                    f.write(image_data)
                
                # 更新数据库中的封面信息
                script.cover_image_filename = cover_filename
                script.cover_image_path = f"/script_covers/{cover_filename}"
                
                print(f"📁 封面文件已保存: {cover_filename}")
                
            except Exception as e:
                print(f"❌ 保存封面文件失败: {e}")
                # 即使文件保存失败，仍然保存剧本数据
        
        # 删除现有数据（如果更新）
        if existing_script:
            db.query(Character).filter(Character.script_id == script_id).delete()
            db.query(QuizQuestion).filter(QuizQuestion.script_id == script_id).delete()
            db.query(ScriptEvidence).filter(ScriptEvidence.script_id == script_id).delete()
        
        # 添加角色
        characters_data = script_data.get('characters', [])
        for char_data in characters_data:
            character = dict_to_character(char_data, script_id)
            
            # 处理角色头像
            image = char_data.get('image', 'officer.png')
            if image and not image.startswith('/character_avatars/'):
                character.image_filename = image
                character.image_path = f"/character_avatars/{image}"
            
            db.add(character)
        
        # 添加题目
        quiz_data = script_data.get('quiz', [])
        for i, quiz_data_item in enumerate(quiz_data):
            quiz = dict_to_quiz_question(quiz_data_item, script_id, i)
            db.add(quiz)
        
        # 添加证物
        evidences_data = script_data.get('evidences', [])
        for evidence_data in evidences_data:
            evidence = dict_to_script_evidence(evidence_data, script_id)
            
            # 处理证物图像
            evidence_image = evidence_data.get('image')
            if evidence_image and not evidence_image.startswith('/evidence_images/'):
                evidence.image_filename = evidence_image
            
            db.add(evidence)
            
        print(f"📦 保存了 {len(evidences_data)} 个证物")
        
        # 提交事务
        db.commit()
        
        print(f"✅ 剧本保存到数据库成功: {script.title}")
        
        return {
            "success": True,
            "message": "剧本保存成功",
            "script_id": script_id,
            "cover_filename": script.cover_image_filename
        }
        
    except Exception as e:
        db.rollback()
        print(f"❌ 保存剧本到数据库失败: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"保存剧本失败: {str(e)}"
        )

@router.get("/db/scripts/list")
async def list_scripts_from_db(db: Session = Depends(get_db)):
    """从数据库获取所有剧本列表"""
    try:
        scripts = db.query(Script).order_by(Script.updated_at.desc()).all()
        
        scripts_data = []
        for script in scripts:
            script_dict = script_to_dict(script)
            scripts_data.append(script_dict)
        
        print(f"📋 从数据库加载剧本列表: {len(scripts_data)} 个剧本")
        
        return {
            "success": True,
            "scripts": scripts_data
        }
        
    except Exception as e:
        print(f"❌ 从数据库获取剧本列表失败: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"获取剧本列表失败: {str(e)}"
        )

@router.get("/db/scripts/{script_id}")
async def get_script_from_db(script_id: str, db: Session = Depends(get_db)):
    """从数据库获取指定剧本"""
    try:
        script = db.query(Script).filter(Script.id == script_id).first()
        
        if not script:
            raise HTTPException(status_code=404, detail="剧本不存在")
        
        script_dict = script_to_dict(script)
        
        print(f"📖 从数据库加载剧本: {script.title}")
        
        return {
            "success": True,
            "script": script_dict
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ 从数据库获取剧本失败: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"获取剧本失败: {str(e)}"
        )

@router.delete("/db/scripts/{script_id}")
async def delete_script_from_db(script_id: str, db: Session = Depends(get_db)):
    """从数据库删除剧本"""
    try:
        script = db.query(Script).filter(Script.id == script_id).first()
        
        if not script:
            raise HTTPException(status_code=404, detail="剧本不存在")
        
        # 删除封面文件
        if script.cover_image_filename:
            try:
                # 统一从web/public目录删除，符合STATIC_FILES_SETUP.md规范
                web_dir = os.path.join(os.path.dirname(__file__), '..', 'web')
                public_dir = os.path.join(web_dir, 'public')
                cover_dir = os.path.join(public_dir, 'script_covers')
                
                cover_path = os.path.join(cover_dir, script.cover_image_filename)
                
                if os.path.exists(cover_path):
                    os.remove(cover_path)
                    
                print(f"🗑️ 删除封面文件: {script.cover_image_filename}")
            except Exception as e:
                print(f"⚠️ 删除封面文件失败: {e}")
        
        # 删除数据库记录（级联删除角色和题目）
        db.delete(script)
        db.commit()
        
        print(f"✅ 从数据库删除剧本成功: {script.title}")
        
        return {
            "success": True,
            "message": "剧本删除成功"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"❌ 从数据库删除剧本失败: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"删除剧本失败: {str(e)}"
        )

@router.post("/db/migrate")
async def migrate_data_to_db(db: Session = Depends(get_db)):
    """将现有数据迁移到数据库"""
    try:
        print("🔄 开始数据迁移...")
        
        # 这里需要从前端发送现有的localStorage数据
        # 或者从文件系统读取现有的剧本文件
        
        return {
            "success": True,
            "message": "数据迁移接口已准备就绪，请从前端调用"
        }
        
    except Exception as e:
        print(f"❌ 数据迁移失败: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"数据迁移失败: {str(e)}"
        )

# ===== 证物单独管理API =====

@router.post("/db/evidences/save")
async def save_script_evidence(evidence_data: Dict[str, Any], db: Session = Depends(get_db)):
    """单独保存/更新剧本证物"""
    try:
        script_id = evidence_data.get('scriptId')
        evidence_id = evidence_data.get('id')
        
        if not script_id:
            raise HTTPException(status_code=400, detail="剧本ID不能为空")
        if not evidence_id:
            raise HTTPException(status_code=400, detail="证物ID不能为空")
        
        print(f"💾 单独保存证物: {evidence_data.get('name')} (脚本: {script_id})")
        
        # 检查剧本是否存在
        script = db.query(Script).filter(Script.id == script_id).first()
        if not script:
            # 提供更详细的错误信息和解决建议
            all_scripts = db.query(Script).all()
            script_ids = [s.id for s in all_scripts]
            raise HTTPException(
                status_code=404, 
                detail=f"剧本不存在 (ID: {script_id})。请先保存剧本到数据库。数据库中现有剧本: {script_ids[:5]}"
            )
        
        # 查找现有证物或创建新证物
        existing_evidence = db.query(ScriptEvidence).filter(
            ScriptEvidence.id == evidence_id,
            ScriptEvidence.script_id == script_id
        ).first()
        
        if existing_evidence:
            # 更新现有证物
            evidence = dict_to_script_evidence(evidence_data, script_id, existing_evidence)
            print(f"🔄 更新现有证物: {evidence.name}")
        else:
            # 创建新证物
            evidence = dict_to_script_evidence(evidence_data, script_id)
            db.add(evidence)
            print(f"➕ 创建新证物: {evidence.name}")
        
        db.commit()
        db.refresh(evidence)
        
        # 返回保存后的证物数据
        evidence_dict = {
            'id': evidence.id,
            'name': evidence.name,
            'description': evidence.description,
            'category': evidence.category,
            'importance': evidence.importance,
            'relatedCharacters': json.loads(evidence.related_characters) if evidence.related_characters else [],
            'initialState': evidence.initial_state,
            'image': evidence.image_filename
        }
        
        return {
            "success": True,
            "evidence": evidence_dict,
            "message": "证物保存成功"
        }
    
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"❌ 保存证物失败: {str(e)}")
        raise HTTPException(status_code=500, detail=f"保存证物失败: {str(e)}")

@router.delete("/db/evidences/{script_id}/{evidence_id}")
async def delete_script_evidence(script_id: str, evidence_id: str, db: Session = Depends(get_db)):
    """删除剧本证物"""
    try:
        evidence = db.query(ScriptEvidence).filter(
            ScriptEvidence.id == evidence_id,
            ScriptEvidence.script_id == script_id
        ).first()
        
        if not evidence:
            raise HTTPException(status_code=404, detail="证物不存在")
        
        print(f"🗑️ 删除证物: {evidence.name}")
        db.delete(evidence)
        db.commit()
        
        return {"success": True, "message": "证物删除成功"}
    
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"删除证物失败: {str(e)}")

@router.get("/db/evidences/{script_id}")
async def get_script_evidences(script_id: str, db: Session = Depends(get_db)):
    """获取剧本的所有证物"""
    try:
        evidences = db.query(ScriptEvidence).filter(
            ScriptEvidence.script_id == script_id
        ).order_by(ScriptEvidence.created_at.desc()).all()
        
        evidences_data = []
        for evidence in evidences:
            related_chars = json.loads(evidence.related_characters) if evidence.related_characters else []
            evidences_data.append({
                'id': evidence.id,
                'name': evidence.name,
                'description': evidence.description,
                'category': evidence.category,
                'importance': evidence.importance,
                'relatedCharacters': related_chars,
                'initialState': evidence.initial_state,
                'image': evidence.image_filename,
                'createdAt': evidence.created_at.isoformat() if evidence.created_at else None,
                'updatedAt': evidence.updated_at.isoformat() if evidence.updated_at else None
            })
        
        return {
            "success": True,
            "evidences": evidences_data,
            "count": len(evidences_data)
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取证物失败: {str(e)}")
