export class Personality {
    constructor(config) {
        this.config = config;
        this.name = config.name;
        this.description = config.description;
        this.backgroundStory = config.backgroundStory || {};
        this.generalBehavior = config.generalBehavior || {};
        this.baseTraits = config.baseTraits;
        this.customTraits = config.customTraits || {};
        this.emotions = config.emotions;
        this.speechBehavior = config.speechBehavior;
        this.thoughtBehavior = config.thoughtBehavior;
        this.relationshipSettings = config.relationshipSettings || {};
    }

    // Get a specific trait value (checks both base and custom traits)
    getTrait(traitName) {
        if (this.baseTraits[traitName] !== undefined) {
            return this.baseTraits[traitName];
        }
        if (this.customTraits[traitName] !== undefined) {
            return this.customTraits[traitName];
        }
        return 0.5; // Default value
    }

    // Get all traits (base + custom)
    getAllTraits() {
        return {
            ...this.baseTraits,
            ...this.customTraits
        };
    }

    // Get emotion configuration
    getEmotion(emotionName) {
        return this.emotions[emotionName] || null;
    }

    // Check if personality has a specific trait above threshold
    hasTrait(traitName, threshold = 0.5) {
        return this.getTrait(traitName) > threshold;
    }

    // Get speech behavior setting
    getSpeechSetting(settingName) {
        return this.speechBehavior[settingName] || null;
    }

    // Get thought behavior setting
    getThoughtSetting(settingName) {
        return this.thoughtBehavior[settingName] || null;
    }

    // Get relationship setting
    getRelationshipSetting(settingName) {
        return this.relationshipSettings[settingName] || null;
    }

    // Get background story
    getBackgroundStory() {
        return this.backgroundStory;
    }

    // Get general behavior
    getGeneralBehavior() {
        return this.generalBehavior;
    }

    // Determine if AI should respond based on talkativeness
    shouldRespond() {
        const talkativeness = this.getTrait('talkativeness');
        return Math.random() < talkativeness;
    }

    // Determine response style based on personality
    getResponseStyle() {
        const traits = this.getAllTraits();
        
        return {
            formal: traits.formality > 0.7,
            playful: traits.playfulness > 0.6,
            empathetic: traits.empathy > 0.7,
            optimistic: traits.optimism > 0.6,
            shy: traits.shyness > 0.5,
            intelligent: traits.intelligence > 0.8,
            creative: traits.creativity > 0.6,
            analytical: traits.analytical > 0.6,
            artistic: traits.artistic > 0.5,
            scientific: traits.scientific > 0.7,
            romantic: traits.romanticism > 0.5,
            spiritual: traits.spirituality > 0.5,
            competitive: traits.competitiveness > 0.5,
            perfectionist: traits.perfectionism > 0.6,
            impulsive: traits.impulsiveness > 0.5,
            introverted: traits.introversion > 0.6,
            extroverted: traits.extroversion > 0.6
        };
    }

    // Get personality summary for AI prompts
    getPersonalitySummary() {
        const traits = this.getAllTraits();
        const summary = [];
        
        // Base traits
        if (traits.optimism > 0.7) summary.push('optimistic');
        if (traits.empathy > 0.7) summary.push('empathetic');
        if (traits.playfulness > 0.7) summary.push('playful');
        if (traits.intelligence > 0.8) summary.push('intelligent');
        if (traits.shyness > 0.6) summary.push('shy');
        if (traits.sarcasm > 0.5) summary.push('sarcastic');
        
        // Custom traits
        if (traits.creativity > 0.6) summary.push('creative');
        if (traits.analytical > 0.6) summary.push('analytical');
        if (traits.artistic > 0.5) summary.push('artistic');
        if (traits.scientific > 0.7) summary.push('scientific');
        if (traits.romanticism > 0.5) summary.push('romantic');
        if (traits.spirituality > 0.5) summary.push('spiritual');
        if (traits.competitiveness > 0.5) summary.push('competitive');
        if (traits.perfectionism > 0.6) summary.push('perfectionist');
        if (traits.impulsiveness > 0.5) summary.push('impulsive');
        if (traits.introversion > 0.6) summary.push('introverted');
        if (traits.extroversion > 0.6) summary.push('extroverted');
        
        return summary.join(', ');
    }

    // Get background story for AI prompts
    getBackgroundStoryPrompt() {
        const story = this.backgroundStory;
        return `
Background Story:
- Origin: ${story.origin || 'No origin specified'}
- Personality: ${story.personality || 'No personality description'}
- Interests: ${story.interests ? story.interests.join(', ') : 'No interests specified'}
- Fears: ${story.fears ? story.fears.join(', ') : 'No fears specified'}
- Goals: ${story.goals ? story.goals.join(', ') : 'No goals specified'}
- Quirks: ${story.quirks ? story.quirks.join(', ') : 'No quirks specified'}
        `.trim();
    }

    // Get behavior style for AI prompts
    getBehaviorStylePrompt() {
        const behavior = this.generalBehavior;
        return `
Behavior Style:
- Greeting: ${behavior.greetingStyle || 'standard'}
- Farewell: ${behavior.farewellStyle || 'standard'}
- Conversation: ${behavior.conversationStyle || 'standard'}
- Response Length: ${behavior.responseLength || 'medium'}
- Formality: ${behavior.formalityLevel || 'casual'}
- Humor: ${behavior.humorStyle || 'standard'}
- Empathy: ${behavior.empathyLevel || 'medium'}
- Curiosity: ${behavior.curiosityLevel || 'medium'}
        `.trim();
    }

    // Add a custom trait
    addCustomTrait(traitName, value) {
        this.customTraits[traitName] = Math.max(0, Math.min(1, value));
        console.log(`✅ Added custom trait: ${traitName} = ${value}`);
    }

    // Remove a custom trait
    removeCustomTrait(traitName) {
        if (this.customTraits[traitName] !== undefined) {
            delete this.customTraits[traitName];
            console.log(`❌ Removed custom trait: ${traitName}`);
        }
    }

    // Update any trait (base or custom)
    updateTrait(traitName, value) {
        const normalizedValue = Math.max(0, Math.min(1, value));
        
        if (this.baseTraits[traitName] !== undefined) {
            this.baseTraits[traitName] = normalizedValue;
            console.log(`🔄 Updated base trait: ${traitName} = ${normalizedValue}`);
        } else {
            this.customTraits[traitName] = normalizedValue;
            console.log(`🔄 Updated custom trait: ${traitName} = ${normalizedValue}`);
        }
    }

    // Get all trait names
    getAllTraitNames() {
        return {
            base: Object.keys(this.baseTraits),
            custom: Object.keys(this.customTraits),
            all: [...Object.keys(this.baseTraits), ...Object.keys(this.customTraits)]
        };
    }

    // Export personality as JSON
    exportPersonality() {
        return {
            name: this.name,
            description: this.description,
            backgroundStory: this.backgroundStory,
            generalBehavior: this.generalBehavior,
            baseTraits: this.baseTraits,
            customTraits: this.customTraits,
            emotions: this.emotions,
            speechBehavior: this.speechBehavior,
            thoughtBehavior: this.thoughtBehavior,
            relationshipSettings: this.relationshipSettings,
            exportDate: new Date().toISOString()
        };
    }
} 