import { timeToSeconds } from "../../lib/time";
import type { LoopSpec } from "../../types/music";
import type { RhythmChart, RhythmChartNote, RhythmLane } from "../types/chart";

const syncLanePattern: RhythmLane[] = [1, 2, 1, 2];

/**
 * 싱크 테스트 전용 차트를 만든다.
 * 한 번에 한 노트만 또렷하게 내려오게 해서, 리듬게임 패턴이 아니라 판정 타이밍 보정에만 집중하게 한다.
 */
export const createSyncTestChart = (songId: string, loop: LoopSpec): RhythmChart => {
  const notes: RhythmChartNote[] = [];

  for (let bar = 1; bar <= loop.bars; bar += 1) {
    for (let beat = 1; beat <= 4; beat += 1) {
      const lane = syncLanePattern[(beat - 1) % syncLanePattern.length];

      notes.push({
        id: `sync-${bar}-${beat}`,
        lane,
        time: timeToSeconds({ bar, beat }, loop.bpm),
        type: "tap",
      });
    }
  }

  return {
    songId,
    title: `${loop.title} Sync Test Chart`,
    bpm: loop.bpm,
    offset: 0,
    difficulty: "easy",
    notes,
  };
};
