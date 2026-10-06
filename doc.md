# Modify Effects — feuille de route

Objectif : transformer le `<p>Modify Effects</p>` du footer (`src/pages/index.astro`) en panneau d'inputs (range / checkbox / select) qui pilotent le sketch p5 (`src/sketches/webglTest.ts`) et les shaders (`public/shaders/`).

Principe :

```
input (DOM) ──écrit──▶ params ──lu à chaque frame──▶ draw() ──▶ setUniform
```

Règle d'or : toujours lire `params.xxx` **dans `draw()`**, jamais le copier dans une constante (un nombre est copié par valeur, le lien est perdu).

---

## ✅ 1. Objet `params` partagé + `ampSmoothing`

- [x] `src/constants/params.ts` avec `params` et le type `Params`
- [x] `AMP_SMOOTHING` remplacé par `params.ampSmoothing` lu dans `draw()`

## 2. Brancher les inputs (`data-param`)

- [x] Une boucle sur `[data-param]` qui écoute l'événement `input`
- [x] Checkbox → `input.checked`, range → `input.valueAsNumber`
- [ ] Afficher la valeur à côté du slider (`<output>`)
- [x] Tester avec `ampSmoothing` seul avant d'ajouter le reste

Pièges (reportés à la refonte de l'UI) :
- `footer { pointer-events: none }` → remettre `pointer-events: auto` sur le panneau
- Barre espace : si une checkbox a le focus, elle se coche **et** `keyPressed` fait play/pause → regarder `document.activeElement`
- Le carousel (`#carousel3d`, `z-index: 1`, 20vh en bas) peut chevaucher le panneau

## 3. Plages de `p.map`

- [ ] `ampMin`, `ampMax`, `freqMin`, `freqMax` dans `params`
- [ ] Remplacer les nombres en dur dans `p.map(volume, …)` et `p.map(frequency, …)`
- [ ] Décider quoi faire si `min > max` (bloquer, ou garder : ça inverse la réaction au son)

## 4. Bandes de fréquence (bass, mid…)

- [ ] `state.fft.getEnergy("bass" | "lowMid" | "mid" | "highMid" | "treble")` → valeur 0..255, à appeler **après** `fft.analyze()`
- [ ] Normaliser (`/ 255`) × un gain venant d'un range (`params.bassGain`, …)
- [ ] Envoyer en uniforms (`uBass`, `uMid`…) et choisir ce que chaque bande pilote (déplacement, vitesse, distortion…)

## 5. Typo en `mix-blend-mode` (actif par défaut)

- [ ] Mettre `mix-blend-mode: difference` sur `nav` / `footer`, **pas** sur les `p` (fixed + z-index = contexte d'empilement)
- [ ] Texte en blanc
- [ ] Checkbox qui toggle une classe sur `body` pour l'activer/désactiver

## 6. Sphère ⇄ rect

- [ ] Checkbox `sphere` → `p.sphere(...)` ou `p.rect(0, 0, p.width, p.height)` dans `draw()`
- [ ] Uniform `uIsRect` pour changer le calcul des UV (le code du `ratio` est déjà commenté dans `fragment.frag`)
- [ ] Vérifier le vertex shader : le déplacement le long de `aNormal` ne rend pas pareil sur un plan

## ~~7. Caméra~~ — abandonnée (2026-10-06)

Essai non concluant (caméra projetée depuis l'écran via `gl_FragCoord`, mélangée à la pochette) → code retiré (input, `params.camera`, capture, uniforms, shader). Jamais commité : la démarche (je veux / j'ai dans `draw()`, `getTracks().stop()`, `coverUv`) reste décrite dans la conversation du 2026-10-06.

## 8. Sélecteur de noise

- [ ] `<select>` → `params.noiseType` (lire avec `Number(select.value)`, pas de `valueAsNumber`)
- [ ] `uniform float uNoiseType;` dans `vertex.vert`
- [ ] Brancher : fbm (domain warp actuel) / `cnoise` / `pnoise` — comparer avec `< 0.5`, `< 1.5` plutôt qu'avec des `int`

---

## 9. (Bonus, tout à la fin) Transition animée plane ⇄ sphère

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
