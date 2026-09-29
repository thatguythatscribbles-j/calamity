// Save and Load System
class SaveData {
    constructor(slotId) {
        this.slotId = slotId;
        this.timestamp = Date.now();
        this.playerState = null;
        this.inventory = null;
        this.questProgress = null;
        this.npcState = null;
        this.shiftState = null;
        this.worldState = null;
        this.playtime = 0;
    }

    serialize() {
        return {
            slotId: this.slotId,
            timestamp: this.timestamp,
            playtime: this.playtime,
            playerState: this.playerState,
            inventory: this.inventory,
            questProgress: this.questProgress,
            npcState: this.npcState,
            shiftState: this.shiftState,
            worldState: this.worldState
        };
    }

    static deserialize(data) {
        const save = new SaveData(data.slotId);
        save.timestamp = data.timestamp;
        save.playtime = data.playtime;
        save.playerState = data.playerState;
        save.inventory = data.inventory;
        save.questProgress = data.questProgress;
        save.npcState = data.npcState;
        save.shiftState = data.shiftState;
        save.worldState = data.worldState;
        return save;
    }
}

class SaveManager {
    constructor(maxSlots = 10) {
        this.maxSlots = maxSlots;
        this.saves = {};
        this.autosaveInterval = 300000; // 5 minutes
        this.lastAutosave = null;
        this.loadSavesFromStorage();
    }

    saveGame(slotId, gameState) {
        if (slotId < 0 || slotId >= this.maxSlots) {
            return { success: false, message: 'Invalid save slot.' };
        }

        const save = new SaveData(slotId);
        
        // Capture current game state
        save.playerState = {
            x: gameState.player.x,
            y: gameState.player.y,
            room: gameState.player.room,
            health: gameState.player.health || 100
        };

        save.inventory = {
            items: gameState.inventory.items.map(item => ({
                name: item.name,
                type: item.type,
                description: item.description,
                id: item.id
            })),
            maxSlots: gameState.inventory.maxSlots
        };

        save.questProgress = {
            activeQuests: gameState.questManager.activeQuests,
            completedQuests: gameState.questManager.completedQuests,
            questStates: Object.entries(gameState.questManager.quests).reduce((acc, [id, quest]) => {
                acc[id] = {
                    completed: quest.completed,
                    progress: quest.progress,
                    objectives: quest.objectives.map(obj => ({
                        id: obj.id,
                        completed: obj.completed
                    }))
                };
                return acc;
            }, {})
        };

        save.npcState = {
            npcStates: Object.entries(gameState.dialogueManager.npcs).reduce((acc, [id, npc]) => {
                acc[id] = {
                    conversationCount: npc.conversationCount,
                    questsGiven: npc.questsGiven,
                    isSuspicious: npc.isSuspicious,
                    memory: npc.memory
                };
                return acc;
            }, {})
        };

        save.shiftState = {
            isActive: gameState.shift.isActive,
            history: gameState.shift.shiftHistory
        };

        save.worldState = {
            currentRoom: gameState.world.currentRoom,
            visitedRooms: gameState.world.visitedRooms || []
        };

        save.playtime = gameState.playtime || 0;

        this.saves[slotId] = save;
        this.persistToStorage();

        return { success: true, message: `Game saved to slot ${slotId}.`, save: save };
    }

    loadGame(slotId) {
        if (slotId < 0 || slotId >= this.maxSlots) {
            return { success: false, message: 'Invalid save slot.' };
        }

        const save = this.saves[slotId];
        if (!save) {
            return { success: false, message: `No save data in slot ${slotId}.` };
        }

        return { success: true, message: `Loaded game from slot ${slotId}.`, save: save };
    }

    deleteSave(slotId) {
        if (slotId < 0 || slotId >= this.maxSlots) {
            return { success: false, message: 'Invalid save slot.' };
        }

        delete this.saves[slotId];
        this.persistToStorage();

        return { success: true, message: `Save slot ${slotId} deleted.` };
    }

    autosave(gameState) {
        const now = Date.now();
        if (!this.lastAutosave || now - this.lastAutosave > this.autosaveInterval) {
            this.saveGame(0, gameState); // Autosave to slot 0
            this.lastAutosave = now;
            return true;
        }
        return false;
    }

    getSavesList() {
        const list = [];
        for (let i = 0; i < this.maxSlots; i++) {
            if (this.saves[i]) {
                const save = this.saves[i];
                list.push({
                    slotId: i,
                    timestamp: save.timestamp,
                    playtime: save.playtime,
                    playerRoom: save.playerState?.room,
                    questsCompleted: save.questProgress?.completedQuests.length || 0
                });
            } else {
                list.push({
                    slotId: i,
                    empty: true
                });
            }
        }
        return list;
    }

    persistToStorage() {
        try {
            const serialized = Object.entries(this.saves).reduce((acc, [id, save]) => {
                acc[id] = save.serialize();
                return acc;
            }, {});
            localStorage.setItem('calamity_saves', JSON.stringify(serialized));
        } catch (error) {
            console.error('Failed to save to localStorage:', error);
        }
    }

    loadSavesFromStorage() {
        try {
            const data = localStorage.getItem('calamity_saves');
            if (data) {
                const parsed = JSON.parse(data);
                Object.entries(parsed).forEach(([id, saveData]) => {
                    this.saves[id] = SaveData.deserialize(saveData);
                });
            }
        } catch (error) {
            console.error('Failed to load from localStorage:', error);
        }
    }

    clearAllSaves() {
        this.saves = {};
        localStorage.removeItem('calamity_saves');
    }
}

// Quick save/load helpers
class QuickSave {
    static save(gameState) {
        const saveManager = new SaveManager();
        return saveManager.saveGame(9, gameState); // Use last slot for quick save
    }

    static load() {
        const saveManager = new SaveManager();
        return saveManager.loadGame(9);
    }
}
