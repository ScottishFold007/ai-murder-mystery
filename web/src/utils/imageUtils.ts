/**
 * 图片URL生成工具
 * 配合FastAPI静态文件服务使用
 */

export type ImageType = 'avatar' | 'cover' | 'scene' | 'evidence';

/**
 * 生成静态图片URL
 * @param type 图片类型
 * @param filename 文件名
 * @returns 静态文件URL路径
 */
export const getStaticImageUrl = (type: ImageType, filename: string | null | undefined): string => {
  if (!filename) {
    // 返回默认图片路径
    const defaultImages = {
      avatar: '/character_avatars/officer.png',
      cover: '/script_covers/default_cover.png',
      scene: '/script_scenes/default_scene.png',
      evidence: '/evidence_images/default_evidence.png'
    };
    return defaultImages[type];
  }

  const baseMap = {
    avatar: '/character_avatars',
    cover: '/script_covers', 
    scene: '/script_scenes',
    evidence: '/evidence_images'
  };
  
  // 如果已经是完整路径，直接返回
  if (filename.startsWith('/')) {
    return filename;
  }
  
  // 如果是data URL，直接返回
  if (filename.startsWith('data:')) {
    return filename;
  }
  
  return `${baseMap[type]}/${filename}`;
};

/**
 * 角色头像URL生成（兼容现有代码）
 */
export const getAvatarUrl = (filename: string | null | undefined): string => {
  return getStaticImageUrl('avatar', filename);
};

/**
 * 剧本封面URL生成
 */
export const getCoverUrl = (filename: string | null | undefined): string => {
  return getStaticImageUrl('cover', filename);
};

/**
 * 场景背景URL生成
 */
export const getSceneUrl = (filename: string | null | undefined): string => {
  return getStaticImageUrl('scene', filename);
};

/**
 * 证物图片URL生成
 */
export const getEvidenceUrl = (filename: string | null | undefined): string => {
  return getStaticImageUrl('evidence', filename);
};

/**
 * 检查图片URL是否为静态文件路径
 */
export const isStaticImageUrl = (url: string): boolean => {
  const staticPrefixes = [
    '/character_avatars/',
    '/script_covers/',
    '/script_scenes/',
    '/evidence_images/'
  ];
  
  return staticPrefixes.some(prefix => url.startsWith(prefix));
};

/**
 * 从静态URL中提取文件名
 */
export const extractFilenameFromStaticUrl = (url: string): string | null => {
  const match = url.match(/\/(character_avatars|script_covers|script_scenes|evidence_images)\/(.+)$/);
  return match ? match[2] : null;
};

/**
 * 检查图片是否存在（通过尝试加载）
 * @param url 图片URL
 * @returns Promise<boolean> 图片是否存在
 */
export const checkImageExists = (url: string): Promise<boolean> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = url;
  });
};

/**
 * 预加载图片
 * @param urls 图片URL数组
 */
export const preloadImages = (urls: string[]): Promise<void[]> => {
  const promises = urls.map(url => 
    new Promise<void>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve();
      img.onerror = reject;
      img.src = url;
    })
  );
  
  return Promise.allSettled(promises).then(() => []);
};

/**
 * 获取图片的显示名称（用于UI显示）
 */
export const getImageDisplayName = (filename: string | null | undefined): string => {
  if (!filename) return '默认图片';
  
  // 如果是data URL
  if (filename.startsWith('data:')) {
    return '自定义图片';
  }
  
  // 如果是静态路径，提取文件名
  const extractedName = extractFilenameFromStaticUrl(filename);
  if (extractedName) {
    return extractedName.replace(/\.(png|jpg|jpeg|gif|webp)$/i, '');
  }
  
  // 直接文件名
  return filename.replace(/\.(png|jpg|jpeg|gif|webp)$/i, '');
};

/**
 * 生成图片的缩略图URL（如果支持）
 * 目前返回原图，未来可以扩展支持缩略图服务
 */
export const getThumbnailUrl = (
  type: ImageType, 
  filename: string | null | undefined, 
  size: 'small' | 'medium' | 'large' = 'medium'
): string => {
  // 目前直接返回原图URL
  // 未来可以扩展为: /thumbnails/medium/character_avatars/filename.png
  return getStaticImageUrl(type, filename);
};

/**
 * 图片类型检测
 */
export const detectImageType = (url: string): ImageType | null => {
  if (url.includes('/character_avatars/')) return 'avatar';
  if (url.includes('/script_covers/')) return 'cover';
  if (url.includes('/script_scenes/')) return 'scene';
  if (url.includes('/evidence_images/')) return 'evidence';
  return null;
};

// 导出常量
export const IMAGE_TYPES = {
  AVATAR: 'avatar' as const,
  COVER: 'cover' as const,
  SCENE: 'scene' as const,
  EVIDENCE: 'evidence' as const,
};

export const DEFAULT_IMAGES = {
  [IMAGE_TYPES.AVATAR]: '/character_avatars/officer.png',
  [IMAGE_TYPES.COVER]: '/script_covers/default_cover.png',
  [IMAGE_TYPES.SCENE]: '/script_scenes/default_scene.png',
  [IMAGE_TYPES.EVIDENCE]: '/evidence_images/default_evidence.png',
};

/**
 * 使用示例：
 * 
 * // 基本使用
 * const avatarUrl = getAvatarUrl(character.image);
 * const coverUrl = getCoverUrl(script.coverImage);
 * 
 * // 通用方法
 * const imageUrl = getStaticImageUrl('avatar', 'john.png');
 * 
 * // 检查图片
 * const exists = await checkImageExists('/character_avatars/john.png');
 * 
 * // 预加载
 * await preloadImages([avatarUrl, coverUrl]);
 */
