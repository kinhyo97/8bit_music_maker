import { JudgementEngine } from "../core/judgement/JudgementEngine";
import { ScoreTracker } from "../core/scoring/ScoreTracker";
import type { InputEvent } from "../types/input";
import type { PlaySessionState } from "../types/session";
import { findFirstJudgeableNote } from "../utils/noteSelectors";

export class JudgementSystem {
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
   * 입력 버퍼의 press 이벤트를 읽어 가장 가까운 활성 노트와 매칭한다.
   * 여기서는 탭 노트와 홀드 시작 판정만 처리하고, 홀드 종료는 별도 시스템에서 맡는다.
   */
  update(state: PlaySessionState, events: InputEvent[]): PlaySessionState {
    let nextState = state;

    for (const event of events) {
      if (event.action !== "press") {
        continue;
      }

      const targetNote = findFirstJudgeableNote(nextState.activeNotes, event.lane);

      if (!targetNote || targetNote.state !== "active") {
        continue;
      }

      const judgement = this.judgementEngine.judgeHit(targetNote, event.time);

      if (judgement.name === "miss") {
        continue;
      }

      const nextActiveNotes = nextState.activeNotes.map((note) => {
        if (note.id !== targetNote.id) {
          return note;
        }

        return {
          ...note,
          state: note.type === "hold" ? ("holding" as const) : ("hit" as const),
          judgedAt: event.time,
        };
      });

      const updatedScore = this.scoreTracker.applyJudgement(nextState.score, judgement.name);
      const completedNotes =
        targetNote.type === "hold"
          ? nextState.completedNotes
          : [
              ...nextState.completedNotes,
              {
                ...targetNote,
                state: "completed" as const,
                judgedAt: event.time,
              },
            ];

      nextState = {
        ...nextState,
        activeNotes:
          targetNote.type === "hold"
            ? nextActiveNotes
            : nextActiveNotes.filter((note) => note.id !== targetNote.id),
        completedNotes,
        score: updatedScore,
        feedbackEvents: [
          ...nextState.feedbackEvents,
          {
            type: "judgement",
            lane: targetNote.lane,
            judgement: judgement.name,
            time: event.time,
            noteId: targetNote.id,
          },
        ],
      };
    }

    return nextState;
  }
}
