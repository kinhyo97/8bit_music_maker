import Phaser from "phaser";
import type { GameModeConfig } from "../../modes/gameModeConfig";
import type { RhythmChart } from "../../types/chart";
import type { RuntimeNote } from "../../types/note";
import type { PlaySessionState } from "../../types/session";
import { getLanePointAtProgress } from "../playSceneLayout";

export class NoteRenderer {
  private readonly noteGraphics: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene) {
    this.noteGraphics = scene.add.graphics();
  }

  renderState(args: {
    state: PlaySessionState;
    modeConfig: GameModeConfig;
    chart?: RhythmChart;
  }) {
    const { state, modeConfig, chart } = args;
    this.noteGraphics.clear();
    const renderCurrentTime = Math.max(0, state.currentTime - modeConfig.renderTimeOffsetSeconds);

    const notesToRender = modeConfig.selectVisibleNotes(state.activeNotes, renderCurrentTime);

    notesToRender.forEach((note) => {
      this.drawProjectedNote(note, renderCurrentTime, modeConfig, chart);
    });
  }

  private drawProjectedNote(
    note: RuntimeNote,
    currentTime: number,
    modeConfig: GameModeConfig,
    chart?: RhythmChart,
  ) {
    const approachWindow = modeConfig.getApproachWindowSeconds(chart);
    const timeUntilHit = note.time - currentTime;

    if (modeConfig.cullNotesOutsideApproachWindow && timeUntilHit > approachWindow) {
      return;
    }

    const distanceRatio = Phaser.Math.Clamp(timeUntilHit / approachWindow, 0, 1);
    const progress = 1 - distanceRatio;
    const notePoint = getLanePointAtProgress(note.lane, progress);
    const noteScale = Phaser.Math.Linear(0.42, 1.06, progress);
    const noteWidth = Phaser.Math.Linear(26, 72, progress);
    const noteHeight = Phaser.Math.Linear(12, 32, progress);

    if (note.type === "hold" && note.endTime != null) {
      const endDistanceRatio = Phaser.Math.Clamp((note.endTime - currentTime) / approachWindow, 0, 1);
      const endProgress = 1 - endDistanceRatio;
      const endPoint = getLanePointAtProgress(note.lane, endProgress);

      this.noteGraphics.lineStyle(Math.max(10, noteWidth * 0.36), 0x84d6ff, 0.95);
      this.noteGraphics.beginPath();
      this.noteGraphics.moveTo(notePoint.x, notePoint.y);
      this.noteGraphics.lineTo(endPoint.x, endPoint.y);
      this.noteGraphics.strokePath();

      this.noteGraphics.fillStyle(0xc8f7ff, 1);
      this.noteGraphics.fillEllipse(notePoint.x, notePoint.y, noteWidth, noteHeight);
      this.noteGraphics.fillStyle(0x4fb6ff, 1);
      this.noteGraphics.fillEllipse(notePoint.x, notePoint.y, noteWidth * 0.66, noteHeight * 0.72);
      this.noteGraphics.fillStyle(0xffffff, 0.8);
      this.noteGraphics.fillEllipse(endPoint.x, endPoint.y, noteWidth * 0.7, noteHeight * 0.7);
      return;
    }

    this.noteGraphics.fillStyle(0xffffff, 1);
    this.noteGraphics.fillEllipse(notePoint.x, notePoint.y, noteWidth, noteHeight);
    this.noteGraphics.fillStyle(this.getLaneNoteColor(note.lane), 1);
    this.noteGraphics.fillEllipse(notePoint.x, notePoint.y, noteWidth * 0.68, noteHeight * 0.7);
    this.noteGraphics.fillStyle(0xffffff, 0.55);
    this.noteGraphics.fillEllipse(notePoint.x, notePoint.y - noteHeight * 0.06, noteWidth * 0.26, noteHeight * 0.22);
    this.noteGraphics.lineStyle(Math.max(2, noteScale * 2), 0xdff9ff, 0.55);
    this.noteGraphics.strokeEllipse(notePoint.x, notePoint.y, noteWidth, noteHeight);
  }

  private getLaneNoteColor(lane: number) {
    switch (lane) {
      case 0:
        return 0x57beff;
      case 1:
        return 0xff94d3;
      case 2:
        return 0x55d7b0;
      case 3:
      default:
        return 0xffc866;
    }
  }
}
