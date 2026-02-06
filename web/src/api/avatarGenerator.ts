// 头像生成API

export interface AvatarGenerationRequest {
  character_name: string;
  character_bio: string;
}

export interface AvatarGenerationResponse {
  success: boolean;
  message: string;
  avatar_filename: string | null;
  avatar_path: string | null;
  base64_image: string | null;
}

export const generateCharacterAvatar = async (
  characterName: string,
  characterBio: string
): Promise<AvatarGenerationResponse> => {
  try {
    
    const response = await fetch(`${process.env.REACT_APP_API_URL}/generate_avatar`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        character_name: characterName,
        character_bio: characterBio
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    
    return result;
  } catch (error) {
    console.error('❌ 头像生成请求失败:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : '网络请求失败',
      avatar_filename: null,
      avatar_path: null,
      base64_image: null
    };
  }
};
