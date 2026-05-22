import { timingConfig } from "../config/timingConfig";
import type { RuntimeNote } from "../types/note";
import type { RhythmChart } from "../types/chart";
import { syncTestApproachBeats, syncTestVisualDelaySeconds } from "../phaser/playSceneLayout";

export type GameModeId = "default" | "sync-test";

export type GameModeConfig = {
  id: GameModeId;
  renderTimeOffsetSeconds: number;
  cullNotesOutsideApproachWindow: boolean;
  getApproachWindowSeconds: (chart?: RhythmChart) => number;
  selectVisibleNotes: (activeNotes: RuntimeNote[], currentTime: number) => RuntimeNote[];
};

const selectAllVisibleNotes = (activeNotes: RuntimeNote[]) => activeNotes;

const selectClosestFutureNote = (activeNotes: RuntimeNote[], currentTime: number) => {
  const futureNotes = activeNotes
    .filter((note) => note.time >= currentTime)
    .sort((left, right) => left.time - right.time);

  if (futureNotes.length > 0) {
    return [futureNotes[0]];
  }

  return activeNotes.slice(0, 1);
};

export const gameModeConfigs: Record<GameModeId, GameModeConfig> = {
  default: {
    id: "default",
    renderTimeOffsetSeconds: 0,
    cullNotesOutsideApproachWindow: false,
    getApproachWindowSeconds: () => timingConfig.approachTime,
    selectVisibleNotes: selectAllVisibleNotes,
  },
  "sync-test": {
    id: "sync-test",
    renderTimeOffsetSeconds: syncTestVisualDelaySeconds,
    cullNotesOutsideApproachWindow: true,
    getApproachWindowSeconds: (chart) =>
      chart ? (60 / chart.bpm) * syncTestApproachBeats : timingConfig.approachTime,
    selectVisibleNotes: selectClosestFutureNote,
  },
};
