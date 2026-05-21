import { JudgementEngine } from "../core/judgement/JudgementEngine";
import { ScoreTracker } from "../core/scoring/ScoreTracker";
import type { PlaySessionState } from "../types/session";

export class MissSystem {
  private readonly judgementEngine: JudgementEngine;
  private readonly scoreTracker: ScoreTracker;

  constructor(
    judgementEngine = new JudgementEngine(),
    scoreTracker = new ScoreTracker(),
  ) {
    this.judgementEngine = judgementEngine;
    this.scoreTracker = scoreTracker;
  }

  /**
   * 입력 없이 지나간 노트를 miss 처리한다.
   * tap 노트와 아직 시작도 못 한 홀드 노트가 대상이며, 이미 holding 상태인 노트는 제외한다.
   */
  update(state: PlaySessionState, currentTime: number): PlaySessionState {
    const missedNotes = state.activeNotes.filter(
      (note) => note.state === "active" && this.judgementEngine.isMissed(note, currentTime),
    );

    if (!missedNotes.length) {
      return state;
    }

    let score = state.score;

    for (const _note of missedNotes) {
      score = this.scoreTracker.applyJudgement(score, "miss");
    }

    const missedIds = new Set(missedNotes.map((note) => note.id));

    return {
      ...state,
      activeNotes: state.activeNotes.filter((note) => !missedIds.has(note.id)),
      completedNotes: [
        ...state.completedNotes,
        ...missedNotes.map((note) => ({ ...note, state: "missed" as const })),
      ],
      score,
      feedbackEvents: [
        ...state.feedbackEvents,
        ...missedNotes.flatMap((note) => [
          {
            type: "judgement" as const,
            lane: note.lane,
            judgement: "miss" as const,
            time: currentTime,
            noteId: note.id,
          },
          {
            type: "combo-break" as const,
            time: currentTime,
          },
        ]),
      ],
    };
  }
}
