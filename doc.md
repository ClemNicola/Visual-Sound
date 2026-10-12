# Modify Effects — feuille de route

Objectif : transformer le `<p>Modify Effects</p>` du footer (`src/pages/index.astro`) en panneau d'inputs (range / checkbox / select) qui pilotent le sketch p5 (`src/sketches/webglTest.ts`) et les shaders (`public/shaders/`).

Principe :

```
input (DOM) ──écrit──▶ params ──lu à chaque frame──▶ draw() ──▶ setUniform
```

Règle d'or : toujours lire `params.xxx` **dans `draw()`**, jamais le copier dans une constante (un nombre est copié par valeur, le lien est perdu).

Outillage (2026-10-08) : Prettier + ESLint installés, format au save dans VS Code. Scripts `bun run lint` / `lint:fix` / `format` / `format:check`.

---

## ✅ 1. Objet `params` partagé + `ampSmoothing`

- [x] `src/constants/params.ts` avec `params` et le type `Params`
- [x] `AMP_SMOOTHING` remplacé par `params.ampSmoothing` lu dans `draw()`

## 2. Brancher les inputs (`data-param`)

- [x] Une boucle sur `[data-param]` qui écoute l'événement `input`
- [x] Checkbox → `input.checked`, range → `input.valueAsNumber`
- ~~Afficher la valeur à côté du slider (`<output>`)~~ (pas nécessaire)
- [x] Tester avec `ampSmoothing` seul avant d'ajouter le reste

Pièges (reportés à la refonte de l'UI) :
- ~~`footer { pointer-events: none }` → remettre `pointer-events: auto` sur le panneau~~ ✅ (`footer { pointer-events: auto }`)
- Barre espace : si une checkbox a le focus, elle se coche **et** `keyPressed` fait play/pause → regarder `document.activeElement`
- Le carousel (`#carousel3d`, `z-index: 1`, 20vh en bas) peut chevaucher le panneau

## ✅ 3 / 4 / 5. Réglage du blob (remplace plages `p.map`, bandes de fréquence, toggle typo)

Décision (2026-10-12) : plutôt que des ranges `ampMin/ampMax`, des bandes `uBass`/`uMid` ou un toggle de blend mode, on a travaillé directement la forme « blob » du vertex shader. Résultat jugé satisfaisant, les anciennes étapes 3, 4 et 5 ne sont plus à faire.

Diagnostic de départ : la sphère ne bougeait presque pas, alors que l'image réagissait. Raisons : `fbm(p * q)` restait collé à l'origine (Perlin = 0 aux points entiers), et `p.sphere` est une sphère unité mise à l'échelle par la matrice (un déplacement de 0.03 = 3 % du rayon).

- [x] `fbm` : nombre d'octaves réglable via `uOctave` (boucle à borne fixe `i < 6` + `break`, car WebGL1 refuse une borne non constante) → `params.octave` + range `step="0.1"`
- [x] Domain warp additif : `cnoise(p + q * uWarpStrength)` au lieu de `fbm(p * q)` → `params.warpStrength` + range « Noise Strength »
- [x] `p.map(volume, 0, 1.0, 0, 1.3)` : minimum à **0** au lieu de 0.1 → plus de « spasmes » en silence (c'était ça, pas le `p + q`)
- [x] Le gonflement uniforme (`uDisplacement` radial) a été écarté : l'effet recherché vient de la force du bruit, pas d'une inflation
- [x] Typo : `mix-blend-mode: difference` sur les `p` (pas de toggle)

Pistes laissées de côté (si besoin un jour) :
- Lissage asymétrique attaque / relâchement à la place du `lerp` unique (`ampSmoothing`)
- `uFrequency` (centroïde) multiplie encore `p` → la taille des lobes bouge avec le son ; la fixer si on veut un contrôle total
- `bassMin` / `bassMax` + `console.log("bass", …)` dans `draw()` : debug à retirer (jamais initialisés → `NaN`)

## ⬜ Police

- [ ] Trouver une autre police (actuellement `Unbounded` pour les `p`, `JetBrainsMono` pour le panneau, en `@font-face` dans `index.astro`)

## ✅ 6. Sphère ⇄ rect

- [x] Checkbox `sphere` → `p.sphere(...)` ou `p.plane(p.width, p.height, top, top)` dans `draw()`
- [x] Uniform `uIsRect` pour changer le calcul des UV (`uvCover` mixé avec `vTexCoord` dans `fragment.frag`)
- [x] Vertex shader : entrée du bruit et amplification du déplacement mixées avec `uIsRect`

## ~~7. Caméra~~ — abandonnée (2026-10-06)

Essai non concluant (caméra projetée depuis l'écran via `gl_FragCoord`, mélangée à la pochette) → code retiré (input, `params.camera`, capture, uniforms, shader). Jamais commité : la démarche (je veux / j'ai dans `draw()`, `getTracks().stop()`, `coverUv`) reste décrite dans la conversation du 2026-10-06.

## ✅ 8. Sélecteur de noise

Approche retenue : chaque noise est une **image** (displacement map) chargée dans la texture `uDmap` du fragment shader, plutôt qu'un `uNoiseType` qui brancherait des fonctions de bruit dans le vertex shader.

- [x] Données : `DATA_NOISE` dans `src/constants/noise.ts` (`id`, `name`, `noise_image` dans `public/displacement/`)
- [x] `params.noise` = id du noise (`DATA_NOISE[0].id` par défaut), image chargée au `setup`
- [x] UI : select custom en `<details>` / `<summary>` (summary = choix actuel avec miniature, liste en grille 2×2 qui s'ouvre vers le haut, choix en `aria-selected`)
- [x] JS : `click` sur `.noise-list button` → `selectNoise(id)` (exposé par `WebGLSketch`, comme `selectTrack`) → `p.loadImage` → `setUniform("uDmap", img)`. Mise à jour de `aria-selected` et du summary, fermeture (aussi au clic en dehors)

---

## ⬜ 9. Prochaine étape : transition animée plane ⇄ sphère (morph)

⚠️ Faire glisser `uIsRect` ne suffit pas : ça ne change que les UV/le bruit, pas la forme. Il faut **un seul maillage** qui devient l'un ou l'autre.

- [ ] Toujours dessiner `p.plane(1, 1, detail, detail)` (plus de `if`, plus de `rotateY` en JS) et faire la mise à l'échelle dans le shader (`uResolution` pour le plan, `uRadius` pour la sphère) — sinon la sphère est étirée en ovale
- [ ] Dans `vertex.vert`, depuis `aTexCoord` : position plan (UV à plat) + position sphère (`u` → longitude 0..2π, `v` → latitude 0..π, avec `sin`/`cos`) → `mix(plan, sphere, uMorph)`
- [ ] `params.sphere` = le but, `state.morph` = la valeur courante, rapprochée chaque frame avec `p.lerp` (comme `smoothAmplitude`) → uniform `uMorph` (1 = sphère, remplace `uIsRect`, attention au sens inversé)
- [ ] Faire glisser aussi avec `uMorph` : la normale (`normalize` après le `mix`), l'entrée du bruit, l'amplification du déplacement, les UV « cover » du fragment

Pièges :
- Orientation de la pochette sur la sphère → tester avec `uMorph = 1.0`, ajuster avec `1.0 - u` ou un décalage d'angle (remplace le `rotateY(PI)`)
- Couture gauche/droite : si la formule est bonne les bords se rejoignent, sinon fente visible
- Pôles : toute une ligne du plan converge en un point, c'est normal
- `lerp` n'atteint jamais pile 1 → comparer avec une marge si une autre logique en dépend

Ordre : sphère calculée dans le shader avec `uMorph = 1.0` → slider `morph` temporaire 0..1 → `lerp` piloté par la checkbox → bonus.

Bonus : morph local décalé par sommet (`smoothstep` sur `aTexCoord.x`) → le plan s'enroule comme une feuille au lieu de gonfler d'un bloc.
