import { KeyboardEvent, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Square } from "lucide-react";
import type { LibrarySong } from "../data/songLibrary";
import { normalizeLoopSpec } from "../lib/loopSpecValidation";
import type { LoopSpec } from "../types/music";

type ControlPanelProps = {
  loop: LoopSpec;
  songs: LibrarySong[];
  onLoopChange: (loop: LoopSpec) => void;
  onSongLoad: (song: LibrarySong) => void;
  onSongImport: (rawLoop: string) => { ok: boolean; message: string };
};

const AI_IMPORT_PROMPT = `아래 규칙에 맞는 8-bit 음악 LoopSpec JSON만 생성해줘.
이 응답은 사람이 읽는 설명이 아니라 프로그램에 바로 붙여넣을 데이터야.
반드시 JSON 객체 하나만 출력해줘.
반드시 한 줄짜리 minified JSON으로 출력해줘.
설명 문장, 마크다운 코드펜스, 주석, 번호 목록, 제목, 배열 구간 분할, 중간 줄바꿈을 절대 넣지 마.
응답의 첫 글자는 { 여야 하고 마지막 글자는 } 여야 해.

조건:
- title: 곡 제목 문자열
- mood: 문자열 배열
- bpm: 숫자
- key: 예) "C major"
- scale: 예) "major", "natural minor"
- bars: 4 또는 8
- timeSignature: 반드시 "4/4"
- chords: 코드 이름 문자열 배열
- instruments.lead: "square" | "sawtooth" | "triangle" | "pluck"
- instruments.bass: "triangle" | "square"
- instruments.arp: "square" | "pulse" | "pluck"
- instruments.drums: 반드시 "noise"
- lead, bass, arp: { "bar": 숫자, "beat": 숫자, "note": "C5" 같은 문자열, "length": "16n" 같은 문자열 } 배열
- drums.kick, drums.snare, drums.hat: { "bar": 숫자, "beat": 숫자 } 배열

중요:
- JSON 최상위 키는 title, mood, bpm, key, scale, bars, timeSignature, chords, instruments, lead, bass, arp, drums 를 모두 포함해야 해.
- beat는 1, 1.25, 1.5, 1.75, 2, 2.25 같은 식으로 써도 돼.
- note는 "C4", "F#5", "Bb4" 같은 형식으로 써줘.
- length는 "16n", "8n", "4n", "2n" 중 하나를 우선 사용해줘.
- 유효한 JSON만 출력해줘.
- 코드블록 시작/끝의 \`\`\` 를 절대 넣지 마.
- JSON을 여러 덩어리로 나누지 말고 하나의 객체로 끝까지 이어서 출력해줘.
- 사람이 읽기 좋게 포맷팅하지 말고 기계가 읽기 좋게 compact JSON으로 출력해줘.

예시 형식:
{
  "title": "Example Loop",
  "mood": ["bright", "arcade"],
  "bpm": 128,
  "key": "C major",
  "scale": "major",
  "bars": 4,
  "timeSignature": "4/4",
  "chords": ["C", "G", "Am", "F"],
  "instruments": {
    "lead": "square",
    "bass": "triangle",
    "arp": "pulse",
    "drums": "noise"
  },
  "lead": [
    { "bar": 1, "beat": 1, "note": "E5", "length": "8n" },
    { "bar": 1, "beat": 2, "note": "G5", "length": "8n" }
  ],
  "bass": [
    { "bar": 1, "beat": 1, "note": "C2", "length": "4n" },
    { "bar": 1, "beat": 3, "note": "C3", "length": "4n" }
  ],
  "arp": [
    { "bar": 1, "beat": 1, "note": "C5", "length": "16n" },
    { "bar": 1, "beat": 1.5, "note": "E5", "length": "16n" }
  ],
  "drums": {
    "kick": [{ "bar": 1, "beat": 1 }],
    "snare": [{ "bar": 1, "beat": 2 }],
    "hat": [{ "bar": 1, "beat": 1.5 }]
  }
}

원하는 곡:
- 8비트 게임풍
- 밝고 중독성 있는 멜로디
- 코드 진행은 C, G, Am, F
- 4마디
- BPM 128

다시 강조:
JSON 객체 하나만, 한 줄로, 첫 글자 { 마지막 글자 } 로 끝내.`;

const AI_IMPORT_EXAMPLE = `{
  "title": "Pocket Start",
  "mood": ["bright", "arcade", "playful"],
  "bpm": 128,
  "key": "C major",
  "scale": "major",
  "bars": 4,
  "timeSignature": "4/4",
  "chords": ["C", "G", "Am", "F"],
  "instruments": {
    "lead": "square",
    "bass": "triangle",
    "arp": "pulse",
    "drums": "noise"
  },
  "lead": [
    { "bar": 1, "beat": 1, "note": "E5", "length": "8n" },
    { "bar": 1, "beat": 2, "note": "G5", "length": "8n" },
    { "bar": 1, "beat": 3, "note": "C6", "length": "8n" },
    { "bar": 1, "beat": 4, "note": "G5", "length": "8n" },
    { "bar": 2, "beat": 1, "note": "D5", "length": "8n" },
    { "bar": 2, "beat": 2, "note": "G5", "length": "8n" },
    { "bar": 2, "beat": 3, "note": "B5", "length": "8n" },
    { "bar": 2, "beat": 4, "note": "G5", "length": "8n" }
  ],
  "bass": [
    { "bar": 1, "beat": 1, "note": "C2", "length": "4n" },
    { "bar": 1, "beat": 3, "note": "C3", "length": "4n" },
    { "bar": 2, "beat": 1, "note": "G2", "length": "4n" },
    { "bar": 2, "beat": 3, "note": "G3", "length": "4n" }
  ],
  "arp": [
    { "bar": 1, "beat": 1, "note": "C5", "length": "16n" },
    { "bar": 1, "beat": 1.5, "note": "E5", "length": "16n" },
    { "bar": 1, "beat": 2, "note": "G5", "length": "16n" },
    { "bar": 2, "beat": 1, "note": "G4", "length": "16n" },
    { "bar": 2, "beat": 1.5, "note": "B4", "length": "16n" },
    { "bar": 2, "beat": 2, "note": "D5", "length": "16n" }
  ],
  "drums": {
    "kick": [
      { "bar": 1, "beat": 1 },
      { "bar": 1, "beat": 3 },
      { "bar": 2, "beat": 1 },
      { "bar": 2, "beat": 3 }
    ],
    "snare": [
      { "bar": 1, "beat": 2 },
      { "bar": 1, "beat": 4 },
      { "bar": 2, "beat": 2 },
      { "bar": 2, "beat": 4 }
    ],
    "hat": [
      { "bar": 1, "beat": 1.5 },
      { "bar": 1, "beat": 2.5 },
      { "bar": 1, "beat": 3.5 },
      { "bar": 1, "beat": 4.5 }
    ]
  }
}`;

export function ControlPanel({
  loop,
  songs,
  onLoopChange,
  onSongLoad,
  onSongImport,
}: ControlPanelProps) {
  const [bpmDraft, setBpmDraft] = useState(String(loop.bpm));
  const [barsDraft, setBarsDraft] = useState(String(loop.bars));
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [importDraft, setImportDraft] = useState("");
  const [importMessage, setImportMessage] = useState("LoopSpec JSON을 붙여넣으면 바로 들어볼 수 있어요.");
  const [importState, setImportState] = useState<"idle" | "success" | "error">("idle");
  const [templateMessage, setTemplateMessage] = useState("GPT나 Claude에 이 프롬프트를 그대로 넣어도 됩니다.");

  useEffect(() => {
    setBpmDraft(String(loop.bpm));
    setBarsDraft(String(loop.bars));
  }, [loop.bpm, loop.bars]);

  useEffect(() => {
    if (!isImportOpen) {
      return;
    }

    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsImportOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isImportOpen]);

  const handleImport = () => {
    const trimmed = importDraft.trim();

    if (!trimmed) {
      setImportState("error");
      setImportMessage("붙여넣을 JSON이 비어 있어요.");
      return;
    }

    const result = onSongImport(trimmed);
    setImportState(result.ok ? "success" : "error");
    setImportMessage(result.message);

    if (result.ok) {
      setIsImportOpen(false);
    }
  };

  const commitBpm = () => {
    const bpm = Number(bpmDraft);

    if (!Number.isFinite(bpm)) {
      setBpmDraft(String(loop.bpm));
      return;
    }

    onLoopChange(normalizeLoopSpec({ ...loop, bpm }));
  };

  const commitBars = () => {
    const bars = Number(barsDraft);

    if (!Number.isFinite(bars)) {
      setBarsDraft(String(loop.bars));
      return;
    }

    onLoopChange(normalizeLoopSpec({ ...loop, bars }));
  };

  const commitOnEnter = (event: KeyboardEvent<HTMLInputElement>, commit: () => void) => {
    if (event.key === "Enter") {
      event.currentTarget.blur();
      commit();
    }
  };

  const copyAiTemplate = async () => {
    try {
      await navigator.clipboard.writeText(AI_IMPORT_PROMPT);
      setTemplateMessage("AI 프롬프트를 복사했어요. GPT나 Claude에 바로 붙여넣으면 됩니다.");
    } catch {
      setTemplateMessage("복사에 실패했어요. 아래 텍스트를 직접 복사해서 사용해주세요.");
    }
  };

  const importModal = isImportOpen
    ? createPortal(
        <div className="modal-backdrop" onClick={() => setIsImportOpen(false)} role="presentation">
          <section
            className="import-modal"
            aria-label="Import score"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="song-library-header">
              <div className="panel-heading">Import score</div>
              <button className="ghost" type="button" onClick={() => setIsImportOpen(false)}>
                Close
              </button>
            </div>
            <section className="template-panel">
              <div className="song-library-header">
                <div className="panel-heading">AI Prompt Template</div>
                <button className="ghost" type="button" onClick={() => void copyAiTemplate()}>
                  Copy template
                </button>
              </div>
              <p className="template-message">{templateMessage}</p>
              <textarea className="template-textarea" readOnly value={AI_IMPORT_PROMPT} />
              <div className="song-library-header">
                <div className="panel-heading">Example JSON</div>
                <button className="ghost" type="button" onClick={() => setImportDraft(AI_IMPORT_EXAMPLE)}>
                  Use example
                </button>
              </div>
              <textarea className="template-textarea" readOnly value={AI_IMPORT_EXAMPLE} />
            </section>
            <label>
              LoopSpec JSON
              <textarea
                className="import-textarea"
                placeholder='{"title":"My Loop","mood":["bright"],"...":"..."}'
                value={importDraft}
                onChange={(event) => setImportDraft(event.target.value)}
              />
            </label>
            <div className="import-actions">
              <button className="ghost" type="button" onClick={() => setImportDraft(JSON.stringify(loop, null, 2))}>
                Use current loop
              </button>
              <button className="primary import-button" type="button" onClick={handleImport}>
                Add to song list
              </button>
            </div>
            <p className={`import-message ${importState}`}>{importMessage}</p>
          </section>
        </div>,
        document.body,
      )
    : null;

  return (
    <>
      <aside className="control-panel">
        <div className="brand">
          <Square size={18} />
          <span>8-bit Loop Composer</span>
        </div>

        <div className="field-grid">
          <label>
            BPM
            <input
              min="60"
              max="140"
              type="number"
              value={bpmDraft}
              onBlur={commitBpm}
              onChange={(event) => setBpmDraft(event.target.value)}
              onKeyDown={(event) => commitOnEnter(event, commitBpm)}
            />
          </label>
          <label>
            Bars
            <input
              min="4"
              max="8"
              step="4"
              type="number"
              value={barsDraft}
              onBlur={commitBars}
              onChange={(event) => setBarsDraft(event.target.value)}
              onKeyDown={(event) => commitOnEnter(event, commitBars)}
            />
          </label>
        </div>

        <label className="key-field">
          Key
          <input value={loop.key} onChange={(event) => onLoopChange({ ...loop, key: event.target.value })} />
        </label>

        <label className="chords-field">
          Chords
          <input
            value={loop.chords.join(", ")}
            onChange={(event) =>
              onLoopChange({
                ...loop,
                chords: event.target.value.split(",").map((item) => item.trim()),
              })
            }
          />
        </label>

        <section className="song-library">
          <div className="song-library-header">
            <div className="panel-heading">Song list</div>
            <button
              className="ghost song-import-trigger"
              type="button"
              onClick={() => {
                setImportState("idle");
                setImportMessage("LoopSpec JSON을 붙여넣으면 바로 들어볼 수 있어요.");
                setTemplateMessage("GPT나 Claude에 이 프롬프트를 그대로 넣어도 됩니다.");
                setIsImportOpen(true);
              }}
            >
              Add to song list
            </button>
          </div>
          <div className="song-list">
            {songs.map((song) => (
              <button
                className={`song-item ${song.loop.title === loop.title ? "selected" : ""}`}
                key={song.id}
                onClick={() => onSongLoad(song)}
              >
                <span>{song.loop.title}</span>
                <small>
                  {song.loop.bpm} BPM · {song.description}
                </small>
              </button>
            ))}
          </div>
        </section>
      </aside>
      {importModal}
    </>
  );
}
