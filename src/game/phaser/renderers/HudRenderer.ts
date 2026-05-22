import Phaser from "phaser";
import { judgeTextY, sceneWidth } from "../playSceneLayout";
import type { PlaySessionState } from "../../types/session";

export class HudRenderer {
  private readonly scene: Phaser.Scene;
  private readonly hudScoreText: Phaser.GameObjects.Text;
  private readonly hudPhaseText: Phaser.GameObjects.Text;
  private readonly comboValueText: Phaser.GameObjects.Text;
  private readonly comboLabelText: Phaser.GameObjects.Text;
  private readonly accuracyText: Phaser.GameObjects.Text;
  private readonly judgementText: Phaser.GameObjects.Text;
  private readonly lifeValueText: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene, chartTitle: string) {
    this.scene = scene;
    this.scene.add.text(86, 28, chartTitle, {
      color: "#ffffff",
      fontFamily: "Arial",
      fontSize: "26px",
      fontStyle: "bold",
    });

    this.hudPhaseText = this.scene.add.text(88, 58, "Press Enter to Start", {
      color: "#b8c6d9",
      fontFamily: "Arial",
      fontSize: "16px",
    });

    this.hudScoreText = this.scene.add.text(34, 118, "0000000", {
      color: "#f8d8e7",
      fontFamily: "monospace",
      fontSize: "32px",
      fontStyle: "bold",
    });

    this.comboValueText = this.scene.add.text(830, 278, "0", {
      color: "#ffffff",
      fontFamily: "Arial",
      fontSize: "72px",
      fontStyle: "bold",
      stroke: "#26303f",
      strokeThickness: 8,
    });

    this.comboLabelText = this.scene.add.text(815, 350, "COMBO", {
      color: "#ffffff",
      fontFamily: "Arial",
      fontSize: "26px",
      fontStyle: "bold",
      stroke: "#26303f",
      strokeThickness: 6,
    });

    this.accuracyText = this.scene.add.text(774, 398, "100.0%", {
      color: "#d8f5ff",
      fontFamily: "Arial",
      fontSize: "18px",
      fontStyle: "bold",
    });

    this.judgementText = this.scene.add.text(sceneWidth / 2, judgeTextY, "READY", {
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

    this.lifeValueText = this.scene.add.text(807, 58, "1000/1000", {
      color: "#4fd877",
      fontFamily: "Arial",
      fontSize: "20px",
      fontStyle: "bold",
    });
  }

  renderState(state: PlaySessionState) {
    this.hudScoreText.setText(state.score.score.toString().padStart(7, "0"));
    this.hudPhaseText.setText(
      state.phase === "playing"
        ? `TIME ${state.currentTime.toFixed(2)}s`
        : state.phase === "finished"
          ? "FINISHED"
          : "Press Enter or Start",
    );
    this.comboValueText.setText(String(state.score.combo));
    this.comboLabelText.setText("COMBO");
    this.accuracyText.setText(`${(state.score.accuracy * 100).toFixed(1)}%`);
    this.lifeValueText.setText(`${Math.round(state.score.accuracy * 1000)}/1000`);

    const latestJudgement = [...state.feedbackEvents].reverse().find((event) => event.type === "judgement");
    if (latestJudgement?.type === "judgement") {
      this.judgementText.setText(latestJudgement.judgement.toUpperCase());
      this.judgementText.setColor(this.getJudgementColor(latestJudgement.judgement));
      return;
    }

    this.judgementText.setText(state.phase === "playing" ? "PLAYING" : "READY");
    this.judgementText.setColor("#ffd4f3");
  }

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
