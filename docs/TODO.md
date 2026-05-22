# TODO

## Next Structural Work

- Refactor `src/components/PatternGrid.tsx` to stop hard-coding the lane list.
- Introduce lane metadata so label, color, visibility, and render strategy come from one place.
- Support hiding empty lanes like `arp` when a loop does not use them.
- Revisit `src/types/music.ts` if lane types expand beyond `lead`, `bass`, `arp`, `kick`, `snare`, `hat`.
- Consider moving from fixed `LoopSpec` lane fields to a more data-driven lane model only when new lane types are actually needed.

## Audio Consistency

- Reduce duplication between `scheduleToneLoop()` and `renderLoopToAudioBuffer()` in `src/audio/toneLoopEngine.ts`.
- Reuse `buildLoopPlaybackEvents()` or a shared scheduling layer for both live playback and WAV export.
- Make sure new instruments or lanes cannot drift between playback behavior and export behavior.

## App State

- Split app-level concerns in `src/App.tsx` if the file grows more.
- Good candidates to extract later:
  - song import parsing/sanitizing
  - user song persistence
  - playback controller logic
  - WAV export workflow

## Future Editing Features

- Do not start note editing until scope is defined.
- If editing starts later, decide first:
  - which lanes are editable
  - add/remove note rules
  - pitch selection UI
  - note length editing rules
  - live playback sync behavior while editing

## Instrument Expansion

- Keep using `src/lib/instrumentRegistry.ts` as the source of truth for instrument ids and config.
- If adding instruments stays within existing lane families, prefer extending the registry first.
- Only generalize the lane model if new instruments require truly new lane categories.

## Current Main Risk

- The biggest future scalability pressure is not the Tone engine itself.
- The biggest pressure point is the fixed lane model shared by:
  - `src/types/music.ts`
  - `src/components/PatternGrid.tsx`
  - `src/audio/loopEvents.ts`
  - `src/audio/toneLoopEngine.ts`

## Rhythm Game Follow-ups

- Extract a shared `useGameSession` hook so `GameTestRoute` and `GameSyncTestRoute` only declare scenario-specific state and controls.
- Keep pushing route-level strings and UI presets into `src/game/modes/gameScenarios.ts` so scenarios stay declarative.
- Expand `src/game/modes/gameModeConfig.ts` only for true render/presentation rules, and avoid mixing it with scenario bootstrapping concerns.
- Consider splitting `GameRouteShell` into smaller presentational parts if HUD/meta/feedback sections start evolving independently.
- Add a normal gameplay mode that reuses the same `EngineRunner`, renderer stack, and scenario system without relying on `sync-test` rendering rules.
- Add lightweight architecture notes or diagrams for the current rhythm-game flow: `scenario -> session factory -> EngineRunner -> PlayScene -> renderers`.
