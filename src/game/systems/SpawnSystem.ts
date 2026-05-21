import { ChartTimeline } from "../core/chart/ChartTimeline";
import type { PlaySessionState } from "../types/session";

export class SpawnSystem {
  private readonly timeline: ChartTimeline;

  constructor(timeline: ChartTimeline) {
    this.timeline = timeline;
  }

  /**
   * 현재 시점까지 화면에 등장해야 하는 노트를 pending 목록에서 active 목록으로 승격한다.
   * 노트의 생명주기를 queued -> active로 옮기는 첫 진입점이다.
   */
  update(state: PlaySessionState, currentTime: number): PlaySessionState {
    const pendingNotes = [...state.pendingNotes];
    const spawnedNotes = this.timeline.takeSpawnableNotes(currentTime, pendingNotes).map((note) => ({
      ...note,
      state: "active" as const,
    }));

    if (!spawnedNotes.length) {
      return state;
    }

    return {
      ...state,
      pendingNotes,
      activeNotes: [...state.activeNotes, ...spawnedNotes],
    };
  }
}
