export class BackgroundManager {
    constructor(configManager = null) {
        this.currentBackground = 'default';
        this.isTransitioning = false;
        this.backgrounds = {};
        this.moodBackgrounds = {};
        this.loadedImages = new Map(); // Cache for loaded images
        this.onBackgroundChange = null; // Event callback
        this.configManager = configManager;
        
        // 🎭 Smooth transition properties
        this.transitionState = {
            isActive: false,
            startTime: 0,
            duration: 1500, // Default from personality config
            fromBackground: null,
            toBackground: null,
            progress: 0
        };
        
        // 🕐 Automatic background change timer
        this.autoChangeTimer = null;
        this.autoChangeInterval = 60000; // 1 minute in milliseconds
        this.lastAutoChange = 0;
    }

    async initialize() {
        console.log('🌅 Initializing Background Manager...');
        
        // Load transition settings from personality config
        const personality = this.configManager?.getConfig('personality');
        const backgroundSettings = personality?.backgroundSettings || {};
        
        // Update transition duration from config
        this.transitionState.duration = backgroundSettings.transitionDuration || 1500;
        
        // Initialize backgrounds with support for both gradients and images
        this.backgrounds = {
            // 🎨 Gradient backgrounds
            default: { type: 'gradient', colors: [0x1e1b4b, 0x312e81, 0x4338ca], name: 'Default Purple Gradient' },
            sunny: { type: 'gradient', colors: [0x87ceeb, 0x4fc3f7, 0x29b6f6], name: 'Sunny Sky Gradient' },
            cloudy: { type: 'gradient', colors: [0x778899, 0x90a4ae, 0xb0bec5], name: 'Cloudy Day Gradient' },
            night: { type: 'gradient', colors: [0x191970, 0x1a237e, 0x283593], name: 'Night Sky Gradient' },
            sunset: { type: 'gradient', colors: [0xff6b35, 0xff8a65, 0xffab91], name: 'Sunset Gradient' },
            rainy: { type: 'gradient', colors: [0x4682b4, 0x5c6bc0, 0x7986cb], name: 'Rainy Day Gradient' },
            
            // 🖼️ Image backgrounds (add your images here)
            anime1: { type: 'image', path: 'backgrounds/anime1.png', name: 'Anime Landscape' },
            neon12: { type: 'image', path: 'backgrounds/neon12.png', name: 'Neon 12 Background' },
            // Example: sunny_sky: { type: 'image', path: 'backgrounds/sunny_sky.png', name: 'Sunny Sky Image' },
            // Example: night_city: { type: 'image', path: 'backgrounds/night_city.jpg', name: 'Night City' },
            // Example: forest_path: { type: 'image', path: 'backgrounds/forest_path.png', name: 'Forest Path' }
        };
        
        // Set neon12 background as default
        this.currentBackground = 'neon12';
        
        // Removed mood-based background mappings - backgrounds now change automatically only
        // this.moodBackgrounds = { ... };
        
        // Preload any image backgrounds
        await this.preloadImageBackgrounds();
        
        // Start automatic background changes only if enabled in settings
        if (window.currentSettings?.background?.imageRotation) {
            this.startAutoBackgroundChanges();
        }
        
        console.log('✅ Background Manager initialized!');
        console.log('🎭 Transition duration:', this.transitionState.duration, 'ms');
        console.log('🕐 Auto background change interval:', this.autoChangeInterval / 1000, 'seconds');
    }

    // Removed setMood method - no more emotion-based background changes
    // setMood(mood) { ... }

    setBackground(backgroundName, transitionDuration = 1000) {
        if (this.isTransitioning) {
            console.log('⚠️ Already transitioning background');
            return;
        }
        
        if (!this.backgrounds[backgroundName]) {
            console.warn('⚠️ Unknown background:', backgroundName);
            return;
        }
        
        // Start smooth transition
        this.startSmoothTransition(backgroundName, transitionDuration);
    }

    // 🎭 START SMOOTH TRANSITION
    startSmoothTransition(toBackgroundName, duration = 1000) {
        const fromBackground = this.getBackgroundData();
        const toBackground = this.backgrounds[toBackgroundName];
        
        if (!toBackground) {
            console.warn('⚠️ Unknown background:', toBackgroundName);
            return;
        }
        
        this.transitionState = {
            isActive: true,
            startTime: Date.now(),
            duration: duration,
            fromBackground: fromBackground,
            toBackground: {
                type: toBackground.type,
                name: toBackground.name,
                color: toBackground.type === 'color' ? toBackground.color : null,
                colors: toBackground.type === 'gradient' ? toBackground.colors : null,
                image: toBackground.type === 'image' ? this.loadedImages.get(toBackground.path) : null,
                path: toBackground.type === 'image' ? toBackground.path : null
            },
            progress: 0
        };
        
        this.isTransitioning = true;
        console.log('🌅 Starting smooth transition to:', toBackgroundName);
        
        // Start transition animation loop
        this.updateTransition();
    }

    // 🎭 UPDATE TRANSITION
    updateTransition() {
        if (!this.transitionState.isActive) return;
        
        const currentTime = Date.now();
        const elapsed = currentTime - this.transitionState.startTime;
        const progress = Math.min(elapsed / this.transitionState.duration, 1.0);
        
        this.transitionState.progress = progress;
        
        // Calculate transition values
        const transitionValues = this.calculateTransitionValues(progress);
        
        // Trigger transition event with blend values
        if (this.onBackgroundChange) {
            this.onBackgroundChange({
                type: 'transition',
                progress: progress,
                fromBackground: this.transitionState.fromBackground,
                toBackground: this.transitionState.toBackground,
                blendValues: transitionValues
            });
        }
        
        // Check if transition is complete
        if (progress >= 1.0) {
            this.completeTransition();
        } else {
            // Continue animation
            requestAnimationFrame(() => this.updateTransition());
        }
    }

    // 🎭 CALCULATE TRANSITION VALUES
    calculateTransitionValues(progress) {
        const from = this.transitionState.fromBackground;
        const to = this.transitionState.toBackground;
        
        // Use easing function for smooth transition
        const easedProgress = this.easeInOutQuad(progress);
        
        if (from && to) {
            // Both backgrounds are gradient-based
            if (from.type === 'gradient' && to.type === 'gradient') {
                return {
                    type: 'gradient',
                    colors: this.interpolateGradients(from.colors, to.colors, easedProgress),
                    opacity: 1.0
                };
            }
            
            // Both backgrounds are color-based
            if (from.type === 'color' && to.type === 'color') {
                return {
                    type: 'color',
                    color: this.interpolateColor(from.color, to.color, easedProgress),
                    opacity: 1.0
                };
            }
            
            // Both backgrounds are image-based
            if (from.type === 'image' && to.type === 'image') {
                return {
                    type: 'image',
                    fromImage: from.image,
                    toImage: to.image,
                    blendFactor: easedProgress,
                    opacity: 1.0
                };
            }
            
            // Mixed transition (any combination)
            return {
                type: 'mixed',
                fromBackground: from,
                toBackground: to,
                blendFactor: easedProgress,
                opacity: 1.0
            };
        }
        
        // Fallback to simple opacity transition
        return {
            type: 'simple',
            opacity: easedProgress
        };
    }

    // 🎭 COMPLETE TRANSITION
    completeTransition() {
        // Find the background key by matching the path or name
        const toBackgroundPath = this.transitionState.toBackground.path;
        const toBackgroundName = this.transitionState.toBackground.name;
        
        const backgroundKey = Object.keys(this.backgrounds).find(key => {
            const bg = this.backgrounds[key];
            return (bg.path === toBackgroundPath) || (bg.name === toBackgroundName);
        });
        
        if (backgroundKey) {
            this.currentBackground = backgroundKey;
        }
        
        this.transitionState.isActive = false;
        this.isTransitioning = false;
        
        // Trigger final background change
        const finalBackground = this.getBackgroundData();
        if (this.onBackgroundChange && finalBackground) {
            this.onBackgroundChange({
                ...finalBackground,
                type: finalBackground.type,
                transitionComplete: true
            });
        }
        
        console.log('✅ Smooth background transition complete');
    }

    // 🎭 EASING FUNCTION
    easeInOutQuad(t) {
        return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    }

    // 🎭 COLOR INTERPOLATION
    interpolateColor(color1, color2, factor) {
        const r1 = (color1 >> 16) & 255;
        const g1 = (color1 >> 8) & 255;
        const b1 = color1 & 255;
        
        const r2 = (color2 >> 16) & 255;
        const g2 = (color2 >> 8) & 255;
        const b2 = color2 & 255;
        
        const r = Math.round(r1 + (r2 - r1) * factor);
        const g = Math.round(g1 + (g2 - g1) * factor);
        const b = Math.round(b1 + (b2 - b1) * factor);
        
        return (r << 16) | (g << 8) | b;
    }

    // 🎭 GRADIENT INTERPOLATION
    interpolateGradients(colors1, colors2, factor) {
        // Validate input arrays
        if (!Array.isArray(colors1)) {
            console.warn('⚠️ interpolateGradients: colors1 is not an array, using default');
            colors1 = [0x87CEEB, 0xFF69B4]; // Default gradient
        }
        if (!Array.isArray(colors2)) {
            console.warn('⚠️ interpolateGradients: colors2 is not an array, using default');
            colors2 = [0x87CEEB, 0xFF69B4]; // Default gradient
        }
        
        // Ensure both gradients have the same number of colors
        const maxColors = Math.max(colors1.length, colors2.length);
        const interpolatedColors = [];
        
        for (let i = 0; i < maxColors; i++) {
            const color1 = colors1[i] || colors1[colors1.length - 1];
            const color2 = colors2[i] || colors2[colors2.length - 1];
            interpolatedColors.push(this.interpolateColor(color1, color2, factor));
        }
        
        return interpolatedColors;
    }

    getCurrentBackground() {
        return {
            name: this.currentBackground,
            config: this.backgrounds[this.currentBackground]
        };
    }

    getBackgroundColor() {
        const background = this.backgrounds[this.currentBackground];
        if (!background) return 0x1e1b4b;
        
        // Return color for color backgrounds, fallback for image backgrounds
        if (background.type === 'color') {
            return background.color;
        } else if (background.type === 'image') {
            return 0x1e1b4b; // Fallback color for image backgrounds
        }
        
        return 0x1e1b4b;
    }

    // 🖼️ GET BACKGROUND IMAGE
    getBackgroundImage() {
        const background = this.backgrounds[this.currentBackground];
        if (!background || background.type !== 'image') {
            return null;
        }
        
        return this.loadedImages.get(background.path) || null;
    }

    // 🖼️ GET BACKGROUND TYPE
    getBackgroundType() {
        const background = this.backgrounds[this.currentBackground];
        return background ? background.type : 'color';
    }

    // 🖼️ GET BACKGROUND DATA
    getBackgroundData() {
        const background = this.backgrounds[this.currentBackground];
        if (!background) return null;
        
        return {
            type: background.type,
            name: background.name,
            color: background.type === 'color' ? background.color : null,
            colors: background.type === 'gradient' ? background.colors : null,
            image: background.type === 'image' ? this.loadedImages.get(background.path) : null,
            path: background.type === 'image' ? background.path : null
        };
    }

    getAvailableBackgrounds() {
        return Object.keys(this.backgrounds);
    }

    // Get mood-based background
    getMoodBackground(mood) {
        return this.moodBackgrounds[mood] || 'default';
    }

    // Check if currently transitioning
    isCurrentlyTransitioning() {
        return this.isTransitioning;
    }

    // Get background statistics
    getBackgroundStats() {
        return {
            currentBackground: this.currentBackground,
            isTransitioning: this.isTransitioning,
            availableBackgrounds: Object.keys(this.backgrounds).length,
            moodBackgrounds: Object.keys(this.moodBackgrounds).length,
            imageBackgrounds: this.getImageBackgroundCount(),
            colorBackgrounds: this.getColorBackgroundCount()
        };
    }

    // 🖼️ PRELOAD IMAGE BACKGROUNDS
    async preloadImageBackgrounds() {
        const imageBackgrounds = Object.entries(this.backgrounds)
            .filter(([key, bg]) => bg.type === 'image')
            .map(([key, bg]) => bg.path);
        
        console.log('🖼️ Preloading image backgrounds:', imageBackgrounds);
        
        for (const imagePath of imageBackgrounds) {
            try {
                await this.loadImage(imagePath);
                console.log('✅ Loaded image:', imagePath);
            } catch (error) {
                console.error('❌ Failed to load image:', imagePath, error);
            }
        }
    }

    // 🖼️ LOAD SINGLE IMAGE
    async loadImage(imagePath) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            
            img.onload = () => {
                console.log('✅ Image loaded successfully:', imagePath, 'Size:', img.width, 'x', img.height);
                this.loadedImages.set(imagePath, img);
                resolve(img);
            };
            
            img.onerror = () => {
                console.error('❌ Failed to load image:', imagePath);
                console.error('🔍 Check if file exists at:', imagePath);
                reject(new Error(`Failed to load image: ${imagePath}`));
            };
            
            console.log('🔄 Loading image:', imagePath);
            img.src = imagePath;
        });
    }

    // 🖼️ ADD NEW IMAGE BACKGROUND
    async addImageBackground(key, imagePath, name) {
        this.backgrounds[key] = {
            type: 'image',
            path: imagePath,
            name: name
        };
        
        // Load the image (handle both file paths and data URLs)
        try {
            await this.loadImage(imagePath);
            console.log('✅ Added and loaded new image background:', key);
        } catch (error) {
            console.error('❌ Failed to add image background:', key, error);
        }
    }

    // 🖼️ ADD NEW COLOR BACKGROUND
    addColorBackground(key, color, name) {
        this.backgrounds[key] = {
            type: 'color',
            color: color,
            name: name
        };
        console.log('✅ Added new color background:', key);
    }

    // 🖼️ GET IMAGE BACKGROUND COUNT
    getImageBackgroundCount() {
        return Object.values(this.backgrounds).filter(bg => bg.type === 'image').length;
    }

    // 🖼️ GET COLOR BACKGROUND COUNT
    getColorBackgroundCount() {
        return Object.values(this.backgrounds).filter(bg => bg.type === 'color').length;
    }

    // 🖼️ GET ALL IMAGE BACKGROUNDS
    getImageBackgrounds() {
        return Object.entries(this.backgrounds)
            .filter(([key, bg]) => bg.type === 'image')
            .map(([key, bg]) => ({ key, ...bg }));
    }

    // 🖼️ GET ALL COLOR BACKGROUNDS
    getColorBackgrounds() {
        return Object.entries(this.backgrounds)
            .filter(([key, bg]) => bg.type === 'color')
            .map(([key, bg]) => ({ key, ...bg }));
    }

    // 🕐 START AUTOMATIC BACKGROUND CHANGES
    startAutoBackgroundChanges() {
        if (this.autoChangeTimer) {
            clearInterval(this.autoChangeTimer);
        }
        
        this.autoChangeTimer = setInterval(() => {
            this.autoChangeBackground();
        }, this.autoChangeInterval);
        
        console.log('🕐 Started automatic background changes every', this.autoChangeInterval / 1000, 'seconds');
    }

    // 🕐 STOP AUTOMATIC BACKGROUND CHANGES
    stopAutoBackgroundChanges() {
        if (this.autoChangeTimer) {
            clearInterval(this.autoChangeTimer);
            this.autoChangeTimer = null;
            console.log('🕐 Stopped automatic background changes');
        }
    }

    // 🕐 AUTOMATIC BACKGROUND CHANGE
    autoChangeBackground() {
        const currentTime = Date.now();
        
        // Don't change if we're already transitioning
        if (this.isTransitioning) {
            return;
        }
        
        // Don't change too frequently
        if (currentTime - this.lastAutoChange < 30000) { // Minimum 30 seconds between changes
            return;
        }
        
        // Get all available backgrounds
        const availableBackgrounds = Object.keys(this.backgrounds);
        if (availableBackgrounds.length <= 1) {
            return;
        }
        
        // Pick a random background (different from current)
        let newBackground;
        do {
            newBackground = availableBackgrounds[Math.floor(Math.random() * availableBackgrounds.length)];
        } while (newBackground === this.currentBackground && availableBackgrounds.length > 1);
        
        this.lastAutoChange = currentTime;
        
        // Start transition
        this.setBackground(newBackground, 2000); // 2 second transition
    }

    // 🕐 SET AUTO CHANGE INTERVAL
    setAutoChangeInterval(seconds) {
        this.autoChangeInterval = seconds * 1000;
        this.stopAutoBackgroundChanges();
        this.startAutoBackgroundChanges();
        console.log('🕐 Auto change interval set to', seconds, 'seconds');
    }

    // 🕐 GET AUTO CHANGE STATUS
    getAutoChangeStatus() {
        return {
            isActive: this.autoChangeTimer !== null,
            interval: this.autoChangeInterval / 1000,
            lastChange: this.lastAutoChange,
            timeSinceLastChange: Date.now() - this.lastAutoChange
        };
    }
} 