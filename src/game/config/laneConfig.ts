import type { RhythmLane } from "../types/chart";

// 실제 플레이에 사용하는 레인 순서를 고정해 둔다.
export const rhythmLanes: RhythmLane[] = [0, 1, 2, 3];

/**
 * 플레이필드의 레인 배치 규격을 정의한다.
 * 렌더 계층은 이 값을 읽어 노트와 리셉터의 기본 위치를 계산한다.
 */
export const laneConfig = {
  // 레인 하나가 차지하는 기본 너비다.
  width: 112,
  // 레인 사이의 여백이다.
  gap: 20,
  // 판정선이 화면 아래쪽 어디에 놓일지 결정하는 Y 좌표다.
  judgeLineY: 560,
} as const;
