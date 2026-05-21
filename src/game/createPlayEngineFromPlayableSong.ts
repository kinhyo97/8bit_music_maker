import { PlayEngine } from "./PlayEngine";
import { createSongAudio } from "./audio/createSongAudio";
import type { PlayableSong } from "./types/playableSong";

/**
 * 외부에서 준비한 PlayableSong을 실제 플레이 엔진으로 조립한다.
 * 오디오 준비와 엔진 생성 책임을 한 함수로 묶어, 앱 계층이 조립 세부사항을 몰라도 되게 한다.
 */
export const createPlayEngineFromPlayableSong = async (playableSong: PlayableSong) => {
  const songAudio = await createSongAudio(playableSong.audio);
  return new PlayEngine(playableSong.chart, songAudio);
};
