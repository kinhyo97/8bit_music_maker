import Phaser from "phaser";
import type { EngineRunner } from "../../EngineRunner";
import { KeyboardInputAdapter } from "../../input/KeyboardInputAdapter";
import { gameModeConfigs, type GameModeConfig, type GameModeId } from "../../modes/gameModeConfig";
import type { RhythmLane } from "../../types/chart";
import type { PlaySessionState } from "../../types/session";
import { HudRenderer } from "../renderers/HudRenderer";
import { NoteRenderer } from "../renderers/NoteRenderer";
import { StageRenderer } from "../renderers/StageRenderer";
import { laneCodes } from "../playSceneLayout";

export type PlaySceneInitData = {
  runner: EngineRunner;
  onStateChange?: (state: PlaySessionState) => void;
  mode?: GameModeId;
};

/**
 * Phaser 씬은 렌더러 조립과 상태 연결만 담당한다.
 * 엔진 구동은 EngineRunner가 맡고, 실제 그리기는 하위 렌더러들로 나눈다.
 */
export class PlayScene extends Phaser.Scene {
  private runner: EngineRunner | null = null;
  private onStateChange?: (state: PlaySessionState) => void;
  private modeConfig: GameModeConfig = gameModeConfigs.default;
  private stageRenderer: StageRenderer | null = null;
  private hudRenderer: HudRenderer | null = null;
  private noteRenderer: NoteRenderer | null = null;
  private laneKeyTexts: Phaser.GameObjects.Text[] = [];
  private keyboardInputAdapter: KeyboardInputAdapter | null = null;
  private unsubscribeRunner: (() => void) | null = null;

  constructor() {
    super("play-scene");
  }

  configure(data: PlaySceneInitData) {
    this.runner = data.runner;
    this.onStateChange = data.onStateChange;
    this.modeConfig = gameModeConfigs[data.mode ?? "default"];
  }

  create() {
    if (!this.runner) {
      throw new Error("PlayScene이 시작되기 전에 EngineRunner가 주입되지 않았습니다.");
    }

    this.cameras.main.setBackgroundColor("#11151b");

    this.stageRenderer = new StageRenderer(this);
    this.hudRenderer = new HudRenderer(this, this.runner.getChart().title ?? "Rhythm Test");
    this.noteRenderer = new NoteRenderer(this);

    this.createLaneKeyTexts();
    this.bindInput();
    this.stageRenderer.drawStaticStage();
    this.unsubscribeRunner = this.runner.subscribe((state) => {
      this.renderState(state);
      this.pushState(state);
    });

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.keyboardInputAdapter?.destroy();
      this.keyboardInputAdapter = null;
      this.unsubscribeRunner?.();
      this.unsubscribeRunner = null;
    });
  }

  private createLaneKeyTexts() {
    if (!this.stageRenderer) {
      return;
    }

    laneCodes.forEach(({ lane, label }) => {
      const point = this.stageRenderer?.getLaneLabelPoint(lane);

      if (!point) {
        return;
      }

      const keyText = this.add.text(point.x, point.y, label, {
        color: "#cdefff",
        fontFamily: "Arial",
        fontSize: "20px",
        fontStyle: "bold",
      });

      keyText.setOrigin(0.5, 0.5);
      this.laneKeyTexts.push(keyText);
    });
  }

  private bindInput() {
    const keyboard = this.input.keyboard;

    if (!keyboard || !this.runner) {
      return;
    }

    this.keyboardInputAdapter = new KeyboardInputAdapter({
      keyboard,
      runner: this.runner,
      laneBindings: laneCodes.map(({ lane, code }) => ({ lane, code })),
      onLaneFlash: (lane, active) => this.flashKey(lane, active),
    });
    this.keyboardInputAdapter.bind();
  }

  private renderState(state: PlaySessionState) {
    this.noteRenderer?.renderState({
      state,
      modeConfig: this.modeConfig,
      chart: this.runner?.getChart(),
    });
    this.hudRenderer?.renderState(state);
    this.stageRenderer?.renderLifeGauge(state.score.accuracy);
  }

  private pushState(state: PlaySessionState) {
    this.onStateChange?.({ ...state });
  }

  private flashKey(lane: RhythmLane, active: boolean) {
    const keyText = this.laneKeyTexts[lane];

    if (!keyText) {
      return;
    }

    keyText.setColor(active ? "#ffffff" : "#cdefff");
    keyText.setScale(active ? 1.16 : 1);
  }
}
