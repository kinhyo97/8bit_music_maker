import type Phaser from "phaser";
import type { EngineRunner } from "../EngineRunner";
import type { RhythmLane } from "../types/chart";

type LaneKeyBinding = {
  lane: RhythmLane;
  code: string;
};

/**
 * Phaser 키보드 이벤트를 엔진 러너 명령으로 번역하는 입력 어댑터다.
 */
export class KeyboardInputAdapter {
  private readonly keyboard: Phaser.Input.Keyboard.KeyboardPlugin;
  private readonly runner: EngineRunner;
  private readonly laneBindings: LaneKeyBinding[];
  private readonly onLaneFlash?: (lane: RhythmLane, active: boolean) => void;
  private readonly removeListeners: Array<() => void> = [];

  constructor(args: {
    keyboard: Phaser.Input.Keyboard.KeyboardPlugin;
    runner: EngineRunner;
    laneBindings: LaneKeyBinding[];
    onLaneFlash?: (lane: RhythmLane, active: boolean) => void;
  }) {
    this.keyboard = args.keyboard;
    this.runner = args.runner;
    this.laneBindings = args.laneBindings;
    this.onLaneFlash = args.onLaneFlash;
  }

  bind() {
    const handleStart = () => {
      void this.runner.start();
    };

    this.keyboard.on("keydown-ENTER", handleStart);
    this.removeListeners.push(() => this.keyboard.off("keydown-ENTER", handleStart));

    this.laneBindings.forEach(({ lane, code }) => {
      const handlePress = () => {
        this.runner.pressLane(lane);
        this.onLaneFlash?.(lane, true);
      };
      const handleRelease = () => {
        this.runner.releaseLane(lane);
        this.onLaneFlash?.(lane, false);
      };

      this.keyboard.on(`keydown-${code}`, handlePress);
      this.keyboard.on(`keyup-${code}`, handleRelease);
      this.removeListeners.push(() => this.keyboard.off(`keydown-${code}`, handlePress));
      this.removeListeners.push(() => this.keyboard.off(`keyup-${code}`, handleRelease));
    });
  }

  destroy() {
    this.removeListeners.splice(0).forEach((removeListener) => removeListener());
  }
}
