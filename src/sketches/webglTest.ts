import p5 from "p5";
import { createPlayer } from "./player";

const AUDIO_URL = "/music/y2k.mp3";
const AUDIO_URL_2 = "/music/rock_body.mp3";
const VERTEX_SHADER = "/shaders/vertex.vert";
const FRAGMENT_SHADER = "/shaders/fragment.frag";
const IMG_1 = "/images/img_1.webp";
const IMG_2 = "/images/img_2.webp";

export type SketchState = {
  song: p5.SoundFile;
  amplitude: p5.Amplitude;
  fft: p5.FFT;
  peakDetect: p5.PeakDetect;
  peakDetectHighMid: p5.PeakDetect;
  bgColor: p5.Color;
  myShaders: p5.Shader;
  image: p5.Image;
};

export const WebGLSketch = (p: p5) => {
  const state = {} as SketchState;

  p.preload = () => {
    preload(p, state);
  };
  p.setup = () => setup(p, state);
  p.draw = () => draw(p, state);
  p.mousePressed = () => mousePressed(p, state);
};

function preload(p: p5, state: SketchState) {
  state.song = p.loadSound(AUDIO_URL_2);
  state.myShaders = p.loadShader(VERTEX_SHADER, FRAGMENT_SHADER);
  state.image = p.loadImage(IMG_2);
}

function setup(p: p5, state: SketchState) {
  p.createCanvas(p.windowWidth, p.windowHeight, p.WEBGL);
  p.shader(state.myShaders);

  p.rectMode(p.CENTER);

  state.amplitude = new p5.Amplitude();
  state.fft = new p5.FFT();
  state.peakDetect = new p5.PeakDetect(0, 20000, 0.025);

  state.myShaders.setUniform("uResolution", [p.width, p.height]);
  state.myShaders.setUniform("uTextureResolution", [
    state.image.width,
    state.image.height,
  ]);

  state.amplitude.setInput(state.song);
  state.fft.setInput(state.song);

  createPlayer(state.song);
}

function draw(p: p5, state: SketchState) {
  p.background(0);

  state.fft.analyze();
  const volume = state.amplitude.getLevel();
  let frequency = state.fft.getCentroid();
  frequency *= 0.001;

  const mapFreq = p.map(frequency, 0, 0.5, 0, 20);
  const mapVolume = p.map(volume, 0, 0.2, 0, 0.2);

  state.myShaders.setUniform("uTime", p.frameCount);

  state.myShaders.setUniform("uFrequency", mapFreq);
  state.myShaders.setUniform("uAmplitude", mapVolume);
  state.myShaders.setUniform("uTexture", state.image);
  p.rect(0, 0, p.width, p.height);
}

function mousePressed(p: p5, state: SketchState) {
  if (state.song.isPlaying()) {
    state.song.pause();
  } else {
    state.song.play();
  }
}
