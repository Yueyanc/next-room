import type { MutableRefObject, Ref, RefObject } from "react";
import { useEffect, useRef } from "react";
import * as Three from "three";
import { gsap } from "gsap";
import {
  OrbitControls,
  GLTFLoader,
  DRACOLoader,
  RGBELoader,
} from "three/addons";
class Timer {
  start;
  current;
  elapsed;
  delta;
  playing;
  ticker = 0;
  constructor() {
    this.start = Date.now();
    this.current = this.start;
    this.elapsed = 0;
    this.delta = 16;
    this.playing = true;
    this.tick = this.tick.bind(this);
    this.tick(0);
  }
  tick(timestamp: any) {
    this.ticker = window.requestAnimationFrame(this.tick);
    this.elapsed = timestamp - this.start;
  }
}
class ThreePlayground {
  updates!: Array<() => any>;
  scene!: Three.Scene;
  renderer!: Three.WebGLRenderer;
  camera!: Three.PerspectiveCamera;
  gltfLoader!: GLTFLoader;
  rgbeLoader!: RGBELoader;
  imageLoader!: Three.ImageLoader;
  textureLoader!: Three.TextureLoader;
  canvas!: HTMLCanvasElement;
  timer!: Timer;
  init({ canvas }: { canvas: HTMLCanvasElement }) {
    this.canvas = canvas;
    this.timer = new Timer();
    this.scene = new Three.Scene();
    this.scene.fog = new Three.Fog(0xffffff, 5, 10000);
    this.scene.background = new Three.Color(0x333333);
    this.initRenderer({ canvas });
    this.initCamera({ canvas });
    this.initOrbitControls();
    this.initAmbientLight();
    this.initGLTFLoader();
    this.initRGBELoader();
    // this.initFloor();
    this.onResize();
    this.imageLoader = new Three.ImageLoader();
    this.textureLoader = new Three.TextureLoader();
    this.update();
    this.updates = [];
  }

  onResize() {
    window.addEventListener("resize", () => {
      const parentElement = this.canvas.parentElement;
      if (parentElement) {
        const boundings = parentElement.getBoundingClientRect();
        this.canvas.width = boundings.width;
        this.canvas.height = boundings.height;
        this.renderer.setSize(boundings.width, boundings.height);
        this.camera.aspect = boundings.width / boundings.height;
        this.camera.updateProjectionMatrix();
      }
    });
  }

  initFloor() {
    const geometry = new Three.PlaneGeometry(1000, 1000);
    const material = new Three.MeshPhongMaterial({
      color: 0xffffff,
      side: Three.DoubleSide,
    });
    const floor = new Three.Mesh(geometry, material);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -1;
    floor.receiveShadow = true;
    this.scene.add(floor);
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }

  update() {
    requestAnimationFrame(() => {
      this.updates.forEach((cb) => cb());
      this.render();
      this.update();
    });
  }

  initRGBELoader() {
    this.rgbeLoader = new RGBELoader();
  }

  initGLTFLoader() {
    const gltfLoader = new GLTFLoader();
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath("/lib/draco/");
    dracoLoader.setDecoderConfig({ type: "js" });
    gltfLoader.setDRACOLoader(dracoLoader);
    this.gltfLoader = gltfLoader;
  }

  initOrbitControls() {
    const controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.camera.position.set(8, 8, 8);
    controls.update();
  }

  initRenderer({ canvas }: { canvas: HTMLCanvasElement }) {
    this.renderer = new Three.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
    });
    this.renderer.toneMapping = Three.LinearToneMapping;
    this.renderer.toneMappingExposure = 1;
    this.renderer.shadowMap.enabled = true;
    this.renderer.outputColorSpace = Three.SRGBColorSpace;
    this.renderer.setSize(canvas.width, canvas.height);
  }

  initCamera(option: { canvas: HTMLCanvasElement }) {
    this.camera = new Three.PerspectiveCamera(45, 2, 0.1, 1000);
    this.camera.aspect = this.canvas.width / this.canvas.height;
    this.camera.updateProjectionMatrix();
    this.camera.position.set(0, 0, 0);
    this.scene.add(this.camera);
  }

  initAmbientLight() {
    const ambientLight = new Three.AmbientLight(0xffffff, 2);
    this.scene.add(ambientLight);
  }

  initDirectionalLight(option?: { helper: boolean }) {
    const directionalLight = new Three.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(10, 10, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.bias = -0.0001; // 去除伪影
    this.scene.add(directionalLight);
    if (option?.helper) {
      const directionalLightHelper = new Three.DirectionalLightHelper(
        directionalLight,
        1
      );
      this.scene.add(directionalLightHelper);
    }
  }
}
export const useMaterial = (playground: MutableRefObject<ThreePlayground>) => {
  function loadBakeTexture(textureLoader: Three.TextureLoader) {
    const bakeTexture = textureLoader.load("/model/bake-night.jpg");
    bakeTexture.flipY = false;
    bakeTexture.colorSpace = Three.SRGBColorSpace;
    bakeTexture.magFilter = Three.NearestFilter;
    bakeTexture.minFilter = Three.NearestFilter;

    const bakeMaterial = new Three.MeshStandardMaterial({
      map: bakeTexture,
    });
    return bakeMaterial;
  }
  return {
    loadBakeTexture,
  };
};
export const useFlicker = () => {
  function createFlicker({ mesh, color }: { mesh: Three.Mesh; color: number }) {
    const material = new Three.MeshStandardMaterial({
      color: 0xffffff, // 设置基础颜色
      emissive: color, // 设置发光颜色
      emissiveIntensity: 2, // 设置发光强度
    });
    mesh.material = material;
    const light = new Three.PointLight(color, 1.5);
    mesh.material.transparent = true;
    light.position.copy(mesh.position); // 将光源位置设置为与物体重叠
    light.castShadow = true;
    gsap.to(light, {
      intensity: 0,
      duration: 1.5,
      repeat: -1, // 无限重复
      yoyo: true, // 反向播放
    });
    gsap.to(mesh.material, {
      opacity: 0.2,
      duration: 1.5,
      repeat: -1,
      yoyo: true,
    });

    return { light };
  }
  return { createFlicker };
};
export const usePlayground = (
  canvasRef: RefObject<HTMLCanvasElement | undefined>
) => {
  const playground = useRef<ThreePlayground>(new ThreePlayground());
  useEffect(() => {
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      canvas.width = canvas.parentElement?.offsetWidth || 600;
      canvas.height = canvas.parentElement?.offsetHeight || 600;
      playground.current.init({ canvas });
    }
  }, []);
  return playground;
};
