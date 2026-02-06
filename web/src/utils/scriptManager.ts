// 剧本管理工具（统一版）
// 合并自 scriptUtils.ts + scriptFileManager.ts

import { Script } from '../types/script';

// ==================== 常量 ====================

const SCRIPTS_STORAGE_KEY = 'murder_mystery_scripts';
const CURRENT_SCRIPT_KEY = 'current_script_id';
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:10000';

// ==================== localStorage 剧本读写 ====================

export const loadScriptsFromStorage = (): Script[] => {
  try {
    const stored = localStorage.getItem(SCRIPTS_STORAGE_KEY);
    if (!stored) return [];
    const scripts = JSON.parse(stored) as Script[];
    return scripts.map(script => {
      if (script.coverImage && script.coverImage.startsWith('cache:')) {
        const scriptId = script.coverImage.replace('cache:', '');
        try {
          const cacheKey = `cover_cache_${scriptId}`;
          let cachedCover = localStorage.getItem(cacheKey);
          if (cachedCover) return { ...script, coverImage: cachedCover };
          cachedCover = sessionStorage.getItem(`temp_cover_${scriptId}`);
          if (cachedCover) return { ...script, coverImage: cachedCover };
          return script;
        } catch (error) {
          console.error(`❌ 恢复封面数据失败: ${script.title}`, error);
          return script;
        }
      }
      return script;
    });
  } catch (error) {
    console.error('❌ 从localStorage加载剧本失败:', error);
    return [];
  }
};

export const saveScriptsToStorage = (scripts: Script[]): void => {
  try {
    localStorage.setItem(SCRIPTS_STORAGE_KEY, JSON.stringify(scripts));
  } catch (error) {
    console.error('❌ 保存剧本到localStorage失败:', error);
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      try {
        const compressedScripts = scripts.map(script => ({
          id: script.id, title: script.title, description: script.description,
          author: script.author, version: script.version, createdAt: script.createdAt,
          updatedAt: script.updatedAt, globalStory: script.globalStory,
          characters: script.characters, settings: script.settings,
          quiz: script.quiz, sourceType: script.sourceType,
        }));
        localStorage.setItem(SCRIPTS_STORAGE_KEY, JSON.stringify(compressedScripts));
      } catch (compressionError) {
        console.error('❌ 压缩版剧本保存也失败:', compressionError);
      }
    }
  }
};

export const getCurrentScriptId = (): string | null => localStorage.getItem(CURRENT_SCRIPT_KEY);

export const setCurrentScriptId = (id: string | null): void => {
  if (id) localStorage.setItem(CURRENT_SCRIPT_KEY, id);
  else localStorage.removeItem(CURRENT_SCRIPT_KEY);
};

export const findScriptById = (scripts: Script[], id: string): Script | undefined => {
  return scripts.find(script => script.id === id);
};

// 封面缓存兼容方法
export const saveCoverToCache = (scriptId: string, coverData: string): boolean => {
  try { localStorage.setItem(`cover_cache_${scriptId}`, coverData); return true; }
  catch { return false; }
};
export const getCoverFromCache = (scriptId: string): string | null => {
  try { return localStorage.getItem(`cover_cache_${scriptId}`); }
  catch { return null; }
};

// ==================== 剧本统计与验证 ====================

export const getScriptStats = (script: Script) => {
  const characterCount = script.characters?.length || 0;
  const estimatedWords = script.globalStory?.length || 0;
  const lastUpdated = new Date(script.updatedAt).toLocaleDateString('zh-CN', {
    year: 'numeric', month: '2-digit', day: '2-digit'
  });
  return { characterCount, estimatedWords, hasCover: !!script.coverImage, hasQuiz: !!(script.quiz && script.quiz.length > 0), lastUpdated };
};

export const validateScript = (script: Script): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  const hasPlayer = script.characters.some(char => char.isPlayer);
  if (!hasPlayer) errors.push('剧本必须包含一个玩家角色 (isPlayer: true)');
  const hasPartner = script.characters.some(char => char.isPartner);
  if (!hasPartner) errors.push('剧本必须包含一个搭档角色 (isPartner: true)');
  const hasKiller = script.characters.some(char => char.isKiller);
  if (!hasKiller) errors.push('剧本必须包含一个凶手角色 (isKiller: true)');
  if (script.characters.filter(char => char.isPlayer).length > 1) errors.push('剧本只能有一个玩家角色');
  if (script.characters.filter(char => char.isPartner).length > 1) errors.push('剧本只能有一个搭档角色');
  if (script.characters.filter(char => char.isKiller).length > 1) errors.push('剧本只能有一个凶手角色');
  return { isValid: errors.length === 0, errors };
};

// ==================== 导入/导出 ====================

export const exportScriptAsJSON = async (script: Script): Promise<void> => {
  try {
    const scriptData = { ...script, exportedAt: new Date().toISOString(), version: script.version || '1.0.0' };
    const dataStr = JSON.stringify(scriptData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const safeTitle = script.title.replace(/\s+/g, '_');
    const fileName = `${safeTitle}.json`;
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('❌ 导出剧本文件失败:', error);
  }
};

export const importScriptFromFile = (file: File): Promise<Script> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const script = JSON.parse(e.target?.result as string) as Script;
        if (!script.id || !script.title || !script.characters) {
          reject(new Error('无效的剧本文件格式'));
          return;
        }
        script.id = `script_${Date.now()}`;
        script.createdAt = new Date().toISOString();
        script.updatedAt = new Date().toISOString();
        resolve(script);
      } catch { reject(new Error('文件格式不正确')); }
    };
    reader.onerror = () => reject(new Error('文件读取失败'));
    reader.readAsText(file);
  });
};

// ==================== 后端文件系统 API（来自 scriptFileManager.ts） ====================

const getUniqueScriptName = async (script: Script): Promise<string> => {
  try {
    const scriptsIndex = JSON.parse(localStorage.getItem('scripts_index') || '[]');
    const existingNames = scriptsIndex.filter((item: any) => item.id !== script.id).map((item: any) => item.title || '');
    let title = script.title;
    if (!title || title.trim() === '') {
      let counter = 1;
      title = `新剧本${counter}`;
      while (existingNames.includes(title)) { counter++; title = `新剧本${counter}`; }
      script.title = title;
    } else {
      let originalTitle = title;
      let counter = 1;
      while (existingNames.includes(title)) { counter++; title = `${originalTitle}${counter}`; }
      if (title !== originalTitle) script.title = title;
    }
    return title;
  } catch {
    const fallbackTitle = `新剧本${Date.now()}`;
    script.title = fallbackTitle;
    return fallbackTitle;
  }
};

const getScriptFileName = async (script: Script): Promise<string> => {
  const title = await getUniqueScriptName(script);
  const safeTitle = title.replace(/[^\u4e00-\u9fa5a-zA-Z0-9\s]/g, '').trim().replace(/\s+/g, '_');
  return `${safeTitle}.json`;
};

const saveScriptToFileSystem = async (script: Script): Promise<boolean> => {
  try {
    const fileName = await getScriptFileName(script);
    const scriptData = { ...script, savedAt: new Date().toISOString(), version: script.version || '1.0.0' };
    const response = await fetch(`${API_BASE_URL}/scripts/save`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileName, scriptData })
    });
    return response.ok;
  } catch { return false; }
};

const loadScriptFromFileSystem = async (fileName: string): Promise<Script | null> => {
  try {
    const response = await fetch(`${API_BASE_URL}/scripts/load/${encodeURIComponent(fileName)}`);
    return response.ok ? await response.json() as Script : null;
  } catch { return null; }
};

const getAllScriptFilesFromFileSystem = async (): Promise<any[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/scripts/list`);
    return response.ok ? await response.json() : [];
  } catch { return []; }
};

const deleteScriptFromFileSystem = async (fileName: string): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE_URL}/scripts/delete/${encodeURIComponent(fileName)}`, { method: 'DELETE' });
    return response.ok;
  } catch { return false; }
};

// ==================== 文件系统剧本管理 ====================

export const saveScriptToFile = async (script: Script): Promise<boolean> => {
  try {
    const scriptData = { ...script, savedAt: new Date().toISOString(), version: script.version || '1.0.0' };
    const fileSystemSaved = await saveScriptToFileSystem(script);
    const scriptsIndex = JSON.parse(localStorage.getItem('scripts_index') || '[]');
    const existingIndex = scriptsIndex.findIndex((item: any) => item.id === script.id);
    const fileName = await getScriptFileName(script);
    const scriptFileInfo = {
      id: script.id, title: script.title, fileName, filePath: `scripts/${fileName}`,
      savedAt: scriptData.savedAt, version: scriptData.version
    };
    if (existingIndex >= 0) scriptsIndex[existingIndex] = scriptFileInfo;
    else scriptsIndex.push(scriptFileInfo);
    localStorage.setItem(`script_${script.id}`, JSON.stringify(scriptData));
    localStorage.setItem('scripts_index', JSON.stringify(scriptsIndex));
    return true;
  } catch (error) {
    console.error('❌ 保存剧本文件失败:', error);
    return false;
  }
};

export const loadScriptFromFile = async (scriptId: string): Promise<Script | null> => {
  try {
    const scriptData = localStorage.getItem(`script_${scriptId}`);
    if (scriptData) return JSON.parse(scriptData) as Script;
    const scriptsIndex = await getAllScriptFiles();
    const fileInfo = scriptsIndex.find((item: any) => item.id === scriptId);
    if (fileInfo) {
      const script = await loadScriptFromFileSystem(fileInfo.fileName);
      if (script) { localStorage.setItem(`script_${scriptId}`, JSON.stringify(script)); return script; }
    }
    return null;
  } catch { return null; }
};

export const getAllScriptFiles = async (): Promise<any[]> => {
  try {
    const scriptsIndex = JSON.parse(localStorage.getItem('scripts_index') || '[]');
    try {
      const fileSystemIndex = await getAllScriptFilesFromFileSystem();
      const mergedIndex = [...scriptsIndex];
      fileSystemIndex.forEach(fileInfo => {
        const existingIndex = mergedIndex.findIndex(item => item.id === fileInfo.id);
        if (existingIndex === -1) mergedIndex.push(fileInfo);
        else if (new Date(fileInfo.savedAt) > new Date(mergedIndex[existingIndex].savedAt)) mergedIndex[existingIndex] = fileInfo;
      });
      localStorage.setItem('scripts_index', JSON.stringify(mergedIndex));
      return mergedIndex;
    } catch { return scriptsIndex; }
  } catch { return []; }
};

export const deleteScriptFile = async (scriptId: string): Promise<boolean> => {
  try {
    const scriptsIndex = JSON.parse(localStorage.getItem('scripts_index') || '[]');
    const fileInfo = scriptsIndex.find((item: any) => item.id === scriptId);
    const filteredIndex = scriptsIndex.filter((item: any) => item.id !== scriptId);
    localStorage.setItem('scripts_index', JSON.stringify(filteredIndex));
    localStorage.removeItem(`script_${scriptId}`);
    if (fileInfo) { try { await deleteScriptFromFileSystem(fileInfo.fileName); } catch { /* ignore */ } }
    return true;
  } catch { return false; }
};

export const exportScriptAsFile = async (script: Script): Promise<void> => {
  try {
    const scriptData = { ...script, exportedAt: new Date().toISOString(), version: script.version || '1.0.0' };
    const dataStr = JSON.stringify(scriptData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const fileName = await getScriptFileName(script);
    const link = document.createElement('a');
    link.href = url; link.download = fileName;
    document.body.appendChild(link); link.click();
    document.body.removeChild(link); URL.revokeObjectURL(url);
  } catch (error) { console.error('❌ 导出剧本文件失败:', error); }
};

export const exportAllScripts = async (): Promise<void> => {
  try {
    const scriptsIndex = await getAllScriptFiles();
    const scriptsData = [];
    for (const fileInfo of scriptsIndex) {
      const script = await loadScriptFromFile(fileInfo.id);
      if (script) scriptsData.push(script);
    }
    const dataStr = JSON.stringify(scriptsData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url; link.download = `all_scripts_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link); link.click();
    document.body.removeChild(link); URL.revokeObjectURL(url);
  } catch (error) { console.error('❌ 批量导出失败:', error); }
};

export const getScriptFileStats = async () => {
  try {
    const scriptsIndex = await getAllScriptFiles();
    const totalSize = scriptsIndex.reduce((size, fileInfo) => {
      const scriptData = localStorage.getItem(`script_${fileInfo.id}`);
      return size + (scriptData ? scriptData.length : 0);
    }, 0);
    return { totalScripts: scriptsIndex.length, totalSize, averageSize: scriptsIndex.length > 0 ? Math.round(totalSize / scriptsIndex.length) : 0 };
  } catch { return { totalScripts: 0, totalSize: 0, averageSize: 0 }; }
};
