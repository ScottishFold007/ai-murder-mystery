// 剧本封面生成API

export interface CoverGenerationRequest {
  script_title: string;
  script_description: string;
}

export interface CoverGenerationResponse {
  success: boolean;
  message: string;
  cover_filename?: string;
  cover_path?: string;
  base64_image?: string;
}

export interface CoverUploadRequest {
  script_id: string;
  base64_image: string;
  filename: string;
}

export interface CoverUploadResponse {
  success: boolean;
  message: string;
  cover_filename?: string;
  cover_path?: string;
  base64_image?: string;
}

export interface CoverImageInfo {
  filename: string;
  path: string;
  size: number;
}

export interface CoverLibraryResponse {
  success: boolean;
  images: CoverImageInfo[];
}

export interface CoverImageResponse {
  success: boolean;
  filename: string;
  base64_image: string;
  mime_type: string;
  data_url: string;
}

export interface CoverDeleteResponse {
  success: boolean;
  message: string;
  deleted_files?: string[];
}

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:10000';

export async function generateScriptCover(
  scriptTitle: string, 
  scriptDescription: string
): Promise<CoverGenerationResponse> {
  try {
    console.log('🎬 开始生成剧本封面:', scriptTitle);
    
    const response = await fetch(`${API_BASE_URL}/generate_cover`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        script_title: scriptTitle,
        script_description: scriptDescription,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result: CoverGenerationResponse = await response.json();
    
    if (result.success) {
    } else {
      console.log('❌ 封面生成失败:', result.message);
    }
    
    return result;
  } catch (error) {
    console.error('❌ 封面生成请求失败:', error);
    return {
      success: false,
      message: `封面生成请求失败: ${error instanceof Error ? error.message : '未知错误'}`,
    };
  }
}

// 上传剧本封面
export async function uploadScriptCover(
  scriptId: string,
  base64Image: string,
  filename: string
): Promise<CoverUploadResponse> {
  try {
    
    const response = await fetch(`${API_BASE_URL}/upload_cover`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        script_id: scriptId,
        base64_image: base64Image,
        filename: filename,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result: CoverUploadResponse = await response.json();
    
    if (result.success) {
    } else {
      console.log('❌ 封面上传失败:', result.message);
    }
    
    return result;
  } catch (error) {
    console.error('❌ 封面上传请求失败:', error);
    return {
      success: false,
      message: `封面上传请求失败: ${error instanceof Error ? error.message : '未知错误'}`,
    };
  }
}

// 获取封面图库列表
// @deprecated 此函数已废弃，请使用直接的fetch调用 /script-covers API替代（与证物系统保持一致）
export async function getCoverLibrary(): Promise<CoverLibraryResponse> {
  try {
    console.log('📁 获取封面图库列表');
    
    const response = await fetch(`${API_BASE_URL}/list_cover_images`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result: CoverLibraryResponse = await response.json();
    
    // console.log(`📚 找到 ${result.images.length} 个封面图片`);
    
    return result;
  } catch (error) {
    console.error('❌ 获取封面图库失败:', error);
    return {
      success: false,
      images: [],
    };
  }
}

// 获取封面图片数据
// @deprecated 此函数已废弃，请直接使用静态文件路径 /script_covers/{filename} 访问（与证物系统保持一致）
export async function getCoverImageData(filename: string): Promise<CoverImageResponse> {
  try {
    console.log('📷 获取封面图片数据:', filename);
    
    const response = await fetch(`${API_BASE_URL}/get_cover_image/${encodeURIComponent(filename)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result: CoverImageResponse = await response.json();
    
    console.log(`📸 获取图片数据成功: ${filename}`);
    
    return result;
  } catch (error) {
    console.error('❌ 获取封面图片数据失败:', error);
    return {
      success: false,
      filename: filename,
      base64_image: '',
      mime_type: 'image/png',
      data_url: ''
    };
  }
}

// 删除封面图片
export async function deleteCoverImages(filenames: string[]): Promise<CoverDeleteResponse> {
  try {
    
    const response = await fetch(`${API_BASE_URL}/delete_cover_images`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        filenames: filenames,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result: CoverDeleteResponse = await response.json();
    
    if (result.success) {
    } else {
      console.log('❌ 封面删除失败:', result.message);
    }
    
    return result;
  } catch (error) {
    console.error('❌ 封面删除请求失败:', error);
    return {
      success: false,
      message: `封面删除请求失败: ${error instanceof Error ? error.message : '未知错误'}`,
      deleted_files: []
    };
  }
}

// 将文件转换为base64
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      // 移除data:image/xxx;base64,前缀
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = error => reject(error);
  });
}

