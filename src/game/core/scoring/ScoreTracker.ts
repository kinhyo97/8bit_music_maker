import type { JudgementName } from "../../types/judgement";
import type { JudgementCounts, ScoreState } from "../../types/score";

const createEmptyCounts = (): JudgementCounts => ({
  perfect: 0,
  good: 0,
  bad: 0,
  miss: 0,
});

const judgementScoreTable: Record<JudgementName, number> = {
  perfect: 1000,
  good: 700,
  bad: 250,
  miss: 0,
};

const judgementAccuracyTable: Record<JudgementName, number> = {
  perfect: 1,
  good: 0.7,
  bad: 0.3,
  miss: 0,
};

export class ScoreTracker {
  /**
   * 점수판의 초기 상태를 만든다.
   * 게임 시작 시 세션 상태에 그대로 넣을 수 있게 순수 데이터로 반환한다.
   */
  createInitialState(): ScoreState {
    return {
      score: 0,
      combo: 0,
      maxCombo: 0,
      accuracy: 1,
      totalJudgements: 0,
      counts: createEmptyCounts(),
    };
  }

  /**
   * 판정 1회를 반영한 새 점수 상태를 계산한다.
   * 기존 상태를 직접 바꾸지 않고 새 객체를 반환해 추적을 쉽게 만든다.
   */
  applyJudgement(state: ScoreState, judgement: JudgementName): ScoreState {
    const nextCombo = judgement === "miss" ? 0 : state.combo + 1;
    const totalJudgements = state.totalJudgements + 1;
    const counts = {
      ...state.counts,
      [judgement]: state.counts[judgement] + 1,
    };

    const weightedSum =
      counts.perfect * judgementAccuracyTable.perfect +
      counts.good * judgementAccuracyTable.good +
      counts.bad * judgementAccuracyTable.bad +
      counts.miss * judgementAccuracyTable.miss;

    return {
      score: state.score + judgementScoreTable[judgement],
      combo: nextCombo,
      maxCombo: Math.max(state.maxCombo, nextCombo),
      accuracy: totalJudgements > 0 ? weightedSum / totalJudgements : 1,
      totalJudgements,
      counts,
    };
  }
}
