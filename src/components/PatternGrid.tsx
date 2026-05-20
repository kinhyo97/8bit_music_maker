import { getTotalVisualSteps, positionToStep, stepToPosition } from "../lib/time";
import type { LoopSpec, PatternLane } from "../types/music";

const lanes: PatternLane[] = ["chord", "lead", "bass", "arp", "kick", "snare", "hat"];

type PatternGridProps = {
  loop: LoopSpec;
  activeStep: number;
  isPlaying: boolean;
};

export function PatternGrid({ loop, activeStep, isPlaying }: PatternGridProps) {
  const totalSteps = getTotalVisualSteps(loop.bars);

  const patternCells = (lane: PatternLane) =>
    Array.from({ length: totalSteps }, (_, step) => {
      const { bar, beat, subdivision } = stepToPosition(step);
      const found =
        lane === "chord"
          ? subdivision === 0 && beat === 1 && loop.chords[bar - 1]
          : lane === "kick" || lane === "snare" || lane === "hat"
          ? loop.drums[lane].some((event) => event.bar === bar && positionToStep(event.bar, event.beat) === step)
          : loop[lane].find((event) => event.bar === bar && positionToStep(event.bar, event.beat) === step);

      return (
        <div
          className={`step ${subdivision ? "substep" : ""} ${found ? `on ${lane}` : ""} ${
            activeStep === step && isPlaying ? "active" : ""
          }`}
          key={`${lane}-${step}`}
          title={`${lane} bar ${bar} beat ${beat}${subdivision ? ` + ${subdivision}/4` : ""}`}
        >
          {lane === "chord" && typeof found === "string"
            ? found
            : typeof found === "object" && "note" in found
              ? found.note.replace(/\d/, "")
              : ""}
        </div>
      );
    });

  return (
    <div className="timeline dense" style={{ gridTemplateColumns: `130px repeat(${totalSteps}, minmax(22px, 1fr))` }}>
      <div className="lane-label">Bar</div>
      {Array.from({ length: totalSteps }, (_, step) => (
        <div className="bar-cell" key={step}>
          {step % 16 === 0 ? Math.floor(step / 16) + 1 : ""}
        </div>
      ))}
      {lanes.map((lane) => (
        <div className="lane-row" key={lane} style={{ display: "contents" }}>
          <div className="lane-label">{lane}</div>
          {patternCells(lane)}
        </div>
      ))}
    </div>
  );
}
