import Phaser from "phaser";
import type { EngineRunner } from "../EngineRunner";
import type { GameModeId } from "../modes/gameModeConfig";
import type { PlaySessionState } from "../types/session";
import { PlayScene } from "./scenes/PlayScene";

export type CreateGameArgs = {
  container: HTMLDivElement;
  runner: EngineRunner;
  onStateChange?: (state: PlaySessionState) => void;
  mode?: GameModeId;
};

/**
 * React 호스트 안에 Phaser.Game 인스턴스를 만든다.
 * 게임엔진 자체는 그대로 재사용하고, Phaser는 화면과 입력 담당으로만 붙인다.
 */
export const createGame = ({ container, runner, onStateChange, mode }: CreateGameArgs) =>
  {
    const playScene = new PlayScene();
    playScene.configure({
      runner,
      onStateChange,
      mode,
    });

    return new Phaser.Game({
      type: Phaser.AUTO,
    width: 960,
    height: 640,
    parent: container,
    backgroundColor: "#0b0f14",
    scene: [playScene],
    input: {
      keyboard: true,
    },
    });
  };
