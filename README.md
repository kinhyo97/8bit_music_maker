# 8bit Loop Composer

A small open source 8-bit music maker built with React, Vite, and Tone.js.

You can:

- play built-in retro loop presets
- edit BPM, bars, key, and chords
- export loops as WAV
- generate `LoopSpec` JSON with GPT or Claude and import it directly into the app

## Demo Features

- Preset song library
- Step-grid style loop visualization
- AI-friendly import modal with prompt template and example JSON
- Local persistence for imported songs
- WAV export

## Getting Started

### Requirements

- Node.js 18+
- npm

### Install

```bash
npm install
```

### Run locally

```bash
npm run dev
```

Open the local URL shown by Vite, usually `http://localhost:5173`.

### Production build

```bash
npm run build
```

## AI Import Flow

The app supports importing music as `LoopSpec` JSON.

1. Open `Add to song list`
2. Copy the built-in AI prompt template
3. Paste it into GPT, Claude, or another LLM
4. Ask it to generate a loop
5. Paste the returned JSON into the import box
6. Listen immediately in the app

The importer is tolerant of some messy AI output and tries to clean:

- markdown code fences
- extra text before the first `{`
- extra text after the last `}`

## LoopSpec Shape

Imported loops follow this high-level structure:

```json
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
  "lead": [{ "bar": 1, "beat": 1, "note": "E5", "length": "8n" }],
  "bass": [{ "bar": 1, "beat": 1, "note": "C2", "length": "4n" }],
  "arp": [{ "bar": 1, "beat": 1, "note": "C5", "length": "16n" }],
  "drums": {
    "kick": [{ "bar": 1, "beat": 1 }],
    "snare": [{ "bar": 1, "beat": 2 }],
    "hat": [{ "bar": 1, "beat": 1.5 }]
  }
}
```

## Tech Stack

- React
- TypeScript
- Vite
- Tone.js
- Lucide React

## Contributing

Issues and pull requests are welcome.

Good first contribution ideas:

- new preset songs
- improved AI import cleanup
- MIDI import
- better mobile layout
- richer synth and drum voicing
- improved composer UX

## License

MIT
