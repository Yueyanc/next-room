"use client";
import Image from "next/image";
import { useFlicker, usePlayground } from "@/app/hook/useRoom";
import { useEffect, useRef } from "react";
import * as Three from "three";

import { Material, Mesh } from "three";
import gsap from "gsap";
export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const playground = usePlayground(canvasRef);
  const { createFlicker } = useFlicker();
  useEffect(() => {
    const context = playground.current;
    context.eventEmitter.once(
      "loaded:assets",
      (assets: Record<string, any>) => {
        // 创建贴图材质
        const bakeMaterial = new Three.MeshStandardMaterial({
          map: assets.bakeTexture,
        });
        const mainScreeMaterial = new Three.MeshBasicMaterial({
          map: assets.mainScreenTexture,
        });
        // 设置材质
        assets.roomModel.scene.traverse((child: any) => {
          // @ts-ignore
          child.material = bakeMaterial;
          context.interactionManager.add(child);
          child.addEventListener("click", () => {});
        });
        assets.roomModel.scene.scale.set(0, 0, 0);
        gsap.to(assets.roomModel.scene.scale, {
          x: 1,
          y: 1,
          z: 1,
          duration: 2,
        });
        gsap.to(assets.roomModel.scene.rotation, {
          y: 2 * Math.PI,
          duration: 2,
        });
        context.scene.add(assets.roomModel.scene);
        // 电脑屏幕贴图材质
        const mainSceen = context.scene.getObjectByName("mainSceen") as Mesh;
        if (mainSceen) {
          mainSceen.material = mainScreeMaterial;
        }

        // logo旋转动画
        const vueLog = context.scene.getObjectByName("vueLog");
        const reactLog = context.scene.getObjectByName("reactLog");
        const webpackLog = context.scene.getObjectByName("webpackLog");
        context.updates.push(() => {
          vueLog && vueLog.rotateY(0.005);
          reactLog && reactLog.rotateZ(0.005);
          webpackLog && webpackLog.rotateZ(0.005);
        });
        // node灯牌闪烁动画
        const nodeButton = context.scene.getObjectByName("node_button") as Mesh;
        const nodeO = context.scene.getObjectByName("node_o") as Mesh;
        const { light: nodeButtonLight } = createFlicker({
          mesh: nodeButton,
          color: 0x08a85e,
        });
        const { light: nodeOLight } = createFlicker({
          mesh: nodeO,
          color: 0x08a85e,
        });
        context.scene.add(nodeButtonLight, nodeOLight);
      }
    );
  }, []);
  return (
    <main className="absolute top-0 w-full h-full">
      <canvas ref={canvasRef} />
    </main>
  );
}
