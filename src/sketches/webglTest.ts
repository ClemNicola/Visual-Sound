import p5 from "p5";
import { createPlayer } from "./player";
import { DATA_SONGS } from "../constants/song";
import { params } from "../constants/params";
import { DATA_NOISE } from "../constants/noise";

const VERTEX_SHADER = "/shaders/vertex.vert";
const FRAGMENT_SHADER = "/shaders/fragment.frag";

const GRID_THRESHOLD = 0.4;
const PEAK_DECAY = 0.995;
const MIN_PEAK = 0.15;
// Lissage par case : s'allume vite (attaque), s'éteint lentement (relâche)
const GRID_ATTACK = 0.5;
const GRID_RELEASE = 0.08;

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
  smoothAmplitude: number;
  bassMin: number;
  bassMax: number;
  morph: number;
  player: ReturnType<typeof createPlayer>;
  bands: [number, number][];
  orderedBands: number[];
  peaks: number[];
  cellLevels: number[];
};

export const WebGLSketch = (p: p5) => {
  const state = {} as SketchState;

  let trackRequest = 0;
  let loadTimeout: number | undefined;
  let resumeAfterLoad = false;

  const disposeSound = (sound: p5.SoundFile) =>
    (sound as unknown as { dispose: () => void }).dispose();

  const selectTrack = (index: number) => {
    const track = DATA_SONGS[index];
    const title = document.getElementById("song-title");
    const artist = document.getElementById("song-artist");
    const album = document.getElementById("song-album");
    if (title) title.textContent = `title: ${track.title}`;
    if (artist) artist.textContent = `artist: ${track.artist}`;
    if (album) album.textContent = `album: ${track.album}`;

    resumeAfterLoad = resumeAfterLoad || state.song.isPlaying();
    state.song.stop();

    const request = ++trackRequest;

    clearTimeout(loadTimeout);
    loadTimeout = window.setTimeout(() => {
      p.loadImage(track.cover, (img) => {
        if (request !== trackRequest) return;
        state.image = img;
        state.myShaders.setUniform("uTexture", img);
        state.myShaders.setUniform("uTextureResolution", [img.width, img.height]);
      });

      p.loadSound(track.song, (sound) => {
        if (request !== trackRequest) {
          disposeSound(sound);
          return;
        }

        state.song.stop();
        disposeSound(state.song);
        state.song = sound;
        state.amplitude.setInput(sound);
        state.fft.setInput(sound);
        state.player.setSong(sound);
        if (resumeAfterLoad) sound.play();
        resumeAfterLoad = false;
      });
    }, 250);
  };

  const selectNoise = (id: string) => {
    const noise = DATA_NOISE.find((item) => item.id === id);
    if (!noise) return;
    params.noise = id;
    state.dMap = p.loadImage(noise?.noise_image, (img) => {
      state.myShaders.setUniform("uDmap", img);
    });
  };

  p.preload = () => {
    preload(p, state);
  };
  p.setup = () => setup(p, state);
  p.draw = () => draw(p, state);
  p.keyPressed = () => keyPressed(p, state);
  p.windowResized = () => p.resizeCanvas(p.windowWidth, p.windowHeight);

  return { selectTrack, selectNoise };
};

function preload(p: p5, state: SketchState) {
  state.song = p.loadSound(DATA_SONGS[0].song);
  state.myShaders = p.loadShader(VERTEX_SHADER, FRAGMENT_SHADER);
  state.image = p.loadImage(DATA_SONGS[0].cover);
  const noise = DATA_NOISE.find((item) => item.id === params.noise);
  state.dMap = p.loadImage(noise?.noise_image || DATA_NOISE[0].noise_image);
}

function setup(p: p5, state: SketchState) {
  // Écrans retina ×3 : le fbm par pixel coûte trop cher, on plafonne à ×2
  p.pixelDensity(Math.min(window.devicePixelRatio, 2));
  p.createCanvas(p.windowWidth, p.windowHeight, p.WEBGL);
  p.shader(state.myShaders);

  p.rectMode(p.CENTER);

  state.amplitude = new p5.Amplitude();
  state.fft = new p5.FFT();
  state.peakDetect = new p5.PeakDetect(400, 4000, 0.05);

  state.bands = [
    [20, 300],
    [300, 600],
    [600, 900],
    [900, 1200],
    [1200, 1600],
    [1600, 2000],
    [2000, 2600],
    [2600, 3400],
    [3400, 4200],
    [4200, 5200],
    [5200, 6400],
    [6400, 7600],
    [7600, 8800],
    [8800, 10000],
    [10000, 11000],
    [11000, 12000],
  ];

  state.orderedBands = state.bands.map((_, i) => i);
  state.peaks = state.bands.map(() => MIN_PEAK);
  state.cellLevels = state.bands.map(() => 0);

  for (let i = state.bands.length - 1; i >= 0; i--) {
    const j = Math.floor(p.random(i + 1));
    [state.orderedBands[i], state.orderedBands[j]] = [state.orderedBands[j], state.orderedBands[i]];
  }

  state.myShaders.setUniform("uTexture", state.image);
  state.myShaders.setUniform("uDmap", state.dMap);
  state.myShaders.setUniform("uTextureResolution", [state.image.width, state.image.height]);

  state.amplitude.setInput(state.song);
  state.fft.setInput(state.song);

  state.smoothAmplitude = 0.05;

  state.player = createPlayer(state.song);

  if (params.sphere) {
    state.morph = 1;
  } else {
    state.morph = 0;
  }
}

function draw(p: p5, state: SketchState) {
  state.fft.analyze();

  if (params.isColorBg) {
    p.resetShader();
    p.background(15);
    drawGrid(p, state);
  } else {
    p.background(255, 255, 255, 1);
  }

  p.shader(state.myShaders);

  p.noStroke();
  const volume = state.amplitude.getLevel();
  let frequency = state.fft.getCentroid();
  frequency *= 0.001;

  const mapVolume = p.map(volume, 0, 1.0, 0, 1.3);
  const mapFreq = p.map(frequency, 0, 5.0, 0.0, 0.8);

  state.myShaders.setUniform("uFrequency", mapFreq);
  state.smoothAmplitude = p.lerp(state.smoothAmplitude, mapVolume, params.ampSmoothing);
  state.morph = p.lerp(state.morph, params.sphere ? 1.0 : 0.0, 0.1);
  state.myShaders.setUniform("uMorph", state.morph);
  // Envoyés à chaque frame pour suivre le redimensionnement (windowResized)
  state.myShaders.setUniform("uResolution", [p.width, p.height]);
  // Le plus petit côté : sinon la sphère est minuscule en portrait
  state.myShaders.setUniform("uRadius", p.min(p.width, p.height) / params.radius);
  state.myShaders.setUniform("uOctave", params.octave);
  state.myShaders.setUniform("uWarpStrength", params.warpStrength);
  state.myShaders.setUniform("uAmplitude", state.smoothAmplitude);
  state.myShaders.setUniform("uTime", p.frameCount);
  state.myShaders.setUniform("uTexture", state.image);

  state.myShaders.setUniform("uDmap", state.dMap);

  p.plane(1, 1, params.top, params.top);

  // if (params.sphere) {
  //   const radius = p.width / params.radius;
  //   p.rotateY(p.PI);
  //   p.sphere(radius, params.top, params.top);
  // } else {
  //   p.plane(p.width, p.height, params.top, params.top);
  // }
}

function keyPressed(p: p5, state: SketchState) {
  if (document.activeElement?.closest("input, button, summary")) return;
  if (p.key === " ") {
    if (state.song.isPlaying()) {
      state.song.pause();
    } else {
      state.song.play();
    }
  }
}

function drawGrid(p: p5, state: SketchState) {
  const values = state.bands.map(([low, high], n) => {
    const value = state.fft.getEnergy(low, high) / 255;
    // Chaque bande est comparée à son propre pic récent : les aigus s'allument autant que les basses
    state.peaks[n] = Math.max(value, state.peaks[n] * PEAK_DECAY, MIN_PEAK);
    const normalized = value / state.peaks[n];
    // Seuil + courbe : le calme reste noir, seuls les pics deviennent blancs
    return p.constrain(p.map(normalized, GRID_THRESHOLD, 1, 0, 1), 0, 1) ** 2;
  });

  p.push();
  p.translate(-p.width / 2, -p.height / 2);

  const cols = 3;
  const rows = 3;
  const gap = 0;
  const cellWidth = p.width / cols;
  const cellHeight = p.height / rows;

  if (p.frameCount % 15 === 0) {
    for (let n = state.orderedBands.length - 1; n > 0; n--) {
      const k = Math.floor(p.random(n + 1));
      [state.orderedBands[n], state.orderedBands[k]] = [
        state.orderedBands[k],
        state.orderedBands[n],
      ];
    }
  }

  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      const x = i * cellWidth + cellWidth / 2;
      const y = j * cellHeight + cellHeight / 2;

      const index = state.orderedBands[i * rows + j];
      const cell = i * rows + j;

      const target = values[index];
      const amount = target > state.cellLevels[cell] ? GRID_ATTACK : GRID_RELEASE;

      state.cellLevels[cell] = p.lerp(state.cellLevels[cell], target, amount);
      const intensity = state.cellLevels[cell];
      p.fill(255, 0, 0, intensity * 255);
      // p.fill(p.random(255), p.random(255), p.random(255), intensity * 255);
      p.rect(x, y, cellWidth - gap, cellHeight - gap);
    }
  }

  p.pop();
}
