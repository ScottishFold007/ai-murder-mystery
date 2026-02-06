from sqlalchemy import create_engine, Column, Integer, String, Text, DateTime, Boolean, ForeignKey, Float
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime
import json
import os

Base = declarative_base()

class Script(Base):
    __tablename__ = 'scripts'
    
    id = Column(String, primary_key=True)
    title = Column(String, nullable=False)
    description = Column(Text)
    author = Column(String)
    version = Column(String, default='1.0.0')
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    global_story = Column(Text)
    source_type = Column(String, default='manual')  # 'manual' or 'ai'
    
    # 封面相关字段
    cover_image_path = Column(String)  # 封面文件路径
    cover_image_filename = Column(String)  # 封面文件名
    
    # 设置相关字段
    theme = Column(String, default='dark')
    difficulty = Column(String, default='medium')  # 'easy', 'medium', 'hard'
    estimated_duration = Column(Integer, default=60)  # 分钟
    hidden_killer = Column(String)  # 隐藏的凶手设定
    player_name = Column(String, default='调查者')
    player_role = Column(String)
    partner_role = Column(String)
    killer_role = Column(String)
    
    # 关联关系
    characters = relationship("Character", back_populates="script", cascade="all, delete-orphan")
    quiz_questions = relationship("QuizQuestion", back_populates="script", cascade="all, delete-orphan")
    spoiler_stories = relationship("SpoilerStory", back_populates="script", cascade="all, delete-orphan")
    script_evidences = relationship("ScriptEvidence", back_populates="script", cascade="all, delete-orphan")

class Character(Base):
    __tablename__ = 'characters'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    script_id = Column(String, ForeignKey('scripts.id'), nullable=False)
    
    name = Column(String, nullable=False)
    bio = Column(Text)
    personality = Column(Text)
    context = Column(Text)
    secret = Column(Text)
    violation = Column(Text)
    
    # 头像相关字段
    image_path = Column(String)  # 头像文件路径
    image_filename = Column(String, default='officer.png')  # 头像文件名
    
    # 角色标记
    is_victim = Column(Boolean, default=False)
    is_detective = Column(Boolean, default=False)
    is_killer = Column(Boolean, default=False)
    is_assistant = Column(Boolean, default=False)
    is_player = Column(Boolean, default=False)
    is_partner = Column(Boolean, default=False)
    role_type = Column(String, default='嫌疑人')  # '玩家', '搭档', '凶手', '嫌疑人'
    
    # 关联关系
    script = relationship("Script", back_populates="characters")

class QuizQuestion(Base):
    __tablename__ = 'quiz_questions'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    script_id = Column(String, ForeignKey('scripts.id'), nullable=False)
    
    question = Column(Text, nullable=False)
    choices = Column(Text)  # JSON格式存储选择项
    correct_answer = Column(String)
    order_index = Column(Integer, default=0)  # 题目顺序
    
    # 关联关系
    script = relationship("Script", back_populates="quiz_questions")

class SpoilerStory(Base):
    __tablename__ = 'spoiler_stories'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    script_id = Column(String, ForeignKey('scripts.id'), nullable=False)
    
    title = Column(String, nullable=False)  # 故事标题
    content = Column(Text, nullable=False)  # 故事内容（Markdown格式）
    generated_at = Column(DateTime, default=datetime.utcnow)  # 生成时间
    word_count = Column(Integer, default=0)  # 字数统计
    generation_duration = Column(Float, default=0.0)  # 生成耗时（秒）
    
    # AI生成相关信息
    ai_model = Column(String, default='gpt-4')  # 使用的AI模型
    prompt_version = Column(String, default='v1.0')  # 提示词版本
    session_id = Column(String)  # 生成时的会话ID
    
    # 关联关系
    script = relationship("Script", back_populates="spoiler_stories")

class ScriptEvidence(Base):
    __tablename__ = 'script_evidences'
    
    id = Column(String, primary_key=True)
    script_id = Column(String, ForeignKey('scripts.id'), nullable=False)
    
    name = Column(String, nullable=False)  # 物品名称
    description = Column(Text, nullable=False)  # 物品描述（用于文生图）
    category = Column(String, default='physical')  # 'physical', 'document', 'digital', 'testimony', 'combination'
    importance = Column(String, default='medium')  # 'low', 'medium', 'high', 'critical'
    initial_state = Column(String, default='surface')  # 'hidden', 'surface', 'investigated'
    image_filename = Column(String)  # 证物图片文件名
    
    # 关联角色（JSON格式存储）
    related_characters = Column(Text)  # JSON array of character names
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # 关联关系
    script = relationship("Script", back_populates="script_evidences")

# 数据库配置
# 使用专门的data文件夹存放数据库文件
DATA_DIR = os.path.join(os.path.dirname(__file__), '..', 'data')
os.makedirs(DATA_DIR, exist_ok=True)
DATABASE_URL = os.getenv('DATABASE_URL', f'sqlite:///{os.path.join(DATA_DIR, "murder_mystery.db")}')
engine = create_engine(DATABASE_URL, echo=False)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def create_tables():
    """创建所有数据库表"""
    Base.metadata.create_all(bind=engine)
    print("✅ 数据库表创建成功")

def get_db():
    """获取数据库会话"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# 数据转换工具函数
def script_to_dict(script: Script) -> dict:
    """将数据库Script对象转换为前端需要的字典格式"""
    characters_data = []
    for char in script.characters:
        characters_data.append({
            'name': char.name,
            'bio': char.bio or '',
            'personality': char.personality or '',
            'context': char.context or '',
            'secret': char.secret or '',
            'violation': char.violation or '',
            'image': char.image_filename or 'officer.png',
            'isVictim': char.is_victim,
            'isDetective': char.is_detective,
            'isKiller': char.is_killer,
            'isAssistant': char.is_assistant,
            'isPlayer': char.is_player,
            'isPartner': char.is_partner,
            'roleType': char.role_type
        })
    
    quiz_data = []
    for quiz in script.quiz_questions:
        choices = json.loads(quiz.choices) if quiz.choices else []
        quiz_data.append({
            'question': quiz.question,
            'choices': choices,
            'correctAnswer': quiz.correct_answer
        })
    
    evidences_data = []
    for evidence in script.script_evidences:
        related_chars = json.loads(evidence.related_characters) if evidence.related_characters else []
        evidences_data.append({
            'id': evidence.id,
            'name': evidence.name,
            'description': evidence.description,
            'category': evidence.category,
            'importance': evidence.importance,
            'relatedCharacters': related_chars,
            'initialState': evidence.initial_state,
            'image': evidence.image_filename
        })
    
    # 构建封面图片路径
    cover_image = None
    if script.cover_image_filename:
        cover_image = f"/script_covers/{script.cover_image_filename}"
    
    return {
        'id': script.id,
        'title': script.title,
        'description': script.description or '',
        'author': script.author or '',
        'version': script.version,
        'createdAt': script.created_at.isoformat() if script.created_at else '',
        'updatedAt': script.updated_at.isoformat() if script.updated_at else '',
        'globalStory': script.global_story or '',
        'sourceType': script.source_type,
        'coverImage': cover_image,
        'characters': characters_data,
        'evidences': evidences_data if evidences_data else [],
        'quiz': quiz_data if quiz_data else None,
        'settings': {
            'theme': script.theme,
            'difficulty': script.difficulty,
            'estimatedDuration': script.estimated_duration,
            'hiddenKiller': script.hidden_killer,
            'playerName': script.player_name,
            'playerRole': script.player_role,
            'partnerRole': script.partner_role,
            'killerRole': script.killer_role
        }
    }

def dict_to_script(data: dict, script: Script = None) -> Script:
    """将前端字典格式转换为数据库Script对象"""
    if script is None:
        script = Script()
    
    # 基本信息
    script.id = data.get('id')
    script.title = data.get('title', '')
    script.description = data.get('description', '')
    script.author = data.get('author', '')
    script.version = data.get('version', '1.0.0')
    script.global_story = data.get('globalStory', '')
    script.source_type = data.get('sourceType', 'manual')
    
    # 处理时间字段
    if 'createdAt' in data and data['createdAt']:
        try:
            script.created_at = datetime.fromisoformat(data['createdAt'].replace('Z', '+00:00'))
        except:
            script.created_at = datetime.utcnow()
    
    if 'updatedAt' in data and data['updatedAt']:
        try:
            script.updated_at = datetime.fromisoformat(data['updatedAt'].replace('Z', '+00:00'))
        except:
            script.updated_at = datetime.utcnow()
    
    # 处理封面
    cover_image = data.get('coverImage')
    if cover_image:
        if cover_image.startswith('/script_covers/'):
            script.cover_image_filename = cover_image.replace('/script_covers/', '')
            script.cover_image_path = cover_image
        elif cover_image.startswith('data:image/'):
            # base64数据需要保存为文件
            script.cover_image_filename = f"script_cover_{script.id}_{int(datetime.utcnow().timestamp() * 1000)}.png"
            script.cover_image_path = f"/script_covers/{script.cover_image_filename}"
    
    # 处理设置
    settings = data.get('settings', {})
    script.theme = settings.get('theme', 'dark')
    script.difficulty = settings.get('difficulty', 'medium')
    script.estimated_duration = settings.get('estimatedDuration', 60)
    script.hidden_killer = settings.get('hiddenKiller')
    script.player_name = settings.get('playerName', '调查者')
    script.player_role = settings.get('playerRole')
    script.partner_role = settings.get('partnerRole')
    script.killer_role = settings.get('killerRole')
    
    # 处理证物（注意：实际保存到数据库时会在API层处理ScriptEvidence对象的创建）
    # 这里只是为了数据完整性检查
    evidences_data = data.get('evidences', [])
    if evidences_data:
        print(f"🔍 剧本包含 {len(evidences_data)} 个证物定义")
    
    return script

def dict_to_character(data: dict, script_id: str, character: Character = None) -> Character:
    """将前端字典格式转换为数据库Character对象"""
    if character is None:
        character = Character()
    
    character.script_id = script_id
    character.name = data.get('name', '')
    character.bio = data.get('bio', '')
    character.personality = data.get('personality', '')
    character.context = data.get('context', '')
    character.secret = data.get('secret', '')
    character.violation = data.get('violation', '')
    
    # 处理头像
    image = data.get('image', 'officer.png')
    if image.startswith('/character_avatars/'):
        character.image_filename = image.replace('/character_avatars/', '')
        character.image_path = image
    else:
        character.image_filename = image
        character.image_path = f"/character_avatars/{image}"
    
    # 角色标记
    character.is_victim = data.get('isVictim', False)
    character.is_detective = data.get('isDetective', False)
    character.is_killer = data.get('isKiller', False)
    character.is_assistant = data.get('isAssistant', False)
    character.is_player = data.get('isPlayer', False)
    character.is_partner = data.get('isPartner', False)
    character.role_type = data.get('roleType', '嫌疑人')
    
    return character

def dict_to_quiz_question(data: dict, script_id: str, order_index: int = 0) -> QuizQuestion:
    """将前端字典格式转换为数据库QuizQuestion对象"""
    quiz = QuizQuestion()
    quiz.script_id = script_id
    quiz.question = data.get('question', '')
    quiz.choices = json.dumps(data.get('choices', []), ensure_ascii=False)
    quiz.correct_answer = data.get('correctAnswer')
    quiz.order_index = order_index
    
    return quiz

def dict_to_script_evidence(data: dict, script_id: str, evidence: ScriptEvidence = None) -> ScriptEvidence:
    """将前端字典格式转换为数据库ScriptEvidence对象"""
    if evidence is None:
        evidence = ScriptEvidence()
    
    evidence.id = data.get('id', '')
    evidence.script_id = script_id
    evidence.name = data.get('name', '')
    evidence.description = data.get('description', '')
    evidence.category = data.get('category', 'physical')
    evidence.importance = data.get('importance', 'medium')
    evidence.initial_state = data.get('initialState', 'surface')
    evidence.image_filename = data.get('image')
    
    # 处理关联角色（JSON格式存储）
    related_characters = data.get('relatedCharacters', [])
    evidence.related_characters = json.dumps(related_characters, ensure_ascii=False)
    
    return evidence

def spoiler_story_to_dict(story: 'SpoilerStory') -> dict:
    """将数据库SpoilerStory对象转换为前端需要的字典格式"""
    return {
        'id': story.id,
        'scriptId': story.script_id,
        'title': story.title,
        'content': story.content,
        'generatedAt': story.generated_at.isoformat() if story.generated_at else '',
        'wordCount': story.word_count,
        'generationDuration': story.generation_duration,
        'aiModel': story.ai_model,
        'promptVersion': story.prompt_version,
        'sessionId': story.session_id
    }

def dict_to_spoiler_story(data: dict, script_id: str, story: 'SpoilerStory' = None) -> 'SpoilerStory':
    """将前端字典格式转换为数据库SpoilerStory对象"""
    if story is None:
        story = SpoilerStory()
    
    story.script_id = script_id
    story.title = data.get('title', '剧透故事')
    story.content = data.get('content', '')
    story.word_count = len(data.get('content', ''))
    story.generation_duration = data.get('generationDuration', 0.0)
    # 注意：aiModel和promptVersion将在spoiler_story_api中设置为实际值
    story.ai_model = data.get('aiModel', '')  # 空值，将在API中填充
    story.prompt_version = data.get('promptVersion', '')  # 空值，将在API中填充
    story.session_id = data.get('sessionId', '')
    
    # 处理时间字段
    if 'generatedAt' in data and data['generatedAt']:
        try:
            story.generated_at = datetime.fromisoformat(data['generatedAt'].replace('Z', '+00:00'))
        except:
            story.generated_at = datetime.utcnow()
    else:
        story.generated_at = datetime.utcnow()
    
    return story
