import { defaultSong } from "../../data/songLibrary";
import { createPlayEngineFromPlayableSong } from "../createPlayEngineFromPlayableSong";
import { EngineRunner } from "../EngineRunner";
import type { GameModeId } from "./gameModeConfig";
import { createSyncPlayableSongFromLoop } from "../testing/createSyncPlayableSongFromLoop";
import { createSyncTestPlayableSong } from "../testing/createSyncTestPlayableSong";

export type GameScenarioId = "pocket-arcade" | "metronome-sync-test";

export type GameScenarioSession = {
  mode: GameModeId;
  runner: EngineRunner;
};

export type GameScenarioDefinition = {
  id: GameScenarioId;
  routeTitle: string;
  eyebrow: string;
  backHref: string;
  backLabel: string;
  helpLines: string[];
  createSession: (chartOffsetMs: number) => Promise<GameScenarioSession>;
  getPreparingStatus: () => string;
  getReadyStatus: (chartOffsetMs: number) => string;
};

export const gameScenarios: Record<GameScenarioId, GameScenarioDefinition> = {
  "pocket-arcade": {
    id: "pocket-arcade",
    routeTitle: "Game Test",
    eyebrow: "Rhythm Engine Test",
    backHref: "/",
    backLabel: "Back",
    helpLines: [
      "`Enter` 로 시작",
      "`D F J K` 로 4레인 입력",
      "시작하면 4박 카운트인을 먼저 들려준 뒤 한 번에 한 노트씩 내려옵니다.",
    ],
    createSession: async (chartOffsetMs) => {
      const playableSong = await createSyncPlayableSongFromLoop(defaultSong.id, defaultSong.loop, {
        chartOffsetMs,
      });
      const engine = await createPlayEngineFromPlayableSong(playableSong);

      return {
        mode: "sync-test",
        runner: new EngineRunner(engine),
      };
    },
    getPreparingStatus: () => "기존 루프를 4박 카운트인 포함 포켓 아케이드 비트 차트로 변환하는 중입니다.",
    getReadyStatus: () => "준비 완료. 4박 카운트인 뒤에 저장된 싱크 오프셋 기준으로 한 박씩 테스트할 수 있습니다.",
  },
  "metronome-sync-test": {
    id: "metronome-sync-test",
    routeTitle: "Game Sync Test",
    eyebrow: "Rhythm Sync Test",
    backHref: "/game",
    backLabel: "Back To Game",
    helpLines: [
      "`Enter` 로 시작",
      "`D F J K` 로 4레인 입력",
      "싱크 테스트에서는 한 번에 한 노트만 떨어집니다.",
      "배경 음악 대신 메트로놈처럼 `탁탁` 클릭만 재생됩니다.",
      "오프셋을 줄이면 노트가 더 빨리 오고, 늘리면 더 늦게 옵니다.",
      "저장한 값은 로컬스토리지에 남아 다음 테스트 때 다시 불러올 수 있습니다.",
    ],
    createSession: async (chartOffsetMs) => {
      const playableSong = await createSyncTestPlayableSong({
        bpm: 120,
        bars: 16,
        chartOffsetMs,
      });
      const engine = await createPlayEngineFromPlayableSong(playableSong);

      return {
        mode: "sync-test",
        runner: new EngineRunner(engine),
      };
    },
    getPreparingStatus: () => "메트로놈 싱크 테스트 오디오와 차트를 준비하는 중입니다.",
    getReadyStatus: () => "준비 완료. 드럼 클릭과 노트가 맞는지 확인하면서 오프셋을 조절하세요.",
  },
};
