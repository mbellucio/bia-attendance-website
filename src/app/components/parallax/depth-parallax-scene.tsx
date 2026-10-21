"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { battlefieldParallaxConfig as config, initialParallaxControls } from "./config";

const vertexShader = `
uniform sampler2D uDepthMap;
uniform vec2 uDepthTexel;
uniform float uDepthStrength;
uniform float uDepthEnabled;
varying vec2 vUv;
float filteredDepth(vec2 uv) {
  vec2 t = uDepthTexel;
  float sum = texture2D(uDepthMap, uv + vec2(-t.x,-t.y)).r
    + 2.0 * texture2D(uDepthMap, uv + vec2(0.0,-t.y)).r
    + texture2D(uDepthMap, uv + vec2(t.x,-t.y)).r
    + 2.0 * texture2D(uDepthMap, uv + vec2(-t.x,0.0)).r
    + 4.0 * texture2D(uDepthMap, uv).r
    + 2.0 * texture2D(uDepthMap, uv + vec2(t.x,0.0)).r
    + texture2D(uDepthMap, uv + vec2(-t.x,t.y)).r
    + 2.0 * texture2D(uDepthMap, uv + vec2(0.0,t.y)).r
    + texture2D(uDepthMap, uv + vec2(t.x,t.y)).r;
  return sum / 16.0;
}
void main() {
  vUv = uv;
  float depth = filteredDepth(uv);
  vec3 displaced = position;
  vec2 imageUv = vec2(uv.x, 1.0 - uv.y);
  float upperSoldier = 1.0 - smoothstep(0.82, 1.0, length((imageUv - vec2(0.918, 0.56)) / vec2(0.052, 0.075)));
  float lowerSoldier = 1.0 - smoothstep(0.82, 1.0, length((imageUv - vec2(0.895, 0.675)) / vec2(0.058, 0.105)));
  float rigidSoldier = max(upperSoldier, lowerSoldier);
  displaced.z += (depth - 0.5) * uDepthStrength * uDepthEnabled * (1.0 - rigidSoldier);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(displaced, 1.0);
}`;

const fragmentShader = `
uniform sampler2D uColorMap;
uniform sampler2D uDepthMap;
uniform vec2 uDepthTexel;
uniform float uDebugDepth;
varying vec2 vUv;
void main() {
  if (uDebugDepth > 0.5) {
    float depth = texture2D(uDepthMap, vUv).r;
    gl_FragColor = vec4(vec3(depth), 1.0);
  } else {
    gl_FragColor = texture2D(uColorMap, vUv);
  }
  #include <colorspace_fragment>
}`;

export function DepthParallaxScene() {
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [webglFailed, setWebglFailed] = useState(false);

  useEffect(() => {
    const stage = stageRef.current;
    const canvas = canvasRef.current;
    if (!stage || !canvas) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: "high-performance" });
    } catch {
      setWebglFailed(true);
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.NoToneMapping;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(config.fieldOfView, 1, 0.1, 100);
    const geometry = new THREE.PlaneGeometry(1, 1, config.subdivisionsX, config.subdivisionsY);
    const uniforms = {
      uColorMap: { value: null as THREE.Texture | null },
      uDepthMap: { value: null as THREE.Texture | null },
      uDepthTexel: { value: new THREE.Vector2(1 / 1600, 1 / 1000) },
      uDepthStrength: { value: initialParallaxControls.depthStrength },
      uDepthEnabled: { value: 1 },
      uDebugDepth: { value: 0 },
    };
    const material = new THREE.ShaderMaterial({ vertexShader, fragmentShader, uniforms, side: THREE.DoubleSide });
    const plane = new THREE.Mesh(geometry, material);
    scene.add(plane);

    let disposed = false;
    let visible = true;
    let frame = 0;
    let previousTime = 0;
    let lastFov: number = config.fieldOfView;
    let lastDistance: number = config.cameraDistance;
    const target = new THREE.Vector2();
    const current = new THREE.Vector2();
    const loader = new THREE.TextureLoader();
    let loaded = 0;
    const revealWhenReady = () => {
      loaded += 1;
      if (loaded === 2 && !disposed) canvas.style.opacity = "0.92";
    };
    const colorTexture = loader.load(config.source, (texture) => {
      if (disposed) { texture.dispose(); return; }
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.generateMipmaps = true;
      texture.minFilter = THREE.LinearMipmapLinearFilter;
      texture.magFilter = THREE.LinearFilter;
      uniforms.uColorMap.value = texture;
      revealWhenReady();
    });
    const depthTexture = loader.load(config.depth, (texture) => {
      if (disposed) { texture.dispose(); return; }
      texture.colorSpace = THREE.NoColorSpace;
      texture.generateMipmaps = true;
      texture.minFilter = THREE.LinearMipmapLinearFilter;
      texture.magFilter = THREE.LinearFilter;
      const mapImage = texture.image as HTMLImageElement;
      uniforms.uDepthTexel.value.set(1 / mapImage.width, 1 / mapImage.height);
      uniforms.uDepthMap.value = texture;
      revealWhenReady();
    });

    const resize = () => {
      const bounds = stage.getBoundingClientRect();
      if (bounds.width < 1 || bounds.height < 1) return;
      const aspect = bounds.width / bounds.height;
      camera.aspect = aspect;
      camera.updateProjectionMatrix();
      renderer.setSize(bounds.width, bounds.height, false);
      const distance = initialParallaxControls.cameraDistance;
      const viewHeight = 2 * distance * Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2);
      const viewWidth = viewHeight * aspect;
      const imageAspect = config.imageAspect;
      let planeHeight = Math.max(viewHeight, viewWidth / imageAspect) * initialParallaxControls.overscan;
      let planeWidth = planeHeight * imageAspect;
      if (planeWidth < viewWidth * initialParallaxControls.overscan) {
        planeWidth = viewWidth * initialParallaxControls.overscan;
        planeHeight = planeWidth / imageAspect;
      }
      plane.scale.set(planeWidth, planeHeight, 1);
      plane.position.y = planeHeight * 0.035;
    };
    const observer = new ResizeObserver(resize);
    observer.observe(stage);
    resize();

    const onPointerMove = (event: PointerEvent) => {
      target.set(THREE.MathUtils.clamp((event.clientX / window.innerWidth) * 2 - 1, -1, 1), THREE.MathUtils.clamp(1 - (event.clientY / window.innerHeight) * 2, -1, 1));
    };
    const onPointerLeave = () => target.set(0, 0);
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerleave", onPointerLeave);

    const intersectionObserver = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; }, { threshold: 0.02 });
    intersectionObserver.observe(stage);
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const animate = (now: number) => {
      if (disposed) return;
      frame = requestAnimationFrame(animate);
      if (!visible) { previousTime = now; return; }
      const delta = previousTime ? Math.min((now - previousTime) / 1000, 0.05) : 1 / 60;
      previousTime = now;
      const settings = initialParallaxControls;
      const damping = 1 - Math.exp(-settings.damping * delta);
      current.lerp(target, damping);
      const motionScale = reducedMotion.matches ? 0.25 : 1;
      const cameraEnabled = settings.cameraEnabled ? motionScale : 0;
      camera.position.set(current.x * settings.cameraRangeX * cameraEnabled, current.y * settings.cameraRangeY * cameraEnabled, settings.cameraDistance - current.y * config.cameraZoomRange * cameraEnabled);
      camera.lookAt(0, 0, 0);
      uniforms.uDepthStrength.value = settings.depthStrength + current.y * config.depthStrengthRange * cameraEnabled;
      uniforms.uDepthEnabled.value = settings.depthEnabled ? 1 : 0;
      uniforms.uDebugDepth.value = settings.debugDepth ? 1 : 0;
      if (settings.fieldOfView !== lastFov || settings.cameraDistance !== lastDistance) {
        camera.fov = settings.fieldOfView;
        camera.updateProjectionMatrix();
        lastFov = settings.fieldOfView;
        lastDistance = settings.cameraDistance;
        resize();
      }
      renderer.render(scene, camera);
    };
    frame = requestAnimationFrame(animate);

    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      observer.disconnect();
      intersectionObserver.disconnect();
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerleave", onPointerLeave);
      colorTexture.dispose();
      depthTexture.dispose();
      geometry.dispose();
      material.dispose();
      renderer.dispose();
    };
  }, []);

  return <div ref={stageRef} className="depth-parallax-stage relative isolate h-[calc(100svh-76px)] w-screen overflow-hidden bg-[#10130f] sm:h-[calc(100svh-84px)] md:h-[calc(100svh-104px)]" style={{ marginLeft: "calc(50% - 50vw)" }}>
    <Image src={config.source} alt="A World War II battlefield with soldiers advancing between trench logs, smoke, and distant trees." fill priority sizes="100vw" className="object-cover object-[center_58%] opacity-[0.92] saturate-[0.78]" />
    {!webglFailed && <canvas ref={canvasRef} className="depth-parallax-canvas absolute inset-0" aria-hidden="true" />}
    <div className="pointer-events-none absolute inset-0 z-10" style={{ background: "linear-gradient(90deg, rgba(8,10,9,.82) 0%, rgba(12,14,12,.68) 55%, rgba(30,32,29,.48) 100%)" }} aria-hidden="true" />
  </div>;
}
