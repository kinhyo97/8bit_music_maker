import { getLoopSeconds, timeToSeconds } from "../../lib/time";
import type { LoopSpec } from "../../types/music";
import type { RhythmChart, RhythmChartNote, RhythmLane } from "../types/chart";

const chordLane: RhythmLane = 3;
const supportLane: RhythmLane = 2;

const buildTapNote = (id: string, lane: RhythmLane, time: number): RhythmChartNote => ({
  id,
  lane,
  time,
  type: "tap",
});

/**
 * 테스트 차트에서는 햇을 전부 쓰지 않고, 박자감을 읽기 쉬운 지점만 남긴다.
 * 지금 단계는 엔진 검증이 목적이라 손이 꼬이는 촘촘한 패턴보다 단순한 리듬이 더 유리하다.
 */
const shouldKeepSupportHit = (beat: number) => {
  const normalizedBeat = Number((beat % 4 || 4).toFixed(2));
  return normalizedBeat === 1.5 || normalizedBeat === 3.5;
};

/**
 * 기존 LoopSpec을 기반으로 엔진 테스트용 4레인 차트를 만든다.
 * 지금은 킥/스네어 중심의 쉬운 패턴과 일부 홀드만 사용해 입력 흐름 검증에 집중한다.
 */
export const createDrumTestChart = (songId: string, loop: LoopSpec): RhythmChart => {
  const notes: RhythmChartNote[] = [
    ...loop.drums.kick.map((event, index) => buildTapNote(`kick-${index}`, 0, timeToSeconds(event, loop.bpm))),
    ...loop.drums.snare.map((event, index) => buildTapNote(`snare-${index}`, 1, timeToSeconds(event, loop.bpm))),
    ...loop.drums.hat
      .filter((event) => shouldKeepSupportHit(event.beat))
      .map((event, index) => buildTapNote(`hat-${index}`, supportLane, timeToSeconds(event, loop.bpm))),
  ];

  const secondsPerBeat = 60 / loop.bpm;

  loop.chords.slice(0, loop.bars).forEach((chordText, index) => {
    if (!chordText || index % 2 === 0) {
      return;
    }

    const startTime = timeToSeconds({ bar: index + 1, beat: 1 }, loop.bpm);
    const endTime = Math.min(getLoopSeconds(loop.bars, loop.bpm), startTime + secondsPerBeat * 2);

    notes.push({
      id: `hold-${index}`,
      lane: chordLane,
      time: startTime,
      type: "hold",
      endTime,
    });
  });

  notes.sort((left, right) => left.time - right.time);

  return {
    songId,
    title: `${loop.title} Easy Test Chart`,
    bpm: loop.bpm,
    offset: 0,
    difficulty: "easy",
    notes,
  };
};
