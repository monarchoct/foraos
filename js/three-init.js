// Import THREE.js as a module
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// Make THREE globally available for legacy code
window.THREE = THREE;
window.GLTFLoader = GLTFLoader;
window.OrbitControls = OrbitControls;

console.log('✅ THREE.js loaded successfully as module');
console.log('THREE version:', THREE.REVISION);

// Export for module usage
export { THREE, GLTFLoader, OrbitControls };


