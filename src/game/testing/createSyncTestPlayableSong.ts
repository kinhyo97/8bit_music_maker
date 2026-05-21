import { timingConfig } from "../config/timingConfig";
import type { PlayableSong } from "../types/playableSong";
import type { RhythmChart, RhythmChartNote, RhythmLane } from "../types/chart";
import { shiftRhythmChart } from "./shiftRhythmChart";

type CreateSyncTestPlayableSongOptions = {
  bpm?: number;
  bars?: number;
  chartOffsetMs?: number;
};

const syncLane: RhythmLane = 1;
const countInBeats = 4;

/**
 * 메트로놈처럼 들리는 짧은 클릭 버퍼를 만든다.
 * 첫 박은 더 강한 소리로, 나머지 박은 조금 가벼운 소리로 만들어 박자 구분이 잘 되게 한다.
 */
const createClickBuffer = async (bpm: number, bars: number, leadInTimeSeconds: number) => {
  const beatsPerBar = 4;
  const totalBeats = bars * beatsPerBar + countInBeats;
  const secondsPerBeat = 60 / bpm;
  const durationSeconds = leadInTimeSeconds + totalBeats * secondsPerBeat + 1;
  const sampleRate = 44100;
  const offlineContext = new OfflineAudioContext(1, Math.ceil(durationSeconds * sampleRate), sampleRate);

  for (let beatIndex = 0; beatIndex < totalBeats; beatIndex += 1) {
    const clickTime = leadInTimeSeconds + beatIndex * secondsPerBeat;
    const isAccent = beatIndex % beatsPerBar === 0;
    const oscillator = offlineContext.createOscillator();
    const gain = offlineContext.createGain();

    oscillator.type = isAccent ? "triangle" : "square";
    oscillator.frequency.setValueAtTime(isAccent ? 190 : 140, clickTime);

    gain.gain.setValueAtTime(0.0001, clickTime);
    gain.gain.exponentialRampToValueAtTime(isAccent ? 0.32 : 0.2, clickTime + 0.002);
    gain.gain.exponentialRampToValueAtTime(0.0001, clickTime + (isAccent ? 0.11 : 0.075));

    oscillator.connect(gain);
    gain.connect(offlineContext.destination);
    oscillator.start(clickTime);
    oscillator.stop(clickTime + (isAccent ? 0.12 : 0.08));
  }

  return offlineContext.startRendering();
};

/**
 * 싱크 테스트용으로 한 박에 하나씩 떨어지는 단순 차트를 만든다.
 * 복잡한 패턴 없이 입력 타이밍만 확인할 수 있게 한 레인에서만 반복해서 떨어지게 한다.
 */
const createSyncTestChart = (songId: string, bpm: number, bars: number) => {
  const beatsPerBar = 4;
  const secondsPerBeat = 60 / bpm;
  const notes: RhythmChartNote[] = [];
  const noteStartOffsetSeconds = countInBeats * secondsPerBeat;

  for (let bar = 0; bar < bars; bar += 1) {
    for (let beat = 0; beat < beatsPerBar; beat += 1) {
      const beatIndex = bar * beatsPerBar + beat;

      notes.push({
        id: `sync-${bar + 1}-${beat + 1}`,
        lane: syncLane,
        time: noteStartOffsetSeconds + beatIndex * secondsPerBeat,
        type: "tap",
      });
    }
  }

  const chart: RhythmChart = {
    songId,
    title: "Metronome Sync Test",
    bpm,
    offset: 0,
    difficulty: "easy",
    notes,
  };

  return chart;
};

/**
 * 노래 대신 드럼 클릭만 재생하는 싱크 테스트용 PlayableSong을 만든다.
 * 일반 플레이 테스트와 분리해서, 판정 오프셋만 집중적으로 맞추기 위한 전용 입력 모델이다.
 * 시작 직후 입력 준비 지연이 섞이지 않게 클릭 4박 카운트인을 먼저 들려준 뒤 노트를 시작한다.
 */
export const createSyncTestPlayableSong = async (
  options: CreateSyncTestPlayableSongOptions = {},
): Promise<PlayableSong> => {
  const bpm = options.bpm ?? 84;
  const bars = options.bars ?? 16;
  const chartOffsetSeconds = timingConfig.leadInTime + (options.chartOffsetMs ?? 0) / 1000;
  const baseChart = createSyncTestChart("sync-test", bpm, bars);
  const chart = shiftRhythmChart(baseChart, chartOffsetSeconds);
  const renderedBuffer = await createClickBuffer(bpm, bars, timingConfig.leadInTime);

  return {
    id: "sync-test",
    title: "Metronome Sync Test",
    chart,
    audio: {
      kind: "buffer",
      loadBuffer: async () => renderedBuffer,
      durationSeconds: renderedBuffer.duration,
    },
    metadata: {
      origin: "manual-test",
      bpm,
      offset: chartOffsetSeconds,
    },
  };
};
