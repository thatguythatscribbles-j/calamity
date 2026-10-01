// UI and Menu System
class UIElement {
    constructor(id, x, y, width, height) {
        this.id = id;
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.visible = true;
        this.active = false;
        this.children = [];
    }

    contains(x, y) {
        return x >= this.x && x <= this.x + this.width &&
               y >= this.y && y <= this.y + this.height;
    }

    addChild(element) {
        this.children.push(element);
    }

    removeChild(element) {
        this.children = this.children.filter(child => child !== element);
    }

    setVisible(visible) {
        this.visible = visible;
    }

    setActive(active) {
        this.active = active;
    }

    update() {
        // Override in subclasses
    }

    render(ctx) {
        // Override in subclasses
    }
}

class Button extends UIElement {
    constructor(id, x, y, width, height, text, callback) {
        super(id, x, y, width, height);
        this.text = text;
        this.callback = callback;
        this.hovered = false;
        this.pressed = false;
    }

    onClick() {
        if (this.callback) {
            this.callback();
        }
    }

    render(ctx) {
        if (!this.visible) return;

        ctx.fillStyle = this.pressed ? '#333' : this.hovered ? '#555' : '#444';
        ctx.fillRect(this.x, this.y, this.width, this.height);

        ctx.strokeStyle = this.active ? '#fff' : '#888';
        ctx.lineWidth = 2;
        ctx.strokeRect(this.x, this.y, this.width, this.height);

        ctx.fillStyle = '#fff';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.text, this.x + this.width / 2, this.y + this.height / 2);
    }
}

class Panel extends UIElement {
    constructor(id, x, y, width, height, title = '') {
        super(id, x, y, width, height);
        this.title = title;
        this.backgroundColor = '#1a1a1a';
        this.borderColor = '#666';
    }

    render(ctx) {
        if (!this.visible) return;

        ctx.fillStyle = this.backgroundColor;
        ctx.fillRect(this.x, this.y, this.width, this.height);

        ctx.strokeStyle = this.borderColor;
        ctx.lineWidth = 2;
        ctx.strokeRect(this.x, this.y, this.width, this.height);

        if (this.title) {
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 16px Arial';
            ctx.textAlign = 'left';
            ctx.fillText(this.title, this.x + 10, this.y + 20);
        }

        for (let child of this.children) {
            child.render(ctx);
        }
    }
}

class TextDisplay extends UIElement {
    constructor(id, x, y, width, height, text = '') {
        super(id, x, y, width, height);
        this.text = text;
        this.fontSize = 14;
        this.textColor = '#fff';
    }

    setText(text) {
        this.text = text;
    }

    render(ctx) {
        if (!this.visible) return;

        ctx.fillStyle = this.textColor;
        ctx.font = `${this.fontSize}px Arial`;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';

        const lines = this.text.split('\n');
        let y = this.y;
        for (let line of lines) {
            ctx.fillText(line, this.x, y);
            y += this.fontSize + 5;
        }
    }
}

class Menu {
    constructor(id, title) {
        this.id = id;
        this.title = title;
        this.elements = {};
        this.visible = false;
        this.active = false;
    }

    addElement(element) {
        this.elements[element.id] = element;
    }

    getElement(elementId) {
        return this.elements[elementId] || null;
    }

    show() {
        this.visible = true;
        this.active = true;
    }

    hide() {
        this.visible = false;
        this.active = false;
    }

    update() {
        for (let element of Object.values(this.elements)) {
            if (element.visible) {
                element.update();
            }
        }
    }

    render(ctx) {
        if (!this.visible) return;

        for (let element of Object.values(this.elements)) {
            if (element.visible) {
                element.render(ctx);
            }
        }
    }

    handleClick(x, y) {
        for (let element of Object.values(this.elements)) {
            if (element.visible && element.contains(x, y)) {
                if (element instanceof Button) {
                    element.onClick();
                }
            }
        }
    }
}

class UIManager {
    constructor() {
        this.menus = {};
        this.currentMenu = null;
        this.hud = {
            playerHealth: null,
            playerLevel: null,
            locationName: null
        };
    }

    createMenu(id, title) {
        const menu = new Menu(id, title);
        this.menus[id] = menu;
        return menu;
    }

    openMenu(menuId) {
        if (this.currentMenu) {
            this.currentMenu.hide();
        }
        const menu = this.menus[menuId];
        if (menu) {
            menu.show();
            this.currentMenu = menu;
            return true;
        }
        return false;
    }

    closeMenu() {
        if (this.currentMenu) {
            this.currentMenu.hide();
            this.currentMenu = null;
        }
    }

    getCurrentMenu() {
        return this.currentMenu;
    }

    setHUDValue(key, value) {
        this.hud[key] = value;
    }

    update() {
        if (this.currentMenu) {
            this.currentMenu.update();
        }
    }

    render(ctx) {
        this.renderHUD(ctx);

        if (this.currentMenu) {
            this.currentMenu.render(ctx);
        }
    }

    renderHUD(ctx) {
        ctx.fillStyle = '#fff';
        ctx.font = '14px Arial';
        ctx.textAlign = 'left';

        let y = 10;
        if (this.hud.playerHealth !== null) {
            ctx.fillText(`Health: ${this.hud.playerHealth}`, 10, y);
            y += 20;
        }
        if (this.hud.playerLevel !== null) {
            ctx.fillText(`Level: ${this.hud.playerLevel}`, 10, y);
            y += 20;
        }
        if (this.hud.locationName !== null) {
            ctx.fillText(`Location: ${this.hud.locationName}`, 10, y);
        }
    }

    handleClick(x, y) {
        if (this.currentMenu) {
            this.currentMenu.handleClick(x, y);
        }
    }
}

class InventoryMenu extends Menu {
    constructor() {
        super('inventory', 'Inventory');
        this.items = [];
        this.setupUI();
    }

    setupUI() {
        const panel = new Panel('inventory_panel', 50, 50, 500, 600, 'Inventory');
        this.addElement(panel);

        const closeButton = new Button('close_btn', 500, 60, 40, 30, 'X', () => {
            window.game.ui.closeMenu();
        });
        this.addElement(closeButton);
    }

    addItem(item) {
        this.items.push(item);
    }

    removeItem(itemId) {
        this.items = this.items.filter(item => item.id !== itemId);
    }

    render(ctx) {
        super.render(ctx);

        ctx.fillStyle = '#fff';
        ctx.font = '12px Arial';
        let y = 100;
        for (let item of this.items) {
            ctx.fillText(`${item.name} x${item.quantity}`, 70, y);
            y += 25;
        }
    }
}

class QuestLogMenu extends Menu {
    constructor() {
        super('quests', 'Quest Log');
        this.quests = [];
        this.setupUI();
    }

    setupUI() {
        const panel = new Panel('quest_panel', 50, 50, 500, 600, 'Quest Log');
        this.addElement(panel);

        const closeButton = new Button('close_btn', 500, 60, 40, 30, 'X', () => {
            window.game.ui.closeMenu();
        });
        this.addElement(closeButton);
    }

    setQuests(quests) {
        this.quests = quests;
    }

    render(ctx) {
        super.render(ctx);

        ctx.fillStyle = '#fff';
        ctx.font = '12px Arial';
        let y = 100;
        for (let quest of this.quests) {
            ctx.fillStyle = quest.completed ? '#90EE90' : '#fff';
            ctx.fillText(`${quest.title} - ${quest.progress}%`, 70, y);
            y += 25;
        }
    }
}

class PauseMenu extends Menu {
    constructor() {
        super('pause', 'Paused');
        this.setupUI();
    }

    setupUI() {
        const panel = new Panel('pause_panel', 300, 200, 400, 300, 'Game Paused');
        this.addElement(panel);

        const resumeButton = new Button('resume_btn', 350, 250, 120, 40, 'Resume', () => {
            window.game.togglePause();
        });
        this.addElement(resumeButton);

        const settingsButton = new Button('settings_btn', 350, 310, 120, 40, 'Settings', () => {
            // Settings menu
        });
        this.addElement(settingsButton);

        const quitButton = new Button('quit_btn', 350, 370, 120, 40, 'Quit', () => {
            window.location.reload();
        });
        this.addElement(quitButton);
    }
}

class DialogueMenu extends Menu {
    constructor() {
        super('dialogue', 'Dialogue');
        this.dialogueText = '';
        this.speaker = '';
        this.choices = [];
        this.setupUI();
    }

    setupUI() {
        const panel = new Panel('dialogue_panel', 50, 500, 1180, 180, '');
        this.addElement(panel);
    }

    setDialogue(speaker, text, choices = []) {
        this.speaker = speaker;
        this.dialogueText = text;
        this.choices = choices;

        const panel = this.elements['dialogue_panel'];
        panel.children = [];

        let x = 70;
        for (let i = 0; i < choices.length; i++) {
            const button = new Button(`choice_${i}`, x, 620, 200, 30, choices[i].text, () => {
                if (window.game.dialogueManager) {
                    window.game.dialogueManager.advance(i);
                }
            });
            panel.addChild(button);
            x += 220;
        }
    }

    render(ctx) {
        if (!this.visible) return;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
        ctx.fillRect(50, 500, 1180, 180);

        ctx.strokeStyle = '#666';
        ctx.lineWidth = 2;
        ctx.strokeRect(50, 500, 1180, 180);

        ctx.fillStyle = '#ffff00';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(this.speaker, 70, 520);

        ctx.fillStyle = '#fff';
        ctx.font = '12px Arial';
        let y = 545;
        for (let line of this.dialogueText.split('\n')) {
            ctx.fillText(line, 70, y);
            y += 18;
        }

        for (let child of this.elements['dialogue_panel'].children) {
            child.render(ctx);
        }
    }
}

class BattleUI extends Menu {
    constructor() {
        super('battle', 'Battle');
        this.battleState = null;
        this.setupUI();
    }

    setupUI() {
        const panel = new Panel('battle_panel', 0, 0, 1280, 720, '');
        this.addElement(panel);
    }

    setBattleState(state) {
        this.battleState = state;
    }

    render(ctx) {
        if (!this.visible || !this.battleState) return;

        ctx.fillStyle = '#fff';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(this.battleState.player.name, 50, 50);
        ctx.font = '14px Arial';
        ctx.fillText(`HP: ${this.battleState.player.health}/${this.battleState.player.maxHealth}`, 50, 80);
        ctx.fillText(`Level: ${this.battleState.player.level}`, 50, 110);

        ctx.textAlign = 'right';
        ctx.font = 'bold 16px Arial';
        ctx.fillText(this.battleState.enemy.name, 1230, 50);
        ctx.font = '14px Arial';
        ctx.fillText(`HP: ${this.battleState.enemy.health}/${this.battleState.enemy.maxHealth}`, 1230, 80);
        ctx.fillText(`Level: ${this.battleState.enemy.level}`, 1230, 110);

        ctx.textAlign = 'left';
        ctx.font = '12px Arial';
        ctx.fillStyle = '#aaa';
        let y = 200;
        for (let action of this.battleState.lastActions) {
            ctx.fillText(action.message, 50, y);
            y += 25;
        }

        const buttons = [
            { text: 'Attack', x: 50, action: 'attack' },
            { text: 'Ability', x: 200, action: 'ability' },
            { text: 'Defend', x: 350, action: 'defend' },
            { text: 'Escape', x: 500, action: 'escape' }
        ];

        ctx.fillStyle = '#444';
        for (let btn of buttons) {
            ctx.fillRect(btn.x, 650, 120, 40);
            ctx.strokeStyle = '#888';
            ctx.lineWidth = 1;
            ctx.strokeRect(btn.x, 650, 120, 40);
            ctx.fillStyle = '#fff';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(btn.text, btn.x + 60, 675);
        }
    }
}

const UI = {
    UIElement,
    Button,
    Panel,
    TextDisplay,
    Menu,
    UIManager,
    InventoryMenu,
    QuestLogMenu,
    PauseMenu,
    DialogueMenu,
    BattleUI
};
