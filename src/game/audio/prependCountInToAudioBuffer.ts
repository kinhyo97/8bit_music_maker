type PrependCountInToAudioBufferOptions = {
  bpm: number;
  leadInSeconds: number;
  countInBeats: number;
};

export const prependCountInToAudioBuffer = async (
  buffer: AudioBuffer,
  options: PrependCountInToAudioBufferOptions,
) => {
  const { bpm, leadInSeconds, countInBeats } = options;
  const secondsPerBeat = 60 / bpm;
  const countInDurationSeconds = countInBeats * secondsPerBeat;
  const totalDurationSeconds = leadInSeconds + countInDurationSeconds + buffer.duration;
  const offlineContext = new OfflineAudioContext(
    buffer.numberOfChannels,
    Math.ceil(totalDurationSeconds * buffer.sampleRate),
    buffer.sampleRate,
  );

  const source = offlineContext.createBufferSource();
  source.buffer = buffer;
  source.connect(offlineContext.destination);
  source.start(leadInSeconds + countInDurationSeconds);

  for (let beatIndex = 0; beatIndex < countInBeats; beatIndex += 1) {
    const clickTime = leadInSeconds + beatIndex * secondsPerBeat;
    const isAccent = beatIndex === 0;
    const oscillator = offlineContext.createOscillator();
    const gain = offlineContext.createGain();

    oscillator.type = isAccent ? "triangle" : "square";
    oscillator.frequency.setValueAtTime(isAccent ? 190 : 140, clickTime);

    gain.gain.setValueAtTime(0.0001, clickTime);
    gain.gain.exponentialRampToValueAtTime(isAccent ? 0.32 : 0.2, clickTime + 0.002);
    gain.gain.exponentialRampToValueAtTime(0.0001, clickTime + (isAccent ? 0.11 : 0.075));

    oscillator.connect(gain);
    gain.connect(offlineContext.destination);
    oscillator.start(clickTime);
    oscillator.stop(clickTime + (isAccent ? 0.12 : 0.08));
  }

  return offlineContext.startRendering();
};
