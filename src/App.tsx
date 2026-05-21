import { useCallback, useEffect, useRef, useState } from "react";
import {
  createEmptyDisposables,
  disposeToneGraph,
  renderLoopToAudioBuffer,
  scheduleToneLoop,
  type ToneDisposables,
} from "./audio/toneLoopEngine";
import { ComposerView } from "./components/ComposerView";
import { ControlPanel } from "./components/ControlPanel";
import { GameSyncTestRoute } from "./components/GameSyncTestRoute";
import { GameTestRoute } from "./components/GameTestRoute";
import { defaultSong, songLibrary, type LibrarySong } from "./data/songLibrary";
import { downloadBlob } from "./lib/download";
import { isLoopSpec, normalizeLoopSpec } from "./lib/loopSpecValidation";
import { encodeWav } from "./lib/wav";
import type { LoopSpec } from "./types/music";

const USER_SONGS_STORAGE_KEY = "8bit-music-maker:user-songs";

const sanitizeImportedLoopText = (rawLoop: string) => {
  const withoutCodeFences = rawLoop.replace(/```(?:json)?/gi, "").trim();
  const firstBrace = withoutCodeFences.indexOf("{");
  const lastBrace = withoutCodeFences.lastIndexOf("}");

  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    return withoutCodeFences;
  }

  return withoutCodeFences.slice(firstBrace, lastBrace + 1);
};

const parseStoredSongs = (): LibrarySong[] => {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const stored = window.localStorage.getItem(USER_SONGS_STORAGE_KEY);

    if (!stored) {
      return [];
    }

    const parsed: unknown = JSON.parse(stored);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.flatMap((item, index) => {
      if (
        typeof item !== "object" ||
        item === null ||
        typeof item.id !== "string" ||
        typeof item.description !== "string" ||
        !("loop" in item) ||
        !isLoopSpec(item.loop)
      ) {
        return [];
      }

      return [
        {
          id: item.id || `user-song-${index}`,
          description: item.description || "Imported JSON",
          loop: normalizeLoopSpec(item.loop),
        },
      ];
    });
  } catch {
    return [];
  }
};

function App() {
  if (typeof window !== "undefined" && (window.location.pathname === "/game/sync-test" || window.location.pathname === "/game/sink-test")) {
    return <GameSyncTestRoute />;
  }

  if (typeof window !== "undefined" && window.location.pathname === "/game") {
    return <GameTestRoute />;
  }

  const [loop, setLoop] = useState<LoopSpec>(defaultSong.loop);
  const [userSongs, setUserSongs] = useState<LibrarySong[]>(() => parseStoredSongs());
  const [isPlaying, setIsPlaying] = useState(false);
  const [loopEnabled, setLoopEnabled] = useState(true);
  const [activeStep, setActiveStep] = useState(0);
  const [status, setStatus] = useState("Ready");
  const [isRenderingWav, setIsRenderingWav] = useState(false);
  const toneDisposables = useRef<ToneDisposables>(createEmptyDisposables());
  const songs = [...songLibrary, ...userSongs];

  useEffect(() => () => disposeToneGraph(toneDisposables.current), []);

  useEffect(() => {
    window.localStorage.setItem(USER_SONGS_STORAGE_KEY, JSON.stringify(userSongs));
  }, [userSongs]);

  const stopLoop = useCallback(() => {
    disposeToneGraph(toneDisposables.current);
    setIsPlaying(false);
    setActiveStep(0);
    setStatus("Stopped");
  }, []);

  const updateLoop = (next: LoopSpec) => {
    const normalized = normalizeLoopSpec(next);
    setLoop(normalized);
    if (isPlaying) {
      stopLoop();
    }
  };

  const loadSong = (song: LibrarySong) => {
    updateLoop(song.loop);
    setStatus("Song loaded");
  };

  const importSong = useCallback(
    (rawLoop: string) => {
      try {
        const sanitized = sanitizeImportedLoopText(rawLoop);
        const parsed: unknown = JSON.parse(sanitized);

        if (!isLoopSpec(parsed)) {
          return {
            ok: false,
            message: "형식은 읽었지만 LoopSpec 구조가 아니에요. title, bpm, lead, bass, arp, drums 등을 확인해주세요.",
          };
        }

        const loopSpec = normalizeLoopSpec(parsed);
        const nextSong: LibrarySong = {
          id: `user-${Date.now()}`,
          description: "Imported JSON",
          loop: loopSpec,
        };

        setUserSongs((current) => [nextSong, ...current]);
        updateLoop(loopSpec);
        setStatus("Imported and loaded");

        return {
          ok: true,
          message: `"${loopSpec.title}" added to song list.`,
        };
      } catch {
        return {
          ok: false,
          message: "JSON 파싱에 실패했어요. 쉼표/괄호를 확인하고, JSON 바깥 설명 문장은 빼주세요.",
        };
      }
    },
    [updateLoop],
  );

  const playLoop = useCallback(async () => {
    if (isPlaying) {
      stopLoop();
    }

    try {
      await scheduleToneLoop(loop, loopEnabled, setActiveStep, toneDisposables.current);
      setIsPlaying(true);
      setStatus("Playing");
    } catch {
      setStatus("Playback failed");
      setIsPlaying(false);
    }
  }, [isPlaying, loop, loopEnabled, stopLoop]);

  const togglePlayback = useCallback(() => {
    if (isPlaying) {
      stopLoop();
      return;
    }

    void playLoop();
  }, [isPlaying, playLoop, stopLoop]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const isTyping =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement ||
        target?.isContentEditable;

      if (event.code !== "Space" || isTyping) {
        return;
      }

      event.preventDefault();
      togglePlayback();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [togglePlayback]);

  const exportWav = async () => {
    if (isRenderingWav) {
      return;
    }

    setIsRenderingWav(true);
    setStatus("Rendering WAV");

    try {
      const audioBuffer = await renderLoopToAudioBuffer(loop);

      if (!audioBuffer) {
        setStatus("WAV render failed");
        return;
      }

      downloadBlob(encodeWav(audioBuffer), `${loop.title}.wav`);
      setStatus("WAV exported");
    } catch {
      setStatus("WAV render failed");
    } finally {
      setIsRenderingWav(false);
    }
  };

  return (
    <main className="app-shell">
      <section className="workspace">
        <ControlPanel
          loop={loop}
          songs={songs}
          onLoopChange={updateLoop}
          onSongLoad={loadSong}
          onSongImport={importSong}
        />

        <ComposerView
          loop={loop}
          status={status}
          activeStep={activeStep}
          isPlaying={isPlaying}
          loopEnabled={loopEnabled}
          onTogglePlayback={togglePlayback}
          onLoopToggle={() => setLoopEnabled((value) => !value)}
          onExportWav={exportWav}
        />
      </section>
    </main>
  );
}

export default App;
