type PolyOscillatorType = "square" | "sawtooth" | "triangle";

type TriggerInstrumentConfig =
  | {
      kind: "poly";
      oscillatorType: PolyOscillatorType;
      volume?: number;
    }
  | {
      kind: "pluck";
      volume?: number;
    };

type BassInstrumentConfig = {
  oscillatorType: "triangle" | "square";
};

export const leadInstrumentRegistry = {
  square: { kind: "poly", oscillatorType: "square" },
  sawtooth: { kind: "poly", oscillatorType: "sawtooth" },
  triangle: { kind: "poly", oscillatorType: "triangle" },
  pluck: { kind: "pluck", volume: 0.9 },
} as const satisfies Record<string, TriggerInstrumentConfig>;

export const bassInstrumentRegistry = {
  triangle: { oscillatorType: "triangle" },
  square: { oscillatorType: "square" },
} as const satisfies Record<string, BassInstrumentConfig>;

export const arpInstrumentRegistry = {
  square: { kind: "poly", oscillatorType: "square", volume: 0.82 },
  pulse: { kind: "poly", oscillatorType: "square", volume: 0.82 },
  pluck: { kind: "pluck", volume: 0.72 },
} as const satisfies Record<string, TriggerInstrumentConfig>;

export const drumInstrumentRegistry = {
  noise: { kind: "drumkit" },
} as const;

export const leadInstrumentIds = Object.keys(leadInstrumentRegistry) as Array<keyof typeof leadInstrumentRegistry>;
export const bassInstrumentIds = Object.keys(bassInstrumentRegistry) as Array<keyof typeof bassInstrumentRegistry>;
export const arpInstrumentIds = Object.keys(arpInstrumentRegistry) as Array<keyof typeof arpInstrumentRegistry>;
export const drumInstrumentIds = Object.keys(drumInstrumentRegistry) as Array<keyof typeof drumInstrumentRegistry>;

export type LeadInstrument = keyof typeof leadInstrumentRegistry;
export type BassInstrument = keyof typeof bassInstrumentRegistry;
export type ArpInstrument = keyof typeof arpInstrumentRegistry;
export type DrumInstrument = keyof typeof drumInstrumentRegistry;

export type { BassInstrumentConfig, PolyOscillatorType, TriggerInstrumentConfig };
