import type { RhythmChart } from "../../types/chart";

/**
 * 차트가 실제로 끝나는 시점을 계산한다.
 * 홀드 노트는 종료 시간을 우선 사용해 곡 진행률과 종료 판정을 더 정확하게 맞춘다.
 */
export const getChartEndTime = (chart: RhythmChart) =>
  chart.notes.reduce((latestTime, note) => {
    const noteEndTime = note.type === "hold" && note.endTime != null ? note.endTime : note.time;
    return Math.max(latestTime, noteEndTime);
  }, 0);
