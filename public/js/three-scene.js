// Procedural 3D coffee-cup showcase for the homepage hero.
// Built entirely from primitives (no external model files), so it renders
// immediately with zero asset downloads. Drag to rotate, auto-idles when
// untouched, pauses off-screen, and respects prefers-reduced-motion.
import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";

(function () {
  const stage = document.querySelector("[data-hero-stage]");
  if (!stage) return;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let renderer, scene, camera, cupGroup, steamGroup;
  let width, height;
  let dragging = false, lastX = 0, lastY = 0;
  let rotY = 0.4, rotX = -0.15, velY = 0.0015;
  let visible = true;

  const colors = {
    gold: 0xe1a33e,
    terracotta: 0xe2694b,
    green: 0x3f6e52,
    cream: 0xfbf1e3,
    espresso: 0x2e1b12,
    ceramic: 0xf6ece0
  };

  init();

  function init() {
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      stage.appendChild(renderer.domElement);

      scene = new THREE.Scene();
      camera = new THREE.PerspectiveCamera(38, 1, 0.1, 50);
      camera.position.set(0, 1.1, 5.4);

      buildLights();
      buildCup();
      buildSaucer();
      buildSteam();

      resize();
      window.addEventListener("resize", resize);

      renderer.domElement.addEventListener("pointerdown", onDown);
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
      renderer.domElement.style.touchAction = "none";
      renderer.domElement.style.cursor = "grab";

      if ("IntersectionObserver" in window) {
        const io = new IntersectionObserver((entries) => {
          entries.forEach((e) => (visible = e.isIntersecting));
        }, { threshold: 0.05 });
        io.observe(stage);
      }

      if (reduceMotion) velY = 0;
      animate();
    } catch (e) {
      // WebGL unavailable: leave the CSS gradient background as a graceful fallback.
      console.warn("3D showcase unavailable:", e);
    }
  }

  function buildLights() {
    scene.add(new THREE.AmbientLight(0xffffff, 0.55));
    const key = new THREE.PointLight(colors.gold, 22, 20);
    key.position.set(3, 4, 3);
    scene.add(key);
    const rim = new THREE.PointLight(colors.terracotta, 14, 20);
    rim.position.set(-3.5, 1.5, -2);
    scene.add(rim);
    const fill = new THREE.PointLight(colors.green, 8, 20);
    fill.position.set(0, -2, 3);
    scene.add(fill);
  }

  function buildCup() {
    cupGroup = new THREE.Group();

    const bodyMat = new THREE.MeshStandardMaterial({ color: colors.ceramic, roughness: 0.28, metalness: 0.05 });
    const body = new THREE.Mesh(new THREE.CylinderGeometry(1.02, 0.82, 1.5, 48, 1, true), bodyMat);
    cupGroup.add(body);

    const baseMat = new THREE.MeshStandardMaterial({ color: colors.ceramic, roughness: 0.3 });
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.82, 0.7, 0.12, 48), baseMat);
    base.position.y = -0.81;
    cupGroup.add(base);

    const coffeeMat = new THREE.MeshStandardMaterial({ color: colors.espresso, roughness: 0.18, metalness: 0.15 });
    const coffee = new THREE.Mesh(new THREE.CircleGeometry(0.96, 48), coffeeMat);
    coffee.rotation.x = -Math.PI / 2;
    coffee.position.y = 0.74;
    cupGroup.add(coffee);

    const rimMat = new THREE.MeshStandardMaterial({ color: colors.ceramic, roughness: 0.22 });
    const rim = new THREE.Mesh(new THREE.TorusGeometry(1.02, 0.045, 16, 48), rimMat);
    rim.rotation.x = Math.PI / 2;
    rim.position.y = 0.75;
    cupGroup.add(rim);

    const handle = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.1, 16, 32, Math.PI * 1.5), bodyMat);
    handle.position.set(1.15, 0.05, 0);
    handle.rotation.z = Math.PI / 2;
    handle.rotation.y = 0.15;
    cupGroup.add(handle);

    cupGroup.rotation.set(rotX, rotY, 0);
    scene.add(cupGroup);
  }

  function buildSaucer() {
    const mat = new THREE.MeshStandardMaterial({ color: colors.cream, roughness: 0.35 });
    const saucer = new THREE.Mesh(new THREE.CylinderGeometry(1.9, 1.95, 0.1, 56), mat);
    saucer.position.y = -0.95;
    scene.add(saucer);
  }

  function buildSteam() {
    steamGroup = new THREE.Group();
    const mat = new THREE.SpriteMaterial({ color: 0xffffff, transparent: true, opacity: 0.16, depthWrite: false });
    for (let i = 0; i < 10; i++) {
      const s = new THREE.Sprite(mat.clone());
      const scale = 0.5 + Math.random() * 0.6;
      s.scale.set(scale, scale * 1.6, 1);
      s.position.set((Math.random() - 0.5) * 0.9, 0.9 + Math.random() * 0.4, (Math.random() - 0.5) * 0.9);
      s.userData.speed = 0.35 + Math.random() * 0.4;
      s.userData.drift = (Math.random() - 0.5) * 0.15;
      s.userData.offset = Math.random() * 10;
      steamGroup.add(s);
    }
    scene.add(steamGroup);
  }

  function onDown(e) {
    dragging = true;
    lastX = e.clientX;
    lastY = e.clientY;
    renderer.domElement.style.cursor = "grabbing";
    velY = 0;
  }
  function onMove(e) {
    if (!dragging) return;
    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;
    lastX = e.clientX;
    lastY = e.clientY;
    rotY += dx * 0.008;
    rotX = Math.max(-0.6, Math.min(0.5, rotX + dy * 0.006));
  }
  function onUp() {
    dragging = false;
    renderer.domElement.style.cursor = "grab";
    if (!reduceMotion) velY = 0.0015;
  }

  function resize() {
    const rect = stage.getBoundingClientRect();
    width = rect.width;
    height = rect.height;
    if (!width || !height) return;
    renderer.setSize(width, height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }

  let clock = new THREE.Clock();
  function animate() {
    requestAnimationFrame(animate);
    if (!visible) return;
    const t = clock.getElapsedTime();

    if (!dragging) rotY += velY;
    if (cupGroup) cupGroup.rotation.set(rotX, rotY, 0);

    if (steamGroup) {
      steamGroup.children.forEach((s) => {
        const p = (t * s.userData.speed + s.userData.offset) % 3;
        s.position.y = 0.9 + p * 0.6;
        s.position.x += Math.sin(t + s.userData.offset) * s.userData.drift * 0.01;
        s.material.opacity = 0.16 * (1 - p / 3);
      });
    }

    renderer.render(scene, camera);
  }
})();
