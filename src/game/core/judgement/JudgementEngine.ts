import type { JudgementResult, JudgementWindows } from "../../types/judgement";
import type { RuntimeNote } from "../../types/note";
import { judgementConfig } from "../../config/judgementConfig";

export class JudgementEngine {
  private readonly windows: JudgementWindows;

  constructor(windows: JudgementWindows = judgementConfig) {
    this.windows = windows;
  }

  /**
   * 탭 또는 홀드 시작 입력을 판정한다.
   * 입력 시간과 목표 시간의 차이를 밀리초로 계산해서 결과를 돌려준다.
   */
  judgeHit(note: RuntimeNote, inputTime: number): JudgementResult {
    const deltaMs = Math.round((inputTime - note.time) * 1000);
    const absDeltaMs = Math.abs(deltaMs);

    if (absDeltaMs <= this.windows.perfect) {
      return { name: "perfect", deltaMs };
    }

    if (absDeltaMs <= this.windows.good) {
      return { name: "good", deltaMs };
    }

    if (absDeltaMs <= this.windows.bad) {
      return { name: "bad", deltaMs };
    }

    return { name: "miss", deltaMs };
  }

  /**
   * 현재 시점이 miss 윈도우를 완전히 벗어났는지 판단한다.
   * 입력이 없는 상태에서 지나간 노트를 정리할 때 사용한다.
   */
  isMissed(note: RuntimeNote, currentTime: number) {
    const lateMs = (currentTime - note.time) * 1000;
    return lateMs > this.windows.bad;
  }

  /**
   * 홀드 종료 입력을 판정한다.
   * 종료 시점도 일반 판정 윈도우를 그대로 사용해 일관성을 유지한다.
   */
  judgeHoldRelease(note: RuntimeNote, releaseTime: number): JudgementResult {
    const targetTime = note.endTime ?? note.time;
    const deltaMs = Math.round((releaseTime - targetTime) * 1000);
    const absDeltaMs = Math.abs(deltaMs);

    if (absDeltaMs <= this.windows.perfect) {
      return { name: "perfect", deltaMs };
    }

    if (absDeltaMs <= this.windows.good) {
      return { name: "good", deltaMs };
    }

    if (absDeltaMs <= this.windows.bad) {
      return { name: "bad", deltaMs };
    }

    return { name: "miss", deltaMs };
  }
}
