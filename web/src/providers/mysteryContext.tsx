import constate from "constate";
import { useState } from "react";
import Story from "../characters.json";

export interface LLMMessage {
  role: "user" | "assistant";
  content: string;
}

export interface Actor {
  id: number;
  name: string;
  bio: string;
  personality: string;
  context: string;
  secret: string;
  violation: string;
  image: string;
  backgroundImage?: string; // 聊天背景图片路径
  messages: LLMMessage[];
  isDetective?: boolean;
  isKiller?: boolean;
  isVictim?: boolean;
  isAssistant?: boolean; // 是否为助手（必须有一个）
  isPlayer?: boolean; // 是否为玩家角色
  isPartner?: boolean; // 是否为搭档角色
  roleType?: '玩家' | '搭档' | '凶手' | '嫌疑人' | '受害人'; // 角色类型标签
}

const INITIAL_CHARACTERS = Story.characters.map(
  ({ name, bio, personality, context, secret, violation, image }, i) => ({
    id: i,
    name,
    bio,
    personality,
    context,
    secret,
    violation,
    image,
    messages: [],
    isDetective: false,
    isKiller: false,
    isVictim: false,
    isAssistant: false
  }),
);

export let INITIAL_CHARACTERS_BY_ID: { [id: number]: Actor } = {};

INITIAL_CHARACTERS.forEach((c) => {
  INITIAL_CHARACTERS_BY_ID[c.id] = c;
});

export const [MysteryProvider, useMysteryContext] = constate(() => {
  const [globalStory, setGlobalStory] = useState(Story.globalStory);
  const [actors, setActors] = useState<{ [id: number]: Actor }>(
    INITIAL_CHARACTERS_BY_ID,
  );

  return {
    globalStory,
    setGlobalStory,
    actors,
    setActors,
  };
});
