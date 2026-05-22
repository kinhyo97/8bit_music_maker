import type { PlayEngine } from "./PlayEngine";
import type { RhythmLane } from "./types/chart";
import type { PlaySessionState } from "./types/session";

type StateListener = (state: PlaySessionState) => void;

/**
 * 엔진 프레임 진행과 상태 배포를 담당하는 얇은 실행 계층이다.
 * 렌더러는 이 러너를 통해 엔진을 구동하고, 최신 상태만 구독해서 소비한다.
 */
export class EngineRunner {
  private readonly engine: PlayEngine;
  private readonly listeners = new Set<StateListener>();
  private animationFrameId: number | null = null;

  constructor(engine: PlayEngine) {
    this.engine = engine;
  }

  private emit(state: PlaySessionState) {
    this.listeners.forEach((listener) => listener({ ...state }));
  }

  private stopFrameLoop() {
    if (this.animationFrameId == null) {
      return;
    }

    window.cancelAnimationFrame(this.animationFrameId);
    this.animationFrameId = null;
  }

  private tick = () => {
    const nextState = this.engine.update();
    this.emit(nextState);

    if (nextState.phase !== "playing") {
      this.animationFrameId = null;
      return;
    }

    this.animationFrameId = window.requestAnimationFrame(this.tick);
  };

  private ensureFrameLoop() {
    if (this.animationFrameId != null) {
      return;
    }

    this.animationFrameId = window.requestAnimationFrame(this.tick);
  }

  subscribe(listener: StateListener) {
    this.listeners.add(listener);
    listener(this.engine.getState());

    return () => {
      this.listeners.delete(listener);
    };
  }

  async start() {
    const nextState = await this.engine.start();
    this.emit(nextState);
    this.ensureFrameLoop();
    return nextState;
  }

  pause() {
    const nextState = this.engine.pause();
    this.stopFrameLoop();
    this.emit(nextState);
    return nextState;
  }

  async resume() {
    const nextState = await this.engine.resume();
    this.emit(nextState);
    this.ensureFrameLoop();
    return nextState;
  }

  stop() {
    const nextState = this.engine.stop();
    this.stopFrameLoop();
    this.emit(nextState);
    return nextState;
  }

  pressLane(lane: RhythmLane) {
    this.engine.pressLane(lane);
  }

  releaseLane(lane: RhythmLane) {
    this.engine.releaseLane(lane);
  }

  getState() {
    return this.engine.getState();
  }

  getChart() {
    return this.engine.getChart();
  }
}
