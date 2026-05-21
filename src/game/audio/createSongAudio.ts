import { ManualSongAudio } from "./ManualSongAudio";
import { AudioContextSongAudio } from "./AudioContextSongAudio";
import { HtmlMediaSongAudio } from "./HtmlMediaSongAudio";
import type { SongAudio } from "./SongAudio";
import type { GameAudioSource } from "../types/playableSong";

/**
 * 오디오 소스 정의를 실제 SongAudio 구현체로 바꾼다.
 * 게임엔진은 이 팩토리의 결과만 알면 되므로, 내부 생성곡과 외부 음원의 차이를 바깥에서 흡수할 수 있다.
 */
export const createSongAudio = async (source: GameAudioSource): Promise<SongAudio> => {
  switch (source.kind) {
    case "manual":
      return new ManualSongAudio(source.durationSeconds, source.offsetSeconds ?? 0);

    case "buffer": {
      const buffer = await source.loadBuffer();
      return new AudioContextSongAudio(buffer, source.offsetSeconds ?? 0);
    }

    case "url":
      return new HtmlMediaSongAudio(source.url, source.durationSeconds, source.offsetSeconds ?? 0);
  }
};
