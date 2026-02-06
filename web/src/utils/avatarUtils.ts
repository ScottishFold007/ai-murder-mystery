// 头像工具集：名称映射 + 路径解析 + 预加载
// 合并自 avatarNames.ts 和 avatarPath.ts

import { getAvatarUrl } from './imageUtils';

// ==================== 头像名称映射 ====================

export const avatarNameMap: Record<string, string> = {
  'officer.png': '警官',
  'violent.png': '暴徒',
  'pretty.png': '美女',
  'solitary.png': '隐士',
  'amateur.png': '新手',
  'innocent.png': '无辜者',
  'taipinggongzhu.png': '太平公主',
  'taipinggongzhu2.png': '太平公主（二）',
  'taipinggongzhu3.png': '太平公主（三）',
  'zhangchangzong.png': '张昌宗',
  'gaolishi.png': '高力士',
  'gaolishi2.png': '高力士（二）',
  'lilongji.png': '李隆基',
  'wuhuifei.png': '武惠妃',
  'wuhuifei2.png': '武惠妃（二）',
  'wuhuifei3.png': '武惠妃（三）',
  'pangfeizi.png': '胖妃子',
  'xiaoyahuan.png': '小丫鬟',
  'guanyuan1.png': '官员一',
  'guanyuan2.png': '官员二',
  'guanyuan3.png': '官员三',
};

export const getAvatarChineseName = (fileName: string): string => {
  if (avatarNameMap[fileName]) {
    return avatarNameMap[fileName];
  }
  const nameWithoutExt = fileName.replace(/\.(png|jpg|jpeg)$/i, '');
  if (/[\u4e00-\u9fa5]/.test(nameWithoutExt)) {
    return nameWithoutExt;
  }
  return nameWithoutExt
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

// ==================== 头像路径解析与预加载 ====================

declare const require: {
  context: (path: string, deep?: boolean, filter?: RegExp) => {
    keys(): string[];
    (id: string): any;
  };
};

function loadAvatarImages(): { [key: string]: string } {
  const images: { [key: string]: string } = {};
  try {
    const context = require.context('../assets/character_avatars', false, /\.(png|jpe?g|svg)$/);
    context.keys().forEach((item: string) => {
      const key = item.replace('./', '');
      images[key] = context(item);
    });
  } catch (error) {
    // 回退方案
  }
  return images;
}

const avatarImages = loadAvatarImages();

export function resolveAvatarSrc(image: string | undefined | null): string | undefined {
  if (!image) {
    return undefined;
  }

  if (typeof image === 'string' && image.startsWith('data:image/')) {
    return image;
  }

  if (typeof image === 'string' && image.startsWith('avatar_cache:')) {
    const cacheKey = image.replace('avatar_cache:', '');
    const [scriptId, characterName] = cacheKey.split('_', 2);

    import('./coverCacheManager').then(async ({ getAvatarFromIndexedDB }) => {
      try {
        const avatarData = await getAvatarFromIndexedDB(scriptId, characterName);
        if (avatarData) {
          // 通过React状态或事件系统更新
        }
      } catch (error) {
        console.error(`❌ IndexedDB头像恢复失败: ${characterName}`, error);
      }
    });

    return '/character_avatars/officer.png';
  }

  if (image && avatarImages[image]) {
    return avatarImages[image];
  }

  return getAvatarUrl(image);
}

export function getAvailableAvatars(): string[] {
  const preloadedAvatars = Object.keys(avatarImages);
  if (preloadedAvatars.length === 0) {
    return [
      'amateur.png', 'gaolishi.png', 'gaolishi2.png', 'guanyuan1.png',
      'guanyuan2.png', 'guanyuan3.png', 'innocent.png', 'lilongji.png',
      'officer.png', 'pangfeizi.png', 'pretty.png', 'solitary.png',
      'taipinggongzhu.png', 'taipinggongzhu2.png', 'taipinggongzhu3.png',
      'violent.png', 'wuhuifei.png', 'wuhuifei2.png', 'wuhuifei3.png',
      'xiaoyahuan.png', 'zhangchangzong.png'
    ];
  }
  return preloadedAvatars;
}

export const getAllAvatarNames = (): Array<{value: string, label: string}> => {
  const availableAvatars = getAvailableAvatars();
  return availableAvatars.map(fileName => ({
    value: fileName,
    label: getAvatarChineseName(fileName)
  }));
};
