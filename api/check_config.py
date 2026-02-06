#!/usr/bin/env python3
"""
检查当前系统配置的脚本
"""

from settings import MODEL, PROMPTS_VERSION, INFERENCE_SERVICE, MAX_TOKENS, MODEL_KEY

def check_config():
    """显示当前系统配置"""
    print("🔧 当前系统配置:")
    print(f"   推理服务: {INFERENCE_SERVICE}")
    print(f"   AI模型: {MODEL}")
    print(f"   最大令牌: {MAX_TOKENS}")
    print(f"   提示词版本: {PROMPTS_VERSION}")
    print(f"   模型键: {MODEL_KEY}")
    print()
    print("✅ 剧透故事将使用以上配置自动保存模型信息")

if __name__ == "__main__":
    check_config()
