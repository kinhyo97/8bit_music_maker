import type { RhythmChart } from "../types/chart";

/**
 * 차트 전체 시간을 일정량 이동시킨다.
 * 싱크 테스트에서는 이 함수를 이용해 오디오 대비 노트가 빠른지 느린지 보정한다.
 */
export const shiftRhythmChart = (chart: RhythmChart, offsetSeconds: number): RhythmChart => ({
  ...chart,
  offset: offsetSeconds,
  notes: chart.notes.map((note) => ({
    ...note,
    time: Math.max(0, note.time + offsetSeconds),
    endTime: note.endTime == null ? undefined : Math.max(0, note.endTime + offsetSeconds),
  })),
});
