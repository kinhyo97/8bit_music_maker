import { timingConfig } from "../config/timingConfig";
import { JudgementEngine } from "../core/judgement/JudgementEngine";
import { ScoreTracker } from "../core/scoring/ScoreTracker";
import type { InputEvent, LaneHoldState } from "../types/input";
import type { PlaySessionState } from "../types/session";

export class HoldSystem {
  private readonly judgementEngine: JudgementEngine;
  private readonly scoreTracker: ScoreTracker;
  private readonly releaseGraceSeconds: number;

  constructor(
    judgementEngine = new JudgementEngine(),
    scoreTracker = new ScoreTracker(),
    releaseGraceMs = timingConfig.releaseGraceMs,
  ) {
    this.judgementEngine = judgementEngine;
    this.scoreTracker = scoreTracker;
    this.releaseGraceSeconds = releaseGraceMs / 1000;
  }

  /**
   * release 이벤트와 현재 hold 상태를 기준으로 홀드 노트의 종료를 처리한다.
   * 너무 이르게 손을 떼면 miss로 끊고, 종료 시점에 맞게 떼면 판정을 추가 반영한다.
   */
  update(state: PlaySessionState, events: InputEvent[], laneHoldState: LaneHoldState, currentTime: number): PlaySessionState {
    let nextState = state;

    for (const note of nextState.activeNotes) {
      if (note.type !== "hold" || note.state !== "holding" || note.endTime == null) {
        continue;
      }

      const releaseEvent = events.find((event) => event.action === "release" && event.lane === note.lane);
      const isEarlyReleased =
        !laneHoldState[note.lane] && currentTime < note.endTime - this.releaseGraceSeconds;

      if (isEarlyReleased) {
        const score = this.scoreTracker.applyJudgement(nextState.score, "miss");

        nextState = {
          ...nextState,
          activeNotes: nextState.activeNotes.filter((activeNote) => activeNote.id !== note.id),
          completedNotes: [...nextState.completedNotes, { ...note, state: "missed", releasedAt: currentTime }],
          score,
          feedbackEvents: [
            ...nextState.feedbackEvents,
            {
              type: "judgement",
              lane: note.lane,
              judgement: "miss",
              time: currentTime,
              noteId: note.id,
            },
            { type: "combo-break", time: currentTime },
          ],
        };
        continue;
      }

      if (releaseEvent && releaseEvent.time >= note.endTime - this.releaseGraceSeconds) {
        const releaseJudgement = this.judgementEngine.judgeHoldRelease(note, releaseEvent.time);
        const score = this.scoreTracker.applyJudgement(nextState.score, releaseJudgement.name);

        nextState = {
          ...nextState,
          activeNotes: nextState.activeNotes.filter((activeNote) => activeNote.id !== note.id),
          completedNotes: [
            ...nextState.completedNotes,
            { ...note, state: "completed", releasedAt: releaseEvent.time },
          ],
          score,
          feedbackEvents: [
            ...nextState.feedbackEvents,
            {
              type: "judgement",
              lane: note.lane,
              judgement: releaseJudgement.name,
              time: releaseEvent.time,
              noteId: note.id,
            },
          ],
        };
      }
    }

    return nextState;
  }
}
