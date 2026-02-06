// 数据库API接口
import { Script } from '../types/script';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:10000';

export interface DatabaseResponse {
  success: boolean;
  message?: string;
}

export interface ScriptListResponse extends DatabaseResponse {
  scripts: Script[];
}

export interface ScriptResponse extends DatabaseResponse {
  script: Script;
}

export interface SaveScriptResponse extends DatabaseResponse {
  script_id: string;
  cover_filename?: string;
}

// 保存剧本到数据库
export async function saveScriptToDB(script: Script): Promise<SaveScriptResponse> {
  try {
    
    const response = await fetch(`${API_BASE_URL}/db/scripts/save`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(script),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result: SaveScriptResponse = await response.json();
    
    if (result.success) {
    } else {
      console.log('❌ 剧本保存到数据库失败:', result.message);
    }
    
    return result;
  } catch (error) {
    console.error('❌ 数据库保存请求失败:', error);
    return {
      success: false,
      message: `数据库保存请求失败: ${error instanceof Error ? error.message : '未知错误'}`,
      script_id: script.id
    };
  }
}

// 从数据库获取所有剧本
export async function getScriptsFromDB(): Promise<ScriptListResponse> {
  try {
    // console.log('📋 从简化数据库获取剧本列表');
    
    const response = await fetch(`${API_BASE_URL}/db/scripts/list`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result: ScriptListResponse = await response.json();
    
    if (result.success) {
    } else {
      console.log('❌ 从数据库加载剧本失败:', result.message);
    }
    
    return result;
  } catch (error) {
    console.error('❌ 数据库查询请求失败:', error);
    return {
      success: false,
      scripts: [],
      message: `数据库查询请求失败: ${error instanceof Error ? error.message : '未知错误'}`
    };
  }
}

// 从数据库获取指定剧本
export async function getScriptFromDB(scriptId: string): Promise<ScriptResponse> {
  try {
    
    const response = await fetch(`${API_BASE_URL}/db/scripts/${scriptId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return {
          success: false,
          message: '剧本不存在',
          script: {} as Script
        };
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result: ScriptResponse = await response.json();
    
    if (result.success) {
    } else {
      console.log('❌ 从数据库获取剧本失败:', result.message);
    }
    
    return result;
  } catch (error) {
    console.error('❌ 数据库查询请求失败:', error);
    return {
      success: false,
      script: {} as Script,
      message: `数据库查询请求失败: ${error instanceof Error ? error.message : '未知错误'}`
    };
  }
}

// 从数据库删除剧本
export async function deleteScriptFromDB(scriptId: string): Promise<DatabaseResponse> {
  try {
    
    const response = await fetch(`${API_BASE_URL}/db/scripts/${scriptId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result: DatabaseResponse = await response.json();
    
    if (result.success) {
    } else {
      console.log('❌ 从数据库删除剧本失败:', result.message);
    }
    
    return result;
  } catch (error) {
    console.error('❌ 数据库删除请求失败:', error);
    return {
      success: false,
      message: `数据库删除请求失败: ${error instanceof Error ? error.message : '未知错误'}`
    };
  }
}

// 迁移现有数据到数据库
export async function migrateDataToDB(scripts: Script[]): Promise<DatabaseResponse> {
  try {
    
    let successCount = 0;
    let failedCount = 0;
    
    // 逐个迁移剧本
    for (const script of scripts) {
      try {
        const result = await saveScriptToDB(script);
        if (result.success) {
          successCount++;
        } else {
          failedCount++;
          console.error(`❌ 迁移剧本失败: ${script.title}`, result.message);
        }
      } catch (error) {
        failedCount++;
        console.error(`❌ 迁移剧本异常: ${script.title}`, error);
      }
    }
    
    
    return {
      success: successCount > 0,
      message: `数据迁移完成: 成功 ${successCount} 个，失败 ${failedCount} 个`
    };
    
  } catch (error) {
    console.error('❌ 数据迁移异常:', error);
    return {
      success: false,
      message: `数据迁移异常: ${error instanceof Error ? error.message : '未知错误'}`
    };
  }
}
