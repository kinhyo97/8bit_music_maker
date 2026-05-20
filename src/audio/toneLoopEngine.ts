import * as Tone from "tone";
import { createDrumKit } from "./drumKit";
import { chordToNotes, splitChordSymbols } from "../lib/chords";
import { getLoopSeconds, getTotalVisualSteps, timeToSeconds } from "../lib/time";
import type { ArpInstrument, LeadInstrument, LoopSpec } from "../types/music";

export type LoopPlayback = {
  start: () => void;
  stop: () => void;
};

export type ToneDisposables = {
  sequence: Tone.Sequence<number> | null;
  part: Tone.Part | null;
  synths: Tone.ToneAudioNode[];
};

export const createEmptyDisposables = (): ToneDisposables => ({
  sequence: null,
  part: null,
  synths: [],
});

export const disposeToneGraph = (disposables: ToneDisposables) => {
  Tone.Transport.stop();
  Tone.Transport.cancel();
  disposables.sequence?.dispose();
  disposables.part?.dispose();
  disposables.synths.forEach((node) => node.dispose());
  disposables.sequence = null;
  disposables.part = null;
  disposables.synths = [];
};

const createMasterChain = (volume = 0.72) => {
  const gain = new Tone.Gain(volume).toDestination();
  const limiter = new Tone.Limiter(-1).connect(gain);
  return { gain, limiter };
};

type TriggerInstrument = {
  nodes: Tone.ToneAudioNode[];
  trigger: (note: string, duration: string, time: number) => void;
};

const createPolyInstrument = (oscillatorType: "square" | "sawtooth" | "triangle", volume = 1): TriggerInstrument => {
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

const createLeadInstrument = (instrument: LeadInstrument): TriggerInstrument => {
  if (instrument === "pluck") {
    return createPluckInstrument(0.9);
  }

  return createPolyInstrument(instrument);
};

const createArpInstrument = (instrument: ArpInstrument): TriggerInstrument => {
  if (instrument === "pluck") {
    return createPluckInstrument(0.72);
  }

  return createPolyInstrument(instrument === "pulse" ? "square" : instrument, 0.82);
};

const createBassSynth = (oscillatorType: "triangle" | "square") =>
  new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: oscillatorType },
    envelope: { attack: 0.014, decay: 0.12, sustain: 0.42, release: 0.16 },
  });

const createChordSynth = () => {
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

const scheduleChordEvents = (
  loop: LoopSpec,
  callback: (time: number, notes: string[], duration: string) => void,
) => {
  loop.chords.slice(0, loop.bars).forEach((chordText, chordIndex) => {
    const symbols = splitChordSymbols(chordText);
    const duration = symbols.length > 1 ? "2n" : "1m";

    symbols.forEach((symbol, symbolIndex) => {
      const notes = chordToNotes(symbol, 4);

      if (!notes.length) {
        return;
      }

      const eventTime = timeToSeconds(
        {
          bar: chordIndex + 1,
          beat: symbolIndex === 0 ? 1 : 3,
        },
        loop.bpm,
      );

      callback(eventTime, notes, duration);
    });
  });
};

export const scheduleToneLoop = async (
  loop: LoopSpec,
  loopEnabled: boolean,
  onStep: (step: number) => void,
  disposables: ToneDisposables,
) => {
  await Tone.start();
  disposeToneGraph(disposables);

  const loopSeconds = getLoopSeconds(loop.bars, loop.bpm);
  Tone.Transport.bpm.value = loop.bpm;
  Tone.Transport.loop = loopEnabled;
  Tone.Transport.loopStart = 0;
  Tone.Transport.loopEnd = loopSeconds;

  const { gain, limiter } = createMasterChain();
  const lead = createLeadInstrument(loop.instruments.lead);
  lead.nodes[0].connect(limiter);
  const bass = createBassSynth(loop.instruments.bass).connect(limiter);
  const arp = createArpInstrument(loop.instruments.arp);
  arp.nodes[0].connect(limiter);
  const chord = createChordSynth();
  chord.gain.connect(limiter);
  const drums = createDrumKit(limiter);

  disposables.synths = [
    gain,
    limiter,
    ...lead.nodes,
    bass,
    ...arp.nodes,
    chord.gain,
    chord.filter,
    chord.synth,
    ...drums.nodes,
  ];

  const events: [number, (time: number) => void][] = [];
  scheduleChordEvents(loop, (eventTime, notes, duration) => {
    events.push([eventTime, (time) => chord.synth.triggerAttackRelease(notes, duration, time)]);
  });
  loop.lead.forEach((event) => {
    events.push([timeToSeconds(event, loop.bpm), (time) => lead.trigger(event.note, event.length, time)]);
  });
  loop.bass.forEach((event) => {
    events.push([timeToSeconds(event, loop.bpm), (time) => bass.triggerAttackRelease(event.note, event.length, time)]);
  });
  loop.arp.forEach((event) => {
    events.push([timeToSeconds(event, loop.bpm), (time) => arp.trigger(event.note, event.length, time)]);
  });
  loop.drums.kick.forEach((event) => {
    events.push([timeToSeconds(event, loop.bpm), (time) => drums.triggerKick(time)]);
  });
  loop.drums.snare.forEach((event) => {
    events.push([timeToSeconds(event, loop.bpm), (time) => drums.triggerSnare(time)]);
  });
  loop.drums.hat.forEach((event) => {
    events.push([timeToSeconds(event, loop.bpm), (time) => drums.triggerHat(time)]);
  });

  disposables.part = new Tone.Part((time, callback) => callback(time), events).start(0);
  disposables.sequence = new Tone.Sequence(
    (time, step) => {
      Tone.Draw.schedule(() => onStep(step), time);
    },
    Array.from({ length: getTotalVisualSteps(loop.bars) }, (_, index) => index),
    "16n",
  ).start(0);

  Tone.Transport.start();
};

export const renderLoopToAudioBuffer = async (loop: LoopSpec) => {
  const loopSeconds = getLoopSeconds(loop.bars, loop.bpm);
  const rendered = await Tone.Offline(async ({ transport }) => {
    const { limiter } = createMasterChain(0.75);
    const lead = createLeadInstrument(loop.instruments.lead);
    lead.nodes[0].connect(limiter);
    const bass = createBassSynth(loop.instruments.bass).connect(limiter);
    const arp = createArpInstrument(loop.instruments.arp);
    arp.nodes[0].connect(limiter);
    const chord = createChordSynth();
    chord.gain.connect(limiter);
    const drums = createDrumKit(limiter);

    transport.bpm.value = loop.bpm;
    scheduleChordEvents(loop, (eventTime, notes, duration) => chord.synth.triggerAttackRelease(notes, duration, eventTime));
    loop.lead.forEach((event) => lead.trigger(event.note, event.length, timeToSeconds(event, loop.bpm)));
    loop.bass.forEach((event) => bass.triggerAttackRelease(event.note, event.length, timeToSeconds(event, loop.bpm)));
    loop.arp.forEach((event) => arp.trigger(event.note, event.length, timeToSeconds(event, loop.bpm)));
    loop.drums.kick.forEach((event) => drums.triggerKick(timeToSeconds(event, loop.bpm)));
    loop.drums.snare.forEach((event) => drums.triggerSnare(timeToSeconds(event, loop.bpm)));
    loop.drums.hat.forEach((event) => drums.triggerHat(timeToSeconds(event, loop.bpm)));
    transport.start(0);
  }, loopSeconds);

  return rendered.get();
};
