import type p5 from "p5";

const formatTime = (s: number) =>
  `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

export function createPlayer(initialSong: p5.SoundFile) {
  let song = initialSong;

  const setSong = (next: p5.SoundFile) => {
    song = next;
    pausedAt = null;
    slider.max = String(next.duration());
    render();
  };

  const container = document.createElement("div");
  container.className = "player";

  const button = document.createElement("button");
  button.type = "button";
  button.className = "player-button";

  const slider = document.createElement("input");
  slider.type = "range";
  slider.className = "range player-slider";
  slider.min = "0";
  slider.max = String(song.duration());
  slider.step = "0.1";
  slider.setAttribute("aria-label", "Position");

  const time = document.createElement("span");
  time.className = "player-time";

  container.append(button, slider, time);
  document.body.append(container);

  let dragging = false;

  const render = (current = song.currentTime()) => {
    button.textContent = song.isPlaying() ? "Pause" : "Play";
    if (!dragging) slider.value = String(current);
    time.textContent = `${formatTime(current)} / ${formatTime(song.duration())}`;
  };

  button.addEventListener("click", () => {
    if (song.isPlaying()) song.pause();
    else song.play();
    render();
  });

  slider.addEventListener("input", () => {
    dragging = true;
    render(Number(slider.value));
  });

  // Position choisie pendant la pause (currentTime() ne bouge pas tant que le son est arrêté)
  let pausedAt: number | null = null;

  slider.addEventListener("change", () => {
    dragging = false;
    const t = Number(slider.value);
    if (song.isPlaying()) {
      song.jump(t, 0);
    } else {
      const s = song as unknown as { _paused: boolean; pauseTime: number };
      s._paused = true;
      s.pauseTime = t;
      pausedAt = t;
    }
    render(t);
  });

  setInterval(() => {
    if (song.isPlaying()) pausedAt = null;
    render(pausedAt ?? song.currentTime());
  }, 250);

  return { setSong };
}
