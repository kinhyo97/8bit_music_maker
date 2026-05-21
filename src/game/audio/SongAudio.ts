export type SongAudio = {
  start: () => Promise<void> | void;
  pause: () => void;
  resume: () => Promise<void> | void;
  stop: () => void;
  getCurrentTime: () => number;
  getDuration: () => number;
  isPlaying: () => boolean;
};
