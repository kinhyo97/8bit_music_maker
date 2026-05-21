import type { RhythmLane } from "../types/chart";
import type { RuntimeNote } from "../types/note";

/**
 * 특정 레인에서 아직 판정 가능한 가장 앞 노트를 찾는다.
 * 시간순으로 정렬된 activeNotes를 전제로 하며, 판정 가능한 상태만 대상으로 삼는다.
 */
export const findFirstJudgeableNote = (activeNotes: RuntimeNote[], lane: RhythmLane) =>
  activeNotes.find((note) => note.lane === lane && (note.state === "active" || note.state === "holding"));

/**
 * 아직 화면에서 관리해야 하는 노트만 남긴다.
 * hit 이후 홀드가 끝난 노트나 miss 처리된 노트는 completed 쪽으로 보내기 전에 여기서 걸러낼 수 있다.
 */
export const filterLiveNotes = (activeNotes: RuntimeNote[]) =>
  activeNotes.filter((note) => note.state === "active" || note.state === "holding");
