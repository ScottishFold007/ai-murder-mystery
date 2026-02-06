// 存储管理工具（统一版）
// 合并自 storageUtils.ts + deleteStateManager.ts

// ==================== localStorage 清理与优化 ====================

export const emergencyCleanStorage = () => {
  try {
    const { totalMB } = getTotalStorageSize();
    const cleanResult = cleanupOldScripts(5);
    const { totalMB: newTotalMB } = getTotalStorageSize();
    return { success: true, beforeMB: totalMB, afterMB: newTotalMB, cleaned: cleanResult.cleaned };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : '未知错误' };
  }
};

export const clearAIGeneratedScripts = () => {
  try { localStorage.removeItem('ai_generated_scripts'); return true; }
  catch { return false; }
};

export const getStorageSize = () => {
  try {
    const scripts = localStorage.getItem('ai_generated_scripts');
    if (scripts) {
      const sizeInBytes = new Blob([scripts]).size;
      return { sizeInBytes, sizeInMB: (sizeInBytes / (1024 * 1024)).toFixed(2) };
    }
    return { sizeInBytes: 0, sizeInMB: '0.00' };
  } catch { return { sizeInBytes: 0, sizeInMB: '0.00' }; }
};

export const optimizeScriptStorage = (scripts: any[]) => {
  return scripts.map(script => ({
    ...script,
    characters: script.characters?.map((char: any) => ({
      ...char,
      image: char.image && char.image.startsWith('data:image/') ? `${char.name}_generated.png` : char.image
    })) || [],
    evidences: script.evidences?.map((evidence: any) => ({
      ...evidence,
      image: evidence.image && evidence.image.startsWith('data:image/') ? `evidence_${evidence.id}.png` : evidence.image
    })) || [],
    scenes: script.scenes?.map((scene: any) => ({
      ...scene,
      content: scene.content && scene.content.length > 2000 ? scene.content.substring(0, 2000) + '...[已截断]' : scene.content
    })) || []
  }));
};

export const getTotalStorageSize = () => {
  let total = 0;
  for (let key in localStorage) {
    if (localStorage.hasOwnProperty(key)) total += localStorage[key].length;
  }
  return { totalBytes: total, totalMB: (total / (1024 * 1024)).toFixed(2) };
};

export const cleanupOldScripts = (keepCount: number = 10) => {
  try {
    const scripts = localStorage.getItem('ai_generated_scripts');
    if (!scripts) return { success: true, cleaned: 0 };
    const scriptArray = JSON.parse(scripts);
    if (scriptArray.length <= keepCount) return { success: true, cleaned: 0 };
    const sortedScripts = scriptArray
      .sort((a: any, b: any) => {
        const aTime = new Date(b.lastModified || b.updatedAt || b.createdAt || 0).getTime();
        const bTime = new Date(a.lastModified || a.updatedAt || a.createdAt || 0).getTime();
        return aTime - bTime;
      })
      .slice(0, keepCount);
    const optimizedScripts = optimizeScriptStorage(sortedScripts);
    localStorage.setItem('ai_generated_scripts', JSON.stringify(optimizedScripts));
    return { success: true, cleaned: scriptArray.length - keepCount };
  } catch { return { success: false, cleaned: 0 }; }
};

// ==================== 剧本删除状态管理 ====================

const DELETED_SCRIPTS_KEY = 'deleted_scripts_list';

export interface DeletedScriptRecord {
  scriptId: string;
  deletedAt: string;
  sourceType: 'example' | 'database' | 'ai' | 'manual';
  title?: string;
}

export function getDeletedScripts(): DeletedScriptRecord[] {
  try {
    const deleted = localStorage.getItem(DELETED_SCRIPTS_KEY);
    return deleted ? JSON.parse(deleted) : [];
  } catch { return []; }
}

export function markScriptAsDeleted(
  scriptId: string,
  sourceType: DeletedScriptRecord['sourceType'],
  title?: string
): void {
  try {
    const deletedScripts = getDeletedScripts();
    const existingIndex = deletedScripts.findIndex(record => record.scriptId === scriptId);
    const newRecord: DeletedScriptRecord = { scriptId, deletedAt: new Date().toISOString(), sourceType, title };
    if (existingIndex >= 0) deletedScripts[existingIndex] = newRecord;
    else deletedScripts.push(newRecord);
    localStorage.setItem(DELETED_SCRIPTS_KEY, JSON.stringify(deletedScripts));
  } catch (error) { console.error('❌ 记录删除状态失败:', error); }
}

export function isScriptDeleted(scriptId: string): boolean {
  return getDeletedScripts().some(record => record.scriptId === scriptId);
}

export function unmarkScriptAsDeleted(scriptId: string): void {
  try {
    const deletedScripts = getDeletedScripts().filter(record => record.scriptId !== scriptId);
    localStorage.setItem(DELETED_SCRIPTS_KEY, JSON.stringify(deletedScripts));
  } catch (error) { console.error('❌ 恢复删除状态失败:', error); }
}

export function filterDeletedScripts<T extends { id: string }>(scripts: T[]): T[] {
  const deletedIds = new Set(getDeletedScripts().map(record => record.scriptId));
  return scripts.filter(script => !deletedIds.has(script.id));
}

export function cleanupOldDeleteRecords(daysOld: number = 30): void {
  try {
    const deletedScripts = getDeletedScripts();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);
    const validRecords = deletedScripts.filter(record => new Date(record.deletedAt) > cutoffDate);
    if (validRecords.length < deletedScripts.length) {
      localStorage.setItem(DELETED_SCRIPTS_KEY, JSON.stringify(validRecords));
    }
  } catch (error) { console.error('❌ 清理删除记录失败:', error); }
}

export function getDeleteStatistics(): {
  total: number;
  bySourceType: Record<string, number>;
  recentDeletes: DeletedScriptRecord[];
} {
  const deletedScripts = getDeletedScripts();
  const bySourceType: Record<string, number> = {};
  deletedScripts.forEach(record => {
    bySourceType[record.sourceType] = (bySourceType[record.sourceType] || 0) + 1;
  });
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const recentDeletes = deletedScripts.filter(record => new Date(record.deletedAt) > sevenDaysAgo);
  return { total: deletedScripts.length, bySourceType, recentDeletes };
}
