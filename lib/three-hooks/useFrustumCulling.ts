/**
 * Hook for frustum culling optimization - only render objects visible in camera view
 */

import { useThree, useFrame } from '@react-three/fiber';
import { useRef, useMemo } from 'react';
import * as THREE from 'three';

export interface CullableObject {
  object: THREE.Object3D;
  boundingBox?: THREE.Box3;
}

/**
 * Hook that performs frustum culling on objects
 * Objects outside the camera's view frustum are set to invisible
 */
export function useFrustumCulling(objects: CullableObject[], enabled: boolean = true) {
  const { camera } = useThree();
  const frustum = useMemo(() => new THREE.Frustum(), []);
  const matrix = useMemo(() => new THREE.Matrix4(), []);

  useFrame(() => {
    if (!enabled) {
      // If disabled, make all objects visible
      objects.forEach(({ object }) => {
        object.visible = true;
      });
      return;
    }

    // Update frustum from camera
    matrix.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
    frustum.setFromProjectionMatrix(matrix);

    // Check each object
    objects.forEach(({ object, boundingBox }) => {
      if (boundingBox) {
        // Use custom bounding box if provided
        object.visible = frustum.intersectsBox(boundingBox);
      } else {
        // Compute bounding box on the fly (less efficient)
        const box = new THREE.Box3().setFromObject(object);
        object.visible = frustum.intersectsBox(box);
      }
    });
  });
}

/**
 * Helper to compute bounding box for an object
 */
export function computeBoundingBox(object: THREE.Object3D): THREE.Box3 {
  return new THREE.Box3().setFromObject(object);
}

