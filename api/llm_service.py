import os
import time
from datetime import datetime, timezone
from invoke_types import InvocationRequest, Actor, LLMMessage
from settings import MODEL, MODEL_KEY, MAX_TOKENS, INFERENCE_SERVICE, API_KEY, OLLAMA_URL, GROQ_API_BASE, OPENROUTER_API_BASE, OPENAI_API_BASE
import json
import anthropic
import openai
import requests


# NOTE: increment PROMPT_VERSION if you make ANY changes to these prompts

def get_actor_prompt(actor: Actor, detective_name: str = "夏洛克侦探"):
    # 构建角色类型描述
    role_description = ""
    if actor.roleType:
        if actor.roleType == '嫌疑人':
            role_description = f"【身份】你是{actor.roleType}，在这起案件中可能有嫌疑，需要谨慎应对调查者的询问。"
        elif actor.roleType == '凶手':
            role_description = f"【身份】你是{actor.roleType}，但在对话中必须隐瞒这一身份，表现得像一个普通的嫌疑人。"
        elif actor.roleType == '搭档':
            role_description = f"【身份】你是调查者的{actor.roleType}，应该协助调查但保持客观中立。"
        elif actor.roleType == '玩家':
            role_description = f"【身份】你是{actor.roleType}角色，正在主导这次调查。"
        else:
            role_description = f"【身份】你的角色类型是{actor.roleType}。"
    
    return (f"你是{actor.name}，正在与{detective_name}对话。"
            f"你的输出需要是对话回应。"
            f"{role_description}"
            f"忠于故事背景，保持角色特征，严格按照剧本设定，不要创造剧本中没有的角色、地点或事件。"
            f"只能基于剧本中已有的角色和情节进行对话。"
            f"【动作描述规范】如果需要描述动作或神态，请用括号包围，并使用第三人称描述（如：（她轻声说道，目光微微下垂））。"
            f"避免使用第一人称（我、我的等），统一使用第三人称（她、他、她的等）来描述{actor.name}的动作和神态。"
            f"在所有消息中应该体现的你的个性是：{actor.personality} "
            f"{actor.context} {actor.secret}")

def generate_character_background_prompt(actor: Actor) -> str:
    """
    根据角色特点生成居所背景的文生图提示词
    
    Args:
        actor: 角色对象，包含名字、背景、性格等信息
        
    Returns:
        适合文生图的居所背景描述
    """
    # 基于角色背景和性格特点推断居所类型
    bio_lower = actor.bio.lower() if actor.bio else ""
    personality_lower = actor.personality.lower() if actor.personality else ""
    context_lower = actor.context.lower() if actor.context else ""
    
    # 合并所有文本进行分析
    all_text = f"{bio_lower} {personality_lower} {context_lower}"
    
    # 定义角色类型与居所的映射关系
    location_mappings = {
        # 商业类
        ('商人', '商会', '贸易'): "古典商会大厅，红木家具，账簿满桌，金币散落，温暖烛光，丝绸帷幔",
        ('富商', '财主', '老板'): "豪华书房，紫檀木桌，古董花瓶，字画满墙，精致茶具，雕花屏风",
        
        # 军事类
        ('将军', '军官', '士兵'): "军营帐篷内部，地图桌案，兵器架，战旗悬挂，油灯昏黄，铠甲陈列",
        ('武将', '统帅', '军事'): "军营指挥部，沙盘地图，令旗插立，刀剑悬壁，战略图纸，庄严肃穆",
        
        # 文人学者类
        ('文人', '学者', '书生'): "古雅书房，书架林立，文房四宝，古籍成堆，梅花盆景，清香袅袅",
        ('教师', '先生', '夫子'): "私塾内景，木桌竹椅，笔墨纸砚，古书满架，窗外竹影，清雅宁静",
        
        # 官员类
        ('官员', '大人', '知府'): "官府大堂，朱红柱梁，公案威严，印章文书，屏风隔断，庄重典雅",
        ('县令', '知县', '府尹'): "衙门内室，公文满桌，印信盒匣，法度条文，官服悬挂，威严肃穆",
        
        # 江湖类
        ('侠客', '剑客', '武侠'): "客栈雅间，木桌酒壶，长剑倚墙，江湖地图，酒香四溢，月光如水",
        ('盗贼', '刺客', '杀手'): "隐秘密室，暗器满墙，黑衣蒙面，蜡烛摇曳，阴影重重，神秘莫测",
        
        # 医者类
        ('医生', '大夫', '郎中'): "中医药房，药柜满墙，银针盒匣，古方医书，药香浓郁，悬壶济世",
        ('药师', '医师', '医者'): "医馆内景，药材满架，处方笺纸，医书典籍，药炉煎煮，杏林春暖",
        
        # 艺人类
        ('歌女', '舞女', '艺伎'): "花楼雅室，珠帘垂幔，胭脂水粉，丝竹乐器，香炉袅烟，脂粉飘香",
        ('戏子', '伶人', '艺人'): "戏台后台，戏服满架，脸谱面具，胭脂油彩，锣鼓乐器，梨园风情",
        
        # 宗教类
        ('道士', '道人', '真人'): "道观静室，八卦图案，香炉鼎立，经书卷轴，蒲团静坐，仙风道骨",
        ('和尚', '僧人', '法师'): "禅房内景，木鱼经书，莲花香炉，佛像庄严，青灯古卷，梵音缭绕",
        
        # 平民类
        ('农夫', '农民', '村民'): "农家小院，土炕火灶，农具满墙，粗茶淡饭，鸡鸣犬吠，田园风光",
        ('工匠', '铁匠', '木匠'): "工坊内景，工具满架，半成品散落，炉火通红，汗水淋漓，匠心独运",
    }
    
    # 寻找匹配的居所类型
    matched_description = "古朴雅室，简约陈设，木桌竹椅，书卷几案，清茶一壶，宁静致远"  # 默认描述
    
    for keywords, description in location_mappings.items():
        if any(keyword in all_text for keyword in keywords):
            matched_description = description
            break
    
    # 根据性格特点调整氛围
    atmosphere_modifiers = []
    if any(word in all_text for word in ['冷静', '理性', '沉着']):
        atmosphere_modifiers.append("光线柔和，氛围宁静")
    if any(word in all_text for word in ['热情', '开朗', '活泼']):
        atmosphere_modifiers.append("光线明亮，色彩温暖")
    if any(word in all_text for word in ['神秘', '阴沉', '诡异']):
        atmosphere_modifiers.append("阴影深重，烛光摇曳")
    if any(word in all_text for word in ['优雅', '高贵', '精致']):
        atmosphere_modifiers.append("装饰华美，细节精致")
    
    # 构建最终的提示词
    final_prompt = f"""
室内场景，{matched_description}，
{', '.join(atmosphere_modifiers) if atmosphere_modifiers else '古典韵味，意境深远'}，
精美装饰，层次丰富，
适合作为聊天背景，横版构图，电影级渲染质量，
高清细腻，色彩和谐，光影效果佳。
    """.strip()
    
    return final_prompt

def extract_character_names_from_story(global_story: str, all_actors: list = None) -> list:
    """从角色数据中提取在故事中出现的角色名称"""
    if not all_actors:
        return []
    
    # 从all_actors获取准确的角色名（排除玩家角色）
    actor_names = []
    for actor in all_actors:
        if hasattr(actor, 'name') and actor.name and not getattr(actor, 'isPlayer', False):
            actor_names.append(actor.name)
    
    # 从故事中验证这些名字是否出现
    mentioned_names = []
    for name in actor_names:
        if name in global_story:
            mentioned_names.append(name)
    
    return mentioned_names

def get_system_prompt(request: InvocationRequest):
    detective_name = request.detective_name or "调查人"
    victim_name = request.victim_name or "受害者"
    
    # 为搭档角色添加具体的角色信息
    additional_context = ""
    if request.actor.isAssistant or request.actor.isPartner:
        # 从角色数据中提取在故事中出现的角色信息
        all_actors_list = request.all_actors if request.all_actors else []
        character_names = extract_character_names_from_story(request.global_story, all_actors_list)
        
        # 调试输出
        print(f"🔍 提取到的角色名称: {character_names}")
        print(f"🔍 全局故事片段: {request.global_story[:200]}...")
        
        # 构建角色详细信息（仅公开信息，不包含秘密和违规原则）
        character_details = []
        if request.all_actors:
            for actor in request.all_actors:
                if actor.name and not getattr(actor, 'isPlayer', False):
                    # 只提供公开信息：姓名、身份、性格、角色类型，严禁提供secret和violation
                    role_info = f"，类型：{actor.roleType or '未知'}" if hasattr(actor, 'roleType') and actor.roleType else ""
                    detail = f"{actor.name}（{actor.bio or '身份不详'}，性格：{actor.personality or '未知'}{role_info}）"
                    character_details.append(detail)
        
        character_info = ""
        if character_names:
            character_info = f" 案件涉及的具体人员包括：{', '.join(character_names)}。当被问及案件涉及哪些人时，必须明确列出这些具体姓名，不能只给出模糊分类。"
        else:
            character_info = " 当被问及案件涉及哪些人时，必须基于故事背景中明确提到的具体角色姓名进行回应，不能只给出模糊的分类描述。"
        
        character_detail_info = ""
        if character_details:
            character_detail_info = f"\n\n【角色详细信息】\n以下是各角色的详细信息：{', '.join(character_details)}\n基于这些角色信息，你可以分析他们的动机、性格特点、行为模式和可能的作案手法。\n\n【重要安全限制】\n- 你只知道角色的公开信息（姓名、身份、性格），不知道任何角色的秘密信息\n- 严禁直接指出凶手身份，只能基于证据进行推理分析\n- 不能泄露任何角色的隐藏动机或秘密行为\n- 只能根据玩家提供的证据和推理笔记进行分析，不能凭空断定结论"
        
        additional_context = f" 作为{detective_name}的搭档，你需要能够明确列出案件涉及的所有具体人员。{character_info}{character_detail_info}"
    
    return (request.global_story + 
            f" {detective_name}正在审问嫌疑人以找到受害者{victim_name}的凶手。前面的文字是这个故事的背景。"
            f"重要提醒：只能基于上述故事背景中提到的角色、地点和事件进行对话，严禁创造剧本中没有的角色、人物关系或事件细节。"
            f"{additional_context}") + get_actor_prompt(request.actor, detective_name)

def invoke_anthropic(system_prompt: str, messages: list[LLMMessage]):
    client = anthropic.Anthropic(api_key=API_KEY)
    response = client.messages.create(
        model=MODEL,
        system=system_prompt,
        messages=[msg.model_dump() for msg in messages],
        max_tokens=MAX_TOKENS,
    )
    return response.content[0].text, response.usage.input_tokens, response.usage.output_tokens

def invoke_openai(system_prompt: str, messages: list[LLMMessage], temperature: float = 0.7):
    """调用OpenAI API
    
    Args:
        system_prompt: 系统提示词
        messages: 消息列表
        temperature: 温度参数，默认0.7适合对话，质检等结构化输出建议0.1
    """
    if INFERENCE_SERVICE == 'groq':
        client = openai.OpenAI(api_key=API_KEY, base_url=GROQ_API_BASE)
    elif INFERENCE_SERVICE == 'openrouter':
        client = openai.OpenAI(api_key=API_KEY, base_url=OPENROUTER_API_BASE)
    elif INFERENCE_SERVICE == 'openai':
        client = openai.OpenAI(api_key=API_KEY, base_url=OPENAI_API_BASE)
    else:  # Default OpenAI
        client = openai.OpenAI(api_key=API_KEY)
    
    response = client.chat.completions.create(
        model=MODEL,
        messages=[{"role": "system", "content": system_prompt}] + [msg.model_dump() for msg in messages],
        max_tokens=MAX_TOKENS,
        temperature=temperature,
    )
    return response.choices[0].message.content, response.usage.prompt_tokens, response.usage.completion_tokens

def invoke_openai_stream(system_prompt: str, messages: list[LLMMessage], temperature: float = 0.7):
    """流式调用OpenAI API
    
    Args:
        system_prompt: 系统提示词
        messages: 消息列表
        temperature: 温度参数，默认0.7适合对话，质检等结构化输出建议0.1
    """
    if INFERENCE_SERVICE == 'groq':
        client = openai.OpenAI(api_key=API_KEY, base_url=GROQ_API_BASE)
    elif INFERENCE_SERVICE == 'openrouter':
        client = openai.OpenAI(api_key=API_KEY, base_url=OPENROUTER_API_BASE)
    elif INFERENCE_SERVICE == 'openai':
        client = openai.OpenAI(api_key=API_KEY, base_url=OPENAI_API_BASE)
    else:  # Default OpenAI
        client = openai.OpenAI(api_key=API_KEY)
    
    response = client.chat.completions.create(
        model=MODEL,
        messages=[{"role": "system", "content": system_prompt}] + [msg.model_dump() for msg in messages],
        max_tokens=MAX_TOKENS,
        temperature=temperature,
        stream=True
    )
    
    full_content = ""
    for chunk in response:
        if not chunk.choices or len(chunk.choices) == 0:
            continue
        if chunk.choices[0].delta.content is not None:
            content = chunk.choices[0].delta.content
            full_content += content
            yield content
    
    return full_content

def invoke_ollama(system_prompt: str, messages: list[LLMMessage]):
    prompt = system_prompt + "\n" + "\n".join([f"{msg.role}: {msg.content}" for msg in messages])
    response = requests.post(f"{OLLAMA_URL}/api/generate", json={
        "model": MODEL,
        "prompt": prompt,
        "stream": False,
    })
    response.raise_for_status()
    result = response.json()
    return result['response'], None, None  # Ollama doesn't provide token counts

def invoke_ai(conn,
              turn_id: int,
              prompt_role: str,
              system_prompt: str,
              messages: list[LLMMessage],
              temperature: float = 0.7):

    started_at = datetime.now(timezone.utc)

    if INFERENCE_SERVICE == 'anthropic':
        text_response, input_tokens, output_tokens = invoke_anthropic(system_prompt, messages)
    elif INFERENCE_SERVICE in ['openai', 'groq', 'openrouter']:
        text_response, input_tokens, output_tokens = invoke_openai(system_prompt, messages, temperature)
    elif INFERENCE_SERVICE == 'ollama':
        text_response, input_tokens, output_tokens = invoke_ollama(system_prompt, messages)
    else:
        raise ValueError(f"Unknown inference service: {INFERENCE_SERVICE}")

    finished_at = datetime.now(timezone.utc)

    if conn is not None:
        with conn.cursor() as cur:
            total_tokens = (input_tokens or 0) + (output_tokens or 0)
            # Convert LLMMessage objects to dictionaries
            serialized_messages = [msg.model_dump() for msg in messages]
            cur.execute(
                "INSERT INTO ai_invocations (conversation_turn_id, model, model_key, prompt_messages, system_prompt, prompt_role, "
                "input_tokens, output_tokens, total_tokens, response, started_at, finished_at) "
                "VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)",
                (turn_id, MODEL, MODEL_KEY, json.dumps(serialized_messages), system_prompt, prompt_role,
                 input_tokens, output_tokens, total_tokens,
                 text_response, started_at, finished_at)
            )   
            conn.commit()

    return text_response

def respond_initial(conn, turn_id: int,
                           request: InvocationRequest):

    print(f"\nrequest.actor.messages {request.actor.messages}")

    return invoke_ai(
        conn,
        turn_id,
        "initial",
        system_prompt=get_system_prompt(request),
        messages=request.actor.messages,
        temperature=request.temperature,
    )

def respond_initial_stream(conn, turn_id: int, request: InvocationRequest):
    """流式版本的初始响应"""
    print(f"\nrequest.actor.messages {request.actor.messages}")
    
    if INFERENCE_SERVICE in ['openai', 'groq', 'openrouter']:
        full_content = ""
        for chunk in invoke_openai_stream(get_system_prompt(request), request.actor.messages, request.temperature):
            full_content += chunk
            yield chunk
        
        # 保存完整响应到数据库
        if conn is not None:
            with conn.cursor() as cur:
                cur.execute(
                    "INSERT INTO ai_invocations (conversation_turn_id, model, model_key, prompt_messages, system_prompt, prompt_role, "
                    "input_tokens, output_tokens, total_tokens, response, started_at, finished_at) "
                    "VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)",
                    (turn_id, MODEL, MODEL_KEY, json.dumps([msg.model_dump() for msg in request.actor.messages]), 
                     get_system_prompt(request), "initial", 0, 0, 0, full_content, 
                     datetime.now(timezone.utc), datetime.now(timezone.utc))
                )
                conn.commit()
    else:
        # 对于不支持流式的服务，回退到普通调用
        response = invoke_ai(conn, turn_id, "initial", get_system_prompt(request), request.actor.messages, request.temperature)
        yield response

def get_critique_prompt(
        request: InvocationRequest,
        last_utterance: str
):
    return f"""
        检查{request.actor.name}的最后一次发言："{last_utterance}"是否严重违反了这些原则：原则A：谈论AI助手。{request.actor.violation} 原则结束。
        只关注最后一次发言，不要考虑对话的先前部分。
        识别对前述原则的明确和明显的违反。允许离题对话。
        你只能引用上述原则。不要关注其他任何事情。
        提供简洁的少于100字的解释，直接引用最后一次发言来说明每次违反。
        在列出违反的原则之前，逐步思考。如果没有违反任何原则，返回确切的一词短语"NONE!"，不要其他内容。
        否则，在你的分析之后，你必须按照以下格式列出违反的原则：
        格式：引用：... 批评：... 违反的原则：...
        此格式的示例：引用："{request.actor.name}在说好话。" 批评：发言是第三人称视角。违反的原则：原则2：对话不是{request.actor.name}的视角。
    """

def critique(conn, turn_id: int, request: InvocationRequest, unrefined: str) -> str:
   return invoke_ai(
       conn,
       turn_id,
       "critique",
       system_prompt=get_critique_prompt(request,unrefined),
       messages=[LLMMessage(role="user", content=unrefined)],
       temperature=request.temperature
   )

def check_whether_to_refine(critique_chat_response: str) -> bool:
    """
    Returns a boolean indicating whether the chat response should be refined.
    """
    # TODO: make this more sophisticated. Function calling with # of problems, maybe?
    return critique_chat_response[:4]!="NONE"

def get_refiner_prompt(request: InvocationRequest,
                       critique_response: str):
    original_message = request.actor.messages[-1].content

    refine_out = f"""
        你的工作是为谋杀悬疑视频游戏编辑对话。这个对话来自角色{request.actor.name}对以下提示的回应：{original_message} 
        这是{request.actor.name}的故事背景：{request.actor.context} {request.actor.secret} 
        你修订的对话必须与故事背景一致，并且没有以下问题：{critique_response}。
        你输出的修订对话必须从{request.actor.name}的视角出发，尽可能与原始用户消息相同，并与{request.actor.name}的个性一致：{request.actor.personality}。 
        尽可能少地修改原始输入！ 
        在你的输出中省略以下任何内容：引号、对故事一致性的评论、提及原则或违反。
        """

    return refine_out

def refine(conn, turn_id: int, request: InvocationRequest, critique_response: str, unrefined_response: str):
    return invoke_ai(
        conn,
        turn_id,
        "refine",
        system_prompt=get_refiner_prompt(request, critique_response),
        messages=[
            LLMMessage(
                role="user",
                content=unrefined_response,
            )
        ],
        temperature=request.temperature
    )
