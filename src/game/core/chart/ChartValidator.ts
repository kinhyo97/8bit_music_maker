import type { RhythmChart } from "../../types/chart";

export type ChartValidationIssue = {
  code:
    | "empty-chart"
    | "duplicate-note-id"
    | "negative-time"
    | "invalid-hold-end"
    | "unsorted-time";
  message: string;
  noteId?: string;
};

export type ChartValidationResult = {
  valid: boolean;
  issues: ChartValidationIssue[];
};

export class ChartValidator {
  /**
   * 플레이 가능한 차트인지 확인한다.
   * 이 검사는 렌더링 이전에 데이터 오류를 조기에 막는 역할을 한다.
   */
  validate(chart: RhythmChart): ChartValidationResult {
    const issues: ChartValidationIssue[] = [];

    if (!chart.notes.length) {
      issues.push({
        code: "empty-chart",
        message: "차트에 노트가 하나도 없습니다.",
      });
    }

    const seenNoteIds = new Set<string>();
    let lastTime = -Infinity;

    chart.notes.forEach((note) => {
      if (seenNoteIds.has(note.id)) {
        issues.push({
          code: "duplicate-note-id",
          message: `중복된 노트 id "${note.id}" 가 있습니다.`,
          noteId: note.id,
        });
      }
      seenNoteIds.add(note.id);

      if (note.time < 0) {
        issues.push({
          code: "negative-time",
          message: `노트 "${note.id}" 의 시간이 0보다 작습니다.`,
          noteId: note.id,
        });
      }

      if (note.type === "hold" && (note.endTime == null || note.endTime <= note.time)) {
        issues.push({
          code: "invalid-hold-end",
          message: `홀드 노트 "${note.id}" 의 종료 시간이 시작 시간보다 커야 합니다.`,
          noteId: note.id,
        });
      }

      if (note.time < lastTime) {
        issues.push({
          code: "unsorted-time",
          message: "차트 노트는 시간순으로 정렬되어 있어야 합니다.",
          noteId: note.id,
        });
      }

      lastTime = Math.max(lastTime, note.time);
    });

    return {
      valid: issues.length === 0,
      issues,
    };
  }
}
