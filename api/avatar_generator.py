import json
import sys
import os
import base64
import datetime
import hashlib
import hmac
import requests
from typing import Dict, Any

class AvatarGenerator:
    def __init__(self):
        self.method = 'POST'
        self.host = 'visual.volcengineapi.com'
        self.region = 'cn-north-1'
        self.endpoint = 'https://visual.volcengineapi.com'
        self.service = 'cv'
        self.access_key = os.getenv("VOLC_ACCESS_KEY", "")
        self.secret_key = os.getenv("VOLC_SECRET_KEY", "")

    def formatQuery(self, parameters):
        request_parameters_init = ''
        for key in sorted(parameters):
            request_parameters_init += key + '=' + parameters[key] + '&'
        request_parameters = request_parameters_init[:-1]
        return request_parameters

    def signV4Request(self, req_query, req_body):
        if self.access_key is None or self.secret_key is None:
            print('No access key is available.')
            return None

        t = datetime.datetime.utcnow()
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

        print(f'🎨 发送头像生成请求: {request_url}')
        try:
            r = requests.post(request_url, headers=headers, data=req_body)
            resp_str = r.text.replace("\\u0026", "&")
            return resp_str
        except Exception as err:
            print(f'❌ 头像生成请求失败: {err}')
            return None

    def generate_character_avatar(self, character_name: str, character_bio: str) -> str:
        """
        根据角色描述生成电影写真风格的头像
        
        Args:
            character_name: 角色名字
            character_bio: 角色背景
            
        Returns:
            base64编码的图片数据，如果失败返回None
        """
        # 构建详细的prompt（只使用名称和背景，不包含性格）
        prompt = f"""
电影写真风格肖像照，专业摄影，{character_name}，{character_bio}。
上半身特写，1:1方形构图，电影级别的光影效果，高清细腻，真实感强，
**近景照**，专业人像摄影，电影海报质感，戏剧性光影，深度刻画人物特征。
真实人物肖像，电影剧照风格，高品质，细节丰富。
        """.strip()

        # 请求参数
        query_params = {
            'Action': 'CVProcess',
            'Version': '2022-08-31',
        }
        formatted_query = self.formatQuery(query_params)

        # 请求Body
        body_params = {
            "req_key": "jimeng_high_aes_general_v21_L",
            "prompt": prompt
        }
        formatted_body = json.dumps(body_params)
        
        print(f'🎭 为角色 {character_name} 生成头像')
        print(f'📝 生成提示词: {prompt}')
        
        try:
            result = self.signV4Request(formatted_query, formatted_body)
            if result:
                response_data = json.loads(result)
                if response_data.get("data") and response_data["data"].get("binary_data_base64"):
                    base64_image = response_data["data"]["binary_data_base64"][0]
                    print(f'✅ 角色 {character_name} 头像生成成功')
                    return base64_image
                else:
                    print(f'❌ 角色 {character_name} 头像生成失败: 响应数据格式错误')
                    return None
            else:
                print(f'❌ 角色 {character_name} 头像生成失败: 请求失败')
                return None
        except Exception as e:
            print(f'❌ 角色 {character_name} 头像生成异常: {str(e)}')
            return None

# 全局实例
avatar_generator = AvatarGenerator()

def generate_avatar_for_character(character_name: str, character_bio: str) -> str:
    """
    为角色生成头像的便捷函数
    
    Args:
        character_name: 角色名字
        character_bio: 角色背景（身份、外貌特征等具体描述）
    
    Returns:
        base64编码的图片数据，如果失败返回None
    """
    return avatar_generator.generate_character_avatar(character_name, character_bio)
