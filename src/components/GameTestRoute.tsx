import { useEffect, useState } from "react";
import { defaultSong } from "../data/songLibrary";
import { createPlayEngineFromPlayableSong, type PlayEngine, type PlaySessionState } from "../game";
import { readStoredSyncOffsetMs } from "../game/syncStorage";
import { createPlayableSongFromLoop } from "../game/testing/createPlayableSongFromLoop";
import { PhaserGameCanvas } from "./PhaserGameCanvas";

export const GameTestRoute = () => {
  const [engine, setEngine] = useState<PlayEngine | null>(null);
  const [sessionState, setSessionState] = useState<PlaySessionState | null>(null);
  const [status, setStatus] = useState("게임 테스트 곡을 준비 중입니다.");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let mountedEngine: PlayEngine | null = null;

    const boot = async () => {
      try {
        setStatus("기존 루프를 게임 테스트용 오디오와 차트로 변환하는 중입니다.");
        const playableSong = await createPlayableSongFromLoop(defaultSong.id, defaultSong.loop, {
          chartOffsetMs: readStoredSyncOffsetMs(),
        });
        const nextEngine = await createPlayEngineFromPlayableSong(playableSong);
        mountedEngine = nextEngine;

        if (cancelled) {
          return;
        }

        setEngine(nextEngine);
        setSessionState(nextEngine.getState());
        setStatus("준비 완료. 저장된 싱크 오프셋을 적용한 상태로 테스트할 수 있습니다.");
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
      mountedEngine?.stop();
    };
  }, []);

  const chart = engine?.getChart();

  if (error) {
    return (
      <main className="game-route-shell">
        <section className="game-route-panel">
          <h1>Game Test</h1>
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
            <p className="game-route-eyebrow">Rhythm Engine Test</p>
            <h1>{chart?.title ?? "Game Test"}</h1>
            <p className="game-route-status">{status}</p>
          </div>

          <div className="game-route-actions">
            <button className="primary" onClick={() => engine && void engine.start().then((nextState) => setSessionState({ ...nextState }))} disabled={!engine}>
              Start
            </button>
            <a className="ghost game-route-link" href="/">Back</a>
          </div>
        </div>

        <div className="game-route-meta">
          <span>Phase: {sessionState?.phase ?? "idle"}</span>
          <span>Time: {sessionState?.currentTime.toFixed(2) ?? "0.00"}s</span>
          <span>Score: {sessionState?.score.score ?? 0}</span>
          <span>Combo: {sessionState?.score.combo ?? 0}</span>
          <span>Accuracy: {sessionState ? `${(sessionState.score.accuracy * 100).toFixed(1)}%` : "0.0%"}</span>
        </div>

        <div className="game-playfield">
          <PhaserGameCanvas engine={engine} onStateChange={setSessionState} />
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
          <span>현재는 Phaser 플레이필드 위에서 기존 루프 기반 테스트 차트를 검증 중입니다.</span>
        </div>
      </section>
    </main>
  );
};
