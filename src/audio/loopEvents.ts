import { chordToNotes, splitChordSymbols } from "../lib/chords";
import { timeToSeconds } from "../lib/time";
import type { LoopSpec } from "../types/music";

/**
 * 악보를 시간표로 만드는 코드
 */

export type TimedCallbackEvent = [number, (time: number) => void];

export const scheduleChordEvents = (
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

type BuildLoopPlaybackEventsArgs = {
  loop: LoopSpec;
  triggerLead: (note: string, duration: string, time: number) => void;
  triggerBass: (note: string, duration: string, time: number) => void;
  triggerArp: (note: string, duration: string, time: number) => void;
  triggerChord: (notes: string[], duration: string, time: number) => void;
  triggerKick: (time: number) => void;
  triggerSnare: (time: number) => void;
  triggerHat: (time: number) => void;
};

export const buildLoopPlaybackEvents = ({
  loop,
  triggerLead,
  triggerBass,
  triggerArp,
  triggerChord,
  triggerKick,
  triggerSnare,
  triggerHat,
}: BuildLoopPlaybackEventsArgs): TimedCallbackEvent[] => {
  const events: TimedCallbackEvent[] = [];

  scheduleChordEvents(loop, (eventTime, notes, duration) => {
    events.push([eventTime, (time) => triggerChord(notes, duration, time)]);
  });
  loop.lead.forEach((event) => {
    events.push([timeToSeconds(event, loop.bpm), (time) => triggerLead(event.note, event.length, time)]);
  });
  loop.bass.forEach((event) => {
    events.push([timeToSeconds(event, loop.bpm), (time) => triggerBass(event.note, event.length, time)]);
  });
  loop.arp.forEach((event) => {
    events.push([timeToSeconds(event, loop.bpm), (time) => triggerArp(event.note, event.length, time)]);
  });
  loop.drums.kick.forEach((event) => {
    events.push([timeToSeconds(event, loop.bpm), (time) => triggerKick(time)]);
  });
  loop.drums.snare.forEach((event) => {
    events.push([timeToSeconds(event, loop.bpm), (time) => triggerSnare(time)]);
  });
  loop.drums.hat.forEach((event) => {
    events.push([timeToSeconds(event, loop.bpm), (time) => triggerHat(time)]);
  });

  return events;
};
