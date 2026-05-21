import type { RhythmLane } from "./chart";

/**
 * 입력 시스템이 사용하는 이벤트와 상태 타입을 정의한다.
 * 키 입력을 플랫폼 독립적인 형태로 정규화해 게임엔진 내부에 전달할 때 사용한다.
 */
export type InputAction = "press" | "release";

// 레인 입력의 시작과 끝을 구분하는 액션 타입이다.
export type InputEvent = {
  lane: RhythmLane;
  action: InputAction;
  time: number;
};

// 한 번의 레인 입력 이벤트를 표현하는 구조다.
export type LaneHoldState = Record<RhythmLane, boolean>;

// 각 레인이 현재 눌린 상태인지 보관하는 런타임 상태다.
