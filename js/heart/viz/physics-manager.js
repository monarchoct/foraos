// Using global THREE object loaded in index.html

export class PhysicsManager {
    constructor() {
        this.isInitialized = false;
        this.character = null;
        this.animationMixer = null;
        this.physicsBodies = new Map();
        this.forces = new Map();
        this.velocities = new Map();
        this.positions = new Map();
        this.clock = new THREE.Clock();
    }

    async initialize(character, animationMixer) {
        console.log('🔬 Initializing Simple Physics Manager...');
        
        this.character = character;
        this.animationMixer = animationMixer;
        
        // Setup physics bodies for character meshes
        this.setupCharacterPhysics();
        
        this.isInitialized = true;
        console.log('✅ Simple Physics Manager initialized successfully!');
    }

    setupCharacterPhysics() {
        if (!this.character) return;
        
        console.log('🎭 Setting up character physics...');
        
        // Traverse character meshes and create physics bodies
        this.character.traverse((child) => {
            if (child.isMesh) {
                this.addPhysicsBody(child);
            }
        });
        
        console.log(`📊 Added ${this.physicsBodies.size} physics bodies`);
    }

    addPhysicsBody(mesh) {
        // Only add physics to specific body parts, not the entire character
        const physicsParts = ['Hips', 'Spine', 'Chest', 'Head', 'LeftArm', 'RightArm', 'LeftLeg', 'RightLeg'];
        
        if (!physicsParts.some(part => mesh.name.includes(part))) {
            console.log(`⏭️ Skipping physics for: ${mesh.name} (not a physics part)`);
            return;
        }
        
        // Store initial position
        this.positions.set(mesh, mesh.position.clone());
        
        // Initialize velocity
        this.velocities.set(mesh, new THREE.Vector3(0, 0, 0));
        
        // Initialize forces
        this.forces.set(mesh, new THREE.Vector3(0, 0, 0));
        
        // Store physics body info with constraints
        this.physicsBodies.set(mesh, {
            mass: 1.0,
            damping: 0.98, // Higher damping to prevent excessive movement
            gravity: new THREE.Vector3(0, -2.0, 0), // Reduced gravity
            maxDistance: 0.5, // Maximum distance from original position
            originalPosition: mesh.position.clone()
        });
        
        console.log(`✅ Added physics body for: ${mesh.name}`);
    }

    update(deltaTime) {
        if (!this.isInitialized) return;
        
        // Update physics simulation
        this.physicsBodies.forEach((body, mesh) => {
            this.updatePhysicsBody(mesh, body, deltaTime);
        });
    }

    updatePhysicsBody(mesh, body, deltaTime) {
        // Get current state
        const velocity = this.velocities.get(mesh);
        const force = this.forces.get(mesh);
        const position = this.positions.get(mesh);
        
        if (!velocity || !force || !position) return;
        
        // Apply gravity (reduced)
        const gravityForce = body.gravity.clone().multiplyScalar(body.mass);
        force.add(gravityForce);
        
        // Calculate acceleration (F = ma, so a = F/m)
        const acceleration = force.clone().divideScalar(body.mass);
        
        // Update velocity (v = v + a * dt)
        velocity.add(acceleration.clone().multiplyScalar(deltaTime));
        
        // Apply damping
        velocity.multiplyScalar(body.damping);
        
        // Update position (p = p + v * dt)
        position.add(velocity.clone().multiplyScalar(deltaTime));
        
        // Apply constraints to prevent excessive movement
        const distanceFromOriginal = position.distanceTo(body.originalPosition);
        if (distanceFromOriginal > body.maxDistance) {
            // Pull back towards original position
            const direction = position.clone().sub(body.originalPosition).normalize();
            position.copy(body.originalPosition).add(direction.multiplyScalar(body.maxDistance));
            velocity.multiplyScalar(0.5); // Reduce velocity when constrained
        }
        
        // Apply position to mesh
        mesh.position.copy(position);
        
        // Reset forces for next frame
        force.set(0, 0, 0);
    }

    // Apply forces to character parts
    applyForce(meshName, force, position = null) {
        const mesh = this.character.getObjectByName(meshName);
        if (!mesh || !this.forces.has(mesh)) {
            console.warn(`⚠️ No physics body found for mesh: ${meshName}`);
            return;
        }
        
        const currentForce = this.forces.get(mesh);
        currentForce.add(new THREE.Vector3(force.x, force.y, force.z));
        
        console.log(`💪 Applied force to ${meshName}:`, force);
    }

    // Apply impulse (instant velocity change)
    applyImpulse(meshName, impulse) {
        const mesh = this.character.getObjectByName(meshName);
        if (!mesh || !this.velocities.has(mesh)) {
            console.warn(`⚠️ No physics body found for mesh: ${meshName}`);
            return;
        }
        
        const velocity = this.velocities.get(mesh);
        velocity.add(new THREE.Vector3(impulse.x, impulse.y, impulse.z));
        
        console.log(`⚡ Applied impulse to ${meshName}:`, impulse);
    }

    // Set velocity directly
    setVelocity(meshName, velocity) {
        const mesh = this.character.getObjectByName(meshName);
        if (!mesh || !this.velocities.has(mesh)) {
            console.warn(`⚠️ No physics body found for mesh: ${meshName}`);
            return;
        }
        
        const currentVelocity = this.velocities.get(mesh);
        currentVelocity.set(velocity.x, velocity.y, velocity.z);
        
        console.log(`🏃 Set velocity for ${meshName}:`, velocity);
    }

    // Reset physics body to original position
    resetBody(meshName) {
        const mesh = this.character.getObjectByName(meshName);
        if (!mesh || !this.positions.has(mesh)) {
            console.warn(`⚠️ No physics body found for mesh: ${meshName}`);
            return;
        }
        
        const originalPosition = this.positions.get(mesh);
        mesh.position.copy(originalPosition);
        
        const velocity = this.velocities.get(mesh);
        velocity.set(0, 0, 0);
        
        const force = this.forces.get(mesh);
        force.set(0, 0, 0);
        
        console.log(`🔄 Reset physics body: ${meshName}`);
    }

    // Enable/disable physics for specific meshes
    setPhysicsEnabled(meshName, enabled) {
        const mesh = this.character.getObjectByName(meshName);
        if (!mesh) return;
        
        if (enabled) {
            // Re-add to physics simulation
            this.addPhysicsBody(mesh);
        } else {
            // Remove from physics simulation
            this.physicsBodies.delete(mesh);
            this.forces.delete(mesh);
            this.velocities.delete(mesh);
            this.positions.delete(mesh);
        }
        
        console.log(`${enabled ? '✅' : '❌'} Physics ${enabled ? 'enabled' : 'disabled'} for ${meshName}`);
    }

    // Get physics state
    getPhysicsState() {
        return {
            isInitialized: this.isInitialized,
            bodyCount: this.physicsBodies.size,
            forcesCount: this.forces.size,
            velocitiesCount: this.velocities.size
        };
    }

    // Cleanup
    dispose() {
        this.physicsBodies.clear();
        this.forces.clear();
        this.velocities.clear();
        this.positions.clear();
    }

    // Emergency reset - reset all meshes to original positions
    emergencyReset() {
        console.log('🚨 Emergency physics reset...');
        
        this.physicsBodies.forEach((body, mesh) => {
            // Reset to original position
            mesh.position.copy(body.originalPosition);
            
            // Reset velocity and forces
            const velocity = this.velocities.get(mesh);
            const force = this.forces.get(mesh);
            if (velocity) velocity.set(0, 0, 0);
            if (force) force.set(0, 0, 0);
        });
        
        console.log('✅ Emergency reset complete');
    }

    // Disable physics entirely
    disablePhysics() {
        console.log('❌ Disabling physics system...');
        this.isInitialized = false;
        
        // Reset all meshes to original positions
        this.physicsBodies.forEach((body, mesh) => {
            mesh.position.copy(body.originalPosition);
        });
        
        console.log('✅ Physics disabled');
    }
} 