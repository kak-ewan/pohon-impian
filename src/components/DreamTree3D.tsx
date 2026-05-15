import React, { Suspense, useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { 
  OrbitControls, 
  PerspectiveCamera, 
  Float, 
  Environment, 
  Sky, 
  ContactShadows,
  Html
} from '@react-three/drei';
import * as THREE from 'three';
import { DreamLeaf } from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface DreamTree3DProps {
  leaves: DreamLeaf[];
  onLeafClick?: (leaf: DreamLeaf) => void;
  rotationSpeed?: number;
}

// Low-poly Tree Component
function LowPolyTree() {
  const trunkRef = useRef<THREE.Group>(null);

  return (
    <group ref={trunkRef}>
      {/* Trunk */}
      <mesh position={[0, 2.5, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.3, 0.6, 5, 6]} />
        <meshStandardMaterial color="#5d4037" roughness={0.9} flatShading />
      </mesh>
      
      {/* Foliage Clusters */}
      <mesh position={[0, 4.5, 0]} castShadow>
        <icosahedronGeometry args={[2.8, 0]} />
        <meshStandardMaterial color="#2e7d32" roughness={0.8} flatShading />
      </mesh>
      <mesh position={[1.5, 5.2, 1]} castShadow scale={0.7}>
        <icosahedronGeometry args={[2.2, 0]} />
        <meshStandardMaterial color="#388e3c" roughness={0.8} flatShading />
      </mesh>
      <mesh position={[-1.2, 5.5, -0.8]} castShadow scale={0.6}>
        <icosahedronGeometry args={[2.5, 0]} />
        <meshStandardMaterial color="#4caf50" roughness={0.8} flatShading />
      </mesh>
      <mesh position={[0.5, 6.2, -1.2]} castShadow scale={0.5}>
        <icosahedronGeometry args={[2, 0]} />
        <meshStandardMaterial color="#66bb6a" roughness={0.8} flatShading />
      </mesh>

      {/* Structural Branches */}
      <group position={[0, 4, 0]}>
        <mesh position={[1.2, 0.5, 0.8]} rotation={[0.4, 0.2, -Math.PI / 4]} castShadow>
          <cylinderGeometry args={[0.05, 0.15, 2.5, 4]} />
          <meshStandardMaterial color="#5d4037" flatShading />
        </mesh>
        <mesh position={[-1.2, 0.8, -1]} rotation={[-0.3, -0.5, Math.PI / 3]} castShadow>
          <cylinderGeometry args={[0.05, 0.15, 2.2, 4]} />
          <meshStandardMaterial color="#5d4037" flatShading />
        </mesh>
      </group>
    </group>
  );
}

// Interactive 3D Fulfillment Component (The "Promise Ball")
function Leaf3D({ leaf, index, onLeafClick }: { leaf: DreamLeaf, index: number, onLeafClick?: (leaf: DreamLeaf) => void }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.MeshStandardMaterial>(null);
  const groupRef = useRef<THREE.Group>(null);
  
  const position = useMemo(() => {
    const idStr = String(leaf.id);
    const seed = parseInt(idStr.slice(-5), 36) || index;
    const angle = (seed % 100) * (Math.PI * 2 / 100);
    const height = 3.5 + (seed % 30) / 10; 
    const radius = 1.5 + (seed % 15) / 10;
    
    return [
      Math.cos(angle) * radius,
      height,
      Math.sin(angle) * radius
    ] as [number, number, number];
  }, [leaf.id, index]);

  const rotation = useMemo(() => {
    const idStr = String(leaf.id);
    const seed = parseInt(idStr.slice(-5), 36) || index;
    return [
      (seed % 50) / 100,
      (seed % 360) * (Math.PI / 180),
      (seed % 50) / 100
    ] as [number, number, number];
  }, [leaf.id, index]);

  const idStrForScale = String(leaf.id);
  const baseScale = 0.35 + (parseInt(idStrForScale.slice(-2), 16) % 15) / 100;

  // Pulsing and Glowing Animation
  useFrame((state) => {
    if (!materialRef.current || !groupRef.current) return;
    
    const time = state.clock.elapsedTime + index;
    const pulse = Math.sin(time * 2) * 0.05;
    
    // Scale pulse
    groupRef.current.scale.setScalar(baseScale + pulse);
    
    // Glowing emissive pulse
    materialRef.current.emissiveIntensity = 0.3 + Math.sin(time * 2) * 0.2;
  });

  return (
    <Float 
      speed={1 + (index % 2)} 
      rotationIntensity={0.2} 
      floatIntensity={0.3} 
      position={position}
    >
      <group 
        ref={groupRef}
        rotation={rotation} 
        scale={baseScale}
        onClick={(e) => {
          e.stopPropagation();
          onLeafClick?.(leaf);
        }}
        onPointerOver={() => { document.body.style.cursor = 'pointer'; }}
        onPointerOut={() => { document.body.style.cursor = 'auto'; }}
      >
        {/* Promise Ball Shape - Spherical and glowing */}
        <mesh ref={meshRef} castShadow>
          <sphereGeometry args={[0.85, 24, 24]} />
          <meshStandardMaterial 
            ref={materialRef}
            color={leaf.color} 
            roughness={0.1} 
            metalness={0.4} 
            emissive={leaf.color}
            emissiveIntensity={0.3}
          />
        </mesh>
        
        {/* Simple attachment point */}
        <mesh position={[0, 0.75, 0]}>
          <cylinderGeometry args={[0.08, 0.08, 0.2, 8]} />
          <meshStandardMaterial color="#444" metalness={0.8} />
        </mesh>
        
        {/* Hover Label */}
        <Html position={[0, 1.2, 0]} center distanceFactor={10}>
          <div className="bg-white/90 backdrop-blur-md text-green-800 text-[10px] font-black px-3 py-1 rounded-full whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity border-2 border-green-200 pointer-events-none shadow-xl flex items-center gap-1 uppercase tracking-wider">
            {leaf.studentName}
          </div>
        </Html>
      </group>
    </Float>
  );
}

// Dream Dust Particles
function DreamDust({ count = 20 }: { count?: number }) {
  const points = useMemo(() => {
    const p = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      p[i * 3] = (Math.random() - 0.5) * 15;
      p[i * 3 + 1] = Math.random() * 8;
      p[i * 3 + 2] = (Math.random() - 0.5) * 15;
    }
    return p;
  }, [count]);

  const ref = useRef<THREE.Points>(null);
  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.y += 0.002;
      ref.current.position.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.2;
    }
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={points}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.15}
        color="#fff176"
        transparent
        opacity={0.6}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

// Low-poly Butterfly
function Butterfly({ index }: { index: number }) {
  const meshRef = useRef<THREE.Group>(null);
  const wingRefL = useRef<THREE.Mesh>(null);
  const wingRefR = useRef<THREE.Mesh>(null);
  
  const seed = index * 133.7;
  const initialPos = useMemo(() => [
    (Math.random() - 0.5) * 10,
    3 + Math.random() * 4,
    (Math.random() - 0.5) * 10
  ] as [number, number, number], []);

  useFrame((state) => {
    if (!meshRef.current) return;
    const time = state.clock.elapsedTime + seed;
    
    // Perching logic: every 20 seconds, stay still for 5 seconds
    const cycle = time % 25;
    const isPerching = cycle > 20;

    if (!isPerching) {
      // Path movement
      meshRef.current.position.x = initialPos[0] + Math.sin(time * 0.5) * 3;
      meshRef.current.position.z = initialPos[2] + Math.cos(time * 0.5) * 3;
      meshRef.current.position.y = initialPos[1] + Math.sin(time * 1.5) * 0.5;
      
      // Rotation toward direction
      meshRef.current.rotation.y = time * 0.5 + Math.PI / 2;
      
      // Wing flapping
      if (wingRefL.current) wingRefL.current.rotation.z = Math.sin(time * 15) * 0.8;
      if (wingRefR.current) wingRefR.current.rotation.z = -Math.sin(time * 15) * 0.8;
    } else {
      // Perching states: slow down wings
      if (wingRefL.current) wingRefL.current.rotation.z = Math.sin(time * 2) * 0.2;
      if (wingRefR.current) wingRefR.current.rotation.z = -Math.sin(time * 2) * 0.2;
      // Perch on a branch (simplified: stay at a fixed low height near center)
      meshRef.current.position.y = Math.max(meshRef.current.position.y - 0.01, 1.8);
    }
  });

  return (
    <group ref={meshRef}>
      <mesh ref={wingRefL} position={[-0.1, 0, 0]}>
        <planeGeometry args={[0.2, 0.2]} />
        <meshStandardMaterial color="#ffeb3b" side={THREE.DoubleSide} flatShading />
      </mesh>
      <mesh ref={wingRefR} position={[0.1, 0, 0]}>
        <planeGeometry args={[0.2, 0.2]} />
        <meshStandardMaterial color="#ffeb3b" side={THREE.DoubleSide} flatShading />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 0.3]} />
        <meshStandardMaterial color="#212121" />
      </mesh>
    </group>
  );
}

// Low-poly Cloud
function Cloud({ position }: { position: [number, number, number] }) {
  return (
    <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.5} position={position}>
      <group scale={0.8 + Math.random() * 0.5}>
        <mesh position={[0, 0, 0]} castShadow>
          <icosahedronGeometry args={[2, 0]} />
          <meshStandardMaterial color="white" flatShading opacity={0.8} transparent />
        </mesh>
        <mesh position={[1.5, -0.5, 0.5]} castShadow scale={0.7}>
          <icosahedronGeometry args={[2, 0]} />
          <meshStandardMaterial color="white" flatShading opacity={0.8} transparent />
        </mesh>
        <mesh position={[-1.2, -0.2, -1]} castShadow scale={0.8}>
          <icosahedronGeometry args={[2.5, 0]} />
          <meshStandardMaterial color="white" flatShading opacity={0.8} transparent />
        </mesh>
      </group>
    </Float>
  );
}

// Live Background / Ground
function World() {
  return (
    <>
      <DreamDust count={40} />
      {/* Ground - Rugged Floating Island with fixed layers */}
      <group position={[0, 0, 0]}>
        {/* Top Grass Layer */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
          <circleGeometry args={[4.6, 8]} />
          <meshStandardMaterial color="#388e3c" flatShading roughness={1} />
        </mesh>

        {/* Rocky layers underneath for "realism" - no overlapping Y to avoid glitch */}
        <mesh rotation={[Math.PI, 0, 0]} position={[0.05, -0.4, 0.05]} castShadow>
          <cylinderGeometry args={[4.5, 4.3, 0.4, 9]} />
          <meshStandardMaterial color="#5d4037" flatShading roughness={1} />
        </mesh>
        
        <mesh rotation={[0, Math.PI / 4, 0]} position={[0.2, -1.0, -0.15]} castShadow scale={[0.92, 1, 0.95]}>
          <cylinderGeometry args={[4, 2.8, 0.9, 7]} />
          <meshStandardMaterial color="#4e342e" flatShading roughness={1} />
        </mesh>
        
        <mesh rotation={[0.1, -Math.PI / 6, 0.1]} position={[-0.3, -1.9, 0.2]} castShadow scale={[0.75, 1.3, 0.72]}>
          <cylinderGeometry args={[2.5, 0.1, 1.6, 6]} />
          <meshStandardMaterial color="#3e2723" flatShading roughness={1} />
        </mesh>

        {/* Extra floating rocks for atmosphere */}
        <mesh position={[5, -1, -3]} rotation={[1, 2, 3]} scale={0.4}>
          <icosahedronGeometry args={[1, 0]} />
          <meshStandardMaterial color="#4e342e" flatShading />
        </mesh>
        <mesh position={[-4, -2, 4]} rotation={[2, 1, 0]} scale={0.3}>
          <icosahedronGeometry args={[1, 0]} />
          <meshStandardMaterial color="#5d4037" flatShading />
        </mesh>
      </group>

      {/* Butterflies */}
      <Butterfly index={0} />
      <Butterfly index={1} />
      <Butterfly index={2} />

      {/* Floating clouds */}
      <Cloud position={[-12, 10, -10]} />
      <Cloud position={[14, 12, -15]} />
      <Cloud position={[5, 15, -25]} />
      <Cloud position={[-18, 14, -20]} />

      <Sky sunPosition={[100, 10, 100]} turbidity={0.05} rayleigh={0.3} />
      <Environment preset="park" />
    </>
  );
}

// Helper component to manage rotation frame
function IslandRotationManager({ islandRef, rotationSpeed }: { islandRef: React.RefObject<THREE.Group | null>, rotationSpeed: number }) {
  useFrame((_, delta) => {
    if (islandRef.current) {
      islandRef.current.rotation.y += delta * rotationSpeed * 1.5;
    }
  });
  return null;
}

export default function DreamTree3D({ leaves, onLeafClick, rotationSpeed = 0.15 }: DreamTree3DProps) {
  const islandRef = useRef<THREE.Group>(null);

  return (
    <div className="absolute inset-0 w-full h-full z-0 overflow-hidden bg-sky-100">
      <Canvas shadows dpr={[1, 2]}>
        <PerspectiveCamera makeDefault position={[0, 5, 12]} fov={45} />
        <OrbitControls 
          enablePan={true} 
          minDistance={8} 
          maxDistance={30} 
          maxPolarAngle={Math.PI / 1.8}
          target={[0, 2, 0]}
          autoRotate={false}
        />

        <ambientLight intensity={0.6} />
        <directionalLight 
          position={[5, 10, 5]} 
          intensity={1.5} 
          castShadow 
          shadow-mapSize={[1024, 1024]}
        />

        <Suspense fallback={null}>
          <IslandRotationManager islandRef={islandRef} rotationSpeed={rotationSpeed} />
          <group ref={islandRef} position={[0, -1, 0]}>
            <LowPolyTree />
            {leaves.map((leaf, index) => (
              <Leaf3D 
                key={leaf.id} 
                leaf={leaf} 
                index={index} 
                onLeafClick={onLeafClick} 
              />
            ))}
            <World />
          </group>
          <ContactShadows 
            position={[0, -0.99, 0]} 
            opacity={0.4} 
            scale={20} 
            blur={2.4} 
            far={10} 
          />
        </Suspense>
      </Canvas>

      {/* 3D Instruction Hint */}
      <div className="absolute bottom-24 left-1/2 -translate-x-1/2 pointer-events-none opacity-50 text-[10px] uppercase tracking-widest font-bold text-green-800/40">
        Klik & seret untuk melihat sekeliling
      </div>
    </div>
  );
}
