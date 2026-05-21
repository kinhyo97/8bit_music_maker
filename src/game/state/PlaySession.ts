import type { RhythmChart } from "../types/chart";
import type { PlaySessionState } from "../types/session";
import { ChartTimeline } from "../core/chart/ChartTimeline";
import { ScoreTracker } from "../core/scoring/ScoreTracker";

/**
 * 차트 1개를 기준으로 새로운 플레이 세션 상태를 만든다.
 * 이후 시스템은 이 초기 상태를 받아 pending -> active -> completed 흐름으로만 노트를 이동시킨다.
 */
export const createPlaySession = (chart: RhythmChart): PlaySessionState => {
  const timeline = new ChartTimeline(chart);
  const scoreTracker = new ScoreTracker();

  return {
    phase: "ready",
    currentTime: 0,
    startedAt: null,
    activeNotes: [],
    pendingNotes: [...timeline.notes],
    completedNotes: [],
    score: scoreTracker.createInitialState(),
    progress: 0,
    feedbackEvents: [],
  };
};
