export const battlefieldParallaxConfig = {
  source: "/images/bunkerAtk_scene-original-parallax.png",
  depth: "/images/homepage-bunker-depth-original.png",
  imageAspect: 8 / 5,
  depthStrength: 0.11,
  depthStrengthRange: 0.02,
  cameraZoomRange: 0.06,
  cameraRangeX: 0.075,
  cameraRangeY: 0.04,
  damping: 6.5,
  cameraDistance: 2.25,
  fieldOfView: 38,
  overscan: 1.12,
  subdivisionsX: 240,
  subdivisionsY: 150,
} as const;

export type ParallaxControls = {
  depthStrength: number;
  cameraRangeX: number;
  cameraRangeY: number;
  damping: number;
  cameraDistance: number;
  fieldOfView: number;
  overscan: number;
  debugDepth: boolean;
  depthEnabled: boolean;
  cameraEnabled: boolean;
};

export const initialParallaxControls: ParallaxControls = {
  depthStrength: battlefieldParallaxConfig.depthStrength,
  cameraRangeX: battlefieldParallaxConfig.cameraRangeX,
  cameraRangeY: battlefieldParallaxConfig.cameraRangeY,
  damping: battlefieldParallaxConfig.damping,
  cameraDistance: battlefieldParallaxConfig.cameraDistance,
  fieldOfView: battlefieldParallaxConfig.fieldOfView,
  overscan: battlefieldParallaxConfig.overscan,
  debugDepth: false,
  depthEnabled: true,
  cameraEnabled: true,
};

