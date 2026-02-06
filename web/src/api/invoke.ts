import { Actor } from "../providers/mysteryContext";
import { API_URL } from "../constants";
import { createSafeActorList, validateSafeActorList } from "../utils/safeActorInfo";

export interface InvokeParams {
  globalStory: string;
  actor: Actor;
  sessionId: string;
  characterFileVersion: string;
  detectiveName?: string;  // 侦探角色名称
  victimName?: string;     // 受害者名称
  allActors?: Record<number, Actor>;  // 所有角色信息
  temperature?: number;    // 温度参数，默认0.7（对话场景），质检等结构化输出建议0.1
}

export interface InvokeResponse {
  original_response: string;
  critique_response: string;
  problems_detected: boolean;
  final_response: string;
  refined_response: string;
}

export default async function invokeAI({
  globalStory,
  actor,
  sessionId,
  characterFileVersion,
  detectiveName,
  victimName,
  allActors,
  temperature,
}: InvokeParams): Promise<InvokeResponse> {
  // 将角色对象转换为安全的数组，移除敏感信息（secret和violation）
  const allActorsArray = allActors ? createSafeActorList(allActors) : [];
  
  // 安全检查（调试模式）
  if (process.env.NODE_ENV === 'development') {
    validateSafeActorList(allActorsArray);
  }
  
  const resp = await fetch(`${API_URL}/invoke/`, {
    method: "POST",
    body: JSON.stringify({
      global_story: globalStory,
      actor,
      session_id: sessionId,
      character_file_version: characterFileVersion,
      detective_name: detectiveName,
      victim_name: victimName,
      all_actors: allActorsArray,
      temperature: temperature,
    }),    
    headers: {
      "Content-Type": "application/json",
    },
  });
  return await resp.json();
}

export interface StreamChunk {
  type: 'chunk' | 'end' | 'error';
  content?: string;
  message?: string;
}

export function invokeAIStream({
  globalStory,
  actor,
  sessionId,
  characterFileVersion,
  detectiveName,
  victimName,
  allActors,
  temperature,
  onChunk,
  onEnd,
  onError,
}: InvokeParams & {
  onChunk: (content: string) => void;
  onEnd: () => void;
  onError: (error: string) => void;
}): () => void {
  const controller = new AbortController();
  
  // 将角色对象转换为安全的数组，移除敏感信息（secret和violation）
  const allActorsArray = allActors ? createSafeActorList(allActors) : [];
  
  // 安全检查（调试模式）
  if (process.env.NODE_ENV === 'development') {
    validateSafeActorList(allActorsArray);
  }
  
  fetch(`${API_URL}/invoke/stream`, {
    method: "POST",
    body: JSON.stringify({
      global_story: globalStory,
      actor,
      session_id: sessionId,
      character_file_version: characterFileVersion,
      detective_name: detectiveName,
      victim_name: victimName,
      all_actors: allActorsArray,
      temperature: temperature,
    }),    
    headers: {
      "Content-Type": "application/json",
    },
    signal: controller.signal,
  })
  .then(async (response) => {
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No response body reader available');
    }
    
    const decoder = new TextDecoder();
    let buffer = '';
    
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // 保留最后一个不完整的行
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data: StreamChunk = JSON.parse(line.slice(6));
              
              if (data.type === 'chunk' && data.content) {
                onChunk(data.content);
              } else if (data.type === 'end') {
                onEnd();
                return;
              } else if (data.type === 'error') {
                onError(data.message || 'Unknown error');
                return;
              }
            } catch (e) {
              console.error('Error parsing SSE data:', e);
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  })
  .catch((error) => {
    if (error.name !== 'AbortError') {
      onError(error.message);
    }
  });
  
  // 返回取消函数
  return () => controller.abort();
}
