import * as Tone from "tone";
import { createDrumKit } from "./drumKit";
import { getLoopSeconds, getTotalVisualSteps, timeToSeconds } from "../lib/time";
import { createArpInstrument, createBassSynth, createChordSynth, createLeadInstrument, createMasterChain } from "./instruments";
import { buildLoopPlaybackEvents, scheduleChordEvents, type TimedCallbackEvent } from "./loopEvents";
import type { LoopSpec } from "../types/music";

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
  const transport = Tone.getTransport();
  transport.stop();
  transport.cancel();
  disposables.sequence?.dispose();
  disposables.part?.dispose();
  disposables.synths.forEach((node) => node.dispose());
  disposables.sequence = null;
  disposables.part = null;
  disposables.synths = [];
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
  // 전역 재생 타이머 객체
  const transport = Tone.getTransport();
  // 오디오 타이밍에 맞춰 UI 업데이트를 안전하게 맞추는 객체
  const draw = Tone.getDraw();
  transport.bpm.value = loop.bpm;
  transport.loop = loopEnabled;
  transport.loopStart = 0;
  transport.loopEnd = loopSeconds;

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

  const events: TimedCallbackEvent[] = buildLoopPlaybackEvents({
    loop,
    triggerLead: lead.trigger,
    triggerBass: (note, duration, time) => bass.triggerAttackRelease(note, duration, time),
    triggerArp: arp.trigger,
    triggerChord: (notes, duration, time) => chord.synth.triggerAttackRelease(notes, duration, time),
    triggerKick: drums.triggerKick,
    triggerSnare: drums.triggerSnare,
    triggerHat: drums.triggerHat,
  });

  // 소리가 날 이벤트를 Transport에 등록
  disposables.part = new Tone.Part((time, callback) => callback(time), events).start(0);
  // 16n 간격으로 step 번호를 콜백에 넘겨줌
  disposables.sequence = new Tone.Sequence(
    (time, step) => {
      draw.schedule(() => onStep(step), time);
    },
    Array.from({ length: getTotalVisualSteps(loop.bars) }, (_, index) => index),
    "16n",
  ).start(0);

  // Tone.part 및 Tone.Sequence에 등록해둔 이벤트를 돌리는 스위치
  transport.start();
};

// 현재 루프를 실제 오디오 데이터로 미리 렌더링해서 AudioBuffer로 만드는 역할
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
