/**
 * 证物图像生成API
 * 类似头像生成系统，支持AI生成和手动上传
 */

import { ScriptEvidence } from '../types/script';

export interface EvidenceImageGenerationRequest {
  evidenceName: string;
  evidenceDescription: string;
  style?: string; // 图像风格
  size?: string; // 图像尺寸
}

export interface EvidenceImageResponse {
  success: boolean;
  imageUrl?: string;
  imagePath?: string;
  error?: string;
}

/**
 * 为证物生成图像
 */
export const generateEvidenceImage = async (
  request: EvidenceImageGenerationRequest
): Promise<EvidenceImageResponse> => {
  try {
    const response = await fetch('http://localhost:10000/generate-evidence-image', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: request.evidenceName,
        description: request.evidenceDescription,
        style: request.style || 'realistic',
        size: request.size || '512x512'
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (data.success) {
      return {
        success: true,
        imageUrl: data.imageUrl,
        imagePath: data.imagePath
      };
    } else {
      return {
        success: false,
        error: data.error || '图像生成失败'
      };
    }
  } catch (error) {
    console.error('证物图像生成失败:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '网络错误'
    };
  }
};

/**
 * 上传证物图像
 */
export const uploadEvidenceImage = async (
  file: File,
  evidenceName: string
): Promise<EvidenceImageResponse> => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('name', evidenceName);

    const response = await fetch('http://localhost:10000/upload-evidence-image', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (data.success) {
      return {
        success: true,
        imageUrl: data.imageUrl,
        imagePath: data.imagePath
      };
    } else {
      return {
        success: false,
        error: data.error || '图像上传失败'
      };
    }
  } catch (error) {
    console.error('证物图像上传失败:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '上传失败'
    };
  }
};

/**
 * 获取证物图像URL
 */
export const getEvidenceImageUrl = (imageName: string): string => {
  if (!imageName) return '/evidence_images/default_evidence.png';
  
  // 如果已经是完整URL，直接返回
  if (imageName.startsWith('http') || imageName.startsWith('data:')) {
    return imageName;
  }
  
  // 如果以 / 开头，说明是绝对路径，直接返回
  if (imageName.startsWith('/')) {
    return imageName;
  }
  
  // 如果包含 evidence_images/ 前缀，添加根路径
  if (imageName.includes('evidence_images/')) {
    return `/${imageName}`;
  }
  
  // 否则，假设是文件名，添加完整路径并编码
  return `/evidence_images/${encodeURIComponent(imageName)}`;
};

/**
 * 删除证物图像
 */
export const deleteEvidenceImage = async (imageName: string): Promise<boolean> => {
  try {
    const response = await fetch('http://localhost:10000/delete-evidence-image', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ imageName }),
    });

    const data = await response.json();
    return data.success || false;
  } catch (error) {
    console.error('删除证物图像失败:', error);
    return false;
  }
};

/**
 * 获取证物图像列表
 */
export const getEvidenceImageList = async (): Promise<string[]> => {
  try {
    const response = await fetch('http://localhost:10000/evidence-images');
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return data.images || [];
  } catch (error) {
    console.error('获取证物图像列表失败:', error);
    return [];
  }
};

/**
 * 批量生成剧本证物图像
 */
export const generateScriptEvidenceImages = async (
  evidences: ScriptEvidence[],
  onProgress?: (current: number, total: number, evidenceName: string) => void
): Promise<{ success: number; failed: number; results: { [key: string]: string } }> => {
  const results: { [key: string]: string } = {};
  let success = 0;
  let failed = 0;

  for (let i = 0; i < evidences.length; i++) {
    const evidence = evidences[i];
    
    onProgress?.(i + 1, evidences.length, evidence.name);
    
    try {
      // 只使用证物概况生成图像，不包含线索
      const description = evidence.overview || evidence.description;
      
      const response = await generateEvidenceImage({
        evidenceName: evidence.name,
        evidenceDescription: description,
        style: 'detailed_illustration' // 使用详细插图风格
      });
      
      if (response.success && response.imagePath) {
        results[evidence.id] = response.imagePath;
        success++;
      } else {
        console.error(`证物 ${evidence.name} 图像生成失败:`, response.error);
        failed++;
      }
    } catch (error) {
      console.error(`证物 ${evidence.name} 图像生成异常:`, error);
      failed++;
    }
    
    // 添加延迟避免API限制
    if (i < evidences.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  return { success, failed, results };
};

/**
 * 验证图像文件
 */
export const validateImageFile = (file: File): { isValid: boolean; error?: string } => {
  // 检查文件类型
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: '只支持 JPEG、PNG、GIF、WebP 格式的图片'
    };
  }
  
  // 检查文件大小 (最大5MB)
  const maxSize = 5 * 1024 * 1024;
  if (file.size > maxSize) {
    return {
      isValid: false,
      error: '图片大小不能超过 5MB'
    };
  }
  
  return { isValid: true };
};

/**
 * 图像压缩
 */
export const compressImage = (
  file: File,
  maxWidth: number = 512,
  maxHeight: number = 512,
  quality: number = 0.8
): Promise<File> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      // 计算压缩后的尺寸
      let { width, height } = img;
      
      if (width > height) {
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }
      }
      
      canvas.width = width;
      canvas.height = height;
      
      // 绘制压缩后的图像
      ctx!.drawImage(img, 0, 0, width, height);
      
      // 转换为Blob
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const compressedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now()
            });
            resolve(compressedFile);
          } else {
            reject(new Error('图像压缩失败'));
          }
        },
        file.type,
        quality
      );
    };
    
    img.onerror = () => reject(new Error('图像加载失败'));
    img.src = URL.createObjectURL(file);
  });
};
