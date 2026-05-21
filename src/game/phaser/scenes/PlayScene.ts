import Phaser from "phaser";
import type { PlayEngine } from "../../PlayEngine";
import { timingConfig } from "../../config/timingConfig";
import type { RhythmLane } from "../../types/chart";
import type { RuntimeNote } from "../../types/note";
import type { PlaySessionState } from "../../types/session";

export type PlaySceneInitData = {
  engine: PlayEngine;
  onStateChange?: (state: PlaySessionState) => void;
  mode?: "default" | "sync-test";
};

const sceneWidth = 960;
const sceneHeight = 640;
const highwayTopY = 96;
const highwayBottomY = 572;
const highwayTopWidth = 200;
const highwayBottomWidth = 620;
const highwayCenterX = sceneWidth / 2;
const receptorY = 458;
const judgeTextY = 500;
const syncTestApproachBeats = 1.28;
const syncTestVisualDelaySeconds = 0.2;
const laneCodes: Array<{ lane: RhythmLane; code: string; label: string }> = [
  { lane: 0, code: "D", label: "D" },
  { lane: 1, code: "F", label: "F" },
  { lane: 2, code: "J", label: "J" },
  { lane: 3, code: "K", label: "K" },
];

type HighwayPoint = {
  x: number;
  y: number;
};

/**
 * 레퍼런스 화면처럼 보이는 2D 원근형 플레이 씬이다.
 * 실제 판정과 시간 계산은 PlayEngine이 담당하고, 이 씬은 무대/HUD/하이웨이 표현에만 집중한다.
 */
export class PlayScene extends Phaser.Scene {
  private engine: PlayEngine | null = null;
  private onStateChange?: (state: PlaySessionState) => void;
  private mode: "default" | "sync-test" = "default";
  private backgroundGraphics!: Phaser.GameObjects.Graphics;
  private highwayGraphics!: Phaser.GameObjects.Graphics;
  private noteGraphics!: Phaser.GameObjects.Graphics;
  private hudScoreText!: Phaser.GameObjects.Text;
  private hudSongText!: Phaser.GameObjects.Text;
  private hudPhaseText!: Phaser.GameObjects.Text;
  private comboValueText!: Phaser.GameObjects.Text;
  private comboLabelText!: Phaser.GameObjects.Text;
  private accuracyText!: Phaser.GameObjects.Text;
  private judgementText!: Phaser.GameObjects.Text;
  private lifeValueText!: Phaser.GameObjects.Text;
  private topBarGraphics!: Phaser.GameObjects.Graphics;
  private lifeBarFill!: Phaser.GameObjects.Graphics;
  private laneKeyTexts: Phaser.GameObjects.Text[] = [];

  constructor() {
    super("play-scene");
  }

  /**
   * 씬 시작 전에 React 호스트가 엔진과 상태 콜백을 주입한다.
   * 씬 내부에서 외부 전역을 참조하지 않게 하기 위한 명시적 연결 지점이다.
   */
  configure(data: PlaySceneInitData) {
    this.engine = data.engine;
    this.onStateChange = data.onStateChange;
    this.mode = data.mode ?? "default";
  }

  /**
   * 화면 레이어와 입력 바인딩을 초기화한다.
   */
  create() {
    if (!this.engine) {
      throw new Error("PlayScene이 시작되기 전에 PlayEngine이 주입되지 않았습니다.");
    }

    this.cameras.main.setBackgroundColor("#11151b");

    this.backgroundGraphics = this.add.graphics();
    this.highwayGraphics = this.add.graphics();
    this.noteGraphics = this.add.graphics();
    this.topBarGraphics = this.add.graphics();
    this.lifeBarFill = this.add.graphics();

    this.createHud();
    this.createLaneKeyTexts();
    this.bindInput();
    this.drawStaticStage();
    this.renderState(this.engine.getState());
    this.pushState(this.engine.getState());
  }

  /**
   * 매 프레임 엔진 상태를 읽고 무대/HUD/노트 표현을 갱신한다.
   */
  update() {
    if (!this.engine) {
      return;
    }

    const state = this.engine.update();
    this.renderState(state);
    this.pushState(state);
  }

  /**
   * 상단 HUD와 우측 콤보, 중앙 판정 텍스트를 만든다.
   */
  private createHud() {
    const chartTitle = this.engine?.getChart().title ?? "Rhythm Test";

    this.hudSongText = this.add.text(86, 28, chartTitle, {
      color: "#ffffff",
      fontFamily: "Arial",
      fontSize: "26px",
      fontStyle: "bold",
    });

    this.hudPhaseText = this.add.text(88, 58, "Press Enter to Start", {
      color: "#b8c6d9",
      fontFamily: "Arial",
      fontSize: "16px",
    });

    this.hudScoreText = this.add.text(34, 118, "0000000", {
      color: "#f8d8e7",
      fontFamily: "monospace",
      fontSize: "32px",
      fontStyle: "bold",
    });

    this.comboValueText = this.add.text(830, 278, "0", {
      color: "#ffffff",
      fontFamily: "Arial",
      fontSize: "72px",
      fontStyle: "bold",
      stroke: "#26303f",
      strokeThickness: 8,
    });

    this.comboLabelText = this.add.text(815, 350, "COMBO", {
      color: "#ffffff",
      fontFamily: "Arial",
      fontSize: "26px",
      fontStyle: "bold",
      stroke: "#26303f",
      strokeThickness: 6,
    });

    this.accuracyText = this.add.text(774, 398, "100.0%", {
      color: "#d8f5ff",
      fontFamily: "Arial",
      fontSize: "18px",
      fontStyle: "bold",
    });

    this.judgementText = this.add.text(sceneWidth / 2, judgeTextY, "READY", {
      color: "#ffd4f3",
      fontFamily: "Arial",
      fontSize: "48px",
      fontStyle: "bold",
      stroke: "#2d1c2d",
      strokeThickness: 10,
      shadow: {
        offsetX: 0,
        offsetY: 0,
        color: "#ffffff",
        blur: 12,
        fill: false,
      },
    });
    this.judgementText.setOrigin(0.5, 0.5);

    this.lifeValueText = this.add.text(807, 58, "1000/1000", {
      color: "#4fd877",
      fontFamily: "Arial",
      fontSize: "20px",
      fontStyle: "bold",
    });
  }

  /**
   * 레인 키 라벨을 하단 원형 리셉터 위에 맞춘다.
   */
  private createLaneKeyTexts() {
    laneCodes.forEach(({ lane, label }) => {
      const receptorPoint = this.getLanePointAtProgress(lane, this.getHighwayProgressFromY(receptorY));
      const keyText = this.add.text(receptorPoint.x, receptorY + 60, label, {
        color: "#cdefff",
        fontFamily: "Arial",
        fontSize: "20px",
        fontStyle: "bold",
      });

      keyText.setOrigin(0.5, 0.5);
      this.laneKeyTexts.push(keyText);
    });
  }

  /**
   * 하이웨이, 무대, 스피커, 조명처럼 고정된 배경 표현을 그린다.
   */
  private drawStaticStage() {
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

  /**
   * 상단 브라우저처럼 보이는 프레임과 라이프 바를 그린다.
   */
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

  /**
   * 무대 뒤 조명 빔과 라이트 포인트를 그려 배경이 덜 비어 보이게 만든다.
   */
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

  /**
   * 좌우 스피커 더미를 간단한 기하 형태로 만든다.
   */
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

  /**
   * 캐릭터 자리에 들어갈 실루엣을 간단한 원과 몸통으로 배치한다.
   * 실제 스프라이트가 들어오기 전까지 레퍼런스 느낌만 살리는 용도다.
   */
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

  /**
   * 사다리꼴 하이웨이와 레인 구분선을 그린다.
   * 3D 엔진 없이도 원근이 들어간 리듬게임 플레이필드를 만들기 위한 핵심 배경이다.
   */
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

  /**
   * 하단 리셉터를 원형으로 그려 레퍼런스와 비슷한 타격 지점을 만든다.
   */
  private drawReceptors() {
    laneCodes.forEach(({ lane }) => {
      const receptorPoint = this.getLanePointAtProgress(lane, this.getHighwayProgressFromY(receptorY));
      this.highwayGraphics.fillStyle(0xffffff, 1);
      this.highwayGraphics.fillCircle(receptorPoint.x, receptorY, 18);
      this.highwayGraphics.fillStyle(0x5cd3ff, 1);
      this.highwayGraphics.fillCircle(receptorPoint.x, receptorY, 11);
      this.highwayGraphics.lineStyle(3, 0xdbf7ff, 1);
      this.highwayGraphics.strokeCircle(receptorPoint.x, receptorY, 24);
    });
  }

  /**
   * 하단 관객석 라이트를 간단한 블러 점들로 표현한다.
   */
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

  /**
   * 키보드 입력을 PlayEngine에 전달하고 리셉터 하이라이트를 갱신한다.
   */
  private bindInput() {
    const keyboard = this.input.keyboard;

    if (!keyboard) {
      return;
    }

    keyboard.on("keydown-ENTER", () => {
      if (!this.engine) {
        return;
      }

      void this.engine.start().then((state) => this.pushState(state));
    });

    laneCodes.forEach(({ lane, code }) => {
      keyboard.on(`keydown-${code}`, () => {
        if (!this.engine) {
          return;
        }

        this.engine.pressLane(lane);
        this.flashKey(lane, true);
      });
      keyboard.on(`keyup-${code}`, () => {
        if (!this.engine) {
          return;
        }

        this.engine.releaseLane(lane);
        this.flashKey(lane, false);
      });
    });
  }

  /**
   * 현재 세션 상태를 HUD와 노트 레이어에 반영한다.
   */
  private renderState(state: PlaySessionState) {
    this.noteGraphics.clear();
    const renderCurrentTime =
      this.mode === "sync-test"
        ? Math.max(0, state.currentTime - syncTestVisualDelaySeconds)
        : state.currentTime;

    const notesToRender =
      this.mode === "sync-test"
        ? this.getSyncTestVisibleNotes(state.activeNotes, renderCurrentTime)
        : state.activeNotes;

    notesToRender.forEach((note) => {
      this.drawProjectedNote(note, renderCurrentTime);
    });

    this.hudScoreText.setText(state.score.score.toString().padStart(7, "0"));
    this.hudPhaseText.setText(
      state.phase === "playing"
        ? `TIME ${state.currentTime.toFixed(2)}s`
        : state.phase === "finished"
          ? "FINISHED"
          : "Press Enter or Start",
    );
    this.comboValueText.setText(String(state.score.combo));
    this.accuracyText.setText(`${(state.score.accuracy * 100).toFixed(1)}%`);
    this.lifeValueText.setText(`${Math.round(state.score.accuracy * 1000)}/1000`);
    this.renderLifeGauge(state.score.accuracy);

    const latestJudgement = [...state.feedbackEvents].reverse().find((event) => event.type === "judgement");
    if (latestJudgement?.type === "judgement") {
      this.judgementText.setText(latestJudgement.judgement.toUpperCase());
      this.judgementText.setColor(this.getJudgementColor(latestJudgement.judgement));
    } else {
      this.judgementText.setText(state.phase === "playing" ? "PLAYING" : "READY");
      this.judgementText.setColor("#ffd4f3");
    }
  }

  /**
   * 원근 좌표계를 기준으로 노트의 위치와 크기를 계산해 그린다.
   */
  private drawProjectedNote(note: RuntimeNote, currentTime: number) {
    const chart = this.engine?.getChart();
    const syncApproachWindow = chart ? (60 / chart.bpm) * syncTestApproachBeats : timingConfig.approachTime;
    const approachWindow = this.mode === "sync-test" ? syncApproachWindow : timingConfig.approachTime;
    const timeUntilHit = note.time - currentTime;

    if (this.mode === "sync-test" && timeUntilHit > approachWindow) {
      return;
    }

    const distanceRatio = Phaser.Math.Clamp(timeUntilHit / approachWindow, 0, 1);
    const progress = 1 - distanceRatio;
    const notePoint = this.getLanePointAtProgress(note.lane, progress);
    const noteScale = Phaser.Math.Linear(0.42, 1.06, progress);
    const noteWidth = Phaser.Math.Linear(26, 72, progress);
    const noteHeight = Phaser.Math.Linear(12, 32, progress);

    if (note.type === "hold" && note.endTime != null) {
      const endDistanceRatio = Phaser.Math.Clamp((note.endTime - currentTime) / approachWindow, 0, 1);
      const endProgress = 1 - endDistanceRatio;
      const endPoint = this.getLanePointAtProgress(note.lane, endProgress);

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

  /**
   * 정확도 수치를 라이프 게이지 길이로 변환해 그린다.
   */
  private renderLifeGauge(accuracy: number) {
    const fillWidth = Phaser.Math.Clamp(accuracy, 0, 1) * 170;

    this.lifeBarFill.clear();
    this.lifeBarFill.fillStyle(0x58d769, 1);
    this.lifeBarFill.fillRoundedRect(712, 40, Math.max(10, fillWidth), 14, 6);
  }

  /**
   * React 바깥 UI와 같은 상태를 보게 하기 위해 최신 세션 상태를 전달한다.
   */
  private pushState(state: PlaySessionState) {
    this.onStateChange?.({ ...state });
  }

  /**
   * 레인 키가 눌릴 때 하단 키 라벨을 강조해 입력감을 보완한다.
   */
  private flashKey(lane: RhythmLane, active: boolean) {
    const keyText = this.laneKeyTexts[lane];

    if (!keyText) {
      return;
    }

    keyText.setColor(active ? "#ffffff" : "#cdefff");
    keyText.setScale(active ? 1.16 : 1);
  }

  /**
   * 레인과 진행도(0~1)를 받아 사다리꼴 하이웨이 내부 좌표로 변환한다.
   * 이 계산이 3D처럼 보이는 2D 원근감을 만드는 핵심이다.
   */
  private getLanePointAtProgress(lane: RhythmLane, progress: number): HighwayPoint {
    const clampedProgress = Phaser.Math.Clamp(progress, 0, 1);
    const y = Phaser.Math.Linear(highwayTopY, highwayBottomY, clampedProgress);
    const halfWidth = Phaser.Math.Linear(highwayTopWidth / 2, highwayBottomWidth / 2, clampedProgress);
    const leftX = highwayCenterX - halfWidth;
    const rightX = highwayCenterX + halfWidth;
    const laneCenterRatio = (lane + 0.5) / 4;
    const x = Phaser.Math.Linear(leftX, rightX, laneCenterRatio);

    return { x, y };
  }

  /**
   * 특정 y 좌표가 하이웨이 진행도상 어디쯤인지 계산한다.
   */
  private getHighwayProgressFromY(y: number) {
    return Phaser.Math.Clamp((y - highwayTopY) / (highwayBottomY - highwayTopY), 0, 1);
  }

  /**
   * 싱크 테스트에서는 가장 가까운 다음 노트 1개만 보여준다.
   * 여러 노트가 동시에 보이면 "한 박 앞선 노트"를 보고 치는 착시가 생겨 보정 테스트가 어려워진다.
   */
  private getSyncTestVisibleNotes(activeNotes: RuntimeNote[], currentTime: number) {
    const futureNotes = activeNotes
      .filter((note) => note.time >= currentTime)
      .sort((left, right) => left.time - right.time);

    if (futureNotes.length > 0) {
      return [futureNotes[0]];
    }

    return activeNotes.slice(0, 1);
  }

  /**
   * 레인별 노트 중심색을 다르게 주어 시각적으로 구분한다.
   */
  private getLaneNoteColor(lane: RhythmLane) {
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

  /**
   * 판정 종류별 대표 색상을 반환한다.
   */
  private getJudgementColor(judgement: string) {
    switch (judgement) {
      case "perfect":
        return "#ffd6ff";
      case "good":
        return "#c8f7ff";
      case "bad":
        return "#ffd89b";
      case "miss":
      default:
        return "#ff9cab";
    }
  }
}
