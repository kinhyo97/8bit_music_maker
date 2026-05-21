import type { FeedbackEvent } from "./gameplay";
import type { RuntimeNote } from "./note";
import type { ScoreState } from "./score";

/**
 * 한 판 플레이 세션을 추적하기 위한 상태 타입을 정의한다.
 * 현재 시각, 활성 노트, 점수, 피드백 큐 같은 런타임 전역 상태를 여기서 묶는다.
 */
export type PlayPhase = "idle" | "ready" | "playing" | "paused" | "finished";

// 플레이 세션이 현재 어떤 흐름 단계에 있는지 나타낸다.
export type PlaySessionState = {
  phase: PlayPhase;
  currentTime: number;
  startedAt: number | null;
  activeNotes: RuntimeNote[];
  pendingNotes: RuntimeNote[];
  completedNotes: RuntimeNote[];
  score: ScoreState;
  progress: number;
  feedbackEvents: FeedbackEvent[];
};

// 한 프레임 시점의 플레이 세션 전체 상태 스냅샷이다.
