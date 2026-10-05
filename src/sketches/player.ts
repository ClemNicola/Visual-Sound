import type p5 from "p5";

const formatTime = (s: number) =>
  `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

export function createPlayer(song: p5.SoundFile) {
  const container = document.createElement("div");
  container.style.cssText =
    "position:fixed;bottom:16px;left:50%;transform:translateX(-50%);display:flex;align-items:center;gap:10px;padding:8px 14px;background:rgba(0,0,0,.6);color:#fff;font:12px monospace;border-radius:8px;z-index:10;";

  const button = document.createElement("button");
  button.style.cssText =
    "width:28px;background:none;border:1px solid #fff;color:#fff;border-radius:4px;cursor:pointer;";

  const slider = document.createElement("input");
  slider.type = "range";
  slider.min = "0";
  slider.max = String(song.duration());
  slider.step = "0.1";
  slider.style.width = "300px";

  const time = document.createElement("span");

  container.append(button, slider, time);
  document.body.append(container);

  // Empêche les clics sur le lecteur de déclencher le mousePressed du sketch
  container.addEventListener("mousedown", (e) => e.stopPropagation());

  let dragging = false;

  const render = (current = song.currentTime()) => {
    button.textContent = song.isPlaying() ? "❚❚" : "▶";
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
      // jump() ne fait rien en pause : on déplace la position de reprise de play()
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
  render();
}
