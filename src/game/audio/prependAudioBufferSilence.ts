export const prependAudioBufferSilence = (buffer: AudioBuffer, silenceSeconds: number) => {
  if (silenceSeconds <= 0) {
    return buffer;
  }

  const silenceFrameCount = Math.round(silenceSeconds * buffer.sampleRate);

  if (silenceFrameCount <= 0) {
    return buffer;
  }

  const nextBuffer = new AudioBuffer({
    length: buffer.length + silenceFrameCount,
    numberOfChannels: buffer.numberOfChannels,
    sampleRate: buffer.sampleRate,
  });

  for (let channelIndex = 0; channelIndex < buffer.numberOfChannels; channelIndex += 1) {
    const sourceChannel = buffer.getChannelData(channelIndex);
    const targetChannel = nextBuffer.getChannelData(channelIndex);
    targetChannel.set(sourceChannel, silenceFrameCount);
  }

  return nextBuffer;
};
