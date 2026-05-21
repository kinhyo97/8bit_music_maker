import type { RhythmChartNote, RhythmLane, RhythmNoteType } from "./chart";

/**
 * 정적 차트 노트를 실제 플레이 중에 다루기 위한 런타임 타입을 정의한다.
 * 상태 전이, 스폰 시점, 판정 시각처럼 플레이 도중 생기는 정보는 여기서 관리한다.
 */
export type RuntimeNoteState = "queued" | "active" | "hit" | "holding" | "completed" | "missed";

// 노트가 현재 어떤 생명주기 단계에 있는지 나타낸다.
export type RuntimeNote = {
  id: string;
  lane: RhythmLane;
  time: number;
  type: RhythmNoteType;
  endTime?: number;
  spawnTime: number;
  state: RuntimeNoteState;
  judgedAt?: number;
  releasedAt?: number;
};

// 게임 루프 안에서 실제로 이동하고 판정되는 노트 객체 정의다.
export type RuntimeNoteMap = Map<string, RuntimeNote>;

// 노트 id 기준으로 런타임 노트를 빠르게 조회할 때 사용하는 맵 타입이다.

/**
 * 차트 노트를 실제 플레이 런타임 노트로 바꾼다.
 * 이 단계에서 스폰 시점과 현재 상태를 함께 주입해 이후 시스템이 같은 형태로 다루게 만든다.
 */
export const createRuntimeNote = (note: RhythmChartNote, spawnTime: number): RuntimeNote => ({
  id: note.id,
  lane: note.lane,
  time: note.time,
  type: note.type,
  endTime: note.endTime,
  spawnTime,
  state: "queued",
});
