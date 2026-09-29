// Audio and Sound Effects System
class AudioManager {
    constructor() {
        this.audioContext = null;
        this.masterVolume = 1;
        this.musicVolume = 0.7;
        this.sfxVolume = 1;
        this.ambientVolume = 0.5;
        this.currentMusic = null;
        this.currentAmbient = null;
        this.musicTracks = {};
        this.ambientTracks = {};
        this.soundEffects = {};
        this.isMuted = false;
        this.initialized = false;
    }

    initialize() {
        if (this.initialized) return true;

        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (!AudioContext) return false;

            this.audioContext = new AudioContext();
            this.initialized = true;
            return true;
        } catch (error) {
            console.warn('Audio could not be initialized:', error);
            return false;
        }
    }

    registerMusic(id, src) {
        this.musicTracks[id] = src;
    }

    registerAmbient(id, src) {
        this.ambientTracks[id] = src;
    }

    registerSoundEffect(id, src) {
        this.soundEffects[id] = src;
    }

    createAudio(src, loop = false) {
        if (!src) return null;

        const audio = new Audio(src);
        audio.loop = loop;
        audio.preload = 'auto';
        return audio;
    }

    playMusic(id, fadeDuration = 1000) {
        const src = this.musicTracks[id];
        if (!src) return false;

        const nextMusic = this.createAudio(src, true);
        if (!nextMusic) return false;

        nextMusic.volume = 0;
        nextMusic.play().catch(error => {
            console.warn('Music playback was blocked:', error);
        });

        this.fadeIn(nextMusic, this.musicVolume * this.masterVolume, fadeDuration);

        if (this.currentMusic) {
            this.fadeOut(this.currentMusic, fadeDuration);
        }

        this.currentMusic = nextMusic;
        return true;
    }

    playAmbient(id, fadeDuration = 1500) {
        const src = this.ambientTracks[id];
        if (!src) return false;

        const nextAmbient = this.createAudio(src, true);
        if (!nextAmbient) return false;

        nextAmbient.volume = 0;
        nextAmbient.play().catch(error => {
            console.warn('Ambient playback was blocked:', error);
        });

        this.fadeIn(nextAmbient, this.ambientVolume * this.masterVolume, fadeDuration);

        if (this.currentAmbient) {
            this.fadeOut(this.currentAmbient, fadeDuration);
        }

        this.currentAmbient = nextAmbient;
        return true;
    }

    playSfx(id) {
        if (this.isMuted) return false;

        const src = this.soundEffects[id];
        if (!src) return false;

        const effect = this.createAudio(src);
        if (!effect) return false;

        effect.volume = this.sfxVolume * this.masterVolume;
        effect.play().catch(error => {
            console.warn('Sound effect playback was blocked:', error);
        });
        return true;
    }

    stopMusic(fadeDuration = 1000) {
        if (this.currentMusic) {
            this.fadeOut(this.currentMusic, fadeDuration);
            this.currentMusic = null;
        }
    }

    stopAmbient(fadeDuration = 1000) {
        if (this.currentAmbient) {
            this.fadeOut(this.currentAmbient, fadeDuration);
            this.currentAmbient = null;
        }
    }

    fadeIn(audio, targetVolume, duration) {
        const start = performance.now();
        const initialVolume = audio.volume;

        const step = now => {
            const progress = Math.min((now - start) / duration, 1);
            audio.volume = initialVolume + (targetVolume - initialVolume) * progress;
            if (progress < 1 && !audio.paused) {
                requestAnimationFrame(step);
            }
        };

        requestAnimationFrame(step);
    }

    fadeOut(audio, duration) {
        const start = performance.now();
        const initialVolume = audio.volume;

        const step = now => {
            const progress = Math.min((now - start) / duration, 1);
            audio.volume = initialVolume * (1 - progress);
            if (progress < 1) {
                requestAnimationFrame(step);
            } else {
                audio.pause();
                audio.currentTime = 0;
            }
        };

        requestAnimationFrame(step);
    }

    setMasterVolume(volume) {
        this.masterVolume = Math.max(0, Math.min(1, volume));
        this.updateActiveVolumes();
    }

    setMusicVolume(volume) {
        this.musicVolume = Math.max(0, Math.min(1, volume));
        this.updateActiveVolumes();
    }

    setSfxVolume(volume) {
        this.sfxVolume = Math.max(0, Math.min(1, volume));
    }

    setAmbientVolume(volume) {
        this.ambientVolume = Math.max(0, Math.min(1, volume));
        this.updateActiveVolumes();
    }

    updateActiveVolumes() {
        if (this.currentMusic) {
            this.currentMusic.volume = this.musicVolume * this.masterVolume;
        }
        if (this.currentAmbient) {
            this.currentAmbient.volume = this.ambientVolume * this.masterVolume;
        }
    }

    toggleMute() {
        this.isMuted = !this.isMuted;
        const volume = this.isMuted ? 0 : this.masterVolume;

        if (this.currentMusic) this.currentMusic.volume = this.musicVolume * volume;
        if (this.currentAmbient) this.currentAmbient.volume = this.ambientVolume * volume;
        return this.isMuted;
    }

    handleShiftState(isShiftActive) {
        if (isShiftActive) {
            this.playMusic('shift', 1500);
            this.playAmbient('shift_ambient', 2000);
        } else {
            this.playMusic('normal', 1500);
            this.playAmbient('normal_ambient', 2000);
        }
    }

    handleInteraction(type) {
        const effects = {
            npc: 'talk',
            object: 'inspect',
            item: 'pickup',
            puzzle: 'puzzle',
            door: 'door'
        };

        if (effects[type]) {
            this.playSfx(effects[type]);
        }
    }

    handleRoomChange() {
        this.playSfx('room_change');
    }

    handlePuzzleSolved() {
        this.playSfx('puzzle_solved');
    }

    handleItemPickup() {
        this.playSfx('pickup');
    }

    stopAll() {
        this.stopMusic(500);
        this.stopAmbient(500);
    }
}

// Default audio asset registrations.
const AUDIO_ASSETS = {
    music: {
        normal: 'audio/music/normal.mp3',
        shift: 'audio/music/shift.mp3'
    },
    ambient: {
        normal_ambient: 'audio/ambient/normal.mp3',
        shift_ambient: 'audio/ambient/shift.mp3'
    },
    sfx: {
        talk: 'audio/sfx/talk.wav',
        inspect: 'audio/sfx/inspect.wav',
        pickup: 'audio/sfx/pickup.wav',
        puzzle: 'audio/sfx/puzzle.wav',
        puzzle_solved: 'audio/sfx/puzzle-solved.wav',
        door: 'audio/sfx/door.wav',
        room_change: 'audio/sfx/room-change.wav'
    }
};
