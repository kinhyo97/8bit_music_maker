import type { InputEvent, LaneHoldState } from "../types/input";
import type { RhythmLane } from "../types/chart";

const createLaneHoldState = (): LaneHoldState => ({
  0: false,
  1: false,
  2: false,
  3: false,
});

export class InputSystem {
  private readonly bufferedEvents: InputEvent[] = [];
  private readonly laneHoldState: LaneHoldState = createLaneHoldState();

  /**
   * 레인 입력 시작을 버퍼에 기록한다.
   * 씬이나 플랫폼 어댑터는 실제 키 입력이 발생했을 때 이 메서드만 호출하면 된다.
   */
  press(lane: RhythmLane, time: number) {
    this.laneHoldState[lane] = true;
    this.bufferedEvents.push({ lane, action: "press", time });
  }

  /**
   * 레인 입력 해제를 버퍼에 기록한다.
   * 홀드 노트 종료 판정은 이후 시스템 단계에서 이 이벤트를 읽어 처리한다.
   */
  release(lane: RhythmLane, time: number) {
    this.laneHoldState[lane] = false;
    this.bufferedEvents.push({ lane, action: "release", time });
  }

  /**
   * 현재 프레임에서 쌓인 입력 이벤트를 시간순으로 꺼낸다.
   * 호출 후 내부 버퍼는 비워서 같은 입력이 중복 처리되지 않게 한다.
   */
  consumeEvents() {
    const events = [...this.bufferedEvents].sort((left, right) => left.time - right.time);
    this.bufferedEvents.length = 0;
    return events;
  }

  /**
   * 각 레인이 현재 눌린 상태인지 조회한다.
   * 홀드 유지 여부를 판정할 때 사용한다.
   */
  getLaneHoldState() {
    return { ...this.laneHoldState };
  }
}
