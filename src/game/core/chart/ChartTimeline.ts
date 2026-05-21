import { timingConfig } from "../../config/timingConfig";
import { createRuntimeNote, type RuntimeNote } from "../../types/note";
import type { RhythmChart } from "../../types/chart";

export class ChartTimeline {
  readonly notes: RuntimeNote[];

  constructor(chart: RhythmChart, approachTime = timingConfig.approachTime) {
    this.notes = chart.notes.map((note) => createRuntimeNote(note, note.time - approachTime));
  }

  /**
   * 현재 시점까지 화면에 등장해야 하는 노트를 꺼낸다.
   * 반환된 노트는 호출자가 active 상태로 승격시켜 관리한다.
   */
  takeSpawnableNotes(currentTime: number, pendingNotes: RuntimeNote[]): RuntimeNote[] {
    const spawnable: RuntimeNote[] = [];

    while (pendingNotes.length && pendingNotes[0].spawnTime <= currentTime) {
      const note = pendingNotes.shift();

      if (!note) {
        break;
      }

      spawnable.push(note);
    }

    return spawnable;
  }
}
