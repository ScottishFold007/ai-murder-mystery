// 背景图片生成API接口

export interface BackgroundGenerationRequest {
  character_name: string;
  character_bio: string;
  character_personality: string;
  character_context?: string;
}

export interface BackgroundGenerationResponse {
  success: boolean;
  message: string;
  background_filename: string | null;
  background_path: string | null;
  base64_image: string | null;
}

/**
 * 为角色生成聊天背景图片
 * @param request 背景生成请求
 * @returns Promise<BackgroundGenerationResponse>
 */
export const generateCharacterBackground = async (
  request: BackgroundGenerationRequest
): Promise<BackgroundGenerationResponse> => {
  try {
    
    const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:10000';
    const response = await fetch(`${apiUrl}/generate_background`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result: BackgroundGenerationResponse = await response.json();
    
    if (result.success) {
    } else {
      console.warn('⚠️ 背景生成失败:', result.message);
    }

    return result;
  } catch (error) {
    console.error('❌ 背景生成请求异常:', error);
    console.error('📍 API URL:', `${process.env.REACT_APP_API_URL}/generate_background`);
    console.error('📦 请求数据:', request);
    
    return {
      success: false,
      message: `背景生成失败: ${error instanceof Error ? error.message : '未知错误'}`,
      background_filename: null,
      background_path: null,
      base64_image: null,
    };
  }
};

/**
 * 从Actor对象生成背景图片
 * @param actor 角色对象
 * @returns Promise<BackgroundGenerationResponse>
 */
export const generateBackgroundFromActor = async (
  actor: {
    name: string;
    bio: string;
    personality: string;
    context?: string;
  }
): Promise<BackgroundGenerationResponse> => {
  return generateCharacterBackground({
    character_name: actor.name,
    character_bio: actor.bio,
    character_personality: actor.personality,
    character_context: actor.context || '',
  });
};
