import type { JudgementName } from "./judgement";
import type { RhythmLane } from "./chart";

/**
 * 플레이 도중 렌더 계층과 HUD에 전달할 이벤트 타입을 정의한다.
 * 점수 계산 결과를 화면 피드백으로 바꿀 때 이 구조를 이벤트 큐처럼 사용한다.
 */
export type FeedbackEvent =
  | {
      type: "judgement";
      lane: RhythmLane;
      judgement: JudgementName;
      time: number;
      noteId: string;
    }
  | {
      type: "combo-break";
      time: number;
    };

// 판정 텍스트, 콤보 브레이크 같은 순간 피드백을 전달하는 이벤트 구조다.
