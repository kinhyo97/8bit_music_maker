import type { RhythmChart } from "./chart";

/**
 * 게임엔진이 실제로 재생 가능한 곡으로 받는 입력 구조를 정의한다.
 * 오디오가 어디서 왔는지는 숨기고, 플레이에 필요한 차트와 메타데이터만 한 묶음으로 전달한다.
 */
export type PlayableSongOrigin = "generated-loop" | "external-audio" | "manual-test";

// 플레이 가능한 곡이 어떤 출처에서 준비되었는지 나타낸다.
export type GameAudioSource =
  | {
      kind: "manual";
      durationSeconds: number;
      offsetSeconds?: number;
    }
  | {
      kind: "buffer";
      loadBuffer: () => Promise<AudioBuffer>;
      durationSeconds?: number;
      offsetSeconds?: number;
    }
  | {
      kind: "url";
      url: string;
      durationSeconds?: number;
      offsetSeconds?: number;
    };

// 게임 오디오를 어떤 방식으로 준비할지 설명하는 소스 정의다.
export type PlayableSong = {
  id: string;
  title: string;
  chart: RhythmChart;
  audio: GameAudioSource;
  metadata?: {
    origin: PlayableSongOrigin;
    bpm?: number;
    offset?: number;
  };
};

// 게임 한 판을 시작할 때 엔진 바깥에서 조립해 넘겨주는 완성된 입력 모델이다.
