import React from "react";
import { Actor } from "../providers/mysteryContext";
import { Group, Text, Image } from "@mantine/core";
import { resolveAvatarSrc } from "../utils/avatarUtils";
import { getSidebarRoleInfo } from "../utils/roleUtils";

interface Props {
  actor: Actor;
  currentActor: number;
  setCurrentActor: (actor: number) => void;
  postGame: boolean;
}

export default function SidebarAvatar({
  actor,
  currentActor,
  setCurrentActor,
  postGame,
}: Props) {
  const active = actor.id === currentActor;
  const roleInfo = getSidebarRoleInfo(actor);
  
  return (
    <Group
      className={`character-card ${active ? 'active' : ''}`}
      onClick={() => {
        if (!postGame) {
          setCurrentActor(actor.id);
        }
      }}
      style={{
        cursor: postGame ? "not-allowed" : "pointer",
        padding: '12px',
        marginBottom: '8px',
        borderRadius: '8px',
        transition: 'all 0.3s ease',
        background: active 
          ? `linear-gradient(135deg, ${roleInfo.color}33 0%, ${roleInfo.color}1A 100%)`
          : `linear-gradient(135deg, ${roleInfo.color}0D 0%, #1E1E1E 100%)`,
        border: active 
          ? `1px solid ${roleInfo.color}`
          : `1px solid ${roleInfo.color}4D`,
        boxShadow: active 
          ? `0 0 15px ${roleInfo.color}66`
          : `0 2px 8px ${roleInfo.color}33`
      }}
    >
      <Image
        src={resolveAvatarSrc(actor.image)}
        style={{
          width: 50,
          height: 50,
          borderRadius: 50,
          objectFit: 'cover'
        } as React.CSSProperties}
      />
      <div style={{ flex: 1 }}>
        <Text 
          style={{
            color: active ? roleInfo.color : `${roleInfo.color}CC`,
            fontWeight: active ? '600' : '400',
            fontSize: '14px'
          }}
        >
          {actor.name}
        </Text>
        <Text 
          size="xs" 
          style={{
            color: roleInfo.color,
            fontWeight: '500',
            marginTop: '2px'
          }}
        >
          {roleInfo.label}
        </Text>
      </div>
    </Group>
  );
}
