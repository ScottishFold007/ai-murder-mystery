# 剧透故事管理API
from fastapi import APIRouter, HTTPException, Depends, status
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from datetime import datetime
import time

from models import (
    Script, SpoilerStory, get_db, create_tables,
    spoiler_story_to_dict, dict_to_spoiler_story
)
from settings import MODEL, PROMPTS_VERSION

router = APIRouter()

# 确保数据库表存在
create_tables()

@router.post("/db/spoiler-stories/save")
async def save_spoiler_story(story_data: Dict[str, Any], db: Session = Depends(get_db)):
    """保存剧透故事到数据库"""
    try:
        script_id = story_data.get('scriptId')
        if not script_id:
            raise HTTPException(status_code=400, detail="剧本ID不能为空")
        
        print(f"💾 保存剧透故事到数据库: 剧本 {script_id}")
        
        # 检查剧本是否存在
        script = db.query(Script).filter(Script.id == script_id).first()
        if not script:
            raise HTTPException(status_code=404, detail="剧本不存在")
        
        # 创建新的剧透故事
        story = dict_to_spoiler_story(story_data, script_id)
        
        # 总是使用系统实际配置的模型信息
        story.ai_model = MODEL
        story.prompt_version = PROMPTS_VERSION
        
        # 如果没有提供标题，自动生成一个
        if not story.title or story.title == '剧透故事':
            story_count = db.query(SpoilerStory).filter(SpoilerStory.script_id == script_id).count()
            story.title = f"《{script.title}》剧透故事 #{story_count + 1}"
        
        db.add(story)
        db.commit()
        db.refresh(story)
        
        print(f"✅ 剧透故事保存成功: {story.title}")
        
        return {
            "success": True,
            "message": "剧透故事保存成功",
            "story": spoiler_story_to_dict(story)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"❌ 保存剧透故事失败: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"保存剧透故事失败: {str(e)}"
        )

@router.get("/db/spoiler-stories/{script_id}")
async def get_spoiler_stories(script_id: str, db: Session = Depends(get_db)):
    """获取指定剧本的所有剧透故事"""
    try:
        # 检查剧本是否存在
        script = db.query(Script).filter(Script.id == script_id).first()
        if not script:
            raise HTTPException(status_code=404, detail="剧本不存在")
        
        # 获取所有剧透故事，按生成时间倒序排列
        stories = db.query(SpoilerStory).filter(
            SpoilerStory.script_id == script_id
        ).order_by(SpoilerStory.generated_at.desc()).all()
        
        stories_data = [spoiler_story_to_dict(story) for story in stories]
        
        print(f"📋 获取剧本 {script_id} 的剧透故事: {len(stories_data)} 个")
        
        return {
            "success": True,
            "stories": stories_data,
            "script_title": script.title
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ 获取剧透故事失败: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"获取剧透故事失败: {str(e)}"
        )

@router.get("/db/spoiler-stories/story/{story_id}")
async def get_spoiler_story(story_id: int, db: Session = Depends(get_db)):
    """获取指定的剧透故事详情"""
    try:
        story = db.query(SpoilerStory).filter(SpoilerStory.id == story_id).first()
        
        if not story:
            raise HTTPException(status_code=404, detail="剧透故事不存在")
        
        print(f"📖 获取剧透故事: {story.title}")
        
        return {
            "success": True,
            "story": spoiler_story_to_dict(story)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ 获取剧透故事详情失败: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"获取剧透故事详情失败: {str(e)}"
        )

@router.delete("/db/spoiler-stories/{story_id}")
async def delete_spoiler_story(story_id: int, db: Session = Depends(get_db)):
    """删除指定的剧透故事"""
    try:
        story = db.query(SpoilerStory).filter(SpoilerStory.id == story_id).first()
        
        if not story:
            raise HTTPException(status_code=404, detail="剧透故事不存在")
        
        story_title = story.title
        db.delete(story)
        db.commit()
        
        print(f"✅ 删除剧透故事成功: {story_title}")
        
        return {
            "success": True,
            "message": "剧透故事删除成功"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"❌ 删除剧透故事失败: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"删除剧透故事失败: {str(e)}"
        )

@router.put("/db/spoiler-stories/{story_id}")
async def update_spoiler_story(story_id: int, story_data: Dict[str, Any], db: Session = Depends(get_db)):
    """更新剧透故事"""
    try:
        story = db.query(SpoilerStory).filter(SpoilerStory.id == story_id).first()
        
        if not story:
            raise HTTPException(status_code=404, detail="剧透故事不存在")
        
        # 更新故事内容
        if 'title' in story_data:
            story.title = story_data['title']
        if 'content' in story_data:
            story.content = story_data['content']
            story.word_count = len(story_data['content'])
        
        db.commit()
        db.refresh(story)
        
        print(f"✅ 更新剧透故事成功: {story.title}")
        
        return {
            "success": True,
            "message": "剧透故事更新成功",
            "story": spoiler_story_to_dict(story)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"❌ 更新剧透故事失败: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"更新剧透故事失败: {str(e)}"
        )

@router.post("/db/spoiler-stories/batch-delete")
async def batch_delete_spoiler_stories(story_ids: List[int], db: Session = Depends(get_db)):
    """批量删除剧透故事"""
    try:
        deleted_count = 0
        failed_ids = []
        
        for story_id in story_ids:
            try:
                story = db.query(SpoilerStory).filter(SpoilerStory.id == story_id).first()
                if story:
                    db.delete(story)
                    deleted_count += 1
                else:
                    failed_ids.append(story_id)
            except Exception as e:
                print(f"删除故事 {story_id} 失败: {e}")
                failed_ids.append(story_id)
        
        db.commit()
        
        print(f"✅ 批量删除剧透故事: 成功 {deleted_count} 个，失败 {len(failed_ids)} 个")
        
        return {
            "success": True,
            "message": f"批量删除完成: 成功 {deleted_count} 个，失败 {len(failed_ids)} 个",
            "deleted_count": deleted_count,
            "failed_ids": failed_ids
        }
        
    except Exception as e:
        db.rollback()
        print(f"❌ 批量删除剧透故事失败: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"批量删除剧透故事失败: {str(e)}"
        )
