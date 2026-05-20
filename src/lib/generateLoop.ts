import { starterLoop } from "../data/presets";
import type { LoopSpec } from "../types/music";

export const makeTinyIdea = (prompt: string): LoopSpec => {
  const cleanPrompt = prompt.trim().toLowerCase();
  const rainy = cleanPrompt.includes("rain") || cleanPrompt.includes("비");
  const city = cleanPrompt.includes("city") || cleanPrompt.includes("도시");
  const bright = cleanPrompt.includes("bright") || cleanPrompt.includes("sun") || cleanPrompt.includes("밝");

  if (rainy) {
    return {
      ...starterLoop,
      title: "Rain Street Cartridge",
      mood: ["calm", "wet street", "reflective"],
      bpm: 76,
      key: "D minor",
      chords: ["Dm", "Bb", "F", "C"],
      lead: starterLoop.lead.map((event) => ({ ...event, note: event.note.replace("E", "F") })),
      bass: starterLoop.bass.map((event, index) => ({
        ...event,
        note: ["D2", "D2", "Bb1", "Bb1", "F2", "F2", "C2", "C2"][index] ?? event.note,
      })),
    };
  }

  if (city || bright) {
    return {
      ...starterLoop,
      title: bright ? "Pocket Sun Arcade" : "Neon Bus Stop",
      mood: bright ? ["bright", "dreamy", "romantic"] : ["city pop", "night", "waiting"],
      bpm: bright ? 104 : 92,
      key: "C major",
      scale: "major",
      chords: ["C", "Am", "F", "G"],
      lead: starterLoop.lead.map((event) => ({ ...event, note: event.note.replace("A", "C") })),
    };
  }

  return { ...starterLoop, title: prompt.trim() ? "GIF Mood Sketch" : starterLoop.title };
};
