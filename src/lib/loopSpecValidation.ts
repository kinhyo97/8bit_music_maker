import { arpInstrumentIds, bassInstrumentIds, drumInstrumentIds, leadInstrumentIds } from "./instrumentRegistry";
import type { DrumEvent, LoopSpec, NoteEvent } from "../types/music";

// AI import나 외부 입력에서 들어온 값이 최소한 객체 형태인지 먼저 확인합니다.
const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

// mood, chords 같은 문자열 배열 필드 검증에 사용합니다.
const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === "string");

// lead, bass, arp 안에 들어가는 음표 이벤트 한 개가 올바른 구조인지 검사합니다.
const isNoteEvent = (value: unknown): value is NoteEvent =>
  isRecord(value) &&
  typeof value.bar === "number" &&
  typeof value.beat === "number" &&
  typeof value.note === "string" &&
  typeof value.length === "string";

// kick, snare, hat 안에 들어가는 드럼 이벤트 한 개가 올바른 구조인지 검사합니다.
const isDrumEvent = (value: unknown): value is DrumEvent =>
  isRecord(value) && typeof value.bar === "number" && typeof value.beat === "number";

// 문자열 값이 registry에 등록된 허용 목록 안에 있는지 확인합니다.
const isOneOf = <T extends string>(value: unknown, values: readonly T[]): value is T =>
  typeof value === "string" && values.includes(value as T);

// 재생 전에 LoopSpec 전체 구조를 검사해서 잘못된 JSON이 오디오 엔진까지 들어가지 않게 막습니다.
export const isLoopSpec = (value: unknown): value is LoopSpec => {
  if (!isRecord(value) || !isRecord(value.instruments) || !isRecord(value.drums)) {
    return false;
  }

  // 메타 데이터 검사
  const hasValidMeta =
    typeof value.title === "string" &&
    isStringArray(value.mood) &&
    typeof value.bpm === "number" &&
    Number.isFinite(value.bpm) &&
    typeof value.key === "string" &&
    typeof value.scale === "string" &&
    typeof value.bars === "number" &&
    Number.isFinite(value.bars) &&
    value.timeSignature === "4/4" &&
    isStringArray(value.chords);

    // 멜로디라인이 배열인지 검사
  const hasValidMelodicLanes =
    Array.isArray(value.lead) &&
    value.lead.every(isNoteEvent) &&
    Array.isArray(value.bass) &&
    value.bass.every(isNoteEvent) &&
    Array.isArray(value.arp) &&
    value.arp.every(isNoteEvent);

    //악기명이 맞는지검사
  const hasValidInstrumentSelection =
    isOneOf(value.instruments.lead, leadInstrumentIds) &&
    isOneOf(value.instruments.bass, bassInstrumentIds) &&
    isOneOf(value.instruments.arp, arpInstrumentIds) &&
    isOneOf(value.instruments.drums, drumInstrumentIds);

  const hasValidDrumLanes =
    Array.isArray(value.drums.kick) &&
    value.drums.kick.every(isDrumEvent) &&
    Array.isArray(value.drums.snare) &&
    value.drums.snare.every(isDrumEvent) &&
    Array.isArray(value.drums.hat) &&
    value.drums.hat.every(isDrumEvent);

  return hasValidMeta && hasValidMelodicLanes && hasValidInstrumentSelection && hasValidDrumLanes;
};

// 검사를 통과한 데이터도 제목, BPM, bars 같은 값은 한 번 더 안전한 범위로 정리합니다.
export const normalizeLoopSpec = (loop: LoopSpec): LoopSpec => ({
  ...loop,
  bpm: Math.min(180, Math.max(40, Math.round(loop.bpm || 84))),
  bars: loop.bars >= 8 ? 8 : 4,
  title: loop.title.trim() || "Untitled Loop",
  chords: loop.chords.map((chord) => chord.trim()).filter(Boolean),
});
