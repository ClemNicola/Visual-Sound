const PERLIN_NOISE = "/displacement/perlin.webp";
const WORELY_NOISE = "/displacement/worely.webp";
const FBM_NOISE = "/displacement/fbm.webp";
const TURBULENCE_NOISE = "/displacement/turbulence.webp";

interface Noise {
  id: string;
  name: string;
  noise_image: string;
}

export const DATA_NOISE: Noise[] = [
  {
    id: "perlin",
    name: "Perlin Noise",
    noise_image: PERLIN_NOISE,
  },
  {
    id: "worely",
    name: "Worely Noise",
    noise_image: WORELY_NOISE,
  },
  {
    id: "fbm",
    name: "FBM Noise",
    noise_image: FBM_NOISE,
  },
  {
    id: "turbulence",
    name: "Turbulence Noise",
    noise_image: TURBULENCE_NOISE,
  },
];
