import * as Tone from "tone";
import {
  arpInstrumentRegistry,
  bassInstrumentRegistry,
  leadInstrumentRegistry,
  type ArpInstrument,
  type BassInstrumentConfig,
  type BassInstrument,
  type LeadInstrument,
  type TriggerInstrumentConfig,
} from "../lib/instrumentRegistry";

/**
 * 악기를 준비하는 코드
 */

export type TriggerInstrument = {
  nodes: Tone.ToneAudioNode[];
  trigger: (note: string, duration: string, time: number) => void;
};

export const createMasterChain = (volume = 0.72) => {
  const gain = new Tone.Gain(volume).toDestination();
  const limiter = new Tone.Limiter(-1).connect(gain);
  return { gain, limiter };
};

const createPolyInstrument = (
  oscillatorType: "square" | "sawtooth" | "triangle",
  volume = 1,
): TriggerInstrument => {
  const gain = new Tone.Gain(volume);
  const synth = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: oscillatorType },
    envelope: { attack: 0.012, decay: 0.08, sustain: 0.24, release: 0.11 },
  }).connect(gain);

  return {
    nodes: [gain, synth],
    trigger: (note, duration, time) => synth.triggerAttackRelease(note, duration, time),
  };
};

const createPluckInstrument = (volume = 0.95): TriggerInstrument => {
  let voiceIndex = 0;
  const gain = new Tone.Gain(volume);
  const filter = new Tone.Filter({
    frequency: 3400,
    type: "lowpass",
    rolloff: -12,
  }).connect(gain);
  const voices = Array.from({ length: 10 }, () =>
    new Tone.PluckSynth({
      attackNoise: 0.7,
      dampening: 3600,
      resonance: 0.88,
    }).connect(filter),
  );

  return {
    nodes: [gain, filter, ...voices],
    trigger: (note, _duration, time) => {
      voices[voiceIndex].triggerAttack(note, time);
      voiceIndex = (voiceIndex + 1) % voices.length;
    },
  };
};

const createTriggerInstrumentFromConfig = (config: TriggerInstrumentConfig): TriggerInstrument => {
  if (config.kind === "pluck") {
    return createPluckInstrument(config.volume);
  }

  return createPolyInstrument(config.oscillatorType, config.volume);
};

const createBassSynthFromConfig = (config: BassInstrumentConfig) =>
  new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: config.oscillatorType },
    envelope: { attack: 0.014, decay: 0.12, sustain: 0.42, release: 0.16 },
  });

export const createLeadInstrument = (instrument: LeadInstrument): TriggerInstrument => {
  return createTriggerInstrumentFromConfig(leadInstrumentRegistry[instrument]);
};

export const createArpInstrument = (instrument: ArpInstrument): TriggerInstrument => {
  return createTriggerInstrumentFromConfig(arpInstrumentRegistry[instrument]);
};

export const createBassSynth = (instrument: BassInstrument) => createBassSynthFromConfig(bassInstrumentRegistry[instrument]);

export const createChordSynth = () => {
  const gain = new Tone.Gain(0.16);
  const filter = new Tone.Filter({
    frequency: 1800,
    type: "lowpass",
    rolloff: -12,
  }).connect(gain);
  const synth = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: "square" },
    envelope: { attack: 0.018, decay: 0.12, sustain: 0.18, release: 0.18 },
  }).connect(filter);

  return { gain, filter, synth };
};
