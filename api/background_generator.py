#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import os
import json
import time
import base64
import requests
import hashlib
import hmac
from datetime import datetime
from invoke_types import Actor
from llm_service import generate_character_background_prompt

class BackgroundGenerator:
    def __init__(self):
        # 使用与avatar_generator完全相同的API配置
        self.method = 'POST'
        self.host = 'visual.volcengineapi.com'
        self.region = 'cn-north-1'
        self.endpoint = 'https://visual.volcengineapi.com'
        self.service = 'cv'
        self.access_key = os.getenv("VOLC_ACCESS_KEY", "")
        self.secret_key = os.getenv("VOLC_SECRET_KEY", "")

    def sign(self, key, msg):
        """签名辅助方法"""
        return hmac.new(key, msg.encode('utf-8'), hashlib.sha256).digest()

    def getSignatureKey(self, key, dateStamp, regionName, serviceName):
        """生成签名密钥"""
        kDate = self.sign(key.encode('utf-8'), dateStamp)
        kRegion = self.sign(kDate, regionName)
        kService = self.sign(kRegion, serviceName)
        kSigning = self.sign(kService, 'request')
        return kSigning

    def formatQuery(self, parameters):
        """格式化查询参数"""
        request_parameters_init = ''
        for key in sorted(parameters):
            request_parameters_init += key + '=' + parameters[key] + '&'
        request_parameters = request_parameters_init[:-1]
        return request_parameters

    def signV4Request(self, req_query, req_body):
        """生成V4签名请求"""
        if self.access_key is None or self.secret_key is None:
            print('No access key is available.')
            return None

        t = datetime.utcnow()
        current_date = t.strftime('%Y%m%dT%H%M%SZ')
        datestamp = t.strftime('%Y%m%d')
        canonical_uri = '/'
        canonical_querystring = req_query
        signed_headers = 'content-type;host;x-content-sha256;x-date'
        payload_hash = hashlib.sha256(req_body.encode('utf-8')).hexdigest()
        content_type = 'application/json'
        canonical_headers = 'content-type:' + content_type + '\n' + 'host:' + self.host + \
            '\n' + 'x-content-sha256:' + payload_hash + \
            '\n' + 'x-date:' + current_date + '\n'
        canonical_request = self.method + '\n' + canonical_uri + '\n' + canonical_querystring + \
            '\n' + canonical_headers + '\n' + signed_headers + '\n' + payload_hash

        algorithm = 'HMAC-SHA256'
        credential_scope = datestamp + '/' + self.region + '/' + self.service + '/' + 'request'
        string_to_sign = algorithm + '\n' + current_date + '\n' + credential_scope + '\n' + hashlib.sha256(
            canonical_request.encode('utf-8')).hexdigest()

        signing_key = self.getSignatureKey(self.secret_key, datestamp, self.region, self.service)
        signature = hmac.new(signing_key, (string_to_sign).encode(
            'utf-8'), hashlib.sha256).hexdigest()

        authorization_header = algorithm + ' ' + 'Credential=' + self.access_key + '/' + \
            credential_scope + ', ' + 'SignedHeaders=' + \
            signed_headers + ', ' + 'Signature=' + signature

        headers = {'X-Date': current_date,
                   'Authorization': authorization_header,
                   'X-Content-Sha256': payload_hash,
                   'Content-Type': content_type
                   }

        request_url = self.endpoint + '?' + canonical_querystring

        print(f'🎨 发送背景生成请求: {request_url}')
        try:
            r = requests.post(request_url, headers=headers, data=req_body)
            resp_str = r.text.replace("\\u0026", "&")
            return resp_str
        except Exception as err:
            print(f'❌ 背景生成请求失败: {err}')
            return None

    def get_preset_background(self, actor: Actor) -> str:
        """
        根据角色特点返回预设背景图片路径
        """
        # 分析角色特点
        bio_lower = actor.bio.lower() if actor.bio else ""
        personality_lower = actor.personality.lower() if actor.personality else ""
        context_lower = actor.context.lower() if actor.context else ""
        all_text = f"{bio_lower} {personality_lower} {context_lower}"
        
        # 预设背景映射（这些文件需要手动放置在script_scenes目录）
        background_mappings = {
            ('商人', '商会', '贸易'): 'preset_merchant_hall.png',
            ('将军', '军官', '士兵'): 'preset_military_camp.png',
            ('文人', '学者', '书生'): 'preset_study_room.png',
            ('官员', '大人', '知府'): 'preset_government_hall.png',
            ('医生', '大夫', '郎中'): 'preset_medical_room.png',
            ('侠客', '剑客', '武侠'): 'preset_tavern_room.png',
        }
        
        # 寻找匹配的预设背景
        for keywords, background_file in background_mappings.items():
            if any(keyword in all_text for keyword in keywords):
                return f"script_scenes/{background_file}"
        
        # 默认背景
        return "script_scenes/preset_default_room.png"

    def generate_character_background(self, actor: Actor) -> str:
        """
        根据角色特点生成聊天背景图片
        
        Args:
            actor: 角色对象，包含名字、背景、性格等信息
            
        Returns:
            背景图片路径或base64编码的图片数据，如果失败返回None
        """
        # 如果API不可用，直接返回预设背景
        if not self.api_available:
            print(f'🎭 为角色 {actor.name} 使用预设背景')
            preset_path = self.get_preset_background(actor)
            print(f'📁 预设背景路径: {preset_path}')
            return preset_path
        
        # 生成背景描述提示词
        prompt = generate_character_background_prompt(actor)
        
        # 请求参数
        query_params = {
            'Action': 'CVProcess',
            'Version': '2022-08-31',
        }
        formatted_query = self.formatQuery(query_params)

        # 请求Body - 使用横版尺寸适合聊天背景
        body_params = {
            "req_key": "jimeng_high_aes_general_v21_L",
            "prompt": prompt,
            "width": 1792,  # 横版背景
            "height": 1024
        }
        formatted_body = json.dumps(body_params)
        
        print(f'🎭 为角色 {actor.name} 生成背景图片')
        print(f'📝 生成提示词: {prompt}')
        
        try:
            result = self.signV4Request(formatted_query, formatted_body)
            if result:
                print(f'🔍 API原始响应: {result[:500]}...')  # 打印前500字符用于调试
                response_data = json.loads(result)
                print(f'🔍 解析后的响应结构: {list(response_data.keys())}')
                
                if response_data.get("data"):
                    print(f'🔍 data字段内容: {list(response_data["data"].keys()) if isinstance(response_data["data"], dict) else type(response_data["data"])}')
                    
                    if response_data["data"].get("binary_data_base64"):
                        base64_image = response_data["data"]["binary_data_base64"][0]
                        print(f'✅ 角色 {actor.name} 背景生成成功')
                        return base64_image
                    else:
                        print(f'❌ 角色 {actor.name} 背景生成失败: binary_data_base64字段不存在')
                        print(f'🔍 data字段完整内容: {response_data["data"]}')
                        return None
                else:
                    print(f'❌ 角色 {actor.name} 背景生成失败: data字段不存在')
                    print(f'🔍 完整响应: {response_data}')
                    # 回退到预设背景
                    print(f'🔄 回退使用预设背景')
                    return self.get_preset_background(actor)
            else:
                print(f'❌ 角色 {actor.name} 背景生成失败: 请求失败')
                # 回退到预设背景
                print(f'🔄 回退使用预设背景')
                return self.get_preset_background(actor)
        except Exception as e:
            print(f'❌ 角色 {actor.name} 背景生成异常: {str(e)}')
            # 回退到预设背景
            print(f'🔄 回退使用预设背景')
            return self.get_preset_background(actor)

# 创建全局实例
background_generator = BackgroundGenerator()

def generate_background_for_character(actor: Actor) -> str:
    """
    为角色生成聊天背景图片的便捷函数
    
    Args:
        actor: 角色对象
        
    Returns:
        base64编码的图片数据
    """
    return background_generator.generate_character_background(actor)
