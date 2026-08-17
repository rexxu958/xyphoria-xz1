"use client";

import { Suspense, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, useGLTF, Stage } from "@react-three/drei";
import * as THREE from "three";

function SpinningModel({ url }: { url: string }) {
  const group = useRef<THREE.Group>(null);
  const { scene } = useGLTF(url);

  useFrame((_, delta) => {
    if (group.current) {
      group.current.rotation.y += delta * 0.25;
    }
  });

  return (
    <group ref={group}>
      <primitive object={scene} />
    </group>
  );
}

export default function ModelViewer({
  url = "/models/model.glb",
  height = 420,
}: {
  url?: string;
  height?: number;
}) {
  return (
    <div
      style={{ height }}
      className="w-full rounded-xl overflow-hidden bg-gradient-to-b from-zinc-900 to-black border border-zinc-800"
    >
      <Canvas camera={{ position: [3, 2, 5], fov: 45 }} dpr={[1, 2]}>
        <Suspense fallback={null}>
          <Stage environment="city" intensity={0.6} adjustCamera={1.2}>
            <SpinningModel url={url} />
          </Stage>
        </Suspense>
        <OrbitControls enablePan={false} autoRotate={false} makeDefault />
      </Canvas>
    </div>
  );
}

useGLTF.preload("/models/model.glb");
