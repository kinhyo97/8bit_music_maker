import { useEffect, useState } from "react";
import { createPlayEngineFromPlayableSong, type PlayEngine, type PlaySessionState } from "../game";
import { readStoredSyncOffsetMs, writeStoredSyncOffsetMs } from "../game/syncStorage";
import { createSyncTestPlayableSong } from "../game/testing/createSyncTestPlayableSong";
import { PhaserGameCanvas } from "./PhaserGameCanvas";

const syncStepMs = 30;

export const GameSyncTestRoute = () => {
  const [engine, setEngine] = useState<PlayEngine | null>(null);
  const [sessionState, setSessionState] = useState<PlaySessionState | null>(null);
  const [status, setStatus] = useState("싱크 테스트 곡을 준비 중입니다.");
  const [error, setError] = useState<string | null>(null);
  const [chartOffsetMs, setChartOffsetMs] = useState(() => readStoredSyncOffsetMs());

  useEffect(() => {
    let cancelled = false;
    let mountedEngine: PlayEngine | null = null;

    const boot = async () => {
      try {
        setStatus("메트로놈 싱크 테스트 오디오와 차트를 준비하는 중입니다.");
        const playableSong = await createSyncTestPlayableSong({
          bpm: 120,
          bars: 16,
          chartOffsetMs,
        });
        const nextEngine = await createPlayEngineFromPlayableSong(playableSong);
        mountedEngine = nextEngine;

        if (cancelled) {
          return;
        }

        setEngine(nextEngine);
        setSessionState(nextEngine.getState());
        setStatus("준비 완료. 드럼 클릭과 노트가 맞는지 확인하면서 오프셋을 조절하세요.");
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
      mountedEngine?.stop();
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

  const chart = engine?.getChart();

  if (error) {
    return (
      <main className="game-route-shell">
        <section className="game-route-panel">
          <h1>Game Sync Test</h1>
          <p className="game-route-error">{error}</p>
          <a className="ghost game-route-link" href="/">작곡기로 돌아가기</a>
        </section>
      </main>
    );
  }

  return (
    <main className="game-route-shell">
      <section className="game-route-panel">
        <div className="game-route-header">
          <div>
            <p className="game-route-eyebrow">Rhythm Sync Test</p>
            <h1>{chart?.title ?? "Game Sync Test"}</h1>
            <p className="game-route-status">{status}</p>
          </div>

          <div className="game-route-actions">
            <button
              className="primary"
              onClick={() => engine && void engine.start().then((nextState) => setSessionState({ ...nextState }))}
              disabled={!engine}
            >
              Start
            </button>
            <a className="ghost game-route-link" href="/game">Back To Game</a>
          </div>
        </div>

        <div className="game-route-meta">
          <span>Phase: {sessionState?.phase ?? "idle"}</span>
          <span>Time: {sessionState?.currentTime.toFixed(2) ?? "0.00"}s</span>
          <span>Score: {sessionState?.score.score ?? 0}</span>
          <span>Combo: {sessionState?.score.combo ?? 0}</span>
          <span>Accuracy: {sessionState ? `${(sessionState.score.accuracy * 100).toFixed(1)}%` : "0.0%"}</span>
          <span>Chart Offset: {chartOffsetMs > 0 ? `+${chartOffsetMs}` : chartOffsetMs}ms</span>
        </div>

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

        <div className="game-playfield">
          <PhaserGameCanvas engine={engine} onStateChange={setSessionState} mode="sync-test" />
        </div>

        <div className="game-feedback-strip">
          {(sessionState?.feedbackEvents ?? []).slice(-6).map((event, index) => (
            <span className="chip" key={`${event.type}-${index}-${event.time}`}>
              {event.type === "judgement" ? `${event.judgement.toUpperCase()} · lane ${event.lane + 1}` : "COMBO BREAK"}
            </span>
          ))}
        </div>

        <div className="game-help">
          <span>`Enter` 로 시작</span>
          <span>`D F J K` 로 4레인 입력</span>
          <span>싱크 테스트에서는 한 번에 한 노트만 떨어집니다.</span>
          <span>배경 음악 대신 메트로놈처럼 `탁탁` 클릭만 재생됩니다.</span>
          <span>오프셋을 줄이면 노트가 더 빨리 오고, 늘리면 더 늦게 옵니다.</span>
          <span>저장한 값은 로컬스토리지에 남아 다음 테스트 때 다시 불러올 수 있습니다.</span>
        </div>
      </section>
    </main>
  );
};
