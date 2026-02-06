#!/usr/bin/env python3
"""
将文件系统中的剧本迁移到数据库的脚本
"""

import os
import json
from pathlib import Path
from datetime import datetime

from models import get_db, Script, Character, dict_to_script, dict_to_character, create_tables
from settings import MODEL, PROMPTS_VERSION

def migrate_scripts():
    """迁移剧本文件到数据库"""
    
    print("🔄 开始迁移剧本到数据库...")
    
    # 确保数据库表存在
    create_tables()
    
    # 剧本目录
    scripts_dir = Path("../scripts")
    
    if not scripts_dir.exists():
        print("❌ scripts目录不存在")
        return
    
    db = next(get_db())
    
    try:
        # 遍历所有JSON文件
        for script_file in scripts_dir.glob("*.json"):
            try:
                print(f"\n📖 处理剧本文件: {script_file.name}")
                
                with open(script_file, 'r', encoding='utf-8') as f:
                    script_data = json.load(f)
                
                # 生成剧本ID（基于文件名）
                script_id = script_file.stem.replace(' ', '_').replace('，', '_').replace('。', '_')
                
                # 检查是否已存在
                existing = db.query(Script).filter(Script.id == script_id).first()
                if existing:
                    print(f"  ⚠️ 剧本已存在，跳过: {script_id}")
                    continue
                
                # 准备剧本数据
                script_dict = {
                    'id': script_id,
                    'title': script_data.get('title', script_file.stem),
                    'description': script_data.get('description', ''),
                    'author': script_data.get('author', '未知'),
                    'globalStory': script_data.get('globalStory', ''),
                    'characters': script_data.get('characters', [])
                }
                
                # 创建剧本
                script = dict_to_script(script_dict)
                db.add(script)
                
                # 创建角色
                for char_data in script_dict['characters']:
                    character = dict_to_character(char_data, script_id)
                    db.add(character)
                
                db.commit()
                print(f"  ✅ 剧本迁移成功: {script_id} - {script_dict['title']}")
                
            except Exception as e:
                print(f"  ❌ 处理文件失败 {script_file.name}: {e}")
                db.rollback()
        
        # 创建您提到的剧本（如果不存在）
        linan_script_id = "linan_night_rain_fanlou_legacy"
        existing_linan = db.query(Script).filter(Script.id == linan_script_id).first()
        
        if not existing_linan:
            print(f"\n📝 创建剧本: {linan_script_id}")
            
            linan_script_data = {
                'id': linan_script_id,
                'title': '临安夜雨翻楼遗案',
                'description': '南宋临安城中发生的一起神秘谋杀案',
                'author': '系统生成',
                'globalStory': '南宋临安城，夜雨如注。翻楼酒肆中发生了一起离奇的谋杀案，死者身份神秘，现场疑点重重...',
                'characters': [
                    {
                        'name': '李捕头',
                        'bio': '临安府捕头，办案经验丰富',
                        'personality': '谨慎细心，善于推理',
                        'secret': '与死者有旧怨',
                        'isPlayer': True,
                        'roleType': '玩家'
                    },
                    {
                        'name': '王掌柜',
                        'bio': '翻楼酒肆的掌柜',
                        'personality': '精明世故，善于察言观色',
                        'secret': '知道死者的真实身份',
                        'isVictim': False,
                        'roleType': '嫌疑人'
                    },
                    {
                        'name': '神秘客人',
                        'bio': '案发当晚的神秘客人',
                        'personality': '沉默寡言，行踪诡秘',
                        'secret': '真正的凶手',
                        'isKiller': True,
                        'isVictim': False,
                        'roleType': '凶手'
                    },
                    {
                        'name': '死者',
                        'bio': '被害人，身份成谜',
                        'personality': '生前谨慎小心',
                        'secret': '掌握重要秘密',
                        'isVictim': True,
                        'roleType': '受害者'
                    }
                ]
            }
            
            script = dict_to_script(linan_script_data)
            db.add(script)
            
            for char_data in linan_script_data['characters']:
                character = dict_to_character(char_data, linan_script_id)
                db.add(character)
            
            db.commit()
            print(f"  ✅ 剧本创建成功: {linan_script_id}")
        
        # 显示最终结果
        all_scripts = db.query(Script).all()
        print(f"\n📊 数据库中的剧本总数: {len(all_scripts)}")
        for script in all_scripts:
            print(f"  - {script.id}: {script.title}")
        
        print("\n🎉 剧本迁移完成！")
        
    except Exception as e:
        print(f"❌ 迁移过程中发生错误: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    migrate_scripts()
