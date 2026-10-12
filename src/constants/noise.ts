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
    id: "1",
    name: "Perlin",
    noise_image: PERLIN_NOISE,
  },
  {
    id: "2",
    name: "Worely",
    noise_image: WORELY_NOISE,
  },
  {
    id: "3",
    name: "FBM",
    noise_image: FBM_NOISE,
  },
  {
    id: "4",
    name: "Turbulence",
    noise_image: TURBULENCE_NOISE,
  },
];
