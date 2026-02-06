import json
import sys
import os
import base64
import datetime
import hashlib
import hmac
import requests
from typing import Dict, Any

class CoverGenerator:
    def __init__(self):
        self.method = 'POST'
        self.host = 'visual.volcengineapi.com'
        self.region = 'cn-north-1'
        self.endpoint = 'https://visual.volcengineapi.com'
        self.service = 'cv'
        self.access_key = os.getenv("VOLC_ACCESS_KEY", "")
        self.secret_key = os.getenv("VOLC_SECRET_KEY", "")

    def sign(self, key, msg):
        return hmac.new(key, msg.encode('utf-8'), hashlib.sha256).digest()

    def getSignatureKey(self, key, dateStamp, regionName, serviceName):
        kDate = self.sign(key.encode('utf-8'), dateStamp)
        kRegion = self.sign(kDate, regionName)
        kService = self.sign(kRegion, serviceName)
        kSigning = self.sign(kService, 'request')
        return kSigning

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

        print(f'🎨 发送封面生成请求: {request_url}')
        try:
            r = requests.post(request_url, headers=headers, data=req_body)
            resp_str = r.text.replace("\\u0026", "&")
            return resp_str
        except Exception as err:
            print(f'❌ 封面生成请求失败: {err}')
            return None

    def generate_script_cover(self, script_title: str, script_description: str) -> str:
        """
        根据剧本标题和描述生成电影写真风格的封面
        
        Args:
            script_title: 剧本标题
            script_description: 剧本描述
            
        Returns:
            base64编码的图片数据，如果失败返回None
        """
        # 构建详细的prompt
        prompt = f"""
电影海报风格封面，{script_title}，{script_description}。
4:3横版构图（撑满画面），电影级别的视觉设计，悬疑氛围，戏剧性光影效果，
高清细腻，电影海报质感，专业摄影，深度刻画氛围。
悬疑推理题材，电影宣传海报风格，高品质，细节丰富。
营造神秘悬疑氛围，很有画面感。
        """.strip()

        print(f'🎬 为剧本 {script_title} 生成封面')
        print(f'📝 生成提示词: {prompt}')
        
        try:
            # 第一步：提交任务
            task_id = self._submit_cover_task(prompt)
            if not task_id:
                return None
            
            # 第二步：查询结果
            return self._get_cover_result(task_id, script_title)
            
        except Exception as e:
            print(f'❌ 剧本 {script_title} 封面生成异常: {str(e)}')
            return None

    def _submit_cover_task(self, prompt: str) -> str:
        """提交封面生成任务"""
        query_params = {
            'Action': 'CVSync2AsyncSubmitTask',
            'Version': '2022-08-31',
        }
        formatted_query = self.formatQuery(query_params)

        body_params = {
            "req_key": "jimeng_t2i_v31",
            "prompt": prompt,
            "width": 1472, #1472 * 1104 
            "height": 1104,
            "seed": -1
        }
        formatted_body = json.dumps(body_params)
        
        try:
            result = self.signV4Request(formatted_query, formatted_body)
            if result:
                response_data = json.loads(result)
                if response_data.get("code") == 10000 and response_data.get("data", {}).get("task_id"):
                    task_id = response_data["data"]["task_id"]
                    print(f'📋 封面生成任务提交成功，任务ID: {task_id}')
                    return task_id
                else:
                    print(f'❌ 封面生成任务提交失败: {response_data}')
                    return None
            else:
                print(f'❌ 封面生成任务提交请求失败')
                return None
        except Exception as e:
            print(f'❌ 封面生成任务提交异常: {str(e)}')
            return None

    def _get_cover_result(self, task_id: str, script_title: str) -> str:
        """查询封面生成结果"""
        query_params = {
            'Action': 'CVSync2AsyncGetResult',
            'Version': '2022-08-31',
        }
        formatted_query = self.formatQuery(query_params)

        body_params = {
            "req_key": "jimeng_t2i_v31",
            "task_id": task_id
        }
        formatted_body = json.dumps(body_params)
        
        # 轮询查询结果，最多等待60秒
        max_attempts = 12  # 每5秒查询一次，最多查询12次
        for attempt in range(max_attempts):
            try:
                result = self.signV4Request(formatted_query, formatted_body)
                if result:
                    response_data = json.loads(result)
                    status = response_data.get("data", {}).get("status")
                    
                    if status == "done":
                        if response_data.get("code") == 10000:
                            binary_data = response_data.get("data", {}).get("binary_data_base64")
                            if binary_data and len(binary_data) > 0:
                                base64_image = binary_data[0]
                                print(f'✅ 剧本 {script_title} 封面生成成功')
                                return base64_image
                            else:
                                print(f'❌ 剧本 {script_title} 封面生成失败: 无图片数据')
                                return None
                        else:
                            print(f'❌ 剧本 {script_title} 封面生成失败: {response_data.get("message")}')
                            return None
                    elif status == "generating":
                        print(f'⏳ 封面生成中... ({attempt + 1}/{max_attempts})')
                        import time
                        time.sleep(5)  # 等待5秒后重试
                        continue
                    elif status == "in_queue":
                        print(f'⏳ 封面生成排队中... ({attempt + 1}/{max_attempts})')
                        import time
                        time.sleep(5)  # 等待5秒后重试
                        continue
                    else:
                        print(f'❌ 封面生成状态异常: {status}')
                        return None
                else:
                    print(f'❌ 封面生成结果查询请求失败')
                    return None
            except Exception as e:
                print(f'❌ 封面生成结果查询异常: {str(e)}')
                return None
        
        print(f'❌ 剧本 {script_title} 封面生成超时')
        return None

# 全局实例
cover_generator = CoverGenerator()

def generate_cover_for_script(script_title: str, script_description: str) -> str:
    """
    为剧本生成封面的便捷函数
    
    Returns:
        base64编码的图片数据，如果失败返回None
    """
    return cover_generator.generate_script_cover(script_title, script_description)
