import { GameClock } from "../core/timing/GameClock";
import type { SongAudio } from "./SongAudio";

export class ManualSongAudio implements SongAudio {
  private readonly clock: GameClock;
  private readonly durationSeconds: number;
  private playing = false;

  constructor(durationSeconds: number, offsetSeconds = 0) {
    this.clock = new GameClock(undefined, offsetSeconds);
    this.durationSeconds = Math.max(durationSeconds, 0);
  }

  /**
   * 실제 오디오 없이도 엔진 시간을 흘릴 수 있는 수동 오디오 구현체다.
   * Phaser 씬을 붙이기 전, 시스템 순서와 판정 흐름을 검증할 때 기준 시간 소스로 사용한다.
   */
  start() {
    this.clock.start();
    this.playing = true;
  }

  /**
   * 수동 오디오의 흐름을 멈추고 현재 시각을 고정한다.
   */
  pause() {
    if (!this.playing) {
      return;
    }

    this.clock.pause();
    this.playing = false;
  }

  /**
   * pause 이후 다시 시간을 흐르게 한다.
   */
  resume() {
    this.clock.resume();
    this.playing = true;
  }

  /**
   * 재생을 완전히 종료한다.
   * 이후 새로 시작할 때는 start()를 다시 호출해 기준 시계를 재설정한다.
   */
  stop() {
    this.playing = false;
  }

  /**
   * 현재 곡 진행 시간을 초 단위로 돌려준다.
   * duration을 넘어서면 진행률 계산이 흔들리지 않게 상한을 잘라서 반환한다.
   */
  getCurrentTime() {
    return Math.min(this.clock.getCurrentTime(), this.durationSeconds);
  }

  /**
   * 현재 오디오가 담당하는 총 길이를 반환한다.
   */
  getDuration() {
    return this.durationSeconds;
  }

  /**
   * 재생 상태를 외부에서 읽을 수 있게 한다.
   */
  isPlaying() {
    return this.playing;
  }
}
