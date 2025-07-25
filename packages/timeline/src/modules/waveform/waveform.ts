export const Waveform = {
  async generate(arrayBuffer: ArrayBuffer) {
    const audioCtx = new AudioContext();
    const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
    const rawData = audioBuffer.getChannelData(0);

    const blockSize = Math.floor(rawData.length / audioBuffer.sampleRate);
    const samples: number[] = [];

    for (let i = 0; i < audioBuffer.sampleRate; i++) {
      let sum = 0;
      for (let j = 0; j < blockSize; j++) {
        sum += Math.abs(rawData[i * blockSize + j]);
      }
      samples.push(sum / blockSize);
    }

    // Normalize waveform to 0..1
    const max = Math.max(...samples);
    return samples.map((v) => v / max);
  },
};
