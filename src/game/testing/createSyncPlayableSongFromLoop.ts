import { renderLoopToAudioBuffer } from "../../audio/toneLoopEngine";
import type { LoopSpec } from "../../types/music";
import { timingConfig } from "../config/timingConfig";
import type { PlayableSong } from "../types/playableSong";
import { createSyncTestChart } from "./createSyncTestChart";
import { shiftRhythmChart } from "./shiftRhythmChart";

type CreateSyncPlayableSongFromLoopOptions = {
  chartOffsetMs?: number;
};

/**
 * 기존 루프를 싱크 테스트 전용 PlayableSong으로 변환한다.
 * 오디오는 그대로 사용하되, 차트는 한 박에 한 노트씩만 내려오는 단순 테스트 차트로 바꾼다.
 */
export const createSyncPlayableSongFromLoop = async (
  songId: string,
  loop: LoopSpec,
  options: CreateSyncPlayableSongFromLoopOptions = {},
): Promise<PlayableSong> => {
  const chartOffsetSeconds = timingConfig.leadInTime + (options.chartOffsetMs ?? 0) / 1000;
  const chart = shiftRhythmChart(createSyncTestChart(songId, loop), chartOffsetSeconds);
  const renderedBuffer = await renderLoopToAudioBuffer(loop);

  if (!renderedBuffer) {
    throw new Error("싱크 테스트용 오디오 버퍼를 렌더링하지 못했습니다.");
  }

  return {
    id: songId,
    title: loop.title,
    chart,
    audio: {
      kind: "buffer",
      loadBuffer: async () => renderedBuffer,
      durationSeconds: renderedBuffer.duration,
    },
    metadata: {
      origin: "generated-loop",
      bpm: loop.bpm,
      offset: chartOffsetSeconds,
    },
  };
};
