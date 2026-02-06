import React from "react";
import { Actor } from "../providers/mysteryContext";
import { Text } from "@mantine/core";
import SidebarAvatar from "./SidebarAvatar";

interface Props {
  currentActor: number;
  setCurrentActor: (actor: number) => void;
  actors: Actor[];
  postGame: boolean;
}

export default function ActorSidebar({ currentActor, setCurrentActor, actors, postGame }: Props) {
  // 过滤：不展示玩家和受害人；凶手仍展示，但标签在 SidebarAvatar 内隐藏为"嫌疑人"
  const visibleActors = actors.filter(actor => !actor.isPlayer && !actor.isVictim);
  
  // 排序：搭档角色排在最前面，其他角色按原顺序
  const sortedActors = [...visibleActors].sort((a, b) => {
    // 搭档角色优先级最高
    const aIsPartner = a.isPartner || a.isAssistant;
    const bIsPartner = b.isPartner || b.isAssistant;
    
    if (aIsPartner && !bIsPartner) return -1;
    if (!aIsPartner && bIsPartner) return 1;
    
    // 如果都是或都不是搭档，保持原顺序
    return 0;
  });
  
  return (
    <div style={{ padding: '16px' }}>
      <Text 
        className="mystery-title" 
        style={{ 
          marginBottom: '20px',
          fontSize: '18px',
          textAlign: 'center',
          color: '#00C2FF'
        }}
      >
        角色列表
      </Text>
      {sortedActors.map(actor => (
        <SidebarAvatar
          key={actor.id}
          actor={actor}
          currentActor={currentActor}
          setCurrentActor={setCurrentActor}
          postGame={postGame}
        />
      ))}
    </div>
  );
}