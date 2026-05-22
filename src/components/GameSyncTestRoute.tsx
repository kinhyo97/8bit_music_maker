import { useEffect, useState } from "react";
import type { EngineRunner } from "../game/EngineRunner";
import type { GameModeId } from "../game/modes/gameModeConfig";
import { gameScenarios } from "../game/modes/gameScenarios";
import { createGameSession } from "../game/session/createGameSession";
import type { PlaySessionState } from "../game/types/session";
import { readStoredSyncOffsetMs, writeStoredSyncOffsetMs } from "../game/syncStorage";
import { GameRouteShell } from "./GameRouteShell";
import { PhaserGameCanvas } from "./PhaserGameCanvas";

const syncStepMs = 30;

export const GameSyncTestRoute = () => {
  const scenario = gameScenarios["metronome-sync-test"];
  const [runner, setRunner] = useState<EngineRunner | null>(null);
  const [sessionState, setSessionState] = useState<PlaySessionState | null>(null);
  const [status, setStatus] = useState(scenario.getPreparingStatus());
  const [error, setError] = useState<string | null>(null);
  const [chartOffsetMs, setChartOffsetMs] = useState(() => readStoredSyncOffsetMs());
  const [mode, setMode] = useState<GameModeId>("sync-test");

  useEffect(() => {
    let cancelled = false;
    let mountedRunner: EngineRunner | null = null;

    const boot = async () => {
      try {
        setStatus(scenario.getPreparingStatus());
        const session = await createGameSession(scenario.id, chartOffsetMs);
        mountedRunner = session.runner;

        if (cancelled) {
          return;
        }

        setRunner(session.runner);
        setMode(session.mode);
        setSessionState(session.runner.getState());
        setStatus(scenario.getReadyStatus(chartOffsetMs));
      } catch (caughtError) {
        if (cancelled) {
          return;
        }

        setError(caughtError instanceof Error ? caughtError.message : "싱크 테스트 준비 중 알 수 없는 오류가 발생했습니다.");
      }
    };

    void boot();

    return () => {
      cancelled = true;
      mountedRunner?.stop();
    };
  }, [chartOffsetMs]);

  const handleSaveOffset = () => {
    writeStoredSyncOffsetMs(chartOffsetMs);
    setStatus(`현재 오프셋 ${chartOffsetMs}ms 를 로컬스토리지에 저장했습니다.`);
  };

  const handleLoadOffset = () => {
    const storedOffset = readStoredSyncOffsetMs();
    setChartOffsetMs(storedOffset);
    setStatus(`로컬스토리지에서 ${storedOffset}ms 값을 불러왔습니다.`);
  };

  const handleResetOffset = () => {
    setChartOffsetMs(0);
    setStatus("싱크 오프셋을 0ms로 되돌렸습니다.");
  };

  const chart = runner?.getChart();

  return (
    <GameRouteShell
      scenario={scenario}
      chartTitle={chart?.title}
      status={status}
      sessionState={sessionState}
      error={error}
      metaExtras={<span>Chart Offset: {chartOffsetMs > 0 ? `+${chartOffsetMs}` : chartOffsetMs}ms</span>}
      controls={
        <div className="game-sync-controls">
          <button className="ghost" onClick={() => setChartOffsetMs((current) => current - syncStepMs)}>
            Note Earlier {-syncStepMs}ms
          </button>
          <button className="ghost" onClick={() => setChartOffsetMs((current) => current + syncStepMs)}>
            Note Later +{syncStepMs}ms
          </button>
          <button className="ghost" onClick={handleResetOffset}>
            Offset Reset
          </button>
          <button className="ghost" onClick={handleSaveOffset}>
            Save Offset
          </button>
          <button className="ghost" onClick={handleLoadOffset}>
            Load Offset
          </button>
        </div>
      }
      onStart={() => runner && void runner.start().then((nextState) => setSessionState({ ...nextState }))}
      startDisabled={!runner}
      playfield={<PhaserGameCanvas runner={runner} onStateChange={setSessionState} mode={mode} />}
    />
  );
};
