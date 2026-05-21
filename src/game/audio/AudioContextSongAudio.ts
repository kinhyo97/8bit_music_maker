import type { SongAudio } from "./SongAudio";

/**
 * AudioBuffer를 직접 재생하는 SongAudio 구현체다.
 * 내부 생성곡을 오프라인 렌더링한 뒤 게임에 붙일 때 사용하는 기본 어댑터다.
 */
export class AudioContextSongAudio implements SongAudio {
  private readonly context: AudioContext;
  private readonly buffer: AudioBuffer;
  private readonly offsetSeconds: number;
  private sourceNode: AudioBufferSourceNode | null = null;
  private startedAtContextTime: number | null = null;
  private pausedProgressSeconds = 0;
  private playing = false;

  constructor(buffer: AudioBuffer, offsetSeconds = 0, context = new AudioContext()) {
    this.buffer = buffer;
    this.offsetSeconds = offsetSeconds;
    this.context = context;
  }

  /**
   * 브라우저 오디오 출력이 실제로 들리기까지의 시작 지연을 추정한다.
   * 첫 박만 유독 빨리 느껴지는 현상을 줄이기 위해, 소스 시작을 약간 미래 시점에 예약하고
   * 엔진 시간도 그 예약 시점을 기준으로 흐르게 맞춘다.
   */
  private getStartupLeadSeconds() {
    const baseLatency = this.context.baseLatency ?? 0;
    const outputLatency = "outputLatency" in this.context ? (this.context.outputLatency ?? 0) : 0;

    return Math.max(0.12, baseLatency + outputLatency);
  }

  /**
   * 현재 위치부터 새 버퍼 소스를 만들고 출력에 연결한다.
   * AudioBufferSourceNode는 1회용이기 때문에 pause/resume 시마다 새로 만들어야 한다.
   */
  private createSource(startOffsetSeconds: number, startLeadSeconds: number) {
    const source = this.context.createBufferSource();
    source.buffer = this.buffer;
    source.connect(this.context.destination);
    source.onended = () => {
      if (this.playing && this.getCurrentTime() >= this.getDuration()) {
        this.playing = false;
      }
    };
    const scheduledStartTime = this.context.currentTime + startLeadSeconds;
    source.start(scheduledStartTime, startOffsetSeconds);
    this.sourceNode = source;
    this.startedAtContextTime = scheduledStartTime - startOffsetSeconds;
  }

  /**
   * 브라우저 오디오 컨텍스트를 활성화하고 재생을 시작한다.
   */
  async start() {
    if (this.context.state === "suspended") {
      await this.context.resume();
    }

    this.stop();
    this.pausedProgressSeconds = 0;
    this.createSource(0, this.getStartupLeadSeconds());
    this.playing = true;
  }

  /**
   * 현재 재생 위치를 저장한 뒤 버퍼 재생을 멈춘다.
   */
  pause() {
    if (!this.playing) {
      return;
    }

    this.pausedProgressSeconds = Math.min(this.getCurrentTime(), this.buffer.duration);
    this.sourceNode?.stop();
    this.sourceNode?.disconnect();
    this.sourceNode = null;
    this.playing = false;
  }

  /**
   * pause 당시 위치부터 새 소스를 만들어 이어서 재생한다.
   */
  async resume() {
    if (this.playing) {
      return;
    }

    if (this.context.state === "suspended") {
      await this.context.resume();
    }

    this.createSource(this.pausedProgressSeconds, this.getStartupLeadSeconds());
    this.playing = true;
  }

  /**
   * 버퍼 재생을 완전히 중단하고 내부 위치를 초기화한다.
   */
  stop() {
    this.sourceNode?.stop();
    this.sourceNode?.disconnect();
    this.sourceNode = null;
    this.startedAtContextTime = null;
    this.pausedProgressSeconds = 0;
    this.playing = false;
  }

  /**
   * 현재 버퍼 재생 위치를 초 단위로 반환한다.
   * 차트 offset은 오디오 출처 차이를 보정하기 위해 여기서 함께 반영한다.
   */
  getCurrentTime() {
    const progressSeconds =
      this.playing && this.startedAtContextTime != null
        ? this.context.currentTime - this.startedAtContextTime
        : this.pausedProgressSeconds;

    return Math.max(0, Math.min(progressSeconds + this.offsetSeconds, this.buffer.duration));
  }

  /**
   * 현재 버퍼 전체 길이를 반환한다.
   */
  getDuration() {
    return this.buffer.duration;
  }

  /**
   * 재생 중인지 여부를 외부에서 확인할 수 있게 한다.
   */
  isPlaying() {
    return this.playing;
  }
}
