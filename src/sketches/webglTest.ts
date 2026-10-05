import p5 from "p5";
import { createPlayer } from "./player";
import { DATA_SONGS } from "../constants/song";
import { PlaneHelper } from "three";

const VERTEX_SHADER = "/shaders/vertex.vert";
const FRAGMENT_SHADER = "/shaders/fragment.frag";
const DMAP = "/displacement/turbulence.webp";
// 0..1 : plus bas = amplitude plus douce, plus haut = plus réactive
const AMP_SMOOTHING = 0.09;

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
  smoothAmplitude: number;
};

export const WebGLSketch = (p: p5) => {
  const state = {} as SketchState;

  const selectTrack = (index: number) => {
    let player: { setSong: (song: p5.SoundFile) => void };
    player = createPlayer(state.song);
    const track = DATA_SONGS[index];
    const wasPlaying = state.song.isPlaying();
    state.song.stop();

    state.image = p.loadImage(track.cover, (img) => {
      state.myShaders.setUniform("uTexture", img);
      state.myShaders.setUniform("uTextureResolution", [img.width, img.height]);
    });

    state.song = p.loadSound(track.song, (sound) => {
      state.amplitude.setInput(sound);
      state.fft.setInput(sound);
      player.setSong(sound);
      if (wasPlaying) sound.play();
    });
  };

  p.preload = () => {
    preload(p, state);
  };
  p.setup = () => setup(p, state);
  p.draw = () => draw(p, state);
  p.keyPressed = () => keyPressed(p, state);

  return selectTrack;
};

function preload(p: p5, state: SketchState) {
  state.song = p.loadSound(DATA_SONGS[0].song);
  state.myShaders = p.loadShader(VERTEX_SHADER, FRAGMENT_SHADER);
  state.image = p.loadImage(DATA_SONGS[0].cover);
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

  state.smoothAmplitude = 0.05;
}

function draw(p: p5, state: SketchState) {
  // p.background(0);
  state.bgColor = p.color(255, 255, 255, 1);
  p.background(state.bgColor);
  p.noStroke();
  state.fft.analyze();
  const volume = state.amplitude.getLevel();
  let frequency = state.fft.getCentroid();
  frequency *= 0.001;

  const radius = p.width / 8;

  const mapVolume = p.map(volume, 0, 1.0, 0.1, 1.2);
  const mapFreq = p.map(frequency, 0, 5.0, 0.0, 0.8);

  state.myShaders.setUniform("uFrequency", mapFreq);
  state.smoothAmplitude = p.lerp(
    state.smoothAmplitude,
    mapVolume,
    AMP_SMOOTHING,
  );
  state.myShaders.setUniform("uAmplitude", state.smoothAmplitude);
  state.myShaders.setUniform("uTime", p.frameCount);

  state.myShaders.setUniform("uTexture", state.image);
  //state.myShaders.setUniform("uCamera", state.capture);
  state.myShaders.setUniform("uDmap", state.dMap);
  p.rotateY(p.PI);
  p.sphere(radius, 400, 400);
  //p.rect(0, 0, p.width, p.height);
}

function keyPressed(p: p5, state: SketchState) {
  if (p.key === " ") {
    if (state.song.isPlaying()) {
      state.song.pause();
    } else {
      state.song.play();
    }
  }
}
