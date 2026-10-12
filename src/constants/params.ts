import { DATA_NOISE } from "./noise";

export const params = {
  sphere: true,
  ampSmoothing: 0.1,
  top: 200,
  radius: 8,
  noise: DATA_NOISE[0].id,
  octave: 3,
  warpStrength: 1,
};

export type Params = typeof params;
