/**
 * Hook for setting up the Three.js scene with lighting and camera
 */

import { useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';

export interface SceneSetupOptions {
  showShadows?: boolean;
  devicePerformance?: 'low' | 'medium' | 'high';
  boardSize?: number;
}

export function useSceneSetup(options: SceneSetupOptions = {}) {
  const { scene, camera, gl } = useThree();
  const { showShadows = true, devicePerformance = 'high', boardSize = 8 } = options;
  const lightsRef = useRef<THREE.Light[]>([]);

  // Set up camera
  useEffect(() => {
    camera.position.set(boardSize * 0.6, boardSize * 0.8, boardSize * 0.6);
    camera.lookAt(boardSize / 2, 0, boardSize / 2);
    camera.up.set(0, 1, 0);
  }, [camera, boardSize]);

  // Set up lighting
  useEffect(() => {
    // Clear existing lights
    lightsRef.current.forEach((light) => scene.remove(light));
    lightsRef.current = [];

    // Ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    lightsRef.current.push(ambientLight);

    // Directional light (sun)
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(boardSize * 0.5, boardSize * 1.2, boardSize * 0.5);
    
    if (showShadows && devicePerformance !== 'low') {
      directionalLight.castShadow = true;
      directionalLight.shadow.mapSize.width = devicePerformance === 'high' ? 2048 : 1024;
      directionalLight.shadow.mapSize.height = devicePerformance === 'high' ? 2048 : 1024;
      directionalLight.shadow.camera.near = 0.5;
      directionalLight.shadow.camera.far = boardSize * 2;
      directionalLight.shadow.camera.left = -boardSize;
      directionalLight.shadow.camera.right = boardSize;
      directionalLight.shadow.camera.top = boardSize;
      directionalLight.shadow.camera.bottom = -boardSize;
      directionalLight.shadow.bias = -0.0001;
    }
    
    scene.add(directionalLight);
    lightsRef.current.push(directionalLight);

    // Additional fill light
    const fillLight = new THREE.DirectionalLight(0xffffff, 0.3);
    fillLight.position.set(-boardSize * 0.3, boardSize * 0.5, -boardSize * 0.3);
    scene.add(fillLight);
    lightsRef.current.push(fillLight);

    return () => {
      lightsRef.current.forEach((light) => scene.remove(light));
      lightsRef.current = [];
    };
  }, [scene, showShadows, devicePerformance, boardSize]);

  // Set up shadow map
  useEffect(() => {
    if (showShadows && devicePerformance !== 'low') {
      gl.shadowMap.enabled = true;
      gl.shadowMap.type = devicePerformance === 'high' ? THREE.PCFSoftShadowMap : THREE.BasicShadowMap;
    } else {
      gl.shadowMap.enabled = false;
    }
  }, [gl, showShadows, devicePerformance]);

  return { scene, camera, gl };
}

