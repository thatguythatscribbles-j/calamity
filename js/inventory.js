// Inventory System
class Inventory {
    constructor(maxSlots = 20) {
        this.items = [];
        this.maxSlots = maxSlots;
        this.selectedItem = null;
        this.inventoryOpen = false;
    }

    addItem(item) {
        if (this.items.length < this.maxSlots) {
            this.items.push(item);
            return true;
        }
        return false; // Inventory full
    }

    removeItem(itemIndex) {
        if (itemIndex >= 0 && itemIndex < this.items.length) {
            this.items.splice(itemIndex, 1);
            return true;
        }
        return false;
    }

    getItem(itemIndex) {
        return this.items[itemIndex] || null;
    }

    hasItem(itemName) {
        return this.items.some(item => item.name === itemName);
    }

    getItemCount(itemName) {
        return this.items.filter(item => item.name === itemName).length;
    }

    selectItem(itemIndex) {
        if (itemIndex >= 0 && itemIndex < this.items.length) {
            this.selectedItem = this.items[itemIndex];
            return true;
        }
        return false;
    }

    useItem(item) {
        // Items can be used for various purposes:
        // - Clues about the Parasite
        // - Keys to unlock areas
        // - Quest items
        // - Evidence for puzzles
        
        if (item.type === 'key') {
            return { action: 'unlock', target: item.unlocks };
        } else if (item.type === 'clue') {
            return { action: 'examine', content: item.description };
        } else if (item.type === 'quest') {
            return { action: 'progress', quest: item.questId };
        }

        return null;
    }

    discardItem(itemIndex) {
        return this.removeItem(itemIndex);
    }

    toggleInventoryUI() {
        this.inventoryOpen = !this.inventoryOpen;
        return this.inventoryOpen;
    }

    getInventoryDisplay() {
        return {
            items: this.items,
            maxSlots: this.maxSlots,
            usedSlots: this.items.length,
            selectedItem: this.selectedItem
        };
    }

    isFull() {
        return this.items.length >= this.maxSlots;
    }

    isEmpty() {
        return this.items.length === 0;
    }

    clear() {
        this.items = [];
        this.selectedItem = null;
    }
}

// Item definitions
class Item {
    constructor(name, type, description) {
        this.name = name;
        this.type = type; // 'key', 'clue', 'quest', 'consumable'
        this.description = description;
        this.id = Math.random().toString(36).substr(2, 9);
    }
}

// Special items for the game
const ITEMS = {
    RUSTY_KEY: new Item('Rusty Key', 'key', 'An old, corroded key. It might unlock something.'),
    JOURNAL_ENTRY: new Item('Journal Entry', 'clue', 'A cryptic entry from an unknown author. It mentions "the Parasite."'),
    PHOTO: new Item('Faded Photo', 'clue', 'A photograph of someone you don\'t recognize. The face is obscured.'),
    LETTER: new Item('Torn Letter', 'clue', 'A partially destroyed letter. Most of it is illegible.'),
    AMULET: new Item('Strange Amulet', 'quest', 'A mysterious amulet. It seems to resonate with an unknown energy.'),
    STONE_TABLET: new Item('Stone Tablet', 'clue', 'Ancient markings cover its surface. They might mean something.')
};
