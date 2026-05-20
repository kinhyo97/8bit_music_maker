export type NoteEvent = {
  bar: number;
  beat: number;
  note: string;
  length: string;
};

export type DrumEvent = {
  bar: number;
  beat: number;
};

export type MelodicLane = "lead" | "bass" | "arp";

export type DrumLane = "kick" | "snare" | "hat";

export type PatternLane = "chord" | MelodicLane | DrumLane;

export type LeadInstrument = "square" | "sawtooth" | "triangle" | "pluck";
export type BassInstrument = "triangle" | "square";
export type ArpInstrument = "square" | "pulse" | "pluck";

export type LoopSpec = {
  title: string;
  mood: string[];
  bpm: number;
  key: string;
  scale: string;
  bars: number;
  timeSignature: "4/4";
  chords: string[];
  instruments: {
    lead: LeadInstrument;
    bass: BassInstrument;
    arp: ArpInstrument;
    drums: "noise";
  };
  lead: NoteEvent[];
  bass: NoteEvent[];
  arp: NoteEvent[];
  drums: Record<DrumLane, DrumEvent[]>;
};
