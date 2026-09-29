// Dialogue System
class Dialogue {
    constructor() {
        this.currentDialogue = null;
        this.currentLineIndex = 0;
        this.isComplete = false;
        this.dialogueBox = document.getElementById('dialogue-box');
        this.currentNpc = null;
        this.playerShiftActive = false;
    }

    startDialogue(entity, player, shiftActive) {
        this.currentNpc = entity;
        this.playerShiftActive = shiftActive;
        this.currentLineIndex = 0;
        this.isComplete = false;

        if (entity instanceof NPC) {
            player.talkToNpc(entity.id);
            const dialogueSet = shiftActive ? entity.dialogue.shifted : entity.dialogue.normal;
            this.currentDialogue = dialogueSet;
        } else if (entity.text) {
            // Object dialogue
            this.currentDialogue = [entity.text];
        }

        this.displayLine();
    }

    displayLine() {
        if (this.currentLineIndex < this.currentDialogue.length) {
            const line = this.currentDialogue[this.currentLineIndex];
            this.dialogueBox.innerHTML = `<p>${line}</p>`;
            this.dialogueBox.classList.add('visible');
        } else {
            this.dialogueBox.classList.remove('visible');
            this.isComplete = true;
        }
    }

    nextLine() {
        if (!this.isComplete) {
            this.currentLineIndex++;
            this.displayLine();
        }
    }

    reset() {
        this.currentDialogue = null;
        this.currentLineIndex = 0;
        this.isComplete = true;
        this.currentNpc = null;
        this.dialogueBox.classList.remove('visible');
    }

    update() {
        // Dialogue animation updates can go here
    }

    render() {
        // Dialogue is rendered via DOM elements
    }

    isDialogueComplete() {
        return this.isComplete;
    }
}

// Dialogue Node for branching conversations
class DialogueNode {
    constructor(id, text, speaker = 'Unknown') {
        this.id = id;
        this.text = text;
        this.speaker = speaker;
        this.choices = [];
        this.actions = [];
        this.conditions = [];
        this.shiftVariant = null;
    }

    addChoice(text, nextNodeId, condition = null) {
        this.choices.push({
            text: text,
            nextNodeId: nextNodeId,
            condition: condition
        });
    }

    addAction(action) {
        this.actions.push(action);
    }

    addCondition(condition) {
        this.conditions.push(condition);
    }

    setShiftVariant(shiftText) {
        this.shiftVariant = shiftText;
    }

    getText(shiftActive = false) {
        if (shiftActive && this.shiftVariant) {
            return this.shiftVariant;
        }
        return this.text;
    }

    getAvailableChoices(state = {}) {
        return this.choices.filter(choice => {
            if (!choice.condition) return true;
            return choice.condition(state);
        });
    }

    executeActions(state = {}) {
        this.actions.forEach(action => action(state));
    }
}

// Dialogue Tree for managing conversation flow
class DialogueTree {
    constructor(id, rootNodeId) {
        this.id = id;
        this.rootNodeId = rootNodeId;
        this.nodes = {};
        this.visited = [];
    }

    addNode(node) {
        this.nodes[node.id] = node;
    }

    getNode(nodeId) {
        return this.nodes[nodeId] || null;
    }

    getRootNode() {
        return this.nodes[this.rootNodeId] || null;
    }

    hasVisited(nodeId) {
        return this.visited.includes(nodeId);
    }

    markVisited(nodeId) {
        if (!this.visited.includes(nodeId)) {
            this.visited.push(nodeId);
        }
    }

    reset() {
        this.visited = [];
    }
}

// Dialogue Manager for handling conversation state
class DialogueManager {
    constructor() {
        this.dialogueTrees = {};
        this.currentDialogue = null;
        this.currentNode = null;
        this.conversationHistory = [];
        this.shiftActive = false;
    }

    registerDialogueTree(tree) {
        this.dialogueTrees[tree.id] = tree;
    }

    startDialogue(treeId, state = {}) {
        const tree = this.dialogueTrees[treeId];
        if (!tree) return false;

        this.currentDialogue = tree;
        this.currentNode = tree.getRootNode();
        this.conversationHistory = [];

        if (this.currentNode) {
            this.currentNode.executeActions(state);
            return true;
        }
        return false;
    }

    advance(choiceIndex, state = {}) {
        if (!this.currentNode) return null;

        const choices = this.currentNode.getAvailableChoices(state);
        if (choiceIndex < 0 || choiceIndex >= choices.length) return null;

        const choice = choices[choiceIndex];
        this.conversationHistory.push({
            nodeId: this.currentNode.id,
            choice: choice.text,
            timestamp: Date.now()
        });

        const nextNode = this.currentDialogue.getNode(choice.nextNodeId);
        if (!nextNode) {
            this.endDialogue();
            return null;
        }

        this.currentNode = nextNode;
        this.currentDialogue.markVisited(nextNode.id);
        this.currentNode.executeActions(state);

        return this.currentNode;
    }

    getCurrentNode() {
        return this.currentNode;
    }

    endDialogue() {
        this.currentDialogue = null;
        this.currentNode = null;
    }

    isInDialogue() {
        return this.currentDialogue !== null && this.currentNode !== null;
    }

    setShiftActive(active) {
        this.shiftActive = active;
    }

    getConversationHistory() {
        return this.conversationHistory;
    }
}

// Quest class for tracking objectives
class Quest {
    constructor(id, title, description, objectives = []) {
        this.id = id;
        this.title = title;
        this.description = description;
        this.objectives = objectives;
        this.progress = 0;
        this.completed = false;
        this.active = false;
        this.rewards = [];
        this.startedAt = null;
        this.completedAt = null;
    }

    start() {
        this.active = true;
        this.startedAt = Date.now();
    }

    complete() {
        this.completed = true;
        this.progress = 100;
        this.completedAt = Date.now();
    }

    addObjective(objective) {
        this.objectives.push(objective);
    }

    updateProgress(percent) {
        this.progress = Math.max(0, Math.min(100, percent));
    }

    addReward(reward) {
        this.rewards.push(reward);
    }

    getStatus() {
        return {
            id: this.id,
            title: this.title,
            progress: this.progress,
            completed: this.completed,
            active: this.active,
            objectives: this.objectives.length
        };
    }
}

// Quest Manager for managing all quests
class QuestManager {
    constructor() {
        this.quests = {};
        this.activeQuests = [];
        this.completedQuests = [];
        this.questListeners = [];
    }

    createQuest(id, title, description, objectives = []) {
        const quest = new Quest(id, title, description, objectives);
        this.quests[id] = quest;
        return quest;
    }

    getQuest(questId) {
        return this.quests[questId] || null;
    }

    startQuest(questId) {
        const quest = this.getQuest(questId);
        if (!quest) return false;

        quest.start();
        if (!this.activeQuests.includes(questId)) {
            this.activeQuests.push(questId);
        }

        this.notifyListeners('questStarted', quest);
        return true;
    }

    completeQuest(questId) {
        const quest = this.getQuest(questId);
        if (!quest) return false;

        quest.complete();
        this.activeQuests = this.activeQuests.filter(id => id !== questId);
        if (!this.completedQuests.includes(questId)) {
            this.completedQuests.push(questId);
        }

        this.notifyListeners('questCompleted', quest);
        return true;
    }

    updateQuestProgress(questId, progress) {
        const quest = this.getQuest(questId);
        if (!quest) return false;

        quest.updateProgress(progress);
        this.notifyListeners('questUpdated', quest);
        return true;
    }

    getActiveQuests() {
        return this.activeQuests.map(id => this.quests[id]);
    }

    getCompletedQuests() {
        return this.completedQuests.map(id => this.quests[id]);
    }

    getAllQuests() {
        return Object.values(this.quests);
    }

    addListener(callback) {
        this.questListeners.push(callback);
    }

    notifyListeners(type, quest) {
        this.questListeners.forEach(callback => callback(type, quest));
    }

    getQuestLog() {
        return {
            active: this.getActiveQuests(),
            completed: this.getCompletedQuests(),
            total: Object.keys(this.quests).length
        };
    }
}

// Predefined dialogue trees
const DIALOGUE_TREES = {
    ELDER_GREETING: {
        id: 'elder_greeting',
        create: function(dialogueManager) {
            const tree = new DialogueTree('elder_greeting', 'root');

            const root = new DialogueNode('root', 'The Elder: Greetings, traveler. I sense you carry a heavy burden.', 'The Elder');
            root.addChoice('What do you know about this place?', 'know_place');
            root.addChoice('I should be going.', 'end');
            tree.addNode(root);

            const knowPlace = new DialogueNode('know_place', 'The Elder: This land was not always so cursed. Something dark awakened...', 'The Elder');
            knowPlace.setShiftVariant('The Elder: Can you hear them? The whispers in the dark?');
            knowPlace.addChoice('What awakened it?', 'what_awakened');
            knowPlace.addChoice('How do I stop it?', 'how_stop');
            tree.addNode(knowPlace);

            const whatAwakened = new DialogueNode('what_awakened', 'The Elder: Long ago, a ritual was performed. Something ancient was disturbed.', 'The Elder');
            whatAwakened.addChoice('I will investigate.', 'end');
            tree.addNode(whatAwakened);

            const howStop = new DialogueNode('how_stop', 'The Elder: You must find the source. Only then can the darkness be sealed.', 'The Elder');
            howStop.addChoice('I understand.', 'end');
            tree.addNode(howStop);

            const end = new DialogueNode('end', 'The Elder: May fortune favor you, traveler.', 'The Elder');
            tree.addNode(end);

            dialogueManager.registerDialogueTree(tree);
            return tree;
        }
    }
};
