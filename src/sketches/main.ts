import p5 from "p5";

const AUDIO_URL = "/music/y2k.mp3";
const AUDIO_URL_2 = "/music/rock_body.mp3";
const BINS = 256;

type SketchState = {
  song: p5.SoundFile;
  amplitude: p5.Amplitude;
  fft: p5.FFT;
  peakDetect: p5.PeakDetect;
  peakDetectHighMid: p5.PeakDetect;
  bgColor: p5.Color;
};

export const sketch = (p: p5) => {
  const state = {} as SketchState;

  p.preload = () => {
    state.song = preload(p);
  };
  p.setup = () => setup(p, state);
  p.mousePressed = () => mousePressed(state);
  p.draw = () => {
    draw(p, state);
  };
};

function preload(p: p5) {
  return p.loadSound(AUDIO_URL_2);
}

function setup(p: p5, state: SketchState) {
  p.createCanvas(p.windowWidth, p.windowHeight);
  p.rectMode(p.CORNER);
  state.song.setVolume(0.1);

  state.amplitude = new p5.Amplitude();
  state.fft = new p5.FFT(0.8, BINS);
  state.peakDetect = new p5.PeakDetect(0, 20000, 0.025);
  state.peakDetectHighMid = new p5.PeakDetect(2600, 5200, 0.3);
  state.bgColor = p.color(0, 0, 0, 0);

  state.peakDetect.onPeak(() => peakDetected(state, p));
  state.peakDetectHighMid.onPeak(() => peakDetected(state, p));

  state.amplitude.setInput(state.song);
  state.fft.setInput(state.song);

  // const bass = [20, 140];
  // const lowMid = [140, 400];
  // const mid = [400, 2600];
  // const highMid = [2600, 5200];
  // const high = [5200, 14000];
}

function mousePressed(state: SketchState) {
  if (!state.song.isPlaying()) state.song.play();
  else state.song.pause();
}

function draw(p: p5, state: SketchState) {
  triggerBeat(state, p);
  p.background(state.bgColor);
  p.noStroke();
  state.fft.analyze();
  state.peakDetect.update(state.fft);
  state.peakDetectHighMid.update(state.fft);

  if (state.song.currentTime() > 0 && state.song.currentTime() < 5) {
    drawWaveFrorm(p, state);
  }
  if (state.song.currentTime() > 5 && state.song.currentTime() < 8.5) {
    drawFFT(p, state);
  }
  if (state.song.currentTime() > 8.5) {
    // drawWaveFrorm(p, state);
    drawRectangle(p, state);
  }
  if (state.song.currentTime() > 8.5) {
    drawEllipse(p, state);
  }
}

function peakDetected(state: SketchState, p: p5) {
  state.bgColor = p.color(
    p.random(255),
    p.random(255),
    p.random(255),
    p.random(255),
  );
}

function drawWaveFrorm(p: p5, state: SketchState) {
  const waveform = state.fft.waveform();
  p.push();
  p.noFill();
  p.stroke(p.color("cyan"));
  p.strokeWeight(4);
  p.beginShape();
  for (let i = 0; i < waveform.length; i++) {
    const x = p.map(i, 0, waveform.length, 0, p.width + 500);
    const y = p.map(waveform[i], -0.5, 0.5, p.height, 0);
    p.vertex(x, y);
  }
  p.endShape();
  p.pop();
}

function drawFFT(p: p5, state: SketchState) {
  const spectrum = state.fft.analyze();
  const binWidth = p.width / spectrum.length;
  const binColor = p.color(
    p.random(255),
    p.random(255),
    p.random(255),
    p.random(255),
  );
  p.noStroke();
  for (let i = 0; i < spectrum.length; i++) {
    let y = p.map(spectrum[i], 0, 255, p.height, 0);
    p.push();
    p.stroke("red");
    p.fill(binColor);
    p.strokeWeight(2);
    p.rect(i * binWidth, y, binWidth, p.height - y);
    p.pop();
  }
}

function triggerBeat(state: SketchState, p: p5) {
  if (state.song.currentTime() > 35) {
    state.bgColor = p.color(
      p.random(255),
      p.random(255),
      p.random(255),
      p.random(255),
    );
  }
}

function drawEllipse(p: p5, state: SketchState) {
  const mid = state.fft.getEnergy(2600, 5200);
  const mapMid = p.map(mid, 0, 255, 0, p.windowWidth);
  p.push();
  p.translate(p.windowWidth / 2, p.windowHeight / 2);
  p.fill(p.random(255));
  p.ellipse(0, 0, mapMid, mapMid);
  p.pop();
}

function drawRectangle(p: p5, state: SketchState) {
  const mapMouse = {
    x: p.map(p.mouseX, 0, p.windowWidth, 2, 4),
    y: p.map(p.mouseY, 0, p.windowHeight, 2, 4),
  };

  const level = state.amplitude.getLevel();
  const volume = p.map(level, 0, 0.3, 0, p.height);
  const progress = p.map(
    state.song.currentTime(),
    0,
    state.song.duration(),
    255,
    0,
  );

  for (let i = 0; i <= p.windowWidth; i += p.windowWidth / mapMouse.x) {
    for (let j = 0; j <= p.windowHeight; j += p.windowHeight / mapMouse.y) {
      p.push();
      p.noStroke();
      p.fill(p.random(progress), p.random(progress), p.random(progress));
      p.rect(i, j, p.windowWidth / 2, p.random(volume));
      p.pop();
    }
  }
}
