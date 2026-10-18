"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Faction = "US" | "GERMANY" | "SOVIET_UNION";
type Props = { initialFaction: Faction; initialModelPath: string };
type FactionOption = { id: Faction; label: string; modelPath: string; description: string };

const factions: FactionOption[] = [
  { id: "US", label: "United States", modelPath: "/models/ww2/us-rifleman.glb", description: "American rifleman" },
  { id: "GERMANY", label: "Germany", modelPath: "/models/ww2/german-rifleman.glb", description: "German rifleman" },
  { id: "SOVIET_UNION", label: "Soviet Union", modelPath: "/models/ww2/soviet-rifleman.glb", description: "Soviet rifleman" },
];

function SoldierCanvas({ modelPath, label, onLoaded, onFailed }: {
  modelPath: string;
  label: string;
  onLoaded: () => void;
  onFailed: () => void;
}) {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    let disposed = false;
    let animationFrame = 0;
    let renderer: import("three").WebGLRenderer | undefined;
    let controls: import("three/addons/controls/OrbitControls.js").OrbitControls | undefined;
    let model: import("three").Object3D | undefined;
    let mixer: import("three").AnimationMixer | undefined;
    let resizeObserver: ResizeObserver | undefined;

    const disposeModel = (root: import("three").Object3D) => {
      root.traverse((object) => {
        const mesh = object as import("three").Mesh;
        if (!mesh.isMesh) return;
        mesh.geometry.dispose();
        const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        for (const material of materials) {
          for (const value of Object.values(material)) {
            if (value && typeof value === "object" && "isTexture" in value && value.isTexture) {
              (value as import("three").Texture).dispose();
            }
          }
          material.dispose();
        }
      });
    };

    async function renderModel(host: HTMLDivElement) {
      try {
        const [THREE, { GLTFLoader }, { OrbitControls }] = await Promise.all([
          import("three"),
          import("three/addons/loaders/GLTFLoader.js"),
          import("three/addons/controls/OrbitControls.js"),
        ]);
        if (disposed) return;

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(32, 1, 0.01, 1000);
        renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "high-performance" });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.15;
        renderer.setClearColor(0x000000, 0);
        renderer.domElement.className = "absolute inset-0 block h-full w-full touch-pan-y outline-none";
        Object.assign(renderer.domElement.style, { position: "absolute", inset: "0", width: "100%", height: "100%", display: "block", touchAction: "pan-y" });
        renderer.domElement.setAttribute("role", "img");
        renderer.domElement.setAttribute("aria-label", `${label}; left-drag to rotate, right-drag to move the view, scroll or pinch to zoom`);
        renderer.domElement.tabIndex = 0;
        host.replaceChildren(renderer.domElement);

        scene.add(new THREE.HemisphereLight(0xe8eadf, 0x242820, 2.1));
        const keyLight = new THREE.DirectionalLight(0xfff4df, 3.1);
        keyLight.position.set(-3, 5, 4);
        scene.add(keyLight);
        const fillLight = new THREE.DirectionalLight(0xb9c8aa, 1.7);
        fillLight.position.set(4, 2, -3);
        scene.add(fillLight);

        controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.07;
        controls.enablePan = true;
        controls.screenSpacePanning = true;
        controls.panSpeed = 0.8;
        controls.mouseButtons = { LEFT: THREE.MOUSE.ROTATE, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: THREE.MOUSE.PAN };
        controls.enableZoom = true;
        controls.zoomSpeed = 0.8;
        controls.autoRotate = true;
        controls.autoRotateSpeed = 0.8;
        controls.minPolarAngle = Math.PI * 0.28;
        controls.maxPolarAngle = Math.PI * 0.68;

        const resize = () => {
          if (!renderer || !host) return;
          const width = Math.max(host.clientWidth, 1);
          const height = Math.max(host.clientHeight, 1);
          renderer.setSize(width, height, false);
          camera.aspect = width / height;
          camera.updateProjectionMatrix();
        };
        resizeObserver = new ResizeObserver(resize);
        resizeObserver.observe(host);
        resize();

        const modelUrl = new URL(modelPath, window.location.href);
        modelUrl.searchParams.set("v", "lib-relaxed-idle-2");
        const gltf = await new GLTFLoader().loadAsync(modelUrl.href);
        if (disposed) {
          disposeModel(gltf.scene);
          return;
        }
        model = gltf.scene;
        model.traverse((object) => {
          const mesh = object as import("three").Mesh;
          if (!mesh.isMesh) return;
          mesh.frustumCulled = false;
          const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
          for (const material of materials) {
            material.side = THREE.DoubleSide;
            material.needsUpdate = true;
          }
        });
        if (gltf.animations.length) {
          mixer = new THREE.AnimationMixer(model);
          mixer.clipAction(gltf.animations[0]).play();
          mixer.update(0);
          model.updateMatrixWorld(true);
        }
        const bounds = new THREE.Box3().setFromObject(model);
        const size = bounds.getSize(new THREE.Vector3());
        const center = bounds.getCenter(new THREE.Vector3());
        const height = Math.max(size.y, 1);
        model.position.x -= center.x;
        model.position.y -= bounds.min.y;
        model.position.z -= center.z;
        scene.add(model);

        controls.target.set(0, height * 0.48, 0);
        const cameraDistance = height * 2.3;
        camera.position.set(0, height * 0.55, cameraDistance);
        camera.near = Math.max(height / 100, 0.01);
        camera.far = height * 20;
        camera.updateProjectionMatrix();
        controls.minDistance = height * 0.65;
        controls.maxDistance = height * 4.5;
        controls.update();
        onLoaded();

        let lastFrame = performance.now();
        const animate = () => {
          if (disposed || !renderer) return;
          animationFrame = window.requestAnimationFrame(animate);
          const now = performance.now();
          mixer?.update(Math.min((now - lastFrame) / 1000, 0.05));
          lastFrame = now;
          controls?.update();
          renderer.render(scene, camera);
        };
        animate();
      } catch (error) {
        console.error(`Could not render ${label} model`, error);
        if (!disposed) onFailed();
      }
    }

    void renderModel(host);
    return () => {
      disposed = true;
      window.cancelAnimationFrame(animationFrame);
      resizeObserver?.disconnect();
      controls?.dispose();
      mixer?.stopAllAction();
      if (model) {
        mixer?.uncacheRoot(model);
        disposeModel(model);
      }
      renderer?.dispose();
      renderer?.domElement.remove();
    };
  }, [modelPath, label, onLoaded, onFailed]);

  return <div ref={hostRef} className="absolute inset-0" style={{ position: "absolute", inset: 0 }} />;
}

export function SoldierModel({ initialFaction, initialModelPath }: Props) {
  const [faction, setFaction] = useState(initialFaction);
  const [modelPath, setModelPath] = useState(initialModelPath);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [modelLoaded, setModelLoaded] = useState(false);
  const [modelFailed, setModelFailed] = useState(false);
  const current = factions.find((item) => item.id === faction) ?? factions[0];
  const onModelLoaded = useCallback(() => { setModelLoaded(true); setModelFailed(false); }, []);
  const onModelFailed = useCallback(() => setModelFailed(true), []);

  async function selectFaction(value: Faction) {
    const selected = factions.find((item) => item.id === value)!;
    const previousFaction = faction;
    const previousPath = modelPath;
    setFaction(value);
    setModelPath(selected.modelPath);
    setModelLoaded(false);
    setModelFailed(false);
    setSaving(true);
    setMessage("");
    try {
      const response = await fetch("/api/user/model-preference", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ faction: value }),
      });
      if (!response.ok) throw new Error("Could not save your faction choice.");
      const result: { faction: Faction; modelPath: string } = await response.json();
      setFaction(result.faction);
      setModelPath(result.modelPath);
      setMessage("Preference saved.");
    } catch {
      setFaction(previousFaction);
      setModelPath(previousPath);
      setMessage("Could not save. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return <section className="flex flex-col overflow-hidden border border-white/10 bg-[#171b18]" aria-labelledby="soldier-model-title">
    <div className="flex flex-wrap items-end justify-between gap-3 border-b border-white/10 px-4 py-4 sm:px-5">
      <div>
        <p className="m-0 text-[8px] font-semibold uppercase tracking-[.16em] text-[#a8bc7a]">PERSONNEL DISPLAY</p>
        <h2 id="soldier-model-title" className="mt-1 text-sm font-semibold text-[#f3f1e8]">Choose your faction</h2>
      </div>
      <label className="flex flex-col gap-1 text-[8px] font-semibold uppercase tracking-[.12em] text-[#aeb5a7]">
        Faction
        <select value={faction} disabled={saving} onChange={(event) => void selectFaction(event.target.value as Faction)} className="min-h-10 min-w-48 border border-white/15 bg-[#202520] px-3 text-xs normal-case tracking-normal text-[#f3f1e8] focus-visible:outline-2 focus-visible:outline-[#a8bc7a]">
          {factions.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
        </select>
      </label>
    </div>
    <div className="relative min-h-[360px] flex-1 bg-[radial-gradient(ellipse_at_center,#283027_0%,#101310_72%)] sm:min-h-[460px]" style={{ position: "relative", height: "clamp(360px, 55vh, 560px)", minHeight: 360, flex: "1 0 360px" }}>
      <SoldierCanvas
        key={modelPath}
        modelPath={modelPath}
        label={current.description}
        onLoaded={onModelLoaded}
        onFailed={onModelFailed}
      />
      {!modelLoaded && !modelFailed && <div className="pointer-events-none absolute inset-0 grid place-items-center" aria-live="polite">
        <div className="flex flex-col items-center gap-3 text-center">
          <span className="size-9 animate-pulse rounded-full border border-[#a8bc7a]/50 bg-[#a8bc7a]/10" aria-hidden="true" />
          <span className="text-[9px] font-semibold uppercase tracking-[.16em] text-[#a8bc7a]">Loading {current.label} rifleman</span>
        </div>
      </div>}
      {modelFailed && <div className="absolute inset-0 grid place-items-center px-6 text-center" role="status">
        <p className="max-w-xs text-sm leading-6 text-[#c7cabe]">The soldier model could not be rendered. Refresh the page and try again.</p>
      </div>}
    </div>
    <p className="m-0 min-h-9 border-t border-white/10 px-4 py-2 text-[10px] text-[#c4c8bd]" aria-live="polite">{saving ? "Saving preference…" : message}</p>
  </section>;
}




