import React, { useRef, useMemo } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import { Sphere, Float, Stars, Points, PointMaterial } from '@react-three/drei';
import * as THREE from 'three';

// ---------------------------------------------------------
// Golden Nebula Dust Particles
// ---------------------------------------------------------
function NebulaDust({ count = 2000 }) {
  const points = useMemo(() => {
    const p = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const r = 6 + Math.random() * 15; // wide spread
      const theta = 2 * Math.PI * Math.random();
      const phi = Math.acos(2 * Math.random() - 1);
      p[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      p[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      p[i * 3 + 2] = r * Math.cos(phi);
    }
    return p;
  }, [count]);

  const ref = useRef();
  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.y = state.clock.getElapsedTime() * 0.02;
      ref.current.rotation.z = state.clock.getElapsedTime() * 0.01;
    }
  });

  return (
    <Points ref={ref} positions={points} stride={3}>
      <PointMaterial transparent color="#fbbf24" size={0.08} sizeAttenuation={true} depthWrite={false} blending={THREE.AdditiveBlending} opacity={0.6} />
    </Points>
  );
}

// ---------------------------------------------------------
// Cinematic Earth & Nebula Scene
// ---------------------------------------------------------

export default function ThreeScene() {
  const groupRef = useRef();
  const earthGroupRef = useRef();
  const networkRef = useRef();

  // Load realistic earth textures
  const [colorMap, normalMap, specularMap] = useLoader(THREE.TextureLoader, [
    'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_atmos_2048.jpg',
    'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_normal_2048.jpg',
    'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_specular_2048.jpg'
  ]);

  const networkGeo = useMemo(() => new THREE.IcosahedronGeometry(4.53, 12), []);

  useFrame((state) => {
    const targetX = (state.pointer.x * Math.PI) / 20;
    const targetY = (state.pointer.y * Math.PI) / 20;

    // Mouse Parallax
    if (groupRef.current) {
      groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, targetX, 0.05);
      groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, -targetY, 0.05);
    }
    
    // Slow Earth Rotation
    if (earthGroupRef.current) {
      earthGroupRef.current.rotation.y += 0.0008; // Very slow and majestic
    }

    // Network lines pulse and rotate slightly faster
    if (networkRef.current) {
      networkRef.current.rotation.y += 0.0012;
      networkRef.current.material.opacity = 0.2 + Math.sin(state.clock.getElapsedTime() * 2) * 0.1;
    }
  });

  return (
    <group ref={groupRef}>
      
      {/* ------------------------------------------- */}
      {/* Cinematic Lighting Setup                    */}
      {/* ------------------------------------------- */}
      
      {/* Deep dark cool ambient for the cool Earth tones */}
      <ambientLight intensity={0.1} color="#1e3a8a" />
      
      {/* Keylight simulating the sun hitting the Americas */}
      <directionalLight position={[10, 5, 8]} intensity={2.5} color="#ffffff" />
      
      {/* Intense Warm Orange/Gold Rim Light from behind */}
      <spotLight position={[-15, 5, -15]} intensity={8} color="#f59e0b" angle={0.8} penumbra={1} />
      <pointLight position={[0, -5, -10]} intensity={3} color="#ea580c" />

      {/* ------------------------------------------- */}
      {/* The Cinematic Earth                         */}
      {/* ------------------------------------------- */}
      <group position={[0, 0, -3]}>
        
        {/* Realistic Earth Core (Rotated to show Americas initially) */}
        <group ref={earthGroupRef} rotation={[0, -Math.PI / 1.5, 0]}>
          <Sphere args={[4.5, 64, 64]}>
            <meshPhongMaterial
              map={colorMap}
              normalMap={normalMap}
              specularMap={specularMap}
              normalScale={new THREE.Vector2(0.8, 0.8)}
              specular={new THREE.Color('grey')}
              shininess={10}
              color="#ffffff" // Natural cool colors
            />
          </Sphere>
          
          {/* Subtle natural atmosphere */}
          <Sphere args={[4.6, 64, 64]}>
            <meshPhysicalMaterial 
              color="#60a5fa" 
              transparent 
              opacity={0.1} 
              blending={THREE.AdditiveBlending}
              transmission={0.9}
            />
          </Sphere>
        </group>

        {/* Global Connectivity Network overlay */}
        <mesh ref={networkRef} geometry={networkGeo} rotation={[0, -Math.PI / 1.5, 0]}>
          <meshBasicMaterial 
            color="#fbbf24" // Bright gold
            wireframe={true} 
            transparent 
            opacity={0.25} 
            blending={THREE.AdditiveBlending}
          />
        </mesh>
        
        {/* Active Data Nodes flashing on the network intersections */}
        <points geometry={networkGeo} rotation={[0, -Math.PI / 1.5, 0]}>
          <pointsMaterial 
            color="#f59e0b" 
            size={0.03} 
            transparent 
            opacity={0.6} 
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </points>

      </group>

      {/* ------------------------------------------- */}
      {/* Nebula Background (Stars + Dust + Glows)    */}
      {/* ------------------------------------------- */}
      
      {/* Gold/Orange Nebula Dust */}
      <NebulaDust count={3000} />

      {/* Volumetric background illusions using faint spheres */}
      <Sphere args={[25, 32, 32]} position={[-10, 5, -20]}>
        <meshBasicMaterial color="#9a3412" transparent opacity={0.15} blending={THREE.AdditiveBlending} side={THREE.BackSide} />
      </Sphere>
      <Sphere args={[30, 32, 32]} position={[15, -10, -25]}>
        <meshBasicMaterial color="#b45309" transparent opacity={0.1} blending={THREE.AdditiveBlending} side={THREE.BackSide} />
      </Sphere>

      {/* Classic Stars */}
      <Stars radius={50} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
      
    </group>
  );
}
