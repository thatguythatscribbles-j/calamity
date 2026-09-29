// NPC and Dialogue System
class NPC {
    constructor(id, name, x, y, room) {
        this.id = id;
        this.name = name;
        this.x = x;
        this.y = y;
        this.room = room;
        this.dialogue = {};
        this.conversationCount = 0;
        this.lastTalkedTo = null;
        this.memory = {}; // Remembers player actions
        this.questsGiven = [];
        this.isSuspicious = false; // Changed by Shift reveals
    }

    addDialogue(key, text) {
        this.dialogue[key] = text;
    }

    addDialogueTree(key, tree) {
        this.dialogue[key] = tree;
    }

    talk(shiftActive = false) {
        this.conversationCount++;
        this.lastTalkedTo = Date.now();

        // Determine which dialogue to show based on state
        let dialogueKey = 'initial';
        
        if (this.conversationCount > 1) {
            dialogueKey = 'repeat';
        }

        if (shiftActive && this.dialogue['shifted']) {
            dialogueKey = 'shifted';
        }

        return this.dialogue[dialogueKey] || this.dialogue['initial'] || 'The NPC stares at you silently.';
    }

    rememberAction(action, details) {
        this.memory[action] = details;
    }

    giveQuest(questId) {
        if (!this.questsGiven.includes(questId)) {
            this.questsGiven.push(questId);
            return true;
        }
        return false;
    }

    hasGivenQuest(questId) {
        return this.questsGiven.includes(questId);
    }

    getDialogue(key) {
        return this.dialogue[key] || null;
    }

    updateSuspicion(revealed) {
        this.isSuspicious = revealed;
    }

    getStatus() {
        return {
            id: this.id,
            name: this.name,
            conversationCount: this.conversationCount,
            questsGiven: this.questsGiven,
            isSuspicious: this.isSuspicious,
            lastTalkedTo: this.lastTalkedTo
        };
    }
}

class DialogueTree {
    constructor(rootNodeId) {
        this.nodes = {};
        this.rootNodeId = rootNodeId;
        this.currentNodeId = rootNodeId;
    }

    addNode(id, text, choices = []) {
        this.nodes[id] = {
            id: id,
            text: text,
            choices: choices // Array of { text, nextNodeId, condition }
        };
    }

    getNode(id) {
        return this.nodes[id] || null;
    }

    getCurrentNode() {
        return this.nodes[this.currentNodeId] || null;
    }

    advance(choiceIndex) {
        const currentNode = this.getCurrentNode();
        if (currentNode && currentNode.choices[choiceIndex]) {
            const choice = currentNode.choices[choiceIndex];
            this.currentNodeId = choice.nextNodeId;
            return this.getCurrentNode();
        }
        return null;
    }

    reset() {
        this.currentNodeId = this.rootNodeId;
    }
}

class DialogueManager {
    constructor() {
        this.npcs = {};
        this.currentDialogue = null;
        this.dialogueTrees = {};
    }

    registerNPC(npc) {
        this.npcs[npc.id] = npc;
    }

    getNPC(npcId) {
        return this.npcs[npcId] || null;
    }

    talkToNPC(npcId, shiftActive = false) {
        const npc = this.getNPC(npcId);
        if (!npc) return null;

        return {
            npc: npc.name,
            dialogue: npc.talk(shiftActive),
            conversationCount: npc.conversationCount,
            choices: this.getDialogueChoices(npcId)
        };
    }

    getDialogueChoices(npcId) {
        // Placeholder for dialogue choice system
        return [];
    }

    rememberPlayerAction(npcId, action, details) {
        const npc = this.getNPC(npcId);
        if (npc) {
            npc.rememberAction(action, details);
        }
    }

    giveQuestToNPC(npcId, questId) {
        const npc = this.getNPC(npcId);
        if (npc) {
            return npc.giveQuest(questId);
        }
        return false;
    }

    createDialogueTree(treeId, rootNodeId) {
        const tree = new DialogueTree(rootNodeId);
        this.dialogueTrees[treeId] = tree;
        return tree;
    }

    getDialogueTree(treeId) {
        return this.dialogueTrees[treeId] || null;
    }

    getAllNPCStatus() {
        return Object.values(this.npcs).map(npc => npc.getStatus());
    }
}

// Pre-defined NPCs for the game
const NPCS = {
    ELDER: {
        id: 'elder',
        name: 'The Elder',
        dialogue: {
            initial: 'Welcome, traveler. I sense you\'re looking for answers.',
            repeat: 'Have you discovered anything new?',
            shifted: 'You... you can see it too, can\'t you? The corruption.'
        }
    },
    MERCHANT: {
        id: 'merchant',
        name: 'The Merchant',
        dialogue: {
            initial: 'Looking to trade? I have items... if the price is right.',
            repeat: 'Back for more?',
            shifted: 'The shadows are getting worse. I can feel it watching...'
        }
    },
    STRANGER: {
        id: 'stranger',
        name: 'A Stranger',
        dialogue: {
            initial: 'You shouldn\'t be here.',
            repeat: 'Still around? You\'re braver than most.',
            shifted: 'You\'re beginning to understand. Good. We need to stop it.'
        }
    },
    CHILD: {
        id: 'child',
        name: 'A Child',
        dialogue: {
            initial: 'Do you wanna play?',
            repeat: 'Play again?',
            shifted: 'The monster under my bed isn\'t really under my bed, is it?'
        }
    }
};
