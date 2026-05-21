import type { FeedbackEvent } from "../types/gameplay";
import type { PlaySessionState } from "../types/session";

export class FeedbackSystem {
  /**
   * 최근 피드백 이벤트 중 유효 시간이 지난 항목을 정리한다.
   * 렌더 계층은 이 큐를 읽어 이펙트와 텍스트를 출력하고, 만료된 이벤트는 여기서 제거한다.
   */
  prune(state: PlaySessionState, currentTime: number, keepAliveSeconds = 0.4): PlaySessionState {
    const feedbackEvents = state.feedbackEvents.filter(
      (event: FeedbackEvent) => currentTime - event.time <= keepAliveSeconds,
    );

    if (feedbackEvents.length === state.feedbackEvents.length) {
      return state;
    }

    return {
      ...state,
      feedbackEvents,
    };
  }
}
