// 笔记相关类型定义

export interface Note {
  id: string;
  title: string;
  content: string;
  targetActor: string; // 针对哪个角色的笔记
  targetActorId: number; // 角色ID
  category?: string; // 笔记类别（可选）
  tags?: string[]; // 标签列表（可选）
  createdAt: string; // 创建时间
  updatedAt: string; // 更新时间
  sessionId: string; // 关联的游戏会话ID
}

export interface NoteContext {
  notes: Note[];
  sessionId: string;
  lastUpdated: string;
}

// 笔记存储键名
export const NOTES_STORAGE_KEY = 'murder_mystery_notes';
export const NOTES_SESSION_PREFIX = 'notes_session_';

// 笔记操作类型
export type NoteAction = 'create' | 'update' | 'delete' | 'list';

// 笔记筛选选项
export interface NoteFilter {
  targetActor?: string;
  dateRange?: {
    start: string;
    end: string;
  };
  searchText?: string;
}
