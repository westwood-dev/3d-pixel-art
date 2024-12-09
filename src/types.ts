import type * as THREE from 'three';

export interface MaterialConfig {
  material: THREE.Material | (() => THREE.Material);
  addToGUI?: boolean;
}

export interface MaterialMappings {
  [key: string]: MaterialConfig;
}
