// 封面/头像缓存管理工具（统一版）
// 合并自 coverCache.ts + coverStorage.ts + indexedDBCoverCache.ts
// 主存储：IndexedDB (localForage)，回退：localStorage / sessionStorage

import localForage from 'localforage';

// ==================== IndexedDB 存储实例 ====================

const coverStore = localForage.createInstance({
  name: 'MurderMysteryV2',
  storeName: 'covers',
  description: '剧本封面图片存储',
  version: 2.0
});

const avatarStore = localForage.createInstance({
  name: 'MurderMysteryV2',
  storeName: 'avatars',
  description: '角色头像图片存储',
  version: 2.0
});

const coverMetaStore = localForage.createInstance({
  name: 'MurderMysteryV2',
  storeName: 'cover_metadata',
  description: '封面元数据存储',
  version: 2.0
});

const avatarMetaStore = localForage.createInstance({
  name: 'MurderMysteryV2',
  storeName: 'avatar_metadata',
  description: '头像元数据存储',
  version: 2.0
});

interface CoverMetadata {
  scriptId: string;
  filename: string;
  size: number;
  timestamp: number;
  mimeType: string;
}

interface AvatarMetadata {
  characterId: string;
  scriptId: string;
  characterName: string;
  filename: string;
  size: number;
  timestamp: number;
  mimeType: string;
}

// ==================== IndexedDB 核心类 ====================

class IndexedDBCoverCache {
  private initialized = false;

  async initialize(): Promise<void> {
    if (this.initialized) return;
    try {
      await coverStore.ready();
      await coverMetaStore.ready();
      await avatarStore.ready();
      await avatarMetaStore.ready();
      this.initialized = true;
    } catch (error) {
      console.error('❌ IndexedDB初始化失败:', error);
      throw new Error('IndexedDB不可用');
    }
  }

  async saveCover(scriptId: string, coverData: string): Promise<boolean> {
    try {
      await this.initialize();
      const [header, base64Data] = coverData.split(',');
      const mimeType = header.match(/data:([^;]+)/)?.[1] || 'image/png';
      const binaryString = atob(base64Data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: mimeType });
      const timestamp = Date.now();
      const filename = `cover_${scriptId}_${timestamp}`;
      await coverStore.setItem(filename, blob);
      const metadata: CoverMetadata = { scriptId, filename, size: blob.size, timestamp, mimeType };
      await coverMetaStore.setItem(scriptId, metadata);
      return true;
    } catch (error) {
      console.error(`❌ IndexedDB保存封面失败: ${scriptId}`, error);
      return false;
    }
  }

  async getCover(scriptId: string): Promise<string | null> {
    try {
      await this.initialize();
      const metadata = await coverMetaStore.getItem<CoverMetadata>(scriptId);
      if (!metadata) return null;
      const blob = await coverStore.getItem<Blob>(metadata.filename);
      if (!blob) {
        await coverMetaStore.removeItem(scriptId);
        return null;
      }
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error(`❌ IndexedDB获取封面失败: ${scriptId}`, error);
      return null;
    }
  }

  async removeCover(scriptId: string): Promise<boolean> {
    try {
      await this.initialize();
      const metadata = await coverMetaStore.getItem<CoverMetadata>(scriptId);
      if (metadata) await coverStore.removeItem(metadata.filename);
      await coverMetaStore.removeItem(scriptId);
      return true;
    } catch (error) {
      console.error(`❌ IndexedDB删除封面失败: ${scriptId}`, error);
      return false;
    }
  }

  async saveAvatar(scriptId: string, characterName: string, avatarData: string): Promise<boolean> {
    try {
      await this.initialize();
      const [header, base64Data] = avatarData.split(',');
      const mimeType = header.match(/data:([^;]+)/)?.[1] || 'image/png';
      const binaryString = atob(base64Data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: mimeType });
      const timestamp = Date.now();
      const characterId = `${scriptId}_${characterName}`;
      const filename = `avatar_${characterId}_${timestamp}`;
      await avatarStore.setItem(filename, blob);
      const metadata: AvatarMetadata = { characterId, scriptId, characterName, filename, size: blob.size, timestamp, mimeType };
      await avatarMetaStore.setItem(characterId, metadata);
      return true;
    } catch (error) {
      console.error(`❌ IndexedDB保存头像失败: ${characterName}`, error);
      return false;
    }
  }

  async getAvatar(scriptId: string, characterName: string): Promise<string | null> {
    try {
      await this.initialize();
      const characterId = `${scriptId}_${characterName}`;
      const metadata = await avatarMetaStore.getItem<AvatarMetadata>(characterId);
      if (!metadata) return null;
      const blob = await avatarStore.getItem<Blob>(metadata.filename);
      if (!blob) {
        await avatarMetaStore.removeItem(characterId);
        return null;
      }
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error(`❌ IndexedDB获取头像失败: ${characterName}`, error);
      return null;
    }
  }

  async removeAvatar(scriptId: string, characterName: string): Promise<boolean> {
    try {
      await this.initialize();
      const characterId = `${scriptId}_${characterName}`;
      const metadata = await avatarMetaStore.getItem<AvatarMetadata>(characterId);
      if (metadata) await avatarStore.removeItem(metadata.filename);
      await avatarMetaStore.removeItem(characterId);
      return true;
    } catch (error) {
      console.error(`❌ IndexedDB删除头像失败: ${characterName}`, error);
      return false;
    }
  }

  async getAllCoverMetadata(): Promise<CoverMetadata[]> {
    try {
      await this.initialize();
      const keys = await coverMetaStore.keys();
      const list: CoverMetadata[] = [];
      for (const key of keys) {
        const m = await coverMetaStore.getItem<CoverMetadata>(key as string);
        if (m) list.push(m);
      }
      return list.sort((a, b) => b.timestamp - a.timestamp);
    } catch (error) {
      console.error('❌ 获取IndexedDB封面元数据失败:', error);
      return [];
    }
  }

  async cleanupOldCovers(maxAge: number = 30 * 24 * 60 * 60 * 1000): Promise<number> {
    try {
      await this.initialize();
      const allMetadata = await this.getAllCoverMetadata();
      const cutoffTime = Date.now() - maxAge;
      let cleanedCount = 0;
      for (const metadata of allMetadata) {
        if (metadata.timestamp < cutoffTime) {
          if (await this.removeCover(metadata.scriptId)) cleanedCount++;
        }
      }
      if (cleanedCount > 0) console.log(`🧹 IndexedDB清理了 ${cleanedCount} 个过期封面`);
      return cleanedCount;
    } catch (error) {
      console.error('❌ IndexedDB清理封面失败:', error);
      return 0;
    }
  }

  async getAllAvatarMetadata(): Promise<AvatarMetadata[]> {
    try {
      await this.initialize();
      const keys = await avatarMetaStore.keys();
      const list: AvatarMetadata[] = [];
      for (const key of keys) {
        const m = await avatarMetaStore.getItem<AvatarMetadata>(key as string);
        if (m) list.push(m);
      }
      return list.sort((a, b) => b.timestamp - a.timestamp);
    } catch (error) {
      console.error('❌ 获取IndexedDB头像元数据失败:', error);
      return [];
    }
  }

  async getStorageInfo(): Promise<{ covers: { count: number; totalSize: number }, avatars: { count: number; totalSize: number }, total: { count: number; totalSize: number } }> {
    try {
      await this.initialize();
      const coverMeta = await this.getAllCoverMetadata();
      const avatarMeta = await this.getAllAvatarMetadata();
      const coverSize = coverMeta.reduce((s, m) => s + m.size, 0);
      const avatarSize = avatarMeta.reduce((s, m) => s + m.size, 0);
      return {
        covers: { count: coverMeta.length, totalSize: coverSize },
        avatars: { count: avatarMeta.length, totalSize: avatarSize },
        total: { count: coverMeta.length + avatarMeta.length, totalSize: coverSize + avatarSize }
      };
    } catch (error) {
      console.error('❌ 获取IndexedDB存储信息失败:', error);
      return { covers: { count: 0, totalSize: 0 }, avatars: { count: 0, totalSize: 0 }, total: { count: 0, totalSize: 0 } };
    }
  }

  async isAvailable(): Promise<boolean> {
    try { await this.initialize(); return true; } catch { return false; }
  }
}

export const indexedDBCoverCache = new IndexedDBCoverCache();

// ==================== IndexedDB 便捷方法 ====================

export async function saveToIndexedDB(scriptId: string, coverData: string): Promise<boolean> {
  return await indexedDBCoverCache.saveCover(scriptId, coverData);
}
export async function getFromIndexedDB(scriptId: string): Promise<string | null> {
  return await indexedDBCoverCache.getCover(scriptId);
}
export async function removeFromIndexedDB(scriptId: string): Promise<boolean> {
  return await indexedDBCoverCache.removeCover(scriptId);
}
export async function saveAvatarToIndexedDB(scriptId: string, characterName: string, avatarData: string): Promise<boolean> {
  return await indexedDBCoverCache.saveAvatar(scriptId, characterName, avatarData);
}
export async function getAvatarFromIndexedDB(scriptId: string, characterName: string): Promise<string | null> {
  return await indexedDBCoverCache.getAvatar(scriptId, characterName);
}
export async function removeAvatarFromIndexedDB(scriptId: string, characterName: string): Promise<boolean> {
  return await indexedDBCoverCache.removeAvatar(scriptId, characterName);
}
export async function isIndexedDBAvailable(): Promise<boolean> {
  return await indexedDBCoverCache.isAvailable();
}
export async function autoCleanup(): Promise<void> {
  try {
    const cleanedCount = await indexedDBCoverCache.cleanupOldCovers();
    if (cleanedCount > 0) console.log(`🧹 自动清理完成: 清理了 ${cleanedCount} 个过期封面`);
  } catch (error) {
    console.error('❌ 自动清理失败:', error);
  }
}

// ==================== localStorage 回退缓存（来自 coverCache.ts） ====================

const COVER_CACHE_PREFIX = 'cover_cache_';

export const saveCoverToCache = (scriptId: string, coverData: string): boolean => {
  try {
    const cacheKey = `${COVER_CACHE_PREFIX}${scriptId}`;
    localStorage.setItem(cacheKey, coverData);
    return true;
  } catch (error) {
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      // 空间不足时尝试 sessionStorage
      try {
        sessionStorage.setItem(`temp_cover_${scriptId}`, coverData);
        return true;
      } catch { return false; }
    }
    return false;
  }
};

export const getCoverFromCache = (scriptId: string): string | null => {
  try {
    const cacheKey = `${COVER_CACHE_PREFIX}${scriptId}`;
    const coverData = localStorage.getItem(cacheKey);
    if (coverData) return coverData;
    return sessionStorage.getItem(`temp_cover_${scriptId}`);
  } catch {
    return null;
  }
};

export const removeCoverFromCache = (scriptId: string): void => {
  try {
    localStorage.removeItem(`${COVER_CACHE_PREFIX}${scriptId}`);
  } catch { /* ignore */ }
};
