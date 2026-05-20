const noteValues: Record<string, number> = {
  C: 0,
  "C#": 1,
  Db: 1,
  D: 2,
  "D#": 3,
  Eb: 3,
  E: 4,
  F: 5,
  "F#": 6,
  Gb: 6,
  G: 7,
  "G#": 8,
  Ab: 8,
  A: 9,
  "A#": 10,
  Bb: 10,
  B: 11,
};

const noteNames = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

const normalizeValue = (value: number) => ((value % 12) + 12) % 12;

const noteNameFromValue = (value: number, octave: number) => {
  const normalized = normalizeValue(value);
  const octaveOffset = Math.floor(value / 12);
  return `${noteNames[normalized]}${octave + octaveOffset}`;
};

const intervalsForChord = (quality: string) => {
  const lower = quality.toLowerCase();
  const minor = lower.startsWith("m") && !lower.startsWith("maj");
  const diminished = lower.includes("dim");
  const augmented = lower.includes("aug") || lower.includes("+");
  const dominant = /(^|[^a-z])7/.test(lower) && !lower.includes("maj7");
  const majorSeven = lower.includes("maj7") || lower.includes("maj9");

  const third = minor ? 3 : 4;
  const fifth = diminished ? 6 : augmented ? 8 : 7;
  const intervals = [0, third, fifth];

  if (majorSeven) {
    intervals.push(11);
  } else if (dominant || lower.includes("m7") || lower.includes("m9")) {
    intervals.push(10);
  }

  if (lower.includes("b9")) {
    intervals.push(13);
  } else if (lower.includes("9")) {
    intervals.push(14);
  }

  if (lower.includes("#11")) {
    intervals.push(18);
  }

  if (lower.includes("13")) {
    intervals.push(21);
  }

  return intervals;
};

export const splitChordSymbols = (chordText: string) =>
  chordText
    .split(/\s+/)
    .map((symbol) => symbol.trim())
    .filter(Boolean);

export const chordToNotes = (chordSymbol: string, octave = 4) => {
  const match = chordSymbol.match(/^([A-G](?:#|b)?)(.*)$/);

  if (!match) {
    return [];
  }

  const [, root, quality] = match;
  const rootValue = noteValues[root];

  if (rootValue === undefined) {
    return [];
  }

  return intervalsForChord(quality).map((interval) => noteNameFromValue(rootValue + interval, octave));
};
