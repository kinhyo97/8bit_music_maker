/**
 * 플레이 차트의 정적 데이터 구조를 정의한다.
 * 이 파일의 타입들은 에디터, AI 생성기, 게임엔진이 공통으로 참조하는 원본 차트 형태다.
 */
export type RhythmLane = 0 | 1 | 2 | 3;

// 노트가 어느 레인으로 들어가는지 나타내는 고정 4레인 식별자다.
export type RhythmNoteType = "tap" | "hold";

// 한 번 누르고 끝나는 탭 노트와, 누르고 유지해야 하는 홀드 노트만 지원한다.
export type RhythmDifficulty = "easy" | "normal" | "hard";

// 차트가 어떤 난이도 묶음에 속하는지 나타낸다.
export type RhythmChartNote = {
  id: string;
  lane: RhythmLane;
  time: number;
  type: RhythmNoteType;
  endTime?: number;
};

// 플레이 차트 안에 들어가는 개별 노트 정의다.
export type RhythmChart = {
  songId: string;
  title: string;
  bpm: number;
  offset: number;
  difficulty: RhythmDifficulty;
  notes: RhythmChartNote[];
};

// 실제 게임 한 판을 구성하는 차트 전체 데이터다.
