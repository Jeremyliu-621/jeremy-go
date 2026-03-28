import { useRef, useEffect, useMemo, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";

interface Pokeball3DProps {
  wobble?: boolean;
  wobbleIntensity?: number;
  spin?: boolean;
  spinSpeed?: number;
  pulse?: boolean;
}

export default function Pokeball3D({
  wobble = false,
  wobbleIntensity = 0.3,
  spin = false,
  spinSpeed = 2,
  pulse = false,
}: Pokeball3DProps) {
  const groupRef = useRef<THREE.Group>(null);
  const { scene } = useGLTF("/pokeball.glb");
  const [autoScale, setAutoScale] = useState(1);

  const clonedScene = useMemo(() => scene.clone(true), [scene]);

  useEffect(() => {
    const box = new THREE.Box3().setFromObject(clonedScene);
    const size = new THREE.Vector3();
    box.getSize(size);
    const maxDim = Math.max(size.x, size.y, size.z);
    if (maxDim > 0) {
      setAutoScale(1.6 / maxDim);
    }

    const center = new THREE.Vector3();
    box.getCenter(center);
    clonedScene.position.sub(center);

    clonedScene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
  }, [clonedScene]);

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.elapsedTime;

    if (wobble) {
      groupRef.current.rotation.z =
        Math.sin(t * 8) * wobbleIntensity * Math.exp(-t * 0.5);
      groupRef.current.position.y = Math.abs(Math.sin(t * 8)) * 0.05;
    }

    if (spin) {
      groupRef.current.rotation.y += spinSpeed * 0.016;
    }

    if (pulse) {
      const baseScale = autoScale;
      const s = baseScale * (1 + Math.sin(t * 3) * 0.04);
      groupRef.current.scale.setScalar(s);
    }
  });

  return (
    <group ref={groupRef} scale={pulse ? undefined : autoScale}>
      <primitive object={clonedScene} />
    </group>
  );
}

useGLTF.preload("/pokeball.glb");
