import { useEffect, useRef } from "react";
import type Phaser from "phaser";
import type { EngineRunner } from "../game/EngineRunner";
import type { GameModeId } from "../game/modes/gameModeConfig";
import type { PlaySessionState } from "../game/types/session";
import { createGame } from "../game/phaser/createGame";

type PhaserGameCanvasProps = {
  runner: EngineRunner | null;
  onStateChange?: (state: PlaySessionState) => void;
  mode?: GameModeId;
};

export const PhaserGameCanvas = ({ runner, onStateChange, mode }: PhaserGameCanvasProps) => {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const gameRef = useRef<Phaser.Game | null>(null);

  useEffect(() => {
    if (!runner || !hostRef.current) {
      return;
    }

    gameRef.current = createGame({
      container: hostRef.current,
      runner,
      onStateChange,
      mode,
    });

    return () => {
      gameRef.current?.destroy(true);
      gameRef.current = null;
    };
  }, [runner, onStateChange, mode]);

  return <div className="phaser-game-host" ref={hostRef} />;
};
