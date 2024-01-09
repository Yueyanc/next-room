"use client";
import Image from "next/image";
import { useFlicker, useMaterial, usePlayground } from "@/app/hook/useRoom";
import { useEffect, useRef } from "react";
import * as Three from "three";
import { Water } from "three/addons";

import { Material, Mesh } from "three";
export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const playground = usePlayground(canvasRef);
  const { loadBakeTexture } = useMaterial(playground);
  const { createFlicker } = useFlicker();
  useEffect(() => {
    playground.current.gltfLoader.load(
      "/model/room3D.glb",
      (gltf) => {
        const bakeMaterial = loadBakeTexture(playground.current.textureLoader);
        gltf.scene.traverse((child: any) => {
          child.material = bakeMaterial;
          child.receiveShadow = true;
          child.castShadow = true;
        });
        playground.current.scene.add(gltf.scene);
        // logo旋转动画
        const vueLog = playground.current.scene.getObjectByName("vueLog");
        const reactLog = playground.current.scene.getObjectByName("reactLog");
        const webpackLog =
          playground.current.scene.getObjectByName("webpackLog");
        playground.current.updates.push(() => {
          vueLog && vueLog.rotateY(0.005);
          reactLog && reactLog.rotateZ(0.005);
          webpackLog && webpackLog.rotateZ(0.005);
        });
        // node灯牌闪烁动画
        const nodeButton = playground.current.scene.getObjectByName(
          "node_button"
        ) as Mesh;
        const nodeO = playground.current.scene.getObjectByName(
          "node_o"
        ) as Mesh;
        const { light: nodeButtonLight } = createFlicker({
          mesh: nodeButton,
          color: 0x08a85e,
        });
        const { light: nodeOLight } = createFlicker({
          mesh: nodeO,
          color: 0x08a85e,
        });
        playground.current.scene.add(nodeButtonLight, nodeOLight);
      },
      (progress) => {},
      (error) => {
        console.log(error);
      }
    );
  }, []);
  return (
    <main className="absolute top-0 w-full h-full">
      <canvas ref={canvasRef} />
    </main>
  );
}
