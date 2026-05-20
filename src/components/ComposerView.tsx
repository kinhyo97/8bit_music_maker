import type { LoopSpec } from "../types/music";
import { PatternGrid } from "./PatternGrid";
import { TransportBar } from "./TransportBar";

type ComposerViewProps = {
  loop: LoopSpec;
  status: string;
  activeStep: number;
  isPlaying: boolean;
  loopEnabled: boolean;
  onTogglePlayback: () => void;
  onLoopToggle: () => void;
  onExportWav: () => void;
};

export function ComposerView({
  loop,
  status,
  activeStep,
  isPlaying,
  loopEnabled,
  onTogglePlayback,
  onLoopToggle,
  onExportWav,
}: ComposerViewProps) {
  return (
    <section className="composer">
      <header className="topbar">
        <div>
          <p>{loop.mood.join(" / ")}</p>
          <h1>{loop.title}</h1>
        </div>
        <span>{status}</span>
      </header>

      <TransportBar
        isPlaying={isPlaying}
        loopEnabled={loopEnabled}
        onTogglePlayback={onTogglePlayback}
        onLoopToggle={onLoopToggle}
        onExportWav={onExportWav}
      />

      <PatternGrid loop={loop} activeStep={activeStep} isPlaying={isPlaying} />
    </section>
  );
}
