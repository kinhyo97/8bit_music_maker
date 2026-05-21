import type { JudgementName } from "./judgement";

/**
 * 점수판과 판정 통계에 필요한 상태 타입을 정의한다.
 * HUD, 결과 화면, 내부 점수 계산기가 모두 이 구조를 공유한다.
 */
export type JudgementCounts = Record<JudgementName, number>;

// 판정 종류별 누적 횟수를 저장하는 맵 구조다.
export type ScoreState = {
  score: number;
  combo: number;
  maxCombo: number;
  accuracy: number;
  totalJudgements: number;
  counts: JudgementCounts;
};

// 플레이 중 누적되는 점수 관련 상태 전체를 묶은 구조다.
