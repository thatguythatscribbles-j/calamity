// Quest and Puzzle System
class Quest {
    constructor(id, title, description) {
        this.id = id;
        this.title = title;
        this.description = description;
        this.objectives = [];
        this.completed = false;
        this.completedAt = null;
        this.reward = null;
        this.progress = 0;
    }

    addObjective(objective) {
        this.objectives.push(objective);
    }

    completeObjective(objectiveId) {
        const objective = this.objectives.find(obj => obj.id === objectiveId);
        if (objective) {
            objective.completed = true;
            this.updateProgress();
            return true;
        }
        return false;
    }

    updateProgress() {
        const completed = this.objectives.filter(obj => obj.completed).length;
        this.progress = (completed / this.objectives.length) * 100;
        
        if (this.progress === 100) {
            this.completed = true;
            this.completedAt = Date.now();
        }
    }

    getStatus() {
        return {
            id: this.id,
            title: this.title,
            progress: this.progress,
            completed: this.completed,
            objectives: this.objectives
        };
    }
}

class Objective {
    constructor(id, description, type = 'general') {
        this.id = id;
        this.description = description;
        this.type = type; // 'general', 'find_item', 'talk_to_npc', 'solve_puzzle', 'visit_location'
        this.completed = false;
        this.requirement = null;
    }
}

class Puzzle {
    constructor(id, title, room) {
        this.id = id;
        this.title = title;
        this.room = room;
        this.solved = false;
        this.solvedAt = null;
        this.requiredItems = [];
        this.solution = null;
        this.hint = null;
        this.reward = null;
    }

    canSolve(inventory) {
        // Check if player has all required items
        return this.requiredItems.every(itemName => 
            inventory.hasItem(itemName)
        );
    }

    solvePuzzle(solution, inventory) {
        if (!this.canSolve(inventory)) {
            return { success: false, message: 'You don\'t have the required items.' };
        }

        if (solution === this.solution) {
            this.solved = true;
            this.solvedAt = Date.now();
            return { 
                success: true, 
                message: 'Puzzle solved!',
                reward: this.reward 
            };
        } else {
            return { success: false, message: 'That\'s not the right answer.' };
        }
    }

    getHint() {
        return this.hint;
    }
}

class QuestManager {
    constructor() {
        this.quests = {};
        this.activeQuests = [];
        this.completedQuests = [];
        this.puzzles = {};
    }

    createQuest(id, title, description) {
        const quest = new Quest(id, title, description);
        this.quests[id] = quest;
        return quest;
    }

    activateQuest(questId) {
        const quest = this.quests[questId];
        if (quest && !this.activeQuests.includes(questId)) {
            this.activeQuests.push(questId);
            return true;
        }
        return false;
    }

    completeQuest(questId) {
        const quest = this.quests[questId];
        if (quest) {
            quest.completed = true;
            quest.completedAt = Date.now();
            
            const index = this.activeQuests.indexOf(questId);
            if (index > -1) {
                this.activeQuests.splice(index, 1);
            }
            this.completedQuests.push(questId);
            return true;
        }
        return false;
    }

    registerPuzzle(id, title, room) {
        const puzzle = new Puzzle(id, title, room);
        this.puzzles[id] = puzzle;
        return puzzle;
    }

    solvePuzzle(puzzleId, solution, inventory) {
        const puzzle = this.puzzles[puzzleId];
        if (!puzzle) {
            return { success: false, message: 'Puzzle not found.' };
        }
        return puzzle.solvePuzzle(solution, inventory);
    }

    getActiveQuests() {
        return this.activeQuests.map(id => this.quests[id]);
    }

    getQuestStatus(questId) {
        const quest = this.quests[questId];
        return quest ? quest.getStatus() : null;
    }

    progressQuest(questId, objectiveId) {
        const quest = this.quests[questId];
        if (quest) {
            quest.completeObjective(objectiveId);
            return true;
        }
        return false;
    }

    isPuzzleSolved(puzzleId) {
        const puzzle = this.puzzles[puzzleId];
        return puzzle ? puzzle.solved : false;
    }

    revealHint(puzzleId) {
        const puzzle = this.puzzles[puzzleId];
        return puzzle ? puzzle.getHint() : null;
    }
}

// Game Quests Definition
const QUESTS = {
    MAIN_MYSTERY: 'main_mystery',
    FIND_CLUES: 'find_clues',
    UNDERSTAND_SHIFT: 'understand_shift',
    CONFRONT_TRUTH: 'confront_truth'
};

// Game Puzzles Definition
const PUZZLES = {
    POND_MYSTERY: 'pond_mystery',
    ABANDONED_HOUSE: 'abandoned_house',
    FOREST_PASSAGE: 'forest_passage',
    FINAL_TRUTH: 'final_truth'
};
