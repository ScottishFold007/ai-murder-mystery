# 简化的SQLite数据库管理
import sqlite3
import json
import os
from datetime import datetime
from typing import Dict, List, Any, Optional

class SimpleScriptDB:
    def __init__(self, db_path: str = "murder_mystery_simple.db"):
        self.db_path = db_path
        self.init_database()
    
    def init_database(self):
        """初始化数据库表"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # 创建剧本表
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS scripts (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                description TEXT,
                author TEXT,
                version TEXT DEFAULT '1.0.0',
                created_at TEXT,
                updated_at TEXT,
                global_story TEXT,
                source_type TEXT DEFAULT 'manual',
                cover_image_path TEXT,
                cover_image_filename TEXT,
                characters_json TEXT,
                settings_json TEXT,
                quiz_json TEXT
            )
        ''')
        
        # 创建证物表
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS evidences (
                id TEXT PRIMARY KEY,
                script_id TEXT NOT NULL,
                name TEXT NOT NULL,
                description TEXT,
                overview TEXT,
                clues TEXT,
                category TEXT,
                image_path TEXT,
                image_filename TEXT,
                importance TEXT DEFAULT 'normal',
                initial_state TEXT DEFAULT 'surface',
                related_characters TEXT,
                created_at TEXT,
                updated_at TEXT,
                FOREIGN KEY (script_id) REFERENCES scripts (id) ON DELETE CASCADE
            )
        ''')
        
        # 升级现有数据库表结构
        self._upgrade_evidences_table(cursor)
        
        conn.commit()
        conn.close()
        print("✅ 简化数据库初始化完成")
    
    def _upgrade_evidences_table(self, cursor):
        """升级证物表结构，添加缺失的字段"""
        try:
            # 检查表是否存在
            cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='evidences'")
            if not cursor.fetchone():
                return  # 表不存在，不需要升级
            
            # 获取现有列
            cursor.execute("PRAGMA table_info(evidences)")
            existing_columns = {row[1] for row in cursor.fetchall()}
            
            # 需要添加的列
            columns_to_add = {
                'overview': 'TEXT',
                'clues': 'TEXT',
                'initial_state': "TEXT DEFAULT 'surface'",
                'related_characters': 'TEXT'
            }
            
            # 添加缺失的列
            for column_name, column_type in columns_to_add.items():
                if column_name not in existing_columns:
                    try:
                        cursor.execute(f'ALTER TABLE evidences ADD COLUMN {column_name} {column_type}')
                        print(f"✅ 添加证物表字段: {column_name}")
                    except Exception as e:
                        print(f"⚠️ 添加字段 {column_name} 失败: {e}")
        
        except Exception as e:
            print(f"⚠️ 升级证物表结构失败: {e}")
    
    def save_script(self, script_data: Dict[str, Any]) -> bool:
        """保存剧本到数据库"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            script_id = script_data.get('id')
            title = script_data.get('title', '')
            description = script_data.get('description', '')
            author = script_data.get('author', '')
            version = script_data.get('version', '1.0.0')
            created_at = script_data.get('createdAt', datetime.utcnow().isoformat())
            updated_at = script_data.get('updatedAt', datetime.utcnow().isoformat())
            global_story = script_data.get('globalStory', '')
            source_type = script_data.get('sourceType', 'manual')
            
            # 处理封面
            cover_image = script_data.get('coverImage')
            cover_image_path = None
            cover_image_filename = None
            
            if cover_image:
                if cover_image.startswith('data:image/'):
                    # 保存base64封面为文件
                    try:
                        base64_data = cover_image.split(',')[1]
                        timestamp = int(datetime.utcnow().timestamp() * 1000)
                        cover_filename = f"script_cover_{script_id}_{timestamp}.png"
                        
                        # 保存到public目录
                        public_dir = os.path.join(os.path.dirname(__file__), '..', 'web', 'public', 'script_covers')
                        os.makedirs(public_dir, exist_ok=True)
                        
                        import base64 as b64
                        image_data = b64.b64decode(base64_data)
                        public_path = os.path.join(public_dir, cover_filename)
                        
                        with open(public_path, 'wb') as f:
                            f.write(image_data)
                        
                        cover_image_filename = cover_filename
                        cover_image_path = f"/script_covers/{cover_filename}"
                        
                        print(f"📁 封面文件已保存: {cover_filename}")
                        
                    except Exception as e:
                        print(f"⚠️ 保存封面文件失败: {e}")
                elif cover_image.startswith('/script_covers/'):
                    # 已经是文件路径
                    cover_image_path = cover_image
                    cover_image_filename = cover_image.replace('/script_covers/', '')
            
            # 序列化复杂字段
            characters_json = json.dumps(script_data.get('characters', []), ensure_ascii=False)
            settings_json = json.dumps(script_data.get('settings', {}), ensure_ascii=False)
            quiz_json = json.dumps(script_data.get('quiz', []), ensure_ascii=False)
            
            # 插入或更新数据
            cursor.execute('''
                INSERT OR REPLACE INTO scripts 
                (id, title, description, author, version, created_at, updated_at, 
                 global_story, source_type, cover_image_path, cover_image_filename,
                 characters_json, settings_json, quiz_json)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                script_id, title, description, author, version, created_at, updated_at,
                global_story, source_type, cover_image_path, cover_image_filename,
                characters_json, settings_json, quiz_json
            ))
            
            conn.commit()
            conn.close()
            
            print(f"✅ 剧本保存到数据库成功: {title}")
            return True
            
        except Exception as e:
            print(f"❌ 保存剧本到数据库失败: {e}")
            return False
    
    def get_all_scripts(self) -> List[Dict[str, Any]]:
        """获取所有剧本"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute('''
                SELECT id, title, description, author, version, created_at, updated_at,
                       global_story, source_type, cover_image_path, cover_image_filename,
                       characters_json, settings_json, quiz_json
                FROM scripts
                ORDER BY updated_at DESC
            ''')
            
            rows = cursor.fetchall()
            conn.close()
            
            scripts = []
            for row in rows:
                script = {
                    'id': row[0],
                    'title': row[1],
                    'description': row[2] or '',
                    'author': row[3] or '',
                    'version': row[4],
                    'createdAt': row[5],
                    'updatedAt': row[6],
                    'globalStory': row[7] or '',
                    'sourceType': row[8],
                    'coverImage': row[9],  # 使用路径
                    'characters': json.loads(row[11]) if row[11] else [],
                    'settings': json.loads(row[12]) if row[12] else {},
                    'quiz': json.loads(row[13]) if row[13] else []
                }
                scripts.append(script)
            
            print(f"📋 从数据库加载剧本: {len(scripts)} 个")
            return scripts
            
        except Exception as e:
            print(f"❌ 从数据库获取剧本失败: {e}")
            return []
    
    def get_script(self, script_id: str) -> Optional[Dict[str, Any]]:
        """获取指定剧本"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute('''
                SELECT id, title, description, author, version, created_at, updated_at,
                       global_story, source_type, cover_image_path, cover_image_filename,
                       characters_json, settings_json, quiz_json
                FROM scripts
                WHERE id = ?
            ''', (script_id,))
            
            row = cursor.fetchone()
            conn.close()
            
            if row:
                script = {
                    'id': row[0],
                    'title': row[1],
                    'description': row[2] or '',
                    'author': row[3] or '',
                    'version': row[4],
                    'createdAt': row[5],
                    'updatedAt': row[6],
                    'globalStory': row[7] or '',
                    'sourceType': row[8],
                    'coverImage': row[9],
                    'characters': json.loads(row[11]) if row[11] else [],
                    'settings': json.loads(row[12]) if row[12] else {},
                    'quiz': json.loads(row[13]) if row[13] else []
                }
                print(f"📖 从数据库获取剧本: {script['title']}")
                return script
            else:
                return None
                
        except Exception as e:
            print(f"❌ 从数据库获取剧本失败: {e}")
            return None
    
    def delete_script(self, script_id: str) -> bool:
        """删除剧本"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            # 先获取封面文件名
            cursor.execute('SELECT cover_image_filename FROM scripts WHERE id = ?', (script_id,))
            row = cursor.fetchone()
            
            if row and row[0]:
                # 删除封面文件
                try:
                    public_dir = os.path.join(os.path.dirname(__file__), '..', 'web', 'public', 'script_covers')
                    file_path = os.path.join(public_dir, row[0])
                    if os.path.exists(file_path):
                        os.remove(file_path)
                        print(f"🗑️ 删除封面文件: {row[0]}")
                except Exception as e:
                    print(f"⚠️ 删除封面文件失败: {e}")
            
            # 删除数据库记录
            cursor.execute('DELETE FROM scripts WHERE id = ?', (script_id,))
            conn.commit()
            conn.close()
            
            print(f"✅ 从数据库删除剧本成功: {script_id}")
            return True
            
        except Exception as e:
            print(f"❌ 从数据库删除剧本失败: {e}")
            return False
    
    def save_evidence(self, evidence_data: Dict[str, Any]) -> bool:
        """保存证物到数据库"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            evidence_id = evidence_data.get('id')
            script_id = evidence_data.get('script_id') or evidence_data.get('scriptId')
            name = evidence_data.get('name', '')
            description = evidence_data.get('description', '')
            overview = evidence_data.get('overview', '')
            clues = evidence_data.get('clues', '')
            category = evidence_data.get('category', 'physical')
            importance = evidence_data.get('importance', 'normal')
            initial_state = evidence_data.get('initialState', 'surface')
            created_at = evidence_data.get('createdAt', datetime.utcnow().isoformat())
            updated_at = evidence_data.get('updatedAt', datetime.utcnow().isoformat())
            
            # 处理关联角色（JSON格式存储）
            related_characters = evidence_data.get('relatedCharacters', [])
            related_characters_json = json.dumps(related_characters, ensure_ascii=False)
            
            # 处理图片
            image_path = None
            image_filename = None
            image_data_field = evidence_data.get('image')
            
            if image_data_field:
                if image_data_field.startswith('data:image/'):
                    # 保存base64图片为文件
                    try:
                        base64_data = image_data_field.split(',')[1]
                        timestamp = int(datetime.utcnow().timestamp() * 1000)
                        safe_name = evidence_data.get('name', 'evidence').replace(' ', '_')
                        image_filename = f"evidence_{safe_name}_{timestamp}.png"
                        
                        # 保存到evidence_images目录
                        evidence_dir = os.path.join(os.path.dirname(__file__), '..', 'web', 'public', 'evidence_images')
                        os.makedirs(evidence_dir, exist_ok=True)
                        
                        import base64 as b64
                        image_data_bytes = b64.b64decode(base64_data)
                        image_file_path = os.path.join(evidence_dir, image_filename)
                        
                        with open(image_file_path, 'wb') as f:
                            f.write(image_data_bytes)
                        
                        image_path = f"/evidence_images/{image_filename}"
                        
                        print(f"📁 证物图片已保存: {image_filename}")
                        
                    except Exception as e:
                        print(f"⚠️ 保存证物图片失败: {e}")
                elif image_data_field.startswith('/evidence_images/'):
                    # 已经是文件路径
                    image_path = image_data_field
                    image_filename = image_data_field.replace('/evidence_images/', '')
            
            # 插入或更新数据
            cursor.execute('''
                INSERT OR REPLACE INTO evidences 
                (id, script_id, name, description, overview, clues, category, image_path, image_filename, 
                 importance, initial_state, related_characters, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                evidence_id, script_id, name, description, overview, clues, category, image_path, 
                image_filename, importance, initial_state, related_characters_json, created_at, updated_at
            ))
            
            conn.commit()
            conn.close()
            
            print(f"✅ 证物保存到数据库成功: {name}")
            return True
            
        except Exception as e:
            print(f"❌ 保存证物到数据库失败: {e}")
            return False
    
    def get_evidences_by_script(self, script_id: str) -> List[Dict[str, Any]]:
        """获取指定剧本的所有证物"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute('''
                SELECT id, script_id, name, description, overview, clues, category, image_path, 
                       importance, initial_state, related_characters, created_at, updated_at
                FROM evidences
                WHERE script_id = ?
                ORDER BY created_at DESC
            ''', (script_id,))
            
            rows = cursor.fetchall()
            conn.close()
            
            evidences = []
            for row in rows:
                # 解析关联角色JSON
                related_characters = []
                if row[10]:  # related_characters
                    try:
                        related_characters = json.loads(row[10])
                    except:
                        related_characters = []
                
                evidence = {
                    'id': row[0],
                    'script_id': row[1],
                    'name': row[2],
                    'description': row[3] or '',
                    'overview': row[4] or '',
                    'clues': row[5] or '',
                    'category': row[6] or 'physical',
                    'image': row[7],  # 使用路径
                    'importance': row[8] or 'normal',
                    'initialState': row[9] or 'surface',
                    'relatedCharacters': related_characters,
                    'createdAt': row[11],
                    'updatedAt': row[12]
                }
                evidences.append(evidence)
            
            print(f"📋 从数据库加载证物 (剧本 {script_id}): {len(evidences)} 个")
            return evidences
            
        except Exception as e:
            print(f"❌ 从数据库获取证物失败: {e}")
            return []
    
    def delete_evidence(self, evidence_id: str) -> bool:
        """删除证物"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            # 先获取图片文件名
            cursor.execute('SELECT image_filename FROM evidences WHERE id = ?', (evidence_id,))
            row = cursor.fetchone()
            
            if row and row[0]:
                # 删除图片文件
                try:
                    evidence_dir = os.path.join(os.path.dirname(__file__), '..', 'web', 'public', 'evidence_images')
                    file_path = os.path.join(evidence_dir, row[0])
                    if os.path.exists(file_path):
                        os.remove(file_path)
                        print(f"🗑️ 删除证物图片: {row[0]}")
                except Exception as e:
                    print(f"⚠️ 删除证物图片失败: {e}")
            
            # 删除数据库记录
            cursor.execute('DELETE FROM evidences WHERE id = ?', (evidence_id,))
            conn.commit()
            conn.close()
            
            print(f"✅ 从数据库删除证物成功: {evidence_id}")
            return True
            
        except Exception as e:
            print(f"❌ 从数据库删除证物失败: {e}")
            return False

# 全局实例
simple_db = SimpleScriptDB()
