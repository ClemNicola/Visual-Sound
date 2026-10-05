import * as THREE from "three";
import { DATA_SONGS } from "../constants/song";

export const Carousel3D = (selectTrack: (index: number) => void) => {
  const canvas = document.getElementById("carousel3d") as HTMLCanvasElement;
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  const render = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
    preserveDrawingBuffer: true,
  });

  render.setSize(width, height);
  render.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  const scene = new THREE.Scene();
  scene.background = null;
  const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100);

  camera.position.z = 5;

  const settings = {
    wheelSensitivity: 0.01,
    touchSensitivity: 0.01,
    momentumMultiplier: 2,
    smoothing: 0.1,
    slideLerp: 0.075,
    distortionDecay: 0.95,
    maxDistortion: 2.5,
    distortionSensitivity: 0.15,
    distortionSmoothing: 0.75,
  };

  const slideWidth = window.innerWidth <= 1600 ? 2.15 : 2.75;
  const slideHeight = 2.5;
  const gap = 0.2;
  const slideCount = DATA_SONGS.length;
  const totalWidth = slideCount * (slideWidth + gap);
  const slideUnit = slideWidth + gap;

  const slides: THREE.Mesh[] = [];
  let currentPosition = 0;
  let targetPosition = 0;
  let isScrolling = false;
  let autoScrollSpeed = 0;
  let lastTime = 0;
  let touchStartX = 0;
  let touchLastX = 0;
  let previousPosition = 0;

  let currentDistortionFactor = 0;
  let targetDistortionFactor = 0;
  let peakVelocity = 0;
  let velocityHistory = [0, 0, 0, 0, 0];
  let scrollTimeout = 0;

  const correctImageColor = (texture: THREE.Texture) => {
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  };

  const createSlide = (index: number) => {
    const geometry = new THREE.PlaneGeometry(slideWidth, slideHeight, 32, 16);

    const material = new THREE.MeshBasicMaterial({
      side: THREE.DoubleSide,
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.x = index * (slideWidth + gap);
    mesh.userData = {
      originalVertices: [...geometry.attributes.position.array],
      index,
    };

    const imagePath = DATA_SONGS[index].cover;

    new THREE.TextureLoader().load(
      imagePath,
      (texture: THREE.Texture) => {
        correctImageColor(texture);
        material.map = texture;
        material.color.set(0xffffff);
        material.needsUpdate = true;

        const imgAspect =
          (texture.image as HTMLImageElement).width /
          (texture.image as HTMLImageElement).height;
        const slideAspect = slideWidth / slideHeight;

        if (imgAspect > slideAspect) {
          mesh.scale.y = slideAspect / imgAspect;
        } else {
          mesh.scale.x = imgAspect / slideAspect;
        }
      },
      undefined,
      (error: unknown) => console.warn("Image not found:", error),
    );

    scene.add(mesh);
    slides.push(mesh);
  };

  for (let i = 0; i < slideCount; i++) {
    createSlide(i);
  }

  slides.forEach((slide) => {
    slide.position.x = -totalWidth / 2;
    slide.userData.targetX = slide.position.x;
    slide.userData.currentX = slide.position.x;
  });

  const updateCurve = (
    mesh: THREE.Mesh,
    worldPositionX: number,
    distortionFactor: number,
  ) => {
    const distortionCenter = new THREE.Vector2(0, 0);
    const distortionRadius = 2.5;
    const maxCurvatur = settings.maxDistortion * distortionFactor;

    const positionAttritube = mesh.geometry.attributes.position;
    const vertices = mesh.userData.originalVertices;

    for (let i = 0; i < positionAttritube.count; i++) {
      const x = vertices[i * 3];
      const y = vertices[i * 3 + 1];

      const vertexWorldPosX = worldPositionX + x;
      const distFromCenter = Math.sqrt(
        Math.pow(vertexWorldPosX - distortionCenter.x, 2) +
          Math.pow(y - distortionCenter.y, 2),
      );

      const distortionStrengh = Math.max(
        0,
        1 - distFromCenter / distortionRadius,
      );

      const curveZ =
        Math.pow(Math.sin((distortionStrengh * Math.PI) / 2), 1.5) *
        maxCurvatur;

      positionAttritube.setZ(i, curveZ);
    }

    positionAttritube.needsUpdate = true;
    mesh.geometry.computeVertexNormals();
  };

  window.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") {
      targetPosition += slideUnit;
      targetDistortionFactor = Math.min(1.0, targetDistortionFactor + 0.3);
    } else if (e.key === "ArrowRight") {
      targetPosition -= slideUnit;
      targetDistortionFactor = Math.min(1.0, targetDistortionFactor + 0.3);
    }
  });

  window.addEventListener(
    "wheel",
    (e) => {
      e.preventDefault();
      const delta =
        Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      const wheelStrength = Math.abs(delta) * 0.001;
      targetDistortionFactor = Math.min(
        1.0,
        targetDistortionFactor + wheelStrength,
      );

      targetPosition -= delta * settings.wheelSensitivity;
      const isTrackpad = e.deltaMode === WheelEvent.DOM_DELTA_PIXEL;
      autoScrollSpeed = isTrackpad
        ? 0
        : Math.min(Math.abs(delta) * 0.0005, 0.05) * Math.sign(delta);
      isScrolling = !isTrackpad;

      clearTimeout(scrollTimeout);
      scrollTimeout = window.setTimeout(() => {
        isScrolling = false;
      }, 150);
    },
    { passive: false },
  );

  window.addEventListener(
    "touchstart",
    (e) => {
      touchStartX = e.touches[0].clientX;
      touchLastX = touchStartX;
      isScrolling = false;
    },
    { passive: false },
  );

  window.addEventListener(
    "touchmove",
    (e) => {
      e.preventDefault();
      const touchX = e.touches[0].clientX;
      const deltaX = touchX - touchLastX;
      touchLastX = touchX;
      const touchStrength = Math.abs(deltaX) * 0.02;
      targetDistortionFactor = Math.min(
        1.0,
        targetDistortionFactor + touchStrength,
      );

      targetPosition -= deltaX * settings.touchSensitivity;
      isScrolling = true;
    },
    { passive: false },
  );

  window.addEventListener("touchend", () => {
    const velocity = (touchLastX - touchStartX) * 0.005;
    if (Math.abs(velocity) > 0.5) {
      autoScrollSpeed = velocity * settings.momentumMultiplier * 0.05;
      targetDistortionFactor = Math.min(
        1.0,
        Math.abs(velocity) * 3 * settings.distortionSensitivity,
      );
    }

    isScrolling = true;
    setTimeout(() => {
      isScrolling = false;
    }, 800);
  });

  window.addEventListener("resize", () => {
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    render.setSize(width, height);
  });

  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();

  const focusSlide = (index: number) => {
    const destination = index * slideUnit;
    let delta = destination - targetPosition;
    delta = ((delta % totalWidth) + totalWidth) % totalWidth;
    if (delta > totalWidth / 2) delta -= totalWidth;

    autoScrollSpeed = 0;
    isScrolling = false;
    targetPosition += delta;
    targetDistortionFactor = Math.min(1.0, targetDistortionFactor + 0.4);
  };

  canvas.addEventListener("pointerdown", (e) => {
    if (e.button !== 0) return;
    const rect = canvas.getBoundingClientRect();
    pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);

    const hit = raycaster.intersectObjects(slides)[0];
    if (!hit) return;
    focusSlide(hit.object.userData.index as number);
  });

  const animate = (animateTime: number) => {
    requestAnimationFrame(animate);

    const deltaTime = lastTime ? (animateTime - lastTime) / 1000 : 0.016;
    lastTime = animateTime;

    const prevPos = currentPosition;

    if (isScrolling) {
      targetPosition += autoScrollSpeed;
      const speedBasedDecay = 0.97 - Math.abs(autoScrollSpeed) * 0.5;
      autoScrollSpeed *= Math.max(0.92, speedBasedDecay);

      if (Math.abs(autoScrollSpeed) < 0.001) {
        autoScrollSpeed = 0;
      }
    }

    currentPosition += (targetPosition - currentPosition) * settings.smoothing;

    const indexCover =
      ((Math.round(currentPosition / slideUnit) % slideCount) + slideCount) %
      slideCount;

    if (indexCover !== previousPosition) {
      previousPosition = indexCover;
      selectTrack(indexCover);
    }
    const currentVelocity = Math.abs(currentPosition - prevPos) / deltaTime;

    velocityHistory.push(currentVelocity);
    velocityHistory.shift();

    const avgVelocity =
      velocityHistory.reduce((sum, val) => sum + val, 0) /
      velocityHistory.length;

    if (avgVelocity > peakVelocity) {
      peakVelocity = avgVelocity;
    }

    const velocityRation = avgVelocity / (peakVelocity + 0.001);

    const isDecelerating = velocityRation < 0.7 && peakVelocity > 0.5;

    peakVelocity *= 0.99;

    const movementDistorition = Math.min(1.0, currentVelocity * 0.1);

    if (currentVelocity > 0.05) {
      targetDistortionFactor = Math.max(
        targetDistortionFactor,
        movementDistorition,
      );
    }

    if (isDecelerating || avgVelocity < 0.2) {
      const decayRate = isDecelerating
        ? settings.distortionDecay
        : settings.distortionDecay * 0.9;

      targetDistortionFactor *= decayRate;
    }

    currentDistortionFactor +=
      (targetDistortionFactor - currentDistortionFactor) *
      settings.distortionSmoothing;

    slides.forEach((slide, index) => {
      let baseX = index * slideUnit - currentPosition;
      baseX = ((baseX % totalWidth) + totalWidth) % totalWidth;

      if (baseX > totalWidth / 2) {
        baseX -= totalWidth;
      }

      const isWrapping =
        Math.abs(baseX - slide.userData.targetX) > slideUnit * 2;

      if (isWrapping) {
        slide.userData.currentX = baseX;
      }

      slide.userData.targetX = baseX;
      slide.userData.currentX +=
        (slide.userData.targetX - slide.userData.currentX) * settings.slideLerp;

      const wrapThreshold = totalWidth / 2 + slideWidth;

      if (Math.abs(slide.userData.currentX) < wrapThreshold * 1.5) {
        slide.position.x = slide.userData.currentX;
        updateCurve(slide, slide.position.x, currentDistortionFactor);
      }
    });

    render.render(scene, camera);
  };

  animate(performance.now());
};
