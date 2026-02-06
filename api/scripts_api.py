# 剧本文件管理API
import os
import json
from datetime import datetime
from pathlib import Path
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from typing import List, Optional, Dict, Any

router = APIRouter()

# 剧本文件存储目录
SCRIPTS_DIR = Path(__file__).parent.parent / "scripts"

# 确保scripts目录存在
SCRIPTS_DIR.mkdir(exist_ok=True)

class ScriptSaveRequest(BaseModel):
    fileName: str
    scriptData: Dict[str, Any]

class ScriptFileInfo(BaseModel):
    id: str
    title: str
    fileName: str
    filePath: str
    savedAt: str
    version: str
    fileSize: Optional[int] = None

def get_safe_filename(filename: str) -> str:
    """获取安全的文件名，清理特殊字符并保留常见中文字符"""
    try:
        # 允许：中文字符(\u4e00-\u9fff)、英文大小写、数字、空格、点、下划线、连字符
        import re
        name = filename
        # 确保有后缀
        if name.lower().endswith('.json'):
            base = name[:-5]
            suffix = '.json'
        else:
            base = name
            suffix = '.json'

        # 过滤非法字符
        base = re.sub(r"[^\u4e00-\u9fffA-Za-z0-9 ._\-]", "_", base)
        # 收尾空白
        base = base.strip()
        # 将连续空格替换为下划线
        base = re.sub(r"\s+", "_", base)
        # 避免空名
        if not base:
            base = "script"

        return f"{base}{suffix}"
    except Exception:
        return "script.json"

@router.post("/scripts/save")
async def save_script(request: ScriptSaveRequest):
    """保存剧本到文件系统"""
    try:
        # 清理文件名
        safe_filename = get_safe_filename(request.fileName)
        file_path = SCRIPTS_DIR / safe_filename
        
        # 添加保存时间戳
        script_data = {
            **request.scriptData,
            "savedAt": datetime.now().isoformat(),
            "filePath": str(file_path.relative_to(SCRIPTS_DIR.parent))
        }
        
        # 写入文件
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(script_data, f, ensure_ascii=False, indent=2)
        
        print(f"💾 剧本保存成功: {file_path}")
        
        return {
            "success": True,
            "message": "剧本保存成功",
            "fileName": safe_filename,
            "filePath": str(file_path)
        }
        
    except Exception as e:
        print(f"❌ 保存剧本失败: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"保存剧本失败: {str(e)}"
        )

@router.get("/scripts/load/{filename}")
async def load_script(filename: str):
    """从文件系统加载剧本"""
    try:
        # 清理文件名以防止路径遍历攻击
        safe_filename = get_safe_filename(filename)
        file_path = SCRIPTS_DIR / safe_filename
        
        if not file_path.exists():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"剧本文件不存在: {safe_filename}"
            )
        
        # 读取文件
        with open(file_path, 'r', encoding='utf-8') as f:
            script_data = json.load(f)
        
        print(f"📖 剧本加载成功: {file_path}")
        return script_data
        
    except json.JSONDecodeError as e:
        print(f"❌ JSON解析失败: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"剧本文件格式错误: {str(e)}"
        )
    except Exception as e:
        print(f"❌ 加载剧本失败: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"加载剧本失败: {str(e)}"
        )

@router.get("/scripts/list", response_model=List[ScriptFileInfo])
async def list_scripts():
    """获取所有剧本文件列表"""
    try:
        scripts_list = []
        
        # 扫描scripts目录
        for file_path in SCRIPTS_DIR.glob("*.json"):
            try:
                # 获取文件信息
                stat = file_path.stat()
                
                # 尝试读取剧本数据获取详细信息
                with open(file_path, 'r', encoding='utf-8') as f:
                    script_data = json.load(f)
                
                script_info = ScriptFileInfo(
                    id=script_data.get('id', f"script_{file_path.stem}"),
                    title=script_data.get('title', file_path.stem),
                    fileName=file_path.name,
                    filePath=str(file_path.relative_to(SCRIPTS_DIR.parent)),
                    savedAt=script_data.get('savedAt', script_data.get('updatedAt', datetime.fromtimestamp(stat.st_mtime).isoformat())),
                    version=script_data.get('version', '1.0.0'),
                    fileSize=stat.st_size
                )
                
                scripts_list.append(script_info)
                
            except (json.JSONDecodeError, KeyError) as e:
                print(f"⚠️ 跳过无效的剧本文件: {file_path.name}, 错误: {e}")
                continue
        
        # 按保存时间排序（最新的在前）
        scripts_list.sort(key=lambda x: x.savedAt, reverse=True)
        
        print(f"📋 获取剧本列表成功: {len(scripts_list)} 个文件")
        return scripts_list
        
    except Exception as e:
        print(f"❌ 获取剧本列表失败: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"获取剧本列表失败: {str(e)}"
        )

@router.delete("/scripts/delete/{filename}")
async def delete_script(filename: str):
    """删除剧本文件"""
    try:
        # 清理文件名以防止路径遍历攻击
        safe_filename = get_safe_filename(filename)
        file_path = SCRIPTS_DIR / safe_filename
        
        if not file_path.exists():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"剧本文件不存在: {safe_filename}"
            )
        
        # 删除文件
        file_path.unlink()
        
        print(f"🗑️ 剧本删除成功: {file_path}")
        
        return {
            "success": True,
            "message": "剧本删除成功",
            "fileName": safe_filename
        }
        
    except Exception as e:
        print(f"❌ 删除剧本失败: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"删除剧本失败: {str(e)}"
        )

@router.get("/scripts/stats")
async def get_scripts_stats():
    """获取剧本存储统计信息"""
    try:
        total_scripts = 0
        total_size = 0
        
        for file_path in SCRIPTS_DIR.glob("*.json"):
            try:
                stat = file_path.stat()
                total_scripts += 1
                total_size += stat.st_size
            except Exception as e:
                print(f"⚠️ 获取文件统计失败: {file_path.name}, 错误: {e}")
                continue
        
        return {
            "totalScripts": total_scripts,
            "totalSize": total_size,
            "averageSize": total_size // total_scripts if total_scripts > 0 else 0,
            "storageDir": str(SCRIPTS_DIR),
            "freeSpace": os.statvfs(SCRIPTS_DIR).f_bavail * os.statvfs(SCRIPTS_DIR).f_frsize if hasattr(os, 'statvfs') else None
        }
        
    except Exception as e:
        print(f"❌ 获取统计信息失败: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"获取统计信息失败: {str(e)}"
        )
