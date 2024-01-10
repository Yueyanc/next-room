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
import EventEmitter from "events";
class ThreePlayground {
  updates: Array<() => any> = [];
  scene!: Three.Scene;
  renderer!: Three.WebGLRenderer;
  camera!: Three.PerspectiveCamera;
  gltfLoader!: GLTFLoader;
  rgbeLoader = new RGBELoader();
  imageLoader = new Three.ImageLoader();
  textureLoader = new Three.TextureLoader();
  canvas!: HTMLCanvasElement;
  eventEmitter = new EventEmitter();
  assets: Record<string, any> = {};
  orbitControls!: OrbitControls;
  init({ canvas }: { canvas: HTMLCanvasElement }) {
    this.canvas = canvas;
    this.initScene();
    this.initRenderer();
    this.initCamera();
    this.initOrbitControls();
    // this.initDirectionalLight();
    this.initAmbientLight();
    this.initGLTFLoader();
    // this.initFloor();
    this.onResize();
    this.update();
    this.loadAssets();
  }
  loadAssets() {
    // 加载烘焙贴图
    const bakeTexture = this.textureLoader.load("/model/bake-night.jpg");
    bakeTexture.flipY = false;
    bakeTexture.colorSpace = Three.SRGBColorSpace;
    bakeTexture.magFilter = Three.LinearFilter;
    bakeTexture.minFilter = Three.LinearMipmapLinearFilter;
    this.assets.bakeTexture = bakeTexture;
    // 加载屏幕贴图
    const mainScreenTexture = this.textureLoader.load("/model/main_screen.png");
    mainScreenTexture.flipY = false;
    mainScreenTexture.colorSpace = Three.SRGBColorSpace;
    this.assets.mainScreenTexture = mainScreenTexture;
    Promise.all([
      // 加载房间模型
      new Promise((resolve) => {
        this.gltfLoader.load("/model/room3D.glb", (gltf) => {
          this.assets.roomModel = gltf;
          this.eventEmitter.emit("loaded:roomModel", gltf);
          resolve(true);
        });
      }),
    ]).then((res) => {
      this.eventEmitter.emit("loaded:assets", this.assets);
    });
  }
  initScene() {
    this.scene = new Three.Scene();
    this.scene.fog = new Three.Fog(0xffffff, 5, 10000);
    this.scene.background = new Three.Color(0x333333);
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
    controls.enableDamping = true;
    controls.dampingFactor = 0.015;
    controls.maxAzimuthAngle = Math.PI / 2;
    controls.minAzimuthAngle = 0;
    controls.maxPolarAngle = (3 * Math.PI) / 8;
    controls.maxPolarAngle = Math.PI / 2;
    controls.maxDistance = 15;
    controls.minDistance = 5;
    controls.zoomSpeed = 0.5;
    controls.panSpeed = 0.5;
    controls.rotateSpeed = 0.4;
    // 设置相机朝向
    controls.target = new Three.Vector3(0, 2, 0);
    this.updates.push(() => controls.update());
    this.orbitControls = controls;
  }

  initRenderer() {
    this.renderer = new Three.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
    });
    this.renderer.toneMapping = Three.LinearToneMapping;
    this.renderer.toneMappingExposure = 1;
    this.renderer.shadowMap.enabled = true;
    this.renderer.outputColorSpace = Three.SRGBColorSpace;
    this.renderer.setSize(this.canvas.width, this.canvas.height);
  }

  initCamera() {
    this.camera = new Three.PerspectiveCamera(45, 2, 0.1, 1000);
    this.camera.aspect = this.canvas.width / this.canvas.height;
    this.camera.position.set(7, 7, 7);
    this.camera.lookAt(new Three.Vector3(0, 0, 0));
    this.camera.updateProjectionMatrix();

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
