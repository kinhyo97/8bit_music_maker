import { renderLoopToAudioBuffer } from "../../audio/toneLoopEngine";
import { prependAudioBufferSilence } from "../audio/prependAudioBufferSilence";
import type { LoopSpec } from "../../types/music";
import { timingConfig } from "../config/timingConfig";
import type { PlayableSong } from "../types/playableSong";
import { createDrumTestChart } from "./createDrumTestChart";
import { shiftRhythmChart } from "./shiftRhythmChart";

type CreatePlayableSongFromLoopOptions = {
  chartOffsetMs?: number;
};

/**
 * 기존 작곡기 루프를 게임 테스트용 PlayableSong으로 변환한다.
 * 오디오는 현재 프로젝트의 Tone 렌더링 결과를 사용하고, 차트는 임시 4레인 테스트 차트로 조립한다.
 */
export const createPlayableSongFromLoop = async (
  songId: string,
  loop: LoopSpec,
  options: CreatePlayableSongFromLoopOptions = {},
): Promise<PlayableSong> => {
  const chartOffsetSeconds = timingConfig.leadInTime + (options.chartOffsetMs ?? 0) / 1000;
  const chart = shiftRhythmChart(createDrumTestChart(songId, loop), chartOffsetSeconds);
  const renderedBuffer = await renderLoopToAudioBuffer(loop);

  if (!renderedBuffer) {
    throw new Error("기존 루프를 게임용 오디오 버퍼로 렌더링하지 못했습니다.");
  }

  const audioBufferWithLeadIn = prependAudioBufferSilence(renderedBuffer, timingConfig.leadInTime);

  return {
    id: songId,
    title: loop.title,
    chart,
    audio: {
      kind: "buffer",
      loadBuffer: async () => audioBufferWithLeadIn,
      durationSeconds: audioBufferWithLeadIn.duration,
    },
    metadata: {
      origin: "generated-loop",
      bpm: loop.bpm,
      offset: chartOffsetSeconds,
    },
  };
};
