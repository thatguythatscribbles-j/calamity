// UI and HUD System
class HUD {
    constructor() {
        this.elements = {};
        this.isVisible = true;
    }

    register(id, element) {
        this.elements[id] = element;
    }

    updateHealth(health, maxHealth) {
        const healthEl = this.elements.healthBar;
        if (!healthEl) return;

        const percent = Math.max(0, Math.min(100, (health / maxHealth) * 100));
        healthEl.style.width = `${percent}%`;
        healthEl.textContent = `${health}/${maxHealth}`;
    }

    updateInventory(inventory) {
        const inventoryEl = this.elements.inventoryList;
        if (!inventoryEl) return;

        inventoryEl.innerHTML = '';

        if (inventory.items.length === 0) {
            const empty = document.createElement('li');
            empty.textContent = 'Inventory empty';
            inventoryEl.appendChild(empty);
            return;
        }

        inventory.items.forEach((item, index) => {
            const li = document.createElement('li');
            li.textContent = `${index + 1}. ${item.name}`;
            li.dataset.index = index;
            inventoryEl.appendChild(li);
        });
    }

    updateQuestLog(quests) {
        const questEl = this.elements.questLog;
        if (!questEl) return;

        questEl.innerHTML = '';

        if (!quests || quests.length === 0) {
            const item = document.createElement('li');
            item.textContent = 'No active quests';
            questEl.appendChild(item);
            return;
        }

        quests.forEach(quest => {
            const item = document.createElement('li');
            item.textContent = `${quest.title} (${Math.round(quest.progress)}%)`;
            questEl.appendChild(item);
        });
    }

    updateDialogue(text) {
        const dialogueEl = this.elements.dialogueBox;
        if (!dialogueEl) return;
        dialogueEl.textContent = text;
    }

    updateShiftState(active, severity = 0) {
        const shiftEl = this.elements.shiftIndicator;
        if (!shiftEl) return;

        shiftEl.textContent = active ? 'SHIFT ACTIVE' : 'NORMAL';
        shiftEl.classList.toggle('active', active);
        shiftEl.style.filter = active ? `blur(${severity}px)` : 'none';
    }

    setVisible(visible) {
        this.isVisible = visible;
        Object.values(this.elements).forEach(el => {
            if (el) el.style.display = visible ? 'block' : 'none';
        });
    }
}

class NotificationManager {
    constructor() {
        this.container = null;
    }

    setContainer(container) {
        this.container = container;
    }

    show(message, type = 'info', duration = 2500) {
        if (!this.container) return;

        const note = document.createElement('div');
        note.className = `notification ${type}`;
        note.textContent = message;

        this.container.appendChild(note);

        setTimeout(() => {
            note.classList.add('fade-out');
            setTimeout(() => note.remove(), 500);
        }, duration);
    }
}

class MenuManager {
    constructor() {
        this.menus = {};
    }

    register(id, menuElement) {
        this.menus[id] = menuElement;
    }

    open(id) {
        Object.values(this.menus).forEach(menu => {
            if (menu) menu.style.display = 'none';
        });

        const target = this.menus[id];
        if (target) target.style.display = 'block';
    }

    close(id) {
        const target = this.menus[id];
        if (target) target.style.display = 'none';
    }

    closeAll() {
        Object.values(this.menus).forEach(menu => {
            if (menu) menu.style.display = 'none';
        });
    }
}

class ControlHints {
    constructor() {
        this.hints = {};
    }

    register(id, text) {
        this.hints[id] = text;
    }

    render(targetElement) {
        if (!targetElement) return;
        targetElement.innerHTML = '';

        Object.entries(this.hints).forEach(([id, text]) => {
            const item = document.createElement('li');
            item.textContent = `${id}: ${text}`;
            targetElement.appendChild(item);
        });
    }
}

const UI = {
    hud: new HUD(),
    notifications: new NotificationManager(),
    menus: new MenuManager(),
    hints: new ControlHints()
};

// Default UI registration helper
function setupDefaultHUD() {
    UI.hud.register('healthBar', document.getElementById('health-bar'));
    UI.hud.register('inventoryList', document.getElementById('inventory-list'));
    UI.hud.register('questLog', document.getElementById('quest-log'));
    UI.hud.register('dialogueBox', document.getElementById('dialogue-box'));
    UI.hud.register('shiftIndicator', document.getElementById('shift-indicator'));

    const notificationContainer = document.getElementById('notifications');
    if (notificationContainer) {
        UI.notifications.setContainer(notificationContainer);
    }

    const inventoryMenu = document.getElementById('inventory-menu');
    const questMenu = document.getElementById('quest-menu');
    const pauseMenu = document.getElementById('pause-menu');

    if (inventoryMenu) UI.menus.register('inventory', inventoryMenu);
    if (questMenu) UI.menus.register('quests', questMenu);
    if (pauseMenu) UI.menus.register('pause', pauseMenu);

    const controls = document.getElementById('controls-hints');
    if (controls) {
        UI.hints.register('E', 'Interact');
        UI.hints.register('I', 'Inventory');
        UI.hints.register('Q', 'Quest Log');
        UI.hints.register('Shift', 'Toggle Shift');
        UI.hints.render(controls);
    }
}
