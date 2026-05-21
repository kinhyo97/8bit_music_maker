/**
 * 판정 시스템이 사용하는 결과 타입을 정의한다.
 * 입력 정확도와 허용 오차 범위는 모두 이 파일의 타입을 기준으로 표현한다.
 */
export type JudgementName = "perfect" | "good" | "bad" | "miss";

// 리듬게임에서 사용하는 판정 이름 집합이다.
export type JudgementWindows = {
  perfect: number;
  good: number;
  bad: number;
};

// 각 판정 단계가 허용하는 오차 범위를 밀리초 단위로 표현한다.
export type JudgementResult = {
  name: JudgementName;
  deltaMs: number;
};

// 한 번의 입력 판정 결과를 담는 기본 구조다.
export type HoldJudgementResult = {
  start: JudgementResult;
  release: JudgementResult | null;
};

// 홀드 노트의 시작 판정과 종료 판정을 묶어서 다룰 때 사용하는 구조다.
