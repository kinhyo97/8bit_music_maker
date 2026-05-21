export type TimeSource = {
  now: () => number;
};

const performanceTimeSource: TimeSource = {
  now: () => performance.now() / 1000,
};

export class GameClock {
  private readonly timeSource: TimeSource;
  private readonly offsetSeconds: number;
  private startedAt: number | null = null;
  private pausedAt: number | null = null;
  private accumulatedPauseSeconds = 0;

  constructor(timeSource: TimeSource = performanceTimeSource, offsetSeconds = 0) {
    this.timeSource = timeSource;
    this.offsetSeconds = offsetSeconds;
  }

  /**
   * 게임 플레이 기준 시계를 시작한다.
   * 오디오가 실제로 출발하는 시점과 최대한 가깝게 호출하는 것을 전제로 한다.
   */
  start() {
    this.startedAt = this.timeSource.now();
    this.pausedAt = null;
    this.accumulatedPauseSeconds = 0;
  }

  /**
   * 일시정지 시작 시점을 기록한다.
   * 실제 시간은 멈추지 않기 때문에 pause 구간 길이를 따로 누적해야 한다.
   */
  pause() {
    if (this.startedAt == null || this.pausedAt != null) {
      return;
    }

    this.pausedAt = this.timeSource.now();
  }

  /**
   * 일시정지 구간 길이를 누적해 다시 재생 시간 계산에 반영한다.
   */
  resume() {
    if (this.pausedAt == null) {
      return;
    }

    this.accumulatedPauseSeconds += this.timeSource.now() - this.pausedAt;
    this.pausedAt = null;
  }

  /**
   * 현재 곡 진행 시간을 초 단위로 반환한다.
   * 아직 시작하지 않았으면 0을 돌려준다.
   */
  getCurrentTime() {
    if (this.startedAt == null) {
      return 0;
    }

    const referenceNow = this.pausedAt ?? this.timeSource.now();
    return Math.max(0, referenceNow - this.startedAt - this.accumulatedPauseSeconds + this.offsetSeconds);
  }
}
