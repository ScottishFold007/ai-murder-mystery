// 笔记管理工具函数

import { Note, NoteContext } from '../types/notes';
import { nanoid } from 'nanoid';

/**
 * 获取当前会话的笔记存储键
 */
export const getNotesStorageKey = (sessionId: string): string => {
  return `notes_session_${sessionId}`;
};

/**
 * 从本地存储加载指定会话的笔记
 */
export const loadNotesFromStorage = (sessionId: string): Note[] => {
  try {
    const storageKey = getNotesStorageKey(sessionId);
    
    const stored = localStorage.getItem(storageKey);
    
    if (!stored) {
      return [];
    }
    
    const noteContext: NoteContext = JSON.parse(stored);
    console.log('🔍 loadNotesFromStorage - 解析的上下文:', noteContext);
    console.log('🔍 loadNotesFromStorage - 加载的笔记数量:', noteContext.notes?.length || 0);
    
    return noteContext.notes || [];
  } catch (error) {
    console.error('❌ 加载笔记失败:', error);
    return [];
  }
};

/**
 * 保存笔记到本地存储
 */
export const saveNotesToStorage = (sessionId: string, notes: Note[]): boolean => {
  try {
    const storageKey = getNotesStorageKey(sessionId);
    const noteContext: NoteContext = {
      notes,
      sessionId,
      lastUpdated: new Date().toISOString()
    };
    
    console.log('🔍 saveNotesToStorage - 保存键:', storageKey);
    console.log('🔍 saveNotesToStorage - 保存的笔记数量:', notes.length);
    console.log('🔍 saveNotesToStorage - 笔记内容:', notes);
    
    localStorage.setItem(storageKey, JSON.stringify(noteContext));
    return true;
  } catch (error) {
    console.error('❌ 保存笔记失败:', error);
    return false;
  }
};

/**
 * 创建新笔记
 */
export const createNote = (
  title: string,
  content: string,
  targetActor: string,
  targetActorId: number,
  sessionId: string
): Note => {
  const now = new Date().toISOString();
  return {
    id: nanoid(),
    title: title.trim() || `关于${targetActor}的笔记`,
    content: content.trim(),
    targetActor,
    targetActorId,
    createdAt: now,
    updatedAt: now,
    sessionId
  };
};

/**
 * 更新笔记
 */
export const updateNote = (
  noteId: string,
  updates: Partial<Pick<Note, 'title' | 'content'>>,
  sessionId: string
): Note | null => {
  const notes = loadNotesFromStorage(sessionId);
  const noteIndex = notes.findIndex(note => note.id === noteId);
  
  if (noteIndex === -1) {
    console.error('❌ 笔记不存在:', noteId);
    return null;
  }
  
  const updatedNote = {
    ...notes[noteIndex],
    ...updates,
    updatedAt: new Date().toISOString()
  };
  
  notes[noteIndex] = updatedNote;
  saveNotesToStorage(sessionId, notes);
  
  return updatedNote;
};

/**
 * 删除笔记
 */
export const deleteNote = (noteId: string, sessionId: string): boolean => {
  const notes = loadNotesFromStorage(sessionId);
  const filteredNotes = notes.filter(note => note.id !== noteId);
  
  if (filteredNotes.length === notes.length) {
    console.error('❌ 笔记不存在:', noteId);
    return false;
  }
  
  return saveNotesToStorage(sessionId, filteredNotes);
};

/**
 * 根据角色筛选笔记
 */
export const getNotesByActor = (sessionId: string, targetActor?: string): Note[] => {
  const notes = loadNotesFromStorage(sessionId);
  
  if (!targetActor) return notes;
  
  return notes.filter(note => note.targetActor === targetActor);
};

/**
 * 搜索笔记
 */
export const searchNotes = (sessionId: string, searchText: string): Note[] => {
  const notes = loadNotesFromStorage(sessionId);
  const searchLower = searchText.toLowerCase();
  
  return notes.filter(note => 
    note.title.toLowerCase().includes(searchLower) ||
    note.content.toLowerCase().includes(searchLower) ||
    note.targetActor.toLowerCase().includes(searchLower)
  );
};

/**
 * 获取笔记统计信息
 */
export const getNotesStats = (sessionId: string) => {
  const notes = loadNotesFromStorage(sessionId);
  
  const actorCounts: Record<string, number> = {};
  notes.forEach(note => {
    actorCounts[note.targetActor] = (actorCounts[note.targetActor] || 0) + 1;
  });
  
  return {
    totalNotes: notes.length,
    actorCounts,
    lastUpdated: notes.length > 0 ? 
      Math.max(...notes.map(note => new Date(note.updatedAt).getTime())) : 
      null
  };
};

/**
 * 生成笔记上下文摘要（用于AI对话）
 */
export const generateNotesContext = (sessionId: string, targetActor?: string): string => {
  // 始终使用全局笔记，按时间降序排列
  const notes = loadNotesFromStorage(sessionId)
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  
  console.log('🔍 generateNotesContext - sessionId:', sessionId);
  console.log('🔍 generateNotesContext - targetActor:', targetActor);
  console.log('🔍 generateNotesContext - notes found:', notes.length);
  console.log('🔍 generateNotesContext - notes:', notes);
  
  if (notes.length === 0) {
    console.log('🔍 generateNotesContext - 没有找到笔记，返回空字符串');
    return '';
  }
  
  const contextParts: string[] = [];
  
  // 按角色分组
  const notesByActor: Record<string, Note[]> = {};
  notes.forEach(note => {
    if (!notesByActor[note.targetActor]) {
      notesByActor[note.targetActor] = [];
    }
    notesByActor[note.targetActor].push(note);
  });
  
  // 生成上下文
  Object.entries(notesByActor).forEach(([actorName, actorNotes]) => {
    contextParts.push(`【关于${actorName}的笔记】`);
    actorNotes.forEach((note, index) => {
      const timeStr = new Date(note.updatedAt).toLocaleString('zh-CN');
      contextParts.push(`${index + 1}. ${note.title} (${timeStr})`);
      contextParts.push(`   内容：${note.content}`);
    });
    contextParts.push(''); // 空行分隔
  });
  
  const result = contextParts.join('\n');
  console.log('🔍 generateNotesContext - 生成的上下文:', result);
  return result;
};

/**
 * 清理过期笔记（可选功能）
 */
export const cleanupOldNotes = (sessionId: string, daysOld: number = 30): number => {
  const notes = loadNotesFromStorage(sessionId);
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);
  
  const filteredNotes = notes.filter(note => 
    new Date(note.updatedAt) > cutoffDate
  );
  
  const deletedCount = notes.length - filteredNotes.length;
  if (deletedCount > 0) {
    saveNotesToStorage(sessionId, filteredNotes);
    console.log(`🧹 清理了 ${deletedCount} 条过期笔记`);
  }
  
  return deletedCount;
};
