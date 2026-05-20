// 루트 음 이름을 반음 단위 숫자로 바꿔서 코드 계산에 사용합니다.
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

// 계산이 끝난 숫자 값을 다시 음 이름으로 되돌릴 때 사용하는 기준표입니다.
const noteNames = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

// 음 계산 결과가 12를 넘어가거나 음수가 되어도 한 옥타브 안 값으로 되돌립니다.
const normalizeValue = (value: number) => ((value % 12) + 12) % 12;

// 반음 값과 옥타브를 합쳐 실제 Tone.js가 읽을 수 있는 note 문자열을 만듭니다.
const noteNameFromValue = (value: number, octave: number) => {
  const normalized = normalizeValue(value);
  const octaveOffset = Math.floor(value / 12);
  return `${noteNames[normalized]}${octave + octaveOffset}`;
};

// 코드 품질(maj7, m9, dim 등)을 읽어서 루트로부터 필요한 음 간격을 계산합니다.
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

// "Dm9 G13"처럼 한 마디에 공백으로 묶인 코드 문자열을 개별 심볼로 나눕니다.
export const splitChordSymbols = (chordText: string) =>
  chordText
    .split(/\s+/)
    .map((symbol) => symbol.trim())
    .filter(Boolean);

// 코드 문자열 하나를 실제 재생 가능한 note 배열로 바꿉니다.
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
