import * as Tone from "tone";

export type DrumKit = {
  nodes: Tone.ToneAudioNode[];
  triggerKick: (time: number) => void;
  triggerSnare: (time: number) => void;
  triggerHat: (time: number) => void;
};

export const createDrumKit = (destination: Tone.ToneAudioNode): DrumKit => {
  const drumBus = new Tone.Gain(0.96);
  const drumDrive = new Tone.Distortion(0.12);
  const drumCompressor = new Tone.Compressor({
    threshold: -18,
    ratio: 4,
    attack: 0.004,
    release: 0.08,
  });
  drumBus.chain(drumDrive, drumCompressor, destination);

  const kickBus = new Tone.Gain(1.55).connect(drumBus);
  const clickBus = new Tone.Gain(0.5).connect(drumBus);
  const snareBus = new Tone.Gain(1.16).connect(drumBus);
  const snareSnapBus = new Tone.Gain(0.42).connect(drumBus);
  const hatBus = new Tone.Gain(0.62).connect(drumBus);

  const kickBody = new Tone.MembraneSynth({
    pitchDecay: 0.06,
    octaves: 8,
    oscillator: { type: "sine" },
    envelope: { attack: 0.001, decay: 0.3, sustain: 0, release: 0.07 },
  }).connect(kickBus);
  const kickSub = new Tone.Synth({
    oscillator: { type: "sine" },
    envelope: { attack: 0.001, decay: 0.18, sustain: 0.08, release: 0.09 },
  }).connect(kickBus);
  const kickPunch = new Tone.Synth({
    oscillator: { type: "triangle" },
    envelope: { attack: 0.001, decay: 0.075, sustain: 0, release: 0.026 },
  }).connect(kickBus);
  const kickKnockFilter = new Tone.Filter({
    frequency: 170,
    Q: 1.2,
    type: "bandpass",
  }).connect(kickBus);
  const kickKnock = new Tone.Synth({
    oscillator: { type: "square" },
    envelope: { attack: 0.001, decay: 0.038, sustain: 0, release: 0.015 },
  }).connect(kickKnockFilter);

  const kickClickFilter = new Tone.Filter({
    frequency: 4300,
    type: "highpass",
    rolloff: -24,
  }).connect(clickBus);
  const kickClick = new Tone.NoiseSynth({
    noise: { type: "white" },
    envelope: { attack: 0.001, decay: 0.012, sustain: 0, release: 0.006 },
  }).connect(kickClickFilter);

  const snareNoiseFilter = new Tone.Filter({
    frequency: 2100,
    Q: 1.1,
    type: "bandpass",
  }).connect(snareBus);
  const snareNoise = new Tone.NoiseSynth({
    noise: { type: "white" },
    envelope: { attack: 0.002, decay: 0.13, sustain: 0, release: 0.045 },
  }).connect(snareNoiseFilter);
  const snareBody = new Tone.Synth({
    oscillator: { type: "triangle" },
    envelope: { attack: 0.001, decay: 0.09, sustain: 0, release: 0.035 },
  }).connect(snareBus);
  const snareSnapFilter = new Tone.Filter({
    frequency: 5600,
    type: "highpass",
    rolloff: -24,
  }).connect(snareSnapBus);
  const snareSnap = new Tone.NoiseSynth({
    noise: { type: "white" },
    envelope: { attack: 0.001, decay: 0.028, sustain: 0, release: 0.012 },
  }).connect(snareSnapFilter);

  const hatFilter = new Tone.Filter({
    frequency: 5000,
    type: "highpass",
    rolloff: -24,
  }).connect(hatBus);
  const hat = new Tone.NoiseSynth({
    noise: { type: "white" },
    envelope: { attack: 0.001, decay: 0.052, sustain: 0, release: 0.02 },
  }).connect(hatFilter);

  return {
    nodes: [
      drumBus,
      drumDrive,
      drumCompressor,
      kickBus,
      clickBus,
      snareBus,
      snareSnapBus,
      hatBus,
      kickBody,
      kickSub,
      kickPunch,
      kickKnockFilter,
      kickKnock,
      kickClickFilter,
      kickClick,
      snareNoiseFilter,
      snareNoise,
      snareBody,
      snareSnapFilter,
      snareSnap,
      hatFilter,
      hat,
    ],
    triggerKick: (time: number) => {
      kickBody.triggerAttackRelease("D1", "8n", time);
      kickSub.triggerAttackRelease("D1", "8n", time + 0.004);
      kickPunch.triggerAttackRelease("A1", "32n", time + 0.002);
      kickKnock.triggerAttackRelease("D2", "64n", time + 0.001);
      kickClick.triggerAttackRelease("64n", time + 0.001);
    },
    triggerSnare: (time: number) => {
      snareNoise.triggerAttackRelease("16n", time);
      snareBody.triggerAttackRelease("D3", "16n", time);
      snareSnap.triggerAttackRelease("64n", time + 0.002);
    },
    triggerHat: (time: number) => {
      hat.triggerAttackRelease("16n", time);
    },
  };
};
