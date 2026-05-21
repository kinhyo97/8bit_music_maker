import { ChartTimeline } from "./core/chart/ChartTimeline";
import { ChartValidator } from "./core/chart/ChartValidator";
import { getChartEndTime } from "./core/chart/getChartEndTime";
import { FeedbackSystem } from "./systems/FeedbackSystem";
import { HoldSystem } from "./systems/HoldSystem";
import { InputSystem } from "./systems/InputSystem";
import { JudgementSystem } from "./systems/JudgementSystem";
import { MissSystem } from "./systems/MissSystem";
import { ProgressSystem } from "./systems/ProgressSystem";
import { SpawnSystem } from "./systems/SpawnSystem";
import { createPlaySession } from "./state/PlaySession";
import { RuntimeStore } from "./state/RuntimeStore";
import type { SongAudio } from "./audio/SongAudio";
import type { RhythmChart, RhythmLane } from "./types/chart";
import type { PlaySessionState } from "./types/session";

export class PlayEngine {
  private readonly chart: RhythmChart;
  private readonly songAudio: SongAudio;
  private readonly store: RuntimeStore;
  private readonly inputSystem: InputSystem;
  private readonly spawnSystem: SpawnSystem;
  private readonly judgementSystem: JudgementSystem;
  private readonly holdSystem: HoldSystem;
  private readonly missSystem: MissSystem;
  private readonly progressSystem: ProgressSystem;
  private readonly feedbackSystem: FeedbackSystem;

  constructor(chart: RhythmChart, songAudio: SongAudio) {
    const validator = new ChartValidator();
    const validationResult = validator.validate(chart);

    if (!validationResult.valid) {
      throw new Error(
        `유효하지 않은 RhythmChart 입니다: ${validationResult.issues.map((issue) => issue.message).join(" / ")}`,
      );
    }

    const timeline = new ChartTimeline(chart);
    const session = createPlaySession(chart);
    const songLengthSeconds = Math.max(songAudio.getDuration(), getChartEndTime(chart));

    this.chart = chart;
    this.songAudio = songAudio;
    this.store = new RuntimeStore(session);
    this.inputSystem = new InputSystem();
    this.spawnSystem = new SpawnSystem(timeline);
    this.judgementSystem = new JudgementSystem();
    this.holdSystem = new HoldSystem();
    this.missSystem = new MissSystem();
    this.progressSystem = new ProgressSystem(songLengthSeconds);
    this.feedbackSystem = new FeedbackSystem();
  }

  /**
   * 플레이 세션을 시작한다.
   * 실제 오디오 출발과 세션 phase 전환을 한 묶음으로 처리해 상태 기준점을 맞춘다.
   */
  async start() {
    await this.songAudio.start();

    this.store.update((state) => ({
      ...state,
      phase: "playing",
      startedAt: Date.now() / 1000,
    }));

    return this.store.getState();
  }

  /**
   * 현재 플레이 세션을 일시정지한다.
   */
  pause() {
    this.songAudio.pause();

    return this.store.update((state) => ({
      ...state,
      phase: "paused",
    }));
  }

  /**
   * 일시정지된 세션을 다시 진행 상태로 돌린다.
   */
  async resume() {
    await this.songAudio.resume();

    return this.store.update((state) => ({
      ...state,
      phase: "playing",
    }));
  }

  /**
   * 세션을 종료하고 오디오를 정지한다.
   * 결과 화면 이동이나 강제 중단 흐름에서 사용한다.
   */
  stop() {
    this.songAudio.stop();

    return this.store.update((state) => ({
      ...state,
      phase: "finished",
    }));
  }

  /**
   * 외부 입력 계층이 레인 press를 엔진에 전달하는 진입점이다.
   */
  pressLane(lane: RhythmLane) {
    this.inputSystem.press(lane, this.songAudio.getCurrentTime());
  }

  /**
   * 외부 입력 계층이 레인 release를 엔진에 전달하는 진입점이다.
   */
  releaseLane(lane: RhythmLane) {
    this.inputSystem.release(lane, this.songAudio.getCurrentTime());
  }

  /**
   * 한 프레임 분량의 게임 로직을 진행한다.
   * Phaser update, requestAnimationFrame, 테스트 루프 어디에서든 이 메서드만 호출하면 된다.
   */
  update() {
    const state = this.store.getState();

    if (state.phase !== "playing") {
      return state;
    }

    const currentTime = this.songAudio.getCurrentTime();
    const inputEvents = this.inputSystem.consumeEvents();
    const laneHoldState = this.inputSystem.getLaneHoldState();

    let nextState = state;
    nextState = this.spawnSystem.update(nextState, currentTime);
    nextState = this.judgementSystem.update(nextState, inputEvents);
    nextState = this.holdSystem.update(nextState, inputEvents, laneHoldState, currentTime);
    nextState = this.missSystem.update(nextState, currentTime);
    nextState = this.progressSystem.update(nextState, currentTime);
    nextState = this.feedbackSystem.prune(nextState, currentTime);

    if (nextState.phase === "finished") {
      this.songAudio.stop();
    }

    this.store.setState(nextState);
    return nextState;
  }

  /**
   * 현재 플레이 세션 상태를 읽는다.
   * 렌더러와 HUD는 이 상태를 기준으로 화면을 갱신하면 된다.
   */
  getState(): PlaySessionState {
    return this.store.getState();
  }

  /**
   * 현재 엔진이 어떤 차트를 구동 중인지 조회한다.
   * 결과 화면이나 디버그 UI에서 메타데이터를 재사용할 때 사용한다.
   */
  getChart() {
    return this.chart;
  }
}
