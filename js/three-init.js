// Using global THREE object loaded in index.html

// Make THREE globally available for legacy code
window.THREE = THREE;
window.GLTFLoader = GLTFLoader;
window.OrbitControls = OrbitControls;

console.log('✅ THREE.js loaded successfully as module');
console.log('THREE version:', THREE.REVISION);

// Export for module usage
export { THREE, GLTFLoader, OrbitControls };


