import Phaser from "phaser";
import type { RhythmLane } from "../types/chart";

export const sceneWidth = 960;
export const sceneHeight = 640;
export const highwayTopY = 96;
export const highwayBottomY = 572;
export const highwayTopWidth = 200;
export const highwayBottomWidth = 620;
export const highwayCenterX = sceneWidth / 2;
export const receptorY = 458;
export const judgeTextY = 500;
export const syncTestApproachBeats = 1.28;
export const syncTestVisualDelaySeconds = 0.2;
export const laneCodes: Array<{ lane: RhythmLane; code: string; label: string }> = [
  { lane: 0, code: "D", label: "D" },
  { lane: 1, code: "F", label: "F" },
  { lane: 2, code: "J", label: "J" },
  { lane: 3, code: "K", label: "K" },
];

export type HighwayPoint = {
  x: number;
  y: number;
};

export const getLanePointAtProgress = (lane: RhythmLane, progress: number): HighwayPoint => {
  const clampedProgress = Phaser.Math.Clamp(progress, 0, 1);
  const y = Phaser.Math.Linear(highwayTopY, highwayBottomY, clampedProgress);
  const halfWidth = Phaser.Math.Linear(highwayTopWidth / 2, highwayBottomWidth / 2, clampedProgress);
  const leftX = highwayCenterX - halfWidth;
  const rightX = highwayCenterX + halfWidth;
  const laneCenterRatio = (lane + 0.5) / 4;
  const x = Phaser.Math.Linear(leftX, rightX, laneCenterRatio);

  return { x, y };
};

export const getHighwayProgressFromY = (y: number) =>
  Phaser.Math.Clamp((y - highwayTopY) / (highwayBottomY - highwayTopY), 0, 1);
