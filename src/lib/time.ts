import type { DrumEvent } from "../types/music";

export const beatsPerBar = 4;
export const visualStepsPerBeat = 4;

export const getTotalSteps = (bars: number) => bars * beatsPerBar;

export const getTotalVisualSteps = (bars: number) => bars * beatsPerBar * visualStepsPerBeat;

export const getLoopSeconds = (bars: number, bpm: number) => bars * beatsPerBar * (60 / bpm);

export const timeToSeconds = (event: DrumEvent, bpm: number) =>
  ((event.bar - 1) * beatsPerBar + (event.beat - 1)) * (60 / bpm);

export const stepToPosition = (step: number) => {
  const bar = Math.floor(step / (beatsPerBar * visualStepsPerBeat)) + 1;
  const stepInBar = step % (beatsPerBar * visualStepsPerBeat);
  const beat = Math.floor(stepInBar / visualStepsPerBeat) + 1;
  const subdivision = stepInBar % visualStepsPerBeat;

  return { bar, beat, subdivision };
};

export const positionToStep = (bar: number, beat: number) =>
  Math.round(((bar - 1) * beatsPerBar + (beat - 1)) * visualStepsPerBeat);
