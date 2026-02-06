import React from "react";
import { Actor } from "../providers/mysteryContext";
import { Image } from "@mantine/core";
import { resolveAvatarSrc } from "../utils/avatarUtils";

interface Props {
  actor: Actor;
}

export default function ActorImage({ actor }: Props) {
  return (
    <Image
      src={resolveAvatarSrc(actor.image)}
      style={{
        width: 50,
        height: 50,
        borderRadius: 50,
        objectFit: 'cover'
      } as React.CSSProperties}
    />
  );
}
