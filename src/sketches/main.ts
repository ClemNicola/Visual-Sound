import p5 from "p5";
const AUDIO_URL = "/music/y2k.mp3";

export const sketch = (p: p5) => {
  let song: p5.SoundFile;
  let amplitude: p5.Amplitude;
  let fft: p5.FFT;
  const bins = 64;
  // let binWidth: number;
  let peakDetect: p5.PeakDetect;

  p.setup = async () => {
    p.createCanvas(p.windowWidth, p.windowHeight);
    p.rectMode(p.CORNER);

    song = await p.loadSound(AUDIO_URL);
    song.amp(0.1);

    amplitude = new p5.Amplitude();
    fft = new p5.FFT(bins);
    peakDetect = new p5.PeakDetect(400, 2600, 0.001);
    peakDetect.onPeak(peakDetected);

    song.connect(amplitude);
    song.connect(fft);
    song.connect(peakDetect);
  };

  p.mousePressed = () => {
    if (!song.isPlaying()) song.play();
    else song.pause();
  };

  p.draw = () => {
    p.background(0);
    p.noStroke();

    const spectrum = fft.analyze();
    peakDetect.update(fft);
    // binWidth = p.width / spectrum.length;

    // for (let i = 0; i < spectrum.length; i++) {
    //   const y = p.map(spectrum[i], 0, 0.0001, p.height, 0);
    //   p.rect(i * binWidth, y, binWidth, p.height - y);
    // }

    // const volume = amplitude.getLevel();
  };

  function peakDetected() {}
};
