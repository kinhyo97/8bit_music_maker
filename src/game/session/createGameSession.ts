import { gameScenarios, type GameScenarioDefinition, type GameScenarioId, type GameScenarioSession } from "../modes/gameScenarios";

export type GameSession = GameScenarioSession;

export const getGameScenario = (scenarioId: GameScenarioId): GameScenarioDefinition => gameScenarios[scenarioId];

export const createGameSession = async (scenarioId: GameScenarioId, chartOffsetMs: number): Promise<GameSession> =>
  gameScenarios[scenarioId].createSession(chartOffsetMs);
