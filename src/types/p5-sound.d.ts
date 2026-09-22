/// <reference types="p5/lib/addons/p5.sound" />

import type p5 from "p5";
declare module "p5.sound";

declare global {
  interface Window {
    p5: typeof p5;
  }
}
