// Shift Mechanic - Reality switching
class Shift {
    constructor() {
        this.isActive = false;
        this.transitionTime = 0;
        this.transitionDuration = 30; // frames
        this.shiftHistory = {};
    }

    toggle(room) {
        this.isActive = !this.isActive;
        this.transitionTime = 0;
        
        if (!this.shiftHistory[room]) {
            this.shiftHistory[room] = 0;
        }
        this.shiftHistory[room]++;
    }

    update() {
        if (this.transitionTime < this.transitionDuration) {
            this.transitionTime++;
        }
    }

    getTransitionAlpha() {
        return this.transitionTime / this.transitionDuration;
    }

    hasShiftOccurred(room) {
        return this.shiftHistory[room] > 0;
    }

    getShiftCount(room) {
        return this.shiftHistory[room] || 0;
    }

    // SHIFT affects environment, NPC behavior, dialogue, puzzles, and secrets
    applyShiftEffects(world, player, room) {
        if (this.isActive) {
            // The world shows a corrupted/alternate version
            this.applyShiftedEnvironment(world, room);
            this.applyShiftedNpcBehavior(world, player, room);
            this.revealSecrets(world, room);
        }
    }

    applyShiftedEnvironment(world, room) {
        // Colors shift to darker, more unsettling tones
        // Some objects disappear, others appear
        // Lighting changes
    }

    applyShiftedNpcBehavior(world, player, room) {
        // NPCs act differently when SHIFT is active
        // They may ignore the player
        // They may say disturbing things
        // Some NPCs may disappear entirely
    }

    revealSecrets(world, room) {
        // Hidden paths, objects, and information become visible
        // The player can discover clues about the Parasite
        // Environmental storytelling through SHIFT contrasts
    }
}
