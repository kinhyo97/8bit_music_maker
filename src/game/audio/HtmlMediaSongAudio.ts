import type { SongAudio } from "./SongAudio";

/**
 * 외부 mp3/wav URL을 HTMLAudioElement로 재생하는 SongAudio 구현체다.
 * 원곡 음원이나 업로드 파일을 게임에 연결할 때 사용하는 어댑터다.
 */
export class HtmlMediaSongAudio implements SongAudio {
  private readonly audioElement: HTMLAudioElement;
  private readonly durationSeconds?: number;
  private readonly offsetSeconds: number;

  constructor(url: string, durationSeconds?: number, offsetSeconds = 0) {
    this.audioElement = new Audio(url);
    this.audioElement.preload = "auto";
    this.durationSeconds = durationSeconds;
    this.offsetSeconds = offsetSeconds;
  }

  /**
   * 외부 음원을 처음부터 재생한다.
   */
  async start() {
    this.audioElement.currentTime = 0;
    await this.audioElement.play();
  }

  /**
   * 현재 외부 음원 재생을 일시정지한다.
   */
  pause() {
    this.audioElement.pause();
  }

  /**
   * 일시정지된 외부 음원 재생을 다시 시작한다.
   */
  async resume() {
    await this.audioElement.play();
  }

  /**
   * 재생을 멈추고 처음 위치로 되돌린다.
   */
  stop() {
    this.audioElement.pause();
    this.audioElement.currentTime = 0;
  }

  /**
   * 현재 HTML 미디어 요소의 재생 위치를 초 단위로 반환한다.
   */
  getCurrentTime() {
    const currentTime = this.audioElement.currentTime + this.offsetSeconds;
    return Math.max(0, Math.min(currentTime, this.getDuration()));
  }

  /**
   * 외부 음원의 전체 길이를 반환한다.
   * 아직 메타데이터가 로드되지 않았다면 생성 시 넘긴 길이를 우선 사용한다.
   */
  getDuration() {
    return Number.isFinite(this.audioElement.duration) && this.audioElement.duration > 0
      ? this.audioElement.duration
      : this.durationSeconds ?? 0;
  }

  /**
   * 현재 외부 음원이 실제 재생 중인지 조회한다.
   */
  isPlaying() {
    return !this.audioElement.paused;
  }
}
