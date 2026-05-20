import type { DrumEvent, LoopSpec, NoteEvent } from "../types/music";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === "string");

const isNoteEvent = (value: unknown): value is NoteEvent =>
  isRecord(value) &&
  typeof value.bar === "number" &&
  typeof value.beat === "number" &&
  typeof value.note === "string" &&
  typeof value.length === "string";

const isDrumEvent = (value: unknown): value is DrumEvent =>
  isRecord(value) && typeof value.bar === "number" && typeof value.beat === "number";

const isOneOf = <T extends string>(value: unknown, values: readonly T[]): value is T =>
  typeof value === "string" && values.includes(value as T);

export const isLoopSpec = (value: unknown): value is LoopSpec => {
  if (!isRecord(value) || !isRecord(value.instruments) || !isRecord(value.drums)) {
    return false;
  }

  return (
    typeof value.title === "string" &&
    isStringArray(value.mood) &&
    typeof value.bpm === "number" &&
    Number.isFinite(value.bpm) &&
    typeof value.key === "string" &&
    typeof value.scale === "string" &&
    typeof value.bars === "number" &&
    Number.isFinite(value.bars) &&
    value.timeSignature === "4/4" &&
    isStringArray(value.chords) &&
    Array.isArray(value.lead) &&
    value.lead.every(isNoteEvent) &&
    Array.isArray(value.bass) &&
    value.bass.every(isNoteEvent) &&
    Array.isArray(value.arp) &&
    value.arp.every(isNoteEvent) &&
    isOneOf(value.instruments.lead, ["square", "sawtooth", "triangle", "pluck"]) &&
    isOneOf(value.instruments.bass, ["triangle", "square"]) &&
    isOneOf(value.instruments.arp, ["square", "pulse", "pluck"]) &&
    value.instruments.drums === "noise" &&
    Array.isArray(value.drums.kick) &&
    value.drums.kick.every(isDrumEvent) &&
    Array.isArray(value.drums.snare) &&
    value.drums.snare.every(isDrumEvent) &&
    Array.isArray(value.drums.hat) &&
    value.drums.hat.every(isDrumEvent)
  );
};

export const normalizeLoopSpec = (loop: LoopSpec): LoopSpec => ({
  ...loop,
  bpm: Math.min(180, Math.max(40, Math.round(loop.bpm || 84))),
  bars: loop.bars >= 8 ? 8 : 4,
  title: loop.title.trim() || "Untitled Loop",
  chords: loop.chords.map((chord) => chord.trim()).filter(Boolean),
});
