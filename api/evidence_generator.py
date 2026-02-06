import json
import sys
import os
import base64
import datetime
import hashlib
import hmac
import requests
from typing import Dict, Any

class EvidenceGenerator:
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

        print(f'🔍 发送证物图像生成请求: {request_url}')
        try:
            r = requests.post(request_url, headers=headers, data=req_body)
            resp_str = r.text.replace("\\u0026", "&")
            return resp_str
        except Exception as err:
            print(f'❌ 证物图像生成请求失败: {err}')
            return None

    def generate_evidence_image(self, evidence_name: str, evidence_description: str, style: str = 'realistic') -> str:
        """
        根据证物名称和描述生成法证摄影风格的图像
        
        Args:
            evidence_name: 证物名称
            evidence_description: 证物描述
            style: 图像风格 ('realistic' 或 'detailed_illustration')
            
        Returns:
            base64编码的图片数据，如果失败返回None
        """
        # 构建详细的prompt，针对证物图像优化
        if style == 'detailed_illustration':
            prompt = f"""
{evidence_name}，{evidence_description}。
专业法证插图风格，高清细腻，技术绘图，科学插图风格，
白色背景，单一物品展示，清晰的物理特征描述，
详细的材质纹理，准确的比例和尺寸，专业摄影光影效果。
法医鉴定用图，证据展示图，高品质技术插图。
            """.strip()
        else:
            prompt = f"""
{evidence_name}，{evidence_description}。
专业法证摄影风格，证据照片，高清摄影，白色背景，
单一物品特写，清晰的细节展示，专业摄影光效，
证据收集标准，司法鉴定用图，高分辨率，无阴影干扰。
真实物证照片，法医摄影风格，高品质，细节丰富。
            """.strip()

        # 请求参数
        query_params = {
            'Action': 'CVProcess',
            'Version': '2022-08-31',
        }
        formatted_query = self.formatQuery(query_params)

        # 请求Body - 使用正方形尺寸适合证物展示
        body_params = {
            "req_key": "jimeng_high_aes_general_v21_L",
            "prompt": prompt
        }
        formatted_body = json.dumps(body_params)
        
        print(f'🔍 为证物 {evidence_name} 生成图像')
        print(f'📝 生成提示词: {prompt}')
        
        try:
            result = self.signV4Request(formatted_query, formatted_body)
            if result:
                response_data = json.loads(result)
                if response_data.get("data") and response_data["data"].get("binary_data_base64"):
                    base64_image = response_data["data"]["binary_data_base64"][0]
                    print(f'✅ 证物 {evidence_name} 图像生成成功')
                    return base64_image
                else:
                    print(f'❌ 证物 {evidence_name} 图像生成失败: 响应数据格式错误')
                    print(f'🔍 响应数据: {response_data}')
                    return None
            else:
                print(f'❌ 证物 {evidence_name} 图像生成失败: 请求失败')
                return None
        except Exception as e:
            print(f'❌ 证物 {evidence_name} 图像生成异常: {str(e)}')
            return None

# 全局实例
evidence_generator = EvidenceGenerator()

def generate_evidence_image_for_item(evidence_name: str, evidence_description: str, style: str = 'realistic') -> str:
    """
    为证物生成图像的便捷函数
    
    Returns:
        base64编码的图片数据，如果失败返回None
    """
    return evidence_generator.generate_evidence_image(evidence_name, evidence_description, style)
