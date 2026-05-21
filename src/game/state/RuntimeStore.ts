import type { PlaySessionState } from "../types/session";

export class RuntimeStore {
  private state: PlaySessionState;

  constructor(initialState: PlaySessionState) {
    this.state = initialState;
  }

  /**
   * 현재 세션 상태를 읽는다.
   * 렌더 계층과 시스템 계층이 동일한 상태 기준을 보게 하는 단일 진입점이다.
   */
  getState() {
    return this.state;
  }

  /**
   * 세션 상태 전체를 교체한다.
   * 시스템이 새 상태를 계산한 뒤 한 번에 반영할 때 사용한다.
   */
  setState(nextState: PlaySessionState) {
    this.state = nextState;
  }

  /**
   * 현재 상태를 기반으로 새 상태를 계산해 저장한다.
   * 상태 갱신 로직을 호출부에서 좀 더 간결하게 유지하기 위한 도우미다.
   */
  update(updater: (currentState: PlaySessionState) => PlaySessionState) {
    this.state = updater(this.state);
    return this.state;
  }
}
