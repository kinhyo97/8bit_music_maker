import type { ReactNode } from "react";
import type { GameScenarioDefinition } from "../game/modes/gameScenarios";
import type { PlaySessionState } from "../game/types/session";

type GameRouteShellProps = {
  scenario: GameScenarioDefinition;
  chartTitle?: string;
  status: string;
  sessionState: PlaySessionState | null;
  error?: string | null;
  metaExtras?: ReactNode;
  controls?: ReactNode;
  playfield: ReactNode;
  onStart?: () => void;
  startDisabled?: boolean;
};

export const GameRouteShell = ({
  scenario,
  chartTitle,
  status,
  sessionState,
  error,
  metaExtras,
  controls,
  playfield,
  onStart,
  startDisabled,
}: GameRouteShellProps) => {
  if (error) {
    return (
      <main className="game-route-shell">
        <section className="game-route-panel">
          <h1>{scenario.routeTitle}</h1>
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
            <p className="game-route-eyebrow">{scenario.eyebrow}</p>
            <h1>{chartTitle ?? scenario.routeTitle}</h1>
            <p className="game-route-status">{status}</p>
          </div>

          <div className="game-route-actions">
            <button className="primary" onClick={onStart} disabled={startDisabled}>
              Start
            </button>
            <a className="ghost game-route-link" href={scenario.backHref}>{scenario.backLabel}</a>
          </div>
        </div>

        <div className="game-route-meta">
          <span>Phase: {sessionState?.phase ?? "idle"}</span>
          <span>Time: {sessionState?.currentTime.toFixed(2) ?? "0.00"}s</span>
          <span>Score: {sessionState?.score.score ?? 0}</span>
          <span>Combo: {sessionState?.score.combo ?? 0}</span>
          <span>Accuracy: {sessionState ? `${(sessionState.score.accuracy * 100).toFixed(1)}%` : "0.0%"}</span>
          {metaExtras}
        </div>

        {controls}

        <div className="game-playfield">{playfield}</div>

        <div className="game-feedback-strip">
          {(sessionState?.feedbackEvents ?? []).slice(-6).map((event, index) => (
            <span className="chip" key={`${event.type}-${index}-${event.time}`}>
              {event.type === "judgement" ? `${event.judgement.toUpperCase()} · lane ${event.lane + 1}` : "COMBO BREAK"}
            </span>
          ))}
        </div>

        <div className="game-help">
          {scenario.helpLines.map((line) => (
            <span key={line}>{line}</span>
          ))}
        </div>
      </section>
    </main>
  );
};
