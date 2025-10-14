export class MicroMovementManager {
    constructor() {
        this.movements = {};
        this.isActive = false;
        this.movementIntervals = {};
    }

    async initialize() {
        console.log('🔄 Initializing Micro Movement Manager...');
        
        // Initialize micro movements
        this.movements = {
            blink: { active: false, frequency: 3000, lastBlink: 0 },
            breathing: { active: true, frequency: 2000, lastBreath: 0 },
            hairMovement: { active: true, frequency: 5000, lastMovement: 0 },
            gazeShift: { active: true, frequency: 8000, lastShift: 0 },
            fidget: { active: true, frequency: 10000, lastFidget: 0 }
        };
        
        console.log('✅ Micro Movement Manager initialized!');
    }

    start() {
        if (this.isActive) return;
        
        this.isActive = true;
        console.log('🔄 Starting micro movements');
        
        // Start each movement type
        Object.keys(this.movements).forEach(movementType => {
            this.startMovement(movementType);
        });
    }

    stop() {
        if (!this.isActive) return;
        
        this.isActive = false;
        console.log('⏹️ Stopping micro movements');
        
        // Clear all intervals
        Object.values(this.movementIntervals).forEach(interval => {
            if (interval) clearInterval(interval);
        });
        this.movementIntervals = {};
    }

    startMovement(movementType) {
        const movement = this.movements[movementType];
        if (!movement.active) return;
        
        const interval = setInterval(() => {
            if (this.isActive) {
                this.performMovement(movementType);
            }
        }, movement.frequency);
        
        this.movementIntervals[movementType] = interval;
    }

    performMovement(movementType) {
        const currentTime = Date.now();
        const movement = this.movements[movementType];
        
        if (currentTime - movement.lastMovement < movement.frequency) {
            return;
        }
        
        movement.lastMovement = currentTime;
        
        switch (movementType) {
            case 'blink':
                this.performBlink();
                break;
            case 'breathing':
                this.performBreathing();
                break;
            case 'hairMovement':
                this.performHairMovement();
                break;
            case 'gazeShift':
                this.performGazeShift();
                break;
            case 'fidget':
                this.performFidget();
                break;
        }
    }

    performBlink() {
        console.log('👁️ Blinking');
        // This would trigger a blink animation in the renderer
    }

    performBreathing() {
        console.log('🫁 Breathing cycle');
        // This would trigger a subtle breathing animation
    }

    performHairMovement() {
        console.log('💨 Hair movement');
        // This would trigger subtle hair movement
    }

    performGazeShift() {
        console.log('👀 Gaze shift');
        // This would trigger a subtle eye movement
    }

    performFidget() {
        console.log('🤏 Fidgeting');
        // This would trigger a small fidgeting movement
    }

    setMovementFrequency(movementType, frequency) {
        if (this.movements[movementType]) {
            this.movements[movementType].frequency = frequency;
            console.log(`🔄 Updated ${movementType} frequency to ${frequency}ms`);
        }
    }

    enableMovement(movementType) {
        if (this.movements[movementType]) {
            this.movements[movementType].active = true;
            this.startMovement(movementType);
            console.log(`✅ Enabled ${movementType} movement`);
        }
    }

    disableMovement(movementType) {
        if (this.movements[movementType]) {
            this.movements[movementType].active = false;
            
            // Clear interval if exists
            if (this.movementIntervals[movementType]) {
                clearInterval(this.movementIntervals[movementType]);
                delete this.movementIntervals[movementType];
            }
            
            console.log(`❌ Disabled ${movementType} movement`);
        }
    }

    getMovementStatus() {
        const status = {};
        
        Object.entries(this.movements).forEach(([type, movement]) => {
            status[type] = {
                active: movement.active,
                frequency: movement.frequency,
                lastMovement: movement.lastMovement
            };
        });
        
        return status;
    }

    // Trigger a specific movement immediately
    triggerMovement(movementType) {
        if (this.movements[movementType] && this.movements[movementType].active) {
            this.performMovement(movementType);
        }
    }

    // Get movement statistics
    getMovementStats() {
        return {
            isActive: this.isActive,
            activeMovements: Object.values(this.movements).filter(m => m.active).length,
            totalMovements: Object.keys(this.movements).length
        };
    }
} 