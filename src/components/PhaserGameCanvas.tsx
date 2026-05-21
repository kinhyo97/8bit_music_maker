import { useEffect, useRef } from "react";
import type Phaser from "phaser";
import type { PlayEngine } from "../game";
import type { PlaySessionState } from "../game/types/session";
import { createGame } from "../game/phaser/createGame";

type PhaserGameCanvasProps = {
  engine: PlayEngine | null;
  onStateChange?: (state: PlaySessionState) => void;
  mode?: "default" | "sync-test";
};

export const PhaserGameCanvas = ({ engine, onStateChange, mode }: PhaserGameCanvasProps) => {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const gameRef = useRef<Phaser.Game | null>(null);

  useEffect(() => {
    if (!engine || !hostRef.current) {
      return;
    }

    gameRef.current = createGame({
      container: hostRef.current,
      engine,
      onStateChange,
      mode,
    });

    return () => {
      gameRef.current?.destroy(true);
      gameRef.current = null;
    };
  }, [engine, onStateChange, mode]);

  return <div className="phaser-game-host" ref={hostRef} />;
};
