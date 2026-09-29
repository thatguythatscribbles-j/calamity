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
