import { useEffect, useState } from "react";
import type { EngineRunner } from "../game/EngineRunner";
import type { GameModeId } from "../game/modes/gameModeConfig";
import { gameScenarios } from "../game/modes/gameScenarios";
import { createGameSession } from "../game/session/createGameSession";
import type { PlaySessionState } from "../game/types/session";
import { readStoredSyncOffsetMs } from "../game/syncStorage";
import { GameRouteShell } from "./GameRouteShell";
import { PhaserGameCanvas } from "./PhaserGameCanvas";

export const GameTestRoute = () => {
  const scenario = gameScenarios["pocket-arcade"];
  const [runner, setRunner] = useState<EngineRunner | null>(null);
  const [sessionState, setSessionState] = useState<PlaySessionState | null>(null);
  const [status, setStatus] = useState(scenario.getPreparingStatus());
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<GameModeId>("sync-test");

  useEffect(() => {
    let cancelled = false;
    let mountedRunner: EngineRunner | null = null;

    const boot = async () => {
      try {
        setStatus(scenario.getPreparingStatus());
        const session = await createGameSession(scenario.id, readStoredSyncOffsetMs());
        mountedRunner = session.runner;

        if (cancelled) {
          return;
        }

        setRunner(session.runner);
        setMode(session.mode);
        setSessionState(session.runner.getState());
        setStatus(scenario.getReadyStatus(readStoredSyncOffsetMs()));
      } catch (caughtError) {
        if (cancelled) {
          return;
        }

        setError(caughtError instanceof Error ? caughtError.message : "게임 테스트 준비 중 알 수 없는 오류가 발생했습니다.");
      }
    };

    void boot();

    return () => {
      cancelled = true;
      mountedRunner?.stop();
    };
  }, []);

  const chart = runner?.getChart();

  return (
    <GameRouteShell
      scenario={scenario}
      chartTitle={chart?.title}
      status={status}
      sessionState={sessionState}
      error={error}
      onStart={() => runner && void runner.start().then((nextState) => setSessionState({ ...nextState }))}
      startDisabled={!runner}
      playfield={<PhaserGameCanvas runner={runner} onStateChange={setSessionState} mode={mode} />}
    />
  );
};
