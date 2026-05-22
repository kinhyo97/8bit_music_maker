import Phaser from "phaser";
import type { RhythmLane } from "../../types/chart";
import { getHighwayProgressFromY, getLanePointAtProgress, highwayBottomWidth, highwayBottomY, highwayCenterX, highwayTopWidth, highwayTopY, laneCodes, receptorY, sceneHeight, sceneWidth } from "../playSceneLayout";

export class StageRenderer {
  private readonly scene: Phaser.Scene;
  private readonly backgroundGraphics: Phaser.GameObjects.Graphics;
  private readonly highwayGraphics: Phaser.GameObjects.Graphics;
  private readonly topBarGraphics: Phaser.GameObjects.Graphics;
  private readonly lifeBarFill: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.backgroundGraphics = scene.add.graphics();
    this.highwayGraphics = scene.add.graphics();
    this.topBarGraphics = scene.add.graphics();
    this.lifeBarFill = scene.add.graphics();
  }

  drawStaticStage() {
    this.backgroundGraphics.clear();
    this.topBarGraphics.clear();

    this.backgroundGraphics.fillGradientStyle(0x1d2d45, 0x1d2d45, 0x0f1018, 0x0f1018, 1);
    this.backgroundGraphics.fillRect(0, 0, sceneWidth, sceneHeight);

    this.backgroundGraphics.fillGradientStyle(0x203d67, 0x324e86, 0x161f35, 0x141928, 1);
    this.backgroundGraphics.fillRect(20, 82, sceneWidth - 40, 148);

    this.drawStageLights();
    this.drawSpeakers();
    this.drawCharacterSilhouettes();
    this.drawHighwayBase();
    this.drawTopHudBar();
  }

  renderLifeGauge(accuracy: number) {
    const fillWidth = Phaser.Math.Clamp(accuracy, 0, 1) * 170;

    this.lifeBarFill.clear();
    this.lifeBarFill.fillStyle(0x58d769, 1);
    this.lifeBarFill.fillRoundedRect(712, 40, Math.max(10, fillWidth), 14, 6);
  }

  getLaneLabelPoint(lane: RhythmLane) {
    const receptorPoint = getLanePointAtProgress(lane, getHighwayProgressFromY(receptorY));
    return { x: receptorPoint.x, y: receptorY + 60 };
  }

  private drawTopHudBar() {
    this.topBarGraphics.fillStyle(0x20252c, 0.96);
    this.topBarGraphics.fillRoundedRect(18, 18, sceneWidth - 36, 52, 16);

    this.topBarGraphics.fillStyle(0xffffff, 1);
    this.topBarGraphics.fillCircle(48, 44, 18);
    this.topBarGraphics.fillStyle(0x1aa1d8, 1);
    this.topBarGraphics.fillCircle(48, 44, 10);
    this.topBarGraphics.fillStyle(0xffffff, 1);
    this.topBarGraphics.fillTriangle(43, 40, 48, 34, 53, 40);

    const lifeBarX = 708;
    const lifeBarY = 36;
    const lifeBarWidth = 178;
    const lifeBarHeight = 22;

    this.topBarGraphics.fillStyle(0xffffff, 1);
    this.topBarGraphics.fillRoundedRect(lifeBarX - 10, lifeBarY - 8, lifeBarWidth + 20, lifeBarHeight + 16, 10);
    this.topBarGraphics.fillStyle(0xd8f4dc, 1);
    this.topBarGraphics.fillRoundedRect(lifeBarX, lifeBarY, lifeBarWidth, lifeBarHeight, 8);

    this.lifeBarFill.fillStyle(0x58d769, 1);
    this.lifeBarFill.fillRoundedRect(lifeBarX + 4, lifeBarY + 4, lifeBarWidth - 8, lifeBarHeight - 8, 6);

    this.topBarGraphics.fillStyle(0xff7ca7, 1);
    this.topBarGraphics.fillRoundedRect(899, 28, 40, 40, 12);
    this.topBarGraphics.fillStyle(0xffffff, 1);
    this.topBarGraphics.fillRect(911, 38, 5, 18);
    this.topBarGraphics.fillRect(922, 38, 5, 18);
  }

  private drawStageLights() {
    const beamPairs = [
      [170, 130, 330],
      [290, 124, 360],
      [480, 118, 410],
      [650, 124, 364],
      [790, 132, 332],
    ] as const;

    beamPairs.forEach(([x, topY, bottomY]) => {
      this.backgroundGraphics.fillStyle(0xffffff, 0.08);
      this.backgroundGraphics.fillTriangle(x - 8, topY, x + 8, topY, x + 48, bottomY);
      this.backgroundGraphics.fillTriangle(x - 8, topY, x + 8, topY, x - 48, bottomY);
      this.backgroundGraphics.fillStyle(0xf9f2d0, 0.9);
      this.backgroundGraphics.fillCircle(x, topY, 8);
    });
  }

  private drawSpeakers() {
    const drawSpeakerStack = (x: number) => {
      this.backgroundGraphics.fillStyle(0x141821, 1);
      this.backgroundGraphics.fillRoundedRect(x, 240, 64, 142, 12);
      this.backgroundGraphics.fillStyle(0x212937, 1);
      this.backgroundGraphics.fillRoundedRect(x + 8, 252, 48, 54, 10);
      this.backgroundGraphics.fillRoundedRect(x + 8, 316, 48, 54, 10);
      this.backgroundGraphics.fillStyle(0x76c9ff, 0.9);
      this.backgroundGraphics.fillCircle(x + 32, 279, 16);
      this.backgroundGraphics.fillCircle(x + 32, 343, 16);
      this.backgroundGraphics.lineStyle(3, 0xe8faff, 0.9);
      this.backgroundGraphics.strokeCircle(x + 32, 279, 24);
      this.backgroundGraphics.strokeCircle(x + 32, 343, 24);
    };

    drawSpeakerStack(28);
    drawSpeakerStack(868);
  }

  private drawCharacterSilhouettes() {
    const characters = [
      { x: 230, y: 286, tint: 0x6fa1ff },
      { x: 365, y: 258, tint: 0xf5b84d },
      { x: 480, y: 276, tint: 0xf06fa7 },
      { x: 608, y: 258, tint: 0xf4d07b },
      { x: 735, y: 286, tint: 0x7cd196 },
    ];

    characters.forEach(({ x, y, tint }) => {
      this.backgroundGraphics.fillStyle(0x1a2030, 0.8);
      this.backgroundGraphics.fillEllipse(x, y + 40, 78, 22);
      this.backgroundGraphics.fillStyle(tint, 0.95);
      this.backgroundGraphics.fillCircle(x, y - 36, 22);
      this.backgroundGraphics.fillRoundedRect(x - 24, y - 12, 48, 72, 18);
      this.backgroundGraphics.fillStyle(0xffffff, 0.18);
      this.backgroundGraphics.fillCircle(x - 6, y - 42, 8);
      this.backgroundGraphics.fillCircle(x + 8, y - 42, 8);
    });
  }

  private drawHighwayBase() {
    const leftTop = highwayCenterX - highwayTopWidth / 2;
    const rightTop = highwayCenterX + highwayTopWidth / 2;
    const leftBottom = highwayCenterX - highwayBottomWidth / 2;
    const rightBottom = highwayCenterX + highwayBottomWidth / 2;

    this.highwayGraphics.clear();
    this.highwayGraphics.fillStyle(0x0d1320, 0.72);
    this.highwayGraphics.fillPoints(
      [
        new Phaser.Math.Vector2(leftTop, highwayTopY),
        new Phaser.Math.Vector2(rightTop, highwayTopY),
        new Phaser.Math.Vector2(rightBottom, highwayBottomY),
        new Phaser.Math.Vector2(leftBottom, highwayBottomY),
      ],
      true,
    );

    this.highwayGraphics.lineStyle(4, 0xb6f3ff, 0.9);
    this.highwayGraphics.beginPath();
    this.highwayGraphics.moveTo(leftTop, highwayTopY);
    this.highwayGraphics.lineTo(leftBottom, highwayBottomY);
    this.highwayGraphics.moveTo(rightTop, highwayTopY);
    this.highwayGraphics.lineTo(rightBottom, highwayBottomY);
    this.highwayGraphics.strokePath();

    for (let dividerIndex = 1; dividerIndex < 4; dividerIndex += 1) {
      const progress = dividerIndex / 4;
      const topX = Phaser.Math.Linear(leftTop, rightTop, progress);
      const bottomX = Phaser.Math.Linear(leftBottom, rightBottom, progress);
      this.highwayGraphics.lineStyle(2, 0x89d4ff, dividerIndex === 2 ? 0.28 : 0.18);
      this.highwayGraphics.beginPath();
      this.highwayGraphics.moveTo(topX, highwayTopY);
      this.highwayGraphics.lineTo(bottomX, highwayBottomY);
      this.highwayGraphics.strokePath();
    }

    for (let step = 0; step <= 10; step += 1) {
      const progress = step / 10;
      const y = Phaser.Math.Linear(highwayTopY, highwayBottomY, progress);
      const inset = Phaser.Math.Linear(highwayTopWidth / 2, highwayBottomWidth / 2, progress);
      this.highwayGraphics.lineStyle(step === 0 ? 0 : 1, 0xffffff, progress > 0.9 ? 0.32 : 0.12);
      this.highwayGraphics.beginPath();
      this.highwayGraphics.moveTo(highwayCenterX - inset, y);
      this.highwayGraphics.lineTo(highwayCenterX + inset, y);
      this.highwayGraphics.strokePath();
    }

    this.drawReceptors();
    this.drawCrowdLights();
  }

  private drawReceptors() {
    laneCodes.forEach(({ lane }) => {
      const receptorPoint = getLanePointAtProgress(lane, getHighwayProgressFromY(receptorY));
      this.highwayGraphics.fillStyle(0xffffff, 1);
      this.highwayGraphics.fillCircle(receptorPoint.x, receptorY, 18);
      this.highwayGraphics.fillStyle(0x5cd3ff, 1);
      this.highwayGraphics.fillCircle(receptorPoint.x, receptorY, 11);
      this.highwayGraphics.lineStyle(3, 0xdbf7ff, 1);
      this.highwayGraphics.strokeCircle(receptorPoint.x, receptorY, 24);
    });
  }

  private drawCrowdLights() {
    for (let row = 0; row < 6; row += 1) {
      for (let column = 0; column < 14; column += 1) {
        const x = 34 + column * 66 + (row % 2 === 0 ? 0 : 22);
        const y = 512 + row * 20;
        this.highwayGraphics.fillStyle(0xe6fbff, 0.82 - row * 0.1);
        this.highwayGraphics.fillEllipse(x, y, 10, 22);
      }
    }
  }
}
