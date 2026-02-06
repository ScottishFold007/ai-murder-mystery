/**
 * 证物管理API调用
 * 连接前端组件与后端证物CRUD API
 */

import { Evidence } from '../types/evidence';

export interface EvidenceApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * 获取指定会话的所有证物
 */
export const getEvidencesBySession = async (
  sessionId: string
): Promise<Evidence[]> => {
  try {
    const response = await fetch(`/evidence/session/${sessionId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return data.evidences || [];
  } catch (error) {
    console.error('获取证物列表失败:', error);
    return [];
  }
};

/**
 * 创建新证物
 */
export const createEvidence = async (
  evidence: Partial<Evidence>
): Promise<EvidenceApiResponse<Evidence>> => {
  try {
    const response = await fetch('/evidence/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(evidence),
    });

    const data = await response.json();
    
    if (!response.ok) {
      return {
        success: false,
        error: data.detail || `HTTP ${response.status}: ${response.statusText}`
      };
    }

    return {
      success: true,
      data: data.evidence
    };
  } catch (error) {
    console.error('创建证物失败:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '创建证物失败'
    };
  }
};

/**
 * 更新证物
 */
export const updateEvidence = async (
  evidenceId: string,
  updates: Partial<Evidence>
): Promise<EvidenceApiResponse<Evidence>> => {
  try {
    const response = await fetch(`/evidence/${evidenceId}/update`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });

    const data = await response.json();
    
    if (!response.ok) {
      return {
        success: false,
        error: data.detail || `HTTP ${response.status}: ${response.statusText}`
      };
    }

    return {
      success: true,
      data: data.evidence
    };
  } catch (error) {
    console.error('更新证物失败:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '更新证物失败'
    };
  }
};

/**
 * 删除证物
 */
export const deleteEvidence = async (
  evidenceId: string
): Promise<EvidenceApiResponse<boolean>> => {
  try {
    const response = await fetch(`/evidence/${evidenceId}/delete`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    
    if (!response.ok) {
      return {
        success: false,
        error: data.detail || `HTTP ${response.status}: ${response.statusText}`
      };
    }

    return {
      success: true,
      data: true
    };
  } catch (error) {
    console.error('删除证物失败:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '删除证物失败'
    };
  }
};

/**
 * 获取证物详情
 */
export const getEvidenceById = async (
  evidenceId: string
): Promise<Evidence | null> => {
  try {
    const response = await fetch(`/evidence/${evidenceId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return data.evidence;
  } catch (error) {
    console.error('获取证物详情失败:', error);
    return null;
  }
};

/**
 * 发现证物（更新发现状态）
 */
export const discoverEvidence = async (
  evidenceId: string,
  discoveredBy: string,
  discoveryContext?: string
): Promise<EvidenceApiResponse<Evidence>> => {
  try {
    const response = await fetch(`/evidence/${evidenceId}/discover`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        discoveredBy,
        discoveryContext
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      return {
        success: false,
        error: data.detail || `HTTP ${response.status}: ${response.statusText}`
      };
    }

    return {
      success: true,
      data: data.evidence
    };
  } catch (error) {
    console.error('发现证物失败:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '发现证物失败'
    };
  }
};
