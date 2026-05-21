import type { JudgementWindows } from "../types/judgement";

/**
 * 판정 이름별 허용 오차 범위를 밀리초 단위로 정의한다.
 * 값이 작을수록 더 엄격한 리듬게임이 된다.
 */
export const judgementConfig: JudgementWindows = {
  // 가장 정확한 입력으로 인정하는 범위다.
  perfect: 35,
  // 약간 늦거나 빨라도 성공으로 인정하는 범위다.
  good: 70,
  // 최소 성공 범위이며, 이를 넘기면 miss 처리된다.
  bad: 110,
};
