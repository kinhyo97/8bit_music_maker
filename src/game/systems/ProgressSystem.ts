import type { PlaySessionState } from "../types/session";

export class ProgressSystem {
  private readonly songLengthSeconds: number;

  constructor(songLengthSeconds: number) {
    this.songLengthSeconds = Math.max(songLengthSeconds, 0.0001);
  }

  /**
   * 현재 곡 시각을 0~1 진행률로 정규화한다.
   * HUD 진행바와 종료 판정 기준을 같은 수치로 맞추기 위한 시스템이다.
   */
  update(state: PlaySessionState, currentTime: number): PlaySessionState {
    const progress = Math.min(1, Math.max(0, currentTime / this.songLengthSeconds));

    return {
      ...state,
      currentTime,
      progress,
      phase:
        progress >= 1 && state.pendingNotes.length === 0 && state.activeNotes.length === 0
          ? "finished"
          : state.phase,
    };
  }
}
