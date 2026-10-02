import p5 from "p5";
import { createPlayer } from "./player";

const AUDIO_URL = "/music/siente.mp3";
const VERTEX_SHADER = "/shaders/vertex.vert";
const FRAGMENT_SHADER = "/shaders/fragment.frag";
const IMG_1 = "/images/bigroom_sensual.webp";
const DMAP = "/displacement/worely.webp";

export type SketchState = {
  song: p5.SoundFile;
  amplitude: p5.Amplitude;
  fft: p5.FFT;
  peakDetect: p5.PeakDetect;
  peakDetectHighMid: p5.PeakDetect;
  bgColor: p5.Color;
  myShaders: p5.Shader;
  image: p5.Image;
  dMap: p5.Image;
  capture: p5.MediaElement;
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
  state.song = p.loadSound(AUDIO_URL);
  state.myShaders = p.loadShader(VERTEX_SHADER, FRAGMENT_SHADER);
  state.image = p.loadImage(IMG_1);
  state.dMap = p.loadImage(DMAP);
}

function setup(p: p5, state: SketchState) {
  p.createCanvas(p.windowWidth, p.windowHeight, p.WEBGL);
  p.shader(state.myShaders);

  p.rectMode(p.CENTER);

  state.amplitude = new p5.Amplitude();
  state.fft = new p5.FFT();
  state.peakDetect = new p5.PeakDetect(400, 4000, 0.05);
  //state.capture = p.createCapture(p.VIDEO) as p5.MediaElement;
  //state.capture.hide();

  state.myShaders.setUniform("uTexture", state.image);
  // state.myShaders.setUniform("uCamera", state.capture);
  state.myShaders.setUniform("uDmap", state.dMap);
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
  p.noStroke();
  state.fft.analyze();
  const volume = state.amplitude.getLevel();
  let frequency = state.fft.getCentroid();
  frequency *= 0.001;

  const radius = p.width / 8;

  const mapVolume = p.map(volume, 0, 1.0, 0, 1.0);
  const mapFreq = p.map(frequency, 0, 5.0, 0.0, 0.8);

  state.myShaders.setUniform("uTime", p.frameCount * 0.01);

  state.myShaders.setUniform("uFrequency", mapFreq);
  state.myShaders.setUniform("uAmplitude", mapVolume);
  state.myShaders.setUniform("uTexture", state.image);
  //state.myShaders.setUniform("uCamera", state.capture);
  state.myShaders.setUniform("uDmap", state.dMap);
  p.rotateY(p.PI);
  p.sphere(radius, 200, 200);
  //p.rect(0, 0, p.width, p.height);
}

function mousePressed(p: p5, state: SketchState) {
  if (state.song.isPlaying()) {
    state.song.pause();
  } else {
    state.song.play();
  }
}
